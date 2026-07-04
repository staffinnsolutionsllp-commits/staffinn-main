const express = require('express');
const router = express.Router();
const { register, login, getProfile, checkRecruiterRegistration } = require('../../controllers/hrms/hrmsAuthController');
const { authenticateToken } = require('../../middleware/hrmsAuth');
const { validateHRMSAccess } = require('../../middleware/hrmsAccessControl');

// Apply HRMS access control to all routes
// This prevents direct access - users must come through Staffinn dashboard
router.use(validateHRMSAccess);

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.get('/check-recruiter/:recruiterId', checkRecruiterRegistration);

module.exports = router;