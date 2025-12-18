/**
 * Script to create staff admin account
 */
require('dotenv').config();

const adminModel = require('./models/adminModel');

const createStaffAdmin = async () => {
  try {
    console.log('Creating staff admin account using AWS DynamoDB...');
    
    // Create master admin first
    const masterAdmin = await adminModel.initializeDefaultAdmin();
    console.log('Master admin created/exists:', masterAdmin.adminId);
    
    // Create staff admin
    const staffAdmin = await adminModel.createStaffAdmin();
    console.log('Staff admin created/exists:', staffAdmin.adminId);
    
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Master Admin:');
    console.log('  ID: admin');
    console.log('  Password: admin123');
    console.log('  Access: All sections');
    console.log('');
    console.log('Staff Admin:');
    console.log('  ID: staff_admin');
    console.log('  Password: staff123');
    console.log('  Access: Dashboard, Staff, Notifications, Issues, Government Schemes, Chats');
    console.log('========================');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating staff admin:', error);
    process.exit(1);
  }
};

createStaffAdmin();