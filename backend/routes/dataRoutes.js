const express = require('express');
const router = express.Router();
const { fetchGoogleData } = require('../controllers/dataController');

// GET /api/data/google-sheet - Fetch exams, organizations, roles from Google Sheet
router.get('/google-sheet', fetchGoogleData);

module.exports = router;
