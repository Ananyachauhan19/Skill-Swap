const express = require('express');
const router = express.Router();
const quizementController = require('../controllers/quizementController');
const historyController = require('../controllers/historyController');
const requireAuth = require('../middleware/requireAuth');
const { requireEmployee } = require('../middleware/requireEmployee');

// Employee upload routes
router.get('/quizement/sample-csv', requireEmployee, quizementController.downloadSampleCsv);
router.post('/quizement/upload', requireEmployee, quizementController.uploadTest);

// User routes
router.get('/quizement/tests', requireAuth, quizementController.listTestsForUser);
router.get('/quizement/weekly-quizzes', requireAuth, quizementController.getWeeklyQuizzes);
router.get('/quizement/leaderboard', requireAuth, quizementController.getLeaderboard);
router.get('/quizement/stats', quizementController.getStats);
router.get('/quizement/attempts/history', requireAuth, historyController.getQuizementHistory);
router.get('/quizement/coin-history', requireAuth, quizementController.getCoinHistory);
router.post('/quizement/tests/:testId/unlock', requireAuth, quizementController.unlockTest);
router.post('/quizement/tests/:testId/start', requireAuth, quizementController.startAttempt);
router.post('/quizement/tests/:testId/submit', requireAuth, quizementController.submitAttempt);
router.post('/quizement/tests/:testId/violation', requireAuth, quizementController.logViolation);
router.get('/quizement/tests/:testId/result', requireAuth, quizementController.getResult);

// History routes
router.get('/contributions/history', requireAuth, historyController.getContributionHistory);
router.get('/interview/history', requireAuth, historyController.getInterviewHistory);
router.get('/campus-ambassador/activity-history', requireAuth, historyController.getCampusAmbassadorHistory);

module.exports = router;
