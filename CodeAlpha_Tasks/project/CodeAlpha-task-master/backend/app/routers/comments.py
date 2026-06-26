from fastapi import APIRouter, Depends, HTTPException, Request
from app.dependencies import get_current_user
from app.firebase_config import db
from app.schemas import CommentCreate
from datetime import datetime
import uuid

router = APIRouter()


@router.get("/tasks/{task_id}/comments")
async def get_comments(
    task_id: str,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    task_doc = db.collection("tasks").document(task_id).get()
    if not task_doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")

    comments = []
    for doc in (
        db.collection("comments")
        .where("taskId", "==", task_id)
        .order_by("createdAt")
        .stream()
    ):
        comments.append(doc.to_dict())

    return comments


@router.post("/tasks/{task_id}/comments")
async def add_comment(
    task_id: str,
    comment: CommentCreate,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    task_doc = db.collection("tasks").document(task_id).get()
    if not task_doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")

    task_data = task_doc.to_dict()

    # Get author profile
    user_doc = db.collection("users").document(uid).get()
    user_data = user_doc.to_dict() if user_doc.exists else {}

    comment_id = str(uuid.uuid4())
    comment_data = {
        "id": comment_id,
        "content": comment.content,
        "taskId": task_id,
        "authorId": uid,
        "authorName": user_data.get("displayName", current_user["email"].split("@")[0]),
        "authorColor": user_data.get("avatarColor", "#7c3aed"),
        "createdAt": datetime.utcnow().isoformat(),
    }
    db.collection("comments").document(comment_id).set(comment_data)

    # Notify task assignee
    assignee_id = task_data.get("assigneeId")
    if assignee_id and assignee_id != uid:
        notif_id = str(uuid.uuid4())
        db.collection("notifications").document(notif_id).set(
            {
                "id": notif_id,
                "userId": assignee_id,
                "type": "comment_added",
                "message": f"{user_data.get('displayName', 'Someone')} commented on \"{task_data['title']}\"",
                "isRead": False,
                "relatedTaskId": task_id,
                "relatedProjectId": task_data.get("projectId", ""),
                "createdAt": datetime.utcnow().isoformat(),
            }
        )

    # Also notify task creator (if different)
    creator_id = task_data.get("createdBy")
    if creator_id and creator_id != uid and creator_id != assignee_id:
        notif_id2 = str(uuid.uuid4())
        db.collection("notifications").document(notif_id2).set(
            {
                "id": notif_id2,
                "userId": creator_id,
                "type": "comment_added",
                "message": f"{user_data.get('displayName', 'Someone')} commented on \"{task_data['title']}\"",
                "isRead": False,
                "relatedTaskId": task_id,
                "relatedProjectId": task_data.get("projectId", ""),
                "createdAt": datetime.utcnow().isoformat(),
            }
        )

    # Broadcast via WebSocket
    project_id = task_data.get("projectId", "")
    project_doc = db.collection("projects").document(project_id).get()
    member_ids = project_doc.to_dict().get("memberIds", []) if project_doc.exists else []

    ws_manager = request.app.state.ws_manager
    await ws_manager.broadcast_to_users(
        member_ids,
        {"type": "comment_added", "taskId": task_id, "comment": comment_data},
    )

    return comment_data


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    doc = db.collection("comments").document(comment_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Comment not found")

    if doc.to_dict().get("authorId") != uid:
        raise HTTPException(status_code=403, detail="You can only delete your own comments")

    db.collection("comments").document(comment_id).delete()
    return {"message": "Comment deleted"}
