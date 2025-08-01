/**
 * Recruiter Review Controller
 * Handles recruiter review operations
 */
const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');

const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE || 'staffinn-recruiter-profiles';

/**
 * Add a review for a recruiter
 * @route POST /api/reviews/recruiter
 */
const addRecruiterReview = async (req, res) => {
  try {
    const { recruiterId, rating, comment } = req.body;
    
    if (!recruiterId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Recruiter ID and rating are required'
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Get the recruiter profile
    const recruiterProfile = await dynamoService.getItem(RECRUITER_PROFILES_TABLE, { recruiterId });
    if (!recruiterProfile) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter profile not found'
      });
    }
    
    // Create the review object
    const review = {
      reviewId: uuidv4(),
      reviewerId: req.user?.userId || 'anonymous',
      reviewerName: req.user?.fullName || req.user?.name || 'Anonymous User',
      rating: parseInt(rating),
      comment: comment || '',
      createdAt: new Date().toISOString()
    };
    
    // Add the review to the recruiter profile
    const reviews = recruiterProfile.reviews || [];
    reviews.push(review);
    
    // Calculate new average rating
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = (totalRating / reviews.length).toFixed(1);
    
    // Update the recruiter profile
    await dynamoService.putItem(RECRUITER_PROFILES_TABLE, {
      ...recruiterProfile,
      reviews,
      rating: parseFloat(averageRating),
      reviewCount: reviews.length,
      updatedAt: new Date().toISOString()
    });
    
    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: { review, averageRating: parseFloat(averageRating), reviewCount: reviews.length }
    });
    
  } catch (error) {
    console.error('Add recruiter review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add review'
    });
  }
};

/**
 * Get reviews for a recruiter
 * @route GET /api/reviews/recruiter/:recruiterId
 */
const getRecruiterReviews = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    // Get the recruiter profile
    const recruiterProfile = await dynamoService.getItem(RECRUITER_PROFILES_TABLE, { recruiterId });
    if (!recruiterProfile) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter profile not found'
      });
    }
    
    const allReviews = recruiterProfile.reviews || [];
    const sortedReviews = allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const paginatedReviews = sortedReviews.slice(offset, offset + limit);
    
    res.status(200).json({
      success: true,
      data: {
        reviews: paginatedReviews,
        total: allReviews.length,
        hasMore: offset + limit < allReviews.length,
        averageRating: recruiterProfile.rating || 0
      }
    });
    
  } catch (error) {
    console.error('Get recruiter reviews error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get reviews'
    });
  }
};

module.exports = {
  addRecruiterReview,
  getRecruiterReviews
};