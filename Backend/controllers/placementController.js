/**
 * Placement Controller
 * Handles placement analytics for Staffinn Partner dashboard
 */

const placementAnalyticsModel = require('../models/placementAnalyticsModel');
const MisPlacementAnalytics = require('../models/misPlacementAnalyticsModel');

/**
 * Get all placement records
 * @route GET /api/placements
 */
const getAllPlacements = async (req, res) => {
  try {
    const instituteId = req.user?.userId;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found' });
    }
    const placements = await placementAnalyticsModel.getPlacementsByInstitute(instituteId);
    
    res.status(200).json({
      success: true,
      data: placements
    });
  } catch (error) {
    console.error('Get all placements error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get placement records'
    });
  }
};

/**
 * Get placement statistics
 * @route GET /api/placements/stats
 */
const getPlacementStats = async (req, res) => {
  try {
    const stats = await placementAnalyticsModel.getPlacementStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get placement stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get placement statistics'
    });
  }
};

/**
 * Get placements by type
 * @route GET /api/placements/type/:type
 */
const getPlacementsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['mis', 'institute'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid placement type. Must be "mis" or "institute"'
      });
    }
    
    const placements = await placementAnalyticsModel.getPlacementsByType(type);
    
    res.status(200).json({
      success: true,
      data: placements
    });
  } catch (error) {
    console.error('Get placements by type error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get placements by type'
    });
  }
};

/**
 * Get placements by institute
 * @route GET /api/placements/institute/:instituteId
 */
const getPlacementsByInstitute = async (req, res) => {
  try {
    const { instituteId } = req.params;
    
    if (!instituteId) {
      return res.status(400).json({
        success: false,
        message: 'Institute ID is required'
      });
    }
    
    const placements = await placementAnalyticsModel.getPlacementsByInstitute(instituteId);
    
    res.status(200).json({
      success: true,
      data: placements
    });
  } catch (error) {
    console.error('Get placements by institute error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get placements by institute'
    });
  }
};

/**
 * Get placements by recruiter
 * @route GET /api/placements/recruiter/:recruiterId
 */
const getPlacementsByRecruiter = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    if (!recruiterId) {
      return res.status(400).json({
        success: false,
        message: 'Recruiter ID is required'
      });
    }
    
    const placements = await placementAnalyticsModel.getPlacementsByRecruiter(recruiterId);
    
    res.status(200).json({
      success: true,
      data: placements
    });
  } catch (error) {
    console.error('Get placements by recruiter error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get placements by recruiter'
    });
  }
};

/**
 * Get dashboard summary
 */
const getDashboardSummary = async (req, res) => {
  try {
    const instituteId = req.user?.userId;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found' });
    }
    // Get student-wise data to calculate placement metrics
    const studentAnalytics = await MisPlacementAnalytics.getStudentWisePlacementAnalyticsByInstitute(instituteId);
    
    // Calculate metrics from student-wise data
    const studentsPlaced = studentAnalytics.filter(student => student.status === 'Hired').length;
    const totalStudentsApplied = studentAnalytics.length;
    const totalApplications = studentAnalytics.reduce((sum, student) => sum + (student.totalApplications || 0), 0);
    
    // Calculate placement rate: (Students Placed / Students Who Applied) × 100
    const placementRate = totalStudentsApplied > 0 
      ? Math.round((studentsPlaced / totalStudentsApplied) * 100) 
      : 0;

    const dashboardData = {
      placementRate,
      studentsPlaced,
      totalApplications
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get student-wise analytics
 */
const getStudentWiseAnalytics = async (req, res) => {
  try {
    const instituteId = req.user?.userId;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found' });
    }
    const studentAnalytics = await MisPlacementAnalytics.getStudentWisePlacementAnalyticsByInstitute(instituteId);
    res.json({ success: true, data: studentAnalytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get sector-wise analytics
 */
const getSectorWiseAnalytics = async (req, res) => {
  try {
    const instituteId = req.user?.userId;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found' });
    }
    const placements = await MisPlacementAnalytics.getPlacementsByInstitute(instituteId) || [];
    const sectorStats = {};
    
    placements.forEach(p => {
      const sector = p.sector || 'General';
      if (!sectorStats[sector]) {
        sectorStats[sector] = { total: 0, hired: 0, rejected: 0, pending: 0 };
      }
      sectorStats[sector].total++;
      if (p.status === 'Hired') sectorStats[sector].hired++;
      else if (p.status === 'Rejected') sectorStats[sector].rejected++;
      else sectorStats[sector].pending++;
    });
    
    // Convert to array format that frontend expects
    const sectorArray = Object.keys(sectorStats).map(sector => ({
      sector,
      ...sectorStats[sector],
      placementRate: sectorStats[sector].total > 0 
        ? Math.round((sectorStats[sector].hired / sectorStats[sector].total) * 100)
        : 0
    }));
    
    // Ensure we always return an array
    const safeArray = Array.isArray(sectorArray) ? sectorArray : [];
    if (safeArray.length === 0) {
      safeArray.push({ sector: 'No Data', total: 0, hired: 0, rejected: 0, pending: 0, placementRate: 0 });
    }
    
    res.json({ success: true, data: safeArray });
  } catch (error) {
    res.json({ 
      success: true, 
      data: [
        { sector: 'Error Loading', total: 0, hired: 0, rejected: 0, pending: 0, placementRate: 0 }
      ]
    });
  }
};

/**
 * Get center-wise analytics
 */
const getCenterWiseAnalytics = async (req, res) => {
  try {
    const instituteId = req.user?.userId;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found' });
    }
    const placements = await MisPlacementAnalytics.getPlacementsByInstitute(instituteId) || [];
    const centerStats = {};
    
    placements.forEach(p => {
      const center = p.center || 'Unknown Center';
      if (!centerStats[center]) {
        centerStats[center] = { total: 0, hired: 0, rejected: 0, pending: 0 };
      }
      centerStats[center].total++;
      if (p.status === 'Hired') centerStats[center].hired++;
      else if (p.status === 'Rejected') centerStats[center].rejected++;
      else centerStats[center].pending++;
    });
    
    // Convert to array format that frontend expects
    const centerArray = Object.keys(centerStats).map(center => ({
      center,
      ...centerStats[center],
      placementRate: centerStats[center].total > 0 
        ? Math.round((centerStats[center].hired / centerStats[center].total) * 100)
        : 0
    }));
    
    // Ensure we always return an array
    const safeArray = Array.isArray(centerArray) ? centerArray : [];
    if (safeArray.length === 0) {
      safeArray.push({ center: 'No Data', total: 0, hired: 0, rejected: 0, pending: 0, placementRate: 0 });
    }
    
    res.json({ success: true, data: safeArray });
  } catch (error) {
    res.json({ 
      success: true, 
      data: [
        { center: 'Error Loading', total: 0, hired: 0, rejected: 0, pending: 0, placementRate: 0 }
      ]
    });
  }
};

/**
 * Get student status details
 */
const getStudentStatus = async (req, res) => {
  const { studentId } = req.params;
  
  try {
    const instituteId = req.user?.userId;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found' });
    }
    // Get all placements for this student
    const allPlacements = await MisPlacementAnalytics.getPlacementsByInstitute(instituteId) || [];
    const studentPlacements = allPlacements.filter(p => p.studentId === studentId) || [];
    
    // Separate hired and rejected companies
    const hiredCompanies = studentPlacements
      .filter(p => p.status === 'Hired')
      .map(p => ({
        companyName: p.companyName || 'Unknown Company',
        jobTitle: p.jobTitle || 'Unknown Position',
        hiredDate: p.hiredDate || new Date().toISOString(),
        salaryPackage: p.salaryPackage || 'Not specified'
      })) || [];
    
    const rejectedCompanies = studentPlacements
      .filter(p => p.status === 'Rejected')
      .map(p => ({
        companyName: p.companyName || 'Unknown Company',
        jobTitle: p.jobTitle || 'Unknown Position',
        rejectedDate: p.rejectedDate || new Date().toISOString()
      })) || [];
    
    const response = {
      studentId: studentId || 'unknown',
      hiredCompanies: {
        count: hiredCompanies.length || 0,
        companies: Array.isArray(hiredCompanies) ? hiredCompanies : []
      },
      rejectedCompanies: {
        count: rejectedCompanies.length || 0,
        companies: Array.isArray(rejectedCompanies) ? rejectedCompanies : []
      },
      totalApplications: studentPlacements.length || 0
    };
    
    // Triple-check all arrays exist
    if (!response.hiredCompanies) {
      response.hiredCompanies = { count: 0, companies: [] };
    }
    if (!response.hiredCompanies.companies) {
      response.hiredCompanies.companies = [];
    }
    if (!Array.isArray(response.hiredCompanies.companies)) {
      response.hiredCompanies.companies = [];
    }
    if (!response.rejectedCompanies) {
      response.rejectedCompanies = { count: 0, companies: [] };
    }
    if (!response.rejectedCompanies.companies) {
      response.rejectedCompanies.companies = [];
    }
    if (!Array.isArray(response.rejectedCompanies.companies)) {
      response.rejectedCompanies.companies = [];
    }
    
    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Error getting student status:', error);
    // Ultra-safe fallback
    res.json({ 
      success: true, 
      data: {
        studentId: studentId || 'unknown',
        hiredCompanies: { count: 0, companies: [] },
        rejectedCompanies: { count: 0, companies: [] },
        totalApplications: 0
      }
    });
  }
};

/**
 * Get training centers for dropdown
 */
const getTrainingCenters = async (req, res) => {
  try {
    const instituteId = req.user?.userId;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found' });
    }
    
    const TrainingCenterModel = require('../models/trainingCenterModel');
    const centers = await TrainingCenterModel.getByInstituteId(instituteId);
    
    const formattedCenters = centers.map(center => ({
      id: center.TrainingCenterFormId || center.id,
      name: center.trainingCentreName,
      location: center.location || ''
    }));
    
    res.json({ success: true, data: formattedCenters });
  } catch (error) {
    console.error('Error getting training centers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get students by center for center-wise analytics
 */
const getCenterWiseStudents = async (req, res) => {
  try {
    const instituteId = req.user?.userId;
    const { centerId } = req.params;
    
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found' });
    }
    
    const batchModel = require('../models/batchModel');
    const misStudentModel = require('../models/misStudentModel');
    
    // Get batches for this institute and center
    const allBatches = await batchModel.getAll(instituteId);
    const centerBatches = allBatches.filter(batch => batch.trainingCentreId === centerId);
    
    // Get all students from these batches
    const centerStudentIds = [];
    centerBatches.forEach(batch => {
      if (batch.selectedStudents && Array.isArray(batch.selectedStudents)) {
        centerStudentIds.push(...batch.selectedStudents);
      }
    });
    
    // Get student details and placement data
    const allStudents = await misStudentModel.getStudentsByInstitute(instituteId);
    const centerStudents = allStudents.filter(student => centerStudentIds.includes(student.studentsId));
    
    // Get placement data for these students
    const allPlacements = await MisPlacementAnalytics.getPlacementsByInstitute(instituteId);
    
    // Create student analytics
    const studentData = centerStudents.map(student => {
      const studentPlacements = allPlacements.filter(p => p.studentId === student.studentsId);
      const placedCount = studentPlacements.filter(p => p.status === 'Hired').length;
      const latestPlacement = studentPlacements[studentPlacements.length - 1];
      
      // Find student's batch
      const studentBatch = centerBatches.find(batch => 
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
        totalApplications: studentPlacements.length,
        status: placedCount > 0 ? 'Hired' : (latestPlacement?.status || 'Not Applied'),
        companyName: latestPlacement?.companyName || 'N/A'
      };
    });
    
    res.json({ success: true, data: studentData });
  } catch (error) {
    console.error('Error getting center students:', error);
    res.status(500).json({ success: false, message: error.message });
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

module.exports = {
  getAllPlacements,
  getPlacementStats,
  getPlacementsByType,
  getPlacementsByInstitute,
  getPlacementsByRecruiter,
  getDashboardSummary,
  getStudentWiseAnalytics,
  getSectorWiseAnalytics,
  getCenterWiseAnalytics,
  getStudentStatus,
  getTrainingCenters,
  getCenterWiseStudents
};