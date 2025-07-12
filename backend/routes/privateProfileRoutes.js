const express = require('express');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

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

module.exports = router; 