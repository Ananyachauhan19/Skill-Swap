const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  phone: String,
  gender: String,
  password: String, // optional if Google user
  googleId: String,
  socketId: String, // Add this field for real-time notifications
  username: { type: String, unique: true, required: true },

  // 🔽 Add these two fields
  otp: String,
  otpExpires: Date,
  skillsToTeach: [{ type: String, default: [] }],
  skillsToLearn: [{ type: String, default: [] }],
  
  // 🔽 Add comprehensive profile fields
  bio: { type: String, default: '' },
  country: { type: String, default: '' },
  profilePic: { type: String, default: '' },
  education: [{
    course: String,
    branch: String,
    college: String,
    city: String,
    passingYear: String
  }],
  experience: [{
    company: String,
    position: String,
    duration: String,
    description: String
  }],
  certificates: [{
    name: String,
    issuer: String,
    date: String,
    url: String
  }],
  linkedin: { type: String, default: '' },
  website: { type: String, default: '' },
  github: { type: String, default: '' },
  twitter: { type: String, default: '' },
  credits: { type: Number, default: 1200 },
  goldCoins: { type: Number, default: 0 },
  silverCoins: { type: Number, default: 0 },
  badges: [{ type: String, default: ['Starter', 'Helper'] }],
  rank: { type: String, default: 'Bronze' }
});

module.exports = mongoose.model('User', userSchema);
