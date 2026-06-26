from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    # Store
    path('', views.home, name='home'),
    path('product/<slug:slug>/', views.product_detail, name='product_detail'),

    # Cart
    path('cart/', views.cart, name='cart'),
    path('cart/add/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('cart/remove/<int:product_id>/', views.remove_from_cart, name='remove_from_cart'),
    path('cart/update/<int:product_id>/', views.update_cart, name='update_cart'),

    # Checkout & Orders
    path('checkout/', views.checkout, name='checkout'),
    path('order/success/<int:order_id>/', views.order_success, name='order_success'),

    # Auth
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile, name='profile'),
]
