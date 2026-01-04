const express = require('express');
const router = express.Router();
const assessmentReportController = require('../controllers/assessmentReportController');
const requireAuth = require('../middleware/requireAuth');
const requireCampusAmbassador = require('../middleware/requireCampusAmbassador');

// ==================== STUDENT ROUTES ====================

// Get student's report summary (available months)
router.get(
  '/student/summary',
  requireAuth,
  assessmentReportController.getStudentReportSummary
);

// Get student's monthly compulsory report
router.get(
  '/student/monthly/compulsory',
  requireAuth,
  assessmentReportController.getStudentCompulsoryReport
);

// Get student's monthly overall report
router.get(
  '/student/monthly/overall',
  requireAuth,
  assessmentReportController.getStudentOverallReport
);

// ==================== CAMPUS AMBASSADOR ROUTES ====================

// Get specific student's report
router.get(
  '/campus-ambassador/student/:studentId/monthly',
  requireAuth,
  requireCampusAmbassador,
  assessmentReportController.getStudentReportForAmbassador
);

// Get all students' reports for an institute
router.get(
  '/campus-ambassador/institute/:instituteId/students',
  requireAuth,
  requireCampusAmbassador,
  assessmentReportController.getInstituteStudentsReports
);

// Get report filters (courses, semesters, available months)
router.get(
  '/campus-ambassador/institute/:instituteId/filters',
  requireAuth,
  requireCampusAmbassador,
  assessmentReportController.getReportFilters
);

// Get bulk report data for PDF generation
router.post(
  '/campus-ambassador/bulk',
  requireAuth,
  requireCampusAmbassador,
  assessmentReportController.getBulkReportData
);

module.exports = router;
