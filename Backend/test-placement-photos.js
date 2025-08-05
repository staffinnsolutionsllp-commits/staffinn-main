/**
 * Test script for placement section photo uploads
 * This script tests the new S3 upload functionality for placement section photos
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api/v1';

// Test configuration
const TEST_CONFIG = {
  // Replace with actual institute token
  authToken: 'your-institute-jwt-token-here',
  
  // Test data
  placementData: {
    averageSalary: '8.5 LPA',
    highestPackage: '25 LPA',
    topHiringCompanies: [
      { name: 'TechCorp Solutions', logo: null },
      { name: 'Digital Innovations', logo: null }
    ],
    recentPlacementSuccess: [
      { name: 'John Doe', company: 'TechCorp Solutions', position: 'Software Engineer', photo: null },
      { name: 'Jane Smith', company: 'Digital Innovations', position: 'Data Analyst', photo: null }
    ]
  }
};

/**
 * Create a test image file buffer
 */
function createTestImageBuffer() {
  // Create a simple 1x1 pixel PNG image buffer
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Image data
    0xE2, 0x21, 0xBC, 0x33, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return pngBuffer;
}

/**
 * Test placement section update with photo uploads
 */
async function testPlacementSectionUpdate() {
  try {
    console.log('🧪 Testing placement section photo uploads...\n');
    
    // Check if auth token is provided
    if (TEST_CONFIG.authToken === 'your-institute-jwt-token-here') {
      console.log('❌ Please update the authToken in TEST_CONFIG with a valid institute JWT token');
      return;
    }
    
    // Create FormData
    const formData = new FormData();
    
    // Add test images for company logos
    const testImageBuffer = createTestImageBuffer();
    formData.append('companyLogos', testImageBuffer, {
      filename: 'test-logo-1.png',
      contentType: 'image/png'
    });
    formData.append('companyLogos', testImageBuffer, {
      filename: 'test-logo-2.png',
      contentType: 'image/png'
    });
    
    // Add test images for student photos
    formData.append('studentPhotos', testImageBuffer, {
      filename: 'test-student-1.png',
      contentType: 'image/png'
    });
    formData.append('studentPhotos', testImageBuffer, {
      filename: 'test-student-2.png',
      contentType: 'image/png'
    });
    
    // Add placement data as JSON
    formData.append('placementData', JSON.stringify(TEST_CONFIG.placementData));
    
    // Make API request
    console.log('📤 Sending placement section update request...');\n    const response = await fetch(`${API_URL}/institutes/placement-section`, {\n      method: 'PUT',\n      headers: {\n        'Authorization': `Bearer ${TEST_CONFIG.authToken}`\n      },\n      body: formData\n    });\n    \n    const result = await response.json();\n    \n    console.log('📥 Response Status:', response.status);\n    console.log('📥 Response Data:', JSON.stringify(result, null, 2));\n    \n    if (result.success) {\n      console.log('\\n✅ Placement section updated successfully!');\n      console.log('🔗 Photos should now be uploaded to S3 and URLs saved in database');\n      \n      // Test retrieval\n      console.log('\\n🔍 Testing placement section retrieval...');\n      const getResponse = await fetch(`${API_URL}/institutes/placement-section`, {\n        method: 'GET',\n        headers: {\n          'Authorization': `Bearer ${TEST_CONFIG.authToken}`,\n          'Content-Type': 'application/json'\n        }\n      });\n      \n      const getData = await getResponse.json();\n      console.log('📥 Retrieved Data:', JSON.stringify(getData, null, 2));\n      \n      if (getData.success && getData.data) {\n        console.log('\\n🎯 Verification:');\n        \n        // Check company logos\n        if (getData.data.topHiringCompanies) {\n          getData.data.topHiringCompanies.forEach((company, index) => {\n            if (company.logo && company.logo.includes('s3.amazonaws.com')) {\n              console.log(`✅ Company ${index + 1} logo uploaded: ${company.logo}`);\n            } else {\n              console.log(`❌ Company ${index + 1} logo not found or invalid`);\n            }\n          });\n        }\n        \n        // Check student photos\n        if (getData.data.recentPlacementSuccess) {\n          getData.data.recentPlacementSuccess.forEach((student, index) => {\n            if (student.photo && student.photo.includes('s3.amazonaws.com')) {\n              console.log(`✅ Student ${index + 1} photo uploaded: ${student.photo}`);\n            } else {\n              console.log(`❌ Student ${index + 1} photo not found or invalid`);\n            }\n          });\n        }\n      }\n    } else {\n      console.log('\\n❌ Placement section update failed:', result.message);\n    }\n    \n  } catch (error) {\n    console.error('\\n💥 Test failed with error:', error.message);\n    console.error('Stack trace:', error.stack);\n  }\n}\n\n/**\n * Test endpoint availability\n */\nasync function testEndpointAvailability() {\n  try {\n    console.log('🔍 Testing API endpoint availability...');\n    \n    const response = await fetch(`${API_URL}/institutes/public/all`, {\n      method: 'GET'\n    });\n    \n    if (response.ok) {\n      console.log('✅ API server is running and accessible');\n      return true;\n    } else {\n      console.log('❌ API server responded with error:', response.status);\n      return false;\n    }\n  } catch (error) {\n    console.log('❌ Cannot connect to API server:', error.message);\n    return false;\n  }\n}\n\n/**\n * Main test function\n */\nasync function runTests() {\n  console.log('🚀 Starting Placement Section Photo Upload Tests\\n');\n  console.log('=' .repeat(60));\n  \n  // Test endpoint availability first\n  const isAvailable = await testEndpointAvailability();\n  if (!isAvailable) {\n    console.log('\\n❌ Cannot proceed with tests - API server not available');\n    return;\n  }\n  \n  console.log('\\n' + '=' .repeat(60));\n  \n  // Test placement section update\n  await testPlacementSectionUpdate();\n  \n  console.log('\\n' + '=' .repeat(60));\n  console.log('🏁 Tests completed!');\n  \n  console.log('\\n📋 Manual Testing Steps:');\n  console.log('1. Login to institute dashboard');\n  console.log('2. Go to Placements tab');\n  console.log('3. Add company logos and student photos in Placement Section Management');\n  console.log('4. Click \"Update Placement Section\" button');\n  console.log('5. Verify photos are saved and page redirects to overview');\n  console.log('6. Check that photos persist after page refresh');\n}\n\n// Run tests if this file is executed directly\nif (require.main === module) {\n  runTests().catch(console.error);\n}\n\nmodule.exports = {\n  testPlacementSectionUpdate,\n  testEndpointAvailability,\n  runTests\n};\n