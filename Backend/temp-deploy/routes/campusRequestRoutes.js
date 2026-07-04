/**
 * Campus Request Routes
 * Routes for campus invite requests — enterprise-grade placement drive flow
 */

const express = require('express');
const campusRequestController = require('../controllers/campusRequestController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /send — Institute sends campus invite
router.post('/send', authenticate, campusRequestController.sendCampusRequest);

// GET /institute-courses — On-Campus courses for logged-in institute
router.get('/institute-courses', authenticate, campusRequestController.getInstituteCampusCourses);

// GET /slot-availability/:instituteId — Slot booking map for an institute
// Accessible by both institutes and recruiters (both need to check availability)
router.get('/slot-availability/:instituteId', authenticate, campusRequestController.getSlotAvailability);

// GET /institute — All requests sent by institute
router.get('/institute', authenticate, campusRequestController.getInstituteCampusRequests);

// GET /recruiter — All requests received by recruiter
router.get('/recruiter', authenticate, campusRequestController.getRecruiterCampusRequests);

// PUT /:requestId/respond — Recruiter full response (confirm/draft/decline)
router.put('/:requestId/respond', authenticate, campusRequestController.respondToCampusRequest);

// PUT /:requestId/status — Legacy simple status update
router.put('/:requestId/status', authenticate, campusRequestController.updateCampusRequestStatus);

// DELETE /:requestId
router.delete('/:requestId', authenticate, campusRequestController.deleteCampusRequest);

module.exports = router;
