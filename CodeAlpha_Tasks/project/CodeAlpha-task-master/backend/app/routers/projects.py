from fastapi import APIRouter, Depends, HTTPException, Request
from app.dependencies import get_current_user, ensure_user_profile
from app.firebase_config import db
from app.schemas import ProjectCreate, ProjectUpdate, AddMember
from datetime import datetime
import uuid

router = APIRouter()


def _assert_member(project_data: dict, uid: str):
    if uid not in project_data.get("memberIds", []):
        raise HTTPException(status_code=403, detail="You are not a member of this project")


def _assert_owner(project_data: dict, uid: str):
    if project_data.get("ownerId") != uid:
        raise HTTPException(status_code=403, detail="Only the project owner can do this")


@router.get("")
async def get_projects(current_user: dict = Depends(get_current_user)):
    """Get all projects where current user is a member."""
    uid = current_user["uid"]
    projects = []
    for doc in (
        db.collection("projects")
        .where("memberIds", "array_contains", uid)
        .stream()
    ):
        data = doc.to_dict()
        data["id"] = doc.id

        # Count tasks per status
        task_counts = {"todo": 0, "in_progress": 0, "in_review": 0, "done": 0}
        for t in db.collection("tasks").where("projectId", "==", doc.id).stream():
            status = t.to_dict().get("status", "todo")
            task_counts[status] = task_counts.get(status, 0) + 1
        data["taskCounts"] = task_counts

        projects.append(data)

    return projects


@router.post("")
async def create_project(
    project: ProjectCreate,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    await ensure_user_profile(uid, current_user["email"], current_user["displayName"])

    project_id = str(uuid.uuid4())
    user_doc = db.collection("users").document(uid).get().to_dict() or {}

    project_data = {
        "id": project_id,
        "name": project.name,
        "description": project.description or "",
        "ownerId": uid,
        "memberIds": [uid],
        "createdAt": datetime.utcnow().isoformat(),
    }
    db.collection("projects").document(project_id).set(project_data)

    # Add owner to members subcollection
    db.collection("projects").document(project_id).collection("members").document(uid).set(
        {
            "userId": uid,
            "email": current_user["email"],
            "displayName": user_doc.get("displayName", current_user["displayName"]),
            "avatarColor": user_doc.get("avatarColor", "#7c3aed"),
            "role": "owner",
            "joinedAt": datetime.utcnow().isoformat(),
        }
    )

    return project_data


@router.get("/{project_id}")
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    doc = db.collection("projects").document(project_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Project not found")

    data = doc.to_dict()
    _assert_member(data, uid)

    # Fetch members subcollection
    members = [m.to_dict() for m in db.collection("projects").document(project_id).collection("members").stream()]
    data["members"] = members

    return data


@router.put("/{project_id}")
async def update_project(
    project_id: str,
    update: ProjectUpdate,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    doc = db.collection("projects").document(project_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Project not found")
    _assert_owner(doc.to_dict(), uid)

    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        db.collection("projects").document(project_id).update(update_data)

    return {"message": "Project updated"}


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    doc = db.collection("projects").document(project_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Project not found")
    _assert_owner(doc.to_dict(), uid)

    # Delete all tasks and comments belonging to this project
    for task_doc in db.collection("tasks").where("projectId", "==", project_id).stream():
        for comment_doc in db.collection("comments").where("taskId", "==", task_doc.id).stream():
            comment_doc.reference.delete()
        task_doc.reference.delete()

    db.collection("projects").document(project_id).delete()
    return {"message": "Project deleted"}


@router.post("/{project_id}/members")
async def add_member(
    project_id: str,
    member: AddMember,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    doc = db.collection("projects").document(project_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Project not found")

    project_data = doc.to_dict()
    _assert_member(project_data, uid)

    # Find user by email
    user_docs = list(
        db.collection("users").where("email", "==", member.email).limit(1).stream()
    )
    if not user_docs:
        raise HTTPException(status_code=404, detail="User not found. They must register first.")

    new_member_data = user_docs[0].to_dict()
    new_uid = new_member_data["uid"]

    if new_uid in project_data.get("memberIds", []):
        raise HTTPException(status_code=400, detail="User is already a member")

    # Update memberIds array
    updated_ids = project_data["memberIds"] + [new_uid]
    db.collection("projects").document(project_id).update({"memberIds": updated_ids})

    # Add to members subcollection
    db.collection("projects").document(project_id).collection("members").document(new_uid).set(
        {
            "userId": new_uid,
            "email": new_member_data["email"],
            "displayName": new_member_data.get("displayName", ""),
            "avatarColor": new_member_data.get("avatarColor", "#7c3aed"),
            "role": "member",
            "joinedAt": datetime.utcnow().isoformat(),
        }
    )

    # Create notification
    notif_id = str(uuid.uuid4())
    db.collection("notifications").document(notif_id).set(
        {
            "id": notif_id,
            "userId": new_uid,
            "type": "member_added",
            "message": f"You were added to project \"{project_data['name']}\"",
            "isRead": False,
            "relatedProjectId": project_id,
            "createdAt": datetime.utcnow().isoformat(),
        }
    )

    # WebSocket broadcast
    ws_manager = request.app.state.ws_manager
    await ws_manager.send_to_user(
        new_uid,
        {
            "type": "member_added",
            "projectId": project_id,
            "projectName": project_data["name"],
        },
    )

    return {"message": "Member added", "user": new_member_data}


@router.delete("/{project_id}/members/{user_id}")
async def remove_member(
    project_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    doc = db.collection("projects").document(project_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Project not found")

    project_data = doc.to_dict()

    if project_data.get("ownerId") != uid and uid != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to remove this member")

    if user_id == project_data.get("ownerId"):
        raise HTTPException(status_code=400, detail="Cannot remove the project owner")

    new_ids = [m for m in project_data["memberIds"] if m != user_id]
    db.collection("projects").document(project_id).update({"memberIds": new_ids})
    db.collection("projects").document(project_id).collection("members").document(user_id).delete()

    return {"message": "Member removed"}
