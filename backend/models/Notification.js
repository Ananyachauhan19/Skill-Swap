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
      'session-completed',
      'session-rated',
      'expert-session-invited',
      'expert-session-approved',
      'expert-session-rejected',
      'expert-session-reminder',
      'interview-requested',
      'interview-approved',
      'interview-approved-confirmation',
      'interview-rejected',
      'interviewer-application',
      'interviewer-approved',
      'interviewer-rejected',
      'interview-assigned',
      'interview-scheduled',
      'interview-scheduled-confirmation',
      'interview-slots-suggested',
      'interview-alternate-suggested',
      'interview-alternate-rejected',
      'interview-auto-scheduled',
      'interview-auto-scheduled-confirmation',
      'interview-rated',
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
  company: {
    type: String,
    default: null,
  },
  position: {
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