const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');

const COURSE_REVIEW_TABLE = 'course-review';
const STAFF_TABLE = process.env.STAFF_TABLE || 'staffinn-staff-profiles';
const COURSE_ENROLLED_USER_TABLE = 'course-enrolled-user';

/**
 * Add a review for a course
 */
const addCourseReview = async (req, res) => {
  try {
    const { courseId, rating, review } = req.body;
    
    if (!courseId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and rating are required'
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Get user profile data
    let userPhoto = null;
    let userName = 'Anonymous User';
    
    if (req.user?.userId) {
      try {
        // Find user profile using dynamoService
        const userProfiles = await dynamoService.scanItems(STAFF_TABLE, {
          FilterExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': req.user.userId
          }
        });
        
        if (userProfiles && userProfiles.length > 0) {
          const profile = userProfiles[0];
          userName = profile.fullName || profile.name || 'Anonymous User';
          userPhoto = profile.profilePhoto || null;
        } else {
          userName = req.user?.fullName || req.user?.name || 'Anonymous User';
        }
      } catch (profileError) {
        console.log('Could not fetch user profile:', profileError.message);
        userName = req.user?.fullName || req.user?.name || 'Anonymous User';
      }
    }
    
    const reviewId = uuidv4();
    const reviewData = {
      coursereviewid: reviewId,
      courseId,
      userId: req.user?.userId || 'anonymous',
      userName,
      userPhoto,
      rating: parseInt(rating),
      review: review || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await dynamoService.putItem(COURSE_REVIEW_TABLE, reviewData);
    
    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: reviewData
    });
    
  } catch (error) {
    console.error('Add course review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add review'
    });
  }
};

/**
 * Get reviews for a course
 */
const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await dynamoService.scanItems(COURSE_REVIEW_TABLE, {
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      },
      Limit: limit
    });
    
    // Sort by newest first
    const sortedReviews = (result || []).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // Update profile photos for reviews that don't have them or need refresh
    const updatedReviews = await Promise.all(
      sortedReviews.map(async (review) => {
        if (review.userId && review.userId !== 'anonymous') {
          try {
            const userProfiles = await dynamoService.scanItems(STAFF_TABLE, {
              FilterExpression: 'userId = :userId',
              ExpressionAttributeValues: {
                ':userId': review.userId
              }
            });
            
            if (userProfiles && userProfiles.length > 0) {
              const profile = userProfiles[0];
              // Update the review with current profile photo if it's different
              if (profile.profilePhoto !== review.userPhoto) {
                review.userPhoto = profile.profilePhoto;
                review.userName = profile.fullName || profile.name || review.userName;
              }
            }
          } catch (profileError) {
            console.log('Could not update profile for review:', profileError.message);
          }
        }
        return review;
      })
    );
    
    res.status(200).json({
      success: true,
      data: {
        reviews: updatedReviews,
        count: updatedReviews.length
      }
    });
    
  } catch (error) {
    console.error('Get course reviews error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get reviews'
    });
  }
};

/**
 * Get course rating statistics
 */
const getCourseRatingStats = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const reviews = await dynamoService.scanItems(COURSE_REVIEW_TABLE, {
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      }
    });
    
    if (reviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      });
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });
    
    res.status(200).json({
      success: true,
      data: {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: reviews.length,
        ratingDistribution
      }
    });
    
  } catch (error) {
    console.error('Get course rating stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get rating statistics'
    });
  }
};

/**
 * Get enrollment count for a course
 */
const getCourseEnrollmentCount = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Query the course-enrolled-user table to count enrollments for this course
    const enrollments = await dynamoService.scanItems(COURSE_ENROLLED_USER_TABLE, {
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      },
      ProjectionExpression: 'userId'
    });
    
    const enrollmentCount = enrollments ? enrollments.length : 0;
    
    res.status(200).json({
      success: true,
      data: {
        enrollmentCount
      }
    });
    
  } catch (error) {
    console.error('Get course enrollment count error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get enrollment count'
    });
  }
};

module.exports = {
  addCourseReview,
  getCourseReviews,
  getCourseRatingStats,
  getCourseEnrollmentCount
};