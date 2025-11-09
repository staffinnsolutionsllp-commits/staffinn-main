/**
 * Admin Controller
 * Handles admin authentication and staff management operations
 */
const adminModel = require('../models/adminModel');
const staffModel = require('../models/staffModel');
const userModel = require('../models/userModel');
const applicationModel = require('../models/applicationModel');
const contactModel = require('../models/contactModel');
const jwtUtils = require('../utils/jwtUtils');
const dynamoService = require('../services/dynamoService');

/**
 * Get dashboard data
 * @route GET /api/admin/dashboard
 */
const getDashboardData = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Get all users
    const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
    const allUsers = await dynamoService.scanItems(USERS_TABLE);
    console.log('Total users in database:', allUsers.length);
    
    // For real-time dashboard (no filters), show current totals
    // For historical view (with month/year), show filtered data
    const isHistoricalView = month && year && month !== 'undefined' && year !== 'undefined';
    
    let filteredUsers = allUsers;
    if (isHistoricalView) {
      filteredUsers = allUsers.filter(user => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return userDate.getMonth() + 1 === parseInt(month) && userDate.getFullYear() === parseInt(year);
      });
    }
    
    // Total Users - use real-time count unless historical view
    const totalUsers = isHistoricalView ? filteredUsers.length : allUsers.length;
    
    // Staff data - get all staff profiles
    const STAFF_PROFILES_TABLE = process.env.STAFF_TABLE;
    const allStaffProfiles = await dynamoService.scanItems(STAFF_PROFILES_TABLE);
    console.log('Total staff profiles in database:', allStaffProfiles.length);
    
    let staffProfiles = allStaffProfiles;
    if (isHistoricalView) {
      // For historical data, filter by creation date
      staffProfiles = allStaffProfiles.filter(profile => {
        if (!profile.createdAt) return false;
        const profileDate = new Date(profile.createdAt);
        return profileDate.getMonth() + 1 === parseInt(month) && profileDate.getFullYear() === parseInt(year);
      });
    }
    
    // Calculate staff metrics - use real-time data unless historical view
    const staffToCount = isHistoricalView ? staffProfiles : allStaffProfiles;
    const totalStaff = staffToCount.length;
    const activeStaff = staffToCount.filter(profile => profile.isActiveStaff === true).length;
    const totalSeekers = staffToCount.filter(profile => profile.isActiveStaff === false || profile.isActiveStaff === null || profile.isActiveStaff === undefined).length;
    
    // Recruiters - use real-time count unless historical view
    const allRecruiters = allUsers.filter(user => user.role === 'recruiter');
    const recruiters = isHistoricalView ? filteredUsers.filter(user => user.role === 'recruiter') : allRecruiters;
    const totalRecruiters = recruiters.length;
    console.log('Total recruiters:', totalRecruiters);
    
    // Jobs
    const JOBS_TABLE = 'staffinn-jobs';
    let allJobs = [];
    try {
      allJobs = await dynamoService.scanItems(JOBS_TABLE);
    } catch (error) {
      console.error('Error scanning jobs table:', error);
      allJobs = [];
    }
    
    let jobs = allJobs;
    if (isHistoricalView) {
      jobs = allJobs.filter(job => {
        if (!job.createdAt && !job.postedDate) return false;
        const jobDate = new Date(job.createdAt || job.postedDate);
        return jobDate.getMonth() + 1 === parseInt(month) && jobDate.getFullYear() === parseInt(year);
      });
    }
    const totalJobs = isHistoricalView ? jobs.length : allJobs.length;
    console.log('Total jobs:', totalJobs);
    
    // Institutes - get from institute profiles table (same as Institute Dashboard)
    const INSTITUTE_PROFILES_TABLE = 'staffinn-institute-profiles';
    let allInstituteProfiles = [];
    try {
      allInstituteProfiles = await dynamoService.scanItems(INSTITUTE_PROFILES_TABLE);
      console.log('Found institute profiles:', allInstituteProfiles.length);
    } catch (error) {
      console.error('Error scanning institute profiles table:', error);
      allInstituteProfiles = [];
    }
    
    let instituteProfiles = allInstituteProfiles;
    if (isHistoricalView) {
      instituteProfiles = allInstituteProfiles.filter(profile => {
        if (!profile.createdAt) return false;
        const profileDate = new Date(profile.createdAt);
        return profileDate.getMonth() + 1 === parseInt(month) && profileDate.getFullYear() === parseInt(year);
      });
    }
    const totalInstitutes = isHistoricalView ? instituteProfiles.length : allInstituteProfiles.length;
    
    // Students - get from students table (same as Institute Dashboard)
    const STUDENTS_TABLE = 'staffinn-institute-students';
    let allStudents = [];
    try {
      allStudents = await dynamoService.scanItems(STUDENTS_TABLE);
      console.log('Found students in table:', allStudents.length);
    } catch (error) {
      console.error('Error scanning students table:', error);
      allStudents = [];
    }
    
    let students = allStudents;
    if (isHistoricalView) {
      students = allStudents.filter(student => {
        if (!student.createdAt && !student.addedDate) return false;
        const studentDate = new Date(student.createdAt || student.addedDate);
        return studentDate.getMonth() + 1 === parseInt(month) && studentDate.getFullYear() === parseInt(year);
      });
    }
    const totalStudents = isHistoricalView ? students.length : allStudents.length;
    
    // Courses
    const COURSES_TABLE = 'staffinn-courses';
    let allCourses = [];
    try {
      allCourses = await dynamoService.scanItems(COURSES_TABLE);
    } catch (error) {
      console.error('Error scanning courses table:', error);
      allCourses = [];
    }
    
    let courses = allCourses;
    if (isHistoricalView) {
      courses = allCourses.filter(course => {
        if (!course.createdAt) return false;
        const courseDate = new Date(course.createdAt);
        return courseDate.getMonth() + 1 === parseInt(month) && courseDate.getFullYear() === parseInt(year);
      });
    }
    const totalCourses = isHistoricalView ? courses.length : allCourses.length;
    console.log('Total courses:', totalCourses);
    
    // Hired (from hiring records)
    const HIRING_RECORDS_TABLE = 'staffinn-hiring-records';
    let totalHired = 0;
    try {
      const allHiringRecords = await dynamoService.scanItems(HIRING_RECORDS_TABLE);
      let hiringRecords = allHiringRecords;
      if (month && year) {
        hiringRecords = allHiringRecords.filter(record => {
          if (!record.hiredDate && !record.createdAt) return false;
          const hiredDate = new Date(record.hiredDate || record.createdAt);
          return hiredDate.getMonth() + 1 === parseInt(month) && hiredDate.getFullYear() === parseInt(year);
        });
      }
      totalHired = hiringRecords.length;
    } catch (error) {
      console.log('Hiring records table not found, calculating from active staff and students');
      // Fallback: count active staff + students as potential hired
      totalHired = activeStaff + totalStudents;
    }
    
    // Debug logging
    console.log('Dashboard Data Debug:');
    console.log('- Total Users:', totalUsers);
    console.log('- Total Staff:', totalStaff);
    console.log('- Active Staff:', activeStaff);
    console.log('- Total Seekers:', totalSeekers);
    console.log('- Total Recruiters:', totalRecruiters);
    console.log('- Total Jobs:', totalJobs);
    console.log('- Total Institutes:', totalInstitutes);
    console.log('- Total Students:', totalStudents);
    console.log('- Total Courses:', totalCourses);
    console.log('- Total Hired:', totalHired);
    
    const dashboardData = {
      totalUsers,
      totalStaff,
      activeStaff,
      totalSeekers,
      totalRecruiters,
      totalJobs,
      totalInstitutes,
      totalStudents,
      totalCourses,
      totalHired
    };
    
    res.status(200).json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data'
    });
  }
};

/**
 * Admin login
 * @route POST /api/admin/login
 */
const adminLogin = async (req, res) => {
  try {
    const { adminId, password } = req.body;
    
    if (!adminId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID and password are required'
      });
    }
    
    // Verify admin credentials
    const isValid = await adminModel.verifyAdminPassword(adminId, password);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }
    
    // Get admin data
    const admin = await adminModel.getAdminById(adminId);
    
    // Generate JWT token
    const tokenData = {
      userId: adminId,
      role: 'admin',
      email: 'admin@staffinn.com'
    };
    
    const tokens = jwtUtils.generateTokens(tokenData);
    
    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        adminId,
        role: 'admin',
        ...tokens
      }
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin login failed'
    });
  }
};

/**
 * Change admin password
 * @route POST /api/admin/change-password
 */
const changeAdminPassword = async (req, res) => {
  try {
    const { adminId, currentPassword, newPassword } = req.body;
    
    if (!adminId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Verify current password
    const isCurrentValid = await adminModel.verifyAdminPassword(adminId, currentPassword);
    
    if (!isCurrentValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    await adminModel.updateAdminPassword(adminId, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
    
  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

/**
 * Get all staff users for admin dashboard
 * @route GET /api/admin/staff/users
 */
const getAllStaffUsers = async (req, res) => {
  try {
    // Get all staff profiles
    const staffProfiles = await staffModel.getAllStaffProfiles();
    
    // Get user data for each staff profile
    const staffUsersWithProfiles = await Promise.all(
      staffProfiles.map(async (profile) => {
        try {
          const user = await userModel.findUserById(profile.userId);
          
          // Get contact history for this staff
          const contactHistory = await contactModel.getContactHistory(profile.userId);
          
          return {
            ...profile,
            user: user || {},
            contactHistory: contactHistory || [],
            profileMode: profile.isActiveStaff ? 'Active Staff' : 'Seeker',
            isBlocked: user?.isBlocked || false,
            isVisible: profile.profileVisibility === 'public'
          };
        } catch (error) {
          console.error('Error getting user data for staff:', profile.userId, error);
          return {
            ...profile,
            user: {},
            contactHistory: [],
            profileMode: profile.isActiveStaff ? 'Active Staff' : 'Seeker',
            isBlocked: false,
            isVisible: profile.profileVisibility === 'public'
          };
        }
      })
    );
    
    res.status(200).json({
      success: true,
      data: staffUsersWithProfiles
    });
    
  } catch (error) {
    console.error('Get all staff users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff users'
    });
  }
};

/**
 * Get staff dashboard data for admin
 * @route GET /api/admin/staff/dashboard
 */
const getStaffDashboardData = async (req, res) => {
  try {
    // Get all staff profiles
    const staffProfiles = await staffModel.getAllStaffProfiles();
    
    // Get dashboard data for each staff
    const dashboardData = await Promise.all(
      staffProfiles.map(async (profile) => {
        try {
          const dashboard = await applicationModel.getDashboardData(profile.userId);
          return {
            userId: profile.userId,
            staffId: profile.staffId,
            fullName: profile.fullName,
            email: profile.email,
            profilePhoto: profile.profilePhoto,
            profileMode: profile.isActiveStaff ? 'Active Staff' : 'Seeker',
            ...dashboard
          };
        } catch (error) {
          console.error('Error getting dashboard data for staff:', profile.userId, error);
          return {
            userId: profile.userId,
            staffId: profile.staffId,
            fullName: profile.fullName,
            email: profile.email,
            profilePhoto: profile.profilePhoto,
            profileMode: profile.isActiveStaff ? 'Active Staff' : 'Seeker',
            totalApplications: 0,
            profileViews: 0,
            recentApplications: [],
            recentActivity: [],
            applicationTrend: []
          };
        }
      })
    );
    
    res.status(200).json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('Get staff dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff dashboard data'
    });
  }
};

/**
 * Get specific staff profile for admin
 * @route GET /api/admin/staff/profile/:userId
 */
const getStaffProfileForAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get staff profile
    const staffProfile = await staffModel.getStaffProfile(userId);
    if (!staffProfile) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found'
      });
    }
    
    // Get user data
    const user = await userModel.findUserById(userId);
    
    // Get contact history
    const contactHistory = await contactModel.getContactHistory(userId);
    
    // Get dashboard data
    const dashboardData = await applicationModel.getDashboardData(userId);
    
    const fullProfile = {
      ...staffProfile,
      user: user || {},
      contactHistory: contactHistory || [],
      dashboardData,
      profileMode: staffProfile.isActiveStaff ? 'Active Staff' : 'Seeker',
      isBlocked: user?.isBlocked || false,
      isVisible: staffProfile.profileVisibility === 'public'
    };
    
    res.status(200).json({
      success: true,
      data: fullProfile
    });
    
  } catch (error) {
    console.error('Get staff profile for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff profile'
    });
  }
};

/**
 * Toggle staff profile visibility
 * @route PUT /api/admin/staff/toggle-visibility/:userId
 */
const toggleStaffVisibility = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get current profile
    const staffProfile = await staffModel.getStaffProfile(userId);
    if (!staffProfile) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found'
      });
    }
    
    // Toggle visibility
    const newVisibility = staffProfile.profileVisibility === 'public' ? 'private' : 'public';
    
    await staffModel.updateProfileVisibility(userId, newVisibility);
    
    // Send real-time visibility update to user
    const { sendVisibilityUpdate } = require('../config/socket');
    const visibilityData = {
      isHidden: newVisibility === 'private',
      message: newVisibility === 'private' ? 'Your profile has been hidden by administrators' : 'Your profile is now visible',
      timestamp: new Date().toISOString()
    };
    sendVisibilityUpdate(userId, visibilityData);
    
    res.status(200).json({
      success: true,
      message: `Profile ${newVisibility === 'public' ? 'shown' : 'hidden'} successfully`,
      data: { visibility: newVisibility }
    });
    
  } catch (error) {
    console.error('Toggle staff visibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle profile visibility'
    });
  }
};

/**
 * Block/Unblock staff user
 * @route PUT /api/admin/staff/toggle-block/:userId
 */
const toggleStaffBlock = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get current user from database directly
    const dynamoService = require('../services/dynamoService');
    const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
    const user = await dynamoService.getItem(USERS_TABLE, { userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Toggle block status
    const newBlockStatus = !user.isBlocked;
    
    await userModel.updateUser(userId, { 
      isBlocked: newBlockStatus,
      updatedAt: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: `User ${newBlockStatus ? 'blocked' : 'unblocked'} successfully`,
      data: { isBlocked: newBlockStatus }
    });
    
  } catch (error) {
    console.error('Toggle staff block error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user block status'
    });
  }
};

/**
 * Delete staff user completely
 * @route DELETE /api/admin/staff/delete/:userId
 */
const deleteStaffUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Delete staff profile
    await staffModel.deleteStaffProfile(userId);
    
    // Delete user account
    await userModel.deleteUser(userId);
    
    res.status(200).json({
      success: true,
      message: 'Staff user deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete staff user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete staff user'
    });
  }
};

/**
 * Initialize default admin (for setup)
 * @route POST /api/admin/initialize
 */
const initializeAdmin = async (req, res) => {
  try {
    const admin = await adminModel.initializeDefaultAdmin();
    
    res.status(200).json({
      success: true,
      message: 'Admin initialized successfully',
      data: {
        adminId: admin.adminId,
        message: 'Default password is: admin123'
      }
    });
    
  } catch (error) {
    console.error('Initialize admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize admin'
    });
  }
};

/**
 * Get all recruiters for admin dashboard
 * @route GET /api/admin/recruiter/users
 */
const getAllRecruiters = async (req, res) => {
  try {
    const dynamoService = require('../services/dynamoService');
    const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
    const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE;
    
    // Get all users with recruiter role
    const allUsers = await dynamoService.scanItems(USERS_TABLE);
    const recruiters = allUsers.filter(user => user.role === 'recruiter');
    
    // Get all recruiter profiles
    const allProfiles = await dynamoService.scanItems(RECRUITER_PROFILES_TABLE);
    const profilesMap = {};
    allProfiles.forEach(profile => {
      profilesMap[profile.recruiterId] = profile;
    });
    
    // Merge user data with profile data
    const recruitersWithProfiles = recruiters.map(recruiter => {
      const profile = profilesMap[recruiter.userId] || {};
      return {
        ...recruiter,
        ...profile,
        isVisible: recruiter.isVisible !== false, // Default to true if not set
        isBlocked: recruiter.isBlocked || false,
        followersCount: profile.followersCount || 0
      };
    });
    
    res.status(200).json({
      success: true,
      data: recruitersWithProfiles
    });
    
  } catch (error) {
    console.error('Get all recruiters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recruiters'
    });
  }
};

/**
 * Get recruiter profile for admin
 * @route GET /api/admin/recruiter/profile/:recruiterId
 */
const getRecruiterProfileForAdmin = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    // Get user data
    const user = await userModel.findUserById(recruiterId);
    if (!user || user.role !== 'recruiter') {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }
    
    // Get profile data
    const dynamoService = require('../services/dynamoService');
    const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE;
    const profile = await dynamoService.getItem(RECRUITER_PROFILES_TABLE, { recruiterId }) || {};
    
    // Get jobs posted by this recruiter
    const jobModel = require('../models/jobModel');
    const jobs = await jobModel.getJobsByRecruiter(recruiterId);
    
    // Get hiring history
    const hiringModel = require('../models/hiringModel');
    const hiringHistory = await hiringModel.getRecruiterHiringHistory(recruiterId);
    
    // Get dashboard stats
    const recruiterModel = require('../models/recruiterModel');
    let dashboardStats = {};
    try {
      dashboardStats = await recruiterModel.getRecruiterStats(recruiterId);
    } catch (error) {
      console.log('Could not get recruiter stats:', error.message);
    }
    
    const fullProfile = {
      ...user,
      ...profile,
      jobs,
      hiringHistory,
      dashboardStats,
      isVisible: !user.isBlocked,
      isBlocked: user.isBlocked || false
    };
    
    res.status(200).json({
      success: true,
      data: fullProfile
    });
    
  } catch (error) {
    console.error('Get recruiter profile for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recruiter profile'
    });
  }
};

/**
 * Toggle recruiter visibility
 * @route PUT /api/admin/recruiter/toggle-visibility/:recruiterId
 */
const toggleRecruiterVisibility = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    // Get current user
    const user = await userModel.findUserById(recruiterId);
    if (!user || user.role !== 'recruiter') {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }
    
    // Toggle visibility status (separate from blocking)
    const currentVisibility = user.isVisible !== false; // Default to true if undefined
    const newVisibility = !currentVisibility;
    
    await userModel.updateUser(recruiterId, { 
      isVisible: newVisibility,
      updatedAt: new Date().toISOString()
    });
    
    // Send real-time visibility update to recruiter
    const { sendVisibilityUpdate } = require('../config/socket');
    const visibilityData = {
      isHidden: !newVisibility,
      message: !newVisibility ? 'Your profile has been hidden by administrators' : 'Your profile is now visible',
      timestamp: new Date().toISOString()
    };
    sendVisibilityUpdate(recruiterId, visibilityData);
    
    res.status(200).json({
      success: true,
      message: `Recruiter ${newVisibility ? 'shown' : 'hidden'} successfully`,
      data: { isVisible: newVisibility }
    });
    
  } catch (error) {
    console.error('Toggle recruiter visibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle recruiter visibility'
    });
  }
};

/**
 * Block/Unblock recruiter
 * @route PUT /api/admin/recruiter/toggle-block/:recruiterId
 */
const toggleRecruiterBlock = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    // Get current user
    const user = await userModel.findUserById(recruiterId);
    if (!user || user.role !== 'recruiter') {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }
    
    // Toggle block status
    const newBlockStatus = !user.isBlocked;
    
    await userModel.updateUser(recruiterId, { 
      isBlocked: newBlockStatus,
      updatedAt: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: `Recruiter ${newBlockStatus ? 'blocked' : 'unblocked'} successfully`,
      data: { isBlocked: newBlockStatus }
    });
    
  } catch (error) {
    console.error('Toggle recruiter block error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle recruiter block status'
    });
  }
};

/**
 * Delete recruiter
 * @route DELETE /api/admin/recruiter/delete/:recruiterId
 */
const deleteRecruiter = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    // Check if recruiter exists
    const user = await userModel.findUserById(recruiterId);
    if (!user || user.role !== 'recruiter') {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }
    
    // Delete user account
    await userModel.deleteUser(recruiterId);
    
    // Delete recruiter profile
    const dynamoService = require('../services/dynamoService');
    const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE;
    try {
      await dynamoService.deleteItem(RECRUITER_PROFILES_TABLE, { recruiterId });
    } catch (error) {
      console.log('Profile deletion error (non-critical):', error.message);
    }
    
    res.status(200).json({
      success: true,
      message: 'Recruiter deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete recruiter error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recruiter'
    });
  }
};

/**
 * Get recruiter institutes
 * @route GET /api/admin/recruiter/:recruiterId/institutes
 */
const getRecruiterInstitutes = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    const dynamoService = require('../services/dynamoService');
    const jobApplicationModel = require('../models/jobApplicationModel');
    const instituteModel = require('../models/instituteModel');
    
    // Get all job applications for this recruiter
    const allApplications = await jobApplicationModel.getAllApplications();
    const recruiterApplications = allApplications.filter(app => app.recruiterID === recruiterId);
    
    // Group by institute
    const instituteMap = {};
    recruiterApplications.forEach(app => {
      if (!instituteMap[app.instituteID]) {
        instituteMap[app.instituteID] = {
          instituteId: app.instituteID,
          applications: [],
          studentIds: new Set(),
          jobIds: new Set()
        };
      }
      instituteMap[app.instituteID].applications.push(app);
      instituteMap[app.instituteID].studentIds.add(app.studentID);
      instituteMap[app.instituteID].jobIds.add(app.jobID);
    });
    
    // Get institute details and build response
    const institutes = await Promise.all(
      Object.values(instituteMap).map(async (instituteData) => {
        try {
          // Get institute profile
          const institute = await instituteModel.getProfileById(instituteData.instituteId);
          
          return {
            instituteId: instituteData.instituteId,
            instituteName: institute?.instituteName || 'Unknown Institute',
            instituteLocation: institute?.location || institute?.address || 'Location Not Defined',
            location: institute?.location || institute?.address || 'Location Not Defined',
            email: institute?.email || 'Not provided',
            phone: institute?.phone || 'Not provided',
            logo: institute?.logo,
            studentsCount: instituteData.studentIds.size,
            jobsApplied: instituteData.jobIds.size,
            totalApplications: instituteData.applications.length,
            firstApplicationDate: instituteData.applications[0]?.appliedDate || new Date().toISOString()
          };
        } catch (error) {
          console.error('Error getting institute details:', error);
          return {
            instituteId: instituteData.instituteId,
            instituteName: 'Unknown Institute',
            instituteLocation: 'Location Not Defined',
            location: 'Location Not Defined',
            email: 'Not provided',
            phone: 'Not provided',
            studentsCount: instituteData.studentIds.size,
            jobsApplied: instituteData.jobIds.size,
            totalApplications: instituteData.applications.length,
            firstApplicationDate: instituteData.applications[0]?.appliedDate || new Date().toISOString()
          };
        }
      })
    );
    
    res.status(200).json({
      success: true,
      data: institutes
    });
    
  } catch (error) {
    console.error('Get recruiter institutes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recruiter institutes'
    });
  }
};

/**
 * Get recruiter jobs
 * @route GET /api/admin/recruiter/:recruiterId/jobs
 */
const getRecruiterJobs = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    const jobModel = require('../models/jobModel');
    const jobs = await jobModel.getJobsByRecruiter(recruiterId);
    
    // Get application counts for each job
    const jobsWithStats = await Promise.all(
      jobs.map(async (job) => {
        try {
          // Get staff applications from staff profiles
          const dynamoService = require('../services/dynamoService');
          const STAFF_PROFILES_TABLE = 'staffinn-staff-profiles';
          const staffProfiles = await dynamoService.scanItems(STAFF_PROFILES_TABLE);
          
          let staffApplications = 0;
          staffProfiles.forEach(profile => {
            if (profile.applications && Array.isArray(profile.applications)) {
              const jobApplications = profile.applications.filter(app => 
                app.jobId === job.jobId && app.recruiterId === recruiterId
              );
              staffApplications += jobApplications.length;
            }
          });
          
          // Get institute applications from job applications table
          let instituteApplications = 0;
          try {
            const jobApplicationModel = require('../models/jobApplicationModel');
            const allJobApplications = await jobApplicationModel.getJobApplications(job.jobId);
            instituteApplications = allJobApplications.filter(app => 
              app.recruiterID === recruiterId && app.instituteID
            ).length;
            console.log(`Job ${job.jobId} institute applications:`, instituteApplications);
          } catch (error) {
            console.log('Institute applications query error (non-critical):', error.message);
            instituteApplications = 0;
          }
          
          return {
            ...job,
            staffApplications,
            instituteApplications: instituteApplications,
            totalApplications: staffApplications + instituteApplications
          };
        } catch (error) {
          console.error('Error getting job stats:', error);
          return {
            ...job,
            staffApplications: 0,
            instituteApplications: 0,
            totalApplications: 0
          };
        }
      })
    );
    
    res.status(200).json({
      success: true,
      data: jobsWithStats
    });
    
  } catch (error) {
    console.error('Get recruiter jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recruiter jobs'
    });
  }
};

/**
 * Get recruiter hiring history
 * @route GET /api/admin/recruiter/:recruiterId/hiring-history
 */
const getRecruiterHiringHistoryForAdmin = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    const dynamoService = require('../services/dynamoService');
    const jobApplicationModel = require('../models/jobApplicationModel');
    
    // Get all applications for this recruiter
    const allApplications = await jobApplicationModel.getAllApplications();
    const recruiterApplications = allApplications.filter(app => app.recruiterID === recruiterId);
    
    // Get all staff applications for this recruiter
    const STAFF_PROFILES_TABLE = 'staffinn-staff-profiles';
    const staffProfiles = await dynamoService.scanItems(STAFF_PROFILES_TABLE);
    const staffApplications = [];
    
    staffProfiles.forEach(profile => {
      if (profile.applications && Array.isArray(profile.applications)) {
        const recruiterStaffApps = profile.applications.filter(app => 
          app.recruiterId === recruiterId || app.recruiterID === recruiterId
        );
        recruiterStaffApps.forEach(app => {
          staffApplications.push({
            applicantType: 'staff',
            staffId: profile.userId,
            staffName: profile.fullName,
            staffEmail: profile.email,
            profilePhoto: profile.profilePhoto,
            jobTitle: app.jobTitle || 'Job Title Not Available',
            jobId: app.jobId,
            createdAt: app.appliedDate || new Date().toISOString(),
            status: app.status || 'pending',
            hiringRecordID: `staff_${profile.userId}_${app.jobId || 'unknown'}`
          });
        });
      }
    });
    
    // Process all student applications
    const studentRecords = await Promise.all(
      recruiterApplications.map(async (app) => {
        try {
          // Get student details
          const INSTITUTE_STUDENTS_TABLE = 'staffinn-institute-students';
          const allStudents = await dynamoService.scanItems(INSTITUTE_STUDENTS_TABLE);
          const student = allStudents.find(s => 
            (s.instituteId === app.instituteID) &&
            (s.instituteStudntsID === app.studentID || s.studentId === app.studentID)
          );
          
          // Get job details
          const jobModel = require('../models/jobModel');
          const job = await jobModel.getJobById(app.jobID);
          
          return {
            applicantType: 'institute',
            studentId: app.studentID,
            jobTitle: job?.jobTitle || job?.title || 'Job Title Not Available',
            jobId: app.jobID,
            createdAt: app.timestamp || app.appliedDate || new Date().toISOString(),
            status: app.status || 'pending',
            hiringRecordID: `student_${app.studentID}_${app.jobID}`,
            studentSnapshot: {
              fullName: student?.fullName || student?.name || `Student ${app.studentID}`,
              email: student?.email || student?.emailAddress || 'No email',
              phone: student?.phone || student?.phoneNumber,
              course: student?.course || student?.program || 'Course not specified',
              year: student?.year || student?.currentYear || 'Year not specified',
              profilePhoto: student?.profilePhoto || student?.photo,
              instituteName: student?.instituteName || 'Institute not specified',
              cgpa: student?.cgpa || student?.gpa,
              skills: student?.skills
            }
          };
        } catch (error) {
          console.error('Error processing student application:', error);
          return {
            applicantType: 'institute',
            studentId: app.studentID,
            jobTitle: 'Job Title Not Available',
            jobId: app.jobID,
            createdAt: app.timestamp || new Date().toISOString(),
            status: app.status || 'pending',
            hiringRecordID: `student_${app.studentID}_${app.jobID}`,
            studentSnapshot: {
              fullName: `Student ${app.studentID}`,
              email: 'No email',
              course: 'Course not specified',
              year: 'Year not specified'
            }
          };
        }
      })
    );
    
    // Combine all applications and sort by date
    const allCandidates = [...staffApplications, ...studentRecords]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.status(200).json({
      success: true,
      data: allCandidates
    });
    
  } catch (error) {
    console.error('Get recruiter hiring history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recruiter hiring history'
    });
  }
};

/**
 * Get recruiter dashboard stats
 * @route GET /api/admin/recruiter/:recruiterId/dashboard
 */
const getRecruiterDashboardForAdmin = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    const recruiterModel = require('../models/recruiterModel');
    const stats = await recruiterModel.getRecruiterStats(recruiterId);
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get recruiter dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recruiter dashboard'
    });
  }
};

/**
 * Get institute students for a recruiter
 * @route GET /api/admin/institute/:instituteId/students
 */
const getInstituteStudents = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const { recruiterId } = req.query;
    
    const dynamoService = require('../services/dynamoService');
    const jobApplicationModel = require('../models/jobApplicationModel');
    
    // Get all job applications from this institute to the recruiter
    const applications = await jobApplicationModel.getApplicationsByInstituteAndRecruiter(instituteId, recruiterId);
    
    // Get all students from institute students table
    const INSTITUTE_STUDENTS_TABLE = 'staffinn-institute-students';
    const allStudents = await dynamoService.scanItems(INSTITUTE_STUDENTS_TABLE);
    
    // Group applications by student and get their details
    const studentMap = new Map();
    
    for (const app of applications) {
      // Find student by matching instituteId and studentId
      const student = allStudents.find(s => 
        (s.instituteId === app.instituteID || s.instituteId === instituteId) &&
        (s.instituteStudntsID === app.studentID || s.studentId === app.studentID)
      );
      
      // Get job details
      const jobModel = require('../models/jobModel');
      const job = await jobModel.getJobById(app.jobID);
      
      const studentKey = app.studentID;
      
      if (!studentMap.has(studentKey)) {
        studentMap.set(studentKey, {
          studentId: app.studentID,
          fullName: student?.fullName || student?.name || `Student ${app.studentID}`,
          email: student?.email || student?.emailAddress || 'No email provided',
          course: student?.course || student?.program || 'Course not specified',
          year: student?.year || student?.currentYear || 'Year not specified',
          profilePhoto: student?.profilePhoto || student?.photo,
          applications: []
        });
      }
      
      // Add this job application to the student's applications
      studentMap.get(studentKey).applications.push({
        jobTitle: job?.jobTitle || job?.title || 'Job not found',
        applicationStatus: app.status || 'Pending',
        appliedDate: app.timestamp || app.appliedDate || new Date().toISOString()
      });
    }
    
    // Convert map to array and flatten for display
    const studentsWithJobs = [];
    for (const [studentId, studentData] of studentMap) {
      // Create one entry per job application
      for (const application of studentData.applications) {
        studentsWithJobs.push({
          studentId: studentData.studentId,
          fullName: studentData.fullName,
          email: studentData.email,
          course: studentData.course,
          year: studentData.year,
          profilePhoto: studentData.profilePhoto,
          jobTitle: application.jobTitle,
          applicationStatus: application.applicationStatus,
          appliedDate: application.appliedDate,
          uniqueKey: `${studentId}_${application.jobTitle}_${application.appliedDate}`
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: studentsWithJobs
    });
    
  } catch (error) {
    console.error('Get institute students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get institute students'
    });
  }
};

/**
 * Get student profile
 * @route GET /api/admin/student/profile/:studentId
 */
const getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const dynamoService = require('../services/dynamoService');
    const INSTITUTE_STUDENTS_TABLE = 'staffinn-institute-students';
    
    // Get all students and find the one with matching studentId
    const allStudents = await dynamoService.scanItems(INSTITUTE_STUDENTS_TABLE);
    const student = allStudents.find(s => 
      s.studentId === studentId || 
      s.instituteStudntsID === studentId ||
      s.id === studentId
    );
    
    if (!student) {
      // Get applications even if student details not found
      const jobApplicationModel = require('../models/jobApplicationModel');
      const applications = await jobApplicationModel.getApplicationsByStudent(studentId);
      
      const enrichedApplications = await Promise.all(
        (applications || []).map(async (app) => {
          try {
            const jobModel = require('../models/jobModel');
            const userModel = require('../models/userModel');
            
            const job = await jobModel.getJobById(app.jobID);
            const recruiter = await userModel.findUserById(app.recruiterID);
            
            return {
              ...app,
              jobTitle: job?.jobTitle || job?.title || 'Job Title Not Available',
              companyName: recruiter?.companyName || recruiter?.name || 'Company Not Available',
              appliedDate: app.timestamp || app.appliedDate
            };
          } catch (error) {
            return {
              ...app,
              jobTitle: 'Job Title Not Available',
              companyName: 'Company Not Available',
              appliedDate: app.timestamp || app.appliedDate
            };
          }
        })
      );
      
      return res.status(200).json({
        success: true,
        data: {
          studentId: studentId,
          fullName: `Student ${studentId}`,
          email: 'Email not available',
          course: 'Course information not available',
          year: 'Year not specified',
          applications: enrichedApplications
        }
      });
    }
    
    // Get student's application history with job details
    const jobApplicationModel = require('../models/jobApplicationModel');
    const applications = await jobApplicationModel.getApplicationsByStudent(studentId);
    
    // Enrich applications with job and recruiter details
    const enrichedApplications = await Promise.all(
      (applications || []).map(async (app) => {
        try {
          const jobModel = require('../models/jobModel');
          const userModel = require('../models/userModel');
          
          const job = await jobModel.getJobById(app.jobID);
          const recruiter = await userModel.findUserById(app.recruiterID);
          
          return {
            ...app,
            jobTitle: job?.jobTitle || job?.title || 'Job Title Not Available',
            companyName: recruiter?.companyName || recruiter?.name || 'Company Not Available',
            appliedDate: app.timestamp || app.appliedDate
          };
        } catch (error) {
          return {
            ...app,
            jobTitle: 'Job Title Not Available',
            companyName: 'Company Not Available',
            appliedDate: app.timestamp || app.appliedDate
          };
        }
      })
    );
    
    const studentProfile = {
      studentId: student.studentId || student.instituteStudntsID || studentId,
      fullName: student.fullName || student.name || `Student ${studentId}`,
      email: student.email || student.emailAddress || 'Email not available',
      course: student.course || student.program || student.branch || student.department || 'Course not specified',
      year: student.year || student.currentYear || student.academicYear || student.semester || 'Year not specified',
      profilePhoto: student.profilePhoto || student.photo || student.profilePicture,
      phone: student.phone || student.phoneNumber || student.mobile,
      instituteId: student.instituteId,
      applications: enrichedApplications
    };
    
    res.status(200).json({
      success: true,
      data: studentProfile
    });
    
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student profile'
    });
  }
};

/**
 * Get job candidates (staff and students)
 * @route GET /api/admin/job/:jobId/candidates
 */
const getJobCandidates = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const dynamoService = require('../services/dynamoService');
    
    // Get staff applications
    const STAFF_PROFILES_TABLE = 'staffinn-staff-profiles';
    const staffProfiles = await dynamoService.scanItems(STAFF_PROFILES_TABLE);
    
    const staffCandidates = [];
    staffProfiles.forEach(profile => {
      if (profile.applications && Array.isArray(profile.applications)) {
        const jobApplications = profile.applications.filter(app => app.jobId === jobId);
        if (jobApplications.length > 0) {
          jobApplications.forEach(app => {
            staffCandidates.push({
              staffId: profile.userId,
              fullName: profile.fullName || profile.name || `Staff ${profile.userId}`,
              email: profile.email || profile.emailAddress || 'No email provided',
              profilePhoto: profile.profilePhoto || profile.photo || profile.profilePicture,
              experience: profile.experience || profile.workExperience || 'Experience not specified',
              applicationStatus: app.status || 'Pending',
              appliedDate: app.appliedDate || app.timestamp || new Date().toISOString()
            });
          });
        }
      }
    });
    
    // Get student applications
    const jobApplicationModel = require('../models/jobApplicationModel');
    const jobApplications = await jobApplicationModel.getJobApplications(jobId);
    
    // Get all students from institute students table
    const INSTITUTE_STUDENTS_TABLE = 'staffinn-institute-students';
    const allStudents = await dynamoService.scanItems(INSTITUTE_STUDENTS_TABLE);
    
    const studentCandidates = await Promise.all(
      jobApplications.map(async (app) => {
        try {
          // Find student by matching instituteId and studentId
          const student = allStudents.find(s => 
            (s.instituteId === app.instituteID || s.instituteId === app.instituteID) &&
            (s.instituteStudntsID === app.studentID || s.studentId === app.studentID)
          );
          
          // Get institute name
          const instituteModel = require('../models/instituteModel');
          const institute = await instituteModel.getProfileById(app.instituteID);
          
          return {
            studentId: app.studentID,
            fullName: student?.fullName || student?.name || `Student ${app.studentID}`,
            email: student?.email || student?.emailAddress || 'No email provided',
            profilePhoto: student?.profilePhoto || student?.photo || student?.profilePicture,
            course: student?.course || student?.program || student?.branch || student?.department || 'Course not specified',
            year: student?.year || student?.currentYear || student?.academicYear || student?.semester || 'Year not specified',
            instituteName: institute?.instituteName || 'Institute not found',
            applicationStatus: app.status || 'Pending',
            appliedDate: app.timestamp || app.appliedDate || new Date().toISOString()
          };
        } catch (error) {
          console.error('Error getting student candidate details:', error);
          return {
            studentId: app.studentID,
            fullName: `Student ${app.studentID}`,
            email: 'No email provided',
            course: 'Course not specified',
            year: 'Year not specified',
            instituteName: 'Institute not found',
            applicationStatus: app.status || 'Pending',
            appliedDate: app.timestamp || new Date().toISOString()
          };
        }
      })
    );
    
    res.status(200).json({
      success: true,
      data: {
        staff: staffCandidates,
        students: studentCandidates
      }
    });
    
  } catch (error) {
    console.error('Get job candidates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job candidates'
    });
  }
};

module.exports = {
  adminLogin,
  changeAdminPassword,
  getAllStaffUsers,
  getStaffDashboardData,
  getStaffProfileForAdmin,
  toggleStaffVisibility,
  toggleStaffBlock,
  deleteStaffUser,
  initializeAdmin,
  // Recruiter admin functions
  getAllRecruiters,
  getRecruiterProfileForAdmin,
  toggleRecruiterVisibility,
  toggleRecruiterBlock,
  deleteRecruiter,
  getRecruiterInstitutes,
  getRecruiterJobs,
  getRecruiterHiringHistoryForAdmin,
  getRecruiterDashboardForAdmin,
  // New functions for enhanced functionality
  getInstituteStudents,
  getStudentProfile,
  getJobCandidates
};

/**
 * Institute Management APIs
 */

/**
 * Get institute dashboard data
 * @route GET /api/admin/institute/dashboard
 */
const getInstituteDashboardData = async (req, res) => {
  try {
    const dynamoService = require('../services/dynamoService');
    
    // Get total institutes
    const INSTITUTE_PROFILES_TABLE = 'staffinn-institute-profiles';
    const institutes = await dynamoService.scanItems(INSTITUTE_PROFILES_TABLE);
    const totalInstitutes = institutes.length;
    
    // Get total courses
    const COURSES_TABLE = 'staffinn-courses';
    const courses = await dynamoService.scanItems(COURSES_TABLE);
    const totalCourses = courses.length;
    
    // Get total students
    const STUDENTS_TABLE = 'staffinn-institute-students';
    const students = await dynamoService.scanItems(STUDENTS_TABLE);
    const totalStudents = students.length;
    
    res.status(200).json({
      success: true,
      data: {
        totalInstitutes,
        totalCourses,
        totalStudents
      }
    });
    
  } catch (error) {
    console.error('Get institute dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get institute dashboard data'
    });
  }
};

/**
 * Get all institutes for admin
 * @route GET /api/admin/institute/users
 */
const getAllInstitutesForAdmin = async (req, res) => {
  try {
    const dynamoService = require('../services/dynamoService');
    const userModel = require('../models/userModel');
    
    // Get all users with institute role
    const allUsers = await dynamoService.scanItems(process.env.DYNAMODB_USERS_TABLE);
    const institutes = allUsers.filter(user => user.role === 'institute');
    
    // Get all institute profiles
    const INSTITUTE_PROFILES_TABLE = 'staffinn-institute-profiles';
    const allProfiles = await dynamoService.scanItems(INSTITUTE_PROFILES_TABLE);
    const profilesMap = {};
    allProfiles.forEach(profile => {
      profilesMap[profile.instituteId] = profile;
    });
    
    // Merge user data with profile data
    const institutesWithProfiles = institutes.map(institute => {
      const profile = profilesMap[institute.userId] || {};
      return {
        ...institute,
        ...profile,
        isVisible: institute.isVisible !== false,
        isBlocked: institute.isBlocked || false
      };
    });
    
    res.status(200).json({
      success: true,
      data: institutesWithProfiles
    });
    
  } catch (error) {
    console.error('Get all institutes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get institutes'
    });
  }
};

/**
 * Get institute profile for admin
 * @route GET /api/admin/institute/profile/:instituteId
 */
const getInstituteProfileForAdmin = async (req, res) => {
  try {
    const { instituteId } = req.params;
    
    // Get user data
    const user = await userModel.findUserById(instituteId);
    if (!user || user.role !== 'institute') {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }
    
    // Get profile data
    const dynamoService = require('../services/dynamoService');
    const INSTITUTE_PROFILES_TABLE = 'staffinn-institute-profiles';
    const profile = await dynamoService.getItem(INSTITUTE_PROFILES_TABLE, { instituteId }) || {};
    
    // Get placement data
    const institutePlacementModel = require('../models/institutePlacementModel');
    let placementData = null;
    try {
      placementData = await institutePlacementModel.getPlacementSectionByInstituteId(instituteId);
    } catch (error) {
      console.log('No placement data found for institute:', instituteId);
    }
    
    // Get industry collaboration data
    const instituteIndustryCollabModel = require('../models/instituteIndustryCollabModel');
    let collaborationData = null;
    try {
      collaborationData = await instituteIndustryCollabModel.getIndustryCollabSectionByInstituteId(instituteId);
    } catch (error) {
      console.log('No collaboration data found for institute:', instituteId);
    }
    
    const fullProfile = {
      ...user,
      ...profile,
      isVisible: !user.isBlocked,
      isBlocked: user.isBlocked || false,
      placementData: placementData || {
        averageSalary: null,
        highestPackage: null,
        topHiringCompanies: [],
        recentPlacementSuccess: []
      },
      collaborationData: collaborationData || {
        collaborationCards: [],
        mouItems: []
      }
    };
    
    res.status(200).json({
      success: true,
      data: fullProfile
    });
    
  } catch (error) {
    console.error('Get institute profile for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get institute profile'
    });
  }
};

/**
 * Toggle institute visibility
 * @route PUT /api/admin/institute/toggle-visibility/:instituteId
 */
const toggleInstituteVisibility = async (req, res) => {
  try {
    const { instituteId } = req.params;
    
    const user = await userModel.findUserById(instituteId);
    if (!user || user.role !== 'institute') {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }
    
    const currentVisibility = user.isVisible !== false;
    const newVisibility = !currentVisibility;
    
    await userModel.updateUser(instituteId, { 
      isVisible: newVisibility,
      updatedAt: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: `Institute ${newVisibility ? 'shown' : 'hidden'} successfully`,
      data: { isVisible: newVisibility }
    });
    
  } catch (error) {
    console.error('Toggle institute visibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle institute visibility'
    });
  }
};

/**
 * Block/Unblock institute
 * @route PUT /api/admin/institute/toggle-block/:instituteId
 */
const toggleInstituteBlock = async (req, res) => {
  try {
    const { instituteId } = req.params;
    
    const user = await userModel.findUserById(instituteId);
    if (!user || user.role !== 'institute') {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }
    
    const newBlockStatus = !user.isBlocked;
    
    await userModel.updateUser(instituteId, { 
      isBlocked: newBlockStatus,
      updatedAt: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: `Institute ${newBlockStatus ? 'blocked' : 'unblocked'} successfully`,
      data: { isBlocked: newBlockStatus }
    });
    
  } catch (error) {
    console.error('Toggle institute block error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle institute block status'
    });
  }
};

/**
 * Delete institute
 * @route DELETE /api/admin/institute/delete/:instituteId
 */
const deleteInstitute = async (req, res) => {
  try {
    const { instituteId } = req.params;
    
    const user = await userModel.findUserById(instituteId);
    if (!user || user.role !== 'institute') {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }
    
    await userModel.deleteUser(instituteId);
    
    const dynamoService = require('../services/dynamoService');
    const INSTITUTE_PROFILES_TABLE = 'staffinn-institute-profiles';
    try {
      await dynamoService.deleteItem(INSTITUTE_PROFILES_TABLE, { instituteId });
    } catch (error) {
      console.log('Profile deletion error (non-critical):', error.message);
    }
    
    res.status(200).json({
      success: true,
      message: 'Institute deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete institute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete institute'
    });
  }
};

/**
 * Get all students across institutes
 * @route GET /api/admin/institute/students
 */
const getAllStudents = async (req, res) => {
  try {
    const { instituteId } = req.query;
    const dynamoService = require('../services/dynamoService');
    
    const STUDENTS_TABLE = 'staffinn-institute-students';
    let students = await dynamoService.scanItems(STUDENTS_TABLE);
    
    // Filter by institute if specified
    if (instituteId) {
      students = students.filter(student => student.instituteId === instituteId);
    }
    
    // Get hiring status for each student
    const studentsWithStatus = await Promise.all(
      students.map(async (student) => {
        try {
          // Check if student is hired by looking at job applications
          const jobApplicationModel = require('../models/jobApplicationModel');
          const applications = await jobApplicationModel.getApplicationsByStudent(
            student.studentId || student.instituteStudntsID
          );
          
          const hiredApplication = applications.find(app => app.status === 'hired');
          let recruiterInfo = null;
          
          if (hiredApplication) {
            try {
              const recruiter = await userModel.findUserById(hiredApplication.recruiterID);
              recruiterInfo = {
                name: recruiter?.name || recruiter?.companyName || 'Unknown Recruiter',
                company: recruiter?.companyName || recruiter?.name || 'Unknown Company'
              };
            } catch (error) {
              console.error('Error getting recruiter info:', error);
            }
          }
          
          return {
            ...student,
            isHired: !!hiredApplication,
            recruiterInfo,
            totalApplications: applications.length
          };
        } catch (error) {
          console.error('Error processing student:', error);
          return {
            ...student,
            isHired: false,
            recruiterInfo: null,
            totalApplications: 0
          };
        }
      })
    );
    
    res.status(200).json({
      success: true,
      data: studentsWithStatus
    });
    
  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get students'
    });
  }
};

/**
 * Get student profile with full details
 * @route GET /api/admin/institute/student/:studentId
 */
const getStudentProfileForAdmin = async (req, res) => {
  try {
    const { studentId } = req.params;
    const dynamoService = require('../services/dynamoService');
    
    const STUDENTS_TABLE = 'staffinn-institute-students';
    const allStudents = await dynamoService.scanItems(STUDENTS_TABLE);
    const student = allStudents.find(s => 
      s.studentId === studentId || 
      s.instituteStudntsID === studentId ||
      s.id === studentId
    );
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Get application history
    const jobApplicationModel = require('../models/jobApplicationModel');
    const applications = await jobApplicationModel.getApplicationsByStudent(studentId);
    
    const enrichedApplications = await Promise.all(
      (applications || []).map(async (app) => {
        try {
          const jobModel = require('../models/jobModel');
          const recruiter = await userModel.findUserById(app.recruiterID);
          const job = await jobModel.getJobById(app.jobID);
          
          return {
            ...app,
            jobTitle: job?.jobTitle || job?.title || 'Job Title Not Available',
            companyName: recruiter?.companyName || recruiter?.name || 'Company Not Available',
            appliedDate: app.timestamp || app.appliedDate
          };
        } catch (error) {
          return {
            ...app,
            jobTitle: 'Job Title Not Available',
            companyName: 'Company Not Available',
            appliedDate: app.timestamp || app.appliedDate
          };
        }
      })
    );
    
    const studentProfile = {
      ...student,
      applications: enrichedApplications
    };
    
    res.status(200).json({
      success: true,
      data: studentProfile
    });
    
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student profile'
    });
  }
};

/**
 * Get all courses across institutes
 * @route GET /api/admin/institute/courses
 */
const getAllCourses = async (req, res) => {
  try {
    const { instituteId } = req.query;
    const dynamoService = require('../services/dynamoService');
    
    const COURSES_TABLE = 'staffinn-courses';
    let courses = await dynamoService.scanItems(COURSES_TABLE);
    
    // Filter by institute if specified
    if (instituteId) {
      courses = courses.filter(course => course.instituteId === instituteId);
    }
    
    // Get enrollment and review data for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        try {
          // Get enrolled users
          const ENROLLED_TABLE = 'course-enrolled-user';
          const enrollments = await dynamoService.scanItems(ENROLLED_TABLE);
          const courseEnrollments = enrollments.filter(e => e.courseId === course.coursesId);
          
          // Get reviews
          const REVIEWS_TABLE = 'course-review';
          const reviews = await dynamoService.scanItems(REVIEWS_TABLE);
          const courseReviews = reviews.filter(r => r.courseId === course.coursesId);
          
          return {
            ...course,
            totalEnrolled: courseEnrollments.length,
            totalReviews: courseReviews.length,
            averageRating: courseReviews.length > 0 
              ? (courseReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / courseReviews.length).toFixed(1)
              : 0,
            enrolledUsers: courseEnrollments,
            reviews: courseReviews
          };
        } catch (error) {
          console.error('Error processing course:', error);
          return {
            ...course,
            totalEnrolled: 0,
            totalReviews: 0,
            averageRating: 0,
            enrolledUsers: [],
            reviews: []
          };
        }
      })
    );
    
    res.status(200).json({
      success: true,
      data: coursesWithStats
    });
    
  } catch (error) {
    console.error('Get all courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get courses'
    });
  }
};

module.exports = {
  getDashboardData,
  adminLogin,
  changeAdminPassword,
  getAllStaffUsers,
  getStaffDashboardData,
  getStaffProfileForAdmin,
  toggleStaffVisibility,
  toggleStaffBlock,
  deleteStaffUser,
  initializeAdmin,
  // Recruiter admin functions
  getAllRecruiters,
  getRecruiterProfileForAdmin,
  toggleRecruiterVisibility,
  toggleRecruiterBlock,
  deleteRecruiter,
  getRecruiterInstitutes,
  getRecruiterJobs,
  getRecruiterHiringHistoryForAdmin,
  getRecruiterDashboardForAdmin,
  // Institute admin functions
  getInstituteDashboardData,
  getAllInstitutesForAdmin,
  getInstituteProfileForAdmin,
  toggleInstituteVisibility,
  toggleInstituteBlock,
  deleteInstitute,
  getAllStudents,
  getStudentProfileForAdmin,
  getAllCourses,
  // Enhanced functionality
  getInstituteStudents,
  getStudentProfile,
  getJobCandidates
};

/**
 * Government Schemes Management APIs
 */

/**
 * Get all government schemes
 * @route GET /api/admin/government-schemes
 */
const getAllGovernmentSchemes = async (req, res) => {
  try {
    const governmentSchemeModel = require('../models/governmentSchemeModel');
    const schemes = await governmentSchemeModel.getAllSchemes();
    
    res.status(200).json({
      success: true,
      data: schemes
    });
  } catch (error) {
    console.error('Get all government schemes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get government schemes'
    });
  }
};

/**
 * Add new government scheme
 * @route POST /api/admin/government-schemes
 */
const addGovernmentScheme = async (req, res) => {
  try {
    const { schemeName, schemeLink, description, visibility } = req.body;
    
    if (!schemeName || !schemeLink || !visibility) {
      return res.status(400).json({
        success: false,
        message: 'Scheme name, link, and visibility are required'
      });
    }
    
    // Validate URL format
    try {
      new URL(schemeLink);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format for scheme link'
      });
    }
    
    // Validate visibility
    if (!['All', 'Staff', 'Recruiter'].includes(visibility)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visibility option'
      });
    }
    
    const governmentSchemeModel = require('../models/governmentSchemeModel');
    const scheme = await governmentSchemeModel.addScheme({
      schemeName,
      schemeLink,
      description: description || '',
      visibility
    });
    
    res.status(201).json({
      success: true,
      message: 'Government scheme added successfully',
      data: scheme
    });
  } catch (error) {
    console.error('Add government scheme error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add government scheme'
    });
  }
};

/**
 * Update government scheme
 * @route PUT /api/admin/government-schemes/:schemeId
 */
const updateGovernmentScheme = async (req, res) => {
  try {
    const { schemeId } = req.params;
    const { schemeName, schemeLink, description, visibility } = req.body;
    
    if (!schemeName || !schemeLink || !visibility) {
      return res.status(400).json({
        success: false,
        message: 'Scheme name, link, and visibility are required'
      });
    }
    
    // Validate URL format
    try {
      new URL(schemeLink);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format for scheme link'
      });
    }
    
    // Validate visibility
    if (!['All', 'Staff', 'Recruiter'].includes(visibility)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visibility option'
      });
    }
    
    const governmentSchemeModel = require('../models/governmentSchemeModel');
    const updatedScheme = await governmentSchemeModel.updateScheme(schemeId, {
      schemeName,
      schemeLink,
      description: description || '',
      visibility
    });
    
    res.status(200).json({
      success: true,
      message: 'Government scheme updated successfully',
      data: updatedScheme
    });
  } catch (error) {
    console.error('Update government scheme error:', error);
    if (error.message === 'Scheme not found') {
      return res.status(404).json({
        success: false,
        message: 'Government scheme not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update government scheme'
    });
  }
};

/**
 * Delete government scheme
 * @route DELETE /api/admin/government-schemes/:schemeId
 */
const deleteGovernmentScheme = async (req, res) => {
  try {
    const { schemeId } = req.params;
    
    const governmentSchemeModel = require('../models/governmentSchemeModel');
    await governmentSchemeModel.deleteScheme(schemeId);
    
    res.status(200).json({
      success: true,
      message: 'Government scheme deleted successfully'
    });
  } catch (error) {
    console.error('Delete government scheme error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete government scheme'
    });
  }
};

// Import and re-export issue controller functions for admin routes
const issueController = require('./issueController');
module.exports.getAllIssues = issueController.getAllIssues;
module.exports.resolveIssue = issueController.resolveIssue;
module.exports.deleteIssue = issueController.deleteIssue;

// Export government schemes functions
module.exports.getAllGovernmentSchemes = getAllGovernmentSchemes;
module.exports.addGovernmentScheme = addGovernmentScheme;
module.exports.updateGovernmentScheme = updateGovernmentScheme;
module.exports.deleteGovernmentScheme = deleteGovernmentScheme;