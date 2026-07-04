/**
 * Initialize Admin Script
 * Creates the admin table and sets up default admin user
 */

require('dotenv').config();
const adminModel = require('../models/adminModel');

const initializeAdmin = async () => {
  try {
    console.log('🔧 Initializing Master Admin...');
    
    // Initialize default admin
    const admin = await adminModel.initializeDefaultAdmin();
    
    console.log('✅ Admin initialized successfully!');
    console.log('📋 Admin Details:');
    console.log('   Admin ID: admin');
    console.log('   Default Password: admin123');
    console.log('⚠️  Please change the default password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initializeAdmin();
}

module.exports = { initializeAdmin };