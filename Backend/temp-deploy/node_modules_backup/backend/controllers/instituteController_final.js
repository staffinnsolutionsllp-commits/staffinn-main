/**
 * Institute Controller
 * Handles institute registration and management
 */
const userModel = require('../models/userModel');
const instituteModel = require('../models/instituteModel');
const institutePlacementModel = require('../models/institutePlacementModel');
const instituteIndustryCollabModel = require('../models/instituteIndustryCollabModel');
const jwtUtils = require('../utils/jwtUtils');
const { validateInstituteRegistration } = require('../utils/validation');
const emailService = require('../services/emailService');
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

// Initialize S3 client with proper configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  forcePathStyle: false, // Use virtual hosted-style URLs
  signatureVersion: 'v4'
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

// Validate S3 configuration on startup
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('⚠️ AWS credentials not found. S3 uploads may fail.');
}

if (!process.env.S3_BUCKET_NAME) {
  console.warn('⚠️ S3_BUCKET_NAME not configured. Using default: staffinn-files');
}

console.log('✅ S3 Client initialized:', {
  region: process.env.AWS_REGION || 'ap-south-1',
  bucket: S3_BUCKET_NAME,
  hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
});

/**
 * Get dashboard stats for Staffinn Partner Dashboard
 * @route GET /api/institute/dashboard/stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('🔍 Getting dashboard stats for institute:', userId);
    
    // Import required models
    const trainingCenterModel = require('../models/trainingCenterModel');
    const jobApplicationModel = require('../models/jobApplicationModel');
    const courseDetailModel = require('../models/courseDetailModel');
    const misStudentModel = require('../models/misStudentModel');
    
    // Initialize stats with default values
    let totalCenters = 0;
    let totalCourses = 0;
    let totalStudents = 0;
    let totalTrainedStudents = 0;
    
    // Get total centers with error handling
    try {
      console.log('📊 Fetching training centers...');
      const centers = await trainingCenterModel.getCentersByInstitute(userId);
      totalCenters = Array.isArray(centers) ? centers.length : 0;
      console.log('✅ Training centers found:', totalCenters);
    } catch (centerError) {
      console.error('❌ Error fetching training centers:', centerError.message);
      totalCenters = 0;
    }
    
    // Get total courses from mis-course-details table with error handling
    try {
      console.log('📚 Fetching courses from mis-course-details...');
      const allCourses = await courseDetailModel.getAll();
      const instituteCourses = allCourses.filter(course => course.instituteId === userId);
      totalCourses = instituteCourses.length;
      console.log('✅ MIS Courses found for institute:', totalCourses);
    } catch (courseError) {
      console.error('❌ Error fetching MIS courses:', courseError.message);
      totalCourses = 0;
    }
    
    // Get total students from mis-students table with error handling
    try {
      console.log('👨🎓 Fetching students from mis-students...');
      const allStudents = await misStudentModel.getAll();
      const instituteStudents = allStudents.filter(student => student.instituteId === userId);
      totalStudents = instituteStudents.length;
      console.log('✅ MIS Students found for institute:', totalStudents);
    } catch (studentError) {
      console.error('❌ Error fetching MIS students:', studentError.message);
      totalStudents = 0;
    }
    
    // Get trained students (students who have been hired at least once) with error handling
    try {
      console.log('🎯 Fetching trained students...');
      const hiredStudents = await jobApplicationModel.getUniqueHiredStudentsByInstitute(userId);
      totalTrainedStudents = Array.isArray(hiredStudents) ? hiredStudents.length : 0;
      console.log('✅ Trained students found:', totalTrainedStudents);
    } catch (trainedError) {
      console.error('❌ Error fetching trained students:', trainedError.message);
      totalTrainedStudents = 0;
    }
    
    const dashboardStats = {
      totalCenters,
      totalCourses,
      totalStudents,
      totalTrainedStudents
    };
    
    console.log('🏆 Final dashboard stats:', dashboardStats);
    
    res.status(200).json({
      success: true,
      data: dashboardStats,
      message: 'Dashboard stats retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Get dashboard stats error:', error);
    
    // Return default stats in case of complete failure
    const fallbackStats = {
      totalCenters: 0,
      totalCourses: 0,
      totalStudents: 0,
      totalTrainedStudents: 0
    };
    
    res.status(200).json({
      success: true,
      data: fallbackStats,
      message: 'Dashboard stats retrieved with fallback values due to errors'
    });
  }
};

module.exports = {
  getDashboardStats
};