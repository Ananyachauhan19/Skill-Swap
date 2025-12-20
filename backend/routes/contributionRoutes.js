const express = require('express');
const router = express.Router();

const Contribution = require('../models/Contribution');
const SessionRequest = require('../models/SessionRequest');
const SkillMate = require('../models/SkillMate');
const InterviewRequest = require('../models/InterviewRequest');
const requireAdmin = require('../middleware/requireAdmin');

// Utils
const toDateKeyUTC = (date) => {
	const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	return d.toISOString().slice(0, 10); 
};

const getUTCDayBounds = (date) => {
	const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
	const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
	return { start, end };
};

// Core recompute worker: aggregates contribution sources for a single UTC day
async function recomputeContributionsForDate(targetDate) {
	// Ensure legacy index on { user, date } does not block bulkWrite
	try {
		await Contribution.collection.dropIndex('user_1_date_1');
	} catch (e) {
		// Ignore if index is already dropped or missing
	}

	const { start, end } = getUTCDayBounds(targetDate);
	const dateKey = toDateKeyUTC(targetDate);

		// Aggregate per-user counts from different sources (aligned with 'one activity = one increment per user')
	const tallies = new Map(); // userId(str) -> { count, breakdown }

	const bump = (userId, field, inc = 1) => {
		if (!userId) return;
		const key = String(userId);
			if (!tallies.has(key)) tallies.set(key, { count: 0, breakdown: { sessionsCompletedEarned: 0, sessionsCompletedSpent: 0, interviewsRated: 0, skillMateApprovals: 0 } });
		const entry = tallies.get(key);
		entry.count += inc;
		entry.breakdown[field] += inc;
	};

		// 1) Completed one-on-one sessions (endedAt on the target day)
		const completedMatch = { status: 'completed', endedAt: { $gte: start, $lte: end } };
		const tutorAgg = await SessionRequest.aggregate([
			{ $match: completedMatch },
			{ $group: { _id: '$tutor', cnt: { $sum: 1 } } }
		]);
		tutorAgg.forEach(row => bump(row._id, 'sessionsCompletedEarned', row.cnt));

		const requesterAgg = await SessionRequest.aggregate([
			{ $match: completedMatch },
			{ $group: { _id: '$requester', cnt: { $sum: 1 } } }
		]);
		requesterAgg.forEach(row => bump(row._id, 'sessionsCompletedSpent', row.cnt));

		// 2) SkillMate approvals (count for both requester and recipient on approval date)
	const smPipeline = [
		{ $match: { updatedAt: { $gte: start, $lte: end }, status: 'approved' } },
		{ $project: { requester: 1, recipient: 1 } },
	];
	const smDocs = await SkillMate.aggregate(smPipeline);
	smDocs.forEach(doc => {
		bump(doc.requester, 'skillMateApprovals', 1);
		bump(doc.recipient, 'skillMateApprovals', 1);
	});

		// 3) Interviews completed
		const ivAgg = await InterviewRequest.aggregate([
			{
				$match: {
					$or: [
						{ ratedAt: { $gte: start, $lte: end } },
						{
							status: 'completed',
							// unrated but completed on this day
							ratedAt: null,
							updatedAt: { $gte: start, $lte: end },
						},
					],
				},
			},
			{ $project: { requester: 1, assignedInterviewer: 1 } },
		]);
		ivAgg.forEach(doc => {
			if (doc.requester) bump(doc.requester, 'interviewsRated', 1);
			if (doc.assignedInterviewer) bump(doc.assignedInterviewer, 'interviewsRated', 1);
		});

	// Upsert tallies into Contribution collection
	if (tallies.size === 0) return { dateKey, upserts: 0 };

	const ops = Array.from(tallies.entries()).map(([userId, { count, breakdown }]) => ({
		updateOne: {
			filter: { userId, dateKey },
			update: {
				$set: {
					count,
					breakdown,
					// Also hydrate legacy fields used by old unique index (user, date)
					user: userId,
					date: dateKey,
				},
			},
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

		let docs = await Contribution.find({ userId, dateKey: { $in: dateKeys } }).lean();
		let totalExisting = docs.reduce((sum, d) => sum + (d.count || 0), 0);
		
		if (!docs.length || totalExisting === 0) {
			try {
				for (let i = 0; i < rangeDays; i++) {
					const d = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate()));
					d.setUTCDate(d.getUTCDate() - i);
					// eslint-disable-next-line no-await-in-loop
					await recomputeContributionsForDate(d);
				}
				// Re-query after backfill
				docs = await Contribution.find({ userId, dateKey: { $in: dateKeys } }).lean();
				totalExisting = docs.reduce((sum, d) => sum + (d.count || 0), 0);
				console.log('[Contributions] Auto-backfill complete for user', userId, 'total=', totalExisting);
			} catch (e) {
				console.error('Error during auto-backfill of contributions:', e);
			}
		}
		const map = new Map(docs.map(d => [d.dateKey, d.count]));

		let activeDays = 0;
		let oneOnOneSessions = 0;
		let interviewSessions = 0;
		let totalOneOnOneAsTutor = 0;
		let totalOneOnOneAsLearner = 0;
		let skillMateConnections = 0;
		let dailyLogins = 0;
		let questionsPosted = 0;
		let videosUploaded = 0;

		for (const d of docs) {
			if ((d.count || 0) > 0) activeDays += 1;
			const b = d.breakdown || {};
			const asTutor = b.sessionsAsTutor || b.sessionsCompletedEarned || 0;
			const asLearner = b.sessionsAsLearner || b.sessionsCompletedSpent || 0;
			totalOneOnOneAsTutor += asTutor;
			totalOneOnOneAsLearner += asLearner;
			oneOnOneSessions += asTutor + asLearner;
			// Prefer new field; fall back to older interviewsRated if needed
			interviewSessions += (b.interviewsCompleted || 0) + (b.interviewsRated || 0);
			// New activity types
			skillMateConnections += (b.skillmatesAdded || b.skillMateApprovals || 0);
			dailyLogins += (b.dailyLogins || 0);
			questionsPosted += (b.questionsPosted || 0);
			videosUploaded += (b.videosUploaded || 0);
		}

		dateKeys.forEach(k => {
			items.push({ date: k, count: map.get(k) || 0 });
		});

		res.json({
			items,
			rangeDays,
			stats: {
				activeDays,
				totalDays: dateKeys.length,
				oneOnOneSessions,
				oneOnOneAsTutor: totalOneOnOneAsTutor,
				oneOnOneAsLearner: totalOneOnOneAsLearner,
				interviewSessions,
				skillMateConnections,
				dailyLogins,
				questionsPosted,
				videosUploaded,
			},
		});
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

