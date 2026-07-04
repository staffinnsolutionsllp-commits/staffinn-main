/**
 * Test script to verify recruiter campus invite creation
 */

require('dotenv').config();
const recruiterInviteModel = require('./models/recruiterCampusInviteModel');
const userModel = require('./models/userModel');

async function testRecruiterInvite() {
  console.log('🧪 Testing Recruiter Campus Invite Flow\n');

  try {
    // Test 1: Find a recruiter user
    console.log('1️⃣ Finding recruiter users...');
    const dynamoService = require('./services/dynamoService');
    const allUsers = await dynamoService.scanItems('staffinn-users');
    const recruiter = allUsers.find(u => u.role === 'recruiter');
    const institute = allUsers.find(u => u.role === 'institute');

    if (!recruiter) {
      console.log('❌ No recruiter found in database');
      return;
    }
    if (!institute) {
      console.log('❌ No institute found in database');
      return;
    }

    console.log('✅ Recruiter found:', recruiter.companyName || recruiter.email);
    console.log('✅ Institute found:', institute.instituteName || institute.email);

    // Test 2: Fetch users using userModel
    console.log('\n2️⃣ Fetching users using userModel.findUserById...');
    const recruiterData = await userModel.findUserById(recruiter.userId);
    const instituteData = await userModel.findUserById(institute.userId);

    console.log('Recruiter data:', JSON.stringify(recruiterData, null, 2));
    console.log('Institute data:', JSON.stringify(instituteData, null, 2));

    // Test 3: Create invite
    console.log('\n3️⃣ Creating test invite...');
    const formData = {
      selectedCourses: [{ id: 'test-course-1', name: 'Test Course' }],
      preferredDate: '2026-06-20',
      preferredTimeSlot: '10:00 AM – 1:00 PM',
      jobRoles: 'Software Engineer',
      numberOfVacancies: '10',
      salaryStipend: '₹5 LPA',
      eligibilityCriteria: '60%+ aggregate',
      selectionProcess: ['Aptitude Test', 'Technical Interview'],
      systemRequirement: 'Laptops required',
      internetRequirement: 'Wi-Fi',
      setupRequirement: 'Projector',
      otherInstructions: 'Test instructions'
    };

    const result = await recruiterInviteModel.createRecruiterInvite(
      recruiter.userId,
      institute.userId,
      recruiterData,
      instituteData,
      formData
    );

    if (result.success) {
      console.log('✅ Invite created successfully!');
      console.log('Invite ID:', result.data.inviteId);
      console.log('Status:', result.data.status);
      console.log('\nFull invite data:', JSON.stringify(result.data, null, 2));

      // Test 4: Retrieve invites
      console.log('\n4️⃣ Retrieving invites...');
      const recruiterInvites = await recruiterInviteModel.getInvitesByRecruiter(recruiter.userId);
      const instituteInvites = await recruiterInviteModel.getInvitesByInstitute(institute.userId);

      console.log(`✅ Recruiter has ${recruiterInvites.length} sent invites`);
      console.log(`✅ Institute has ${instituteInvites.length} received invites`);
    } else {
      console.log('❌ Failed to create invite');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRecruiterInvite()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
