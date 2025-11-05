const mongoose = require('mongoose');

// Records a unique contribution event per user (e.g., session-completed:123)
// Unique compound index (userId, key) ensures idempotency per activity
const ContributionEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  key: { type: String, required: true }, // e.g., session-completed:SESSION_ID
  dateKey: { type: String, required: true }, // YYYY-MM-DD (UTC)
}, { timestamps: true });

ContributionEventSchema.index({ userId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('ContributionEvent', ContributionEventSchema);
