// models/User.js
// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String, // hashed
  avatarUrl: { type: String, default: "" },
  lastSeen: { type: Date, default: Date.now },
  isCloneEnabled: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", UserSchema);
