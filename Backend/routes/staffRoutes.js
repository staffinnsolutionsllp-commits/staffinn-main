/**
 * Staff Routes
 * Defines all routes for staff-related operations
 */
const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');

// Import auth middleware
const { authenticate } = require('../middleware/auth');

// Public routes (no authentication required)

/**
 * @route GET /api/staff/active-profiles
 * @desc Get all active staff profiles (public)
 * @access Public
 */
router.get('/active-profiles', staffController.getActiveStaffProfiles);

/**
 * @route GET /api/staff/profile/:staffId
 * @desc Get specific staff profile by ID (public)
 * @access Public
 */
router.get('/profile/:staffId', staffController.getStaffProfileById);

/**
 * @route GET /api/staff/trending
 * @desc Get trending staff profiles based on profile views (public)
 * @access Public
 */
router.get('/trending', staffController.getTrendingStaff);

/**
 * @route GET /api/staff/search
 * @desc Search staff profiles by sector, role, location, etc. (public)
 * @access Public
 */
router.get('/search', staffController.searchStaff);

/**
 * @route POST /api/staff/register
 * @desc Register a new staff member
 * @access Public
 */
router.post('/register', staffController.registerStaff);

// Testing routes for debugging (REMOVE IN PRODUCTION)
/**
 * @route POST /api/staff/test-with-userid
 * @desc Test endpoint with manual userId (for debugging only)
 * @access Public (TESTING ONLY)
 */
router.post('/test-with-userid', async (req, res) => {
  try {
    const { userId, action, data } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required for testing'
      });
    }
    
    // Mock req.user for testing
    req.user = { 
      userId, 
      role: 'staff',
      email: 'test@example.com' 
    };
    
    console.log('Test request with user:', req.user);
    
    // Route to different actions
    switch (action) {
      case 'get-profile':
        return await staffController.getStaffProfile(req, res);
      case 'toggle-mode':
        req.body = data; // Set the toggle data
        return await staffController.toggleProfileMode(req, res);
      case 'update-profile':
        req.body = data; // Set the update data
        return await staffController.updateStaffProfile(req, res);
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: get-profile, toggle-mode, update-profile'
        });
    }
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Protected routes (authentication required)

/**
 * @route GET /api/staff/profile
 * @desc Get current user's staff profile
 * @access Private
 */
router.get('/profile', authenticate, staffController.getStaffProfile);

/**
 * @route GET /api/staff/debug-profile
 * @desc Debug endpoint to check staff profile status
 * @access Private
 */
router.get('/debug-profile', authenticate, async (req, res) => {
  try {
    const staffModel = require('../models/staffModel');
    const profile = await staffModel.getStaffProfile(req.user.userId);
    
    res.json({
      success: true,
      debug: {
        userId: req.user.userId,
        userRole: req.user.role,
        profileExists: !!profile,
        isActiveStaff: profile ? profile.isActiveStaff : null,
        isActiveStaffType: profile ? typeof profile.isActiveStaff : null,
        fullProfile: profile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route PUT /api/staff/profile
 * @desc Update current user's staff profile
 * @access Private
 */
router.put('/profile', authenticate, staffController.updateStaffProfile);

/**
 * @route PUT /api/staff/toggle-mode
 * @desc Toggle profile mode between Active Staff and Seeker
 * @access Private
 */
router.put('/toggle-mode', authenticate, staffController.toggleProfileMode);

/**
 * @route POST /api/staff/upload
 * @desc Upload files (profile photo, resume, certificates)
 * @access Private
 */
router.post('/upload', authenticate, staffController.uploadFiles);

/**
 * @route DELETE /api/staff/profile-photo
 * @desc Remove profile photo
 * @access Private
 */
router.delete('/profile-photo', authenticate, staffController.removeProfilePhoto);

/**
 * @route DELETE /api/staff/certificate/:certificateId
 * @desc Delete a certificate from user's profile
 * @access Private
 */
router.delete('/certificate/:certificateId', authenticate, staffController.deleteCertificate);

// Admin only routes

/**
 * @route GET /api/staff/all
 * @desc Get all staff members (Admin only)
 * @access Private (Admin)
 */
router.get('/all', authenticate, staffController.getAllStaff);

/**
 * @route DELETE /api/staff/:staffId
 * @desc Delete staff profile (Admin only)
 * @access Private (Admin)
 */
router.delete('/:staffId', authenticate, staffController.deleteStaff);

module.exports = router;