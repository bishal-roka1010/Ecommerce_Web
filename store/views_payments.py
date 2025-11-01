# store/views_payments.py
import base64, hmac, hashlib, uuid
import requests
from decimal import Decimal
from django.conf import settings
from django.shortcuts import get_object_or_404, redirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status as drf_status

from .models import Order, Payment

# --------------------------
# Helpers
# --------------------------
def _amount_paisa(amount_decimal: Decimal) -> int:
    # Khalti needs amount in paisa (NPR * 100)
    return int(Decimal(amount_decimal) * 100)

def _sign_esewa(total_amount: str, transaction_uuid: str, product_code: str, secret_key: str) -> str:
    # message is "total_amount,transaction_uuid,product_code" in exactly this order
    message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    digest = hmac.new(secret_key.encode('utf-8'), message.encode('utf-8'), hashlib.sha256).digest()
    return base64.b64encode(digest).decode('utf-8')

# --------------------------
# KHALTI
# --------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def khalti_initiate(request, order_id: int):
    """
    Create a Khalti payment, return redirect URL (payment_url) and pidx.
    Frontend: redirect the user to payment_url.
    """
    order = get_object_or_404(Order, pk=order_id, user=request.user)
    base = settings.KHALTI_BASE_URL.rstrip('/')
    url = f"{base}/epayment/initiate/"
    headers = {
        "Authorization": f"Key {settings.KHALTI_SECRET_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "return_url": settings.KHALTI_RETURN_URL,
        "website_url": request.build_absolute_uri('/'),
        "amount": _amount_paisa(order.total),  # in paisa
        "purchase_order_id": str(order.id),
        "purchase_order_name": "Jersey Empire Nepal Order",
        "customer_info": {
            "name": request.user.get_full_name() or request.user.username,
            "email": request.user.email or "example@mail.com",
            "phone": "9800000001",  # Optional: capture phone on checkout
        },
    }
    r = requests.post(url, json=payload, headers=headers, timeout=30)
    data = r.json()
    if r.status_code >= 400:
        return Response({"detail": "Khalti initiate failed", "provider_response": data}, status=drf_status.HTTP_400_BAD_REQUEST)

    # Save pidx on Payment row (create if needed)
    pay, _ = Payment.objects.get_or_create(order=order, defaults={
        "provider": "khalti",
        "amount": order.total,
    })
    pay.provider = "khalti"
    pay.amount = order.total
    pay.pidx = data.get("pidx", "")
    pay.meta = data
    pay.save()

    # Client should redirect to data['payment_url']
    return Response({"payment_url": data.get("payment_url"), "pidx": data.get("pidx")}, status=200)

@api_view(['GET'])
@permission_classes([AllowAny])
def khalti_callback(request):
    """
    User is redirected here by Khalti after payment screen.
    We must verify via lookup using the pidx.
    """
    pidx = request.query_params.get("pidx")
    if not pidx:
        return Response({"detail": "Missing pidx"}, status=400)

    base = settings.KHALTI_BASE_URL.rstrip('/')
    url = f"{base}/epayment/lookup/"
    headers = {"Authorization": f"Key {settings.KHALTI_SECRET_KEY}", "Content-Type": "application/json"}
    r = requests.post(url, json={"pidx": pidx}, headers=headers, timeout=30)
    data = r.json()

    # find payment by pidx
    pay = Payment.objects.filter(pidx=pidx, provider="khalti").select_related("order").first()
    if not pay:
        return Response({"detail": "Payment not found"}, status=404)

    # update
    pay.meta = data
    status_text = (data.get("status") or "").lower()
    if status_text == "completed" and Decimal(data.get("total_amount", 0)) == Decimal(_amount_paisa(pay.amount)):
        pay.is_verified = True
        pay.reference = data.get("transaction_id") or ""
        pay.save()
        # mark order PAID
        o = pay.order
        o.status = "PAID"
        o.save()
        # redirect to your frontend success page (optional)
        return redirect(settings.FRONTEND_ORIGIN)  # or return JSON
    else:
        # Not completed or amount mismatch -> leave as pending/failed
        pay.is_verified = False
        pay.save()
        return redirect(settings.FRONTEND_ORIGIN)  # or a failure page

# --------------------------
# eSEWA
# --------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def esewa_initiate(request, order_id: int):
    """
    Return a signed form payload for eSewa EPAY v2.
    Frontend: build a hidden form with these fields and POST to ESEWA_FORM_URL.
    """
    order = get_object_or_404(Order, pk=order_id, user=request.user)

    transaction_uuid = uuid.uuid4().hex  # must be unique per attempt
    total_amount = str(order.total)  # as string for signature
    product_code = settings.ESEWA_PRODUCT_CODE

    signature = _sign_esewa(
        total_amount=total_amount,
        transaction_uuid=transaction_uuid,
        product_code=product_code,
        secret_key=settings.ESEWA_SECRET_KEY,
    )

    pay, _ = Payment.objects.get_or_create(order=order, defaults={
        "provider": "esewa",
        "amount": order.total,
    })
    pay.provider = "esewa"
    pay.amount = order.total
    pay.transaction_uuid = transaction_uuid
    pay.meta = {"signature": signature}
    pay.save()

    form_fields = {
        "amount": total_amount,
        "tax_amount": "0",
        "total_amount": total_amount,
        "transaction_uuid": transaction_uuid,
        "product_code": product_code,
        "product_service_charge": "0",
        "product_delivery_charge": "0",
        "success_url": settings.ESEWA_SUCCESS_URL,
        "failure_url": settings.ESEWA_FAILURE_URL,
        "signed_field_names": "total_amount,transaction_uuid,product_code",
        "signature": signature,
    }
    return Response({"form_action": settings.ESEWA_FORM_URL, "fields": form_fields}, status=200)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def esewa_success(request):
    """
    eSewa redirects here after success (with their response).
    We will verify via Status Check API using transaction_uuid and total amount.
    """
    params = request.data if request.method == 'POST' else request.query_params
    transaction_uuid = params.get("transaction_uuid")
    total_amount = params.get("total_amount")

    # find Payment by transaction_uuid
    pay = Payment.objects.filter(transaction_uuid=transaction_uuid, provider="esewa").select_related("order").first()
    if not pay:
        return Response({"detail": "Payment not found"}, status=404)

    # server-to-server verify
    status_url = settings.ESEWA_STATUS_URL
    # GET ?product_code=...&total_amount=...&transaction_uuid=...
    verify_url = f"{status_url}?product_code={settings.ESEWA_PRODUCT_CODE}&total_amount={total_amount}&transaction_uuid={transaction_uuid}"
    r = requests.get(verify_url, timeout=30)
    data = r.json() if r.headers.get('content-type','').startswith('application/json') else {}
    pay.meta = {"status_response": data}
    status_text = (data.get("status") or "").upper()

    if status_text == "COMPLETE":
        pay.is_verified = True
        pay.reference = data.get("refId") or ""
        pay.save()
        o = pay.order
        o.status = "PAID"
        o.save()
        return redirect(settings.FRONTEND_ORIGIN)  # success page
    else:
        pay.is_verified = False
        pay.save()
        return redirect(settings.FRONTEND_ORIGIN)  # failure page

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def esewa_failure(request):
    # You can log details from query/body for audit
    return redirect(settings.FRONTEND_ORIGIN)
