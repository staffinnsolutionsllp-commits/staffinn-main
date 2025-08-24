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
    // Allow any field name that starts with companyLogo_ or studentPhoto_
    if (file.fieldname.startsWith('companyLogo_') || file.fieldname.startsWith('studentPhoto_')) {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(file.originalname.toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        return cb(new Error('Only image files are allowed'));
      }
    } else {
      return cb(new Error('Invalid file field name'));
    }
  }
});

/**
 * Upload files to S3 for placement section
 */
const uploadPlacementFiles = async (files, type) => {
  const uploadedFiles = [];
  
  console.log(`Uploading ${files.length} files of type: ${type}`);
  
  for (const file of files) {
    try {
      console.log('Uploading file:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      
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
      
      const fileUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
      console.log('File uploaded successfully:', fileUrl);
      uploadedFiles.push(fileUrl);
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw error;
    }
  }
  
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
              const key = oldCompany.logo.split('/').pop();
              const deleteCommand = new DeleteObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: `placement-company-logos/${key}`
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
              const key = oldStudent.photo.split('/').pop();
              const deleteCommand = new DeleteObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: `placement-student-photos/${key}`
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
    
    console.log('Placement section update request for user:', userId);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request files keys:', Object.keys(req.files || {}));
    
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
    
    // Parse form data
    let placementData;
    let fileMapping;
    try {
      placementData = JSON.parse(req.body.placementData || '{}');
      fileMapping = JSON.parse(req.body.fileMapping || '{}');
      console.log('Parsed placement data:', placementData);
      console.log('Parsed file mapping:', fileMapping);
    } catch (parseError) {
      console.error('Error parsing form data:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Invalid form data'
      });
    }
    
    // Handle file uploads with proper mapping
    const files = req.files || {};
    console.log('Available files:', Object.keys(files));
    
    // Process company logos with unique identifiers
    if (placementData.topHiringCompanies && Array.isArray(placementData.topHiringCompanies)) {
      for (let i = 0; i < placementData.topHiringCompanies.length; i++) {
        const company = placementData.topHiringCompanies[i];
        
        console.log(`Processing company ${i}:`, {
          name: company.name,
          hasNewFile: company.hasNewFile,
          fileId: company.fileId,
          currentLogo: company.logo
        });
        
        if (company.hasNewFile && company.fileId) {
          const fileFieldName = `companyLogo_${company.fileId}`;
          const file = files[fileFieldName];
          
          console.log(`Looking for file: ${fileFieldName}`, !!file);
          
          if (file && file.length > 0) {
            try {
              const logoUrls = await uploadPlacementFiles([file[0]], 'company-logos');
              if (logoUrls[0]) {
                company.logo = logoUrls[0];
                console.log(`Uploaded company logo: ${logoUrls[0]}`);
              }
            } catch (uploadError) {
              console.error(`Error uploading company logo for ${company.name}:`, uploadError);
            }
          }
        } else if (!company.logo || typeof company.logo !== 'string' || !company.logo.includes('http')) {
          // If no valid logo URL, set to null instead of empty object
          company.logo = null;
        }
        
        // Clean up temporary properties
        delete company.hasNewFile;
        delete company.fileId;
      }
    }
    
    // Process student photos with unique identifiers
    if (placementData.recentPlacementSuccess && Array.isArray(placementData.recentPlacementSuccess)) {
      for (let i = 0; i < placementData.recentPlacementSuccess.length; i++) {
        const student = placementData.recentPlacementSuccess[i];
        
        console.log(`Processing student ${i}:`, {
          name: student.name,
          hasNewFile: student.hasNewFile,
          fileId: student.fileId,
          currentPhoto: student.photo
        });
        
        if (student.hasNewFile && student.fileId) {
          const fileFieldName = `studentPhoto_${student.fileId}`;
          const file = files[fileFieldName];
          
          console.log(`Looking for file: ${fileFieldName}`, !!file);
          
          if (file && file.length > 0) {
            try {
              const photoUrls = await uploadPlacementFiles([file[0]], 'student-photos');
              if (photoUrls[0]) {
                student.photo = photoUrls[0];
                console.log(`Uploaded student photo: ${photoUrls[0]}`);
              }
            } catch (uploadError) {
              console.error(`Error uploading student photo for ${student.name}:`, uploadError);
            }
          }
        } else if (!student.photo || typeof student.photo !== 'string' || !student.photo.includes('http')) {
          // If no valid photo URL, set to null instead of empty object
          student.photo = null;
        }
        
        // Clean up temporary properties
        delete student.hasNewFile;
        delete student.fileId;
      }
    }
    
    // Clean up old files that are no longer used
    if (existingPlacementData) {
      await deleteOldPlacementFiles(existingPlacementData, placementData);
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
    
    console.log('Final placement data to save:', placementData);
    
    // Create or update placement section
    const updatedPlacementSection = await institutePlacementModel.createOrUpdatePlacementSection(
      userId,
      instituteName,
      placementData
    );
    
    console.log('Placement section updated successfully:', updatedPlacementSection);
    
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

// Multer for industry collaboration uploads (images and PDFs)
const industryCollabUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for PDFs and images
  },
  fileFilter: (req, file, cb) => {
    console.log('File filter - fieldname:', file.fieldname, 'mimetype:', file.mimetype, 'originalname:', file.originalname);
    
    // Allow any field name that starts with collabImage_ or mouPdf_
    if (file.fieldname.startsWith('collabImage_') || file.fieldname.startsWith('mouPdf_')) {
      if (file.fieldname.startsWith('collabImage_')) {
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
      } else if (file.fieldname.startsWith('mouPdf_')) {
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
      const key = `industry-collab-${type}/${fileName}`;
      
      console.log(`🔑 S3 upload details:`, {
        bucket: S3_BUCKET_NAME,
        key: key,
        contentType: file.mimetype
      });
      
      const uploadCommand = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'max-age=31536000'
      });
      
      await s3Client.send(uploadCommand);
      
      const fileUrl = `https://${S3_BUCKET_NAME}.s3.${(process.env.AWS_REGION || 'us-east-1').trim()}.amazonaws.com/${key}`;
      
      console.log(`✅ File uploaded successfully: ${fileUrl}`);
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
              const urlParts = oldCard.image.split('/');
              const key = urlParts[urlParts.length - 1];
              const deleteCommand = new DeleteObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: `industry-collab-images/${key}`
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
              const urlParts = oldMou.pdfUrl.split('/');
              const key = urlParts[urlParts.length - 1];
              const deleteCommand = new DeleteObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: `industry-collab-pdfs/${key}`
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
 * Update industry collaboration section data with file uploads
 * @route PUT /api/institute/industry-collaborations
 */
const updateIndustryCollaborations = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('Industry collaboration update request for user:', userId);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request files keys:', Object.keys(req.files || {}));
    
    // Get institute profile to get institute name
    const user = await userModel.getUserById(userId);
    if (!user || user.role !== 'institute') {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }
    
    const instituteName = user.name || 'Unknown Institute';
    
    // Get existing collaboration data for cleanup
    const existingCollabData = await instituteIndustryCollabModel.getIndustryCollabSectionByInstituteId(userId);
    
    // Parse form data
    let collabData;
    let fileMapping;
    try {
      console.log('Raw request body:', {
        collabData: req.body.collabData ? req.body.collabData.substring(0, 200) + '...' : 'undefined',
        fileMapping: req.body.fileMapping ? req.body.fileMapping.substring(0, 200) + '...' : 'undefined'
      });
      
      collabData = JSON.parse(req.body.collabData || '{}');
      fileMapping = JSON.parse(req.body.fileMapping || '{}');
      
      console.log('Parsed collaboration data:', {
        collaborationCards: collabData.collaborationCards?.length || 0,
        mouItems: collabData.mouItems?.length || 0,
        mouItemsWithData: collabData.mouItems?.filter(mou => mou.title)?.length || 0
      });
      console.log('Parsed file mapping:', fileMapping);
    } catch (parseError) {
      console.error('Error parsing form data:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Invalid form data'
      });
    }
    
    // Handle file uploads with proper mapping
    const files = req.files || {};
    console.log('Available files:', Object.keys(files));
    
    // Process collaboration card images with permanent storage
    if (collabData.collaborationCards && Array.isArray(collabData.collaborationCards)) {
      for (let i = 0; i < collabData.collaborationCards.length; i++) {
        const card = collabData.collaborationCards[i];
        
        console.log(`Processing collaboration card ${i}:`, {
          title: card.title,
          hasNewFile: card.hasNewFile,
          fileId: card.fileId,
          currentImage: card.image
        });
        
        if (card.hasNewFile && card.fileId) {
          const fileFieldName = `collabImage_${card.fileId}`;
          const file = files[fileFieldName];
          
          console.log(`Looking for file: ${fileFieldName}`, !!file);
          
          if (file && file.length > 0) {
            try {
              // Delete old image if exists
              if (card.image && typeof card.image === 'string' && card.image.includes('http')) {
                try {
                  const oldKey = card.image.split('/').pop();
                  const deleteCommand = new DeleteObjectCommand({
                    Bucket: S3_BUCKET_NAME,
                    Key: `industry-collab-images/${oldKey}`
                  });
                  await s3Client.send(deleteCommand);
                  console.log(`Deleted old collaboration image: ${oldKey}`);
                } catch (deleteError) {
                  console.error('Error deleting old collaboration image:', deleteError);
                }
              }
              
              const imageUrls = await uploadIndustryCollabFiles([file[0]], 'images');
              if (imageUrls[0]) {
                card.image = imageUrls[0];
                console.log(`Uploaded collaboration image: ${imageUrls[0]}`);
              }
            } catch (uploadError) {
              console.error(`Error uploading collaboration image for ${card.title}:`, uploadError);
              // Keep existing image if upload fails
            }
          }
        }
        
        // Ensure image URL is properly preserved
        if (!card.image || typeof card.image !== 'string' || !card.image.includes('http')) {
          // Only set to null if there's no valid existing image
          if (!existingCollabData?.collaborationCards?.[i]?.image) {
            card.image = null;
          } else {
            // Preserve existing image if no new upload
            card.image = existingCollabData.collaborationCards[i].image;
          }
        }
        
        // Clean up temporary properties
        delete card.hasNewFile;
        delete card.fileId;
      }
    }
    
    // Process MOU PDFs with improved logic
    if (collabData.mouItems && Array.isArray(collabData.mouItems)) {
      for (let i = 0; i < collabData.mouItems.length; i++) {
        const mou = collabData.mouItems[i];
        
        console.log(`Processing MOU ${i}:`, {
          title: mou.title,
          hasNewFile: mou.hasNewFile,
          fileId: mou.fileId,
          currentPdfUrl: mou.pdfUrl
        });
        
        // Handle new PDF file upload
        if (mou.hasNewFile && mou.fileId) {
          const fileFieldName = `mouPdf_${mou.fileId}`;
          const file = files[fileFieldName];
          
          console.log(`🔍 Looking for PDF file: ${fileFieldName}`, {
            fileExists: !!file,
            fileLength: file?.length || 0,
            fileName: file?.[0]?.originalname || 'N/A',
            fileSize: file?.[0]?.size || 0,
            mimeType: file?.[0]?.mimetype || 'N/A'
          });
          
          if (file && file.length > 0) {
            try {
              // Delete old PDF if exists
              if (mou.pdfUrl && typeof mou.pdfUrl === 'string' && mou.pdfUrl.includes('http')) {
                try {
                  const oldKey = mou.pdfUrl.split('/').pop();
                  const deleteCommand = new DeleteObjectCommand({
                    Bucket: S3_BUCKET_NAME,
                    Key: `industry-collab-pdfs/${oldKey}`
                  });
                  await s3Client.send(deleteCommand);
                  console.log(`Deleted old MOU PDF: ${oldKey}`);
                } catch (deleteError) {
                  console.error('Error deleting old MOU PDF:', deleteError);
                }
              }
              
              console.log('📤 Attempting to upload PDF file...');
              const pdfUrls = await uploadIndustryCollabFiles([file[0]], 'pdfs');
              console.log('📥 Upload result:', pdfUrls);
              
              if (pdfUrls[0]) {
                mou.pdfUrl = pdfUrls[0];
                console.log(`✅ PDF uploaded successfully: ${pdfUrls[0]}`);
              } else {
                console.error('❌ PDF upload failed - no URL returned');
                // Keep existing URL if upload fails
                if (existingCollabData?.mouItems?.[i]?.pdfUrl) {
                  mou.pdfUrl = existingCollabData.mouItems[i].pdfUrl;
                } else {
                  mou.pdfUrl = '';
                }
              }
            } catch (error) {
              console.error(`❌ PDF upload error:`, error);
              // Keep existing URL if upload fails
              if (existingCollabData?.mouItems?.[i]?.pdfUrl) {
                mou.pdfUrl = existingCollabData.mouItems[i].pdfUrl;
              } else {
                mou.pdfUrl = '';
              }
            }
          } else {
            console.log(`No file found for ${fileFieldName}`);
            // Keep existing URL if no new file
            if (existingCollabData?.mouItems?.[i]?.pdfUrl) {
              mou.pdfUrl = existingCollabData.mouItems[i].pdfUrl;
            } else {
              mou.pdfUrl = '';
            }
          }
        }
        // Preserve existing PDF URL if no new file
        else if (!mou.hasNewFile && mou.pdfUrl && typeof mou.pdfUrl === 'string' && mou.pdfUrl.trim() !== '') {
          console.log(`Preserving existing PDF URL: ${mou.pdfUrl}`);
          // Keep the existing pdfUrl as is - no changes needed
        }
        // Try to get from existing data if no current URL
        else if (existingCollabData?.mouItems?.[i]?.pdfUrl && typeof existingCollabData.mouItems[i].pdfUrl === 'string' && existingCollabData.mouItems[i].pdfUrl.trim() !== '') {
          mou.pdfUrl = existingCollabData.mouItems[i].pdfUrl;
          console.log(`Retrieved PDF URL from existing data: ${mou.pdfUrl}`);
        }
        // Set to empty string instead of null to avoid DynamoDB NULL issue
        else {
          mou.pdfUrl = '';
          console.log(`No PDF URL available for MOU: ${mou.title} - setting to empty string`);
        }
        
        delete mou.hasNewFile;
        delete mou.fileId;
      }
    }
    
    // Clean up old files that are no longer used (only if we have new data)
    if (existingCollabData && (collabData.collaborationCards?.length >= 0 || collabData.mouItems?.length >= 0)) {
      await deleteOldIndustryCollabFiles(existingCollabData, collabData);
    }
    
    // Allow empty sections - don't require at least one item
    console.log('📊 Final collaboration data to save:', {
      collaborationCards: collabData.collaborationCards?.length || 0,
      mouItems: collabData.mouItems?.length || 0,
      mouItemsWithPdfs: collabData.mouItems?.filter(mou => mou.pdfUrl && mou.pdfUrl.trim() !== '')?.length || 0,
      mouDetails: collabData.mouItems?.map(mou => ({ 
        title: mou.title, 
        hasPdf: !!(mou.pdfUrl && mou.pdfUrl.trim() !== ''),
        pdfUrl: mou.pdfUrl || 'NULL'
      })) || []
    });
    
    // Validate that we have data to save
    if (!collabData.collaborationCards && !collabData.mouItems) {
      console.log('WARNING: No collaboration data to save');
      collabData = {
        collaborationCards: [],
        mouItems: []
      };
    }
    
    // Create or update industry collaboration section
    console.log('Calling createOrUpdateIndustryCollabSection with:', {
      userId,
      instituteName,
      dataKeys: Object.keys(collabData)
    });
    
    const updatedCollabSection = await instituteIndustryCollabModel.createOrUpdateIndustryCollabSection(
      userId,
      instituteName,
      collabData
    );
    
    console.log('Industry collaboration section updated successfully:', {
      hasData: !!updatedCollabSection,
      collaborationCards: updatedCollabSection?.collaborationCards?.length || 0,
      mouItems: updatedCollabSection?.mouItems?.length || 0,
      mouItemsWithPdfs: updatedCollabSection?.mouItems?.filter(mou => mou.pdfUrl)?.length || 0
    });
    
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
  updateIndustryCollaborations,
  getIndustryCollaborations,
  getPublicIndustryCollaborations,
  serveMouPdf,
  upload,
  studentUpload,
  placementUpload,
  industryCollabUpload
};