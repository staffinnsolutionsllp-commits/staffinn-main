/**
 * Password Reset Service
 * Handles forgot password OTP generation, verification, and password reset
 * Separate from registration OTP to avoid conflicts
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const dynamoService = require('./dynamoService');

// Separate table for password reset tokens
const PASSWORD_RESET_TABLE = 'staffinn-password-reset-tokens';

/**
 * Generate 6-digit OTP for password reset
 */
const generatePasswordResetOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create password reset request with OTP
 * @param {string} email - User email
 * @returns {Promise<object>} - OTP and expiry info
 */
const createPasswordResetRequest = async (email) => {
  try {
    // Generate OTP
    const otp = generatePasswordResetOTP();
    
    // Hash OTP before storing
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);
    
    // Create reset request
    const resetId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
    const ttl = Math.floor(expiresAt.getTime() / 1000) + (24 * 60 * 60); // TTL: 24 hours after expiry
    
    const resetRequest = {
      resetId,
      email: email.toLowerCase(),
      otp: hashedOtp,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      ttl, // DynamoDB TTL for auto-cleanup
      verified: false,
      used: false,
      attempts: 0,
      resetToken: null,
      resetTokenExpiresAt: null
    };
    
    // Store in DynamoDB
    await dynamoService.putItem(PASSWORD_RESET_TABLE, resetRequest);
    
    return {
      success: true,
      otp, // Return plain OTP to send via email
      expiresAt: expiresAt.toISOString(),
      expiresIn: 600 // seconds
    };
  } catch (error) {
    console.error('Error creating password reset request:', error);
    throw error;
  }
};

/**
 * Find latest password reset request for email
 * @param {string} email - User email
 * @returns {Promise<object|null>} - Reset request or null
 */
const findLatestResetRequest = async (email) => {
  try {
    const params = {
      FilterExpression: 'email = :email AND used = :used',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase(),
        ':used': false
      }
    };
    
    const requests = await dynamoService.scanItems(PASSWORD_RESET_TABLE, params);
    
    if (requests.length === 0) {
      return null;
    }
    
    // Sort by createdAt descending and return latest
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return requests[0];
  } catch (error) {
    console.error('Error finding reset request:', error);
    return null;
  }
};

/**
 * Verify password reset OTP
 * @param {string} email - User email
 * @param {string} inputOtp - OTP entered by user
 * @returns {Promise<object>} - Verification result with reset token
 */
const verifyPasswordResetOTP = async (email, inputOtp) => {
  try {
    // Find latest reset request
    const resetRequest = await findLatestResetRequest(email);
    
    if (!resetRequest) {
      return {
        success: false,
        message: 'No password reset request found. Please request a new OTP.'
      };
    }
    
    // Check if already verified
    if (resetRequest.verified) {
      return {
        success: false,
        message: 'OTP already verified. Please proceed to reset password.'
      };
    }
    
    // Check expiry
    const now = new Date();
    const expiresAt = new Date(resetRequest.expiresAt);
    
    if (now > expiresAt) {
      return {
        success: false,
        message: 'OTP has expired. Please request a new one.'
      };
    }
    
    // Check max attempts (5)
    if (resetRequest.attempts >= 5) {
      return {
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      };
    }
    
    // Verify OTP
    const isValid = await bcrypt.compare(inputOtp, resetRequest.otp);
    
    if (!isValid) {
      // Increment attempts
      await dynamoService.updateItem(
        PASSWORD_RESET_TABLE,
        { resetId: resetRequest.resetId },
        {
          UpdateExpression: 'SET attempts = attempts + :inc',
          ExpressionAttributeValues: {
            ':inc': 1
          }
        }
      );
      
      const remainingAttempts = 5 - (resetRequest.attempts + 1);
      return {
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
      };
    }
    
    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = await bcrypt.hash(resetToken, 10);
    
    // Token valid for 15 minutes
    const tokenExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    
    // Update reset request
    await dynamoService.updateItem(
      PASSWORD_RESET_TABLE,
      { resetId: resetRequest.resetId },
      {
        UpdateExpression: 'SET verified = :verified, resetToken = :token, resetTokenExpiresAt = :expiry',
        ExpressionAttributeValues: {
          ':verified': true,
          ':token': hashedResetToken,
          ':expiry': tokenExpiresAt.toISOString()
        }
      }
    );
    
    return {
      success: true,
      message: 'OTP verified successfully',
      resetToken, // Send plain token to frontend
      resetId: resetRequest.resetId
    };
  } catch (error) {
    console.error('Error verifying password reset OTP:', error);
    return {
      success: false,
      message: 'Error verifying OTP. Please try again.'
    };
  }
};

/**
 * Reset password using verified token
 * @param {string} email - User email
 * @param {string} resetToken - Reset token from OTP verification
 * @param {string} newPassword - New password
 * @returns {Promise<object>} - Reset result
 */
const resetPasswordWithToken = async (email, resetToken, newPassword) => {
  try {
    // Find verified reset request
    const resetRequest = await findLatestResetRequest(email);
    
    if (!resetRequest) {
      return {
        success: false,
        message: 'Invalid reset request. Please start over.'
      };
    }
    
    // Check if verified
    if (!resetRequest.verified) {
      return {
        success: false,
        message: 'OTP not verified. Please verify OTP first.'
      };
    }
    
    // Check if already used
    if (resetRequest.used) {
      return {
        success: false,
        message: 'Reset token already used. Please request a new one.'
      };
    }
    
    // Check token expiry
    const now = new Date();
    const tokenExpiresAt = new Date(resetRequest.resetTokenExpiresAt);
    
    if (now > tokenExpiresAt) {
      return {
        success: false,
        message: 'Reset token has expired. Please start over.'
      };
    }
    
    // Verify reset token
    const isValidToken = await bcrypt.compare(resetToken, resetRequest.resetToken);
    
    if (!isValidToken) {
      return {
        success: false,
        message: 'Invalid reset token. Please start over.'
      };
    }
    
    // Get user from users table
    const userModel = require('../models/userModel');
    const user = await userModel.findUserByEmail(email);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found.'
      };
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update user password
    const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
    await dynamoService.updateItem(
      USERS_TABLE,
      { userId: user.userId },
      {
        UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':password': hashedPassword,
          ':updatedAt': now.toISOString()
        }
      }
    );
    
    // Mark reset request as used
    await dynamoService.updateItem(
      PASSWORD_RESET_TABLE,
      { resetId: resetRequest.resetId },
      {
        UpdateExpression: 'SET used = :used',
        ExpressionAttributeValues: {
          ':used': true
        }
      }
    );
    
    return {
      success: true,
      message: 'Password reset successfully'
    };
  } catch (error) {
    console.error('Error resetting password:', error);
    return {
      success: false,
      message: 'Error resetting password. Please try again.'
    };
  }
};

/**
 * Check rate limiting for password reset requests
 * @param {string} email - User email
 * @returns {Promise<boolean>} - true if allowed, false if rate limited
 */
const checkRateLimit = async (email) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const params = {
      FilterExpression: 'email = :email AND createdAt > :oneHourAgo',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase(),
        ':oneHourAgo': oneHourAgo.toISOString()
      }
    };
    
    const recentRequests = await dynamoService.scanItems(PASSWORD_RESET_TABLE, params);
    
    // Allow max 3 requests per hour
    return recentRequests.length < 3;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return true; // Allow on error to not block users
  }
};

/**
 * Invalidate old reset requests for email
 * @param {string} email - User email
 */
const invalidateOldRequests = async (email) => {
  try {
    const params = {
      FilterExpression: 'email = :email AND used = :used AND verified = :verified',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase(),
        ':used': false,
        ':verified': false
      }
    };
    
    const oldRequests = await dynamoService.scanItems(PASSWORD_RESET_TABLE, params);
    
    // Mark old requests as used
    for (const request of oldRequests) {
      await dynamoService.updateItem(
        PASSWORD_RESET_TABLE,
        { resetId: request.resetId },
        {
          UpdateExpression: 'SET used = :used',
          ExpressionAttributeValues: {
            ':used': true
          }
        }
      );
    }
  } catch (error) {
    console.error('Error invalidating old requests:', error);
  }
};

module.exports = {
  createPasswordResetRequest,
  verifyPasswordResetOTP,
  resetPasswordWithToken,
  checkRateLimit,
  invalidateOldRequests,
  findLatestResetRequest
};
