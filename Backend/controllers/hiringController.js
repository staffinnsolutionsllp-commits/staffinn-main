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
    
    // Update student placement details in institute database
    const instituteStudentModel = require('../models/instituteStudentModel');
    const jobModel = require('../models/jobModel');
    
    // Get job details for placement record
    const jobDetails = await jobModel.getJobById(jobID);
    
    const placementData = {
      status: status === 'Hired' ? 'Placed' : 'Rejected',
      recruiter: `${recruiterUser.name} (${recruiterProfile?.companyName || recruiterUser.name})`,
      appliedJob: jobTitle
    };
    
    await instituteStudentModel.updateStudentPlacementDetails(studentID, placementData);
    
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
      studentSnapshot: studentSnapshot || null
    };
    
    const hiringRecord = await hiringModel.createHiringRecord(hiringData);
    
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