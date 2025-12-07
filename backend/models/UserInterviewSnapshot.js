const mongoose = require('mongoose');

const UserInterviewSnapshotSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  aggregates: {
    upcomingInterviews: { type: Number, default: 0 },
    pastInterviews: { type: Number, default: 0 },
  },
  upcomingSessions: [{
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewRequest' },
    interviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    interviewerName: { type: String, default: '' },
    company: { type: String, default: '' },
    position: { type: String, default: '' },
    scheduledAt: { type: Date },
    status: { type: String, default: 'scheduled' },
    createdAt: { type: Date, default: Date.now }
  }],
  pastSessions: [{
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewRequest' },
    interviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    interviewerName: { type: String, default: '' },
    company: { type: String, default: '' },
    position: { type: String, default: '' },
    scheduledAt: { type: Date },
    completedAt: { type: Date },
    rating: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
    status: { type: String, default: 'completed' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('UserInterviewSnapshot', UserInterviewSnapshotSchema);
