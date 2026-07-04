const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Mark content as complete
router.post('/courses/:courseId/content/:contentId/complete', progressController.markContentComplete);

// Mark quiz as complete
router.post('/courses/:courseId/quiz/:quizId/complete', progressController.markQuizComplete);

// Get user progress for a course
router.get('/courses/:courseId/progress', progressController.getUserProgress);

module.exports = router;