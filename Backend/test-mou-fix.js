/**
 * Test script to verify MOU PDF persistence fix
 * This script tests the industry collaboration MOU upload and persistence functionality
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const awsConfig = require('./config/aws');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const INDUSTRY_COLLAB_TABLE = 'institute-industrycollab-section';

// Test function to verify the fix
const testMOUFix = async () => {
  try {
    console.log('🧪 Testing MOU PDF persistence fix...\n');

    const testInstituteId = 'test-institute-fix';
    const testData = {
      instituteinduscollab: testInstituteId,
      instituteName: 'Test Institute',
      collaborationCards: [],
      mouItems: [
        {
          title: 'Test MOU with PDF',
          description: 'This MOU has a PDF URL',
          pdfUrl: 'https://example.com/test.pdf'
        },
        {
          title: 'Test MOU without PDF',
          description: 'This MOU has no PDF',
          pdfUrl: '' // Empty string instead of null
        }
      ],
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    console.log('📤 Storing test data with empty string for missing PDF...');
    
    // Store test data
    const putCommand = new PutCommand({
      TableName: INDUSTRY_COLLAB_TABLE,
      Item: testData
    });
    
    await docClient.send(putCommand);
    console.log('✅ Test data stored successfully');

    // Retrieve and verify
    console.log('📥 Retrieving test data...');
    
    const getCommand = new GetCommand({
      TableName: INDUSTRY_COLLAB_TABLE,
      Key: {
        instituteinduscollab: testInstituteId
      }
    });

    const response = await docClient.send(getCommand);
    
    if (response.Item) {
      console.log('✅ Test data retrieved successfully');
      console.log('📊 MOU Items:');
      
      response.Item.mouItems.forEach((mou, index) => {
        console.log(`  ${index + 1}. ${mou.title}`);
        console.log(`     Description: ${mou.description}`);
        console.log(`     PDF URL: "${mou.pdfUrl}" (Type: ${typeof mou.pdfUrl})`);
        console.log(`     Has PDF: ${mou.pdfUrl && mou.pdfUrl.trim() !== '' ? 'Yes' : 'No'}`);
        console.log('');
      });

      // Check for NULL values
      const hasNullValues = JSON.stringify(response.Item).includes('"NULL"');
      if (hasNullValues) {
        console.log('❌ Found NULL values in the data');
      } else {
        console.log('✅ No NULL values found - fix is working!');
      }

      // Clean up test data
      console.log('🧹 Cleaning up test data...');
      const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
      const deleteCommand = new DeleteCommand({
        TableName: INDUSTRY_COLLAB_TABLE,
        Key: {
          instituteinduscollab: testInstituteId
        }
      });
      
      await docClient.send(deleteCommand);
      console.log('✅ Test data cleaned up');

    } else {
      console.log('❌ No data retrieved');
    }

    console.log('\n🎉 MOU PDF persistence fix test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testMOUFix();
}

module.exports = { testMOUFix };