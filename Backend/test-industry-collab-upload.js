/**
 * Test script for Industry Collaboration file uploads
 * This script tests the S3 upload functionality for collaboration images and MOU PDFs
 */

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

async function testS3Upload() {
  try {
    console.log('Testing S3 upload functionality...');
    console.log('Bucket:', S3_BUCKET_NAME);
    console.log('Region:', process.env.AWS_REGION || 'us-east-1');

    // Create a test image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    // Test collaboration image upload
    const imageFileName = `test-collab-image-${uuidv4()}.png`;
    const imageKey = `industry-collab-images/${imageFileName}`;

    console.log('Uploading test collaboration image...');
    const imageUploadCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: imageKey,
      Body: testImageBuffer,
      ContentType: 'image/png',
      CacheControl: 'max-age=31536000'
    });

    await s3Client.send(imageUploadCommand);
    const imageUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${imageKey}`;
    console.log('✅ Collaboration image uploaded successfully:', imageUrl);

    // Test PDF upload (create a minimal PDF)
    const testPdfBuffer = Buffer.from(`%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test MOU Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF`);

    const pdfFileName = `test-mou-${uuidv4()}.pdf`;
    const pdfKey = `industry-collab-pdfs/${pdfFileName}`;

    console.log('Uploading test MOU PDF...');
    const pdfUploadCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: pdfKey,
      Body: testPdfBuffer,
      ContentType: 'application/pdf',
      CacheControl: 'max-age=31536000'
    });

    await s3Client.send(pdfUploadCommand);
    const pdfUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${pdfKey}`;
    console.log('✅ MOU PDF uploaded successfully:', pdfUrl);

    // Test file accessibility
    console.log('Testing file accessibility...');
    
    try {
      const imageResponse = await fetch(imageUrl, { method: 'HEAD' });
      console.log('Image accessibility:', imageResponse.ok ? '✅ Accessible' : '❌ Not accessible');
    } catch (error) {
      console.log('Image accessibility test failed:', error.message);
    }

    try {
      const pdfResponse = await fetch(pdfUrl, { method: 'HEAD' });
      console.log('PDF accessibility:', pdfResponse.ok ? '✅ Accessible' : '❌ Not accessible');
    } catch (error) {
      console.log('PDF accessibility test failed:', error.message);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\nTest URLs:');
    console.log('Image:', imageUrl);
    console.log('PDF:', pdfUrl);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testS3Upload();