const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

const testCourseReviews = async () => {
  try {
    console.log('🧪 Testing course review functionality...\n');
    
    // Test 1: Check if course-review table exists and is accessible
    console.log('1. Testing table access...');
    const scanParams = {
      TableName: 'course-review',
      Limit: 1
    };
    
    try {
      const scanResult = await dynamodb.scan(scanParams).promise();
      console.log('✅ Table accessible, items count:', scanResult.Count);
    } catch (error) {
      console.error('❌ Table access failed:', error.message);
      return;
    }
    
    // Test 2: Get all reviews to see what's in the table
    console.log('\n2. Getting all reviews...');
    const allReviewsParams = {
      TableName: 'course-review'
    };
    
    const allReviews = await dynamodb.scan(allReviewsParams).promise();
    console.log('📊 Total reviews in table:', allReviews.Items.length);
    
    if (allReviews.Items.length > 0) {
      console.log('📝 Sample review:', JSON.stringify(allReviews.Items[0], null, 2));
      
      // Test 3: Get reviews for a specific course
      const sampleCourseId = allReviews.Items[0].courseId;
      console.log('\n3. Testing course-specific reviews for courseId:', sampleCourseId);
      
      const courseReviewsParams = {
        TableName: 'course-review',
        FilterExpression: 'courseId = :courseId',
        ExpressionAttributeValues: {
          ':courseId': sampleCourseId
        }
      };
      
      const courseReviews = await dynamodb.scan(courseReviewsParams).promise();
      console.log('📊 Reviews for course:', courseReviews.Items.length);
      
      // Test 4: Calculate rating stats
      if (courseReviews.Items.length > 0) {
        const ratings = courseReviews.Items.map(review => review.rating);
        const totalRating = ratings.reduce((sum, rating) => sum + rating, 0);
        const averageRating = totalRating / ratings.length;
        
        console.log('\n4. Rating statistics:');
        console.log('   Average rating:', averageRating.toFixed(1));
        console.log('   Total reviews:', ratings.length);
        console.log('   Individual ratings:', ratings);
      }
    } else {
      console.log('ℹ️  No reviews found in table');
    }
    
    console.log('\n✅ Course review test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testCourseReviews()
  .then(() => {
    console.log('\n🏁 Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });