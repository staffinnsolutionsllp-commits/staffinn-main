/**
 * Manual script to create staff admin
 */
require('dotenv').config();

const dynamoService = require('./services/dynamoService');
const bcrypt = require('bcryptjs');

const createStaffAdminManual = async () => {
  try {
    console.log('Creating staff admin manually...');
    
    const ADMIN_TABLE = process.env.ADMIN_TABLE || 'staffinn-admin';
    
    // Check if staff admin exists
    try {
      const existing = await dynamoService.getItem(ADMIN_TABLE, { adminId: 'staff_admin' });
      if (existing) {
        console.log('Staff admin already exists');
        return;
      }
    } catch (error) {
      console.log('Staff admin does not exist, creating...');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('staff123', 10);
    
    // Create staff admin
    const staffAdminData = {
      adminId: 'staff_admin',
      password: hashedPassword,
      role: 'staff',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await dynamoService.putItem(ADMIN_TABLE, staffAdminData);
    console.log('Staff admin created successfully!');
    
    console.log('\n=== STAFF ADMIN CREDENTIALS ===');
    console.log('ID: staff_admin');
    console.log('Password: staff123');
    console.log('Role: staff');
    console.log('===============================');
    
  } catch (error) {
    console.error('Error creating staff admin:', error);
  }
};

createStaffAdminManual();