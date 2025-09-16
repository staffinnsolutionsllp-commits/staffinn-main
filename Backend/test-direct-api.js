require('dotenv').config();
const dynamoService = require('./services/dynamoService');

const testDirectAPI = async () => {
  try {
    console.log('🧪 Testing direct API logic...\n');
    
    const courseId = '6b5b0fb2-01a9-4141-bf29-c3b8ecd37a8e';
    
    // Simulate the getCourseReviews function logic
    console.log('1. Getting reviews from database...');
    const result = await dynamoService.scanItems('course-review', {
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      },
      Limit: 10
    });
    
    const sortedReviews = (result || []).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    console.log('   Found', sortedReviews.length, 'reviews');
    
    // Test profile photo update logic
    console.log('\n2. Testing profile photo updates...');
    for (const review of sortedReviews) {
      console.log(`\n   Processing review by ${review.userName} (${review.userId})`);
      console.log('   Current photo:', review.userPhoto ? 'Has photo' : 'No photo');
      
      if (review.userId && review.userId !== 'anonymous') {
        const userProfiles = await dynamoService.scanItems('staffinn-staff-profiles', {
          FilterExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': review.userId
          },
          Limit: 1
        });
        
        if (userProfiles && userProfiles.length > 0) {
          const profile = userProfiles[0];
          console.log('   Profile found:', profile.fullName);
          console.log('   Profile photo:', profile.profilePhoto ? 'Has photo' : 'No photo');
          
          if (profile.profilePhoto) {
            console.log('   Photo URL:', profile.profilePhoto.substring(0, 80) + '...');
            review.userPhoto = profile.profilePhoto;
            review.userName = profile.fullName || profile.name || review.userName;
            console.log('   ✅ Updated review with photo');
          } else {
            console.log('   ❌ Profile has no photo');
          }
        } else {
          console.log('   ❌ No profile found');
        }
      }
    }
    
    console.log('\n3. Final review data:');
    sortedReviews.forEach((review, index) => {
      console.log(`   Review ${index + 1}: ${review.userName} - Photo: ${review.userPhoto ? 'YES' : 'NO'}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testDirectAPI()
  .then(() => {
    console.log('\n🏁 Direct API test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });