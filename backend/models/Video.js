const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  videoUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: []
  },
  dislikes: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: []
  },
  isDraft: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isLive: {
    type: Boolean,
    default: false
  },
  scheduledTime: {
    type: Date,
    default: null
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  // Supabase storage paths for potential deletion
  videoPath: {
    type: String,
    required: true
  },
  thumbnailPath: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
videoSchema.index({ userId: 1, createdAt: -1 });
videoSchema.index({ isDraft: 1, isArchived: 1 });

module.exports = mongoose.model('Video', videoSchema);
