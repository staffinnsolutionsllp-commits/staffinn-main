/**
 * Test script to debug placement section upload
 */
const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

// Test S3 connection
async function testS3Connection() {
  try {
    console.log('🔍 Testing S3 connection...');
    
    const listCommand = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      MaxKeys: 5
    });
    
    const result = await s3Client.send(listCommand);
    console.log('✅ S3 connection successful');
    console.log('📁 Bucket contents:', result.Contents?.map(obj => obj.Key) || []);
    
    return true;
  } catch (error) {
    console.error('❌ S3 connection failed:', error);
    return false;
  }
}

// Test file upload to placement folders
async function testPlacementFolderUpload() {
  try {
    console.log('🧪 Testing placement folder upload...');
    
    // Create test file buffer
    const testFileBuffer = Buffer.from('Test placement image content');
    const testFileName = `test-${uuidv4()}.txt`;
    
    // Test company logos folder
    const companyLogoKey = `placement-company-logos/${testFileName}`;
    const companyUploadCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: companyLogoKey,
      Body: testFileBuffer,
      ContentType: 'text/plain'
    });
    
    await s3Client.send(companyUploadCommand);
    console.log('✅ Company logo folder upload successful:', companyLogoKey);
    
    // Test student photos folder
    const studentPhotoKey = `placement-student-photos/${testFileName}`;
    const studentUploadCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: studentPhotoKey,
      Body: testFileBuffer,
      ContentType: 'text/plain'
    });
    
    await s3Client.send(studentUploadCommand);
    console.log('✅ Student photo folder upload successful:', studentPhotoKey);
    
    return true;
  } catch (error) {
    console.error('❌ Placement folder upload failed:', error);
    return false;
  }
}

// Test multer configuration
function testMulterConfig() {
  console.log('🧪 Testing multer configuration...');
  
  const storage = multer.memoryStorage();
  const placementUpload = multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
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
  
  console.log('✅ Multer configuration created successfully');
  return placementUpload;
}

// Main test function
async function runTests() {
  console.log('🚀 Starting placement upload tests...\n');
  
  // Test 1: S3 Connection
  const s3Connected = await testS3Connection();
  console.log('');
  
  if (!s3Connected) {
    console.log('❌ S3 connection failed. Cannot proceed with other tests.');
    return;
  }
  
  // Test 2: Placement folder upload
  const folderUploadSuccess = await testPlacementFolderUpload();
  console.log('');
  
  // Test 3: Multer configuration
  const multerUpload = testMulterConfig();
  console.log('');
  
  // Summary
  console.log('📊 Test Summary:');
  console.log(`S3 Connection: ${s3Connected ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Folder Upload: ${folderUploadSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Multer Config: ${multerUpload ? '✅ PASS' : '❌ FAIL'}`);
  
  if (s3Connected && folderUploadSuccess && multerUpload) {
    console.log('\n🎉 All tests passed! Placement upload should work correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the configuration.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testS3Connection,
  testPlacementFolderUpload,
  testMulterConfig,
  runTests
};