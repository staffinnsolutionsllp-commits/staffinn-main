/**
 * Debug Placement Upload
 * This script helps debug the placement section upload process
 */

const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

// Configure multer for placement uploads (same as in controller)
const storage = multer.memoryStorage();
const placementUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
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

/**
 * Upload files to S3 for placement section
 */
const uploadPlacementFiles = async (files, type) => {
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
      
      if (!file.buffer) {
        console.error('❌ File buffer is missing');
        throw new Error('File buffer is missing');
      }
      
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      const fileName = `${uuidv4()}-${Date.now()}.${fileExtension}`;
      const key = `placement-${type}/${fileName}`;
      
      console.log(`🔑 S3 upload details:`, {
        bucket: S3_BUCKET_NAME,
        key: key,
        contentType: file.mimetype,
        region: process.env.AWS_REGION || 'ap-south-1'
      });
      
      const uploadCommand = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'max-age=31536000'
      });
      
      const uploadResult = await s3Client.send(uploadCommand);
      console.log('📤 S3 upload result:', uploadResult);
      
      const fileUrl = `https://${S3_BUCKET_NAME}.s3.${(process.env.AWS_REGION || 'ap-south-1').trim()}.amazonaws.com/${key}`;
      
      console.log(`✅ File uploaded successfully: ${fileUrl}`);
      uploadedFiles.push(fileUrl);
    } catch (error) {
      console.error(`❌ S3 upload error for file ${file.originalname}:`, error);
      throw new Error(`Failed to upload ${file.originalname}: ${error.message}`);
    }
  }
  
  console.log(`🎉 Upload complete. ${uploadedFiles.length} files uploaded successfully.`);
  return uploadedFiles;
};

// Create Express app for testing
const app = express();
app.use(express.json());

// Test endpoint that mimics the placement section update
app.put('/test-placement-upload', placementUpload.any(), async (req, res) => {
  try {
    console.log('🚀 Test placement upload request received');
    console.log('📋 Request body keys:', Object.keys(req.body));
    console.log('📁 Request files:', req.files ? req.files.length : 0, 'files');
    
    // Log all files received
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        console.log(`📄 File ${index}:`, {
          fieldname: file.fieldname,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
      });
    }
    
    // Parse placement data
    let placementData;
    try {
      if (typeof req.body.placementData === 'string') {
        placementData = JSON.parse(req.body.placementData);
      } else {
        placementData = req.body.placementData || {};
      }
      
      console.log('📊 Parsed placement data:', {
        averageSalary: placementData.averageSalary,
        highestPackage: placementData.highestPackage,
        companiesCount: placementData.topHiringCompanies?.length || 0,
        studentsCount: placementData.recentPlacementSuccess?.length || 0
      });
    } catch (parseError) {
      console.error('❌ Error parsing placement data:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Invalid placement data format'
      });
    }
    
    // Convert files array to object for easier access
    const filesMap = {};
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        filesMap[file.fieldname] = file;
      });
    }
    
    console.log('🗂️ Files map keys:', Object.keys(filesMap));
    
    // Process company logos
    if (placementData.topHiringCompanies && Array.isArray(placementData.topHiringCompanies)) {
      for (let i = 0; i < placementData.topHiringCompanies.length; i++) {
        const company = placementData.topHiringCompanies[i];
        
        console.log(`🏢 Processing company ${i}:`, {
          name: company.name,
          hasLogo: !!company.logo
        });
        
        // Look for company logo file
        const logoFieldName = `companyLogo_${i}`;
        const logoFile = filesMap[logoFieldName];
        
        if (logoFile) {
          console.log(`📤 Uploading logo for company ${i}: ${company.name}`);
          try {
            const logoUrls = await uploadPlacementFiles([logoFile], 'company-logos');
            if (logoUrls[0]) {
              company.logo = logoUrls[0];
              console.log(`✅ Company logo uploaded: ${logoUrls[0]}`);
            }
          } catch (uploadError) {
            console.error(`❌ Error uploading company logo for ${company.name}:`, uploadError);
            company.logo = null;
          }
        } else {
          console.log(`❌ No logo file found for ${company.name} (looking for ${logoFieldName})`);
          company.logo = null;
        }
      }
    }
    
    // Process student photos
    if (placementData.recentPlacementSuccess && Array.isArray(placementData.recentPlacementSuccess)) {
      for (let i = 0; i < placementData.recentPlacementSuccess.length; i++) {
        const student = placementData.recentPlacementSuccess[i];
        
        console.log(`👨🎓 Processing student ${i}:`, {
          name: student.name,
          hasPhoto: !!student.photo
        });
        
        // Look for student photo file
        const photoFieldName = `studentPhoto_${i}`;
        const photoFile = filesMap[photoFieldName];
        
        if (photoFile) {
          console.log(`📤 Uploading photo for student ${i}: ${student.name}`);
          try {
            const photoUrls = await uploadPlacementFiles([photoFile], 'student-photos');
            if (photoUrls[0]) {
              student.photo = photoUrls[0];
              console.log(`✅ Student photo uploaded: ${photoUrls[0]}`);
            }
          } catch (uploadError) {
            console.error(`❌ Error uploading student photo for ${student.name}:`, uploadError);
            student.photo = null;
          }
        } else {
          console.log(`❌ No photo file found for ${student.name} (looking for ${photoFieldName})`);
          student.photo = null;
        }
      }
    }
    
    console.log('💾 Final placement data:', {
      averageSalary: placementData.averageSalary,
      highestPackage: placementData.highestPackage,
      companiesCount: placementData.topHiringCompanies?.length || 0,
      studentsCount: placementData.recentPlacementSuccess?.length || 0,
      companiesWithLogos: placementData.topHiringCompanies?.filter(c => c.logo && c.logo.includes('http')).length || 0,
      studentsWithPhotos: placementData.recentPlacementSuccess?.filter(s => s.photo && s.photo.includes('http')).length || 0
    });
    
    res.json({
      success: true,
      message: 'Test placement upload completed successfully',
      data: placementData
    });
    
  } catch (error) {
    console.error('❌ Test placement upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Test placement upload failed'
    });
  }
});

// Start test server
const PORT = 4002;
app.listen(PORT, () => {
  console.log(`🧪 Debug placement upload server running on http://localhost:${PORT}`);
  console.log(`📤 Test endpoint: PUT http://localhost:${PORT}/test-placement-upload`);
  console.log('');
  console.log('To test, send a PUT request with:');
  console.log('- Content-Type: multipart/form-data');
  console.log('- placementData: JSON string with placement data');
  console.log('- companyLogo_0, companyLogo_1, etc.: Image files');
  console.log('- studentPhoto_0, studentPhoto_1, etc.: Image files');
});

module.exports = app;