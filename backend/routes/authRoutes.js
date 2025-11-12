// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth) return res.status(401).json({ error: 'No token provided' });

    // header format: "Bearer <token>"
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const token = parts[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // put user id on request
    req.userId = payload.id || payload.sub || payload._id;
    return next();
  } catch (err) {
    console.error('auth middleware error:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
