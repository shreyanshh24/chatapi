// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Message = require('./models/Message'); // create model later
const User = require('./models/User'); // existing

const app = express();
app.use(cors({
  origin: [ "http://localhost:3000", "http://localhost:3001" ], // allow both dev ports
  credentials: true,
}));
app.use(express.json());

// connect mongo
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((e) => console.error('MongoDB connect error', e));

// routes (your auth/user routes)
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
app.use('/api/messages', messageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// simple message loading route (used by frontend)
app.get('/api/messages/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  try {
    const msgs = await Message.find({ conversationId }).sort({ createdAt: 1 }).limit(200);
    res.json({ messages: msgs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load messages' });
  }
});

// create http server and socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [ "http://localhost:3000", "http://localhost:3001" ],
    methods: ["GET","POST"],
    credentials: true
  }
});

// optional auth for socket connections
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(); // allow unauth sockets (optional)
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.id;
    next();
  } catch (err) {
    console.warn('Socket auth failed (continuing without user):', err.message);
    next();
  }
});

// socket logic
io.on('connection', (socket) => {
  console.log('socket connected', socket.id, 'userId=', socket.userId);

  socket.on('join', (roomId) => {
    socket.join(roomId);
    console.log('joined', roomId);
  });

  socket.on('message:send', async (payload) => {
    try {
      const { conversationId, text, sender } = payload;
      if (!conversationId || !text) return;
      const msg = await Message.create({
        conversationId,
        sender: sender || socket.userId || 'unknown',
        text,
      });
      io.to(conversationId).emit('message:new', msg);
    } catch (err) {
      console.error('message save error', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  });
});

// start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
