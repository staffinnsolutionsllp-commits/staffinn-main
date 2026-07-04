const jwt = require('jsonwebtoken');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Load environment variables
require('dotenv').config();

// Generate a test token
const testUser = {
  userId: 'test-user-123',
  email: 'test@example.com',
  role: 'institute'
};

const token = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '1h' });
console.log('Generated test token:', token);

// Test the upload endpoint
async function testUpload() {
  try {
    // Create a simple test PDF file
    const testPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    
    const form = new FormData();
    form.append('file', testPdfContent, {
      filename: 'test-report.pdf',
      contentType: 'application/pdf'
    });
    form.append('studentId', 'test-student-123');

    const response = await fetch('http://localhost:4001/api/v1/upload/report', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    });

    const result = await response.json();
    console.log('Upload response status:', response.status);
    console.log('Upload response:', result);

    if (!response.ok) {
      console.error('Upload failed with status:', response.status);
      console.error('Error details:', result);
    }
  } catch (error) {
    console.error('Test upload error:', error);
  }
}

// Test basic endpoint first
async function testBasicEndpoint() {
  try {
    const response = await fetch('http://localhost:4001/api/v1/upload/report', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('Basic test response status:', response.status);
    console.log('Basic test response:', result);
  } catch (error) {
    console.error('Basic test error:', error);
  }
}

console.log('Testing upload endpoint...');
testBasicEndpoint().then(() => {
  console.log('\nTesting with file upload...');
  testUpload();
});