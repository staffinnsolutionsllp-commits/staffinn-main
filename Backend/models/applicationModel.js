/**
 * Application Model
 * Handles job applications and profile views
 */
const staffModel = require('./staffModel');
const { v4: uuidv4 } = require('uuid');

/**
 * Apply for a job
 */
const applyForJob = async (applicationData) => {
  try {
    const { staffId, recruiterId, jobId, jobTitle, companyName } = applicationData;
    
    // Get staff profile
    const staff = await staffModel.getStaffProfile(staffId);
    if (!staff) throw new Error('Staff not found');
    
    // Check if already applied for this job
    const applications = staff.applications || [];
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
      appliedAt: new Date().toISOString(),
      status: 'Applied'
    };
    
    // Add to staff applications
    applications.push(application);
    
    // Add to recent activity
    const recentActivity = staff.recentActivity || [];
    recentActivity.unshift({
      id: uuidv4(),
      type: 'job_application',
      message: `You applied for ${jobTitle} at ${companyName}`,
      timestamp: new Date().toISOString()
    });
    
    await staffModel.updateStaffProfile(staffId, {
      applications,
      recentActivity: recentActivity.slice(0, 10) // Keep only last 10 activities
    });
    
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

module.exports = {
  applyForJob,
  recordProfileView,
  getDashboardData,
  updateRecruiterStats
};