const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// POST /request - Send friend request
router.post('/request', auth, async (req, res) => {
    try {
        const { targetUsername } = req.body;
        const requesterId = req.user._id;

        if (!targetUsername) return res.status(400).json({ error: "Target username is required" });

        const targetUser = await User.findOne({ username: targetUsername });
        if (!targetUser) return res.status(404).json({ error: "User not found" });

        if (targetUser._id.toString() === requesterId.toString()) {
            return res.status(400).json({ error: "Cannot add yourself" });
        }

        if (targetUser.friends.includes(requesterId)) {
            return res.status(400).json({ error: "Already friends" });
        }

        if (targetUser.friendRequests.includes(requesterId)) {
            return res.status(400).json({ error: "Request already sent" });
        }

        // Add into target's friendRequests
        targetUser.friendRequests.push(requesterId);
        await targetUser.save();

        // Emit real-time event
        const io = req.app.get("io");
        if (io) {
            io.to(targetUser._id.toString()).emit("friend:request");
        }

        res.json({ message: "Friend request sent" });
    } catch (err) {
        console.error("Friend request error", err);
        res.status(500).json({ error: "Server error" });
    }
});

// POST /accept - Accept friend request
router.post('/accept', auth, async (req, res) => {
    try {
        const { requesterId } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        const requester = await User.findById(requesterId);

        if (!requester) return res.status(404).json({ error: "Requester not found" });

        if (!user.friendRequests.includes(requesterId)) {
            return res.status(400).json({ error: "No request from this user" });
        }

        // Add to friends lists
        user.friends.push(requesterId);
        requester.friends.push(userId);

        // Remove from requests
        user.friendRequests = user.friendRequests.filter(id => id.toString() !== requesterId.toString());

        await user.save();
        await requester.save();

        // Emit update to both users
        const io = req.app.get("io");
        if (io) {
            io.to(userId.toString()).emit("friend:refresh");
            io.to(requesterId.toString()).emit("friend:refresh");
        }

        res.json({ message: "Friend accepted" });
    } catch (err) {
        console.error("Accept friend error", err);
        res.status(500).json({ error: "Server error" });
    }
});

// POST /reject - Reject friend request
router.post('/reject', auth, async (req, res) => {
    try {
        const { requesterId } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);

        user.friendRequests = user.friendRequests.filter(id => id.toString() !== requesterId.toString());
        await user.save();

        res.json({ message: "Friend request rejected" });
    } catch (err) {
        console.error("Reject friend error", err);
        res.status(500).json({ error: "Server error" });
    }
});

// GET /list - Get friends list
router.get('/list', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friends', 'username email avatarUrl lastSeen');
        res.json(user.friends);
    } catch (err) {
        console.error("Get friends error", err);
        res.status(500).json({ error: "Server error" });
    }
});

// GET /requests - Get pending requests
router.get('/requests', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friendRequests', 'username email avatarUrl');
        res.json(user.friendRequests);
    } catch (err) {
        console.error("Get requests error", err);
        res.status(500).json({ error: "Server error" });
    }
});

// GET /search - Search users to add
router.get('/search', auth, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            _id: { $ne: req.user._id }
        }).select('username email avatarUrl');

        res.json(users);
    } catch (err) {
        console.error("Search users error", err);
        res.status(500).json({ error: "Server error" });
    }
});

// POST /remove - Remove a friend
router.post('/remove', auth, async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        const friend = await User.findById(friendId);

        if (!friend) return res.status(404).json({ error: "Friend not found" });

        // Remove from both friends lists
        user.friends = user.friends.filter(id => id.toString() !== friendId.toString());
        friend.friends = friend.friends.filter(id => id.toString() !== userId.toString());

        await user.save();
        await friend.save();

        // Emit update to both users so their UI refreshes
        const io = req.app.get("io");
        if (io) {
            io.to(userId.toString()).emit("friend:refresh");
            io.to(friendId.toString()).emit("friend:refresh");
        }

        res.json({ message: "Friend removed" });
    } catch (err) {
        console.error("Remove friend error", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
