const mongoose = require('mongoose');
const SessionSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  subtopic: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, default: 'pending' },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, required: true },
  sessionType: { type: String, enum: ['normal', 'expert'], default: 'normal' },
  invitedSkillMate: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: { type: Date, default: null },
}, { timestamps: true });
module.exports = mongoose.model('Session', SessionSchema);
