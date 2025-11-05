const Contribution = require('../models/Contribution');
const ContributionEvent = require('../models/ContributionEvent');

function toDateKeyUTC(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return d.toISOString().slice(0, 10);
}

/**
 * Increment a user's contribution count for the UTC day of `when`.
 * Also increments an optional breakdown key and emits a socket event when provided.
 *
 * @param {Object} opts
 * @param {string|ObjectId} opts.userId
 * @param {Date} [opts.when=new Date()]
 * @param {number} [opts.by=1]
 * @param {string} [opts.breakdownKey] - key in Contribution.breakdown to $inc
 * @param {Object} [opts.breakdownIncs] - additional breakdown increments e.g. { coinsEarnedGold: 1 }
 * @param {Object} [opts.io] - socket.io server instance for realtime notification
 */
async function incrementContribution({ userId, when = new Date(), by = 1, breakdownKey, breakdownIncs = {}, io }) {
  if (!userId) return;
  const dateKey = toDateKeyUTC(when);

  const inc = { count: by };
  if (breakdownKey) {
    inc[`breakdown.${breakdownKey}`] = by;
  }
  Object.entries(breakdownIncs || {}).forEach(([k, v]) => {
    inc[`breakdown.${k}`] = (typeof v === 'number' ? v : 1);
  });

  await Contribution.updateOne(
    { userId, dateKey },
    { $inc: inc },
    { upsert: true }
  );

  // Emit realtime update for the user (room named by user _id)
  if (io) {
    try {
      io.to(String(userId)).emit('contribution-updated', { date: dateKey, delta: by });
    } catch (_) {}
  }
  return { dateKey };
}

/**
 * Idempotent record-and-increment. Creates a ContributionEvent(userId,key) first;
 * if it already exists, no-op. Otherwise increments the daily contribution once.
 */
async function recordContributionEvent({ userId, key, when = new Date(), by = 1, breakdownKey, breakdownIncs = {}, io }) {
  if (!userId || !key) return { recorded: false };
  const dateKey = toDateKeyUTC(when);
  try {
    await ContributionEvent.create({ userId, key, dateKey });
  } catch (e) {
    // duplicate -> already recorded
    if (e && e.code === 11000) {
      return { recorded: false, duplicate: true };
    }
    throw e;
  }
  await incrementContribution({ userId, when, by, breakdownKey, breakdownIncs, io });
  return { recorded: true };
}

module.exports = {
  toDateKeyUTC,
  incrementContribution,
  recordContributionEvent,
};
