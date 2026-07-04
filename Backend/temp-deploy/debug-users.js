/**
 * Debug script to check all users in database
 */

const { mockDB, isUsingMockDB, USERS_TABLE } = require('./config/dynamodb-wrapper');
const dynamoService = require('./services/dynamoService');

const debugUsers = async () => {
  try {
    console.log('Fetching all users from database...');
    
    let users = [];
    
    if (isUsingMockDB()) {
      console.log('Using mock database');
      users = mockDB().scan(USERS_TABLE, 100);
    } else {
      console.log('Using real DynamoDB');
      users = await dynamoService.scanItems(USERS_TABLE);
    }
    
    console.log(`Found ${users.length} users:`);
    console.log('='.repeat(50));
    
    if (users.length === 0) {
      console.log('No users found in database.');
      return;
    }
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.userId}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.fullName || user.companyName || user.instituteName || 'N/A'}`);
      console.log(`   Blocked: ${user.isBlocked ? 'YES' : 'NO'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('-'.repeat(30));
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

// Run debug
debugUsers();