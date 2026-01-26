const mongoose = require('mongoose');

const internSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  role: {
    type: String,
    trim: true,
  },
  position: {
    type: String,
    required: true,
    trim: true,
  },
  joiningDate: {
    type: Date,
    required: true,
  },
  internshipDuration: {
    type: Number, // in days
    required: true,
  },
  internEmployeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'terminated'],
    default: 'active',
  },
  employeeOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InternEmployee',
    required: true,
  },
  joiningCertificatePath: {
    type: String,
  },
  completionCertificatePath: {
    type: String,
  },
  completionDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Calculate expected completion date
internSchema.virtual('expectedCompletionDate').get(function() {
  if (!this.joiningDate || !this.internshipDuration) return null;
  const date = new Date(this.joiningDate);
  date.setDate(date.getDate() + this.internshipDuration);
  return date;
});

// Check if internship is completed
internSchema.virtual('isCompleted').get(function() {
  const expectedCompletion = this.expectedCompletionDate;
  if (!expectedCompletion) return false;
  return new Date() >= expectedCompletion;
});

internSchema.set('toJSON', { virtuals: true });
internSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Intern', internSchema);
