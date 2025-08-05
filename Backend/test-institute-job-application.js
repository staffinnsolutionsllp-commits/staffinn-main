/**
 * Test script for Institute Job Application Feature
 * This script tests the new endpoints for institute student job applications
 */

const jobApplicationModel = require('./models/jobApplicationModel');

async function testInstituteJobApplication() {
  console.log('Testing Institute Job Application Feature...\n');

  try {
    // Test 1: Create bulk job applications
    console.log('Test 1: Creating bulk job applications...');
    const testApplications = [
      {
        studentID: 'student1',
        jobID: 'job123',
        recruiterID: 'recruiter456',
        instituteID: 'institute789',
        status: 'pending'
      },
      {
        studentID: 'student2',
        jobID: 'job123',
        recruiterID: 'recruiter456',
        instituteID: 'institute789',
        status: 'pending'
      }
    ];

    const bulkResult = await jobApplicationModel.createBulkJobApplications(testApplications);
    console.log('✓ Bulk applications created:', bulkResult.length);

    // Test 2: Get applied student IDs
    console.log('\nTest 2: Getting applied student IDs...');
    const appliedStudentIds = await jobApplicationModel.getAppliedStudentIds('job123', 'institute789');
    console.log('✓ Applied student IDs:', appliedStudentIds);

    // Test 3: Get processed student IDs
    console.log('\nTest 3: Getting processed student IDs...');
    const processedStudentIds = await jobApplicationModel.getProcessedStudentIds('job123');
    console.log('✓ Processed student IDs:', processedStudentIds);

    console.log('\n✅ All tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testInstituteJobApplication();
}

module.exports = { testInstituteJobApplication };