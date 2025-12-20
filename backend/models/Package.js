const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['ONLY_SILVER', 'ONLY_GOLDEN', 'COMBO'],
    required: true
  },
  silverCoins: {
    type: Number,
    default: 0,
    min: 0
  },
  goldenCoins: {
    type: Number,
    default: 0,
    min: 0
  },
  priceInINR: {
    type: Number,
    min: 0
    // Auto-calculated in pre-save hook, not required in input
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate price before saving
packageSchema.pre('save', function(next) {
  // Validate coin counts based on package type
  if (this.type === 'ONLY_SILVER' && this.goldenCoins > 0) {
    return next(new Error('ONLY_SILVER packages cannot have golden coins'));
  }
  if (this.type === 'ONLY_GOLDEN' && this.silverCoins > 0) {
    return next(new Error('ONLY_GOLDEN packages cannot have silver coins'));
  }
  if (this.type === 'COMBO' && (this.silverCoins === 0 || this.goldenCoins === 0)) {
    return next(new Error('COMBO packages must have both silver and golden coins'));
  }

  // Auto-calculate price based on coin counts
  this.priceInINR = (this.silverCoins * 0.25) + (this.goldenCoins * 2);
  
  next();
});

module.exports = mongoose.model('Package', packageSchema);
