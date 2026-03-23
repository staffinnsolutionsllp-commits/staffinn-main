import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import PaymentModal from '../Dashboard/PaymentModal';
import './CourseDetailPage.css';

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadCourseDetails();
    checkEnrollmentStatus();
  }, [courseId]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPublicCourseById(courseId);
      
      if (response.success) {
        setCourse(response.data);
      } else {
        alert('Failed to load course details');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      alert('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await apiService.checkEnrollmentStatus(courseId);
      if (response.success) {
        setEnrollmentStatus(response);
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleEnrollClick = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to enroll in this course');
      navigate('/login');
      return;
    }

    if (course.fees && course.fees > 0) {
      // Paid course - show payment modal
      setShowPaymentModal(true);
    } else {
      // Free course - direct enrollment
      handleFreeEnrollment();
    }
  };

  const handleFreeEnrollment = async () => {
    try {
      const response = await apiService.enrollInCourse(courseId);
      
      if (response.success) {
        alert('Successfully enrolled in the course!');
        checkEnrollmentStatus();
      } else {
        alert(response.message || 'Failed to enroll in course');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll in course');
    }
  };

  const handlePaymentSuccess = () => {
    checkEnrollmentStatus();
    loadCourseDetails();
  };

  const handleStartLearning = () => {
    navigate(`/course-learning/${courseId}`);
  };

  if (loading) {
    return (
      <div className="course-detail-page">
        <div className="loading-state">Loading course details...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-page">
        <div className="error-state">Course not found</div>
      </div>
    );
  }

  const isEnrolled = enrollmentStatus?.enrolled;
  const isFree = !course.fees || course.fees === 0;

  return (
    <div className="course-detail-page">
      <div className="course-detail-container">
        {/* Course Header */}
        <div className="course-header">
          {course.thumbnailUrl && (
            <div className="course-thumbnail">
              <img src={course.thumbnailUrl} alt={course.courseName} />
            </div>
          )}
          
          <div className="course-header-content">
            <h1>{course.courseName || course.name}</h1>
            <p className="course-description">{course.description}</p>
            
            <div className="course-meta">
              <div className="meta-item">
                <span className="icon">👨‍🏫</span>
                <span>{course.instructor}</span>
              </div>
              <div className="meta-item">
                <span className="icon">⏱️</span>
                <span>{course.duration}</span>
              </div>
              <div className="meta-item">
                <span className="icon">📚</span>
                <span>{course.category}</span>
              </div>
              <div className="meta-item">
                <span className="icon">📍</span>
                <span>{course.mode}</span>
              </div>
            </div>

            <div className="course-price-section">
              {isFree ? (
                <div className="price-tag free">FREE</div>
              ) : (
                <div className="price-tag">₹{course.fees}</div>
              )}
              
              {isEnrolled ? (
                <button className="enroll-button enrolled" onClick={handleStartLearning}>
                  Continue Learning →
                </button>
              ) : (
                <button className="enroll-button" onClick={handleEnrollClick}>
                  {isFree ? 'Enroll Now' : 'Buy Now'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="course-content-section">
          <div className="content-tabs">
            <button className="tab active">Overview</button>
            <button className="tab">Curriculum</button>
            <button className="tab">Reviews</button>
          </div>

          <div className="content-panel">
            {/* Overview */}
            <div className="overview-section">
              <h2>About This Course</h2>
              <p>{course.description}</p>

              {course.prerequisites && (
                <div className="prerequisites">
                  <h3>Prerequisites</h3>
                  <p>{course.prerequisites}</p>
                </div>
              )}

              {course.syllabusOverview && (
                <div className="syllabus">
                  <h3>What You'll Learn</h3>
                  <p>{course.syllabusOverview}</p>
                </div>
              )}

              {course.certification && (
                <div className="certification">
                  <h3>Certification</h3>
                  <p>{course.certification}</p>
                </div>
              )}
            </div>

            {/* Curriculum */}
            {course.modules && course.modules.length > 0 && (
              <div className="curriculum-section">
                <h2>Course Curriculum</h2>
                <div className="modules-list">
                  {course.modules.map((module, index) => (
                    <div key={module.moduleId} className="module-item">
                      <div className="module-header">
                        <h3>Module {index + 1}: {module.moduleTitle}</h3>
                        <span className="module-duration">
                          {module.content?.length || 0} lessons
                        </span>
                      </div>
                      {module.moduleDescription && (
                        <p className="module-description">{module.moduleDescription}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          course={course}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default CourseDetailPage;
