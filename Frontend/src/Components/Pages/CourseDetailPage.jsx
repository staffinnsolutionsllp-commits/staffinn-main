import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import PaymentModal from '../Dashboard/PaymentModal';
import PaymentOptionModal from '../Dashboard/PaymentOptionModal';
import { 
  GraduationCap, ChevronRight, Bell, Calendar, Globe, Award, Layers, 
  CheckCircle2, Clock, Play, FileText, HelpCircle, Lock, Users, 
  Star, ChevronDown, Link as LinkIcon, Shield,
  Globe2, ChevronUp, Share2
} from 'lucide-react';
import './CourseDetailPage.css';

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentOptionModal, setShowPaymentOptionModal] = useState(false);
  const [expandedModules, setExpandedModules] = useState([0]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

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

  const handleEnrollClick = async () => {
    console.log('\n\n🚨🚨🚨 HANDLE ENROLL CLICK FUNCTION CALLED 🚨🚨🚨\n');
    console.log('Attempting to enroll in course:', courseId);
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to enroll in this course');
      navigate('/login');
      return;
    }

    const userDataStr = localStorage.getItem('user');
    let userData = null;
    
    if (userDataStr) {
      try {
        userData = JSON.parse(userDataStr);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    console.log('🎯 Enroll button clicked');
    console.log('📊 Course mode:', course.mode);
    console.log('💰 Course fees:', course.fees);
    console.log('✅ Is enrolled:', enrollmentStatus?.enrolled);
    console.log('👤 User type:', userData?.userType);

    const isInstitute = userData?.userType === 'institute';
    const isOnline = course.mode && course.mode.toLowerCase() === 'online';
    
    if (isInstitute && isOnline) {
      alert('You can only apply to on-campus courses only.');
      return;
    }

    const isOnCampus = course.mode && (course.mode.toLowerCase() === 'on campus' || course.mode.toLowerCase() === 'offline');
    
    console.log('🏫 Is On-Campus:', isOnCampus);

    if (isOnCampus) {
      if (course.fees && parseFloat(course.fees) > 0) {
        console.log('💳 Showing payment option modal for paid on-campus course');
        setShowPaymentOptionModal(true);
      } else {
        console.log('🆓 Free on-campus course - direct enrollment');
        handleFreeOnCampusEnrollment();
      }
    }
    else if (course.mode === 'Online' && course.fees && parseFloat(course.fees) > 0) {
      console.log('💻 Online paid course - checking payment status');
      try {
        const paymentStatus = await apiService.checkPaymentStatus(courseId);
        
        if (paymentStatus.success && paymentStatus.hasPaid) {
          console.log('✅ Payment already done - enrolling');
          handlePaidEnrollment();
        } else {
          console.log('❌ Payment not done - showing payment modal');
          setShowPaymentModal(true);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setShowPaymentModal(true);
      }
    } else {
      console.log('🆓 Free online course - direct enrollment');
      handleFreeEnrollment();
    }
  };

  const handlePaidEnrollment = async () => {
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

  const handleFreeOnCampusEnrollment = async () => {
    try {
      const response = await apiService.enrollInCourse(courseId);
      
      if (response.success) {
        alert('Successfully enrolled! Please visit the campus for further instructions and class schedules.');
        checkEnrollmentStatus();
      } else {
        alert(response.message || 'Failed to enroll in course');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll in course');
    }
  };

  const handlePayHere = () => {
    console.log('💳 User selected: Pay Here (Razorpay)');
    setShowPaymentOptionModal(false);
    setShowPaymentModal(true);
  };

  const handlePayAtInstitute = async () => {
    console.log('🏢 User selected: Pay at Institute');
    try {
      console.log('📤 Calling API: enrollInCoursePayAtInstitute');
      const response = await apiService.enrollInCoursePayAtInstitute(courseId);
      
      console.log('📥 API Response:', response);
      
      if (response.success) {
        setShowPaymentOptionModal(false);
        alert(
          'Enrollment request submitted successfully!\n\n' +
          'The institute has been notified about your enrollment.\n' +
          'Please visit the institute to complete the payment.\n\n' +
          'You will receive further instructions from the institute.'
        );
        checkEnrollmentStatus();
      } else {
        alert(response.message || 'Failed to submit enrollment request');
      }
    } catch (error) {
      console.error('❌ Error submitting enrollment request:', error);
      alert('Failed to submit enrollment request: ' + (error.message || 'Unknown error'));
    }
  };

  const handlePaymentSuccess = () => {
    checkEnrollmentStatus();
    loadCourseDetails();
  };

  const handleStartLearning = () => {
    navigate(`/course-learning/${courseId}`);
  };

  const toggleModule = (index) => {
    setExpandedModules(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleAllModules = () => {
    if (expandedModules.length === course?.modules?.length) {
      setExpandedModules([]);
    } else {
      setExpandedModules(course?.modules?.map((_, i) => i) || []);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Course link copied to clipboard!');
  };

  const calculateTotalLectures = () => {
    if (!course?.modules) return 0;
    return course.modules.reduce((total, module) => total + (module.content?.length || 0), 0);
  };

  const calculateTotalDuration = () => {
    if (!course?.modules) return '0h 0m';
    let totalMinutes = 0;
    course.modules.forEach(module => {
      module.content?.forEach(item => {
        if (item.duration) {
          const [mins, secs] = item.duration.split(':').map(Number);
          totalMinutes += mins + (secs / 60);
        }
      });
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < Math.floor(rating) ? 'cdp-star-filled' : 'cdp-star-empty'}
        fill={i < Math.floor(rating) ? '#F59E0B' : 'none'}
        stroke={i < Math.floor(rating) ? '#F59E0B' : '#94a3b8'}
      />
    ));
  };

  if (loading) {
    return (
      <div className="cdp-page" data-testid="course-detail-page">
        <div className="cdp-loading-state">Loading course details...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="cdp-page" data-testid="course-detail-page">
        <div className="cdp-error-state">Course not found</div>
      </div>
    );
  }

  const isEnrolled = enrollmentStatus?.enrolled;
  const isFree = !course.fees || course.fees === 0;
  const discountPercent = course.originalFees && course.fees 
    ? Math.round(((course.originalFees - course.fees) / course.originalFees) * 100)
    : 0;
  const isOnline = course.mode?.toLowerCase() === 'online';

  return (
    <div className="cdp-page" data-testid="course-detail-page">
      {/* NAVBAR */}
      <nav className="cdp-navbar" data-testid="navbar">
        <div className="cdp-navbar-content">
          <div className="cdp-navbar-left">
            <div className="cdp-logo" data-testid="logo">
              <div className="cdp-logo-icon">
                <GraduationCap size={20} strokeWidth={2.5} />
              </div>
              <span className="cdp-logo-text">Staffinn</span>
            </div>
          </div>
          
          <div className="cdp-breadcrumb" data-testid="breadcrumb">
            <span>Home</span>
            <ChevronRight size={14} />
            <span>Courses</span>
            <ChevronRight size={14} />
            <span>{course.category}</span>
            <ChevronRight size={14} />
            <span className="cdp-breadcrumb-active">{course.courseName}</span>
          </div>

          <div className="cdp-navbar-right">
            <button className="cdp-bell-btn" data-testid="bell-icon">
              <Bell size={20} />
            </button>
            <button className="cdp-profile-btn" data-testid="my-profile-button">
              My Profile
            </button>
          </div>
        </div>
      </nav>

      {/* HERO BANNER */}
      <section className="cdp-hero" data-testid="course-hero">
        <div className="cdp-hero-content">
          <div className="cdp-hero-left">
            <div className="cdp-category-badge" data-testid="category-badge">
              {course.category}
            </div>
            
            <h1 className="cdp-course-title" data-testid="course-title">
              {course.courseName || course.name}
            </h1>
            
            <p className="cdp-course-subtitle">
              {course.description?.substring(0, 150)}...
            </p>

            <div className="cdp-rating-row" data-testid="rating-row">
              <span className="cdp-rating-number">{course.rating?.toFixed(1) || '0.0'}</span>
              <div className="cdp-stars">
                {renderStars(course.rating || 0)}
              </div>
              <span className="cdp-rating-count">({course.ratingsCount || 0} ratings)</span>
              <span className="cdp-dot">•</span>
              <span className="cdp-students-count">{course.studentsEnrolled || 0} students</span>
            </div>

            <div className="cdp-instructor-row">
              <span className="cdp-created-by">Created by </span>
              <a href="#instructor" className="cdp-instructor-link">
                {course.instructor?.name || course.instructor}
              </a>
            </div>

            <div className="cdp-meta-row" data-testid="meta-row">
              <div className="cdp-meta-item">
                <Calendar size={16} />
                <span>Last updated {course.lastUpdated || 'Recently'}</span>
              </div>
              <div className="cdp-meta-item">
                <Globe size={16} />
                <span>{course.language || 'English'}</span>
              </div>
              <div className="cdp-meta-item">
                <Award size={16} />
                <span>{course.certification || 'Certificate'}</span>
              </div>
              <div className="cdp-meta-item">
                <Layers size={16} />
                <span>Mode: {course.mode}</span>
              </div>
            </div>

            <div className="cdp-tags-row">
              {course.isBestseller && (
                <span className="cdp-tag cdp-tag-bestseller">Bestseller</span>
              )}
              {course.tags?.map((tag, i) => (
                <span key={i} className="cdp-tag cdp-tag-outline">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN GRID */}
      <div className="cdp-main-grid">
        <div className="cdp-left-column">
          {/* What You'll Learn */}
          <section className="cdp-what-learn" data-testid="what-you-learn">
            <h2 className="cdp-section-title">What You'll Learn</h2>
            <div className="cdp-learn-grid">
              {(course.whatYouLearn || course.learningOutcomes?.slice(0, 4) || []).map((item, i) => (
                <div key={i} className="cdp-learn-item">
                  <CheckCircle2 size={18} className="cdp-check-icon" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Stats Bar */}
          <section className="cdp-stats-bar" data-testid="stats-bar">
            <div className="cdp-stat-item">
              <Clock size={28} className="cdp-stat-icon" />
              <div className="cdp-stat-number">{course.duration}</div>
              <div className="cdp-stat-label">Duration</div>
            </div>
            <div className="cdp-stat-divider"></div>
            <div className="cdp-stat-item">
              <Layers size={28} className="cdp-stat-icon" />
              <div className="cdp-stat-number">{course.modules?.length || 0}</div>
              <div className="cdp-stat-label">Modules</div>
            </div>
            <div className="cdp-stat-divider"></div>
            <div className="cdp-stat-item">
              <Play size={28} className="cdp-stat-icon" />
              <div className="cdp-stat-number">{calculateTotalLectures()}</div>
              <div className="cdp-stat-label">Lectures</div>
            </div>
            <div className="cdp-stat-divider"></div>
            <div className="cdp-stat-item">
              <Users size={28} className="cdp-stat-icon" />
              <div className="cdp-stat-number">{course.studentsEnrolled || 0}</div>
              <div className="cdp-stat-label">Students</div>
            </div>
          </section>

          {/* Course Content - Only show for Online courses with modules */}
          {isOnline && course.modules && course.modules.length > 0 && (
            <section className="cdp-curriculum" data-testid="curriculum">
              <div className="cdp-curriculum-header">
                <div>
                  <h2 className="cdp-section-title">Course Content</h2>
                  <p className="cdp-curriculum-subtitle">
                    {course.modules.length} sections · {calculateTotalLectures()} lectures · {calculateTotalDuration()} total length
                  </p>
                </div>
                <button 
                  className="cdp-expand-btn" 
                  onClick={toggleAllModules}
                  data-testid="expand-all-btn"
                >
                  {expandedModules.length === course.modules.length ? 'Collapse All Sections' : 'Expand All Sections'}
                </button>
              </div>

              <div className="cdp-accordion">
                {course.modules.map((module, index) => (
                  <div key={module.moduleId || module.id} className="cdp-module" data-testid={`module-${index + 1}`}>
                    <div 
                      className="cdp-module-header"
                      onClick={() => toggleModule(index)}
                    >
                      <div className="cdp-module-header-left">
                        <div className="cdp-module-title">
                          Section {index + 1}: {module.moduleTitle || module.title}
                        </div>
                        {(module.moduleDescription || module.description) && (
                          <div className="cdp-module-description">{module.moduleDescription || module.description}</div>
                        )}
                      </div>
                      <div className="cdp-module-header-right">
                        <span className="cdp-module-count">{module.content?.length || 0} lectures</span>
                        <ChevronDown 
                          size={20} 
                          className={`cdp-chevron ${expandedModules.includes(index) ? 'cdp-chevron-open' : ''}`}
                        />
                      </div>
                    </div>

                    {expandedModules.includes(index) && (
                      <div className="cdp-module-content">
                        {module.content?.map((lecture, lectureIndex) => (
                          <div key={lecture.id} className="cdp-lecture" data-testid={`lecture-m${index + 1}-${lectureIndex}`}>
                            <div className="cdp-lecture-left">
                              <div className={`cdp-lecture-icon ${lecture.isPreview ? 'cdp-lecture-icon-preview' : ''}`}>
                                {lecture.type === 'video' && <Play size={16} />}
                                {lecture.type === 'notes' && <FileText size={16} />}
                                {lecture.type === 'quiz' && <HelpCircle size={16} />}
                              </div>
                              <div className="cdp-lecture-info">
                                <div className="cdp-lecture-title">{lecture.title}</div>
                                {lecture.isPreview && (
                                  <span className="cdp-preview-badge">Free Preview</span>
                                )}
                              </div>
                            </div>
                            <div className="cdp-lecture-right">
                              {!lecture.isPreview && <Lock size={13} className="cdp-lock-icon" />}
                              <span className="cdp-lecture-duration">{lecture.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tabs Section */}
          <section className="cdp-tabs-section" data-testid="course-tabs">
            <div className="cdp-tabs-list">
              <button 
                className={`cdp-tab-trigger ${activeTab === 'overview' ? 'cdp-tab-active' : ''}`}
                onClick={() => setActiveTab('overview')}
                data-testid="tab-overview"
              >
                Overview
              </button>
              <button 
                className={`cdp-tab-trigger ${activeTab === 'notes' ? 'cdp-tab-active' : ''}`}
                onClick={() => setActiveTab('notes')}
                data-testid="tab-notes"
              >
                Notes
              </button>
              <button 
                className={`cdp-tab-trigger ${activeTab === 'reviews' ? 'cdp-tab-active' : ''}`}
                onClick={() => setActiveTab('reviews')}
                data-testid="tab-reviews"
              >
                Reviews
              </button>
            </div>

            <div className="cdp-tabs-content">
              {activeTab === 'overview' && (
                <div className="cdp-tab-panel">
                  {course.prerequisites && (
                    <div className="cdp-overview-section">
                      <h3 className="cdp-overview-title">Requirements</h3>
                      <ul className="cdp-bullet-list">
                        {(Array.isArray(course.prerequisites) ? course.prerequisites : [course.prerequisites]).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="cdp-overview-section">
                    <h3 className="cdp-overview-title">About This Course</h3>
                    <div className="cdp-description" data-testid="course-description">
                      <p>
                        {showFullDescription || course.description?.length <= 380 
                          ? course.description 
                          : `${course.description?.substring(0, 380)}...`}
                      </p>
                      {course.description?.length > 380 && (
                        <button 
                          className="cdp-show-more-btn"
                          onClick={() => setShowFullDescription(!showFullDescription)}
                        >
                          {showFullDescription ? (
                            <>Show less <ChevronUp size={16} /></>
                          ) : (
                            <>Show more <ChevronDown size={16} /></>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {course.syllabusOverview && (
                    <div className="cdp-overview-section">
                      <h3 className="cdp-overview-title">Syllabus Overview</h3>
                      <ul className="cdp-bullet-list cdp-two-col">
                        {(Array.isArray(course.syllabusOverview) ? course.syllabusOverview : [course.syllabusOverview]).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {course.certification && (
                    <div className="cdp-overview-section">
                      <h3 className="cdp-overview-title">Certification</h3>
                      <div className="cdp-cert-pill">
                        <Award size={20} className="cdp-cert-icon" />
                        <span className="cdp-cert-text">{course.certification}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="cdp-tab-panel">
                  <div className="cdp-notes-list">
                    {course.modules?.flatMap(module => 
                      module.content?.filter(item => item.type === 'notes').map(note => ({
                        ...note,
                        moduleName: module.moduleTitle || module.title
                      }))
                    ).filter(Boolean).length > 0 ? (
                      course.modules.flatMap(module => 
                        module.content?.filter(item => item.type === 'notes').map(note => (
                          <div key={note.id} className="cdp-note-item">
                            <div className="cdp-note-left">
                              <div className="cdp-note-icon">
                                <FileText size={20} />
                              </div>
                              <div>
                                <div className="cdp-note-title">{note.title}</div>
                                <div className="cdp-note-module">{module.moduleTitle || module.title}</div>
                              </div>
                            </div>
                            <Lock size={16} className="cdp-note-lock" />
                          </div>
                        ))
                      )
                    ) : (
                      <div className="cdp-empty-state">
                        <FileText size={48} className="cdp-empty-icon" />
                        <p>No notes available yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="cdp-tab-panel">
                  <div className="cdp-reviews-overview">
                    <div className="cdp-reviews-left">
                      <div className="cdp-reviews-rating">{course.rating?.toFixed(1) || '0.0'}</div>
                      <div className="cdp-reviews-stars">
                        {renderStars(course.rating || 0)}
                      </div>
                      <div className="cdp-reviews-caption">Course Rating</div>
                    </div>
                    <div className="cdp-reviews-right">
                      {[5, 4, 3, 2, 1].map(star => (
                        <div key={star} className="cdp-rating-bar-row">
                          <span className="cdp-rating-label">{star}★</span>
                          <div className="cdp-rating-bar">
                            <div className="cdp-rating-fill" style={{ width: '0%' }}></div>
                          </div>
                          <span className="cdp-rating-percent">0%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(!course.reviews || course.reviews.length === 0) && (
                    <div className="cdp-empty-reviews">
                      <Star size={48} className="cdp-empty-icon" />
                      <p>No reviews yet — be the first to review this course after enrolling.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Instructor Section */}
          <section className="cdp-instructor-section" id="instructor" data-testid="instructor-section">
            <h2 className="cdp-section-title">Your Instructor</h2>
            <div className="cdp-instructor-card">
              <div className="cdp-instructor-avatar">
                {course.instructor?.avatar ? (
                  <img src={course.instructor.avatar} alt={course.instructor.name} />
                ) : (
                  <div className="cdp-avatar-placeholder">
                    {(course.instructor?.name || course.instructor || 'I').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="cdp-instructor-info">
                <h3 className="cdp-instructor-name">{course.instructor?.name || course.instructor}</h3>
                <p className="cdp-instructor-title">{course.instructor?.title || 'Course Instructor'}</p>
                <div className="cdp-instructor-stats">
                  <Star size={16} fill="#F59E0B" stroke="#F59E0B" />
                  <span>{course.instructor?.rating || '4.9'} Instructor Rating</span>
                  <span>·</span>
                  <span>{course.instructor?.studentsCount || '1,240'} Students</span>
                  <span>·</span>
                  <span>{course.instructor?.coursesCount || '4'} Courses</span>
                </div>
                {course.instructor?.bio && (
                  <p className="cdp-instructor-bio">{course.instructor.bio}</p>
                )}
                <a href="#" className="cdp-instructor-link">View Full Profile →</a>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN - STICKY SIDEBAR */}
        <div className="cdp-right-column">
          <div className="cdp-sidebar" data-testid="sticky-sidebar">
            <div className="cdp-sidebar-preview">
              {course.thumbnailUrl ? (
                <img src={course.thumbnailUrl} alt={course.courseName} className="cdp-preview-img" />
              ) : (
                <div className="cdp-preview-placeholder"></div>
              )}
              <div className="cdp-preview-overlay">
                <div className="cdp-play-button">
                  <Play size={24} fill="currentColor" />
                </div>
                <span className="cdp-preview-text">Preview this course</span>
              </div>
            </div>

            <div className="cdp-sidebar-body">
              <div className="cdp-price-row">
                <span className="cdp-price-current">₹{course.fees?.toLocaleString('en-IN') || '0'}</span>
                {course.originalFees && course.originalFees > course.fees && (
                  <>
                    <span className="cdp-price-original">₹{course.originalFees.toLocaleString('en-IN')}</span>
                    <span className="cdp-price-discount">{discountPercent}% off</span>
                  </>
                )}
              </div>

              {!isFree && (
                <div className="cdp-countdown">
                  <Clock size={16} />
                  <span>2 days left at this price!</span>
                </div>
              )}

              {isEnrolled ? (
                <button 
                  className="cdp-enroll-btn cdp-btn-enrolled" 
                  onClick={handleStartLearning}
                  data-testid="continue-learning-btn"
                >
                  Continue Learning →
                </button>
              ) : (
                <>
                  <button 
                    className="cdp-enroll-btn" 
                    onClick={handleEnrollClick}
                    data-testid="enroll-now-btn"
                  >
                    {isFree ? 'Enroll for Free' : 'Enroll Now'}
                  </button>
                  {!isFree && (
                    <button 
                      className="cdp-buy-btn" 
                      onClick={handleEnrollClick}
                      data-testid="buy-now-btn"
                    >
                      Buy Now — ₹{course.fees?.toLocaleString('en-IN')}
                    </button>
                  )}
                </>
              )}

              <div className="cdp-guarantee">
                <Shield size={16} />
                <span>30-Day Money-Back Guarantee</span>
              </div>

              <div className="cdp-separator"></div>

              <div className="cdp-includes">
                <h4 className="cdp-includes-title">This course includes:</h4>
                <div className="cdp-includes-list">
                  <div className="cdp-include-item">
                    <Play size={18} />
                    <span>42 hours on-demand video</span>
                  </div>
                  <div className="cdp-include-item">
                    <FileText size={18} />
                    <span>15 downloadable resources</span>
                  </div>
                  <div className="cdp-include-item">
                    <Globe2 size={18} />
                    <span>Access on mobile & desktop</span>
                  </div>
                  <div className="cdp-include-item">
                    <Clock size={18} />
                    <span>Full lifetime access</span>
                  </div>
                  <div className="cdp-include-item">
                    <Award size={18} />
                    <span>Certificate of completion</span>
                  </div>
                  <div className="cdp-include-item">
                    <HelpCircle size={18} />
                    <span>Assignments & quizzes</span>
                  </div>
                </div>
              </div>

              <div className="cdp-separator"></div>

              <div className="cdp-share">
                <h4 className="cdp-share-title">Share this course:</h4>
                <div className="cdp-share-buttons">
                  <button className="cdp-share-btn" data-testid="share-facebook">
                    <Share2 size={18} />
                  </button>
                  <button className="cdp-share-btn" data-testid="share-twitter">
                    <Share2 size={18} />
                  </button>
                  <button className="cdp-share-btn" data-testid="share-linkedin">
                    <Share2 size={18} />
                  </button>
                  <button 
                    className="cdp-share-btn" 
                    onClick={copyToClipboard}
                    data-testid="share-copy"
                  >
                    <LinkIcon size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="cdp-mobile-bar" data-testid="mobile-sticky-bar">
        <div className="cdp-mobile-price">
          <div className="cdp-mobile-price-current">₹{course.fees?.toLocaleString('en-IN') || '0'}</div>
          {course.originalFees && course.originalFees > course.fees && (
            <div className="cdp-mobile-price-original">₹{course.originalFees.toLocaleString('en-IN')}</div>
          )}
        </div>
        <button 
          className="cdp-mobile-enroll-btn" 
          onClick={handleEnrollClick}
          data-testid="mobile-enroll-btn"
        >
          {isEnrolled ? 'Continue Learning' : (isFree ? 'Enroll for Free' : 'Enroll Now')}
        </button>
      </div>

      {/* Payment Option Modal for On-Campus Courses */}
      {showPaymentOptionModal && (
        <PaymentOptionModal
          course={course}
          onClose={() => setShowPaymentOptionModal(false)}
          onPayHere={handlePayHere}
          onPayAtInstitute={handlePayAtInstitute}
        />
      )}

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
