/**
 * HRMS Password Reset Controller
 * Handles forgot-password for staffinn-hrms-employee-users table only.
 * Reuses the same passwordResetService (OTP + token flow) but looks up
 * the user in the HRMS table instead of the main staffinn-users table.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');
const passwordResetService = require('../../services/passwordResetService');
const emailService = require('../../services/emailService');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const HRMS_USERS_TABLE = 'staffinn-hrms-employee-users';

/**
 * Look up an HRMS user by email via the email-index GSI.
 * Returns the user item or null.
 */
const findHrmsUserByEmail = async (email) => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: HRMS_USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase().trim() }
    }));
    return (result.Items && result.Items.length > 0) ? result.Items[0] : null;
  } catch (err) {
    console.error('findHrmsUserByEmail error:', err);
    return null;
  }
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

    const user = await findHrmsUserByEmail(normalizedEmail);
    if (!user) return genericOk();

    if (!user.isActive) {
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
    const user = await findHrmsUserByEmail(normalizedEmail);
    if (!user) {
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
    const user = await findHrmsUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(400).json({ success: false, message: 'No account found with this email.' });
    }

    // Verify reset token and get the validated reset request
    const result = await passwordResetService.resetPasswordWithToken(normalizedEmail, resetToken, newPassword);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // The passwordResetService.resetPasswordWithToken writes to DYNAMODB_USERS_TABLE (staffinn-users).
    // For HRMS users we need to update staffinn-hrms-employee-users instead.
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await docClient.send(new UpdateCommand({
      TableName: HRMS_USERS_TABLE,
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
