/**
 * Test file upload to identify the exact issue
 */

const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const app = express();

// S3 configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log('🔍 File filter check:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    
    if (file.fieldname.startsWith('mouPdf_')) {
      if (file.mimetype === 'application/pdf') {
        console.log('✅ PDF file accepted');
        cb(null, true);
      } else {
        console.log('❌ PDF file rejected - wrong mimetype');
        cb(new Error('Only PDF files allowed'));
      }
    } else {
      console.log('❌ File rejected - wrong fieldname');
      cb(new Error('Invalid field name'));
    }
  }
});

// Test endpoint
app.post('/test-upload', upload.any(), async (req, res) => {
  try {
    console.log('📥 Test upload request received');
    console.log('Body keys:', Object.keys(req.body));
    console.log('Files:', req.files?.length || 0);
    
    if (req.files && req.files.length > 0) {
      const file = req.files[0];
      console.log('📄 File details:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        hasBuffer: !!file.buffer
      });
      
      // Test S3 upload
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      const fileName = `test-${uuidv4()}.${fileExtension}`;
      const key = `test-uploads/${fileName}`;
      
      const uploadCommand = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      });
      
      await s3Client.send(uploadCommand);
      
      const fileUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
      
      console.log('✅ File uploaded successfully:', fileUrl);
      
      res.json({
        success: true,
        message: 'File uploaded successfully',
        url: fileUrl
      });
    } else {
      console.log('❌ No files received');
      res.json({
        success: false,
        message: 'No files received'
      });
    }
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`Test endpoint: POST http://localhost:${PORT}/test-upload`);
});

module.exports = app;