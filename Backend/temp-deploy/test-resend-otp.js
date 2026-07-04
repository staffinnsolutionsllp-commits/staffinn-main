const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResendOTP() {
  try {
    console.log('Testing Resend API...');
    console.log('API Key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
    
    const testEmail = 'jash22bh@gmail.com';
    const testOTP = '123456';
    
    const { data, error } = await resend.emails.send({
      from: 'Staffinn <onboarding@resend.dev>',
      to: [testEmail],
      subject: 'Test OTP - Staffinn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4863f7; text-align: center;">Test Email Verification</h2>
          <p>Hello,</p>
          <p>This is a test OTP email from Staffinn:</p>
          <div style="background: #f5f5f5; padding: 30px; margin: 30px 0; border-radius: 8px; text-align: center;">
            <h1 style="color: #4863f7; font-size: 48px; margin: 0; letter-spacing: 8px;">${testOTP}</h1>
          </div>
          <p style="color: #666;">This is a test email.</p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return false;
    }

    console.log('✅ Test email sent successfully!');
    console.log('Response:', data);
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testResendOTP();
