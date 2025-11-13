const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// --- SIGNUP ROUTE ---
// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 1. Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists with that email' });
    }
    
    user = await User.findOne({ username });
    if (user) {
        return res.status(400).json({ error: 'User already exists with that username' });
    }

    // 2. Create new user
    user = new User({
      username,
      email,
      password,
    });

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 4. Save user to database
    await user.save();

    // 5. Send success response
    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.error('SIGNUP ERROR:', err.message);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// --- LOGIN ROUTE ---
// POST /api/auth/login
// routes/authRoutes.js (replace the login route with this)




// Improved Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Ensure user has a password field
    if (!user.password) {
      console.error("User exists but has no password field", user);
      return res.status(500).json({ error: "User record incomplete — contact admin" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("Missing JWT_SECRET in environment");
      return res.status(500).json({ error: "Server misconfigured (JWT secret missing)" });
    }

    const token = jwt.sign({ id: user._id }, secret, { expiresIn: "1d" });

    // Remove password from response
    const userSafe = user.toObject();
    delete userSafe.password;

    res.json({ message: "Login successful ✅", token, user: userSafe });
  } catch (err) {
    // LOG THE FULL ERROR (stack) — you'll see this in the server terminal
    console.error("Login route error:", err && err.stack ? err.stack : err);
    res.status(500).json({ error: "Server error during login" });
  }
});




module.exports = router;