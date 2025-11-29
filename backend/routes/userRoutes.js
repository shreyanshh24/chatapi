const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('GET /me error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/search?q=some
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const byRegex = { $regex: q, $options: 'i' };

    const or = [
      { username: byRegex },
      { email: byRegex }
    ];

    if (/^[0-9a-fA-F]{24}$/.test(q)) or.push({ _id: q });

    const users = await User.find({ $or: or }).select('-password');
    res.json(users);
  } catch (err) {
    console.error('User search error', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/users/all
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
    res.json(users);
  } catch (err) {
    console.error('GET /all users error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/me
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (req.body.username) user.username = req.body.username;
    if (req.body.avatarUrl) user.avatarUrl = req.body.avatarUrl;
    if (typeof req.body.isCloneEnabled === "boolean") {
      user.isCloneEnabled = req.body.isCloneEnabled;
    }

    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    console.error("PUT /me error", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;