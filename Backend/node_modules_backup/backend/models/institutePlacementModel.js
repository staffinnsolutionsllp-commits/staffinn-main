/**
 * Institute Placement Model
 * Handles placement section data for institutes
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'Institute-placement-section';

const institutePlacementModel = {
  /**
   * Create or update placement section data
   */
  createOrUpdatePlacementSection: async (instituteId, instituteName, placementData) => {
    try {
      const timestamp = new Date().toISOString();
      
      // Ensure data is properly formatted for DynamoDB
      const item = {
        instituteplacement: `${instituteName}-${instituteId}`,
        instituteId: instituteId,
        instituteName: instituteName,
        averageSalary: placementData.averageSalary || '',
        highestPackage: placementData.highestPackage || '',
        topHiringCompanies: (placementData.topHiringCompanies || []).map(company => ({
          name: company.name || '',
          logo: company.logo || null
        })),
        recentPlacementSuccess: (placementData.recentPlacementSuccess || []).map(student => ({
          name: student.name || '',
          company: student.company || '',
          position: student.position || '',
          photo: student.photo || null
        })),
        createdAt: timestamp,
        updatedAt: timestamp
      };

      console.log('Saving placement data to DynamoDB:', {
        instituteplacement: item.instituteplacement,
        averageSalary: item.averageSalary,
        highestPackage: item.highestPackage,
        companiesCount: item.topHiringCompanies.length,
        studentsCount: item.recentPlacementSuccess.length
      });

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: item
      });

      await docClient.send(command);
      console.log('Placement data saved successfully to DynamoDB');
      return item;
    } catch (error) {
      console.error('Error creating/updating placement section:', error);
      throw error;
    }
  },

  /**
   * Get placement section data by institute ID
   */
  getPlacementSectionByInstituteId: async (instituteId) => {
    try {
      // We need to scan since we don't have the exact partition key
      const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
      
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'instituteId = :instituteId',
        ExpressionAttributeValues: {
          ':instituteId': instituteId
        }
      });

      const result = await docClient.send(command);
      return result.Items && result.Items.length > 0 ? result.Items[0] : null;
    } catch (error) {
      console.error('Error getting placement section:', error);
      throw error;
    }
  },

  /**
   * Get placement section data by partition key
   */
  getPlacementSectionByKey: async (partitionKey) => {
    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          instituteplacement: partitionKey
        }
      });

      const result = await docClient.send(command);
      return result.Item || null;
    } catch (error) {
      console.error('Error getting placement section by key:', error);
      throw error;
    }
  },

  /**
   * Delete placement section data
   */
  deletePlacementSection: async (partitionKey) => {
    try {
      const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          instituteplacement: partitionKey
        }
      });

      await docClient.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting placement section:', error);
      throw error;
    }
  }
};

module.exports = institutePlacementModel;