from django.contrib import admin
from .models import Category, Product, Order, OrderItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'stock', 'category', 'featured']
    list_filter = ['category', 'featured']
    list_editable = ['price', 'stock', 'featured']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name', 'description']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'quantity', 'price']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'first_name', 'last_name', 'email', 'total_price', 'status', 'created_at']
    list_filter = ['status']
    list_editable = ['status']
    search_fields = ['first_name', 'last_name', 'email']
    inlines = [OrderItemInline]
    readonly_fields = ['created_at']
