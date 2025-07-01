const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  phone: String,
  gender: String,
  password: String, // optional if Google user
  googleId: String,

  // 🔽 Add these two fields
  otp: String,
  otpExpires: Date,
});

module.exports = mongoose.model('User', userSchema);
