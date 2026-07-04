const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS with proper error handling
try {
    AWS.config.update({
        region: process.env.AWS_REGION || 'ap-south-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    console.log('AWS configured with region:', process.env.AWS_REGION || 'ap-south-1');
} catch (error) {
    console.error('AWS configuration error:', error);
}

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'recruiter-news';

// Mock database fallback
let useMockDB = false;
let mockDatabase = null;

const initializeMockDB = () => {
    if (!mockDatabase) {
        mockDatabase = require('../mock-dynamodb');
        mockDatabase.createTable(TABLE_NAME);
    }
    return mockDatabase;
};

const shouldUseMockDB = () => {
    // Force use of real DynamoDB if credentials are available
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && !process.env.USE_MOCK_DB) {
        return false;
    }
    return useMockDB || process.env.USE_MOCK_DB === 'true';
};

const RecruiterNewsModel = {
    // Create news
    create: async (newsData) => {
        try {
            const recruiterNewsID = uuidv4();
            const timestamp = new Date().toISOString();
            
            const item = {
                recruiterNewsID,
                recruiterId: newsData.recruiterId,
                recruiterName: newsData.recruiterName || 'Unknown Recruiter',
                title: newsData.title,
                date: newsData.date,
                company: newsData.company,
                venue: newsData.venue || null,
                expectedParticipants: newsData.expectedParticipants || null,
                details: newsData.details,
                type: 'News',
                verified: newsData.verified || false,
                bannerImage: newsData.bannerImage || null,
                isVisible: true, // Default to visible
                createdAt: timestamp,
                updatedAt: timestamp
            };

            console.log('Creating news item with data:', {
                recruiterNewsID,
                recruiterId: newsData.recruiterId,
                recruiterName: newsData.recruiterName,
                title: newsData.title,
                company: newsData.company
            });

            // Try DynamoDB first, fall back to mock on error
            try {
                if (shouldUseMockDB()) {
                    throw new Error('Using mock database');
                }
                
                const params = {
                    TableName: TABLE_NAME,
                    Item: item
                };

                await dynamodb.put(params).promise();
                return { success: true, data: item };
            } catch (dbError) {
                console.log('DynamoDB failed, using mock database:', dbError.message);
                useMockDB = true;
                const mockDB = initializeMockDB();
                mockDB.putItem(TABLE_NAME, item);
                return { success: true, data: item };
            }
        } catch (error) {
            console.error('Error creating recruiter news:', error);
            return { success: false, message: 'Failed to create news' };
        }
    },

    // Get all news for a recruiter
    getByRecruiterId: async (recruiterId) => {
        try {
            if (!recruiterId) {
                return { success: true, data: [] };
            }

            // Try DynamoDB first, fall back to mock on error
            try {
                if (shouldUseMockDB()) {
                    throw new Error('Using mock database');
                }
                
                const params = {
                    TableName: TABLE_NAME,
                    FilterExpression: 'recruiterId = :recruiterId',
                    ExpressionAttributeValues: {
                        ':recruiterId': recruiterId
                    }
                };

                const result = await dynamodb.scan(params).promise();
                return { success: true, data: result.Items || [] };
            } catch (dbError) {
                console.log('DynamoDB failed, using mock database:', dbError.message);
                useMockDB = true;
                const mockDB = initializeMockDB();
                const allNews = mockDB.scan(TABLE_NAME);
                const recruiterNews = allNews.filter(news => news.recruiterId === recruiterId);
                return { success: true, data: recruiterNews };
            }
        } catch (error) {
            console.error('Error getting recruiter news:', error);
            return { success: false, message: 'Failed to get news' };
        }
    },

    // Get news by ID
    getById: async (recruiterNewsID) => {
        try {
            // Try DynamoDB first, fall back to mock on error
            try {
                if (shouldUseMockDB()) {
                    throw new Error('Using mock database');
                }
                
                const params = {
                    TableName: TABLE_NAME,
                    Key: { recruiterNewsID }
                };

                const result = await dynamodb.get(params).promise();
                if (!result.Item) {
                    return { success: false, message: 'News not found' };
                }

                return { success: true, data: result.Item };
            } catch (dbError) {
                console.log('DynamoDB failed, using mock database:', dbError.message);
                useMockDB = true;
                const mockDB = initializeMockDB();
                const item = mockDB.getItem(TABLE_NAME, recruiterNewsID);
                if (!item) {
                    return { success: false, message: 'News not found' };
                }
                return { success: true, data: item };
            }
        } catch (error) {
            console.error('Error getting news by ID:', error);
            return { success: false, message: 'Failed to get news' };
        }
    },

    // Update news
    update: async (recruiterNewsID, updateData) => {
        try {
            console.log('Updating news with ID:', recruiterNewsID);
            console.log('Update data:', updateData);
            const timestamp = new Date().toISOString();
            
            // Try DynamoDB first, fall back to mock on error
            try {
                if (shouldUseMockDB()) {
                    throw new Error('Forced to use mock database');
                }
                
                // First check if the item exists
                const checkParams = {
                    TableName: TABLE_NAME,
                    Key: { recruiterNewsID }
                };
                
                console.log('Checking if news exists with params:', checkParams);
                const existingItem = await dynamodb.get(checkParams).promise();
                console.log('Existing item check result:', existingItem);
                
                if (!existingItem.Item) {
                    console.log('News item not found in DynamoDB');
                    return { success: false, message: 'News not found' };
                }
                
                // Build update expression dynamically
                let updateExpression = 'SET updatedAt = :updatedAt';
                let expressionAttributeValues = {
                    ':updatedAt': timestamp
                };
                let expressionAttributeNames = {};

                // Add fields to update
                const fieldsToUpdate = ['title', 'date', 'company', 'venue', 'expectedParticipants', 'details', 'verified', 'bannerImage', 'recruiterName', 'isVisible'];
                
                fieldsToUpdate.forEach(field => {
                    if (updateData.hasOwnProperty(field)) {
                        if (field === 'date') {
                            // Handle reserved keyword 'date'
                            updateExpression += `, #dateField = :${field}`;
                            expressionAttributeNames['#dateField'] = 'date';
                        } else {
                            updateExpression += `, ${field} = :${field}`;
                        }
                        expressionAttributeValues[`:${field}`] = updateData[field];
                    }
                });

                const updateParams = {
                    TableName: TABLE_NAME,
                    Key: { recruiterNewsID },
                    UpdateExpression: updateExpression,
                    ExpressionAttributeValues: expressionAttributeValues,
                    ReturnValues: 'ALL_NEW'
                };
                
                // Only add ExpressionAttributeNames if we have reserved keywords
                if (Object.keys(expressionAttributeNames).length > 0) {
                    updateParams.ExpressionAttributeNames = expressionAttributeNames;
                }
                
                console.log('Update params:', updateParams);
                const result = await dynamodb.update(updateParams).promise();
                console.log('DynamoDB update result:', result);
                return { success: true, data: result.Attributes };
            } catch (dbError) {
                console.log('DynamoDB failed, using mock database:', dbError.message);
                console.error('DynamoDB error details:', dbError);
                useMockDB = true;
                const mockDB = initializeMockDB();
                const updates = { ...updateData, updatedAt: timestamp };
                const updatedItem = mockDB.updateItem(TABLE_NAME, recruiterNewsID, updates);
                if (!updatedItem) {
                    return { success: false, message: 'News not found in mock database' };
                }
                return { success: true, data: updatedItem };
            }
        } catch (error) {
            console.error('Error updating recruiter news:', error);
            return { success: false, message: 'Failed to update news' };
        }
    },

    // Delete news
    delete: async (recruiterNewsID) => {
        try {
            // Try DynamoDB first, fall back to mock on error
            try {
                if (shouldUseMockDB()) {
                    throw new Error('Using mock database');
                }
                
                const params = {
                    TableName: TABLE_NAME,
                    Key: { recruiterNewsID }
                };

                await dynamodb.delete(params).promise();
                return { success: true, message: 'News deleted successfully' };
            } catch (dbError) {
                console.log('DynamoDB failed, using mock database:', dbError.message);
                useMockDB = true;
                const mockDB = initializeMockDB();
                mockDB.deleteItem(TABLE_NAME, recruiterNewsID);
                return { success: true, message: 'News deleted successfully' };
            }
        } catch (error) {
            console.error('Error deleting recruiter news:', error);
            return { success: false, message: 'Failed to delete news' };
        }
    },

    // Get public news for a recruiter (for public viewing)
    getPublicByRecruiterId: async (recruiterId) => {
        try {
            if (!recruiterId) {
                return { success: true, data: [] };
            }

            // Try DynamoDB first, fall back to mock on error
            try {
                if (shouldUseMockDB()) {
                    throw new Error('Using mock database');
                }
                
                const params = {
                    TableName: TABLE_NAME,
                    FilterExpression: 'recruiterId = :recruiterId',
                    ExpressionAttributeValues: {
                        ':recruiterId': recruiterId
                    }
                };

                const result = await dynamodb.scan(params).promise();
                
                // Sort by date (newest first)
                const sortedNews = (result.Items || []).sort((a, b) => new Date(b.date) - new Date(a.date));
                
                return { success: true, data: sortedNews };
            } catch (dbError) {
                console.log('DynamoDB failed, using mock database:', dbError.message);
                useMockDB = true;
                const mockDB = initializeMockDB();
                const allNews = mockDB.scan(TABLE_NAME);
                const recruiterNews = allNews.filter(news => news.recruiterId === recruiterId);
                const sortedNews = recruiterNews.sort((a, b) => new Date(b.date) - new Date(a.date));
                return { success: true, data: sortedNews };
            }
        } catch (error) {
            console.error('Error getting public recruiter news:', error);
            return { success: false, message: 'Failed to get news' };
        }
    },

    // Get all public recruiter news (for news page) - only visible ones
    getAllPublic: async () => {
        try {
            // Try DynamoDB first, fall back to mock on error
            try {
                if (shouldUseMockDB()) {
                    throw new Error('Using mock database');
                }
                
                const params = {
                    TableName: TABLE_NAME,
                    FilterExpression: 'isVisible = :visible',
                    ExpressionAttributeValues: {
                        ':visible': true
                    }
                };

                const result = await dynamodb.scan(params).promise();
                
                // Sort by date (newest first)
                const sortedNews = (result.Items || []).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
                
                return { success: true, data: sortedNews };
            } catch (dbError) {
                console.log('DynamoDB failed, using mock database:', dbError.message);
                useMockDB = true;
                const mockDB = initializeMockDB();
                const allNews = mockDB.scan(TABLE_NAME);
                const visibleNews = allNews.filter(news => news.isVisible !== false);
                const sortedNews = visibleNews.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
                return { success: true, data: sortedNews };
            }
        } catch (error) {
            console.error('Error getting all public recruiter news:', error);
            return { success: false, message: 'Failed to get news' };
        }
    },

    // Get all recruiter news for admin panel (including hidden ones)
    getAll: async () => {
        try {
            // Try DynamoDB first, fall back to mock on error
            try {
                if (shouldUseMockDB()) {
                    throw new Error('Using mock database');
                }
                
                const params = {
                    TableName: TABLE_NAME
                };

                const result = await dynamodb.scan(params).promise();
                
                // Sort by date (newest first)
                const sortedNews = (result.Items || []).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
                
                return { success: true, data: sortedNews };
            } catch (dbError) {
                console.log('DynamoDB failed, using mock database:', dbError.message);
                useMockDB = true;
                const mockDB = initializeMockDB();
                const allNews = mockDB.scan(TABLE_NAME);
                const sortedNews = allNews.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
                return { success: true, data: sortedNews };
            }
        } catch (error) {
            console.error('Error getting all recruiter news:', error);
            return { success: false, message: 'Failed to get news' };
        }
    },

    // Toggle visibility
    toggleVisibility: async (recruiterNewsID) => {
        try {
            // First get the current item
            const currentItem = await RecruiterNewsModel.getById(recruiterNewsID);
            if (!currentItem.success) {
                return currentItem;
            }

            const newVisibility = !currentItem.data.isVisible;
            const updateResult = await RecruiterNewsModel.update(recruiterNewsID, { isVisible: newVisibility });
            
            if (updateResult.success) {
                return { success: true, data: { ...updateResult.data, isVisible: newVisibility } };
            }
            return updateResult;
        } catch (error) {
            console.error('Error toggling recruiter news visibility:', error);
            return { success: false, message: 'Failed to toggle visibility' };
        }
    }
};

module.exports = RecruiterNewsModel;