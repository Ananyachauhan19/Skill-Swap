const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  // interviewer, tutor, both
  accessPermissions: {
    type: String,
    enum: ['interviewer', 'tutor', 'both'],
    required: true,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
  mustChangePassword: {
    type: Boolean,
    // No longer enforced; keep for backward compatibility
    default: false,
  },
  lastLoginAt: {
    type: Date,
  },
  otp: {
    type: String,
    required: false,
  },
  otpExpires: {
    type: Date,
    required: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Employee', employeeSchema);
