import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function CommentBox({ taskId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Real-time Firestore comment listener
  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('taskId', '==', taskId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      setComments(list);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
    return unsub;
  }, [taskId]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const optimisticText = text;
    setText('');
    try {
      await api.post(`/tasks/${taskId}/comments`, { content: optimisticText });
    } catch {
      setText(optimisticText);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

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
    <div className="comments-section">
      <div className="comments-section-title">
        💬 Comments
        <span style={{ background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 99, fontSize: 12 }}>
          {comments.length}
        </span>
      </div>

      <div className="comment-list">
        {comments.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
            No comments yet. Be the first!
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="comment-item">
              <div
                className="avatar avatar-sm"
                style={{ background: c.authorColor || 'var(--primary)', flexShrink: 0 }}
              >
                {(c.authorName || '?')[0].toUpperCase()}
              </div>
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{c.authorName}</span>
                  <span className="comment-time">{timeAgo(c.createdAt)}</span>
                </div>
                <div className="comment-text">{c.content}</div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend}>
        <div className="comment-input-row">
          <div
            className="avatar avatar-sm"
            style={{ background: 'var(--primary-gradient)', flexShrink: 0 }}
          >
            {(user?.displayName || user?.email || '?')[0].toUpperCase()}
          </div>
          <textarea
            id="comment-input"
            className="comment-input"
            placeholder="Write a comment... (Enter to send)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            id="comment-send-btn"
            className="comment-send"
            type="submit"
            disabled={!text.trim() || sending}
            title="Send comment"
          >
            {sending ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : '➤'}
          </button>
        </div>
      </form>
    </div>
  );
}
