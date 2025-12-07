const express = require('express');
const router = express.Router();
const tutorFeedbackController = require('../controllers/tutorFeedbackController');

// Get feedback for a specific tutor (public route - anyone can view)
router.get('/:tutorId/feedback', tutorFeedbackController.getTutorFeedback);

module.exports = router;
