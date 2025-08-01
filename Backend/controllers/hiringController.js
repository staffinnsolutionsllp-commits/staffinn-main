/**
 * Hiring Controller
 * Handles hiring-related operations
 */
const hiringModel = require('../models/hiringModel');
const staffModel = require('../models/staffModel');
const userModel = require('../models/userModel');

/**
 * Create a new hiring record
 * @route POST /api/hiring/hire
 */
const hireStaff = async (req, res) => {
  try {
    console.log('Hire staff request:', req.body);
    console.log('Request user:', req.user);
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const { staffId, contactMethod } = req.body;
    
    if (!staffId || !contactMethod) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID and contact method are required'
      });
    }
    
    // Get staff profile
    const staffProfile = await staffModel.getStaffProfile(staffId);
    if (!staffProfile) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found'
      });
    }
    
    // Get seeker (current user) details
    const seekerUser = await userModel.findUserById(req.user.userId);
    if (!seekerUser) {
      return res.status(404).json({
        success: false,
        message: 'Seeker profile not found'
      });
    }
    
    // Create hiring record
    const hiringData = {
      seekerId: req.user.userId,
      staffId: staffId,
      staffName: staffProfile.fullName,
      staffEmail: staffProfile.email,
      staffPhone: staffProfile.phone,
      seekerName: seekerUser.name,
      seekerEmail: seekerUser.email,
      contactMethod: contactMethod
    };
    
    const hiringRecord = await hiringModel.createHiringRecord(hiringData);
    
    res.status(201).json({
      success: true,
      message: 'Hiring record created successfully',
      data: hiringRecord
    });
    
  } catch (error) {
    console.error('Hire staff error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create hiring record'
    });
  }
};

/**
 * Get hiring history for current user
 * @route GET /api/hiring/history
 */
const getHiringHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    let hiringHistory;
    
    if (userRole === 'staff') {
      // Get hiring history where this user was hired
      hiringHistory = await hiringModel.getStaffHiringHistory(userId);
    } else {
      // Get hiring history where this user hired others (seeker mode)
      hiringHistory = await hiringModel.getSeekerHiringHistory(userId);
    }
    
    res.status(200).json({
      success: true,
      data: hiringHistory
    });
    
  } catch (error) {
    console.error('Get hiring history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get hiring history'
    });
  }
};

/**
 * Update hiring record with rating and feedback
 * @route PUT /api/hiring/:hiringId/rate
 */
const rateHiring = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const { hiringId } = req.params;
    const { rating, feedback } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Get existing hiring record to verify ownership
    const existingRecord = await hiringModel.getHiringRecordById(hiringId);
    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Hiring record not found'
      });
    }
    
    // Verify that the current user is the seeker who made the hire
    if (existingRecord.seekerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only rate your own hires'
      });
    }
    
    // Update the record
    const updateData = {
      rating: parseInt(rating),
      feedback: feedback || '',
      status: 'completed'
    };
    
    const updatedRecord = await hiringModel.updateHiringRecord(hiringId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
      data: updatedRecord
    });
    
  } catch (error) {
    console.error('Rate hiring error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit rating'
    });
  }
};

/**
 * Get hiring statistics for current user
 * @route GET /api/hiring/stats
 */
const getHiringStats = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const userId = req.user.userId;
    const userRole = req.user.role;
    const userType = userRole === 'staff' ? 'staff' : 'seeker';
    
    const stats = await hiringModel.getHiringStats(userId, userType);
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get hiring stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get hiring statistics'
    });
  }
};

/**
 * Get specific hiring record details
 * @route GET /api/hiring/:hiringId
 */
const getHiringRecord = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const { hiringId } = req.params;
    
    const hiringRecord = await hiringModel.getHiringRecordById(hiringId);
    if (!hiringRecord) {
      return res.status(404).json({
        success: false,
        message: 'Hiring record not found'
      });
    }
    
    // Verify that the current user is either the seeker or the staff in this record
    if (hiringRecord.seekerId !== req.user.userId && hiringRecord.staffId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.status(200).json({
      success: true,
      data: hiringRecord
    });
    
  } catch (error) {
    console.error('Get hiring record error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get hiring record'
    });
  }
};

module.exports = {
  hireStaff,
  getHiringHistory,
  rateHiring,
  getHiringStats,
  getHiringRecord
};