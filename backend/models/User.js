const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String }, // Optional password for teachers/admins
  isGuest: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  isTeacher: { type: Boolean, default: false }, // Teacher role flag
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

