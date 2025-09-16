/**
 * Authentication Routes
 * Routes for user registration, login, and authentication
 */

const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', authController.register);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route PUT /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.put('/change-password', authenticate, authController.changePassword);

/**
 * @route POST /api/auth/request-help
 * @desc Submit help request for blocked users
 * @access Public
 */
router.post('/request-help', authController.requestHelp);

/**
 * @route GET /api/auth/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @route POST /api/auth/create-test-enrollment
 * @desc Create test enrollment for debugging (development only)
 * @access Private
 */
router.post('/create-test-enrollment', authenticate, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Test endpoints not available in production'
      });
    }

    const userId = req.user.userId;
    const { v4: uuidv4 } = require('uuid');
    const dynamoService = require('../services/dynamoService');

    // Create test course
    const courseId = uuidv4();
    const testCourse = {
      coursesId: courseId,
      instituteId: 'test-institute-id',
      courseName: 'Test JavaScript Course',
      duration: '3 months',
      fees: 5000,
      instructor: 'John Doe',
      category: 'Programming',
      mode: 'Online',
      description: 'Learn JavaScript from basics to advanced',
      modules: [
        {
          moduleId: uuidv4(),
          title: 'Introduction to JavaScript',
          content: [
            {
              contentId: uuidv4(),
              title: 'Variables and Data Types',
              type: 'video',
              fileUrl: 'https://example.com/video1.mp4'
            }
          ]
        }
      ],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    // Create test enrollment
    const enrollmentId = uuidv4();
    const testEnrollment = {
      enrolledID: enrollmentId,
      userId: userId,
      courseId: courseId,
      enrollmentDate: new Date().toISOString(),
      progressPercentage: 25,
      status: 'active'
    };

    await dynamoService.putItem('staffinn-courses', testCourse);
    await dynamoService.putItem('course-enrolled-user', testEnrollment);

    res.status(201).json({
      success: true,
      message: 'Test enrollment created',
      data: {
        courseId,
        enrollmentId,
        userId
      }
    });
  } catch (error) {
    console.error('Create test enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test enrollment',
      error: error.message
    });
  }
});

module.exports = router;