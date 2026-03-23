/**
 * Admin Model
 * Handles admin authentication and management
 */
const dynamoService = require('../services/dynamoService');
const bcrypt = require('bcryptjs');

const ADMIN_TABLE = process.env.ADMIN_TABLE || 'staffinn-admin';

/**
 * Get admin by ID
 * @param {string} adminId - Admin ID
 * @returns {Promise<object|null>} - Admin data or null
 */
const getAdminById = async (adminId) => {
  try {
    const admin = await dynamoService.getItem(ADMIN_TABLE, { adminId });
    return admin;
  } catch (error) {
    console.error('Get admin by ID error:', error);
    throw new Error('Failed to get admin');
  }
};

/**
 * Verify admin password
 * @param {string} adminId - Admin ID
 * @param {string} password - Password to verify
 * @returns {Promise<boolean>} - Verification result
 */
const verifyAdminPassword = async (adminId, password) => {
  try {
    const admin = await getAdminById(adminId);
    if (!admin) {
      return false;
    }
    
    // Compare password with hashed password
    const isValid = await bcrypt.compare(password, admin.password);
    return isValid;
  } catch (error) {
    console.error('Verify admin password error:', error);
    return false;
  }
};

/**
 * Update admin password
 * @param {string} adminId - Admin ID
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} - Update result
 */
const updateAdminPassword = async (adminId, newPassword) => {
  try {
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    const updateParams = {
      UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':password': hashedPassword,
        ':updatedAt': new Date().toISOString()
      }
    };
    
    await dynamoService.updateItem(ADMIN_TABLE, { adminId }, updateParams);
    return true;
  } catch (error) {
    console.error('Update admin password error:', error);
    throw new Error('Failed to update admin password');
  }
};

/**
 * Initialize default admin (run once)
 * @param {string} adminId - Admin ID
 * @param {string} defaultPassword - Default password (should be provided via environment variable)
 * @param {string} role - Admin role
 * @returns {Promise<object>} - Created admin
 */
const initializeDefaultAdmin = async (adminId = 'admin', defaultPassword = null, role = 'admin') => {
  try {
    // SECURITY FIX (CWE-798, CWE-259): Use environment variable instead of hardcoded password
    const password = defaultPassword || process.env.DEFAULT_ADMIN_PASSWORD;
    
    if (!password) {
      throw new Error('Admin password must be provided via DEFAULT_ADMIN_PASSWORD environment variable');
    }
    
    // Check if admin already exists
    const existingAdmin = await getAdminById(adminId);
    if (existingAdmin) {
      return existingAdmin;
    }
    
    // Hash the default password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const adminData = {
      adminId,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await dynamoService.putItem(ADMIN_TABLE, adminData);
    return adminData;
  } catch (error) {
    console.error('Initialize default admin error:', error);
    throw new Error('Failed to initialize default admin');
  }
};

/**
 * Create staff admin
 * @returns {Promise<object>} - Created staff admin
 */
const createStaffAdmin = async () => {
  try {
    // SECURITY FIX (CWE-798, CWE-259): Use environment variables for credentials
    const staffAdminId = process.env.STAFF_ADMIN_ID || 'staff_admin';
    const staffPassword = process.env.STAFF_ADMIN_PASSWORD;
    
    if (!staffPassword) {
      throw new Error('Staff admin password must be provided via STAFF_ADMIN_PASSWORD environment variable');
    }
    
    // Check if staff admin already exists
    const existingStaffAdmin = await getAdminById(staffAdminId);
    if (existingStaffAdmin) {
      return existingStaffAdmin;
    }
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(staffPassword, saltRounds);
    
    const staffAdminData = {
      adminId: staffAdminId,
      password: hashedPassword,
      role: 'staff',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await dynamoService.putItem(ADMIN_TABLE, staffAdminData);
    return staffAdminData;
  } catch (error) {
    console.error('Create staff admin error:', error);
    throw new Error('Failed to create staff admin');
  }
};

/**
 * Create recruiter admin
 * @returns {Promise<object>} - Created recruiter admin
 */
const createRecruiterAdmin = async () => {
  try {
    // SECURITY FIX (CWE-798, CWE-259): Use environment variables for credentials
    const recruiterAdminId = process.env.RECRUITER_ADMIN_ID || 'recruiter_admin';
    const recruiterPassword = process.env.RECRUITER_ADMIN_PASSWORD;
    
    if (!recruiterPassword) {
      throw new Error('Recruiter admin password must be provided via RECRUITER_ADMIN_PASSWORD environment variable');
    }
    
    // Check if recruiter admin already exists
    const existingRecruiterAdmin = await getAdminById(recruiterAdminId);
    if (existingRecruiterAdmin) {
      return existingRecruiterAdmin;
    }
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(recruiterPassword, saltRounds);
    
    const recruiterAdminData = {
      adminId: recruiterAdminId,
      password: hashedPassword,
      role: 'recruiter',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await dynamoService.putItem(ADMIN_TABLE, recruiterAdminData);
    return recruiterAdminData;
  } catch (error) {
    console.error('Create recruiter admin error:', error);
    throw new Error('Failed to create recruiter admin');
  }
};

/**
 * Create institute admin
 * @returns {Promise<object>} - Created institute admin
 */
const createInstituteAdmin = async () => {
  try {
    // SECURITY FIX (CWE-798, CWE-259): Use environment variables for credentials
    const instituteAdminId = process.env.INSTITUTE_ADMIN_ID || 'institute_admin';
    const institutePassword = process.env.INSTITUTE_ADMIN_PASSWORD;
    
    if (!institutePassword) {
      throw new Error('Institute admin password must be provided via INSTITUTE_ADMIN_PASSWORD environment variable');
    }
    
    // Check if institute admin already exists
    const existingInstituteAdmin = await getAdminById(instituteAdminId);
    if (existingInstituteAdmin) {
      return existingInstituteAdmin;
    }
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(institutePassword, saltRounds);
    
    const instituteAdminData = {
      adminId: instituteAdminId,
      password: hashedPassword,
      role: 'institute',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await dynamoService.putItem(ADMIN_TABLE, instituteAdminData);
    return instituteAdminData;
  } catch (error) {
    console.error('Create institute admin error:', error);
    throw new Error('Failed to create institute admin');
  }
};

module.exports = {
  getAdminById,
  verifyAdminPassword,
  updateAdminPassword,
  initializeDefaultAdmin,
  createStaffAdmin,
  createRecruiterAdmin,
  createInstituteAdmin
};