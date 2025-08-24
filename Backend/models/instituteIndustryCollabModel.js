/**
 * Institute Industry Collaboration Model
 * Handles database operations for institute industry collaborations
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const awsConfig = require('../config/aws');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Table name
const INDUSTRY_COLLAB_TABLE = 'institute-industrycollab-section';

/**
 * Create or update industry collaboration section
 * @param {string} instituteId - Institute ID
 * @param {string} instituteName - Institute name
 * @param {Object} collabData - Collaboration data
 * @returns {Promise<Object>} - Created/updated collaboration data
 */
const createOrUpdateIndustryCollabSection = async (instituteId, instituteName, collabData) => {
  try {
    console.log('Creating/updating industry collaboration section for institute:', instituteId);
    console.log('Collaboration data:', collabData);

    const timestamp = new Date().toISOString();
    
    // Prepare the collaboration data with proper URL validation
    const collaborationSection = {
      instituteinduscollab: instituteId, // Partition key as specified
      instituteName: instituteName,
      collaborationCards: (collabData.collaborationCards || []).map(card => ({
        title: card.title || '',
        company: card.company || '',
        type: card.type || '',
        description: card.description || '',
        image: card.image && typeof card.image === 'string' && card.image.trim() !== '' ? card.image : null
      })),
      mouItems: (collabData.mouItems || []).map(mou => ({
        title: mou.title || '',
        description: mou.description || '',
        pdfUrl: mou.pdfUrl && typeof mou.pdfUrl === 'string' && mou.pdfUrl.trim() !== '' ? mou.pdfUrl : ''
      })),
      lastUpdated: timestamp,
      createdAt: timestamp
    };
    
    console.log('💾 Saving to DynamoDB:', {
      instituteId,
      collaborationCards: collaborationSection.collaborationCards.length,
      mouItems: collaborationSection.mouItems.length,
      mouItemsWithPdfs: collaborationSection.mouItems.filter(mou => mou.pdfUrl && mou.pdfUrl.trim() !== '').length,
      mouDetails: collaborationSection.mouItems.map(mou => ({
        title: mou.title,
        hasPdf: !!(mou.pdfUrl && mou.pdfUrl.trim() !== '')
      }))
    });

    // Check if record exists
    const existingRecord = await getIndustryCollabSectionByInstituteId(instituteId);
    
    console.log('Existing record check:', {
      hasExisting: !!existingRecord,
      existingMouItems: existingRecord?.mouItems?.length || 0
    });
    
    if (existingRecord) {
      // Update existing record
      collaborationSection.createdAt = existingRecord.createdAt;
      
      console.log('About to update DynamoDB with:', {
        instituteId,
        collaborationCards: collaborationSection.collaborationCards.length,
        mouItems: collaborationSection.mouItems.length,
        mouItemsWithPdfs: collaborationSection.mouItems.filter(mou => mou.pdfUrl).length
      });
      
      const updateCommand = new PutCommand({
        TableName: INDUSTRY_COLLAB_TABLE,
        Item: collaborationSection
      });
      
      await docClient.send(updateCommand);
      console.log('Industry collaboration section updated successfully in DynamoDB');
    } else {
      // Create new record
      console.log('About to create new DynamoDB record with:', {
        instituteId,
        collaborationCards: collaborationSection.collaborationCards.length,
        mouItems: collaborationSection.mouItems.length,
        mouItemsWithPdfs: collaborationSection.mouItems.filter(mou => mou.pdfUrl).length
      });
      
      const createCommand = new PutCommand({
        TableName: INDUSTRY_COLLAB_TABLE,
        Item: collaborationSection
      });
      
      await docClient.send(createCommand);
      console.log('Industry collaboration section created successfully in DynamoDB');
    }

    // Verify the data was saved by reading it back
    const savedRecord = await getIndustryCollabSectionByInstituteId(instituteId);
    console.log('Verification - data saved to DynamoDB:', {
      hasRecord: !!savedRecord,
      collaborationCards: savedRecord?.collaborationCards?.length || 0,
      mouItems: savedRecord?.mouItems?.length || 0,
      mouItemsWithPdfs: savedRecord?.mouItems?.filter(mou => mou.pdfUrl)?.length || 0
    });
    
    return collaborationSection;
  } catch (error) {
    console.error('Error creating/updating industry collaboration section:', error);
    throw error;
  }
};

/**
 * Get industry collaboration section by institute ID
 * @param {string} instituteId - Institute ID
 * @returns {Promise<Object|null>} - Collaboration section data or null
 */
const getIndustryCollabSectionByInstituteId = async (instituteId) => {
  try {
    console.log('Getting industry collaboration section for institute:', instituteId);

    const command = new GetCommand({
      TableName: INDUSTRY_COLLAB_TABLE,
      Key: {
        instituteinduscollab: instituteId
      }
    });

    const response = await docClient.send(command);
    console.log('Retrieved industry collaboration section:', {
      hasData: !!response.Item,
      collaborationCards: response.Item?.collaborationCards?.length || 0,
      mouItems: response.Item?.mouItems?.length || 0,
      mouItemsWithPdfs: response.Item?.mouItems?.filter(mou => mou.pdfUrl && mou.pdfUrl.trim() !== '')?.length || 0
    });

    return response.Item || null;
  } catch (error) {
    console.error('Error getting industry collaboration section:', error);
    throw error;
  }
};

/**
 * Delete industry collaboration section
 * @param {string} instituteId - Institute ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteIndustryCollabSection = async (instituteId) => {
  try {
    console.log('Deleting industry collaboration section for institute:', instituteId);

    const command = new DeleteCommand({
      TableName: INDUSTRY_COLLAB_TABLE,
      Key: {
        instituteinduscollab: instituteId
      }
    });

    await docClient.send(command);
    console.log('Industry collaboration section deleted successfully');

    return true;
  } catch (error) {
    console.error('Error deleting industry collaboration section:', error);
    throw error;
  }
};

/**
 * Get all industry collaboration sections (for admin purposes)
 * @returns {Promise<Array>} - Array of all collaboration sections
 */
const getAllIndustryCollabSections = async () => {
  try {
    console.log('Getting all industry collaboration sections');

    const command = new ScanCommand({
      TableName: INDUSTRY_COLLAB_TABLE
    });

    const response = await docClient.send(command);
    console.log('Retrieved all industry collaboration sections:', response.Items?.length || 0);

    return response.Items || [];
  } catch (error) {
    console.error('Error getting all industry collaboration sections:', error);
    throw error;
  }
};

module.exports = {
  createOrUpdateIndustryCollabSection,
  getIndustryCollabSectionByInstituteId,
  deleteIndustryCollabSection,
  getAllIndustryCollabSections,
  INDUSTRY_COLLAB_TABLE
};