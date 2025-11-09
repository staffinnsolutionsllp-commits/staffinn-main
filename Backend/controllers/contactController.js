/**
 * Contact Controller
 * Handles contact history operations
 */
const contactModel = require('../models/contactModel');
const staffModel = require('../models/staffModel');

/**
 * Create a new contact record
 * @route POST /api/contact/record
 */
const createContactRecord = async (req, res) => {
  try {
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
    
    // Create contact record
    const contactData = {
      userId: req.user.userId,
      staffId: staffId,
      staffName: staffProfile.fullName,
      staffEmail: staffProfile.email,
      staffPhone: staffProfile.phone,
      contactMethod: contactMethod
    };
    
    const contactRecord = await contactModel.createContactRecord(contactData);
    
    res.status(201).json({
      success: true,
      message: 'Contact record created successfully',
      data: contactRecord
    });
    
  } catch (error) {
    console.error('Create contact record error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create contact record'
    });
  }
};

/**
 * Get contact history for current user
 * @route GET /api/contact/history
 */
const getContactHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const contactHistory = await contactModel.getContactHistory(req.user.userId);
    
    res.status(200).json({
      success: true,
      data: contactHistory
    });
    
  } catch (error) {
    console.error('Get contact history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get contact history'
    });
  }
};

module.exports = {
  createContactRecord,
  getContactHistory
};