import { useState, useRef, useEffect } from 'react';
import { useNotif } from '../contexts/NotifContext';

const TYPE_ICONS = {
  member_added: '👥',
  task_assigned: '📋',
  comment_added: '💬',
  default: '🔔',
};

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead } = useNotif();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(iso).toLocaleDateString();
  }

  return (
    <div className="dropdown" ref={ref}>
      <button
        id="notification-bell-btn"
        className="notif-bell-btn"
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="dropdown-menu notif-dropdown">
          {/* Header */}
          <div className="notif-header">
            <span className="notif-header-title">
              Notifications {unreadCount > 0 && <span style={{ color: 'var(--primary-light)' }}>({unreadCount})</span>}
            </span>
            {unreadCount > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 12, padding: '4px 8px' }}
                onClick={markAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications list */}
          {notifications.length === 0 ? (
            <div className="notif-empty">🎉 You're all caught up!</div>
          ) : (
            <div>
              {notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => !n.isRead && markRead(n.id)}
                >
                  <div className={`notif-dot ${n.isRead ? 'read' : ''}`} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 14 }}>{TYPE_ICONS[n.type] || TYPE_ICONS.default}</span>
                      <div>
                        <div className="notif-msg">{n.message}</div>
                        <div className="notif-time">{timeAgo(n.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
