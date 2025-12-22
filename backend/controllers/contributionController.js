const Contribution = require('../models/Contribution');
const User = require('../models/User');
const { computeRangeForUser } = require('../utils/contributions');

function startEndForDays(days) {
  const end = new Date();
  // normalize end to UTC end of today
  const endUtc = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59, 999));
  const startUtc = new Date(endUtc);
  startUtc.setUTCDate(startUtc.getUTCDate() - (parseInt(days, 10) || 365) + 1);
  startUtc.setUTCHours(0, 0, 0, 0);
  return { startUtc, endUtc };
}

// GET /api/contributions/:userId?days=365&rangeDays=365
exports.getByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const rangeDays = req.query.rangeDays ? parseInt(req.query.rangeDays, 10) : 365;

    // Build dateKey range
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - rangeDays + 1);

    const startKey = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())).toISOString().slice(0, 10);
    const endKey = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate())).toISOString().slice(0, 10);

    // Fetch contributions from database - optimized with projection and lean
    const docs = await Contribution.find({
      userId,
      dateKey: { $gte: startKey, $lte: endKey }
    })
    .select('dateKey count -_id')
    .sort({ dateKey: 1 })
    .lean()
    .exec();

    // Build items array with date and count (no breakdown for performance)
    const items = docs.map(doc => ({
      date: doc.dateKey,
      count: doc.count || 0
    }));

    // Calculate total contributions
    const total = items.reduce((sum, item) => sum + item.count, 0);

    return res.json({
      userId,
      rangeDays,
      total,
      items,
      startDate: startKey,
      endDate: endKey
    });
  } catch (e) {
    console.error('[contributions:getByUserId] error:', e);
    res.status(500).json({ message: 'Failed to get contributions' });
  }
};

// GET /api/contributions/by-username/:username?days=365
exports.getByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('_id');
    if (!user) return res.status(404).json({ message: 'User not found' });
    req.params.userId = user._id.toString();
    return exports.getByUserId(req, res);
  } catch (e) {
    console.error('[contributions:getByUsername] error:', e);
    res.status(500).json({ message: 'Failed to get contributions' });
  }
};

// GET /api/contributions/me?days=365
exports.getMe = async (req, res) => {
  try {
    if (!req.user || !req.user._id) return res.status(401).json({ message: 'Unauthorized' });
    req.params.userId = req.user._id.toString();
    return exports.getByUserId(req, res);
  } catch (e) {
    console.error('[contributions:getMe] error:', e);
    res.status(500).json({ message: 'Failed to get contributions' });
  }
};
