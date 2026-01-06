const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DeviceSession = require('../models/DeviceSession');

const requireAuth = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    console.log('No token found');
    return res.status(401).json({ message: 'Authorization token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optional device-session check (newer tokens include sessionId)
    if (decoded.sessionId) {
      try {
        const session = await DeviceSession.findById(decoded.sessionId);
        if (!session || session.revoked) {
          console.log('Device session invalid or revoked for ID:', decoded.sessionId);
          return res.status(401).json({ message: 'This device has been logged out. Please login again.' });
        }
        if (String(session.user) !== String(decoded.id)) {
          console.log('Device session user mismatch:', { sessionUser: session.user, tokenUser: decoded.id });
          return res.status(401).json({ message: 'Session mismatch. Please login again.' });
        }
        // Update last active timestamp
        session.lastActive = new Date();
        await session.save().catch(() => {});
        req.sessionId = session._id.toString();
      } catch (e) {
        console.log('Device session lookup failed:', e.message);
        return res.status(401).json({ message: 'Session validation failed. Please login again.' });
      }
    }
    
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = requireAuth;
