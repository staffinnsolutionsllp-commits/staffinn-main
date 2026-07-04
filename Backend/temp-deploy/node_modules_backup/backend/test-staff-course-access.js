/**
 * Test script to debug staff course access issues
 */
const dynamoService = require('./services/dynamoService');

const COURSES_TABLE = 'staffinn-courses';
const COURSE_ENROLLMENTS_TABLE = 'course-enrolled-user';

async function testStaffCourseAccess() {
  try {
    console.log('🔍 Testing staff course access workflow...\n');

    // 1. Check if courses exist
    console.log('1. Checking available courses...');
    const allCourses = await dynamoService.scanItems(COURSES_TABLE);
    console.log(`Found ${allCourses.length} courses in database`);
    
    if (allCourses.length > 0) {
      const sampleCourse = allCourses[0];
      console.log('Sample course structure:');
      console.log({
        coursesId: sampleCourse.coursesId,
        courseName: sampleCourse.courseName,
        instituteId: sampleCourse.instituteId,
        modulesCount: sampleCourse.modules?.length || 0,
        isActive: sampleCourse.isActive
      });
    }

    // 2. Check enrollments
    console.log('\n2. Checking course enrollments...');
    const allEnrollments = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE);
    console.log(`Found ${allEnrollments.length} enrollments in database`);
    
    if (allEnrollments.length > 0) {
      const sampleEnrollment = allEnrollments[0];
      console.log('Sample enrollment structure:');
      console.log({
        enrolledID: sampleEnrollment.enrolledID,
        userId: sampleEnrollment.userId,
        courseId: sampleEnrollment.courseId,
        progressPercentage: sampleEnrollment.progressPercentage,
        status: sampleEnrollment.status
      });

      // 3. Test getUserEnrollments logic
      console.log('\n3. Testing getUserEnrollments logic...');
      const userId = sampleEnrollment.userId;
      
      const params = {
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      };
      
      const userEnrollments = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, params);
      console.log(`Found ${userEnrollments.length} enrollments for user ${userId}`);
      
      // Get course details for each enrollment
      const enrollmentsWithCourses = await Promise.all(
        userEnrollments.map(async (enrollment) => {
          const course = await dynamoService.getItem(COURSES_TABLE, {
            coursesId: enrollment.courseId
          });
          return { 
            enrollment,
            course,
            hasCourse: !!course
          };
        })
      );
      
      console.log('Enrollments with course data:');
      enrollmentsWithCourses.forEach((item, index) => {
        console.log(`  ${index + 1}. Course ID: ${item.enrollment.courseId}`);
        console.log(`     Course Found: ${item.hasCourse}`);
        if (item.course) {
          console.log(`     Course Name: ${item.course.courseName}`);
          console.log(`     Duration: ${item.course.duration}`);
          console.log(`     Instructor: ${item.course.instructor}`);
        }
      });

      // 4. Test getCourseContent logic
      console.log('\n4. Testing getCourseContent logic...');
      const testCourseId = userEnrollments[0].courseId;
      
      // Check enrollment
      const enrollmentParams = {
        FilterExpression: 'userId = :userId AND courseId = :courseId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':courseId': testCourseId
        }
      };
      
      const enrollmentCheck = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, enrollmentParams);
      console.log(`Enrollment check for course ${testCourseId}: ${enrollmentCheck.length > 0 ? 'ENROLLED' : 'NOT ENROLLED'}`);
      
      if (enrollmentCheck.length > 0) {
        // Get course content
        const courseContent = await dynamoService.getItem(COURSES_TABLE, {
          coursesId: testCourseId
        });
        
        if (courseContent) {
          console.log('Course content structure:');
          console.log({
            coursesId: courseContent.coursesId,
            courseName: courseContent.courseName,
            duration: courseContent.duration,
            instructor: courseContent.instructor,
            modulesCount: courseContent.modules?.length || 0,
            firstModuleTitle: courseContent.modules?.[0]?.title,
            firstModuleContentCount: courseContent.modules?.[0]?.content?.length || 0
          });
          
          if (courseContent.modules && courseContent.modules[0] && courseContent.modules[0].content) {
            console.log('First content item:');
            const firstContent = courseContent.modules[0].content[0];
            console.log({
              contentId: firstContent?.contentId,
              title: firstContent?.title,
              type: firstContent?.type,
              fileUrl: firstContent?.fileUrl,
              hasFileUrl: !!firstContent?.fileUrl
            });
          }
        } else {
          console.log('❌ Course content not found!');
        }
      }
    }

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testStaffCourseAccess();