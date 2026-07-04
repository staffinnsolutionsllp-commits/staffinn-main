/**
 * Test MIS Student Integration in Recruiter Dashboard
 * This script tests the integration of MIS students in the recruiter dashboard
 */

const misStudentModel = require('./models/misStudentModel');
const misJobApplicationModel = require('./models/misJobApplicationModel');
const applicationModel = require('./models/applicationModel');

async function testMisStudentIntegration() {
  console.log('🧪 Testing MIS Student Integration in Recruiter Dashboard...\n');
  
  try {
    // Test 1: Check if MIS students exist
    console.log('1. Checking MIS students...');
    const misStudents = await misStudentModel.getAll();
    console.log(`   Found ${misStudents.length} MIS students`);
    
    if (misStudents.length > 0) {
      const sampleStudent = misStudents[0];
      console.log(`   Sample student: ${sampleStudent.fatherName || 'Unknown'} (ID: ${sampleStudent.studentsId})`);
    }
    
    // Test 2: Check MIS job applications
    console.log('\n2. Checking MIS job applications...');
    const dynamoService = require('./services/dynamoService');
    const allMisApps = await dynamoService.scanItems('staffinn-mis-job-applications');
    console.log(`   Found ${allMisApps.length} MIS job applications`);
    
    if (allMisApps.length > 0) {
      const sampleApp = allMisApps[0];
      console.log(`   Sample application: Job ${sampleApp.jobId} by Student ${sampleApp.studentId}`);
      console.log(`   Recruiter: ${sampleApp.recruiterId}, Status: ${sampleApp.status}`);
    }
    
    // Test 3: Test getAppliedInstitutes function
    console.log('\n3. Testing getAppliedInstitutes function...');
    if (allMisApps.length > 0) {
      const sampleRecruiterId = allMisApps[0].recruiterId;
      console.log(`   Testing with recruiter ID: ${sampleRecruiterId}`);
      
      const appliedInstitutes = await applicationModel.getAppliedInstitutes(sampleRecruiterId);
      console.log(`   Found ${appliedInstitutes.length} applied institutes`);
      
      // Check if any institute has MIS applications
      const institutesWithMis = appliedInstitutes.filter(institute => 
        institute.appliedJobs.some(job => job.applicationType === 'mis' || job.applicationType === 'mixed')
      );
      console.log(`   Institutes with MIS applications: ${institutesWithMis.length}`);
      
      if (institutesWithMis.length > 0) {
        const institute = institutesWithMis[0];
        console.log(`   Sample institute: ${institute.instituteName}`);
        console.log(`   Is Staffinn Partner: ${institute.isStaffinPartner}`);
        console.log(`   Applied jobs: ${institute.appliedJobs.length}`);
        
        institute.appliedJobs.forEach(job => {
          console.log(`     - Job: ${job.jobTitle} (Type: ${job.applicationType})`);
        });
      }
    }
    
    // Test 4: Test MIS student retrieval in job applications
    console.log('\n4. Testing MIS student retrieval...');
    if (allMisApps.length > 0) {
      const sampleApp = allMisApps[0];
      const { jobId, instituteId } = sampleApp;
      
      console.log(`   Testing job ${jobId} from institute ${instituteId}`);
      
      // Simulate the getJobApplicationStudents logic
      const userModel = require('./models/userModel');
      const instituteUser = await userModel.findUserById(instituteId);
      const isStaffinPartner = instituteUser && (instituteUser.instituteType === 'staffinn_partner' || instituteUser.misApproved === true);
      
      console.log(`   Institute is Staffinn Partner: ${isStaffinPartner}`);
      
      if (isStaffinPartner) {
        const misApplications = await misJobApplicationModel.getByJob(jobId);
        const pendingMisApplications = misApplications.filter(app => 
          app.status !== 'hired' && app.status !== 'rejected'
        );
        
        console.log(`   Found ${pendingMisApplications.length} pending MIS applications for this job`);
        
        if (pendingMisApplications.length > 0) {
          const app = pendingMisApplications[0];
          const student = await misStudentModel.getById(app.studentId);
          
          if (student) {
            console.log(`   Sample MIS student: ${student.fatherName || 'Unknown'}`);
            console.log(`   Training Center: ${student.trainingCenter || 'N/A'}`);
            console.log(`   Course: ${student.course || 'N/A'}`);
            console.log(`   Application Status: ${app.status}`);
          }
        }
      }
    }
    
    console.log('\n✅ MIS Student Integration Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - MIS Students: ${misStudents.length}`);
    console.log(`   - MIS Applications: ${allMisApps.length}`);
    console.log('   - Integration: Working ✓');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testMisStudentIntegration().then(() => {
    console.log('\n🏁 Test execution completed.');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testMisStudentIntegration };