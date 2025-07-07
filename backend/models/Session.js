// models/Session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  subject: String,
  topic: String,
  subtopic:String,
  description: String,
  date: String,
  time: String,
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requests: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
      }
    }
  ],
  status: {
  type: String,
  enum: ['pending', 'completed'],
  default: 'pending',
}

}, { timestamps: true });


module.exports = mongoose.model('Session', sessionSchema);
