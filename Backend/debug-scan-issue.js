require('dotenv').config();
const dynamoService = require('./services/dynamoService');

const debugScanIssue = async () => {
  try {
    console.log('🔍 Debugging scan issue...\n');
    
    const testUserId = '3bf4e12f-2b83-40a6-9846-bc127f65a10c'; // Rohan's userId
    const STAFF_TABLE = 'staffinn-staff-profiles';
    
    // Test 1: Direct scan with exact same parameters as controller
    console.log('1. Testing exact controller scan...');
    try {
      const userProfiles = await dynamoService.scanItems(STAFF_TABLE, {
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': testUserId
        },
        Limit: 1
      });
      
      console.log('   Result:', userProfiles ? userProfiles.length : 'null', 'profiles');
      if (userProfiles && userProfiles.length > 0) {
        console.log('   Profile:', userProfiles[0].fullName);
      }
    } catch (error) {
      console.log('   Error:', error.message);
    }
    
    // Test 2: Scan without limit
    console.log('\n2. Testing scan without limit...');
    try {
      const userProfiles = await dynamoService.scanItems(STAFF_TABLE, {
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': testUserId
        }
      });
      
      console.log('   Result:', userProfiles ? userProfiles.length : 'null', 'profiles');
      if (userProfiles && userProfiles.length > 0) {
        console.log('   Profile:', userProfiles[0].fullName);
      }
    } catch (error) {
      console.log('   Error:', error.message);
    }
    
    // Test 3: Get all profiles and filter manually
    console.log('\n3. Testing manual filter...');
    try {
      const allProfiles = await dynamoService.scanItems(STAFF_TABLE);
      console.log('   Total profiles:', allProfiles.length);
      
      const matchingProfiles = allProfiles.filter(profile => profile.userId === testUserId);
      console.log('   Matching profiles:', matchingProfiles.length);
      
      if (matchingProfiles.length > 0) {
        console.log('   Profile:', matchingProfiles[0].fullName);
        console.log('   Photo:', matchingProfiles[0].profilePhoto ? 'Has photo' : 'No photo');
      }
    } catch (error) {
      console.log('   Error:', error.message);
    }
    
    // Test 4: Check if there's a timing issue
    console.log('\n4. Testing with delay...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const userProfiles = await dynamoService.scanItems(STAFF_TABLE, {
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': testUserId
        },
        Limit: 1
      });
      
      console.log('   Result after delay:', userProfiles ? userProfiles.length : 'null', 'profiles');
    } catch (error) {
      console.log('   Error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

// Run the debug
debugScanIssue()
  .then(() => {
    console.log('\n🏁 Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
  });