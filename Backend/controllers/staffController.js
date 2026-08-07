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

// ─── PHASE 0.5 SECURITY: Field Allowlist & Response Sanitization ──────────

/**
 * Fields that Staff may update through the generic profile-update endpoint.
 * Any field NOT in this list will be rejected with 400.
 */
const ALLOWED_PROFILE_UPDATE_FIELDS = [
  'fullName',
  'phone',
  'address',
  'state',
  'city',
  'pincode',
  'sector',
  'role',
  'skills',
  'availability',
  'education',
  'experiences',
  'socialLinks',
  'professionalTitle',
  'about',
  'employmentType'
];

/**
 * Fields that are NEVER allowed through the generic update endpoint.
 * If any of these appear in the request, the request is rejected.
 */
const BLOCKED_FIELDS = [
  'staffId',
  'userId',
  'email',
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'rating',
  'reviewCount',
  'reviews',
  'profileViews',
  'createdAt',
  'updatedAt',
  'isActiveStaff',
  'profileVisibility',
  'visibility',
  'certificates',
  'profilePhoto',
  'resumeUrl'
];

/**
 * Check if a staff profile is fully complete (all required fields filled).
 * Returns true only when every required field is non-empty.
 * This is used for the blue tick badge on public profile cards and full profile view.
 */
const isStaffProfileComplete = (profile) => {
  if (!profile) return false;
  return !!(
    profile.address && profile.address.trim() !== '' &&
    profile.state && profile.state.trim() !== '' &&
    profile.city && profile.city.trim() !== '' &&
    profile.pincode && profile.pincode.trim() !== '' &&
    profile.sector && profile.sector.trim() !== '' &&
    profile.role && profile.role.trim() !== '' &&
    profile.skills && profile.skills.trim() !== '' &&
    profile.fullName && profile.fullName.trim() !== '' &&
    profile.phone && profile.phone.trim() !== '' &&
    profile.professionalTitle && profile.professionalTitle.trim() !== '' &&
    profile.about && profile.about.trim() !== '' &&
    profile.employmentType && profile.employmentType.trim() !== '' &&
    profile.profilePhoto && profile.profilePhoto.trim() !== ''
  );
};

/**
 * Sanitize a staff profile for owner response (own profile).
 * Strips credentials and internal system fields not needed by frontend.
 */
const sanitizeProfileForOwner = (profile) => {
  if (!profile) return null;
  const sanitized = { ...profile };
  delete sanitized.password;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;
  delete sanitized.confirmPassword;
  // Add computed isProfileComplete for owner view
  sanitized.isProfileComplete = isStaffProfileComplete(profile);
  return sanitized;
};

/**
 * Sanitize a staff profile for public/other-user response.
 * Strips credentials, salary from experiences, full address, pincode.
 */
const sanitizeProfileForPublic = (profile) => {
  if (!profile) return null;
  const sanitized = { ...profile };
  // Remove credential fields
  delete sanitized.password;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;
  delete sanitized.confirmPassword;
  // Remove private location details
  delete sanitized.address;
  delete sanitized.pincode;
  // Remove internal/system fields
  delete sanitized.profileViews;
  delete sanitized.recentActivity;
  delete sanitized.isActiveStaff;
  delete sanitized.profileVisibility;
  delete sanitized.visibility;
  // Ensure rating/reviewCount have safe defaults
  sanitized.rating = sanitized.rating || 0;
  sanitized.reviewCount = sanitized.reviewCount || 0;
  // Add computed isProfileComplete for public view
  sanitized.isProfileComplete = isStaffProfileComplete(profile);
  // Remove salary from experiences
  if (Array.isArray(sanitized.experiences)) {
    sanitized.experiences = sanitized.experiences.map(exp => {
      const { salary, ...rest } = exp;
      return rest;
    });
  }
  return sanitized;
};

/**
 * Produce card-level data for the public staff listing.
 * Only returns fields needed by the listing card UI.
 */
const toCardDTO = (profile) => {
  if (!profile) return null;
  return {
    userId: profile.userId,
    staffId: profile.staffId,
    profileSlug: profile.profileSlug || null,
    fullName: profile.fullName,
    profilePhoto: profile.profilePhoto,
    sector: profile.sector,
    role: profile.role,
    skills: profile.skills,
    state: profile.state,
    city: profile.city,
    availability: profile.availability,
    rating: profile.rating || 0,
    reviewCount: profile.reviewCount || 0,
    experiences: Array.isArray(profile.experiences)
      ? profile.experiences.map(exp => ({
          startDate: exp.startDate,
          endDate: exp.endDate
        }))
      : [],
    socialLinks: profile.socialLinks,
    employmentType: profile.employmentType || null,
    isProfileComplete: isStaffProfileComplete(profile)
  };
};

// ─── END SECURITY DEFINITIONS ────────────────────────────────────────────

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
    
    // Validate staff registration data
    const { error, value } = validateStaffRegistration(req.body);
    
    if (error) {
      console.log('Staff validation error:', error);
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    // Check if email is verified
    const otpService = require('../services/otpService');
    const otpStatus = await otpService.getOTPStatus(value.email);
    
    if (!otpStatus || !otpStatus.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email first'
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
    
    // Create initial staff profile - Default to seeker mode
    const staffProfileData = {
      userId: user.userId,
      fullName: value.fullName,
      email: value.email,
      phone: value.phoneNumber,
      isActiveStaff: false, // Default to seeker mode
      profileVisibility: 'private', // Start as private until they complete profile
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
      employmentType: '',
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

    // Clean up OTP after successful registration
    await otpService.deleteOTP(value.email);
    
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
      message: 'Staff registered successfully. Complete your profile to become an Active Staff.',
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
      data: sanitizeProfileForOwner(staffProfile)
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
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or userId missing'
      });
    }
    
    const userId = req.user.userId;
    const rawBody = req.body;
    
    // PHASE 0.5 SECURITY: Reject requests containing blocked or unknown fields
    const requestKeys = Object.keys(rawBody);
    const blockedFound = requestKeys.filter(key => BLOCKED_FIELDS.includes(key));
    const unknownFound = requestKeys.filter(key => 
      !ALLOWED_PROFILE_UPDATE_FIELDS.includes(key) && !BLOCKED_FIELDS.includes(key)
    );
    
    if (blockedFound.length > 0 || unknownFound.length > 0) {
      const invalidFields = [...blockedFound, ...unknownFound];
      return res.status(400).json({
        success: false,
        message: 'Request contains fields that cannot be updated through this endpoint.',
        invalidFields: invalidFields
      });
    }
    
    // Build update data from allowlist only
    const updateData = {};
    for (const key of ALLOWED_PROFILE_UPDATE_FIELDS) {
      if (rawBody[key] !== undefined) {
        updateData[key] = rawBody[key];
      }
    }
    
    // Validate string fields
    if (updateData.fullName !== undefined && typeof updateData.fullName === 'string') {
      updateData.fullName = updateData.fullName.trim().substring(0, 100);
    }
    if (updateData.professionalTitle !== undefined && typeof updateData.professionalTitle === 'string') {
      updateData.professionalTitle = updateData.professionalTitle.trim().substring(0, 100);
    }
    if (updateData.about !== undefined && typeof updateData.about === 'string') {
      updateData.about = updateData.about.trim().substring(0, 1000);
    }
    
    updateData.updatedAt = new Date().toISOString();
    
    const updatedProfile = await staffModel.updateStaffProfile(userId, updateData);
    
    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found or update failed'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Staff profile updated successfully',
      data: sanitizeProfileForOwner(updatedProfile)
    });
    
  } catch (error) {
    console.error('Update staff profile error:', error.message);
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
    console.log('Toggle request for user:', req.user?.userId);
    
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
        profileVisibility: isActiveStaff ? 'public' : 'private',
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
      // If trying to become active staff, validate mandatory fields
      if (isActiveStaff) {
        const missingFields = [];
        
        if (!staffProfile.address || staffProfile.address.trim() === '') {
          missingFields.push('Address (House No. / Street / Area)');
        }
        if (!staffProfile.state || staffProfile.state.trim() === '') {
          missingFields.push('State');
        }
        if (!staffProfile.city || staffProfile.city.trim() === '') {
          missingFields.push('City');
        }
        if (!staffProfile.pincode || staffProfile.pincode.trim() === '') {
          missingFields.push('Pincode');
        }
        if (!staffProfile.sector || staffProfile.sector.trim() === '') {
          missingFields.push('Choose Your Sector');
        }
        if (!staffProfile.role || staffProfile.role.trim() === '') {
          missingFields.push('Choose Your Role');
        }
        if (!staffProfile.skills || staffProfile.skills.trim() === '') {
          missingFields.push('Skills (separate with commas)');
        }
        
        if (missingFields.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Please complete your profile first. Missing fields: ' + missingFields.join(', '),
            missingFields: missingFields
          });
        }
      }
      
      const updateData = {
        isActiveStaff: Boolean(isActiveStaff),
        updatedAt: new Date().toISOString()
      };
      
      // Set visibility based on active staff status
      if (isActiveStaff) {
        updateData.profileVisibility = 'public';
      } else {
        updateData.profileVisibility = 'private';
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
      data: sanitizeProfileForOwner(updatedProfile)
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
    const activeStaffProfiles = await staffModel.getActiveStaffProfiles();
    
    // PHASE 0.5: Return card-level DTO only — not full records
    const cardData = activeStaffProfiles.map(toCardDTO);
    
    res.status(200).json({
      success: true,
      data: cardData
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
    
    const staffProfile = await staffModel.getStaffProfile(staffId);
    
    if (!staffProfile || !staffProfile.isActiveStaff || staffProfile.profileVisibility !== 'public') {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found or not public'
      });
    }
    
    // PHASE 0.5: Return sanitized public profile (no salary, address, pincode, credentials)
    res.status(200).json({
      success: true,
      data: sanitizeProfileForPublic(staffProfile)
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
 * Get staff profile by profileSlug (Authenticated)
 * @route GET /api/staff/slug/:profileSlug
 */
const getStaffProfileBySlug = async (req, res) => {
  try {
    const { profileSlug } = req.params;
    
    // Validate slug format
    if (!profileSlug || typeof profileSlug !== 'string' || profileSlug.length > 100) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    const staffProfile = await staffModel.getStaffProfileBySlug(profileSlug.trim());
    
    if (!staffProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    // Build role-based DTO
    const dto = sanitizeProfileForPublic(staffProfile);
    
    // Remove staffId from public DTO (userId is the operational identifier)
    delete dto.staffId;
    
    // Role-based field restriction
    if (req.user.role !== 'recruiter') {
      delete dto.phone;
      delete dto.resumeUrl;
    }
    
    // Add fields that may be new/missing with safe defaults
    dto.professionalTitle = dto.professionalTitle || '';
    dto.about = dto.about || '';
    
    res.status(200).json({
      success: true,
      data: dto
    });
    
  } catch (error) {
    // Do not expose internal error details
    console.error('Get staff profile by slug error:', error.message);
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again.'
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
    
    const trendingStaffProfiles = await staffModel.getTrendingStaffProfiles(limit);
    
    // PHASE 0.5: Return card-level DTO only
    const cardData = trendingStaffProfiles.map(toCardDTO);
    
    res.status(200).json({
      success: true,
      data: cardData
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
    
    const staffProfiles = await staffModel.searchStaffProfiles(searchParams);
    
    // PHASE 0.5: Return card-level DTO only
    const cardData = staffProfiles.map(toCardDTO);
    
    res.status(200).json({
      success: true,
      data: cardData
    });
    
  } catch (error) {
    console.error('Search staff error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search staff profiles'
    });
  }
};

/**
 * Check if profile is complete for going live
 * @route GET /api/staff/profile-completion-status
 */
const getProfileCompletionStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or userId missing'
      });
    }
    
    const userId = req.user.userId;
    const staffProfile = await staffModel.getStaffProfile(userId);
    
    if (!staffProfile) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found'
      });
    }
    
    const missingFields = [];
    
    if (!staffProfile.address || staffProfile.address.trim() === '') {
      missingFields.push('Address (House No. / Street / Area)');
    }
    if (!staffProfile.state || staffProfile.state.trim() === '') {
      missingFields.push('State');
    }
    if (!staffProfile.city || staffProfile.city.trim() === '') {
      missingFields.push('City');
    }
    if (!staffProfile.pincode || staffProfile.pincode.trim() === '') {
      missingFields.push('Pincode');
    }
    if (!staffProfile.sector || staffProfile.sector.trim() === '') {
      missingFields.push('Choose Your Sector');
    }
    if (!staffProfile.role || staffProfile.role.trim() === '') {
      missingFields.push('Choose Your Role');
    }
    if (!staffProfile.skills || staffProfile.skills.trim() === '') {
      missingFields.push('Skills (separate with commas)');
    }
    
    const isComplete = missingFields.length === 0;
    
    res.status(200).json({
      success: true,
      data: {
        isComplete,
        missingFields,
        canGoLive: isComplete
      }
    });
    
  } catch (error) {
    console.error('Get profile completion status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get profile completion status'
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
  getStaffProfileBySlug,
  getTrendingStaff,
  uploadFiles,
  removeProfilePhoto,
  deleteCertificate,
  getAllStaff,
  deleteStaff,
  searchStaff,
  getProfileCompletionStatus
};