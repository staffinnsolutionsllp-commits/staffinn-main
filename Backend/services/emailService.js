const nodemailer = require('nodemailer');

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

module.exports = { sendApprovalEmail, sendRejectionEmail };