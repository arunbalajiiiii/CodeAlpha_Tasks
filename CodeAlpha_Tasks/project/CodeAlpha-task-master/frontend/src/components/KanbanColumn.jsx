import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import api from '../api/client';
import { useNotif } from '../contexts/NotifContext';

const COL_COLORS = {
  todo: '#64748b',
  in_progress: '#3b82f6',
  in_review: '#f59e0b',
  done: '#10b981',
};

export default function KanbanColumn({ column, tasks, members, projectId, onTaskClick, onAdvanceTask, onTaskCreated }) {
  const { showToast } = useNotif();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { status: column.id },
  });

  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/projects/${projectId}/tasks`, {
        title: newTitle.trim(),
        status: column.id,
        priority: 'medium',
      });
      setNewTitle('');
      setAdding(false);
      showToast(`Task "${newTitle.trim()}" created`, 'success');
      onTaskCreated?.(); // refresh task list
    } catch {
      showToast('Failed to create task', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`kanban-col${isOver ? ' drop-over' : ''}`}
      style={{ borderTop: `3px solid ${COL_COLORS[column.id]}` }}
    >
      {/* Column Header */}
      <div className="kanban-col-header">
        <div className="col-dot" style={{ background: COL_COLORS[column.id] }} />
        <span className="col-title" style={{ color: COL_COLORS[column.id] }}>{column.label}</span>
        <span className="col-count">{tasks.length}</span>
      </div>

      {/* Task Cards */}
      <div className="kanban-col-body" ref={setNodeRef}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              members={members}
              onAdvance={onAdvanceTask ? () => onAdvanceTask(task.id) : null}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !adding && (
          <div style={{
            padding: '24px 12px',
            textAlign: 'center',
            color: 'var(--text-disabled)',
            fontSize: 13,
            borderRadius: 8,
            border: '1px dashed var(--border)',
            margin: '4px 0',
          }}>
            Drop tasks here
          </div>
        )}
      </div>

      {/* Add Task */}
      <div className="kanban-col-footer">
        {adding ? (
          <form onSubmit={handleAddTask} className="add-task-form" style={{ padding: 0 }}>
            <input
              className="form-input"
              placeholder="Task title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
              style={{ fontSize: 13, padding: '8px 12px', marginBottom: 8 }}
            />
            <div className="add-task-form-row">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setAdding(false); setNewTitle(''); }}
              >
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" type="submit" disabled={submitting || !newTitle.trim()}>
                {submitting ? <div className="spinner" /> : 'Add'}
              </button>
            </div>
          </form>
        ) : (
          <button
            className="add-task-btn"
            onClick={() => setAdding(true)}
            id={`add-task-${column.id}`}
          >
            <span>+</span> Add task
          </button>
        )}
      </div>
    </div>
  );
}
