const mongoose = require('mongoose');

const quizementEmployeeActivitySchema = new mongoose.Schema({
  quizementEmployeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizementEmployee',
    required: true,
    index: true,
  },
  activityType: {
    type: String,
    enum: ['quiz_created', 'quiz_edited', 'quiz_deleted', 'weekly_quiz_created'],
    required: true,
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  quizTitle: String,
  participantCount: {
    type: Number,
    default: 0,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('QuizementEmployeeActivity', quizementEmployeeActivitySchema);
