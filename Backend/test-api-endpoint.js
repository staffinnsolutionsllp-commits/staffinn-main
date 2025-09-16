const fetch = require('node-fetch');

const API_URL = 'http://localhost:4001/api/v1';

const testCourseReviewAPI = async () => {
  try {
    console.log('🧪 Testing Course Review API endpoints...\n');
    
    // Test the course ID from our database test
    const courseId = '6b5b0fb2-01a9-4141-bf29-c3b8ecd37a8e';
    
    // Test 1: Get course reviews
    console.log('1. Testing GET /reviews/course/:courseId');
    const reviewsUrl = `${API_URL}/reviews/course/${courseId}`;
    console.log('   URL:', reviewsUrl);
    
    const reviewsResponse = await fetch(reviewsUrl);
    console.log('   Status:', reviewsResponse.status);
    const reviewsData = await reviewsResponse.json();
    console.log('   Response:', JSON.stringify(reviewsData, null, 2));
    
    // Test 2: Get course rating stats
    console.log('\n2. Testing GET /reviews/course/:courseId/stats');
    const statsUrl = `${API_URL}/reviews/course/${courseId}/stats`;
    console.log('   URL:', statsUrl);
    
    const statsResponse = await fetch(statsUrl);
    console.log('   Status:', statsResponse.status);
    const statsData = await statsResponse.json();
    console.log('   Response:', JSON.stringify(statsData, null, 2));
    
    // Test 3: Get enrollment count
    console.log('\n3. Testing GET /reviews/course/:courseId/enrollment');
    const enrollmentUrl = `${API_URL}/reviews/course/${courseId}/enrollment`;
    console.log('   URL:', enrollmentUrl);
    
    const enrollmentResponse = await fetch(enrollmentUrl);
    console.log('   Status:', enrollmentResponse.status);
    const enrollmentData = await enrollmentResponse.json();
    console.log('   Response:', JSON.stringify(enrollmentData, null, 2));
    
    console.log('\n✅ API endpoint test completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
};

// Run the test
testCourseReviewAPI()
  .then(() => {
    console.log('\n🏁 API test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 API test script failed:', error);
    process.exit(1);
  });