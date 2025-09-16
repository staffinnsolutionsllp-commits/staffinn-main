/**
 * Job Application Model
 * Handles job applications tracking in dedicated table
 */
const dynamoService = require('../services/dynamoService');
const { JOB_APPLICATIONS_TABLE } = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

/**
 * Create job application record
 */
const createJobApplication = async (applicationData) => {
  try {
    const { studentID, jobID, recruiterID, instituteID, status = 'pending' } = applicationData;
    
    const applicationRecord = {
      staffinnjob: `${jobID}_${studentID}`, // Composite key for uniqueness
      studentID,
      jobID,
      recruiterID,
      instituteID,
      status,
      timestamp: new Date().toISOString()
    };
    
    await dynamoService.putItem(JOB_APPLICATIONS_TABLE, applicationRecord);
    return applicationRecord;
  } catch (error) {
    console.error('Create job application error:', error);
    throw new Error('Failed to create job application record');
  }
};

/**
 * Update job application status
 */
const updateJobApplicationStatus = async (jobID, studentID, status) => {
  try {
    const staffinnjob = `${jobID}_${studentID}`;
    
    const updateData = {
      status,
      updatedAt: new Date().toISOString()
    };
    
    await dynamoService.simpleUpdate(JOB_APPLICATIONS_TABLE, { staffinnjob }, updateData);
    return updateData;
  } catch (error) {
    console.error('Update job application status error:', error);
    throw new Error('Failed to update job application status');
  }
};

/**
 * Get job application by job and student
 */
const getJobApplication = async (jobID, studentID) => {
  try {
    const staffinnjob = `${jobID}_${studentID}`;
    const application = await dynamoService.getItem(JOB_APPLICATIONS_TABLE, { staffinnjob });
    return application;
  } catch (error) {
    console.error('Get job application error:', error);
    return null;
  }
};

/**
 * Get all applications for a job
 */
const getJobApplications = async (jobID) => {
  try {
    const params = {
      FilterExpression: 'jobID = :jobID',
      ExpressionAttributeValues: {
        ':jobID': jobID
      }
    };
    
    const applications = await dynamoService.scanItems(JOB_APPLICATIONS_TABLE, params);
    return applications;
  } catch (error) {
    console.error('Get job applications error:', error);
    throw new Error('Failed to get job applications');
  }
};

/**
 * Get hired/rejected student IDs for a job
 */
const getProcessedStudentIds = async (jobID) => {
  try {
    const params = {
      FilterExpression: 'jobID = :jobID AND (#status = :hired OR #status = :rejected)',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':jobID': jobID,
        ':hired': 'hired',
        ':rejected': 'rejected'
      }
    };
    
    const applications = await dynamoService.scanItems(JOB_APPLICATIONS_TABLE, params);
    return applications.map(app => app.studentID);
  } catch (error) {
    console.error('Get processed student IDs error:', error);
    return [];
  }
};

/**
 * Get applied student IDs for a job by institute
 */
const getAppliedStudentIds = async (jobID, instituteID) => {
  try {
    const params = {
      FilterExpression: 'jobID = :jobID AND instituteID = :instituteID',
      ExpressionAttributeValues: {
        ':jobID': jobID,
        ':instituteID': instituteID
      }
    };
    
    const applications = await dynamoService.scanItems(JOB_APPLICATIONS_TABLE, params);
    return applications.map(app => app.studentID);
  } catch (error) {
    console.error('Get applied student IDs error:', error);
    return [];
  }
};

/**
 * Create multiple job applications for students
 */
const createBulkJobApplications = async (applicationDataArray) => {
  try {
    const results = [];
    
    for (const applicationData of applicationDataArray) {
      const { studentID, jobID, recruiterID, instituteID, status = 'pending' } = applicationData;
      
      const applicationRecord = {
        staffinnjob: `${jobID}_${studentID}`,
        studentID,
        jobID,
        recruiterID,
        instituteID,
        status,
        timestamp: new Date().toISOString()
      };
      
      await dynamoService.putItem(JOB_APPLICATIONS_TABLE, applicationRecord);
      results.push(applicationRecord);
    }
    
    return results;
  } catch (error) {
    console.error('Create bulk job applications error:', error);
    throw new Error('Failed to create bulk job applications');
  }
};

/**
 * Get all applications for a specific student with job and recruiter details
 */
const getStudentApplicationHistory = async (studentID) => {
  try {
    const params = {
      FilterExpression: 'studentID = :studentID',
      ExpressionAttributeValues: {
        ':studentID': studentID
      }
    };
    
    const applications = await dynamoService.scanItems(JOB_APPLICATIONS_TABLE, params);
    
    if (!applications || applications.length === 0) {
      return [];
    }
    
    // Get job and recruiter details for each application
    const jobModel = require('./jobModel');
    const userModel = require('./userModel');
    
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        try {
          // Get job details
          const job = await jobModel.getJobById(app.jobID);
          
          // Get recruiter details
          const recruiter = await userModel.findUserById(app.recruiterID);
          
          return {
            ...app,
            jobTitle: job ? job.title : 'Unknown Job',
            companyName: recruiter ? (recruiter.name || recruiter.companyName || 'Unknown Company') : 'Unknown Company',
            recruiterName: recruiter ? (recruiter.recruiterName || recruiter.name || 'Unknown Recruiter') : 'Unknown Recruiter',
            appliedDate: app.timestamp,
            lastUpdated: app.updatedAt || app.timestamp
          };
        } catch (error) {
          console.error('Error enriching application:', app.staffinnjob, error);
          return {
            ...app,
            jobTitle: 'Unknown Job',
            companyName: 'Unknown Company',
            recruiterName: 'Unknown Recruiter',
            appliedDate: app.timestamp,
            lastUpdated: app.updatedAt || app.timestamp
          };
        }
      })
    );
    
    // Sort by most recent first
    return enrichedApplications.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  } catch (error) {
    console.error('Get student application history error:', error);
    throw new Error('Failed to get student application history');
  }
};

/**
 * Get applications for a specific job and institute with student details
 */
const getJobInstituteApplications = async (jobID, instituteID) => {
  try {
    const params = {
      FilterExpression: 'jobID = :jobID AND instituteID = :instituteID',
      ExpressionAttributeValues: {
        ':jobID': jobID,
        ':instituteID': instituteID
      }
    };
    
    const applications = await dynamoService.scanItems(JOB_APPLICATIONS_TABLE, params);
    
    if (!applications || applications.length === 0) {
      return [];
    }
    
    // Get student details for each application
    const instituteStudentModel = require('./instituteStudentModel');
    
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        try {
          const student = await instituteStudentModel.getStudentById(app.studentID);
          return {
            ...app,
            student: student || {
              instituteStudntsID: app.studentID,
              fullName: 'Unknown Student',
              email: 'N/A',
              phoneNumber: 'N/A'
            }
          };
        } catch (error) {
          console.error('Error getting student details:', app.studentID, error);
          return {
            ...app,
            student: {
              instituteStudntsID: app.studentID,
              fullName: 'Unknown Student',
              email: 'N/A',
              phoneNumber: 'N/A'
            }
          };
        }
      })
    );
    
    return enrichedApplications;
  } catch (error) {
    console.error('Get job institute applications error:', error);
    throw new Error('Failed to get job institute applications');
  }
};

/**
 * Get unique students who have been hired at least once for a specific institute
 */
const getUniqueHiredStudentsByInstitute = async (instituteID) => {
  try {
    const params = {
      FilterExpression: 'instituteID = :instituteID AND #status = :hired',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':instituteID': instituteID,
        ':hired': 'hired'
      }
    };
    
    const hiredApplications = await dynamoService.scanItems(JOB_APPLICATIONS_TABLE, params);
    
    // Get unique student IDs who have been hired at least once
    const uniqueHiredStudentIds = [...new Set(hiredApplications.map(app => app.studentID))];
    
    return uniqueHiredStudentIds;
  } catch (error) {
    console.error('Get unique hired students by institute error:', error);
    return [];
  }
};

/**
 * Calculate average salary package for hired students of a specific institute
 */
const getAverageSalaryPackage = async (instituteID) => {
  try {
    const params = {
      FilterExpression: 'instituteID = :instituteID AND #status = :hired',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':instituteID': instituteID,
        ':hired': 'hired'
      }
    };
    
    const hiredApplications = await dynamoService.scanItems(JOB_APPLICATIONS_TABLE, params);
    
    if (!hiredApplications || hiredApplications.length === 0) {
      return 0;
    }
    
    // Get job details for each hired application
    const jobModel = require('./jobModel');
    const salaryValues = [];
    
    for (const app of hiredApplications) {
      try {
        const job = await jobModel.getJobById(app.jobID);
        if (job) {
          const salaryField = job.salaryRange || job.salary;
          if (salaryField) {
            // Parse salary range (e.g., "3-4 LPA" or "5-6 LPA")
            const salaryMatch = salaryField.match(/([0-9.]+)\s*-\s*([0-9.]+)\s*LPA/i);
            if (salaryMatch) {
              const maxSalary = parseFloat(salaryMatch[2]); // Use max value from range
              salaryValues.push(maxSalary);
            } else {
              // Try to parse single value (e.g., "4 LPA")
              const singleMatch = salaryField.match(/([0-9.]+)\s*LPA/i);
              if (singleMatch) {
                const salary = parseFloat(singleMatch[1]);
                salaryValues.push(salary);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error getting job details for salary calculation:', app.jobID, error);
        // Continue with next application
      }
    }
    
    if (salaryValues.length === 0) {
      return 0;
    }
    
    // Calculate average
    const avgSalary = salaryValues.reduce((sum, salary) => sum + salary, 0) / salaryValues.length;
    return Math.round(avgSalary * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    console.error('Get average salary package error:', error);
    return 0;
  }
};

/**
 * Get all applications
 */
const getAllApplications = async () => {
  try {
    const applications = await dynamoService.scanItems(JOB_APPLICATIONS_TABLE);
    return applications || [];
  } catch (error) {
    console.error('Get all applications error:', error);
    return [];
  }
};

/**
 * Get applications by institute and recruiter
 */
const getApplicationsByInstituteAndRecruiter = async (instituteId, recruiterId) => {
  try {
    const params = {
      FilterExpression: 'instituteID = :instituteID AND recruiterID = :recruiterID',
      ExpressionAttributeValues: {
        ':instituteID': instituteId,
        ':recruiterID': recruiterId
      }
    };
    
    const applications = await dynamoService.scanItems(JOB_APPLICATIONS_TABLE, params);
    return applications || [];
  } catch (error) {
    console.error('Get applications by institute and recruiter error:', error);
    return [];
  }
};

/**
 * Get applications by student
 */
const getApplicationsByStudent = async (studentId) => {
  try {
    const params = {
      FilterExpression: 'studentID = :studentID',
      ExpressionAttributeValues: {
        ':studentID': studentId
      }
    };
    
    const applications = await dynamoService.scanItems(JOB_APPLICATIONS_TABLE, params);
    return applications || [];
  } catch (error) {
    console.error('Get applications by student error:', error);
    return [];
  }
};

module.exports = {
  createJobApplication,
  updateJobApplicationStatus,
  getJobApplication,
  getJobApplications,
  getProcessedStudentIds,
  getAppliedStudentIds,
  createBulkJobApplications,
  getStudentApplicationHistory,
  getJobInstituteApplications,
  getUniqueHiredStudentsByInstitute,
  getAverageSalaryPackage,
  getAllApplications,
  getApplicationsByInstituteAndRecruiter,
  getApplicationsByStudent
};