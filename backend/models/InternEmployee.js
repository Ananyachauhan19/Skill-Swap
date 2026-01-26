const mongoose = require('mongoose');

const internEmployeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  mustChangePassword: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('InternEmployee', internEmployeeSchema);
