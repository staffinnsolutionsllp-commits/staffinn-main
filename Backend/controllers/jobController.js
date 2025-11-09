/**
 * Job Controller
 * Handles job posting and management
 */
const userModel = require('../models/userModel');
const jobModel = require('../models/jobModel');
const jobApplicationModel = require('../models/jobApplicationModel');
const jwtUtils = require('../utils/jwtUtils');
const { validateJobPosting } = require('../utils/validation');

/**
 * Create a new job posting
 * @route POST /api/jobs
 */
const createJob = async (req, res) => {
  try {
    console.log('Job creation request:', req.body);
    console.log('User from token:', req.user);
    
    // Check if user exists
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Verify user exists in database
    const user = await userModel.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Validate job posting data
    const { error, value } = validateJobPosting(req.body);
    
    if (error) {
      console.log('Job validation error:', error);
      return res.status(400).json({
        success: false,
        message: error
      });
    }
    
    // Add recruiter ID to job data
    const jobData = {
      ...value,
      recruiterId: req.user.userId,
      postedDate: new Date().toISOString(),
      applications: 0,
      status: value.status || 'Active'
    };
    
    // Create job
    const job = await jobModel.createJob(jobData);
    
    // Send notifications to followers
    try {
      const { sendJobNotificationToFollowers } = require('../controllers/notificationController');
      await sendJobNotificationToFollowers(req.user.userId, job);
    } catch (notificationError) {
      console.error('Failed to send job notifications:', notificationError);
      // Don't fail job creation if notifications fail
    }
    
    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: job
    });
    
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create job'
    });
  }
};

/**
 * Get all jobs by recruiter
 * @route GET /api/jobs/recruiter
 */
const getJobsByRecruiter = async (req, res) => {
  try {
    const recruiterId = req.user.userId;
    
    // Get all jobs by this recruiter
    const jobs = await jobModel.getJobsByRecruiter(recruiterId);
    
    res.status(200).json({
      success: true,
      data: jobs
    });
    
  } catch (error) {
    console.error('Get jobs by recruiter error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get jobs'
    });
  }
};

/**
 * Get all active jobs (public)
 * @route GET /api/jobs/public
 */
const getAllActiveJobs = async (req, res) => {
  try {
    // Get all active jobs with recruiter info
    const jobs = await jobModel.getAllActiveJobsWithRecruiters();
    
    res.status(200).json({
      success: true,
      data: jobs
    });
    
  } catch (error) {
    console.error('Get all active jobs error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get jobs'
    });
  }
};

/**
 * Update job
 * @route PUT /api/jobs/:jobId
 */
const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const recruiterId = req.user.userId;
    const updateData = req.body;
    
    // Check if job exists and belongs to this recruiter
    const existingJob = await jobModel.getJobById(jobId);
    if (!existingJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    if (existingJob.recruiterId !== recruiterId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own jobs.'
      });
    }
    
    // Remove fields that shouldn't be updated directly
    delete updateData.jobId;
    delete updateData.recruiterId;
    delete updateData.postedDate;
    delete updateData.applications;
    
    // Update job
    const updatedJob = await jobModel.updateJob(jobId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob
    });
    
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update job'
    });
  }
};

/**
 * Delete job
 * @route DELETE /api/jobs/:jobId
 */
const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const recruiterId = req.user.userId;
    
    // Check if job exists and belongs to this recruiter
    const existingJob = await jobModel.getJobById(jobId);
    if (!existingJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    if (existingJob.recruiterId !== recruiterId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own jobs.'
      });
    }
    
    // Delete job
    await jobModel.deleteJob(jobId);
    
    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete job'
    });
  }
};

/**
 * Get job by ID (public)
 * @route GET /api/jobs/:jobId
 */
const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Get job with recruiter info
    const job = await jobModel.getJobWithRecruiterInfo(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: job
    });
    
  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get job'
    });
  }
};

/**
 * Get trending jobs (public)
 * @route GET /api/jobs/trending
 */
const getTrendingJobs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    // Get trending jobs sorted by application count
    const trendingJobs = await jobModel.getTrendingJobs(limit);
    
    res.status(200).json({
      success: true,
      data: trendingJobs
    });
    
  } catch (error) {
    console.error('Get trending jobs error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get trending jobs'
    });
  }
};

/**
 * Get today's jobs for Job Alerts (public)
 * @route GET /api/jobs/todays-jobs
 */
const getTodaysJobs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get today's jobs with recruiter info
    const todaysJobs = await jobModel.getTodaysJobs(limit);
    
    res.status(200).json({
      success: true,
      data: todaysJobs
    });
    
  } catch (error) {
    console.error('Get todays jobs error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get todays jobs'
    });
  }
};

module.exports = {
  createJob,
  getJobsByRecruiter,
  getAllActiveJobs,
  updateJob,
  deleteJob,
  getJobById,
  getTrendingJobs,
  getTodaysJobs
};