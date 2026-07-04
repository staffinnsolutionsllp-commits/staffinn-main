/**
 * Password Reset Controller
 * Handles forgot password API endpoints
 */

const passwordResetService = require('../services/passwordResetService');
const emailService = require('../services/emailService');
const userModel = require('../models/userModel');

/**
 * Send password reset OTP to email
 * @route POST /api/auth/forgot-password/send-otp
 */
const sendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Check if user exists
    const user = await userModel.findUserByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset code.',
        expiresIn: 600
      });
    }
    
    // Check rate limiting
    const isAllowed = await passwordResetService.checkRateLimit(email);
    
    if (!isAllowed) {
      return res.status(429).json({
        success: false,
        message: 'Too many password reset requests. Please try again after 1 hour.'
      });
    }
    
    // Invalidate old requests
    await passwordResetService.invalidateOldRequests(email);
    
    // Create password reset request
    const result = await passwordResetService.createPasswordResetRequest(email);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create password reset request'
      });
    }
    
    // Send OTP via email
    const emailSent = await emailService.sendPasswordResetOTP(email, result.otp, user.fullName || user.companyName || user.instituteName || 'User');
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Password reset code sent to your email',
      expiresIn: result.expiresIn
    });
    
  } catch (error) {
    console.error('Send password reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset code'
    });
  }
};

/**
 * Verify password reset OTP
 * @route POST /api/auth/forgot-password/verify-otp
 */
const verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }
    
    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format. OTP must be 6 digits.'
      });
    }
    
    // Verify OTP
    const result = await passwordResetService.verifyPasswordResetOTP(email, otp);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json({
      success: true,
      message: result.message,
      resetToken: result.resetToken
    });
    
  } catch (error) {
    console.error('Verify password reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
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
    
    // Validate input
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset token, and new password are required'
      });
    }
    
    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Reset password
    const result = await passwordResetService.resetPasswordWithToken(email, resetToken, newPassword);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Send confirmation email
    const user = await userModel.findUserByEmail(email);
    if (user) {
      await emailService.sendPasswordResetSuccessEmail(
        email, 
        user.fullName || user.companyName || user.instituteName || 'User'
      );
    }
    
    res.status(200).json({
      success: true,
      message: result.message
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

/**
 * Resend password reset OTP
 * @route POST /api/auth/forgot-password/resend-otp
 */
const resendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Check if user exists
    const user = await userModel.findUserByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive a new password reset code.',
        expiresIn: 600
      });
    }
    
    // Check rate limiting
    const isAllowed = await passwordResetService.checkRateLimit(email);
    
    if (!isAllowed) {
      return res.status(429).json({
        success: false,
        message: 'Too many password reset requests. Please try again after 1 hour.'
      });
    }
    
    // Invalidate old requests
    await passwordResetService.invalidateOldRequests(email);
    
    // Create new password reset request
    const result = await passwordResetService.createPasswordResetRequest(email);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create password reset request'
      });
    }
    
    // Send OTP via email
    const emailSent = await emailService.sendPasswordResetOTP(email, result.otp, user.fullName || user.companyName || user.instituteName || 'User');
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'New password reset code sent to your email',
      expiresIn: result.expiresIn
    });
    
  } catch (error) {
    console.error('Resend password reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend password reset code'
    });
  }
};

module.exports = {
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
  resendPasswordResetOTP
};
