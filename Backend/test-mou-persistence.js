/**
 * Test script to verify MOU PDF persistence fix
 * This script tests the industry collaboration MOU upload and persistence functionality
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api/v1';

// Test configuration
const TEST_CONFIG = {
  // You'll need to replace this with a valid JWT token from a logged-in institute
  authToken: 'YOUR_JWT_TOKEN_HERE',
  instituteId: 'test-institute-id'
};

// Create a test PDF file
const createTestPDF = () => {
  const testPDFContent = `%PDF-1.4
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
%%EOF`;

  const testPDFPath = path.join(__dirname, 'test-mou.pdf');
  fs.writeFileSync(testPDFPath, testPDFContent);
  return testPDFPath;
};

// Test function to upload MOU and verify persistence
const testMOUPersistence = async () => {
  try {
    console.log('🧪 Starting MOU PDF persistence test...\n');

    // Step 1: Create test PDF
    console.log('📄 Creating test PDF file...');
    const testPDFPath = createTestPDF();
    console.log(`✅ Test PDF created at: ${testPDFPath}\n`);

    // Step 2: Upload MOU with PDF
    console.log('📤 Uploading MOU with PDF...');
    const formData = new FormData();
    
    const collabData = {
      collaborationCards: [],
      mouItems: [
        {
          id: `test_mou_${Date.now()}`,
          title: 'Test MOU Document',
          description: 'This is a test MOU document to verify PDF persistence',
          pdfUrl: null,
          pdfFile: null,
          hasNewFile: true,
          isExisting: false,
          isRemoved: false
        }
      ]
    };

    formData.append('collabData', JSON.stringify(collabData));
    formData.append('fileMapping', JSON.stringify({ mouPdfs: {} }));
    formData.append(`mouPdf_${collabData.mouItems[0].id}`, fs.createReadStream(testPDFPath));

    const uploadResponse = await fetch(`${API_BASE_URL}/institutes/industry-collaborations`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`
      },
      body: formData
    });

    const uploadResult = await uploadResponse.json();
    console.log('Upload response:', uploadResult);

    if (!uploadResult.success) {
      throw new Error(`Upload failed: ${uploadResult.message}`);
    }

    console.log('✅ MOU uploaded successfully\n');

    // Step 3: Retrieve and verify data persistence
    console.log('📥 Retrieving industry collaborations...');
    const getResponse = await fetch(`${API_BASE_URL}/institutes/industry-collaborations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const getData = await getResponse.json();
    console.log('Retrieved data:', JSON.stringify(getData, null, 2));

    if (!getData.success) {
      throw new Error(`Retrieval failed: ${getData.message}`);
    }

    // Step 4: Verify PDF URL exists and is accessible
    const mouItems = getData.data?.mouItems || [];
    const testMOU = mouItems.find(mou => mou.title === 'Test MOU Document');

    if (!testMOU) {
      throw new Error('Test MOU not found in retrieved data');
    }

    if (!testMOU.pdfUrl) {
      throw new Error('PDF URL is missing from MOU item');
    }

    console.log(`✅ MOU found with PDF URL: ${testMOU.pdfUrl}\n`);

    // Step 5: Test PDF accessibility
    console.log('🔗 Testing PDF accessibility...');
    const pdfResponse = await fetch(testMOU.pdfUrl);
    
    if (!pdfResponse.ok) {
      throw new Error(`PDF not accessible: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }

    console.log('✅ PDF is publicly accessible\n');

    // Step 6: Test update without new file (should preserve PDF URL)
    console.log('🔄 Testing update without new file...');
    const updateData = {
      collaborationCards: [],
      mouItems: [
        {
          id: `existing_mou_${Date.now()}`,
          title: 'Test MOU Document - Updated',
          description: 'Updated description without new file',
          pdfUrl: testMOU.pdfUrl,
          pdfFile: null,
          hasNewFile: false,
          isExisting: true,
          isRemoved: false
        }
      ]
    };

    const updateFormData = new FormData();
    updateFormData.append('collabData', JSON.stringify(updateData));
    updateFormData.append('fileMapping', JSON.stringify({ mouPdfs: {} }));

    const updateResponse = await fetch(`${API_BASE_URL}/institutes/industry-collaborations`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`
      },
      body: updateFormData
    });

    const updateResult = await updateResponse.json();
    
    if (!updateResult.success) {
      throw new Error(`Update failed: ${updateResult.message}`);
    }

    // Step 7: Verify PDF URL is preserved after update
    const getUpdatedResponse = await fetch(`${API_BASE_URL}/institutes/industry-collaborations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const getUpdatedData = await getUpdatedResponse.json();
    const updatedMOU = getUpdatedData.data?.mouItems?.find(mou => mou.title.includes('Updated'));

    if (!updatedMOU || !updatedMOU.pdfUrl) {
      throw new Error('PDF URL was not preserved after update');
    }

    console.log('✅ PDF URL preserved after update\n');

    // Cleanup
    console.log('🧹 Cleaning up test files...');
    fs.unlinkSync(testPDFPath);
    console.log('✅ Test files cleaned up\n');

    console.log('🎉 All tests passed! MOU PDF persistence is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

// Test function for public access
const testPublicAccess = async () => {
  try {
    console.log('🌐 Testing public access to industry collaborations...\n');

    const publicResponse = await fetch(`${API_BASE_URL}/institutes/public/${TEST_CONFIG.instituteId}/industry-collaborations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const publicData = await publicResponse.json();
    console.log('Public data:', JSON.stringify(publicData, null, 2));

    if (!publicData.success) {
      throw new Error(`Public access failed: ${publicData.message}`);
    }

    const mouItems = publicData.data?.mouItems || [];
    const mouWithPdf = mouItems.find(mou => mou.pdfUrl);

    if (mouWithPdf) {
      console.log(`✅ Found MOU with PDF in public data: ${mouWithPdf.title}`);
      console.log(`📄 PDF URL: ${mouWithPdf.pdfUrl}`);
      
      // Test direct PDF access
      const pdfResponse = await fetch(mouWithPdf.pdfUrl);
      if (pdfResponse.ok) {
        console.log('✅ PDF is publicly accessible');
      } else {
        console.log('❌ PDF is not publicly accessible');
      }
    } else {
      console.log('ℹ️ No MOUs with PDFs found in public data');
    }

  } catch (error) {
    console.error('❌ Public access test failed:', error.message);
  }
};

// Main execution
const main = async () => {
  console.log('🚀 MOU PDF Persistence Test Suite\n');
  console.log('=' .repeat(50));
  
  if (TEST_CONFIG.authToken === 'YOUR_JWT_TOKEN_HERE') {
    console.log('⚠️  Please update TEST_CONFIG.authToken with a valid JWT token');
    console.log('   You can get this by logging into the institute dashboard and checking localStorage.token');
    return;
  }

  await testMOUPersistence();
  console.log('\n' + '=' .repeat(50));
  await testPublicAccess();
};

// Run the test if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  testMOUPersistence,
  testPublicAccess
};