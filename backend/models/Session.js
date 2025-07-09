const mongoose = require('mongoose');
const SessionSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: String,
  topic: String,
  subtopic: String,
  date: String,
  time: String,
  status: { type: String, default: 'pending' },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});
module.exports = mongoose.model('Session', SessionSchema);
