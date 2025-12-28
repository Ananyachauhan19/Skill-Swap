const CampusAmbassador = require('../models/CampusAmbassador');

module.exports = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const ambassador = await CampusAmbassador.findOne({ user: req.user._id || req.user.id });

    if (!ambassador) {
      return res.status(403).json({ message: 'Campus Ambassador access required' });
    }

    // Check if campus ambassador needs to change password
    if (ambassador.isFirstLogin) {
      return res.status(403).json({
        message: 'Password change required',
        requiresPasswordChange: true,
        isFirstLogin: true,
      });
    }

    // Attach ambassador profile for downstream handlers if needed
    req.campusAmbassador = ambassador;
    next();
  } catch (err) {
    console.error('[requireCampusAmbassador] Error checking ambassador status:', err);
    return res.status(500).json({ message: 'Failed to verify campus ambassador access' });
  }
};
