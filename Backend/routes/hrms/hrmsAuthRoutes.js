const express = require('express');
const router = express.Router();
const { register, login, getProfile, checkRecruiterRegistration } = require('../../controllers/hrms/hrmsAuthController');
const hrmsPasswordReset = require('../../controllers/hrms/hrmsPasswordResetController');
const { authenticateToken } = require('../../middleware/hrmsAuth');
const { validateHRMSAccess } = require('../../middleware/hrmsAccessControl');

// Apply HRMS access control to all routes
// This prevents direct access - users must come through Staffinn dashboard
router.use(validateHRMSAccess);

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.get('/check-recruiter/:recruiterId', checkRecruiterRegistration);

// Forgot-password routes (public — no JWT required, access control already allows these)
router.post('/forgot-password/send-otp',  hrmsPasswordReset.sendOTP);
router.post('/forgot-password/verify-otp', hrmsPasswordReset.verifyOTP);
router.post('/forgot-password/reset',      hrmsPasswordReset.resetPassword);
router.post('/forgot-password/resend-otp', hrmsPasswordReset.resendOTP);

module.exports = router;