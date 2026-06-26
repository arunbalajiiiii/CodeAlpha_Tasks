# ProjectFlow — Collaborative Project Management Tool

A full-stack Trello/Asana-like app built with **React + Vite** (frontend) and **FastAPI** (backend) using **Firebase Auth + Firestore**.

Built a collaborative tool similar to Trello or Asana. 
Users should be able to: 
● Create group projects 
● Assign tasks 
● Comment and communicate within tasks 
Full stack with auth system, project boards, task cards. 
Backend to manage users, projects, tasks, comments. 
Bonus: Add notifications and real-time updates using WebSockets.

## 🏗️ Architecture

```
├── backend/              # FastAPI + Firebase Admin SDK
│   ├── app/
│   │   ├── main.py       # Entry point + WebSocket manager
│   │   ├── firebase_config.py
│   │   ├── dependencies.py   # Token verification
│   │   ├── schemas.py
│   │   └── routers/
│   │       ├── users.py
│   │       ├── projects.py
│   │       ├── tasks.py
│   │       ├── comments.py
│   │       └── notifications.py
│   ├── serviceAccountKey.json  ← add this!
│   └── requirements.txt
│
└── frontend/             # React 18 + Vite
    └── src/
        ├── firebase.js         # Firebase client SDK
        ├── App.jsx             # Router
        ├── contexts/           # Auth + Notifications
        ├── pages/              # Login, Register, Dashboard, Board
        ├── components/         # Navbar, TaskCard, TaskModal, etc.
        └── api/client.js       # Axios + token interceptor
```

## ✨ Features

- ✅ Firebase Auth (email/password register + login)
- ✅ Cloud Firestore database
- ✅ Kanban board with drag-and-drop (`@dnd-kit`)
- ✅ Real-time task updates via Firestore `onSnapshot`
- ✅ Real-time comments (live Firestore listener)
- ✅ Task assignment to project members
- ✅ Priority levels (Low / Medium / High / Urgent)
- ✅ Due dates with overdue detection
- ✅ Notifications (bell icon + live Firestore updates)
- ✅ WebSocket connection for toast messages
- ✅ Project member management (invite by email)
- ✅ Progress bar per project
- ✅ Premium dark glassmorphism UI
