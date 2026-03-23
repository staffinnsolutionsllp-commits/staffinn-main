/**
 * Manual script to create staff admin
 */
require('dotenv').config();

const dynamoService = require('./services/dynamoService');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
    
    // Get password from environment variable or generate a secure random one
    const defaultPassword = process.env.STAFF_ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
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
    console.log('Password: [Check STAFF_ADMIN_PASSWORD in .env or use generated password]');
    console.log('Role: staff');
    console.log('===============================');
    
    // Only show password if it was generated (not from env)
    if (!process.env.STAFF_ADMIN_PASSWORD) {
      console.log('\n⚠️  IMPORTANT: Save this generated password securely!');
      console.log('Generated Password:', defaultPassword);
      console.log('\nAdd this to your .env file:');
      console.log(`STAFF_ADMIN_PASSWORD=${defaultPassword}`);
    }
    
  } catch (error) {
    console.error('Error creating staff admin:', error);
  }
};

createStaffAdminManual();