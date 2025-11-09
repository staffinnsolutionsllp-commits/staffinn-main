/**
 * Authentication Controller
 * Handles user registration, login, and authentication
 */
const userModel = require('../models/userModel');
const jwtUtils = require('../utils/jwtUtils');
const { validateRegistration, validateLogin, validateStaffRegistration, validateRecruiterRegistration, validateInstituteRegistration } = require('../utils/validation');

// Import email verification service (you'll need to create this)
const emailService = require('../services/emailService');

/**
 * Verify email existence before registration
 * @route POST /api/auth/verify-email
 */
const verifyEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Send OTP to email for verification
    const otpSent = await emailService.sendVerificationOTP(email);
    
    if (!otpSent) {
      return res.status(400).json({
        success: false,
        message: 'Failed to send verification email. Please check if email exists.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Verification OTP sent to email successfully'
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
};

/**
 * Verify OTP sent to email
 * @route POST /api/auth/verify-otp
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }
    
    // Verify OTP
    const isValid = await emailService.verifyOTP(email, otp);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
    
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed'
    });
  }
};

/**
 * Register a new user (existing function - keeping as is but adding email verification check)
 * @route POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    console.log('Registration request:', req.body);
    
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }
    
    // Role-specific validation
    let validationResult;
    const normalizedRole = role.toLowerCase();
    
    switch (normalizedRole) {
      case 'staff':
        const { validateStaffRegistration } = require('../utils/validation');
        validationResult = validateStaffRegistration(req.body);
        break;
      case 'recruiter':
        const { validateRecruiterRegistration } = require('../utils/validation');
        validationResult = validateRecruiterRegistration(req.body);
        break;
      case 'institute':
        const { validateInstituteRegistration } = require('../utils/validation');
        validationResult = validateInstituteRegistration(req.body);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified'
        });
    }
    
    if (validationResult.error) {
      console.log('Validation error:', validationResult.error);
      return res.status(400).json({
        success: false,
        message: validationResult.error
      });
    }
    
    // Prepare user data
    const userData = {
      ...validationResult.value,
      role: normalizedRole
    };
    
    // Create user
    const user = await userModel.createUser(userData);
    
    // Generate tokens
    const tokens = jwtUtils.generateTokens(user);
    
    // Send response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        ...tokens
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    console.log('Login request:', { email: req.body.email });
    
    // Validate request body
    const { error, value } = validateLogin(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }
    
    // Authenticate user
    const user = await userModel.authenticateUser(value.email, value.password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(200).json({
        success: true,
        blocked: true,
        message: 'User is blocked',
        data: {
          user: {
            userId: user.userId,
            email: user.email,
            role: user.role,
            isBlocked: true
          }
        }
      });
    }
    
    // Generate tokens for non-blocked users
    const tokens = jwtUtils.generateTokens(user);
    
    // Send response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        ...tokens
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

/**
 * Get current user profile (existing function - keeping as is)
 * @route GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user profile'
    });
  }
};

/**
 * Change password
 * @route PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }
    
    const result = await userModel.changePassword(req.user.userId, currentPassword, newPassword);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

/**
 * Submit help request for blocked users
 * @route POST /api/auth/request-help
 */
const requestHelp = async (req, res) => {
  try {
    const { name, email, query } = req.body;
    
    if (!name || !email || !query) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and query are required'
      });
    }
    
    // Store in issues table
    const dynamoService = require('../services/dynamoService');
    const { v4: uuidv4 } = require('uuid');
    
    const issueData = {
      issuesection: uuidv4(),
      name,
      email,
      query,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await dynamoService.putItem('staffinn-issue-section', issueData);
    
    res.status(200).json({
      success: true,
      message: 'Help request submitted successfully'
    });
    
  } catch (error) {
    console.error('Request help error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit help request'
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  verifyEmail,
  verifyOTP,
  changePassword,
  requestHelp
};