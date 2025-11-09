/**
 * Recruiter Controller
 * Handles recruiter registration and management
 */
const userModel = require('../models/userModel');
const jwtUtils = require('../utils/jwtUtils');
const { validateRecruiterRegistration } = require('../utils/validation');
const emailService = require('../services/emailService');

// Website validation service - Disabled for better user experience
// const websiteValidationService = {
//   validateWebsiteExists: async (website) => {
//     try {
//       const https = require('https');
//       const http = require('http');
//       const url = require('url');
//       
//       const parsedUrl = url.parse(website);
//       const protocol = parsedUrl.protocol === 'https:' ? https : http;
//       
//       return new Promise((resolve) => {
//         const req = protocol.request({
//           hostname: parsedUrl.hostname,
//           port: parsedUrl.port,
//           path: '/',
//           method: 'HEAD',
//           timeout: 10000
//         }, (res) => {
//           resolve(res.statusCode >= 200 && res.statusCode < 400);
//         });
//         
//         req.on('error', () => resolve(false));
//         req.on('timeout', () => {
//           req.destroy();
//           resolve(false);
//         });
//         
//         req.end();
//       });
//     } catch (error) {
//       return false;
//     }
//   }
// };

/**
 * Register a new recruiter
 * @route POST /api/recruiter/register
 */
const registerRecruiter = async (req, res) => {
  try {
    console.log('Recruiter registration request:', req.body);
    
    // Validate recruiter registration data
    const { error, value } = validateRecruiterRegistration(req.body);
    
    if (error) {
      console.log('Recruiter validation error:', error);
      return res.status(400).json({
        success: false,
        message: error
      });
    }
    
    // Check if email is already registered
    const existingUser = await userModel.findUserByEmail(value.email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered'
      });
    }
    
    // Validate website format if provided
    if (value.website && value.website.trim() !== '') {
      // Basic URL format validation only
      const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+(\/.*)?$/;
      if (!urlPattern.test(value.website)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid website URL format (e.g., https://example.com)'
        });
      }
      
      // Ensure URL has protocol
      if (!value.website.startsWith('http://') && !value.website.startsWith('https://')) {
        value.website = 'https://' + value.website;
      }
    }
    
    // Prepare user data for creation (only registration form fields)
    const userData = {
      companyName: value.companyName,
      email: value.email,
      password: value.password,
      phoneNumber: value.phoneNumber,
      role: 'recruiter',
      website: value.website || null,
      isVisible: true // Default to visible when registering
    };
    
    // Create user in users table
    const user = await userModel.createUser(userData);
    
    // Create default profile data in recruiter-profiles table
    const dynamoService = require('../services/dynamoService');
    const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE;
    
    const defaultProfileData = {
      recruiterId: user.userId,
      companyName: value.companyName,
      companyDescription: 'A leading technology company providing innovative solutions.',
      perks: [
        { text: 'Health insurance' },
        { text: 'Work from home options' },
        { text: 'Learning & development budget' },
        { text: 'Performance bonuses' }
      ],
      hiringSteps: [
        { title: 'Online Application', description: 'Submit your resume and complete a brief questionnaire.' },
        { title: 'HR Screening Call', description: '30-minute call to discuss your background and expectations.' },
        { title: 'Technical Assessment', description: 'Complete a skill-based assessment relevant to the position.' },
        { title: 'Final Round & Offer', description: 'Discussion with management, followed by an offer if selected.' }
      ],
      interviewQuestions: [
        'Tell us about yourself and your experience.',
        'Why do you want to work with our company?',
        'What are your salary expectations?',
        'Do you have any questions for us?'
      ],
      isLive: false, // Profile is not live initially
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await dynamoService.putItem(RECRUITER_PROFILES_TABLE, defaultProfileData);
    
    // Generate tokens
    const tokens = jwtUtils.generateTokens(user);
    
    // Send welcome email (optional)
    try {
      await emailService.sendWelcomeEmail(user.email, value.companyName, 'recruiter');
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
      // Don't fail registration if email fails
    }
    
    // Send response
    res.status(201).json({
      success: true,
      message: 'Recruiter registered successfully',
      data: {
        user: {
          userId: user.userId,
          companyName: user.companyName,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber,
          website: user.website
        },
        ...tokens
      }
    });
    
  } catch (error) {
    console.error('Recruiter registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Recruiter registration failed'
    });
  }
};

/**
 * Get recruiter profile
 * @route GET /api/recruiter/profile
 */
const getRecruiterProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user basic info from users table (registration data only)
    const user = await userModel.findUserById(userId);
    
    if (!user || user.role !== 'recruiter') {
      return res.status(404).json({
        success: false,
        message: 'Recruiter profile not found'
      });
    }
    
    // Get profile data from recruiter-profiles table
    const dynamoService = require('../services/dynamoService');
    const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE;
    const profileData = await dynamoService.getItem(RECRUITER_PROFILES_TABLE, { recruiterId: userId }) || {};
    
    // Default values for dashboard editing
    const defaultPerks = [
      { text: 'Health insurance' },
      { text: 'Work from home options' },
      { text: 'Learning & development budget' },
      { text: 'Performance bonuses' }
    ];
    
    const defaultHiringSteps = [
      { title: 'Online Application', description: 'Submit your resume and complete a brief questionnaire.' },
      { title: 'HR Screening Call', description: '30-minute call to discuss your background and expectations.' },
      { title: 'Technical Assessment', description: 'Complete a skill-based assessment relevant to the position.' },
      { title: 'Final Round & Offer', description: 'Discussion with management, followed by an offer if selected.' }
    ];
    
    const defaultQuestions = [
      'Tell us about yourself and your experience.',
      'Why do you want to work with our company?',
      'What are your salary expectations?',
      'Do you have any questions for us?'
    ];
    
    // Merge user registration data with profile data
    const completeProfile = {
      ...user,
      ...profileData,
      // Ensure arrays are properly initialized with defaults for dashboard editing
      officeImages: profileData.officeImages || [],
      perks: (profileData.perks && profileData.perks.length > 0) ? profileData.perks : defaultPerks,
      hiringSteps: (profileData.hiringSteps && profileData.hiringSteps.length > 0) ? profileData.hiringSteps : defaultHiringSteps,
      interviewQuestions: (profileData.interviewQuestions && profileData.interviewQuestions.length > 0) ? profileData.interviewQuestions : defaultQuestions,
      companyDescription: profileData.companyDescription || 'A leading technology company providing innovative solutions.'
    };
    
    console.log('Retrieved profile data:', {
      userId,
      hasProfilePhoto: !!completeProfile.profilePhoto,
      officeImagesCount: completeProfile.officeImages.length,
      profilePhoto: completeProfile.profilePhoto
    });
    
    res.status(200).json({
      success: true,
      data: completeProfile
    });
    
  } catch (error) {
    console.error('Get recruiter profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recruiter profile'
    });
  }
};

/**
 * Update recruiter profile
 * @route PUT /api/recruiter/profile
 */
const updateRecruiterProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.userId;
    delete updateData.recruiterId;
    delete updateData.email;
    delete updateData.password;
    delete updateData.role;
    
    // If website is being updated, validate it (optional validation)
    if (updateData.website && updateData.website.trim() !== '') {
      // Basic URL format validation only
      const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+(\/.*)?$/;
      if (!urlPattern.test(updateData.website)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid website URL format (e.g., https://example.com)'
        });
      }
      
      // Ensure URL has protocol
      if (!updateData.website.startsWith('http://') && !updateData.website.startsWith('https://')) {
        updateData.website = 'https://' + updateData.website;
      }
    }
    
    // Check if user exists in users table
    const currentUser = await userModel.findUserById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter profile not found'
      });
    }
    
    const dynamoService = require('../services/dynamoService');
    const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE;
    
    // Get existing profile data to preserve fields not being updated
    const existingProfile = await dynamoService.getItem(RECRUITER_PROFILES_TABLE, { recruiterId: userId }) || {};
    
    // Prepare profile data for recruiter-profiles table
    // Preserve existing profilePhoto and officeImages if not explicitly provided
    const profileData = {
      recruiterId: userId,
      ...existingProfile, // Keep existing data
      ...updateData, // Override with new data
      // Handle profile photo updates including removal (null values)
      profilePhoto: updateData.hasOwnProperty('profilePhoto') ? updateData.profilePhoto : existingProfile.profilePhoto,
      // Ensure officeImages are preserved and merged properly
      officeImages: updateData.officeImages || existingProfile.officeImages || [],
      isLive: true, // Mark profile as live when updated
      updatedAt: new Date().toISOString()
    };
    
    console.log('Updating recruiter profile with photo data:', {
      recruiterId: userId,
      hasProfilePhoto: !!profileData.profilePhoto,
      profilePhoto: profileData.profilePhoto,
      isExplicitPhotoUpdate: updateData.hasOwnProperty('profilePhoto'),
      updateDataPhoto: updateData.profilePhoto,
      existingPhoto: existingProfile.profilePhoto,
      officeImages: profileData.officeImages.length
    });
    
    // Save profile data to recruiter-profiles table (separate from registration data)
    await dynamoService.putItem(RECRUITER_PROFILES_TABLE, profileData);
    
    // Get updated profile data to merge with basic user info for response
    const updatedProfile = await dynamoService.getItem(RECRUITER_PROFILES_TABLE, { recruiterId: userId }) || {};
    
    // Merge user registration data with profile data for response
    const responseData = {
      ...currentUser,
      ...updatedProfile
    };
    
    res.status(200).json({
      success: true,
      message: 'Recruiter profile updated successfully',
      data: responseData
    });
    
  } catch (error) {
    console.error('Update recruiter profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update recruiter profile'
    });
  }
};

/**
 * Verify website manually
 * @route POST /api/recruiter/verify-website
 */
const verifyWebsite = async (req, res) => {
  try {
    const { website } = req.body;
    
    if (!website) {
      return res.status(400).json({
        success: false,
        message: 'Website URL is required'
      });
    }
    
    // Basic URL format validation
    const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+(\/.*)?$/;
    const isValidFormat = urlPattern.test(website);
    
    res.status(200).json({
      success: true,
      data: {
        website,
        isValid: isValidFormat,
        message: isValidFormat ? 'Website URL format is valid' : 'Invalid website URL format'
      }
    });
    
  } catch (error) {
    console.error('Website verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Website verification failed'
    });
  }
};

/**
 * Get all recruiters for public listing
 * @route GET /api/recruiter/public/all
 */
const getAllRecruitersPublic = async (req, res) => {
  try {
    const dynamoService = require('../services/dynamoService');
    const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
    const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE;
    
    const allUsers = await dynamoService.scanItems(USERS_TABLE);
    const recruiters = allUsers.filter(user => 
      user.role === 'recruiter' && 
      !user.isBlocked && 
      user.isVisible !== false
    );
    
    // Get all recruiter profiles
    const allProfiles = await dynamoService.scanItems(RECRUITER_PROFILES_TABLE);
    const profilesMap = {};
    allProfiles.forEach(profile => {
      profilesMap[profile.recruiterId] = profile;
    });
    
    const formattedRecruiters = recruiters.map(recruiter => {
      const profile = profilesMap[recruiter.userId] || {};
      
      console.log('Formatting recruiter for public listing:', {
        recruiterId: recruiter.userId,
        hasProfilePhoto: !!profile.profilePhoto,
        profilePhoto: profile.profilePhoto,
        isLive: profile.isLive
      });
      
      // Use live profile data if available, otherwise use default values
      const useProfile = profile.isLive !== false ? profile : {};
      
      return {
        id: recruiter.userId,
        companyName: useProfile.companyName || recruiter.name || recruiter.fullName || 'Company Name',
        industry: useProfile.industry || 'Technology',
        location: useProfile.location || 'India',
        address: useProfile.address,
        pincode: useProfile.pincode,
        verified: true,
        recruiterName: useProfile.recruiterName || recruiter.fullName || 'HR Manager',
        designation: useProfile.designation || 'HR Manager',
        experience: useProfile.experience || '3+ years',
        companyDescription: useProfile.companyDescription || 'A leading technology company providing innovative solutions.',
        website: useProfile.website || recruiter.website,
        phone: useProfile.phone || recruiter.phone,
        profilePhoto: useProfile.profilePhoto || recruiter.profilePhoto,
        perks: useProfile.perks || [
          { text: 'Health insurance' },
          { text: 'Work from home options' },
          { text: 'Learning & development budget' },
          { text: 'Performance bonuses' }
        ],
        hiringSteps: useProfile.hiringSteps || [
          { title: 'Online Application', description: 'Submit your resume and complete a brief questionnaire.' },
          { title: 'HR Screening Call', description: '30-minute call to discuss your background and expectations.' },
          { title: 'Technical Assessment', description: 'Complete a skill-based assessment relevant to the position.' },
          { title: 'Final Round & Offer', description: 'Discussion with management, followed by an offer if selected.' }
        ],
        interviewQuestions: useProfile.interviewQuestions || [
          'Tell us about yourself and your experience.',
          'Why do you want to work with our company?',
          'What are your salary expectations?',
          'Do you have any questions for us?'
        ]
      };
    });
    
    res.status(200).json({
      success: true,
      data: formattedRecruiters
    });
    
  } catch (error) {
    console.error('Get all recruiters public error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recruiters'
    });
  }
};

/**
 * Get recruiter by ID for public view
 * @route GET /api/recruiter/public/:recruiterId
 */
const getRecruiterByIdPublic = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    const recruiter = await userModel.findUserById(recruiterId);
    
    if (!recruiter || recruiter.role !== 'recruiter' || recruiter.isBlocked || recruiter.isVisible === false) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }
    
    // Get profile data from recruiter-profiles table
    const dynamoService = require('../services/dynamoService');
    const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE;
    const profile = await dynamoService.getItem(RECRUITER_PROFILES_TABLE, { recruiterId }) || {};
    
    console.log('Public recruiter profile data:', {
      recruiterId,
      hasProfilePhoto: !!profile.profilePhoto,
      officeImagesCount: profile.officeImages ? profile.officeImages.length : 0,
      profilePhoto: profile.profilePhoto,
      officeImages: profile.officeImages,
      fullProfileData: profile
    });
    
    // Use live profile data if available, otherwise use default values
    const useProfile = profile.isLive !== false ? profile : {};
    
    // Format recruiter data for public view
    const formattedRecruiter = {
      id: recruiter.userId,
      companyName: useProfile.companyName || recruiter.name,
      industry: useProfile.industry || 'Technology',
      location: useProfile.location || 'India',
      address: useProfile.address,
      pincode: useProfile.pincode,
      verified: true,
      recruiterName: useProfile.recruiterName || 'HR Manager',
      designation: useProfile.designation || 'HR Manager',
      experience: useProfile.experience || '3+ years',
      companyDescription: useProfile.companyDescription || 'A leading technology company.',
      website: useProfile.website || recruiter.website,
      phone: useProfile.phone || recruiter.phone,
      profilePhoto: useProfile.profilePhoto || recruiter.profilePhoto,
      officeImages: useProfile.officeImages || [],
      perks: useProfile.perks || [
        { text: 'Health insurance' },
        { text: 'Work from home options' },
        { text: 'Learning & development budget' },
        { text: 'Performance bonuses' }
      ],
      hiringSteps: useProfile.hiringSteps || [
        { title: 'Online Application', description: 'Submit your resume and complete a brief questionnaire.' },
        { title: 'HR Screening Call', description: '30-minute call to discuss your background and expectations.' },
        { title: 'Technical Assessment', description: 'Complete a skill-based assessment relevant to the position.' },
        { title: 'Final Round & Offer', description: 'Discussion with management, followed by an offer if selected.' }
      ],
      interviewQuestions: useProfile.interviewQuestions || [
        'Tell us about yourself and your experience.',
        'Why do you want to work with our company?',
        'What are your salary expectations?',
        'Do you have any questions for us?'
      ]
    };
    
    res.status(200).json({
      success: true,
      data: formattedRecruiter
    });
    
  } catch (error) {
    console.error('Get recruiter by ID public error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recruiter'
    });
  }
};

/**
 * Get all recruiters (Admin only)
 * @route GET /api/recruiter/all
 */
const getAllRecruiters = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    // Use the public method for consistency
    return getAllRecruitersPublic(req, res);
    
  } catch (error) {
    console.error('Get all recruiters error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recruiter list'
    });
  }
};

/**
 * Delete recruiter profile (Admin only)
 * @route DELETE /api/recruiter/:recruiterId
 */
const deleteRecruiter = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    // Check if recruiter exists and has recruiter role
    const recruiter = await userModel.findUserById(recruiterId);
    if (!recruiter || recruiter.role !== 'recruiter') {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }
    
    // Delete recruiter using DynamoDB service
    const dynamoService = require('../services/dynamoService');
    const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
    
    await dynamoService.deleteItem(USERS_TABLE, { userId: recruiterId });
    
    res.status(200).json({
      success: true,
      message: 'Recruiter deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete recruiter error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete recruiter'
    });
  }
};

/**
 * Get candidates who applied to recruiter's jobs with search and filter support
 * @route GET /api/recruiter/candidates
 */
const getRecruiterCandidates = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Extract search and filter parameters from query
    const searchFilters = {
      search: req.query.search || '',
      status: req.query.status || 'all',
      jobId: req.query.jobId || 'all'
    };

    const recruiterModel = require('../models/recruiterModel');
    const candidates = await recruiterModel.getRecruiterCandidates(req.user.userId, searchFilters);
    
    res.status(200).json({
      success: true,
      data: candidates
    });
    
  } catch (error) {
    console.error('Get recruiter candidates error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get candidates'
    });
  }
};

/**
 * Upload recruiter profile photo
 * @route POST /api/recruiter/upload-photo
 */
const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Store the file path with proper URL format
    const serverPort = process.env.PORT || 4001;
    const photoUrl = `http://localhost:${serverPort}/uploads/${req.file.filename}`;
    
    // Update recruiter profile with photo URL in recruiter-profiles table
    const dynamoService = require('../services/dynamoService');
    const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE;
    
    // Get existing profile data
    const existingProfile = await dynamoService.getItem(RECRUITER_PROFILES_TABLE, { recruiterId: req.user.userId }) || {};
    
    const updatedProfile = {
      ...existingProfile,
      recruiterId: req.user.userId,
      profilePhoto: photoUrl,
      updatedAt: new Date().toISOString()
    };
    
    console.log('Saving profile photo to database:', {
      recruiterId: req.user.userId,
      photoUrl: photoUrl,
      existingProfile: !!existingProfile
    });
    
    await dynamoService.putItem(RECRUITER_PROFILES_TABLE, updatedProfile);
    
    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: { profilePhoto: photoUrl }
    });
    
  } catch (error) {
    console.error('Upload profile photo error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload profile photo'
    });
  }
};

/**
 * Update candidate status (hire or reject)
 * @route PUT /api/recruiter/candidates/:staffId/:applicationId
 */
const updateCandidateStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { staffId, applicationId } = req.params;
    const { status } = req.body;
    
    if (!status || !['Hired', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Hired or Rejected'
      });
    }

    const recruiterModel = require('../models/recruiterModel');
    await recruiterModel.updateCandidateStatus(req.user.userId, staffId, applicationId, status);
    
    res.status(200).json({
      success: true,
      message: `Candidate status updated to ${status}`
    });
    
  } catch (error) {
    console.error('Update candidate status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update candidate status'
    });
  }
};

/**
 * Get recruiter dashboard stats
 * @route GET /api/recruiter/stats
 */
const getRecruiterDashboardStats = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const recruiterModel = require('../models/recruiterModel');
    const stats = await recruiterModel.getRecruiterStats(req.user.userId);
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get recruiter stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get stats'
    });
  }
};

/**
 * Get staff profile for recruiter view
 * @route GET /api/recruiter/staff-profile/:staffId
 */
const getStaffProfileForRecruiter = async (req, res) => {
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
        message: 'Access denied. Recruiter only.'
      });
    }

    const { staffId } = req.params;
    const staffModel = require('../models/staffModel');
    const staffProfile = await staffModel.getStaffProfile(staffId);
    
    if (!staffProfile) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: staffProfile
    });
    
  } catch (error) {
    console.error('Get staff profile for recruiter error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get staff profile'
    });
  }
};

/**
 * Get hiring history for recruiter
 * @route GET /api/recruiter/hiring-history
 */
const getHiringHistory = async (req, res) => {
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
        message: 'Access denied. Recruiter only.'
      });
    }

    const recruiterModel = require('../models/recruiterModel');
    const allCandidates = await recruiterModel.getAllRecruiterCandidates(req.user.userId);
    
    // Filter only hired candidates
    const hiredCandidates = allCandidates.filter(candidate => candidate.status === 'Hired');
    
    res.status(200).json({
      success: true,
      data: hiredCandidates
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
 * Delete/reject candidate from candidate search
 * @route DELETE /api/recruiter/candidates/:staffId/:applicationId
 */
const deleteCandidateFromSearch = async (req, res) => {
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
        message: 'Access denied. Recruiter only.'
      });
    }

    const { staffId, applicationId } = req.params;
    const recruiterModel = require('../models/recruiterModel');
    
    // Update candidate status to 'Rejected'
    await recruiterModel.updateCandidateStatus(req.user.userId, staffId, applicationId, 'Rejected');
    
    res.status(200).json({
      success: true,
      message: 'Candidate rejected successfully'
    });
    
  } catch (error) {
    console.error('Delete candidate from search error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject candidate'
    });
  }
};

/**
 * Follow a recruiter
 * @route POST /api/recruiter/:recruiterId/follow
 */
const followRecruiter = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { recruiterId } = req.params;
    
    if (req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Only staff can follow recruiters'
      });
    }
    
    const dynamoService = require('../services/dynamoService');
    const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE;
    
    // Get recruiter profile
    const recruiterProfile = await dynamoService.getItem(RECRUITER_PROFILES_TABLE, { recruiterId }) || {};
    const currentFollowers = recruiterProfile.followers || [];
    
    // Log followers count instead of full array
    console.log(`Followers count for recruiter ${recruiterId}:`, currentFollowers.length);
    
    // Check if already following
    if (currentFollowers.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already following this recruiter'
      });
    }
    
    // Add user to followers list
    const updatedFollowers = [...currentFollowers, userId];
    
    // Update recruiter profile with new follower
    await dynamoService.putItem(RECRUITER_PROFILES_TABLE, {
      ...recruiterProfile,
      recruiterId,
      followers: updatedFollowers,
      followersCount: updatedFollowers.length,
      updatedAt: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: 'Successfully followed recruiter',
      data: { followersCount: updatedFollowers.length }
    });
    
  } catch (error) {
    console.error('Follow recruiter error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to follow recruiter'
    });
  }
};

/**
 * Unfollow a recruiter
 * @route DELETE /api/recruiter/:recruiterId/follow
 */
const unfollowRecruiter = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { recruiterId } = req.params;
    
    if (req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Only staff can unfollow recruiters'
      });
    }
    
    const dynamoService = require('../services/dynamoService');
    const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE;
    
    // Get recruiter profile
    const recruiterProfile = await dynamoService.getItem(RECRUITER_PROFILES_TABLE, { recruiterId }) || {};
    const currentFollowers = recruiterProfile.followers || [];
    
    // Remove user from followers list
    const updatedFollowers = currentFollowers.filter(id => id !== userId);
    
    // Update recruiter profile
    await dynamoService.putItem(RECRUITER_PROFILES_TABLE, {
      ...recruiterProfile,
      recruiterId,
      followers: updatedFollowers,
      followersCount: updatedFollowers.length,
      updatedAt: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: 'Successfully unfollowed recruiter',
      data: { followersCount: updatedFollowers.length }
    });
    
  } catch (error) {
    console.error('Unfollow recruiter error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to unfollow recruiter'
    });
  }
};

/**
 * Get follow status
 * @route GET /api/recruiter/:recruiterId/follow-status
 */
const getFollowStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { recruiterId } = req.params;
    
    const dynamoService = require('../services/dynamoService');
    const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE;
    
    // Get recruiter profile and check if user is in followers list
    const recruiterProfile = await dynamoService.getItem(RECRUITER_PROFILES_TABLE, { recruiterId }) || {};
    const followers = recruiterProfile.followers || [];
    
    const isFollowing = followers.includes(userId);
    
    res.status(200).json({
      success: true,
      data: { isFollowing }
    });
    
  } catch (error) {
    console.error('Get follow status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get follow status'
    });
  }
};

module.exports = {
  registerRecruiter,
  getRecruiterProfile,
  updateRecruiterProfile,
  verifyWebsite,
  getAllRecruiters,
  getAllRecruitersPublic,
  getRecruiterByIdPublic,
  deleteRecruiter,
  getRecruiterCandidates,
  updateCandidateStatus,
  uploadProfilePhoto,
  getRecruiterDashboardStats,
  getStaffProfileForRecruiter,
  getHiringHistory,
  deleteCandidateFromSearch,
  followRecruiter,
  unfollowRecruiter,
  getFollowStatus
};