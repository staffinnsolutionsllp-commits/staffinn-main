/**
 * News Admin Model
 * Handles CRUD operations for News Admin Panel data
 */

const { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand, UpdateItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { v4: uuidv4 } = require('uuid');
const awsConfig = require('../config/aws');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient(awsConfig);

// Table names
const HERO_SECTIONS_TABLE = 'staffinn-news-hero-sections';
const TRENDING_TOPICS_TABLE = 'staffinn-news-trending-topics';
const EXPERT_INSIGHTS_TABLE = 'staffinn-news-expert-insights';
const POSTED_NEWS_TABLE = 'staffinn-posted-news';

/**
 * Hero Sections Model
 */
class HeroSectionsModel {
  static async create(heroData) {
    try {
      const heroId = uuidv4();
      const timestamp = new Date().toISOString();
      
      const item = {
        newsherosection: heroId,
        title: heroData.title,
        content: heroData.content,
        tags: heroData.tags,
        bannerImageUrl: heroData.bannerImageUrl || null,
        createdAt: timestamp,
        updatedAt: timestamp,
        isActive: true,
        sortOrder: Date.now()
      };

      const command = new PutItemCommand({
        TableName: HERO_SECTIONS_TABLE,
        Item: marshall(item)
      });

      await dynamoClient.send(command);
      return { success: true, data: item };
    } catch (error) {
      console.error('Error creating hero section:', error);
      throw error;
    }
  }

  static async getLatest() {
    try {
      const command = new ScanCommand({
        TableName: HERO_SECTIONS_TABLE,
        FilterExpression: 'isActive = :active',
        ExpressionAttributeValues: marshall({
          ':active': true
        })
      });

      const response = await dynamoClient.send(command);
      const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
      
      // Sort by createdAt descending and return the latest active one
      const sortedItems = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return sortedItems.length > 0 ? sortedItems[0] : null;
    } catch (error) {
      console.error('Error getting latest hero section:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const command = new ScanCommand({
        TableName: HERO_SECTIONS_TABLE
      });

      const response = await dynamoClient.send(command);
      const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
      
      // Sort by createdAt descending
      return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting all hero sections:', error);
      throw error;
    }
  }

  static async update(heroId, updateData) {
    try {
      const timestamp = new Date().toISOString();
      
      const command = new UpdateItemCommand({
        TableName: HERO_SECTIONS_TABLE,
        Key: marshall({ newsherosection: heroId }),
        UpdateExpression: 'SET title = :title, content = :content, tags = :tags, bannerImageUrl = :banner, updatedAt = :updated',
        ExpressionAttributeValues: marshall({
          ':title': updateData.title,
          ':content': updateData.content,
          ':tags': updateData.tags,
          ':banner': updateData.bannerImageUrl || null,
          ':updated': timestamp
        }),
        ReturnValues: 'ALL_NEW'
      });

      const response = await dynamoClient.send(command);
      return { success: true, data: unmarshall(response.Attributes) };
    } catch (error) {
      console.error('Error updating hero section:', error);
      throw error;
    }
  }

  static async toggleVisibility(heroId) {
    try {
      // First get the current item
      const getCommand = new GetItemCommand({
        TableName: HERO_SECTIONS_TABLE,
        Key: marshall({ newsherosection: heroId })
      });

      const getResponse = await dynamoClient.send(getCommand);
      if (!getResponse.Item) {
        throw new Error('Hero section not found');
      }

      const currentItem = unmarshall(getResponse.Item);
      const newVisibility = !currentItem.isActive;

      const updateCommand = new UpdateItemCommand({
        TableName: HERO_SECTIONS_TABLE,
        Key: marshall({ newsherosection: heroId }),
        UpdateExpression: 'SET isActive = :active, updatedAt = :updated',
        ExpressionAttributeValues: marshall({
          ':active': newVisibility,
          ':updated': new Date().toISOString()
        }),
        ReturnValues: 'ALL_NEW'
      });

      const response = await dynamoClient.send(updateCommand);
      return { success: true, data: unmarshall(response.Attributes) };
    } catch (error) {
      console.error('Error toggling hero section visibility:', error);
      throw error;
    }
  }

  static async delete(heroId) {
    try {
      const command = new DeleteItemCommand({
        TableName: HERO_SECTIONS_TABLE,
        Key: marshall({ newsherosection: heroId })
      });

      await dynamoClient.send(command);
      return { success: true };
    } catch (error) {
      console.error('Error deleting hero section:', error);
      throw error;
    }
  }
}

/**
 * Trending Topics Model
 */
class TrendingTopicsModel {
  static async create(topicData) {
    try {
      const topicId = uuidv4();
      const timestamp = new Date().toISOString();
      
      const item = {
        newstrendingtopics: topicId,
        title: topicData.title,
        description: topicData.description,
        imageUrl: topicData.imageUrl || null,
        createdAt: timestamp,
        updatedAt: timestamp,
        isVisible: true,
        sortOrder: Date.now()
      };

      const command = new PutItemCommand({
        TableName: TRENDING_TOPICS_TABLE,
        Item: marshall(item)
      });

      await dynamoClient.send(command);
      return { success: true, data: item };
    } catch (error) {
      console.error('Error creating trending topic:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const command = new ScanCommand({
        TableName: TRENDING_TOPICS_TABLE
      });

      const response = await dynamoClient.send(command);
      const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
      
      // Sort by createdAt descending
      return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting all trending topics:', error);
      throw error;
    }
  }

  static async getVisible() {
    try {
      const command = new ScanCommand({
        TableName: TRENDING_TOPICS_TABLE,
        FilterExpression: 'isVisible = :visible',
        ExpressionAttributeValues: marshall({
          ':visible': true
        })
      });

      const response = await dynamoClient.send(command);
      const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
      
      // Sort by createdAt descending and limit to 15
      const sortedItems = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return sortedItems.slice(0, 15);
    } catch (error) {
      console.error('Error getting visible trending topics:', error);
      throw error;
    }
  }

  static async update(topicId, updateData) {
    try {
      const timestamp = new Date().toISOString();
      
      const command = new UpdateItemCommand({
        TableName: TRENDING_TOPICS_TABLE,
        Key: marshall({ newstrendingtopics: topicId }),
        UpdateExpression: 'SET title = :title, description = :description, imageUrl = :image, updatedAt = :updated',
        ExpressionAttributeValues: marshall({
          ':title': updateData.title,
          ':description': updateData.description,
          ':image': updateData.imageUrl || null,
          ':updated': timestamp
        }),
        ReturnValues: 'ALL_NEW'
      });

      const response = await dynamoClient.send(command);
      return { success: true, data: unmarshall(response.Attributes) };
    } catch (error) {
      console.error('Error updating trending topic:', error);
      throw error;
    }
  }

  static async toggleVisibility(topicId) {
    try {
      // First get the current item
      const getCommand = new GetItemCommand({
        TableName: TRENDING_TOPICS_TABLE,
        Key: marshall({ newstrendingtopics: topicId })
      });

      const getResponse = await dynamoClient.send(getCommand);
      if (!getResponse.Item) {
        throw new Error('Topic not found');
      }

      const currentItem = unmarshall(getResponse.Item);
      const newVisibility = !currentItem.isVisible;

      const updateCommand = new UpdateItemCommand({
        TableName: TRENDING_TOPICS_TABLE,
        Key: marshall({ newstrendingtopics: topicId }),
        UpdateExpression: 'SET isVisible = :visible, updatedAt = :updated',
        ExpressionAttributeValues: marshall({
          ':visible': newVisibility,
          ':updated': new Date().toISOString()
        }),
        ReturnValues: 'ALL_NEW'
      });

      const response = await dynamoClient.send(updateCommand);
      return { success: true, data: unmarshall(response.Attributes) };
    } catch (error) {
      console.error('Error toggling topic visibility:', error);
      throw error;
    }
  }

  static async delete(topicId) {
    try {
      const command = new DeleteItemCommand({
        TableName: TRENDING_TOPICS_TABLE,
        Key: marshall({ newstrendingtopics: topicId })
      });

      await dynamoClient.send(command);
      return { success: true };
    } catch (error) {
      console.error('Error deleting trending topic:', error);
      throw error;
    }
  }
}

/**
 * Expert Insights Model
 */
class ExpertInsightsModel {
  static async create(insightData) {
    try {
      const insightId = uuidv4();
      const timestamp = new Date().toISOString();
      
      const item = {
        newsexpertinsights: insightId,
        title: insightData.title,
        expertName: insightData.name,
        designation: insightData.designation,
        videoUrl: insightData.videoUrl || null,
        thumbnailUrl: insightData.thumbnailUrl || null,
        createdAt: timestamp,
        updatedAt: timestamp,
        isVisible: true,
        sortOrder: Date.now()
      };

      const command = new PutItemCommand({
        TableName: EXPERT_INSIGHTS_TABLE,
        Item: marshall(item)
      });

      await dynamoClient.send(command);
      return { success: true, data: item };
    } catch (error) {
      console.error('Error creating expert insight:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const command = new ScanCommand({
        TableName: EXPERT_INSIGHTS_TABLE
      });

      const response = await dynamoClient.send(command);
      const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
      
      // Sort by createdAt descending
      return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting all expert insights:', error);
      throw error;
    }
  }

  static async getVisible() {
    try {
      const command = new ScanCommand({
        TableName: EXPERT_INSIGHTS_TABLE,
        FilterExpression: 'isVisible = :visible',
        ExpressionAttributeValues: marshall({
          ':visible': true
        })
      });

      const response = await dynamoClient.send(command);
      const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
      
      // Sort by createdAt descending
      return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting visible expert insights:', error);
      throw error;
    }
  }

  static async update(insightId, updateData) {
    try {
      const timestamp = new Date().toISOString();
      
      const command = new UpdateItemCommand({
        TableName: EXPERT_INSIGHTS_TABLE,
        Key: marshall({ newsexpertinsights: insightId }),
        UpdateExpression: 'SET title = :title, expertName = :name, designation = :designation, videoUrl = :video, thumbnailUrl = :thumbnail, updatedAt = :updated',
        ExpressionAttributeValues: marshall({
          ':title': updateData.title,
          ':name': updateData.name,
          ':designation': updateData.designation,
          ':video': updateData.videoUrl || null,
          ':thumbnail': updateData.thumbnailUrl || null,
          ':updated': timestamp
        }),
        ReturnValues: 'ALL_NEW'
      });

      const response = await dynamoClient.send(command);
      return { success: true, data: unmarshall(response.Attributes) };
    } catch (error) {
      console.error('Error updating expert insight:', error);
      throw error;
    }
  }

  static async toggleVisibility(insightId) {
    try {
      // First get the current item
      const getCommand = new GetItemCommand({
        TableName: EXPERT_INSIGHTS_TABLE,
        Key: marshall({ newsexpertinsights: insightId })
      });

      const getResponse = await dynamoClient.send(getCommand);
      if (!getResponse.Item) {
        throw new Error('Insight not found');
      }

      const currentItem = unmarshall(getResponse.Item);
      const newVisibility = !currentItem.isVisible;

      const updateCommand = new UpdateItemCommand({
        TableName: EXPERT_INSIGHTS_TABLE,
        Key: marshall({ newsexpertinsights: insightId }),
        UpdateExpression: 'SET isVisible = :visible, updatedAt = :updated',
        ExpressionAttributeValues: marshall({
          ':visible': newVisibility,
          ':updated': new Date().toISOString()
        }),
        ReturnValues: 'ALL_NEW'
      });

      const response = await dynamoClient.send(updateCommand);
      return { success: true, data: unmarshall(response.Attributes) };
    } catch (error) {
      console.error('Error toggling insight visibility:', error);
      throw error;
    }
  }

  static async delete(insightId) {
    try {
      const command = new DeleteItemCommand({
        TableName: EXPERT_INSIGHTS_TABLE,
        Key: marshall({ newsexpertinsights: insightId })
      });

      await dynamoClient.send(command);
      return { success: true };
    } catch (error) {
      console.error('Error deleting expert insight:', error);
      throw error;
    }
  }
}

/**
 * Posted News Model
 */
class PostedNewsModel {
  static async create(newsData) {
    try {
      const newsId = uuidv4();
      const timestamp = new Date().toISOString();
      
      const item = {
        staffinnpostednews: newsId,
        title: newsData.title,
        description: newsData.description,
        bannerImageUrl: newsData.bannerImageUrl || null,
        createdAt: timestamp,
        updatedAt: timestamp,
        isVisible: true,
        sortOrder: Date.now()
      };

      const command = new PutItemCommand({
        TableName: POSTED_NEWS_TABLE,
        Item: marshall(item)
      });

      await dynamoClient.send(command);
      return { success: true, data: item };
    } catch (error) {
      console.error('Error creating posted news:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const command = new ScanCommand({
        TableName: POSTED_NEWS_TABLE
      });

      const response = await dynamoClient.send(command);
      const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
      
      return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting all posted news:', error);
      throw error;
    }
  }

  static async getVisible() {
    try {
      const command = new ScanCommand({
        TableName: POSTED_NEWS_TABLE,
        FilterExpression: 'isVisible = :visible',
        ExpressionAttributeValues: marshall({
          ':visible': true
        })
      });

      const response = await dynamoClient.send(command);
      const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
      
      return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting visible posted news:', error);
      throw error;
    }
  }

  static async update(newsId, updateData) {
    try {
      const timestamp = new Date().toISOString();
      
      const command = new UpdateItemCommand({
        TableName: POSTED_NEWS_TABLE,
        Key: marshall({ staffinnpostednews: newsId }),
        UpdateExpression: 'SET title = :title, description = :description, bannerImageUrl = :banner, updatedAt = :updated',
        ExpressionAttributeValues: marshall({
          ':title': updateData.title,
          ':description': updateData.description,
          ':banner': updateData.bannerImageUrl || null,
          ':updated': timestamp
        }),
        ReturnValues: 'ALL_NEW'
      });

      const response = await dynamoClient.send(command);
      return { success: true, data: unmarshall(response.Attributes) };
    } catch (error) {
      console.error('Error updating posted news:', error);
      throw error;
    }
  }

  static async toggleVisibility(newsId) {
    try {
      const getCommand = new GetItemCommand({
        TableName: POSTED_NEWS_TABLE,
        Key: marshall({ staffinnpostednews: newsId })
      });

      const getResponse = await dynamoClient.send(getCommand);
      if (!getResponse.Item) {
        throw new Error('Posted news not found');
      }

      const currentItem = unmarshall(getResponse.Item);
      const newVisibility = !currentItem.isVisible;

      const updateCommand = new UpdateItemCommand({
        TableName: POSTED_NEWS_TABLE,
        Key: marshall({ staffinnpostednews: newsId }),
        UpdateExpression: 'SET isVisible = :visible, updatedAt = :updated',
        ExpressionAttributeValues: marshall({
          ':visible': newVisibility,
          ':updated': new Date().toISOString()
        }),
        ReturnValues: 'ALL_NEW'
      });

      const response = await dynamoClient.send(updateCommand);
      return { success: true, data: unmarshall(response.Attributes) };
    } catch (error) {
      console.error('Error toggling posted news visibility:', error);
      throw error;
    }
  }

  static async delete(newsId) {
    try {
      const command = new DeleteItemCommand({
        TableName: POSTED_NEWS_TABLE,
        Key: marshall({ staffinnpostednews: newsId })
      });

      await dynamoClient.send(command);
      return { success: true };
    } catch (error) {
      console.error('Error deleting posted news:', error);
      throw error;
    }
  }
}

module.exports = {
  HeroSectionsModel,
  TrendingTopicsModel,
  ExpertInsightsModel,
  PostedNewsModel
};