const mongoose = require('mongoose');

const recruitmentApplicationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true },
  age: { type: Number, required: true, min: 18, max: 100 },
  currentRole: { 
    type: String, 
    required: true, 
    enum: ['school-teacher', 'college-faculty'],
  },
  institutionName: { type: String, required: true, trim: true },
  yearsOfExperience: { type: Number, required: true, min: 0 },
  degreeCertificateUrl: { type: String, required: true },
  proofOfExperienceUrl: { type: String, required: true },
  selectedClasses: [{ type: String, required: true }],
  selectedSubjects: [{ type: String, required: true }],
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  assignedEmployeeId: { type: String },
  createdEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
}, {
  timestamps: true
});

// Index for efficient queries
recruitmentApplicationSchema.index({ user: 1 });
recruitmentApplicationSchema.index({ status: 1, submittedAt: -1 });

module.exports = mongoose.model('RecruitmentApplication', recruitmentApplicationSchema);
