/**
 * Script to find which institute owns the courses
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: 'AKIATRHVGXATJTN5DDP3',
    secretAccessKey: '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'
  }
});

const dynamoClient = DynamoDBDocumentClient.from(client);

async function findCourseOwners() {
  console.log('\n🔍 Finding course owners...\n');
  
  try {
    // Get all courses
    console.log('📚 Fetching all courses...');
    const coursesParams = {
      TableName: 'staffinn-institute-courses'
    };
    
    const coursesResult = await dynamoClient.send(new ScanCommand(coursesParams));
    const courses = coursesResult.Items || [];
    
    console.log(`Found ${courses.length} total courses in database\n`);
    
    if (courses.length === 0) {
      console.log('❌ No courses found in database!');
      return;
    }
    
    // Group courses by institute
    const coursesByInstitute = {};
    courses.forEach(course => {
      const instituteId = course.instituteId;
      if (!coursesByInstitute[instituteId]) {
        coursesByInstitute[instituteId] = [];
      }
      coursesByInstitute[instituteId].push(course);
    });
    
    console.log(`Found courses from ${Object.keys(coursesByInstitute).length} different institutes\n`);
    console.log('='.repeat(80));
    
    // Get institute details for each
    for (const instituteId of Object.keys(coursesByInstitute)) {
      console.log(`\n📍 Institute ID: ${instituteId}`);
      
      // Get institute user details
      const userParams = {
        TableName: 'staffinn-users',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': instituteId
        }
      };
      
      const userResult = await dynamoClient.send(new ScanCommand(userParams));
      const user = userResult.Items && userResult.Items.length > 0 ? userResult.Items[0] : null;
      
      if (user) {
        console.log(`   Institute Name: ${user.instituteName || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   User Type: ${user.userType || 'N/A'}`);
      } else {
        console.log(`   ⚠️ Institute user not found in users table`);
      }
      
      console.log(`   Total Courses: ${coursesByInstitute[instituteId].length}`);
      console.log(`\n   Courses:`);
      
      coursesByInstitute[instituteId].forEach((course, index) => {
        console.log(`   ${index + 1}. ${course.courseName || course.name}`);
        console.log(`      - Mode: ${course.mode}`);
        console.log(`      - Duration: ${course.duration}`);
        console.log(`      - Fees: ₹${course.fees}`);
        console.log(`      - Course ID: ${course.coursesId || course.instituteCourseID}`);
      });
      
      // Check enrollments for this institute
      const enrollmentsParams = {
        TableName: 'staffinn-institute-course-enrollments',
        FilterExpression: 'instituteId = :instituteId',
        ExpressionAttributeValues: {
          ':instituteId': instituteId
        }
      };
      
      const enrollmentsResult = await dynamoClient.send(new ScanCommand(enrollmentsParams));
      const enrollments = enrollmentsResult.Items || [];
      
      console.log(`\n   📝 Total Enrollments: ${enrollments.length}`);
      
      console.log('\n' + '-'.repeat(80));
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 IMPORTANT FINDINGS:');
    console.log('='.repeat(80));
    
    // Check if jecrc@gmail.com institute has courses
    const jecrcInstituteId = 'd98f25d6-f18b-4e30-b383-7b164ba7cb18';
    if (coursesByInstitute[jecrcInstituteId]) {
      console.log(`\n✅ jecrc@gmail.com institute (${jecrcInstituteId}) HAS courses!`);
      console.log(`   Total: ${coursesByInstitute[jecrcInstituteId].length} courses`);
    } else {
      console.log(`\n❌ jecrc@gmail.com institute (${jecrcInstituteId}) has NO courses!`);
      console.log(`\n💡 SOLUTION:`);
      console.log(`   The courses you see in production belong to a DIFFERENT institute account.`);
      console.log(`   You need to:`);
      console.log(`   1. Login with the CORRECT institute account that owns those courses`);
      console.log(`   2. OR create new courses with jecrc@gmail.com account`);
      console.log(`\n   Check above to see which institute owns the courses.`);
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Error details:', error.message);
  }
}

// Run the check
findCourseOwners().then(() => {
  console.log('\n✅ Check complete!\n');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
