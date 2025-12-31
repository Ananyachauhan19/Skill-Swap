const mongoose = require('mongoose');

const instituteRewardTransactionSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true
  },
  instituteName: {
    type: String,
    required: true
  },
  ambassadorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampusAmbassador',
    required: true
  },
  ambassadorName: {
    type: String,
    required: true
  },
  ambassadorEmail: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['EXCEL_UPLOAD', 'DISTRIBUTE', 'MANUAL_ADD', 'MANUAL_UPDATE', 'MANUAL_ASSIGN'],
    required: true
  },
  perStudentSilver: {
    type: Number,
    default: 0,
    min: 0
  },
  perStudentGolden: {
    type: Number,
    default: 0,
    min: 0
  },
  totalStudentsCount: {
    type: Number,
    required: true,
    min: 0
  },
  totalSilverDistributed: {
    type: Number,
    default: 0,
    min: 0
  },
  totalGoldenDistributed: {
    type: Number,
    default: 0,
    min: 0
  },
  remarks: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  distributionDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
instituteRewardTransactionSchema.index({ instituteId: 1, distributionDate: -1 });
instituteRewardTransactionSchema.index({ ambassadorId: 1, distributionDate: -1 });

module.exports = mongoose.model('InstituteRewardTransaction', instituteRewardTransactionSchema);
