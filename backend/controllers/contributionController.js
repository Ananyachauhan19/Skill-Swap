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

// GET /api/contributions/:userId?days=365
exports.getByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const days = req.query.days ? parseInt(req.query.days, 10) : 365;
    const { startUtc, endUtc } = startEndForDays(days);

    // Try to read from stored contributions first
    const docs = await Contribution.find({ user: userId, date: { $gte: startUtc, $lte: endUtc } }).select('date count');
    const map = {};
    // initialize zeroes for full range
    for (let d = new Date(startUtc); d <= endUtc; d.setUTCDate(d.getUTCDate() + 1)) {
      const k = d.toISOString().split('T')[0];
      map[k] = 0;
    }
    for (const doc of docs) {
      const k = new Date(doc.date).toISOString().split('T')[0];
      map[k] = doc.count || 0;
    }

    // If cache looks empty, compute on-demand as fallback
    const hasAny = docs && docs.length > 0;
    if (!hasAny) {
      const computed = await computeRangeForUser(userId, startUtc, endUtc);
      for (const [k, v] of Object.entries(computed)) {
        map[k] = v || 0;
      }
    }

    return res.json({ userId, days, contributions: map });
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
