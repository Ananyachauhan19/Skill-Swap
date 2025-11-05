const express = require('express');
const router = express.Router();

const Contribution = require('../models/Contribution');
const ChatMessage = require('../models/Chat');
const SessionRequest = require('../models/SessionRequest');
const SkillMate = require('../models/SkillMate');
const requireAdmin = require('../middleware/requireAdmin');

// Utils
const toDateKeyUTC = (date) => {
	const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

const getUTCDayBounds = (date) => {
	const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
	const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
	return { start, end };
};

// Core recompute worker: aggregates contribution sources for a single UTC day
async function recomputeContributionsForDate(targetDate) {
	const { start, end } = getUTCDayBounds(targetDate);
	const dateKey = toDateKeyUTC(targetDate);

	// Aggregate per-user counts from different sources
	const tallies = new Map(); // userId(str) -> { count, breakdown }

	const bump = (userId, field, inc = 1) => {
		if (!userId) return;
		const key = String(userId);
		if (!tallies.has(key)) tallies.set(key, { count: 0, breakdown: { chatMessages: 0, sessionRequests: 0, ratings: 0, skillMateApprovals: 0 } });
		const entry = tallies.get(key);
		entry.count += inc;
		entry.breakdown[field] += inc;
	};

	// 1) Chat messages sent on that day
	const chatPipeline = [
		{ $match: { createdAt: { $gte: start, $lte: end } } },
		{ $group: { _id: '$senderId', cnt: { $sum: 1 } } },
	];
	const chatAgg = await ChatMessage.aggregate(chatPipeline);
	chatAgg.forEach(row => bump(row._id, 'chatMessages', row.cnt));

	// 2) Session requests created by requester on that day
	const reqPipeline = [
		{ $match: { createdAt: { $gte: start, $lte: end } } },
		{ $group: { _id: '$requester', cnt: { $sum: 1 } } },
	];
	const reqAgg = await SessionRequest.aggregate(reqPipeline);
	reqAgg.forEach(row => bump(row._id, 'sessionRequests', row.cnt));

	// 3) Ratings given on that day by requester and tutor
	const ratingRequesterPipeline = [
		{ $match: { ratedByRequesterAt: { $gte: start, $lte: end }, ratingByRequester: { $ne: null } } },
		{ $group: { _id: '$requester', cnt: { $sum: 1 } } },
	];
	const ratingTutorPipeline = [
		{ $match: { ratedByTutorAt: { $gte: start, $lte: end }, ratingByTutor: { $ne: null } } },
		{ $group: { _id: '$tutor', cnt: { $sum: 1 } } },
	];
	const [ratingReqAgg, ratingTutorAgg] = await Promise.all([
		SessionRequest.aggregate(ratingRequesterPipeline),
		SessionRequest.aggregate(ratingTutorPipeline),
	]);
	ratingReqAgg.forEach(row => bump(row._id, 'ratings', row.cnt));
	ratingTutorAgg.forEach(row => bump(row._id, 'ratings', row.cnt));

	// 4) SkillMate approvals (count for both requester and recipient on approval date)
	const smPipeline = [
		{ $match: { updatedAt: { $gte: start, $lte: end }, status: 'approved' } },
		{ $project: { requester: 1, recipient: 1 } },
	];
	const smDocs = await SkillMate.aggregate(smPipeline);
	smDocs.forEach(doc => {
		bump(doc.requester, 'skillMateApprovals', 1);
		bump(doc.recipient, 'skillMateApprovals', 1);
	});

	// Upsert tallies into Contribution collection
	if (tallies.size === 0) return { dateKey, upserts: 0 };

	const ops = Array.from(tallies.entries()).map(([userId, { count, breakdown }]) => ({
		updateOne: {
			filter: { userId, dateKey },
			update: { $set: { count, breakdown } },
			upsert: true,
		}
	}));

	const res = await Contribution.bulkWrite(ops, { ordered: false });
	return { dateKey, upserts: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
}

// GET /api/contributions/:userId?rangeDays=365 -> { items: [{date, count}], rangeDays }
router.get('/:userId', async (req, res) => {
	try {
		const { userId } = req.params;
		const rangeDays = Math.min(parseInt(req.query.rangeDays || '365', 10) || 365, 366);

		// Build range of date keys (UTC) ending today
		const todayUTC = new Date();
		const items = [];
		const dateKeys = [];
		for (let i = rangeDays - 1; i >= 0; i--) {
			const d = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate()));
			d.setUTCDate(d.getUTCDate() - i);
			dateKeys.push(toDateKeyUTC(d));
		}

		const docs = await Contribution.find({ userId, dateKey: { $in: dateKeys } }).lean();
		const map = new Map(docs.map(d => [d.dateKey, d.count]));

		dateKeys.forEach(k => {
			items.push({ date: k, count: map.get(k) || 0 });
		});

		res.json({ items, rangeDays });
	} catch (err) {
		console.error('Error fetching contributions:', err);
		res.status(500).json({ message: 'Failed to fetch contributions' });
	}
});

// POST /api/contributions/recompute  body: { date?: 'YYYY-MM-DD' }
router.post('/recompute', requireAdmin, async (req, res) => {
	try {
		let targetDate;
		if (req.body && req.body.date) {
			const [y, m, d] = req.body.date.split('-').map(Number);
			if (!y || !m || !d) return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
			targetDate = new Date(Date.UTC(y, m - 1, d));
		} else {
			// default to yesterday UTC
			const now = new Date();
			targetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
			targetDate.setUTCDate(targetDate.getUTCDate() - 1);
		}

		const result = await recomputeContributionsForDate(targetDate);
		res.json({ message: 'Recompute complete', dateKey: toDateKeyUTC(targetDate), ...result });
	} catch (err) {
		console.error('Error recomputing contributions:', err);
		res.status(500).json({ message: 'Failed to recompute contributions' });
	}
});

// Export the worker for scheduler use
router.recomputeContributionsForDate = recomputeContributionsForDate;

module.exports = router;

