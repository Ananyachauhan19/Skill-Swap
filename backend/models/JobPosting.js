const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema({
  jobTitle: {
    type: String,
    required: true,
    trim: true
  },
  jobType: {
    type: String,
    required: true,
    enum: ['Internship', 'Full-Time', 'Part-Time', 'Contract', 'Freelance']
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 200
  },
  requirements: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: 'Remote'
  },
  department: {
    type: String,
    default: ''
  },
  releaseDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
jobPostingSchema.index({ isActive: 1, releaseDate: -1 });
jobPostingSchema.index({ jobType: 1, isActive: 1 });

module.exports = mongoose.model('JobPosting', jobPostingSchema);
