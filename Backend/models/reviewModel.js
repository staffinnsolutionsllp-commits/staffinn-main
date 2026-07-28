/**
 * Review Model
 * Handles staff reviews using staff profiles table
 */
const staffModel = require('./staffModel');
const { v4: uuidv4 } = require('uuid');

/**
 * Add a review for a staff member
 */
const addReview = async (reviewData) => {
  try {
    const staff = await staffModel.getStaffProfile(reviewData.staffId);
    if (!staff) throw new Error('Staff not found');
    
    const review = {
      reviewId: uuidv4(),
      reviewerId: reviewData.reviewerId,
      reviewerName: reviewData.reviewerName,
      reviewerRole: reviewData.reviewerRole || 'unknown',
      rating: reviewData.rating,
      feedback: reviewData.feedback,
      createdAt: new Date().toISOString()
    };
    
    const reviews = staff.reviews || [];
    reviews.push(review);
    
    // Calculate new average rating
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = (totalRating / reviews.length).toFixed(1);
    
    await staffModel.updateStaffProfile(reviewData.staffId, {
      reviews: reviews,
      rating: parseFloat(averageRating),
      reviewCount: reviews.length
    });
    
    return { review, averageRating: parseFloat(averageRating), reviewCount: reviews.length };
  } catch (error) {
    console.error('Add review error:', error);
    throw new Error('Failed to add review');
  }
};

/**
 * Get reviews for a staff member
 */
const getReviews = async (staffId, limit = 10, offset = 0) => {
  try {
    const staff = await staffModel.getStaffProfile(staffId);
    if (!staff) return { reviews: [], total: 0 };
    
    const allReviews = staff.reviews || [];
    const sortedReviews = allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const paginatedReviews = sortedReviews.slice(offset, offset + limit);
    
    // Enrich reviews: fix "Anonymous User" names and add missing role info
    const userModel = require('./userModel');
    const enrichedReviews = await Promise.all(paginatedReviews.map(async (review) => {
      // If reviewer name is Anonymous or missing, try to fetch from user table
      if (!review.reviewerName || review.reviewerName === 'Anonymous User' || review.reviewerName === 'Anonymous') {
        if (review.reviewerId && review.reviewerId !== 'anonymous') {
          try {
            const reviewer = await userModel.findUserById(review.reviewerId);
            if (reviewer) {
              const role = reviewer.role || 'unknown';
              let name = 'User';
              if (role === 'staff') name = reviewer.fullName || 'Staff Member';
              else if (role === 'recruiter') name = reviewer.companyName || 'Recruiter';
              else if (role === 'institute') name = reviewer.instituteName || 'Institute';
              else name = reviewer.fullName || reviewer.companyName || reviewer.instituteName || 'User';
              
              review.reviewerName = name;
              review.reviewerRole = role;
            }
          } catch (e) {
            // Keep original name if fetch fails
          }
        }
      }
      
      // If reviewerRole is missing but reviewerId exists, try to fetch role
      if (!review.reviewerRole && review.reviewerId && review.reviewerId !== 'anonymous') {
        try {
          const reviewer = await userModel.findUserById(review.reviewerId);
          if (reviewer) {
            review.reviewerRole = reviewer.role || 'unknown';
          }
        } catch (e) {
          // Ignore
        }
      }
      
      return review;
    }));
    
    return {
      reviews: enrichedReviews,
      total: allReviews.length,
      hasMore: offset + limit < allReviews.length
    };
  } catch (error) {
    console.error('Get reviews error:', error);
    return { reviews: [], total: 0, hasMore: false };
  }
};

module.exports = {
  addReview,
  getReviews
};