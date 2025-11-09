/**
 * Staff Model
 * Handles all staff-related database operations
 */
const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const STAFF_TABLE = process.env.STAFF_TABLE || 'staffinn-staff-profiles';

/**
 * Create a new staff profile
 * @param {object} staffData - Staff profile data
 * @returns {Promise<object>} - Created staff profile
 */
const createStaffProfile = async (staffData) => {
  try {
    const staffId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const staffProfile = {
      staffId,
      ...staffData,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await dynamoService.putItem(STAFF_TABLE, staffProfile);
    return staffProfile;
  } catch (error) {
    console.error('Create staff profile error:', error);
    throw new Error('Failed to create staff profile');
  }
};

/**
 * Get staff profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} - Staff profile or null
 */
const getStaffProfile = async (userId) => {
  try {
    console.log('Searching for staff profile with userId:', userId);
    
    const scanParams = {
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };
    
    const profiles = await dynamoService.scanItems(STAFF_TABLE, scanParams);
    console.log('Found profiles:', profiles.length);
    
    if (profiles.length > 0) {
      const profile = profiles[0];
      console.log('Retrieved profile isActiveStaff status:', profile.isActiveStaff);
      
      if (profile.isActiveStaff === undefined || profile.isActiveStaff === null) {
        profile.isActiveStaff = false;
      }
      
      // Get user data to ensure profile has latest registration info
      const userModel = require('./userModel');
      const userData = await userModel.findUserById(userId);
      
      if (userData) {
        // Merge user registration data with profile data
        profile.fullName = profile.fullName || userData.fullName;
        profile.email = profile.email || userData.email;
        profile.phone = profile.phone || userData.phoneNumber;
      }
      
      return profile;
    }
    
    console.log('No staff profile found for userId:', userId);
    return null;
  } catch (error) {
    console.error('Get staff profile error:', error);
    throw new Error('Failed to get staff profile');
  }
};

/**
 * Update staff profile
 * @param {string} userId - User ID
 * @param {object} updateData - Data to update
 * @returns {Promise<object>} - Updated staff profile
 */
const updateStaffProfile = async (userId, updateData) => {
  try {
    // First get the current profile to find the staffId
    const currentProfile = await getStaffProfile(userId);
    
    if (!currentProfile) {
      throw new Error('Staff profile not found');
    }
    
    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    Object.keys(updateData).forEach((key, index) => {
      const attributeName = `#attr${index}`;
      const attributeValue = `:val${index}`;
      
      updateExpressions.push(`${attributeName} = ${attributeValue}`);
      expressionAttributeNames[attributeName] = key;
      expressionAttributeValues[attributeValue] = updateData[key];
    });
    
    const updateParams = {
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    };
    
    await dynamoService.updateItem(
      STAFF_TABLE,
      { staffId: currentProfile.staffId },
      updateParams
    );
    
    // Return the updated profile by fetching it again
    return await getStaffProfile(userId);
  } catch (error) {
    console.error('Update staff profile error:', error);
    throw new Error('Failed to update staff profile');
  }
};

/**
 * Get all active staff profiles (for public display)
 * @returns {Promise<Array>} - Array of active staff profiles
 */
const getActiveStaffProfiles = async () => {
  try {
    const scanParams = {
      FilterExpression: 'isActiveStaff = :isActive AND profileVisibility = :visibility',
      ExpressionAttributeValues: {
        ':isActive': true,
        ':visibility': 'public'
      }
    };
    
    const profiles = await dynamoService.scanItems(STAFF_TABLE, scanParams);
    
    // Filter out blocked users by checking user table
    const userModel = require('./userModel');
    const filteredProfiles = [];
    
    for (const profile of profiles) {
      try {
        const user = await userModel.findUserById(profile.userId);
        // Only include if user exists and is not blocked
        if (user && !user.isBlocked) {
          filteredProfiles.push(profile);
        }
      } catch (error) {
        console.error('Error checking user block status:', error);
        // If error checking user, exclude from results for safety
      }
    }
    
    // Sort by updated date (most recent first)
    return filteredProfiles.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (error) {
    console.error('Get active staff profiles error:', error);
    throw new Error('Failed to get active staff profiles');
  }
};

/**
 * Get trending staff profiles based on profile views (for public display)
 * @param {number} limit - Number of profiles to return
 * @returns {Promise<Array>} - Array of trending staff profiles
 */
const getTrendingStaffProfiles = async (limit = 6) => {
  try {
    const scanParams = {
      FilterExpression: 'isActiveStaff = :isActive AND profileVisibility = :visibility',
      ExpressionAttributeValues: {
        ':isActive': true,
        ':visibility': 'public'
      }
    };
    
    const profiles = await dynamoService.scanItems(STAFF_TABLE, scanParams);
    
    // Filter out blocked users by checking user table
    const userModel = require('./userModel');
    const filteredProfiles = [];
    
    for (const profile of profiles) {
      try {
        const user = await userModel.findUserById(profile.userId);
        // Only include if user exists and is not blocked
        if (user && !user.isBlocked) {
          filteredProfiles.push(profile);
        }
      } catch (error) {
        console.error('Error checking user block status:', error);
        // If error checking user, exclude from results for safety
      }
    }
    
    // Sort by profile views (descending) and take the specified limit
    return filteredProfiles
      .sort((a, b) => (b.profileViews || 0) - (a.profileViews || 0))
      .slice(0, limit);
  } catch (error) {
    console.error('Get trending staff profiles error:', error);
    throw new Error('Failed to get trending staff profiles');
  }
};

/**
 * Get all staff profiles (Admin only)
 * @returns {Promise<Array>} - Array of all staff profiles
 */
const getAllStaffProfiles = async () => {
  try {
    const profiles = await dynamoService.scanItems(STAFF_TABLE);
    
    // Sort by created date (most recent first)
    return profiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Get all staff profiles error:', error);
    throw new Error('Failed to get all staff profiles');
  }
};

/**
 * Delete staff profile
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteStaffProfile = async (userId) => {
  try {
    // First get the current profile to find the staffId
    const currentProfile = await getStaffProfile(userId);
    
    if (!currentProfile) {
      return false;
    }
    
    await dynamoService.deleteItem(STAFF_TABLE, { staffId: currentProfile.staffId });
    return true;
  } catch (error) {
    console.error('Delete staff profile error:', error);
    throw new Error('Failed to delete staff profile');
  }
};

/**
 * Search staff profiles by skills, location, sector, role, or availability
 * @param {object} searchParams - Search parameters
 * @returns {Promise<Array>} - Array of matching staff profiles
 */
const searchStaffProfiles = async (searchParams) => {
  try {
    const { skills, location, availability, sector, role, state, city } = searchParams;
    
    let filterExpression = 'isActiveStaff = :isActive AND profileVisibility = :visibility';
    const expressionAttributeValues = {
      ':isActive': true,
      ':visibility': 'public'
    };
    
    // Add skills filter
    if (skills && skills.trim()) {
      filterExpression += ' AND contains(skills, :skills)';
      expressionAttributeValues[':skills'] = skills.toLowerCase();
    }
    
    // Add location filter
    if (location && location.trim()) {
      filterExpression += ' AND contains(address, :location)';
      expressionAttributeValues[':location'] = location.toLowerCase();
    }
    
    // Add state filter
    if (state && state.trim()) {
      filterExpression += ' AND (#state = :state OR contains(address, :state))';
      expressionAttributeValues[':state'] = state;
    }
    
    // Add city filter
    if (city && city.trim()) {
      filterExpression += ' AND (#city = :city OR contains(address, :city))';
      expressionAttributeValues[':city'] = city;
    }
    
    // Add sector filter
    if (sector && sector.trim()) {
      filterExpression += ' AND sector = :sector';
      expressionAttributeValues[':sector'] = sector;
    }
    
    // Add role filter
    if (role && role.trim()) {
      filterExpression += ' AND #role = :role';
      expressionAttributeValues[':role'] = role;
    }
    
    // Add availability filter
    if (availability && availability !== 'all') {
      filterExpression += ' AND availability = :availability';
      expressionAttributeValues[':availability'] = availability;
    }
    
    const scanParams = {
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues
    };
    
    // Add ExpressionAttributeNames for reserved keywords
    const expressionAttributeNames = {};
    if (role && role.trim()) {
      expressionAttributeNames['#role'] = 'role';
    }
    if (state && state.trim()) {
      expressionAttributeNames['#state'] = 'state';
    }
    if (city && city.trim()) {
      expressionAttributeNames['#city'] = 'city';
    }
    
    if (Object.keys(expressionAttributeNames).length > 0) {
      scanParams.ExpressionAttributeNames = expressionAttributeNames;
    }
    
    const profiles = await dynamoService.scanItems(STAFF_TABLE, scanParams);
    
    // Filter out blocked users by checking user table
    const userModel = require('./userModel');
    const filteredProfiles = [];
    
    for (const profile of profiles) {
      try {
        const user = await userModel.findUserById(profile.userId);
        // Only include if user exists and is not blocked
        if (user && !user.isBlocked) {
          filteredProfiles.push(profile);
        }
      } catch (error) {
        console.error('Error checking user block status:', error);
        // If error checking user, exclude from results for safety
      }
    }
    
    // Sort by updated date (most recent first)
    return filteredProfiles.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (error) {
    console.error('Search staff profiles error:', error);
    throw new Error('Failed to search staff profiles');
  }
};

/**
 * Get staff profiles by skills
 * @param {Array} skillsArray - Array of skills to match
 * @returns {Promise<Array>} - Array of matching staff profiles
 */
const getStaffBySkills = async (skillsArray) => {
  try {
    if (!skillsArray || skillsArray.length === 0) {
      return await getActiveStaffProfiles();
    }
    
    // Build filter for multiple skills
    const skillFilters = skillsArray.map((_, index) => `contains(skills, :skill${index})`);
    const filterExpression = `isActiveStaff = :isActive AND profileVisibility = :visibility AND (${skillFilters.join(' OR ')})`;
    
    const expressionAttributeValues = {
      ':isActive': true,
      ':visibility': 'public'
    };
    
    skillsArray.forEach((skill, index) => {
      expressionAttributeValues[`:skill${index}`] = skill.toLowerCase();
    });
    
    const scanParams = {
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues
    };
    
    const profiles = await dynamoService.scanItems(STAFF_TABLE, scanParams);
    
    // Filter out blocked users by checking user table
    const userModel = require('./userModel');
    const filteredProfiles = [];
    
    for (const profile of profiles) {
      try {
        const user = await userModel.findUserById(profile.userId);
        // Only include if user exists and is not blocked
        if (user && !user.isBlocked) {
          filteredProfiles.push(profile);
        }
      } catch (error) {
        console.error('Error checking user block status:', error);
        // If error checking user, exclude from results for safety
      }
    }
    
    return filteredProfiles.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (error) {
    console.error('Get staff by skills error:', error);
    throw new Error('Failed to get staff by skills');
  }
};

/**
 * Update staff profile visibility
 * @param {string} userId - User ID
 * @param {string} visibility - Visibility setting ('public', 'private', 'recruiters')
 * @returns {Promise<object>} - Updated profile
 */
const updateProfileVisibility = async (userId, visibility) => {
  try {
    const updateData = {
      profileVisibility: visibility,
      updatedAt: new Date().toISOString()
    };
    
    return await updateStaffProfile(userId, updateData);
  } catch (error) {
    console.error('Update profile visibility error:', error);
    throw new Error('Failed to update profile visibility');
  }
};

/**
 * Get staff profiles count by status
 * @returns {Promise<object>} - Count statistics
 */
const getStaffStats = async () => {
  try {
    // Get all profiles
    const allProfiles = await dynamoService.scanItems(STAFF_TABLE);
    
    // Calculate statistics
    const stats = {
      total: allProfiles.length,
      active: allProfiles.filter(p => p.isActiveStaff === true).length,
      inactive: allProfiles.filter(p => p.isActiveStaff === false).length,
      public: allProfiles.filter(p => p.profileVisibility === 'public').length,
      private: allProfiles.filter(p => p.profileVisibility === 'private').length
    };
    
    return stats;
  } catch (error) {
    console.error('Get staff stats error:', error);
    throw new Error('Failed to get staff statistics');
  }
};

/**
 * Bulk update staff profiles
 * @param {Array} updates - Array of update operations
 * @returns {Promise<boolean>} - Success status
 */
const bulkUpdateProfiles = async (updates) => {
  try {
    const updatePromises = updates.map(update => {
      const { userId, data } = update;
      return updateStaffProfile(userId, data);
    });
    
    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Bulk update profiles error:', error);
    throw new Error('Failed to bulk update profiles');
  }
};

/**
 * Add experience to staff profile
 * @param {string} userId - User ID
 * @param {object} experienceData - Experience data
 * @returns {Promise<object>} - Updated profile
 */
const addExperience = async (userId, experienceData) => {
  try {
    const currentProfile = await getStaffProfile(userId);
    
    if (!currentProfile) {
      throw new Error('Staff profile not found');
    }
    
    const experiences = currentProfile.experiences || [];
    const newExperience = {
      id: uuidv4(),
      ...experienceData,
      createdAt: new Date().toISOString()
    };
    
    experiences.push(newExperience);
    
    return await updateStaffProfile(userId, { experiences });
  } catch (error) {
    console.error('Add experience error:', error);
    throw new Error('Failed to add experience');
  }
};

/**
 * Remove experience from staff profile
 * @param {string} userId - User ID
 * @param {string} experienceId - Experience ID
 * @returns {Promise<object>} - Updated profile
 */
const removeExperience = async (userId, experienceId) => {
  try {
    const currentProfile = await getStaffProfile(userId);
    
    if (!currentProfile) {
      throw new Error('Staff profile not found');
    }
    
    const experiences = (currentProfile.experiences || []).filter(exp => exp.id !== experienceId);
    
    return await updateStaffProfile(userId, { experiences });
  } catch (error) {
    console.error('Remove experience error:', error);
    throw new Error('Failed to remove experience');
  }
};

module.exports = {
  createStaffProfile,
  getStaffProfile,
  updateStaffProfile,
  getActiveStaffProfiles,
  getTrendingStaffProfiles,
  getAllStaffProfiles,
  deleteStaffProfile,
  searchStaffProfiles,
  getStaffBySkills,
  updateProfileVisibility,
  getStaffStats,
  bulkUpdateProfiles,
  addExperience,
  removeExperience,
  searchStaffProfiles
};