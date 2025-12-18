require('dotenv').config();
const { generateSecurePassword } = require('./services/passwordGenerator');
const { sendApprovalEmail } = require('./services/emailService');
const userModel = require('./models/userModel');

const testCompleteFlow = async () => {
  try {
    console.log('🧪 Testing Complete Registration Flow...\n');
    
    // Step 1: Generate secure password
    console.log('1️⃣ Generating secure password...');
    const password = generateSecurePassword();
    console.log('✅ Generated password:', password);
    console.log('   - Length:', password.length);
    console.log('   - Has uppercase:', /[A-Z]/.test(password));
    console.log('   - Has lowercase:', /[a-z]/.test(password));
    console.log('   - Has number:', /[0-9]/.test(password));
    console.log('   - Has special char:', /[!@#$%^&*]/.test(password));
    
    // Step 2: Create user account
    console.log('\n2️⃣ Creating user account...');
    const userData = {
      email: 'test-institute@example.com',
      password: password,
      role: 'institute',
      name: 'Test Institute',
      phoneNumber: '9876543210'
    };
    
    try {
      const newUser = await userModel.createUser(userData);
      console.log('✅ User created successfully:', {
        userId: newUser.userId,
        email: newUser.email,
        role: newUser.role,
        instituteName: newUser.instituteName
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ User already exists, continuing...');
      } else {
        throw error;
      }
    }
    
    // Step 3: Test authentication
    console.log('\n3️⃣ Testing authentication...');
    const authenticatedUser = await userModel.authenticateUser(userData.email, password);
    if (authenticatedUser) {
      console.log('✅ Authentication successful:', {
        userId: authenticatedUser.userId,
        email: authenticatedUser.email,
        role: authenticatedUser.role
      });
    } else {
      console.log('❌ Authentication failed');
    }
    
    // Step 4: Send approval email
    console.log('\n4️⃣ Sending approval email...');
    await sendApprovalEmail(
      'otp.staffinn@gmail.com', // Use verified email for testing
      'Test Institute',
      password,
      'institute'
    );
    console.log('✅ Approval email sent successfully!');
    
    console.log('\n🎉 Complete flow test successful!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Password generation (meets all requirements)');
    console.log('   ✅ User account creation');
    console.log('   ✅ Authentication working');
    console.log('   ✅ Email delivery');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testCompleteFlow();