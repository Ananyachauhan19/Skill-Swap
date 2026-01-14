const mongoose = require('mongoose');

const quizementQuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: {
    type: [String],
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length === 4,
      message: 'Each question must have exactly 4 options',
    },
    required: true,
  },
  correctAnswer: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: true,
  },
  marks: { type: Number, required: true, min: 1 },
}, { _id: false });

const quizementTestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  duration: { type: Number, required: true, min: 1 }, // minutes
  bronzeCost: { type: Number, required: true, min: 0 },
  silverCost: { type: Number, required: true, min: 0 },
  totalMarks: { type: Number, required: true, min: 1 },
  questions: { type: [quizementQuestionSchema], default: [] },
  createdByEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: false },
  createdByQuizementEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizementEmployee', required: false },
  isActive: { type: Boolean, default: true },
  // New fields for enhanced quiz features
  isPaid: { type: Boolean, default: false },
  course: { type: String, trim: true, default: '' }, // Course name from CSV
  // Weekly quiz fields
  isWeeklyQuiz: { type: Boolean, default: false },
  expiresAt: { type: Date, default: null }, // Auto-expire date for weekly quizzes
}, {
  timestamps: true,
});

module.exports = mongoose.model('QuizementTest', quizementTestSchema);
