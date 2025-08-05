/**
 * Application Model
 * Handles job applications and profile views
 */
const staffModel = require('./staffModel');
const { v4: uuidv4 } = require('uuid');

/**
 * Apply for a job (supports both staff and institutes)
 */
const applyForJob = async (applicationData) => {
  try {
    const { applicantId, applicantType, recruiterId, jobId, jobTitle, companyName } = applicationData;
    
    let applicant, applications, recentActivity;
    
    if (applicantType === 'staff') {
      // Get staff profile
      applicant = await staffModel.getStaffProfile(applicantId);
      if (!applicant) throw new Error('Staff not found');
      
      applications = applicant.applications || [];
      recentActivity = applicant.recentActivity || [];
    } else if (applicantType === 'institute') {
      // Get institute profile from users table
      const dynamoService = require('../services/dynamoService');
      const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
      
      applicant = await dynamoService.getItem(USERS_TABLE, { userId: applicantId });
      if (!applicant || applicant.role !== 'institute') throw new Error('Institute not found');
      
      applications = applicant.applications || [];
      recentActivity = applicant.recentActivity || [];
    } else {
      throw new Error('Invalid applicant type');
    }
    
    // Check if already applied for this job
    const existingApplication = applications.find(app => 
      app.recruiterId === recruiterId && app.jobId === jobId
    );
    
    if (existingApplication) {
      return { alreadyApplied: true, application: existingApplication };
    }
    
    const application = {
      applicationId: uuidv4(),
      recruiterId,
      jobId,
      jobTitle,
      companyName,
      applicantType,
      appliedAt: new Date().toISOString(),
      status: 'Applied'
    };
    
    // For institutes, attach current students snapshot
    if (applicantType === 'institute') {
      try {
        const instituteStudentModel = require('./instituteStudentModel');
        const currentStudents = await instituteStudentModel.getStudentsByInstitute(applicantId);
        application.studentsSnapshot = currentStudents || [];
      } catch (error) {
        console.error('Error getting students for application:', error);
        application.studentsSnapshot = [];
      }
    }
    
    // Add to applications
    applications.push(application);
    
    // Add to recent activity
    recentActivity.unshift({
      id: uuidv4(),
      type: 'job_application',
      message: `You applied for ${jobTitle} at ${companyName}`,
      timestamp: new Date().toISOString()
    });
    
    if (applicantType === 'staff') {
      await staffModel.updateStaffProfile(applicantId, {
        applications,
        recentActivity: recentActivity.slice(0, 10)
      });
    } else {
      // Update institute in users table
      const dynamoService = require('../services/dynamoService');
      const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
      
      const updatedInstitute = {
        ...applicant,
        applications,
        recentActivity: recentActivity.slice(0, 10),
        updatedAt: new Date().toISOString()
      };
      
      await dynamoService.putItem(USERS_TABLE, updatedInstitute);
    }
    
    // Update recruiter's application count
    await updateRecruiterStats(recruiterId, 'application');
    
    return { alreadyApplied: false, application };
  } catch (error) {
    console.error('Apply for job error:', error);
    throw new Error('Failed to apply for job');
  }
};

/**
 * Update recruiter statistics
 */
const updateRecruiterStats = async (recruiterId, type) => {
  try {
    const dynamoService = require('../services/dynamoService');
    const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
    
    const recruiter = await dynamoService.getItem(USERS_TABLE, { userId: recruiterId });
    if (!recruiter) return;
    
    const stats = recruiter.stats || { applications: 0, hires: 0 };
    
    if (type === 'application') {
      stats.applications = (stats.applications || 0) + 1;
    } else if (type === 'hire') {
      stats.hires = (stats.hires || 0) + 1;
    }
    
    const updatedRecruiter = {
      ...recruiter,
      stats,
      updatedAt: new Date().toISOString()
    };
    
    await dynamoService.putItem(USERS_TABLE, updatedRecruiter);
  } catch (error) {
    console.error('Update recruiter stats error:', error);
  }
};

/**
 * Record profile view
 */
const recordProfileView = async (staffId, viewerName, viewerId) => {
  try {
    const staff = await staffModel.getStaffProfile(staffId);
    if (!staff) throw new Error('Staff not found');
    
    // Don't record if viewing own profile
    if (staffId === viewerId) {
      return { profileViews: staff.profileViews || 0 };
    }
    
    // Increment profile views
    const profileViews = (staff.profileViews || 0) + 1;
    
    // Add to recent activity
    const recentActivity = staff.recentActivity || [];
    recentActivity.unshift({
      id: uuidv4(),
      type: 'profile_view',
      message: `Your profile was viewed by ${viewerName}`,
      timestamp: new Date().toISOString()
    });
    
    await staffModel.updateStaffProfile(staffId, {
      profileViews,
      recentActivity: recentActivity.slice(0, 10)
    });
    
    return { profileViews };
  } catch (error) {
    console.error('Record profile view error:', error);
    throw new Error('Failed to record profile view');
  }
};

/**
 * Get staff dashboard data
 */
const getDashboardData = async (staffId) => {
  try {
    const staff = await staffModel.getStaffProfile(staffId);
    if (!staff) throw new Error('Staff not found');
    
    const applications = staff.applications || [];
    const recentActivity = staff.recentActivity || [];
    
    // Calculate application trend (last 6 months)
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const applicationTrend = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      const monthApplications = applications.filter(app => {
        const appDate = new Date(app.appliedAt);
        return appDate.getMonth() === date.getMonth() && appDate.getFullYear() === date.getFullYear();
      }).length;
      
      applicationTrend.push({
        month: monthName,
        applications: monthApplications
      });
    }
    
    return {
      totalApplications: applications.length,
      profileViews: staff.profileViews || 0,
      recentApplications: applications.slice(-5).reverse(),
      recentActivity: recentActivity.slice(0, 5),
      applicationTrend
    };
  } catch (error) {
    console.error('Get dashboard data error:', error);
    throw new Error('Failed to get dashboard data');
  }
};

/**
 * Get applied institutes for a recruiter
 */
const getAppliedInstitutes = async (recruiterId) => {
  try {
    const dynamoService = require('../services/dynamoService');
    const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
    const jobApplicationModel = require('./jobApplicationModel');
    
    // Get all job applications for this recruiter
    const { JOB_APPLICATIONS_TABLE } = require('../config/dynamodb');
    const applicationParams = {
      FilterExpression: 'recruiterID = :recruiterId',
      ExpressionAttributeValues: {
        ':recruiterId': recruiterId
      }
    };
    
    const jobApplications = await dynamoService.scanItems(JOB_APPLICATIONS_TABLE, applicationParams);
    
    // Get unique institute IDs from job applications
    const instituteIdsFromJobApps = [...new Set(jobApplications.map(app => app.instituteID))];
    
    // Get all institutes with profile data
    const params = {
      FilterExpression: '#role = :role',
      ExpressionAttributeNames: {
        '#role': 'role'
      },
      ExpressionAttributeValues: {
        ':role': 'institute'
      }
    };
    
    const institutes = await dynamoService.scanItems(USERS_TABLE, params);
    
    // Get institute profiles for additional data
    const instituteModel = require('./instituteModel');
    const institutesWithProfiles = await Promise.all(
      institutes.map(async (institute) => {
        try {
          const profile = await instituteModel.getProfileById(institute.userId);
          return { ...institute, ...profile };
        } catch (error) {
          return institute;
        }
      })
    );
    
    // Filter institutes that have applied to this recruiter's jobs (old flow OR new flow)
    const appliedInstitutes = institutesWithProfiles.filter(institute => {
      const oldFlowApplications = institute.applications || [];
      const hasOldFlowApplication = oldFlowApplications.some(app => app.recruiterId === recruiterId);
      const hasNewFlowApplication = instituteIdsFromJobApps.includes(institute.userId);
      return hasOldFlowApplication || hasNewFlowApplication;
    });
    
    // Format the response with applied jobs info
    const formattedInstitutes = await Promise.all(appliedInstitutes.map(async (institute) => {
      const oldFlowApplications = institute.applications || [];
      const recruiterOldFlowApps = oldFlowApplications.filter(app => app.recruiterId === recruiterId);
      
      // Get new flow applications for this institute and recruiter
      const newFlowApps = jobApplications.filter(app => app.instituteID === institute.userId);
      
      // Group new flow applications by job
      const jobGroups = {};
      newFlowApps.forEach(app => {
        if (!jobGroups[app.jobID]) {
          jobGroups[app.jobID] = {
            jobId: app.jobID,
            students: [],
            firstAppliedAt: app.timestamp
          };
        }
        jobGroups[app.jobID].students.push(app);
        if (new Date(app.timestamp) < new Date(jobGroups[app.jobID].firstAppliedAt)) {
          jobGroups[app.jobID].firstAppliedAt = app.timestamp;
        }
      });
      
      // Get job details for new flow applications
      const jobModel = require('./jobModel');
      const newFlowJobApplications = await Promise.all(
        Object.values(jobGroups).map(async (group) => {
          try {
            const job = await jobModel.getJobById(group.jobId);
            return {
              jobId: group.jobId,
              jobTitle: job ? job.title : 'Unknown Job',
              appliedAt: group.firstAppliedAt,
              status: 'Applied',
              studentsSnapshot: group.students,
              isNewFlow: true
            };
          } catch (error) {
            return {
              jobId: group.jobId,
              jobTitle: 'Unknown Job',
              appliedAt: group.firstAppliedAt,
              status: 'Applied',
              studentsSnapshot: group.students,
              isNewFlow: true
            };
          }
        })
      );
      
      // Combine old and new flow applications
      const allAppliedJobs = [
        ...recruiterOldFlowApps.map(app => ({ ...app, isNewFlow: false })),
        ...newFlowJobApplications
      ];
      
      return {
        instituteId: institute.userId,
        instituteName: institute.name || institute.instituteName,
        email: institute.email,
        phone: institute.phone || institute.phoneNumber,
        registrationNumber: institute.registrationNumber,
        profileImage: institute.profileImage || null,
        address: institute.address || '',
        website: institute.website || '',
        description: institute.description || '',
        establishedYear: institute.establishedYear || '',
        isVerified: institute.isVerified || false,
        badges: institute.badges || [],
        appliedJobs: allAppliedJobs,
        totalApplications: allAppliedJobs.length,
        latestApplication: allAppliedJobs.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))[0]
      };
    }));
    
    return formattedInstitutes;
  } catch (error) {
    console.error('Get applied institutes error:', error);
    throw new Error('Failed to get applied institutes');
  }
};

/**
 * Get my applications (for staff/institute)
 */
const getMyApplications = async (applicantId, applicantType) => {
  try {
    let applicant;
    
    if (applicantType === 'staff') {
      applicant = await staffModel.getStaffProfile(applicantId);
    } else if (applicantType === 'institute') {
      const dynamoService = require('../services/dynamoService');
      const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
      applicant = await dynamoService.getItem(USERS_TABLE, { userId: applicantId });
    }
    
    if (!applicant) throw new Error('Applicant not found');
    
    return applicant.applications || [];
  } catch (error) {
    console.error('Get my applications error:', error);
    throw new Error('Failed to get applications');
  }
};

/**
 * Get students for specific job application
 */
const getJobApplicationStudents = async (recruiterId, instituteId, jobId) => {
  try {
    const dynamoService = require('../services/dynamoService');
    const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
    const jobApplicationModel = require('./jobApplicationModel');
    
    // First check for new flow applications (job applications table)
    const { JOB_APPLICATIONS_TABLE } = require('../config/dynamodb');
    const newFlowParams = {
      FilterExpression: 'jobID = :jobId AND instituteID = :instituteId AND recruiterID = :recruiterId AND #status <> :hired AND #status <> :rejected',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':jobId': jobId,
        ':instituteId': instituteId,
        ':recruiterId': recruiterId,
        ':hired': 'hired',
        ':rejected': 'rejected'
      }
    };
    
    const newFlowApplications = await dynamoService.scanItems(JOB_APPLICATIONS_TABLE, newFlowParams);
    
    if (newFlowApplications && newFlowApplications.length > 0) {
      // New flow: Get actual student data for each application
      const instituteStudentModel = require('./instituteStudentModel');
      const students = await Promise.all(
        newFlowApplications.map(async (app) => {
          try {
            const student = await instituteStudentModel.getStudentById(app.studentID);
            return student ? { ...student, applicationStatus: app.status, applicationId: app.staffinnjob } : null;
          } catch (error) {
            console.error('Error getting student:', app.studentID, error);
            return null;
          }
        })
      );
      
      return students.filter(student => student !== null);
    }
    
    // Fallback to old flow
    const institute = await dynamoService.getItem(USERS_TABLE, { userId: instituteId });
    if (!institute || institute.role !== 'institute') {
      throw new Error('Institute not found');
    }
    
    // Find the specific application
    const applications = institute.applications || [];
    const application = applications.find(app => 
      app.recruiterId === recruiterId && app.jobId === jobId
    );
    
    if (!application) {
      throw new Error('Application not found');
    }
    
    // Get students snapshot from the application
    const studentsSnapshot = application.studentsSnapshot || [];
    
    // Filter out students who have been hired or rejected
    const processedStudentIds = await jobApplicationModel.getProcessedStudentIds(jobId);
    
    const availableStudents = studentsSnapshot.filter(student => 
      !processedStudentIds.includes(student.instituteStudntsID)
    );
    
    return availableStudents;
  } catch (error) {
    console.error('Get job application students error:', error);
    throw new Error('Failed to get students for job application');
  }
};

module.exports = {
  applyForJob,
  recordProfileView,
  getDashboardData,
  updateRecruiterStats,
  getAppliedInstitutes,
  getMyApplications,
  getJobApplicationStudents
};