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

// Campus ID validation (can be accessed by any authenticated user)
router.post('/validate-campus-id', requireAuth, campusAmbassadorController.validateCampusId);

// Get student's institute data (for students viewing their campus dashboard)
router.get('/my-institute', requireAuth, campusAmbassadorController.getStudentInstitute);

// Get student dashboard statistics
router.get('/dashboard-stats', requireAuth, campusAmbassadorController.getStudentDashboardStats);

// Get institute students (for filtering in campus dashboard)
router.get('/institutes/:instituteId/students', requireAuth, campusAmbassadorController.getInstituteStudents);

// Reward distribution routes
router.post('/institutes/:instituteId/distribute-coins', requireAuth, requireCampusAmbassador, campusAmbassadorController.distributeCoinsToInstitute);
router.get('/institutes/:instituteId/reward-history', requireAuth, requireCampusAmbassador, campusAmbassadorController.getInstituteRewardHistory);

// Public campus statistics (no auth required)
router.get('/public-stats', campusAmbassadorController.getPublicCampusStats);

module.exports = router;
