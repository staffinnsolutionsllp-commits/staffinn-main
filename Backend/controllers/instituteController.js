/**
 * Institute Controller
 * Handles institute registration and management
 */
const userModel = require('../models/userModel');
const jwtUtils = require('../utils/jwtUtils');
const { validateInstituteRegistration } = require('../utils/validation');
const emailService = require('../services/emailService');

// Registration number validation service
const registrationValidationService = {
  validateRegistrationNumber: async (registrationNumber) => {
    try {
      // Basic format validation (6-20 characters, uppercase letters and numbers)
      const formatValid = /^[A-Z0-9]{6,20}$/.test(registrationNumber);
      
      if (!formatValid) {
        return { isValid: false, message: 'Invalid registration number format' };
      }
      
      // Check if registration number already exists in database
      const existingInstitute = await userModel.getUserByRegistrationNumber(registrationNumber);
      if (existingInstitute) {
        return { isValid: false, message: 'Registration number already exists' };
      }
      
      // Additional validation patterns for common registration number formats
      const commonPatterns = [
        /^[A-Z]{2}[0-9]{6,12}$/, // State code + numbers (e.g., UP123456789)
        /^[0-9]{6,15}$/, // Only numbers (e.g., 123456789)
        /^[A-Z]{3,5}[0-9]{4,10}$/, // Institution code + numbers
        /^REG[0-9]{6,12}$/, // REG prefix + numbers
        /^INST[0-9]{6,12}$/ // INST prefix + numbers
      ];
      
      const matchesPattern = commonPatterns.some(pattern => pattern.test(registrationNumber));
      
      if (!matchesPattern) {
        return { 
          isValid: false, 
          message: 'Registration number format does not match standard patterns' 
        };
      }
      
      return { isValid: true, message: 'Registration number is valid' };
      
    } catch (error) {
      console.error('Registration number validation error:', error);
      return { isValid: false, message: 'Registration number validation failed' };
    }
  }
};

/**
 * Register a new institute
 * @route POST /api/institute/register
 */
const registerInstitute = async (req, res) => {
  try {
    console.log('Institute registration request:', req.body);
    
    // Validate institute registration data
    const { error, value } = validateInstituteRegistration(req.body);
    
    if (error) {
      console.log('Institute validation error:', error);
      return res.status(400).json({
        success: false,
        message: error
      });
    }
    
    // Check if email is already registered
    const existingUser = await userModel.getUserByEmail(value.email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered'
      });
    }
    
    // Validate registration number
    const registrationValidation = await registrationValidationService.validateRegistrationNumber(value.registrationNumber);
    if (!registrationValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: registrationValidation.message
      });
    }
    
    // Optional: Check if email is verified (uncomment when email verification is implemented)
    // const isEmailVerified = await emailService.isEmailVerified(value.email);
    // if (!isEmailVerified) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Please verify your email first'
    //   });
    // }
    
    // Prepare user data for creation (all data goes in users table)
    const userData = {
      name: value.instituteName,
      email: value.email,
      password: value.password,
      phone: value.phoneNumber,
      role: 'institute',
      registrationNumber: value.registrationNumber // Store registration number in users table for now
    };
    
    // Create user in users table
    const user = await userModel.createUser(userData);
    
    // Generate tokens
    const tokens = jwtUtils.generateTokens(user);
    
    // Send welcome email (optional)
    try {
      await emailService.sendWelcomeEmail(user.email, value.instituteName, 'institute');
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
      // Don't fail registration if email fails
    }
    
    // Send response
    res.status(201).json({
      success: true,
      message: 'Institute registered successfully',
      data: {
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          registrationNumber: user.registrationNumber
        },
        ...tokens
      }
    });
    
  } catch (error) {
    console.error('Institute registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Institute registration failed'
    });
  }
};

/**
 * Get institute profile
 * @route GET /api/institute/profile
 */
const getInstituteProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user profile (institute data is in users table)
    const user = await userModel.getUserById(userId);
    
    if (!user || user.role !== 'institute') {
      return res.status(404).json({
        success: false,
        message: 'Institute profile not found'
      });
    }
    
    // Remove sensitive data
    delete user.password;
    
    res.status(200).json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Get institute profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get institute profile'
    });
  }
};

/**
 * Update institute profile
 * @route PUT /api/institute/profile
 */
const updateInstituteProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.userId;
    delete updateData.email;
    delete updateData.password;
    delete updateData.role;
    delete updateData.registrationNumber; // Registration number shouldn't be changed after creation
    
    // Update user profile
    const updatedUser = await userModel.updateUser(userId, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Institute profile not found'
      });
    }
    
    // Remove sensitive data
    delete updatedUser.password;
    
    res.status(200).json({
      success: true,
      message: 'Institute profile updated successfully',
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Update institute profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update institute profile'
    });
  }
};

/**
 * Verify registration number manually
 * @route POST /api/institute/verify-registration
 */
const verifyRegistrationNumber = async (req, res) => {
  try {
    const { registrationNumber } = req.body;
    
    if (!registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Registration number is required'
      });
    }
    
    // Validate registration number
    const validation = await registrationValidationService.validateRegistrationNumber(registrationNumber);
    
    res.status(200).json({
      success: true,
      data: {
        registrationNumber,
        isValid: validation.isValid,
        message: validation.message
      }
    });
    
  } catch (error) {
    console.error('Registration number verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration number verification failed'
    });
  }
};

/**
 * Get all institutes (Admin only)
 * @route GET /api/institute/all
 */
const getAllInstitutes = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    // Get all users with institute role
    const instituteList = await userModel.getUsersByRole('institute');
    
    // Remove passwords from response
    const sanitizedInstituteList = instituteList.map(institute => {
      const { password, ...instituteData } = institute;
      return instituteData;
    });
    
    res.status(200).json({
      success: true,
      data: sanitizedInstituteList
    });
    
  } catch (error) {
    console.error('Get all institutes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get institute list'
    });
  }
};

/**
 * Search institutes by registration number or name
 * @route GET /api/institute/search
 */
const searchInstitutes = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Search in users table for institutes by name or registration number
    const results = await userModel.searchUsersByRoleAndQuery('institute', query);
    
    // Remove passwords from response
    const sanitizedResults = results.map(institute => {
      const { password, ...instituteData } = institute;
      return instituteData;
    });
    
    res.status(200).json({
      success: true,
      data: sanitizedResults
    });
    
  } catch (error) {
    console.error('Search institutes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Institute search failed'
    });
  }
};

/**
 * Delete institute profile (Admin only)
 * @route DELETE /api/institute/:instituteId
 */
const deleteInstitute = async (req, res) => {
  try {
    const { instituteId } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    // Check if institute exists and has institute role
    const institute = await userModel.getUserById(instituteId);
    if (!institute || institute.role !== 'institute') {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }
    
    // Delete institute (user)
    const deleted = await userModel.deleteUser(instituteId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Failed to delete institute'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Institute deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete institute error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete institute'
    });
  }
};

module.exports = {
  registerInstitute,
  getInstituteProfile,
  updateInstituteProfile,
  verifyRegistrationNumber,
  getAllInstitutes,
  searchInstitutes,
  deleteInstitute
};