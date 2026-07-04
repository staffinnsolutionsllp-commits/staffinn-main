/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import './InstitutePage.css';
import CourseCard from '../common/CourseCard';
import '../Dashboard/Categories.css';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaStar, FaStarHalfAlt, FaRegStar, FaFilter, FaSearch, FaGraduationCap, FaBriefcase, FaHandshake, FaChalkboardTeacher, FaCalendarAlt, FaUsers, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

const InstitutePage = ({ isLoggedIn, onShowLogin }) => {
  const { id } = useParams(); // Get the institute ID from URL params
  const navigate = useNavigate();

  // Helper function to check if URL is a video
  const isVideoUrl = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.mpeg', '.mov', '.avi', '.webm', '.m4v', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };
  const [activeTab, setActiveTab] = useState('courses');
  const [courseTypeFilter, setCourseTypeFilter] = useState('online'); // Changed default to 'online'
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    duration: 'all',
    certification: 'all'
  });
  const [instituteData, setInstituteData] = useState(null);
  const [placementData, setPlacementData] = useState(null);
  const [instituteDashboardStats, setInstituteDashboardStats] = useState(null);
  const [industryCollabData, setIndustryCollabData] = useState(null);
  const [eventNewsData, setEventNewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNewsItem, setSelectedNewsItem] = useState(null);
  const [showNewsModal, setShowNewsModal] = useState(false);
  // Update newReview state to use 'review' field (not 'comment') and add title
  const [newReview, setNewReview] = useState({
    userType: 'Student',
    rating: 5,
    title: '',
    review: ''
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [courses, setCourses] = useState([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollmentStatuses, setEnrollmentStatuses] = useState({});
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showEnrollmentSuccess, setShowEnrollmentSuccess] = useState(false);
  const [governmentSchemes, setGovernmentSchemes] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [awards, setAwards] = useState([]);
  const [campusTour, setCampusTour] = useState([]);
  const [campusTourLightbox, setCampusTourLightbox] = useState(null); // { type, url, fileName }





  const placements = {
    statistics: {
      totalPlaced: 850,
      placementRate: 92,
      avgSalary: '6.2 LPA',
      highestSalary: '24 LPA'
    },
    recentPlacements: [
      { student: 'Rajat Sharma', course: 'Full Stack Development', company: 'Microsoft', role: 'Software Engineer' },
      { student: 'Priya Patel', course: 'Data Science', company: 'Amazon', role: 'Data Analyst' },
      { student: 'Akash Singh', course: 'Digital Marketing', company: 'Ogilvy', role: 'Digital Marketing Specialist' },
      { student: 'Neha Verma', course: 'Industrial Automation', company: 'Siemens', role: 'Automation Engineer' },
    ],
    topCompanies: ['Microsoft', 'Google', 'Amazon', 'TCS', 'Infosys', 'Wipro', 'IBM', 'Accenture']
  };





  const events = [
    // New staff verified events
    { id: 0, name: 'Industry 4.0 Masterclass', date: 'April 20, 2023', details: 'Special session with industry leaders on upcoming technology trends', verified: true },
    { id: 101, name: 'Campus Hackathon 2023', date: 'May 5, 2023', details: '24-hour coding challenge with prizes worth ₹2 Lakhs', verified: true },
    // Original events
    { id: 1, name: 'Annual Job Fair 2023', date: 'June 15, 2023', details: 'Over 50 companies participating' },
    { id: 2, name: 'Industry Expert Workshop', date: 'July 5, 2023', details: 'Web 3.0 and Blockchain technologies' },
    { id: 3, name: 'Admission Deadline', date: 'July 30, 2023', details: 'Last date for Fall 2023 batch registration' },
  ];

  const [allReviews, setAllReviews] = useState([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsAverage, setReviewsAverage] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsOffset, setReviewsOffset] = useState(0);
  const [reviewsHasMore, setReviewsHasMore] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await apiService.getProfile();
        if (response.success) {
          setUserProfile(response.data);
        }
      }
    };
    fetchUserProfile();
  }, []);
  
  const isStaffinnPartner = () => {
    return userProfile?.role === 'institute' && userProfile?.instituteType === 'staffinn_partner';
  };
  
  const isNormalInstitute = () => {
    return userProfile?.role === 'institute' && userProfile?.instituteType !== 'staffinn_partner';
  };
  
  // Fetch institute data based on ID
  useEffect(() => {
    if (id) {
      fetchInstitute();
      fetchPlacementData();
      fetchInstituteDashboardStats();
      fetchIndustryCollabData();
      fetchEventNewsData();
      fetchCourses();
      fetchGovernmentSchemes();
      fetchAwards();
      fetchCampusTour();
      loadInstituteReviews(0);
    }
  }, [id]);
  
  // Add a periodic refresh for placement data and courses to catch updates
  useEffect(() => {
    if (id && activeTab === 'placements') {
      const interval = setInterval(() => {
        fetchPlacementData();
      }, 30000); // Refresh every 30 seconds when on placements tab
      
      return () => clearInterval(interval);
    }
  }, [id, activeTab]);
  
  // Refresh courses when on courses tab
  useEffect(() => {
    if (id && activeTab === 'courses') {
      const interval = setInterval(() => {
        fetchCourses();
      }, 30000); // Refresh every 30 seconds when on courses tab
      
      return () => clearInterval(interval);
    }
  }, [id, activeTab]);

  const fetchInstitute = async () => {
    try {
      setLoading(true);
      const response = await apiService.getInstituteById(id);
      
      if (response.success && response.data) {
        // Transform API data to match component expectations
        const transformedData = {
          id: response.data.instituteId,
          name: response.data.instituteName,
          location: response.data.address,
          address: response.data.address,
          pincode: response.data.pincode,
          phone: response.data.phone,
          email: response.data.email,
          website: response.data.website,
          experience: response.data.experience,
          badges: response.data.badges || [],
          categories: response.data.categories || [], // Add categories from API
          profileImage: response.data.profileImage,
          bannerImage: response.data.bannerImage || null,
          isBrainaryVerified: response.data.isLive || false
        };
        setInstituteData(transformedData);
      } else {
        // Fallback to sample data if API fails
        setInstituteData({
          id: id,
          name: 'Sample Institute',
          location: 'Sample Location',
          address: 'Sample Address',
          phone: '+91 12345 67890',
          email: 'info@sample.edu',
          website: 'www.sample.edu',
          experience: 'Sample Experience',
          badges: ['Sample Badge'],
          isBrainaryVerified: false
        });
      }
    } catch (error) {
      console.error('Error fetching institute:', error);
      // Set fallback data on error
      setInstituteData({
        id: id,
        name: 'Institute Not Found',
        location: 'Location Not Available',
        address: 'Address Not Available',
        phone: 'Phone Not Available',
        email: 'Email Not Available',
        website: 'Website Not Available',
        experience: 'Experience Not Available',
        badges: [],
        isBrainaryVerified: false
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlacementData = async () => {
    try {
      const response = await apiService.getPublicPlacementSection(id);
      if (response.success && response.data) {
        setPlacementData(response.data);
      }
    } catch (error) {
      console.error('Error fetching placement data:', error);
    }
  };

  const fetchInstituteDashboardStats = async () => {
    try {
      const response = await apiService.getPublicDashboardStats(id);
      if (response.success && response.data) {
        setInstituteDashboardStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching institute dashboard stats:', error);
    }
  };

  const fetchIndustryCollabData = async () => {
    try {
      const response = await apiService.getPublicIndustryCollaborations(id);
      if (response.success && response.data) {
        setIndustryCollabData(response.data);
      }
    } catch (error) {
      console.error('Error fetching industry collaboration data:', error);
    }
  };

  const fetchEventNewsData = async () => {
    try {
      const response = await apiService.getPublicEventNews(id);
      if (response.success && response.data) {
        setEventNewsData(response.data);
      }
    } catch (error) {
      console.error('Error fetching events/news data:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await apiService.getPublicCourses(id);
      if (response.success && response.data) {
        setCourses(response.data);
        
        // Check enrollment status for each course if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
          const statuses = {};
          for (const course of response.data) {
            const courseId = course.coursesId || course.instituteCourseID;
            if (courseId) {
              const statusResponse = await apiService.checkEnrollmentStatus(courseId);
              if (statusResponse.success) {
                statuses[courseId] = {
                  enrolled: statusResponse.enrolled,
                  hasStarted: statusResponse.hasStarted,
                  progressPercentage: statusResponse.progressPercentage
                };
              }
            }
          }
          setEnrollmentStatuses(statuses);
        }
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchGovernmentSchemes = async () => {
    try {
      const response = await apiService.getPublicInstituteGovtSchemes(id);
      if (response.success && response.data) {
        setGovernmentSchemes(response.data);
      } else {
        setGovernmentSchemes([]);
      }
    } catch (error) {
      console.error('Error fetching government schemes:', error);
      setGovernmentSchemes([]);
    }
  };

  const fetchAwards = async () => {
    try {
      const response = await apiService.getPublicAwards(id);
      if (response.success && response.data) {
        setAwards(response.data);
      }
    } catch (error) {
      console.error('Error fetching awards:', error);
    }
  };

  const fetchCampusTour = async () => {
    try {
      const response = await apiService.getPublicCampusTour(id);
      if (response.success && response.data) {
        setCampusTour(response.data);
      }
    } catch (error) {
      console.error('Error fetching campus tour:', error);
    }
  };

  // Enroll Now — always redirect to CourseLearningPage which handles
  // all payment gates (PaymentOptionModal, Razorpay, Pay at Institute, etc.)
  const handleEnrollInCourse = (courseId) => {
    if (!courseId) {
      alert('Course ID is missing. Please try again.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to enroll in courses');
      return;
    }
    navigate(`/course-learning/${courseId}`);
  };

  const handleAccessCourse = async (courseId) => {
    try {
      // Redirect to course learning page
      navigate(`/course-learning/${courseId}`);
    } catch (error) {
      console.error('Error navigating to course:', error);
    }
  };

  const handleTakeQuiz = async (moduleId) => {
    try {
      const quizResponse = await apiService.getModuleQuiz(moduleId);
      if (quizResponse.success && quizResponse.data) {
        setSelectedQuiz(quizResponse.data);
        setQuizAnswers({});
        setQuizResults(null);
        setShowQuizModal(true);
      } else {
        alert('No quiz available for this module');
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      alert('Failed to load quiz');
    }
  };

  const handleQuizSubmit = async () => {
    try {
      const response = await apiService.submitQuiz(selectedQuiz.quizId, quizAnswers);
      if (response.success) {
        setQuizResults(response.data);
        alert(`Quiz completed! Score: ${response.data.score}% (${response.data.correctAnswers}/${response.data.totalQuestions})`);
      } else {
        alert(response.message || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz');
    }
  };

  const getEnrollmentButtonText = (courseId) => {
    const status = enrollmentStatuses[courseId];
    if (!status || !status.enrolled) {
      return 'Enroll Now';
    }
    if (status.hasStarted) {
      return 'Continue Learning';
    }
    return 'Start Learning';
  };

  const getEnrollmentButtonAction = (courseId) => {
    const status = enrollmentStatuses[courseId];
    if (!status || !status.enrolled) {
      return () => handleEnrollInCourse(courseId);
    }
    return () => handleAccessCourse(courseId);
  };

  // Filter courses based on search and filter criteria
  const filteredCourses = courses.filter(course => {
    const courseName = course.courseName || course.name || '';
    return (
      courseName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filters.category === 'all' || course.category === filters.category) &&
      (filters.duration === 'all' || (course.duration && course.duration.startsWith(filters.duration))) &&
      (filters.certification === 'all' || course.certification === filters.certification)
    );
  });

  // Load reviews for this institute from the backend
  const loadInstituteReviews = async (offset = 0) => {
    if (!id) return;
    try {
      setReviewsLoading(true);
      const response = await apiService.getInstituteReviews(id, 10, offset);
      if (response.success && response.data) {
        const { reviews, total, averageRating, hasMore } = response.data;
        if (offset === 0) {
          setAllReviews(reviews || []);
        } else {
          setAllReviews(prev => [...prev, ...(reviews || [])]);
        }
        setReviewsTotal(total || 0);
        setReviewsAverage(averageRating || 0);
        setReviewsHasMore(hasMore || false);
        setReviewsOffset(offset);
      }
    } catch (error) {
      console.error('Error loading institute reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Real review submission — saves to DynamoDB
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.review.trim()) {
      alert('Please write your review before submitting.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to submit a review.');
      if (onShowLogin) onShowLogin();
      return;
    }
    try {
      setReviewSubmitting(true);
      const response = await apiService.addInstituteReview(
        id,
        newReview.rating,
        newReview.userType,
        newReview.title,
        newReview.review
      );
      if (response.success) {
        setNewReview({ userType: 'Student', rating: 5, title: '', review: '' });
        setShowReviewForm(false);
        // Reload reviews from scratch to get fresh data + updated average
        await loadInstituteReviews(0);
      } else {
        alert(response.message || 'Failed to submit review. Please try again.');
      }
    } catch (error) {
      console.error('Review submit error:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Render stars based on rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.25 && rating % 1 < 0.75;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="star-filled" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="star-filled" />);
    }
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="star-empty" />);
    }
    return stars;
  };

  // Function to scroll to courses section
  const scrollToCourses = () => {
    setActiveTab('courses');
    // Small delay to ensure tab content is rendered before scrolling
    setTimeout(() => {
      const coursesSection = document.querySelector('.courses-section');
      if (coursesSection) {
        coursesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (loading) {
    return <div className="loading">Loading institute information...</div>;
  }

  return (
    <div className="institute-page">


      {/* Premium Hero Section */}
      <header
        className={`ip-hero ${instituteData?.bannerImage ? 'ip-hero--has-banner' : 'ip-hero--no-banner'}`}
        style={instituteData?.bannerImage ? { backgroundImage: `url(${instituteData.bannerImage})` } : {}}
      >
        {/* Gradient overlay */}
        <div className="ip-hero-overlay" />

        <div className="ip-hero-inner">
          {/* Left: logo + name + pills */}
          <div className="ip-hero-identity">
            <div className="ip-hero-logo">
              <img
                src={instituteData?.profileImage || `https://via.placeholder.com/120?text=${encodeURIComponent(instituteData?.name?.charAt(0) || 'I')}`}
                alt="Institute Logo"
                data-institute-image
              />
            </div>
            <div className="ip-hero-name-block">
              <div className="ip-hero-name-row">
                <h1 className="ip-hero-name">{instituteData?.name}</h1>
                {instituteData?.isBrainaryVerified && (
                  <span className="ip-hero-verified" title="Verified Institute">
                    <FaCheckCircle />
                  </span>
                )}
              </div>
              {/* Badges + Categories */}
              {((instituteData?.badges?.length > 0) || (instituteData?.categories?.length > 0)) && (
                <div className="ip-hero-pills">
                  {instituteData?.badges?.map((badge, i) => (
                    <span key={i} className="ip-pill ip-pill--badge">{badge}</span>
                  ))}
                  {instituteData?.categories?.map((cat, i) => (
                    <span key={`c-${i}`} className="ip-pill ip-pill--category">{cat}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: info card */}
          <div className="ip-hero-card">
            <div className="ip-hero-info-grid">
              <div className="ip-hero-info-item">
                <FaMapMarkerAlt className="ip-hero-info-icon" />
                <div>
                  <span className="ip-hero-info-label">Address</span>
                  <span className="ip-hero-info-value">
                    {instituteData?.address}{instituteData?.pincode ? `, ${instituteData.pincode}` : ''}
                  </span>
                </div>
              </div>
              <div className="ip-hero-info-item">
                <FaPhone className="ip-hero-info-icon" />
                <div>
                  <span className="ip-hero-info-label">Phone</span>
                  <span className="ip-hero-info-value">{instituteData?.phone || 'Not Available'}</span>
                </div>
              </div>
              <div className="ip-hero-info-item">
                <FaGlobe className="ip-hero-info-icon" />
                <div>
                  <span className="ip-hero-info-label">Website</span>
                  {instituteData?.website ? (
                    <a
                      href={instituteData.website.startsWith('http') ? instituteData.website : `https://${instituteData.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ip-hero-info-value ip-hero-info-link"
                    >
                      {instituteData.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                    </a>
                  ) : (
                    <span className="ip-hero-info-value">Not Available</span>
                  )}
                </div>
              </div>
              <div className="ip-hero-info-item">
                <FaBriefcase className="ip-hero-info-icon" />
                <div>
                  <span className="ip-hero-info-label">Experience</span>
                  <span className="ip-hero-info-value">
                    {instituteData?.experience ? `${instituteData.experience}+ Years` : 'Not Available'}
                  </span>
                </div>
              </div>
            </div>
            <div className="ip-hero-cta">
              <button className="ip-hero-btn ip-hero-btn--primary" onClick={scrollToCourses}>
                View Courses
              </button>
              <button
                className="ip-hero-btn ip-hero-btn--secondary"
                onClick={() => {
                  if (instituteData?.email) {
                    window.open(`mailto:${instituteData.email}`, '_self');
                  } else {
                    alert('This institute has not provided an email address.');
                  }
                }}
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="institute-tabs">
        <button 
          className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <FaGraduationCap /> Courses & Programs
        </button>
        <button 
          className={`tab-button ${activeTab === 'placements' ? 'active' : ''}`}
          onClick={() => setActiveTab('placements')}
        >
          <FaBriefcase /> Placements
        </button>

        <button 
          className={`tab-button ${activeTab === 'collaborations' ? 'active' : ''}`}
          onClick={() => setActiveTab('collaborations')}
        >
          <FaHandshake /> Industry Collaborations
        </button>
        <button 
          className={`tab-button ${activeTab === 'government' ? 'active' : ''}`}
          onClick={() => setActiveTab('government')}
        >
          <FaChalkboardTeacher /> Government Schemes
        </button>
        <button 
          className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <FaCalendarAlt /> Events & News
        </button>
        <button 
          className={`tab-button ${activeTab === 'awards' ? 'active' : ''}`}
          onClick={() => setActiveTab('awards')}
        >
          🏆 Awards and Recognition
        </button>
        {campusTour.length > 0 && (
          <button
            className={`tab-button ${activeTab === 'campusTour' ? 'active' : ''}`}
            onClick={() => setActiveTab('campusTour')}
          >
            🏫 Campus Tour
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <main className="institute-content">
        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <section className="courses-section">
            <div className="section-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <h2>Courses & Training Programs</h2>
                  <p>Industry-relevant courses designed by experts to prepare you for the job market</p>
                </div>
                
                {/* Course Type Toggle */}
                <div className="course-type-toggle">
                  <button 
                    className={`toggle-btn ${courseTypeFilter === 'online' ? 'active' : ''}`}
                    onClick={() => setCourseTypeFilter('online')}
                  >
                    Online
                  </button>
                  <button 
                    className={`toggle-btn ${courseTypeFilter === 'on-campus' ? 'active' : ''}`}
                    onClick={() => setCourseTypeFilter('on-campus')}
                  >
                    On-Campus
                  </button>
                </div>
              </div>
            </div>

            <div className="search-filter-container">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search courses..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-container">
                <FaFilter className="filter-icon" />
                <select 
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                >
                  <option value="all">All Categories</option>
                  <option value="IT">IT</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Management">Management</option>
                  <option value="Vocational">Vocational Training</option>
                </select>
                <select 
                  value={filters.duration}
                  onChange={(e) => setFilters({...filters, duration: e.target.value})}
                >
                  <option value="all">All Durations</option>
                  <option value="2">2 Months</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="8">8+ Months</option>
                </select>
                <select 
                  value={filters.certification}
                  onChange={(e) => setFilters({...filters, certification: e.target.value})}
                >
                  <option value="all">All Certifications</option>
                  <option value="Government-Recognized">Government-Recognized</option>
                  <option value="Industry-Specific">Industry-Specific</option>
                </select>
              </div>
            </div>

            {/* Conditional rendering based on toggle */}
            {courseTypeFilter === 'online' && (
              <div className="course-category-section">
                <h3 className="course-category-title">Online Courses ({filteredCourses.filter(course => course.mode === 'Online').length})</h3>
                <div className="courses-grid">
                  {filteredCourses.filter(course => course.mode === 'Online').length > 0 ? (
                    filteredCourses.filter(course => course.mode === 'Online').map(course => {
                      const courseId = course.coursesId || course.instituteCourseID;
                      return (
                        <CourseCard
                          key={courseId}
                          course={course}
                          onViewCourse={() => {
                            if (!isLoggedIn) {
                              onShowLogin();
                              return;
                            }
                            navigate(`/course-learning/${courseId}`);
                          }}
                        />
                      );
                    })
                  ) : (
                    <div className="no-courses">
                      <p>No online courses available at the moment.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {courseTypeFilter === 'on-campus' && (
              <div className="course-category-section">
                <h3 className="course-category-title">On-Campus Courses ({filteredCourses.filter(course => course.mode === 'On Campus' || course.mode === 'Offline').length})</h3>
                <div className="courses-grid">
                  {filteredCourses.filter(course => course.mode === 'On Campus' || course.mode === 'Offline').length > 0 ? (
                    filteredCourses.filter(course => course.mode === 'On Campus' || course.mode === 'Offline').map(course => {
                      const courseId = course.coursesId || course.instituteCourseID;
                      return (
                        <CourseCard
                          key={courseId}
                          course={course}
                          onViewCourse={() => {
                            if (!isLoggedIn) {
                              onShowLogin();
                              return;
                            }
                            navigate(`/course-learning/${courseId}`);
                          }}
                        />
                      );
                    })
                  ) : (
                    <div className="no-courses">
                      <p>No on-campus courses available at the moment.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {courses.length === 0 && (
              <div className="no-courses">
                <p>No courses available at the moment. Please check back later.</p>
              </div>
            )}
          </section>
        )}

        {/* Placements Tab */}
        {activeTab === 'placements' && (
          <section className="placements-section">
            <div className="section-header">
              <h2>Placement & Hiring Success</h2>
              <p>Our track record of successfully placing students in top companies</p>
            </div>

            <div className="placement-stats-container">
              <div className="stat-card">
                <div className="stat-value">{instituteDashboardStats?.placedStudents || placements.statistics.totalPlaced}</div>
                <div className="stat-label">Students Placed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{instituteDashboardStats?.placementRate || placements.statistics.placementRate}%</div>
                <div className="stat-label">Placement Rate</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{placementData?.averageSalary || placements.statistics.avgSalary}</div>
                <div className="stat-label">Average Salary</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{placementData?.highestPackage || placements.statistics.highestSalary}</div>
                <div className="stat-label">Highest Package</div>
              </div>
            </div>

            <div className="placement-sections">
              <div className="top-companies">
                <h3>Top Hiring Companies</h3>
                <div className="company-logos">
                  {placementData?.topHiringCompanies && placementData.topHiringCompanies.length > 0 ? (
                    placementData.topHiringCompanies.map((company, index) => {
                      // Check if logo is a valid URL string
                      const validLogo = company.logo && typeof company.logo === 'string' && company.logo.includes('http') ? company.logo : null;
                      const placeholderUrl = `https://via.placeholder.com/100?text=${encodeURIComponent(company.name || 'Company')}`;
                      
                      return (
                        <div key={index} className="company-logo">
                          <img 
                            src={validLogo || placeholderUrl} 
                            alt={company.name || 'Company Logo'}
                            onError={(e) => e.target.src = placeholderUrl}
                          />
                          <span>{company.name}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-section">
                      <p>No hiring companies data available yet.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="recent-placements">
                <h3>Recent Placement Success</h3>
                <div className="placement-list">
                  {placementData?.recentPlacementSuccess && placementData.recentPlacementSuccess.length > 0 ? (
                    placementData.recentPlacementSuccess.map((placement, index) => {
                      // Check if photo is a valid URL string
                      const validPhoto = placement.photo && typeof placement.photo === 'string' && placement.photo.includes('http') ? placement.photo : null;
                      const placeholderUrl = `https://via.placeholder.com/50?text=${encodeURIComponent(placement.name?.charAt(0) || 'S')}`;
                      
                      return (
                        <div key={index} className="placement-item">
                          <div className="student-profile">
                            <div className="student-avatar">
                              <img 
                                src={validPhoto || placeholderUrl} 
                                alt={placement.name || 'Student Photo'}
                                onError={(e) => e.target.src = placeholderUrl}
                              />
                            </div>
                            <div className="student-details">
                              <h4>{placement.name}</h4>
                            </div>
                          </div>
                          <div className="placement-details">
                            <div className="company-name">{placement.company}</div>
                            <div className="job-role">{placement.position}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-section">
                      <p>No recent placement success stories available yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}



        {/* Industry Collaborations Tab */}
        {activeTab === 'collaborations' && (
          <section className="collaborations-section">
            <div className="section-header">
              <h2>Industry Collaborations & Recruiter Partnerships</h2>
              <p>Our strong network of industry partners and collaborations</p>
            </div>

            {/* Collaboration Cards */}
            <div className="collaboration-grid">
              {industryCollabData?.collaborationCards && industryCollabData.collaborationCards.length > 0 ? (
                industryCollabData.collaborationCards.map((card, index) => {
                  const validImage = card.image && typeof card.image === 'string' && card.image.includes('http') ? card.image : null;
                  const placeholderUrl = `https://via.placeholder.com/150?text=${encodeURIComponent(card.company || 'Company')}`;
                  
                  return (
                    <div key={index} className="collaboration-card">
                      <div className="company-logo">
                        <img 
                          src={validImage || placeholderUrl} 
                          alt={card.company || 'Company Logo'}
                          onError={(e) => e.target.src = placeholderUrl}
                        />
                      </div>
                      <div className="collaboration-details">
                        <h3>{card.title || card.company}</h3>
                        <div className="collaboration-company">{card.company}</div>
                        <div className="collaboration-type">{card.type}</div>
                        <p>{card.description}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-section">
                  <p>No collaboration partnerships available yet.</p>
                </div>
              )}
            </div>

            {/* MOU Section */}
            <div className="mou-section">
              <h3>Memorandums of Understanding (MOUs)</h3>
              <div className="mou-list">
                {industryCollabData?.mouItems && industryCollabData.mouItems.length > 0 ? (
                  industryCollabData.mouItems.map((mou, index) => {
                    const validPdf = mou.pdfUrl && typeof mou.pdfUrl === 'string' && mou.pdfUrl.includes('http') ? mou.pdfUrl : null;
                    
                    return (
                      <div key={index} className="mou-item">
                        <div className="mou-icon">📄</div>
                        <div className="mou-details">
                          <h4>{mou.title}</h4>
                          <p>{mou.description}</p>
                          {validPdf ? (
                            <a 
                              href={validPdf} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mou-download-link"
                              style={{
                                display: 'inline-block',
                                marginTop: '10px',
                                padding: '8px 16px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '4px',
                                fontSize: '14px',
                                cursor: 'pointer'
                              }}
                              onClick={(e) => {
                                // Let the default behavior handle the link
                              }}
                            >
                              📄 View MOU Document
                            </a>
                          ) : (
                            <span style={{color: '#666', fontSize: '14px', fontStyle: 'italic'}}>
                              Document not available
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-section">
                    <p>No MOU documents available yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="recruiter-cta">
              <div className="cta-content">
                <h3>Looking to hire skilled professionals?</h3>
                <p>Partner with us to access our pool of trained and industry-ready talent</p>
              </div>
              <div className="cta-buttons">
                <button className="cta-button primary">Hire from Our Institute</button>
                <button className="cta-button secondary">Schedule a Campus Drive</button>
              </div>
            </div>
          </section>
        )}

        {/* Government Schemes Tab */}
        {activeTab === 'government' && (
          <section className="government-schemes-section">
            <div className="section-header">
              <h2>Government Schemes & Skill Training Programs</h2>
              <p>Government-backed education and employment schemes available at our institute</p>
            </div>

            <div className="schemes-grid">
              {governmentSchemes && governmentSchemes.length > 0 ? (
                governmentSchemes.map(scheme => (
                  <div key={scheme.instituteSchemeId} className="scheme-card">
                    <div className="scheme-header">
                      <h3>{scheme.schemeName}</h3>
                    </div>
                    <div className="scheme-content">
                      <p>{scheme.description}</p>
                      {scheme.link && (
                        <a 
                          href={scheme.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="scheme-button"
                        >
                          Learn More
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-section">
                  <p>No government schemes available at this institute yet.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Awards and Recognition Tab */}
        {activeTab === 'awards' && (
          <section className="awards-section">
            <div className="section-header">
              <h2>Awards and Recognition</h2>
              <p>Celebrating our achievements and recognitions</p>
            </div>

            <div className="awards-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
              {awards && awards.length > 0 ? (
                awards.map(award => (
                  <div key={award.awardId} className="award-card" style={{border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                    <h3 style={{marginBottom: '15px', color: '#2c3e50'}}>{award.title}</h3>
                    <p style={{color: '#6c757d', marginBottom: '15px', lineHeight: '1.6'}}>{award.description}</p>
                    {award.photos && award.photos.length > 0 && (
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px'}}>
                        {award.photos.map((photo, index) => (
                          <img 
                            key={index}
                            src={photo} 
                            alt={`${award.title} ${index + 1}`}
                            style={{width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer'}}
                            onClick={() => window.open(photo, '_blank')}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-section">
                  <p>No awards and recognitions available yet.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Campus Tour Tab */}
        {activeTab === 'campusTour' && campusTour.length > 0 && (
          <section className="ct-section">
            <div className="section-header">
              <h2>Campus Tour</h2>
              <p>Explore our campus — facilities, labs, classrooms and more</p>
            </div>

            <div className="ct-gallery">
              {campusTour.map((item) => (
                <div
                  key={item.id}
                  className={`ct-card ${item.type === 'video' ? 'ct-card--video' : 'ct-card--image'}`}
                  onClick={() => setCampusTourLightbox(item)}
                >
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      className="ct-media"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.fileName || 'Campus'}
                      className="ct-media"
                      loading="lazy"
                    />
                  )}
                  <div className="ct-overlay">
                    {item.type === 'video' ? (
                      <div className="ct-play-btn">▶</div>
                    ) : (
                      <div className="ct-zoom-btn">🔍</div>
                    )}
                  </div>
                  {item.type === 'video' && (
                    <span className="ct-type-tag">🎬 Video</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Campus Tour Lightbox */}
        {campusTourLightbox && (
          <div className="ct-lightbox-overlay" onClick={() => setCampusTourLightbox(null)}>
            <div className="ct-lightbox-box" onClick={(e) => e.stopPropagation()}>
              <button className="ct-lightbox-close" onClick={() => setCampusTourLightbox(null)}>✕</button>
              {campusTourLightbox.type === 'video' ? (
                <video
                  src={campusTourLightbox.url}
                  className="ct-lightbox-media"
                  controls
                  autoPlay
                />
              ) : (
                <img
                  src={campusTourLightbox.url}
                  alt={campusTourLightbox.fileName || 'Campus'}
                  className="ct-lightbox-media"
                />
              )}
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <section className="events-section">
            <div className="section-header">
              <h2>News, Events & Job Fairs</h2>
              <p>Stay updated with the latest happenings at our institute</p>
            </div>

            <div className="events-container">
              <div className="upcoming-events">
                <h3>Upcoming Events</h3>
                <div className="event-list">
                  {eventNewsData?.events && eventNewsData.events.length > 0 ? (
                    eventNewsData.events.map(event => {
                      const eventDate = new Date(event.date);
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      
                      return (
                        <div key={event.eventNewsId} className="compact-event-card">
                          <div className="compact-card-image">
                            {isVideoUrl(event.bannerImage) ? (
                              <video 
                                controls 
                                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
                              >
                                <source src={event.bannerImage} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <img src={event.bannerImage || 'https://via.placeholder.com/300x150?text=Event'} alt={event.title} />
                            )}
                          </div>
                          <div className="compact-card-content">
                            <div className="compact-card-left">
                              <div className="compact-type-badge">{event.type}</div>
                              <div className="compact-date">
                                <FaCalendarAlt /> {monthNames[eventDate.getMonth()]} {eventDate.getDate()}, {eventDate.getFullYear()}
                              </div>
                            </div>
                            <div className="compact-card-main">
                              <h4 className="compact-title">{event.title}</h4>
                              <p className="compact-description">
                                {event.details.length > 120 ? event.details.substring(0, 120) + '...' : event.details}
                              </p>
                            </div>
                            <div className="compact-card-footer">
                              <div className="compact-venue">
                                <FaMapMarkerAlt /> {event.venue || 'Venue TBA'}
                              </div>
                              <button 
                                className="compact-read-more"
                                onClick={() => {
                                  setSelectedNewsItem(event);
                                  setShowNewsModal(true);
                                }}
                              >
                                Read More
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-events">
                      <p>No upcoming events available at the moment.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="news-section">
                <h3>Latest News</h3>
                <div className="news-list">
                  {eventNewsData?.news && eventNewsData.news.length > 0 ? (
                    eventNewsData.news.map(newsItem => {
                      const newsDate = new Date(newsItem.date);
                      
                      return (
                        <div key={newsItem.eventNewsId} className="compact-event-card">
                          <div className="compact-card-image">
                            {isVideoUrl(newsItem.bannerImage) ? (
                              <video 
                                controls 
                                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
                              >
                                <source src={newsItem.bannerImage} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <img src={newsItem.bannerImage || 'https://via.placeholder.com/300x150?text=News'} alt={newsItem.title} />
                            )}
                          </div>
                          <div className="compact-card-content">
                            <div className="compact-card-left">
                              <div className="compact-type-badge">{newsItem.type}</div>
                              <div className="compact-date">
                                <FaCalendarAlt /> {newsDate.toLocaleDateString()}
                              </div>
                            </div>
                            <div className="compact-card-main">
                              <h4 className="compact-title">{newsItem.title}</h4>
                              <p className="compact-description">
                                {newsItem.details.length > 120 ? newsItem.details.substring(0, 120) + '...' : newsItem.details}
                              </p>
                            </div>
                            <div className="compact-card-footer">
                              <div className="compact-venue">
                                <FaMapMarkerAlt /> {newsItem.venue || newsItem.company}
                              </div>
                              <button 
                                className="compact-read-more"
                                onClick={() => {
                                  setSelectedNewsItem(newsItem);
                                  setShowNewsModal(true);
                                }}
                              >
                                Read More
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-news">
                      <p>No latest news available at the moment.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Reviews Section — Premium Redesign */}
      <section className="ir-reviews-section">

        {/* ── Header ── */}
        <div className="ir-reviews-header">
          <div className="ir-reviews-title-block">
            <h2 className="ir-reviews-title">Reviews &amp; Testimonials</h2>
            <p className="ir-reviews-subtitle">What students, alumni and recruiters say</p>
          </div>

          {/* Rating summary card */}
          <div className="ir-rating-summary">
            <div className="ir-rating-score">
              {reviewsAverage > 0 ? reviewsAverage.toFixed(1) : '—'}
            </div>
            <div className="ir-rating-details">
              <div className="ir-stars-row">
                {renderStars(reviewsAverage > 0 ? reviewsAverage : 0)}
              </div>
              <div className="ir-rating-count">
                {reviewsTotal > 0
                  ? `Based on ${reviewsTotal} verified review${reviewsTotal !== 1 ? 's' : ''}`
                  : 'No reviews yet'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Reviews grid ── */}
        <div className="ir-reviews-grid">
          {reviewsLoading && allReviews.length === 0 ? (
            /* Loading skeleton */
            [1, 2, 3].map(n => (
              <div key={n} className="ir-review-skeleton">
                <div className="ir-skeleton-avatar" />
                <div className="ir-skeleton-lines">
                  <div className="ir-skeleton-line ir-skeleton-line--wide" />
                  <div className="ir-skeleton-line ir-skeleton-line--short" />
                  <div className="ir-skeleton-line ir-skeleton-line--medium" />
                </div>
              </div>
            ))
          ) : allReviews.length === 0 ? (
            /* Empty state */
            <div className="ir-empty-state">
              <div className="ir-empty-icon">💬</div>
              <h3 className="ir-empty-title">No Reviews Yet</h3>
              <p className="ir-empty-text">Be the first to share your experience with this institute.</p>
            </div>
          ) : (
            allReviews.map(review => (
              <div key={review.reviewId} className="ir-review-card">
                {/* Card top: avatar + meta + stars */}
                <div className="ir-review-card-top">
                  <div className="ir-review-avatar">
                    {(review.userName || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="ir-review-meta">
                    <span className="ir-review-name">{review.userName || 'Anonymous'}</span>
                    <span className="ir-review-type-badge ir-type-{(review.userType || 'student').toLowerCase()}">
                      {review.userType || 'Student'}
                    </span>
                  </div>
                  <div className="ir-review-date">
                    {review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                      : ''}
                  </div>
                </div>

                {/* Star rating */}
                <div className="ir-review-stars">
                  {renderStars(review.rating)}
                  <span className="ir-review-rating-num">{Number(review.rating).toFixed(1)}</span>
                </div>

                {/* Title + body */}
                {review.title && <p className="ir-review-title-text">"{review.title}"</p>}
                <p className="ir-review-body">{review.review}</p>
              </div>
            ))
          )}
        </div>

        {/* ── Load more ── */}
        {reviewsHasMore && (
          <div className="ir-load-more">
            <button
              className="ir-load-more-btn"
              onClick={() => loadInstituteReviews(reviewsOffset + 10)}
              disabled={reviewsLoading}
            >
              {reviewsLoading ? 'Loading…' : 'Load More Reviews'}
            </button>
          </div>
        )}

        {/* ── Write a Review ── */}
        <div className="ir-write-review">
          {!showReviewForm ? (
            <button
              className="ir-write-btn"
              onClick={() => {
                const token = localStorage.getItem('token');
                if (!token) {
                  alert('Please login to write a review.');
                  if (onShowLogin) onShowLogin();
                  return;
                }
                setShowReviewForm(true);
              }}
            >
              ✏️ Write a Review
            </button>
          ) : (
            <div className="ir-form-card">
              <h3 className="ir-form-title">Share Your Experience</h3>
              <p className="ir-form-subtitle">Your honest feedback helps future students make better decisions.</p>

              <form onSubmit={handleReviewSubmit} className="ir-form">

                {/* Role + Rating row */}
                <div className="ir-form-row">
                  <div className="ir-form-field">
                    <label className="ir-form-label" htmlFor="reviewRole">Your Role</label>
                    <select
                      className="ir-form-select"
                      id="reviewRole"
                      value={newReview.userType}
                      onChange={(e) => setNewReview({...newReview, userType: e.target.value})}
                    >
                      <option value="Student">🎓 Student</option>
                      <option value="Alumni">🏆 Alumni</option>
                      <option value="Recruiter">💼 Recruiter</option>
                      <option value="Other">👤 Other</option>
                    </select>
                  </div>

                  <div className="ir-form-field">
                    <label className="ir-form-label" htmlFor="reviewRating">Rating</label>
                    <select
                      className="ir-form-select"
                      id="reviewRating"
                      value={newReview.rating}
                      onChange={(e) => setNewReview({...newReview, rating: parseFloat(e.target.value)})}
                    >
                      <option value={5}>★★★★★ — Excellent</option>
                      <option value={4}>★★★★☆ — Good</option>
                      <option value={3}>★★★☆☆ — Average</option>
                      <option value={2}>★★☆☆☆ — Poor</option>
                      <option value={1}>★☆☆☆☆ — Terrible</option>
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div className="ir-form-field">
                  <label className="ir-form-label" htmlFor="reviewTitle">Headline <span className="ir-optional">(optional)</span></label>
                  <input
                    className="ir-form-input"
                    type="text"
                    id="reviewTitle"
                    value={newReview.title}
                    onChange={(e) => setNewReview({...newReview, title: e.target.value})}
                    placeholder="Summarise your experience in one line"
                    maxLength={120}
                  />
                </div>

                {/* Review body */}
                <div className="ir-form-field">
                  <label className="ir-form-label" htmlFor="reviewComment">Your Review <span className="ir-required">*</span></label>
                  <textarea
                    className="ir-form-textarea"
                    id="reviewComment"
                    rows="5"
                    value={newReview.review}
                    onChange={(e) => setNewReview({...newReview, review: e.target.value})}
                    placeholder="Describe your experience — quality of teaching, placements, facilities…"
                    required
                  />
                </div>

                {/* Actions */}
                <div className="ir-form-actions">
                  <button type="submit" className="ir-submit-btn" disabled={reviewSubmitting}>
                    {reviewSubmitting ? '⏳ Submitting…' : '🚀 Submit Review'}
                  </button>
                  <button
                    type="button"
                    className="ir-cancel-btn"
                    onClick={() => { setShowReviewForm(false); setNewReview({ userType: 'Student', rating: 5, title: '', review: '' }); }}
                    disabled={reviewSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </section>

      {/* Event/News Details Modal */}
      {showNewsModal && selectedNewsItem && (
        <div className="modal-overlay" onClick={() => setShowNewsModal(false)}>
          <div className="modal-popup" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedNewsItem.title}</h2>
              <button className="modal-close" onClick={() => setShowNewsModal(false)}>×</button>
            </div>
            
            <div className="modal-banner">
              {isVideoUrl(selectedNewsItem.bannerImage) ? (
                <video 
                  controls 
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
                >
                  <source src={selectedNewsItem.bannerImage} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img src={selectedNewsItem.bannerImage || 'https://via.placeholder.com/500x250?text=Event'} alt={selectedNewsItem.title} />
              )}
            </div>
            
            <div className="modal-content">
              <div className="modal-meta">
                <div className="meta-item">
                  <FaCalendarAlt className="meta-icon" />
                  <span>{new Date(selectedNewsItem.date).toLocaleDateString()}</span>
                </div>
                <div className="meta-item">
                  <FaUsers className="meta-icon" />
                  <span>{selectedNewsItem.expectedParticipants || 'Open to all'}</span>
                </div>
                <div className="meta-item">
                  <FaMapMarkerAlt className="meta-icon" />
                  <span>{selectedNewsItem.venue || selectedNewsItem.company}</span>
                </div>
              </div>
              
              <div className="modal-description">
                <div 
                  className="formatted-content"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedNewsItem.details
                      .replace(/\n/g, '<br>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/^• (.+)$/gm, '<li>$1</li>')
                      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Detail Modal */}
      {showCourseModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="course-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="course-detail-header">
              <button className="modal-close" onClick={() => setShowCourseModal(false)}>×</button>
            </div>
            
            <div className="course-detail-content">
              {/* Left Side - Course Details */}
              <div className="course-detail-left">
                <div className="course-overview-section">
                  <h2>About This Course</h2>
                  <p>{selectedCourse.description}</p>
                  
                  <div className="course-stats">
                    <div className="stat-item">
                      <span className="stat-label">Duration:</span>
                      <span className="stat-value">{selectedCourse.duration}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Instructor:</span>
                      <span className="stat-value">{selectedCourse.instructor}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Mode:</span>
                      <span className="stat-value">{selectedCourse.mode}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Category:</span>
                      <span className="stat-value">{selectedCourse.category}</span>
                    </div>
                  </div>
                  
                  {selectedCourse.prerequisites && (
                    <div className="course-prerequisites">
                      <h3>Prerequisites</h3>
                      <p>{selectedCourse.prerequisites}</p>
                    </div>
                  )}
                  
                  {selectedCourse.syllabus && (
                    <div className="course-syllabus">
                      <h3>Syllabus Overview</h3>
                      <p>{selectedCourse.syllabus}</p>
                    </div>
                  )}
                </div>
                
                {/* Course Modules Section */}
                <div className="course-modules-section">
                  <h3>Course Content</h3>
                  {selectedCourse.modules && selectedCourse.modules.map((module, index) => (
                    <div key={module.moduleId} className="module-detail-item">
                      <h4>Module {index + 1}: {module.moduleTitle}</h4>
                      <p>{module.description}</p>
                      
                      {module.content && module.content.length > 0 && (
                        <div className="module-content-list">
                          <h5>Content:</h5>
                          <ul>
                            {module.content.map((content, contentIndex) => (
                              <li key={content.contentId}>
                                <span className="content-type-badge">{content.contentType}</span>
                                {content.contentTitle}
                                <span className="content-duration">({content.durationMinutes} min)</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {module.quiz && (
                        <div className="module-quiz-info">
                          <h5>Quiz: {module.quiz.title}</h5>
                          <p>{module.quiz.description}</p>
                          <div className="quiz-meta">
                            <span>Questions: {module.quiz.questions?.length || 0}</span>
                            <span>Passing Score: {module.quiz.passingScore}%</span>
                          </div>
                        </div>
                      )}
                      
                      {module.assignments && module.assignments.length > 0 && (
                        <div className="module-assignments-info">
                          <h5>Assignments:</h5>
                          <ul>
                            {module.assignments.map((assignment, idx) => (
                              <li key={idx}>{assignment.title}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Right Side - Course Card */}
              <div className="course-detail-right">
                <div className="course-detail-card">
                  {selectedCourse.thumbnailUrl && (
                    <div className="course-card-thumbnail">
                      <img src={selectedCourse.thumbnailUrl} alt={selectedCourse.name} />
                    </div>
                  )}
                  
                  <div className="course-card-content">
                    <h3>{selectedCourse.name}</h3>
                    <div className="course-price">
                      <span className="price">₹{selectedCourse.fees}</span>
                    </div>
                    
                    <div className="course-quick-info">
                      <div className="info-row">
                        <span>Duration: {selectedCourse.duration}</span>
                      </div>
                      <div className="info-row">
                        <span>Mode: {selectedCourse.mode}</span>
                      </div>
                      <div className="info-row">
                        <span>Instructor: {selectedCourse.instructor}</span>
                      </div>
                    </div>
                    
                    {enrollmentStatuses[selectedCourse.coursesId || selectedCourse.instituteCourseID]?.enrolled ? (
                      <button className="enrolled-button" disabled>
                        Already Enrolled
                      </button>
                    ) : (
                      <button 
                        className="enroll-now-button"
                        onClick={() => handleEnrollInCourse(selectedCourse.coursesId || selectedCourse.instituteCourseID)}
                      >
                        Enroll Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Enrollment Success Modal */}
      {showEnrollmentSuccess && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="success-content">
              <div className="success-icon">
                <div className="checkmark">
                  <div className="checkmark-circle"></div>
                  <div className="checkmark-stem"></div>
                  <div className="checkmark-kick"></div>
                </div>
              </div>
              <h3>Successfully Enrolled!</h3>
              <p>Redirecting to your dashboard...</p>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && selectedQuiz && (
        <div className="modal-overlay" onClick={() => setShowQuizModal(false)}>
          <div className="quiz-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quiz-modal-header">
              <h2>{selectedQuiz.title}</h2>
              <button className="modal-close" onClick={() => setShowQuizModal(false)}>×</button>
            </div>
            
            <div className="quiz-modal-content">
              {!quizResults ? (
                <>
                  <div className="quiz-info">
                    <p>{selectedQuiz.description}</p>
                    <div className="quiz-meta">
                      <span>Questions: {selectedQuiz.questions?.length}</span>
                      <span>Passing Score: {selectedQuiz.passingScore}%</span>
                      <span>Time Limit: {selectedQuiz.timeLimit} minutes</span>
                    </div>
                  </div>
                  
                  <div className="quiz-questions">
                    {selectedQuiz.questions?.map((question, index) => (
                      <div key={question.questionId} className="question-item">
                        <h4>Question {index + 1}</h4>
                        <p>{question.question}</p>
                        <div className="question-options">
                          {question.options?.map((option, optionIndex) => (
                            <label key={optionIndex} className="option-label">
                              <input
                                type="radio"
                                name={question.questionId}
                                value={option}
                                onChange={(e) => setQuizAnswers(prev => ({
                                  ...prev,
                                  [question.questionId]: e.target.value
                                }))}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="quiz-actions">
                    <button 
                      className="submit-quiz-btn"
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length !== selectedQuiz.questions?.length}
                    >
                      Submit Quiz
                    </button>
                  </div>
                </>
              ) : (
                <div className="quiz-results">
                  <h3>Quiz Results</h3>
                  <div className="results-summary">
                    <div className="score-display">
                      <span className="score">{quizResults.score}%</span>
                      <span className="status">{quizResults.passed ? 'PASSED' : 'FAILED'}</span>
                    </div>
                    <p>You answered {quizResults.correctAnswers} out of {quizResults.totalQuestions} questions correctly.</p>
                  </div>
                  
                  <div className="detailed-results">
                    <h4>Question Review</h4>
                    {quizResults.detailedResults?.map((result, index) => (
                      <div key={index} className={`result-item ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                        <p><strong>Q{index + 1}:</strong> {result.question}</p>
                        <p><strong>Your Answer:</strong> {result.userAnswer}</p>
                        <p><strong>Correct Answer:</strong> {result.correctAnswer}</p>
                        <span className="result-status">{result.isCorrect ? '✓' : '✗'}</span>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    className="close-results-btn"
                    onClick={() => setShowQuizModal(false)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="modal-overlay" onClick={() => setShowVideoModal(false)}>
          <div className="video-modal" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <h3>{selectedVideo.contentTitle}</h3>
              <button className="modal-close" onClick={() => setShowVideoModal(false)}>×</button>
            </div>
            <div className="video-container">
              <video 
                controls 
                width="100%" 
                height="400px"
                onEnded={() => {
                  if (!selectedVideo.progress?.completedAt) {
                    markContentComplete(selectedVideo.contentId);
                  }
                }}
              >
                <source src={selectedVideo.contentUrl} type="video/mp4" />
                <source src={selectedVideo.contentUrl} type="video/webm" />
                <source src={selectedVideo.contentUrl} type="video/ogg" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="video-actions">
              <button 
                className="mark-complete-btn"
                onClick={() => {
                  markContentComplete(selectedVideo.contentId);
                  setShowVideoModal(false);
                }}
              >
                Mark as Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && selectedAssignment && (
        <div className="modal-overlay" onClick={() => setShowAssignmentModal(false)}>
          <div className="assignment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="assignment-modal-header">
              <h3>{selectedAssignment.title}</h3>
              <button className="modal-close" onClick={() => setShowAssignmentModal(false)}>×</button>
            </div>
            <div className="assignment-content">
              <p>{selectedAssignment.description}</p>
              {selectedAssignment.fileUrl && (
                <div className="assignment-file">
                  <a 
                    href={selectedAssignment.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="assignment-download"
                  >
                    📄 Download Assignment PDF
                  </a>
                </div>
              )}
              <div className="assignment-submission">
                <h4>Submit Your Work</h4>
                <textarea 
                  placeholder="Write your answer or paste your solution here..."
                  rows="6"
                  className="submission-text"
                ></textarea>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.txt"
                  className="submission-file"
                />
                <button className="submit-assignment-btn">
                  Submit Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="institute-footer">
        <div className="footer-container">
          <div className="footer-column">
            <h3>{instituteData?.name}</h3>
            <p>Empowering careers through industry-relevant education and training since 2008.</p>
            <div className="footer-badges">
              {instituteData?.badges.map((badge, index) => (
                <span key={index} className="badge">{badge}</span>
              ))}
            </div>
          </div>

          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#">Home</a></li>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Courses</a></li>
              <li><a href="#">Placements</a></li>
              <li><a href="#">Admissions</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Programs</h4>
            <ul className="footer-links">
              <li><a href="#">IT & Software</a></li>
              <li><a href="#">Engineering</a></li>
              <li><a href="#">Management</a></li>
              <li><a href="#">Vocational Training</a></li>
              <li><a href="#">Government Schemes</a></li>
              <li><a href="#">Certifications</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>For Students</h4>
            <ul className="footer-links">
              <li><a href="#">Career Guidance</a></li>
              <li><a href="#">Internships</a></li>
              <li><a href="#">Placement Assistance</a></li>
              <li><a href="#">Student Login</a></li>
              <li><a href="#">Alumni Network</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2023 {instituteData?.name}. All rights reserved.</p>
          <div className="footer-legal-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Refund Policy</a>
            <a href="#">Sitemap</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const markContentComplete = async (contentId) => {
  try {
    const response = await apiService.updateProgress(contentId, {
      progressPercentage: 100,
      completed: true
    });
  } catch (error) {
    console.error('Error marking content complete:', error);
  }
};

export default InstitutePage;
