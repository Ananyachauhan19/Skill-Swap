const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const Testimonial = require('../models/Testimonial');
const User = require('../models/User');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: 'Too many requests, please try again later.'
});

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const testimonials = await Testimonial.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Enrich missing profilePic from User collection by username (best-effort)
    const missing = testimonials.filter(t => !t.profilePic && t.username).map(t => t.username);
    let enrichedMap = new Map();
    if (missing.length) {
      const users = await User.find({ username: { $in: missing } }).select('username profilePic').lean();
      enrichedMap = new Map(users.map(u => [u.username, u.profilePic]));
    }

    const response = testimonials.map(t => ({
      ...t,
      profilePic: t.profilePic || enrichedMap.get(t.username) || '',
    }));

    res.json(response);
  } catch (err) {
    console.error('GET /api/testimonials error:', err);
    res.status(500).json({ message: 'Failed to fetch testimonials' });
  }
});

router.post(
  '/',
  limiter,
  [
    body('username').trim().notEmpty().withMessage('Username is required').isLength({ max: 100 }),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 1000 }),
    body('profilePic').optional().isURL().withMessage('profilePic must be a URL')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    try {
      let { username, rating, description, profilePic } = req.body;

      // Optional auth enrichment: attach user's profilePic if authenticated and none provided
      try {
        let token = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
          token = req.cookies.token;
        }
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded && decoded.id) {
            const u = await User.findById(decoded.id).select('profilePic');
            if (u && !profilePic && u.profilePic) {
              profilePic = u.profilePic;
            }
          }
        }
      } catch (_) {
        // Silently ignore enrichment errors
      }

      const created = await Testimonial.create({ username, rating, description, profilePic });
      res.status(201).json(created);
    } catch (err) {
      console.error('POST /api/testimonials error:', err);
      res.status(500).json({ message: 'Could not submit rating' });
    }
  }
);

module.exports = router;
