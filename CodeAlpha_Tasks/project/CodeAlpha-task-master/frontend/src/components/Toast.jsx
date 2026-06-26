import { useNotif } from '../contexts/NotifContext';

const ICONS = { success: '✅', error: '❌', info: '💬' };

export default function Toast() {
  const { toasts, removeToast } = useNotif();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type || 'info'}`}>
          <span className="toast-icon">{ICONS[t.type] || '🔔'}</span>
          <span className="toast-msg">{t.message}</span>
          <span className="toast-close" onClick={() => removeToast(t.id)}>×</span>
        </div>
      ))}
    </div>
  );
}
