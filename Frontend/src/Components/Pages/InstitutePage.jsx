/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import './InstitutePage.css';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaStar, FaStarHalfAlt, FaRegStar, FaFilter, FaSearch, FaGraduationCap, FaBriefcase, FaHandshake, FaChalkboardTeacher, FaCalendarAlt, FaUsers, FaCheckCircle } from 'react-icons/fa';
import InstitutepageImage from '../../assets/Institutepage.jpg';

const InstitutePage = () => {
  const { id } = useParams(); // Get the institute ID from URL params
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('courses');
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
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    name: '',
    role: 'Student',
    rating: 5,
    comment: ''
  });
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

  const [allReviews, setAllReviews] = useState([
    { id: 1, name: 'Ankit Sharma', role: 'Student', rating: 5, comment: 'Excellent faculty and practical training. Got placed in my dream company!' },
    { id: 2, name: 'Mittal Industries', role: 'Recruiter', rating: 4.5, comment: 'Students from this institute are well-prepared for industry challenges' },
    { id: 3, name: 'Kiran Bedi', role: 'Alumni', rating: 4.8, comment: 'The skills I learned here are still relevant in my career 5 years later' },
  ]);

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
    }
  }, [id]);
  
  // Add a periodic refresh for placement data and courses to catch updates
  useEffect(() => {
    if (id && activeTab === 'placements') {
      const interval = setInterval(() => {
        console.log('Refreshing placement data...');
        fetchPlacementData();
      }, 30000); // Refresh every 30 seconds when on placements tab
      
      return () => clearInterval(interval);
    }
  }, [id, activeTab]);
  
  // Refresh courses when on courses tab
  useEffect(() => {
    if (id && activeTab === 'courses') {
      const interval = setInterval(() => {
        console.log('Refreshing courses...');
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
          profileImage: response.data.profileImage,
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
      console.log('Fetching placement data for institute:', id);
      const response = await apiService.getPublicPlacementSection(id);
      if (response.success && response.data) {
        console.log('Placement data fetched successfully:', response.data);
        setPlacementData(response.data);
      } else {
        console.log('No placement data found or API error:', response);
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
      console.log('Fetching industry collaboration data for institute:', id);
      const response = await apiService.getPublicIndustryCollaborations(id);
      if (response.success && response.data) {
        console.log('Industry collaboration data fetched successfully:', response.data);
        setIndustryCollabData(response.data);
      } else {
        console.log('No industry collaboration data found or API error:', response);
      }
    } catch (error) {
      console.error('Error fetching industry collaboration data:', error);
    }
  };

  const fetchEventNewsData = async () => {
    try {
      console.log('Fetching events/news data for institute:', id);
      const response = await apiService.getPublicEventNews(id);
      if (response.success && response.data) {
        console.log('Events/news data fetched successfully:', response.data);
        setEventNewsData(response.data);
      } else {
        console.log('No events/news data found or API error:', response);
      }
    } catch (error) {
      console.error('Error fetching events/news data:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      console.log('Fetching courses for institute:', id);
      const response = await apiService.getPublicCourses(id);
      if (response.success && response.data) {
        console.log('Courses fetched successfully:', response.data);
        console.log('Course data structure check:');
        response.data.forEach((course, index) => {
          console.log(`Course ${index}:`, {
            coursesId: course.coursesId,
            instituteCourseID: course.instituteCourseID,
            name: course.courseName || course.name,
            hasCoursesId: !!course.coursesId,
            hasInstituteCourseID: !!course.instituteCourseID
          });
        });
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
        console.log('No courses found or API error:', response);
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchGovernmentSchemes = async () => {
    try {
      console.log('Fetching government schemes for institute:', id);
      const response = await apiService.getPublicInstituteGovtSchemes(id);
      if (response.success && response.data) {
        console.log('Government schemes fetched successfully:', response.data);
        setGovernmentSchemes(response.data);
      } else {
        console.log('No government schemes found or API error:', response);
        setGovernmentSchemes([]);
      }
    } catch (error) {
      console.error('Error fetching government schemes:', error);
      setGovernmentSchemes([]);
    }
  };

  const handleEnrollInCourse = async (courseId) => {
    try {
      console.log('🎯 Attempting to enroll in course:', courseId);
      console.log('🎯 Course ID type:', typeof courseId);
      console.log('🎯 Course ID value:', courseId);
      
      if (!courseId) {
        console.error('❌ Course ID is undefined or null');
        alert('Course ID is missing. Please try again.');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to enroll in courses');
        return;
      }

      console.log('🚀 Calling enrollInCourse API with courseId:', courseId);
      const response = await apiService.enrollInCourse(courseId);
      console.log('📊 Enrollment response:', response);
      
      if (response.success) {
        console.log('✅ Enrollment successful');
        // Show success animation
        setShowEnrollmentSuccess(true);
        
        // Update enrollment status
        setEnrollmentStatuses(prev => ({
          ...prev,
          [courseId]: {
            enrolled: true,
            hasStarted: false,
            progressPercentage: 0
          }
        }));
        
        // Hide success message and redirect after 2 seconds
        setTimeout(() => {
          setShowEnrollmentSuccess(false);
          setShowCourseModal(false);
          navigate('/dashboard/staff');
        }, 2000);
      } else {
        console.error('❌ Enrollment failed:', response.message);
        alert(response.message || 'Failed to enroll in course');
      }
    } catch (error) {
      console.error('❌ Error enrolling in course:', error);
      alert('Failed to enroll in course: ' + error.message);
    }
  };

  const handleAccessCourse = async (courseId) => {
    try {
      // Redirect to course learning page
      navigate(`/course/${courseId}`);
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

  // Calculate average rating
  const averageRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;

  // Handle review submission
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (newReview.name.trim() && newReview.comment.trim()) {
      const reviewToAdd = {
        id: allReviews.length + 1,
        ...newReview
      };
      setAllReviews([...allReviews, reviewToAdd]);
      setNewReview({
        name: '',
        role: 'Student',
        rating: 5,
        comment: ''
      });
      setShowReviewForm(false);
    }
  };

  // Render stars based on rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

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
      {/* Only show Hero Section and Filters when no specific institute ID is present */}
      {!id && (
        <>
          {/* Hero Section */}
          <section className="institute-search-section" style={{backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${InstitutepageImage})`}}>
            <div className="hero-content">
              <h1>Find Your Institute</h1>
            </div>
            <div className="search-container">
              <input 
                type="text" 
                placeholder="Search by name or location..." 
                className="search-input"
              />
              <FaSearch className="search-icon" />
            </div>
          </section>

          {/* Filters Section */}
          <section className="filters-section">
            <h3>Filters</h3>
            <div className="filter-options">
              <label className="filter-option">
                <input type="radio" name="filter" value="all" defaultChecked />
                <span>All Institutes</span>
              </label>
              <label className="filter-option">
                <input type="radio" name="filter" value="brainary" />
                <span>Brainary Verified Institutes</span>
              </label>
              <label className="filter-option">
                <input type="radio" name="filter" value="trending" />
                <span>Trending Achievers</span>
              </label>
            </div>
          </section>
        </>
      )}

      {/* Header Section */}
      <header className="institute-header">
        <div className="institute-header-content">
          <div className="institute-logo-section">
            <div className="institute-logo">
              <img 
                src={instituteData?.profileImage || `https://via.placeholder.com/150?text=${instituteData?.name.charAt(0)}`} 
                alt="Institute Logo"
                data-institute-image
              />
            </div>
            <div className="institute-name">
              <h1>{instituteData?.name}</h1>
              <div className="institute-badges">
                {instituteData?.badges && instituteData.badges.map((badge, index) => (
                  <div key={index} className="badge">{badge}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="institute-quick-info">
            <div className="info-item">
              <FaMapMarkerAlt />
              <span>
                {instituteData?.address}
                {instituteData?.pincode && `, ${instituteData.pincode}`}
              </span>
            </div>
            <div className="info-item">
              <FaPhone />
              <span>{instituteData?.phone}</span>
            </div>
            <div className="info-item">
              <FaEnvelope />
              <span>{instituteData?.email}</span>
            </div>
            <div className="info-item">
              <FaGlobe />
              <span>{instituteData?.website}</span>
            </div>
            <div className="info-item experience">
              <span>{instituteData?.experience}</span>
            </div>
          </div>
        </div>
        <div className="cta-buttons">
          <button className="cta-button primary" onClick={scrollToCourses}>
            View Offered Courses
          </button>
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
      </div>

      {/* Main Content Area */}
      <main className="institute-content">
        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <section className="courses-section">
            <div className="section-header">
              <h2>Courses & Training Programs</h2>
              <p>Industry-relevant courses designed by experts to prepare you for the job market</p>
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

            <div className="courses-grid">
              {courses.length > 0 ? (
                filteredCourses.map(course => {
                  const courseId = course.coursesId || course.instituteCourseID;
                  const courseName = course.courseName || course.name;
                  return (
                    <div key={courseId} className="course-card">
                      {course.thumbnailUrl && (
                        <div className="course-thumbnail">
                          <img src={course.thumbnailUrl} alt={courseName} />
                        </div>
                      )}
                      <div className="course-header">
                        <span className="course-status">Enrollment Open</span>
                        <h3 className="course-name">{courseName}</h3>
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
                      <div className="course-enrollment-section">
                        {enrollmentStatuses[courseId]?.enrolled && (
                          <div className="enrollment-status">
                            <span className="enrolled-badge">✓ Enrolled</span>
                            <div className="progress-indicator">
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill" 
                                  style={{ width: `${enrollmentStatuses[courseId]?.progressPercentage || 0}%` }}
                                ></div>
                              </div>
                              <span className="progress-text">
                                {enrollmentStatuses[courseId]?.progressPercentage || 0}% Complete
                              </span>
                            </div>
                          </div>
                        )}
                        <button 
                          className="view-details-button"
                          onClick={() => {
                            // Navigate to course details page instead of opening modal
                            navigate(`/course/${courseId}?preview=true&institute=${id}`);
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-courses">
                  <p>No courses available at the moment. Please check back later.</p>
                </div>
              )}
            </div>
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
                            onError={(e) => {
                              console.error('Company logo load error:', e.target.src);
                              e.target.src = placeholderUrl;
                            }}
                            onLoad={() => validLogo && console.log('Company logo loaded successfully:', validLogo)}
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
                                onError={(e) => {
                                  console.error('Student photo load error:', e.target.src);
                                  e.target.src = placeholderUrl;
                                }}
                                onLoad={() => validPhoto && console.log('Student photo loaded successfully:', validPhoto)}
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
                          onError={(e) => {
                            console.error('Collaboration image load error:', e.target.src);
                            e.target.src = placeholderUrl;
                          }}
                          onLoad={() => validImage && console.log('Collaboration image loaded successfully:', validImage)}
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
                                console.log('PDF link clicked:', validPdf);
                                // Let the default behavior handle the link
                              }}
                              onError={(e) => {
                                console.error('PDF link error:', validPdf);
                                e.target.style.display = 'none';
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
                            <img src={event.bannerImage || 'https://via.placeholder.com/300x150?text=Event'} alt={event.title} />
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
                            <img src={newsItem.bannerImage || 'https://via.placeholder.com/300x150?text=News'} alt={newsItem.title} />
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

      {/* Reviews Section */}
      <section className="reviews-section">
        <div className="section-header">
          <h2>Reviews & Testimonials</h2>
          <div className="overall-rating">
            <div className="rating-number">{averageRating.toFixed(1)}</div>
            <div className="stars">{renderStars(averageRating)}</div>
            <div className="rating-count">Based on {allReviews.length} reviews</div>
          </div>
        </div>

        <div className="reviews-container">
          {allReviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="reviewer-info">
                <div className="reviewer-avatar">
                  <img src={`https://via.placeholder.com/60?text=${review.name.charAt(0)}`} alt={review.name} />
                </div>
                <div className="reviewer-details">
                  <h4>{review.name}</h4>
                  <p>{review.role}</p>
                </div>
              </div>
              <div className="stars">{renderStars(review.rating)}</div>
              <p className="review-text">{review.comment}</p>
            </div>
          ))}
        </div>
        
        <div className="write-review">
          {!showReviewForm ? (
            <button className="review-button" onClick={() => setShowReviewForm(true)}>
              Write a Review
            </button>
          ) : (
            <div className="review-form">
              <h3>Write Your Review</h3>
              <form onSubmit={handleReviewSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="reviewName">Your Name</label>
                    <input
                      type="text"
                      id="reviewName"
                      value={newReview.name}
                      onChange={(e) => setNewReview({...newReview, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reviewRole">Your Role</label>
                    <select
                      id="reviewRole"
                      value={newReview.role}
                      onChange={(e) => setNewReview({...newReview, role: e.target.value})}
                    >
                      <option value="Student">Student</option>
                      <option value="Alumni">Alumni</option>
                      <option value="Recruiter">Recruiter</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="reviewRating">Rating</label>
                  <select
                    id="reviewRating"
                    value={newReview.rating}
                    onChange={(e) => setNewReview({...newReview, rating: parseFloat(e.target.value)})}
                  >
                    <option value={5}>5 Stars - Excellent</option>
                    <option value={4.5}>4.5 Stars - Very Good</option>
                    <option value={4}>4 Stars - Good</option>
                    <option value={3.5}>3.5 Stars - Above Average</option>
                    <option value={3}>3 Stars - Average</option>
                    <option value={2.5}>2.5 Stars - Below Average</option>
                    <option value={2}>2 Stars - Poor</option>
                    <option value={1.5}>1.5 Stars - Very Poor</option>
                    <option value={1}>1 Star - Terrible</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="reviewComment">Your Review</label>
                  <textarea
                    id="reviewComment"
                    rows="4"
                    value={newReview.comment}
                    onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                    placeholder="Share your experience..."
                    required
                  ></textarea>
                </div>
                <div className="form-buttons">
                  <button type="submit" className="submit-review-btn">Submit Review</button>
                  <button type="button" className="cancel-review-btn" onClick={() => setShowReviewForm(false)}>Cancel</button>
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
              <img src={selectedNewsItem.bannerImage || 'https://via.placeholder.com/500x250?text=Event'} alt={selectedNewsItem.title} />
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

      {/* Contact & Inquiry Section */}
      <section className="contact-section">
        <div className="section-header">
          <h2>Contact Us</h2>
          <p>Have questions? We're here to help!</p>
        </div>

        <div className="contact-container">
          <div className="contact-form">
            <h3>Send us a message</h3>
            <form>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input type="text" id="name" placeholder="Enter your full name" />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" placeholder="Enter your email address" />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input type="tel" id="phone" placeholder="Enter your phone number" />
              </div>
              <div className="form-group">
                <label htmlFor="inquiry">Inquiry Type</label>
                <select id="inquiry">
                  <option value="">Select inquiry type</option>
                  <option value="admission">Admission Query</option>
                  <option value="course">Course Information</option>
                  <option value="placement">Placement Services</option>
                  <option value="partnership">Industry Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea id="message" rows="5" placeholder="Type your message here..."></textarea>
              </div>
              <button type="submit" className="submit-button">Submit Inquiry</button>
            </form>
          </div>

          <div className="contact-info">
            <div className="contact-map">
              <img src="https://via.placeholder.com/500x300?text=Campus+Map" alt="Campus Map" />
            </div>
            <div className="contact-details">
              <div className="contact-item">
                <FaMapMarkerAlt className="contact-icon" />
                <div>
                  <h4>Address</h4>
                  <p>{instituteData?.address}</p>
                </div>
              </div>
              <div className="contact-item">
                <FaPhone className="contact-icon" />
                <div>
                  <h4>Phone</h4>
                  <p>{instituteData?.phone}</p>
                </div>
              </div>
              <div className="contact-item">
                <FaEnvelope className="contact-icon" />
                <div>
                  <h4>Email</h4>
                  <p>{instituteData?.email}</p>
                </div>
              </div>
            </div>
            <div className="social-links">
              <h4>Connect with us</h4>
              <div className="social-icons">
                <a href="#" className="social-icon">FB</a>
                <a href="#" className="social-icon">TW</a>
                <a href="#" className="social-icon">LI</a>
                <a href="#" className="social-icon">IG</a>
                <a href="#" className="social-icon">YT</a>
              </div>
            </div>
          </div>
        </div>
      </section>

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
    if (response.success) {
      console.log('Content marked as complete');
    }
  } catch (error) {
    console.error('Error marking content complete:', error);
  }
};

export default InstitutePage;
