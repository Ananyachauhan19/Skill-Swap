const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Optional authentication - doesn't reject if no token, just sets req.user if valid token exists
const optionalAuth = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    console.log('No token found (optional auth) - continuing without user');
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully for user:', decoded.id);
    
    const user = await User.findById(decoded.id).select('-password');

    if (user) {
      console.log('User authenticated successfully (optional):', user.email);
      req.user = user;
    } else {
      console.log('User not found for ID:', decoded.id);
    }
  } catch (error) {
    console.log('Token verification failed (optional auth):', error.message);
    // Continue without user
  }
  
  next();
};

module.exports = optionalAuth;
