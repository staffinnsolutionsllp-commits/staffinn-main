/**
 * Test Government Schemes Functionality
 * This script tests the government schemes API endpoints
 */

const governmentSchemeModel = require('./models/governmentSchemeModel');

async function testGovernmentSchemes() {
  console.log('🧪 Testing Government Schemes Functionality...\n');

  try {
    // Test 1: Add a new scheme with description
    console.log('1. Testing addScheme with description...');
    const testScheme = {
      schemeName: 'Test Skill Development Scheme',
      schemeLink: 'https://example.com/skill-development',
      description: 'This is a test scheme for skill development and employment opportunities.',
      visibility: 'All'
    };

    const addedScheme = await governmentSchemeModel.addScheme(testScheme);
    console.log('✅ Scheme added successfully:', {
      schemeId: addedScheme.schemeId,
      schemeName: addedScheme.schemeName,
      description: addedScheme.description,
      visibility: addedScheme.visibility
    });

    // Test 2: Get all schemes
    console.log('\n2. Testing getAllSchemes...');
    const allSchemes = await governmentSchemeModel.getAllSchemes();
    console.log(`✅ Retrieved ${allSchemes.length} schemes`);

    // Test 3: Get active schemes (visibility = 'All')
    console.log('\n3. Testing getAllActiveSchemes...');
    const activeSchemes = await governmentSchemeModel.getAllActiveSchemes();
    console.log(`✅ Retrieved ${activeSchemes.length} active schemes (visibility = 'All')`);

    // Test 4: Get schemes by visibility
    console.log('\n4. Testing getSchemesByVisibility...');
    const allVisibilitySchemes = await governmentSchemeModel.getSchemesByVisibility('All');
    console.log(`✅ Retrieved ${allVisibilitySchemes.length} schemes with 'All' visibility`);

    // Test 5: Update scheme with description
    console.log('\n5. Testing updateScheme with description...');
    const updatedScheme = await governmentSchemeModel.updateScheme(addedScheme.schemeId, {
      schemeName: 'Updated Test Skill Development Scheme',
      schemeLink: 'https://example.com/updated-skill-development',
      description: 'This is an updated test scheme with enhanced features for skill development.',
      visibility: 'All'
    });
    console.log('✅ Scheme updated successfully:', {
      schemeId: updatedScheme.schemeId,
      schemeName: updatedScheme.schemeName,
      description: updatedScheme.description
    });

    // Test 6: Clean up - delete the test scheme
    console.log('\n6. Cleaning up test data...');
    await governmentSchemeModel.deleteScheme(addedScheme.schemeId);
    console.log('✅ Test scheme deleted successfully');

    console.log('\n🎉 All tests passed! Government Schemes functionality is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testGovernmentSchemes();
}

module.exports = { testGovernmentSchemes };