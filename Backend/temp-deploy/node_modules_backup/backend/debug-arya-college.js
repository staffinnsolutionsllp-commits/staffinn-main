/**
 * Debug script to check Arya college's application data
 */

require('dotenv').config();
const jobApplicationModel = require('./models/jobApplicationModel');
const misJobApplicationModel = require('./models/misJobApplicationModel');
const instituteStudentModel = require('./models/instituteStudentModel');
const misStudentModel = require('./models/misStudentModel');

const ARYA_COLLEGE_ID = 'd34eedde-d48e-4d62-bf33-f4d2bd5d1cb4';

async function debugAryaCollege() {
  try {
    console.log('\n🔍 ========== ARYA COLLEGE DEBUG ==========\n');
    
    // Get regular students
    const regularStudents = await instituteStudentModel.getStudentsByInstitute(ARYA_COLLEGE_ID);
    console.log(`👨🎓 Regular Students: ${regularStudents.length}`);
    regularStudents.forEach(s => {
      console.log(`   - ${s.fullName} (ID: ${s.instituteStudntsID})`);
    });
    
    // Get MIS students
    const misStudents = await misStudentModel.getStudentsByInstitute(ARYA_COLLEGE_ID);
    console.log(`\n👨🎓 MIS Students: ${misStudents.length}`);
    misStudents.forEach(s => {
      console.log(`   - ${s.candidateName || s.fatherName} (ID: ${s.studentsId})`);
    });
    
    // Get regular applications
    const allRegularApps = await jobApplicationModel.getAllApplications();
    const regularStudentIds = regularStudents.map(s => s.instituteStudntsID);
    const regularApps = allRegularApps.filter(app => regularStudentIds.includes(app.studentID));
    console.log(`\n📝 Regular Applications: ${regularApps.length}`);
    regularApps.forEach(app => {
      const student = regularStudents.find(s => s.instituteStudntsID === app.studentID);
      console.log(`   - ${student?.fullName || 'Unknown'} applied to job ${app.jobID} (Status: ${app.status})`);
    });
    
    // Get MIS applications
    const misApps = await misJobApplicationModel.getByInstitute(ARYA_COLLEGE_ID);
    console.log(`\n📝 MIS Applications: ${misApps.length}`);
    misApps.forEach(app => {
      const student = misStudents.find(s => s.studentsId === app.studentId);
      console.log(`   - ${student?.candidateName || student?.fatherName || 'Unknown'} applied to job ${app.jobId} (Status: ${app.status})`);
    });
    
    console.log('\n\n✅ ========== DEBUG COMPLETE ==========\n');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugAryaCollege()
  .then(() => {
    console.log('Debug completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Debug failed:', error);
    process.exit(1);
  });
