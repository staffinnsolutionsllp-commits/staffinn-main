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
    
    // Check if this institute is a Staffinn Partner
    const userModel = require('../models/userModel');
    const instituteUser = await userModel.findUserById(instituteId);
    const isStaffinPartner = instituteUser && (instituteUser.instituteType === 'staffinn_partner' || instituteUser.misApproved === true);
    
    let allStudents = [];
    
    // First try to get students from new flow (job applications table)
    const jobApplicationModel = require('../models/jobApplicationModel');
    const newFlowApplications = await jobApplicationModel.getJobInstituteApplications(jobId, instituteId);
    
    if (newFlowApplications && newFlowApplications.length > 0) {
      // Filter out students who have been hired or rejected
      const pendingApplications = newFlowApplications.filter(app => 
        app.status !== 'hired' && app.status !== 'rejected'
      );
      
      // Add regular institute students
      const regularStudents = pendingApplications.map(app => ({
        ...app.student,
        applicationStatus: app.status,
        applicationId: app.staffinnjob,
        appliedAt: app.timestamp,
        isMisStudent: false
      }));
      
      allStudents = [...allStudents, ...regularStudents];
    } else {
      // Fallback to old flow for regular students
      try {
        const oldFlowStudents = await applicationModel.getJobApplicationStudents(req.user.userId, instituteId, jobId);
        const regularStudents = oldFlowStudents.map(student => ({
          ...student,
          isMisStudent: false
        }));
        allStudents = [...allStudents, ...regularStudents];
      } catch (oldFlowError) {
        console.log('Old flow fallback failed, continuing with empty regular students:', oldFlowError.message);
        // Continue execution - we'll still try to get MIS students if applicable
      }
    }
    
    // If this is a Staffinn Partner institute, also get MIS students
    if (isStaffinPartner) {
      try {
        const misJobApplicationModel = require('../models/misJobApplicationModel');
        const misStudentModel = require('../models/misStudentModel');
        
        // Get MIS applications for this job
        const misApplications = await misJobApplicationModel.getByJob(jobId);
        
        // Filter MIS applications that are pending (not hired/rejected)
        const pendingMisApplications = misApplications.filter(app => 
          app.status !== 'hired' && app.status !== 'rejected'
        );
        
        // Get MIS student details for each application
        const misStudents = await Promise.all(
          pendingMisApplications.map(async (app) => {
            try {
              const student = await misStudentModel.getById(app.studentId);
              if (student) {
                return {
                  instituteStudntsID: student.studentsId,
                  fullName: student.fatherName || 'MIS Student',
                  email: student.email || 'N/A',
                  phoneNumber: student.mobile || 'N/A',
                  dateOfBirth: student.dob || 'N/A',
                  gender: student.gender || 'N/A',
                  address: student.address || 'N/A',
                  qualification: student.qualification || 'N/A',
                  trainingCenter: student.trainingCenter || 'MIS Center',
                  course: student.course || 'N/A',
                  skills: student.skills ? student.skills.split(',') : [],
                  profilePhoto: student.profilePhotoUrl || null,
                  resume: null, // MIS students don't have resume in this format
                  certificates: [], // MIS students don't have certificates in this format
                  applicationStatus: app.status,
                  applicationId: app.misApplicationId,
                  appliedAt: app.createdAt,
                  isMisStudent: true
                };
              }
              return null;
            } catch (error) {
              console.error('Error getting MIS student:', app.studentId, error);
              return null;
            }
          })
        );
        
        // Filter out null results and add to all students
        const validMisStudents = misStudents.filter(student => student !== null);
        allStudents = [...allStudents, ...validMisStudents];
        
      } catch (misError) {
        console.error('Error fetching MIS students:', misError);
        // Don't fail the entire request if MIS students can't be fetched
      }
    }
    
    res.status(200).json({
      success: true,
      data: allStudents,
      source: allStudents.length > 0 ? 'combined_flow' : 'no_students',
      isStaffinPartner: isStaffinPartner
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
    const { type } = req.query; // 'institute' or 'mis'
    const instituteId = req.user.userId;
    
    // Check if this institute is a Staffinn Partner
    const userModel = require('../models/userModel');
    const instituteUser = await userModel.findUserById(instituteId);
    const isStaffinPartner = instituteUser && (instituteUser.instituteType === 'staffinn_partner' || instituteUser.misApproved === true);
    
    if (type === 'mis') {
      // Only allow Staffinn Partner institutes to access MIS students
      if (!isStaffinPartner) {
        return res.status(403).json({
          success: false,
          message: 'Only Staffinn Partner institutes can access MIS students'
        });
      }
      
      // Get MIS students
      const misStudentModel = require('../models/misStudentModel');
      const misJobApplicationModel = require('../models/misJobApplicationModel');
      
      const allMisStudents = await misStudentModel.getStudentsByInstitute(instituteId);
      const misApplications = await misJobApplicationModel.getByJob(jobId);
      
      // Create application status map
      const applicationStatusMap = {};
      misApplications.forEach(app => {
        applicationStatusMap[app.studentId] = {
          hasApplied: true,
          status: app.status,
          appliedAt: app.createdAt
        };
      });
      
      // Filter and format MIS students
      const studentsWithStatus = allMisStudents
        .map(student => ({
          ...student,
          instituteStudntsID: student.studentsId, // Map to expected field
          fullName: student.fatherName || 'MIS Student',
          hasApplied: !!applicationStatusMap[student.studentsId],
          applicationStatus: applicationStatusMap[student.studentsId]?.status || null,
          appliedAt: applicationStatusMap[student.studentsId]?.appliedAt || null,
          isMisStudent: true,
          // Ensure proper field mapping for display
          qualification: student.qualification || 'N/A',
          center: student.trainingCenter || 'MIS Center',
          course: student.course || 'N/A'
        }))
        .filter(student => {
          const status = student.applicationStatus;
          return !status || (status !== 'hired' && status !== 'rejected');
        });
      
      return res.status(200).json({
        success: true,
        data: studentsWithStatus,
        isStaffinPartner: true
      });
    }
    
    // Default: Get institute students
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
        appliedAt: applicationStatusMap[student.instituteStudntsID]?.appliedAt || null,
        isMisStudent: false,
        // Map fields for consistent display
        qualification: student.degreeName || 'N/A',
        center: 'Main Center',
        course: student.specialization || 'N/A'
      }))
      .filter(student => {
        // Only show students who haven't been hired or rejected
        const status = student.applicationStatus;
        return !status || (status !== 'hired' && status !== 'rejected');
      });
    
    res.status(200).json({
      success: true,
      data: studentsWithStatus,
      isStaffinPartner: isStaffinPartner
    });
    
  } catch (error) {
    console.error('Get students application status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get students application status'
    });
  }
};

/**
 * Apply MIS students to a job (Institute functionality)
 * @route POST /api/applications/apply-mis-students
 */
const applyMisStudentsToJob = async (req, res) => {
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
        message: 'Only institutes can apply MIS students to jobs'
      });
    }
    
    // Check if this institute is a Staffinn Partner
    const userModel = require('../models/userModel');
    const instituteUser = await userModel.findUserById(req.user.userId);
    const isStaffinPartner = instituteUser && (instituteUser.instituteType === 'staffinn_partner' || instituteUser.misApproved === true);
    
    if (!isStaffinPartner) {
      return res.status(403).json({
        success: false,
        message: 'Only Staffinn Partner institutes can apply MIS students to jobs'
      });
    }
    
    const { jobId, recruiterId, studentIds } = req.body;
    
    if (!jobId || !recruiterId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Job ID, recruiter ID, and student IDs are required'
      });
    }
    
    const misJobApplicationModel = require('../models/misJobApplicationModel');
    
    // Filter out students who have already applied
    const existingApplications = await Promise.all(
      studentIds.map(async (studentId) => {
        const existing = await misJobApplicationModel.checkExistingApplication(jobId, studentId);
        return existing ? studentId : null;
      })
    );
    
    const alreadyAppliedIds = existingApplications.filter(id => id !== null);
    const newStudentIds = studentIds.filter(id => !alreadyAppliedIds.includes(id));
    
    if (newStudentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All selected MIS students have already been applied to this job',
        data: {
          alreadyAppliedCount: alreadyAppliedIds.length,
          alreadyAppliedIds
        }
      });
    }
    
    // Create application records for new MIS students only
    const applicationDataArray = newStudentIds.map(studentId => ({
      studentId: studentId,
      jobId: jobId,
      recruiterId: recruiterId,
      instituteId: req.user.userId,
      status: 'pending',
      applicationType: 'mis'
    }));
    
    const applications = await misJobApplicationModel.createBulk(applicationDataArray);
    
    // Create initial placement analytics records for tracking
    try {
      const misPlacementAnalyticsModel = require('../models/misPlacementAnalyticsModel');
      const jobModel = require('../models/jobModel');
      const misStudentModel = require('../models/misStudentModel');
      const batchModel = require('../models/batchModel');
      
      // Get job details
      const jobDetails = await jobModel.getJobById(jobId);
      
      // Get recruiter details
      const userModel = require('../models/userModel');
      const recruiterUser = await userModel.findUserById(recruiterId);
      
      // Create placement records for each new application
      for (const studentId of newStudentIds) {
        try {
          const student = await misStudentModel.getById(studentId);
          if (!student) continue;
          
          // Get batch information for center and sector
          let center = 'MIS Center';
          let sector = 'General';
          let course = student.course || 'N/A';
          let batchId = null;
          
          const allBatches = await batchModel.getAll();
          const studentBatch = allBatches.find(batch => 
            batch.selectedStudents && batch.selectedStudents.includes(studentId)
          );
          
          if (studentBatch) {
            center = studentBatch.trainingCentreName || center;
            course = studentBatch.courseName || course;
            batchId = studentBatch.batchId;
            
            // Determine sector from course name
            if (studentBatch.courseName) {
              const courseName = studentBatch.courseName.toLowerCase();
              if (courseName.includes('it') || courseName.includes('software')) {
                sector = 'Information Technology';
              } else if (courseName.includes('retail')) {
                sector = 'Retail';
              } else if (courseName.includes('healthcare')) {
                sector = 'Healthcare';
              }
            }
          }
          
          const placementData = {
            studentId: studentId,
            studentName: student.fatherName || 'MIS Student',
            qualification: student.qualification || 'N/A',
            center: center,
            sector: sector,
            course: course,
            batchId: batchId,
            recruiterName: recruiterUser?.name || 'Unknown Recruiter',
            companyName: recruiterUser?.name || 'Unknown Company',
            jobTitle: jobDetails?.title || 'Unknown Job',
            status: 'Applied',
            appliedDate: new Date().toISOString(),
            salaryPackage: jobDetails?.salary || 'Not specified',
            instituteId: req.user.userId,
            recruiterId: recruiterId,
            jobId: jobId
          };
          
          await misPlacementAnalyticsModel.createOrUpdateMisPlacement(placementData);
        } catch (studentError) {
          console.error('Error creating placement record for student:', studentId, studentError);
        }
      }
    } catch (analyticsError) {
      console.error('Error creating placement analytics:', analyticsError);
      // Don't fail the application process if analytics fails
    }
    
    res.status(201).json({
      success: true,
      message: `Successfully applied ${newStudentIds.length} MIS students to the job`,
      data: {
        appliedCount: applications.length,
        applications,
        alreadyAppliedCount: alreadyAppliedIds.length,
        skippedStudents: alreadyAppliedIds
      }
    });
    
  } catch (error) {
    console.error('Apply MIS students to job error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to apply MIS students to job'
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
  getStudentsApplicationStatus,
  applyMisStudentsToJob
};