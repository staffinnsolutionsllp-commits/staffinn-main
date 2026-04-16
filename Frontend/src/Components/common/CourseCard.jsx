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

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="star-icon filled" />);
    }

    // Half star
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="star-icon filled" />);
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="star-icon empty" />);
    }

    return stars;
  };

  // Mock rating data (you can replace with actual data from backend)
  const rating = 4.1;
  const reviewCount = 146;

  return (
    <div className="course-card-new" onClick={handleViewClick}>
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
        <div className="course-rating">
          <span className="rating-value">{rating}</span>
          <div className="rating-stars">
            {renderStars(rating)}
          </div>
          <span className="rating-count">({reviewCount})</span>
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