import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(form.email, form.password, form.name);
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  function getFriendlyError(code) {
    switch (code) {
      case 'auth/email-already-in-use': return 'This email is already registered.';
      case 'auth/invalid-email': return 'Please enter a valid email address.';
      case 'auth/weak-password': return 'Password is too weak.';
      default: return 'Something went wrong. Please try again.';
    }
  }

  return (
    <div className="auth-page">
      {/* Hero */}
      <div className="auth-hero">
        <div className="auth-hero-logo">⚡ ProjectFlow</div>
        <h1 className="auth-hero-title">Start your<br />team's journey<br />today.</h1>
        <p className="auth-hero-desc">
          Set up your workspace in seconds. Invite your team and start organizing projects with beautiful Kanban boards.
        </p>
        <div className="auth-features">
          <div className="auth-feature"><div className="auth-feature-dot" /> Free to get started</div>
          <div className="auth-feature"><div className="auth-feature-dot" /> Unlimited projects & tasks</div>
          <div className="auth-feature"><div className="auth-feature-dot" /> Real-time Firebase sync</div>
        </div>
      </div>

      {/* Form */}
      <div className="auth-form-side">
        <div className="auth-form-container">
          <h2 className="auth-form-title">Create your account</h2>
          <p className="auth-form-subtitle">Join ProjectFlow and start collaborating</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                id="register-name"
                className="form-input"
                type="text"
                placeholder="Jane Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                id="register-email"
                className="form-input"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="register-password"
                className="form-input"
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input
                id="register-confirm"
                className="form-input"
                type="password"
                placeholder="Repeat password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: 14 }}>
                {error}
              </div>
            )}

            <button id="register-submit" className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              {loading ? <><div className="spinner" /> Creating account...</> : 'Create account →'}
            </button>
          </form>

          <div className="auth-form-footer">
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
