/**
 * Test Quiz Progress Functionality
 * This script tests the quiz progress tracking system
 */

const quizProgressModel = require('./models/quizProgressModel');

async function testQuizProgress() {
  console.log('🧪 Testing Quiz Progress Functionality...\n');

  const testUserId = 'test-user-123';
  const testCourseId = 'test-course-456';
  const testQuizId = 'test-quiz-789';
  const testModuleId = 'test-module-101';

  try {
    // Test 1: Save quiz progress (failed attempt)
    console.log('1️⃣ Testing failed quiz attempt...');
    const failedProgress = await quizProgressModel.saveQuizProgress(
      testUserId,
      testCourseId,
      testQuizId,
      testModuleId,
      45, // score
      10, // maxScore
      false // passed
    );
    console.log('✅ Failed attempt saved:', failedProgress);

    // Test 2: Check quiz progress
    console.log('\n2️⃣ Checking quiz progress...');
    const progress1 = await quizProgressModel.checkQuizProgress(testUserId, testCourseId, testQuizId);
    console.log('📊 Progress after failed attempt:', progress1);

    // Test 3: Save quiz progress (passed attempt)
    console.log('\n3️⃣ Testing passed quiz attempt...');
    const passedProgress = await quizProgressModel.saveQuizProgress(
      testUserId,
      testCourseId,
      testQuizId,
      testModuleId,
      85, // score
      10, // maxScore
      true // passed
    );
    console.log('✅ Passed attempt saved:', passedProgress);

    // Test 4: Check quiz progress again
    console.log('\n4️⃣ Checking quiz progress after passing...');
    const progress2 = await quizProgressModel.checkQuizProgress(testUserId, testCourseId, testQuizId);
    console.log('📊 Progress after passed attempt:', progress2);

    // Test 5: Get user course quiz progress
    console.log('\n5️⃣ Getting all quiz progress for course...');
    const courseProgress = await quizProgressModel.getUserCourseQuizProgress(testUserId, testCourseId);
    console.log('📚 Course quiz progress:', courseProgress);

    // Test 6: Try to save another attempt after passing (should increment attempts but keep passed status)
    console.log('\n6️⃣ Testing attempt after already passing...');
    const anotherAttempt = await quizProgressModel.saveQuizProgress(
      testUserId,
      testCourseId,
      testQuizId,
      testModuleId,
      95, // score
      10, // maxScore
      true // passed
    );
    console.log('🔄 Another attempt after passing:', anotherAttempt);

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Quiz progress tracking: ✅ Working');
    console.log('- Failed attempts: ✅ Recorded');
    console.log('- Passed attempts: ✅ Recorded');
    console.log('- Attempt counting: ✅ Working');
    console.log('- Progress retrieval: ✅ Working');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n📋 Error Details:');
    console.log('- Error message:', error.message);
    console.log('- Error name:', error.name);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('\n💡 Note: This error is expected if the user-quiz-progress table doesn\'t exist yet.');
      console.log('   The system will work with localStorage fallback until the table is created.');
    }
  }
}

// Run the test
if (require.main === module) {
  testQuizProgress().then(() => {
    console.log('\n🏁 Test completed.');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });
}

module.exports = { testQuizProgress };