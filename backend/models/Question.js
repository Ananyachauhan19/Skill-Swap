const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  subject: String,
  topic: String,
  subtopic: String,
  questionText: String,
  fileUrl: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Question', questionSchema); 