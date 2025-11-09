/**
 * Create test enrollment for debugging
 */
const { v4: uuidv4 } = require('uuid');
const dynamoService = require('./services/dynamoService');

const COURSES_TABLE = 'staffinn-courses';
const COURSE_ENROLLMENTS_TABLE = 'course-enrolled-user';

async function createTestData() {
  try {
    console.log('🔧 Creating test course and enrollment...\n');

    // Create a test course
    const courseId = uuidv4();
    const instituteId = 'test-institute-id';
    const timestamp = new Date().toISOString();

    const testCourse = {
      coursesId: courseId,
      instituteId: instituteId,
      courseName: 'Test JavaScript Course',
      duration: '3 months',
      fees: 5000,
      instructor: 'John Doe',
      category: 'Programming',
      mode: 'Online',
      thumbnailUrl: 'https://example.com/thumbnail.jpg',
      description: 'Learn JavaScript from basics to advanced',
      prerequisites: 'Basic computer knowledge',
      syllabusOverview: 'Variables, Functions, Objects, DOM, APIs',
      certification: 'Certificate',
      modules: [
        {
          moduleId: uuidv4(),
          title: 'Introduction to JavaScript',
          description: 'Basic concepts and syntax',
          order: 1,
          content: [
            {
              contentId: uuidv4(),
              title: 'Variables and Data Types',
              type: 'video',
              fileUrl: 'https://example.com/video1.mp4',
              order: 1,
              duration: 30,
              mandatory: true
            },
            {
              contentId: uuidv4(),
              title: 'Functions Assignment',
              type: 'assignment',
              fileUrl: 'https://example.com/assignment1.pdf',
              order: 2,
              duration: 0,
              mandatory: true
            }
          ]
        },
        {
          moduleId: uuidv4(),
          title: 'Advanced JavaScript',
          description: 'Advanced concepts and patterns',
          order: 2,
          content: [
            {
              contentId: uuidv4(),
              title: 'Async Programming',
              type: 'video',
              fileUrl: 'https://example.com/video2.mp4',
              order: 1,
              duration: 45,
              mandatory: true
            }
          ]
        }
      ],
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    console.log('Creating test course...');
    await dynamoService.putItem(COURSES_TABLE, testCourse);
    console.log('✅ Test course created:', courseId);

    // Create a test enrollment
    const userId = 'test-staff-user-id'; // This should match a real staff user ID
    const enrollmentId = uuidv4();

    const testEnrollment = {
      enrolledID: enrollmentId,
      userId: userId,
      courseId: courseId,
      enrollmentDate: timestamp,
      progressPercentage: 25,
      status: 'active',
      paymentStatus: 'free'
    };

    console.log('Creating test enrollment...');
    await dynamoService.putItem(COURSE_ENROLLMENTS_TABLE, testEnrollment);
    console.log('✅ Test enrollment created:', enrollmentId);

    console.log('\n📋 Test Data Summary:');
    console.log('Course ID:', courseId);
    console.log('Course Name:', testCourse.courseName);
    console.log('User ID:', userId);
    console.log('Enrollment ID:', enrollmentId);
    console.log('Progress:', testEnrollment.progressPercentage + '%');

    console.log('\n🔗 Test URLs:');
    console.log('Get Enrollments:', `GET /api/v1/institutes/my-enrollments`);
    console.log('Get Course Content:', `GET /api/v1/institutes/courses/${courseId}/content`);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

// Run the script
createTestData();