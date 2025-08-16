const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/sendMail');

// Helper function for cookie options
const getCookieOptions = () => ({
  path: '/',
  domain: process.env.NODE_ENV === 'production' ? '.skillswaphub.in' : undefined,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000 // 1 day
});

exports.register = async (req, res) => {
  const { firstName, lastName, email, phone, gender, password, username, skillsToTeach, skillsToLearn } = req.body;
  
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already registered' });
    
    const usernameExists = await User.findOne({ username });
    if (usernameExists) return res.status(400).json({ message: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName, lastName, email, phone, gender, 
      password: hashedPassword, username, 
      skillsToTeach, skillsToLearn,
      silverCoins: 100,
      goldCoins: 0,
    });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    await sendOtpEmail(user.email, otp);

    res.status(201).json({ 
      message: 'User registered successfully. OTP sent to email.', 
      otpSent: true 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    await sendOtpEmail(user.email, otp);

    return res.status(200).json({ 
      message: 'OTP sent to email', 
      otpSent: true 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || String(user.otp) !== String(otp) || Date.now() > user.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Ensure coins are set
    let updated = false;
    if (typeof user.silverCoins !== 'number' || user.silverCoins < 100) {
      user.silverCoins = 100;
      updated = true;
    }
    if (typeof user.goldCoins !== 'number') {
      user.goldCoins = 0;
      updated = true;
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate JWT token
    const isAdmin = user.email === 'skillswaphubb@gmail.com';
    const token = jwt.sign({ 
      id: user._id, 
      isAdmin 
    }, process.env.JWT_SECRET, { 
      expiresIn: '1d' 
    });

    // Set secure cookie
    res.cookie('token', token, getCookieOptions());

    // Return user data (excluding sensitive info)
    const userData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      isAdmin,
      silverCoins: user.silverCoins,
      goldCoins: user.goldCoins
    };

    return res.status(200).json({ 
      message: 'Login successful', 
      user: userData 
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

exports.logout = (req, res) => {
  try {
    // Clear token cookie
    res.clearCookie('token', getCookieOptions());
    
    // Clear any client-side user cookie
    res.clearCookie('user', {
      ...getCookieOptions(),
      httpOnly: false
    });

    // Optionally destroy session if using sessions
    if (req.session) {
      req.session.destroy(err => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });
    }

    res.status(200).json({ 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      message: 'Server error during logout' 
    });
  }
};

exports.profile = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const user = await User.findById(req.user.id)
        .select('-password -otp -otpExpires');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json(user);
      
    } else if (req.method === 'PUT') {
      const { username, role, skillsToTeach, skillsToLearn } = req.body;

      // Validate input
      if (!username || !username.trim()) {
        return res.status(400).json({ message: 'Username is required' });
      }
      if (!['teacher', 'learner', 'both'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      if ((role === 'teacher' || role === 'both') && 
          (!Array.isArray(skillsToTeach) || skillsToTeach.length === 0)) {
        return res.status(400).json({ 
          message: 'At least one teaching skill is required' 
        });
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          username,
          role,
          skillsToTeach: role === 'learner' ? [] : skillsToTeach || [],
          skillsToLearn: role === 'teacher' ? [] : skillsToLearn || [],
        },
        { new: true, runValidators: true }
      ).select('-password -otp -otpExpires');

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json(updatedUser);
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      details: error.message 
    });
  }
};