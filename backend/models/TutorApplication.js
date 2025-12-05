const mongoose = require('mongoose');

const tutorApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  skills: [
    {
      class: { type: String, required: true },
      subject: { type: String, required: true },
      topic: { type: String, required: true },
    },
  ],
  applicationType: { type: String, enum: ['initial', 'skills-update'], default: 'initial' },
  educationLevel: { type: String, enum: ['school', 'college'] },
  institutionName: { type: String },
  classOrYear: { type: String },
  marksheetUrl: { type: String },
  videoUrl: { type: String },
  // Keep legacy single URLs, but store history as arrays for multiple submissions
  marksheetUrls: [{ type: String }],
  videoUrls: [{ type: String }],
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'reverted'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
});

module.exports = mongoose.model('TutorApplication', tutorApplicationSchema);
