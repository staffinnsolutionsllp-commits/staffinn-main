/**
 * Government Scheme Model
 * Handles government schemes data operations
 */

const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const GOVERNMENT_SCHEMES_TABLE = 'staffinn-government-schemes';

/**
 * Get all government schemes
 */
const getAllSchemes = async () => {
  try {
    const schemes = await dynamoService.scanItems(GOVERNMENT_SCHEMES_TABLE);
    // Sort by createdAt in ascending order (oldest first) to show schemes in the order they were added
    return schemes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } catch (error) {
    console.error('Error getting all schemes:', error);
    throw error;
  }
};

/**
 * Get all active government schemes for public access
 */
const getAllActiveSchemes = async () => {
  try {
    const schemes = await getAllSchemes();
    return schemes.filter(scheme => scheme.visibility === 'All');
  } catch (error) {
    console.error('Error getting active schemes:', error);
    throw error;
  }
};

/**
 * Get schemes by visibility
 */
const getSchemesByVisibility = async (visibility) => {
  try {
    const allSchemes = await getAllSchemes();
    if (!visibility || visibility === 'All') {
      // Return all schemes that are visible to everyone
      return allSchemes.filter(scheme => scheme.visibility === 'All');
    }
    // Return schemes that match the specific visibility OR are visible to all
    return allSchemes.filter(scheme => 
      scheme.visibility === visibility || scheme.visibility === 'All'
    );
  } catch (error) {
    console.error('Error getting schemes by visibility:', error);
    throw error;
  }
};

/**
 * Get scheme by ID
 */
const getSchemeById = async (schemeId) => {
  try {
    const scheme = await dynamoService.getItem(GOVERNMENT_SCHEMES_TABLE, { 
      govschemes: 'SCHEME',
      schemesnum: schemeId 
    });
    return scheme;
  } catch (error) {
    console.error('Error getting scheme by ID:', error);
    throw error;
  }
};

/**
 * Add new government scheme
 */
const addScheme = async (schemeData) => {
  try {
    const schemeId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const scheme = {
      govschemes: 'SCHEME',
      schemesnum: schemeId,
      schemeId,
      schemeName: schemeData.schemeName,
      schemeLink: schemeData.schemeLink,
      description: schemeData.description || '',
      visibility: schemeData.visibility,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await dynamoService.putItem(GOVERNMENT_SCHEMES_TABLE, scheme);
    return scheme;
  } catch (error) {
    console.error('Error adding scheme:', error);
    throw error;
  }
};

/**
 * Update government scheme
 */
const updateScheme = async (schemeId, updateData) => {
  try {
    const existingScheme = await getSchemeById(schemeId);
    if (!existingScheme) {
      throw new Error('Scheme not found');
    }
    
    const updatedScheme = {
      ...existingScheme,
      schemeName: updateData.schemeName,
      schemeLink: updateData.schemeLink,
      description: updateData.description || existingScheme.description || '',
      visibility: updateData.visibility,
      updatedAt: new Date().toISOString()
    };
    
    await dynamoService.putItem(GOVERNMENT_SCHEMES_TABLE, updatedScheme);
    return updatedScheme;
  } catch (error) {
    console.error('Error updating scheme:', error);
    throw error;
  }
};

/**
 * Delete government scheme
 */
const deleteScheme = async (schemeId) => {
  try {
    await dynamoService.deleteItem(GOVERNMENT_SCHEMES_TABLE, {
      govschemes: 'SCHEME',
      schemesnum: schemeId
    });
    return true;
  } catch (error) {
    console.error('Error deleting scheme:', error);
    throw error;
  }
};

module.exports = {
  getAllSchemes,
  getAllActiveSchemes,
  getSchemesByVisibility,
  getSchemeById,
  addScheme,
  updateScheme,
  deleteScheme
};