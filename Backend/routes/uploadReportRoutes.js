const express = require('express');
const router = express.Router();
const multer = require('multer');
const AWS = require('aws-sdk');
const { authenticate } = require('../middleware/auth');

// Configure AWS S3
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1'
});

const s3 = new AWS.S3();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload student report PDF to S3
router.post('/student-report', authenticate, upload.single('reportFile'), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Body:', req.body);
    console.log('File:', req.file ? 'File present' : 'No file');
    
    const { studentId } = req.body;
    const file = req.file;
    
    if (!file) {
      console.log('No file uploaded');
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    if (file.mimetype !== 'application/pdf') {
      console.log('Invalid file type:', file.mimetype);
      return res.status(400).json({ success: false, message: 'Only PDF files are allowed' });
    }
    
    console.log('File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    const fileName = `student-reports/${studentId}/${Date.now()}-${file.originalname}`;
    console.log('S3 key:', fileName);
    
    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'staffinn-uploads';
    console.log('Bucket name:', bucketName);
    
    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };
    
    console.log('Starting S3 upload...');
    const result = await s3.upload(uploadParams).promise();
    console.log('S3 upload successful:', result.Location);
    
    res.json({
      success: true,
      data: {
        reportUrl: result.Location,
        fileName: file.originalname
      }
    });
  } catch (error) {
    console.error('Error uploading student report:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;