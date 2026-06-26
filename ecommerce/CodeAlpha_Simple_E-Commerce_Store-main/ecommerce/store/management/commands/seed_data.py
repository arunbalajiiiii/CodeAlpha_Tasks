"""
Management command to populate the database with sample products.
Usage: python manage.py seed_data
"""
import sys
import io
from django.core.management.base import BaseCommand
from store.models import Category, Product


class Command(BaseCommand):
    help = 'Seed the database with sample categories and products'

    def handle(self, *args, **kwargs):
        # Fix Windows encoding
        if sys.stdout.encoding != 'utf-8':
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

        self.stdout.write('Seeding database...')

        # Clear existing
        Product.objects.all().delete()
        Category.objects.all().delete()

        # Categories
        electronics = Category.objects.create(name='Electronics', slug='electronics', icon='💻')
        fashion     = Category.objects.create(name='Fashion', slug='fashion', icon='👗')
        home        = Category.objects.create(name='Home & Kitchen', slug='home-kitchen', icon='🏠')
        sports      = Category.objects.create(name='Sports', slug='sports', icon='⚽')
        books       = Category.objects.create(name='Books', slug='books', icon='📚')

        products = [
            # Electronics
            dict(category=electronics, name='Wireless Noise-Cancelling Headphones', slug='wireless-headphones',
                 description='Premium over-ear headphones with active noise cancellation, 30-hour battery life, and ultra-comfortable ear cushions. Compatible with all Bluetooth devices. Deep bass, crystal-clear highs.',
                 price=2499, original_price=4999, stock=25, featured=True),
            dict(category=electronics, name='Smart 4K LED TV 43"', slug='smart-4k-tv-43',
                 description='Stunning 4K Ultra HD display with HDR10, built-in Android TV, Google Assistant, and 3 HDMI ports. Slim bezel design perfect for any living room.',
                 price=24999, original_price=35999, stock=10, featured=True),
            dict(category=electronics, name='Mechanical Gaming Keyboard RGB', slug='mechanical-gaming-keyboard',
                 description='Full-size mechanical keyboard with Cherry MX switches, per-key RGB backlighting, anti-ghosting, and durable aluminum frame. Perfect for gaming and typing.',
                 price=3499, original_price=5499, stock=40),
            dict(category=electronics, name='Portable Bluetooth Speaker', slug='bluetooth-speaker',
                 description='360° surround sound, IPX7 waterproof, 20-hour playtime. Perfect companion for outdoor adventures. Connects to two phones simultaneously.',
                 price=1799, original_price=2999, stock=50, featured=True),
            dict(category=electronics, name='USB-C Fast Charging Power Bank 20000mAh', slug='powerbank-20000',
                 description='65W PD fast charging, charges a laptop in 1 hour. Dual USB-A + USB-C ports. LED display showing remaining battery. Airline safe.',
                 price=1299, original_price=2199, stock=60),
            dict(category=electronics, name='Wireless Ergonomic Mouse', slug='wireless-ergonomic-mouse',
                 description='Silent clicks, 6-button design, 2.4GHz wireless with 18-month battery life. Contoured shape reduces wrist strain during long work sessions.',
                 price=899, original_price=1499, stock=80),

            # Fashion
            dict(category=fashion, name='Men\'s Classic Fit Oxford Shirt', slug='mens-oxford-shirt',
                 description='Premium 100% cotton Oxford weave shirt. Available in multiple colors. Perfect for casual and semi-formal occasions. Machine washable.',
                 price=799, original_price=1299, stock=100),
            dict(category=fashion, name='Women\'s High-Waist Jogger Pants', slug='womens-jogger-pants',
                 description='Super soft French terry fabric, elastic waistband with drawstring, side pockets. Perfect for lounging, gym, or casual outings.',
                 price=699, original_price=999, stock=75),
            dict(category=fashion, name='Unisex Oversized Graphic Tee', slug='oversized-graphic-tee',
                 description='100% combed cotton, drop-shoulder fit, printed with fade-resistant ink. Wash after wash the print stays vibrant. True oversized fit.',
                 price=449, original_price=699, stock=120, featured=True),
            dict(category=fashion, name='Leather Casual Sneakers', slug='leather-casual-sneakers',
                 description='Genuine leather upper with cushioned insole. Classic lace-up design that pairs with anything. Rubber sole for all-day comfort.',
                 price=1999, original_price=3499, stock=45),

            # Home & Kitchen
            dict(category=home, name='Stainless Steel 3-Layer Steamer', slug='stainless-steel-steamer',
                 description='Cook healthy meals for the whole family. Three stackable tiers, tempered glass lid, and stay-cool handles. Dishwasher safe. Perfect for vegetables, fish, and dim sum.',
                 price=1249, original_price=1899, stock=35),
            dict(category=home, name='Non-Stick Cookware Set 5-Piece', slug='nonstick-cookware-set',
                 description='PFOA-free non-stick coating, induction compatible, oven safe up to 180°C. Includes frypan, saucepan, kadhai, and lids. Ergonomic handles.',
                 price=2299, original_price=3999, stock=20, featured=True),
            dict(category=home, name='LED Desk Lamp with USB Charging', slug='led-desk-lamp',
                 description='5 brightness levels, 3 color temperatures, 360° flexible arm, built-in USB port to charge your phone. Eye-care mode reduces blue light.',
                 price=999, original_price=1599, stock=55),
            dict(category=home, name='Bamboo Storage Organizer Set', slug='bamboo-organizer-set',
                 description='Eco-friendly bamboo organizer with 6 compartments. Perfect for drawers, desk, bathroom, or kitchen. Modular design — connect multiple units.',
                 price=599, original_price=899, stock=90),

            # Sports
            dict(category=sports, name='Yoga Mat Non-Slip 6mm', slug='yoga-mat-6mm',
                 description='Extra thick 6mm cushioning for joint support. Textured non-slip surface. Includes carry strap. Perfect for yoga, pilates, stretching, and floor workouts.',
                 price=599, original_price=999, stock=70),
            dict(category=sports, name='Adjustable Dumbbell Set 5-25kg', slug='adjustable-dumbbell-set',
                 description='Replace 9 sets of dumbbells with one. Quick-adjust dial selects weight in seconds. Fits standard weight plates. Includes storage tray.',
                 price=4999, original_price=7999, stock=15, featured=True),
            dict(category=sports, name='Running Shoes Lightweight Mesh', slug='running-shoes-mesh',
                 description='Breathable knit upper, responsive foam midsole, rubber outsole with traction grooves. Zero-drop heel design promotes natural running form.',
                 price=1799, original_price=2999, stock=50),

            # Books
            dict(category=books, name='Atomic Habits — James Clear', slug='atomic-habits',
                 description='The #1 New York Times bestseller. Learn how tiny changes lead to remarkable results. A practical guide to building good habits and breaking bad ones.',
                 price=349, original_price=499, stock=200, featured=True),
            dict(category=books, name='Python Crash Course 3rd Edition', slug='python-crash-course',
                 description='A hands-on, project-based introduction to Python programming. Covers fundamentals through 3 real-world projects: a game, data visualizations, and a web app.',
                 price=499, original_price=799, stock=150),
            dict(category=books, name='The Psychology of Money', slug='psychology-of-money',
                 description='Morgan Housel shares timeless lessons on wealth, greed, and happiness. 19 short stories exploring the odd ways people think about money.',
                 price=299, original_price=399, stock=180),
        ]

        for p in products:
            Product.objects.create(**p)
            self.stdout.write(f'  + {p["name"]}')

        self.stdout.write(self.style.SUCCESS(
            f'Done! Created {Category.objects.count()} categories and {Product.objects.count()} products.'
        ))
