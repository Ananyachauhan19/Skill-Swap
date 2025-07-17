const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  
  console.log('requireAuth - Headers:', req.headers);
  console.log('requireAuth - Cookies:', req.cookies);
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
    console.log('Token from Authorization header:', token.substring(0, 20) + '...');
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('Token from cookies:', token.substring(0, 20) + '...');
  }

  if (!token) {
    console.log('No token found');
    return res.status(401).json({ message: 'Authorization token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      console.log('User not found for ID:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('User authenticated successfully:', user._id);
    req.user = user;
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = requireAuth;
