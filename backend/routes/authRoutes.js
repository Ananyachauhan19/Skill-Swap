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
const requireAuth = require('../middleware/requireAuth');

// Sanitize array fields to remove invalid keys (e.g., _id)
const sanitizeArrayFields = (data, validKeys) => {
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

      const token = generateToken(user);
      const frontendUrl = (process.env.FRONTEND_URL ||
        (isProd ? 'https://skillswaphub.in' : 'http://localhost:5173')
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
    const token = generateToken(user);
    const frontendUrl = (process.env.FRONTEND_URL ||
      (isProd ? 'https://skillswaphub.in' : 'http://localhost:5173')
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

// Public Stats Endpoint
router.get('/stats/public', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSessions = await Session.countDocuments();
    const expertUsers = await User.countDocuments({
      skillsToTeach: { $exists: true, $ne: [], $not: { $size: 0 } }
    });

    res.json({
      totalUsers,
      totalSessions,
      expertUsers
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({ error: 'Failed to fetch public stats' });
  }
});

// Search users for SkillMate (navbar search)
router.get('/search/users', async (req, res) => {
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

// Search users by username
router.get('/search', async (req, res) => {
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
    const user = await User.findById(req.user._id).select('-password -otp -otpExpires');
    if (!user) {
      console.info('[DEBUG] User not found for /user/profile:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
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
      rank: user.rank
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

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
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
      rank: user.rank
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
      experience: user.experience,
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

// Get user videos
router.get('/videos', requireAuth, async (req, res) => {
  try {
    const mockVideos = [
      {
        id: "1",
        title: "React Tutorial",
        description: "Complete React tutorial for beginners",
        thumbnail: "https://placehold.co/320x180?text=React+Tutorial",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        uploadDate: new Date().toLocaleString(),
        userId: req.user._id,
        skillmates: 5,
        views: 120,
        likes: 20,
        dislikes: 1,
        isLive: false,
        scheduledTime: null,
        isDraft: false,
        isArchived: false,
      },
      {
        id: "2",
        title: "Node.js Crash Course",
        description: "Quick start guide to Node.js",
        thumbnail: "https://placehold.co/320x180?text=Node+JS",
        videoUrl: "https://www.w3schools.com/html/movie.mp4",
        uploadDate: new Date().toLocaleString(),
        userId: req.user._id,
        skillmates: 3,
        views: 80,
        likes: 10,
        dislikes: 0,
        isLive: false,
        scheduledTime: null,
        isDraft: false,
        isArchived: false,
      }
    ];
    res.json({ videos: mockVideos });
  } catch (error) {
    console.error('[DEBUG] Videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Public: Get videos for a given username (no auth required)
router.get('/public/videos/:username', async (req, res) => {
  try {
    const profileUser = await User.findOne({ username: req.params.username }).select('firstName lastName _id');
    if (!profileUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const mockVideos = [
      {
        id: '1',
        title: 'React Tutorial',
        description: 'Complete React tutorial for beginners',
        thumbnail: 'https://placehold.co/320x180?text=React+Tutorial',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        uploadDate: new Date().toISOString(),
        userId: profileUser._id,
        skillmates: 5,
        views: 120,
        likes: 20,
        dislikes: 1,
        isLive: false,
        scheduledTime: null,
        isDraft: false,
        isArchived: false,
      },
      {
        id: '2',
        title: 'Node.js Crash Course',
        description: 'Quick start guide to Node.js',
        thumbnail: 'https://placehold.co/320x180?text=Node+JS',
        videoUrl: 'https://www.w3schools.com/html/movie.mp4',
        uploadDate: new Date().toISOString(),
        userId: profileUser._id,
        skillmates: 3,
        views: 80,
        likes: 10,
        dislikes: 0,
        isLive: false,
        scheduledTime: null,
        isDraft: false,
        isArchived: false,
      },
    ];
    res.json({ videos: mockVideos });
  } catch (error) {
    console.error('[DEBUG] Public videos error:', error);
    res.status(500).json({ error: 'Failed to fetch public videos' });
  }
});

// Public: Get videos by userId (no auth required)
router.get('/public/videos/byId/:userId', async (req, res) => {
  try {
    const profileUser = await User.findById(req.params.userId).select('firstName lastName _id');
    if (!profileUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const mockVideos = [
      {
        id: '1',
        title: 'React Tutorial',
        description: 'Complete React tutorial for beginners',
        thumbnail: 'https://placehold.co/320x180?text=React+Tutorial',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        uploadDate: new Date().toISOString(),
        userId: profileUser._id,
        skillmates: 5,
        views: 120,
        likes: 20,
        dislikes: 1,
        isLive: false,
        scheduledTime: null,
        isDraft: false,
        isArchived: false,
      },
      {
        id: '2',
        title: 'Node.js Crash Course',
        description: 'Quick start guide to Node.js',
        thumbnail: 'https://placehold.co/320x180?text=Node+JS',
        videoUrl: 'https://www.w3schools.com/html/movie.mp4',
        uploadDate: new Date().toISOString(),
        userId: profileUser._id,
        skillmates: 3,
        views: 80,
        likes: 10,
        dislikes: 0,
        isLive: false,
        scheduledTime: null,
        isDraft: false,
        isArchived: false,
      },
    ];
    res.json({ videos: mockVideos });
  } catch (error) {
    console.error('[DEBUG] Public videos byId error:', error);
    res.status(500).json({ error: 'Failed to fetch public videos by userId' });
  }
});

// Upload video
router.post('/videos/upload', requireAuth, async (req, res) => {
  try {
    const mockVideo = {
      id: Date.now().toString(),
      title: req.body.title || "Untitled Video",
      description: req.body.description || "",
      thumbnail: req.body.thumbnail || "https://placehold.co/320x180?text=Video",
      videoUrl: req.body.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
      uploadDate: new Date().toLocaleString(),
      userId: req.user._id,
      skillmates: 0,
      views: 0,
      likes: 0,
      dislikes: 0,
      isLive: false,
      scheduledTime: null,
      isDraft: req.body.isDraft || false,
      isArchived: false,
    };
    res.json(mockVideo);
  } catch (error) {
    console.error('[DEBUG] Video upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Update video
router.put('/videos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const mockUpdatedVideo = {
      id,
      title: req.body.title || "Updated Video",
      description: req.body.description || "",
      thumbnail: req.body.thumbnail || "https://placehold.co/320x180?text=Video",
      videoUrl: req.body.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
      uploadDate: new Date().toLocaleString(),
      userId: req.user._id,
      skillmates: 0,
      views: 0,
      likes: 0,
      dislikes: 0,
      isLive: false,
      scheduledTime: null,
      isDraft: req.body.isDraft || false,
      isArchived: false,
    };
    res.json(mockUpdatedVideo);
  } catch (error) {
    console.error('[DEBUG] Video update error:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Delete video
router.delete('/videos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    res.json({ message: 'Video deleted successfully', id });
  } catch (error) {
    console.error('[DEBUG] Video deletion error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Archive video
router.post('/videos/:id/archive', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    res.json({ message: 'Video archived successfully', id });
  } catch (error) {
    console.error('[DEBUG] Video archive error:', error);
    res.status(500).json({ error: 'Failed to archive video' });
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

// Return the logged-in user using the cookie JWT
router.get('/me', requireAuth, (req, res) => {
  console.info('[DEBUG] /me called, session:', req.sessionID, 'user:', req.user?._id);
  if (!req.sessionID || !req.user) {
    console.info('[DEBUG] No valid session or user for /me');
    return res.status(401).json({ message: 'No user logged in', user: null });
  }
  res.json({ user: req.user });
});

module.exports = router;