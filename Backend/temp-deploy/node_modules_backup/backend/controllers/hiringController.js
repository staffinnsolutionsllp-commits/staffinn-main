/**
 * Hiring Controller
 * Handles hiring-related operations
 */
const hiringModel = require('../models/hiringModel');
const staffModel = require('../models/staffModel');
const userModel = require('../models/userModel');

/**
 * Create a new hiring record
 * @route POST /api/hiring/hire
 */
const hireStaff = async (req, res) => {
  try {
    console.log('Hire staff request:', req.body);
    console.log('Request user:', req.user);
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const { staffId, contactMethod } = req.body;
    
    if (!staffId || !contactMethod) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID and contact method are required'
      });
    }
    
    // Get staff profile
    const staffProfile = await staffModel.getStaffProfile(staffId);
    if (!staffProfile) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found'
      });
    }
    
    // Get seeker (current user) details
    const seekerUser = await userModel.findUserById(req.user.userId);
    if (!seekerUser) {
      return res.status(404).json({
        success: false,
        message: 'Seeker profile not found'
      });
    }
    
    // Create hiring record
    const hiringData = {
      seekerId: req.user.userId,
      staffId: staffId,
      staffName: staffProfile.fullName,
      staffEmail: staffProfile.email,
      staffPhone: staffProfile.phone,
      seekerName: seekerUser.name,
      seekerEmail: seekerUser.email,
      contactMethod: contactMethod
    };
    
    const hiringRecord = await hiringModel.createHiringRecord(hiringData);
    
    res.status(201).json({
      success: true,
      message: 'Hiring record created successfully',
      data: hiringRecord
    });
    
  } catch (error) {
    console.error('Hire staff error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create hiring record'
    });
  }
};

/**
 * Get hiring history for current user
 * @route GET /api/hiring/history
 */
const getHiringHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    let hiringHistory;
    
    if (userRole === 'staff') {
      // Get hiring history where this user was hired
      hiringHistory = await hiringModel.getStaffHiringHistory(userId);
    } else {
      // Get hiring history where this user hired others (seeker mode)
      hiringHistory = await hiringModel.getSeekerHiringHistory(userId);
    }
    
    res.status(200).json({
      success: true,
      data: hiringHistory
    });
    
  } catch (error) {
    console.error('Get hiring history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get hiring history'
    });
  }
};

/**
 * Update hiring record with rating and feedback
 * @route PUT /api/hiring/:hiringId/rate
 */
const rateHiring = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const { hiringId } = req.params;
    const { rating, feedback } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Get existing hiring record to verify ownership
    const existingRecord = await hiringModel.getHiringRecordById(hiringId);
    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Hiring record not found'
      });
    }
    
    // Verify that the current user is the seeker who made the hire
    if (existingRecord.seekerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only rate your own hires'
      });
    }
    
    // Update the record
    const updateData = {
      rating: parseInt(rating),
      feedback: feedback || '',
      status: 'completed'
    };
    
    const updatedRecord = await hiringModel.updateHiringRecord(hiringId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
      data: updatedRecord
    });
    
  } catch (error) {
    console.error('Rate hiring error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit rating'
    });
  }
};

/**
 * Get hiring statistics for current user
 * @route GET /api/hiring/stats
 */
const getHiringStats = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const userId = req.user.userId;
    const userRole = req.user.role;
    const userType = userRole === 'staff' ? 'staff' : 'seeker';
    
    const stats = await hiringModel.getHiringStats(userId, userType);
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get hiring stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get hiring statistics'
    });
  }
};

/**
 * Get specific hiring record details
 * @route GET /api/hiring/:hiringId
 */
const getHiringRecord = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const { hiringId } = req.params;
    
    const hiringRecord = await hiringModel.getHiringRecordById(hiringId);
    if (!hiringRecord) {
      return res.status(404).json({
        success: false,
        message: 'Hiring record not found'
      });
    }
    
    // Verify that the current user is either the seeker or the staff in this record
    if (hiringRecord.seekerId !== req.user.userId && hiringRecord.staffId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.status(200).json({
      success: true,
      data: hiringRecord
    });
    
  } catch (error) {
    console.error('Get hiring record error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get hiring record'
    });
  }
};

/**
 * Hire or reject institute student
 * @route POST /api/hiring/institute-student
 */
const hireInstituteStudent = async (req, res) => {
  try {
    console.log('Hire institute student request:', req.body);
    console.log('Request user:', req.user);
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Only recruiters can hire students'
      });
    }
    
    const { studentID, instituteID, jobID, jobTitle, status, studentSnapshot } = req.body;
    
    if (!studentID || !instituteID || !jobID || !jobTitle || !status) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, Institute ID, Job ID, Job Title, and Status are required'
      });
    }
    
    if (!['Hired', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "Hired" or "Rejected"'
      });
    }
    
    // Get recruiter details
    const userModel = require('../models/userModel');
    const recruiterUser = await userModel.findUserById(req.user.userId);
    if (!recruiterUser) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter profile not found'
      });
    }
    
    // Get recruiter profile for company name
    let recruiterProfile = null;
    try {
      const dynamoService = require('../services/dynamoService');
      const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
      recruiterProfile = await dynamoService.getItem(USERS_TABLE, { userId: req.user.userId });
    } catch (error) {
      console.log('Could not fetch recruiter profile:', error.message);
    }
    
    // Create/update job application record
    const jobApplicationModel = require('../models/jobApplicationModel');
    
    // Check if application exists first
    const existingApplication = await jobApplicationModel.getJobApplication(jobID, studentID);
    
    if (existingApplication) {
      // Update existing application
      await jobApplicationModel.updateJobApplicationStatus(jobID, studentID, status.toLowerCase());
    } else {
      // Create new application
      await jobApplicationModel.createJobApplication({
        studentID,
        jobID,
        recruiterID: req.user.userId,
        instituteID,
        status: status.toLowerCase()
      });
    }
    
    // Update student placement details in institute database (only for regular institute students)
    const instituteStudentModel = require('../models/instituteStudentModel');
    const jobModel = require('../models/jobModel');
    
    // Get job details for placement record
    const jobDetails = await jobModel.getJobById(jobID);
    
    // Check if this is a MIS student by checking if they exist in MIS applications
    const misJobApplicationModel = require('../models/misJobApplicationModel');
    const misApplication = await misJobApplicationModel.checkExistingApplication(jobID, studentID);
    const isMisStudent = !!misApplication;
    
    if (!isMisStudent) {
      // Only update placement details for regular institute students
      const placementData = {
        status: status === 'Hired' ? 'Placed' : 'Rejected',
        recruiter: `${recruiterUser.name} (${recruiterProfile?.companyName || recruiterUser.name})`,
        appliedJob: jobTitle
      };
      
      await instituteStudentModel.updateStudentPlacementDetails(studentID, placementData);
    } else {
      // For MIS students, update the MIS job application status using the application ID
      await misJobApplicationModel.updateStatus(misApplication.misApplicationId, status.toLowerCase());
    }
    
    // Create hiring record
    const hiringData = {
      applicantType: 'institute',
      studentID,
      instituteID,
      recruiterID: req.user.userId,
      recruiterName: recruiterUser.name,
      recruiterCompany: recruiterProfile?.companyName || recruiterUser.name,
      jobID,
      jobTitle,
      status,
      studentSnapshot: studentSnapshot || null,
      isMisStudent: isMisStudent
    };
    
    const hiringRecord = await hiringModel.createHiringRecord(hiringData);
    
    // Handle MIS student placement analytics
    if (isMisStudent) {
      try {
        const misPlacementAnalyticsModel = require('../models/misPlacementAnalyticsModel');
        
        // First check if placement record already exists for this student and job
        const existingRecord = await misPlacementAnalyticsModel.getMisPlacementByStudentAndJob(studentID, jobID);
        
        if (existingRecord) {
          // Update existing record with new status
          const updateData = {
            status: status,
            hiredDate: status === 'Hired' ? new Date().toISOString() : null,
            rejectedDate: status === 'Rejected' ? new Date().toISOString() : null
          };
          
          await misPlacementAnalyticsModel.updateMisPlacement(existingRecord.placementId, updateData);
          console.log('✅ MIS placement analytics updated for student:', studentID, 'Job:', jobID, 'Status:', status);
          
          // Send real-time update to Staffinn Partner dashboard
          const io = req.app.get('io');
          if (io) {
            io.emit('misPlacementUpdate', {
              type: 'statusUpdate',
              studentId: studentID,
              jobId: jobID,
              status: status,
              placementId: existingRecord.placementId,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          // Create new record if it doesn't exist
          const misStudentModel = require('../models/misStudentModel');
          const batchModel = require('../models/batchModel');
          
          let student = null;
          let center = 'MIS Center';
          let sector = 'General';
          let course = 'N/A';
          let batchId = null;
          
          try {
            student = await misStudentModel.getById(studentID);
            const allBatches = await batchModel.getAll();
            const studentBatch = allBatches.find(batch => 
              batch.selectedStudents && batch.selectedStudents.includes(studentID)
            );
            
            if (studentBatch) {
              center = studentBatch.trainingCentreName || center;
              course = studentBatch.courseName || course;
              batchId = studentBatch.batchId;
              
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
          } catch (error) {
            console.error('Error fetching student/batch info:', error);
          }
          
          const placementData = {
            studentId: studentID,
            studentName: student?.fatherName || studentSnapshot?.fullName || 'MIS Student',
            qualification: student?.qualification || studentSnapshot?.qualification || 'N/A',
            center: center,
            sector: sector,
            course: course,
            batchId: batchId,
            recruiterName: recruiterUser.name,
            companyName: recruiterProfile?.companyName || recruiterUser.name,
            jobTitle: jobTitle,
            status: status,
            appliedDate: new Date().toISOString(),
            hiredDate: status === 'Hired' ? new Date().toISOString() : null,
            rejectedDate: status === 'Rejected' ? new Date().toISOString() : null,
            salaryPackage: jobDetails?.salary || 'Not specified',
            instituteId: instituteID,
            recruiterId: req.user.userId,
            jobId: jobID
          };
          
          const newRecord = await misPlacementAnalyticsModel.createMisPlacement(placementData);
          console.log('✅ MIS placement analytics created for student:', studentID, 'Status:', status);
          
          // Send real-time update to Staffinn Partner dashboard
          const io = req.app.get('io');
          if (io) {
            io.emit('misPlacementUpdate', {
              type: 'newPlacement',
              studentId: studentID,
              jobId: jobID,
              status: status,
              placementId: newRecord.placementId,
              timestamp: new Date().toISOString()
            });
          }
        }
        
      } catch (misAnalyticsError) {
        console.error('Failed to update MIS placement analytics:', misAnalyticsError);
        // Don't fail the hiring process if analytics update fails
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Student ${status.toLowerCase()} successfully`,
      data: hiringRecord
    });
    
  } catch (error) {
    console.error('Hire institute student error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process hiring action'
    });
  }
};

/**
 * Get hiring history for recruiter (includes institute students)
 * @route GET /api/hiring/recruiter-history
 */
const getRecruiterHiringHistory = async (req, res) => {
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
        message: 'Only recruiters can access hiring history'
      });
    }
    
    const hiringHistory = await hiringModel.getRecruiterHiringHistory(req.user.userId);
    
    // Group by institute for better organization
    const groupedHistory = hiringHistory.reduce((acc, record) => {
      if (record.applicantType === 'institute') {
        const instituteId = record.instituteID;
        if (!acc[instituteId]) {
          acc[instituteId] = [];
        }
        acc[instituteId].push(record);
      } else {
        // Legacy staff records
        if (!acc['staff']) {
          acc['staff'] = [];
        }
        acc['staff'].push(record);
      }
      return acc;
    }, {});
    
    res.status(200).json({
      success: true,
      data: {
        all: hiringHistory,
        grouped: groupedHistory
      }
    });
    
  } catch (error) {
    console.error('Get recruiter hiring history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get hiring history'
    });
  }
};

/**
 * Get hiring history for a specific institute
 * @route GET /api/hiring/institute/:instituteId/history
 */
const getInstituteHiringHistory = async (req, res) => {
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
        message: 'Only recruiters can access hiring history'
      });
    }
    
    const { instituteId } = req.params;
    
    if (!instituteId) {
      return res.status(400).json({
        success: false,
        message: 'Institute ID is required'
      });
    }
    
    const hiringHistory = await hiringModel.getInstituteHiringRecords(req.user.userId, instituteId);
    
    res.status(200).json({
      success: true,
      data: hiringHistory
    });
    
  } catch (error) {
    console.error('Get institute hiring history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get institute hiring history'
    });
  }
};

module.exports = {
  hireStaff,
  getHiringHistory,
  rateHiring,
  getHiringStats,
  getHiringRecord,
  hireInstituteStudent,
  getRecruiterHiringHistory,
  getInstituteHiringHistory
};