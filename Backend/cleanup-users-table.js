/**
 * Cleanup Users Table Script
 * Removes all extra attributes from existing users, keeping only registration form fields
 */

require('dotenv').config();
const dynamoService = require('./services/dynamoService');

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;

const cleanupUsersTable = async () => {
  try {
    console.log('Starting users table cleanup...');
    
    // Get all users
    const allUsers = await dynamoService.scanItems(USERS_TABLE);
    console.log(`Found ${allUsers.length} users to clean`);
    
    for (const user of allUsers) {
      console.log(`Cleaning user: ${user.email} (${user.role})`);
      
      // Create clean user object with only registration form fields
      let cleanUser = {
        userId: user.userId,
        email: user.email,
        password: user.password, // Keep password
        role: user.role,
        createdAt: user.createdAt
      };
      
      // Add role-specific fields based on registration forms
      if (user.role === 'staff') {
        cleanUser.fullName = user.fullName || user.name || 'Staff Member';
        cleanUser.phoneNumber = user.phoneNumber || user.phone || null;
      } else if (user.role === 'recruiter') {
        cleanUser.companyName = user.companyName || user.name || 'Company';
        cleanUser.phoneNumber = user.phoneNumber || user.phone || null;
        cleanUser.website = user.website || null;
      } else if (user.role === 'institute') {
        cleanUser.instituteName = user.instituteName || user.name || 'Institute';
        cleanUser.phoneNumber = user.phoneNumber || user.phone || null;
        cleanUser.registrationNumber = user.registrationNumber || null;
      }
      
      // Replace the entire user record with clean data
      await dynamoService.putItem(USERS_TABLE, cleanUser);
      console.log(`✓ Cleaned user: ${user.email}`);
    }
    
    console.log('✅ Users table cleanup completed successfully!');
    console.log(`Processed ${allUsers.length} users`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
};

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupUsersTable()
    .then(() => {
      console.log('Cleanup script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupUsersTable };