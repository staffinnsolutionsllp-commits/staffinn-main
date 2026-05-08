import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import PaymentModal from '../Dashboard/PaymentModal';
import PaymentOptionModal from '../Dashboard/PaymentOptionModal';
import { 
  GraduationCap, ChevronRight, Bell, Calendar, Globe, Award, Layers, 
  CheckCircle2, Clock, Play, FileText, HelpCircle, Lock, Users, 
  Star, ChevronDown, Facebook, Twitter, Linkedin, Link as LinkIcon, Shield,
  Globe2
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

      {/* Continue in next part... */}
      
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
