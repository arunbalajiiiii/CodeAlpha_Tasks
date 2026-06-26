from fastapi import APIRouter, Depends, HTTPException, Request
from app.dependencies import get_current_user
from app.firebase_config import db
from app.schemas import TaskCreate, TaskUpdate, TaskMove
from datetime import datetime
import uuid

router = APIRouter()


def _get_project_members(project_id: str) -> list[str]:
    doc = db.collection("projects").document(project_id).get()
    if not doc.exists:
        return []
    return doc.to_dict().get("memberIds", [])


def _assert_project_member(project_id: str, uid: str):
    members = _get_project_members(project_id)
    if uid not in members:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    return members


@router.get("/projects/{project_id}/tasks")
async def get_tasks(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    _assert_project_member(project_id, uid)

    tasks = []
    for doc in db.collection("tasks").where("projectId", "==", project_id).stream():
        t = doc.to_dict()
        t["id"] = doc.id
        tasks.append(t)

    tasks.sort(key=lambda x: (x.get("position", 0), x.get("createdAt", "")))
    return tasks


@router.post("/projects/{project_id}/tasks")
async def create_task(
    project_id: str,
    task: TaskCreate,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    all_members = _assert_project_member(project_id, uid)

    task_id = str(uuid.uuid4())
    task_data = {
        "id": task_id,
        "title": task.title,
        "description": task.description or "",
        "status": task.status,
        "priority": task.priority,
        "projectId": project_id,
        "assigneeId": task.assigneeId,
        "assigneeName": task.assigneeName,
        "assigneeColor": task.assigneeColor,
        "dueDate": task.dueDate,
        "position": 0,
        "createdBy": uid,
        "createdAt": datetime.utcnow().isoformat(),
    }
    db.collection("tasks").document(task_id).set(task_data)

    # Notify assignee if set and different from creator
    if task.assigneeId and task.assigneeId != uid:
        notif_id = str(uuid.uuid4())
        db.collection("notifications").document(notif_id).set(
            {
                "id": notif_id,
                "userId": task.assigneeId,
                "type": "task_assigned",
                "message": f"You were assigned to \"{task.title}\"",
                "isRead": False,
                "relatedTaskId": task_id,
                "relatedProjectId": project_id,
                "createdAt": datetime.utcnow().isoformat(),
            }
        )

    # Broadcast to all project members
    ws_manager = request.app.state.ws_manager
    await ws_manager.broadcast_to_users(
        all_members,
        {"type": "task_created", "task": task_data},
    )

    return task_data


@router.get("/tasks/{task_id}")
async def get_task(
    task_id: str,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    doc = db.collection("tasks").document(task_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")

    task_data = doc.to_dict()
    _assert_project_member(task_data["projectId"], uid)
    return task_data


@router.put("/tasks/{task_id}")
async def update_task(
    task_id: str,
    update: TaskUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    doc = db.collection("tasks").document(task_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")

    task_data = doc.to_dict()
    all_members = _assert_project_member(task_data["projectId"], uid)

    update_fields = {k: v for k, v in update.model_dump().items() if v is not None}
    update_fields["updatedAt"] = datetime.utcnow().isoformat()

    db.collection("tasks").document(task_id).update(update_fields)

    # Notify new assignee
    new_assignee = update.assigneeId
    if new_assignee and new_assignee != uid and new_assignee != task_data.get("assigneeId"):
        notif_id = str(uuid.uuid4())
        db.collection("notifications").document(notif_id).set(
            {
                "id": notif_id,
                "userId": new_assignee,
                "type": "task_assigned",
                "message": f"You were assigned to \"{task_data['title']}\"",
                "isRead": False,
                "relatedTaskId": task_id,
                "relatedProjectId": task_data["projectId"],
                "createdAt": datetime.utcnow().isoformat(),
            }
        )

    # Broadcast update
    ws_manager = request.app.state.ws_manager
    await ws_manager.broadcast_to_users(
        all_members,
        {"type": "task_updated", "taskId": task_id, "updates": update_fields},
    )

    return {"message": "Task updated", "taskId": task_id, **update_fields}


@router.put("/tasks/{task_id}/move")
async def move_task(
    task_id: str,
    move: TaskMove,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    doc = db.collection("tasks").document(task_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")

    task_data = doc.to_dict()
    all_members = _assert_project_member(task_data["projectId"], uid)

    db.collection("tasks").document(task_id).update(
        {
            "status": move.status,
            "position": move.position,
            "updatedAt": datetime.utcnow().isoformat(),
        }
    )

    # Broadcast
    ws_manager = request.app.state.ws_manager
    await ws_manager.broadcast_to_users(
        all_members,
        {"type": "task_moved", "taskId": task_id, "newStatus": move.status, "position": move.position},
    )

    return {"message": "Task moved"}


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    doc = db.collection("tasks").document(task_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")

    task_data = doc.to_dict()
    project_doc = db.collection("projects").document(task_data["projectId"]).get()
    project_data = project_doc.to_dict() if project_doc.exists else {}

    if task_data.get("createdBy") != uid and project_data.get("ownerId") != uid:
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")

    # Delete associated comments
    for comment_doc in db.collection("comments").where("taskId", "==", task_id).stream():
        comment_doc.reference.delete()

    db.collection("tasks").document(task_id).delete()

    ws_manager = request.app.state.ws_manager
    await ws_manager.broadcast_to_users(
        project_data.get("memberIds", []),
        {"type": "task_deleted", "taskId": task_id, "projectId": task_data["projectId"]},
    )

    return {"message": "Task deleted"}
