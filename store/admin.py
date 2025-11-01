from django.contrib import admin
from .models import (League, Team, Category, Product, ProductVariant,
                     Cart, CartItem, Address, Order, OrderItem, Payment)

class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title','category','team','price','is_active')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [ProductVariantInline]

admin.site.register(League)
admin.site.register(Team)
admin.site.register(Category)
admin.site.register(ProductVariant)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(Address)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Payment)
