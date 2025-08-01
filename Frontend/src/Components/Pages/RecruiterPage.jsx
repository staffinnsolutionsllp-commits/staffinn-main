/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import './RecruiterPage.css';
import './AppliedButton.css';
import apiService from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const RecruiterPage = () => {
  const { user } = useContext(AuthContext);
  const { recruiterId } = useParams();
  const navigate = useNavigate();
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recruiters, setRecruiters] = useState([]);
  const [recruiterJobs, setRecruiterJobs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Load recruiters from backend on component mount
  useEffect(() => {
    loadRecruiters();
    if (user) {
      loadUserProfile();
    }
  }, []);
  
  // Handle URL parameter for direct recruiter access
  useEffect(() => {
    if (recruiterId && recruiters.length > 0) {
      const recruiter = recruiters.find(r => r.id === recruiterId);
      if (recruiter) {
        handleRecruiterSelect(recruiter);
      }
    }
  }, [recruiterId, recruiters]);
  
  // Load follow status when recruiter is selected
  useEffect(() => {
    if (selectedRecruiter && user && user.role === 'staff') {
      loadFollowStatus();
    }
  }, [selectedRecruiter, user]);
  
  // Load user profile to check if they are active staff
  const loadUserProfile = async () => {
    try {
      const response = await apiService.getStaffProfile();
      if (response.success) {
        setUserProfile(response.data);
        
        // Load applied jobs to prevent duplicates
        const applications = response.data.applications || [];
        const appliedJobKeys = applications.map(app => `${app.recruiterId}-${app.jobId}`);
        setAppliedJobs(new Set(appliedJobKeys));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };
  
  // State for applied jobs
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  
  // Handle Apply Now click
  const handleApplyNow = async (job) => {
    if (!user) {
      alert('Please login to apply for jobs');
      return;
    }
    
    if (!userProfile || !userProfile.isActiveStaff) {
      alert('First register yourself as an active staff.');
      return;
    }
    
    const jobKey = `${selectedRecruiter.id}-${job.id}`;
    if (appliedJobs.has(jobKey)) {
      return; // Already applied, do nothing
    }
    
    try {
      const response = await apiService.applyForJob(
        selectedRecruiter.id,
        job.id,
        job.title,
        selectedRecruiter.companyName
      );
      
      if (response.success) {
        if (response.data.alreadyApplied) {
          // Mark as applied in UI
          setAppliedJobs(prev => new Set([...prev, jobKey]));
        } else {
          // Mark as applied and show success
          setAppliedJobs(prev => new Set([...prev, jobKey]));
          alert('Application submitted successfully!');
        }
      } else {
        alert('Failed to apply: ' + response.message);
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      alert('Failed to apply for job');
    }
  };

  // Load recruiter jobs when a recruiter is selected
  useEffect(() => {
    if (selectedRecruiter) {
      loadRecruiterJobs();
    }
  }, [selectedRecruiter]);

  // Load all recruiters from backend
  const loadRecruiters = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllRecruiters();
      
      if (response.success && response.data) {
        // Format recruiters data for display
        const formattedRecruiters = response.data.map(recruiter => {
          // Handle profile photo URL properly
          let logoUrl;
          if (recruiter.profilePhoto) {
            logoUrl = recruiter.profilePhoto.startsWith('http') ? recruiter.profilePhoto : `http://localhost:5000${recruiter.profilePhoto}`;
          } else {
            logoUrl = `https://via.placeholder.com/80?text=${recruiter.companyName ? recruiter.companyName.substring(0, 3).toUpperCase() : 'CO'}`;
          }
          
          return {
            id: recruiter.id,
            name: recruiter.companyName || 'Company Name',
            industry: recruiter.industry || 'Technology',
            openJobs: 0, // Will be updated when jobs are loaded
            logo: logoUrl,
            profilePhoto: logoUrl
          };
        });
        
        setRecruiters(formattedRecruiters);
        
        // Load job counts for each recruiter
        await loadJobCounts(formattedRecruiters);
      }
    } catch (error) {
      console.error('Error loading recruiters:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load job counts for recruiters
  const loadJobCounts = async (recruitersList) => {
    try {
      const jobsResponse = await apiService.getAllActiveJobs();
      
      if (jobsResponse.success && jobsResponse.data) {
        const jobCounts = {};
        
        // Count jobs per recruiter
        jobsResponse.data.forEach(job => {
          const recruiterId = job.recruiterId;
          jobCounts[recruiterId] = (jobCounts[recruiterId] || 0) + 1;
        });
        
        // Update recruiters with job counts
        const updatedRecruiters = recruitersList.map(recruiter => ({
          ...recruiter,
          openJobs: jobCounts[recruiter.id] || 0
        }));
        
        setRecruiters(updatedRecruiters);
      }
    } catch (error) {
      console.error('Error loading job counts:', error);
    }
  };

  // Load jobs for selected recruiter
  const loadRecruiterJobs = async () => {
    try {
      const jobsResponse = await apiService.getAllActiveJobs();
      
      if (jobsResponse.success && jobsResponse.data) {
        // Filter jobs for selected recruiter
        const recruiterSpecificJobs = jobsResponse.data
          .filter(job => job.recruiterId === selectedRecruiter.id)
          .map(job => ({
            id: job.jobId,
            title: job.title,
            type: job.jobType,
            salary: job.salary,
            experience: job.experience,
            location: job.location,
            description: job.description,
            skills: Array.isArray(job.skills) ? job.skills : (job.skills ? job.skills.split(',').map(s => s.trim()) : []),
            postedDate: formatPostedDate(job.postedDate)
          }));
        
        setRecruiterJobs(recruiterSpecificJobs);
      }
    } catch (error) {
      console.error('Error loading recruiter jobs:', error);
      setRecruiterJobs([]);
    }
  };

  // Format posted date
  const formatPostedDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 14) return '1 week ago';
    if (diffDays <= 21) return '2 weeks ago';
    if (diffDays <= 30) return '3 weeks ago';
    return date.toLocaleDateString();
  };

  // Load detailed recruiter data when selected
  const loadRecruiterDetails = async (recruiterId) => {
    try {
      const response = await apiService.getRecruiterById(recruiterId);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      // Fallback to basic data if detailed data not available
      return null;
    } catch (error) {
      console.error('Error loading recruiter details:', error);
      return null;
    }
  };

  // State for reviews
  const [candidateReviews, setCandidateReviews] = useState([]);
  const [employeeReviews, setEmployeeReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  
  // Load reviews when a recruiter is selected
  useEffect(() => {
    if (selectedRecruiter) {
      loadRecruiterReviews();
    }
  }, [selectedRecruiter]);
  
  // Load recruiter reviews
  const loadRecruiterReviews = async () => {
    try {
      setReviewLoading(true);
      const response = await apiService.getRecruiterReviews(selectedRecruiter.id);
      
      if (response.success && response.data && response.data.reviews) {
        // Store all reviews in candidateReviews (we'll use this as our combined reviews list)
        const allReviews = response.data.reviews;
        setCandidateReviews(allReviews);
        setEmployeeReviews([]); // We're not using this anymore, but keeping it to avoid breaking other code
      } else {
        setCandidateReviews([]);
        setEmployeeReviews([]);
      }
    } catch (error) {
      console.error('Error loading recruiter reviews:', error);
      setCandidateReviews([]);
      setEmployeeReviews([]);
    } finally {
      setReviewLoading(false);
    }
  };
  
  // Handle review form input changes
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setNewReview(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }));
  };
  
  // Handle review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login to submit a review');
      return;
    }
    
    try {
      setReviewSubmitting(true);
      const response = await apiService.addRecruiterReview(
        selectedRecruiter.id,
        newReview.rating,
        newReview.comment
      );
      
      if (response.success) {
        alert('Review submitted successfully!');
        setNewReview({ rating: 5, comment: '' });
        setShowReviewForm(false);
        loadRecruiterReviews(); // Reload reviews
      } else {
        alert('Failed to submit review: ' + response.message);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Filter jobs based on activeFilter and searchTerm
  const filteredJobs = recruiterJobs.filter(job => {
    const matchesFilter = activeFilter === 'all' || job.type === activeFilter;
    const matchesSearch = !searchTerm || 
                         job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Filter reviews to show only a limited number unless showAllReviews is true
  const displayedCandidateReviews = showAllReviews ? candidateReviews : candidateReviews.slice(0, 3);
  // We're not using this anymore, but keeping it to avoid breaking other code
  const displayedEmployeeReviews = [];

  const handleRecruiterSelect = async (recruiter) => {
    setLoading(true);
    
    // Update URL to include recruiter ID
    navigate(`/recruiter/${recruiter.id}`, { replace: true });
    
    // Load detailed recruiter data
    const detailedData = await loadRecruiterDetails(recruiter.id);
    
    if (detailedData) {
      // Handle profile photo URL properly for detailed data
      let profilePhotoUrl = recruiter.profilePhoto; // Use the already processed URL from the list
      if (detailedData.profilePhoto) {
        profilePhotoUrl = detailedData.profilePhoto.startsWith('http') ? detailedData.profilePhoto : `http://localhost:5000${detailedData.profilePhoto}`;
      }
      
      // Process office images to ensure full URLs
      const rawOfficeImages = detailedData.officeImages || detailedData.officePhotos || [];
      const processedOfficeImages = Array.isArray(rawOfficeImages) ? rawOfficeImages.map(img => 
        (img && typeof img === 'string') ? (img.startsWith('http') ? img : `http://localhost:5000${img}`) : img
      ).filter(Boolean) : [];
      
      setSelectedRecruiter({
        ...recruiter,
        ...detailedData,
        profilePhoto: profilePhotoUrl,
        officeImages: processedOfficeImages,
        // Also check for officePhotos as fallback
        officePhotos: processedOfficeImages
      });
      
      console.log('Raw office images from API:', rawOfficeImages);
      console.log('Processed office images:', processedOfficeImages);
      console.log('Final selectedRecruiter officeImages:', processedOfficeImages);
      
      console.log('Loaded recruiter with office images:', detailedData.officeImages || 'No office images');
      console.log('Office images array length:', detailedData.officeImages ? detailedData.officeImages.length : 0);
      console.log('Full recruiter data keys:', Object.keys(detailedData));
      console.log('Setting selectedRecruiter with officeImages:', detailedData.officeImages || []);
    } else {
      // Use basic data if detailed data not available
      setSelectedRecruiter({
        ...recruiter,
        companyName: recruiter.name,
        recruiterName: 'HR Manager',
        designation: 'HR Manager',
        industry: recruiter.industry,
        location: 'India',
        experience: '3+ years',
        verified: true,
        companyLogo: recruiter.logo,
        companyDescription: 'A leading technology company providing innovative solutions.',
        website: '#',
        officePhotos: [
          'https://via.placeholder.com/200x150?text=Office+1',
          'https://via.placeholder.com/200x150?text=Office+2',
          'https://via.placeholder.com/200x150?text=Office+3',
          'https://via.placeholder.com/200x150?text=Office+4'
        ],
        officeImages: [],
        perks: [
          { text: 'Comprehensive health insurance' },
          { text: 'Work from home options' },
          { text: 'Learning & development budget' },
          { text: 'Performance bonuses' }
        ],
        hiringSteps: [
          { title: 'Online Application', description: 'Submit your resume and complete a brief questionnaire.' },
          { title: 'HR Screening Call', description: '30-minute call to discuss your background and expectations.' },
          { title: 'Technical Assessment', description: 'Complete a skill-based assessment relevant to the position.' },
          { title: 'Final Round & Offer', description: 'Discussion with management, followed by an offer if selected.' }
        ],
        interviewQuestions: [
          'Tell us about yourself and your experience.',
          'Why do you want to work with our company?',
          'What are your salary expectations?',
          'Do you have any questions for us?'
        ]
      });
    }
    
    setLoading(false);
  };

  const handleBackToList = () => {
    setSelectedRecruiter(null);
    setRecruiterJobs([]);
    setIsFollowing(false);
    // Reset URL to main recruiters page
    navigate('/recruiter', { replace: true });
  };
  
  // Load follow status
  const loadFollowStatus = async () => {
    try {
      const response = await apiService.getFollowStatus(selectedRecruiter.id);
      if (response.success) {
        setIsFollowing(response.data.isFollowing);
      }
    } catch (error) {
      console.error('Error loading follow status:', error);
    }
  };
  
  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!user) {
      alert('Please login to follow recruiters');
      return;
    }
    
    if (user.role !== 'staff') {
      alert('Only staff members can follow recruiters');
      return;
    }
    
    setFollowLoading(true);
    
    try {
      let response;
      if (isFollowing) {
        response = await apiService.unfollowRecruiter(selectedRecruiter.id);
      } else {
        response = await apiService.followRecruiter(selectedRecruiter.id);
      }
      
      if (response.success) {
        setIsFollowing(!isFollowing);
        alert(isFollowing ? 'Unfollowed successfully!' : 'Following successfully!');
      } else {
        alert('Failed to update follow status: ' + response.message);
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      alert('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };
  
  // Handle chat with recruiter
  const handleChatWithRecruiter = () => {
    if (!selectedRecruiter.email) {
      alert('Recruiter email not available');
      return;
    }
    
    const subject = `Inquiry about opportunities at ${selectedRecruiter.companyName}`;
    const body = `Dear ${selectedRecruiter.recruiterName},\n\nI am interested in learning more about opportunities at ${selectedRecruiter.companyName}.\n\nBest regards`;
    
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedRecruiter.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(gmailUrl, '_blank');
  };

  // Render stars based on rating
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={i < rating ? 'star-filled' : 'star-empty'}>★</span>
    ));
  };

  // Loading state
  if (loading && !selectedRecruiter) {
    return (
      <div className="recruiter-page">
        <div className="loading">
          <h2>Loading recruiters...</h2>
          <p>Fetching real-time data from our database</p>
        </div>
      </div>
    );
  }

  // If a recruiter is selected, show their detailed page
  if (selectedRecruiter) {
    return (
      <div className="recruiter-page">
        {/* Back button */}
        <div className="back-navigation">
          <button onClick={handleBackToList} className="back-btn">
            ← Back to Recruiters
          </button>
        </div>

        {/* Recruiter's Profile Section */}
        <section className="recruiter-profile">
          <div className="profile-header">
            <div className="company-logo">
              <img src={selectedRecruiter.profilePhoto || selectedRecruiter.logo} alt={`${selectedRecruiter.companyName} logo`} />
            </div>
            <div className="profile-info">
              <h1 className="company-name">{selectedRecruiter.companyName}</h1>
              <div className="recruiter-details">
                <h2>
                  {selectedRecruiter.recruiterName} - {selectedRecruiter.designation}
                  {selectedRecruiter.verified && (
                    <span className="verified-badge" title="Verified Recruiter">✓</span>
                  )}
                </h2>
                <p className="company-meta">
                  {selectedRecruiter.industry} | {selectedRecruiter.location}
                </p>
                <p className="recruiter-experience">
                  Hiring Experience: {selectedRecruiter.experience}
                </p>
                {selectedRecruiter.website && selectedRecruiter.website !== '#' && (
                  <p className="company-website">
                    <a href={selectedRecruiter.website} target="_blank" rel="noopener noreferrer">
                      🌐 Visit Website
                    </a>
                  </p>
                )}
              </div>
            </div>
            <div className="profile-actions">
              {user && user.role === 'staff' ? (
                <button 
                  className={`btn ${isFollowing ? 'followed-btn' : 'follow-btn'}`}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? 'Loading...' : (isFollowing ? 'Followed' : 'Follow Recruiter')}
                </button>
              ) : (
                <button className="btn follow-btn" disabled>
                  Follow Recruiter
                </button>
              )}
              <button className="btn message-btn" onClick={handleChatWithRecruiter}>
                Chat with Recruiter
              </button>
            </div>
          </div>
        </section>

        {/* Main content layout */}
        <div className="main-content-layout">
          <div className="main-section">
            {/* Job Listings Section - REAL-TIME DATA */}
            <section className="job-listings">
              <h2>Open Positions ({filteredJobs.length})</h2>
              <div className="filters-bar">
                <div className="filter-buttons">
                  <button 
                    className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('all')}
                  >
                    All Jobs
                  </button>
                  <button 
                    className={`filter-btn ${activeFilter === 'Full-time' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('Full-time')}
                  >
                    Full-time
                  </button>
                  <button 
                    className={`filter-btn ${activeFilter === 'Part-time' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('Part-time')}
                  >
                    Part-time
                  </button>
                  <button 
                    className={`filter-btn ${activeFilter === 'Contract' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('Contract')}
                  >
                    Contract
                  </button>
                  <button 
                    className={`filter-btn ${activeFilter === 'Freelance' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('Freelance')}
                  >
                    Freelance
                  </button>
                </div>
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {filteredJobs.length > 0 ? (
                <div className="job-cards-grid">
                  {filteredJobs.map(job => (
                    <div className="job-card" key={job.id}>
                      <div className="job-card-header">
                        <h3 className="job-title">{job.title}</h3>
                        <div className="job-type-container">
                          <span className={`job-type ${job.type.toLowerCase().replace('-', '')}`}>
                            {job.type}
                          </span>
                        </div>
                      </div>
                      
                      <div className="job-card-content">
                        <div className="job-card-details">
                          <div className="detail-item">
                            <span className="detail-icon">💰</span>
                            <span className="detail-text">{job.salary}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-icon">⏱</span>
                            <span className="detail-text">{job.experience}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-icon">📍</span>
                            <span className="detail-text">{job.location}</span>
                          </div>
                        </div>
                        
                        <p className="job-description">{job.description}</p>
                        
                        <div className="job-skills">
                          {job.skills.map((skill, index) => (
                            <span className="skill-tag" key={index}>{skill}</span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="job-card-footer">
                        <span className="posted-date">Posted {job.postedDate}</span>
                        {(() => {
                          const jobKey = `${selectedRecruiter.id}-${job.id}`;
                          const hasApplied = appliedJobs.has(jobKey);
                          
                          return hasApplied ? (
                            <button className="apply-btn applied" disabled>
                              <span className="checkmark">✓</span> Already Applied
                            </button>
                          ) : (
                            <button 
                              className="apply-btn"
                              onClick={() => handleApplyNow(job)}
                            >
                              Apply Now
                            </button>
                          );
                        })()
                        }
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-jobs-found">
                  <p>
                    {recruiterJobs.length === 0 
                      ? "This recruiter hasn't posted any jobs yet." 
                      : "No jobs match your search criteria."
                    }
                  </p>
                </div>
              )}
            </section>

            {/* Company Insights & Hiring Culture - REAL-TIME DATA */}
            <section className="company-insights">
              <h2>About {selectedRecruiter.companyName}</h2>
              <div className="company-description">
                <p>{selectedRecruiter.companyDescription}</p>
              </div>



              <div className="perks-benefits">
                <h3>Perks & Benefits</h3>
                <div className="benefits-list">
                  <ul>
                    {selectedRecruiter.perks.map((perk, index) => (
                      <li key={index} className="benefit-item">
                        <span className="benefit-text">{perk.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="hiring-process">
                <h3>Hiring Process</h3>
                <div className="process-steps">
                  {selectedRecruiter.hiringSteps.map((step, index) => (
                    <div className="process-step" key={index}>
                      <div className="step-number">{index + 1}</div>
                      <div className="step-content">
                        <h4>{step.title}</h4>
                        <p>{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Office Images Section - Real-time from recruiter dashboard */}
              {(() => {
                const officeImages = selectedRecruiter.officeImages || [];
                console.log('Rendering office images section, images count:', officeImages.length);
                console.log('Office images to render:', officeImages);
                
                return officeImages.length > 0 ? (
                  <div className="office-images">
                    <h3>Office Images</h3>
                    <div className="office-images-grid">
                      {officeImages.map((photo, index) => (
                        <div className="office-image-item" key={index}>
                          <img 
                            src={photo} 
                            alt={`${selectedRecruiter.companyName} office ${index + 1}`}
                            onError={(e) => {
                              console.error('Failed to load office image:', photo);
                              e.target.style.display = 'none';
                            }}
                            onLoad={() => console.log('Office image loaded successfully:', photo)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{display: 'none'}}>
                    {/* Hidden placeholder - no office images to display */}
                  </div>
                );
              })()}
              
              <div className="interview-questions">
                <h3>Common Interview Questions</h3>
                <ul className="question-list">
                  {selectedRecruiter.interviewQuestions.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </div>
            </section>



            {/* Employee & Candidate Reviews */}
            <section className="reviews-section">
              <div className="section-header">
                <h2>Reviews & Insights</h2>
                <div className="reviews-actions">
                  <button 
                    className="add-review-btn"
                    onClick={() => setShowReviewForm(!showReviewForm)}
                  >
                    {showReviewForm ? 'Cancel' : 'Add Review'}
                  </button>
                  <button 
                    className={`toggle-reviews-btn ${showAllReviews ? 'showing-all' : ''}`}
                    onClick={() => setShowAllReviews(!showAllReviews)}
                  >
                    {showAllReviews ? 'Show Less' : 'Show All'}
                  </button>
                </div>
              </div>
              
              {showReviewForm && (
                <div className="review-form-container">
                  <h3>Add Your Review</h3>
                  <form onSubmit={handleReviewSubmit} className="review-form">
                    <div className="rating-input">
                      <label>Rating:</label>
                      <div className="star-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span 
                            key={star} 
                            className={star <= newReview.rating ? 'star-filled' : 'star-empty'}
                            onClick={() => setNewReview({...newReview, rating: star})}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="comment-input">
                      <label>Comment:</label>
                      <textarea 
                        name="comment"
                        value={newReview.comment}
                        onChange={handleReviewChange}
                        placeholder="Share your experience with this recruiter..."
                        required
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      className="submit-review-btn"
                      disabled={reviewSubmitting}
                    >
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}

              {reviewLoading ? (
                <div className="reviews-loading">Loading reviews...</div>
              ) : (
                <div className="reviews-container single-column">
                  {candidateReviews.length > 0 ? (
                    <>
                      {displayedCandidateReviews.map(review => (
                        <div className="review-card" key={review.reviewId}>
                          <div className="review-header">
                            <div className="reviewer-info">
                              <span className="reviewer-initial">{review.reviewerName.charAt(0)}</span>
                              <div>
                                <h4>{review.reviewerName}</h4>
                                <p className="review-meta">
                                  {review.position || review.tenure ? 
                                    `${review.position || 'User'} ${review.tenure ? '• ' + review.tenure : ''}` : 
                                    new Date(review.createdAt).toLocaleDateString()
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="review-rating">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          <p className="review-text">{review.comment}</p>
                        </div>
                      ))}
                      {!showAllReviews && candidateReviews.length > 3 && (
                        <p className="more-reviews-hint">Click "Show All" to see {candidateReviews.length - 3} more {candidateReviews.length - 3 === 1 ? 'review' : 'reviews'}</p>
                      )}
                    </>
                  ) : (
                    <p className="no-reviews">No reviews yet. Be the first to add one!</p>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }

  // Show recruiters list - REAL-TIME DATA
  return (
    <div className="recruiter-page">
      <section className="recruiters-list-section">
        <h1>Recruiters</h1>
        <div className="real-time-notice">
          <p>📡 <strong>Live Data:</strong> All recruiter information is updated in real-time from our database</p>
        </div>
        
        {recruiters.length > 0 ? (
          <div className="recruiters-grid">
            {recruiters.map(recruiter => (
              <div 
                key={recruiter.id} 
                className="recruiter-card"
                onClick={() => handleRecruiterSelect(recruiter)}
              >
                <div className="recruiter-card-header">
                  <div className="recruiter-logo">
                    <img src={recruiter.logo} alt={`${recruiter.name} logo`} />
                  </div>
                  <div className="recruiter-info">
                    <h3 className="recruiter-name">
                      {recruiter.name}
                      <span className="verified-badge-small" title="Verified Recruiter">✓</span>
                    </h3>
                    <p className="recruiter-industry">{recruiter.industry}</p>
                    <p className="recruiter-jobs">
                      {recruiter.openJobs} {recruiter.openJobs === 1 ? 'open job' : 'open jobs'}
                    </p>
                  </div>
                </div>
                <div className="recruiter-card-footer">
                  <button className="view-recruiter-btn">View Details</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-recruiters-found">
            <h3>No recruiters found</h3>
            <p>Please check back later or contact support if this issue persists.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default RecruiterPage;