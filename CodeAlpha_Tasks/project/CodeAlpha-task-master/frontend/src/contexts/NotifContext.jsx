import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import api from '../api/client';

const NotifContext = createContext(null);

export function NotifProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [wsRef, setWsRef] = useState(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── Firestore real-time listener for notifications
  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setNotifications(items);
    });
    return unsub;
  }, [user]);

  // ── WebSocket connection for live toast messages
  useEffect(() => {
    if (!user) { wsRef?.close(); return; }
    const ws = new WebSocket(`ws://localhost:8000/ws/${user.uid}`);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        showToast(getToastMsg(data), data.type === 'error' ? 'error' : 'info');
      } catch (_) {}
    };
    setWsRef(ws);
    return () => ws.close();
  }, [user]);

  function getToastMsg(data) {
    switch (data.type) {
      case 'task_created': return `📋 New task: "${data.task?.title}"`;
      case 'task_updated': return `✏️ Task updated`;
      case 'task_moved': return `🔀 Task moved to ${data.newStatus?.replace('_', ' ')}`;
      case 'comment_added': return `💬 New comment on task`;
      case 'member_added': return `👥 You were added to a project`;
      default: return '🔔 New notification';
    }
  }

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  async function markAllRead() {
    try {
      await api.put('/notifications/read-all');
    } catch (_) {}
  }

  async function markRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (_) {}
  }

  return (
    <NotifContext.Provider value={{ notifications, unreadCount, showToast, removeToast, toasts, markAllRead, markRead }}>
      {children}
    </NotifContext.Provider>
  );
}

export function useNotif() {
  return useContext(NotifContext);
}
