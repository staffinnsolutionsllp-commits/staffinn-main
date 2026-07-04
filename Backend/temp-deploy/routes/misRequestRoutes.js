/**
 * MIS Request Routes
 * Routes for handling MIS requests for Staffinn Partner institutes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const misRequestController = require('../controllers/misRequestController');
const { protect } = require('../middleware/auth');

// Configure multer for PDF uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Institute routes (protected)
router.post('/upload', protect, upload.single('signedPdf'), misRequestController.uploadSignedPdf);

// Admin routes (protected) - these are handled by admin routes, so removing from here

module.exports = router;