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
  // Rating fields
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  conductedInterviews: { type: Number, default: 0 }, // Actual interviews conducted
  approvedByEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  rejectedByEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
}, { timestamps: true });

module.exports = mongoose.model('InterviewerApplication', interviewerAppSchema);