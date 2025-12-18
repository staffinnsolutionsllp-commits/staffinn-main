/**
 * Registration Request Controller
 * Handles registration requests for Institute and Recruiter roles
 */

const registrationRequestModel = require('../models/registrationRequestModel');
const { sendApprovalEmail, sendRejectionEmail } = require('../services/emailService');
const { generateSecurePassword } = require('../services/passwordGenerator');
const userModel = require('../models/userModel');

/**
 * Create a new registration request
 * @route POST /api/registration-requests
 */
const createRegistrationRequest = async (req, res) => {
  try {
    const { type, name, email, phoneNumber } = req.body;

    // Validate required fields
    if (!type || !name || !email || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate type
    if (!['institute', 'recruiter'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request type. Must be institute or recruiter'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate phone number
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\D/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    const requestData = {
      type: type.toLowerCase(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim()
    };

    const registrationRequest = await registrationRequestModel.createRegistrationRequest(requestData);

    res.status(201).json({
      success: true,
      message: 'Registration request submitted successfully',
      data: registrationRequest
    });
  } catch (error) {
    console.error('Create registration request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit registration request'
    });
  }
};

/**
 * Get all registration requests
 * @route GET /api/registration-requests
 */
const getAllRegistrationRequests = async (req, res) => {
  try {
    const requests = await registrationRequestModel.getAllRegistrationRequests();
    
    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get registration requests error:', error);
    // Return empty array instead of error for better UX
    res.status(200).json({
      success: true,
      data: []
    });
  }
};

/**
 * Get registration requests by type
 * @route GET /api/registration-requests/:type
 */
const getRegistrationRequestsByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!['institute', 'recruiter'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request type'
      });
    }

    const requests = await registrationRequestModel.getRegistrationRequestsByType(type.toLowerCase());
    
    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get registration requests by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration requests'
    });
  }
};

/**
 * Update registration request status
 * @route PUT /api/registration-requests/:requestId/status
 */
const updateRegistrationRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, adminNotes, instituteType } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected'
      });
    }

    // If approving an institute request, handle institute type
    if (status === 'approved' && instituteType) {
      req.body = { instituteType };
      return await approveRequest(req, res);
    }

    await registrationRequestModel.updateRegistrationRequestStatus(requestId, status, adminNotes);

    res.status(200).json({
      success: true,
      message: 'Registration request status updated successfully'
    });
  } catch (error) {
    console.error('Update registration request status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update registration request status'
    });
  }
};

/**
 * Delete registration request
 * @route DELETE /api/registration-requests/:requestId
 */
const deleteRegistrationRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    await registrationRequestModel.deleteRegistrationRequest(requestId);

    res.status(200).json({
      success: true,
      message: 'Registration request deleted successfully'
    });
  } catch (error) {
    console.error('Delete registration request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete registration request'
    });
  }
};

/**
 * Approve registration request with institute type selection
 * @route PUT /api/registration-requests/:requestId/approve
 */
const approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { instituteType } = req.body; // 'normal' or 'staffinn_partner'
    
    console.log('🔄 Processing approval for request:', requestId, 'with type:', instituteType);
    
    // Get request details
    const request = await registrationRequestModel.getRequestById(requestId);
    if (!request) {
      console.log('❌ Request not found:', requestId);
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    console.log('📋 Request details:', {
      email: request.email,
      name: request.name,
      type: request.type
    });
    
    // Generate password
    const password = generateSecurePassword();
    console.log('🔐 Generated password:', password);
    
    // Check if user already exists
    console.log('🔍 Checking if user already exists...');
    const existingUser = await userModel.getUserByEmail(request.email);
    
    if (existingUser) {
      console.log('⚠️ User already exists, updating password and approval status...');
      const salt = await require('bcryptjs').genSalt(10);
      const hashedPassword = await require('bcryptjs').hash(password, salt);
      
      const updateData = {
        password: hashedPassword,
        isApproved: true
      };
      
      // Add institute type for institutes
      if (request.type === 'institute' && instituteType) {
        updateData.instituteType = instituteType;
        updateData.misApproved = false; // Reset MIS approval status
      }
      
      await userModel.updateUser(existingUser.userId, updateData);
      console.log('✅ User account updated successfully');
    } else {
      // Create user account with proper field mapping
      const userData = {
        email: request.email,
        password: password,
        role: request.type,
        phoneNumber: request.phoneNumber
      };
      
      // Add role-specific name field
      if (request.type === 'recruiter') {
        userData.companyName = request.name;
      } else if (request.type === 'institute') {
        userData.instituteName = request.name;
        userData.instituteType = instituteType || 'normal';
        userData.misApproved = false;
      }
      
      console.log('👤 Creating user account...');
      await userModel.createUser(userData);
      console.log('✅ User account created successfully');
    }
    
    // Send approval email
    console.log('📧 Sending approval email to:', request.email);
    await sendApprovalEmail(request.email, request.name, password, request.type);
    console.log('✅ Approval email sent successfully');
    
    // Update request status
    console.log('🔄 Updating request status to approved...');
    await registrationRequestModel.updateRegistrationRequestStatus(requestId, 'approved');
    console.log('✅ Request status updated to approved');
    
    res.json({ success: true, message: 'Request approved and email sent' });
  } catch (error) {
    console.error('❌ Approve request error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve request' });
  }
};

/**
 * Reject registration request
 * @route PUT /api/registration-requests/:requestId/reject
 */
const rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Get request details
    const request = await registrationRequestModel.getRequestById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    // Send rejection email
    await sendRejectionEmail(request.email, request.name, request.type);
    
    // Update request status
    await registrationRequestModel.updateRegistrationRequestStatus(requestId, 'rejected');
    
    res.json({ success: true, message: 'Request rejected and email sent' });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject request' });
  }
};

/**
 * Approve request with institute type (for manual registration)
 * @route PUT /api/admin/registration-requests/:requestId/approve-with-type
 */
const approveRequestWithType = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { instituteType } = req.body;
    
    // Validate institute type
    if (instituteType && !['normal', 'staffinn_partner'].includes(instituteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid institute type. Must be normal or staffinn_partner'
      });
    }
    
    // Call the main approve function with institute type
    req.body = { instituteType };
    return await approveRequest(req, res);
  } catch (error) {
    console.error('Approve request with type error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve request' });
  }
};

module.exports = {
  createRegistrationRequest,
  getAllRegistrationRequests,
  getRegistrationRequestsByType,
  updateRegistrationRequestStatus,
  deleteRegistrationRequest,
  approveRequest,
  rejectRequest,
  approveRequestWithType
};