/**
 * Review Controller
 * Handles review operations
 */
const reviewModel = require('../models/reviewModel');

/**
 * Add a review for a staff member
 * @route POST /api/reviews
 */
const addReview = async (req, res) => {
  try {
    const { staffId, rating, feedback } = req.body;
    
    if (!staffId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID and rating are required'
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    const reviewData = {
      staffId,
      reviewerId: req.user?.userId || 'anonymous',
      reviewerName: req.user?.fullName || req.user?.name || 'Anonymous User',
      rating: parseInt(rating),
      feedback: feedback || ''
    };
    
    const result = await reviewModel.addReview(reviewData);
    
    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add review'
    });
  }
};

/**
 * Get reviews for a staff member
 * @route GET /api/reviews/:staffId
 */
const getReviews = async (req, res) => {
  try {
    const { staffId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    const result = await reviewModel.getReviews(staffId, limit, offset);
    
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get reviews'
    });
  }
};

module.exports = {
  addReview,
  getReviews
};