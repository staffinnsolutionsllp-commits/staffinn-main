/**
 * Institute Model
 * Handles institute profile operations with DynamoDB
 */

const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');

// Get table name from environment variables
const INSTITUTE_PROFILES_TABLE = 'staffinn-institute-profiles';

/**
 * Create or update institute profile
 * @param {string} instituteId - Institute user ID
 * @param {object} profileData - Profile data
 * @returns {Promise<object>} - Created/updated profile object
 */
const createOrUpdateProfile = async (instituteId, profileData) => {
  try {
    const profile = {
      instituteId,
      instituteName: profileData.instituteName,
      address: profileData.address,
      pincode: profileData.pincode || '',
      phone: profileData.phone,
      email: profileData.email,
      website: profileData.website,
      experience: profileData.experience,
      badges: profileData.badges || [],
      description: profileData.description || '',
      establishedYear: profileData.establishedYear || null,
      profileImage: profileData.profileImage || null,
      affiliations: profileData.affiliations || [],
      courses: profileData.courses || [],
      placementRate: profileData.placementRate || null,
      totalStudents: profileData.totalStudents || null,
      isLive: profileData.isLive || false,
      updatedAt: new Date().toISOString(),
      createdAt: profileData.createdAt || new Date().toISOString()
    };

    await dynamoService.putItem(INSTITUTE_PROFILES_TABLE, profile);
    return profile;
  } catch (error) {
    console.error('Error creating/updating institute profile:', error);
    throw error;
  }
};

/**
 * Get institute profile by ID
 * @param {string} instituteId - Institute user ID
 * @returns {Promise<object|null>} - Profile object or null
 */
const getProfileById = async (instituteId) => {
  try {
    const profile = await dynamoService.getItem(INSTITUTE_PROFILES_TABLE, { instituteId });
    return profile;
  } catch (error) {
    console.error('Error getting institute profile:', error);
    return null;
  }
};

/**
 * Get all live institute profiles
 * @returns {Promise<array>} - Array of live institute profiles
 */
const getAllLiveProfiles = async () => {
  try {
    const params = {
      FilterExpression: 'isLive = :isLive',
      ExpressionAttributeValues: {
        ':isLive': true
      }
    };
    
    const profiles = await dynamoService.scanItems(INSTITUTE_PROFILES_TABLE, params);
    return profiles;
  } catch (error) {
    console.error('Error getting live institute profiles:', error);
    return [];
  }
};

/**
 * Search institute profiles
 * @param {string} searchTerm - Search term
 * @returns {Promise<array>} - Array of matching profiles
 */
const searchProfiles = async (searchTerm) => {
  try {
    const params = {
      FilterExpression: 'contains(instituteName, :searchTerm) OR contains(address, :searchTerm)',
      ExpressionAttributeValues: {
        ':searchTerm': searchTerm
      }
    };
    
    const profiles = await dynamoService.scanItems(INSTITUTE_PROFILES_TABLE, params);
    return profiles;
  } catch (error) {
    console.error('Error searching institute profiles:', error);
    return [];
  }
};

/**
 * Delete institute profile
 * @param {string} instituteId - Institute user ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteProfile = async (instituteId) => {
  try {
    await dynamoService.deleteItem(INSTITUTE_PROFILES_TABLE, { instituteId });
    return true;
  } catch (error) {
    console.error('Error deleting institute profile:', error);
    return false;
  }
};

module.exports = {
  createOrUpdateProfile,
  getProfileById,
  getAllLiveProfiles,
  searchProfiles,
  deleteProfile
};