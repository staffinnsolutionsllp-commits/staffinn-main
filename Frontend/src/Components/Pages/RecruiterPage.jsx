/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import './RecruiterPage.css';
import './AppliedButton.css';
import apiWithLoading from '../../services/apiWithLoading';
import apiService from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import StudentApplicationModal from '../common/StudentApplicationModal';
import JobCard from '../common/JobCard';
import { FaSearch } from 'react-icons/fa';

const RecruiterPage = ({ isLoggedIn, onShowLogin }) => {
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
  
  // Search state for hero section
  const [recruiterNameSearch, setRecruiterNameSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [filteredRecruiters, setFilteredRecruiters] = useState([]);
  
  // Student selection modal state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Hero images state
  const [heroImages, setHeroImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [heroImagesLoading, setHeroImagesLoading] = useState(true);

  // Load recruiters from backend on component mount
  useEffect(() => {
    loadRecruiters();
    loadHeroImages();
    if (user) {
      loadUserProfile();
    }
  }, []);
  
  // Handle slideshow interval
  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prevIndex => {
          if (prevIndex >= heroImages.length - 1) {
            return 0;
          } else {
            return prevIndex + 1;
          }
        });
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [heroImages]);
  
  // Filter recruiters based on search terms
  useEffect(() => {
    let results = recruiters;
    
    // Apply recruiter name search filter
    if (recruiterNameSearch) {
      results = results.filter(recruiter => 
        recruiter.name.toLowerCase().includes(recruiterNameSearch.toLowerCase())
      );
    }
    
    // Apply job search filter - need to check jobs for each recruiter
    if (jobSearch) {
      const filterByJobs = async () => {
        const jobsResponse = await apiWithLoading.getAllActiveJobs();
        
        if (jobsResponse.success && jobsResponse.data) {
          const matchingRecruiterIds = new Set();
          
          // Find recruiters that have jobs matching the search term
          jobsResponse.data.forEach(job => {
            if (job.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
                job.description.toLowerCase().includes(jobSearch.toLowerCase())) {
              matchingRecruiterIds.add(job.recruiterId);
            }
          });
          
          // Filter recruiters based on matching job IDs
          const jobFilteredResults = results.filter(recruiter => 
            matchingRecruiterIds.has(recruiter.id)
          );
          
          setFilteredRecruiters(jobFilteredResults);
        } else {
          setFilteredRecruiters(results);
        }
      };
      
      filterByJobs();
    } else {
      setFilteredRecruiters(results);
    }
  }, [recruiterNameSearch, jobSearch, recruiters]);
  
  // Reload applied jobs when user changes
  useEffect(() => {
    if (user) {
      loadAppliedJobs();
    }
  }, [user]);
  
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
  
  // Load user profile to check if they are active staff or institute
  const loadUserProfile = async () => {
    try {
      let response;
      if (user.role === 'staff') {
        response = await apiWithLoading.getStaffProfile();
        console.log('Staff profile API response:', response);
      } else if (user.role === 'institute') {
        response = await apiWithLoading.getInstituteProfile();
        console.log('Institute profile API response:', response);
      }
      
      if (response && response.success && response.data) {
        console.log('Setting user profile:', response.data);
        setUserProfile(response.data);
        
        // Load applied jobs separately to ensure persistent state
        await loadAppliedJobs();
      } else {
        console.error('Failed to load user profile:', response);
        // Set a default profile to prevent null checks from failing
        if (user.role === 'staff') {
          setUserProfile({ isActiveStaff: false });
        } else {
          setUserProfile({ role: user.role });
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Set a default profile to prevent null checks from failing
      if (user.role === 'staff') {
        setUserProfile({ isActiveStaff: false });
      } else {
        setUserProfile({ role: user.role });
      }
    }
  };
  
  // Load applied jobs separately to maintain persistent state
  const loadAppliedJobs = async () => {
    try {
      console.log('Loading applied jobs for user:', user?.role);
      const response = await apiWithLoading.getAppliedJobs();
      console.log('Applied jobs API response:', response);
      
      if (response && response.success) {
        const applications = response.data || [];
        console.log('Applications data:', applications);
        const appliedJobKeys = applications.map(app => `${app.recruiterId}-${app.jobId}`);
        setAppliedJobs(new Set(appliedJobKeys));
        console.log('Set applied job keys:', appliedJobKeys);
      } else {
        console.log('Failed to load applied jobs:', response?.message);
      }
    } catch (error) {
      console.error('Error loading applied jobs:', error);
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
    
    console.log('Apply Now clicked - User:', user);
    console.log('Apply Now clicked - UserProfile:', userProfile);
    
    // For staff members, verify their profile status
    if (user.role === 'staff') {
      // If profile is not loaded or status is unclear, debug and reload
      if (!userProfile || userProfile.isActiveStaff === undefined) {
        console.log('Profile not loaded or unclear, debugging...');
        
        try {
          const debugResponse = await apiWithLoading.debugStaffProfile();
          console.log('Debug response:', debugResponse);
          
          if (debugResponse.success) {
            const debug = debugResponse.debug;
            
            if (!debug.profileExists) {
              alert('Your staff profile was not found. Please complete your profile setup first.');
              return;
            }
            
            if (debug.isActiveStaff === false) {
              alert('Please activate your staff profile to apply for jobs. Go to your dashboard and toggle to "Active Staff" mode.');
              return;
            }
            
            if (debug.isActiveStaff !== true) {
              alert('Unable to verify your active staff status. Please contact support.');
              return;
            }
            
            // Update local profile state with debug info
            setUserProfile(debug.fullProfile);
          } else {
            alert('Unable to verify your profile status. Please try again.');
            return;
          }
        } catch (error) {
          console.error('Debug profile error:', error);
          alert('Unable to verify your profile status. Please refresh the page and try again.');
          return;
        }
      } else if (userProfile.isActiveStaff === false) {
        alert('Please activate your staff profile to apply for jobs. Go to your dashboard and toggle to "Active Staff" mode.');
        return;
      } else if (userProfile.isActiveStaff !== true) {
        alert('Unable to verify your active staff status. Please refresh the page and try again.');
        return;
      }
      
      // For staff, use the old direct application method
      const jobKey = `${selectedRecruiter.id}-${job.id}`;
      if (appliedJobs.has(jobKey)) {
        return; // Already applied, do nothing
      }
      
      try {
        const response = await apiWithLoading.applyForJob(
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
    } else if (user.role === 'institute') {
      // For institutes, show student selection modal
      await handleInstituteJobApplication(job);
    } else {
      alert('Only staff members and institutes can apply for jobs.');
      return;
    }
  };
  
  // Handle institute job application with student selection
  const handleInstituteJobApplication = async (job) => {
    console.log('Opening student application modal for job:', job.title);
    console.log('User profile for modal:', userProfile);
    setSelectedJob(job);
    setShowStudentModal(true);
  };
  
  // Handle closing student modal and updating applied jobs state
  const handleStudentModalClose = () => {
    console.log('Closing student modal');
    
    // Update the applied jobs state to show "Already Applied" if students were applied
    if (selectedJob && selectedRecruiter) {
      const jobKey = `${selectedRecruiter.id}-${selectedJob.id}`;
      setAppliedJobs(prev => new Set([...prev, jobKey]));
      console.log('Updated applied jobs for:', jobKey);
    }
    
    setShowStudentModal(false);
    setSelectedJob(null);
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
      const response = await apiWithLoading.getAllRecruiters();
      
      if (response.success && response.data) {
        // Format recruiters data for display
        const formattedRecruiters = response.data.map(recruiter => {
          // Handle profile photo URL properly
          let logoUrl;
          if (recruiter.profilePhoto) {
            logoUrl = recruiter.profilePhoto.startsWith('http') ? recruiter.profilePhoto : `http://localhost:4001${recruiter.profilePhoto}`;
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

  // Load hero images for recruiter page
  const loadHeroImages = async () => {
    try {
      setHeroImagesLoading(true);
      console.log('🖼️ Loading hero images for recruiter section...');
      
      const response = await apiService.getHeroImages('recruiter');
      console.log('🖼️ Hero images response:', response);
      
      if (response.success && response.data && response.data.images) {
        const images = response.data.images;
        console.log('🖼️ Setting hero images:', images.length, 'images');
        setHeroImages(images);
        setCurrentImageIndex(0);
      } else {
        console.log('🖼️ No hero images found, using default');
        setHeroImages([]);
      }
    } catch (error) {
      console.error('❌ Error loading hero images:', error);
      setHeroImages([]);
    } finally {
      setHeroImagesLoading(false);
    }
  };

  // Load job counts for recruiters
  const loadJobCounts = async (recruitersList) => {
    try {
      const jobsResponse = await apiWithLoading.getAllActiveJobs();
      
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
      const jobsResponse = await apiWithLoading.getAllActiveJobs();
      
      if (jobsResponse.success && jobsResponse.data) {
        // Filter jobs for selected recruiter
        const recruiterSpecificJobs = jobsResponse.data
          .filter(job => job.recruiterId === selectedRecruiter.id)
          .map(job => ({
            id: job.jobId,
            jobId: job.jobId,
            title: job.title,
            jobType: job.jobType,
            type: job.jobType,
            salary: job.salary,
            experience: job.experience,
            location: job.location,
            description: job.description,
            department: job.department,
            graduationYear: job.graduationYear,
            skills: Array.isArray(job.skills) ? job.skills : (job.skills ? job.skills.split(',').map(s => s.trim()) : []),
            postedDate: job.postedDate,
            recruiterInfo: {
              companyName: selectedRecruiter.companyName,
              verified: true
            }
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
      const response = await apiWithLoading.getRecruiterById(recruiterId);
      
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
      const response = await apiWithLoading.getRecruiterReviews(selectedRecruiter.id);
      
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
      const response = await apiWithLoading.addRecruiterReview(
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
    const matchesFilter = activeFilter === 'all' || job.jobType === activeFilter;
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
        profilePhotoUrl = detailedData.profilePhoto.startsWith('http') ? detailedData.profilePhoto : `http://localhost:4001${detailedData.profilePhoto}`;
      }
      
      // Process office images to ensure full URLs
      const rawOfficeImages = detailedData.officeImages || detailedData.officePhotos || [];
      const processedOfficeImages = Array.isArray(rawOfficeImages) ? rawOfficeImages.map(img => 
        (img && typeof img === 'string') ? (img.startsWith('http') ? img : `http://localhost:4001${img}`) : img
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
      const response = await apiWithLoading.getFollowStatus(selectedRecruiter.id);
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
        response = await apiWithLoading.unfollowRecruiter(selectedRecruiter.id);
      } else {
        response = await apiWithLoading.followRecruiter(selectedRecruiter.id);
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
                  {selectedRecruiter.address && (
                    <span className="address-display"> | {selectedRecruiter.address}</span>
                  )}
                  {selectedRecruiter.pincode && (
                    <span className="pincode-display"> - {selectedRecruiter.pincode}</span>
                  )}
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
                  <button 
                    className={`filter-btn ${activeFilter === 'Internship' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('Internship')}
                  >
                    Internship
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
                  {filteredJobs.map(job => {
                    const jobKey = `${selectedRecruiter.id}-${job.id}`;
                    const hasApplied = appliedJobs.has(jobKey);
                    
                    let buttonText = 'Apply Now';
                    let showButton = true;
                    
                    if (user && user.role === 'institute') {
                      buttonText = 'Apply Students';
                    } else if (hasApplied && user && user.role !== 'institute') {
                      buttonText = '✓ Already Applied';
                      showButton = false;
                    }
                    
                    return (
                      <JobCard
                        key={job.id}
                        job={job}
                        onApply={() => handleApplyNow(job)}
                        showApplyButton={showButton || (user && user.role === 'institute')}
                        buttonText={buttonText}
                      />
                    );
                  })}
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
        
        {/* Student Application Modal */}
        <StudentApplicationModal
          isOpen={showStudentModal}
          onClose={handleStudentModalClose}
          jobTitle={selectedJob?.title || ''}
          companyName={selectedRecruiter?.companyName || ''}
          selectedJob={selectedJob}
          selectedRecruiter={selectedRecruiter}
          userProfile={userProfile}
        />
      </div>
    );
  }

  // Show recruiters list - REAL-TIME DATA
  return (
    <div className="recruiter-page">
      {/* Hero Section with Background Image */}
      <div className="recruiter-search-section" style={{ 
        backgroundImage: heroImages.length > 0 
          ? `url(${heroImages[currentImageIndex]?.url})` 
          : 'url(/recruiterbanner.jpg)', 
        height: '500px',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        transition: 'background-image 1s ease-in-out'
      }}>
        <div className="hero-content" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
          marginBottom: '40px'
        }}>
          <h1 className="page-title" style={{
            fontSize: '3rem',
            fontWeight: '700',
            color: 'white',
            marginBottom: '50px',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            textAlign: 'center'
          }}>Find Your Recruiter</h1>
        </div>
        <div className="recruiter-search-container" style={{
          position: 'relative',
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '20px 24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="dual-search-inputs" style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            width: '100%'
          }}>
            <input 
              type="text" 
              placeholder="Search by Recruiter Name..." 
              value={recruiterNameSearch}
              onChange={(e) => setRecruiterNameSearch(e.target.value)}
              className="search-input recruiter-name-search"
              style={{
                flex: '1',
                height: '56px',
                padding: '0 20px',
                border: '1px solid rgba(72, 99, 247, 0.2)',
                borderRadius: '8px',
                fontSize: '16px',
                color: '#333',
                background: 'white',
                outline: 'none',
                transition: 'all 0.3s ease',
                minWidth: '250px'
              }}
            />
            <input 
              type="text" 
              placeholder="Search by Job..." 
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              className="search-input job-search"
              style={{
                flex: '1',
                height: '56px',
                padding: '0 20px',
                border: '1px solid rgba(72, 99, 247, 0.2)',
                borderRadius: '8px',
                fontSize: '16px',
                color: '#333',
                background: 'white',
                outline: 'none',
                transition: 'all 0.3s ease',
                minWidth: '250px'
              }}
            />
            <button className="search-btn" onClick={() => {}} style={{
              height: '56px',
              padding: '0 32px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px',
              background: 'linear-gradient(135deg, #4863f7 0%, #3a4fd8 100%)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              minWidth: '140px',
              flexShrink: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center'
            }}>
              <FaSearch />
              Search
            </button>
          </div>
        </div>
        
        {/* Slideshow indicators */}
        {heroImages.length > 1 && (
          <div className="hero-slideshow-indicators" style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            zIndex: 10
          }}>
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  border: '2px solid white',
                  backgroundColor: index === currentImageIndex ? 'white' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <section className="recruiters-list-section">
        <div className="real-time-notice">
          <p>📡 <strong>Live Data:</strong> All recruiter information is updated in real-time from our database</p>
        </div>
        
        {filteredRecruiters.length > 0 ? (
          <div className="recruiters-grid">
            {filteredRecruiters.map(recruiter => (
              <div 
                key={recruiter.id} 
                className="recruiter-card"
                onClick={() => {
                  if (!isLoggedIn) {
                    onShowLogin();
                    return;
                  }
                  handleRecruiterSelect(recruiter);
                }}
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
                  <button 
                    className="view-recruiter-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isLoggedIn) {
                        onShowLogin();
                        return;
                      }
                      handleRecruiterSelect(recruiter);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-recruiters-found">
            <h3>No recruiters found matching your criteria</h3>
            <p>Try adjusting your search terms or check back later.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default RecruiterPage;