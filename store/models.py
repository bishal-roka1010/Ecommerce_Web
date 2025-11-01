# store/models.py
from django.db import models
from django.contrib.auth.models import User
from rest_framework import serializers


# ==================== CORE MODELS ====================

class League(models.Model):
    name = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name


class Team(models.Model):
    name = models.CharField(max_length=100)
    league = models.ForeignKey(League, on_delete=models.CASCADE)
    
    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    
    def __str__(self):
        return self.name


class Product(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/')
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title


class ProductVariant(models.Model):
    SIZES = [('S', 'Small'), ('M', 'Medium'), ('L', 'Large'), ('XL', 'X-Large')]
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    size = models.CharField(max_length=10, choices=SIZES)
    stock = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=50, unique=True)
    
    def __str__(self):
        return f"{self.product.title} - {self.size}"


class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Cart {self.id} ({self.user or 'Guest'})"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    
    def __str__(self):
        return f"{self.quantity} x {self.variant}"


class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    street = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='Nepal')
    is_default = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.street}, {self.city}"


class Order(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Order {self.id} - {self.user}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    
    def __str__(self):
        return f"{self.quantity} x {self.variant}"


# ==================== PAYMENT MODELS ====================

class Payment(models.Model):
    PAYMENT_METHODS = [
        ('COD', 'Cash on Delivery'),
        ('ESEWA', 'eSewa'),
        ('KHALTI', 'Khalti'),
        ('BANK', 'Bank Transfer'),
    ]
    
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    provider = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    reference = models.CharField(max_length=120, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Gateway metadata
    pidx = models.CharField(max_length=64, blank=True)
    transaction_uuid = models.CharField(max_length=64, blank=True)
    meta = models.JSONField(default=dict, blank=True)
    
    # Manual payment uploads
    payment_receipt = models.ImageField(upload_to='payment_receipts/', blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    
    # Bank transfer fields
    bank_name = models.CharField(max_length=100, blank=True)
    account_holder = models.CharField(max_length=100, blank=True)
    deposit_slip = models.ImageField(upload_to='deposit_slips/', blank=True, null=True)

    def __str__(self):
        return f"{self.get_provider_display()} payment for Order {self.order_id}"


class PaymentQRCode(models.Model):
    PAYMENT_TYPE_CHOICES = [
        ('ESEWA', 'eSewa'),
        ('BANK', 'Bank Transfer'),
    ]
    
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, unique=True)
    qr_code = models.ImageField(upload_to='qr_codes/')
    account_name = models.CharField(max_length=200)
    account_number = models.CharField(max_length=100, blank=True)
    instructions = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_payment_type_display()} QR Code"
    
    class Meta:
        verbose_name = 'Payment QR Code'
        verbose_name_plural = 'Payment QR Codes'