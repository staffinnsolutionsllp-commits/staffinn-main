/**
 * Staff Controller
 * Handles staff registration, profile management, and file uploads
 */
const userModel = require('../models/userModel');
const staffModel = require('../models/staffModel');
const jwtUtils = require('../utils/jwtUtils');
const { validateStaffRegistration } = require('../utils/validation');
const emailService = require('../services/emailService');
const s3Service = require('../services/s3Service');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'profilePhoto') {
      // Allow images
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Profile photo must be an image file'), false);
      }
    } else if (file.fieldname === 'resume') {
      // Allow PDFs
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Resume must be a PDF file'), false);
      }
    } else if (file.fieldname === 'certificate') {
      // Allow PDFs for certificates
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Certificate must be a PDF file'), false);
      }
    } else {
      cb(new Error('Invalid file field'), false);
    }
  }
}).fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]);

/**
 * Register a new staff member
 * @route POST /api/staff/register
 */
const registerStaff = async (req, res) => {
  try {
    console.log('Staff registration request:', req.body);
    
    // Validate staff registration data
    const { error, value } = validateStaffRegistration(req.body);
    
    if (error) {
      console.log('Staff validation error:', error);
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
    
    // Prepare user data for creation
    const userData = {
      fullName: value.fullName,
      email: value.email,
      password: value.password,
      phoneNumber: value.phoneNumber,
      role: 'staff'
    };
    
    // Create user in users table
    const user = await userModel.createUser(userData);
    console.log('Created user:', user);
    
    // Create initial staff profile
    const staffProfileData = {
      userId: user.userId,
      fullName: value.fullName,
      email: value.email,
      phone: value.phoneNumber,
      isActiveStaff: false, // Default to seeker mode
      profileVisibility: 'public', // Keep profile visible by default
      profilePhoto: null,
      resumeUrl: null,
      skills: '',
      address: '',
      pincode: '',
      sector: '',
      role: '',
      state: '',
      city: '',
      availability: 'available',
      visibility: 'public',
      experiences: [],
      certificates: [],
      education: {
        tenth: { percentage: '', year: '', school: '' },
        twelfth: { percentage: '', year: '', school: '' },
        graduation: { degree: '', college: '', percentage: '', startDate: '', endDate: '', pursuing: false }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save staff profile
    const staffProfile = await staffModel.createStaffProfile(staffProfileData);
    console.log('Created staff profile:', staffProfile);
    
    // Generate tokens
    const tokens = jwtUtils.generateTokens(user);
    
    // Send welcome email (optional)
    try {
      await emailService.sendWelcomeEmail(user.email, user.name, 'staff');
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
    }
    
    // Send response
    res.status(201).json({
      success: true,
      message: 'Staff registered successfully',
      data: {
        user: {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber
        },
        ...tokens
      }
    });
    
  } catch (error) {
    console.error('Staff registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Staff registration failed'
    });
  }
};

/**
 * Get staff profile
 * @route GET /api/staff/profile
 */
const getStaffProfile = async (req, res) => {
  try {
    // Add debugging and validation
    console.log('Get profile request user:', req.user);
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or userId missing'
      });
    }
    
    const userId = req.user.userId;
    console.log('Getting staff profile for userId:', userId);
    
    // Get staff profile
    const staffProfile = await staffModel.getStaffProfile(userId);
    
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
    console.error('Get staff profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get staff profile'
    });
  }
};

/**
 * Update staff profile
 * @route PUT /api/staff/profile
 */
const updateStaffProfile = async (req, res) => {
  try {
    // Add debugging and validation
    console.log('Update profile request user:', req.user);
    console.log('Update profile request body:', req.body);
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or userId missing'
      });
    }
    
    const userId = req.user.userId;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.userId;
    delete updateData.createdAt;
    
    // Add timestamp
    updateData.updatedAt = new Date().toISOString();
    
    console.log('Updating profile for userId:', userId, 'with data:', updateData);
    
    // Update staff profile
    const updatedProfile = await staffModel.updateStaffProfile(userId, updateData);
    
    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Staff profile updated successfully',
      data: updatedProfile
    });
    
  } catch (error) {
    console.error('Update staff profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update staff profile'
    });
  }
};

/**
 * Toggle profile mode (Active Staff / Seeker)
 * @route PUT /api/staff/toggle-mode
 */
const toggleProfileMode = async (req, res) => {
  try {
    // Add debugging and validation
    console.log('Toggle request user:', req.user);
    console.log('Toggle request body:', req.body);
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or userId missing'
      });
    }
    
    const userId = req.user.userId;
    const { isActiveStaff } = req.body;
    
    console.log('Toggling profile mode for user:', userId, 'to active:', isActiveStaff);
    
    // Check if staff profile exists, create if not
    let staffProfile = await staffModel.getStaffProfile(userId);
    if (!staffProfile) {
      console.log('Staff profile not found, creating one...');
      const userData = await userModel.findUserById(userId);
      if (!userData) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const staffProfileData = {
        userId: userId,
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phoneNumber,
        isActiveStaff: Boolean(isActiveStaff),
        profileVisibility: 'public', // Default to public for new profiles
        profilePhoto: null,
        resumeUrl: null,
        skills: '',
        address: '',
        pincode: '',
        sector: '',
        role: '',
        state: '',
        city: '',
        availability: 'available',
        visibility: 'public',
        experiences: [],
        certificates: [],
        education: {
          tenth: { percentage: '', year: '', school: '' },
          twelfth: { percentage: '', year: '', school: '' },
          graduation: { degree: '', college: '', percentage: '', startDate: '', endDate: '', pursuing: false }
        }
      };
      
      staffProfile = await staffModel.createStaffProfile(staffProfileData);
    } else {
      const updateData = {
        isActiveStaff: Boolean(isActiveStaff),
        updatedAt: new Date().toISOString()
      };
      
      // Only set visibility to public if becoming active staff
      // Keep existing visibility when becoming seeker (don't force to private)
      if (isActiveStaff) {
        updateData.profileVisibility = 'public';
      }
      
      console.log('Updating profile with isActiveStaff:', updateData.isActiveStaff);
      staffProfile = await staffModel.updateStaffProfile(userId, updateData);
    }
    
    const updatedProfile = staffProfile;
    
    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found'
      });
    }
    
    console.log('Profile mode toggled successfully:', updatedProfile);
    
    res.status(200).json({
      success: true,
      message: `Profile mode updated to ${isActiveStaff ? 'Active Staff' : 'Seeker'}`,
      data: updatedProfile
    });
    
  } catch (error) {
    console.error('Toggle profile mode error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle profile mode'
    });
  }
};

/**
 * Get all active staff profiles (Public)
 * @route GET /api/staff/active-profiles
 */
const getActiveStaffProfiles = async (req, res) => {
  try {
    console.log('Getting active staff profiles...');
    const activeStaffProfiles = await staffModel.getActiveStaffProfiles();
    console.log('Found active staff profiles:', activeStaffProfiles.length);
    
    res.status(200).json({
      success: true,
      data: activeStaffProfiles
    });
    
  } catch (error) {
    console.error('Get active staff profiles error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get active staff profiles'
    });
  }
};

/**
 * Get specific staff profile by ID (Public)
 * @route GET /api/staff/profile/:staffId
 */
const getStaffProfileById = async (req, res) => {
  try {
    const { staffId } = req.params;
    console.log('Getting staff profile by ID:', staffId);
    
    const staffProfile = await staffModel.getStaffProfile(staffId);
    
    if (!staffProfile || !staffProfile.isActiveStaff || staffProfile.profileVisibility !== 'public') {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found or not public'
      });
    }
    
    res.status(200).json({
      success: true,
      data: staffProfile
    });
    
  } catch (error) {
    console.error('Get staff profile by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get staff profile'
    });
  }
};

/**
 * Get trending staff profiles based on profile views (Public)
 * @route GET /api/staff/trending
 */
const getTrendingStaff = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    console.log('Getting trending staff profiles with limit:', limit);
    
    const trendingStaffProfiles = await staffModel.getTrendingStaffProfiles(limit);
    console.log('Found trending staff profiles:', trendingStaffProfiles.length);
    
    res.status(200).json({
      success: true,
      data: trendingStaffProfiles
    });
    
  } catch (error) {
    console.error('Get trending staff profiles error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get trending staff profiles'
    });
  }
};

/**
 * Upload files (Profile photo, Resume, Certificate)
 * @route POST /api/staff/upload
 */
const uploadFiles = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    try {
      // Add debugging and validation
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated or userId missing'
        });
      }
      
      const userId = req.user.userId;
      const uploadResults = {};
      
      console.log('Upload request for user:', userId);
      console.log('Files received:', req.files);
      console.log('Body received:', req.body);
      
      // Upload profile photo
      if (req.files && req.files.profilePhoto) {
        const file = req.files.profilePhoto[0];
        const fileName = `staff-profiles/${userId}/profile-photo-${Date.now()}${path.extname(file.originalname)}`;
        console.log('Uploading profile photo:', fileName);
        const uploadResult = await s3Service.uploadFile(file, fileName);
        uploadResults.profilePhoto = uploadResult.Location;
      }
      
      // Upload resume
      if (req.files && req.files.resume) {
        const file = req.files.resume[0];
        const fileName = `staff-profiles/${userId}/resume-${Date.now()}.pdf`;
        console.log('Uploading resume:', fileName);
        const uploadResult = await s3Service.uploadFile(file, fileName);
        uploadResults.resumeUrl = uploadResult.Location;
      }
      
      // Upload certificate
      if (req.files && req.files.certificate) {
        const file = req.files.certificate[0];
        const fileName = `staff-profiles/${userId}/certificate-${Date.now()}.pdf`;
        console.log('Uploading certificate:', fileName);
        const uploadResult = await s3Service.uploadFile(file, fileName);
        
        // Add certificate to user's profile
        const certificateData = {
          id: Date.now().toString(),
          name: req.body.certificateName || 'Certificate',
          issuer: req.body.certificateIssuer || 'Unknown',
          issued: req.body.certificateIssued || new Date().toISOString().split('T')[0],
          duration: req.body.certificateDuration || 'N/A',
          url: uploadResult.Location
        };
        
        uploadResults.certificate = certificateData;
      }
      
      // Update staff profile with new file URLs
      if (Object.keys(uploadResults).length > 0) {
        const updateData = { updatedAt: new Date().toISOString() };
        
        if (uploadResults.profilePhoto) {
          updateData.profilePhoto = uploadResults.profilePhoto;
        }
        
        if (uploadResults.resumeUrl) {
          updateData.resumeUrl = uploadResults.resumeUrl;
        }
        
        if (uploadResults.certificate) {
          // Get current profile to update certificates array
          const currentProfile = await staffModel.getStaffProfile(userId);
          const certificates = currentProfile.certificates || [];
          certificates.push(uploadResults.certificate);
          updateData.certificates = certificates;
        }
        
        console.log('Updating profile with upload results:', updateData);
        await staffModel.updateStaffProfile(userId, updateData);
      }
      
      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully',
        data: uploadResults
      });
      
    } catch (uploadError) {
      console.error('File upload error:', uploadError);
      res.status(500).json({
        success: false,
        message: uploadError.message || 'Failed to upload files'
      });
    }
  });
};

/**
 * Remove profile photo
 * @route DELETE /api/staff/profile-photo
 */
const removeProfilePhoto = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or userId missing'
      });
    }
    
    const userId = req.user.userId;
    console.log('Removing profile photo for user:', userId);
    
    // Update profile to remove photo URL
    const updateData = {
      profilePhoto: null,
      updatedAt: new Date().toISOString()
    };
    
    await staffModel.updateStaffProfile(userId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Profile photo removed successfully'
    });
    
  } catch (error) {
    console.error('Remove profile photo error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove profile photo'
    });
  }
};

/**
 * Delete certificate
 * @route DELETE /api/staff/certificate/:certificateId
 */
const deleteCertificate = async (req, res) => {
  try {
    // Add debugging and validation
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or userId missing'
      });
    }
    
    const userId = req.user.userId;
    const { certificateId } = req.params;
    
    console.log('Deleting certificate:', certificateId, 'for user:', userId);
    
    // Get current profile
    const currentProfile = await staffModel.getStaffProfile(userId);
    
    if (!currentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found'
      });
    }
    
    // Filter out the certificate to delete
    const certificates = (currentProfile.certificates || []).filter(cert => cert.id !== certificateId);
    
    // Update profile
    const updateData = {
      certificates: certificates,
      updatedAt: new Date().toISOString()
    };
    
    await staffModel.updateStaffProfile(userId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Certificate deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete certificate error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete certificate'
    });
  }
};

/**
 * Get all staff members (Admin only)
 * @route GET /api/staff/all
 */
const getAllStaff = async (req, res) => {
  try {
    // Add debugging and validation
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or userId missing'
      });
    }
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    // Get all staff profiles
    const staffList = await staffModel.getAllStaffProfiles();
    
    res.status(200).json({
      success: true,
      data: staffList
    });
    
  } catch (error) {
    console.error('Get all staff error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get staff list'
    });
  }
};

/**
 * Delete staff profile (Admin only)
 * @route DELETE /api/staff/:staffId
 */
const deleteStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    
    // Add debugging and validation
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or userId missing'
      });
    }
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    console.log('Deleting staff:', staffId, 'by admin:', req.user.userId);
    
    // Delete staff profile
    const deleted = await staffModel.deleteStaffProfile(staffId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Failed to delete staff profile'
      });
    }
    
    // Also delete from users table
    await userModel.deleteUser(staffId);
    
    res.status(200).json({
      success: true,
      message: 'Staff deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete staff'
    });
  }
};

/**
 * Search staff profiles (Public)
 * @route GET /api/staff/search
 */
const searchStaff = async (req, res) => {
  try {
    const searchParams = {
      skills: req.query.skills,
      location: req.query.location,
      availability: req.query.availability,
      sector: req.query.sector,
      role: req.query.role,
      state: req.query.state,
      city: req.query.city
    };
    
    console.log('Search staff with params:', searchParams);
    
    const staffProfiles = await staffModel.searchStaffProfiles(searchParams);
    
    res.status(200).json({
      success: true,
      data: staffProfiles
    });
    
  } catch (error) {
    console.error('Search staff error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search staff profiles'
    });
  }
};

module.exports = {
  registerStaff,
  getStaffProfile,
  updateStaffProfile,
  toggleProfileMode,
  getActiveStaffProfiles,
  getStaffProfileById,
  getTrendingStaff,
  uploadFiles,
  removeProfilePhoto,
  deleteCertificate,
  getAllStaff,
  deleteStaff,
  searchStaff
};