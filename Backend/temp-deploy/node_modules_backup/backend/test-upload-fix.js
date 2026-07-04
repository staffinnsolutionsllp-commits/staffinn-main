const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1'
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

async function testUploadFix() {
  console.log('Testing upload without ACL...');

  try {
    // Test upload without ACL
    const testContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    const testKey = `student-reports/test-${Date.now()}.pdf`;
    
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: testKey,
      Body: testContent,
      ContentType: 'application/pdf'
      // No ACL parameter
    };

    console.log('Uploading test PDF...');
    const uploadResult = await s3.upload(uploadParams).promise();
    console.log('✅ Upload successful!');
    console.log('Upload URL:', uploadResult.Location);

    // Clean up
    await s3.deleteObject({ Bucket: BUCKET_NAME, Key: testKey }).promise();
    console.log('✅ Test file cleaned up');

    console.log('\n🎉 Upload fix successful! Report upload should work now.');

  } catch (error) {
    console.error('❌ Upload test failed:', error.message);
  }
}

testUploadFix();