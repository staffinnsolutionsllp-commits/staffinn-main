/**
 * Review Routes
 * Handles review API endpoints
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  addReview,
  getReviews
} = require('../controllers/reviewController');
const {
  addRecruiterReview,
  getRecruiterReviews
} = require('../controllers/recruiterReviewController');

// Staff Reviews
// POST /api/reviews - Add a review for staff (requires authentication)
router.post('/', authenticate, addReview);

// GET /api/reviews/:staffId - Get reviews for a staff member (public)
router.get('/:staffId', getReviews);

// Recruiter Reviews
// POST /api/reviews/recruiter - Add a review for recruiter (requires authentication)
router.post('/recruiter', authenticate, addRecruiterReview);

// GET /api/reviews/recruiter/:recruiterId - Get reviews for a recruiter (public)
router.get('/recruiter/:recruiterId', getRecruiterReviews);

module.exports = router;