// server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const Message = require("./models/Message");
const User = require("./models/User");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// DB connect
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((e) => console.error("MongoDB connect error", e));

/* ROUTES */
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const aiRoutes = require("./routes/aiRoutes");

app.use("/api/ai", aiRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

/* SOCKET SERVER */
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});




/* AUTH MIDDLEWARE */
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next();

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = String(payload.id);
    return next();
  } catch (err) {
    return next();
  }
});
const onlineUsers = new Map();

function broadcastPresence() {
  const summary = {};
  onlineUsers.forEach((sockets, uid) => {
    summary[uid] = { online: sockets.size > 0, lastSeen: null };
  });
  io.emit("presence:summary", summary);
}
function broadcastPresence() {
  const summary = {};
  onlineUsers.forEach((sockets, uid) => {
    summary[uid] = { online: sockets.size > 0, lastSeen: null };
  });

  io.emit("presence:summary", summary);
}
/* SOCKET EVENTS */
io.on("connection", (socket) => {
  console.log("🟢 Socket connected", socket.id, "userId=", socket.userId);

  /* Mark Online */
  if (socket.userId) {
    if (!onlineUsers.has(socket.userId)) onlineUsers.set(socket.userId, new Set());
    onlineUsers.get(socket.userId).add(socket.id);

    io.emit("presence:update", {
      userId: socket.userId,
      online: true,
      lastSeen: null,
    });
  }
  broadcastPresence();

  /* Join Conversation */
  socket.on("join", (room) => {
    if (room) socket.join(room);
  });

  /* Typing Start */
  socket.on("typing:start", ({ conversationId }) => {
    if (!conversationId) return;
    socket.to(conversationId).emit("typing", {
      conversationId,
      userId: socket.userId,
      typing: true,
    });
  });

  /* Typing Stop */
  socket.on("typing:stop", ({ conversationId }) => {
    if (!conversationId) return;
    socket.to(conversationId).emit("typing", {
      conversationId,
      userId: socket.userId,
      typing: false,
    });
  });

  /* SEND MESSAGE */
  socket.on("message:send", async (payload) => {
    try {
      const { conversationId, text, sender, localId } = payload;
      if (!conversationId || !text) return;

      const msg = await Message.create({
        conversationId,
        sender,
        text,
        localId: localId || null,
      });

      io.to(conversationId).emit("message:new", msg.toObject());
    } catch (err) {
      console.error("message send error", err);
    }
  });

  /* READ RECEIPT */
  socket.on("messages:read", async ({ conversationId }) => {
    if (!conversationId || !socket.userId) return;

    await Message.updateMany(
      { conversationId, readBy: { $ne: socket.userId } },
      { $push: { readBy: socket.userId } }
    );

    io.to(conversationId).emit("messages:read", {
      conversationId,
      userId: socket.userId,
    });
  });

  /* Disconnect Handler */
  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected", socket.id);
    if (!socket.userId) return;

    const set = onlineUsers.get(socket.userId);
    if (!set) return;

    set.delete(socket.id);

    if (set.size === 0) {
      onlineUsers.delete(socket.userId);

      io.emit("presence:update", {
        userId: socket.userId,
        online: false,
        lastSeen: Date.now(),
      });
    }
  });
});

/* START SERVER */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
