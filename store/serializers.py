from rest_framework import serializers
from .models import (League, Team, Category, Product, ProductVariant,
                     Cart, CartItem, Address, Order, OrderItem, Payment)

# --- league/team/category ---
class LeagueSerializer(serializers.ModelSerializer):
    class Meta: model = League; fields = ['id','name','country']

class TeamSerializer(serializers.ModelSerializer):
    league = LeagueSerializer(read_only=True)
    class Meta: model = Team; fields = ['id','name','league']

class CategorySerializer(serializers.ModelSerializer):
    class Meta: model = Category; fields = ['id','name','slug']

# --- product ---
class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta: model = ProductVariant; fields = ['id','size','stock','sku']

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    team = TeamSerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    class Meta:
        model = Product
        fields = ['id','title','slug','description','price','image_url','category','team','variants']
    def get_image_url(self, obj):
        req = self.context.get('request')
        return req.build_absolute_uri(obj.image.url) if obj.image and req else (obj.image.url if obj.image else None)

# --- cart ---
class CartItemSerializer(serializers.ModelSerializer):
    variant_detail = ProductVariantSerializer(source='variant', read_only=True)
    product_title = serializers.CharField(source='variant.product.title', read_only=True)
    product_slug = serializers.CharField(source='variant.product.slug', read_only=True)
    product_price = serializers.DecimalField(source='variant.product.price', max_digits=10, decimal_places=2, read_only=True)
    sub_total = serializers.SerializerMethodField()
    class Meta:
        model = CartItem
        fields = ['id','variant','variant_detail','quantity','product_title','product_slug','product_price','sub_total']
    def get_sub_total(self, obj):
        return obj.quantity * obj.variant.product.price

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    cart_total = serializers.SerializerMethodField()
    class Meta:
        model = Cart
        fields = ['id','items','cart_total']
    def get_cart_total(self, obj):
        return sum(it.quantity * it.variant.product.price for it in obj.items.select_related('variant__product'))

# --- address ---
class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'
        read_only_fields = ['user']

# --- orders ---
class OrderItemSerializer(serializers.ModelSerializer):
    variant_detail = ProductVariantSerializer(source='variant', read_only=True)
    class Meta: model = OrderItem; fields = ['id','variant','variant_detail','price','quantity']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    class Meta:
        model = Order
        fields = ['id','user','address','total','status','created_at','items']
        read_only_fields = ['user','status','created_at']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta: model = Payment; fields = '__all__'
