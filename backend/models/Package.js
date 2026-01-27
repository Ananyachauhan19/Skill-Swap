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
    enum: ['ONLY_SILVER', 'ONLY_BRONZE', 'COMBO'],
    required: true
  },
  silverCoins: {
    type: Number,
    default: 0,
    min: 0
  },
  bronzeCoins: {
    type: Number,
    default: 0,
    min: 0
  },
  silverCoinPrice: {
    type: Number,
    default: 0.25,
    min: 0
  },
  bronzeCoinPrice: {
    type: Number,
    default: 0.5,
    min: 0
  },
  priceInINR: {
    type: Number,
    min: 0
    // Auto-calculated in pre-save hook based on coin prices
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
  if (this.type === 'ONLY_SILVER' && this.bronzeCoins > 0) {
    return next(new Error('ONLY_SILVER packages cannot have bronze coins'));
  }
  if (this.type === 'ONLY_BRONZE' && this.silverCoins > 0) {
    return next(new Error('ONLY_BRONZE packages cannot have silver coins'));
  }
  if (this.type === 'COMBO' && (this.silverCoins === 0 || this.bronzeCoins === 0)) {
    return next(new Error('COMBO packages must have both silver and bronze coins'));
  }

  // Auto-calculate price based on coin counts and per-coin prices
  this.priceInINR = (this.silverCoins * (this.silverCoinPrice || 0.25)) + (this.bronzeCoins * (this.bronzeCoinPrice || 0.5));
  
  next();
});

module.exports = mongoose.model('Package', packageSchema);
