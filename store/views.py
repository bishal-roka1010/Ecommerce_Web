from rest_framework import viewsets, filters, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db import transaction

from .models import (Product, Category, ProductVariant, Cart, CartItem,
                     Address, Order, OrderItem, Payment)
from .serializers import (ProductSerializer, CategorySerializer, CartSerializer,
                          AddressSerializer, OrderSerializer)

# --------- Products ----------
class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/products/
      ?search=manchester
      &category=club-jerseys          # slug
      &team=1                         # team id
      &league=1                       # league id
      &price_min=1000&price_max=5000
      &ordering=price| -price | created | -created | title | -title
    """
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'slug', 'team__name', 'category__name']

    def get_queryset(self):
        qs = (Product.objects
              .filter(is_active=True)
              .select_related('team', 'team__league', 'category')
              .prefetch_related('variants'))

        req = self.request
        category = req.query_params.get('category')       # slug
        team = req.query_params.get('team')               # id
        league = req.query_params.get('league')           # id
        price_min = req.query_params.get('price_min')
        price_max = req.query_params.get('price_max')
        ordering = req.query_params.get('ordering')       # price, -price, created, -created, title, -title

        if category:
            qs = qs.filter(category__slug=category)
        if team:
            qs = qs.filter(team_id=team)
        if league:
            qs = qs.filter(team__league_id=league)
        if price_min:
            qs = qs.filter(price__gte=price_min)
        if price_max:
            qs = qs.filter(price__lte=price_max)

        # safe ordering map to avoid arbitrary field orderings
        order_map = {
            'price': 'price',
            '-price': '-price',
            'created': 'created_at',
            '-created': '-created_at',
            'title': 'title',
            '-title': '-title',
        }
        if ordering in order_map:
            qs = qs.order_by(order_map[ordering])
        else:
            qs = qs.order_by('-created_at')

        return qs
    
# --------- Categories ----------
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

# --------- Cart (guest via X-Session-Id) ----------
class CartViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def _get_cart(self, request):
        # JWT users: bind to user cart
        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
            return cart
        # Guests: by session header
        session_id = request.headers.get('X-Session-Id')
        if not session_id:
            return None
        cart, _ = Cart.objects.get_or_create(session_id=session_id)
        return cart

    def list(self, request):
        cart = self._get_cart(request)
        if not cart:
            return Response({'detail':'Missing X-Session-Id header'}, status=400)
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=['post'])
    def add(self, request):
        cart = self._get_cart(request)
        if not cart:
            return Response({'detail':'Missing X-Session-Id header'}, status=400)
        variant_id = request.data.get('variant')
        qty = max(1, int(request.data.get('quantity', 1)))
        variant = get_object_or_404(ProductVariant.objects.select_related('product'), pk=variant_id)

        # stock guard
        if qty > variant.stock:
            return Response({'detail': f'Only {variant.stock} left for {variant.product.title} ({variant.size})'}, status=400)

        item, created = CartItem.objects.get_or_create(cart=cart, variant=variant)
        new_qty = item.quantity + qty if not created else qty
        if new_qty > variant.stock:
            return Response({'detail': f'Only {variant.stock} left; current in cart {item.quantity}'}, status=400)
        item.quantity = new_qty
        item.save()
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=['post'])
    def update_qty(self, request):
        cart = self._get_cart(request)
        if not cart:
            return Response({'detail':'Missing X-Session-Id header'}, status=400)
        item_id = request.data.get('item_id')
        qty = max(1, int(request.data.get('quantity', 1)))
        item = get_object_or_404(CartItem.objects.select_related('variant__product','cart'), pk=item_id, cart=cart)
        if qty > item.variant.stock:
            return Response({'detail': f'Only {item.variant.stock} left'}, status=400)
        item.quantity = qty
        item.save()
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=['post'])
    def remove(self, request):
        cart = self._get_cart(request)
        if not cart:
            return Response({'detail':'Missing X-Session-Id header'}, status=400)
        item_id = request.data.get('item_id')
        CartItem.objects.filter(pk=item_id, cart=cart).delete()
        return Response(CartSerializer(cart).data)

# --------- Address (JWT) ----------
class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# --------- Orders (JWT) ----------
class OrderViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def create(self, request):
        # Always checkout the **user** cart
        cart, _ = Cart.objects.get_or_create(user=request.user)
        if not cart.items.exists():
            return Response({'detail':'Cart empty'}, status=400)
        address_id = request.data.get('address')
        address = get_object_or_404(Address, pk=address_id, user=request.user)

        # lock variants to avoid race conditions
        variant_ids = list(cart.items.values_list('variant_id', flat=True))
        variants_qs = ProductVariant.objects.select_for_update().select_related('product').filter(id__in=variant_ids)
        variants_map = {v.id: v for v in variants_qs}

        total = 0
        for it in cart.items.select_related('variant__product'):
            v = variants_map[it.variant_id]
            if it.quantity > v.stock:
                return Response({'detail': f'Insufficient stock for {v.product.title} ({v.size}). Left: {v.stock}'}, status=400)
            total += it.quantity * v.product.price

        order = Order.objects.create(user=request.user, address=address, total=total)
        for it in cart.items.all():
            v = variants_map[it.variant_id]
            OrderItem.objects.create(order=order, variant=v, price=v.product.price, quantity=it.quantity)
            v.stock -= it.quantity
            v.save()

        cart.items.all().delete()
        return Response(OrderSerializer(order).data, status=201)

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        provider = request.data.get('provider', 'khalti')
        reference = request.data.get('reference', 'TEST')
        Payment.objects.update_or_create(order=order, defaults={
            'provider': provider, 'reference': reference, 'amount': order.total, 'is_verified': False
        })
        return Response({'ok': True, 'message': 'Payment created. Verify via webhook in production.'})

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        if not hasattr(order, 'payment'):
            return Response({'detail': 'No payment created'}, status=400)
        order.payment.is_verified = True
        order.payment.save()
        order.status = 'PAID'
        order.save()
        return Response({'ok': True})

# --------- Register (simple) ----------
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response({'detail':'username & password required'}, status=400)
    if User.objects.filter(username=username).exists():
        return Response({'detail':'username already exists'}, status=400)
    user = User.objects.create_user(username=username, password=password)
    return Response({'ok': True, 'id': user.id, 'username': user.username}, status=201)

# --------- Custom Login: returns JWT AND merges guest cart into user cart ----------
class LoginAndMergeTokenView(TokenObtainPairView):
    """
    On successful login, if request has X-Session-Id (guest cart), merge into user's cart.
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)  # get tokens first
        # if token creation failed, DRF already returned error
        try:
            username = request.data.get('username')
            user = User.objects.get(username=username)
            session_id = request.headers.get('X-Session-Id')
            if session_id:
                guest_cart = Cart.objects.filter(session_id=session_id).first()
                if guest_cart:
                    user_cart, _ = Cart.objects.get_or_create(user=user)
                    # merge: for each guest item, add to user cart with stock check
                    for it in guest_cart.items.select_related('variant__product'):
                        v = it.variant
                        existing, created = CartItem.objects.get_or_create(cart=user_cart, variant=v)
                        new_qty = existing.quantity + it.quantity
                        existing.quantity = min(new_qty, v.stock)
                        existing.save()
                    guest_cart.items.all().delete()
                    guest_cart.delete()
        except Exception:
            # don't break login if merge has issues
            pass
        return response
