const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/users/me
// (This route is already fixed and working)
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

    // allow searching by id or by name/email
    const or = [
      { username: byRegex },
      { email: byRegex }
    ];

    // if the user typed a probable ObjectId, include that too
    if (/^[0-9a-fA-F]{24}$/.test(q)) or.push({ _id: q });

    const users = await User.find({ $or: or }).select('-password');
    res.json(users);
  } catch (err) {
    console.error('User search error', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// --- NEW ROUTE ---
// GET /api/users/all
// Gets all users *except* the currently logged-in one
router.get('/all', authMiddleware, async (req, res) => {
  try {
    // req.user._id is from the authMiddleware
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
    res.json(users);
  } catch (err) {
    console.error('GET /all users error', err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;