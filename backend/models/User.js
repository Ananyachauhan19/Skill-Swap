const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  email: { type: String, unique: true, required: false },
  phone: { type: String, required: false },
  pendingPhone: { type: String, required: false },
  gender: { type: String, required: false },
  password: { type: String, required: false }, // optional if Google user
  googleId: { type: String, required: false },
  socketId: { type: String, required: false },
  username: { type: String, unique: true, required: true },
  otp: { type: String, required: false },
  otpExpires: { type: Date, required: false },
  // Password reset
  resetPasswordToken: { type: String, required: false },
  resetPasswordExpires: { type: Date, required: false },
  role: {
    type: String,
    enum: ['teacher', 'learner', 'both', 'campus_ambassador'],
    default: 'learner',
    required: false,
  },
  studentId: { type: String, required: false }, // Format: SSH-<instituteId>-<8-digit-random>
  instituteId: { type: String, required: false },
  instituteName: { type: String, required: false },
  // Student specific fields
  class: { type: String, required: false }, // For school students
  course: { type: String, required: false }, // For college students
  semester: { type: String, required: false }, // For college students
  skillsToTeach: [
    {
      class: { type: String, required: false },
      subject: { type: String, required: false },
      topic: { type: String, required: false },
    },
  ],
  skillsToLearn: [{ type: String, default: [], required: false }],
  bio: { type: String, default: '', required: false },
  country: { type: String, default: '', required: false },
  profilePic: { type: String, default: '', required: false },
  // New Cloudinary-based profile image fields (profilePic kept for backward compatibility)
  profileImageUrl: { type: String, default: '', required: false },
  profileImagePublicId: { type: String, default: '', required: false },
  // Private profile cover/banner image (Cloudinary)
  coverImageUrl: { type: String, default: '', required: false },
  coverImagePublicId: { type: String, default: '', required: false },
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
  silverCoins: { type: Number, default: 0, required: false },
  bronzeCoins: { type: Number, default: 100, required: false },
  badges: [{ type: String, default: ['Starter', 'Helper'], required: false }],
  rank: { type: String, default: 'Bronze', required: false },
  skillMates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Rating aggregates (updated when sessions are rated)
  ratingAverage: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  // Tutor verification / activation fields
  isTutor: { type: Boolean, default: false },
  tutorApplicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'TutorApplication', required: false },
  // Availability toggle for teachers/tutors (default: available)
  isAvailableForSessions: { type: Boolean, default: true },
  // Availability toggle for interview (default: available)
  isAvailableForInterviews: { type: Boolean, default: true },
  // Online status
  isOnline: { type: Boolean, default: false },
  lastLogin: { type: Date, required: false },
  // Last seen for chat/presence UI
  lastSeenAt: { type: Date, required: false },
  // Unified activity marker for DAU/WAU/MAU and realtime analytics
  lastActivityAt: { type: Date, required: false },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);