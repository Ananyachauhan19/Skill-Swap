const express = require('express');
const router = express.Router();
const passport = require('passport');
const generateToken = require('../utils/generateToken');
const {
  register,
  login,
  verifyOtp,
  logout
} = require('../controllers/authController');
const User = require('../models/User');
const Session = require('../models/Session');
const InterviewerApplication = require('../models/InterviewerApplication');
const requireAuth = require('../middleware/requireAuth');
const { trackDailyLogin, trackActivity, ACTIVITY_TYPES } = require('../utils/contributions');
const crypto = require('crypto');
const { sendMail } = require('../utils/sendMail');
const T = require('../utils/emailTemplates');
const jwt = require('jsonwebtoken');

// Sanitize array fields to remove invalid keys (e.g., _id)
const sanitizeArrayFields = (data, validKeys) => {
  if (!Array.isArray(data)) return [];
  return data.map(item => {
    const sanitized = {};
    validKeys.forEach(key => {
      if (item[key] !== undefined) {
        sanitized[key] = item[key];
      }
    });
    return sanitized;
  });
};

// Environment-based cookie configuration
const isProd = process.env.NODE_ENV === 'production';
const cookieBase = {
  path: '/',
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,
};

// Email-based routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);

// Toggle availability for session requests (teachers/tutors only)
router.post('/toggle-availability', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only teachers, tutors, or 'both' can toggle availability
    if (user.role !== 'teacher' && user.role !== 'both') {
      return res.status(403).json({ message: 'Only teachers can toggle availability' });
    }

    // Toggle the availability
    user.isAvailableForSessions = !user.isAvailableForSessions;
    await user.save();

    // Broadcast availability change via Socket.IO
    const io = req.app.get('io');
    if (io && user.socketId) {
      // Emit to the user's socket to confirm
      io.to(user.socketId).emit('availability-updated', {
        isAvailableForSessions: user.isAvailableForSessions
      });
    }
    // Broadcast to all clients that this tutor's availability changed
    if (io) {
      io.emit('tutor-availability-changed', {
        tutorId: user._id.toString(),
        isAvailableForSessions: user.isAvailableForSessions
      });
    }

    console.log(`[Availability] User ${user._id} toggled to: ${user.isAvailableForSessions}`);

    res.json({
      message: `You are now ${user.isAvailableForSessions ? 'available' : 'unavailable'} for session requests`,
      isAvailableForSessions: user.isAvailableForSessions
    });
  } catch (error) {
    console.error('Error toggling availability:', error);
    res.status(500).json({ message: 'Failed to toggle availability' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  console.info('[DEBUG] Logout initiated for session:', req.sessionID, 'user:', req.user?._id);
  if (req.user) {
    req.logout((err) => {
      if (err) {
        console.error('[DEBUG] Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      req.session.destroy((err) => {
        if (err) {
          console.error('[DEBUG] Session destruction error:', err);
          return res.status(500).json({ message: 'Session destruction failed' });
        }
        console.info('[DEBUG] Session destroyed for user:', req.user?._id);
        res.clearCookie('connect.sid', cookieBase);
        res.clearCookie('token', cookieBase);
        res.clearCookie('user', { ...cookieBase, httpOnly: false });
        console.info('[DEBUG] Cookies cleared');
        return res.status(200).json({ message: 'Logged out successfully' });
      });
    });
  } else {
    console.info('[DEBUG] No user in session, clearing cookies');
    res.clearCookie('connect.sid', cookieBase);
    res.clearCookie('token', cookieBase);
    res.clearCookie('user', { ...cookieBase, httpOnly: false });
    console.info('[DEBUG] Cookies cleared (no user)');
    return res.status(200).json({ message: 'Logged out successfully' });
  }
});

// Google OAuth entry
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    callbackURL: process.env.GOOGLE_CALLBACK,
    prompt: 'select_account'
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/auth/failure' }),
  async (req, res) => {
    try {
      const user = req.user;
      console.info('[DEBUG] Google callback for user:', user?._id);
      if (!user?.email) return res.redirect('/api/auth/failure');

      // Track daily login for OAuth
      try {
        await trackDailyLogin({
          userId: user._id,
          when: new Date()
        });
      } catch (error) {
        console.error('Error tracking Google OAuth login:', error);
      }

      const token = generateToken(user);
      // Prefer explicit FRONTEND_URL; otherwise default to www domain in production
      const frontendUrl = (process.env.FRONTEND_URL ||
        (isProd ? 'http://www.skillswaphub.in' : 'http://localhost:5173')
      ).replace(/\/+$/, '');

      res.cookie('token', token, {
        ...cookieBase,
        maxAge: 24 * 60 * 60 * 1000
      });
      res.cookie('user', JSON.stringify(user), {
        ...cookieBase,
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.redirect(`${frontendUrl}/home`);
    } catch (e) {
      console.error('[DEBUG] OAuth callback error:', e);
      return res.redirect('/api/auth/failure');
    }
  }
);

// Failure route
router.get('/failure', (_req, res) => {
  res.status(400).json({ message: 'Google sign-in failed' });
});

// LinkedIn OAuth
router.get('/linkedin', passport.authenticate('linkedin'));
router.get('/linkedin/callback', passport.authenticate('linkedin', {
  failureRedirect: '/api/auth/failure'
}), async (req, res) => {
  try {
    const user = req.user;
    console.info('[DEBUG] LinkedIn callback for user:', user?._id);
    
    // Track daily login for OAuth
    try {
      await trackDailyLogin({
        userId: user._id,
        when: new Date()
      });
    } catch (error) {
      console.error('Error tracking LinkedIn OAuth login:', error);
    }
    
    const token = generateToken(user);
    // Prefer explicit FRONTEND_URL; otherwise default to www domain in production
    const frontendUrl = (process.env.FRONTEND_URL ||
      (isProd ? 'http://www.skillswaphub.in' : 'http://localhost:5173')
    ).replace(/\/+$/, '');

    res.cookie('token', token, {
      ...cookieBase,
      maxAge: 24 * 60 * 60 * 1000
    });
    res.cookie('user', JSON.stringify(user), {
      ...cookieBase,
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000
    });

    res.redirect(`${frontendUrl}/home`);
  } catch (error) {
    console.error('[DEBUG] LinkedIn OAuth error:', error);
    res.redirect('/api/auth/failure');
  }
});

// Forgot password: request reset
router.post('/password/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const user = await User.findOne({ email });
    // Always respond 200 to avoid user enumeration
    if (!user) return res.status(200).json({ message: 'If account exists, an email has been sent' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000);
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    // Prefer configured frontend URL; otherwise use request Origin header (so dev/mobile click works), fallback by env
    const originHeader = (req.headers.origin || '').replace(/\/+$/, '');
    const defaultFrontend = isProd ? 'http://www.skillswaphub.in' : 'http://localhost:5173';
    const frontendUrl = (process.env.FRONTEND_URL || originHeader || defaultFrontend).replace(/\/+$/, '');
    const link = `${frontendUrl}/reset-password?token=${token}`;
    const fallbackFrontendUrl = defaultFrontend; // explicit fallback to prod domain or localhost
    const fallbackLink = `${fallbackFrontendUrl}/reset-password?token=${token}`;
    const useFallback = fallbackLink !== link ? fallbackLink : undefined;
    console.info('[RESET] Password reset link generated', { email, originHeader, frontendUrl, link, fallbackFrontendUrl, fallbackLink });
    const tpl = T.passwordReset({ resetLink: link, fallbackLink: useFallback });
    await sendMail({ to: email, subject: tpl.subject, html: tpl.html });
    return res.status(200).json({ message: 'If account exists, an email has been sent' });
  } catch (e) {
    console.error('Forgot password error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password: verify token
router.get('/password/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ valid: false, message: 'Token required' });
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ valid: false, message: 'Invalid or expired token' });
    return res.json({ valid: true });
  } catch (e) {
    return res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// Forgot password: reset
router.post('/password/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and password required' });
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    // Hash password (reuse authController hashing if available)
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: 'Password reset successful' });
  } catch (e) {
    console.error('Reset password error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Public Stats Endpoint
router.get('/stats/public', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSessions = await Session.countDocuments();
    const expertUsers = await User.countDocuments({
      skillsToTeach: { $exists: true, $ne: [], $not: { $size: 0 } }
    });
    
    // Count approved expert interviewers
    const ApprovedInterviewer = require('../models/ApprovedInterviewer');
    const expertInterviewers = await ApprovedInterviewer.countDocuments();

    res.json({
      totalUsers,
      totalSessions,
      expertUsers,
      expertInterviewers
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({ error: 'Failed to fetch public stats' });
  }
});

// Search users for SkillMate (navbar search) - requires authentication
router.get('/search/users', requireAuth, async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ results: [] });
    }
    
    const searchLimit = parseInt(limit) || 8;
    const searchQuery = q.trim();
    
    // Search by username, firstName, lastName, or email
    const users = await User.find({
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ]
    })
    .select('_id username firstName lastName profilePic role')
    .limit(searchLimit)
    .lean();
    
    res.json({ results: users });
  } catch (error) {
    console.error('[DEBUG] Error searching users for SkillMate:', error);
    res.status(500).json({ message: 'Server error while searching users', results: [] });
  }
});

// Search users by username - requires authentication
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ message: 'Username query parameter is required' });
    }
    const users = await User.find({
      username: { $regex: username, $options: 'i' }
    }).select('_id username firstName lastName profilePic').limit(10);
    res.json({ users });
  } catch (error) {
    console.error('[DEBUG] Error searching users:', error);
    res.status(500).json({ message: 'Server error while searching users' });
  }
});

// Get user profile
router.get('/user/profile', requireAuth, async (req, res) => {
  try {
    console.log('[DEBUG] Fetching user profile for ID:', req.user._id);
    const user = await User.findById(req.user._id).select('-password -otp -otpExpires');
    if (!user) {
      console.info('[DEBUG] User not found for /user/profile:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('[DEBUG] User found, preparing response. isTutor:', user.isTutor, 'role:', user.role);

    // Enrich experience from approved interviewer application so that
    // the interviewer position, duration and total interview count are
    // reflected consistently in the profile (including edit forms).
    let experience = user.experience;
    try {
      const app = await InterviewerApplication.findOne({ user: user._id, status: 'approved' });
      if (app && Array.isArray(experience) && experience.length > 0) {
        const totalPast = typeof app.totalPastInterviews === 'number' ? app.totalPastInterviews : null;
        if (totalPast !== null) {
          const description = totalPast === 1
            ? 'Has experience conducting 1 interview.'
            : `Has experience conducting ${totalPast} interviews.`;
          experience = experience.map((exp) => {
            const plain = exp && typeof exp.toObject === 'function' ? exp.toObject() : exp || {};
            const sameCompany = (plain.company || '') === (app.company || '');
            const sameDuration = (plain.duration || '') === (app.experience || '') || !plain.duration;
            if (sameCompany && sameDuration) {
              return {
                ...plain,
                position: app.position || plain.position || 'Interviewer',
                duration: app.experience || plain.duration || '',
                description,
              };
            }
            return plain;
          });
        }
      }
    } catch (e) {
      console.error('[DEBUG] Failed to enrich experience from interviewer application', e);
    }
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic,
      profileImageUrl: user.profileImageUrl,
      bio: user.bio,
      skillsToTeach: user.skillsToTeach,
      skillsToLearn: user.skillsToLearn,
      country: user.country,
      education: user.education,
      experience,
      certificates: user.certificates,
      linkedin: user.linkedin,
      website: user.website,
      github: user.github,
      twitter: user.twitter,
      credits: user.credits,
      goldCoins: user.goldCoins,
      silverCoins: user.silverCoins,
      badges: user.badges,
      rank: user.rank,
      isTutor: user.isTutor,
      tutorApplicationId: user.tutorApplicationId
    });
  } catch (err) {
    console.error('[DEBUG] Profile fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
});

// Update user profile
router.put('/user/profile', requireAuth, async (req, res) => {
  const {
    firstName, lastName, bio, country, profilePic, education, experience,
    certificates, linkedin, website, github, twitter, skillsToTeach,
    skillsToLearn, credits, goldCoins, silverCoins, badges, rank, username
  } = req.body;

  try {
    const updateData = {};

    if (education !== undefined) {
      updateData.education = sanitizeArrayFields(education, ['course', 'branch', 'college', 'city', 'passingYear']);
    }
    if (experience !== undefined) {
      updateData.experience = sanitizeArrayFields(experience, ['company', 'position', 'duration', 'description']);
    }
    if (certificates !== undefined) {
      updateData.certificates = sanitizeArrayFields(certificates, ['name', 'issuer', 'date', 'url']);
    }

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (country !== undefined) updateData.country = country;
    if (profilePic !== undefined) updateData.profilePic = profilePic;
    if (linkedin !== undefined) updateData.linkedin = linkedin;
    if (website !== undefined) updateData.website = website;
    if (github !== undefined) updateData.github = github;
    if (twitter !== undefined) updateData.twitter = twitter;
    if (skillsToTeach !== undefined) updateData.skillsToTeach = skillsToTeach;
    if (skillsToLearn !== undefined) updateData.skillsToLearn = skillsToLearn;
    if (credits !== undefined) updateData.credits = credits;
    if (goldCoins !== undefined) updateData.goldCoins = goldCoins;
    if (silverCoins !== undefined) updateData.silverCoins = silverCoins;
    if (badges !== undefined) updateData.badges = badges;
    if (rank !== undefined) updateData.rank = rank;
    if (username !== undefined) updateData.username = username;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -otp -otpExpires');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Track profile update
    try {
      const io = req.app.get('io');
      await trackActivity({
        userId: req.user._id,
        activityType: ACTIVITY_TYPES.PROFILE_UPDATED,
        activityId: `profile-update-${Date.now()}`,
        io
      });
    } catch (_) {}

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic,
      profileImageUrl: user.profileImageUrl,
      bio: user.bio,
      skillsToTeach: user.skillsToTeach,
      skillsToLearn: user.skillsToLearn,
      country: user.country,
      education: user.education,
      experience: user.experience,
      certificates: user.certificates,
      linkedin: user.linkedin,
      website: user.website,
      github: user.github,
      twitter: user.twitter,
      credits: user.credits,
      goldCoins: user.goldCoins,
      silverCoins: user.silverCoins,
      badges: user.badges,
      rank: user.rank,
      isTutor: user.isTutor,
      tutorApplicationId: user.tutorApplicationId
    });
  } catch (err) {
    console.error('[DEBUG] Profile update error:', err);
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
});

// Sync /api/user/profile to /api/auth/user/profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otp -otpExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio,
      skillsToTeach: user.skillsToTeach,
      skillsToLearn: user.skillsToLearn,
      country: user.country,
      education: user.education,
      experience: user.experience,
      certificates: user.certificates,
      linkedin: user.linkedin,
      website: user.website,
      github: user.github,
      twitter: user.twitter,
      credits: user.credits,
      goldCoins: user.goldCoins,
      silverCoins: user.silverCoins,
      badges: user.badges,
      rank: user.rank
    });
  } catch (err) {
    console.error('[DEBUG] Profile fetch error (/profile):', err);
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
});

// Unregister as tutor: set role to learner and disable tutor status
router.post('/unregister-tutor', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update role and tutor status
    user.role = 'learner';
    user.isTutor = false;
    // Activation timestamps removed; immediate activation model in place
    // Clear previously merged tutor skills so profile shows no tutor skills
    user.skillsToTeach = [];
    // Do not delete tutorApplicationId to preserve audit trail

    await user.save();

    // If there is an associated tutor application, mark it as reverted
    if (user.tutorApplicationId) {
      try {
        const TutorApplication = require('../models/TutorApplication');
        const app = await TutorApplication.findById(user.tutorApplicationId);
        if (app) {
          app.status = 'reverted';
          app.approvedAt = undefined;
          app.rejectionReason = undefined;
          await app.save();
        }
      } catch (e) {
        console.warn('[DEBUG] Failed to mark tutor application as reverted:', e.message);
      }
    }

    // Broadcast activity if socket is available
    try {
      const io = req.app.get('io');
      await trackActivity({
        userId: req.user._id,
        activityType: ACTIVITY_TYPES.PROFILE_UPDATED,
        activityId: `tutor-unregister-${Date.now()}`,
        io,
      });
    } catch (_) {}

    return res.json({
      message: 'Unregistered as tutor successfully',
      role: user.role,
      isTutor: user.isTutor,
    });
  } catch (err) {
    console.error('[DEBUG] Unregister tutor error:', err);
    return res.status(500).json({ message: 'Failed to unregister as tutor', error: err.message });
  }
});

// Sync /api/user/profile update to /api/auth/user/profile
router.put('/profile', requireAuth, async (req, res) => {
  const {
    firstName, lastName, bio, country, profilePic, education, experience,
    certificates, linkedin, website, github, twitter, skillsToTeach,
    skillsToLearn, credits, goldCoins, silverCoins, badges, rank, username
  } = req.body;

  try {
    const updateData = {};

    if (education !== undefined) {
      updateData.education = sanitizeArrayFields(education, ['course', 'branch', 'college', 'city', 'passingYear']);
    }
    if (experience !== undefined) {
      updateData.experience = sanitizeArrayFields(experience, ['company', 'position', 'duration', 'description']);
    }
    if (certificates !== undefined) {
      updateData.certificates = sanitizeArrayFields(certificates, ['name', 'issuer', 'date', 'url']);
    }

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (country !== undefined) updateData.country = country;
    if (profilePic !== undefined) updateData.profilePic = profilePic;
    if (linkedin !== undefined) updateData.linkedin = linkedin;
    if (website !== undefined) updateData.website = website;
    if (github !== undefined) updateData.github = github;
    if (twitter !== undefined) updateData.twitter = twitter;
    if (skillsToTeach !== undefined) updateData.skillsToTeach = skillsToTeach;
    if (skillsToLearn !== undefined) updateData.skillsToLearn = skillsToLearn;
    if (credits !== undefined) updateData.credits = credits;
    if (goldCoins !== undefined) updateData.goldCoins = goldCoins;
    if (silverCoins !== undefined) updateData.silverCoins = silverCoins;
    if (badges !== undefined) updateData.badges = badges;
    if (rank !== undefined) updateData.rank = rank;
    if (username !== undefined) updateData.username = username;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -otp -otpExpires');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Track profile update
    try {
      const io = req.app.get('io');
      await trackActivity({
        userId: req.user._id,
        activityType: ACTIVITY_TYPES.PROFILE_UPDATED,
        activityId: `profile-update-${Date.now()}`,
        io
      });
    } catch (_) {}

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio,
      skillsToTeach: user.skillsToTeach,
      skillsToLearn: user.skillsToLearn,
      country: user.country,
      education: user.education,
      experience: user.experience,
      certificates: user.certificates,
      linkedin: user.linkedin,
      website: user.website,
      github: user.github,
      twitter: user.twitter,
      credits: user.credits,
      goldCoins: user.goldCoins,
      silverCoins: user.silverCoins,
      badges: user.badges,
      rank: user.rank
    });
  } catch (err) {
    console.error('[DEBUG] Profile update error (/profile):', err);
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
});

// Get user public profile
router.get('/user/public/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password -otp -otpExpires -__v');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Enrich experience from approved interviewer application, same logic
    // as /user/profile so public and private views stay consistent.
    let experience = user.experience;
    try {
      const app = await InterviewerApplication.findOne({ user: user._id, status: 'approved' });
      if (app && Array.isArray(experience) && experience.length > 0) {
        const totalPast = typeof app.totalPastInterviews === 'number' ? app.totalPastInterviews : null;
        if (totalPast !== null) {
          const description = totalPast === 1
            ? 'Has experience conducting 1 interview.'
            : `Has experience conducting ${totalPast} interviews.`;
          experience = experience.map((exp) => {
            const plain = exp && typeof exp.toObject === 'function' ? exp.toObject() : exp || {};
            const sameCompany = (plain.company || '') === (app.company || '');
            const sameDuration = (plain.duration || '') === (app.experience || '') || !plain.duration;
            if (sameCompany && sameDuration) {
              return {
                ...plain,
                position: app.position || plain.position || 'Interviewer',
                duration: app.experience || plain.duration || '',
                description,
              };
            }
            return plain;
          });
        }
      }
    } catch (e) {
      console.error('[DEBUG] Failed to enrich public experience from interviewer application', e);
    }

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      profilePic: user.profilePic,
      profileImageUrl: user.profileImageUrl,
      bio: user.bio,
      skillsToTeach: user.skillsToTeach,
      skillsToLearn: user.skillsToLearn,
      country: user.country,
      education: user.education,
      experience,
      certificates: user.certificates,
      linkedin: user.linkedin,
      website: user.website,
      github: user.github,
      twitter: user.twitter,
      rank: user.rank,
      badges: user.badges
    });
  } catch (err) {
    console.error('[DEBUG] Public profile fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Coins endpoint
router.get('/coins', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('goldCoins silverCoins');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      golden: user.goldCoins || 0,
      silver: user.silverCoins || 0
    });
  } catch (error) {
    console.error('[DEBUG] Coins error:', error);
    res.status(500).json({ error: 'Failed to fetch coins' });
  }
});

// Get user history/sessions
router.get('/user/history', requireAuth, async (req, res) => {
  try {
    const mockHistory = [
      {
        date: '2025-01-15',
        sessions: ['React Workshop', 'Node.js Q&A'],
        count: 2
      },
      {
        date: '2025-01-14',
        sessions: ['JavaScript Basics'],
        count: 1
      },
      {
        date: '2025-01-13',
        sessions: ['Python Tutorial', 'Data Structures'],
        count: 2
      }
    ];
    res.json({ history: mockHistory });
  } catch (error) {
    console.error('[DEBUG] History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get live sessions
router.get('/live', requireAuth, async (req, res) => {
  try {
    const mockLiveSessions = [
      {
        id: "1",
        title: "React Live Coding",
        description: "Live coding session on React",
        thumbnail: "https://placehold.co/320x180?text=Live+1",
        videoUrl: null,
        isLive: true,
        scheduledTime: new Date(Date.now() + 3600 * 1000).toISOString(),
        uploadDate: new Date().toLocaleString(),
        host: req.user.firstName + " " + req.user.lastName,
        userId: req.user._id,
        viewers: 120,
        skillmates: 10,
        views: 0,
        likes: 0,
        dislikes: 0,
        isDraft: false,
        isRecorded: false,
      },
      {
        id: "2",
        title: "Node.js Q&A",
        description: "Q&A session on Node.js",
        thumbnail: "https://placehold.co/320x180?text=Live+2",
        videoUrl: null,
        isLive: false,
        scheduledTime: new Date(Date.now() + 7200 * 1000).toISOString(),
        uploadDate: new Date().toLocaleString(),
        host: req.user.firstName + " " + req.user.lastName,
        userId: req.user._id,
        viewers: 80,
        skillmates: 8,
        views: 0,
        likes: 0,
        dislikes: 0,
        isDraft: false,
        isRecorded: false,
      }
    ];
    res.json({ liveSessions: mockLiveSessions });
  } catch (error) {
    console.error('[DEBUG] Live sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch live sessions' });
  }
});

// Public: Get live/scheduled sessions for a given username (no auth required)
router.get('/public/live/:username', async (req, res) => {
  try {
    const profileUser = await User.findOne({ username: req.params.username }).select('firstName lastName _id');
    if (!profileUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const mockLiveSessions = [
      {
        id: '1',
        title: 'React Live Coding',
        description: 'Live coding session on React',
        thumbnail: 'https://placehold.co/320x180?text=Live+1',
        videoUrl: null,
        isLive: true,
        scheduledTime: new Date(Date.now() + 3600 * 1000).toISOString(),
        uploadDate: new Date().toLocaleString(),
        host: `${profileUser.firstName || ''} ${profileUser.lastName || ''}`.trim(),
        userId: profileUser._id,
        viewers: 120,
        skillmates: 10,
        views: 0,
        likes: 0,
        dislikes: 0,
        isDraft: false,
        isRecorded: false,
      },
      {
        id: '2',
        title: 'Node.js Q&A',
        description: 'Q&A session on Node.js',
        thumbnail: 'https://placehold.co/320x180?text=Live+2',
        videoUrl: null,
        isLive: false,
        scheduledTime: new Date(Date.now() + 7200 * 1000).toISOString(),
        uploadDate: new Date().toLocaleString(),
        host: `${profileUser.firstName || ''} ${profileUser.lastName || ''}`.trim(),
        userId: profileUser._id,
        viewers: 80,
        skillmates: 8,
        views: 0,
        likes: 0,
        dislikes: 0,
        isDraft: false,
        isRecorded: false,
      },
    ];
    res.json({ liveSessions: mockLiveSessions });
  } catch (error) {
    console.error('[DEBUG] Public live sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch public live sessions' });
  }
});

// Public: Get live/scheduled sessions by userId (no auth required)
router.get('/public/live/byId/:userId', async (req, res) => {
  try {
    const profileUser = await User.findById(req.params.userId).select('firstName lastName _id');
    if (!profileUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const mockLiveSessions = [
      {
        id: '1',
        title: 'React Live Coding',
        description: 'Live coding session on React',
        thumbnail: 'https://placehold.co/320x180?text=Live+1',
        videoUrl: null,
        isLive: true,
        scheduledTime: new Date(Date.now() + 3600 * 1000).toISOString(),
        uploadDate: new Date().toLocaleString(),
        host: `${profileUser.firstName || ''} ${profileUser.lastName || ''}`.trim(),
        userId: profileUser._id,
        viewers: 120,
        skillmates: 10,
        views: 0,
        likes: 0,
        dislikes: 0,
        isDraft: false,
        isRecorded: false,
      },
      {
        id: '2',
        title: 'Node.js Q&A',
        description: 'Q&A session on Node.js',
        thumbnail: 'https://placehold.co/320x180?text=Live+2',
        videoUrl: null,
        isLive: false,
        scheduledTime: new Date(Date.now() + 7200 * 1000).toISOString(),
        uploadDate: new Date().toLocaleString(),
        host: `${profileUser.firstName || ''} ${profileUser.lastName || ''}`.trim(),
        userId: profileUser._id,
        viewers: 80,
        skillmates: 8,
        views: 0,
        likes: 0,
        dislikes: 0,
        isDraft: false,
        isRecorded: false,
      },
    ];
    res.json({ liveSessions: mockLiveSessions });
  } catch (error) {
    console.error('[DEBUG] Public live byId error:', error);
    res.status(500).json({ error: 'Failed to fetch public live sessions by userId' });
  }
});

// Create live session
router.post('/live', requireAuth, async (req, res) => {
  try {
    const mockLiveSession = {
      id: Date.now().toString(),
      title: req.body.title || "New Live Session",
      description: req.body.description || "",
      thumbnail: req.body.thumbnail || "https://placehold.co/320x180?text=Live",
      videoUrl: null,
      isLive: true,
      scheduledTime: req.body.scheduledTime || new Date().toISOString(),
      uploadDate: new Date().toLocaleString(),
      host: req.user.firstName + " " + req.user.lastName,
      userId: req.user._id,
      viewers: 0,
      skillmates: 0,
      views: 0,
      likes: 0,
      dislikes: 0,
      isDraft: false,
      isRecorded: false,
    };
    res.json(mockLiveSession);
  } catch (error) {
    console.error('[DEBUG] Live session creation error:', error);
    res.status(500).json({ error: 'Failed to create live session' });
  }
});

// Update live session
router.put('/live/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const mockUpdatedLiveSession = {
      id,
      title: req.body.title || "Updated Live Session",
      description: req.body.description || "",
      thumbnail: req.body.thumbnail || "https://placehold.co/320x180?text=Live",
      videoUrl: null,
      isLive: req.body.isLive || true,
      scheduledTime: req.body.scheduledTime || new Date().toISOString(),
      uploadDate: new Date().toLocaleString(),
      host: req.user.firstName + " " + req.user.lastName,
      userId: req.user._id,
      viewers: req.body.viewers || 0,
      skillmates: req.body.skillmates || 0,
      views: req.body.views || 0,
      likes: req.body.likes || 0,
      dislikes: req.body.dislikes || 0,
      isDraft: false,
      isRecorded: false,
    };
    res.json(mockUpdatedLiveSession);
  } catch (error) {
    console.error('[DEBUG] Live session update error:', error);
    res.status(500).json({ error: 'Failed to update live session' });
  }
});

// Delete live session
router.delete('/live/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    res.json({ message: 'Live session deleted successfully', id });
  } catch (error) {
    console.error('[DEBUG] Live session deletion error:', error);
    res.status(500).json({ error: 'Failed to delete live session' });
  }
});

// Archive live session
router.post('/live/:id/archive', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    res.json({ message: 'Live session archived successfully', id });
  } catch (error) {
    console.error('[DEBUG] Live session archive error:', error);
    res.status(500).json({ error: 'Failed to archive live session' });
  }
});

// Return the logged-in user using the cookie JWT.
// This is a "soft" auth check: if there is no valid token, we
// simply return { user: null } with 200 instead of a 401 to avoid
// noisy browser errors during unauthenticated visits.
router.get('/me', async (req, res) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(200).json({ user: null });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      // Invalid/expired token – treat as logged out
      return res.status(200).json({ user: null });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(200).json({ user: null });
    }

    return res.json({ user });
  } catch (err) {
    console.error('[DEBUG] /me error:', err);
    return res.status(500).json({ message: 'Failed to fetch current user' });
  }
});

module.exports = router;