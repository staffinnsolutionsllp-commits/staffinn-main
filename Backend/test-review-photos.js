const fetch = require('node-fetch');

const API_URL = 'http://localhost:4001/api/v1';

const testReviewPhotos = async () => {
  try {
    console.log('🧪 Testing review photos functionality...\n');
    
    // Test the course ID from our database test
    const courseId = '6b5b0fb2-01a9-4141-bf29-c3b8ecd37a8e';
    
    // Get course reviews to check if photos are now showing
    console.log('1. Testing GET /reviews/course/:courseId with photo updates');
    const reviewsUrl = `${API_URL}/reviews/course/${courseId}`;
    console.log('   URL:', reviewsUrl);
    
    const reviewsResponse = await fetch(reviewsUrl);
    console.log('   Status:', reviewsResponse.status);
    const reviewsData = await reviewsResponse.json();
    
    if (reviewsData.success && reviewsData.data.reviews.length > 0) {
      console.log('   Found', reviewsData.data.reviews.length, 'reviews');
      
      reviewsData.data.reviews.forEach((review, index) => {
        console.log(`\n   Review ${index + 1}:`);
        console.log('   - User:', review.userName);
        console.log('   - UserId:', review.userId);
        console.log('   - Has Photo:', !!review.userPhoto);
        console.log('   - Photo URL:', review.userPhoto ? review.userPhoto.substring(0, 100) + '...' : 'null');
        console.log('   - Rating:', review.rating);
        console.log('   - Review:', review.review);
      });
    } else {
      console.log('   No reviews found or error occurred');
    }
    
    console.log('\n✅ Review photos test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testReviewPhotos()
  .then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });