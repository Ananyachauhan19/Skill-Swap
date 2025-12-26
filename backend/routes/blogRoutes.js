const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const requireAuth = require('../middleware/requireAuth');

// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/:id', blogController.getBlogById);

// Protected routes (require authentication)
router.post('/', requireAuth, blogController.createBlog);
router.put('/:id', requireAuth, blogController.updateBlog);
router.delete('/:id', requireAuth, blogController.deleteBlog);
router.post('/:id/like', requireAuth, blogController.toggleLike);
router.post('/:id/bookmark', requireAuth, blogController.toggleBookmark);
router.post('/:id/comment', requireAuth, blogController.addComment);
router.get('/user/count', requireAuth, blogController.getUserBlogCount);

module.exports = router;
