/**
 * Institute Review Model
 * Stores reviews in the staffinn-institute-reviews DynamoDB table.
 * PK: instituteId  SK: reviewId
 */
const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const TABLE = process.env.INSTITUTE_REVIEWS_TABLE || 'staffinn-institute-reviews';

/**
 * Add a review for an institute
 */
const addInstituteReview = async (reviewData) => {
  try {
    const reviewId = uuidv4();
    const now = new Date().toISOString();

    const item = {
      instituteId: reviewData.instituteId,
      reviewId,
      userId: reviewData.userId || 'anonymous',
      userName: reviewData.userName || 'Anonymous',
      userType: reviewData.userType || 'Student', // Student | Alumni | Recruiter | Other
      rating: parseFloat(reviewData.rating),
      title: reviewData.title || '',
      review: reviewData.review || '',
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    await dynamoService.putItem(TABLE, item);
    return item;
  } catch (error) {
    console.error('addInstituteReview error:', error);
    throw new Error('Failed to add institute review');
  }
};

/**
 * Get paginated reviews for an institute
 */
const getInstituteReviews = async (instituteId, limit = 10, offset = 0) => {
  try {
    const params = {
      FilterExpression: 'instituteId = :iid AND #st = :active',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: {
        ':iid': instituteId,
        ':active': 'active'
      }
    };

    const allItems = await dynamoService.scanItems(TABLE, params);

    // Sort newest first
    allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = allItems.length;
    const reviews = allItems.slice(offset, offset + limit);

    // Calculate stats from full dataset
    const averageRating = total > 0
      ? parseFloat((allItems.reduce((s, r) => s + r.rating, 0) / total).toFixed(1))
      : 0;

    // Rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allItems.forEach(r => {
      const key = Math.round(r.rating);
      if (distribution[key] !== undefined) distribution[key]++;
    });

    return {
      reviews,
      total,
      averageRating,
      distribution,
      hasMore: offset + limit < total
    };
  } catch (error) {
    console.error('getInstituteReviews error:', error);
    return { reviews: [], total: 0, averageRating: 0, distribution: {}, hasMore: false };
  }
};

module.exports = { addInstituteReview, getInstituteReviews };
