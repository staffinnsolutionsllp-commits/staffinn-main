/* eslint-disable no-unused-vars */
import React from 'react';
import './CourseCard.css';

const CourseCard = ({ course, onViewCourse, buttonText = "View Course" }) => {
  const handleViewClick = () => {
    if (onViewCourse) {
      onViewCourse(course);
    }
  };

  return (
    <div className="course-card">
      {course.thumbnailUrl && (
        <div className="course-thumbnail">
          <img src={course.thumbnailUrl} alt={course.courseName || course.name} />
        </div>
      )}
      <div className="course-header">
        <span className="course-status">Enrollment Open</span>
        <h3 className="course-name">{course.courseName || course.name}</h3>
      </div>
      <div className="course-details">
        <div className="course-detail">
          <span className="detail-label">Duration:</span>
          <span className="detail-value">{course.duration}</span>
        </div>
        <div className="course-detail">
          <span className="detail-label">Fees:</span>
          <span className="detail-value">₹{course.fees}</span>
        </div>
        <div className="course-detail">
          <span className="detail-label">Mode:</span>
          <span className="detail-value">{course.mode}</span>
        </div>
        <div className="course-detail">
          <span className="detail-label">Category:</span>
          <span className="detail-value">{course.category}</span>
        </div>
        <div className="course-detail">
          <span className="detail-label">Certification:</span>
          <span className="detail-value">{course.certification}</span>
        </div>
        <div className="course-detail">
          <span className="detail-label">Instructor:</span>
          <span className="detail-value">{course.instructor}</span>
        </div>
      </div>
      
      {course.instituteInfo && (
        <div className="course-institute-info">
          <span className="institute-name">{course.instituteInfo.instituteName}</span>
          {course.enrollmentCount !== undefined && (
            <span className="enrollment-count">
              {course.enrollmentCount} {course.enrollmentCount === 1 ? 'enrollment' : 'enrollments'}
            </span>
          )}
        </div>
      )}
      
      <div className="course-enrollment-section">
        <button 
          className="view-details-button"
          onClick={handleViewClick}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default CourseCard;