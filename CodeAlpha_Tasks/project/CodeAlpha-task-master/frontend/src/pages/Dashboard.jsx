import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProjectCard from '../components/ProjectCard';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useNotif } from '../contexts/NotifContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useNotif();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/projects', newProject);
      setProjects((prev) => [res.data, ...prev]);
      setShowCreateModal(false);
      setNewProject({ name: '', description: '' });
      showToast('Project created! 🎉', 'success');
    } catch (err) {
      showToast('Failed to create project', 'error');
    } finally {
      setCreating(false);
    }
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'there';
  const totalTasks = projects.reduce((s, p) => s + Object.values(p.taskCounts || {}).reduce((a, b) => a + b, 0), 0);
  const doneTasks = projects.reduce((s, p) => s + (p.taskCounts?.done || 0), 0);

  return (
    <>
      <Navbar />
      <main className="dashboard-page">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Good {getTimeOfDay()}, {displayName} 👋</h1>
            <p className="dashboard-subtitle">
              {projects.length} project{projects.length !== 1 ? 's' : ''} · {totalTasks} tasks total · {doneTasks} completed
            </p>
          </div>
          <button id="create-project-btn" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + New Project
          </button>
        </div>

        {/* Stats row */}
        {projects.length > 0 && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Projects', value: projects.length, icon: '📁' },
              { label: 'Total Tasks', value: totalTasks, icon: '📋' },
              { label: 'Completed', value: doneTasks, icon: '✅' },
              { label: 'In Progress', value: projects.reduce((s, p) => s + (p.taskCounts?.in_progress || 0), 0), icon: '🔄' },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
                padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 14, flex: '1 0 160px',
              }}>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Projects grid */}
        {loading ? (
          <div className="projects-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 220, borderRadius: 16 }} className="skeleton" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 60 }}>
            <div className="empty-state-icon">🚀</div>
            <h3>No projects yet</h3>
            <p>Create your first project and invite your team to get started.</p>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowCreateModal(true)}>
              + Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() => navigate(`/board/${p.id}`)}
                onDelete={() => setProjects((prev) => prev.filter((x) => x.id !== p.id))}
                onRefresh={fetchProjects}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: 20 }}>New Project</h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Create a collaborative workspace for your team</p>
              </div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Project name *</label>
                  <input
                    id="project-name-input"
                    className="form-input"
                    type="text"
                    placeholder="e.g. Marketing Campaign Q3"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    id="project-desc-input"
                    className="form-textarea"
                    placeholder="What is this project about?"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button id="create-project-submit" className="btn btn-primary" type="submit" disabled={creating || !newProject.name.trim()}>
                  {creating ? <><div className="spinner" /> Creating...</> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
