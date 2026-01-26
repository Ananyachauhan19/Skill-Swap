const mongoose = require('mongoose');

const certificateTemplateSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['joining_letter', 'hiring_certificate', 'completion_certificate'],
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  htmlContent: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Ensure only one active template per type
certificateTemplateSchema.pre('save', async function(next) {
  if (this.isActive && this.isModified('isActive')) {
    await this.constructor.updateMany(
      { type: this.type, _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

module.exports = mongoose.model('CertificateTemplate', certificateTemplateSchema);
