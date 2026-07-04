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

// ── 5-minute in-memory cache for read-heavy news endpoints ───────────────────
// News/trending/insights data changes only when an admin publishes something.
// Caching read results for 5 minutes eliminates the vast majority of DynamoDB
// scan RCUs without any visible impact on users.
const _cache = new Map();
const _NEWS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const _getCached = async (key, fetchFn) => {
  const cached = _cache.get(key);
  if (cached && (Date.now() - cached.time) < _NEWS_CACHE_TTL) return cached.data;
  const data = await fetchFn();
  _cache.set(key, { data, time: Date.now() });
  return data;
};

// Call this whenever admin creates/updates/deletes/toggles any news item
// so the cache is cleared immediately and the next read gets fresh data.
const _invalidateNews = () => {
  _cache.clear();
};

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
        excerpt: heroData.excerpt || null,
        author: heroData.author || null,
        authorAvatar: heroData.authorAvatar || null,
        category: heroData.category || 'Editorial',
        readTime: heroData.readTime || null,
        tags: heroData.tags || '',
        status: heroData.status || 'Published',
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
      _invalidateNews(); // clear cache so next read is fresh
      return { success: true, data: item };
    } catch (error) {
      console.error('Error creating hero section:', error);
      throw error;
    }
  }

  static async getLatest() {
    return _getCached('hero_latest', async () => {
      const command = new ScanCommand({
        TableName: HERO_SECTIONS_TABLE,
        FilterExpression: 'isActive = :active',
        ExpressionAttributeValues: marshall({ ':active': true })
      });
      const response = await dynamoClient.send(command);
      const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
      const sortedItems = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return sortedItems.length > 0 ? sortedItems[0] : null;
    });
  }

  static async getAll() {
    return _getCached('hero_all', async () => {
      const command = new ScanCommand({ TableName: HERO_SECTIONS_TABLE });
      const response = await dynamoClient.send(command);
      const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
      return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
  }

  static async update(heroId, updateData) {
    try {
      const timestamp = new Date().toISOString();
      const command = new UpdateItemCommand({
        TableName: HERO_SECTIONS_TABLE,
        Key: marshall({ newsherosection: heroId }),
        UpdateExpression: 'SET title = :title, content = :content, excerpt = :excerpt, author = :author, authorAvatar = :authorAvatar, #cat = :category, readTime = :readTime, tags = :tags, #st = :status, bannerImageUrl = :banner, updatedAt = :updated',
        ExpressionAttributeNames: {
          '#cat': 'category',
          '#st': 'status'
        },
        ExpressionAttributeValues: marshall({
          ':title': updateData.title,
          ':content': updateData.content,
          ':excerpt': updateData.excerpt || null,
          ':author': updateData.author || null,
          ':authorAvatar': updateData.authorAvatar || null,
          ':category': updateData.category || 'Editorial',
          ':readTime': updateData.readTime || null,
          ':tags': updateData.tags || '',
          ':status': updateData.status || 'Published',
          ':banner': updateData.bannerImageUrl || null,
          ':updated': timestamp
        }),
        ReturnValues: 'ALL_NEW'
      });
      const response = await dynamoClient.send(command);
      _invalidateNews();
      return { success: true, data: unmarshall(response.Attributes) };
    } catch (error) {
      console.error('Error updating hero section:', error);
      throw error;
    }
  }

  static async toggleVisibility(heroId) {
    try {
      const getCommand = new GetItemCommand({
        TableName: HERO_SECTIONS_TABLE,
        Key: marshall({ newsherosection: heroId })
      });
      const getResponse = await dynamoClient.send(getCommand);
      if (!getResponse.Item) throw new Error('Hero section not found');
      const currentItem = unmarshall(getResponse.Item);
      const updateCommand = new UpdateItemCommand({
        TableName: HERO_SECTIONS_TABLE,
        Key: marshall({ newsherosection: heroId }),
        UpdateExpression: 'SET isActive = :active, updatedAt = :updated',
        ExpressionAttributeValues: marshall({
          ':active': !currentItem.isActive,
          ':updated': new Date().toISOString()
        }),
        ReturnValues: 'ALL_NEW'
      });
      const response = await dynamoClient.send(updateCommand);
      _invalidateNews();
      return { success: true, data: unmarshall(response.Attributes) };
    } catch (error) {
      console.error('Error toggling hero section visibility:', error);
      throw error;
    }
  }

  static async delete(heroId) {
    try {
      await dynamoClient.send(new DeleteItemCommand({
        TableName: HERO_SECTIONS_TABLE,
        Key: marshall({ newsherosection: heroId })
      }));
      _invalidateNews();
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
        tags: topicData.tags || '',
        imageUrl: topicData.imageUrl || null,
        createdAt: timestamp,
        updatedAt: timestamp,
        isVisible: topicData.status === 'Published',
        sortOrder: Date.now()
      };
      await dynamoClient.send(new PutItemCommand({ TableName: TRENDING_TOPICS_TABLE, Item: marshall(item) }));
      _invalidateNews();
      return { success: true, data: item };
    } catch (error) {
      console.error('Error creating trending topic:', error);
      throw error;
    }
  }

  static async getAll() {
    return _getCached('trending_all', async () => {
      const response = await dynamoClient.send(new ScanCommand({ TableName: TRENDING_TOPICS_TABLE }));
      const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
      return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
  }

  static async getVisible() {
    return _getCached('trending_visible', async () => {
      const response = await dynamoClient.send(new ScanCommand({
        TableName: TRENDING_TOPICS_TABLE,
        FilterExpression: 'isVisible = :visible',
        ExpressionAttributeValues: marshall({ ':visible': true })
      }));
      const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
      return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 15);
    });
  }

  static async update(topicId, updateData) {
    try {
      const command = new UpdateItemCommand({
        TableName: TRENDING_TOPICS_TABLE,
        Key: marshall({ newstrendingtopics: topicId }),
        UpdateExpression: 'SET title = :title, description = :description, tags = :tags, imageUrl = :image, isVisible = :visible, updatedAt = :updated',
        ExpressionAttributeValues: marshall({
          ':title': updateData.title,
          ':description': updateData.description,
          ':tags': updateData.tags || '',
          ':image': updateData.imageUrl || null,
          ':visible': updateData.status === 'Published',
          ':updated': new Date().toISOString()
        }),
        ReturnValues: 'ALL_NEW'
      });
      const response = await dynamoClient.send(command);
      _invalidateNews();
      return { success: true, data: unmarshall(response.Attributes) };
    } catch (error) {
      console.error('Error updating trending topic:', error);
      throw error;
    }
  }

  static async toggleVisibility(topicId) {
    try {
      const getResponse = await dynamoClient.send(new GetItemCommand({
        TableName: TRENDING_TOPICS_TABLE,
        Key: marshall({ newstrendingtopics: topicId })
      }));
      if (!getResponse.Item) throw new Error('Topic not found');
      const currentItem = unmarshall(getResponse.Item);
      const updateCommand = new UpdateItemCommand({
        TableName: TRENDING_TOPICS_TABLE,
        Key: marshall({ newstrendingtopics: topicId }),
        UpdateExpression: 'SET isVisible = :visible, updatedAt = :updated',
        ExpressionAttributeValues: marshall({ ':visible': !currentItem.isVisible, ':updated': new Date().toISOString() }),
        ReturnValues: 'ALL_NEW'
      });
      const response = await dynamoClient.send(updateCommand);
      _invalidateNews();
      return { success: true, data: unmarshall(response.Attributes) };
    } catch (error) {
      console.error('Error toggling topic visibility:', error);
      throw error;
    }
  }

  static async delete(topicId) {
    try {
      await dynamoClient.send(new DeleteItemCommand({ TableName: TRENDING_TOPICS_TABLE, Key: marshall({ newstrendingtopics: topicId }) }));
      _invalidateNews();
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
        company: insightData.company || null,
        avatarUrl: insightData.avatarUrl || null,
        youtubeUrl: insightData.youtubeUrl || null,
        duration: insightData.duration || null,
        views: insightData.views || null,
        videoUrl: insightData.videoUrl || null,
        thumbnailUrl: insightData.thumbnailUrl || null,
        createdAt: timestamp,
        updatedAt: timestamp,
        isVisible: insightData.status === 'Published',
        sortOrder: Date.now()
      };
      await dynamoClient.send(new PutItemCommand({ TableName: EXPERT_INSIGHTS_TABLE, Item: marshall(item) }));
      _invalidateNews();
      return { success: true, data: item };
    } catch (error) {
      console.error('Error creating expert insight:', error);
      throw error;
    }
  }

  static async getAll() {
    return _getCached('insights_all', async () => {
      const response = await dynamoClient.send(new ScanCommand({ TableName: EXPERT_INSIGHTS_TABLE }));
      const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
      return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
  }

  static async getVisible() {
    return _getCached('insights_visible', async () => {
      const response = await dynamoClient.send(new ScanCommand({
        TableName: EXPERT_INSIGHTS_TABLE,
        FilterExpression: 'isVisible = :visible',
        ExpressionAttributeValues: marshall({ ':visible': true })
      }));
      const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
      return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
  }

  static async update(insightId, updateData) {
    try {
      const command = new UpdateItemCommand({
        TableName: EXPERT_INSIGHTS_TABLE,
        Key: marshall({ newsexpertinsights: insightId }),
        UpdateExpression: 'SET title = :title, expertName = :name, designation = :designation, company = :company, avatarUrl = :avatar, youtubeUrl = :youtube, duration = :duration, #views = :views, videoUrl = :video, thumbnailUrl = :thumbnail, isVisible = :visible, updatedAt = :updated',
        ExpressionAttributeNames: {
          '#views': 'views'
        },
        ExpressionAttributeValues: marshall({
          ':title': updateData.title,
          ':name': updateData.name,
          ':designation': updateData.designation,
          ':company': updateData.company || null,
          ':avatar': updateData.avatarUrl || null,
          ':youtube': updateData.youtubeUrl || null,
          ':duration': updateData.duration || null,
          ':views': updateData.views || null,
          ':video': updateData.videoUrl || null,
          ':thumbnail': updateData.thumbnailUrl || null,
          ':visible': updateData.status === 'Published',
          ':updated': new Date().toISOString()
        }),
        ReturnValues: 'ALL_NEW'
      });
      const response = await dynamoClient.send(command);
      _invalidateNews();
      return { success: true, data: unmarshall(response.Attributes) };
    } catch (error) {
      console.error('Error updating expert insight:', error);
      throw error;
    }
  }

  static async toggleVisibility(insightId) {
    try {
      const getResponse = await dynamoClient.send(new GetItemCommand({
        TableName: EXPERT_INSIGHTS_TABLE,
        Key: marshall({ newsexpertinsights: insightId })
      }));
      if (!getResponse.Item) throw new Error('Insight not found');
      const currentItem = unmarshall(getResponse.Item);
      const updateCommand = new UpdateItemCommand({
        TableName: EXPERT_INSIGHTS_TABLE,
        Key: marshall({ newsexpertinsights: insightId }),
        UpdateExpression: 'SET isVisible = :visible, updatedAt = :updated',
        ExpressionAttributeValues: marshall({ ':visible': !currentItem.isVisible, ':updated': new Date().toISOString() }),
        ReturnValues: 'ALL_NEW'
      });
      const response = await dynamoClient.send(updateCommand);
      _invalidateNews();
      return { success: true, data: unmarshall(response.Attributes) };
    } catch (error) {
      console.error('Error toggling insight visibility:', error);
      throw error;
    }
  }

  static async delete(insightId) {
    try {
      await dynamoClient.send(new DeleteItemCommand({ TableName: EXPERT_INSIGHTS_TABLE, Key: marshall({ newsexpertinsights: insightId }) }));
      _invalidateNews();
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
        excerpt: newsData.excerpt || null,
        content: newsData.content || null,
        category: newsData.category || 'Editorial',
        author: newsData.author || null,
        readTime: newsData.readTime || null,
        bannerImageUrl: newsData.bannerImageUrl || null,
        createdAt: newsData.date ? new Date(newsData.date).toISOString() : timestamp,
        updatedAt: timestamp,
        isVisible: newsData.status === 'Published',
        sortOrder: Date.now()
      };
      await dynamoClient.send(new PutItemCommand({ TableName: POSTED_NEWS_TABLE, Item: marshall(item) }));
      _invalidateNews();
      return { success: true, data: item };
    } catch (error) {
      console.error('Error creating posted news:', error);
      throw error;
    }
  }

  static async getAll() {
    return _getCached('posted_all', async () => {
      const response = await dynamoClient.send(new ScanCommand({ TableName: POSTED_NEWS_TABLE }));
      const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
      return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
  }

  static async getVisible() {
    return _getCached('posted_visible', async () => {
      const response = await dynamoClient.send(new ScanCommand({
        TableName: POSTED_NEWS_TABLE,
        FilterExpression: 'isVisible = :visible',
        ExpressionAttributeValues: marshall({ ':visible': true })
      }));
      const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
      return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
  }

  static async update(newsId, updateData) {
    try {
      const command = new UpdateItemCommand({
        TableName: POSTED_NEWS_TABLE,
        Key: marshall({ staffinnpostednews: newsId }),
        UpdateExpression: 'SET title = :title, description = :description, excerpt = :excerpt, content = :content, #cat = :category, author = :author, readTime = :readTime, bannerImageUrl = :banner, isVisible = :visible, updatedAt = :updated',
        ExpressionAttributeNames: {
          '#cat': 'category'
        },
        ExpressionAttributeValues: marshall({
          ':title': updateData.title,
          ':description': updateData.description,
          ':excerpt': updateData.excerpt || null,
          ':content': updateData.content || null,
          ':category': updateData.category || 'Editorial',
          ':author': updateData.author || null,
          ':readTime': updateData.readTime || null,
          ':banner': updateData.bannerImageUrl || null,
          ':visible': updateData.status === 'Published',
          ':updated': new Date().toISOString()
        }),
        ReturnValues: 'ALL_NEW'
      });
      const response = await dynamoClient.send(command);
      _invalidateNews();
      return { success: true, data: unmarshall(response.Attributes) };
    } catch (error) {
      console.error('Error updating posted news:', error);
      throw error;
    }
  }

  static async toggleVisibility(newsId) {
    try {
      const getResponse = await dynamoClient.send(new GetItemCommand({
        TableName: POSTED_NEWS_TABLE,
        Key: marshall({ staffinnpostednews: newsId })
      }));
      if (!getResponse.Item) throw new Error('Posted news not found');
      const currentItem = unmarshall(getResponse.Item);
      const updateCommand = new UpdateItemCommand({
        TableName: POSTED_NEWS_TABLE,
        Key: marshall({ staffinnpostednews: newsId }),
        UpdateExpression: 'SET isVisible = :visible, updatedAt = :updated',
        ExpressionAttributeValues: marshall({ ':visible': !currentItem.isVisible, ':updated': new Date().toISOString() }),
        ReturnValues: 'ALL_NEW'
      });
      const response = await dynamoClient.send(updateCommand);
      _invalidateNews();
      return { success: true, data: unmarshall(response.Attributes) };
    } catch (error) {
      console.error('Error toggling posted news visibility:', error);
      throw error;
    }
  }

  static async delete(newsId) {
    try {
      await dynamoClient.send(new DeleteItemCommand({ TableName: POSTED_NEWS_TABLE, Key: marshall({ staffinnpostednews: newsId }) }));
      _invalidateNews();
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