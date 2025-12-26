const mongoose = require('mongoose');

const interviewRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true },
  position: { type: String, required: true },
  message: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'scheduled', 'completed', 'rejected', 'cancelled', 'expired'],
    default: 'pending',
  },
  assignedInterviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedByAdmin: { type: Boolean, default: false }, // Track if interviewer was assigned by admin
  scheduledAt: { type: Date, default: null },
  // Negotiation fields for time-slot suggestions
  negotiationStatus: {
    type: String,
    enum: ['none', 'awaiting_requester', 'awaiting_interviewer', 'finalized'],
    default: 'none',
  },
  interviewerSuggestedSlots: [
    {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
  ],
  requesterAlternateSlots: [
    {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
  ],
  requesterAlternateReason: { type: String, default: '' },
  interviewerSuggestedAt: { type: Date, default: null },
  requesterSuggestedAt: { type: Date, default: null },
  negotiationDeadline: { type: Date, default: null },
  alternateSlotsRejected: { type: Boolean, default: false },
  autoScheduled: { type: Boolean, default: false },
  // Rating fields
  rating: { type: Number, min: 1, max: 5, default: null },
  feedback: { type: String, default: '' },
  ratedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('InterviewRequest', interviewRequestSchema);
