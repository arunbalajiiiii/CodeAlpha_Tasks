from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from .models import Product, Category, Order, OrderItem
from .forms import RegisterForm, CheckoutForm


# ─── HOME / PRODUCT LISTING ───────────────────────────────────────────────────

def home(request):
    categories = Category.objects.all()
    products = Product.objects.filter(stock__gt=0)

    category_slug = request.GET.get('category')
    search_query = request.GET.get('q', '')

    if category_slug:
        products = products.filter(category__slug=category_slug)
    if search_query:
        products = products.filter(name__icontains=search_query)

    featured = Product.objects.filter(featured=True, stock__gt=0)[:4]

    context = {
        'products': products,
        'categories': categories,
        'featured': featured,
        'current_category': category_slug,
        'search_query': search_query,
    }
    return render(request, 'store/home.html', context)


# ─── PRODUCT DETAIL ────────────────────────────────────────────────────────────

def product_detail(request, slug):
    product = get_object_or_404(Product, slug=slug)
    related = Product.objects.filter(category=product.category).exclude(id=product.id)[:4]
    return render(request, 'store/product_detail.html', {'product': product, 'related': related})


# ─── CART ──────────────────────────────────────────────────────────────────────

def cart(request):
    cart_data = request.session.get('cart', {})
    cart_items = []
    total = 0
    for product_id, item in cart_data.items():
        try:
            product = Product.objects.get(id=int(product_id))
            subtotal = product.price * item['quantity']
            total += subtotal
            cart_items.append({
                'product': product,
                'quantity': item['quantity'],
                'subtotal': subtotal,
            })
        except Product.DoesNotExist:
            pass
    return render(request, 'store/cart.html', {
        'cart_items': cart_items,
        'total': total,
        'free_remaining': max(0, 499 - int(total)),
    })


def add_to_cart(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    cart = request.session.get('cart', {})
    key = str(product_id)
    qty = int(request.POST.get('quantity', 1))

    if key in cart:
        cart[key]['quantity'] += qty
    else:
        cart[key] = {'quantity': qty, 'name': product.name}

    request.session['cart'] = cart
    request.session.modified = True
    messages.success(request, f'"{product.name}" added to cart!')
    return redirect(request.META.get('HTTP_REFERER', 'home'))


def remove_from_cart(request, product_id):
    cart = request.session.get('cart', {})
    key = str(product_id)
    if key in cart:
        del cart[key]
    request.session['cart'] = cart
    request.session.modified = True
    messages.success(request, 'Item removed from cart.')
    return redirect('cart')


def update_cart(request, product_id):
    cart = request.session.get('cart', {})
    key = str(product_id)
    qty = int(request.POST.get('quantity', 1))
    if qty > 0:
        cart[key] = {'quantity': qty}
    elif key in cart:
        del cart[key]
    request.session['cart'] = cart
    request.session.modified = True
    return redirect('cart')


# ─── CHECKOUT ──────────────────────────────────────────────────────────────────

def checkout(request):
    cart_data = request.session.get('cart', {})
    if not cart_data:
        messages.warning(request, 'Your cart is empty.')
        return redirect('cart')

    cart_items = []
    total = 0
    for product_id, item in cart_data.items():
        try:
            product = Product.objects.get(id=int(product_id))
            subtotal = product.price * item['quantity']
            total += subtotal
            cart_items.append({'product': product, 'quantity': item['quantity'], 'subtotal': subtotal})
        except Product.DoesNotExist:
            pass

    if request.method == 'POST':
        form = CheckoutForm(request.POST)
        if form.is_valid():
            order = Order.objects.create(
                user=request.user if request.user.is_authenticated else None,
                first_name=form.cleaned_data['first_name'],
                last_name=form.cleaned_data['last_name'],
                email=form.cleaned_data['email'],
                phone=form.cleaned_data['phone'],
                address=form.cleaned_data['address'],
                city=form.cleaned_data['city'],
                state=form.cleaned_data['state'],
                pincode=form.cleaned_data['pincode'],
                total_price=total,
                payment_method=form.cleaned_data['payment_method'],
            )
            for ci in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=ci['product'],
                    quantity=ci['quantity'],
                    price=ci['product'].price,
                )
            # Clear cart
            request.session['cart'] = {}
            request.session.modified = True
            return redirect('order_success', order_id=order.id)
    else:
        initial = {}
        if request.user.is_authenticated:
            initial = {
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'email': request.user.email,
            }
        form = CheckoutForm(initial=initial)

    return render(request, 'store/checkout.html', {
        'form': form,
        'cart_items': cart_items,
        'total': total,
    })


def order_success(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    return render(request, 'store/order_success.html', {'order': order})


# ─── AUTH ──────────────────────────────────────────────────────────────────────

def register_view(request):
    if request.user.is_authenticated:
        return redirect('home')
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f'Welcome, {user.first_name}! Your account has been created.')
            return redirect('home')
    else:
        form = RegisterForm()
    return render(request, 'store/register.html', {'form': form})


def login_view(request):
    if request.user.is_authenticated:
        return redirect('home')
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            messages.success(request, f'Welcome back, {user.first_name or user.username}!')
            return redirect(request.GET.get('next', 'home'))
        else:
            messages.error(request, 'Invalid username or password.')
    return render(request, 'store/login.html')


def logout_view(request):
    logout(request)
    messages.info(request, 'You have been logged out.')
    return redirect('home')


@login_required
def profile(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'store/profile.html', {'orders': orders})
