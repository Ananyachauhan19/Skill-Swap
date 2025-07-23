const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const questionController = require('../controllers/questionController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.post('/ask', upload.single('file'), questionController.createQuestion);
router.get('/', questionController.getQuestions);

module.exports = router; 