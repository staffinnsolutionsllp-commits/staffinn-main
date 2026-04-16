/**
 * Script to check enrollment data for jecrc@gmail.com institute
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIATRHVGXATJTN5DDP3',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '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'
  }
});

const dynamoClient = DynamoDBDocumentClient.from(client);

async function checkData() {
  console.log('\n🔍 Checking data for jecrc@gmail.com institute...\n');
  
  try {
    // Step 1: Find institute user by email
    console.log('📧 Step 1: Finding institute by email...');
    const usersParams = {
      TableName: 'staffinn-users',
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': 'jecrc@gmail.com'
      }
    };
    
    const usersResult = await dynamoClient.send(new ScanCommand(usersParams));
    
    if (!usersResult.Items || usersResult.Items.length === 0) {
      console.log('❌ No user found with email: jecrc@gmail.com');
      return;
    }
    
    const instituteUser = usersResult.Items[0];
    console.log('✅ Institute found!');
    console.log('   User ID:', instituteUser.userId);
    console.log('   Institute Name:', instituteUser.instituteName);
    console.log('   User Type:', instituteUser.userType);
    console.log('   Institute Type:', instituteUser.instituteType);
    
    const instituteId = instituteUser.userId;
    
    // Step 2: Check courses
    console.log('\n📚 Step 2: Checking courses...');
    const coursesParams = {
      TableName: 'staffinn-institute-courses',
      FilterExpression: 'instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': instituteId
      }
    };
    
    const coursesResult = await dynamoClient.send(new ScanCommand(coursesParams));
    const courses = coursesResult.Items || [];
    
    console.log(`   Found ${courses.length} courses`);
    
    if (courses.length === 0) {
      console.log('   ⚠️ No courses found for this institute!');
      console.log('   💡 You need to create courses first in Course Management');
      return;
    }
    
    courses.forEach((course, index) => {
      console.log(`\n   Course ${index + 1}:`);
      console.log(`   - ID: ${course.coursesId || course.instituteCourseID}`);
      console.log(`   - Name: ${course.courseName || course.name}`);
      console.log(`   - Mode: ${course.mode}`);
      console.log(`   - Duration: ${course.duration}`);
      console.log(`   - Fees: ${course.fees}`);
    });
    
    // Step 3: Check enrollments
    console.log('\n📝 Step 3: Checking enrollments...');
    const enrollmentsParams = {
      TableName: 'staffinn-institute-course-enrollments',
      FilterExpression: 'instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': instituteId
      }
    };
    
    const enrollmentsResult = await dynamoClient.send(new ScanCommand(enrollmentsParams));
    const enrollments = enrollmentsResult.Items || [];
    
    console.log(`   Found ${enrollments.length} enrollments`);
    
    if (enrollments.length === 0) {
      console.log('   ⚠️ No enrollments found!');
      console.log('   💡 You need to enroll students in courses first');
      console.log('   💡 Go to: Course Enrollment section (not Admission Tracking)');
    } else {
      // Group enrollments by course
      const enrollmentsByCourse = {};
      enrollments.forEach(enrollment => {
        const courseId = enrollment.coursesId;
        if (!enrollmentsByCourse[courseId]) {
          enrollmentsByCourse[courseId] = [];
        }
        enrollmentsByCourse[courseId].push(enrollment);
      });
      
      console.log('\n   Enrollments by course:');
      Object.keys(enrollmentsByCourse).forEach(courseId => {
        const course = courses.find(c => (c.coursesId || c.instituteCourseID) === courseId);
        const courseName = course ? (course.courseName || course.name) : 'Unknown Course';
        console.log(`\n   📚 ${courseName} (${courseId})`);
        console.log(`      Total enrollments: ${enrollmentsByCourse[courseId].length}`);
        
        enrollmentsByCourse[courseId].forEach((enrollment, idx) => {
          console.log(`      ${idx + 1}. Student ID: ${enrollment.studentsId}`);
          console.log(`         Enrollment Date: ${enrollment.enrollmentDate}`);
          console.log(`         Status: ${enrollment.status}`);
        });
      });
    }
    
    // Step 4: Check students
    console.log('\n👥 Step 4: Checking students...');
    const studentsParams = {
      TableName: 'staffinn-institute-students',
      FilterExpression: 'instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': instituteId
      }
    };
    
    const studentsResult = await dynamoClient.send(new ScanCommand(studentsParams));
    const students = studentsResult.Items || [];
    
    console.log(`   Found ${students.length} students`);
    
    if (students.length === 0) {
      console.log('   ⚠️ No students found!');
      console.log('   💡 You need to add students first in Student Management');
    } else {
      console.log('\n   Students:');
      students.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.fullName || student.studentName || student.name}`);
        console.log(`      ID: ${student.instituteStudntsID || student.studentsId}`);
        console.log(`      Email: ${student.email}`);
      });
    }
    
    // Step 5: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Institute ID: ${instituteId}`);
    console.log(`Institute Name: ${instituteUser.instituteName}`);
    console.log(`Total Courses: ${courses.length}`);
    console.log(`Total Students: ${students.length}`);
    console.log(`Total Enrollments: ${enrollments.length}`);
    
    if (courses.length === 0) {
      console.log('\n❌ ISSUE: No courses found!');
      console.log('   ACTION: Create courses in Course Management section');
    } else if (students.length === 0) {
      console.log('\n❌ ISSUE: No students found!');
      console.log('   ACTION: Add students in Student Management section');
    } else if (enrollments.length === 0) {
      console.log('\n❌ ISSUE: No enrollments found!');
      console.log('   ACTION: Enroll students in courses');
      console.log('   Go to: My Dashboard → My Courses → Course Enrollment');
      console.log('   (NOT Admission Tracking - that only shows existing enrollments)');
    } else {
      console.log('\n✅ Data exists! Admission Tracking should show data.');
      console.log('   If not showing, check:');
      console.log('   1. Backend server is running');
      console.log('   2. Browser cache is cleared (Ctrl+Shift+R)');
      console.log('   3. Check browser console for errors (F12)');
      console.log('   4. Check Network tab for API responses');
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error checking data:', error);
    console.error('Error details:', error.message);
    console.error('\nMake sure:');
    console.error('1. DynamoDB is running (http://localhost:8000)');
    console.error('2. Tables exist in DynamoDB');
    console.error('3. AWS credentials are configured');
  }
}

// Run the check
checkData().then(() => {
  console.log('\n✅ Check complete!\n');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
