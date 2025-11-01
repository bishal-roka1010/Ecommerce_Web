from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (ProductViewSet, CategoryViewSet, CartViewSet,
                    AddressViewSet, OrderViewSet, register, LoginAndMergeTokenView)
from rest_framework_simplejwt.views import TokenRefreshView
from .views_payments import (
    khalti_initiate, khalti_callback,
    esewa_initiate, esewa_success, esewa_failure,
)

router = DefaultRouter()
router.register('products', ProductViewSet, basename='product')
router.register('categories', CategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),

    # Cart
    path('cart/', CartViewSet.as_view({'get': 'list'})),
    path('cart/add/', CartViewSet.as_view({'post': 'add'})),
    path('cart/update-qty/', CartViewSet.as_view({'post': 'update_qty'})),
    path('cart/remove/', CartViewSet.as_view({'post': 'remove'})),

    # Addresses (JWT)
    path('addresses/', AddressViewSet.as_view({'get':'list','post':'create'})),

    # Orders (JWT)
    path('orders/', OrderViewSet.as_view({'post':'create'})),
    path('orders/<int:pk>/pay/', OrderViewSet.as_view({'post':'pay'})),
    path('orders/<int:pk>/mark-paid/', OrderViewSet.as_view({'post':'mark_paid'})),

    # Auth
    path('auth/register/', register),
    path('auth/token/', LoginAndMergeTokenView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Payments
    path('payments/khalti/initiate/<int:order_id>/', khalti_initiate),
    path('payments/khalti/callback/', khalti_callback),
    path('payments/esewa/initiate/<int:order_id>/', esewa_initiate),
    path('payments/esewa/success/', esewa_success),
    path('payments/esewa/failure/', esewa_failure),
]
