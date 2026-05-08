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
      `
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
      from: 'Staffinn <onboarding@resend.dev>',
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

module.exports = { 
  sendApprovalEmail, 
  sendRejectionEmail,
  sendVerificationOTP,
  verifyOTP,
  sendOTPEmail
};