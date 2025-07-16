const express = require('express');
const passport = require('passport');
const {
  register,
  login,
  verifyOtp
} = require('../controllers/authController');
const generateToken = require('../utils/generateToken');
const { onlineUsers } = require('../socket');
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');


const router = express.Router();

// Email-based
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/logout', require('../controllers/authController').logout);


// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/auth/failure'
}), async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.email) {
      console.error('Missing Google user or email');
      return res.redirect('/auth/failure');
    }

    const token = generateToken(user);

    // Use a fixed frontend URL for redirect
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/home?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
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
    
    // Get the origin from the request to determine the frontend URL
    const origin = req.get('origin') || req.get('referer') || 'http://localhost:5173';
    const frontendUrl = origin.includes('localhost') ? 'http://localhost:5173' : origin.replace(/\/$/, '');
    
    res.redirect(`${frontendUrl}/home?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  } catch (error) {
    console.error(error);
    res.redirect('/auth/failure');
  }
});

// POST /api/online-tutors/search
router.post('/online-tutors/search', requireAuth, async (req, res) => {
  const { subject, topic, subtopic } = req.body;
  try {
    // Get all online userIds except the current user
    const onlineUserIds = Array.from(onlineUsers.keys()).filter(id => id !== req.user._id.toString());
    
    // If no online users, return empty array immediately
    if (!onlineUserIds.length) {
      return res.json([]);
    }

    // Find users whose skillsToTeach matches the search AND are currently online
    const tutors = await User.find({
      _id: { $in: onlineUserIds },
      skillsToTeach: {
        $elemMatch: { subject, topic, subtopic }
      }
    }).select('firstName lastName username profilePic skillsToTeach');

    // Double-check that returned tutors are still online
    const onlineTutors = tutors.filter(tutor => onlineUserIds.includes(tutor._id.toString()));

    res.json(onlineTutors);
  } catch (err) {
    console.error('Search online tutors error:', err);
    res.status(500).json({ message: 'Failed to search online tutors' });
  }
});

// Get user profile
router.get('/user/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update user profile (comprehensive)
router.put('/user/profile', requireAuth, async (req, res) => {
  const { 
    firstName, lastName, bio, country, profilePic, education, experience, 
    certificates, linkedin, website, github, twitter, skillsToTeach, 
    skillsToLearn, credits, goldCoins, silverCoins, badges, rank, username
  } = req.body;
  
  console.log('Profile update request:', { skillsToTeach, skillsToLearn, username });
  
  try {
    const updateData = {};
    
    // Only include fields that are provided in the request
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (country !== undefined) updateData.country = country;
    if (profilePic !== undefined) updateData.profilePic = profilePic;
    if (education !== undefined) updateData.education = education;
    if (experience !== undefined) updateData.experience = experience;
    if (certificates !== undefined) updateData.certificates = certificates;
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

    console.log('Updating user with data:', updateData);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Updated user skills:', { 
      skillsToTeach: user.skillsToTeach, 
      skillsToLearn: user.skillsToLearn,
      username: user.username
    });
    
    res.json(user);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Test endpoint to check socket connection
router.get('/coins', requireAuth, async (req, res) => {
  try {
    // For now, return default coins. You can implement actual coin logic later
    res.json({
      golden: 100, // Default golden coins
      silver: 50   // Default silver coins
    });
  } catch (error) {
    console.error('Coins error:', error);
    res.status(500).json({ error: 'Failed to fetch coins' });
  }
});

// Get user history/sessions
router.get('/user/history', requireAuth, async (req, res) => {
  try {
    // For now, return mock history data. You can implement actual session history later
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
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get user videos
router.get('/videos', requireAuth, async (req, res) => {
  try {
    // For now, return mock videos data. You can implement actual video storage later
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
    console.error('Videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Upload video
router.post('/videos/upload', requireAuth, async (req, res) => {
  try {
    // For now, return mock response. You can implement actual file upload later
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
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Update video
router.put('/videos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // For now, return mock response. You can implement actual video update later
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
    console.error('Video update error:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Delete video
router.delete('/videos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // For now, return success response. You can implement actual video deletion later
    res.json({ message: 'Video deleted successfully', id });
  } catch (error) {
    console.error('Video deletion error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Archive video
router.post('/videos/:id/archive', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // For now, return success response. You can implement actual video archiving later
    res.json({ message: 'Video archived successfully', id });
  } catch (error) {
    console.error('Video archive error:', error);
    res.status(500).json({ error: 'Failed to archive video' });
  }
});

// Get live sessions
router.get('/live', requireAuth, async (req, res) => {
  try {
    // For now, return mock live sessions data. You can implement actual live streaming later
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
    console.error('Live sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch live sessions' });
  }
});

// Create live session
router.post('/live', requireAuth, async (req, res) => {
  try {
    // For now, return mock response. You can implement actual live session creation later
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
    console.error('Live session creation error:', error);
    res.status(500).json({ error: 'Failed to create live session' });
  }
});

// Update live session
router.put('/live/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // For now, return mock response. You can implement actual live session update later
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
    console.error('Live session update error:', error);
    res.status(500).json({ error: 'Failed to update live session' });
  }
});

// Delete live session
router.delete('/live/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // For now, return success response. You can implement actual live session deletion later
    res.json({ message: 'Live session deleted successfully', id });
  } catch (error) {
    console.error('Live session deletion error:', error);
    res.status(500).json({ error: 'Failed to delete live session' });
  }
});

// Archive live session
router.post('/live/:id/archive', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // For now, return success response. You can implement actual live session archiving later
    res.json({ message: 'Live session archived successfully', id });
  } catch (error) {
    console.error('Live session archive error:', error);
    res.status(500).json({ error: 'Failed to archive live session' });
  }
});

// Get user history/sessions
router.get('/user/history', requireAuth, async (req, res) => {
  try {
    // For now, return mock history data. You can implement actual session history later
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
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get user videos
router.get('/videos', requireAuth, async (req, res) => {
  try {
    // For now, return mock videos data. You can implement actual video storage later
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
    console.error('Videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get live sessions
router.get('/live', requireAuth, async (req, res) => {
  try {
    // For now, return mock live sessions data. You can implement actual live streaming later
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
    console.error('Live sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch live sessions' });
  }
});

module.exports = router;
