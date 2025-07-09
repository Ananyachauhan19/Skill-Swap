const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/sendMail');

exports.register = async (req, res) => {
  const { firstName, lastName, email, phone, gender, password } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'Email already registered' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ firstName, lastName, email, phone, gender, password: hashedPassword });
  res.status(201).json({ message: 'User registered successfully' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Email not found' });

  const isMatch = await bcrypt.compare(password, user.password || '');
  if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

  // Step 2: Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes+

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

  const user = await User.findOne({ email });
  if (!user || String(user.otp) !== String(otp) || Date.now() > user.otpExpires) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  // Clear OTP
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  // Generate JWT token after successful OTP verification
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

  // Set token as httpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  return res.status(200).json({ message: 'Login successful', user });
};

// Add logout controller
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out' });
};
