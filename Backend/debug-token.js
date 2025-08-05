/**
 * Debug Token Script
 * Check token validity and user existence
 */

require('dotenv').config();
const jwtUtils = require('./utils/jwtUtils');
const userModel = require('./models/userModel');
const dynamoService = require('./services/dynamoService');

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;

const debugToken = async () => {
  try {
    console.log('🔍 Token Debug Script\n');
    
    // Get all users and their IDs
    const allUsers = await dynamoService.scanItems(USERS_TABLE);
    console.log('📋 All users in database:');
    allUsers.forEach(user => {
      if (user.role) { // Only show actual users, not jobs
        console.log(`   ${user.email} (${user.role}) - ID: ${user.userId}`);
      }
    });
    
    console.log('\n🔑 Checking problematic user ID: e292c7a3-75e5-4167-8137-ce1d69f5dcd6');
    
    // Try to find the user
    const user = await userModel.findUserById('e292c7a3-75e5-4167-8137-ce1d69f5dcd6');
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('\n❌ This user ID does not exist in database');
      console.log('💡 Solution: User needs to login again to get a fresh token');
    }
    
    // Show a sample valid token for testing
    const sampleUser = allUsers.find(u => u.role === 'recruiter');
    if (sampleUser) {
      console.log('\n✅ Sample valid recruiter for testing:');
      console.log(`   Email: ${sampleUser.email}`);
      console.log(`   User ID: ${sampleUser.userId}`);
      
      // Generate a test token
      const testToken = jwtUtils.generateTokens(sampleUser);
      console.log(`   Test Token: ${testToken.accessToken}`);
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
};

debugToken()
  .then(() => {
    console.log('\n🏁 Debug script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Debug script failed:', error);
    process.exit(1);
  });