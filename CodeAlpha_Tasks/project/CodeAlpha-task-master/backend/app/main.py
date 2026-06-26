from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, projects, tasks, comments, notifications

app = FastAPI(title="ProjectFlow API", version="1.0.0", description="Collaborative Project Management API")

# CORS - allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── WebSocket Connection Manager ────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"[WS] User {user_id} connected. Total: {len(self.active_connections)}")

    def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)
        print(f"[WS] User {user_id} disconnected.")

    async def send_to_user(self, user_id: str, data: dict):
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(user_id)

    async def broadcast_to_users(self, user_ids: list[str], data: dict):
        for uid in user_ids:
            await self.send_to_user(uid, data)


manager = ConnectionManager()

# Make manager available to routers via app state
app.state.ws_manager = manager


# ─── Include Routers ──────────────────────────────────────────────────────────
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(tasks.router, tags=["Tasks"])
app.include_router(comments.router, tags=["Comments"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])


# ─── WebSocket Endpoint ───────────────────────────────────────────────────────
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            # Keep connection alive; client may send pings
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "ProjectFlow API is running 🚀"}
