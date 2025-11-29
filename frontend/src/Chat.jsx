// src/Chat.jsx
import React, { useEffect, useState, useRef } from 'react';
import api from './api';
import { createSocket } from './socket';

export default function Chat({ conversationId, otherUserId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socketRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // load history
    (async () => {
      try {
        const res = await api.get(`/messages/${conversationId}`);
        setMessages(res.data || []);
      } catch (err) {
        console.error('Failed to load messages', err);
      }
    })();

    // create socket and join conv room
    const socket = createSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', conversationId);
    });

    socket.on('message:new', (m) => {
      setMessages(prev => [...prev, m]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversationId]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    // emit via socket
    socketRef.current.emit('message:send', {
      conversationId,
      toUserId: otherUserId,
      text: text.trim()
    });
    setText('');
  };

  return (
    <div className="chat-container">
      <div className="messages" style={{ overflowY: 'auto', height: 'calc(100vh - 160px)' }}>
        {messages.map(m => (
          <div key={m._id || m.id} style={{ textAlign: m.from === currentUser._id ? 'right' : 'left', margin: 8 }}>
            <div style={{
              display: 'inline-block',
              background: m.from === currentUser._id ? '#2b6cb0' : '#e2e8f0',
              color: m.from === currentUser._id ? 'white' : 'black',
              padding: '8px 12px',
              borderRadius: 12,
              maxWidth: '70%'
            }}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} style={{ display: 'flex', gap: 8, padding: 12 }}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Type a message" style={{ flex: 1, padding: 8 }} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
