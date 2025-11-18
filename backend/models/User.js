// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String, // hashed
  avatarUrl: String,
  lastSeen: Date,
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
