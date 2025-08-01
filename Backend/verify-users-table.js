/**
 * Verify Users Table Script
 * Checks if users table contains only registration form fields
 */

require('dotenv').config();
const dynamoService = require('./services/dynamoService');

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;

const verifyUsersTable = async () => {
  try {
    console.log('Verifying users table structure...\n');
    
    // Get all users
    const allUsers = await dynamoService.scanItems(USERS_TABLE);
    console.log(`Found ${allUsers.length} users in table\n`);
    
    // Define allowed fields for each role
    const allowedFields = {
      staff: ['userId', 'email', 'password', 'role', 'createdAt', 'fullName', 'phoneNumber'],
      recruiter: ['userId', 'email', 'password', 'role', 'createdAt', 'companyName', 'phoneNumber', 'website'],
      institute: ['userId', 'email', 'password', 'role', 'createdAt', 'instituteName', 'phoneNumber', 'registrationNumber']
    };
    
    let isClean = true;
    
    for (const user of allUsers) {
      console.log(`\n📋 User: ${user.email} (${user.role})`);
      
      const userFields = Object.keys(user);
      const expectedFields = allowedFields[user.role] || [];
      
      // Check for extra fields
      const extraFields = userFields.filter(field => !expectedFields.includes(field));
      
      if (extraFields.length > 0) {
        console.log(`❌ Extra fields found: ${extraFields.join(', ')}`);
        isClean = false;
      } else {
        console.log(`✅ Clean - only registration form fields present`);
      }
      
      // Show current fields
      console.log(`   Fields: ${userFields.join(', ')}`);
    }
    
    console.log(`\n${'='.repeat(50)}`);
    if (isClean) {
      console.log('✅ TABLE IS CLEAN - Only registration form fields present');
    } else {
      console.log('❌ TABLE NEEDS CLEANUP - Extra fields found');
    }
    console.log(`${'='.repeat(50)}\n`);
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  }
};

// Run verification if this script is executed directly
if (require.main === module) {
  verifyUsersTable()
    .then(() => {
      console.log('Verification script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Verification script failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyUsersTable };