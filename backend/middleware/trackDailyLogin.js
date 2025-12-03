const { trackDailyLogin } = require('../utils/contributions');

/**
 * Middleware to automatically track daily login for authenticated users
 * Place this after requireAuth middleware in routes that indicate user activity
 */
module.exports = async function trackDailyLoginMiddleware(req, res, next) {
  try {
    if (req.user && req.user.id) {
      const io = req.app.get('io');
      // Track daily login (idempotent - only counts once per day)
      await trackDailyLogin({
        userId: req.user.id,
        when: new Date(),
        io
      });
    }
  } catch (error) {
    // Non-blocking - don't fail the request if tracking fails
    console.error('[trackDailyLogin] Error tracking daily login:', error);
  }
  next();
};
