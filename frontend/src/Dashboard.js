// src/Dashboard.js
import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import api from "./api";
import "./Dashboard.css";
import axios from "axios";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Fixed IDs for AI bots (must match backend)
const GEMINI_ID = "507f1f77bcf86cd799439011";
const CLONE_ID = "507f1f77bcf86cd799439012";

/* ---------- Profile Panel ---------- */

function ProfilePanel({ user, theme, toggleTheme }) {
  const [username, setUsername] = React.useState(user.username || "");
  const [avatarUrl, setAvatarUrl] = React.useState(user.avatarUrl || "");
  const [isCloneEnabled, setIsCloneEnabled] = React.useState(user.isCloneEnabled || false);
  const [saving, setSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put("/users/me", { username, avatarUrl, isCloneEnabled });
      setSaveMessage("Changes saved!");
      setTimeout(() => setSaveMessage(""), 3000);
      setSaving(false);
    } catch (err) {
      console.error("Failed to update profile", err);
      setSaveMessage("Error saving changes.");
      setSaving(false);
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-title">
          <div style={{ marginRight: 12 }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div className="avatar">
                {(username || user.email || "?")[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="chat-name">Profile</div>
            <div className="chat-sub">Update your details</div>
          </div>
        </div>
      </div>

      <div className="messages" style={{ padding: 24 }}>
        <form
          onSubmit={handleSave}
          style={{ maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Email (read only)</label>
            <input
              disabled
              value={user.email}
              className="search-input"
              style={{ cursor: "not-allowed", opacity: 0.7 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Display name</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              className="search-input"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Avatar URL</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/my-photo.jpg"
              className="search-input"
            />
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              For now, paste an image URL. We can add file upload later.
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <input
              type="checkbox"
              id="cloneToggle"
              checked={isCloneEnabled}
              onChange={(e) => setIsCloneEnabled(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <label htmlFor="cloneToggle" style={{ fontSize: 13, fontWeight: 600 }}>
              Enable AI Clone Learning
            </label>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 24 }}>
            If checked, the AI will analyze your sent messages to mimic your style. Uncheck to disable learning.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                padding: "8px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: 13
              }}
            >
              Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
            <button
              type="button"
              onClick={() => showNotification("Test", "This is a test notification!")}
              style={{
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                padding: "8px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: 13
              }}
            >
              Test Notify
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ width: "auto", padding: "10px 24px" }}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            {saveMessage && (
              <span style={{ marginLeft: 12, fontSize: 13, color: saveMessage.includes("Error") ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                {saveMessage}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Notification Helper ---------- */
function showNotification(title, body) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/logo192.png" });
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => { });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, { body, icon: "/logo192.png" });
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => { });
      }
    });
  }
}

/* ---------- Helpers & small components ---------- */

function getConversationId(a, b) {
  return [String(a), String(b)].sort().join(":");
}

function Avatar({ name, label, className = "", size = 44, style = {} }) {
  const letter = label || (name || "?")[0]?.toUpperCase();
  return (
    <div
      className={`avatar ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size / 2),
        lineHeight: `${size}px`,
        ...style
      }}
    >
      {letter}
    </div>
  );
}

function ContactItem({ contact, selected, onClick, online, unread = 0, lastMessage, time, avatarLabel, avatarClassName, avatarStyle }) {
  return (
    <div
      className={`contact-item ${selected ? "selected" : ""}`}
      onClick={() => onClick(contact)}
      title={contact.username || contact.email}
    >
      <div style={{ position: 'relative' }}>
        <Avatar
          name={contact.username || contact.email}
          label={avatarLabel}
          className={avatarClassName}
          style={avatarStyle}
        />
        {/* Status Indicator on Avatar */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: online ? '#10b981' : '#9ca3af',
          border: '2px solid var(--sidebar-bg)',
          boxShadow: '0 0 0 1px var(--glass-border)'
        }} />
        {/* Unread Badge on Avatar (visible when collapsed or mobile) */}
        {unread > 0 && (
          <div className="avatar-unread-badge">
            {unread > 99 ? '99+' : unread}
          </div>
        )}
      </div>

      <div className="contact-meta">
        <div className="contact-top">
          <div className="contact-name">
            {contact.username || contact.email}
          </div>
          {/* Only show time if explicitly provided and not "Always" (unless for AI) */}
          {time && time !== "Always" && (
            <div className={`contact-time ${unread > 0 ? "highlight" : ""}`}>
              {time}
            </div>
          )}
        </div>
        <div className="contact-bottom">
          <div className="contact-sub">
            {lastMessage || "Say hi — start a chat"}
          </div>
          {unread > 0 && (
            <div className="unread-badge">
              {unread}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Turns plain text into clickable links / images
function LinkifiedText({ text }) {
  if (!text) return null;

  const trimmed = text.trim();
  const imageRegex = /^https?:\/\/\S+\.(png|jpe?g|gif|webp)$/i;
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // If the whole message is just an image URL → show image
  if (imageRegex.test(trimmed)) {
    return (
      <a href={trimmed} target="_blank" rel="noreferrer">
        <img
          src={trimmed}
          alt="shared"
          style={{
            maxWidth: "220px",
            maxHeight: "220px",
            borderRadius: 12,
            display: "block",
          }}
        />
      </a>
    );
  }

  // Otherwise, wrap URLs in <a>
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, i) => {
        const isUrl = /^https?:\/\/[^\s]+$/i.test(part);
        if (isUrl) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--primary-color)", textDecoration: "underline" }}
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ---------- Main Dashboard component ---------- */

export default function Dashboard({ user, onLogout }) {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [presence, setPresence] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [showProfile, setShowProfile] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const scrollRef = useRef();
  const searchInputRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimer = useRef(null);
  const selectedRef = useRef(null);
  const processedUnreadRef = useRef(new Set());
  const sidebarRef = useRef(null);
  const isResizingRef = useRef(false);

  const [sidebarWidth, setSidebarWidth] = useState(320);

  const TYPING_TIMEOUT = 2000;

  const [recentChats, setRecentChats] = useState(() => {
    try {
      const saved = localStorage.getItem(`recentChats_${user._id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  /* SIDEBAR RESIZE */
  const startResizing = (e) => {
    isResizingRef.current = true;
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const resize = (e) => {
    if (isResizingRef.current) {
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    }
  };

  const stopResizing = () => {
    isResizingRef.current = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  };

  // Title Notification & App Badge
  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
    document.title = totalUnread > 0 ? `(${totalUnread}) Chat App` : "Chat App";

    if ('setAppBadge' in navigator) {
      if (totalUnread > 0) {
        navigator.setAppBadge(totalUnread).catch((e) => console.error(e));
      } else {
        navigator.clearAppBadge().catch((e) => console.error(e));
      }
    }
  }, [unreadCounts]);

  /* SOCKET SETUP */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect_error", err.message || err);
    });

    socket.on("presence:summary", (summary) => {
      setPresence((p) => ({ ...p, ...summary }));
    });

    socket.on("presence:update", ({ userId, online, lastSeen }) => {
      setPresence((p) => ({
        ...p,
        [userId]: { online, lastSeen: lastSeen || null },
      }));
    });

    socket.on("typing", ({ conversationId, userId, typing }) => {
      setTypingUsers((prev) => {
        const copy = { ...prev };
        const set = new Set(copy[conversationId] || []);
        if (typing) set.add(userId);
        else set.delete(userId);
        copy[conversationId] = set;
        return copy;
      });

      if (typing) {
        setTimeout(() => {
          setTypingUsers((prev) => {
            const copy = { ...prev };
            const set = new Set(copy[conversationId] || []);
            set.delete(userId);
            copy[conversationId] = set;
            return copy;
          });
        }, TYPING_TIMEOUT + 300);
      }
    });

    socket.on("message:new", (msg) => {
      if (!msg || !msg.conversationId) return;

      // 1) messages list
      setMessages((prev) => {
        if (msg._id && prev.some((m) => String(m._id) === String(msg._id))) {
          return prev;
        }

        if (msg.localId) {
          const idx = prev.findIndex((m) => m.localId === msg.localId);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = msg;
            return copy;
          }
        }

        const incomingTs = msg.createdAt
          ? new Date(msg.createdAt).getTime()
          : msg.ts || Date.now();

        const localIdx = prev.findIndex((m) => {
          if (!String(m._id || "").startsWith("local-")) return false;
          const sameText = m.text === msg.text;
          const sameSender = String(m.sender) === String(msg.sender);
          const localTs =
            m.ts || (m.createdAt ? new Date(m.createdAt).getTime() : 0);
          const diff = Math.abs((localTs || 0) - (incomingTs || 0));
          return sameText && sameSender && diff < 10000;
        });

        if (localIdx !== -1) {
          const copy = [...prev];
          copy[localIdx] = msg;
          return copy;
        }

        return [...prev, msg];
      });

      // 2) recentChats
      setRecentChats((prev) => {
        // Don't add AI chats to recent list (they are hardcoded)
        if (msg.conversationId.startsWith("ai-") || msg.conversationId.startsWith("clone-")) {
          return prev;
        }

        const parts = String(msg.conversationId).split(":");
        const partnerId = parts[0] === String(user._id) ? parts[1] : parts[0];

        const filtered = prev.filter((r) => r.conversationId !== msg.conversationId);
        const newItem = {
          conversationId: msg.conversationId,
          partnerId,
          lastMessage: msg.text,
          time: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        return [newItem, ...filtered];
      });

      // 3) unread badge (only for receiver)
      if (String(msg.sender) !== String(user._id) && msg._id) {
        const currentSelected = selectedRef.current;
        const activeConv = currentSelected
          ? getConversationId(user._id, currentSelected._id)
          : null;

        if (
          activeConv !== msg.conversationId &&
          !processedUnreadRef.current.has(msg._id)
        ) {
          processedUnreadRef.current.add(msg._id);
          setUnreadCounts((prevCounts) => ({
            ...prevCounts,
            [msg.sender]: (prevCounts[msg.sender] || 0) + 1,
          }));

          // System Notification
          if (document.hidden || activeConv !== msg.conversationId) {
            console.log("Triggering notification for", msg.sender);
            showNotification("New Message", msg.text);
          }
        } else {
          console.log("Msg skipped unread:", { activeConv, msgConv: msg.conversationId, has: processedUnreadRef.current.has(msg._id) });
        }
      }
    });

    socket.on("messages:read", ({ conversationId, userId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m.conversationId) === String(conversationId)
            ? {
              ...m,
              readBy: Array.from(new Set([...(m.readBy || []), userId])),
            }
            : m
        )
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user._id]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  /* LOAD USERS */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
        const res = await axios.get(`${API_URL}/api/users/all`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!mounted) return;
        const data = res.data;
        const list = Array.isArray(data) ? data : data.users || data;
        setContacts(list || []);
      } catch (err) {
        console.error("Failed to load users", err);
        setContacts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* PERSIST RECENT CHATS */
  useEffect(() => {
    try {
      localStorage.setItem(
        `recentChats_${user._id}`,
        JSON.stringify(recentChats)
      );
    } catch (e) {
      console.warn("Could not save recentChats", e);
    }
  }, [recentChats, user._id]);

  /* AUTO SCROLL */
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  /* OPEN CHAT */
  const openChat = async (contact) => {
    setShowProfile(false);
    setSelected(contact);
    selectedRef.current = contact;

    if (contact._id) {
      setUnreadCounts((prev) => ({
        ...prev,
        [contact._id]: 0,
      }));
    }

    setMessages([]);

    const otherId = contact._id || "gemini-ai";
    let conversationId;
    if (otherId === "gemini-ai" || otherId === GEMINI_ID) {
      conversationId = `ai-${user._id}`;
    } else if (otherId === "ai-clone" || otherId === CLONE_ID) {
      conversationId = `clone-${user._id}`;
    } else {
      conversationId = getConversationId(user._id, otherId);
    }

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("join", conversationId);
    }

    try {
      const res = await api.get(`/messages/${encodeURIComponent(conversationId)}`);
      const msgs = (res.data && (res.data.messages || res.data)) || [];
      setMessages(msgs);

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("messages:read", { conversationId });
      }
    } catch (err) {
      console.warn("Could not load messages", err);
      setMessages([]);
    }

    setRecentChats((prev) => {
      const filtered = prev.filter((c) => c.conversationId !== conversationId);
      return [{ conversationId, partnerId: otherId }, ...filtered];
    });
  };

  /* SEND MESSAGE */
  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !selected) return;

    // AI Clone shortcut
    if (selected._id === "ai-clone" || selected._id === CLONE_ID) {
      const userText = input.trim();
      setInput("");

      const localId = `local-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      const userMsg = {
        _id: localId,
        localId,
        conversationId: `clone-${user._id}`,
        text: userText,
        sender: String(user._id),
        ts: Date.now(),
        readBy: [String(user._id)],
      };

      setMessages((prev) => [...prev, userMsg]);

      try {
        const res = await api.post("/ai/clone", {
          message: userText,
          conversationId: `clone-${user._id}`,
          history: messages.slice(-10).map((m) => ({
            role: String(m.sender) === String(user._id) ? "user" : "assistant",
            content: m.text,
          })),
        });

        const aiText =
          res.data?.reply || "Sorry, I couldn't think of a reply.";

        const aiMsg = {
          _id: `clone-${Date.now()}`,
          conversationId: `clone-${user._id}`,
          text: aiText,
          sender: CLONE_ID,
          ts: Date.now(),
          readBy: [],
        };

        // Only update messages if we are still looking at the clone chat
        const current = selectedRef.current;
        if (current && (current._id === "ai-clone" || current._id === CLONE_ID)) {
          setMessages((prev) => [...prev, aiMsg]);
        } else {
          // Otherwise, notify
          setUnreadCounts(prev => ({ ...prev, [CLONE_ID]: (prev[CLONE_ID] || 0) + 1 }));
          showNotification("My AI Clone", aiText);
        }
      } catch (err) {
        console.error("AI Clone error", err);
        const errorMsg = {
          _id: `clone-error-${Date.now()}`,
          conversationId: `clone-${user._id}`,
          text: "AI Clone is currently unavailable. Try again later.",
          sender: CLONE_ID,
          ts: Date.now(),
          readBy: [],
        };
        setMessages((prev) => [...prev, errorMsg]);
      }

      return;
    }

    // AI chat shortcut
    if (selected._id === "gemini-ai" || selected._id === GEMINI_ID) {
      const userText = input.trim();
      setInput("");

      const localId = `local-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      const userMsg = {
        _id: localId,
        localId,
        conversationId: `ai-${user._id}`,
        text: userText,
        sender: String(user._id),
        ts: Date.now(),
        readBy: [String(user._id)],
      };

      setMessages((prev) => [...prev, userMsg]);

      try {
        const res = await api.post("/ai/chat", {
          message: userText,
          conversationId: `ai-${user._id}`,
          history: messages.slice(-10).map((m) => ({
            role: String(m.sender) === String(user._id) ? "user" : "assistant",
            content: m.text,
          })),
        });

        const aiText =
          res.data?.reply || "Sorry, I couldn't think of a reply.";

        const aiMsg = {
          _id: `ai-${Date.now()}`,
          conversationId: `ai-${user._id}`,
          text: aiText,
          sender: GEMINI_ID,
          ts: Date.now(),
          readBy: [],
        };

        // Only update messages if we are still looking at the AI chat
        const current = selectedRef.current;
        if (current && (current._id === "gemini-ai" || current._id === GEMINI_ID)) {
          setMessages((prev) => [...prev, aiMsg]);
        } else {
          // Otherwise, notify
          setUnreadCounts(prev => ({ ...prev, [GEMINI_ID]: (prev[GEMINI_ID] || 0) + 1 }));
          showNotification("Gemini (AI)", aiText);
        }
      } catch (err) {
        console.error("AI error", err);
        const errorMsg = {
          _id: `ai-error-${Date.now()}`,
          conversationId: `ai-${user._id}`,
          text: "AI is currently unavailable. Try again later.",
          sender: GEMINI_ID,
          ts: Date.now(),
          readBy: [],
        };
        setMessages((prev) => [...prev, errorMsg]);
      }

      return;
    }

    // normal chat
    const otherId = selected._id || "gemini-ai";
    const conversationId = getConversationId(user._id, otherId);

    const localId = `local-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const optimistic = {
      _id: localId,
      localId,
      conversationId,
      text: input.trim(),
      sender: String(user._id),
      ts: Date.now(),
      readBy: [String(user._id)],
    };

    setMessages((p) => [...p, optimistic]);
    setInput("");

    // Update recent chats for self
    setRecentChats((prev) => {
      const filtered = prev.filter((r) => r.conversationId !== conversationId);
      const newItem = {
        conversationId,
        partnerId: otherId,
        lastMessage: optimistic.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      return [newItem, ...filtered];
    });

    const payload = {
      conversationId,
      text: optimistic.text,
      sender: optimistic.sender,
      localId,
      ts: optimistic.ts,
    };

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("message:send", payload);
    } else {
      try {
        await api.post("/messages", payload);
      } catch (err) {
        console.error("Fallback send failed", err);
      }
    }
  };

  /* TYPING HELPERS */
  const emitTypingStart = (conversationId) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit("typing:start", { conversationId });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current.emit("typing:stop", { conversationId });
    }, TYPING_TIMEOUT);
  };

  const emitTypingStop = (conversationId) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit("typing:stop", { conversationId });
    if (typingTimer.current) clearTimeout(typingTimer.current);
  };

  /* NEW CHAT */
  const handleNewChat = () => {
    setShowProfile(false);
    setSelected(null);
    selectedRef.current = null;
    setMessages([]);
    setSearch("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const isOnline = (userId) => {
    const p = presence[String(userId)];
    return p ? p.online === true : undefined;
  };

  const recentContacts = recentChats
    .filter(r => !r.conversationId.startsWith("ai-") && !r.conversationId.startsWith("clone-"))
    .map((r) => {
      const partner = contacts.find((c) => String(c._id) === String(r.partnerId));
      const contact = partner || { _id: r.partnerId, username: r.partnerId };
      return { ...contact, lastMessage: r.lastMessage, time: r.time };
    });

  const searchMatches = contacts.filter((c) =>
    (c.username || c.email || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const curConversationId = selected
    ? getConversationId(user._id, selected._id || "gemini-ai")
    : null;
  const curTypingSet = curConversationId
    ? typingUsers[curConversationId] || new Set()
    : new Set();

  /* RENDER */
  return (
    <div className="dashboard-root">
      <aside className="sidebar" style={{ width: sidebarWidth }} ref={sidebarRef}>
        <div className="sidebar-top">
          <div className="profile">
            <Avatar name={user.username || user.email} size={48} />
            <div className="profile-meta">
              <div className="profile-name">{user.username || user.email}</div>
              <div className="profile-status">
                {isOnline(user._id) ? "Online" : "Offline"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-logout"
              onClick={() => {
                setShowProfile(true);
                setSelected(null);
                selectedRef.current = null;
              }}
            >
              Profile
            </button>
            <button className="btn-logout" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="search-area">
          <input
            ref={searchInputRef}
            className="search-input"
            placeholder="Filter contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="contacts-title">Recent Chats</div>

        <div className="contacts-list">
          {/* AI contact */}
          <ContactItem
            contact={{ _id: GEMINI_ID, username: "Gemini (AI)", email: "AI Assistant" }}
            selected={selected && (selected._id === "gemini-ai" || selected._id === GEMINI_ID)}
            onClick={() => openChat({ _id: GEMINI_ID, username: "Gemini (AI)" })}
            online={true}
            unread={unreadCounts[GEMINI_ID] || 0}
            lastMessage="Your Digital Assistant"
            time="Always"
            avatarLabel="AI"
            avatarClassName="ai-avatar"
          />

          {/* AI Clone contact */}
          <ContactItem
            contact={{ _id: CLONE_ID, username: "My AI Clone", email: "AI Clone" }}
            selected={selected && (selected._id === "ai-clone" || selected._id === CLONE_ID)}
            onClick={() => openChat({ _id: CLONE_ID, username: "My AI Clone" })}
            online={true}
            unread={unreadCounts[CLONE_ID] || 0}
            lastMessage="Mimics your style"
            time="Always"
            avatarLabel="C"
            avatarClassName="ai-avatar"
            avatarStyle={{ background: "#7c3aed" }}
          />

          {recentContacts.length === 0 ? (
            <div className="empty-chat" style={{ padding: 10, fontSize: 13, background: 'transparent', border: 'none' }}>
              No recent chats.
            </div>
          ) : (
            recentContacts.map((c) => (
              <ContactItem
                key={c._id}
                contact={c}
                selected={selected && selected._id === c._id}
                onClick={openChat}
                online={isOnline(c._id)}
                unread={unreadCounts[c._id] || 0}
                lastMessage={c.lastMessage}
                time={c.time}
              />
            ))
          )}

          {search && (
            <>
              <div className="contacts-title" style={{ marginTop: 8 }}>
                Search results
              </div>
              {searchMatches.length === 0 ? (
                <div className="empty-chat" style={{ padding: 10, fontSize: 13, background: 'transparent', border: 'none' }}>No matches</div>
              ) : (
                searchMatches
                  .filter(
                    (s) =>
                      !recentContacts.some(
                        (r) => String(r._id) === String(s._id)
                      )
                  )
                  .map((c) => (
                    <ContactItem
                      key={c._id}
                      contact={c}
                      selected={selected && selected._id === c._id}
                      onClick={openChat}
                      online={isOnline(c._id)}
                    />
                  ))
              )}
            </>
          )}
        </div>

        <div className="sidebar-bottom">
          <button className="btn-primary" onClick={handleNewChat}>
            New Chat
          </button>
        </div>
      </aside>
      <div className="resize-handle" onMouseDown={startResizing} />

      <main className="chat-area">
        {showProfile ? (
          <ProfilePanel user={user} theme={theme} toggleTheme={toggleTheme} />
        ) : !selected ? (
          <div className="empty-chat">
            <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
            <h2>Welcome to Gemini Chat</h2>
            <p>Select a contact to start messaging or talk to your AI assistant.</p>
          </div>
        ) : (
          <div className="chat-window">
            <div className="chat-header">
              <div className="chat-title">
                <Avatar name={selected.username} size={40} />
                <div>
                  <div className="chat-name">{selected.username}</div>
                  <div className="chat-sub">
                    {isOnline(selected._id)
                      ? "Online"
                      : presence[selected._id]?.lastSeen
                        ? `Last seen ${new Date(
                          presence[selected._id].lastSeen
                        ).toLocaleString()}`
                        : "Offline"}
                  </div>
                </div>
              </div>
            </div>

            <div className="messages" ref={scrollRef}>
              {messages.map((m) => (
                <div
                  key={m._id || m.localId || m.ts}
                  className={`message ${String(m.sender) === String(user._id) ? "me" : "them"
                    }`}
                >
                  <div className="message-bubble">
                    <div className="message-text">
                      <LinkifiedText text={m.text} />
                    </div>
                    <div className="msg-time">
                      {new Date(m.createdAt || m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {String(m.sender) === String(user._id) && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 12,
                            opacity: 0.7,
                          }}
                        >
                          {Array.isArray(m.readBy) && m.readBy.length > 0
                            ? "✓✓"
                            : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {curTypingSet && curTypingSet.size > 0 && (
                <div className="message them">
                  <div className="message-bubble">
                    <div className="message-text">Typing...</div>
                  </div>
                </div>
              )}
            </div>

            <form
              className="composer"
              onSubmit={(e) => {
                sendMessage(e);
                if (
                  socketRef.current &&
                  socketRef.current.connected &&
                  curConversationId
                ) {
                  socketRef.current.emit("typing:stop", {
                    conversationId: curConversationId,
                  });
                }
              }}
            >
              <input
                className="composer-input"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (selected) {
                    const convId = getConversationId(
                      user._id,
                      selected._id || "gemini-ai"
                    );
                    emitTypingStart(convId);
                  }
                }}
                onBlur={() => {
                  if (selected) {
                    const convId = getConversationId(
                      user._id,
                      selected._id || "gemini-ai"
                    );
                    emitTypingStop(convId);
                  }
                }}
              />
              <button className="composer-send" type="submit">
                Send
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
