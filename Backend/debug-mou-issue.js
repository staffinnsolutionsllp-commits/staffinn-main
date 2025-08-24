/**
 * Debug script to identify MOU persistence issue
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const awsConfig = require('./config/aws');

const dynamoClient = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const INDUSTRY_COLLAB_TABLE = 'institute-industrycollab-section';

const debugMOUIssue = async () => {
  try {
    console.log('🔍 Debugging MOU persistence issue...\n');

    // Test 1: Check if table exists and is accessible
    console.log('1. Testing table access...');
    const testInstituteId = 'test-institute-123';
    
    try {
      const getCommand = new GetCommand({
        TableName: INDUSTRY_COLLAB_TABLE,
        Key: { instituteinduscollab: testInstituteId }
      });
      
      const response = await docClient.send(getCommand);
      console.log('✅ Table is accessible');
      console.log('   Current data:', response.Item ? 'Found existing data' : 'No existing data');
    } catch (error) {
      console.log('❌ Table access failed:', error.message);
      return;
    }

    // Test 2: Try to write test data
    console.log('\n2. Testing data write...');
    const testData = {
      instituteinduscollab: testInstituteId,
      instituteName: 'Test Institute',
      collaborationCards: [],
      mouItems: [
        {
          title: 'Test MOU',
          description: 'Test MOU Description',
          pdfUrl: 'https://example.com/test.pdf'
        }
      ],
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    try {
      const putCommand = new PutCommand({
        TableName: INDUSTRY_COLLAB_TABLE,
        Item: testData
      });
      
      await docClient.send(putCommand);
      console.log('✅ Test data written successfully');
    } catch (error) {
      console.log('❌ Data write failed:', error.message);
      return;
    }

    // Test 3: Verify data was written
    console.log('\n3. Verifying data persistence...');
    try {
      const getCommand = new GetCommand({
        TableName: INDUSTRY_COLLAB_TABLE,
        Key: { instituteinduscollab: testInstituteId }
      });
      
      const response = await docClient.send(getCommand);
      if (response.Item) {
        console.log('✅ Data persisted successfully');
        console.log('   MOU items count:', response.Item.mouItems?.length || 0);
        console.log('   First MOU title:', response.Item.mouItems?.[0]?.title || 'None');
        console.log('   First MOU PDF URL:', response.Item.mouItems?.[0]?.pdfUrl || 'None');
      } else {
        console.log('❌ Data not found after write');
      }
    } catch (error) {
      console.log('❌ Data verification failed:', error.message);
    }

    console.log('\n🎯 Debug complete. If all tests pass, the issue is in the application logic, not the database.');

  } catch (error) {
    console.error('Debug script failed:', error);
  }
};

if (require.main === module) {
  debugMOUIssue();
}

module.exports = { debugMOUIssue };