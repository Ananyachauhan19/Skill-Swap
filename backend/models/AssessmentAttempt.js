const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['tab-switch', 'fullscreen-exit', 'right-click', 'copy-paste', 'devtools', 'window-blur'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const answerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true
  },
  selectedAnswer: {
    type: String,
    enum: ['A', 'B', 'C', 'D', ''],
    default: ''
  }
}, { _id: false });

const assessmentAttemptSchema = new mongoose.Schema({
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: {
    type: [answerSchema],
    default: []
  },
  score: {
    type: Number,
    default: 0,
    min: 0
  },
  totalMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  submittedAt: {
    type: Date,
    default: null
  },
  violations: {
    type: [violationSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'auto-submitted'],
    default: 'in-progress'
  },
  isCompulsoryForStudent: {
    type: Boolean,
    default: false,
    comment: 'Was this assessment compulsory for the student'
  },
  autoSaveData: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index to prevent multiple attempts
assessmentAttemptSchema.index({ assessmentId: 1, studentId: 1 });

// Index for faster queries
assessmentAttemptSchema.index({ studentId: 1, status: 1 });
assessmentAttemptSchema.index({ assessmentId: 1, status: 1 });

// Virtual for violation count
assessmentAttemptSchema.virtual('violationCount').get(function() {
  return this.violations.length;
});

// Virtual for time taken
assessmentAttemptSchema.virtual('timeTaken').get(function() {
  if (!this.submittedAt) return null;
  return Math.round((this.submittedAt - this.startedAt) / 1000 / 60); // in minutes
});

// Method to calculate score
assessmentAttemptSchema.methods.calculateScore = async function() {
  const Assessment = mongoose.model('Assessment');
  const assessment = await Assessment.findById(this.assessmentId);
  
  if (!assessment) {
    throw new Error('Assessment not found');
  }
  
  let totalScore = 0;
  
  this.answers.forEach(answer => {
    const question = assessment.questions[answer.questionIndex];
    if (question && answer.selectedAnswer === question.correctAnswer) {
      totalScore += question.marks;
    }
  });
  
  this.score = totalScore;
  this.totalMarks = assessment.totalMarks;
  this.percentage = Math.round((totalScore / assessment.totalMarks) * 100 * 100) / 100;
  
  return this.score;
};

// Method to add violation
assessmentAttemptSchema.methods.addViolation = async function(type) {
  this.violations.push({ type, timestamp: new Date() });
  
  // Auto-submit after 3 violations
  if (this.violations.length >= 3 && this.status === 'in-progress') {
    this.status = 'auto-submitted';
    this.submittedAt = new Date();
    await this.calculateScore();
  }
  
  await this.save();
  return this.violations.length;
};

// Pre-save hook to ensure submitted attempts have a submittedAt date
assessmentAttemptSchema.pre('save', function(next) {
  if ((this.status === 'submitted' || this.status === 'auto-submitted') && !this.submittedAt) {
    this.submittedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
