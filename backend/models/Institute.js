const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema({
  instituteName: {
    type: String,
    required: true,
    trim: true
  },
  instituteId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  goldCoins: {
    type: Number,
    default: 0,
    min: 0
  },
  silverCoins: {
    type: Number,
    default: 0,
    min: 0
  },
  perStudentGoldCoins: {
    type: Number,
    default: 0,
    min: 0
  },
  perStudentSilverCoins: {
    type: Number,
    default: 0,
    min: 0
  },
  campusBackgroundImage: {
    type: String,
    default: null
  },
  instituteType: {
    type: String,
    enum: ['school', 'college'],
    required: true
  },
  campusAmbassador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Email of the campus ambassador who created/manages this institute
  campusAmbassadorEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  // Optional list of student user references associated with this institute
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  studentsCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
instituteSchema.index({ instituteId: 1 });
instituteSchema.index({ campusAmbassador: 1 });
instituteSchema.index({ campusAmbassadorEmail: 1 });

module.exports = mongoose.model('Institute', instituteSchema);
