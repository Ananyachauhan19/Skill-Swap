const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

// Public route - Get all active packages
router.get('/packages', packageController.getActivePackages);

// Admin routes
router.get('/admin/packages', requireAuth, requireAdmin, packageController.getAllPackages);
router.get('/admin/packages/:id', requireAuth, requireAdmin, packageController.getPackageById);
router.post('/admin/packages', requireAuth, requireAdmin, packageController.createPackage);
router.put('/admin/packages/:id', requireAuth, requireAdmin, packageController.updatePackage);
router.patch('/admin/packages/:id/deactivate', requireAuth, requireAdmin, packageController.deactivatePackage);
router.delete('/admin/packages/:id', requireAuth, requireAdmin, packageController.deletePackage);

module.exports = router;
