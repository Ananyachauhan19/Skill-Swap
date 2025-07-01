const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  otp: String,
  otpExpires: Date,
  // any other fields
});

module.exports = mongoose.model('User', userSchema);
