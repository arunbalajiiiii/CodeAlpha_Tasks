import { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useNotif } from '../contexts/NotifContext';
import MemberBadge from './MemberBadge';

const GRADIENT_PALETTES = [
  'linear-gradient(135deg, #7c3aed, #4f46e5)',
  'linear-gradient(135deg, #059669, #0891b2)',
  'linear-gradient(135deg, #d97706, #dc2626)',
  'linear-gradient(135deg, #db2777, #7c3aed)',
  'linear-gradient(135deg, #0891b2, #4f46e5)',
];

export default function ProjectCard({ project, onClick, onDelete }) {
  const { user } = useAuth();
  const { showToast } = useNotif();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwner = project.ownerId === user?.uid;

  // Deterministic gradient from project id
  const gradient = GRADIENT_PALETTES[
    project.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENT_PALETTES.length
  ];

  const tc = project.taskCounts || {};
  const total = Object.values(tc).reduce((a, b) => a + b, 0);
  const done = tc.done || 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  async function handleDelete(e) {
    e.stopPropagation();
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${project.id}`);
      onDelete(project.id);
      showToast('Project deleted', 'info');
    } catch {
      showToast('Failed to delete project', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="project-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Color header */}
      <div style={{ height: 6, background: gradient }} />

      <div className="project-card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <h3 className="project-card-name">{project.name}</h3>
          {isOwner && (
            <div className="dropdown" onClick={(e) => e.stopPropagation()}>
              <button
                className="btn btn-ghost btn-icon"
                style={{ fontSize: 16, color: 'var(--text-muted)', padding: '4px 8px' }}
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              >
                ⋯
              </button>
              {menuOpen && (
                <div className="dropdown-menu">
                  <button className="dropdown-item danger" onClick={handleDelete} disabled={deleting}>
                    🗑️ Delete project
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="project-card-desc">{project.description || 'No description'}</p>

        {/* Stats */}
        <div className="project-card-stats">
          {[
            { label: 'To Do', value: tc.todo || 0 },
            { label: 'Active', value: (tc.in_progress || 0) + (tc.in_review || 0) },
            { label: 'Done', value: tc.done || 0 },
          ].map((s) => (
            <div key={s.label} className="stat-item">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 4, background: 'var(--bg-card)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: gradient, transition: 'width 0.6s ease', borderRadius: 99 }} />
            </div>
          </div>
        )}
      </div>

      <div className="project-card-footer">
        {/* Member avatars */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {(project.memberIds || []).slice(0, 4).map((uid, i) => (
            <div
              key={uid}
              className="avatar avatar-sm"
              style={{
                background: `hsl(${(uid.charCodeAt(0) * 37) % 360}, 60%, 45%)`,
                marginLeft: i > 0 ? -8 : 0,
                border: '2px solid var(--bg-secondary)',
                fontSize: 10,
              }}
            >
              {uid.slice(0, 1).toUpperCase()}
            </div>
          ))}
          {(project.memberIds || []).length > 4 && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
              +{project.memberIds.length - 4}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {new Date(project.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
