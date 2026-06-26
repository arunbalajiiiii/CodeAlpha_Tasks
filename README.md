
**1)Ecommerce Application**

A Django-based e-commerce website with product browsing, session cart management, checkout, user authentication, and order processing.

**Key Features**
Product catalog with categories, search, and featured products
Product detail page with related products
Session-based shopping cart
Checkout form with address, payment method, and order creation
User register/login/logout
User profile order history
Admin panel for products, categories, orders
Responsive UI with dark theme styling

**Tech Stack**
Django backend
SQLite database
HTML/CSS/JavaScript frontend
Django auth system
Pillow likely required for image fields

**Setup**
Install dependencies:
pip install django pillow
Change directory:
cd ecommerce
Run migrations:
python manage.py makemigrations
python manage.py migrate
Seed sample data:
python manage.py seed_data
Create admin:
python manage.py createsuperuser
Run server:
python manage.py runserver

**Project Structure**
manage.py
ecommerce
settings.py
urls.py
wsgi.py
store/
models.py — Category, Product, Order, OrderItem
views.py — home, product detail, cart, checkout, auth, profile
forms.py
admin.py
context_processors.py
management/commands/seed_data.py
templates/store/
static/store/

**Notes**
Cart is stored in session
Order history is linked to authenticated users but guest checkout is supported
Product images are managed via Django admin

**2) Project Management Tool**
   
A full-stack collaborative project/task management app with:

React + Vite frontend
FastAPI backend
Firebase Authentication + Firestore
WebSocket support for live notifications

**Key Features**
User login/register via Firebase
Project boards with task management
Task comments
Notifications and real-time updates
Kanban-style board with drag-and-drop
Project member management
WebSocket endpoint for live client notifications

**Tech Stack**
Frontend: React 18, Vite, React Router, Axios, Firebase, @dnd-kit
Backend: FastAPI, Uvicorn, firebase-admin, Pydantic, WebSockets
Firebase project config in frontend/src/firebase.js

**Setup**
Backend
Install dependencies:
pip install -r backend/requirements.txt
Run backend:
uvicorn app.main:app --reload --port 8000
Frontend
Install dependencies:
cd frontend
npm install
Run frontend:
npm run dev

**Important Files**
backend/app/main.py
FastAPI app setup
CORS for React dev server
WebSocket connection manager
Router registration
backend/requirements.txt
fastapi, uvicorn, firebase-admin, pydantic, websockets, python-dotenv
frontend/package.json
React, Firebase, Axios, Vite, DND Kit
frontend/src/firebase.js
Firebase app config and auth/firestore init

**Notes**
The frontend uses Firebase client SDK and Firestore
The backend exposes /ws/{user_id} for WebSocket connections
Ensure Firebase config and backend auth integration are set up before use
