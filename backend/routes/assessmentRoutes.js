const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const requireAuth = require('../middleware/requireAuth');
const requireCampusAmbassador = require('../middleware/requireCampusAmbassador');

// ==================== CAMPUS AMBASSADOR ROUTES ====================

// Upload assessment via Excel
router.post(
  '/campus-ambassador/assessments/upload',
  requireAuth,
  requireCampusAmbassador,
  assessmentController.uploadAssessment
);

// Get all assessments created by campus ambassador
router.get(
  '/campus-ambassador/assessments',
  requireAuth,
  requireCampusAmbassador,
  assessmentController.getMyAssessments
);

// Get single assessment details (for preview)
router.get(
  '/campus-ambassador/assessments/:id',
  requireAuth,
  requireCampusAmbassador,
  assessmentController.getAssessmentById
);

// Toggle assessment active/inactive
router.patch(
  '/campus-ambassador/assessments/:id/toggle',
  requireAuth,
  requireCampusAmbassador,
  assessmentController.toggleAssessmentStatus
);

// Delete assessment
router.delete(
  '/campus-ambassador/assessments/:id',
  requireAuth,
  requireCampusAmbassador,
  assessmentController.deleteAssessment
);

// Get attempts for a specific assessment
router.get(
  '/campus-ambassador/assessments/:id/attempts',
  requireAuth,
  requireCampusAmbassador,
  assessmentController.getAssessmentAttempts
);

// Get full monthly report (all assessments)
router.get(
  '/campus-ambassador/reports/monthly/full',
  requireAuth,
  requireCampusAmbassador,
  assessmentController.getFullMonthlyReport
);

// Get compulsory-only monthly report
router.get(
  '/campus-ambassador/reports/monthly/compulsory',
  requireAuth,
  requireCampusAmbassador,
  assessmentController.getCompulsoryMonthlyReport
);

// ==================== STUDENT ROUTES ====================

// Get available assessments for student
router.get(
  '/student/assessments',
  requireAuth,
  assessmentController.getStudentAssessments
);

// Start assessment attempt
router.post(
  '/student/assessments/:id/start',
  requireAuth,
  assessmentController.startAssessment
);

// Submit assessment
router.post(
  '/student/assessments/:id/submit',
  requireAuth,
  assessmentController.submitAssessment
);

// Log cheating violation
router.post(
  '/student/assessments/:id/violation',
  requireAuth,
  assessmentController.logViolation
);

// Get assessment result
router.get(
  '/student/assessments/:id/result',
  requireAuth,
  assessmentController.getAssessmentResult
);

// Get all student attempts
router.get(
  '/student/assessment-attempts',
  requireAuth,
  assessmentController.getStudentAttempts
);

module.exports = router;
