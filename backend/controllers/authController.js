const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/sendMail');

exports.register = async (req, res) => {
  const { firstName, lastName, email, phone, gender, password, username, skillsToTeach, skillsToLearn } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'Email already registered' });
  const usernameExists = await User.findOne({ username });
  if (usernameExists) return res.status(400).json({ message: 'Username already taken' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    firstName, lastName, email, phone, gender, password: hashedPassword,
    username, skillsToTeach, skillsToLearn,
    silverCoins: 100,
    goldCoins: 0,
  });

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

  // Generate JWT token after successful OTP verification
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

  console.log('Generated token:', token.substring(0, 20) + '...');

  // Set token as httpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  console.log('Token cookie set successfully');

  return res.status(200).json({ message: 'Login successful', user });
};

// Add logout controller
exports.logout = (req, res) => {
  res.clearCookie('token', { path: '/' }); // Ensure token cookie is cleared globally
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
          if (!skill.subject || !skill.topic || !skill.subtopic) {
            return res.status(400).json({ message: 'Each teaching skill must include subject, topic, and subtopic' });
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