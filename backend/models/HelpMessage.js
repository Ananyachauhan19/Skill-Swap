const mongoose = require('mongoose');

const helpMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'replied', 'resolved'], default: 'pending' },
  adminReply: { type: String, default: '' },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  repliedAt: { type: Date, required: false },
}, { timestamps: true });

module.exports = mongoose.model('HelpMessage', helpMessageSchema);
