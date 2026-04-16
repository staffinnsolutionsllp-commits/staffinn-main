/**
 * Debug script to check MIS Placement Tracking data
 * Run this to verify institute status and application data
 */

require('dotenv').config();
const userModel = require('./models/userModel');
const misStudentModel = require('./models/misStudentModel');
const misJobApplicationModel = require('./models/misJobApplicationModel');
const instituteStudentModel = require('./models/instituteStudentModel');
const jobApplicationModel = require('./models/jobApplicationModel');

async function debugMISPlacementTracking() {
  try {
    console.log('\n🔍 ========== MIS PLACEMENT TRACKING DEBUG ==========\n');
    
    // Get all institutes
    const allInstitutes = await userModel.getUsersByRole('institute');
    console.log(`📊 Total Institutes: ${allInstitutes.length}\n`);
    
    // Check each institute
    for (const institute of allInstitutes) {
      console.log(`\n🏫 Institute: ${institute.instituteName || 'Unknown'}`);
      console.log(`   ID: ${institute.userId}`);
      console.log(`   Email: ${institute.email}`);
      console.log(`   Institute Type: ${institute.instituteType || 'normal'}`);
      console.log(`   MIS Approved: ${institute.misApproved || false}`);
      console.log(`   MIS Approval Status: ${institute.misApprovalStatus || 'N/A'}`);
      
      const isMISInstitute = institute.misApproved === true || 
                            institute.misApproved === 'true' || 
                            institute.instituteType === 'staffinn_partner';
      
      console.log(`   ✅ Is MIS Institute: ${isMISInstitute}`);
      
      if (isMISInstitute) {
        // Get MIS students
        const misStudents = await misStudentModel.getStudentsByInstitute(institute.userId);
        console.log(`   👨‍🎓 MIS Students: ${misStudents.length}`);
        
        if (misStudents.length > 0) {
          console.log(`   📋 Sample MIS Student:`);
          console.log(`      - ID: ${misStudents[0].studentsId}`);
          console.log(`      - Name: ${misStudents[0].candidateName || misStudents[0].fatherName}`);
        }
        
        // Get MIS applications
        const misApplications = await misJobApplicationModel.getByInstitute(institute.userId);
        console.log(`   📝 MIS Applications: ${misApplications.length}`);
        
        if (misApplications.length > 0) {
          console.log(`   📋 Sample MIS Application:`);
          console.log(`      - Application ID: ${misApplications[0].misApplicationId}`);
          console.log(`      - Student ID: ${misApplications[0].studentId}`);
          console.log(`      - Job ID: ${misApplications[0].jobId}`);
          console.log(`      - Status: ${misApplications[0].status}`);
          
          // Check if student exists
          const studentExists = misStudents.find(s => s.studentsId === misApplications[0].studentId);
          console.log(`      - Student Found: ${!!studentExists}`);
        }
      } else {
        // Get regular students
        const regularStudents = await instituteStudentModel.getStudentsByInstitute(institute.userId);
        console.log(`   👨‍🎓 Regular Students: ${regularStudents.length}`);
        
        if (regularStudents.length > 0) {
          console.log(`   📋 Sample Regular Student:`);
          console.log(`      - ID: ${regularStudents[0].instituteStudntsID}`);
          console.log(`      - Name: ${regularStudents[0].fullName}`);
        }
        
        // Get regular applications
        const allApps = await jobApplicationModel.getAllApplications();
        const studentIds = regularStudents.map(s => s.instituteStudntsID);
        const regularApplications = allApps.filter(app => studentIds.includes(app.studentID));
        console.log(`   📝 Regular Applications: ${regularApplications.length}`);
        
        if (regularApplications.length > 0) {
          console.log(`   📋 Sample Regular Application:`);
          console.log(`      - Application ID: ${regularApplications[0].staffinnjob}`);
          console.log(`      - Student ID: ${regularApplications[0].studentID}`);
          console.log(`      - Job ID: ${regularApplications[0].jobID}`);
          console.log(`      - Status: ${regularApplications[0].status}`);
        }
      }
    }
    
    console.log('\n\n✅ ========== DEBUG COMPLETE ==========\n');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugMISPlacementTracking()
  .then(() => {
    console.log('Debug completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Debug failed:', error);
    process.exit(1);
  });
