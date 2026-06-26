from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.firebase_config import db
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter()


@router.get("")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    uid = current_user["uid"]
    notifications = []

    try:
        for doc in (
            db.collection("notifications")
            .where("userId", "==", uid)
            .order_by("createdAt", direction="DESCENDING")
            .limit(50)
            .stream()
        ):
            notifications.append(doc.to_dict())
    except Exception:
        # Fallback without ordering (composite index may not exist yet)
        for doc in db.collection("notifications").where("userId", "==", uid).limit(50).stream():
            notifications.append(doc.to_dict())
        notifications.sort(key=lambda x: x.get("createdAt", ""), reverse=True)

    return notifications


@router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    uid = current_user["uid"]
    count = 0
    for doc in (
        db.collection("notifications")
        .where("userId", "==", uid)
        .where("isRead", "==", False)
        .stream()
    ):
        count += 1
    return {"count": count}


@router.put("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    uid = current_user["uid"]
    for doc in (
        db.collection("notifications")
        .where("userId", "==", uid)
        .where("isRead", "==", False)
        .stream()
    ):
        doc.reference.update({"isRead": True})
    return {"message": "All notifications marked as read"}


@router.put("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    doc = db.collection("notifications").document(notification_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Notification not found")

    if doc.to_dict().get("userId") != uid:
        raise HTTPException(status_code=403, detail="Not authorized")

    doc.reference.update({"isRead": True})
    return {"message": "Marked as read"}
