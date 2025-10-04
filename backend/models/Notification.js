const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'session-started',
      'session-approved',
      'session-rejected',
      'session-cancelled',
      'session-requested',
      'interview-requested',
      'interview-assigned',
      'interview-scheduled',
      'skillmate-requested',
      'skillmate-approved',
      'skillmate-rejected',
      'skillmate-removed',
      'chat-message'
    ],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null,
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  requesterName: {
    type: String,
    default: null,
  },
  subject: {
    type: String,
    default: null,
  },
  topic: {
    type: String,
    default: null,
  },
  subtopic: {
    type: String,
    default: null,
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);