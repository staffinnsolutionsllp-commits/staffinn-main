/**
 * Test PDF Upload Issue - Step by Step Debug
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Test 1: Check if S3 credentials work
const testS3Connection = async () => {
  console.log('🔍 Testing S3 connection...');
  
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    // Create a test file
    const testContent = 'Test PDF content';
    const testKey = `test-pdf-${Date.now()}.txt`;
    
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'staffinn-files',
      Key: `industry-collab-pdfs/${testKey}`,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain'
    });

    await s3Client.send(uploadCommand);
    
    const testUrl = `https://${process.env.S3_BUCKET_NAME || 'staffinn-files'}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/industry-collab-pdfs/${testKey}`;
    
    console.log('✅ S3 upload successful!');
    console.log('📄 Test URL:', testUrl);
    return testUrl;
    
  } catch (error) {
    console.log('❌ S3 upload failed:', error.message);
    return null;
  }
};

// Test 2: Check controller processing
const testControllerLogic = () => {
  console.log('\n🔍 Testing controller logic...');
  
  // Simulate controller data processing
  const mockCollabData = {
    mouItems: [
      {
        id: 'test_mou_123',
        title: 'Test MOU',
        description: 'Test description',
        pdfUrl: null,
        hasNewFile: true,
        fileId: 'test_mou_123'
      }
    ]
  };
  
  const mockFiles = {
    'mouPdf_test_mou_123': [{
      originalname: 'test.pdf',
      buffer: Buffer.from('fake pdf content'),
      mimetype: 'application/pdf'
    }]
  };
  
  console.log('📝 Mock data prepared:');
  console.log('   MOU items:', mockCollabData.mouItems.length);
  console.log('   Files available:', Object.keys(mockFiles));
  console.log('   First MOU hasNewFile:', mockCollabData.mouItems[0].hasNewFile);
  console.log('   First MOU fileId:', mockCollabData.mouItems[0].fileId);
  
  // Check if file would be found
  const mou = mockCollabData.mouItems[0];
  const fileFieldName = `mouPdf_${mou.fileId}`;
  const file = mockFiles[fileFieldName];
  
  console.log('🔍 File lookup:');
  console.log('   Looking for:', fileFieldName);
  console.log('   File found:', !!file);
  console.log('   File details:', file ? file[0].originalname : 'None');
  
  return !!file;
};

// Test 3: Check model validation
const testModelValidation = () => {
  console.log('\n🔍 Testing model validation...');
  
  const testUrls = [
    'https://staffinn-files.s3.us-east-1.amazonaws.com/industry-collab-pdfs/test.pdf',
    'http://example.com/test.pdf',
    's3://bucket/test.pdf',
    '',
    null,
    undefined,
    'invalid-url'
  ];
  
  testUrls.forEach(url => {
    const isValid = url && typeof url === 'string' && url.trim() !== '';
    console.log(`   "${url}" -> ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  });
};

// Main test function
const runTests = async () => {
  console.log('🚀 PDF Upload Debug Test\n');
  console.log('=' .repeat(50));
  
  // Check environment variables
  console.log('🔍 Environment check:');
  console.log('   AWS_REGION:', process.env.AWS_REGION || 'NOT SET');
  console.log('   AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET');
  console.log('   AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');
  console.log('   S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME || 'NOT SET');
  
  if (!process.env.AWS_ACCESS_KEY_ID) {
    console.log('\n❌ AWS credentials not found!');
    console.log('💡 This is likely the main issue - PDF upload needs S3 credentials');
    return;
  }
  
  // Test S3 connection
  const testUrl = await testS3Connection();
  
  // Test controller logic
  const controllerWorks = testControllerLogic();
  
  // Test model validation
  testModelValidation();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 DIAGNOSIS:');
  
  if (!testUrl) {
    console.log('❌ MAIN ISSUE: S3 upload failing');
    console.log('💡 Fix: Check AWS credentials and S3 bucket configuration');
  } else if (!controllerWorks) {
    console.log('❌ MAIN ISSUE: Controller not processing files correctly');
    console.log('💡 Fix: Check file field naming and multer configuration');
  } else {
    console.log('✅ All tests passed - issue might be elsewhere');
  }
};

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };