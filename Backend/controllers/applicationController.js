/**
 * Application Controller
 * Handles job applications and profile views
 */
const applicationModel = require('../models/applicationModel');

/**
 * Apply for a job
 * @route POST /api/applications/apply
 */
const applyForJob = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const { recruiterId, jobId, jobTitle, companyName } = req.body;
    
    if (!recruiterId || !jobId || !jobTitle || !companyName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    const applicationData = {
      staffId: req.user.userId,
      recruiterId,
      jobId,
      jobTitle,
      companyName
    };
    
    const application = await applicationModel.applyForJob(applicationData);
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
    
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to apply for job'
    });
  }
};

/**
 * Record profile view
 * @route POST /api/applications/profile-view
 */
const recordProfileView = async (req, res) => {
  try {
    const { staffId } = req.body;
    const viewerName = req.user?.fullName || req.user?.name || 'Anonymous User';
    const viewerId = req.user?.userId;
    
    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID is required'
      });
    }
    
    const result = await applicationModel.recordProfileView(staffId, viewerName, viewerId);
    
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Record profile view error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record profile view'
    });
  }
};

/**
 * Get dashboard data
 * @route GET /api/applications/dashboard
 */
const getDashboardData = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const dashboardData = await applicationModel.getDashboardData(req.user.userId);
    
    res.status(200).json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get dashboard data'
    });
  }
};

module.exports = {
  applyForJob,
  recordProfileView,
  getDashboardData
};