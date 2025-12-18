require('dotenv').config();
const { sendApprovalEmail, sendRejectionEmail } = require('./services/emailService');

const testEmails = async () => {
  try {
    console.log('Testing approval email...');
    await sendApprovalEmail('otp.staffinn@gmail.com', 'Test User', 'TestPass123!', 'institute');
    console.log('✅ Approval email sent successfully!');
    
    console.log('Testing rejection email...');
    await sendRejectionEmail('otp.staffinn@gmail.com', 'Test User', 'recruiter');
    console.log('✅ Rejection email sent successfully!');
  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
};

testEmails();