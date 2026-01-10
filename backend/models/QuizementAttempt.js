const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['tab-switch', 'fullscreen-exit', 'right-click', 'copy-paste', 'devtools', 'window-blur'],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const answerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  selectedAnswer: { type: String, default: '' },
}, { _id: false });

const quizementAttemptSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizementTest', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  unlocked: { type: Boolean, default: false },
  unlockedAt: { type: Date, default: null },
  coinTypeUsed: { type: String, enum: ['bronze', 'silver'], required: false },
  coinsSpent: { type: Number, required: false, min: 0 },

  started: { type: Boolean, default: false },
  startedAt: { type: Date, default: null },
  finished: { type: Boolean, default: false },
  finishedAt: { type: Date, default: null },

  answers: { type: [answerSchema], default: [] },
  score: { type: Number, default: 0, min: 0 },
  totalMarks: { type: Number, default: 0, min: 0 },
  percentage: { type: Number, default: 0 },

  violations: { type: [violationSchema], default: [] },
}, {
  timestamps: true,
});

quizementAttemptSchema.index({ testId: 1, userId: 1 }, { unique: true });

quizementAttemptSchema.virtual('violationCount').get(function violationCount() {
  return this.violations.length;
});

quizementAttemptSchema.methods.calculateScore = async function calculateScore() {
  const QuizementTest = mongoose.model('QuizementTest');
  const test = await QuizementTest.findById(this.testId);
  if (!test) throw new Error('Quizement test not found');
  if (!test.questions || !test.questions.length) throw new Error('Quizement test has no questions');

  let totalScore = 0;
  this.answers.forEach((answer) => {
    if (answer.questionIndex >= 0 && answer.questionIndex < test.questions.length) {
      const question = test.questions[answer.questionIndex];
      if (question && answer.selectedAnswer && answer.selectedAnswer === question.correctAnswer) {
        totalScore += question.marks || 0;
      }
    }
  });

  this.score = totalScore;
  this.totalMarks = test.totalMarks || 0;
  if (this.totalMarks > 0) {
    this.percentage = Math.round((totalScore / this.totalMarks) * 10000) / 100;
  } else {
    this.percentage = 0;
  }

  return this.score;
};

quizementAttemptSchema.methods.addViolation = async function addViolation(type) {
  this.violations.push({ type, timestamp: new Date() });
  if (this.violations.length >= 3 && !this.finished) {
    this.finished = true;
    this.finishedAt = new Date();
    await this.calculateScore();
  }
  await this.save();
  return this.violations.length;
};

module.exports = mongoose.model('QuizementAttempt', quizementAttemptSchema);
