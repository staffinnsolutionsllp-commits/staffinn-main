require('dotenv').config();
const dynamoService = require('./services/dynamoService');

const testStaffScan = async () => {
  try {
    console.log('🔍 Testing staff profile scan...\n');
    
    // Test 1: Get all staff profiles
    console.log('1. Getting all staff profiles...');
    const allProfiles = await dynamoService.scanItems('staffinn-staff-profiles', { Limit: 5 });
    console.log('   Found', allProfiles.length, 'profiles');
    
    if (allProfiles.length > 0) {
      console.log('\n   Sample profile:');
      const sample = allProfiles[0];
      console.log('   - userId:', sample.userId);
      console.log('   - fullName:', sample.fullName);
      console.log('   - profilePhoto:', sample.profilePhoto ? 'Has photo' : 'No photo');
    }
    
    // Test 2: Search for specific userIds
    const testUserIds = [
      '069de717-20ac-4848-9f4c-f3c35fa3d2fb', // ramu
      '3bf4e12f-2b83-40a6-9846-bc127f65a10c'  // Rohan
    ];
    
    for (const userId of testUserIds) {
      console.log(`\n2. Searching for userId: ${userId}`);
      
      const profiles = await dynamoService.scanItems('staffinn-staff-profiles', {
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        Limit: 1
      });
      
      if (profiles && profiles.length > 0) {
        const profile = profiles[0];
        console.log('   ✅ Profile found:');
        console.log('   - fullName:', profile.fullName);
        console.log('   - profilePhoto:', profile.profilePhoto ? 'Has photo' : 'No photo');
        if (profile.profilePhoto) {
          console.log('   - Photo URL:', profile.profilePhoto.substring(0, 80) + '...');
        }
      } else {
        console.log('   ❌ Profile not found');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testStaffScan()
  .then(() => {
    console.log('\n🏁 Staff scan test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });