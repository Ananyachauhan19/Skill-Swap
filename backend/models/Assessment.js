const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length === 4;
      },
      message: 'Must have exactly 4 options (A, B, C, D)'
    }
  },
  correctAnswer: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D'],
    uppercase: true
  },
  marks: {
    type: Number,
    required: true,
    min: 1
  }
});

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    comment: 'Duration in minutes'
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1
  },
  campusAmbassadorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collegeConfigs: [{
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute',
      required: true
    },
    courseId: {
      type: String,
      required: true,
      trim: true
    },
    stream: {
      type: String,
      enum: ['Science', 'Commerce', 'Arts', ''],
      default: ''
    },
    compulsorySemesters: [{
      type: Number,
      min: 1,
      max: 12,
      required: true
    }]
  }],
  // Backward compatibility: keep old config format for migration purposes
  universitySemesterConfig: [{
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute',
      required: true
    },
    courses: [{
      type: String,
      trim: true
    }],
    semesters: [{
      type: Number,
      min: 1,
      max: 12,
      required: true
    }],
    isCompulsory: {
      type: Boolean,
      default: false
    }
  }],
  startTime: {
    type: Date,
    required: false,
    comment: 'Assessment window start time'
  },
  endTime: {
    type: Date,
    required: false,
    comment: 'Assessment window end time'
  },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length >= 1 && arr.length <= 100;
      },
      message: 'Must have between 1 and 100 questions'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  attemptsCount: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
assessmentSchema.index({ campusAmbassadorId: 1, isActive: 1 });
assessmentSchema.index({ instituteIds: 1, isActive: 1 });

// Virtual for number of questions
assessmentSchema.virtual('questionCount').get(function() {
  return this.questions.length;
});

// Method to update statistics
assessmentSchema.methods.updateStatistics = async function() {
  const AssessmentAttempt = mongoose.model('AssessmentAttempt');
  const attempts = await AssessmentAttempt.find({ 
    assessmentId: this._id,
    status: 'submitted'
  });
  
  this.attemptsCount = attempts.length;
  
  if (attempts.length > 0) {
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    this.averageScore = Math.round((totalScore / attempts.length) * 100) / 100;
  }
  
  await this.save();
};

module.exports = mongoose.model('Assessment', assessmentSchema);
