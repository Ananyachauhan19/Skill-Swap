const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['video', 'account', 'request'],
      required: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reporterEmail: {
      type: String,
      required: true,
      trim: true,
    },
    issues: [{ type: String, trim: true }],
    otherDetails: { type: String, trim: true },

    // Video context
    videoId: { type: String },
    videoTitle: { type: String },
    videoOwnerId: { type: String },

    // Account context
    reportedUserId: { type: String },
    reportedUsername: { type: String },

    // Request context
    requestId: { type: String },
    requestType: { type: String }, // interview, session, expert, skillmate
    requestStatus: { type: String },
    requestCompany: { type: String },
    requestPosition: { type: String },
    requestSubject: { type: String },
    requestTopic: { type: String },

    // Resolution metadata
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    rawContext: {},
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', ReportSchema);
