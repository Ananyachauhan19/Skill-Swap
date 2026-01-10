const mongoose = require('mongoose');

const quizementEmployeeSchema = new mongoose.Schema({
  fullName: {
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
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active',
  },
  lastLoginAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('QuizementEmployee', quizementEmployeeSchema);
