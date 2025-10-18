const mongoose = require('mongoose');

const interviewRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true },
  position: { type: String, required: true },
  message: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'scheduled', 'completed', 'rejected', 'cancelled'],
    default: 'pending',
  },
  assignedInterviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  scheduledAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('InterviewRequest', interviewRequestSchema);
