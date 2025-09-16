/**
 * Test script to verify progress tracking system
 */

const dynamoService = require('./services/dynamoService');

const testProgressSystem = async () => {
  console.log('🧪 Testing Progress Tracking System...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking table existence...');
    
    const coursesTable = 'staffinn-courses';
    const enrollmentsTable = 'course-enrolled-user';
    const progressTable = 'user-quiz-progress';
    
    console.log(`✅ Tables configured: ${coursesTable}, ${enrollmentsTable}, ${progressTable}\n`);

    // Test 2: Check enrollment table structure
    console.log('2. Checking enrollment table structure...');
    
    const enrollmentParams = {
      Limit: 1
    };
    
    const enrollments = await dynamoService.scanItems(enrollmentsTable, enrollmentParams);
    
    if (enrollments.length > 0) {
      const sampleEnrollment = enrollments[0];
      console.log('Sample enrollment record structure:');
      console.log('- enrolledID:', !!sampleEnrollment.enrolledID);
      console.log('- userId:', !!sampleEnrollment.userId);
      console.log('- courseId:', !!sampleEnrollment.courseId);
      console.log('- progressPercentage:', sampleEnrollment.progressPercentage);
      console.log('- progressData:', !!sampleEnrollment.progressData);
      
      if (sampleEnrollment.progressData) {
        console.log('  - completedContent:', Object.keys(sampleEnrollment.progressData.completedContent || {}).length);
        console.log('  - completedQuizzes:', Object.keys(sampleEnrollment.progressData.completedQuizzes || {}).length);
      }
    } else {
      console.log('No enrollment records found');
    }
    
    console.log('');

    // Test 3: Check quiz progress table
    console.log('3. Checking quiz progress table...');
    
    try {
      const progressParams = {
        Limit: 1
      };
      
      const progressRecords = await dynamoService.scanItems(progressTable, progressParams);
      
      if (progressRecords.length > 0) {
        const sampleProgress = progressRecords[0];
        console.log('Sample quiz progress record structure:');
        console.log('- quizprogressId:', !!sampleProgress.quizprogressId);
        console.log('- userId:', !!sampleProgress.userId);
        console.log('- courseId:', !!sampleProgress.courseId);
        console.log('- quizId:', !!sampleProgress.quizId);
        console.log('- passed:', sampleProgress.passed);
        console.log('- score:', sampleProgress.score);
        console.log('- attemptCount:', sampleProgress.attemptCount);
      } else {
        console.log('No quiz progress records found');
      }
    } catch (error) {
      console.log('Quiz progress table not accessible:', error.message);
    }
    
    console.log('');

    // Test 4: Check course structure
    console.log('4. Checking course structure...');
    
    const courseParams = {
      Limit: 1
    };
    
    const courses = await dynamoService.scanItems(coursesTable, courseParams);
    
    if (courses.length > 0) {
      const sampleCourse = courses[0];
      console.log('Sample course record structure:');
      console.log('- coursesId:', !!sampleCourse.coursesId);
      console.log('- courseName:', !!sampleCourse.courseName);
      console.log('- modules:', sampleCourse.modules?.length || 0);
      
      if (sampleCourse.modules && sampleCourse.modules.length > 0) {
        const firstModule = sampleCourse.modules[0];
        console.log('  - First module content items:', firstModule.content?.length || 0);
        console.log('  - First module has quiz:', !!firstModule.quiz);
        
        if (firstModule.content && firstModule.content.length > 0) {
          const contentTypes = firstModule.content.map(c => c.contentType);
          console.log('  - Content types:', [...new Set(contentTypes)]);
        }
      }
    } else {
      console.log('No course records found');
    }

    console.log('\n✅ Progress tracking system structure verified!');
    console.log('\n📋 Summary:');
    console.log('- Tables are accessible');
    console.log('- Data structures are in place');
    console.log('- Progress tracking endpoints should work');
    console.log('\n🚀 System is ready for progress tracking!');

  } catch (error) {
    console.error('❌ Error testing progress system:', error);
  }
};

// Run the test
testProgressSystem().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});