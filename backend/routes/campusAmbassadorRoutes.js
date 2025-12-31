const express = require('express');
const router = express.Router();
const multer = require('multer');
const requireAuth = require('../middleware/requireAuth');
const requireCampusAmbassador = require('../middleware/requireCampusAmbassador');
const campusAmbassadorController = require('../controllers/campusAmbassadorController');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Institute management routes
router.post('/institutes', requireAuth, requireCampusAmbassador, upload.single('campusBackgroundImage'), campusAmbassadorController.createInstitute);
router.get('/institutes', requireAuth, requireCampusAmbassador, campusAmbassadorController.getMyInstitutes);
router.get('/institutes/:id', requireAuth, requireCampusAmbassador, campusAmbassadorController.getInstituteById);
router.put('/institutes/:id', requireAuth, requireCampusAmbassador, upload.single('campusBackgroundImage'), campusAmbassadorController.updateInstitute);
router.delete('/institutes/:id', requireAuth, requireCampusAmbassador, campusAmbassadorController.deleteInstitute);

// Student onboarding
router.post('/institutes/:instituteId/upload-students', requireAuth, requireCampusAmbassador, upload.single('excelFile'), campusAmbassadorController.uploadStudents);
router.post('/institutes/:instituteId/add-student', requireAuth, requireCampusAmbassador, campusAmbassadorController.addSingleStudent);

// Course management routes (manual / API based, Excel upload deprecated)
router.put('/institutes/:instituteId/courses', requireAuth, requireCampusAmbassador, campusAmbassadorController.updateInstituteCourses);
router.get('/institutes/:instituteId/courses', requireAuth, requireCampusAmbassador, campusAmbassadorController.getInstituteCourses);

// Campus ID validation (can be accessed by any authenticated user)
router.post('/validate-campus-id', requireAuth, campusAmbassadorController.validateCampusId);

// Get student's institute data (for students viewing their campus dashboard)
router.get('/my-institute', requireAuth, campusAmbassadorController.getStudentInstitute);

// Get student dashboard statistics
router.get('/dashboard-stats', requireAuth, campusAmbassadorController.getStudentDashboardStats);

// New redesigned student campus home dashboard data
router.get('/student-home', requireAuth, campusAmbassadorController.getStudentHomeDashboard);

// Get institute students (for filtering in campus dashboard)
router.get('/institutes/:instituteId/students', requireAuth, campusAmbassadorController.getInstituteStudents);

// Update student in institute
router.put('/institutes/:instituteId/students/:studentId', requireAuth, requireCampusAmbassador, campusAmbassadorController.updateInstituteStudent);

// Delete student from institute
router.delete('/institutes/:instituteId/students/:studentId', requireAuth, requireCampusAmbassador, campusAmbassadorController.deleteInstituteStudent);

// Reward distribution routes
router.post('/institutes/:instituteId/distribute-coins', requireAuth, requireCampusAmbassador, campusAmbassadorController.distributeCoinsToInstitute);
router.get('/institutes/:instituteId/reward-history', requireAuth, requireCampusAmbassador, campusAmbassadorController.getInstituteRewardHistory);

// Public campus statistics (no auth required)
router.get('/public-stats', campusAmbassadorController.getPublicCampusStats);

// Get college assessments with analytics
router.get('/institutes/:instituteId/assessments', requireAuth, requireCampusAmbassador, campusAmbassadorController.getCollegeAssessments);

// Get assessment attempt details (answer sheet)
router.get('/assessment-attempt/:studentId/:assessmentId', requireAuth, requireCampusAmbassador, campusAmbassadorController.getAssessmentAttemptDetails);

// Activity log routes
router.get('/activity-logs', requireAuth, requireCampusAmbassador, campusAmbassadorController.getMyActivityLogs);
router.get('/activity-stats', requireAuth, requireCampusAmbassador, campusAmbassadorController.getMyActivityStats);

module.exports = router;
