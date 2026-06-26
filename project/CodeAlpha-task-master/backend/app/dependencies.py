from fastapi import HTTPException, Header
from firebase_admin import auth
from app.firebase_config import db
from datetime import datetime


async def get_current_user(authorization: str = Header(...)):
    """Verify Firebase ID token from Authorization header."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    token = authorization.split(" ")[1]

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
        email = decoded_token.get("email", "")
        name = decoded_token.get("name", email.split("@")[0] if email else "User")

        return {
            "uid": uid,
            "email": email,
            "displayName": name,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")


async def ensure_user_profile(uid: str, email: str, display_name: str):
    """Create user profile in Firestore if it doesn't exist."""
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    if not user_doc.exists:
        colors = ["#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777"]
        color = colors[hash(uid) % len(colors)]
        user_data = {
            "uid": uid,
            "email": email,
            "displayName": display_name,
            "avatarColor": color,
            "createdAt": datetime.utcnow().isoformat(),
        }
        user_ref.set(user_data)
        return user_data
    return user_doc.to_dict()
