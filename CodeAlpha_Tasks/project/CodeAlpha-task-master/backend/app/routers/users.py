from fastapi import APIRouter, Depends, HTTPException, Query
from app.dependencies import get_current_user, ensure_user_profile
from app.firebase_config import db
from app.schemas import UserProfileUpdate
from datetime import datetime

router = APIRouter()


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get or create the current user's Firestore profile."""
    user_data = await ensure_user_profile(
        current_user["uid"],
        current_user["email"],
        current_user["displayName"],
    )
    return user_data


@router.put("/me")
async def update_me(
    update: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    db.collection("users").document(uid).update(update_data)
    return {"message": "Profile updated"}


@router.get("/search")
async def search_users(
    q: str = Query(..., min_length=1),
    current_user: dict = Depends(get_current_user),
):
    """Search users by email prefix (for adding members to projects)."""
    q_lower = q.lower()
    results = []

    users_ref = (
        db.collection("users")
        .where("email", ">=", q_lower)
        .where("email", "<=", q_lower + "\uf8ff")
        .limit(10)
    )

    for doc in users_ref.stream():
        data = doc.to_dict()
        if data.get("uid") != current_user["uid"]:
            results.append(
                {
                    "uid": data["uid"],
                    "email": data["email"],
                    "displayName": data.get("displayName", ""),
                    "avatarColor": data.get("avatarColor", "#7c3aed"),
                }
            )

    return results
