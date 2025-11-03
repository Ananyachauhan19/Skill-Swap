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
    enum: ['silver', 'gold'], 
    default: 'silver' 
  }, // Type of coin used
  coinsSpent: { type: Number, default: 10 }, // Number of coins spent
  rating: { type: Number, min: 1, max: 5, default: null }, // Rating given by student
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'],
    default: 'pending' 
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

// Update the updatedAt field before saving
SessionRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SessionRequest', SessionRequestSchema); 