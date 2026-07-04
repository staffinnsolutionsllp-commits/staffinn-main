/**
 * HRMS Password Reset Controller
 * Handles forgot-password for both:
 *   - staffinn-hrms-users (HRMS admin/recruiter accounts)
 *   - staffinn-hrms-employee-users (employee accounts)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');
const passwordResetService = require('../../services/passwordResetService');
const emailService = require('../../services/emailService');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const HRMS_ADMIN_TABLE    = 'staffinn-hrms-users';           // admin/recruiter accounts
const HRMS_EMPLOYEE_TABLE = 'staffinn-hrms-employee-users';  // employee accounts

/**
 * Look up a user by email in both HRMS tables.
 * Returns { user, table } or null.
 */
const findHrmsUserByEmail = async (email) => {
  const normalized = email.toLowerCase().trim();

  // 1. Check admin table first (staffinn-hrms-users) via scan
  try {
    const r1 = await docClient.send(new ScanCommand({
      TableName: HRMS_ADMIN_TABLE,
      FilterExpression: 'email = :e',
      ExpressionAttributeValues: { ':e': normalized }
    }));
    if (r1.Items && r1.Items.length > 0) {
      return { user: r1.Items[0], table: HRMS_ADMIN_TABLE };
    }
  } catch (err) {
    console.error('findHrmsUserByEmail (admin table) error:', err.message);
  }

  // 2. Check employee table (staffinn-hrms-employee-users)
  try {
    // Try GSI first
    const r2 = await docClient.send(new QueryCommand({
      TableName: HRMS_EMPLOYEE_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :e',
      ExpressionAttributeValues: { ':e': normalized }
    }));
    if (r2.Items && r2.Items.length > 0) {
      return { user: r2.Items[0], table: HRMS_EMPLOYEE_TABLE };
    }
  } catch (err) {
    // GSI not available — fallback to scan
    try {
      const r3 = await docClient.send(new ScanCommand({
        TableName: HRMS_EMPLOYEE_TABLE,
        FilterExpression: 'email = :e',
        ExpressionAttributeValues: { ':e': normalized }
      }));
      if (r3.Items && r3.Items.length > 0) {
        return { user: r3.Items[0], table: HRMS_EMPLOYEE_TABLE };
      }
    } catch (err2) {
      console.error('findHrmsUserByEmail (employee table) error:', err2.message);
    }
  }

  return null;
};

/**
 * POST /api/v1/employee/auth/forgot-password/send-otp
 * Body: { email }
 */
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Security: always return the same response whether user exists or not
    const genericOk = () => res.json({
      success: true,
      message: 'If that email is registered, you will receive a reset code shortly.',
      expiresIn: 600
    });

    const found = await findHrmsUserByEmail(normalizedEmail);
    if (!found) return genericOk();

    const { user } = found;

    if (user.isActive === false) {
      // Still return generic — don't leak account status
      return genericOk();
    }

    // Rate-limit (3 requests / hour, shared with main flow)
    const allowed = await passwordResetService.checkRateLimit(normalizedEmail);
    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please wait 1 hour before trying again.'
      });
    }

    // Invalidate any previous pending OTPs
    await passwordResetService.invalidateOldRequests(normalizedEmail);

    // Create a fresh OTP record
    const result = await passwordResetService.createPasswordResetRequest(normalizedEmail);
    if (!result.success) {
      return res.status(500).json({ success: false, message: 'Failed to generate reset code. Please try again.' });
    }

    // Send email — use the low-level function that accepts (email, otp, name)
    const displayName = user.fullName || user.name || 'User';
    const sent = await emailService.sendPasswordResetOTPEmail(normalizedEmail, result.otp, displayName);

    if (!sent) {
      return res.status(500).json({ success: false, message: 'Failed to send email. Please try again.' });
    }

    return res.json({
      success: true,
      message: 'Password reset code sent to your email.',
      expiresIn: result.expiresIn
    });
  } catch (err) {
    console.error('HRMS sendOTP error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

/**
 * POST /api/v1/employee/auth/forgot-password/verify-otp
 * Body: { email, otp }
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'OTP must be exactly 6 digits.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Confirm the user exists in HRMS table (extra safety)
    const found = await findHrmsUserByEmail(normalizedEmail);
    if (!found) {
      return res.status(400).json({ success: false, message: 'No account found with this email.' });
    }

    const result = await passwordResetService.verifyPasswordResetOTP(normalizedEmail, otp);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({
      success: true,
      message: 'OTP verified successfully.',
      data: { resetToken: result.resetToken }
    });
  } catch (err) {
    console.error('HRMS verifyOTP error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

/**
 * POST /api/v1/employee/auth/forgot-password/reset
 * Body: { email, resetToken, newPassword }
 */
const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, reset token, and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    // Basic strength: must have at least one letter and one number
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one letter and one number.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Confirm HRMS user exists
    const found = await findHrmsUserByEmail(normalizedEmail);
    if (!found) {
      return res.status(400).json({ success: false, message: 'No account found with this email.' });
    }
    const { user, table: userTable } = found;

    // Manually verify reset token directly (bypass passwordResetService which checks staffinn-users)
    const { findLatestResetRequest } = require('../../services/passwordResetService');
    const resetRequest = await findLatestResetRequest(normalizedEmail);

    if (!resetRequest) {
      return res.status(400).json({ success: false, message: 'Invalid reset request. Please start over.' });
    }
    if (!resetRequest.verified) {
      return res.status(400).json({ success: false, message: 'OTP not verified. Please verify OTP first.' });
    }
    if (resetRequest.used) {
      return res.status(400).json({ success: false, message: 'Reset token already used. Please request a new one.' });
    }

    const now = new Date();
    if (now > new Date(resetRequest.resetTokenExpiresAt)) {
      return res.status(400).json({ success: false, message: 'Reset token has expired. Please start over.' });
    }

    const isValidToken = await bcrypt.compare(resetToken, resetRequest.resetToken);
    if (!isValidToken) {
      return res.status(400).json({ success: false, message: 'Invalid reset token. Please start over.' });
    }

    // Mark reset request as used
    const dynamoService = require('../../services/dynamoService');
    await dynamoService.updateItem(
      'staffinn-password-reset-tokens',
      { resetId: resetRequest.resetId },
      {
        UpdateExpression: 'SET used = :used',
        ExpressionAttributeValues: { ':used': true }
      }
    );

    // Update password in the correct HRMS table
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await docClient.send(new UpdateCommand({
      TableName: userTable,
      Key: { userId: user.userId },
      UpdateExpression: 'SET password = :pwd, isFirstLogin = :false, updatedAt = :now',
      ExpressionAttributeValues: {
        ':pwd': hashedPassword,
        ':false': false,
        ':now': new Date().toISOString()
      }
    }));

    // Send confirmation email
    const displayName = user.fullName || user.name || 'User';
    await emailService.sendPasswordResetSuccessEmail(normalizedEmail, displayName);

    return res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    console.error('HRMS resetPassword error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

/**
 * POST /api/v1/employee/auth/forgot-password/resend-otp
 * Body: { email }
 */
const resendOTP = async (req, res) => {
  // Reuse sendOTP — identical flow
  return sendOTP(req, res);
};

module.exports = { sendOTP, verifyOTP, resetPassword, resendOTP };
