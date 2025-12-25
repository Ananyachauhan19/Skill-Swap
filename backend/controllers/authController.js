const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/sendMail');
const { trackDailyLogin } = require('../utils/contributions');
const DeviceSession = require('../models/DeviceSession');
const AnonymousVisitor = require('../models/AnonymousVisitor');

exports.register = async (req, res) => {
  const { firstName, lastName, email, phone, gender, password, username, role, skillsToTeach, skillsToLearn } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'Email already registered' });
  const usernameExists = await User.findOne({ username });
  if (usernameExists) return res.status(400).json({ message: 'Username already taken' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    firstName, lastName, email, phone, gender, password: hashedPassword,
    username, role, skillsToTeach, skillsToLearn,
    silverCoins: 100,
    goldCoins: 0,
  });

  // Link current anonymous visitor session (if any) to this new user for conversion analytics
  try {
    const visitorId = req.cookies?.visitor_id;
    if (visitorId) {
      await AnonymousVisitor.findOneAndUpdate(
        { visitorId, isConverted: false },
        { 
          isConverted: true, 
          convertedUserId: user._id, 
          convertedAt: new Date() 
        }
      );
    }
  } catch (e) {
    console.error('[AnonymousVisitor] Failed to record conversion on register:', e.message || e);
  }

  // Generate OTP for email verification
  const otp = Math.floor(100000 + Math.random() * 900000);
  const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save()
    .then(() => console.log('OTP saved for registration:', otp))
    .catch((err) => console.error('Error saving OTP:', err));

  // Send OTP to user's email
  await sendOtpEmail(user.email, otp);

  res.status(201).json({ message: 'User registered successfully. OTP sent to email.', otpSent: true });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Email not found' });

  const isMatch = await bcrypt.compare(password, user.password || '');
  if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

  // Step 2: Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save()
    .then(() => console.log('OTP saved:', otp))
    .catch((err) => console.error('Error saving OTP:', err));
  // Step 3: Send OTP to user's email
  await sendOtpEmail(user.email, otp);

  return res.status(200).json({ message: 'OTP sent to email', otpSent: true });
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  console.log('OTP verification request:', { email, otp });

  const user = await User.findOne({ email });
  if (!user || String(user.otp) !== String(otp) || Date.now() > user.otpExpires) {
    console.log('OTP verification failed:', { 
      userExists: !!user, 
      otpMatch: user ? String(user.otp) === String(otp) : false,
      otpExpired: user ? Date.now() > user.otpExpires : false
    });
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  console.log('OTP verification successful for user:', user._id);

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
  if (updated) await user.save();

  // Clear OTP
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  // Track daily login (contribution calendar)
  try {
    await trackDailyLogin({
      userId: user._id,
      when: new Date()
    });
  } catch (error) {
    console.error('Error tracking daily login:', error);
  }

  // Mark anonymous visitor as converted if visitor_id cookie exists
  try {
    const visitorId = req.cookies?.visitor_id;
    if (visitorId) {
      await AnonymousVisitor.findOneAndUpdate(
        { visitorId, isConverted: false },
        { 
          isConverted: true, 
          convertedUserId: user._id, 
          convertedAt: new Date() 
        }
      );
    }
  } catch (e) {
    console.error('[AnonymousVisitor] Failed to record conversion on login:', e.message || e);
  }

  // Create a device session for this login
  let deviceSession;
  try {
    const userAgent = req.get('user-agent') || 'Unknown device';
    const ip =
      (req.headers['x-forwarded-for'] && String(req.headers['x-forwarded-for']).split(',')[0].trim()) ||
      req.ip ||
      '';
    deviceSession = await DeviceSession.create({
      user: user._id,
      userAgent,
      ip,
    });
  } catch (e) {
    console.error('Failed to create device session:', e);
  }

  // Generate JWT token after successful OTP verification
  const isAdmin = user.email === 'skillswaphubb@gmail.com';
  const tokenPayload = { id: user._id, isAdmin };
  if (deviceSession && deviceSession._id) {
    tokenPayload.sessionId = deviceSession._id.toString();
  }
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });


  // Set token as httpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAMESITE,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  // Explicitly select fields to ensure role is included
  const userPayload = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    role: user.role,
    isTutor: user.isTutor || false,
    skillsToTeach: user.skillsToTeach,
    skillsToLearn: user.skillsToLearn,
    silverCoins: user.silverCoins,
    goldCoins: user.goldCoins,
    isAdmin,
  };

  return res.status(200).json({ message: 'Login successful', user: userPayload, token });
};

// Add logout controller
exports.logout = (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.status(200).json({ message: 'Logged out' });
};

// Profile controller
exports.profile = async (req, res) => {
  try {
    if (req.method === 'GET') {
      // Fetch user profile
      const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json(user);
    } else if (req.method === 'PUT') {
      // Update user profile
      const { username, role, skillsToTeach, skillsToLearn } = req.body;

      // Validate username
      if (!username || !username.trim()) {
        return res.status(400).json({ message: 'Username is required' });
      }

      // Validate role
      if (!['teacher', 'learner', 'both'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      // Validate skillsToTeach for teacher or both roles
      if (role === 'teacher' || role === 'both') {
        if (!Array.isArray(skillsToTeach) || skillsToTeach.length === 0) {
          return res.status(400).json({ message: 'At least one teaching skill is required for teacher or both roles' });
        }
        for (const skill of skillsToTeach) {
          if (!skill.subject || !skill.topic) {
            return res.status(400).json({ message: 'Each teaching skill must include subject and topic' });
          }
        }
      }

      // Validate skillsToLearn for learner or both roles
      if (role === 'learner' || role === 'both') {
        if (!Array.isArray(skillsToLearn) || skillsToLearn.some((s) => !s.trim())) {
          return res.status(400).json({ message: 'Skills to learn must be a non-empty array of strings' });
        }
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
    console.error('Error in profile route:', error);
    return res.status(500).json({ message: 'Server error', details: error.message });
  }
};

module.exports = exports;