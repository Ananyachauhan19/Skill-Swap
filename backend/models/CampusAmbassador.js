const mongoose = require('mongoose');

const campusAmbassadorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  isFirstLogin: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // admin who created
}, {
  timestamps: true,
});

module.exports = mongoose.model('CampusAmbassador', campusAmbassadorSchema);
