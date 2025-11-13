// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth'); // if you want auth

router.get('/:conversationId', auth, async (req, res) => {
  const { conversationId } = req.params;
  try {
    const msgs = await Message.find({ conversationId }).sort({ createdAt: 1 }).limit(500);
    // Return object so frontend can use res.data.messages
    res.json({ messages: msgs });
  } catch (err) {
    console.error('Error loading messages:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
