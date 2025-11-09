require('dotenv').config();
const dynamoService = require('./services/dynamoService');

const listAllUserIds = async () => {
  try {
    console.log('📋 Listing all userIds in staff profiles...\n');
    
    // Get all staff profiles
    const allProfiles = await dynamoService.scanItems('staffinn-staff-profiles');
    console.log('Found', allProfiles.length, 'staff profiles\n');
    
    allProfiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.fullName || 'No name'}`);
      console.log(`   userId: ${profile.userId}`);
      console.log(`   profilePhoto: ${profile.profilePhoto ? 'Has photo' : 'No photo'}`);
      console.log('');
    });
    
    // Also check the review userIds
    console.log('🔍 Checking review userIds...\n');
    const reviews = await dynamoService.scanItems('course-review');
    console.log('Found', reviews.length, 'reviews\n');
    
    reviews.forEach((review, index) => {
      console.log(`Review ${index + 1}: ${review.userName}`);
      console.log(`   userId: ${review.userId}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
listAllUserIds()
  .then(() => {
    console.log('🏁 Listing completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });