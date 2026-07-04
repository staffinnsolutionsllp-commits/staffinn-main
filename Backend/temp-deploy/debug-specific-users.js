const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

const debugSpecificUsers = async () => {
  try {
    console.log('🔍 Debugging specific user profiles...\n');
    
    const userIds = [
      '069de717-20ac-4848-9f4c-f3c35fa3d2fb', // ramu
      '3bf4e12f-2b83-40a6-9846-bc127f65a10c'  // Rohan
    ];
    
    for (const userId of userIds) {
      console.log(`\n🔍 Checking userId: ${userId}`);
      
      // Search for this user in staff profiles
      const params = {
        TableName: 'staffinn-staff-profiles',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      };
      
      const result = await dynamodb.scan(params).promise();
      
      if (result.Items && result.Items.length > 0) {
        const profile = result.Items[0];
        console.log('✅ Profile found:');
        console.log('   - fullName:', profile.fullName);
        console.log('   - profilePhoto:', profile.profilePhoto);
        console.log('   - hasPhoto:', !!profile.profilePhoto);
      } else {
        console.log('❌ Profile not found in staff-profiles table');
        
        // Check if user exists in users table
        const userParams = {
          TableName: 'staffinn-users',
          FilterExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          }
        };
        
        const userResult = await dynamodb.scan(userParams).promise();
        if (userResult.Items && userResult.Items.length > 0) {
          console.log('ℹ️  User found in users table:', userResult.Items[0].fullName || userResult.Items[0].name);
        } else {
          console.log('❌ User not found in users table either');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

// Run the debug
debugSpecificUsers()
  .then(() => {
    console.log('\n🏁 Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
  });