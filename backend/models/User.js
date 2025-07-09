const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  phone: String,
  gender: String,
  password: String, // optional if Google user
  googleId: String,
  socketId: String, // Add this field for real-time notifications

  // 🔽 Add these two fields
  otp: String,
  otpExpires: Date,
});

module.exports = mongoose.model('User', userSchema);
