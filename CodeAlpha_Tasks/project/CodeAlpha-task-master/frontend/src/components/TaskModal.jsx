import { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useNotif } from '../contexts/NotifContext';
import MemberBadge from './MemberBadge';
import CommentBox from './CommentBox';

const STATUSES = ['todo', 'in_progress', 'in_review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' };
const PRIORITY_LABELS = { low: '🟢 Low', medium: '🟡 Medium', high: '🔴 High', urgent: '🚨 Urgent' };

export default function TaskModal({ task: initialTask, members, projectId, onClose, onUpdate }) {
  const { user } = useAuth();
  const { showToast } = useNotif();
  const [task, setTask] = useState(initialTask);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const titleRef = useRef(null);

  // Sync if parent updates task (e.g., from Firestore)
  useEffect(() => { setTask(initialTask); }, [initialTask]);

  useEffect(() => {
    titleRef.current?.focus();
    // Close on Escape
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  async function handleFieldUpdate(field, value) {
    const updated = { ...task, [field]: value };
    setTask(updated);
    onUpdate?.(updated);
    setSaving(true);
    try {
      await api.put(`/tasks/${task.id}`, { [field]: value });
    } catch {
      showToast('Failed to save change', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleAssign(member) {
    const updated = {
      ...task,
      assigneeId: member.userId,
      assigneeName: member.displayName || member.email,
      assigneeColor: member.avatarColor,
    };
    setTask(updated);
    onUpdate?.(updated);
    try {
      await api.put(`/tasks/${task.id}`, {
        assigneeId: member.userId,
        assigneeName: member.displayName || member.email,
        assigneeColor: member.avatarColor,
      });
      showToast(`Assigned to ${member.displayName || member.email}`, 'success');
    } catch {
      showToast('Failed to assign', 'error');
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this task?')) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${task.id}`);
      onClose();
      showToast('Task deleted', 'info');
    } catch {
      showToast('Failed to delete task', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const assigneeMember = members?.find((m) => m.userId === task.assigneeId);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal task-modal" style={{ padding: 0 }}>
        <div className="task-modal-grid">
          {/* ── Main panel ── */}
          <div className="task-modal-main">
            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <input
                  ref={titleRef}
                  id="task-title-input"
                  className="task-title-input"
                  value={task.title}
                  onChange={(e) => setTask({ ...task, title: e.target.value })}
                  onBlur={(e) => {
                    if (e.target.value.trim() && e.target.value !== initialTask.title)
                      handleFieldUpdate('title', e.target.value.trim());
                  }}
                />
              </div>
              <button className="modal-close" onClick={onClose}>×</button>
            </div>

            {saving && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                💾 Saving...
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                Description
              </label>
              <textarea
                id="task-desc-input"
                className="task-desc-input"
                placeholder="Add a description..."
                value={task.description || ''}
                onChange={(e) => setTask({ ...task, description: e.target.value })}
                onBlur={(e) => {
                  if (e.target.value !== initialTask.description)
                    handleFieldUpdate('description', e.target.value);
                }}
                rows={4}
              />
            </div>

            {/* Comments */}
            <CommentBox taskId={task.id} />
          </div>

          {/* ── Sidebar ── */}
          <div className="task-modal-sidebar">
            {/* Status */}
            <div className="task-sidebar-label">Status</div>
            <select
              id="task-status-select"
              className="form-select"
              value={task.status}
              onChange={(e) => handleFieldUpdate('status', e.target.value)}
              style={{ marginBottom: 4 }}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>

            {/* Priority */}
            <div className="task-sidebar-label">Priority</div>
            <select
              id="task-priority-select"
              className="form-select"
              value={task.priority || 'medium'}
              onChange={(e) => handleFieldUpdate('priority', e.target.value)}
              style={{ marginBottom: 4 }}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>

            {/* Due Date */}
            <div className="task-sidebar-label">Due Date</div>
            <input
              id="task-due-date-input"
              className="form-input"
              type="date"
              value={task.dueDate || ''}
              onChange={(e) => handleFieldUpdate('dueDate', e.target.value)}
              style={{ marginBottom: 4 }}
            />

            {/* Assignee */}
            <div className="task-sidebar-label">Assignee</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {members?.map((m) => (
                <div
                  key={m.userId}
                  onClick={() => handleAssign(m)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '7px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: task.assigneeId === m.userId ? 'rgba(124,58,237,0.15)' : 'var(--bg-card)',
                    border: `1px solid ${task.assigneeId === m.userId ? 'var(--primary)' : 'var(--border)'}`,
                    transition: 'var(--transition)',
                  }}
                >
                  <MemberBadge member={m} size="sm" />
                  <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.displayName || m.email}
                  </span>
                  {task.assigneeId === m.userId && (
                    <span style={{ color: 'var(--primary-light)', fontSize: 14 }}>✓</span>
                  )}
                </div>
              ))}
              {task.assigneeId && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 12, color: 'var(--text-muted)' }}
                  onClick={() => handleFieldUpdate('assigneeId', null)}
                >
                  × Unassign
                </button>
              )}
            </div>

            {/* Metadata */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Created {new Date(task.createdAt).toLocaleDateString()}
              </div>
              {task.updatedAt && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Updated {new Date(task.updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              id="delete-task-btn"
              className="btn btn-danger btn-sm"
              style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <><div className="spinner" /> Deleting...</> : '🗑️ Delete Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
