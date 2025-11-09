/**
 * Quick Fix Test - Check if PDF upload works with proper env loading
 */

require('dotenv').config();

const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Multer for PDF uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'));
    }
  }
});

// Test PDF upload endpoint
app.post('/test-pdf-upload', upload.single('pdf'), async (req, res) => {
  try {
    console.log('📄 PDF upload test started');
    console.log('File received:', req.file ? req.file.originalname : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file provided' });
    }
    
    // Generate unique filename
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `test-${uuidv4()}-${Date.now()}.${fileExtension}`;
    const key = `industry-collab-pdfs/${fileName}`;
    
    console.log('Uploading to S3:', key);
    
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
    const pdfUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    
    console.log('✅ PDF uploaded successfully:', pdfUrl);
    
    res.json({
      success: true,
      message: 'PDF uploaded successfully',
      pdfUrl: pdfUrl,
      fileName: req.file.originalname
    });
    
  } catch (error) {
    console.error('❌ PDF upload failed:', error);
    res.status(500).json({
      success: false,
      message: 'PDF upload failed',
      error: error.message
    });
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test server running',
    env: {
      AWS_REGION: process.env.AWS_REGION,
      S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET'
    }
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log('📄 Test PDF upload: POST http://localhost:' + PORT + '/test-pdf-upload');
  console.log('🔍 Test env: GET http://localhost:' + PORT + '/test');
});