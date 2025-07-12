const express = require('express');
const passport = require('passport');
const {
  register,
  login,
  verifyOtp
} = require('../controllers/authController');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');


const router = express.Router();

// Email-based
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/logout', require('../controllers/authController').logout);


// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/auth/failure'
}), async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.email) {
      console.error('Missing Google user or email');
      return res.redirect('/auth/failure');
    }

    const token = generateToken(user);

    // Use a fixed frontend URL for redirect
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/home?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  } catch (error) {
    console.error('OAuth error:', error);
    res.redirect('/auth/failure');
  }
});



router.get('/success', (req, res) => {
  res.send('Google login successful!');

});

router.get('/failure', (req, res) => {
  res.send('Google login failed.');
});



// LinkedIn OAuth
router.get('/linkedin', passport.authenticate('linkedin'));

router.get('/linkedin/callback', passport.authenticate('linkedin', {
  failureRedirect: '/auth/failure'
}), async (req, res) => {
  try {
    const user = req.user;
    const token = generateToken(user);
    
    // Get the origin from the request to determine the frontend URL
    const origin = req.get('origin') || req.get('referer') || 'http://localhost:5173';
    const frontendUrl = origin.includes('localhost') ? 'http://localhost:5173' : origin.replace(/\/$/, '');
    
    res.redirect(`${frontendUrl}/home?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  } catch (error) {
    console.error(error);
    res.redirect('/auth/failure');
  }
});

// Test endpoint to check socket connection
router.get('/coins', requireAuth, async (req, res) => {
  try {
    // For now, return default coins. You can implement actual coin logic later
    res.json({
      golden: 100, // Default golden coins
      silver: 50   // Default silver coins
    });
  } catch (error) {
    console.error('Coins error:', error);
    res.status(500).json({ error: 'Failed to fetch coins' });
  }
});

module.exports = router;
