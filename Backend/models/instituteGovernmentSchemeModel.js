/**
 * Institute Government Scheme Model
 * Handles institute-specific government schemes data operations
 */

const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const INSTITUTE_GOV_SCHEMES_TABLE = 'institute-gov-schemes';

/**
 * Add new government scheme for an institute
 */
const addInstituteScheme = async (instituteId, schemeData) => {
  try {
    const schemeId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const scheme = {
      instituteId, // Partition key
      schemeId,    // Sort key
      schemeName: schemeData.schemeName,
      schemeDescription: schemeData.schemeDescription,
      link: schemeData.link,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await dynamoService.putItem(INSTITUTE_GOV_SCHEMES_TABLE, scheme);
    return scheme;
  } catch (error) {
    console.error('Error adding institute scheme:', error);
    throw error;
  }
};

/**
 * Get all government schemes for a specific institute
 */
const getInstituteSchemes = async (instituteId) => {
  try {
    console.log('Getting schemes for institute ID:', instituteId);
    
    // Query by partition key (instituteId) - much more efficient
    let schemes;
    try {
      schemes = await dynamoService.queryItems(INSTITUTE_GOV_SCHEMES_TABLE, {
        KeyConditionExpression: 'instituteId = :instituteId',
        ExpressionAttributeValues: {
          ':instituteId': instituteId
        }
      });
      console.log('Schemes found for institute:', schemes.length);
    } catch (queryError) {
      console.error('Error querying table:', queryError.message);
      
      // If table doesn't exist, return empty array
      if (queryError.code === 'ResourceNotFoundException') {
        console.log('Table does not exist, returning empty array');
        return [];
      }
      
      throw queryError;
    }
    
    // Sort by creation date and format response
    const formattedSchemes = schemes
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(scheme => ({
        instituteSchemeId: scheme.schemeId,
        schemeName: scheme.schemeName,
        description: scheme.schemeDescription,
        link: scheme.link,
        status: 'Active',
        createdAt: scheme.createdAt,
        updatedAt: scheme.updatedAt
      }));
    
    console.log('Formatted schemes for institute:', formattedSchemes.length);
    return formattedSchemes;
  } catch (error) {
    console.error('Error getting institute schemes:', error);
    return [];
  }
};

/**
 * Get scheme by ID for a specific institute
 */
const getInstituteSchemeById = async (instituteId, schemeId) => {
  try {
    const result = await dynamoService.getItem(INSTITUTE_GOV_SCHEMES_TABLE, {
      instituteId,
      schemeId
    });
    return result;
  } catch (error) {
    console.error('Error getting institute scheme by ID:', error);
    throw error;
  }
};

/**
 * Update government scheme for an institute
 */
const updateInstituteScheme = async (instituteId, schemeId, updateData) => {
  try {
    const existingScheme = await getInstituteSchemeById(instituteId, schemeId);
    if (!existingScheme) {
      throw new Error('Scheme not found');
    }
    
    const updatedScheme = {
      ...existingScheme,
      schemeName: updateData.schemeName,
      schemeDescription: updateData.schemeDescription,
      link: updateData.link,
      updatedAt: new Date().toISOString()
    };
    
    await dynamoService.putItem(INSTITUTE_GOV_SCHEMES_TABLE, updatedScheme);
    return updatedScheme;
  } catch (error) {
    console.error('Error updating institute scheme:', error);
    throw error;
  }
};

/**
 * Delete government scheme for an institute
 */
const deleteInstituteScheme = async (instituteId, schemeId) => {
  try {
    const existingScheme = await getInstituteSchemeById(instituteId, schemeId);
    if (!existingScheme) {
      throw new Error('Scheme not found');
    }
    
    await dynamoService.deleteItem(INSTITUTE_GOV_SCHEMES_TABLE, {
      instituteId,
      schemeId
    });
    return true;
  } catch (error) {
    console.error('Error deleting institute scheme:', error);
    throw error;
  }
};

module.exports = {
  addInstituteScheme,
  getInstituteSchemes,
  getInstituteSchemeById,
  updateInstituteScheme,
  deleteInstituteScheme
};