const express = require('express');
const router = express.Router();
const {
  registerCompany,
  getCompanyProfile,
  regenerateApiKey,
  registerDevice,
  getDevices,
  validateCredentials,
  getCompaniesByRecruiterId
} = require('../../controllers/hrms/hrmsCompanyController');

// Public routes (no auth required)
router.post('/register', registerCompany);
router.post('/validate', validateCredentials);

// Protected routes (require company context)
router.get('/:companyId/profile', getCompanyProfile);
router.post('/:companyId/regenerate-key', regenerateApiKey);
router.post('/:companyId/devices', registerDevice);
router.get('/:companyId/devices', getDevices);

// Get companies by recruiterId
router.get('/recruiter/:recruiterId', getCompaniesByRecruiterId);

module.exports = router;
