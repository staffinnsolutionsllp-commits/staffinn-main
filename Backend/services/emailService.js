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
  const mailOptions = {
    from: `${process.env.AWS_SES_FROM_NAME} <${process.env.AWS_SES_FROM_EMAIL}>`,
    to: email,
    subject: 'Welcome to Staffinn - Your Account is Approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4863f7;">Welcome to Staffinn!</h2>
        <p>Dear ${name},</p>
        <p>Your ${type} registration request has been approved!</p>
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #333;">Your Login Credentials:</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        <p>Please login at: <a href="https://staffinn.com">https://staffinn.com</a></p>
        <p>For security, please change your password after first login.</p>
        <p>Best regards,<br>Staffinn Team</p>
      </div>
    `
  };
  
  return await transporter.sendMail(mailOptions);
};

const sendRejectionEmail = async (email, name, type) => {
  const mailOptions = {
    from: `${process.env.AWS_SES_FROM_NAME} <${process.env.AWS_SES_FROM_EMAIL}>`,
    to: email,
    subject: 'Staffinn Registration Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e53e3e;">Registration Update</h2>
        <p>Dear ${name},</p>
        <p>Thank you for your interest in joining Staffinn as a ${type}.</p>
        <p>After careful review, we are unable to approve your registration at this time.</p>
        <p>If you have any questions, please contact us at support@staffinn.com</p>
        <p>Best regards,<br>Staffinn Team</p>
      </div>
    `
  };
  
  return await transporter.sendMail(mailOptions);
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
      from: 'Staffinn <onboarding@resend.dev>', // Change to 'Staffinn <noreply@staffinn.com>' after domain verification
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