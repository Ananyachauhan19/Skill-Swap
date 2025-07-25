const mongoose = require('mongoose');

const skillMateSchema = new mongoose.Schema({
  requester: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
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
skillMateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a compound index to ensure uniqueness of requester-recipient pairs
skillMateSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model('SkillMate', skillMateSchema);