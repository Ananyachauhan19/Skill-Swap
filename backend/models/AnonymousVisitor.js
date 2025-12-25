const mongoose = require('mongoose');

const anonymousVisitorSchema = new mongoose.Schema(
  {
    // Primary identifier from visitor_id cookie
    visitorId: { type: String, required: true, unique: true, index: true },
    
    // Activity tracking
    firstSeenAt: { type: Date, default: Date.now, index: true },
    lastSeenAt: { type: Date, default: Date.now, index: true },
    visitCount: { type: Number, default: 1 },
    
    // Page view tracking
    pageViews: [{
      path: String,
      timestamp: Date,
      timeSpent: Number, // seconds
    }],
    totalTimeSpent: { type: Number, default: 0 }, // total seconds across all visits
    
    // Conversion tracking
    isConverted: { type: Boolean, default: false, index: true },
    convertedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    convertedAt: { type: Date },
    
    // Device & source info
    deviceInfo: {
      userAgent: String,
      platform: String,
      browser: String,
    },
    ipAddress: { type: String },
    referrer: { type: String },
    source: { type: String }, // 'direct', 'referral', 'organic', etc.
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
anonymousVisitorSchema.index({ visitorId: 1 });
anonymousVisitorSchema.index({ lastSeenAt: -1 });
anonymousVisitorSchema.index({ isConverted: 1, convertedAt: -1 });
anonymousVisitorSchema.index({ totalTimeSpent: -1 });

module.exports = mongoose.model('AnonymousVisitor', anonymousVisitorSchema);
