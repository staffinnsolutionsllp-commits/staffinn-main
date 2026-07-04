/**
 * Password Reset Routes
 * Routes for forgot password functionality
 */

const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');

/**
 * @route   POST /api/auth/forgot-password/send-otp
 * @desc    Send password reset OTP to email
 * @access  Public
 */
router.post('/send-otp', passwordResetController.sendPasswordResetOTP);

/**
 * @route   POST /api/auth/forgot-password/verify-otp
 * @desc    Verify password reset OTP
 * @access  Public
 */
router.post('/verify-otp', passwordResetController.verifyPasswordResetOTP);

/**
 * @route   POST /api/auth/forgot-password/reset
 * @desc    Reset password with verified token
 * @access  Public
 */
router.post('/reset', passwordResetController.resetPassword);

/**
 * @route   POST /api/auth/forgot-password/resend-otp
 * @desc    Resend password reset OTP
 * @access  Public
 */
router.post('/resend-otp', passwordResetController.resendPasswordResetOTP);

module.exports = router;
