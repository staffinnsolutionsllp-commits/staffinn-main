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
    
    // Determine applicant type based on user role
    const applicantType = req.user.role === 'institute' ? 'institute' : 'staff';
    
    // Only allow staff and institutes to apply
    if (applicantType !== 'staff' && applicantType !== 'institute') {
      return res.status(403).json({
        success: false,
        message: 'Only staff members and institutes can apply for jobs'
      });
    }
    
    const applicationData = {
      applicantId: req.user.userId,
      applicantType,
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

/**
 * Get applied institutes for recruiter
 * @route GET /api/applications/institutes
 */
const getAppliedInstitutes = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Only recruiters can access this endpoint'
      });
    }
    
    const institutes = await applicationModel.getAppliedInstitutes(req.user.userId);
    
    res.status(200).json({
      success: true,
      data: institutes
    });
    
  } catch (error) {
    console.error('Get applied institutes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get applied institutes'
    });
  }
};

/**
 * Get students of an institute
 * @route GET /api/applications/institutes/:instituteId/students
 */
const getInstituteStudents = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Only recruiters can access this endpoint'
      });
    }
    
    const { instituteId } = req.params;
    
    if (!instituteId) {
      return res.status(400).json({
        success: false,
        message: 'Institute ID is required'
      });
    }
    
    // Verify that this institute has applied to this recruiter's jobs
    const appliedInstitutes = await applicationModel.getAppliedInstitutes(req.user.userId);
    const institute = appliedInstitutes.find(inst => inst.instituteId === instituteId);
    
    if (!institute) {
      return res.status(403).json({
        success: false,
        message: 'This institute has not applied to your jobs'
      });
    }
    
    // Get students from institute student model
    const instituteStudentModel = require('../models/instituteStudentModel');
    const students = await instituteStudentModel.getStudentsByInstitute(instituteId);
    
    res.status(200).json({
      success: true,
      data: students
    });
    
  } catch (error) {
    console.error('Get institute students error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get institute students'
    });
  }
};

/**
 * Get my applications (for staff/institute)
 * @route GET /api/applications/my-applications
 */
const getMyApplications = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const applicantType = req.user.role === 'institute' ? 'institute' : 'staff';
    const applications = await applicationModel.getMyApplications(req.user.userId, applicantType);
    
    res.status(200).json({
      success: true,
      data: applications
    });
    
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get applications'
    });
  }
};

/**
 * Get students for specific job application
 * @route GET /api/applications/institutes/:instituteId/jobs/:jobId/students
 */
const getJobApplicationStudents = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Only recruiters can access this endpoint'
      });
    }
    
    const { instituteId, jobId } = req.params;
    
    // First try to get students from new flow (job applications table)
    const jobApplicationModel = require('../models/jobApplicationModel');
    const newFlowApplications = await jobApplicationModel.getJobInstituteApplications(jobId, instituteId);
    
    if (newFlowApplications && newFlowApplications.length > 0) {
      // Filter out students who have been hired or rejected
      const pendingApplications = newFlowApplications.filter(app => 
        app.status !== 'hired' && app.status !== 'rejected'
      );
      
      // Return only pending students
      const students = pendingApplications.map(app => ({
        ...app.student,
        applicationStatus: app.status,
        applicationId: app.staffinnjob,
        appliedAt: app.timestamp
      }));
      
      return res.status(200).json({
        success: true,
        data: students,
        source: 'new_flow'
      });
    }
    
    // Fallback to old flow
    const students = await applicationModel.getJobApplicationStudents(req.user.userId, instituteId, jobId);
    
    res.status(200).json({
      success: true,
      data: students,
      source: 'old_flow'
    });
    
  } catch (error) {
    console.error('Get job application students error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get students'
    });
  }
};

/**
 * Apply students to a job (Institute functionality)
 * @route POST /api/applications/apply-students
 */
const applyStudentsToJob = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    if (req.user.role !== 'institute') {
      return res.status(403).json({
        success: false,
        message: 'Only institutes can apply students to jobs'
      });
    }
    
    const { jobId, recruiterId, studentIds } = req.body;
    
    if (!jobId || !recruiterId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Job ID, recruiter ID, and student IDs are required'
      });
    }
    
    const jobApplicationModel = require('../models/jobApplicationModel');
    
    // Filter out students who have already applied
    const existingApplications = await Promise.all(
      studentIds.map(async (studentId) => {
        const existing = await jobApplicationModel.getJobApplication(jobId, studentId);
        return existing ? studentId : null;
      })
    );
    
    const alreadyAppliedIds = existingApplications.filter(id => id !== null);
    const newStudentIds = studentIds.filter(id => !alreadyAppliedIds.includes(id));
    
    if (newStudentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All selected students have already been applied to this job',
        data: {
          alreadyAppliedCount: alreadyAppliedIds.length,
          alreadyAppliedIds
        }
      });
    }
    
    // Create application records for new students only
    const applicationDataArray = newStudentIds.map(studentId => ({
      studentID: studentId,
      jobID: jobId,
      recruiterID: recruiterId,
      instituteID: req.user.userId,
      status: 'pending'
    }));
    
    const applications = await jobApplicationModel.createBulkJobApplications(applicationDataArray);
    
    res.status(201).json({
      success: true,
      message: `Successfully applied ${newStudentIds.length} students to the job`,
      data: {
        appliedCount: applications.length,
        applications,
        alreadyAppliedCount: alreadyAppliedIds.length,
        skippedStudents: alreadyAppliedIds
      }
    });
    
  } catch (error) {
    console.error('Apply students to job error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to apply students to job'
    });
  }
};

/**
 * Get students with application status for a job (Institute functionality)
 * @route GET /api/applications/job/:jobId/students-status
 */
const getStudentsApplicationStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    if (req.user.role !== 'institute') {
      return res.status(403).json({
        success: false,
        message: 'Only institutes can access this endpoint'
      });
    }
    
    const { jobId } = req.params;
    const instituteId = req.user.userId;
    
    // Get all students from institute
    const instituteStudentModel = require('../models/instituteStudentModel');
    const allStudents = await instituteStudentModel.getStudentsByInstitute(instituteId);
    
    // Get applied student IDs and their status for this job
    const jobApplicationModel = require('../models/jobApplicationModel');
    const applications = await jobApplicationModel.getJobInstituteApplications(jobId, instituteId);
    
    // Create a map of student ID to application status
    const applicationStatusMap = {};
    applications.forEach(app => {
      applicationStatusMap[app.studentID] = {
        hasApplied: true,
        status: app.status,
        appliedAt: app.timestamp
      };
    });
    
    // Mark students with application status - only show students who haven't been hired/rejected
    const studentsWithStatus = allStudents
      .map(student => ({
        ...student,
        hasApplied: !!applicationStatusMap[student.instituteStudntsID],
        applicationStatus: applicationStatusMap[student.instituteStudntsID]?.status || null,
        appliedAt: applicationStatusMap[student.instituteStudntsID]?.appliedAt || null
      }))
      .filter(student => {
        // Only show students who haven't been hired or rejected
        const status = student.applicationStatus;
        return !status || (status !== 'hired' && status !== 'rejected');
      });
    
    res.status(200).json({
      success: true,
      data: studentsWithStatus
    });
    
  } catch (error) {
    console.error('Get students application status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get students application status'
    });
  }
};

module.exports = {
  applyForJob,
  recordProfileView,
  getDashboardData,
  getAppliedInstitutes,
  getInstituteStudents,
  getMyApplications,
  getJobApplicationStudents,
  applyStudentsToJob,
  getStudentsApplicationStatus
};