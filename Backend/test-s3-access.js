/**
 * Test S3 public access
 */

// Load environment variables
require('dotenv').config();

const s3Service = require('./services/s3Service');

async function testS3Access() {
  try {
    console.log('Testing S3 public access...');
    
    // Create a test file
    const testFile = {
      buffer: Buffer.from('Test file content'),
      mimetype: 'text/plain',
      originalname: 'test.txt'
    };
    
    const key = `test-files/test-${Date.now()}.txt`;
    console.log('Uploading test file:', key);
    
    const result = await s3Service.uploadFile(testFile, key);
    console.log('Upload result:', result);
    
    // Test if file is publicly accessible
    const fileUrl = result.Location;
    console.log('Testing public access to:', fileUrl);
    
    const fetch = require('node-fetch');
    const response = await fetch(fileUrl);
    
    if (response.ok) {
      const content = await response.text();
      console.log('✅ File is publicly accessible');
      console.log('Content:', content);
    } else {
      console.log('❌ File is not publicly accessible');
      console.log('Status:', response.status, response.statusText);
    }
    
    // Clean up test file
    await s3Service.deleteFile(key);
    console.log('Test file cleaned up');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testS3Access();