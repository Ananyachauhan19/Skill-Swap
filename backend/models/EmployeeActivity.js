const mongoose = require('mongoose');

const employeeActivitySchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    applicationType: {
      type: String,
      enum: ['tutor', 'interview'],
      required: true,
    },
    // Snapshot of the employee role context at the time of action
    roleType: {
      type: String,
      enum: ['tutor', 'interview', 'both'],
      required: true,
    },
    // Optional scope info (primarily for tutor applications)
    class: {
      type: String,
    },
    subject: {
      type: String,
    },
    status: {
      type: String,
      enum: ['approved', 'rejected'],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Each employee/application pair should only have one latest action document.
employeeActivitySchema.index({ employee: 1, applicationId: 1, applicationType: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeActivity', employeeActivitySchema);
