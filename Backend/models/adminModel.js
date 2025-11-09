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
 * @param {string} defaultPassword - Default password
 * @returns {Promise<object>} - Created admin
 */
const initializeDefaultAdmin = async (adminId = 'admin', defaultPassword = 'admin123') => {
  try {
    // Check if admin already exists
    const existingAdmin = await getAdminById(adminId);
    if (existingAdmin) {
      return existingAdmin;
    }
    
    // Hash the default password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
    
    const adminData = {
      adminId,
      password: hashedPassword,
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

module.exports = {
  getAdminById,
  verifyAdminPassword,
  updateAdminPassword,
  initializeDefaultAdmin
};