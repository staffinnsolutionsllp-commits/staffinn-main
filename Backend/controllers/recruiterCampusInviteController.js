/**
 * Recruiter Campus Invite Controller
 * Handles RECRUITER → INSTITUTE campus invite flow (reverse direction)
 */

const recruiterInviteModel = require('../models/recruiterCampusInviteModel');
const userModel = require('../models/userModel');

/**
 * Recruiter sends campus invite to institute
 * @route POST /api/recruiter-campus-invites/send
 */
const sendRecruiterInvite = async (req, res) => {
  try {
    const { instituteId, formData } = req.body;
    const recruiterId = req.user.userId;

    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can send campus invites' });
    }

    if (!instituteId) {
      return res.status(400).json({ success: false, message: 'Institute ID is required' });
    }

    const recruiter = await userModel.findUserById(recruiterId);
    const institute = await userModel.findUserById(instituteId);

    if (!institute || institute.role !== 'institute') {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }

    const result = await recruiterInviteModel.createRecruiterInvite(
      recruiterId, instituteId, recruiter, institute, formData || {}
    );

    // Emit real-time notification to institute
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`institute-${instituteId}`).emit('recruiter-invite-received', {
          invite: result.data,
          timestamp: new Date().toISOString()
        });
      }
    } catch (wsErr) {
      console.error('WebSocket emit error:', wsErr);
    }

    res.status(201).json({ success: true, message: 'Campus invite sent successfully', data: result.data });
  } catch (error) {
    console.error('Send recruiter invite error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send campus invite' });
  }
};

/**
 * Get invites sent by recruiter
 * @route GET /api/recruiter-campus-invites/sent
 */
const getRecruiterSentInvites = async (req, res) => {
  try {
    const recruiterId = req.user.userId;

    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const invites = await recruiterInviteModel.getInvitesByRecruiter(recruiterId);
    res.status(200).json({ success: true, data: invites });
  } catch (error) {
    console.error('Get recruiter sent invites error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get invites' });
  }
};

/**
 * Get invites received by institute
 * @route GET /api/recruiter-campus-invites/received
 */
const getInstituteReceivedInvites = async (req, res) => {
  try {
    const instituteId = req.user.userId;

    if (req.user.role !== 'institute') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const invites = await recruiterInviteModel.getInvitesByInstitute(instituteId);
    res.status(200).json({ success: true, data: invites });
  } catch (error) {
    console.error('Get institute received invites error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get invites' });
  }
};

/**
 * Institute accepts or declines invite (simple status update)
 * @route PUT /api/recruiter-campus-invites/:inviteId/status
 */
const updateInviteStatus = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { status } = req.body;

    if (req.user.role !== 'institute') {
      return res.status(403).json({ success: false, message: 'Only institutes can update invite status' });
    }

    if (!['accepted', 'declined', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const result = await recruiterInviteModel.updateInviteStatus(inviteId, status);

    // Emit real-time status update to recruiter
    try {
      const io = req.app.get('io');
      if (io && result.data && result.data.recruiterId) {
        io.to(`recruiter-${result.data.recruiterId}`).emit('campus-invite-status-update', {
          inviteId,
          status,
          instituteName: result.data.instituteName,
          timestamp: new Date().toISOString()
        });
      }
    } catch (wsErr) {
      console.error('WebSocket emit error:', wsErr);
    }

    res.status(200).json({ success: true, message: 'Invite status updated', data: result.data });
  } catch (error) {
    console.error('Update invite status error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update status' });
  }
};

/**
 * Institute saves acceptance response with full confirmation details
 * @route PUT /api/recruiter-campus-invites/:inviteId/respond
 */
const respondToRecruiterInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { responseData } = req.body;

    if (req.user.role !== 'institute') {
      return res.status(403).json({ success: false, message: 'Only institutes can respond to invites' });
    }

    if (!responseData) {
      return res.status(400).json({ success: false, message: 'Response data is required' });
    }

    const result = await recruiterInviteModel.saveInstituteResponse(inviteId, responseData);

    // Emit real-time update to recruiter
    try {
      const io = req.app.get('io');
      if (io && result.data && result.data.recruiterId) {
        io.to(`recruiter-${result.data.recruiterId}`).emit('campus-invite-accepted', {
          inviteId,
          instituteName: result.data.instituteName,
          instituteResponse: result.data.instituteResponse,
          timestamp: new Date().toISOString()
        });
      }
    } catch (wsErr) {
      console.error('WebSocket emit error:', wsErr);
    }

    res.status(200).json({ success: true, message: 'Response saved successfully', data: result.data });
  } catch (error) {
    console.error('Respond to recruiter invite error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to save response' });
  }
};

/**
 * Get institute's On-Campus courses (for recruiter to see when sending invite)
 * @route GET /api/recruiter-campus-invites/institute-courses/:instituteId
 */
const getInstituteCourses = async (req, res) => {
  try {
    const { instituteId } = req.params;

    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

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

    // Filter only On-Campus courses
    const onCampusCourses = (allCourses || [])
      .filter(c => c.mode === 'On Campus' || c.mode === 'Offline' || c.mode === 'on-campus' || c.mode === 'On-Campus')
      .map(c => ({
        id: c.coursesId || c.id,
        name: c.courseName || c.name || 'Unnamed Course',
        mode: c.mode
      }));

    res.status(200).json({ success: true, data: onCampusCourses });
  } catch (error) {
    console.error('Get institute courses error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get courses', data: [] });
  }
};

/**
 * Get institute's placement planner dates (for recruiter to see available dates)
 * @route GET /api/recruiter-campus-invites/institute-planner/:instituteId
 */
const getInstitutePlanner = async (req, res) => {
  try {
    const { instituteId } = req.params;

    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const plannerModel = require('../models/campusPlannerModel');
    const planner = await plannerModel.getPlannerByInstitute(instituteId);

    res.status(200).json({ success: true, data: planner || { selectedDates: [] } });
  } catch (error) {
    console.error('Get institute planner error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get planner', data: { selectedDates: [] } });
  }
};

/**
 * Delete an invite
 * @route DELETE /api/recruiter-campus-invites/:inviteId
 */
const deleteInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;

    if (req.user.role !== 'recruiter' && req.user.role !== 'institute') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const result = await recruiterInviteModel.deleteInvite(inviteId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error('Delete invite error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete invite' });
  }
};

module.exports = {
  sendRecruiterInvite,
  getRecruiterSentInvites,
  getInstituteReceivedInvites,
  updateInviteStatus,
  respondToRecruiterInvite,
  getInstituteCourses,
  getInstitutePlanner,
  deleteInvite
};
