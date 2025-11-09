/**
 * Email Service
 * AWS SES integration for sending emails
 */
const AWS = require('aws-sdk');
const otpService = require('./otpService');

// Configure AWS SES
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1' // Mumbai region
});

const ses = new AWS.SES();

// Email templates
const EMAIL_TEMPLATES = {
  OTP_VERIFICATION: {
    subject: 'Verify Your Email - OTP Code',
    getHtml: (otp, name) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Hi ${name || 'User'},</p>
        <p>Thank you for registering! Please use the following OTP to verify your email address:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
      </div>
    `,
    getText: (otp, name) => `
      Hi ${name || 'User'},
      
      Thank you for registering! Please use the following OTP to verify your email address:
      
      OTP: ${otp}
      
      This OTP is valid for 10 minutes.
      
      If you didn't request this verification, please ignore this email.
    `
  },

  WELCOME: {
    subject: 'Welcome to Our Platform!',
    getHtml: (name, role) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Welcome ${name}!</h2>
        <p>Thank you for registering as a <strong>${role}</strong> on our platform.</p>
        <p>Your account has been successfully created and verified.</p>
        <div style="background: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2e7d32; margin-top: 0;">What's Next?</h3>
          <ul style="color: #333;">
            <li>Complete your profile</li>
            <li>Explore platform features</li>
            <li>Start connecting with opportunities</li>
          </ul>
        </div>
        <p>If you have any questions, feel free to contact our support team.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
      </div>
    `,
    getText: (name, role) => `
      Welcome ${name}!
      
      Thank you for registering as a ${role} on our platform.
      Your account has been successfully created and verified.
      
      What's Next?
      - Complete your profile
      - Explore platform features
      - Start connecting with opportunities
      
      If you have any questions, feel free to contact our support team.
    `
  },

  PASSWORD_RESET: {
    subject: 'Password Reset Request',
    getHtml: (resetToken, name) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Password Reset Request</h2>
        <p>Hi ${name || 'User'},</p>
        <p>We received a request to reset your password. Use the following code to reset your password:</p>
        <div style="background: #f8d7da; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <h1 style="color: #721c24; font-size: 32px; margin: 0; letter-spacing: 3px;">${resetToken}</h1>
        </div>
        <p>This reset code is valid for <strong>15 minutes</strong>.</p>
        <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
      </div>
    `,
    getText: (resetToken, name) => `
      Hi ${name || 'User'},
      
      We received a request to reset your password. Use the following code to reset your password:
      
      Reset Code: ${resetToken}
      
      This reset code is valid for 15 minutes.
      
      If you didn't request a password reset, please ignore this email.
    `
  }
};

/**
 * Send email using AWS SES
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML body
 * @param {string} textBody - Text body
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (to, subject, htmlBody, textBody) => {
  try {
    const params = {
      Source: process.env.FROM_EMAIL || 'noreply@yourdomain.com', // Must be verified in SES
      Destination: {
        ToAddresses: [to]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8'
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8'
          }
        }
      }
    };

    console.log('Sending email to: ' + to);
    const result = await ses.sendEmail(params).promise();
    console.log('Email sent successfully. MessageId: ' + result.MessageId);
    return true;

  } catch (error) {
    console.error('Email sending failed:', error);
    
    // Handle specific SES errors
    if (error.code === 'MessageRejected') {
      console.error('Email rejected by SES - check email address');
    } else if (error.code === 'SendingPausedException') {
      console.error('SES sending is paused for your account');
    } else if (error.code === 'MailFromDomainNotVerifiedException') {
      console.error('FROM email domain not verified in SES');
    }
    
    return false;
  }
};

/**
 * Check if email address exists (basic validation)
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} - Email validity status
 */
const isValidEmail = async (email) => {
  try {
    // Basic email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Additional domain validation (optional)
    const domain = email.split('@')[1];
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    
    // For now, just return true if basic validation passes
    // You can add DNS lookup for domain validation later
    return true;

  } catch (error) {
    console.error('Email validation error:', error);
    return false;
  }
};

/**
 * Send OTP verification email
 * @param {string} email - Recipient email
 * @param {string} name - User name (optional)
 * @returns {Promise<boolean>} - Success status
 */
const sendVerificationOTP = async (email, name = '') => {
  try {
    // Check if email is valid
    const isValid = await isValidEmail(email);
    if (!isValid) {
      console.error('Invalid email format:', email);
      return false;
    }

    // Generate OTP
    const otp = await otpService.generateOTP(email);
    if (!otp) {
      console.error('Failed to generate OTP');
      return false;
    }

    // Prepare email content
    const template = EMAIL_TEMPLATES.OTP_VERIFICATION;
    const subject = template.subject;
    const htmlBody = template.getHtml(otp, name);
    const textBody = template.getText(otp, name);

    // Send email
    const emailSent = await sendEmail(email, subject, htmlBody, textBody);
    
    if (emailSent) {
      console.log('OTP verification email sent to: ' + email);
      return true;
    } else {
      // Clean up OTP if email failed
      await otpService.deleteOTP(email);
      return false;
    }

  } catch (error) {
    console.error('Send verification OTP error:', error);
    return false;
  }
};

/**
 * Verify OTP
 * @param {string} email - User email
 * @param {string} otp - OTP to verify
 * @returns {Promise<boolean>} - Verification status
 */
const verifyOTP = async (email, otp) => {
  try {
    const isValid = await otpService.verifyOTP(email, otp);
    
    if (isValid) {
      console.log('OTP verified successfully for: ' + email);
      // Mark email as verified (you can store this in database)
      await markEmailAsVerified(email);
    }
    
    return isValid;

  } catch (error) {
    console.error('OTP verification error:', error);
    return false;
  }
};

/**
 * Mark email as verified (store in memory for now)
 * @param {string} email - Email to mark as verified
 */
const verifiedEmails = new Set(); // In-memory storage (use database in production)

const markEmailAsVerified = async (email) => {
  verifiedEmails.add(email.toLowerCase());
  console.log('Email marked as verified: ' + email);
};

/**
 * Check if email is verified
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} - Verification status
 */
const isEmailVerified = async (email) => {
  return verifiedEmails.has(email.toLowerCase());
};

/**
 * Send welcome email
 * @param {string} email - Recipient email
 * @param {string} name - User name
 * @param {string} role - User role
 * @returns {Promise<boolean>} - Success status
 */
const sendWelcomeEmail = async (email, name, role) => {
  try {
    const template = EMAIL_TEMPLATES.WELCOME;
    const subject = template.subject;
    const htmlBody = template.getHtml(name, role);
    const textBody = template.getText(name, role);

    const emailSent = await sendEmail(email, subject, htmlBody, textBody);
    
    if (emailSent) {
      console.log('Welcome email sent to: ' + email);
    }
    
    return emailSent;

  } catch (error) {
    console.error('Send welcome email error:', error);
    return false;
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {string} name - User name
 * @returns {Promise<boolean>} - Success status
 */
const sendPasswordResetEmail = async (email, resetToken, name = '') => {
  try {
    const template = EMAIL_TEMPLATES.PASSWORD_RESET;
    const subject = template.subject;
    const htmlBody = template.getHtml(resetToken, name);
    const textBody = template.getText(resetToken, name);

    const emailSent = await sendEmail(email, subject, htmlBody, textBody);
    
    if (emailSent) {
      console.log('Password reset email sent to: ' + email);
    }
    
    return emailSent;

  } catch (error) {
    console.error('Send password reset email error:', error);
    return false;
  }
};

/**
 * Test email configuration
 * @returns {Promise<boolean>} - Test status
 */
const testEmailConfiguration = async () => {
  try {
    // Test SES configuration
    const result = await ses.getSendQuota().promise();
    console.log('SES Configuration Test:', {
      Max24HourSend: result.Max24HourSend,
      MaxSendRate: result.MaxSendRate,
      SentLast24Hours: result.SentLast24Hours
    });
    return true;

  } catch (error) {
    console.error('Email configuration test failed:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  isValidEmail,
  sendVerificationOTP,
  verifyOTP,
  isEmailVerified,
  markEmailAsVerified,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  testEmailConfiguration
};