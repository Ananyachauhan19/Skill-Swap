const mongoose = require('mongoose');

const internEmployeeActivitySchema = new mongoose.Schema({
  internEmployeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InternEmployee',
    required: true,
    index: true,
  },
  activityType: {
    type: String,
    enum: ['intern_added', 'intern_edited', 'intern_deleted'],
    required: true,
  },
  internId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intern',
  },
  internName: String,
  internEmployeeCode: String,
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('InternEmployeeActivity', internEmployeeActivitySchema);
