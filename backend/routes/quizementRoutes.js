const express = require('express');
const router = express.Router();
const quizementController = require('../controllers/quizementController');
const requireAuth = require('../middleware/requireAuth');
const { requireEmployee } = require('../middleware/requireEmployee');

// Employee upload routes
router.get('/quizement/sample-csv', requireEmployee, quizementController.downloadSampleCsv);
router.post('/quizement/upload', requireEmployee, quizementController.uploadTest);

// User routes
router.get('/quizement/tests', requireAuth, quizementController.listTestsForUser);
router.get('/quizement/leaderboard', requireAuth, quizementController.getLeaderboard);
router.post('/quizement/tests/:testId/unlock', requireAuth, quizementController.unlockTest);
router.post('/quizement/tests/:testId/start', requireAuth, quizementController.startAttempt);
router.post('/quizement/tests/:testId/submit', requireAuth, quizementController.submitAttempt);
router.post('/quizement/tests/:testId/violation', requireAuth, quizementController.logViolation);
router.get('/quizement/tests/:testId/result', requireAuth, quizementController.getResult);

module.exports = router;
