const mongoose = require('mongoose');

const ApprovedInterviewerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  profile: {
    name: { type: String, default: '' },
    company: { type: String, default: '' },
    position: { type: String, default: '' },
    qualification: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
  },
  stats: {
    conductedInterviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
  },
  aggregates: {
    pastInterviews: { type: Number, default: 0 },
    upcomingInterviews: { type: Number, default: 0 },
    skillMateSessions: { type: Number, default: 0 },
  },
  // Detailed session tracking
  upcomingSessions: [{
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewRequest' },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requesterName: { type: String, default: '' },
    company: { type: String, default: '' },
    position: { type: String, default: '' },
    scheduledAt: { type: Date },
    status: { type: String, default: 'scheduled' }, // scheduled/pending
    createdAt: { type: Date, default: Date.now }
  }],
  pastSessions: [{
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewRequest' },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requesterName: { type: String, default: '' },
    company: { type: String, default: '' },
    position: { type: String, default: '' },
    scheduledAt: { type: Date },
    completedAt: { type: Date },
    rating: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
    status: { type: String, default: 'completed' },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('ApprovedInterviewer', ApprovedInterviewerSchema);
