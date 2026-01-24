const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  jobPosting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Basic Details
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  
  // Education Details
  schoolName: {
    type: String,
    required: true
  },
  schoolBoard: {
    type: String,
    default: ''
  },
  schoolMarks: {
    type: String,
    default: ''
  },
  
  intermediateName: {
    type: String,
    required: true
  },
  intermediateBoard: {
    type: String,
    default: ''
  },
  intermediateMarks: {
    type: String,
    required: true
  },
  
  graduationCollege: {
    type: String,
    required: true
  },
  graduationDegree: {
    type: String,
    required: true
  },
  graduationMarks: {
    type: String,
    required: true
  },
  graduationYear: {
    type: String,
    default: ''
  },
  
  // Optional Post Graduation
  hasPostGraduation: {
    type: Boolean,
    default: false
  },
  postGraduationCollege: {
    type: String,
    default: ''
  },
  postGraduationDegree: {
    type: String,
    default: ''
  },
  postGraduationMarks: {
    type: String,
    default: ''
  },
  postGraduationYear: {
    type: String,
    default: ''
  },
  
  // Resume
  resumeUrl: {
    type: String,
    required: true
  },
  
  // Additional Info
  coverLetter: {
    type: String,
    default: ''
  },
  linkedinUrl: {
    type: String,
    default: ''
  },
  portfolioUrl: {
    type: String,
    default: ''
  },
  
  // Application Status
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewNotes: {
    type: String,
    default: ''
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
jobApplicationSchema.index({ jobPosting: 1, createdAt: -1 });
jobApplicationSchema.index({ email: 1 });
jobApplicationSchema.index({ status: 1 });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
