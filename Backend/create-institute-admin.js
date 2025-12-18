/**
 * Script to create institute admin account
 */
require('dotenv').config();

const adminModel = require('./models/adminModel');

const createInstituteAdmin = async () => {
  try {
    console.log('Creating institute admin account using AWS DynamoDB...');
    
    // Create institute admin
    const instituteAdmin = await adminModel.createInstituteAdmin();
    console.log('Institute admin created/exists:', instituteAdmin.adminId);
    
    console.log('\n=== INSTITUTE ADMIN CREDENTIALS ===');
    console.log('ID: institute_admin');
    console.log('Password: institute123');
    console.log('Access: Dashboard, Institute, Notifications, Issues, Government Schemes, Registration Requests (Institute only), Manual Registration (Institute only), MIS Requests');
    console.log('===================================');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating institute admin:', error);
    process.exit(1);
  }
};

createInstituteAdmin();