/**
 * Campus Request Controller
 * Handles campus invite requests between institutes and recruiters
 */

const campusRequestModel = require('../models/campusRequestModel');
const userModel = require('../models/userModel');

/**
 * Send campus invite request
 * @route POST /api/campus-requests/send
 */
const sendCampusRequest = async (req, res) => {
  try {
    const { recruiterId } = req.body;
    const instituteId = req.user.userId;
    
    // Verify user is an institute
    if (req.user.role !== 'institute') {
      return res.status(403).json({
        success: false,
        message: 'Only institutes can send campus invite requests'
      });
    }
    
    if (!recruiterId) {
      return res.status(400).json({
        success: false,
        message: 'Recruiter ID is required'
      });
    }
    
    // Check if request already exists
    const existingRequest = await campusRequestModel.checkExistingRequest(instituteId, recruiterId);
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Campus invite request already sent to this recruiter'
      });
    }
    
    // Get institute and recruiter data
    const institute = await userModel.findUserById(instituteId);
    const recruiter = await userModel.findUserById(recruiterId);
    
    if (!recruiter || recruiter.role !== 'recruiter') {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }
    
    // Create campus request
    const result = await campusRequestModel.createCampusRequest(
      instituteId,
      recruiterId,
      institute,
      recruiter
    );
    
    res.status(201).json({
      success: true,
      message: 'Campus invite request sent successfully',
      data: result.data
    });
    
  } catch (error) {
    console.error('Send campus request error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send campus invite request'
    });
  }
};

/**
 * Get campus requests sent by institute
 * @route GET /api/campus-requests/institute
 */
const getInstituteCampusRequests = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    
    // Verify user is an institute
    if (req.user.role !== 'institute') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const requests = await campusRequestModel.getRequestsByInstitute(instituteId);
    
    res.status(200).json({
      success: true,
      data: requests
    });
    
  } catch (error) {
    console.error('Get institute campus requests error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get campus requests'
    });
  }
};

/**
 * Get campus requests received by recruiter
 * @route GET /api/campus-requests/recruiter
 */
const getRecruiterCampusRequests = async (req, res) => {
  try {
    const recruiterId = req.user.userId;
    
    // Verify user is a recruiter
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const requests = await campusRequestModel.getRequestsByRecruiter(recruiterId);
    
    res.status(200).json({
      success: true,
      data: requests
    });
    
  } catch (error) {
    console.error('Get recruiter campus requests error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get campus requests'
    });
  }
};

/**
 * Update campus request status
 * @route PUT /api/campus-requests/:requestId/status
 */
const updateCampusRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    
    // Verify user is a recruiter
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Only recruiters can update request status'
      });
    }
    
    if (!['accepted', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: accepted, rejected, or pending'
      });
    }
    
    const result = await campusRequestModel.updateRequestStatus(requestId, status);
    
    res.status(200).json({
      success: true,
      message: 'Request status updated successfully',
      data: result.data
    });
    
  } catch (error) {
    console.error('Update campus request status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update request status'
    });
  }
};

/**
 * Delete campus request
 * @route DELETE /api/campus-requests/:requestId
 */
const deleteCampusRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Both institutes and recruiters can delete requests
    if (req.user.role !== 'institute' && req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const result = await campusRequestModel.deleteCampusRequest(requestId);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
    
  } catch (error) {
    console.error('Delete campus request error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete request'
    });
  }
};

module.exports = {
  sendCampusRequest,
  getInstituteCampusRequests,
  getRecruiterCampusRequests,
  updateCampusRequestStatus,
  deleteCampusRequest
};
