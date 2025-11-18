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
router.post('/', async (req, res) => {
  const { conversationId, text, sender, clientId } = req.body;
  if (!conversationId || !text || !sender) return res.status(400).json({ error: 'Missing fields' });
  try {
    const msg = await Message.create({ conversationId, text, sender, clientId });
    res.json({ message: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create message' });
  }
});

module.exports = router;
