import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminApi';
import CourseDetailsModal from './CourseDetailsModal';
import './InstituteCourses.css';

const InstituteCourses = () => {
  const [courses, setCourses] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadCourses();
  }, [selectedInstitute]);

  const loadInitialData = async () => {
    try {
      // Load institutes for the dropdown
      const institutesResponse = await adminAPI.getAllInstitutes();
      if (institutesResponse.success) {
        setInstitutes(institutesResponse.data);
      }
    } catch (error) {
      console.error('Error loading institutes:', error);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllCourses(selectedInstitute || null);
      
      if (response.success) {
        setCourses(response.data);
      }
    } catch (error) {
      setError(error.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setShowCourseModal(true);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Filter courses based on search
  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchTerm || 
      (course.courseName && course.courseName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.title && course.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.category && course.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Calculate summary stats
  const summaryStats = {
    totalCourses: filteredCourses.length,
    totalEnrolled: filteredCourses.reduce((sum, course) => sum + (course.totalEnrolled || 0), 0),
    averageRating: filteredCourses.length > 0 
      ? (filteredCourses.reduce((sum, course) => sum + (parseFloat(course.averageRating) || 0), 0) / filteredCourses.length).toFixed(1)
      : 0
  };

  if (loading) {
    return (
      <div className="institute-courses-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="institute-courses-container">
        <div className="error-message">
          <h3>Error Loading Courses</h3>
          <p>{error}</p>
          <button onClick={loadCourses} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="institute-courses-container">
      <div className="page-header">
        <h1 className="page-title">Course Management</h1>
        <div className="header-controls">
          <div className="institute-selector">
            <label htmlFor="institute-select">Select Institute:</label>
            <select 
              id="institute-select"
              value={selectedInstitute}
              onChange={(e) => setSelectedInstitute(e.target.value)}
              className="institute-dropdown"
            >
              <option value="">All Institutes</option>
              {institutes.map((institute) => (
                <option key={institute.userId} value={institute.userId}>
                  {institute.name || institute.instituteName || 'Unknown Institute'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card total">
          <div className="summary-icon">
            <i className="fas fa-book"></i>
          </div>
          <div className="summary-content">
            <h3>Total Courses</h3>
            <div className="summary-number">{summaryStats.totalCourses}</div>
          </div>
        </div>
        <div className="summary-card enrolled">
          <div className="summary-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="summary-content">
            <h3>Total Enrolled</h3>
            <div className="summary-number">{summaryStats.totalEnrolled}</div>
          </div>
        </div>
        <div className="summary-card rating">
          <div className="summary-icon">
            <i className="fas fa-star"></i>
          </div>
          <div className="summary-content">
            <h3>Average Rating</h3>
            <div className="summary-number">{summaryStats.averageRating}</div>
          </div>
        </div>
      </div>

      <div className="controls-section">
        <div className="search-section">
          <div className="search-box">
            <i className="fas fa-search search-icon"></i>
            <input 
              type="text" 
              placeholder="Search courses..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="no-data">
          <h3>No Courses Found</h3>
          <p>
            {searchTerm 
              ? 'No courses match your search criteria.' 
              : selectedInstitute 
                ? 'This institute has no courses yet.'
                : 'No courses have been added yet.'
            }
          </p>
        </div>
      ) : (
        <div className="courses-grid">
          {filteredCourses.map((course) => (
            <div key={course.coursesId || course.courseId} className="course-card">
              <div className="course-header">
                <div className="course-title">
                  {course.courseName || course.title || 'Untitled Course'}
                </div>
                <div className="course-category">
                  {course.category || 'General'}
                </div>
              </div>
              
              <div className="course-content">
                <div className="course-description">
                  {course.description ? 
                    (course.description.length > 150 
                      ? course.description.substring(0, 150) + '...' 
                      : course.description
                    ) : 'No description available'
                  }
                </div>
                
                <div className="course-stats">
                  <div className="stat-item">
                    <i className="fas fa-users"></i>
                    <span>{course.totalEnrolled || 0} enrolled</span>
                  </div>
                  <div className="stat-item">
                    <i className="fas fa-star"></i>
                    <span>{course.averageRating || 0} ({course.totalReviews || 0} reviews)</span>
                  </div>
                  <div className="stat-item">
                    <i className="fas fa-calendar"></i>
                    <span>Created {formatDate(course.createdAt)}</span>
                  </div>
                </div>
                
                <div className="course-meta">
                  <div className="course-duration">
                    <i className="fas fa-clock"></i>
                    <span>{course.duration || 'Duration not specified'}</span>
                  </div>
                  <div className="course-level">
                    <span className={`level-badge ${(course.level || 'beginner').toLowerCase()}`}>
                      {course.level || 'Beginner'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="course-footer">
                <button 
                  className="view-course-btn"
                  onClick={() => handleViewCourse(course)}
                >
                  <i className="fas fa-eye"></i>
                  View Details
                </button>
                <div className="course-price">
                  {course.price ? `₹${course.price}` : 'Free'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Details Modal */}
      {showCourseModal && selectedCourse && (
        <CourseDetailsModal
          course={selectedCourse}
          onClose={() => {
            setShowCourseModal(false);
            setSelectedCourse(null);
          }}
        />
      )}
    </div>
  );
};

export default InstituteCourses;