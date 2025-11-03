const express = require('express');
const router = express.Router();
const skillsCtrl = require('../controllers/skillsController');

// GET /api/skills-list
router.get('/skills-list', skillsCtrl.getSkillsList);

module.exports = router;
