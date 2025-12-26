const Blog = require('../models/Blog');
const User = require('../models/User');

// Configuration
const MAX_BLOGS_PER_USER = 10; // Per-user blog limit

// Get all blogs with pagination and filters
exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, filter = 'all', search = '' } = req.query;
    const userId = req.user?._id;

    // Build query
    let query = { status: 'active' };

    // Apply filter
    if (filter === 'bookmarked' && userId) {
      query.bookmarks = userId;
    }

    // Apply search
    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch blogs
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await Blog.countDocuments(query);

    // Add user-specific data (likes, bookmarks)
    const blogsWithUserData = blogs.map(blog => ({
      ...blog,
      isLiked: userId ? blog.likes.some(id => id.toString() === userId.toString()) : false,
      isBookmarked: userId ? blog.bookmarks.some(id => id.toString() === userId.toString()) : false,
      likesCount: blog.likes.length,
      commentsCount: blog.comments.length
    }));

    res.status(200).json({
      success: true,
      data: blogsWithUserData,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalBlogs: total,
        hasMore: skip + blogs.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blogs',
      error: error.message
    });
  }
};

// Get single blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const blog = await Blog.findById(id).lean();

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Increment view count
    await Blog.findByIdAndUpdate(id, { $inc: { views: 1 } });

    // Add user-specific data
    const blogWithUserData = {
      ...blog,
      isLiked: userId ? blog.likes.some(id => id.toString() === userId.toString()) : false,
      isBookmarked: userId ? blog.bookmarks.some(id => id.toString() === userId.toString()) : false,
      likesCount: blog.likes.length,
      commentsCount: blog.comments.length
    };

    res.status(200).json({
      success: true,
      data: blogWithUserData
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog',
      error: error.message
    });
  }
};

// Create new blog
exports.createBlog = async (req, res) => {
  try {
    const { title, content, profession } = req.body;
    const userId = req.user._id;

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Check user's blog count (per-user limit)
    const userBlogCount = await Blog.countDocuments({ 
      'author.userId': userId,
      status: 'active'
    });

    if (userBlogCount >= MAX_BLOGS_PER_USER) {
      return res.status(403).json({
        success: false,
        message: `You have reached the maximum limit of ${MAX_BLOGS_PER_USER} blogs. Please delete an existing blog to create a new one.`,
        limit: MAX_BLOGS_PER_USER,
        current: userBlogCount
      });
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create blog
    const blog = new Blog({
      title: title.trim(),
      content: content.trim(),
      author: {
        userId: user._id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Anonymous',
        profession: profession || user.profession || 'Unknown',
        imageUrl: user.profilePic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
      }
    });

    await blog.save();

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog,
      remaining: MAX_BLOGS_PER_USER - userBlogCount - 1
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog',
      error: error.message
    });
  }
};

// Update blog
exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, profession } = req.body;
    const userId = req.user._id;

    // Find blog
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check ownership
    if (blog.author.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this blog'
      });
    }

    // Update fields
    if (title) blog.title = title.trim();
    if (content) blog.content = content.trim();
    if (profession) blog.author.profession = profession;

    await blog.save();

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: blog
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog',
      error: error.message
    });
  }
};

// Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find blog
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check ownership
    if (blog.author.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this blog'
      });
    }

    // Delete blog
    await Blog.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog',
      error: error.message
    });
  }
};

// Toggle like
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check if already liked
    const likeIndex = blog.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Unlike
      blog.likes.splice(likeIndex, 1);
    } else {
      // Like
      blog.likes.push(userId);
    }

    await blog.save();

    res.status(200).json({
      success: true,
      message: likeIndex > -1 ? 'Blog unliked' : 'Blog liked',
      isLiked: likeIndex === -1,
      likesCount: blog.likes.length
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: error.message
    });
  }
};

// Toggle bookmark
exports.toggleBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check if already bookmarked
    const bookmarkIndex = blog.bookmarks.indexOf(userId);

    if (bookmarkIndex > -1) {
      // Remove bookmark
      blog.bookmarks.splice(bookmarkIndex, 1);
    } else {
      // Add bookmark
      blog.bookmarks.push(userId);
    }

    await blog.save();

    res.status(200).json({
      success: true,
      message: bookmarkIndex > -1 ? 'Bookmark removed' : 'Blog bookmarked',
      isBookmarked: bookmarkIndex === -1
    });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle bookmark',
      error: error.message
    });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const user = await User.findById(userId);

    const comment = {
      userId: user._id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Anonymous',
      content: content.trim(),
      createdAt: new Date()
    };

    blog.comments.push(comment);
    await blog.save();

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment,
      commentsCount: blog.comments.length
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

// Get user's blog count (for limit checking)
exports.getUserBlogCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Blog.countDocuments({ 
      'author.userId': userId,
      status: 'active'
    });

    res.status(200).json({
      success: true,
      data: {
        current: count,
        limit: MAX_BLOGS_PER_USER,
        remaining: MAX_BLOGS_PER_USER - count,
        canCreate: count < MAX_BLOGS_PER_USER
      }
    });
  } catch (error) {
    console.error('Error fetching blog count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog count',
      error: error.message
    });
  }
};
