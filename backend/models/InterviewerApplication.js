const mongoose = require('mongoose');

const interviewerAppSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  company: { type: String, required: false },
  position: { type: String, required: false },
  experience: { type: String, required: false },
  totalPastInterviews: { type: Number, required: false, default: 0 },
  qualification: { type: String, required: false },
  resumeUrl: { type: String, required: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('InterviewerApplication', interviewerAppSchema);