import React, { useState } from 'react';
import './CourseDetailsModal.css';

const CourseDetailsModal = ({ course, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString || 'Not available';
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const numRating = parseFloat(rating) || 0;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= numRating) {
        stars.push(<i key={i} className="fas fa-star filled"></i>);
      } else if (i - 0.5 <= numRating) {
        stars.push(<i key={i} className="fas fa-star-half-alt filled"></i>);
      } else {
        stars.push(<i key={i} className="far fa-star"></i>);
      }
    }
    
    return stars;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="course-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{course.courseName || course.title || 'Course Details'}</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'enrolled' ? 'active' : ''}`}
            onClick={() => setActiveTab('enrolled')}
          >
            Enrolled Users ({course.totalEnrolled || 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({course.totalReviews || 0})
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Course Header */}
              <div className="course-header-section">
                <div className="course-basic-info">
                  <div className="course-title-section">
                    <h3>{course.courseName || course.title || 'Untitled Course'}</h3>
                    <div className="course-badges">
                      <span className={`level-badge ${(course.level || 'beginner').toLowerCase()}`}>
                        {course.level || 'Beginner'}
                      </span>
                      <span className="category-badge">
                        {course.category || 'General'}
                      </span>
                    </div>
                  </div>
                  <div className="course-rating">
                    <div className="stars">
                      {renderStars(course.averageRating)}
                    </div>
                    <span className="rating-text">
                      {course.averageRating || 0} ({course.totalReviews || 0} reviews)
                    </span>
                  </div>
                </div>
              </div>

              {/* Course Stats */}
              <div className="course-stats-section">
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-info">
                    <div className="stat-number">{course.totalEnrolled || 0}</div>
                    <div className="stat-label">Enrolled Students</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-star"></i>
                  </div>
                  <div className="stat-info">
                    <div className="stat-number">{course.averageRating || 0}</div>
                    <div className="stat-label">Average Rating</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="stat-info">
                    <div className="stat-number">{course.duration || 'N/A'}</div>
                    <div className="stat-label">Duration</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-rupee-sign"></i>
                  </div>
                  <div className="stat-info">
                    <div className="stat-number">{course.price ? `₹${course.price}` : 'Free'}</div>
                    <div className="stat-label">Price</div>
                  </div>
                </div>
              </div>

              {/* Course Description */}
              <div className="course-section">
                <h4>Description</h4>
                <div className="course-description">
                  {course.description || 'No description available for this course.'}
                </div>
              </div>

              {/* Course Details */}
              <div className="course-section">
                <h4>Course Information</h4>
                <div className="course-details-grid">
                  <div className="detail-item">
                    <label>Course ID:</label>
                    <span className="course-id">{course.coursesId || course.courseId || 'Not available'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Institute ID:</label>
                    <span className="institute-id">{course.instituteId || 'Not available'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Created Date:</label>
                    <span>{formatDate(course.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Last Updated:</label>
                    <span>{formatDate(course.updatedAt)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Language:</label>
                    <span>{course.language || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Prerequisites:</label>
                    <span>{course.prerequisites || 'None'}</span>
                  </div>
                </div>
              </div>

              {/* Course Content */}
              {course.content && (
                <div className="course-section">
                  <h4>Course Content</h4>
                  <div className="course-content-info">
                    {typeof course.content === 'string' ? (
                      <p>{course.content}</p>
                    ) : (
                      <pre>{JSON.stringify(course.content, null, 2)}</pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'enrolled' && (
            <div className="enrolled-tab">
              <div className="enrolled-header">
                <h4>Enrolled Students ({course.totalEnrolled || 0})</h4>
              </div>
              {course.enrolledUsers && course.enrolledUsers.length > 0 ? (
                <div className="enrolled-list">
                  {course.enrolledUsers.map((enrollment, index) => (
                    <div key={index} className="enrolled-item">
                      <div className="enrolled-user-info">
                        <div className="user-avatar">
                          {enrollment.userName ? enrollment.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="user-details">
                          <div className="user-name">{enrollment.userName || 'Unknown User'}</div>
                          <div className="user-email">{enrollment.userEmail || 'No email'}</div>
                        </div>
                      </div>
                      <div className="enrollment-date">
                        Enrolled: {formatDate(enrollment.enrolledAt || enrollment.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>No students enrolled in this course yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-tab">
              <div className="reviews-header">
                <h4>Course Reviews ({course.totalReviews || 0})</h4>
                {course.averageRating && (
                  <div className="overall-rating">
                    <div className="stars">
                      {renderStars(course.averageRating)}
                    </div>
                    <span>{course.averageRating} out of 5</span>
                  </div>
                )}
              </div>
              {course.reviews && course.reviews.length > 0 ? (
                <div className="reviews-list">
                  {course.reviews.map((review, index) => (
                    <div key={index} className="review-item">
                      <div className="review-header">
                        <div className="reviewer-info">
                          <div className="reviewer-avatar">
                            {review.userName ? review.userName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="reviewer-details">
                            <div className="reviewer-name">{review.userName || 'Anonymous'}</div>
                            <div className="review-date">{formatDate(review.createdAt)}</div>
                          </div>
                        </div>
                        <div className="review-rating">
                          <div className="stars">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <div className="review-comment">
                          {review.comment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>No reviews available for this course yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="close-modal-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsModal;