// src/ChatWindow.jsx
import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from './api';
import { getConversationId } from './utils/conversationId';

const isSameDay = (d1, d2) => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

const formatDateLabel = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

let socket; // singleton socket across component mounts (optional)

export default function ChatWindow({ user, contact }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const messagesRef = useRef();

  useEffect(() => {
    // init socket once
    if (!socket) {
      const token = localStorage.getItem('token');
      socket = io('http://localhost:5000', {
        auth: { token }, // server reads socket.handshake.auth.token
      });

      socket.on('connect', () => console.log('socket connected', socket.id));
      socket.on('disconnect', () => console.log('socket disconnected'));
    }

    return () => {
      // don't disconnect global socket here if you plan to reuse it across chats
      // socket?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!contact) return;

    const conversationId = getConversationId(user._id, contact._id);

    // 1) load history via API
    (async () => {
      try {
        const res = await api.get(`/messages/${encodeURIComponent(conversationId)}`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error('failed to load messages', err);
      }
    })();

    // 2) join socket room
    socket.emit('join', conversationId);

    // 3) listen for incoming messages for this conversation
    const onNew = (msg) => {
      // msg is the saved message from server (has _id, text, sender, createdAt)
      // only append if message belongs to this conversation
      if (msg.conversationId === conversationId || msg.conversationId === undefined) {
        setMessages((m) => [...m, msg]);
      }
    };
    socket.on('message:new', onNew);

    return () => {
      socket.off('message:new', onNew);
      // optionally leave room: socket.emit('leave', conversationId);
    };
  }, [contact, user._id]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  const send = (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    const conversationId = getConversationId(user._id, contact._id);
    const payload = { conversationId, text: text.trim() };

    // optimistic UI
    setMessages((m) => [...m, { _id: `tmp-${Date.now()}`, text: text.trim(), sender: user._id, createdAt: new Date().toISOString() }]);
    setText('');

    // send to server (server will save and emit message:new)
    socket.emit('message:send', payload);
  };

  if (!contact) return null;

  return (
    <div className="chat-window" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chat-header" style={{ padding: 12, borderBottom: '1px solid #eee' }}>
        <strong>{contact.username}</strong>
      </div>

      <div ref={messagesRef} className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {messages.map((m, index) => {
          const msgDate = new Date(m.createdAt || m.ts || Date.now());
          const prevMsg = messages[index - 1];
          const prevDate = prevMsg ? new Date(prevMsg.createdAt || prevMsg.ts || Date.now()) : null;
          const showHeader = !prevDate || !isSameDay(prevDate, msgDate);

          return (
            <React.Fragment key={m._id}>
              {showHeader && (
                <div style={{ textAlign: 'center', margin: '16px 0', fontSize: '13px', color: '#888', fontWeight: '500' }}>
                  <span style={{ background: '#f0f2f5', padding: '4px 12px', borderRadius: '12px' }}>
                    {formatDateLabel(msgDate)}
                  </span>
                </div>
              )}
              <div style={{ marginBottom: 8, textAlign: m.sender === user._id ? 'right' : 'left' }}>
                <div style={{
                  display: 'inline-block',
                  padding: '8px 12px',
                  borderRadius: 12,
                  background: m.sender === user._id ? '#2b6cb0' : '#e2e8f0',
                  color: m.sender === user._id ? 'white' : 'black',
                }}>
                  {m.text}
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                  {msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <form onSubmit={send} style={{ display: 'flex', padding: 12, borderTop: '1px solid #eee' }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..."
          style={{ flex: 1, padding: '8px 12px', borderRadius: 999, border: '1px solid #ddd' }} />
        <button type="submit" style={{ marginLeft: 8, padding: '8px 14px', borderRadius: 8, background: '#2b6cb0', color: 'white' }}>
          Send
        </button>
      </form>
    </div>
  );
}
