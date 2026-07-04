/**
 * Recruiter Model
 * Handles recruiter-specific data operations with DynamoDB
 */

const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');

// Get table names from environment variables
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE;

/**
 * Get all recruiters with public profile information
 * @returns {Promise<Array>} - Array of recruiter profiles
 */
const getAllRecruiters = async () => {
  try {
    // Scan for all users with recruiter role
    const params = {
      FilterExpression: '#role = :role',
      ExpressionAttributeNames: {
        '#role': 'role'
      },
      ExpressionAttributeValues: {
        ':role': 'recruiter'
      }
    };

    const recruiters = await dynamoService.scanItems(USERS_TABLE, params);
    
    // Get all recruiter profiles
    const allProfiles = await dynamoService.scanItems(RECRUITER_PROFILES_TABLE);
    const profilesMap = {};
    allProfiles.forEach(profile => {
      profilesMap[profile.recruiterId] = profile;
    });
    
    // Format recruiter data for public display
    return recruiters.map(recruiter => {
      const profile = profilesMap[recruiter.userId] || {};
      return {
        id: recruiter.userId,
        companyName: profile.companyName || recruiter.name || recruiter.companyName,
        industry: profile.industry || 'Technology',
        location: profile.location || 'India',
        verified: true, // For now, all are verified
        recruiterName: profile.recruiterName || 'HR Manager',
        designation: profile.designation || 'HR Manager',
        experience: profile.experience || '3+ years',
        companyDescription: profile.companyDescription || 'A leading technology company.',
        website: profile.website || recruiter.website,
        email: recruiter.email,
        phone: profile.phone || recruiter.phone,
        createdAt: recruiter.createdAt,
        // Use live profile data if available, otherwise use default values
        perks: (profile.isLive !== false ? profile.perks : null) || [
          { text: 'Health insurance' },
          { text: 'Work from home options' },
          { text: 'Learning & development budget' },
          { text: 'Performance bonuses' }
        ],
        hiringSteps: (profile.isLive !== false ? profile.hiringSteps : null) || [
          { title: 'Online Application', description: 'Submit your resume and complete a brief questionnaire.' },
          { title: 'HR Screening Call', description: '30-minute call to discuss your background and expectations.' },
          { title: 'Technical Assessment', description: 'Complete a skill-based assessment relevant to the position.' },
          { title: 'Final Round & Offer', description: 'Discussion with management, followed by an offer if selected.' }
        ],
        interviewQuestions: (profile.isLive !== false ? profile.interviewQuestions : null) || [
          'Tell us about yourself and your experience.',
          'Why do you want to work with our company?',
          'What are your salary expectations?',
          'Do you have any questions for us?'
        ]
      };
    });
  } catch (error) {
    console.error('Error getting all recruiters:', error);
    throw error;
  }
};

/**
 * Get recruiter by ID with complete profile
 * @param {string} recruiterId - Recruiter ID
 * @returns {Promise<object|null>} - Recruiter profile or null
 */
const getRecruiterById = async (recruiterId) => {
  try {
    const recruiter = await dynamoService.getItem(USERS_TABLE, { userId: recruiterId });
    
    if (!recruiter || recruiter.role !== 'recruiter') {
      return null;
    }
    
    // Get profile data from recruiter-profiles table
    const profile = await dynamoService.getItem(RECRUITER_PROFILES_TABLE, { recruiterId }) || {};
    
    console.log('Retrieved profile from DynamoDB:', {
      recruiterId,
      hasOfficeImages: !!profile.officeImages,
      officeImagesCount: profile.officeImages ? profile.officeImages.length : 0,
      officeImages: profile.officeImages
    });
    
    // Format recruiter data
    const formattedData = {
      id: recruiter.userId,
      companyName: profile.companyName || recruiter.name || recruiter.companyName,
      industry: profile.industry || 'Technology',
      location: profile.location || 'India',
      verified: true,
      recruiterName: profile.recruiterName || 'HR Manager',
      designation: profile.designation || 'HR Manager',
      experience: profile.experience || '3+ years',
      companyDescription: profile.companyDescription || 'A leading technology company.',
      website: profile.website || recruiter.website,
      email: recruiter.email,
      phone: profile.phone || recruiter.phone,
      profilePhoto: profile.profilePhoto,
      officeImages: profile.officeImages || [],
      createdAt: recruiter.createdAt,
      perks: (profile.isLive !== false ? profile.perks : null) || [
        { text: 'Health insurance' },
        { text: 'Work from home options' },
        { text: 'Learning & development budget' },
        { text: 'Performance bonuses' }
      ],
      hiringSteps: (profile.isLive !== false ? profile.hiringSteps : null) || [
        { title: 'Online Application', description: 'Submit your resume and complete a brief questionnaire.' },
        { title: 'HR Screening Call', description: '30-minute call to discuss your background and expectations.' },
        { title: 'Technical Assessment', description: 'Complete a skill-based assessment relevant to the position.' },
        { title: 'Final Round & Offer', description: 'Discussion with management, followed by an offer if selected.' }
      ],
      interviewQuestions: (profile.isLive !== false ? profile.interviewQuestions : null) || [
        'Tell us about yourself and your experience.',
        'Why do you want to work with our company?',
        'What are your salary expectations?',
        'Do you have any questions for us?'
      ]
    };
    
    console.log('Formatted recruiter data with office images:', {
      recruiterId,
      officeImagesCount: formattedData.officeImages.length,
      officeImages: formattedData.officeImages
    });
    
    return formattedData;
  } catch (error) {
    console.error('Error getting recruiter by ID:', error);
    throw error;
  }
};

/**
 * Update recruiter profile
 * @param {string} recruiterId - Recruiter ID
 * @param {object} updateData - Data to update
 * @returns {Promise<object>} - Updated recruiter profile
 */
const updateRecruiterProfile = async (recruiterId, updateData) => {
  try {
    // Get current recruiter data from users table (registration data only)
    const currentRecruiter = await dynamoService.getItem(USERS_TABLE, { userId: recruiterId });
    
    if (!currentRecruiter) {
      throw new Error('Recruiter not found');
    }

    // Prepare profile data for recruiter-profiles table
    const profileData = {
      recruiterId,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    // Update profile data in recruiter-profiles table (separate from registration data)
    await dynamoService.putItem(RECRUITER_PROFILES_TABLE, profileData);
    
    // Get updated profile data
    const updatedProfile = await dynamoService.getItem(RECRUITER_PROFILES_TABLE, { recruiterId });
    
    // Return merged data
    return {
      ...currentRecruiter,
      ...updatedProfile
    };
  } catch (error) {
    console.error('Error updating recruiter profile:', error);
    throw error;
  }
};

/**
 * Search recruiters by various criteria
 * @param {object} searchCriteria - Search criteria
 * @returns {Promise<Array>} - Array of matching recruiters
 */
const searchRecruiters = async (searchCriteria = {}) => {
  try {
    let filterExpression = '#role = :role';
    const expressionAttributeNames = { '#role': 'role' };
    const expressionAttributeValues = { ':role': 'recruiter' };
    
    // Add search filters
    if (searchCriteria.industry) {
      filterExpression += ' AND contains(#industry, :industry)';
      expressionAttributeNames['#industry'] = 'industry';
      expressionAttributeValues[':industry'] = searchCriteria.industry;
    }
    
    if (searchCriteria.location) {
      filterExpression += ' AND contains(#location, :location)';
      expressionAttributeNames['#location'] = 'location';
      expressionAttributeValues[':location'] = searchCriteria.location;
    }
    
    if (searchCriteria.companyName) {
      filterExpression += ' AND contains(#name, :companyName)';
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':companyName'] = searchCriteria.companyName;
    }
    
    const params = {
      FilterExpression: filterExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    };
    
    const recruiters = await dynamoService.scanItems(USERS_TABLE, params);
    
    // Format recruiter data for search results
    return recruiters.map(recruiter => ({
      id: recruiter.userId,
      companyName: recruiter.name || recruiter.companyName,
      industry: recruiter.industry || 'Technology',
      location: recruiter.location || 'India',
      verified: true,
      recruiterName: recruiter.recruiterName || 'HR Manager',
      website: recruiter.website
    }));
  } catch (error) {
    console.error('Error searching recruiters:', error);
    throw error;
  }
};



/**
 * Get all candidates who applied to recruiter's jobs (regardless of status)
 * @param {string} recruiterId - Recruiter ID
 * @returns {Promise<Array>} - Array of all candidates
 */
const getAllRecruiterCandidates = async (recruiterId) => {
  try {
    const allStaffProfiles = await dynamoService.scanItems('staffinn-staff-profiles');
    const candidates = [];
    
    for (const staff of allStaffProfiles) {
      if (staff.applications && staff.applications.length > 0) {
        const recruiterApplications = staff.applications.filter(app => app.recruiterId === recruiterId);
        
        for (const application of recruiterApplications) {
          candidates.push({
            id: `${staff.userId}-${application.applicationId}`,
            name: staff.fullName,
            position: application.jobTitle,
            skills: staff.skills || 'Not specified',
            status: application.status,
            date: application.appliedAt,
            experience: staff.experience || 'Not specified',
            email: staff.email,
            phone: staff.phone,
            staffId: staff.userId,
            applicationId: application.applicationId,
            jobId: application.jobId // Include jobId for filtering
          });
        }
      }
    }
    
    return candidates.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('Get all recruiter candidates error:', error);
    return [];
  }
};

/**
 * Get candidates who applied to recruiter's jobs with enhanced search
 * @param {string} recruiterId - Recruiter ID
 * @param {object} searchFilters - Search and filter parameters
 * @returns {Promise<Array>} - Array of candidates
 */
const getRecruiterCandidates = async (recruiterId, searchFilters = {}) => {
  try {
    const allCandidates = await getAllRecruiterCandidates(recruiterId);
    
    // Apply search and filters
    let filteredCandidates = allCandidates;
    
    // Search by name, skills, or experience
    if (searchFilters.search) {
      const searchTerm = searchFilters.search.toLowerCase();
      filteredCandidates = filteredCandidates.filter(candidate => 
        candidate.name.toLowerCase().includes(searchTerm) ||
        (candidate.skills && candidate.skills.toLowerCase().includes(searchTerm)) ||
        (candidate.experience && candidate.experience.toLowerCase().includes(searchTerm))
      );
    }
    
    // Filter by status
    if (searchFilters.status && searchFilters.status !== 'all') {
      if (searchFilters.status === 'hired') {
        filteredCandidates = filteredCandidates.filter(candidate => candidate.status === 'Hired');
      } else if (searchFilters.status === 'rejected') {
        filteredCandidates = filteredCandidates.filter(candidate => candidate.status === 'Rejected');
      } else if (searchFilters.status === 'new') {
        filteredCandidates = filteredCandidates.filter(candidate => candidate.status === 'Applied');
      }
    }
    
    // Filter by specific job
    if (searchFilters.jobId && searchFilters.jobId !== 'all') {
      filteredCandidates = filteredCandidates.filter(candidate => 
        candidate.jobId === searchFilters.jobId
      );
    }
    
    return filteredCandidates;
  } catch (error) {
    console.error('Get recruiter candidates error:', error);
    return [];
  }
};

/**
 * Update candidate status (hire or reject)
 * @param {string} recruiterId - Recruiter ID
 * @param {string} staffId - Staff ID
 * @param {string} applicationId - Application ID
 * @param {string} status - New status ('Hired' or 'Rejected')
 * @returns {Promise<boolean>} - Success status
 */
const updateCandidateStatus = async (recruiterId, staffId, applicationId, status) => {
  try {
    const staffModel = require('./staffModel');
    const staff = await staffModel.getStaffProfile(staffId);
    
    if (!staff) throw new Error('Staff not found');
    
    const applications = staff.applications || [];
    const updatedApplications = applications.map(app => 
      app.applicationId === applicationId && app.recruiterId === recruiterId
        ? { ...app, status }
        : app
    );
    
    await staffModel.updateStaffProfile(staffId, {
      applications: updatedApplications
    });
    
    // Update recruiter's hire count if status is 'Hired'
    if (status === 'Hired') {
      const applicationModel = require('./applicationModel');
      await applicationModel.updateRecruiterStats(recruiterId, 'hire');
    }
    
    return true;
  } catch (error) {
    console.error('Update candidate status error:', error);
    throw new Error('Failed to update candidate status');
  }
};

/**
 * Get recruiter dashboard stats
 * @param {string} recruiterId - Recruiter ID
 * @returns {Promise<object>} - Dashboard statistics
 */
const getRecruiterStats = async (recruiterId) => {
  try {
    // Get all candidates for this recruiter (including all statuses)
    const allCandidates = await getAllRecruiterCandidates(recruiterId);
    
    // Get followers count from recruiter profile
    const dynamoService = require('../services/dynamoService');
    const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE;
    const recruiterProfile = await dynamoService.getItem(RECRUITER_PROFILES_TABLE, { recruiterId }) || {};
    const followersCount = recruiterProfile.followersCount || 0;
    
    // Also get institute applications count from job applications table
    let instituteApplicationsCount = 0;
    try {
      const jobApplicationModel = require('./jobApplicationModel');
      const dynamoService = require('../services/dynamoService');
      const { JOB_APPLICATIONS_TABLE } = require('../config/dynamodb');
      
      const params = {
        FilterExpression: 'recruiterID = :recruiterId AND attribute_exists(instituteID)',
        ExpressionAttributeValues: {
          ':recruiterId': recruiterId
        }
      };
      
      const instituteApps = await dynamoService.scanItems(JOB_APPLICATIONS_TABLE, params);
      instituteApplicationsCount = instituteApps.length;
      console.log(`Recruiter ${recruiterId} institute applications:`, instituteApplicationsCount);
    } catch (error) {
      console.log('Institute applications count error (non-critical):', error.message);
    }
    
    // Calculate real-time statistics
    const staffApplications = allCandidates.length;
    const totalApplications = staffApplications + instituteApplicationsCount;
    const totalHires = allCandidates.filter(candidate => candidate.status === 'Hired').length;
    const pendingApplications = allCandidates.filter(candidate => candidate.status === 'Applied').length;
    const rejectedApplications = allCandidates.filter(candidate => candidate.status === 'Rejected').length;
    
    console.log(`Recruiter ${recruiterId} stats:`, {
      staffApplications,
      instituteApplicationsCount,
      totalApplications,
      totalHires
    });
    
    return {
      applications: totalApplications,
      totalApplications: totalApplications,
      staffApplications: staffApplications,
      instituteApplications: instituteApplicationsCount,
      hires: totalHires,
      pending: pendingApplications,
      rejected: rejectedApplications,
      followers: followersCount
    };
  } catch (error) {
    console.error('Get recruiter stats error:', error);
    return { 
      applications: 0, 
      totalApplications: 0,
      staffApplications: 0,
      instituteApplications: 0,
      hires: 0, 
      pending: 0, 
      rejected: 0, 
      followers: 0 
    };
  }
};

module.exports = {
  getAllRecruiters,
  getRecruiterById,
  updateRecruiterProfile,
  searchRecruiters,
  getRecruiterStats,
  getRecruiterCandidates,
  getAllRecruiterCandidates,
  updateCandidateStatus
};