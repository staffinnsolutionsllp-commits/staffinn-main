/**
 * Recruiter Routes
 * Routes for recruiter profile and management
 */

const express = require('express');
const recruiterController = require('../controllers/recruiterController');

const { authenticate } = require('../middleware/auth');
const { getRecruiterCandidates } = recruiterController;

const router = express.Router();

/**
 * @route POST /api/recruiter/register
 * @desc Register a new recruiter
 * @access Public
 */
router.post('/register', recruiterController.registerRecruiter);

/**
 * @route GET /api/recruiter/profile
 * @desc Get recruiter profile
 * @access Private (Recruiter only)
 */
router.get('/profile', authenticate, recruiterController.getRecruiterProfile);

/**
 * @route PUT /api/recruiter/profile
 * @desc Update recruiter profile
 * @access Private (Recruiter only)
 */
router.put('/profile', authenticate, recruiterController.updateRecruiterProfile);

/**
 * @route POST /api/recruiter/verify-website
 * @desc Verify website URL
 * @access Private
 */
router.post('/verify-website', authenticate, recruiterController.verifyWebsite);

/**
 * @route GET /api/recruiter/all
 * @desc Get all recruiters (Admin only)
 * @access Private (Admin only)
 */
router.get('/all', authenticate, recruiterController.getAllRecruiters);

/**
 * @route DELETE /api/recruiter/:recruiterId
 * @desc Delete recruiter profile (Admin only)
 * @access Private (Admin only)
 */
router.delete('/:recruiterId', authenticate, recruiterController.deleteRecruiter);

/**
 * @route GET /api/recruiter/public/all
 * @desc Get all recruiters for public listing
 * @access Public
 */
router.get('/public/all', recruiterController.getAllRecruitersPublic);

/**
 * @route GET /api/recruiter/public/:recruiterId
 * @desc Get recruiter by ID for public view
 * @access Public
 */
router.get('/public/:recruiterId', recruiterController.getRecruiterByIdPublic);

/**
 * @route GET /api/recruiter/candidates
 * @desc Get candidates who applied to recruiter's jobs
 * @access Private (Recruiter only)
 */
router.get('/candidates', authenticate, recruiterController.getRecruiterCandidates);

/**
 * @route GET /api/recruiter/stats
 * @desc Get recruiter dashboard stats
 * @access Private (Recruiter only)
 */
router.get('/stats', authenticate, recruiterController.getRecruiterDashboardStats);

/**
 * @route GET /api/recruiter/staff-profile/:staffId
 * @desc Get staff profile for recruiter view (bypasses visibility restrictions)
 * @access Private (Recruiter only)
 */
router.get('/staff-profile/:staffId', authenticate, recruiterController.getStaffProfileForRecruiter);

/**
 * @route GET /api/recruiter/hiring-history
 * @desc Get hiring history for recruiter
 * @access Private (Recruiter only)
 */
router.get('/hiring-history', authenticate, recruiterController.getHiringHistory);

/**
 * @route DELETE /api/recruiter/candidates/:staffId/:applicationId
 * @desc Delete/reject candidate from candidate search
 * @access Private (Recruiter only)
 */
router.delete('/candidates/:staffId/:applicationId', authenticate, recruiterController.deleteCandidateFromSearch);

/**
 * @route PUT /api/recruiter/candidates/:staffId/:applicationId
 * @desc Update candidate status (hire or reject)
 * @access Private (Recruiter only)
 */
router.put('/candidates/:staffId/:applicationId', authenticate, recruiterController.updateCandidateStatus);

/**
 * @route POST /api/recruiter/upload-photo
 * @desc Upload recruiter profile photo
 * @access Private (Recruiter only)
 */
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'recruiter-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.post('/upload-photo', authenticate, upload.single('profilePhoto'), recruiterController.uploadProfilePhoto);

/**
 * @route POST /api/recruiter/:recruiterId/follow
 * @desc Follow a recruiter
 * @access Private (Staff only)
 */
router.post('/:recruiterId/follow', authenticate, recruiterController.followRecruiter);

/**
 * @route DELETE /api/recruiter/:recruiterId/follow
 * @desc Unfollow a recruiter
 * @access Private (Staff only)
 */
router.delete('/:recruiterId/follow', authenticate, recruiterController.unfollowRecruiter);

/**
 * @route GET /api/recruiter/:recruiterId/follow-status
 * @desc Check if user is following a recruiter
 * @access Private
 */
router.get('/:recruiterId/follow-status', authenticate, recruiterController.getFollowStatus);



module.exports = router;