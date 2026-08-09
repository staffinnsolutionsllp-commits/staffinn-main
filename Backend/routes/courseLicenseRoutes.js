/**
 * Course License Routes
 * Handles recruiter course seat purchases and employee assignments
 */
const express = require('express');
const router = express.Router();
const courseLicenseController = require('../controllers/courseLicenseController');
const { authenticate } = require('../middleware/auth');

// ─── Recruiter Routes (require StaffInn auth) ────────────────────────────────

// Create a course license (after payment)
router.post('/create', authenticate, courseLicenseController.createLicense);

// Get all my licenses
router.get('/', authenticate, courseLicenseController.getMyLicenses);

// Get license details with assignments
router.get('/:licenseId', authenticate, courseLicenseController.getLicenseDetails);

// Get available employees for a license
router.get('/:licenseId/available-employees', authenticate, courseLicenseController.getAvailableEmployees);

// Assign course seats to employees
router.post('/:licenseId/assign', authenticate, courseLicenseController.assignToEmployees);

// Revoke an assignment
router.put('/assignments/:assignmentId/revoke', authenticate, courseLicenseController.revokeAssignment);

module.exports = router;
