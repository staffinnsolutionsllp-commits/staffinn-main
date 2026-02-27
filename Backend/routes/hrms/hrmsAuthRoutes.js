const express = require('express');
const router = express.Router();
const { register, login, getProfile, checkRecruiterRegistration } = require('../../controllers/hrms/hrmsAuthController');
const { authenticateToken } = require('../../middleware/hrmsAuth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.get('/check-recruiter/:recruiterId', checkRecruiterRegistration);

module.exports = router;