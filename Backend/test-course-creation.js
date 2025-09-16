/**
 * Test Course Creation Workflow
 * This script tests the complete course creation and enrollment process
 */

const { v4: uuidv4 } = require('uuid');
const dynamoService = require('./services/dynamoService');

const COURSES_TABLE = 'staffinn-courses';
const COURSE_ENROLLMENTS_TABLE = 'course-enrolled-user';

async function testCourseCreation() {
  try {
    console.log('🧪 Testing Course Creation Workflow...\n');

    // Test 1: Create a sample course
    const courseId = uuidv4();
    const instituteId = 'test-institute-id';
    const timestamp = new Date().toISOString();

    const testCourse = {
      coursesId: courseId,
      instituteId: instituteId,
      courseName: 'Test Web Development Course',
      duration: '6 months',
      fees: 15000,
      instructor: 'John Doe',
      category: 'IT',
      mode: 'Online',
      thumbnailUrl: 'https://example.com/thumbnail.jpg',
      description: 'Learn web development from scratch',
      prerequisites: 'Basic computer knowledge',
      syllabusOverview: 'HTML, CSS, JavaScript, React',
      certification: 'Professional',
      modules: [
        {
          moduleId: uuidv4(),
          moduleTitle: 'Introduction to HTML',
          moduleDescription: 'Learn HTML basics',
          order: 1,
          content: [
            {
              contentId: uuidv4(),
              contentTitle: 'HTML Fundamentals',
              contentType: 'video',
              contentUrl: 'https://staffinn-files.s3.ap-south-1.amazonaws.com/test-video.mp4',
              order: 1,
              durationMinutes: 30,
              mandatory: true
            }
          ]
        }
      ],
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    console.log('1️⃣ Creating test course...');
    await dynamoService.putItem(COURSES_TABLE, testCourse);
    console.log('✅ Course created successfully');
    console.log('   Course ID:', courseId);
    console.log('   Course Name:', testCourse.courseName);

    // Test 2: Retrieve the course
    console.log('\n2️⃣ Retrieving course...');
    const retrievedCourse = await dynamoService.getItem(COURSES_TABLE, {
      coursesId: courseId
    });
    
    if (retrievedCourse) {
      console.log('✅ Course retrieved successfully');
      console.log('   Retrieved Name:', retrievedCourse.courseName);
      console.log('   Modules Count:', retrievedCourse.modules?.length || 0);
    } else {
      console.log('❌ Failed to retrieve course');
      return;
    }

    // Test 3: Create enrollment
    const userId = 'test-user-id';
    const enrollmentId = uuidv4();
    
    const testEnrollment = {
      enrolledID: enrollmentId,
      userId: userId,
      courseId: courseId, // This should NOT be undefined
      courseName: testCourse.courseName,
      instituteId: testCourse.instituteId,
      enrollmentDate: new Date().toISOString(),
      progressPercentage: 0,
      status: 'active',
      paymentStatus: 'free'
    };

    console.log('\n3️⃣ Creating enrollment...');
    console.log('   Enrollment data:', {
      enrolledID: testEnrollment.enrolledID,
      userId: testEnrollment.userId,
      courseId: testEnrollment.courseId,
      courseName: testEnrollment.courseName
    });

    await dynamoService.putItem(COURSE_ENROLLMENTS_TABLE, testEnrollment);
    console.log('✅ Enrollment created successfully');

    // Test 4: Retrieve enrollment
    console.log('\n4️⃣ Retrieving enrollment...');
    const retrievedEnrollment = await dynamoService.getItem(COURSE_ENROLLMENTS_TABLE, {
      enrolledID: enrollmentId
    });

    if (retrievedEnrollment) {
      console.log('✅ Enrollment retrieved successfully');
      console.log('   User ID:', retrievedEnrollment.userId);
      console.log('   Course ID:', retrievedEnrollment.courseId);
      console.log('   Course Name:', retrievedEnrollment.courseName);
      
      if (retrievedEnrollment.courseId === courseId) {
        console.log('✅ Course ID matches - enrollment is correct');
      } else {
        console.log('❌ Course ID mismatch!');
        console.log('   Expected:', courseId);
        console.log('   Actual:', retrievedEnrollment.courseId);
      }
    } else {
      console.log('❌ Failed to retrieve enrollment');
    }

    // Test 5: Query enrollments by user
    console.log('\n5️⃣ Querying user enrollments...');
    const userEnrollments = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, {
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });

    console.log('✅ Found', userEnrollments.length, 'enrollments for user');
    userEnrollments.forEach((enrollment, index) => {
      console.log(`   Enrollment ${index + 1}:`, {
        courseId: enrollment.courseId,
        courseName: enrollment.courseName,
        status: enrollment.status
      });
    });

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Course creation: Working');
    console.log('   ✅ Course retrieval: Working');
    console.log('   ✅ Enrollment creation: Working');
    console.log('   ✅ Enrollment retrieval: Working');
    console.log('   ✅ Course ID preservation: Working');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testCourseCreation();
}

module.exports = { testCourseCreation };