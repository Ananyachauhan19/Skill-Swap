const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const Testimonial = require('../models/Testimonial');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: 'Too many requests, please try again later.'
});

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const testimonials = await Testimonial.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    res.json(testimonials);
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
      const { username, rating, description, profilePic } = req.body;
      const created = await Testimonial.create({ username, rating, description, profilePic });
      res.status(201).json(created);
    } catch (err) {
      console.error('POST /api/testimonials error:', err);
      res.status(500).json({ message: 'Could not submit rating' });
    }
  }
);

module.exports = router;
