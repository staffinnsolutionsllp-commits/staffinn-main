/**
 * Registration Request Routes
 * Routes for handling registration requests
 */

const express = require('express');
const registrationRequestController = require('../controllers/registrationRequestController');
const { authenticate, authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/registration-requests
 * @desc Create a new registration request
 * @access Public
 */
router.post('/', registrationRequestController.createRegistrationRequest);

/**
 * @route GET /api/registration-requests
 * @desc Get all registration requests (Admin only)
 * @access Private
 */
router.get('/', authenticateAdmin, registrationRequestController.getAllRegistrationRequests);

/**
 * @route GET /api/registration-requests/:type
 * @desc Get registration requests by type (Admin only)
 * @access Private
 */
router.get('/:type', authenticateAdmin, registrationRequestController.getRegistrationRequestsByType);

/**
 * @route PUT /api/registration-requests/:requestId/status
 * @desc Update registration request status (Admin only)
 * @access Private
 */
router.put('/:requestId/status', authenticateAdmin, registrationRequestController.updateRegistrationRequestStatus);

/**
 * @route DELETE /api/registration-requests/:requestId
 * @desc Delete registration request (Admin only)
 * @access Private
 */
router.delete('/:requestId', authenticateAdmin, registrationRequestController.deleteRegistrationRequest);

/**
 * @route PUT /api/registration-requests/:requestId/approve
 * @desc Approve registration request (Admin only)
 * @access Private
 */
router.put('/:requestId/approve', authenticateAdmin, registrationRequestController.approveRequest);

/**
 * @route PUT /api/registration-requests/:requestId/reject
 * @desc Reject registration request (Admin only)
 * @access Private
 */
router.put('/:requestId/reject', authenticateAdmin, registrationRequestController.rejectRequest);

module.exports = router;