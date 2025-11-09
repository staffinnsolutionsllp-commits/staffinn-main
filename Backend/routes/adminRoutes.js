/**
 * Admin Routes
 * Defines all routes for admin operations
 */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const jwtUtils = require('../utils/jwtUtils');
    const decoded = jwtUtils.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }
    
    // Check if it's admin role
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    // Add admin user to request object
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    console.error('Admin authentication error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

// Public routes (no authentication required)

/**
 * @route POST /api/admin/login
 * @desc Admin login
 * @access Public
 */
router.post('/login', adminController.adminLogin);

/**
 * @route POST /api/admin/initialize
 * @desc Initialize default admin (for setup)
 * @access Public (should be restricted in production)
 */
router.post('/initialize', adminController.initializeAdmin);

// Protected routes (admin authentication required)

/**
 * @route POST /api/admin/change-password
 * @desc Change admin password
 * @access Private (Admin)
 */
router.post('/change-password', authenticateAdmin, adminController.changeAdminPassword);

/**
 * @route GET /api/admin/dashboard
 * @desc Get dashboard data with real-time metrics
 * @access Private (Admin)
 */
router.get('/dashboard', authenticateAdmin, adminController.getDashboardData);

// Staff management routes

/**
 * @route GET /api/admin/staff/users
 * @desc Get all staff users
 * @access Private (Admin)
 */
router.get('/staff/users', authenticateAdmin, adminController.getAllStaffUsers);

/**
 * @route GET /api/admin/staff/dashboard
 * @desc Get staff dashboard data for all users
 * @access Private (Admin)
 */
router.get('/staff/dashboard', authenticateAdmin, adminController.getStaffDashboardData);

/**
 * @route GET /api/admin/staff/profile/:userId
 * @desc Get specific staff profile
 * @access Private (Admin)
 */
router.get('/staff/profile/:userId', authenticateAdmin, adminController.getStaffProfileForAdmin);

/**
 * @route PUT /api/admin/staff/toggle-visibility/:userId
 * @desc Toggle staff profile visibility (show/hide)
 * @access Private (Admin)
 */
router.put('/staff/toggle-visibility/:userId', authenticateAdmin, adminController.toggleStaffVisibility);

/**
 * @route PUT /api/admin/staff/toggle-block/:userId
 * @desc Block/Unblock staff user
 * @access Private (Admin)
 */
router.put('/staff/toggle-block/:userId', authenticateAdmin, adminController.toggleStaffBlock);

/**
 * @route DELETE /api/admin/staff/delete/:userId
 * @desc Delete staff user completely
 * @access Private (Admin)
 */
router.delete('/staff/delete/:userId', authenticateAdmin, adminController.deleteStaffUser);

// Issue management routes

/**
 * @route GET /api/admin/issues
 * @desc Get all issues from blocked users
 * @access Private (Admin)
 */
router.get('/issues', authenticateAdmin, adminController.getAllIssues);

/**
 * @route PUT /api/admin/issues/:issueId/resolve
 * @desc Resolve issue and unblock user
 * @access Private (Admin)
 */
router.put('/issues/:issueId/resolve', authenticateAdmin, adminController.resolveIssue);

/**
 * @route DELETE /api/admin/issues/:issueId
 * @desc Delete issue
 * @access Private (Admin)
 */
router.delete('/issues/:issueId', authenticateAdmin, adminController.deleteIssue);

// Recruiter management routes

/**
 * @route GET /api/admin/recruiter/users
 * @desc Get all recruiters
 * @access Private (Admin)
 */
router.get('/recruiter/users', authenticateAdmin, adminController.getAllRecruiters);

/**
 * @route GET /api/admin/recruiter/profile/:recruiterId
 * @desc Get specific recruiter profile
 * @access Private (Admin)
 */
router.get('/recruiter/profile/:recruiterId', authenticateAdmin, adminController.getRecruiterProfileForAdmin);

/**
 * @route PUT /api/admin/recruiter/toggle-visibility/:recruiterId
 * @desc Toggle recruiter visibility (show/hide)
 * @access Private (Admin)
 */
router.put('/recruiter/toggle-visibility/:recruiterId', authenticateAdmin, adminController.toggleRecruiterVisibility);

/**
 * @route PUT /api/admin/recruiter/toggle-block/:recruiterId
 * @desc Block/Unblock recruiter
 * @access Private (Admin)
 */
router.put('/recruiter/toggle-block/:recruiterId', authenticateAdmin, adminController.toggleRecruiterBlock);

/**
 * @route DELETE /api/admin/recruiter/delete/:recruiterId
 * @desc Delete recruiter completely
 * @access Private (Admin)
 */
router.delete('/recruiter/delete/:recruiterId', authenticateAdmin, adminController.deleteRecruiter);

/**
 * @route GET /api/admin/recruiter/:recruiterId/institutes
 * @desc Get institutes linked with recruiter
 * @access Private (Admin)
 */
router.get('/recruiter/:recruiterId/institutes', authenticateAdmin, adminController.getRecruiterInstitutes);

/**
 * @route GET /api/admin/recruiter/:recruiterId/jobs
 * @desc Get jobs posted by recruiter
 * @access Private (Admin)
 */
router.get('/recruiter/:recruiterId/jobs', authenticateAdmin, adminController.getRecruiterJobs);

/**
 * @route GET /api/admin/recruiter/:recruiterId/hiring-history
 * @desc Get recruiter hiring history
 * @access Private (Admin)
 */
router.get('/recruiter/:recruiterId/hiring-history', authenticateAdmin, adminController.getRecruiterHiringHistoryForAdmin);

/**
 * @route GET /api/admin/recruiter/:recruiterId/dashboard
 * @desc Get recruiter dashboard stats
 * @access Private (Admin)
 */
router.get('/recruiter/:recruiterId/dashboard', authenticateAdmin, adminController.getRecruiterDashboardForAdmin);

// Institute and student management routes

/**
 * @route GET /api/admin/institute/:instituteId/students
 * @desc Get students from institute who applied to recruiter jobs
 * @access Private (Admin)
 */
router.get('/institute/:instituteId/students', authenticateAdmin, adminController.getInstituteStudents);

/**
 * @route GET /api/admin/student/profile/:studentId
 * @desc Get student profile
 * @access Private (Admin)
 */
router.get('/student/profile/:studentId', authenticateAdmin, adminController.getStudentProfile);

/**
 * @route GET /api/admin/job/:jobId/candidates
 * @desc Get all candidates (staff and students) for a job
 * @access Private (Admin)
 */
router.get('/job/:jobId/candidates', authenticateAdmin, adminController.getJobCandidates);

// Institute management routes

/**
 * @route GET /api/admin/institute/dashboard
 * @desc Get institute dashboard data (total institutes, courses, students)
 * @access Private (Admin)
 */
router.get('/institute/dashboard', authenticateAdmin, adminController.getInstituteDashboardData);

/**
 * @route GET /api/admin/institute/users
 * @desc Get all institutes
 * @access Private (Admin)
 */
router.get('/institute/users', authenticateAdmin, adminController.getAllInstitutesForAdmin);

/**
 * @route GET /api/admin/institute/profile/:instituteId
 * @desc Get specific institute profile
 * @access Private (Admin)
 */
router.get('/institute/profile/:instituteId', authenticateAdmin, adminController.getInstituteProfileForAdmin);

/**
 * @route PUT /api/admin/institute/toggle-visibility/:instituteId
 * @desc Toggle institute visibility (show/hide)
 * @access Private (Admin)
 */
router.put('/institute/toggle-visibility/:instituteId', authenticateAdmin, adminController.toggleInstituteVisibility);

/**
 * @route PUT /api/admin/institute/toggle-block/:instituteId
 * @desc Block/Unblock institute
 * @access Private (Admin)
 */
router.put('/institute/toggle-block/:instituteId', authenticateAdmin, adminController.toggleInstituteBlock);

/**
 * @route DELETE /api/admin/institute/delete/:instituteId
 * @desc Delete institute completely
 * @access Private (Admin)
 */
router.delete('/institute/delete/:instituteId', authenticateAdmin, adminController.deleteInstitute);

/**
 * @route GET /api/admin/institute/students
 * @desc Get all students across institutes (with optional institute filter)
 * @access Private (Admin)
 */
router.get('/institute/students', authenticateAdmin, adminController.getAllStudents);

/**
 * @route GET /api/admin/institute/student/:studentId
 * @desc Get student profile with full details
 * @access Private (Admin)
 */
router.get('/institute/student/:studentId', authenticateAdmin, adminController.getStudentProfileForAdmin);

/**
 * @route GET /api/admin/institute/courses
 * @desc Get all courses across institutes (with optional institute filter)
 * @access Private (Admin)
 */
router.get('/institute/courses', authenticateAdmin, adminController.getAllCourses);

// Government Schemes management routes

/**
 * @route GET /api/admin/government-schemes
 * @desc Get all government schemes
 * @access Private (Admin)
 */
router.get('/government-schemes', authenticateAdmin, adminController.getAllGovernmentSchemes);

/**
 * @route POST /api/admin/government-schemes
 * @desc Add new government scheme
 * @access Private (Admin)
 */
router.post('/government-schemes', authenticateAdmin, adminController.addGovernmentScheme);

/**
 * @route PUT /api/admin/government-schemes/:schemeId
 * @desc Update government scheme
 * @access Private (Admin)
 */
router.put('/government-schemes/:schemeId', authenticateAdmin, adminController.updateGovernmentScheme);

/**
 * @route DELETE /api/admin/government-schemes/:schemeId
 * @desc Delete government scheme
 * @access Private (Admin)
 */
router.delete('/government-schemes/:schemeId', authenticateAdmin, adminController.deleteGovernmentScheme);

module.exports = router;