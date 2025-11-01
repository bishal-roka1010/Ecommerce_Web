from django.db import models
from django.contrib.auth.models import User

# ---------- League ----------
class League(models.Model):
    name = models.CharField(max_length=120)
    country = models.CharField(max_length=120, blank=True)
    def __str__(self): return self.name

# ---------- Team ----------
class Team(models.Model):
    name = models.CharField(max_length=120)
    league = models.ForeignKey(League, on_delete=models.SET_NULL, null=True, related_name='teams')
    def __str__(self): return self.name

# ---------- Category ----------
class Category(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    def __str__(self): return self.name

# ---------- Product ----------
class Product(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return self.title

# ---------- Variant ----------
SIZES = (('S','Small'), ('M','Medium'), ('L','Large'), ('XL','Extra Large'), ('XXL','Double Extra Large'))
class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    size = models.CharField(max_length=4, choices=SIZES)
    stock = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=50, unique=True)
    def __str__(self): return f"{self.product.title} - {self.size}"

# ---------- Cart (guest or user) ----------
class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=64, blank=True)  # guest via header X-Session-Id
    created_at = models.DateTimeField(auto_now_add=True)

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

# ---------- Address (JWT) ----------
class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=30)
    province = models.CharField(max_length=120)
    city = models.CharField(max_length=120)
    street = models.CharField(max_length=200)
    landmark = models.CharField(max_length=200, blank=True)
    is_default = models.BooleanField(default=False)
    def __str__(self): return f"{self.full_name} - {self.city}"

# ---------- Orders (JWT) ----------
class Order(models.Model):
    STATUS = (('PENDING','Pending'), ('PAID','Paid'), ('SHIPPED','Shipped'), ('CANCELLED','Cancelled'))
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()

# store/models.py (only the Payment class shown; keep others as-is)
from django.db import models

class Payment(models.Model):
    order = models.OneToOneField('Order', on_delete=models.CASCADE, related_name='payment')
    provider = models.CharField(max_length=20)  # 'khalti' | 'esewa'
    reference = models.CharField(max_length=120, blank=True)  # e.g., refId (eSewa) or transaction_id (Khalti)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # new: gateway metadata
    pidx = models.CharField(max_length=64, blank=True)             # Khalti payment id
    transaction_uuid = models.CharField(max_length=64, blank=True) # eSewa unique id
    meta = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.provider} payment for Order {self.order_id}"
