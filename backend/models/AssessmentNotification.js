const mongoose = require('mongoose');

const assessmentNotificationSchema = new mongoose.Schema({
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  notificationType: {
    type: String,
    enum: ['compulsory', 'non-compulsory', 'reminder'],
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  emailStatus: {
    type: String,
    enum: ['sent', 'failed'],
    default: 'sent'
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate notifications
assessmentNotificationSchema.index({ assessmentId: 1, studentId: 1, notificationType: 1 });

module.exports = mongoose.model('AssessmentNotification', assessmentNotificationSchema);
