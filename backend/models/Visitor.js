const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  // Unique identifier for tracking return visits
  visitorId: {
    type: String,
    required: true,
    unique: true,
  },
  // IP Address
  ipAddress: {
    type: String,
    required: true,
  },
  // Device information
  device: {
    type: String, // mobile, tablet, desktop
    default: 'Unknown',
  },
  // Browser information
  browser: {
    type: String,
    default: 'Unknown',
  },
  browserVersion: {
    type: String,
  },
  // Operating System
  os: {
    type: String,
    default: 'Unknown',
  },
  // Location data (if available)
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String,
    latitude: Number,
    longitude: Number,
  },
  // Screen resolution
  screenResolution: String,
  // Language preference
  language: String,
  // Referrer URL
  referrer: String,
  // Current page URL
  currentPage: String,
  // User agent string
  userAgent: String,
  // Consent status
  consentGiven: {
    type: Boolean,
    default: true,
  },
  consentDate: {
    type: Date,
    default: Date.now,
  },
  // Visit tracking
  firstVisit: {
    type: Date,
    default: Date.now,
  },
  lastVisit: {
    type: Date,
    default: Date.now,
  },
  visitCount: {
    type: Number,
    default: 1,
  },
  // Session tracking
  sessions: [{
    startTime: Date,
    endTime: Date,
    pagesVisited: [String],
    duration: Number, // in seconds
  }],
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update lastVisit and visitCount on each visit
visitorSchema.methods.recordVisit = function() {
  this.lastVisit = new Date();
  this.visitCount += 1;
  this.updatedAt = new Date();
  return this.save();
};

// Add new session
visitorSchema.methods.addSession = function(sessionData) {
  this.sessions.push(sessionData);
  this.updatedAt = new Date();
  return this.save();
};

// Indexes for performance
visitorSchema.index({ createdAt: -1 });
visitorSchema.index({ lastVisit: -1 });
visitorSchema.index({ ipAddress: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);
