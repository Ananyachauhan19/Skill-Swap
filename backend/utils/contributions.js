const Contribution = require('../models/Contribution');

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

module.exports = {
  toDateKeyUTC,
  incrementContribution,
};
