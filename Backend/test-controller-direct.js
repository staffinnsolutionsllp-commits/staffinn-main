require('dotenv').config();
const dynamoService = require('./services/dynamoService');

const testControllerLogic = async () => {
  try {
    console.log('🧪 Testing controller logic directly...\n');
    
    const courseId = '6b5b0fb2-01a9-4141-bf29-c3b8ecd37a8e';
    const COURSE_REVIEW_TABLE = 'course-review';
    const STAFF_TABLE = 'staffinn-staff-profiles';
    
    // Step 1: Get reviews
    console.log('1. Getting reviews...');
    const result = await dynamoService.scanItems(COURSE_REVIEW_TABLE, {
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
    
    // Step 2: Update profile photos
    console.log('\n2. Updating profile photos...');
    const updatedReviews = await Promise.all(
      sortedReviews.map(async (review) => {
        console.log(`\n   Processing review by ${review.userName} (${review.userId})`);
        
        if (review.userId && review.userId !== 'anonymous') {
          try {
            console.log('   Scanning for profile...');
            const userProfiles = await dynamoService.scanItems(STAFF_TABLE, {
              FilterExpression: 'userId = :userId',
              ExpressionAttributeValues: {
                ':userId': review.userId
              }
            });
            
            console.log('   Scan result:', userProfiles ? userProfiles.length : 'null', 'profiles found');
            
            if (userProfiles && userProfiles.length > 0) {
              const profile = userProfiles[0];
              console.log('   Profile found:', profile.fullName);
              console.log('   Profile photo:', profile.profilePhoto ? 'Has photo' : 'No photo');
              
              if (profile.profilePhoto !== review.userPhoto) {
                review.userPhoto = profile.profilePhoto;
                review.userName = profile.fullName || profile.name || review.userName;
                console.log('   ✅ Updated photo for', review.userName);
              } else {
                console.log('   ℹ️  Photo already up to date');
              }
            } else {
              console.log('   ❌ No profile found');
            }
          } catch (profileError) {
            console.log('   ❌ Error:', profileError.message);
          }
        }
        return review;
      })
    );
    
    console.log('\n3. Final results:');
    updatedReviews.forEach((review, index) => {
      console.log(`   Review ${index + 1}: ${review.userName}`);
      console.log(`   - Photo: ${review.userPhoto ? 'YES' : 'NO'}`);
      if (review.userPhoto) {
        console.log(`   - URL: ${review.userPhoto.substring(0, 80)}...`);
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testControllerLogic()
  .then(() => {
    console.log('\n🏁 Controller test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });