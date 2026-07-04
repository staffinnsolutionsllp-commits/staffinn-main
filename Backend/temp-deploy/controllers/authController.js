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
 * Send OTP to email for verification
 * @route POST /api/auth/send-otp
 */
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if email already exists
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered'
      });
    }
    
    // Send OTP to email for verification
    const otpSent = await emailService.sendVerificationOTP(email);
    
    if (!otpSent) {
      return res.status(400).json({
        success: false,
        message: 'Failed to send OTP. Please try again or check rate limits.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'OTP sent to your email successfully'
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
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

/**
 * Get all users for messaging (excluding current user)
 * @route GET /api/auth/users
 */
const getUsers = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const users = await userModel.getAllUsers();
    
    // Filter out current user and only return necessary fields
    const filteredUsers = users
      .filter(user => user.userId !== currentUserId)
      .map(user => ({
        userId: user.userId,
        name: user.name,
        email: user.email,
        userType: user.role || user.userType
      }));
    
    res.status(200).json({
      success: true,
      data: filteredUsers
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

/**
 * Send OTP for password reset
 * @route POST /api/auth/forgot-password/send-otp
 */
const sendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }
    
    // Send password reset OTP
    const otpSent = await emailService.sendPasswordResetOTP(email);
    
    if (!otpSent) {
      return res.status(400).json({
        success: false,
        message: 'Failed to send reset code. Please try again.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Password reset code sent to your email'
    });
    
  } catch (error) {
    console.error('Send password reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reset code'
    });
  }
};

/**
 * Verify OTP for password reset
 * @route POST /api/auth/forgot-password/verify-otp
 */
const verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }
    
    // Verify password reset OTP
    const result = await emailService.verifyPasswordResetOTP(email, otp);
    
    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired code'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Code verified successfully',
      data: {
        resetToken: result.resetToken
      }
    });
    
  } catch (error) {
    console.error('Verify password reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Code verification failed'
    });
  }
};

/**
 * Reset password with verified token
 * @route POST /api/auth/forgot-password/reset
 */
const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset token, and new password are required'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Verify reset token
    const isValidToken = await emailService.verifyResetToken(email, resetToken);
    
    if (!isValidToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    // Reset password
    const result = await userModel.resetPassword(email, newPassword);
    
    if (result.success) {
      // Clear reset token
      await emailService.clearResetToken(email);
      
      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

/**
 * Resend OTP for password reset
 * @route POST /api/auth/forgot-password/resend-otp
 */
const resendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }
    
    // Resend password reset OTP
    const otpSent = await emailService.sendPasswordResetOTP(email);
    
    if (!otpSent) {
      return res.status(400).json({
        success: false,
        message: 'Failed to resend code. Please try again.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Reset code resent to your email'
    });
    
  } catch (error) {
    console.error('Resend password reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend code'
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  sendOTP,
  verifyOTP,
  changePassword,
  requestHelp,
  getUsers,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
  resendPasswordResetOTP
};