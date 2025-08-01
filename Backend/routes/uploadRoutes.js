/**
 * Upload Routes
 * Routes for file upload operations
 */
const express = require('express');
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

/**
 * @route POST /api/upload/profile-image
 * @desc Upload profile image
 * @access Private
 */
router.post('/profile-image', 
  authenticate, 
  upload.single('profileImage'), 
  uploadController.uploadProfileImage
);

/**
 * @route POST /api/upload/resume
 * @desc Upload resume/CV document
 * @access Private
 */
router.post('/resume', 
  authenticate, 
  upload.single('resume'), 
  uploadController.uploadResume
);

/**
 * @route POST /api/upload/certificate
 * @desc Upload certificate document
 * @access Private
 */
router.post('/certificate', 
  authenticate, 
  upload.single('certificate'), 
  uploadController.uploadCertificate
);

/**
 * @route POST /api/upload/:type
 * @desc Upload single file by type (image/document)
 * @access Private
 */
router.post('/:type', 
  authenticate, 
  upload.single('file'), 
  uploadController.uploadSingleFile
);

/**
 * @route POST /api/upload/multiple/:type
 * @desc Upload multiple files by type
 * @access Private
 */
router.post('/multiple/:type', 
  authenticate, 
  upload.array('files', 10), // Max 10 files
  uploadController.uploadMultipleFiles
);

/**
 * @route DELETE /api/upload/:fileId
 * @desc Delete uploaded file
 * @access Private
 */
router.delete('/:fileId', 
  authenticate, 
  uploadController.deleteFile
);

/**
 * @route GET /api/upload/info/:fileId
 * @desc Get file information
 * @access Private
 */
router.get('/info/:fileId', 
  authenticate, 
  uploadController.getFileInfo
);

module.exports = router;