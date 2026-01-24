const express = require('express');
const router = express.Router();
const emailTemplateController = require('../controllers/emailTemplateController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

// All routes require authentication and admin privileges
router.use(requireAuth);
router.use(requireAdmin);

// Get all templates
router.get('/', emailTemplateController.getAllTemplates);

// Get template categories
router.get('/categories', emailTemplateController.getCategories);

// Get single template
router.get('/:identifier', emailTemplateController.getTemplate);

// Create new template
router.post('/', emailTemplateController.createTemplate);

// Update template
router.put('/:identifier', emailTemplateController.updateTemplate);

// Delete template
router.delete('/:identifier', emailTemplateController.deleteTemplate);

// Preview template with sample data
router.post('/:identifier/preview', emailTemplateController.previewTemplate);

// Duplicate template
router.post('/:identifier/duplicate', emailTemplateController.duplicateTemplate);

module.exports = router;
