/**
 * Script to create recruiter admin account
 */
require('dotenv').config();

const adminModel = require('./models/adminModel');

const createRecruiterAdmin = async () => {
  try {
    console.log('Creating recruiter admin account using AWS DynamoDB...');
    
    // Create recruiter admin
    const recruiterAdmin = await adminModel.createRecruiterAdmin();
    console.log('Recruiter admin created/exists:', recruiterAdmin.adminId);
    
    console.log('\n=== RECRUITER ADMIN CREDENTIALS ===');
    console.log('ID: recruiter_admin');
    console.log('Password: recruiter123');
    console.log('Access: Dashboard, Recruiter, Notifications, Issues, Government Schemes, Registration Requests (Recruiter only), Manual Registration (Recruiter only)');
    console.log('===================================');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating recruiter admin:', error);
    process.exit(1);
  }
};

createRecruiterAdmin();