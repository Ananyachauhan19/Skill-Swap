const mongoose = require('mongoose');

const SessionRequestSchema = new mongoose.Schema({
  requester: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  tutor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  subject: { 
    type: String, 
    required: true 
  },
  topic: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    default: '' 
  },
  // Optional details about the question
  questionText: { type: String, default: '' },
  questionImageUrl: { type: String, default: '' },
  // Session details
  sessionType: { 
    type: String, 
    enum: ['one-on-one', 'interview', 'gd'], 
    default: 'one-on-one' 
  },
  duration: { type: Number, default: 60 }, // Duration in minutes
  credits: { type: Number, default: 10 }, // Credits for the session (deprecated, use coinsSpent)
  coinType: { 
    type: String, 
    enum: ['silver', 'gold', 'bronze'], 
    default: 'silver' 
  }, // Type of coin used
  coinsSpent: { type: Number, default: 10 }, // Number of coins spent
  // Coin settlement summary (set when session is completed)
  coinTypeUsed: { type: String, enum: ['silver', 'gold', 'bronze'], default: null },
  coinsDeducted: { type: Number, default: 0 }, // Final coins deducted from requester
  coinsCredited: { type: Number, default: 0 }, // Final coins credited to tutor
  // Backwards-compat single rating (kept for existing UIs - student rating)
  rating: { type: Number, min: 1, max: 5, default: null },
  reviewText: { type: String, default: '' },
  ratedAt: { type: Date, default: null },
  // New dual-side ratings
  ratingByRequester: { type: Number, min: 1, max: 5, default: null },
  reviewByRequester: { type: String, default: '' },
  ratedByRequesterAt: { type: Date, default: null },
  ratingByTutor: { type: Number, min: 1, max: 5, default: null },
  reviewByTutor: { type: String, default: '' },
  ratedByTutorAt: { type: Date, default: null },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending' 
  },
  // Reschedule fields
  rescheduleProposed: { type: Boolean, default: false },
  proposedTime: { type: Date, default: null },
  rescheduleStatus: { 
    type: String, 
    enum: ['none', 'pending', 'accepted', 'rejected'], 
    default: 'none' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Optional timestamps for real session timing
SessionRequestSchema.add({
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
});

// Update the updatedAt field before saving
SessionRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SessionRequest', SessionRequestSchema); 