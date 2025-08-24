/**
 * Test script for placement section image functionality
 * This script tests the complete flow of placement section image upload, display, and removal
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api/v1';
const TEST_INSTITUTE_TOKEN = 'your-test-institute-token-here'; // Replace with actual token

// Test data
const testPlacementData = {
    averageSalary: '8.5 LPA',
    highestPackage: '24 LPA',
    topHiringCompanies: [
        {
            id: 'test_company_1',
            name: 'Tech Solutions Inc',
            hasNewFile: true,
            fileId: 'test_company_1'
        },
        {
            id: 'test_company_2', 
            name: 'Global Innovations',
            hasNewFile: true,
            fileId: 'test_company_2'
        }
    ],
    recentPlacementSuccess: [
        {
            id: 'test_student_1',
            name: 'John Doe',
            company: 'Tech Solutions Inc',
            position: 'Software Engineer',
            hasNewFile: true,
            fileId: 'test_student_1'
        },
        {
            id: 'test_student_2',
            name: 'Jane Smith', 
            company: 'Global Innovations',
            position: 'Data Analyst',
            hasNewFile: true,
            fileId: 'test_student_2'
        }
    ]
};

// Helper function to create test image
function createTestImage(name) {
    // Create a simple test image buffer (1x1 pixel PNG)
    const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
        0x60, 0x82
    ]);
    
    return {
        buffer: pngBuffer,
        originalname: `${name}.png`,
        mimetype: 'image/png',
        size: pngBuffer.length
    };
}

// Test functions
async function testPlacementSectionUpdate() {
    console.log('🧪 Testing Placement Section Update...\n');
    
    try {
        // Create FormData
        const formData = new FormData();
        
        // Add placement data
        formData.append('placementData', JSON.stringify(testPlacementData));
        formData.append('fileMapping', JSON.stringify({
            companyLogos: {
                'test_company_1': 0,
                'test_company_2': 1
            },
            studentPhotos: {
                'test_student_1': 0,
                'test_student_2': 1
            }
        }));
        
        // Add test images
        const companyLogo1 = createTestImage('company1_logo');
        const companyLogo2 = createTestImage('company2_logo');
        const studentPhoto1 = createTestImage('student1_photo');
        const studentPhoto2 = createTestImage('student2_photo');
        
        formData.append('companyLogo_test_company_1', companyLogo1.buffer, {
            filename: companyLogo1.originalname,
            contentType: companyLogo1.mimetype
        });
        
        formData.append('companyLogo_test_company_2', companyLogo2.buffer, {
            filename: companyLogo2.originalname,
            contentType: companyLogo2.mimetype
        });
        
        formData.append('studentPhoto_test_student_1', studentPhoto1.buffer, {
            filename: studentPhoto1.originalname,
            contentType: studentPhoto1.mimetype
        });
        
        formData.append('studentPhoto_test_student_2', studentPhoto2.buffer, {
            filename: studentPhoto2.originalname,
            contentType: studentPhoto2.mimetype
        });
        
        // Make API request
        const response = await fetch(`${API_BASE_URL}/institutes/placement-section`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${TEST_INSTITUTE_TOKEN}`,
                ...formData.getHeaders()
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Placement section update successful!');
            console.log('📊 Updated data:', JSON.stringify(result.data, null, 2));
            return result.data;
        } else {
            console.log('❌ Placement section update failed:', result.message);
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error testing placement section update:', error);
        return null;
    }
}

async function testPlacementSectionGet() {
    console.log('\n🧪 Testing Placement Section Get...\n');
    
    try {
        const response = await fetch(`${API_BASE_URL}/institutes/placement-section`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TEST_INSTITUTE_TOKEN}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Placement section get successful!');
            console.log('📊 Retrieved data:', JSON.stringify(result.data, null, 2));
            
            // Verify images are present
            if (result.data) {
                const { topHiringCompanies, recentPlacementSuccess } = result.data;
                
                console.log('\n🔍 Image verification:');
                
                if (topHiringCompanies) {
                    topHiringCompanies.forEach((company, index) => {
                        console.log(`Company ${index + 1} (${company.name}): ${company.logo ? '✅ Has logo' : '❌ No logo'}`);
                    });
                }
                
                if (recentPlacementSuccess) {
                    recentPlacementSuccess.forEach((student, index) => {
                        console.log(`Student ${index + 1} (${student.name}): ${student.photo ? '✅ Has photo' : '❌ No photo'}`);
                    });
                }
            }
            
            return result.data;
        } else {
            console.log('❌ Placement section get failed:', result.message);
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error testing placement section get:', error);
        return null;
    }
}

async function testImageRemoval() {
    console.log('\n🧪 Testing Image Removal...\n');
    
    try {
        // First get current data
        const currentData = await testPlacementSectionGet();
        if (!currentData) {
            console.log('❌ Cannot test removal - no current data');
            return;
        }
        
        // Modify data to remove first company logo and first student photo
        const modifiedData = JSON.parse(JSON.stringify(currentData));
        
        if (modifiedData.topHiringCompanies && modifiedData.topHiringCompanies.length > 0) {
            modifiedData.topHiringCompanies[0].logo = null;
            modifiedData.topHiringCompanies[0].isRemoved = true;
        }
        
        if (modifiedData.recentPlacementSuccess && modifiedData.recentPlacementSuccess.length > 0) {
            modifiedData.recentPlacementSuccess[0].photo = null;
            modifiedData.recentPlacementSuccess[0].isRemoved = true;
        }
        
        // Create FormData for update\n        const formData = new FormData();\n        formData.append('placementData', JSON.stringify(modifiedData));\n        formData.append('fileMapping', JSON.stringify({}));\n        \n        // Make API request\n        const response = await fetch(`${API_BASE_URL}/institutes/placement-section`, {\n            method: 'PUT',\n            headers: {\n                'Authorization': `Bearer ${TEST_INSTITUTE_TOKEN}`,\n                ...formData.getHeaders()\n            },\n            body: formData\n        });\n        \n        const result = await response.json();\n        \n        if (result.success) {\n            console.log('✅ Image removal successful!');\n            \n            // Verify removal\n            const updatedData = await testPlacementSectionGet();\n            if (updatedData) {\n                const firstCompanyLogo = updatedData.topHiringCompanies?.[0]?.logo;\n                const firstStudentPhoto = updatedData.recentPlacementSuccess?.[0]?.photo;\n                \n                console.log(`First company logo removed: ${!firstCompanyLogo ? '✅' : '❌'}`);\n                console.log(`First student photo removed: ${!firstStudentPhoto ? '✅' : '❌'}`);\n            }\n        } else {\n            console.log('❌ Image removal failed:', result.message);\n        }\n        \n    } catch (error) {\n        console.error('❌ Error testing image removal:', error);\n    }\n}\n\nasync function testPublicPlacementSection(instituteId) {\n    console.log('\\n🧪 Testing Public Placement Section...');\n    \n    try {\n        const response = await fetch(`${API_BASE_URL}/institutes/public/${instituteId}/placement-section`, {\n            method: 'GET',\n            headers: {\n                'Content-Type': 'application/json'\n            }\n        });\n        \n        const result = await response.json();\n        \n        if (result.success) {\n            console.log('✅ Public placement section get successful!');\n            console.log('📊 Public data:', JSON.stringify(result.data, null, 2));\n            return result.data;\n        } else {\n            console.log('❌ Public placement section get failed:', result.message);\n            return null;\n        }\n        \n    } catch (error) {\n        console.error('❌ Error testing public placement section:', error);\n        return null;\n    }\n}\n\n// Main test runner\nasync function runAllTests() {\n    console.log('🚀 Starting Placement Section Image Tests\\n');\n    console.log('=' .repeat(50));\n    \n    if (!TEST_INSTITUTE_TOKEN || TEST_INSTITUTE_TOKEN === 'your-test-institute-token-here') {\n        console.log('❌ Please set TEST_INSTITUTE_TOKEN in the script');\n        return;\n    }\n    \n    // Test 1: Update placement section with images\n    const updateResult = await testPlacementSectionUpdate();\n    \n    // Test 2: Get placement section data\n    const getData = await testPlacementSectionGet();\n    \n    // Test 3: Test image removal\n    await testImageRemoval();\n    \n    // Test 4: Test public access (replace 'test-institute-id' with actual ID)\n    // await testPublicPlacementSection('test-institute-id');\n    \n    console.log('\\n' + '='.repeat(50));\n    console.log('🏁 All tests completed!');\n}\n\n// Run tests if this file is executed directly\nif (require.main === module) {\n    runAllTests().catch(console.error);\n}\n\nmodule.exports = {\n    testPlacementSectionUpdate,\n    testPlacementSectionGet,\n    testImageRemoval,\n    testPublicPlacementSection,\n    runAllTests\n};\n