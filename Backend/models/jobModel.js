/**
 * Job Model
 * Handles job-related data operations with DynamoDB
 */

const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');
const userModel = require('./userModel');

// Get table names from environment variables
const JOBS_TABLE = 'staffinn-jobs';

/**
 * Create a new job
 * @param {object} jobData - Job data
 * @returns {Promise<object>} - Created job object
 */
const createJob = async (jobData) => {
  try {
    // Generate job ID
    const jobId = uuidv4();
    
    // Create job object
    const job = {
      jobId,
      recruiterId: jobData.recruiterId,
      title: jobData.title,
      department: jobData.department,
      jobType: jobData.jobType,
      salary: jobData.salary,
      experience: jobData.experience,
      location: jobData.location,
      description: jobData.description,
      skills: Array.isArray(jobData.skills) ? jobData.skills : jobData.skills.split(',').map(s => s.trim()),
      status: jobData.status || 'Active',
      postedDate: jobData.postedDate || new Date().toISOString(),
      applications: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store job in DynamoDB jobs table
    await dynamoService.putItem(JOBS_TABLE, job);
    
    return job;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

/**
 * Get job by ID
 * @param {string} jobId - Job ID
 * @returns {Promise<object|null>} - Job object or null
 */
const getJobById = async (jobId) => {
  try {
    const job = await dynamoService.getItem(JOBS_TABLE, { jobId });
    
    if (!job) {
      return null;
    }
    
    return job;
  } catch (error) {
    console.error('Error getting job by ID:', error);
    throw error;
  }
};

/**
 * Get all jobs by recruiter
 * @param {string} recruiterId - Recruiter ID
 * @returns {Promise<Array>} - Array of jobs
 */
const getJobsByRecruiter = async (recruiterId) => {
  try {
    const params = {
      FilterExpression: '#recruiterId = :recruiterId',
      ExpressionAttributeNames: {
        '#recruiterId': 'recruiterId'
      },
      ExpressionAttributeValues: {
        ':recruiterId': recruiterId
      }
    };
    
    const jobs = await dynamoService.scanItems(JOBS_TABLE, params);
    
    // Sort by creation date (newest first)
    return jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error getting jobs by recruiter:', error);
    throw error;
  }
};

/**
 * Get all active jobs with recruiter information
 * @returns {Promise<Array>} - Array of jobs with recruiter info
 */
const getAllActiveJobsWithRecruiters = async () => {
  try {
    // Get all active jobs
    const params = {
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'Active'
      }
    };
    
    const jobs = await dynamoService.scanItems(JOBS_TABLE, params);
    
    // Get recruiter information for each job
    const jobsWithRecruiters = await Promise.all(
      jobs.map(async (job) => {
        try {
          // Get recruiter info
          const recruiter = await userModel.findUserById(job.recruiterId);
          
          return {
            ...job,
            recruiterInfo: recruiter ? {
              companyName: recruiter.name || recruiter.companyName,
              industry: recruiter.industry || 'Technology',
              location: recruiter.location || job.location,
              website: recruiter.website,
              verified: true
            } : null
          };
        } catch (error) {
          console.error('Error getting recruiter info for job:', job.jobId, error);
          return {
            ...job,
            recruiterInfo: null
          };
        }
      })
    );
    
    // Sort by posted date (newest first)
    return jobsWithRecruiters.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
  } catch (error) {
    console.error('Error getting all active jobs with recruiters:', error);
    throw error;
  }
};

/**
 * Get job with recruiter information
 * @param {string} jobId - Job ID
 * @returns {Promise<object|null>} - Job with recruiter info or null
 */
const getJobWithRecruiterInfo = async (jobId) => {
  try {
    // Get job
    const job = await getJobById(jobId);
    
    if (!job) {
      return null;
    }
    
    // Get recruiter info
    const recruiter = await userModel.findUserById(job.recruiterId);
    
    return {
      ...job,
      recruiterInfo: recruiter ? {
        companyName: recruiter.name || recruiter.companyName,
        industry: recruiter.industry || 'Technology',
        location: recruiter.location || job.location,
        website: recruiter.website,
        recruiterName: recruiter.recruiterName || 'HR Manager',
        designation: recruiter.designation || 'HR Manager',
        verified: true
      } : null
    };
  } catch (error) {
    console.error('Error getting job with recruiter info:', error);
    throw error;
  }
};

/**
 * Update job
 * @param {string} jobId - Job ID
 * @param {object} updateData - Data to update
 * @returns {Promise<object>} - Updated job object
 */
const updateJob = async (jobId, updateData) => {
  try {
    // Get current job
    const currentJob = await getJobById(jobId);
    if (!currentJob) {
      throw new Error('Job not found');
    }

    // Prepare updated job data
    const updatedJobData = {
      ...currentJob,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    // Handle skills array conversion
    if (updateData.skills && typeof updateData.skills === 'string') {
      updatedJobData.skills = updateData.skills.split(',').map(s => s.trim());
    }

    // Update the job in DynamoDB
    await dynamoService.putItem(JOBS_TABLE, updatedJobData);
    
    return updatedJobData;
  } catch (error) {
    console.error('Error updating job:', error);
    throw error;
  }
};

/**
 * Delete job
 * @param {string} jobId - Job ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteJob = async (jobId) => {
  try {
    await dynamoService.deleteItem(JOBS_TABLE, { jobId });
    return true;
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
};

/**
 * Search jobs by criteria
 * @param {object} searchCriteria - Search criteria
 * @returns {Promise<Array>} - Array of matching jobs
 */
const searchJobs = async (searchCriteria = {}) => {
  try {
    let filterExpression = '';
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    // Add search filters
    if (searchCriteria.status) {
      filterExpression += filterExpression ? ' AND #status = :status' : '#status = :status';
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = searchCriteria.status;
    }
    
    if (searchCriteria.location) {
      filterExpression += filterExpression ? ' AND contains(#location, :location)' : 'contains(#location, :location)';
      expressionAttributeNames['#location'] = 'location';
      expressionAttributeValues[':location'] = searchCriteria.location;
    }
    
    if (searchCriteria.department) {
      filterExpression += filterExpression ? ' AND #department = :department' : '#department = :department';
      expressionAttributeNames['#department'] = 'department';
      expressionAttributeValues[':department'] = searchCriteria.department;
    }
    
    if (searchCriteria.jobType) {
      filterExpression += filterExpression ? ' AND #jobType = :jobType' : '#jobType = :jobType';
      expressionAttributeNames['#jobType'] = 'jobType';
      expressionAttributeValues[':jobType'] = searchCriteria.jobType;
    }
    
    const params = filterExpression ? {
      FilterExpression: filterExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    } : {};
    
    const jobs = await dynamoService.scanItems(JOBS_TABLE, params);
    
    // Sort by posted date (newest first)
    return jobs.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw error;
  }
};

/**
 * Increment application count for a job
 * @param {string} jobId - Job ID
 * @returns {Promise<object>} - Updated job object
 */
const incrementApplicationCount = async (jobId) => {
  try {
    const currentJob = await getJobById(jobId);
    if (!currentJob) {
      throw new Error('Job not found');
    }

    const updatedJob = {
      ...currentJob,
      applications: (currentJob.applications || 0) + 1,
      updatedAt: new Date().toISOString()
    };

    await dynamoService.putItem(JOBS_TABLE, updatedJob);
    
    return updatedJob;
  } catch (error) {
    console.error('Error incrementing application count:', error);
    throw error;
  }
};

/**
 * Get trending jobs sorted by application count
 * @param {number} limit - Number of jobs to return
 * @returns {Promise<Array>} - Array of trending jobs with recruiter info
 */
const getTrendingJobs = async (limit = 8) => {
  try {
    // Get all active jobs
    const activeJobs = await getAllActiveJobsWithRecruiters();
    
    if (!activeJobs || activeJobs.length === 0) {
      return [];
    }
    
    // Get application counts from job applications table
    const jobApplicationModel = require('./jobApplicationModel');
    
    const jobsWithApplicationCounts = await Promise.all(
      activeJobs.map(async (job) => {
        try {
          // Get applications for this job from the job applications table
          const applications = await jobApplicationModel.getJobApplications(job.jobId);
          const applicationCount = applications ? applications.length : 0;
          
          return {
            ...job,
            applicationCount,
            // Keep the original applications field for backward compatibility
            applications: job.applications || 0
          };
        } catch (error) {
          console.error('Error getting application count for job:', job.jobId, error);
          return {
            ...job,
            applicationCount: 0,
            applications: job.applications || 0
          };
        }
      })
    );
    
    // Sort by application count (descending) and then by posted date (newest first)
    const sortedJobs = jobsWithApplicationCounts.sort((a, b) => {
      if (b.applicationCount !== a.applicationCount) {
        return b.applicationCount - a.applicationCount;
      }
      return new Date(b.postedDate) - new Date(a.postedDate);
    });
    
    // Return limited results
    return sortedJobs.slice(0, limit);
  } catch (error) {
    console.error('Error getting trending jobs:', error);
    throw error;
  }
};

/**
 * Get jobs posted today with recruiter information
 * @param {number} limit - Number of jobs to return
 * @returns {Promise<Array>} - Array of today's jobs with recruiter info
 */
const getTodaysJobs = async (limit = 10) => {
  try {
    // Get today's date in ISO format (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    
    // Get tomorrow's date in ISO format (start of next day)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString();
    
    // Get jobs posted today
    const params = {
      FilterExpression: '#status = :status AND #postedDate >= :todayStart AND #postedDate < :tomorrowStart',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#postedDate': 'postedDate'
      },
      ExpressionAttributeValues: {
        ':status': 'Active',
        ':todayStart': todayISO,
        ':tomorrowStart': tomorrowISO
      }
    };
    
    const jobs = await dynamoService.scanItems(JOBS_TABLE, params);
    
    // Get recruiter information for each job
    const jobsWithRecruiters = await Promise.all(
      jobs.map(async (job) => {
        try {
          // Get recruiter info
          const recruiter = await userModel.findUserById(job.recruiterId);
          
          return {
            ...job,
            recruiterInfo: recruiter ? {
              companyName: recruiter.name || recruiter.companyName,
              industry: recruiter.industry || 'Technology',
              location: recruiter.location || job.location,
              website: recruiter.website,
              recruiterName: recruiter.recruiterName || 'HR Manager',
              designation: recruiter.designation || 'HR Manager',
              verified: true
            } : null
          };
        } catch (error) {
          console.error('Error getting recruiter info for job:', job.jobId, error);
          return {
            ...job,
            recruiterInfo: null
          };
        }
      })
    );
    
    // Sort by posted date (newest first) and limit results
    const sortedJobs = jobsWithRecruiters
      .sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate))
      .slice(0, limit);
    
    return sortedJobs;
  } catch (error) {
    console.error('Error getting today\'s jobs:', error);
    throw error;
  }
};

module.exports = {
  createJob,
  getJobById,
  getJobsByRecruiter,
  getAllActiveJobsWithRecruiters,
  getJobWithRecruiterInfo,
  updateJob,
  deleteJob,
  searchJobs,
  incrementApplicationCount,
  getTrendingJobs,
  getTodaysJobs
};