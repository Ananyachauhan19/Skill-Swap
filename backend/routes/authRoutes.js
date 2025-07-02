const express = require('express');
const passport = require('passport');
const {
  register,
  login,
  verifyOtp
} = require('../controllers/authController');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');



const router = express.Router();

// Email-based
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);


// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/auth/failure'
}), async (req, res) => {
  try {
    const profile = req.user;

    if (!profile || !profile.email) {
      console.error('Missing Google profile or email');
      return res.redirect('/auth/failure');
    }

    let user = await User.findOne({ email: profile.email });

    if (!user) {
      user = await User.create({
        firstName: profile.firstName || profile.name || '',
        lastName: profile.lastName || '',
        email: profile.email,
        googleId: profile.googleId || profile.id,
        provider: 'google'
      });
    }

    const token = generateToken(user);

    res.redirect(`http://localhost:5173/home?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
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
    res.redirect(`http://localhost:5173/home?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  } catch (error) {
    console.error(error);
    res.redirect('/auth/failure');
  }
});

module.exports = router;
