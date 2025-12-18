/**
 * MIS Placement Analytics Model
 * Handles MIS student placement tracking with real-time updates
 */

const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const TABLE_NAME = 'staffinn-mis-placement-analytics';

/**
 * Create or update MIS student placement record
 */
const createOrUpdateMisPlacement = async (placementData) => {
  try {
    // Check if record already exists for this student
    const existingRecord = await getMisPlacementByStudent(placementData.studentId);
    
    if (existingRecord) {
      // Update existing record
      return await updateMisPlacement(existingRecord.placementId, placementData);
    } else {
      // Create new record
      return await createMisPlacement(placementData);
    }
  } catch (error) {
    console.error('Error creating/updating MIS placement:', error);
    throw new Error('Failed to create/update MIS placement record');
  }
};

/**
 * Create new MIS placement record
 */
const createMisPlacement = async (placementData) => {
  try {
    const placementId = `MIS-PLC-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    const placementRecord = {
      placementId,
      studentId: placementData.studentId,
      studentName: placementData.studentName,
      qualification: placementData.qualification,
      center: placementData.center,
      sector: placementData.sector,
      course: placementData.course,
      batchId: placementData.batchId,
      recruiterName: placementData.recruiterName,
      companyName: placementData.companyName,
      jobTitle: placementData.jobTitle,
      status: placementData.status, // 'Applied', 'Hired', 'Rejected'
      appliedDate: placementData.appliedDate,
      hiredDate: placementData.hiredDate || null,
      rejectedDate: placementData.rejectedDate || null,
      salaryPackage: placementData.salaryPackage,
      instituteId: placementData.instituteId,
      recruiterId: placementData.recruiterId,
      jobId: placementData.jobId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoService.putItem(TABLE_NAME, placementRecord);
    return placementRecord;
  } catch (error) {
    console.error('Error creating MIS placement record:', error);
    throw new Error('Failed to create MIS placement record');
  }
};

/**
 * Update existing MIS placement record
 */
const updateMisPlacement = async (placementId, updateData) => {
  try {
    const updatedData = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    // Set specific date fields based on status
    if (updateData.status === 'Hired' && !updateData.hiredDate) {
      updatedData.hiredDate = new Date().toISOString();
      updatedData.rejectedDate = null;
    } else if (updateData.status === 'Rejected' && !updateData.rejectedDate) {
      updatedData.rejectedDate = new Date().toISOString();
      updatedData.hiredDate = null;
    }

    const result = await dynamoService.simpleUpdate(TABLE_NAME, { placementId }, updatedData);
    return result;
  } catch (error) {
    console.error('Error updating MIS placement record:', error);
    throw new Error('Failed to update MIS placement record');
  }
};

/**
 * Get MIS placement record by student ID
 */
const getMisPlacementByStudent = async (studentId) => {
  try {
    const params = {
      FilterExpression: 'studentId = :studentId',
      ExpressionAttributeValues: {
        ':studentId': studentId
      }
    };
    
    const result = await dynamoService.scanItems(TABLE_NAME, params);
    return result && result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error fetching MIS placement by student:', error);
    return null;
  }
};

/**
 * Get MIS placement record by student ID and job ID
 */
const getMisPlacementByStudentAndJob = async (studentId, jobId) => {
  try {
    const params = {
      FilterExpression: 'studentId = :studentId AND jobId = :jobId',
      ExpressionAttributeValues: {
        ':studentId': studentId,
        ':jobId': jobId
      }
    };
    
    const result = await dynamoService.scanItems(TABLE_NAME, params);
    return result && result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error fetching MIS placement by student and job:', error);
    return null;
  }
};

/**
 * Get all MIS placement records for Staffinn Partner dashboard
 */
const getAllMisPlacements = async () => {
  try {
    const result = await dynamoService.scanItems(TABLE_NAME);
    return result || [];
  } catch (error) {
    console.error('Error fetching all MIS placements:', error);
    return [];
  }
};

/**
 * Get MIS placements by institute ID
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
    console.error('Error fetching MIS placements by institute:', error);
    return [];
  }
};

/**
 * Get MIS placements by status
 */
const getMisPlacementsByStatus = async (status) => {
  try {
    const params = {
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status
      }
    };
    
    const result = await dynamoService.scanItems(TABLE_NAME, params);
    return result || [];
  } catch (error) {
    console.error('Error fetching MIS placements by status:', error);
    return [];
  }
};

/**
 * Get MIS placement statistics
 */
const getMisPlacementStats = async () => {
  try {
    const allPlacements = await getAllMisPlacements();
    
    const stats = {
      totalApplications: allPlacements.length,
      hired: allPlacements.filter(p => p.status === 'Hired').length,
      rejected: allPlacements.filter(p => p.status === 'Rejected').length,
      pending: allPlacements.filter(p => p.status === 'Applied').length,
      uniqueRecruiters: [...new Set(allPlacements.map(p => p.recruiterId))].length,
      uniqueCenters: [...new Set(allPlacements.map(p => p.center))].length,
      uniqueSectors: [...new Set(allPlacements.map(p => p.sector))].length,
      recentPlacements: allPlacements
        .filter(p => p.status === 'Hired')
        .sort((a, b) => new Date(b.hiredDate) - new Date(a.hiredDate))
        .slice(0, 10)
    };
    
    return stats;
  } catch (error) {
    console.error('Error calculating MIS placement stats:', error);
    return {
      totalApplications: 0,
      hired: 0,
      rejected: 0,
      pending: 0,
      uniqueRecruiters: 0,
      uniqueCenters: 0,
      uniqueSectors: 0,
      recentPlacements: []
    };
  }
};

/**
 * Get student-wise placement analytics with counts and status
 */
const getStudentWisePlacementAnalytics = async () => {
  try {
    const allPlacements = await getAllMisPlacements();
    const misStudentModel = require('./misStudentModel');
    const batchModel = require('./batchModel');
    
    // Get all MIS students
    const allStudents = await misStudentModel.getAll();
    const allBatches = await batchModel.getAll();
    
    // Create student analytics
    const studentAnalytics = allStudents.map(student => {
      // Get all placements for this student
      const studentPlacements = allPlacements.filter(p => p.studentId === student.studentsId);
      
      // Calculate counts
      const placedCount = studentPlacements.filter(p => p.status === 'Hired').length;
      const totalApplications = studentPlacements.length;
      
      // Get latest status and company
      const latestPlacement = studentPlacements
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
      
      let status = 'Not Applied';
      let companyName = '-';
      
      if (latestPlacement) {
        status = latestPlacement.status;
        companyName = latestPlacement.companyName || '-';
      }
      
      // Get batch information
      const studentBatch = allBatches.find(batch => 
        batch.selectedStudents && batch.selectedStudents.includes(student.studentsId)
      );
      
      return {
        studentId: student.studentsId,
        studentName: student.fatherName || 'MIS Student',
        qualification: student.qualification || 'N/A',
        center: studentBatch?.trainingCentreName || 'MIS Center',
        course: studentBatch?.courseName || student.course || 'N/A',
        batch: studentBatch?.batchId || 'N/A',
        sector: getSectorFromCourse(studentBatch?.courseName || student.course),
        placedCount,
        totalApplications,
        status,
        companyName
      };
    });
    
    return studentAnalytics;
  } catch (error) {
    console.error('Error getting student-wise placement analytics:', error);
    return [];
  }
};

/**
 * Helper function to determine sector from course name
 */
const getSectorFromCourse = (courseName) => {
  if (!courseName) return 'General';
  
  const course = courseName.toLowerCase();
  if (course.includes('it') || course.includes('software') || course.includes('computer')) {
    return 'Information Technology';
  } else if (course.includes('retail')) {
    return 'Retail';
  } else if (course.includes('healthcare') || course.includes('medical')) {
    return 'Healthcare';
  } else if (course.includes('finance') || course.includes('banking')) {
    return 'Finance';
  } else {
    return 'General';
  }
};

/**
 * Delete MIS placement record
 */
const deleteMisPlacement = async (placementId) => {
  try {
    await dynamoService.deleteItem(TABLE_NAME, { placementId });
    return { success: true };
  } catch (error) {
    console.error('Error deleting MIS placement record:', error);
    throw new Error('Failed to delete MIS placement record');
  }
};

/**
 * Get MIS placement statistics by institute
 */
const getPlacementStatsByInstitute = async (instituteId) => {
  try {
    const allPlacements = await getPlacementsByInstitute(instituteId);
    
    const stats = {
      totalApplications: allPlacements.length,
      hired: allPlacements.filter(p => p.status === 'Hired').length,
      rejected: allPlacements.filter(p => p.status === 'Rejected').length,
      pending: allPlacements.filter(p => p.status === 'Applied').length,
      uniqueRecruiters: [...new Set(allPlacements.map(p => p.recruiterId))].length,
      uniqueCenters: [...new Set(allPlacements.map(p => p.center))].length,
      uniqueSectors: [...new Set(allPlacements.map(p => p.sector))].length,
      recentPlacements: allPlacements
        .filter(p => p.status === 'Hired')
        .sort((a, b) => new Date(b.hiredDate) - new Date(a.hiredDate))
        .slice(0, 10)
    };
    
    return stats;
  } catch (error) {
    console.error('Error calculating MIS placement stats by institute:', error);
    return {
      totalApplications: 0,
      hired: 0,
      rejected: 0,
      pending: 0,
      uniqueRecruiters: 0,
      uniqueCenters: 0,
      uniqueSectors: 0,
      recentPlacements: []
    };
  }
};

/**
 * Get student-wise placement analytics by institute
 */
const getStudentWisePlacementAnalyticsByInstitute = async (instituteId) => {
  try {
    const allPlacements = await getPlacementsByInstitute(instituteId);
    const misStudentModel = require('./misStudentModel');
    const batchModel = require('./batchModel');
    
    // Get students for this institute
    const allStudents = await misStudentModel.getStudentsByInstitute(instituteId);
    const allBatches = await batchModel.getAll(instituteId);
    
    // Create student analytics
    const studentAnalytics = allStudents.map(student => {
      // Get all placements for this student
      const studentPlacements = allPlacements.filter(p => p.studentId === student.studentsId);
      
      // Calculate counts
      const placedCount = studentPlacements.filter(p => p.status === 'Hired').length;
      const totalApplications = studentPlacements.length;
      
      // Get latest status and company
      const latestPlacement = studentPlacements
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
      
      let status = 'Not Applied';
      let companyName = '-';
      
      if (latestPlacement) {
        status = latestPlacement.status;
        companyName = latestPlacement.companyName || '-';
      }
      
      // Get batch information
      const studentBatch = allBatches.find(batch => 
        batch.selectedStudents && batch.selectedStudents.includes(student.studentsId)
      );
      
      return {
        studentId: student.studentsId,
        studentName: student.fatherName || 'MIS Student',
        qualification: student.qualification || 'N/A',
        center: studentBatch?.trainingCentreName || 'MIS Center',
        course: studentBatch?.courseName || student.course || 'N/A',
        batch: studentBatch?.batchId || 'N/A',
        sector: getSectorFromCourse(studentBatch?.courseName || student.course),
        placedCount,
        totalApplications,
        status,
        companyName
      };
    });
    
    return studentAnalytics;
  } catch (error) {
    console.error('Error getting student-wise placement analytics by institute:', error);
    return [];
  }
};

module.exports = {
  createOrUpdateMisPlacement,
  createMisPlacement,
  updateMisPlacement,
  getMisPlacementByStudent,
  getMisPlacementByStudentAndJob,
  getAllMisPlacements,
  getPlacementsByInstitute,
  getMisPlacementsByStatus,
  getMisPlacementStats,
  getPlacementStatsByInstitute,
  getStudentWisePlacementAnalytics,
  getStudentWisePlacementAnalyticsByInstitute,
  deleteMisPlacement,
  getAllAnalytics: getAllMisPlacements,
  getPlacementStats: getMisPlacementStats
};