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
    
    // Create initial institute profile with registration data
    try {
      const initialProfileData = {
        instituteName: value.instituteName,
        address: '', // Empty initially, user can fill later
        pincode: '',
        phone: value.phoneNumber,
        email: value.email,
        website: '',
        experience: '',
        badges: [],
        description: '',
        establishedYear: null,
        profileImage: null,
        affiliations: [],
        courses: [],
        placementRate: null,
        totalStudents: null,
        isLive: false // Profile not live until completed
      };
      
      await instituteModel.createOrUpdateProfile(user.userId, initialProfileData);
      console.log('Initial institute profile created with registration data');
    } catch (profileError) {
      console.error('Failed to create initial profile:', profileError);
      // Don't fail registration if profile creation fails
    }
    
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
    let profile = await instituteModel.getProfileById(userId);
    
    // Get user data from users table (includes registration data)
    const user = await userModel.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }
    
    // If no profile exists, create one with registration data
    if (!profile) {
      const initialProfileData = {
        instituteName: user.instituteName || user.name,
        address: '',
        pincode: '',
        phone: user.phoneNumber || user.phone,
        email: user.email,
        website: '',
        experience: '',
        badges: [],
        description: '',
        establishedYear: null,
        profileImage: null,
        affiliations: [],
        courses: [],
        placementRate: null,
        totalStudents: null,
        isLive: false
      };
      
      profile = await instituteModel.createOrUpdateProfile(userId, initialProfileData);
    }
    
    // Ensure profile has registration data if missing
    const combinedData = {
      ...profile,
      instituteName: profile.instituteName || user.instituteName || user.name,
      phone: profile.phone || user.phoneNumber || user.phone,
      email: profile.email || user.email,
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
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
    files: 20 // Maximum 20 files
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 File filter check:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    
    // Allow any field name that starts with companyLogo_ or studentPhoto_
    if (file.fieldname.startsWith('companyLogo_') || file.fieldname.startsWith('studentPhoto_')) {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(file.originalname.toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        console.log('✅ File accepted:', file.fieldname);
        return cb(null, true);
      } else {
        console.log('❌ File rejected - invalid type:', file.fieldname, file.mimetype);
        return cb(new Error(`Only image files are allowed. Got: ${file.mimetype}`));
      }
    } else {
      console.log('❌ File rejected - invalid field name:', file.fieldname);
      return cb(new Error(`Invalid file field name: ${file.fieldname}`));
    }
  }
});

/**
 * Upload files to S3 for placement section
 */
const uploadPlacementFiles = async (files, type) => {
  const uploadedFiles = [];
  
  console.log(`📤 Starting upload of ${files.length} files of type: ${type}`);
  
  for (const file of files) {
    try {
      console.log('📄 File details:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        hasBuffer: !!file.buffer
      });
      
      if (!file.buffer) {
        console.error('❌ File buffer is missing');
        throw new Error('File buffer is missing');
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`File ${file.originalname} is too large. Maximum size is 5MB.`);
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error(`File ${file.originalname} has invalid type. Only JPEG, PNG, GIF, and WebP are allowed.`);
      }
      
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      const fileName = `${uuidv4()}-${Date.now()}.${fileExtension}`;
      
      // Use the exact folder names as requested
      let key;
      if (type === 'company-logos') {
        key = `placement-company-logos/${fileName}`;
      } else if (type === 'student-photos') {
        key = `placement-student-photos/${fileName}`;
      } else {
        // Fallback for backward compatibility
        key = `placement-${type}/${fileName}`;
      }
      
      console.log(`🔑 S3 upload details:`, {
        bucket: S3_BUCKET_NAME,
        key: key,
        contentType: file.mimetype,
        region: process.env.AWS_REGION || 'ap-south-1',
        fileSize: file.size
      });
      
      const uploadCommand = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'max-age=31536000'
      });
      
      const uploadResult = await s3Client.send(uploadCommand);
      console.log('📤 S3 upload result:', {
        ETag: uploadResult.ETag,
        Location: uploadResult.Location,
        Key: uploadResult.Key
      });
      
      const fileUrl = `https://${S3_BUCKET_NAME}.s3.${(process.env.AWS_REGION || 'ap-south-1').trim()}.amazonaws.com/${key}`;
      
      console.log(`✅ File uploaded successfully: ${fileUrl}`);
      
      // Verify the upload by checking if the file exists
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: key
        });
        await s3Client.send(headCommand);
        console.log(`✅ File verified in S3: ${key}`);
      } catch (verifyError) {
        console.error(`❌ File verification failed: ${key}`, verifyError);
        throw new Error(`File upload verification failed for ${file.originalname}`);
      }
      
      uploadedFiles.push(fileUrl);
    } catch (error) {
      console.error(`❌ S3 upload error for file ${file.originalname}:`, error);
      throw new Error(`Failed to upload ${file.originalname}: ${error.message}`);
    }
  }
  
  console.log(`🎉 Upload complete. ${uploadedFiles.length} files uploaded successfully.`);
  return uploadedFiles;
};

/**
 * Delete old placement files from S3
 */
const deleteOldPlacementFiles = async (oldData, newData) => {
  try {
    // Delete old company logos that are no longer used
    if (oldData.topHiringCompanies && Array.isArray(oldData.topHiringCompanies)) {
      for (const oldCompany of oldData.topHiringCompanies) {
        // Check if logo is a valid string URL
        if (oldCompany.logo && typeof oldCompany.logo === 'string' && oldCompany.logo.includes('http')) {
          // Check if this logo is still being used in new data
          const stillUsed = newData.topHiringCompanies && newData.topHiringCompanies.some(newCompany => 
            newCompany.logo === oldCompany.logo
          );
          
          if (!stillUsed) {
            try {
              // Extract the full key from the URL
              const urlParts = oldCompany.logo.split('/');
              const bucketIndex = urlParts.findIndex(part => part.includes('.s3.'));
              let key;
              
              if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
                // Extract key from full S3 URL
                key = urlParts.slice(bucketIndex + 1).join('/');
              } else {
                // Fallback: assume it's just the filename and use correct folder
                const fileName = urlParts[urlParts.length - 1];
                key = `placement-company-logos/${fileName}`;
              }
              
              const deleteCommand = new DeleteObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: key
              });
              await s3Client.send(deleteCommand);
              console.log(`Deleted old company logo: ${key}`);
            } catch (deleteError) {
              console.error('Error deleting old company logo:', deleteError);
            }
          }
        }
      }
    }
    
    // Delete old student photos that are no longer used
    if (oldData.recentPlacementSuccess && Array.isArray(oldData.recentPlacementSuccess)) {
      for (const oldStudent of oldData.recentPlacementSuccess) {
        // Check if photo is a valid string URL
        if (oldStudent.photo && typeof oldStudent.photo === 'string' && oldStudent.photo.includes('http')) {
          // Check if this photo is still being used in new data
          const stillUsed = newData.recentPlacementSuccess && newData.recentPlacementSuccess.some(newStudent => 
            newStudent.photo === oldStudent.photo
          );
          
          if (!stillUsed) {
            try {
              // Extract the full key from the URL
              const urlParts = oldStudent.photo.split('/');
              const bucketIndex = urlParts.findIndex(part => part.includes('.s3.'));
              let key;
              
              if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
                // Extract key from full S3 URL
                key = urlParts.slice(bucketIndex + 1).join('/');
              } else {
                // Fallback: assume it's just the filename and use correct folder
                const fileName = urlParts[urlParts.length - 1];
                key = `placement-student-photos/${fileName}`;
              }
              
              const deleteCommand = new DeleteObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: key
              });
              await s3Client.send(deleteCommand);
              console.log(`Deleted old student photo: ${key}`);
            } catch (deleteError) {
              console.error('Error deleting old student photo:', deleteError);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error deleting old placement files:', error);
  }
};

/**
 * Update placement section data with file uploads
 * @route PUT /api/institute/placement-section
 */
const updatePlacementSection = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('🚀 Placement section update request for user:', userId);
    console.log('📋 Request body keys:', Object.keys(req.body));
    console.log('📁 Request files:', req.files ? req.files.length : 0, 'files');
    
    // Log all files received
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        console.log(`📄 File ${index}:`, {
          fieldname: file.fieldname,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
      });
    }
    
    // Get institute profile to get institute name
    const user = await userModel.getUserById(userId);
    if (!user || user.role !== 'institute') {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }
    
    const instituteName = user.name || 'Unknown Institute';
    
    // Get existing placement data for cleanup
    const existingPlacementData = await institutePlacementModel.getPlacementSectionByInstituteId(userId);
    
    // Parse the placement data from the request body
    let placementData;
    try {
      // Handle both direct object and JSON string
      if (typeof req.body.placementData === 'string') {
        placementData = JSON.parse(req.body.placementData);
      } else if (typeof req.body.placementData === 'object') {
        placementData = req.body.placementData;
      } else {
        // Try to parse the entire body as placement data
        placementData = {
          averageSalary: req.body.averageSalary || '',
          highestPackage: req.body.highestPackage || '',
          topHiringCompanies: [],
          recentPlacementSuccess: []
        };
      }
      
      console.log('📊 Parsed placement data:', {
        averageSalary: placementData.averageSalary,
        highestPackage: placementData.highestPackage,
        companiesCount: placementData.topHiringCompanies?.length || 0,
        studentsCount: placementData.recentPlacementSuccess?.length || 0
      });
    } catch (parseError) {
      console.error('❌ Error parsing placement data:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Invalid placement data format'
      });
    }
    
    // Convert files array to object for easier access
    const filesMap = {};
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        filesMap[file.fieldname] = file;
      });
    }
    
    console.log('🗂️ Files map keys:', Object.keys(filesMap));
    
    // Process company logos
    if (placementData.topHiringCompanies && Array.isArray(placementData.topHiringCompanies)) {
      for (let i = 0; i < placementData.topHiringCompanies.length; i++) {
        const company = placementData.topHiringCompanies[i];
        
        console.log(`🏢 Processing company ${i}:`, {
          name: company.name,
          hasLogo: !!company.logo,
          logoType: typeof company.logo
        });
        
        // Look for company logo file
        const logoFieldName = `companyLogo_${i}`;
        const logoFile = filesMap[logoFieldName];
        
        if (logoFile) {
          console.log(`📤 Uploading logo for company ${i}: ${company.name}`);
          console.log(`📁 Logo file details:`, {
            fieldName: logoFieldName,
            originalname: logoFile.originalname,
            mimetype: logoFile.mimetype,
            size: logoFile.size
          });
          
          try {
            const logoUrls = await uploadPlacementFiles([logoFile], 'company-logos');
            if (logoUrls && logoUrls.length > 0 && logoUrls[0]) {
              company.logo = logoUrls[0];
              console.log(`✅ Company logo uploaded successfully: ${logoUrls[0]}`);
            } else {
              throw new Error('No URL returned from S3 upload');
            }
          } catch (uploadError) {
            console.error(`❌ Error uploading company logo for ${company.name}:`, uploadError);
            // Keep existing logo if upload fails
            if (existingPlacementData?.topHiringCompanies?.[i]?.logo) {
              company.logo = existingPlacementData.topHiringCompanies[i].logo;
              console.log(`🔄 Kept existing logo due to upload failure: ${company.logo}`);
            } else {
              company.logo = null;
              console.log(`❌ Set logo to null due to upload failure`);
            }
          }
        } else if (!company.logo || (typeof company.logo === 'object' && company.logo !== null)) {
          // If no file and no valid existing logo, try to preserve from existing data
          if (existingPlacementData?.topHiringCompanies?.[i]?.logo) {
            company.logo = existingPlacementData.topHiringCompanies[i].logo;
            console.log(`🔄 Preserved existing logo for ${company.name}: ${company.logo}`);
          } else {
            company.logo = null;
            console.log(`❌ No logo available for ${company.name}`);
          }
        } else {
          console.log(`🔗 Keeping existing logo URL for ${company.name}: ${company.logo}`);
        }
      }
    }
    
    // Process student photos
    if (placementData.recentPlacementSuccess && Array.isArray(placementData.recentPlacementSuccess)) {
      for (let i = 0; i < placementData.recentPlacementSuccess.length; i++) {
        const student = placementData.recentPlacementSuccess[i];
        
        console.log(`👨🎓 Processing student ${i}:`, {
          name: student.name,
          hasPhoto: !!student.photo,
          photoType: typeof student.photo
        });
        
        // Look for student photo file
        const photoFieldName = `studentPhoto_${i}`;
        const photoFile = filesMap[photoFieldName];
        
        if (photoFile) {
          console.log(`📤 Uploading photo for student ${i}: ${student.name}`);
          console.log(`📁 Photo file details:`, {
            fieldName: photoFieldName,
            originalname: photoFile.originalname,
            mimetype: photoFile.mimetype,
            size: photoFile.size
          });
          
          try {
            const photoUrls = await uploadPlacementFiles([photoFile], 'student-photos');
            if (photoUrls && photoUrls.length > 0 && photoUrls[0]) {
              student.photo = photoUrls[0];
              console.log(`✅ Student photo uploaded successfully: ${photoUrls[0]}`);
            } else {
              throw new Error('No URL returned from S3 upload');
            }
          } catch (uploadError) {
            console.error(`❌ Error uploading student photo for ${student.name}:`, uploadError);
            // Keep existing photo if upload fails
            if (existingPlacementData?.recentPlacementSuccess?.[i]?.photo) {
              student.photo = existingPlacementData.recentPlacementSuccess[i].photo;
              console.log(`🔄 Kept existing photo due to upload failure: ${student.photo}`);
            } else {
              student.photo = null;
              console.log(`❌ Set photo to null due to upload failure`);
            }
          }
        } else if (!student.photo || (typeof student.photo === 'object' && student.photo !== null)) {
          // If no file and no valid existing photo, try to preserve from existing data
          if (existingPlacementData?.recentPlacementSuccess?.[i]?.photo) {
            student.photo = existingPlacementData.recentPlacementSuccess[i].photo;
            console.log(`🔄 Preserved existing photo for ${student.name}: ${student.photo}`);
          } else {
            student.photo = null;
            console.log(`❌ No photo available for ${student.name}`);
          }
        } else {
          console.log(`🔗 Keeping existing photo URL for ${student.name}: ${student.photo}`);
        }
      }
    }
    
    // Clean up old files that are no longer used
    if (existingPlacementData) {
      await deleteOldPlacementFiles(existingPlacementData, placementData);
    }
    
    console.log('💾 Final placement data to save:', {
      averageSalary: placementData.averageSalary,
      highestPackage: placementData.highestPackage,
      companiesCount: placementData.topHiringCompanies?.length || 0,
      studentsCount: placementData.recentPlacementSuccess?.length || 0,
      companiesWithLogos: placementData.topHiringCompanies?.filter(c => c.logo && typeof c.logo === 'string' && c.logo.includes('http')).length || 0,
      studentsWithPhotos: placementData.recentPlacementSuccess?.filter(s => s.photo && typeof s.photo === 'string' && s.photo.includes('http')).length || 0,
      companyLogos: placementData.topHiringCompanies?.map(c => ({ name: c.name, logo: c.logo })) || [],
      studentPhotos: placementData.recentPlacementSuccess?.map(s => ({ name: s.name, photo: s.photo })) || []
    });
    
    // Create or update placement section
    const updatedPlacementSection = await institutePlacementModel.createOrUpdatePlacementSection(
      userId,
      instituteName,
      placementData
    );
    
    console.log('✅ Placement section updated successfully');
    
    res.status(200).json({
      success: true,
      message: 'Placement section updated successfully',
      data: updatedPlacementSection
    });
    
  } catch (error) {
    console.error('❌ Update placement section error:', error);
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
    
    console.log('Getting placement section for user:', userId);
    
    const placementSection = await institutePlacementModel.getPlacementSectionByInstituteId(userId);
    
    console.log('Retrieved placement section:', placementSection);
    
    if (!placementSection) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No placement section data found'
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
    
    console.log('Getting public placement section for institute:', id);
    
    const placementSection = await institutePlacementModel.getPlacementSectionByInstituteId(id);
    
    console.log('Retrieved public placement section:', placementSection);
    
    if (!placementSection) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No placement section data found'
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

/**
 * Get enrollment trends data for dashboard charts
 * @route GET /api/institute/dashboard/enrollment-trends
 */
const getEnrollmentTrends = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year, monthRange } = req.query;
    
    console.log('Getting enrollment trends for institute:', userId, 'year:', year, 'monthRange:', monthRange);
    
    // Import required models
    const instituteStudentModel = require('../models/instituteStudentModel');
    const jobApplicationModel = require('../models/jobApplicationModel');
    
    // Get all students for the institute
    const students = await instituteStudentModel.getStudentsByInstitute(userId);
    
    // Calculate enrollment trends by month
    const currentYear = parseInt(year) || new Date().getFullYear();
    const months = parseInt(monthRange) || 12;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const enrollmentData = [];
    
    for (let i = 0; i < months; i++) {
      const monthIndex = (new Date().getMonth() - i + 12) % 12;
      const monthName = monthNames[monthIndex];
      
      // Count students enrolled in this month
      const enrolledInMonth = students.filter(student => {
        if (!student.createdAt) return false;
        const studentDate = new Date(student.createdAt);
        return studentDate.getFullYear() === currentYear && studentDate.getMonth() === monthIndex;
      }).length;
      
      // Count students who completed courses (100% progress) in this month
      // For now, we'll use a simple logic based on hired students as a proxy for completion
      const hiredStudents = await jobApplicationModel.getUniqueHiredStudentsByInstitute(userId);
      const completedInMonth = Math.floor(enrolledInMonth * 0.3); // Approximate 30% completion rate
      
      enrollmentData.unshift({
        name: monthName,
        students: enrolledInMonth,
        completed: completedInMonth
      });
    }
    
    res.status(200).json({
      success: true,
      data: enrollmentData
    });
    
  } catch (error) {
    console.error('Get enrollment trends error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get enrollment trends'
    });
  }
};

/**
 * Get placement trends data for dashboard charts
 * @route GET /api/institute/dashboard/placement-trends
 */
const getPlacementTrends = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year, monthRange } = req.query;
    
    console.log('Getting placement trends for institute:', userId, 'year:', year, 'monthRange:', monthRange);
    
    // Import required models
    const jobApplicationModel = require('../models/jobApplicationModel');
    const dynamoService = require('../services/dynamoService');
    const { JOB_APPLICATIONS_TABLE } = require('../config/dynamodb');
    
    // Calculate placement trends by month
    const currentYear = parseInt(year) || new Date().getFullYear();
    const months = parseInt(monthRange) || 12;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const placementData = [];
    
    // Get all hired applications for this institute
    const params = {
      FilterExpression: 'instituteID = :instituteID AND #status = :hired',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':instituteID': userId,
        ':hired': 'hired'
      }
    };
    
    const hiredApplications = await dynamoService.scanItems(JOB_APPLICATIONS_TABLE, params);
    
    for (let i = 0; i < months; i++) {
      const monthIndex = (new Date().getMonth() - i + 12) % 12;
      const monthName = monthNames[monthIndex];
      
      // Count students hired in this month
      const hiredInMonth = hiredApplications.filter(app => {
        if (!app.updatedAt && !app.timestamp) return false;
        const appDate = new Date(app.updatedAt || app.timestamp);
        return appDate.getFullYear() === currentYear && appDate.getMonth() === monthIndex;
      }).length;
      
      // Calculate placement rate (simplified calculation)
      const totalStudents = 10; // Base number for calculation
      const placementRate = totalStudents > 0 ? Math.min(Math.round((hiredInMonth / totalStudents) * 100), 100) : 0;
      
      placementData.unshift({
        name: monthName,
        rate: Math.max(placementRate, hiredInMonth > 0 ? 20 : 0) // Minimum 20% if any placements
      });
    }
    
    res.status(200).json({
      success: true,
      data: placementData
    });
    
  } catch (error) {
    console.error('Get placement trends error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get placement trends'
    });
  }
};

// Multer for industry collaboration uploads (images and PDFs)
const industryCollabUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for PDFs and images
  },
  fileFilter: (req, file, cb) => {
    console.log('File filter - fieldname:', file.fieldname, 'mimetype:', file.mimetype, 'originalname:', file.originalname);
    
    // Allow collaboration images and MOU PDFs
    if (file.fieldname === 'collaborationImage') {
      // Images for collaboration cards
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(file.originalname.toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        console.log('Collaboration image file accepted:', file.fieldname);
        return cb(null, true);
      } else {
        console.log('Collaboration image file rejected:', file.fieldname, 'mimetype:', file.mimetype);
        return cb(new Error('Collaboration images must be image files (JPEG, PNG, GIF, WebP)'));
      }
    } else if (file.fieldname === 'mouPdf') {
      // PDFs for MOU items
      const allowedTypes = /pdf/;
      const extname = allowedTypes.test(file.originalname.toLowerCase());
      const mimetype = /application\/pdf/.test(file.mimetype);
      
      if (mimetype && extname) {
        console.log('MOU PDF file accepted:', file.fieldname);
        return cb(null, true);
      } else {
        console.log('MOU PDF file rejected:', file.fieldname, 'mimetype:', file.mimetype);
        return cb(new Error('MOU files must be PDF files'));
      }
    } else {
      console.log('Invalid file field name:', file.fieldname);
      return cb(new Error('Invalid file field name'));
    }
  }
});

/**
 * Upload files to S3 for industry collaboration section
 */
const uploadIndustryCollabFiles = async (files, type) => {
  const uploadedFiles = [];
  
  console.log(`📤 Starting upload of ${files.length} files of type: ${type}`);
  
  for (const file of files) {
    try {
      console.log('📄 File details:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        hasBuffer: !!file.buffer
      });
      
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      const fileName = `${uuidv4()}-${Date.now()}.${fileExtension}`;
      
      // Use the exact folder names as requested
      let key;
      if (type === 'images') {
        key = `industry-collab-images/${fileName}`;
      } else if (type === 'pdfs') {
        key = `industry-collab-pdfs/${fileName}`;
      } else {
        // Fallback for backward compatibility
        key = `industry-collab-${type}/${fileName}`;
      }
      
      console.log(`🔑 S3 upload details:`, {
        bucket: S3_BUCKET_NAME,
        key: key,
        contentType: file.mimetype,
        region: process.env.AWS_REGION || 'ap-south-1'
      });
      
      const uploadCommand = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'max-age=31536000'
      });
      
      const uploadResult = await s3Client.send(uploadCommand);
      console.log('📤 S3 upload result:', {
        ETag: uploadResult.ETag,
        Location: uploadResult.Location,
        Key: uploadResult.Key
      });
      
      const fileUrl = `https://${S3_BUCKET_NAME}.s3.${(process.env.AWS_REGION || 'ap-south-1').trim()}.amazonaws.com/${key}`;
      
      console.log(`✅ File uploaded successfully: ${fileUrl}`);
      
      // Verify the upload by checking if the file exists
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: key
        });
        await s3Client.send(headCommand);
        console.log(`✅ File verified in S3: ${key}`);
      } catch (verifyError) {
        console.error(`❌ File verification failed: ${key}`, verifyError);
        throw new Error(`File upload verification failed for ${file.originalname}`);
      }
      
      uploadedFiles.push(fileUrl);
    } catch (error) {
      console.error(`❌ S3 upload error:`, error);
      throw error;
    }
  }
  
  console.log(`🎉 Upload complete. ${uploadedFiles.length} files uploaded.`);
  return uploadedFiles;
};

/**
 * Upload collaboration image to S3 in real-time
 * @route POST /api/institutes/upload-collaboration-image
 */
const uploadCollaborationImage = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    console.log('🖼️ Uploading collaboration image:', req.file.originalname);
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid image file (JPEG, PNG, GIF, WebP)'
      });
    }
    
    // Validate file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image size should be less than 5MB'
      });
    }
    
    // Upload to S3
    const uploadedUrls = await uploadIndustryCollabFiles([req.file], 'images');
    
    if (uploadedUrls.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image to S3'
      });
    }
    
    const imageUrl = uploadedUrls[0];
    
    res.status(200).json({
      success: true,
      message: 'Collaboration image uploaded successfully',
      data: {
        imageUrl: imageUrl
      }
    });
    
  } catch (error) {
    console.error('Upload collaboration image error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload collaboration image'
    });
  }
};

/**
 * Upload MOU PDF to S3 in real-time
 * @route POST /api/institutes/upload-mou-pdf
 */
const uploadMouPdf = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file provided'
      });
    }
    
    console.log('📄 Uploading MOU PDF:', req.file.originalname);
    
    // Validate file type
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid PDF file'
      });
    }
    
    // Validate file size (max 10MB)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'PDF size should be less than 10MB'
      });
    }
    
    // Upload to S3
    const uploadedUrls = await uploadIndustryCollabFiles([req.file], 'pdfs');
    
    if (uploadedUrls.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload PDF to S3'
      });
    }
    
    const pdfUrl = uploadedUrls[0];
    
    res.status(200).json({
      success: true,
      message: 'MOU PDF uploaded successfully',
      data: {
        pdfUrl: pdfUrl
      }
    });
    
  } catch (error) {
    console.error('Upload MOU PDF error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload MOU PDF'
    });
  }
};

/**
 * Delete collaboration image from S3
 * @route DELETE /api/institutes/delete-collaboration-image
 */
const deleteCollaborationImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }
    
    // Extract key from URL
    const urlParts = imageUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part.includes('.s3.'));
    let key;
    
    if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
      key = urlParts.slice(bucketIndex + 1).join('/');
    } else {
      const fileName = urlParts[urlParts.length - 1];
      key = `industry-collab-images/${fileName}`;
    }
    
    // Delete from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    });
    
    await s3Client.send(deleteCommand);
    console.log(`✅ Deleted collaboration image: ${key}`);
    
    res.status(200).json({
      success: true,
      message: 'Collaboration image deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete collaboration image error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete collaboration image'
    });
  }
};

/**
 * Delete MOU PDF from S3
 * @route DELETE /api/institutes/delete-mou-pdf
 */
const deleteMouPdf = async (req, res) => {
  try {
    const { pdfUrl } = req.body;
    
    if (!pdfUrl) {
      return res.status(400).json({
        success: false,
        message: 'PDF URL is required'
      });
    }
    
    // Extract key from URL
    const urlParts = pdfUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part.includes('.s3.'));
    let key;
    
    if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
      key = urlParts.slice(bucketIndex + 1).join('/');
    } else {
      const fileName = urlParts[urlParts.length - 1];
      key = `industry-collab-pdfs/${fileName}`;
    }
    
    // Delete from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    });
    
    await s3Client.send(deleteCommand);
    console.log(`✅ Deleted MOU PDF: ${key}`);
    
    res.status(200).json({
      success: true,
      message: 'MOU PDF deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete MOU PDF error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete MOU PDF'
    });
  }
};

/**
 * Delete old industry collaboration files from S3
 */
const deleteOldIndustryCollabFiles = async (oldData, newData) => {
  try {
    // Delete old collaboration images that are no longer used
    if (oldData.collaborationCards && Array.isArray(oldData.collaborationCards)) {
      for (const oldCard of oldData.collaborationCards) {
        if (oldCard.image && typeof oldCard.image === 'string' && oldCard.image.includes('http')) {
          const stillUsed = newData.collaborationCards && newData.collaborationCards.some(newCard => 
            newCard.image === oldCard.image
          );
          
          if (!stillUsed) {
            try {
              // Extract the full key from the URL
              const urlParts = oldCard.image.split('/');
              const bucketIndex = urlParts.findIndex(part => part.includes('.s3.'));
              let key;
              
              if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
                // Extract key from full S3 URL
                key = urlParts.slice(bucketIndex + 1).join('/');
              } else {
                // Fallback: assume it's just the filename and use correct folder
                const fileName = urlParts[urlParts.length - 1];
                key = `industry-collab-images/${fileName}`;
              }
              
              const deleteCommand = new DeleteObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: key
              });
              await s3Client.send(deleteCommand);
              console.log(`Deleted old collaboration image: ${key}`);
            } catch (deleteError) {
              console.error('Error deleting old collaboration image:', deleteError);
            }
          }
        }
      }
    }
    
    // Delete old MOU PDFs that are no longer used
    if (oldData.mouItems && Array.isArray(oldData.mouItems)) {
      for (const oldMou of oldData.mouItems) {
        if (oldMou.pdfUrl && typeof oldMou.pdfUrl === 'string' && oldMou.pdfUrl.includes('http')) {
          const stillUsed = newData.mouItems && newData.mouItems.some(newMou => 
            newMou.pdfUrl === oldMou.pdfUrl
          );
          
          if (!stillUsed) {
            try {
              // Extract the full key from the URL
              const urlParts = oldMou.pdfUrl.split('/');
              const bucketIndex = urlParts.findIndex(part => part.includes('.s3.'));
              let key;
              
              if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
                // Extract key from full S3 URL
                key = urlParts.slice(bucketIndex + 1).join('/');
              } else {
                // Fallback: assume it's just the filename and use correct folder
                const fileName = urlParts[urlParts.length - 1];
                key = `industry-collab-pdfs/${fileName}`;
              }
              
              const deleteCommand = new DeleteObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: key
              });
              await s3Client.send(deleteCommand);
              console.log(`Deleted old MOU PDF: ${key}`);
            } catch (deleteError) {
              console.error('Error deleting old MOU PDF:', deleteError);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error deleting old industry collaboration files:', error);
  }
};

/**
 * Update industry collaboration section data (simplified for real-time uploads)
 * @route PUT /api/institute/industry-collaborations
 */
const updateIndustryCollaborations = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('Industry collaboration update request for user:', userId);
    
    // Get institute profile to get institute name
    const user = await userModel.getUserById(userId);
    if (!user || user.role !== 'institute') {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }
    
    const instituteName = user.name || 'Unknown Institute';
    const collabData = req.body;
    
    console.log('Collaboration data received:', {
      collaborationCards: collabData.collaborationCards?.length || 0,
      mouItems: collabData.mouItems?.length || 0
    });
    
    // Create or update industry collaboration section
    const updatedCollabSection = await instituteIndustryCollabModel.createOrUpdateIndustryCollabSection(
      userId,
      instituteName,
      collabData
    );
    
    console.log('Industry collaboration section updated successfully');
    
    res.status(200).json({
      success: true,
      message: 'Industry collaborations updated successfully',
      data: updatedCollabSection
    });
    
  } catch (error) {
    console.error('Update industry collaborations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update industry collaborations'
    });
  }
};

/**
 * Get industry collaboration section data
 * @route GET /api/institute/industry-collaborations
 */
const getIndustryCollaborations = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('Getting industry collaborations for user:', userId);
    
    const collabSection = await instituteIndustryCollabModel.getIndustryCollabSectionByInstituteId(userId);
    
    console.log('Retrieved industry collaboration section:', collabSection);
    
    if (!collabSection) {
      return res.status(200).json({
        success: true,
        data: {
          collaborationCards: [],
          mouItems: []
        },
        message: 'No industry collaboration data found'
      });
    }
    
    // Ensure arrays exist and are properly formatted
    const formattedData = {
      ...collabSection,
      collaborationCards: collabSection.collaborationCards || [],
      mouItems: collabSection.mouItems || []
    };
    
    res.status(200).json({
      success: true,
      data: formattedData
    });
    
  } catch (error) {
    console.error('Get industry collaborations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get industry collaborations'
    });
  }
};

/**
 * Get public industry collaboration section data by institute ID
 * @route GET /api/institute/public/:id/industry-collaborations
 */
const getPublicIndustryCollaborations = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Getting public industry collaborations for institute:', id);
    
    const collabSection = await instituteIndustryCollabModel.getIndustryCollabSectionByInstituteId(id);
    
    console.log('Retrieved public industry collaboration section:', {
      hasData: !!collabSection,
      collaborationCards: collabSection?.collaborationCards?.length || 0,
      mouItems: collabSection?.mouItems?.length || 0,
      mouItemsWithPdfs: collabSection?.mouItems?.filter(mou => mou.pdfUrl && mou.pdfUrl.includes('http'))?.length || 0
    });
    
    if (!collabSection) {
      return res.status(200).json({
        success: true,
        data: {
          collaborationCards: [],
          mouItems: []
        },
        message: 'No industry collaboration data found'
      });
    }
    
    // Ensure arrays exist and are properly formatted for public display
    const formattedData = {
      collaborationCards: (collabSection.collaborationCards || []).filter(card => 
        card.title && card.company
      ),
      mouItems: (collabSection.mouItems || []).filter(mou => 
        mou.title && mou.description
      ).map(mou => ({
        title: mou.title,
        description: mou.description,
        pdfUrl: mou.pdfUrl && typeof mou.pdfUrl === 'string' && mou.pdfUrl.trim() !== '' && mou.pdfUrl.includes('http') ? mou.pdfUrl : null
      }))
    };
    
    console.log('📊 Public data formatted:', {
      collaborationCards: formattedData.collaborationCards.length,
      mouItems: formattedData.mouItems.length,
      mouItemsWithPdfs: formattedData.mouItems.filter(mou => mou.pdfUrl && mou.pdfUrl.trim() !== '').length
    });
    
    res.status(200).json({
      success: true,
      data: formattedData
    });
    
  } catch (error) {
    console.error('Get public industry collaborations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get industry collaborations'
    });
  }
};

/**
 * Serve MOU PDF file with proper headers for browser viewing
 * @route GET /api/institute/mou-pdf/:filename
 */
const serveMouPdf = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }
    
    // Construct S3 URL
    const pdfUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/industry-collab-pdfs/${filename}`;
    
    console.log('Serving MOU PDF:', pdfUrl);
    
    // Redirect to S3 URL with proper headers
    res.redirect(pdfUrl);
    
  } catch (error) {
    console.error('Serve MOU PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve PDF'
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
  getEnrollmentTrends,
  getPlacementTrends,
  updateIndustryCollaborations,
  getIndustryCollaborations,
  getPublicIndustryCollaborations,
  uploadCollaborationImage,
  uploadMouPdf,
  deleteCollaborationImage,
  deleteMouPdf,
  serveMouPdf,
  upload,
  studentUpload,
  placementUpload,
  industryCollabUpload
};