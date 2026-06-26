import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  function getFriendlyError(code) {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found': return 'Invalid email or password.';
      case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
      default: return 'Something went wrong. Please try again.';
    }
  }

  return (
    <div className="auth-page">
      {/* Hero */}
      <div className="auth-hero">
        <div className="auth-hero-logo">⚡ ProjectFlow</div>
        <h1 className="auth-hero-title">Collaborate.<br />Organize.<br />Ship faster.</h1>
        <p className="auth-hero-desc">
          A modern project management platform that keeps your team aligned and your projects on track.
        </p>
        <div className="auth-features">
          <div className="auth-feature"><div className="auth-feature-dot" /> Kanban boards with drag & drop</div>
          <div className="auth-feature"><div className="auth-feature-dot" /> Real-time collaboration</div>
          <div className="auth-feature"><div className="auth-feature-dot" /> Task assignment & comments</div>
          <div className="auth-feature"><div className="auth-feature-dot" /> Instant notifications</div>
        </div>
      </div>

      {/* Form */}
      <div className="auth-form-side">
        <div className="auth-form-container">
          <h2 className="auth-form-title">Welcome back 👋</h2>
          <p className="auth-form-subtitle">Sign in to your workspace</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="login-password"
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: 14 }}>
                {error}
              </div>
            )}

            <button id="login-submit" className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              {loading ? <><div className="spinner" /> Signing in...</> : 'Sign in →'}
            </button>
          </form>

          <div className="auth-form-footer">
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
              Create one free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
