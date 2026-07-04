/**
 * Migration Script for Job Applications
 * Populates the job applications table with existing application data
 */
const dynamoService = require('../services/dynamoService');
const { USERS_TABLE } = require('../config/dynamodb');
const jobApplicationModel = require('../models/jobApplicationModel');

const migrateJobApplications = async () => {
  try {
    console.log('Starting job applications migration...');
    
    // Get all institutes with applications
    const params = {
      FilterExpression: '#role = :role AND attribute_exists(applications)',
      ExpressionAttributeNames: {
        '#role': 'role'
      },
      ExpressionAttributeValues: {
        ':role': 'institute'
      }
    };
    
    const institutes = await dynamoService.scanItems(USERS_TABLE, params);
    console.log(`Found ${institutes.length} institutes with applications`);
    
    let totalApplications = 0;
    
    for (const institute of institutes) {
      const applications = institute.applications || [];
      
      for (const application of applications) {
        const studentsSnapshot = application.studentsSnapshot || [];
        
        // Create application records for each student in the snapshot
        for (const student of studentsSnapshot) {
          try {
            await jobApplicationModel.createJobApplication({
              studentID: student.instituteStudntsID,
              jobID: application.jobId,
              recruiterID: application.recruiterId,
              instituteID: institute.userId,
              status: 'pending'
            });
            totalApplications++;
          } catch (error) {
            // Skip if application already exists
            if (!error.message.includes('already exists')) {
              console.error(`Error creating application for student ${student.instituteStudntsID}:`, error.message);
            }
          }
        }
      }
    }
    
    console.log(`Migration completed. Created ${totalApplications} job application records.`);
    return { success: true, totalApplications };
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateJobApplications()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateJobApplications };