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
  educationLevel: { type: String, enum: ['school', 'college'], required: true },
  institutionName: { type: String, required: true },
  classOrYear: { type: String, required: true },
  marksheetUrl: { type: String, required: true },
  videoUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'reverted'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
});

module.exports = mongoose.model('TutorApplication', tutorApplicationSchema);
