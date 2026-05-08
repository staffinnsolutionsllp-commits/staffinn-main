/**
 * Campus Request Routes
 * Routes for campus invite requests
 */

const express = require('express');
const campusRequestController = require('../controllers/campusRequestController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/campus-requests/send
 * @desc Send campus invite request
 * @access Private (Institute only)
 */
router.post('/send', authenticate, campusRequestController.sendCampusRequest);

/**
 * @route GET /api/campus-requests/institute
 * @desc Get campus requests sent by institute
 * @access Private (Institute only)
 */
router.get('/institute', authenticate, campusRequestController.getInstituteCampusRequests);

/**
 * @route GET /api/campus-requests/recruiter
 * @desc Get campus requests received by recruiter
 * @access Private (Recruiter only)
 */
router.get('/recruiter', authenticate, campusRequestController.getRecruiterCampusRequests);

/**
 * @route PUT /api/campus-requests/:requestId/status
 * @desc Update campus request status
 * @access Private (Recruiter only)
 */
router.put('/:requestId/status', authenticate, campusRequestController.updateCampusRequestStatus);

/**
 * @route DELETE /api/campus-requests/:requestId
 * @desc Delete campus request
 * @access Private (Institute or Recruiter)
 */
router.delete('/:requestId', authenticate, campusRequestController.deleteCampusRequest);

module.exports = router;
