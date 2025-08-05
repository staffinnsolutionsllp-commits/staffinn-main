/**
 * Institute Controller
 * Handles institute registration and management
 */
const userModel = require('../models/userModel');
const instituteModel = require('../models/instituteModel');
const institutePlacementModel = require('../models/institutePlacementModel');
const jwtUtils = require('../utils/jwtUtils');
const { validateInstituteRegistration } = require('../utils/validation');
const emailService = require('../services/emailService');
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

// Registration number validation service
const registrationValidationService = {
  validateRegistrationNumber: async (registrationNumber) => {
    try {
      // Basic format validation (6-20 characters, uppercase letters and numbers)
      const formatValid = /^[A-Z0-9]{6,20}$/.test(registrationNumber);
      
      if (!formatValid) {
        return { isValid: false, message: 'Invalid registration number format' };
      }
      
      // Check if registration number already exists in database
      const existingInstitute = await userModel.getUserByRegistrationNumber(registrationNumber);
      if (existingInstitute) {
        return { isValid: false, message: 'Registration number already exists' };
      }
      
      // Additional validation patterns for common registration number formats
      const commonPatterns = [
        /^[A-Z]{2}[0-9]{6,12}$/, // State code + numbers (e.g., UP123456789)
        /^[0-9]{6,15}$/, // Only numbers (e.g., 123456789)
        /^[A-Z]{3,5}[0-9]{4,10}$/, // Institution code + numbers
        /^REG[0-9]{6,12}$/, // REG prefix + numbers
        /^INST[0-9]{6,12}$/ // INST prefix + numbers
      ];
      
      const matchesPattern = commonPatterns.some(pattern => pattern.test(registrationNumber));
      
      if (!matchesPattern) {
        return { 
          isValid: false, 
          message: 'Registration number format does not match standard patterns' 
        };
      }
      
      return { isValid: true, message: 'Registration number is valid' };
      
    } catch (error) {
      console.error('Registration number validation error:', error);
      return { isValid: false, message: 'Registration number validation failed' };
    }
  }
};

/**
 * Register a new institute
 * @route POST /api/institute/register
 */
const registerInstitute = async (req, res) => {
  try {
    console.log('Institute registration request:', req.body);
    
    // Validate institute registration data
    const { error, value } = validateInstituteRegistration(req.body);
    
    if (error) {
      console.log('Institute validation error:', error);
      return res.status(400).json({
        success: false,
        message: error
      });
    }
    
    // Check if email is already registered
    const existingUser = await userModel.getUserByEmail(value.email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered'
      });
    }
    
    // Validate registration number
    const registrationValidation = await registrationValidationService.validateRegistrationNumber(value.registrationNumber);
    if (!registrationValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: registrationValidation.message
      });
    }
    
    // Optional: Check if email is verified (uncomment when email verification is implemented)
    // const isEmailVerified = await emailService.isEmailVerified(value.email);
    // if (!isEmailVerified) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Please verify your email first'
    //   });
    // }
    
    // Prepare user data for creation (all data goes in users table)
    const userData = {
      name: value.instituteName,
      email: value.email,
      password: value.password,
      phone: value.phoneNumber,
      role: 'institute',
      registrationNumber: value.registrationNumber // Store registration number in users table for now
    };
    
    // Create user in users table
    const user = await userModel.createUser(userData);
    
    // Generate tokens
    const tokens = jwtUtils.generateTokens(user);
    
    // Send welcome email (optional)
    try {
      await emailService.sendWelcomeEmail(user.email, value.instituteName, 'institute');
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
      // Don't fail registration if email fails
    }
    
    // Send response
    res.status(201).json({
      success: true,
      message: 'Institute registered successfully',
      data: {
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          registrationNumber: user.registrationNumber
        },
        ...tokens
      }
    });
    
  } catch (error) {
    console.error('Institute registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Institute registration failed'
    });
  }
};

/**
 * Get institute profile
 * @route GET /api/institute/profile
 */
const getInstituteProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user profile (institute data is in users table)
    const user = await userModel.getUserById(userId);
    
    if (!user || user.role !== 'institute') {
      return res.status(404).json({
        success: false,
        message: 'Institute profile not found'
      });
    }
    
    // Remove sensitive data
    delete user.password;
    
    res.status(200).json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Get institute profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get institute profile'
    });
  }
};

/**
 * Update institute profile
 * @route PUT /api/institute/profile
 */
const updateInstituteProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profileData = req.body;
    
    // Validate required fields
    if (!profileData.instituteName || !profileData.address || !profileData.phone || !profileData.email) {
      return res.status(400).json({
        success: false,
        message: 'Institute name, address, phone, and email are required'
      });
    }
    
    // Create or update institute profile
    const updatedProfile = await instituteModel.createOrUpdateProfile(userId, profileData);
    
    res.status(200).json({
      success: true,
      message: 'Institute profile updated successfully',
      data: updatedProfile
    });
    
  } catch (error) {
    console.error('Update institute profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update institute profile'
    });
  }
};

/**
 * Get institute profile details
 * @route GET /api/institute/profile-details
 */
const getInstituteProfileDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get institute profile from profiles table
    const profile = await instituteModel.getProfileById(userId);
    
    // Get user data from users table (includes applications)
    const user = await userModel.getUserById(userId);
    
    if (!profile && !user) {
      return res.status(404).json({
        success: false,
        message: 'Institute profile not found'
      });
    }
    
    // Combine profile data with user data (applications)
    const combinedData = {
      ...profile,
      applications: user?.applications || [],
      recentActivity: user?.recentActivity || []
    };
    
    res.status(200).json({
      success: true,
      data: combinedData
    });
    
  } catch (error) {
    console.error('Get institute profile details error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get institute profile details'
    });
  }
};

/**
 * Get all live institutes for public display
 * @route GET /api/institute/public/all
 */
const getAllLiveInstitutes = async (req, res) => {
  try {
    const institutes = await instituteModel.getAllLiveProfiles();
    
    res.status(200).json({
      success: true,
      data: institutes
    });
    
  } catch (error) {
    console.error('Get all live institutes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get institutes'
    });
  }
};

/**
 * Get institute by ID for public display
 * @route GET /api/institute/public/:id
 */
const getInstituteById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const institute = await instituteModel.getProfileById(id);
    
    if (!institute) {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: institute
    });
    
  } catch (error) {
    console.error('Get institute by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get institute'
    });
  }
};

/**
 * Verify registration number manually
 * @route POST /api/institute/verify-registration
 */
const verifyRegistrationNumber = async (req, res) => {
  try {
    const { registrationNumber } = req.body;
    
    if (!registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Registration number is required'
      });
    }
    
    // Validate registration number
    const validation = await registrationValidationService.validateRegistrationNumber(registrationNumber);
    
    res.status(200).json({
      success: true,
      data: {
        registrationNumber,
        isValid: validation.isValid,
        message: validation.message
      }
    });
    
  } catch (error) {
    console.error('Registration number verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration number verification failed'
    });
  }
};

/**
 * Get all institutes (Admin only)
 * @route GET /api/institute/all
 */
const getAllInstitutes = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    // Get all users with institute role
    const instituteList = await userModel.getUsersByRole('institute');
    
    // Remove passwords from response
    const sanitizedInstituteList = instituteList.map(institute => {
      const { password, ...instituteData } = institute;
      return instituteData;
    });
    
    res.status(200).json({
      success: true,
      data: sanitizedInstituteList
    });
    
  } catch (error) {
    console.error('Get all institutes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get institute list'
    });
  }
};

/**
 * Search institutes by registration number or name
 * @route GET /api/institute/search
 */
const searchInstitutes = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Search in users table for institutes by name or registration number
    const results = await userModel.searchUsersByRoleAndQuery('institute', query);
    
    // Remove passwords from response
    const sanitizedResults = results.map(institute => {
      const { password, ...instituteData } = institute;
      return instituteData;
    });
    
    res.status(200).json({
      success: true,
      data: sanitizedResults
    });
    
  } catch (error) {
    console.error('Search institutes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Institute search failed'
    });
  }
};

/**
 * Delete institute profile (Admin only)
 * @route DELETE /api/institute/:instituteId
 */
const deleteInstitute = async (req, res) => {
  try {
    const { instituteId } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    // Check if institute exists and has institute role
    const institute = await userModel.getUserById(instituteId);
    if (!institute || institute.role !== 'institute') {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }
    
    // Delete institute (user)
    const deleted = await userModel.deleteUser(instituteId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Failed to delete institute'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Institute deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete institute error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete institute'
    });
  }
};

// Configure multer for memory storage (S3 upload)
const storage = multer.memoryStorage();

// Multer for profile images only
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Multer for student uploads (allows images, PDFs, docs)
const studentUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for documents
  },
  fileFilter: (req, file, cb) => {
    // Allow images for profile photos
    if (file.fieldname === 'profilePhoto') {
      const imageTypes = /jpeg|jpg|png|gif|webp/;
      const extname = imageTypes.test(file.originalname.toLowerCase());
      const mimetype = imageTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        return cb(new Error('Profile photo must be an image file'));
      }
    }
    
    // Allow PDFs and docs for resume and certificates
    if (file.fieldname === 'resume' || file.fieldname === 'certificates') {
      const docTypes = /pdf|doc|docx|jpeg|jpg|png/;
      const extname = docTypes.test(file.originalname.toLowerCase());
      const mimetype = /application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|image\/(jpeg|jpg|png)/.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        return cb(new Error('Resume and certificates must be PDF, DOC, DOCX, or image files'));
      }
    }
    
    cb(new Error('Invalid file field'));
  }
});

/**
 * Upload institute profile image to S3
 * @route POST /api/institute/upload-image
 */
const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    // Get current profile to check for existing image
    const currentProfile = await instituteModel.getProfileById(userId);
    
    // Delete old image from S3 if exists
    if (currentProfile && currentProfile.profileImage) {
      try {
        const oldKey = currentProfile.profileImage.split('/').pop();
        const deleteCommand = new DeleteObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: `institute-images/${oldKey}`
        });
        await s3Client.send(deleteCommand);
      } catch (deleteError) {
        console.error('Error deleting old image from S3:', deleteError);
      }
    }
    
    // Generate unique filename
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${uuidv4()}-${Date.now()}.${fileExtension}`;
    const key = `institute-images/${fileName}`;
    
    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      CacheControl: 'max-age=31536000'
    });
    
    await s3Client.send(uploadCommand);
    
    // Create S3 URL
    const imageUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    console.log('Generated S3 URL:', imageUrl);
    
    // Update profile with new image
    const profileData = currentProfile ? { ...currentProfile, profileImage: imageUrl } : { profileImage: imageUrl };
    await instituteModel.createOrUpdateProfile(userId, profileData);
    console.log('Profile updated with image URL:', imageUrl);
    
    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: imageUrl
      }
    });
    
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload profile image'
    });
  }
};

/**
 * Delete institute profile image from S3
 * @route DELETE /api/institute/profile-image
 */
const deleteProfileImage = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get current profile
    const currentProfile = await instituteModel.getProfileById(userId);
    
    if (!currentProfile || !currentProfile.profileImage) {
      return res.status(404).json({
        success: false,
        message: 'No profile image found'
      });
    }
    
    // Delete image from S3
    try {
      const key = currentProfile.profileImage.split('/').pop();
      const deleteCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: `institute-images/${key}`
      });
      await s3Client.send(deleteCommand);
    } catch (s3Error) {
      console.error('Error deleting image from S3:', s3Error);
    }
    
    // Update profile to remove image
    const updatedProfileData = { ...currentProfile, profileImage: null };
    await instituteModel.createOrUpdateProfile(userId, updatedProfileData);
    
    res.status(200).json({
      success: true,
      message: 'Profile image deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete profile image error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete profile image'
    });
  }
};

// Multer for placement section uploads (company logos and student photos)
const placementUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * Upload files to S3 for placement section
 */
const uploadPlacementFiles = async (files, type) => {
  const uploadedFiles = [];
  
  for (const file of files) {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${uuidv4()}-${Date.now()}.${fileExtension}`;
      const key = `placement-${type}/${fileName}`;
      
      const uploadCommand = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'max-age=31536000'
      });
      
      await s3Client.send(uploadCommand);
      
      const fileUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      uploadedFiles.push(fileUrl);
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw error;
    }
  }
  
  return uploadedFiles;
};

/**
 * Update placement section data with file uploads
 * @route PUT /api/institute/placement-section
 */
const updatePlacementSection = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get institute profile to get institute name
    const user = await userModel.getUserById(userId);
    if (!user || user.role !== 'institute') {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }
    
    const instituteName = user.name || 'Unknown Institute';
    
    // Parse form data
    let placementData;
    try {
      placementData = JSON.parse(req.body.placementData || '{}');
    } catch (parseError) {
      // If parsing fails, use req.body directly
      placementData = req.body;
    }
    
    // Handle file uploads
    const files = req.files || {};
    
    // Process company logos
    if (files.companyLogos && files.companyLogos.length > 0) {
      const logoUrls = await uploadPlacementFiles(files.companyLogos, 'company-logos');
      
      // Map logos to companies
      if (placementData.topHiringCompanies && Array.isArray(placementData.topHiringCompanies)) {
        placementData.topHiringCompanies.forEach((company, index) => {
          if (logoUrls[index]) {
            company.logo = logoUrls[index];
          }
        });
      }
    }
    
    // Process student photos
    if (files.studentPhotos && files.studentPhotos.length > 0) {
      const photoUrls = await uploadPlacementFiles(files.studentPhotos, 'student-photos');
      
      // Map photos to students
      if (placementData.recentPlacementSuccess && Array.isArray(placementData.recentPlacementSuccess)) {
        placementData.recentPlacementSuccess.forEach((student, index) => {
          if (photoUrls[index]) {
            student.photo = photoUrls[index];
          }
        });
      }
    }
    
    // Validate placement data
    if (!placementData.averageSalary && !placementData.highestPackage && 
        (!placementData.topHiringCompanies || placementData.topHiringCompanies.length === 0) &&
        (!placementData.recentPlacementSuccess || placementData.recentPlacementSuccess.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'At least one placement field is required'
      });
    }
    
    // Create or update placement section
    const updatedPlacementSection = await institutePlacementModel.createOrUpdatePlacementSection(
      userId,
      instituteName,
      placementData
    );
    
    res.status(200).json({
      success: true,
      message: 'Placement section updated successfully',
      data: updatedPlacementSection
    });
    
  } catch (error) {
    console.error('Update placement section error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update placement section'
    });
  }
};

/**
 * Get placement section data
 * @route GET /api/institute/placement-section
 */
const getPlacementSection = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const placementSection = await institutePlacementModel.getPlacementSectionByInstituteId(userId);
    
    if (!placementSection) {
      return res.status(404).json({
        success: false,
        message: 'Placement section not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: placementSection
    });
    
  } catch (error) {
    console.error('Get placement section error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get placement section'
    });
  }
};

/**
 * Get public placement section data by institute ID
 * @route GET /api/institute/public/:id/placement-section
 */
const getPublicPlacementSection = async (req, res) => {
  try {
    const { id } = req.params;
    
    const placementSection = await institutePlacementModel.getPlacementSectionByInstituteId(id);
    
    if (!placementSection) {
      return res.status(404).json({
        success: false,
        message: 'Placement section not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: placementSection
    });
    
  } catch (error) {
    console.error('Get public placement section error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get placement section'
    });
  }
};

/**
 * Get public dashboard stats by institute ID
 * @route GET /api/institute/public/:id/dashboard-stats
 */
const getPublicDashboardStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Import the required models for fetching real-time data
    const instituteStudentModel = require('../models/instituteStudentModel');
    
    // Get real-time dashboard stats for the institute using the existing method
    const stats = await instituteStudentModel.getStudentStats(id);
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get public dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get dashboard stats'
    });
  }
};

module.exports = {
  registerInstitute,
  getInstituteProfile,
  updateInstituteProfile,
  getInstituteProfileDetails,
  getAllLiveInstitutes,
  getInstituteById,
  verifyRegistrationNumber,
  getAllInstitutes,
  searchInstitutes,
  deleteInstitute,
  uploadProfileImage,
  deleteProfileImage,
  updatePlacementSection,
  getPlacementSection,
  getPublicPlacementSection,
  getPublicDashboardStats,
  upload,
  studentUpload,
  placementUpload
};