const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const otpService = require('./otpService');

const resend = new Resend(process.env.RESEND_API_KEY);

const transporter = nodemailer.createTransport({
  host: 'email-smtp.ap-south-1.amazonaws.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.AWS_SES_ACCESS_KEY,
    pass: process.env.AWS_SES_SECRET_KEY
  }
});

const sendApprovalEmail = async (email, name, password, type) => {
  try {
    // Production mode: Send via Resend
    const { data, error } = await resend.emails.send({
      from: 'Staffinn <noreply@staffinn.com>',
      to: [email],
      subject: 'Welcome to Staffinn - Your Account is Approved!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4863f7; text-align: center;">Welcome to Staffinn!</h2>
          <p>Dear ${name},</p>
          <p>Congratulations! Your ${type} registration request has been approved.</p>
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Your Login Credentials:</h3>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>Password:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 4px; font-size: 16px;">${password}</code></p>
          </div>
          <p>Please login at: <a href="https://staffinn.com" style="color: #4863f7;">https://staffinn.com</a></p>
          <p style="color: #e53e3e; font-weight: bold;">⚠️ For security, please change your password after first login.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">© 2024 Staffinn. All rights reserved.</p>
        </div>
      `,
      idempotencyKey: `approval-${email}-${Date.now()}`
    });

    if (error) {
      console.error('❌ Resend API error (approval email):', error);
      return false;
    }

    console.log('✅ Approval email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Send approval email error:', error);
    return false;
  }
};

const sendRejectionEmail = async (email, name, type) => {
  try {
    // Production mode: Send via Resend
    const { data, error } = await resend.emails.send({
      from: 'Staffinn <noreply@staffinn.com>',
      to: [email],
      subject: 'Staffinn Registration Update',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #e53e3e; text-align: center;">Registration Update</h2>
          <p>Dear ${name},</p>
          <p>Thank you for your interest in joining Staffinn as a ${type}.</p>
          <p>After careful review, we are unable to approve your registration request at this time.</p>
          <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">If you have any questions or would like to discuss this decision, please contact us at <a href="mailto:support@staffinn.com" style="color: #4863f7;">support@staffinn.com</a></p>
          </div>
          <p>We appreciate your understanding.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">© 2024 Staffinn. All rights reserved.</p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend API error (rejection email):', error);
      return false;
    }

    console.log('✅ Rejection email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Send rejection email error:', error);
    return false;
  }
};

const sendOTPEmail = async (email, otp) => {
  try {
    // Development mode: Log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('\n========== 📧 EMAIL SENT (DEV MODE) ==========');
      console.log('To:', email);
      console.log('Subject: Verify Your Email - Staffinn Registration');
      console.log('OTP:', otp);
      console.log('Expires: 10 minutes');
      console.log('==============================================\n');
      return true;
    }

    // Production mode: Send via Resend
    const { data, error } = await resend.emails.send({
      from: 'Staffinn <noreply@staffinn.com>',
      to: [email],
      subject: 'Verify Your Email - Staffinn Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4863f7; text-align: center;">Email Verification</h2>
          <p>Hello,</p>
          <p>Thank you for registering with Staffinn! Please use the following OTP to verify your email address:</p>
          <div style="background: #f5f5f5; padding: 30px; margin: 30px 0; border-radius: 8px; text-align: center;">
            <h1 style="color: #4863f7; font-size: 48px; margin: 0; letter-spacing: 8px;">${otp}</h1>
          </div>
          <p style="color: #666;">This OTP will expire in 10 minutes.</p>
          <p style="color: #666;">If you didn't request this verification, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">© 2024 Staffinn. All rights reserved.</p>
        </div>
      `,
      idempotencyKey: `otp-${email}-${Date.now()}`
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return false;
    }

    console.log('✅ OTP email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Send OTP email error:', error);
    return false;
  }
};

const sendVerificationOTP = async (email) => {
  try {
    const otp = await otpService.generateOTP(email, 'registration');
    
    if (!otp) {
      console.error('Failed to generate OTP for:', email);
      return false;
    }

    const emailSent = await sendOTPEmail(email, otp);
    return emailSent;
  } catch (error) {
    console.error('Send verification OTP error:', error);
    return false;
  }
};

const verifyOTP = async (email, inputOtp) => {
  try {
    return await otpService.verifyOTP(email, inputOtp, 'registration');
  } catch (error) {
    console.error('Verify OTP error:', error);
    return false;
  }
};

/**
 * Send password reset OTP email
 * @param {string} email - User email
 * @param {string} otp - 6-digit OTP
 * @param {string} userName - User name
 * @returns {Promise<boolean>} - Success status
 */
const sendPasswordResetOTPEmail = async (email, otp, userName = 'User') => {
  try {
    // Development mode: Log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('\n========== 📧 PASSWORD RESET EMAIL (DEV MODE) ==========');
      console.log('To:', email);
      console.log('Subject: Reset Your Password - Staffinn');
      console.log('OTP:', otp);
      console.log('Expires: 10 minutes');
      console.log('========================================================\n');
      return true;
    }

    // Production mode: Send via Resend
    const { data, error } = await resend.emails.send({
      from: 'Staffinn <noreply@staffinn.com>',
      to: [email],
      subject: 'Reset Your Password - Staffinn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4863f7; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello ${userName},</p>
            
            <p style="color: #666; font-size: 15px; line-height: 1.6;">
              We received a request to reset your password for your Staffinn account. 
              Use the verification code below to reset your password:
            </p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; margin: 30px 0; border-radius: 10px; text-align: center;">
              <p style="color: white; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Your Reset Code</p>
              <h1 style="color: white; font-size: 42px; margin: 0; letter-spacing: 10px; font-weight: bold;">${otp}</h1>
            </div>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⏰ Important:</strong> This code will expire in <strong>10 minutes</strong>.
              </p>
            </div>
            
            <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #721c24; font-size: 14px;">
                <strong>🛡️ Security Notice:</strong> If you didn't request this password reset, 
                please ignore this email or contact our support team immediately at 
                <a href="mailto:support@staffinn.com" style="color: #4863f7;">support@staffinn.com</a>
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                This is an automated email. Please do not reply to this message.
              </p>
              <p style="color: #999; font-size: 12px; text-align: center; margin: 10px 0 0 0;">
                © 2024 Staffinn. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
      idempotencyKey: `password-reset-${email}-${Date.now()}`
    });

    if (error) {
      console.error('❌ Resend API error (password reset):', error);
      return false;
    }

    console.log('✅ Password reset OTP email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Send password reset OTP email error:', error);
    return false;
  }
};

/**
 * Send password reset OTP (wrapper with OTP generation)
 * @param {string} email - User email
 * @returns {Promise<boolean>} - Success status
 */
const sendPasswordResetOTP = async (email) => {
  try {
    // Generate OTP for password reset
    const otp = await otpService.generateOTP(email, 'password-reset');
    
    if (!otp) {
      console.error('Failed to generate password reset OTP for:', email);
      return false;
    }

    // Send email with OTP
    const emailSent = await sendPasswordResetOTPEmail(email, otp);
    return emailSent;
  } catch (error) {
    console.error('Send password reset OTP error:', error);
    return false;
  }
};

/**
 * Verify password reset OTP
 * @param {string} email - User email
 * @param {string} inputOtp - OTP to verify
 * @returns {Promise<{isValid: boolean, resetToken?: string}>}
 */
const verifyPasswordResetOTP = async (email, inputOtp) => {
  try {
    const isValid = await otpService.verifyOTP(email, inputOtp, 'password-reset');
    
    if (isValid) {
      // Generate reset token
      const resetToken = await otpService.generateResetToken(email);
      return { isValid: true, resetToken };
    }
    
    return { isValid: false };
  } catch (error) {
    console.error('Verify password reset OTP error:', error);
    return { isValid: false };
  }
};

/**
 * Verify reset token
 * @param {string} email - User email
 * @param {string} resetToken - Reset token to verify
 * @returns {Promise<boolean>}
 */
const verifyResetToken = async (email, resetToken) => {
  try {
    return await otpService.verifyResetToken(email, resetToken);
  } catch (error) {
    console.error('Verify reset token error:', error);
    return false;
  }
};

/**
 * Clear reset token after password reset
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
const clearResetToken = async (email) => {
  try {
    await otpService.clearResetToken(email);
  } catch (error) {
    console.error('Clear reset token error:', error);
  }
};

/**
 * Send password reset success confirmation email
 * @param {string} email - User email
 * @param {string} userName - User name
 * @returns {Promise<boolean>} - Success status
 */
const sendPasswordResetSuccessEmail = async (email, userName) => {
  try {
    // Development mode: Log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('\n========== 📧 PASSWORD RESET SUCCESS EMAIL (DEV MODE) ==========');
      console.log('To:', email);
      console.log('Subject: Password Changed Successfully - Staffinn');
      console.log('================================================================\n');
      return true;
    }

    // Production mode: Send via Resend
    const { data, error } = await resend.emails.send({
      from: 'Staffinn <noreply@staffinn.com>',
      to: [email],
      subject: 'Password Changed Successfully - Staffinn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background-color: #28a745; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 48px;">✓</span>
              </div>
              <h1 style="color: #28a745; margin: 0; font-size: 28px;">Password Changed Successfully</h1>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello ${userName},</p>
            
            <p style="color: #666; font-size: 15px; line-height: 1.6;">
              Your password has been successfully changed. You can now log in to your Staffinn account 
              using your new password.
            </p>
            
            <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #155724; font-size: 14px;">
                <strong>✓ Confirmed:</strong> Your password was changed on ${new Date().toLocaleString('en-US', { 
                  dateStyle: 'full', 
                  timeStyle: 'short' 
                })}.
              </p>
            </div>
            
            <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #721c24; font-size: 14px;">
                <strong>🛡️ Security Alert:</strong> If you didn't make this change, 
                please contact our support team immediately at 
                <a href="mailto:support@staffinn.com" style="color: #4863f7;">support@staffinn.com</a>
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://staffinn.com" 
                 style="display: inline-block; background-color: #4863f7; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Login to Staffinn
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                This is an automated email. Please do not reply to this message.
              </p>
              <p style="color: #999; font-size: 12px; text-align: center; margin: 10px 0 0 0;">
                © 2024 Staffinn. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
      idempotencyKey: `password-reset-success-${email}-${Date.now()}`
    });

    if (error) {
      console.error('❌ Resend API error (password reset success):', error);
      return false;
    }

    console.log('✅ Password reset success email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Send password reset success email error:', error);
    return false;
  }
};

module.exports = { 
  sendApprovalEmail, 
  sendRejectionEmail,
  sendVerificationOTP,
  verifyOTP,
  sendOTPEmail,
  sendPasswordResetOTP,
  sendPasswordResetOTPEmail,
  verifyPasswordResetOTP,
  verifyResetToken,
  clearResetToken,
  sendPasswordResetSuccessEmail
};