const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const assignmentController = require('../controllers/assignmentController');

const router = express.Router();

// Configure multer for assignment submissions
const assignmentUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for assignment files
  }
});

// Submit assignment
router.post('/:assignmentId/submit', 
  authenticate, 
  assignmentUpload.single('file'),
  assignmentController.submitAssignment
);

// Get user submissions for assignment
router.get('/:assignmentId/submissions', 
  authenticate,
  assignmentController.getUserSubmissions
);

module.exports = router;