/**
 * Upload Middleware
 * Handles file upload configuration and validation using multer
 */
const multer = require('multer');
const path = require('path');

// Configure multer for memory storage
const storage = multer.memoryStorage();

/**
 * File filter function to validate uploaded files
 * @param {object} req - Express request object
 * @param {object} file - Multer file object
 * @param {function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
  try {
    // Check file field name and validate accordingly
    switch (file.fieldname) {
      case 'profilePhoto':
        // Allow only image files for profile photos
        if (file.mimetype.startsWith('image/')) {
          // Check for allowed image formats
          const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error('Profile photo must be JPEG, PNG, GIF, or WebP format'), false);
          }
        } else {
          cb(new Error('Profile photo must be an image file'), false);
        }
        break;

      case 'resume':
        // Allow only PDF files for resumes
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Resume must be a PDF file'), false);
        }
        break;

      case 'certificate':
        // Allow only PDF files for certificates
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Certificate must be a PDF file'), false);
        }
        break;

      default:
        cb(new Error('Invalid file field name'), false);
    }
  } catch (error) {
    cb(error, false);
  }
};

/**
 * Multer configuration for staff file uploads
 */
const uploadConfig = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files per request
    fields: 10, // Maximum 10 form fields
  },
  fileFilter: fileFilter
});

/**
 * Middleware for single file upload
 * @param {string} fieldName - Form field name
 * @returns {function} - Multer middleware
 */
const uploadSingle = (fieldName) => {
  return uploadConfig.single(fieldName);
};

/**
 * Middleware for multiple file uploads with different field names
 * Used for staff profile uploads (profilePhoto, resume, certificate)
 */
const uploadStaffFiles = uploadConfig.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]);

/**
 * Middleware for multiple files of the same type
 * @param {string} fieldName - Form field name
 * @param {number} maxCount - Maximum number of files
 * @returns {function} - Multer middleware
 */
const uploadMultiple = (fieldName, maxCount = 5) => {
  return uploadConfig.array(fieldName, maxCount);
};

/**
 * Middleware for any file upload (flexible)
 */
const uploadAny = uploadConfig.any();

/**
 * Error handling middleware for multer errors
 * @param {object} error - Error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 10MB.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 5 files allowed.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field. Please check field names.'
        });
      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many form fields.'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`
        });
    }
  } else if (error) {
    // Custom validation errors
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next();
};

/**
 * Validate file size before upload
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {function} - Validation middleware
 */
const validateFileSize = (maxSize) => {
  return (req, res, next) => {
    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      
      for (const file of files) {
        if (file.size > maxSize) {
          return res.status(400).json({
            success: false,
            message: `File ${file.originalname} is too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB.`
          });
        }
      }
    }
    next();
  };
};

/**
 * Validate file type before upload
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {function} - Validation middleware
 */
const validateFileType = (allowedTypes) => {
  return (req, res, next) => {
    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      
      for (const file of files) {
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: `File ${file.originalname} has invalid type. Allowed types: ${allowedTypes.join(', ')}`
          });
        }
      }
    }
    next();
  };
};

/**
 * Sanitize uploaded file names
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
const sanitizeFileNames = (req, res, next) => {
  if (req.files) {
    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    
    files.forEach(file => {
      // Remove special characters and spaces from filename
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      file.originalname = `${sanitizedName}${ext}`;
    });
  }
  next();
};

/**
 * Log file upload details
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
const logFileUpload = (req, res, next) => {
  if (req.files) {
    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    console.log(`File upload request from user ${req.user?.userId || 'unknown'}:`);
    files.forEach(file => {
      console.log(`- ${file.fieldname}: ${file.originalname} (${file.mimetype}, ${Math.round(file.size / 1024)}KB)`);
    });
  }
  next();
};

/**
 * Check if user has permission to upload files
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
const checkUploadPermission = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required for file upload'
    });
  }

  // Check if user has staff role (optional, depending on requirements)
  if (req.user.role && req.user.role !== 'staff' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Staff role required for file upload'
    });
  }

  next();
};

module.exports = {
  uploadSingle,
  uploadStaffFiles,
  uploadMultiple,
  uploadAny,
  handleUploadError,
  validateFileSize,
  validateFileType,
  sanitizeFileNames,
  logFileUpload,
  checkUploadPermission,
  uploadConfig
};