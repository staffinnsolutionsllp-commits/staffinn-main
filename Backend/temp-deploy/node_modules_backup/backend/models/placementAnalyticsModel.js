/**
 * Placement Analytics Model
 * Handles placement data for Staffinn Partner dashboard
 */

const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const TABLE_NAME = 'staffinn-placement-analytics';

/**
 * Create a placement record
 */
const createPlacementRecord = async (placementData) => {
  try {
    const placementId = `PLC-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    const placementRecord = {
      placementId,
      studentId: placementData.studentId,
      studentName: placementData.studentName,
      qualification: placementData.qualification,
      center: placementData.center,
      course: placementData.course,
      recruiterName: placementData.recruiterName,
      companyName: placementData.companyName,
      jobTitle: placementData.jobTitle,
      hiredDate: placementData.hiredDate,
      salaryPackage: placementData.salaryPackage,
      placementType: placementData.placementType, // 'mis' or 'institute'
      instituteId: placementData.instituteId,
      recruiterId: placementData.recruiterId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoService.putItem(TABLE_NAME, placementRecord);
    return placementRecord;
  } catch (error) {
    console.error('Error creating placement record:', error);
    throw new Error('Failed to create placement record');
  }
};

/**
 * Get all placement records
 */
const getAllPlacements = async () => {
  try {
    const result = await dynamoService.scanItems(TABLE_NAME);
    return result || [];
  } catch (error) {
    console.error('Error fetching placement records:', error);
    return [];
  }
};

/**
 * Get placement records by type
 */
const getPlacementsByType = async (placementType) => {
  try {
    const params = {
      FilterExpression: 'placementType = :placementType',
      ExpressionAttributeValues: {
        ':placementType': placementType
      }
    };
    
    const result = await dynamoService.scanItems(TABLE_NAME, params);
    return result || [];
  } catch (error) {
    console.error('Error fetching placements by type:', error);
    return [];
  }
};

/**
 * Get placement records by institute
 */
const getPlacementsByInstitute = async (instituteId) => {
  try {
    const params = {
      FilterExpression: 'instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': instituteId
      }
    };
    
    const result = await dynamoService.scanItems(TABLE_NAME, params);
    return result || [];
  } catch (error) {
    console.error('Error fetching placements by institute:', error);
    return [];
  }
};

/**
 * Get placement records by recruiter
 */
const getPlacementsByRecruiter = async (recruiterId) => {
  try {
    const params = {
      FilterExpression: 'recruiterId = :recruiterId',
      ExpressionAttributeValues: {
        ':recruiterId': recruiterId
      }
    };
    
    const result = await dynamoService.scanItems(TABLE_NAME, params);
    return result || [];
  } catch (error) {
    console.error('Error fetching placements by recruiter:', error);
    return [];
  }
};

/**
 * Get placement statistics
 */
const getPlacementStats = async () => {
  try {
    const allPlacements = await getAllPlacements();
    
    const stats = {
      totalPlacements: allPlacements.length,
      misPlacements: allPlacements.filter(p => p.placementType === 'mis').length,
      institutePlacements: allPlacements.filter(p => p.placementType === 'institute').length,
      uniqueRecruiters: [...new Set(allPlacements.map(p => p.recruiterId))].length,
      uniqueInstitutes: [...new Set(allPlacements.map(p => p.instituteId))].length,
      recentPlacements: allPlacements
        .sort((a, b) => new Date(b.hiredDate) - new Date(a.hiredDate))
        .slice(0, 10)
    };
    
    return stats;
  } catch (error) {
    console.error('Error calculating placement stats:', error);
    return {
      totalPlacements: 0,
      misPlacements: 0,
      institutePlacements: 0,
      uniqueRecruiters: 0,
      uniqueInstitutes: 0,
      recentPlacements: []
    };
  }
};

/**
 * Delete placement record
 */
const deletePlacementRecord = async (placementId) => {
  try {
    await dynamoService.deleteItem(TABLE_NAME, { placementId });
    return { success: true };
  } catch (error) {
    console.error('Error deleting placement record:', error);
    throw new Error('Failed to delete placement record');
  }
};

module.exports = {
  createPlacementRecord,
  getAllPlacements,
  getPlacementsByType,
  getPlacementsByInstitute,
  getPlacementsByRecruiter,
  getPlacementStats,
  deletePlacementRecord
};