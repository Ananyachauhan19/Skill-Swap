const mongoose = require('mongoose');

// Stores per-user contribution counts aggregated by calendar day (UTC YYYY-MM-DD)
// Unique on (userId, dateKey) so we can upsert daily totals efficiently
const ContributionSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	// Date key in format YYYY-MM-DD (UTC). Keep as string for easy range queries and to avoid TZ drift.
	dateKey: { type: String, required: true },
	count: { type: Number, default: 0, min: 0 },
	// Optional breakdown of sources for debugging/insights (not required by UI)
	breakdown: {
		chatMessages: { type: Number, default: 0 },
		sessionRequests: { type: Number, default: 0 },
		ratings: { type: Number, default: 0 },
		skillMateApprovals: { type: Number, default: 0 },
		// Extended fields for real-time activity & coin events
		sessionsCreated: { type: Number, default: 0 },
		sessionsCompletedEarned: { type: Number, default: 0 },
		sessionsCompletedSpent: { type: Number, default: 0 },
		interviewsRequested: { type: Number, default: 0 },
		interviewsRated: { type: Number, default: 0 },
			interviewsScheduled: { type: Number, default: 0 },
			sessionsStarted: { type: Number, default: 0 },
		coinsEarnedGold: { type: Number, default: 0 },
		coinsEarnedSilver: { type: Number, default: 0 },
		coinsSpentGold: { type: Number, default: 0 },
		coinsSpentSilver: { type: Number, default: 0 },
	},
}, { timestamps: true });

ContributionSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model('Contribution', ContributionSchema);

