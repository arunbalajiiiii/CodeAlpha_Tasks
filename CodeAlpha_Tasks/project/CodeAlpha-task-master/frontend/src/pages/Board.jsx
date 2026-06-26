import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { db } from '../firebase';
import Navbar from '../components/Navbar';
import KanbanColumn from '../components/KanbanColumn';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import MemberBadge from '../components/MemberBadge';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useNotif } from '../contexts/NotifContext';

const STATUSES = [
  { id: 'todo', label: 'To Do', dot: 'var(--todo-color)' },
  { id: 'in_progress', label: 'In Progress', dot: 'var(--in-progress-color)' },
  { id: 'in_review', label: 'In Review', dot: 'var(--in-review-color)' },
  { id: 'done', label: 'Done', dot: 'var(--done-color)' },
];

export default function Board() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotif();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ── Load project info
  useEffect(() => {
    api.get(`/projects/${projectId}`)
      .then((r) => {
        setProject(r.data);
        setMembers(r.data.members || []);
      })
      .catch(() => { showToast('Could not load project', 'error'); navigate('/'); })
      .finally(() => setLoading(false));
  }, [projectId]);

  // ── Load tasks via REST (always works, no Firestore index needed)
  const loadTasks = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${projectId}/tasks`);
      setTasks(res.data);
    } catch { /* handled by project load */ }
  }, [projectId]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // ── Firestore real-time listener (enhances REST with live updates)
  useEffect(() => {
    const q = query(collection(db, 'tasks'), where('projectId', '==', projectId));
    const unsub = onSnapshot(q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        setTasks(list);
      },
      (err) => {
        // Firestore index not yet created — REST API already loaded the tasks
        console.warn('Firestore listener fallback to REST:', err.message);
      }
    );
    return unsub;
  }, [projectId]);

  const getTasksByStatus = (status) =>
    tasks.filter((t) => t.status === status).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  // ── DnD handlers
  function handleDragStart({ active }) {
    setActiveTaskId(active.id);
  }

  async function handleDragEnd({ active, over }) {
    setActiveTaskId(null);
    if (!over) return;

    const taskId = active.id;
    const newStatus = over.data?.current?.status || over.id;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t)
    );

    try {
      await api.put(`/tasks/${taskId}/move`, { status: newStatus, position: 0 });
      loadTasks(); // refresh in case Firestore listener isn't active
    } catch {
      showToast('Failed to move task', 'error');
      // Revert
      setTasks((prev) =>
        prev.map((t) => t.id === taskId ? { ...t, status: task.status } : t)
      );
    }
  }

  // ── Move task to next status via checkbox
  const STATUS_ORDER = ['todo', 'in_progress', 'in_review', 'done'];
  async function handleAdvanceTask(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const idx = STATUS_ORDER.indexOf(task.status);
    const newStatus = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.length - 1)];
    if (newStatus === task.status) return;

    setTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t)
    );
    try {
      await api.put(`/tasks/${taskId}/move`, { status: newStatus, position: 0 });
      loadTasks();
    } catch {
      showToast('Failed to move task', 'error');
      setTasks((prev) =>
        prev.map((t) => t.id === taskId ? { ...t, status: task.status } : t)
      );
    }
  }

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  if (loading) return (
    <>
      <Navbar />
      <div className="page-loader"><div className="spinner spinner-lg" /><span>Loading board...</span></div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="board-page">
        {/* Board Header */}
        <div className="board-header">
          <button className="board-back btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            ← Back
          </button>
          <div>
            <h1 className="board-title">{project?.name}</h1>
            {project?.description && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{project.description}</p>
            )}
          </div>
          <div className="board-spacer" />
          {/* Members */}
          <div className="board-members">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {members.slice(0, 5).map((m) => (
                <MemberBadge key={m.userId} member={m} size="sm" showTooltip />
              ))}
              {members.length > 5 && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>+{members.length - 5}</span>
              )}
            </div>
            <button
              id="manage-members-btn"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowMemberModal(true)}
            >
              👥 Members
            </button>
          </div>
        </div>

        {/* Kanban */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="board-columns">
            {STATUSES.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={getTasksByStatus(col.id)}
                members={members}
                projectId={projectId}
                onTaskClick={setSelectedTask}
                onAdvanceTask={handleAdvanceTask}
                onTaskCreated={loadTasks}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div style={{ transform: 'rotate(3deg)', opacity: 0.9 }}>
                <TaskCard task={activeTask} onClick={() => {}} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          members={members}
          projectId={projectId}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updated) => setSelectedTask(updated)}
        />
      )}

      {/* Members Modal */}
      {showMemberModal && (
        <MembersModal
          project={project}
          members={members}
          onClose={() => setShowMemberModal(false)}
          onMembersChange={setMembers}
          showToast={showToast}
        />
      )}
    </>
  );
}

/* ── Members modal inline ───────────────────────────────────────────────── */
function MembersModal({ project, members, onClose, onMembersChange, showToast }) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const isOwner = project?.ownerId === user?.uid;

  async function handleAdd(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    try {
      const res = await api.post(`/projects/${project.id}/members`, { email });
      onMembersChange((prev) => [...prev, {
        userId: res.data.user.uid,
        email: res.data.user.email,
        displayName: res.data.user.displayName,
        avatarColor: res.data.user.avatarColor,
        role: 'member',
      }]);
      setEmail('');
      showToast(`${res.data.user.displayName || email} added! 👥`, 'success');
    } catch (err) {
      showToast(err.response?.data?.detail || 'User not found', 'error');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(userId) {
    try {
      await api.delete(`/projects/${project.id}/members/${userId}`);
      onMembersChange((prev) => prev.filter((m) => m.userId !== userId));
      showToast('Member removed', 'info');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to remove', 'error');
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18 }}>Team Members</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {members.map((m) => (
            <div key={m.userId} className="member-row">
              <MemberBadge member={m} size="md" />
              <div className="member-info">
                <div className="member-name">{m.displayName || m.email}</div>
                <div className="member-email">{m.email}</div>
              </div>
              <span className="member-role">{m.role}</span>
              {isOwner && m.userId !== user?.uid && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#ef4444', fontSize: 16, padding: '4px 8px' }}
                  onClick={() => handleRemove(m.userId)}
                  title="Remove member"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {isOwner && (
            <>
              <div className="divider" style={{ margin: '20px 0' }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                Invite a team member by their registered email:
              </p>
              <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8 }}>
                <input
                  id="invite-email-input"
                  className="form-input"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button id="invite-submit" className="btn btn-primary" type="submit" disabled={adding || !email.trim()}>
                  {adding ? <div className="spinner" /> : 'Add'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
