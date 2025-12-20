const mongoose = require('mongoose');

const deviceSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    revoked: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'lastActive' },
  }
);

module.exports = mongoose.model('DeviceSession', deviceSessionSchema);
