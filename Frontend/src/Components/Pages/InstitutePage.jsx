/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../../services/api';
import './InstitutePage.css';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaStar, FaStarHalfAlt, FaRegStar, FaFilter, FaSearch, FaGraduationCap, FaBriefcase, FaHandshake, FaChalkboardTeacher, FaCalendarAlt, FaUsers, FaCheckCircle } from 'react-icons/fa';
import InstitutepageImage from '../../assets/Institutepage.jpg';

const InstitutePage = () => {
  const { id } = useParams(); // Get the institute ID from URL params
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
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    name: '',
    role: 'Student',
    rating: 5,
    comment: ''
  });



  // Sample data - would come from API in real implementation
  const courses = [
    { id: 1, name: 'Full Stack Web Development', duration: '6 months', fees: '₹45,000', mode: 'Online/Offline', status: 'Enrollment Open', category: 'IT', certification: 'Industry-Specific' },
    { id: 2, name: 'Data Science & Machine Learning', duration: '8 months', fees: '₹65,000', mode: 'Online', status: 'Enrollment Open', category: 'IT', certification: 'Industry-Specific' },
    { id: 3, name: 'Digital Marketing', duration: '3 months', fees: '₹25,000', mode: 'Online', status: 'Enrollment Open', category: 'Management', certification: 'Government-Recognized' },
    { id: 4, name: 'Mechanical CAD Design', duration: '4 months', fees: '₹30,000', mode: 'Offline', status: 'Enrollment Open', category: 'Engineering', certification: 'Government-Recognized' },
    { id: 5, name: 'Industrial Automation', duration: '6 months', fees: '₹40,000', mode: 'Offline', status: 'Enrollment Closing Soon', category: 'Engineering', certification: 'Industry-Specific' },
    { id: 6, name: 'Advanced Excel & Business Analytics', duration: '2 months', fees: '₹15,000', mode: 'Online/Offline', status: 'Enrollment Open', category: 'Management', certification: 'Industry-Specific' },
  ];

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

  const achievements = [
    { id: 1, student: 'Rajesh Kumar', achievement: 'National Coding Competition Winner', details: 'First place in HackerRank national coding challenge' },
    { id: 2, student: 'Sunita Devi', achievement: 'Google Certification', details: 'Completed Google Cloud Engineer certification with distinction' },
    { id: 3, student: 'Mohammed Ali', achievement: 'Research Publication', details: 'Published research paper in International Journal of Data Science' },
  ];

  const collaborations = [
    { id: 1, company: 'Microsoft', type: 'Training Partner', details: 'Official curriculum and certification partner' },
    { id: 2, company: 'Amazon', type: 'Hiring Partner', details: 'Regular campus recruitment drives' },
    { id: 3, company: 'IBM', type: 'Research Partner', details: 'Joint research projects and internship opportunities' },
  ];

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

  const governmentSchemes = [
    { id: 1, name: 'PMKVY', details: 'Pradhan Mantri Kaushal Vikas Yojana - Skill training and certification' },
    { id: 2, name: 'NAPS', details: 'National Apprenticeship Promotion Scheme - On-the-job training' },
    { id: 3, name: 'DDU-GKY', details: 'Deen Dayal Upadhyaya Grameen Kaushalya Yojana - Rural youth training' },
  ];

  // Fetch institute data based on ID
  useEffect(() => {
    if (id) {
      fetchInstitute();
      fetchPlacementData();
      fetchInstituteDashboardStats();
    }
  }, [id]);

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

  // Filter courses based on search and filter criteria
  const filteredCourses = courses.filter(course => {
    return (
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filters.category === 'all' || course.category === filters.category) &&
      (filters.duration === 'all' || course.duration.startsWith(filters.duration)) &&
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
              <span>{instituteData?.address}</span>
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
          className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          <FaUsers /> Student Achievements
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
              {filteredCourses.map(course => (
                <div key={course.id} className="course-card">
                  <div className="course-header">
                    <span className="course-status">{course.status}</span>
                    <h3 className="course-name">{course.name}</h3>
                  </div>
                  <div className="course-details">
                    <div className="course-detail">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{course.duration}</span>
                    </div>
                    <div className="course-detail">
                      <span className="detail-label">Fees:</span>
                      <span className="detail-value">{course.fees}</span>
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
                  </div>
                  <button className="enroll-button">Enroll Now</button>
                </div>
              ))}
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
                    placementData.topHiringCompanies.map((company, index) => (
                      <div key={index} className="company-logo">
                        <img 
                          src={company.logo || `https://via.placeholder.com/100?text=${company.name}`} 
                          alt={company.name} 
                        />
                        <span>{company.name}</span>
                      </div>
                    ))
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
                    placementData.recentPlacementSuccess.map((placement, index) => (
                      <div key={index} className="placement-item">
                        <div className="student-profile">
                          <div className="student-avatar">
                            <img 
                              src={placement.photo || `https://via.placeholder.com/50?text=${placement.name.charAt(0)}`} 
                              alt={placement.name} 
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
                    ))
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

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <section className="achievements-section">
            <div className="section-header">
              <h2>Student Achievements & Alumni Success</h2>
              <p>Celebrating the success of our students and alumni in their careers</p>
            </div>

            <div className="achievement-container">
              {achievements.map(achievement => (
                <div key={achievement.id} className="achievement-card">
                  <div className="achievement-icon">
                    <img src={`https://via.placeholder.com/80?text=${achievement.student.charAt(0)}`} alt={achievement.student} />
                  </div>
                  <div className="achievement-content">
                    <h3>{achievement.student}</h3>
                    <div className="achievement-title">{achievement.achievement}</div>
                    <p>{achievement.details}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="alumni-showcase">
              <h3>Alumni Success Stories</h3>
              <div className="alumni-grid">
                {/* Sample alumni stories */}
                <div className="alumni-card">
                  <div className="alumni-photo">
                    <img src="https://via.placeholder.com/200?text=V" alt="Vikram Singh" />
                  </div>
                  <div className="alumni-info">
                    <h4>Vikram Singh</h4>
                    <div className="alumni-position">Senior Developer at Google</div>
                    <p className="alumni-story">
                      "The hands-on training and real-world projects at Tech Skills Academy prepared me for the challenges in the tech industry. Today, I lead a team of developers at Google."
                    </p>
                  </div>
                </div>
                <div className="alumni-card">
                  <div className="alumni-photo">
                    <img src="https://via.placeholder.com/200?text=A" alt="Ananya Desai" />
                  </div>
                  <div className="alumni-info">
                    <h4>Ananya Desai</h4>
                    <div className="alumni-position">Data Scientist at Microsoft</div>
                    <p className="alumni-story">
                      "The specialized data science course and mentorship from industry experts helped me secure my dream role at Microsoft."
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="certification-showcase">
              <h3>Industry Certifications & Projects</h3>
              <div className="certifications-grid">
                <div className="certification-card">
                  <div className="certification-logo">
                    <img src="https://via.placeholder.com/100?text=AWS" alt="AWS Certification" />
                  </div>
                  <div className="certification-details">
                    <h4>AWS Certified Solutions Architect</h4>
                    <p>25 students certified in 2023</p>
                  </div>
                </div>
                <div className="certification-card">
                  <div className="certification-logo">
                    <img src="https://via.placeholder.com/100?text=GCP" alt="Google Cloud Certification" />
                  </div>
                  <div className="certification-details">
                    <h4>Google Cloud Engineer</h4>
                    <p>18 students certified in 2023</p>
                  </div>
                </div>
                <div className="certification-card">
                  <div className="certification-logo">
                    <img src="https://via.placeholder.com/100?text=CISCO" alt="Cisco Certification" />
                  </div>
                  <div className="certification-details">
                    <h4>Cisco Certified Network Associate</h4>
                    <p>32 students certified in 2023</p>
                  </div>
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

            <div className="collaboration-grid">
              {collaborations.map(collab => (
                <div key={collab.id} className="collaboration-card">
                  <div className="company-logo">
                    <img src={`https://via.placeholder.com/150?text=${collab.company}`} alt={collab.company} />
                  </div>
                  <div className="collaboration-details">
                    <h3>{collab.company}</h3>
                    <div className="collaboration-type">{collab.type}</div>
                    <p>{collab.details}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mou-section">
              <h3>Memorandums of Understanding (MOUs)</h3>
              <div className="mou-list">
                <div className="mou-item">
                  <div className="mou-icon">📄</div>
                  <div className="mou-details">
                    <h4>TechCorp India</h4>
                    <p>Joint research and development program</p>
                  </div>
                </div>
                <div className="mou-item">
                  <div className="mou-icon">📄</div>
                  <div className="mou-details">
                    <h4>Global Systems Ltd</h4>
                    <p>Industry internship program</p>
                  </div>
                </div>
                <div className="mou-item">
                  <div className="mou-icon">📄</div>
                  <div className="mou-details">
                    <h4>DataTech Solutions</h4>
                    <p>Co-development of specialized curriculum</p>
                  </div>
                </div>
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
              {governmentSchemes.map(scheme => (
                <div key={scheme.id} className="scheme-card">
                  <div className="scheme-header">
                    <h3>{scheme.name}</h3>
                  </div>
                  <div className="scheme-content">
                    <p>{scheme.details}</p>
                    <button className="scheme-button">Learn More</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="scholarship-section">
              <h3>Scholarships & Financial Aid</h3>
              <div className="scholarship-list">
                <div className="scholarship-item">
                  <div className="scholarship-icon">🎓</div>
                  <div className="scholarship-details">
                    <h4>Merit-Based Scholarship</h4>
                    <p>Up to 50% fee waiver for academically excellent students</p>
                  </div>
                </div>
                <div className="scholarship-item">
                  <div className="scholarship-icon">📊</div>
                  <div className="scholarship-details">
                    <h4>Financial Need-Based Assistance</h4>
                    <p>Support for economically disadvantaged students</p>
                  </div>
                </div>
                <div className="scholarship-item">
                  <div className="scholarship-icon">👩‍💻</div>
                  <div className="scholarship-details">
                    <h4>Women in Tech Scholarship</h4>
                    <p>Special scholarships to encourage women in technology fields</p>
                  </div>
                </div>
              </div>
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
                  {events.map(event => (
                    <div key={event.id} className="event-card">
                      <div className="event-date">
                        <div className="month">{event.date.split(' ')[0]}</div>
                        <div className="day">{event.date.split(' ')[1].replace(',', '')}</div>
                      </div>
                      <div className="event-details">
                        <h4>
                          {event.name}
                          {event.verified && (
                            <span className="staff-verified">
                              <FaCheckCircle /> Staffinn Verified
                            </span>
                          )}
                        </h4>
                        <p>{event.details}</p>
                      </div>
                      <button className="event-button">Register</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="news-section">
                <h3>Latest News</h3>
                <div className="news-list">
                  {/* Staff verified news items at the beginning */}
                  <div className="news-item">
                    <div className="news-date">April 10, 2023</div>
                    <h4>
                      Tech Skills Academy Partners with Google for AI Research
                      <span className="staff-verified">
                        <FaCheckCircle /> Staffinn Verified
                      </span>
                    </h4>
                    <p>Our institute has signed a landmark agreement with Google to collaborate on AI research and development projects.</p>
                    <a href="#" className="read-more">Read More</a>
                  </div>
                  <div className="news-item">
                    <div className="news-date">April 5, 2023</div>
                    <h4>
                      100% Placement Record for Advanced Data Science Batch
                      <span className="staff-verified">
                        <FaCheckCircle /> Staffinn Verified
                      </span>
                    </h4>
                    <p>All students from our Advanced Data Science program have secured placements with an average package of 8.5 LPA.</p>
                    <a href="#" className="read-more">Read More</a>
                  </div>
                  {/* Original news items */}
                  <div className="news-item">
                    <div className="news-date">May 10, 2023</div>
                    <h4>Tech Skills Academy Ranked #1 in Placement Success</h4>
                    <p>Our institute has been recognized as the top institute for job placements in the IT sector.</p>
                    <a href="#" className="read-more">Read More</a>
                  </div>
                  <div className="news-item">
                    <div className="news-date">April 28, 2023</div>
                    <h4>New Cloud Computing Lab Inaugurated</h4>
                    <p>State-of-the-art cloud computing lab opened in collaboration with AWS and Google Cloud.</p>
                    <a href="#" className="read-more">Read More</a>
                  </div>
                  <div className="news-item">
                    <div className="news-date">April 15, 2023</div>
                    <h4>MOU Signed with Microsoft for Advanced Training</h4>
                    <p>New partnership to provide specialized training in Microsoft technologies and certifications.</p>
                    <a href="#" className="read-more">Read More</a>
                  </div>
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
              <li><a href="#">Scholarships</a></li>
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

export default InstitutePage;