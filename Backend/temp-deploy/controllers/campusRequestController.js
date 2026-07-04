/**
 * Campus Request Controller
 * Handles campus invite requests between institutes and recruiters
 * Enhanced with full enterprise-grade placement drive flow
 */

const campusRequestModel = require('../models/campusRequestModel');
const userModel = require('../models/userModel');

/**
 * Send campus invite request (full enterprise form)
 * @route POST /api/campus-requests/send
 */
const sendCampusRequest = async (req, res) => {
  try {
    const { recruiterId, selectedDates, formData } = req.body;
    const instituteId = req.user.userId;

    if (req.user.role !== 'institute') {
      return res.status(403).json({ success: false, message: 'Only institutes can send campus invite requests' });
    }

    if (!recruiterId) {
      return res.status(400).json({ success: false, message: 'Recruiter ID is required' });
    }

    // Check if request already exists
    const existingRequest = await campusRequestModel.checkExistingRequest(instituteId, recruiterId);
    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'Campus invite request already sent to this recruiter' });
    }

    const institute = await userModel.findUserById(instituteId);
    const recruiter = await userModel.findUserById(recruiterId);

    if (!recruiter || recruiter.role !== 'recruiter') {
      return res.status(404).json({ success: false, message: 'Recruiter not found' });
    }

    const result = await campusRequestModel.createCampusRequest(
      instituteId, recruiterId, institute, recruiter, formData || {}, selectedDates || []
    );

    // Emit real-time notification to recruiter
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`recruiter-${recruiterId}`).emit('campus-invite-received', {
          invite: result.data,
          timestamp: new Date().toISOString()
        });
      }
    } catch (wsErr) {
      console.error('WebSocket emit error:', wsErr);
    }

    res.status(201).json({ success: true, message: 'Campus invite sent successfully', data: result.data });
  } catch (error) {
    console.error('Send campus request error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send campus invite request' });
  }
};

/**
 * Get campus requests sent by institute
 * @route GET /api/campus-requests/institute
 */
const getInstituteCampusRequests = async (req, res) => {
  try {
    const instituteId = req.user.userId;

    if (req.user.role !== 'institute') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const requests = await campusRequestModel.getRequestsByInstitute(instituteId);

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error('Get institute campus requests error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get campus requests' });
  }
};

/**
 * Get campus requests received by recruiter
 * @route GET /api/campus-requests/recruiter
 */
const getRecruiterCampusRequests = async (req, res) => {
  try {
    const recruiterId = req.user.userId;

    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const requests = await campusRequestModel.getRequestsByRecruiter(recruiterId);

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error('Get recruiter campus requests error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get campus requests' });
  }
};

/**
 * Update campus request status (legacy simple accept/reject)
 * @route PUT /api/campus-requests/:requestId/status
 */
const updateCampusRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can update request status' });
    }

    if (!['accepted', 'rejected', 'pending', 'confirmed', 'tentative', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const result = await campusRequestModel.updateRequestStatus(requestId, status);

    // Emit real-time status update to institute
    try {
      const io = req.app.get('io');
      if (io && result.data && result.data.instituteId) {
        io.to(`institute-${result.data.instituteId}`).emit('campus-invite-status-update', {
          requestId,
          status,
          recruiterName: result.data.recruiterName,
          timestamp: new Date().toISOString()
        });
      }
    } catch (wsErr) {
      console.error('WebSocket emit error:', wsErr);
    }

    res.status(200).json({ success: true, message: 'Request status updated successfully', data: result.data });
  } catch (error) {
    console.error('Update campus request status error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update request status' });
  }
};

/**
 * Save recruiter response (full confirmation details or draft)
 * @route PUT /api/campus-requests/:requestId/respond
 */
const respondToCampusRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { responseData, isDraft } = req.body;

    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can respond to campus invites' });
    }

    if (!responseData) {
      return res.status(400).json({ success: false, message: 'Response data is required' });
    }

    const result = await campusRequestModel.saveRecruiterResponse(requestId, responseData, isDraft === true);

    // Emit real-time update to institute
    try {
      const io = req.app.get('io');
      if (io && result.data && result.data.instituteId) {
        const instituteId = result.data.instituteId;

        // 1. Notify institute of status change
        io.to(`institute-${instituteId}`).emit('campus-invite-status-update', {
          requestId,
          status: result.data.status,
          recruiterName: result.data.recruiterName,
          recruiterResponse: result.data.recruiterResponse,
          timestamp: new Date().toISOString()
        });

        // 2. Broadcast slot availability update to ALL parties watching this institute
        //    (other recruiters who have open invites from the same institute)
        if (!isDraft && responseData.preferredDate && responseData.preferredTimeSlot) {
          const slotBookingModel = require('../models/campusSlotBookingModel');
          const availabilityMap = await slotBookingModel.getSlotAvailabilityMap(instituteId);

          // Emit to institute room
          io.to(`institute-${instituteId}`).emit('slot-availability-update', {
            instituteId,
            availabilityMap,
            timestamp: new Date().toISOString()
          });

          // Emit to a shared institute-availability room that all recruiters join
          io.to(`availability-${instituteId}`).emit('slot-availability-update', {
            instituteId,
            availabilityMap,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (wsErr) {
      console.error('WebSocket emit error:', wsErr);
    }

    const message = isDraft
      ? 'Response saved as draft'
      : result.data.status === 'confirmed'
        ? 'Campus drive confirmed successfully'
        : result.data.status === 'declined'
          ? 'Invitation declined'
          : 'Response saved successfully';

    res.status(200).json({ success: true, message, data: result.data });
  } catch (error) {
    console.error('Respond to campus request error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to save response' });
  }
};

/**
 * Get slot availability for an institute
 * @route GET /api/campus-requests/slot-availability/:instituteId
 * @access Private (Institute or Recruiter)
 */
const getSlotAvailability = async (req, res) => {
  try {
    const { instituteId } = req.params;
    if (!instituteId) {
      return res.status(400).json({ success: false, message: 'instituteId is required' });
    }

    const slotBookingModel = require('../models/campusSlotBookingModel');
    const availabilityMap = await slotBookingModel.getSlotAvailabilityMap(instituteId);

    res.status(200).json({ success: true, data: availabilityMap });
  } catch (error) {
    console.error('Get slot availability error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get slot availability', data: {} });
  }
};

/**
 * Get On-Campus courses for the logged-in institute
 * @route GET /api/campus-requests/institute-courses
 */
const getInstituteCampusCourses = async (req, res) => {
  try {
    if (req.user.role !== 'institute') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const instituteId = req.user.userId;
    const dynamoService = require('../services/dynamoService');
    const COURSES_TABLE = 'staffinn-courses';

    const params = {
      FilterExpression: 'instituteId = :instituteId AND isActive = :isActive',
      ExpressionAttributeValues: {
        ':instituteId': instituteId,
        ':isActive': true
      }
    };

    const allCourses = await dynamoService.scanItems(COURSES_TABLE, params);

    // Filter only On-Campus / Offline courses
    const onCampusCourses = (allCourses || [])
      .filter(c => c.mode === 'On Campus' || c.mode === 'Offline' || c.mode === 'on-campus' || c.mode === 'On-Campus')
      .map(c => ({
        id: c.coursesId || c.id,
        name: c.courseName || c.name || 'Unnamed Course',
        mode: c.mode
      }));

    res.status(200).json({ success: true, data: onCampusCourses });
  } catch (error) {
    console.error('Get institute campus courses error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get courses', data: [] });
  }
};

/**
 * Delete a campus request
 * @route DELETE /api/campus-requests/:requestId
 */
const deleteCampusRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (req.user.role !== 'institute' && req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const result = await campusRequestModel.deleteCampusRequest(requestId);

    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error('Delete campus request error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete request' });
  }
};

module.exports = {
  sendCampusRequest,
  getInstituteCampusRequests,
  getRecruiterCampusRequests,
  updateCampusRequestStatus,
  respondToCampusRequest,
  getSlotAvailability,
  getInstituteCampusCourses,
  deleteCampusRequest
};
