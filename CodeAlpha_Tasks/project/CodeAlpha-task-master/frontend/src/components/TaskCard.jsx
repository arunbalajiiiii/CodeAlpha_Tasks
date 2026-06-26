import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PRIORITY_ICONS = { low: '🟢', medium: '🟡', high: '🔴', urgent: '🚨' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
const STATUS_NEXT_LABEL = {
  todo: 'Move to In Progress',
  in_progress: 'Move to In Review',
  in_review: 'Move to Done',
  done: 'Already done',
};

export default function TaskCard({ task, onClick, members, isDragging, onAdvance }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const isOverdue = task.dueDate && !isDone(task.status) && new Date(task.dueDate) < new Date();
  const assignee = members?.find((m) => m.userId === task.assigneeId);
  const isDoneStatus = isDone(task.status);

  function isDone(status) { return status === 'done'; }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card priority-${task.priority || 'medium'}${isDoneStatus ? ' task-done' : ''}`}
      onClick={() => !isSortableDragging && onClick(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(task)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Advance checkbox */}
        {onAdvance && (
          <button
            className={`task-checkbox${isDoneStatus ? ' task-checkbox-done' : ''}`}
            title={STATUS_NEXT_LABEL[task.status] || 'Advance task'}
            onClick={(e) => { e.stopPropagation(); !isDoneStatus && onAdvance(); }}
            aria-label="Advance to next stage"
          >
            {isDoneStatus ? '✓' : ''}
          </button>
        )}
        <div className="task-card-title" style={{ flex: 1, textDecoration: isDoneStatus ? 'line-through' : 'none', opacity: isDoneStatus ? 0.6 : 1 }}>
          {task.title}
        </div>
      </div>

      <div className="task-card-meta">
        <div className="task-card-tags">
          {/* Priority */}
          <span
            title={`Priority: ${PRIORITY_LABELS[task.priority]}`}
            style={{ fontSize: 13 }}
          >
            {PRIORITY_ICONS[task.priority || 'medium']}
          </span>
        </div>

        {/* Assignee avatar */}
        {assignee && (
          <div
            className="avatar avatar-sm"
            style={{ background: assignee.avatarColor || 'var(--primary)', fontSize: 10 }}
            title={assignee.displayName || assignee.email}
          >
            {(assignee.displayName || assignee.email || '?')[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Due date */}
      {task.dueDate && (
        <div className="task-card-footer">
          <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>
            📅 {formatDate(task.dueDate)} {isOverdue ? '· Overdue!' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
