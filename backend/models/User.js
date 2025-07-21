const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  email: { type: String, unique: true, required: false },
  phone: { type: String, required: false },
  gender: { type: String, required: false },
  password: { type: String, required: false }, // optional if Google user
  googleId: { type: String, required: false },
  socketId: { type: String, required: false },
  username: { type: String, unique: true, required: true },
  otp: { type: String, required: false },
  otpExpires: { type: Date, required: false },
  role: {
    type: String,
    enum: ['teacher', 'learner', 'both'],
    default: 'learner',
    required: false,
  },
  skillsToTeach: [
    {
      subject: { type: String, required: false },
      topic: { type: String, required: false },
      subtopic: { type: String, required: false },
    },
  ],
  skillsToLearn: [{ type: String, default: [], required: false }],
  bio: { type: String, default: '', required: false },
  country: { type: String, default: '', required: false },
  profilePic: { type: String, default: '', required: false },
  education: [
    {
      course: { type: String, required: false },
      branch: { type: String, required: false },
      college: { type: String, required: false },
      city: { type: String, required: false },
      passingYear: { type: String, required: false },
    },
  ],
  experience: [
    {
      company: { type: String, required: false },
      position: { type: String, required: false },
      duration: { type: String, required: false },
      description: { type: String, required: false },
    },
  ],
  certificates: [
    {
      name: { type: String, required: false },
      issuer: { type: String, required: false },
      date: { type: String, required: false },
      url: { type: String, required: false },
    },
  ],
  linkedin: { type: String, default: '', required: false },
  website: { type: String, default: '', required: false },
  github: { type: String, default: '', required: false },
  twitter: { type: String, default: '', required: false },
  credits: { type: Number, default: 1200, required: false },
  goldCoins: { type: Number, default: 0, required: false },
  silverCoins: { type: Number, default: 0, required: false },
  badges: [{ type: String, default: ['Starter', 'Helper'], required: false }],
  rank: { type: String, default: 'Bronze', required: false },
});

module.exports = mongoose.model('User', userSchema);