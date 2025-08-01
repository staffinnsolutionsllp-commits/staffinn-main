/**
 * User Model
 * Handles user operations with DynamoDB
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');
const dynamoHelper = require('../utils/dynamoHelper');

// Get table name from environment variables
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;

/**
 * Create a new user
 * @param {object} userData - User data
 * @returns {Promise<object>} - Created user object
 */
const createUser = async (userData) => {
  try {
    // Check if user with email already exists
    const existingUser = await findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Generate userId
    const userId = uuidv4();
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Create user object with only registration form fields based on role
    let user = {
      userId,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      role: userData.role.toLowerCase(),
      createdAt: new Date().toISOString()
    };
    
    // Add role-specific fields based on registration form
    if (userData.role.toLowerCase() === 'staff') {
      user.fullName = userData.fullName || userData.name;
      user.phoneNumber = userData.phoneNumber || userData.phone || null;
    } else if (userData.role.toLowerCase() === 'recruiter') {
      user.companyName = userData.companyName || userData.name;
      user.phoneNumber = userData.phoneNumber || userData.phone || null;
      user.website = userData.website || null;
    } else if (userData.role.toLowerCase() === 'institute') {
      user.instituteName = userData.instituteName || userData.name;
      user.phoneNumber = userData.phoneNumber || userData.phone || null;
      user.registrationNumber = userData.registrationNumber || null;
    }
    
    // Remove any extra fields that might have been passed
    const allowedFields = ['userId', 'email', 'password', 'role', 'createdAt'];
    if (user.role === 'staff') {
      allowedFields.push('fullName', 'phoneNumber');
    } else if (user.role === 'recruiter') {
      allowedFields.push('companyName', 'phoneNumber', 'website');
    } else if (user.role === 'institute') {
      allowedFields.push('instituteName', 'phoneNumber', 'registrationNumber');
    }
    
    // Filter user object to only include allowed fields
    const cleanUser = {};
    allowedFields.forEach(field => {
      if (user.hasOwnProperty(field)) {
        cleanUser[field] = user[field];
      }
    });
    
    // Save clean user to DynamoDB
    await dynamoService.putItem(USERS_TABLE, cleanUser);
    
    // Return clean user without password
    const { password, ...userWithoutPassword } = cleanUser;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} - User object or null
 */
const findUserByEmail = async (email) => {
  try {
    const params = {
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase()
      }
    };
    
    const users = await dynamoService.scanItems(USERS_TABLE, params);
    if (users.length > 0) {
      const user = users[0];
      // Return only registration form fields based on role
      let cleanUser = {
        userId: user.userId,
        email: user.email,
        password: user.password, // Keep for authentication
        role: user.role,
        createdAt: user.createdAt
      };
      
      // Add role-specific fields
      if (user.role === 'staff') {
        cleanUser.fullName = user.fullName || user.name;
        cleanUser.phoneNumber = user.phoneNumber || user.phone;
      } else if (user.role === 'recruiter') {
        cleanUser.companyName = user.companyName || user.name;
        cleanUser.phoneNumber = user.phoneNumber || user.phone;
        cleanUser.website = user.website;
      } else if (user.role === 'institute') {
        cleanUser.instituteName = user.instituteName || user.name;
        cleanUser.phoneNumber = user.phoneNumber || user.phone;
        cleanUser.registrationNumber = user.registrationNumber;
      }
      
      return cleanUser;
    }
    return null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
};

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} - User object or null
 */
const findUserById = async (userId) => {
  try {
    const user = await dynamoService.getItem(USERS_TABLE, { userId });
    
    if (!user) {
      return null;
    }
    
    // Return only registration form fields based on role
    let cleanUser = {
      userId: user.userId,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
    
    // Add role-specific fields
    if (user.role === 'staff') {
      cleanUser.fullName = user.fullName || user.name;
      cleanUser.phoneNumber = user.phoneNumber || user.phone;
    } else if (user.role === 'recruiter') {
      cleanUser.companyName = user.companyName || user.name;
      cleanUser.phoneNumber = user.phoneNumber || user.phone;
      cleanUser.website = user.website;
    } else if (user.role === 'institute') {
      cleanUser.instituteName = user.instituteName || user.name;
      cleanUser.phoneNumber = user.phoneNumber || user.phone;
      cleanUser.registrationNumber = user.registrationNumber;
    }
    
    return cleanUser;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return null;
  }
};

/**
 * Authenticate user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object|null>} - User object or null
 */
const authenticateUser = async (email, password) => {
  try {
    // Find user by email
    const user = await findUserByEmail(email);
    
    if (!user) {
      return null;
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return null;
    }
    
    // Return user without password, only registration form fields
    let cleanUser = {
      userId: user.userId,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
    
    // Add role-specific fields
    if (user.role === 'staff') {
      cleanUser.fullName = user.fullName;
      cleanUser.phoneNumber = user.phoneNumber;
    } else if (user.role === 'recruiter') {
      cleanUser.companyName = user.companyName;
      cleanUser.phoneNumber = user.phoneNumber;
      cleanUser.website = user.website;
    } else if (user.role === 'institute') {
      cleanUser.instituteName = user.instituteName;
      cleanUser.phoneNumber = user.phoneNumber;
      cleanUser.registrationNumber = user.registrationNumber;
    }
    
    return cleanUser;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
};

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} - Success status
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Get user by ID
    const user = await dynamoService.getItem(USERS_TABLE, { userId });
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return { success: false, message: 'Current password is incorrect' };
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password in database
    await dynamoService.updateItem(
      USERS_TABLE,
      { userId },
      {
        UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':password': hashedPassword,
          ':updatedAt': new Date().toISOString()
        }
      }
    );
    
    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, message: 'Failed to change password' };
  }
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  authenticateUser,
  changePassword
};