import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import MemberBadge from './MemberBadge';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const initials = (user?.displayName || user?.email || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo" style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
        <div className="navbar-logo-dot" />
        ProjectFlow
      </Link>

      <div className="navbar-spacer" />

      <div className="navbar-actions">
        <NotificationBell />

        <div className="dropdown" ref={menuRef}>
          <div
            id="user-menu-btn"
            className="user-menu"
            onClick={() => setMenuOpen((v) => !v)}
            role="button"
            tabIndex={0}
          >
            <div
              className="avatar avatar-sm"
              style={{ background: 'var(--primary-gradient)', width: 28, height: 28, fontSize: 11 }}
            >
              {initials}
            </div>
            <span className="user-name">{user?.displayName || user?.email?.split('@')[0]}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>▾</span>
          </div>

          {menuOpen && (
            <div className="dropdown-menu">
              <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.displayName || 'User'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              <Link to="/" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                📁 My Projects
              </Link>
              <button className="dropdown-item danger" onClick={handleLogout}>
                🚪 Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
