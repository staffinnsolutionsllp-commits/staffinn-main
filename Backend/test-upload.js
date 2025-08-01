/**
 * Test file upload functionality
 */

// Load environment variables
require('dotenv').config();

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api/v1';

// Test file upload
async function testFileUpload() {
  try {
    console.log('Testing file upload...');
    
    // First login to get token
    const loginData = {
      email: 'teststaff@example.com',
      password: 'password123'
    };
    
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });
    
    const loginResult = await loginResponse.json();
    
    if (!loginResult.success) {
      console.log('❌ Login failed:', loginResult.message);
      return;
    }
    
    const token = loginResult.data.accessToken;
    console.log('✅ Login successful, token received');
    
    // Create a test image file (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    // Create form data
    const formData = new FormData();
    formData.append('profilePhoto', testImageBuffer, {
      filename: 'test-profile.png',
      contentType: 'image/png'
    });
    
    console.log('Uploading test profile photo...');
    
    // Upload file
    const uploadResponse = await fetch(`${API_URL}/staff/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const uploadResult = await uploadResponse.json();
    console.log('Upload response:', uploadResult);
    
    if (uploadResult.success) {
      console.log('✅ File upload successful');
    } else {
      console.log('❌ File upload failed:', uploadResult.message);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run test
testFileUpload();