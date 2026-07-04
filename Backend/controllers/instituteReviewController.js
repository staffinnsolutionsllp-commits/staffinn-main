/**
 * Institute Review Controller
 */
const instituteReviewModel = require('../models/instituteReviewModel');

/**
 * POST /api/reviews/institute
 * Add a review for an institute (requires auth)
 */
const addInstituteReview = async (req, res) => {
  try {
    const { instituteId, rating, userType, title, review } = req.body;

    if (!instituteId || !rating) {
      return res.status(400).json({ success: false, message: 'instituteId and rating are required' });
    }

    const parsedRating = parseFloat(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const reviewData = {
      instituteId,
      userId: req.user?.userId || 'anonymous',
      userName: req.user?.fullName || req.user?.name || 'Anonymous',
      userType: userType || 'Student',
      rating: parsedRating,
      title: title || '',
      review: review || ''
    };

    const result = await instituteReviewModel.addInstituteReview(reviewData);

    // Fetch updated stats
    const stats = await instituteReviewModel.getInstituteReviews(instituteId, 1, 0);

    return res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: {
        review: result,
        averageRating: stats.averageRating,
        total: stats.total
      }
    });
  } catch (error) {
    console.error('addInstituteReview controller error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to add review' });
  }
};

/**
 * GET /api/reviews/institute/:instituteId
 * Get reviews for an institute (public)
 */
const getInstituteReviews = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const result = await instituteReviewModel.getInstituteReviews(instituteId, limit, offset);

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('getInstituteReviews controller error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to get reviews' });
  }
};

module.exports = { addInstituteReview, getInstituteReviews };
