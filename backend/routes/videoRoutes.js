const express = require('express');
const router = express.Router();
const multer = require('multer');
const Video = require('../models/Video');
const supabase = require('../utils/supabaseClient');
const requireAuth = require('../middleware/requireAuth');

// Debug endpoint to check all videos
router.get('/debug/all', async (req, res) => {
  try {
    const allVideos = await Video.find().populate('userId', 'name email');
    res.json({ 
      count: allVideos.length, 
      videos: allVideos 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed for video field'));
      }
    } else if (file.fieldname === 'thumbnail') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for thumbnail field'));
      }
    } else {
      cb(null, true);
    }
  }
});

// Helper function to upload file to Supabase
async function uploadToSupabase(file, folder, userId) {
  try {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload ${folder}: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    return { publicUrl, filePath };
  } catch (error) {
    console.error('Upload to Supabase failed:', error);
    throw error;
  }
}

// Helper function to delete file from Supabase
async function deleteFromSupabase(filePath) {
  try {
    const { error } = await supabase.storage
      .from('videos')
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
    }
  } catch (error) {
    console.error('Delete from Supabase failed:', error);
  }
}

// @route   POST /api/videos/upload
// @desc    Upload a new video
// @access  Private
router.post('/upload', requireAuth, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, isDraft, isArchived } = req.body;
    const userId = req.user._id;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    if (!req.files || !req.files.video || !req.files.thumbnail) {
      return res.status(400).json({ message: 'Both video and thumbnail files are required' });
    }

    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail[0];

    // Upload files to Supabase
    const videoUpload = await uploadToSupabase(videoFile, 'videos', userId);
    const thumbnailUpload = await uploadToSupabase(thumbnailFile, 'thumbnails', userId);

    // Create video metadata in MongoDB
    const newVideo = new Video({
      userId,
      title,
      description,
      videoUrl: videoUpload.publicUrl,
      thumbnailUrl: thumbnailUpload.publicUrl,
      videoPath: videoUpload.filePath,
      thumbnailPath: thumbnailUpload.filePath,
      isDraft: isDraft === 'true' || isDraft === true,
      uploadDate: new Date()
    });

    await newVideo.save();

    // Populate user info
    await newVideo.populate('userId', 'firstName lastName username');

    // Contribution: track video upload for uploader (idempotent per video)
    try {
      const { trackActivity, ACTIVITY_TYPES } = require('../utils/contributions');
      const io = req.app.get('io');
      await trackActivity({
        userId,
        activityType: ACTIVITY_TYPES.VIDEO_UPLOADED,
        activityId: newVideo._id.toString(),
        io,
      });
    } catch (_) {}

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: newVideo
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ message: 'Failed to upload video', error: error.message });
  }
});

// @route   GET /api/videos
// @desc    Get all videos for current user
// @access  Private
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('[VideoRoutes] GET /api/videos called for user:', req.user._id);
    const userId = req.user._id;
    const { status } = req.query; // 'all', 'draft', 'published', 'archived'

    let filter = { userId };

    if (status === 'draft') {
      filter.isDraft = true;
      filter.isArchived = false;
    } else if (status === 'published') {
      filter.isDraft = false;
      filter.isArchived = false;
    } else if (status === 'archived') {
      filter.isArchived = true;
    } else {
      // 'all' - exclude archived by default
      filter.isArchived = false;
    }

    console.log('[VideoRoutes] Filter:', filter);
    const videos = await Video.find(filter)
      .populate('userId', 'firstName lastName username')
      .sort({ createdAt: -1 });

    console.log('[VideoRoutes] Found videos:', videos.length);
    res.status(200).json({ videos });
  } catch (error) {
    console.error('[VideoRoutes] Fetch videos error:', error);
    res.status(500).json({ message: 'Failed to fetch videos', error: error.message });
  }
});

// @route   GET /api/videos/user/:userId
// @desc    Get all published videos for a specific user (public profile)
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const videos = await Video.find({
      userId,
      isDraft: false,
      isArchived: false
    })
      .populate('userId', 'firstName lastName username')
      .sort({ createdAt: -1 });

    res.status(200).json({ videos });
  } catch (error) {
    console.error('Fetch user videos error:', error);
    res.status(500).json({ message: 'Failed to fetch videos', error: error.message });
  }
});

// @route   GET /api/videos/:id
// @desc    Get a single video by ID (no implicit view increment)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');

    // Validate ObjectId to avoid cast errors when a userId is mistakenly passed
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID' });
    }

    const video = await Video.findById(id)
      .populate('userId', 'firstName lastName username');

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // View counting is now handled explicitly via POST /:id/view
    res.status(200).json({ video });
  } catch (error) {
    console.error('Fetch video error:', error);
    res.status(500).json({ message: 'Failed to fetch video', error: error.message });
  }
});

// @route   POST /api/videos/:id/view
// @desc    Record a view for the current user (counted once per user)
// @access  Private
router.post('/:id/view', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID' });
    }

    const userId = req.user._id;
    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Ensure viewedBy exists
    if (!Array.isArray(video.viewedBy)) {
      video.viewedBy = [];
    }

    const alreadyViewed = video.viewedBy.some(
      (vId) => vId.toString() === userId.toString()
    );

    if (!alreadyViewed) {
      video.views += 1;
      video.viewedBy.push(userId);
      await video.save();
    }

    return res.status(200).json({
      views: video.views,
      alreadyCounted: alreadyViewed,
    });
  } catch (error) {
    console.error('Record view error:', error);
    res.status(500).json({ message: 'Failed to record view', error: error.message });
  }
});

// @route   POST /api/videos/:id/like
// @desc    Toggle like for current user (mutually exclusive with dislike)
// @access  Private
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID' });
    }

    const userId = req.user._id.toString();
    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (!Array.isArray(video.likes)) video.likes = [];
    if (!Array.isArray(video.dislikes)) video.dislikes = [];

    let userHasLiked = false;
    let userHasDisliked = false;

    // Toggle like
    const likeIndex = video.likes.findIndex(
      (vId) => vId.toString() === userId
    );

    if (likeIndex >= 0) {
      // Remove existing like (user unlikes)
      video.likes.splice(likeIndex, 1);
      userHasLiked = false;
    } else {
      video.likes.push(userId);
      userHasLiked = true;

      // Remove dislike if present to enforce mutual exclusivity
      const dislikeIndex = video.dislikes.findIndex(
        (vId) => vId.toString() === userId
      );
      if (dislikeIndex >= 0) {
        video.dislikes.splice(dislikeIndex, 1);
      }
    }

    // Determine dislike state after potential removal
    userHasDisliked = video.dislikes.some((vId) => vId.toString() === userId);

    await video.save();

    return res.status(200).json({
      likes: video.likes.length,
      dislikes: video.dislikes.length,
      userHasLiked,
      userHasDisliked,
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Failed to toggle like', error: error.message });
  }
});

// @route   POST /api/videos/:id/dislike
// @desc    Toggle dislike for current user (mutually exclusive with like)
// @access  Private
router.post('/:id/dislike', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID' });
    }

    const userId = req.user._id.toString();
    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (!Array.isArray(video.likes)) video.likes = [];
    if (!Array.isArray(video.dislikes)) video.dislikes = [];

    let userHasLiked = false;
    let userHasDisliked = false;

    // Toggle dislike
    const dislikeIndex = video.dislikes.findIndex(
      (vId) => vId.toString() === userId
    );

    if (dislikeIndex >= 0) {
      // Remove existing dislike (user removes dislike)
      video.dislikes.splice(dislikeIndex, 1);
      userHasDisliked = false;
    } else {
      video.dislikes.push(userId);
      userHasDisliked = true;

      // Remove like if present to enforce mutual exclusivity
      const likeIndex = video.likes.findIndex(
        (vId) => vId.toString() === userId
      );
      if (likeIndex >= 0) {
        video.likes.splice(likeIndex, 1);
      }
    }

    // Determine like state after potential removal
    userHasLiked = video.likes.some((vId) => vId.toString() === userId);

    await video.save();

    return res.status(200).json({
      likes: video.likes.length,
      dislikes: video.dislikes.length,
      userHasLiked,
      userHasDisliked,
    });
  } catch (error) {
    console.error('Toggle dislike error:', error);
    res.status(500).json({ message: 'Failed to toggle dislike', error: error.message });
  }
});

// @route   PUT /api/videos/:id
// @desc    Update video metadata
// @access  Private
router.put('/:id', requireAuth, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, isDraft, isArchived } = req.body;
    const userId = req.user._id;

    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check ownership
    if (video.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this video' });
    }

    // Update text fields
    if (title) video.title = title;
    if (description) video.description = description;
    if (isDraft !== undefined) video.isDraft = isDraft === 'true' || isDraft === true;
    if (isArchived !== undefined) video.isArchived = isArchived === 'true' || isArchived === true ? true : false;

    // Update video file if provided
    if (req.files && req.files.video) {
      const videoFile = req.files.video[0];
      
      // Delete old video from Supabase
      await deleteFromSupabase(video.videoPath);
      
      // Upload new video
      const videoUpload = await uploadToSupabase(videoFile, 'videos', userId);
      video.videoUrl = videoUpload.publicUrl;
      video.videoPath = videoUpload.filePath;
    }

    // Update thumbnail if provided
    if (req.files && req.files.thumbnail) {
      const thumbnailFile = req.files.thumbnail[0];
      
      // Delete old thumbnail from Supabase
      await deleteFromSupabase(video.thumbnailPath);
      
      // Upload new thumbnail
      const thumbnailUpload = await uploadToSupabase(thumbnailFile, 'thumbnails', userId);
      video.thumbnailUrl = thumbnailUpload.publicUrl;
      video.thumbnailPath = thumbnailUpload.filePath;
    }

    await video.save();
    await video.populate('userId', 'firstName lastName username');

    res.status(200).json({
      message: 'Video updated successfully',
      video
    });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ message: 'Failed to update video', error: error.message });
  }
});

// @route   DELETE /api/videos/:id
// @desc    Delete a video
// @access  Private
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const userEmail = (req.user.email || '').toLowerCase();
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check ownership or admin
    const isOwner = video.userId.toString() === userId.toString();
    const isAdmin = adminEmail && userEmail === adminEmail;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this video' });
    }

    // Delete files from Supabase
    await deleteFromSupabase(video.videoPath);
    await deleteFromSupabase(video.thumbnailPath);

    // Delete from MongoDB
    await Video.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ message: 'Failed to delete video', error: error.message });
  }
});

// @route   POST /api/videos/:id/archive
// @desc    Archive a video
// @access  Private
router.post('/:id/archive', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check ownership
    if (video.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to archive this video' });
    }

    video.isArchived = true;
    await video.save();

    res.status(200).json({ message: 'Video archived successfully', video });
  } catch (error) {
    console.error('Archive video error:', error);
    res.status(500).json({ message: 'Failed to archive video', error: error.message });
  }
});

// @route   POST /api/videos/:id/like
// @desc    Like/unlike a video
// @access  Private
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const likeIndex = video.likes.indexOf(userId);
    const dislikeIndex = video.dislikes.indexOf(userId);

    // Remove from dislikes if present
    if (dislikeIndex > -1) {
      video.dislikes.splice(dislikeIndex, 1);
    }

    // Toggle like
    if (likeIndex > -1) {
      video.likes.splice(likeIndex, 1);
    } else {
      video.likes.push(userId);
    }

    await video.save();

    res.status(200).json({
      message: 'Video like updated',
      likes: video.likes.length,
      dislikes: video.dislikes.length
    });
  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({ message: 'Failed to like video', error: error.message });
  }
});

// @route   POST /api/videos/:id/dislike
// @desc    Dislike/undislike a video
// @access  Private
router.post('/:id/dislike', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const likeIndex = video.likes.indexOf(userId);
    const dislikeIndex = video.dislikes.indexOf(userId);

    // Remove from likes if present
    if (likeIndex > -1) {
      video.likes.splice(likeIndex, 1);
    }

    // Toggle dislike
    if (dislikeIndex > -1) {
      video.dislikes.splice(dislikeIndex, 1);
    } else {
      video.dislikes.push(userId);
    }

    await video.save();

    res.status(200).json({
      message: 'Video dislike updated',
      likes: video.likes.length,
      dislikes: video.dislikes.length
    });
  } catch (error) {
    console.error('Dislike video error:', error);
    res.status(500).json({ message: 'Failed to dislike video', error: error.message });
  }
});

module.exports = router;
