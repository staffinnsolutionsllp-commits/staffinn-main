const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

const debugStaffProfile = async () => {
  try {
    console.log('🔍 Debugging staff profile structure...\n');
    
    // Get a sample staff profile to see the structure
    const params = {
      TableName: 'staffinn-staff-profiles',
      Limit: 3
    };
    
    const result = await dynamodb.scan(params).promise();
    console.log('📊 Found', result.Items.length, 'staff profiles');
    
    if (result.Items.length > 0) {
      console.log('\n📝 Sample staff profile structure:');
      result.Items.forEach((profile, index) => {
        console.log(`\nProfile ${index + 1}:`);
        console.log('- userId:', profile.userId);
        console.log('- fullName:', profile.fullName);
        console.log('- name:', profile.name);
        console.log('- profilePhoto:', profile.profilePhoto);
        console.log('- profilePhotoUrl:', profile.profilePhotoUrl);
        console.log('- All keys:', Object.keys(profile));
      });
      
      // Test getting a specific profile
      const testUserId = result.Items[0].userId;
      console.log('\n🧪 Testing profile retrieval for userId:', testUserId);
      
      const getParams = {
        TableName: 'staffinn-staff-profiles',
        Key: { userId: testUserId }
      };
      
      const getResult = await dynamodb.get(getParams).promise();
      if (getResult.Item) {
        console.log('✅ Profile found via get operation');
        console.log('- fullName:', getResult.Item.fullName);
        console.log('- profilePhoto:', getResult.Item.profilePhoto);
        console.log('- profilePhotoUrl:', getResult.Item.profilePhotoUrl);
      } else {
        console.log('❌ Profile not found via get operation');
      }
    } else {
      console.log('ℹ️  No staff profiles found');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

// Run the debug
debugStaffProfile()
  .then(() => {
    console.log('\n🏁 Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
  });