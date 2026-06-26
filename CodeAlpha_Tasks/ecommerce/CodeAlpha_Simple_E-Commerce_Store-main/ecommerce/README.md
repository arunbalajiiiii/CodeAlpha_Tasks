# 🛒 ShopZone — E-Commerce Website

A full-featured e-commerce web application built with **Django** (Python) backend and **HTML/CSS/JavaScript** frontend.

---

## 🚀 Features

| Feature | Details |
|---|---|
| 🏠 Product Listings | Grid layout, search & category filter |
| 📦 Product Detail | Images, pricing, stock, related products |
| 🛒 Shopping Cart | Add/remove/update quantities (session-based) |
| 💳 Checkout | Full address + payment method selection |
| ✅ Order Processing | Order created & saved with confirmation page |
| 👤 User Auth | Register, Login, Logout with Django auth |
| 👨‍💼 Admin Panel | Manage products, categories, orders at `/admin/` |
| 📱 Responsive | Mobile-friendly design |
| 🌙 Dark Theme | Premium dark UI with gradient accents |

---

## 🛠️ Tech Stack

- **Backend**: Django 5+ (Python)
- **Database**: SQLite (no setup needed)
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6)
- **Icons**: Font Awesome 6
- **Fonts**: Google Fonts — Inter

---

## ⚙️ Setup & Run

### 1. Install Dependencies
```bash
pip install django pillow
```

### 2. Navigate to Project
```bash
cd ecommerce
```

### 3. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Seed Sample Data (20 products, 5 categories)
```bash
python manage.py seed_data
```

### 5. Create Admin User
```bash
python manage.py createsuperuser
```

### 6. Start Server
```bash
python manage.py runserver
```

### 7. Open in Browser
- 🌐 **Store**: http://127.0.0.1:8000/
- 🔧 **Admin**: http://127.0.0.1:8000/admin/

---

## 📁 Project Structure

```
ecommerce/
├── manage.py
├── ecommerce/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── store/
    ├── models.py          # Category, Product, Order, OrderItem
    ├── views.py           # All views
    ├── urls.py            # URL routing
    ├── forms.py           # Register & Checkout forms
    ├── admin.py           # Admin panel config
    ├── context_processors.py
    ├── management/
    │   └── commands/
    │       └── seed_data.py  # Sample data
    ├── templates/store/
    │   ├── base.html
    │   ├── home.html
    │   ├── product_detail.html
    │   ├── cart.html
    │   ├── checkout.html
    │   ├── order_success.html
    │   ├── login.html
    │   ├── register.html
    │   └── profile.html
    └── static/store/
        ├── css/style.css
        └── js/main.js
```

---

## 🔑 Admin Credentials (after createsuperuser)
- URL: http://127.0.0.1:8000/admin/
- Use the username/password you set during `createsuperuser`

---

## 📝 Notes
- Cart is **session-based** — works without login
- Orders are linked to users if logged in, or guest otherwise
- Product images can be uploaded via the Admin panel
- To add more products, use the Admin panel or edit `seed_data.py`

---

*Built as internship project — CodeAlpha*
