const mongoose = require('mongoose');

const campusAmbassadorActivitySchema = new mongoose.Schema({
  ambassadorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampusAmbassador',
    required: true,
    index: true,
  },
  activityType: {
    type: String,
    enum: ['institute_added', 'institute_edited', 'student_added', 'reward_distributed'],
    required: true,
  },
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
  },
  instituteName: String,
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('CampusAmbassadorActivity', campusAmbassadorActivitySchema);
