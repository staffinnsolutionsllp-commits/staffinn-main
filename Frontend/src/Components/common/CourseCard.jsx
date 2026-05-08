/* eslint-disable no-unused-vars */
import React from 'react';
import './CourseCard.css';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const CourseCard = ({ course, onViewCourse, buttonText = "View Course" }) => {
  const handleViewClick = () => {
    if (onViewCourse) {
      onViewCourse(course);
    }
  };

  // Debug: Log course data to see what fields are available
  console.log('CourseCard received course data:', course);
  console.log('Available fields:', Object.keys(course));
  console.log('courseName:', course.courseName);
  console.log('name:', course.name);
  console.log('instituteName:', course.instituteName);
  console.log('description:', course.description);
  console.log('thumbnailUrl:', course.thumbnailUrl);
  console.log('thumbnail:', course.thumbnail);

  // Get course name from multiple possible fields
  const courseName = course.courseName || course.name || course.title || course.courseTitle || 'Course Name';
  
  // Get instructor name from multiple possible fields
  const instructorName = course.instructor || course.instructorName || course.instituteName || 'Instructor Name';
  
  // Get description from multiple possible fields
  const description = course.description || course.courseDescription || course.details || '';
  
  // Get thumbnail from multiple possible fields
  const thumbnail = course.thumbnailUrl || course.thumbnail || course.image || course.bannerImage || course.courseImage || null;
  
  // Get fees from multiple possible fields
  const fees = course.fees || course.price || course.courseFees || '0';

  // Truncate description to 2 lines (approximately 80 characters)
  const truncateDescription = (text, maxLength = 80) => {
    if (!text) return 'Get ready to dive into an exciting learning experience.';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Render star rating - inline without wrapper
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="star-icon filled" style={{ display: 'inline' }} />);
    }

    // Half star
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="star-icon filled" style={{ display: 'inline' }} />);
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="star-icon empty" style={{ display: 'inline' }} />);
    }

    return stars;
  };

  // Get real rating data from course
  const rating = course.averageRating || course.rating || 0;
  const reviewCount = course.totalReviews || course.reviewCount || 0;

  const handleCardClick = () => {
    // Redirect to course learning page
    if (course.coursesId) {
      window.location.href = `/course-learning/${course.coursesId}`;
    } else if (onViewCourse) {
      onViewCourse(course);
    }
  };

  return (
    <div className="course-card-new" onClick={handleCardClick}>
      {/* Banner Image */}
      <div className="course-banner">
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={courseName}
            onError={(e) => {
              console.error('Image failed to load:', e.target.src);
              e.target.style.display = 'none';
              const placeholder = e.target.parentElement.querySelector('.course-banner-placeholder');
              if (!placeholder) {
                const div = document.createElement('div');
                div.className = 'course-banner-placeholder';
                div.innerHTML = '<span>No Image</span>';
                e.target.parentElement.appendChild(div);
              }
            }}
          />
        ) : (
          <div className="course-banner-placeholder">
            <span>No Image</span>
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="course-content">
        {/* Course Name */}
        <h3 className="course-title">
          {courseName}
        </h3>

        {/* Instructor Name */}
        <p className="course-instructor">
          {instructorName}
        </p>

        {/* Course Description */}
        <p className="course-description">
          {truncateDescription(description)}
        </p>

        {/* Rating Section */}
        <div 
          className="course-rating"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '4px',
            flexWrap: 'nowrap',
            margin: '0 0 6px 0'
          }}
        >
          <span style={{ flexShrink: 0, fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
            {rating > 0 ? rating.toFixed(1) : '0.0'}
          </span>
          <span style={{ display: 'inline-flex', gap: '1px', flexShrink: 0, alignItems: 'center' }}>
            {renderStars(rating)}
          </span>
          <span style={{ flexShrink: 0, whiteSpace: 'nowrap', fontSize: '13px', color: '#6b7280' }}>
            ({reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="course-price">
          ₹{fees}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;