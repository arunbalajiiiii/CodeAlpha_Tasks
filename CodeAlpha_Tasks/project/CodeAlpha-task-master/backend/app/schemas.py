from pydantic import BaseModel
from typing import Optional


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    status: str = "todo"
    priority: str = "medium"
    assigneeId: Optional[str] = None
    assigneeName: Optional[str] = None
    assigneeColor: Optional[str] = None
    dueDate: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigneeId: Optional[str] = None
    assigneeName: Optional[str] = None
    assigneeColor: Optional[str] = None
    dueDate: Optional[str] = None


class TaskMove(BaseModel):
    status: str
    position: int = 0


class CommentCreate(BaseModel):
    content: str


class AddMember(BaseModel):
    email: str


class UserProfileUpdate(BaseModel):
    displayName: Optional[str] = None
    avatarColor: Optional[str] = None
