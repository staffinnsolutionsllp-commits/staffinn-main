const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

const testCourseWorkflow = async () => {
  console.log('🧪 Testing Course Management Workflow...\n');

  // Test 1: Create a sample course
  console.log('1️⃣ Testing course creation...');
  const sampleCourse = {
    coursesId: 'test-course-' + Date.now(),
    instituteId: 'test-institute-123',
    courseName: 'Full Stack Web Development',
    duration: '6 months',
    fees: 25000,
    instructor: 'John Doe',
    category: 'Technology',
    mode: 'Online',
    thumbnailUrl: null,
    description: 'Complete full stack web development course',
    prerequisites: 'Basic programming knowledge',
    syllabusOverview: 'HTML, CSS, JavaScript, React, Node.js, MongoDB',
    certification: 'Professional',
    modules: [
      {
        moduleId: 'module-1',
        title: 'Frontend Development',
        description: 'Learn HTML, CSS, and JavaScript',
        order: 1,
        content: [
          {
            contentId: 'content-1',
            title: 'Introduction to HTML',
            type: 'video',
            fileUrl: 'https://example.com/video1.mp4',
            order: 1,
            duration: 30,
            mandatory: true
          },
          {
            contentId: 'content-2',
            title: 'CSS Assignment',
            type: 'assignment',
            fileUrl: 'https://example.com/assignment1.pdf',
            order: 2,
            duration: 0,
            mandatory: true
          }
        ]
      },
      {
        moduleId: 'module-2',
        title: 'Backend Development',
        description: 'Learn Node.js and databases',
        order: 2,
        content: [
          {
            contentId: 'content-3',
            title: 'Node.js Basics',
            type: 'video',
            fileUrl: 'https://example.com/video2.mp4',
            order: 1,
            duration: 45,
            mandatory: true
          },
          {
            contentId: 'content-4',
            title: 'Final Quiz',
            type: 'quiz',
            fileUrl: null,
            order: 2,
            duration: 15,
            mandatory: true
          }
        ]
      }
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await dynamodb.put({
      TableName: 'staffinn-courses',
      Item: sampleCourse
    }).promise();
    console.log('✅ Course created successfully');
  } catch (error) {
    console.error('❌ Course creation failed:', error.message);
    return;
  }

  // Test 2: Create a sample enrollment
  console.log('\n2️⃣ Testing course enrollment...');
  const sampleEnrollment = {
    enrolledID: 'enrollment-' + Date.now(),
    userId: 'test-user-456',
    courseId: sampleCourse.coursesId,
    enrollmentDate: new Date().toISOString(),
    progressPercentage: 0,
    status: 'active',
    paymentStatus: 'free'
  };

  try {
    await dynamodb.put({
      TableName: 'course-enrolled-user',
      Item: sampleEnrollment
    }).promise();
    console.log('✅ Enrollment created successfully');
  } catch (error) {
    console.error('❌ Enrollment creation failed:', error.message);
    return;
  }

  // Test 3: Retrieve course data
  console.log('\n3️⃣ Testing course retrieval...');
  try {
    const courseResult = await dynamodb.get({
      TableName: 'staffinn-courses',
      Key: { coursesId: sampleCourse.coursesId }
    }).promise();

    if (courseResult.Item) {
      console.log('✅ Course retrieved successfully');
      console.log('📋 Course details:');
      console.log(`   - Name: ${courseResult.Item.courseName}`);
      console.log(`   - Duration: ${courseResult.Item.duration}`);
      console.log(`   - Modules: ${courseResult.Item.modules.length}`);
      console.log(`   - Total Content: ${courseResult.Item.modules.reduce((total, module) => total + module.content.length, 0)}`);
    } else {
      console.error('❌ Course not found');
    }
  } catch (error) {
    console.error('❌ Course retrieval failed:', error.message);
  }

  // Test 4: Retrieve enrollment data
  console.log('\n4️⃣ Testing enrollment retrieval...');
  try {
    const enrollmentResult = await dynamodb.get({
      TableName: 'course-enrolled-user',
      Key: { enrolledID: sampleEnrollment.enrolledID }
    }).promise();

    if (enrollmentResult.Item) {
      console.log('✅ Enrollment retrieved successfully');
      console.log('📋 Enrollment details:');
      console.log(`   - User ID: ${enrollmentResult.Item.userId}`);
      console.log(`   - Course ID: ${enrollmentResult.Item.courseId}`);
      console.log(`   - Status: ${enrollmentResult.Item.status}`);
      console.log(`   - Progress: ${enrollmentResult.Item.progressPercentage}%`);
    } else {
      console.error('❌ Enrollment not found');
    }
  } catch (error) {
    console.error('❌ Enrollment retrieval failed:', error.message);
  }

  // Test 5: Query enrollments by user
  console.log('\n5️⃣ Testing enrollment query by user...');
  try {
    const userEnrollments = await dynamodb.scan({
      TableName: 'course-enrolled-user',
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': sampleEnrollment.userId
      }
    }).promise();

    console.log(`✅ Found ${userEnrollments.Items.length} enrollments for user`);
  } catch (error) {
    console.error('❌ User enrollment query failed:', error.message);
  }

  // Test 6: Query courses by institute
  console.log('\n6️⃣ Testing course query by institute...');
  try {
    const instituteCourses = await dynamodb.scan({
      TableName: 'staffinn-courses',
      FilterExpression: 'instituteId = :instituteId AND isActive = :isActive',
      ExpressionAttributeValues: {
        ':instituteId': sampleCourse.instituteId,
        ':isActive': true
      }
    }).promise();

    console.log(`✅ Found ${instituteCourses.Items.length} active courses for institute`);
  } catch (error) {
    console.error('❌ Institute course query failed:', error.message);
  }

  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  try {
    await dynamodb.delete({
      TableName: 'staffinn-courses',
      Key: { coursesId: sampleCourse.coursesId }
    }).promise();

    await dynamodb.delete({
      TableName: 'course-enrolled-user',
      Key: { enrolledID: sampleEnrollment.enrolledID }
    }).promise();

    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }

  console.log('\n🎉 Course workflow test completed!');
};

// Run the test
testCourseWorkflow().catch(console.error);