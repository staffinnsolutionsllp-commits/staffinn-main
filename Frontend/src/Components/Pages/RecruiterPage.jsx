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
import CampusInviteModal from '../Dashboard/CampusInviteModal';
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
  
  // Campus request state
  const [campusRequestSent, setCampusRequestSent] = useState(new Set());
  const [showCampusInviteModal, setShowCampusInviteModal] = useState(false);
  const [campusInviteRecruiter, setCampusInviteRecruiter] = useState(null);
  
  // Store hash for scrolling after jobs load
  const [pendingScrollJobId, setPendingScrollJobId] = useState(null);

  // Perk detail modal state
  const [selectedPerk, setSelectedPerk] = useState(null);

  // Award detail modal state
  const [selectedAward, setSelectedAward] = useState(null);

  // Load recruiters from backend on component mount
  useEffect(() => {
    loadRecruiters();
    loadHeroImages();
    
    // Check if there's a hash in URL for scrolling to job
    if (window.location.hash) {
      const jobId = window.location.hash.replace('#job-', '');
      setPendingScrollJobId(jobId);
      console.log('Stored pending scroll job ID:', jobId);
    }
    
    if (user) {
      loadUserProfile();
      // Load existing campus requests for institutes
      if (user.role === 'institute') {
        loadExistingCampusRequests();
      }
    }
  }, []);
  
  // Load existing campus requests to check which recruiters already have requests
  const loadExistingCampusRequests = async () => {
    try {
      const response = await apiService.getInstituteCampusRequests();
      if (response.success && response.data) {
        const sentRecruiterIds = new Set(response.data.map(req => req.recruiterId));
        setCampusRequestSent(sentRecruiterIds);
      }
    } catch (error) {
      console.error('Error loading existing campus requests:', error);
    }
  };
  
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
  
  // Handle scroll to job and highlight when jobs are loaded and we have a pending scroll
  useEffect(() => {
    console.log('Scroll effect triggered');
    console.log('Pending scroll job ID:', pendingScrollJobId);
    console.log('Selected recruiter:', selectedRecruiter?.companyName);
    console.log('Recruiter jobs count:', recruiterJobs.length);
    
    if (pendingScrollJobId && selectedRecruiter && recruiterJobs.length > 0) {
      console.log('All conditions met, attempting to scroll to job:', pendingScrollJobId);
      
      // Wait for DOM to render - reduced timeout for faster response
      const scrollTimeout = setTimeout(() => {
        const jobElement = document.getElementById(`job-${pendingScrollJobId}`);
        console.log('Looking for element with ID:', `job-${pendingScrollJobId}`);
        console.log('Found job element:', jobElement);
        
        if (jobElement) {
          // Scroll to job with smooth behavior
          jobElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          console.log('Scrolled to job element');
          
          // Find the actual job card inside the wrapper
          const jobCard = jobElement.querySelector('.modern-job-card');
          console.log('Found job card:', jobCard);
          
          if (jobCard) {
            // Add highlight class
            jobCard.classList.add('highlight');
            console.log('Added highlight class');
            
            // Remove highlight after 2 seconds
            setTimeout(() => {
              jobCard.classList.remove('highlight');
              console.log('Removed highlight class');
              // Clear hash from URL
              window.history.replaceState(null, '', window.location.pathname);
              // Clear pending scroll
              setPendingScrollJobId(null);
            }, 2000);
          }
        } else {
          console.error('Job element not found with ID:', `job-${pendingScrollJobId}`);
          console.log('All job elements:', document.querySelectorAll('[id^="job-"]'));
        }
      }, 500);
      
      return () => clearTimeout(scrollTimeout);
    }
  }, [pendingScrollJobId, selectedRecruiter, recruiterJobs]);
  
  // Load follow status when recruiter is selected
  useEffect(() => {
    if (selectedRecruiter && user && user.role === 'staff') {
      loadFollowStatus();
    }
  }, [selectedRecruiter, user]);
  
  // Handle campus invite — open the new multi-step modal
  const handleCampusInvite = (recruiter) => {
    if (!user) {
      alert('Please login to send campus invite');
      return;
    }
    if (user.role !== 'institute') return;
    setCampusInviteRecruiter(recruiter);
    setShowCampusInviteModal(true);
  };

  const handleCampusInviteSuccess = (recruiterId) => {
    setCampusRequestSent(prev => new Set([...prev, recruiterId]));
    setShowCampusInviteModal(false);
    setCampusInviteRecruiter(null);
    alert('🎉 Campus invite sent successfully!');
  };
  
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
        // Format recruiters data for display with all profile information
        const formattedRecruiters = response.data.map(recruiter => {
          // Handle profile photo URL properly - check if it's already a full URL
          let logoUrl;
          if (recruiter.profilePhoto) {
            // If it's already a full URL (S3 or any http/https URL), use it as-is
            if (recruiter.profilePhoto.startsWith('http://') || recruiter.profilePhoto.startsWith('https://')) {
              logoUrl = recruiter.profilePhoto;
            } else {
              // Otherwise, prepend backend URL for local files
              const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001';
              logoUrl = `${backendUrl}${recruiter.profilePhoto}`;
            }
          } else {
            // Use a simple data URI or local placeholder instead of external service
            logoUrl = null; // Will show company initials in UI
          }
          
          // Process office images to ensure full URLs
          const rawOfficeImages = recruiter.officeImages || recruiter.officePhotos || [];
          const processedOfficeImages = Array.isArray(rawOfficeImages) ? rawOfficeImages.map(img => {
            if (!img || typeof img !== 'string') return null;
            // If it's already a full URL (S3 or any http/https URL), use it as-is
            if (img.startsWith('http://') || img.startsWith('https://')) {
              return img;
            }
            // If it starts with /uploads, prepend the backend URL
            const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001';
            if (img.startsWith('/uploads')) {
              return `${backendUrl}${img}`;
            }
            // Otherwise, assume it's a relative path and prepend backend URL
            return `${backendUrl}${img.startsWith('/') ? img : '/' + img}`;
          }).filter(Boolean) : [];
          
          // Get first 3 office images for card display
          const cardOfficeImages = processedOfficeImages.slice(0, 3);
          
          // Truncate company description for card display
          const truncatedDescription = recruiter.companyDescription 
            ? (recruiter.companyDescription.length > 120 
                ? recruiter.companyDescription.substring(0, 120) + '...' 
                : recruiter.companyDescription)
            : 'No description available';
          
          // Format experience to include "+ years"
          const formattedExperience = recruiter.experience 
            ? (recruiter.experience.toString().includes('year') 
                ? recruiter.experience 
                : `${recruiter.experience}+ years`)
            : 'N/A';
          
          return {
            id: recruiter.id,
            name: recruiter.companyName || recruiter.name || recruiter.recruiterName || 'Recruiter',
            companyName: recruiter.companyName || recruiter.name || recruiter.recruiterName || 'Recruiter',
            industry: recruiter.industry || 'Technology',
            openJobs: 0, // Will be updated when jobs are loaded
            logo: logoUrl,
            profilePhoto: logoUrl,
            // Real recruiter profile data
            recruiterName: recruiter.recruiterName || recruiter.name || 'HR Manager',
            designation: recruiter.designation || 'Recruiter',
            experience: formattedExperience,
            address: recruiter.address || '',
            location: recruiter.location || recruiter.address || 'Location not specified',
            pincode: recruiter.pincode || '',
            companyDescription: truncatedDescription,
            officeImages: cardOfficeImages,
            officeLocations: recruiter.officeLocations || [],
            // Store full data for detail view
            fullData: recruiter
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
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1'}/hero-images/recruiter/public?t=${timestamp}`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.images && data.data.images.length > 0) {
        const images = data.data.images;
        
        // Test if images are accessible
        images.forEach((image, index) => {
          const testImg = new Image();
          testImg.onerror = () => console.error(`❌ Image ${index + 1} failed to load:`, image.url);
          testImg.src = image.url;
        });
        
        setHeroImages(images);
        setCurrentImageIndex(0);
      } else {
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
        console.log('🏢 Recruiter detail data received:', {
          officeLocations: response.data.officeLocations,
          officeLocationsCount: response.data.officeLocations?.length || 0,
          address: response.data.address,
          pincode: response.data.pincode,
          fullKeys: Object.keys(response.data)
        });
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
      // Handle profile photo URL properly for detailed data - check if it's already a full URL
      let profilePhotoUrl = recruiter.profilePhoto; // Use the already processed URL from the list
      if (detailedData.profilePhoto) {
        if (detailedData.profilePhoto.startsWith('http://') || detailedData.profilePhoto.startsWith('https://')) {
          profilePhotoUrl = detailedData.profilePhoto;
        } else {
          const backendUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4001';
          profilePhotoUrl = `${backendUrl}${detailedData.profilePhoto}`;
        }
      }
      
      // Process office images to ensure full URLs (including S3 URLs)
      const rawOfficeImages = detailedData.officeImages || detailedData.officePhotos || [];
      const processedOfficeImages = Array.isArray(rawOfficeImages) ? rawOfficeImages.map(img => {
        if (!img || typeof img !== 'string') return null;
        // If it's already a full URL (S3 or any http/https URL), use it as-is
        if (img.startsWith('http://') || img.startsWith('https://')) {
          return img;
        }
        // If it starts with /uploads, prepend the backend URL
        const backendUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4001';
        if (img.startsWith('/uploads')) {
          return `${backendUrl}${img}`;
        }
        // Otherwise, assume it's a relative path and prepend backend URL
        return `${backendUrl}${img.startsWith('/') ? img : '/' + img}`;
      }).filter(Boolean) : [];
      
      // Format experience to include "+ years"
      const formattedExperience = (recruiter.experience || detailedData.experience)
        ? ((recruiter.experience || detailedData.experience).toString().includes('year') 
            ? (recruiter.experience || detailedData.experience) 
            : `${recruiter.experience || detailedData.experience}+ years`)
        : 'N/A';
      
      // Process office locations to ensure full image URLs
      const processedOfficeLocations = Array.isArray(detailedData.officeLocations)
        ? detailedData.officeLocations.map(loc => ({
            ...loc,
            images: (loc.images || []).map(img => {
              if (!img || typeof img !== 'string') return null;
              if (img.startsWith('http://') || img.startsWith('https://')) return img;
              const backendUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4001';
              return `${backendUrl}${img.startsWith('/') ? img : '/' + img}`;
            }).filter(Boolean)
          }))
        : [];

      setSelectedRecruiter({
        ...recruiter,
        ...detailedData,
        profilePhoto: profilePhotoUrl,
        officeImages: processedOfficeImages,
        officePhotos: processedOfficeImages,
        officeLocations: processedOfficeLocations.length > 0 ? processedOfficeLocations : (detailedData.officeLocations || []),
        // Use real data from recruiter object
        companyName: recruiter.companyName || detailedData.companyName,
        recruiterName: recruiter.recruiterName || detailedData.recruiterName || 'HR Manager',
        designation: recruiter.designation || detailedData.designation || 'Recruiter',
        experience: formattedExperience,
        location: recruiter.location || detailedData.location || detailedData.address || 'Location not specified',
        address: recruiter.address || detailedData.address || '',
        pincode: recruiter.pincode || detailedData.pincode || ''
      });
      

    } else {
      // Use basic data if detailed data not available
      setSelectedRecruiter({
        ...recruiter,
        companyName: recruiter.name,
        recruiterName: recruiter.recruiterName || 'HR Manager',
        designation: recruiter.designation || 'HR Manager',
        industry: recruiter.industry,
        location: recruiter.location || 'India',
        experience: recruiter.experience || '3+ years',
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

                {/* Social Links */}
                {(() => {
                  const socialLinks = [
                    {
                      key: 'linkedin', label: 'LinkedIn', color: '#0A66C2',
                      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    },
                    {
                      key: 'twitter', label: 'X (Twitter)', color: '#000000',
                      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    },
                    {
                      key: 'instagram', label: 'Instagram', color: '#E1306C',
                      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="url(#ig-pub-grad)">
                        <defs>
                          <linearGradient id="ig-pub-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f09433"/>
                            <stop offset="25%" stopColor="#e6683c"/>
                            <stop offset="50%" stopColor="#dc2743"/>
                            <stop offset="75%" stopColor="#cc2366"/>
                            <stop offset="100%" stopColor="#bc1888"/>
                          </linearGradient>
                        </defs>
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                      </svg>
                    },
                    {
                      key: 'facebook', label: 'Facebook', color: '#1877F2',
                      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    },
                    {
                      key: 'youtube', label: 'YouTube', color: '#FF0000',
                      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    },
                    {
                      key: 'github', label: 'GitHub', color: '#181717',
                      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#181717"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                    },
                  ];
                  const activeSocials = socialLinks.filter(s => selectedRecruiter[s.key] && selectedRecruiter[s.key].trim() !== '');
                  if (activeSocials.length === 0) return null;
                  return (
                    <div className="recruiter-social-links">
                      {activeSocials.map(s => (
                        <a
                          key={s.key}
                          href={selectedRecruiter[s.key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="recruiter-social-link"
                          title={s.label}
                          aria-label={`${selectedRecruiter.companyName} on ${s.label}`}
                        >
                          {s.icon}
                        </a>
                      ))}
                    </div>
                  );
                })()}
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
                      <div key={job.id} id={`job-${job.id}`}>
                        <JobCard
                          job={job}
                          onApply={() => handleApplyNow(job)}
                          showApplyButton={showButton || (user && user.role === 'institute')}
                          buttonText={buttonText}
                        />
                      </div>
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
                <div className="benefits-list-enhanced">
                  {selectedRecruiter.perks.map((perk, index) => {
                    const title = perk.title || perk.text || '';
                    const description = perk.description || '';
                    const isLong = description.length > 120;
                    const previewText = isLong ? description.slice(0, 120).trimEnd() + '…' : description;
                    return (
                      <div key={index} className="benefit-item-enhanced">
                        {perk.image && (
                          <div className="benefit-image">
                            <img src={perk.image} alt={title} />
                          </div>
                        )}
                        <div className="benefit-content">
                          <h4 className="benefit-title">{title}</h4>
                          {description && (
                            <p className="benefit-description benefit-description-preview">
                              {previewText}
                            </p>
                          )}
                          {isLong && (
                            <button
                              className="perk-read-more-btn"
                              onClick={() => setSelectedPerk(perk)}
                              aria-label={`Read more about ${title}`}
                            >
                              Read More
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Perk Detail Modal */}
              {selectedPerk && (
                <div
                  className="perk-modal-overlay"
                  onClick={() => setSelectedPerk(null)}
                  role="dialog"
                  aria-modal="true"
                  aria-label={`Perk details: ${selectedPerk.title || selectedPerk.text}`}
                >
                  <div
                    className="perk-modal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="perk-modal-close"
                      onClick={() => setSelectedPerk(null)}
                      aria-label="Close"
                    >
                      ✕
                    </button>
                    {selectedPerk.image && (
                      <div className="perk-modal-image">
                        <img src={selectedPerk.image} alt={selectedPerk.title || selectedPerk.text} />
                      </div>
                    )}
                    <div className="perk-modal-body">
                      <h3 className="perk-modal-title">{selectedPerk.title || selectedPerk.text}</h3>
                      <p className="perk-modal-description">{selectedPerk.description}</p>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Office Locations & Units — Unified Premium Section */}
              {(() => {
                // Build locations array — prefer saved officeLocations, fallback to officeImages
                // Filter only truly invalid entries (null/undefined), allow empty locationName
                let locations = (selectedRecruiter.officeLocations || []).filter(l => l && typeof l === 'object');

                // Backward compat fallback: no officeLocations saved yet
                if (locations.length === 0) {
                  const oldImages = selectedRecruiter.officeImages || [];
                  const fallbackAddr = selectedRecruiter.address || selectedRecruiter.location || '';
                  const validAddr = fallbackAddr && fallbackAddr !== 'Location not specified' && fallbackAddr !== 'India';
                  if (validAddr || oldImages.length > 0) {
                    locations = [{
                      id: 'fallback',
                      locationName: validAddr
                        ? (fallbackAddr + (selectedRecruiter.pincode ? ' - ' + selectedRecruiter.pincode : ''))
                        : (selectedRecruiter.companyName || 'Head Office'),
                      unitCount: 1,
                      images: oldImages
                    }];
                  }
                }

                if (locations.length === 0) return null;

                const totalUnits = locations.reduce((sum, l) => sum + (parseInt(l.unitCount) || 1), 0);

                return (
                  <div style={{ marginTop: '40px', marginBottom: '8px' }}>

                    {/* ── Section Header ── */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
                          Office Locations &amp; Units
                        </h3>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                          {locations.length} {locations.length === 1 ? 'Location' : 'Locations'}&nbsp;&nbsp;·&nbsp;&nbsp;{totalUnits} Total Office {totalUnits === 1 ? 'Unit' : 'Units'}
                        </p>
                      </div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: '#EFF6FF', border: '1px solid #BFDBFE',
                        borderRadius: '9999px', padding: '6px 16px',
                        fontSize: '12px', fontWeight: '700', color: '#1D4ED8', whiteSpace: 'nowrap'
                      }}>
                        🏢 {totalUnits} Office {totalUnits === 1 ? 'Unit' : 'Units'}
                      </span>
                    </div>

                    {/* ── Location Cards ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {locations.map((loc, idx) => {
                        const imgs = (loc.images || []).filter(Boolean);
                        const units = parseInt(loc.unitCount) || 1;
                        return (
                          <div key={loc.id || idx} style={{
                            borderRadius: '16px',
                            overflow: 'hidden',
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            boxShadow: '0 2px 12px rgba(15,23,42,0.06)'
                          }}>

                            {/* Card Header */}
                            <div style={{
                              padding: '16px 20px',
                              background: 'linear-gradient(135deg, #F8FAFF 0%, #EFF6FF 100%)',
                              borderBottom: '1px solid #E2E8F0',
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                <div style={{
                                  width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                                }}>📍</div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{
                                    fontWeight: '700', fontSize: '15px', color: '#0F172A',
                                    lineHeight: '1.3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                  }}>
                                    {loc.locationName}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                                    Office Location #{idx + 1}
                                  </div>
                                </div>
                              </div>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px', flexShrink: 0,
                                background: '#FFFFFF', border: '1px solid #BFDBFE',
                                borderRadius: '9999px', padding: '5px 14px',
                                fontSize: '12px', fontWeight: '700', color: '#1D4ED8',
                                boxShadow: '0 1px 4px rgba(59,130,246,0.12)'
                              }}>
                                🏢 {units} Office {units === 1 ? 'Unit' : 'Units'}
                              </span>
                            </div>

                            {/* Image Gallery */}
                            {imgs.length > 0 ? (
                              <div style={{ padding: '16px 20px 20px' }}>
                                {imgs.length === 1 && (
                                  <div style={{ borderRadius: '12px', overflow: 'hidden', height: '240px', background: '#F1F5F9' }}>
                                    <img src={imgs[0]} alt={loc.locationName}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                      onError={(e) => { e.target.parentElement.style.display = 'none'; }} />
                                  </div>
                                )}
                                {imgs.length === 2 && (
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {imgs.map((img, i) => (
                                      <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', height: '200px', background: '#F1F5F9' }}>
                                        <img src={img} alt={`${loc.locationName} ${i + 1}`}
                                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                          onError={(e) => { e.target.parentElement.style.display = 'none'; }} />
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {imgs.length === 3 && (
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                    {imgs.map((img, i) => (
                                      <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', height: '180px', background: '#F1F5F9' }}>
                                        <img src={img} alt={`${loc.locationName} ${i + 1}`}
                                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                          onError={(e) => { e.target.parentElement.style.display = 'none'; }} />
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {imgs.length >= 4 && (
                                  <div>
                                    {/* Hero image */}
                                    <div style={{ borderRadius: '12px', overflow: 'hidden', height: '240px', background: '#F1F5F9', marginBottom: '10px' }}>
                                      <img src={imgs[0]} alt={`${loc.locationName} main`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                        onError={(e) => { e.target.parentElement.style.display = 'none'; }} />
                                    </div>
                                    {/* Thumbnail row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(imgs.length - 1, 4)}, 1fr)`, gap: '10px' }}>
                                      {imgs.slice(1, 5).map((img, i) => (
                                        <div key={i} style={{
                                          borderRadius: '10px', overflow: 'hidden', height: '90px',
                                          background: '#F1F5F9', position: 'relative'
                                        }}>
                                          <img src={img} alt={`${loc.locationName} ${i + 2}`}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                            onError={(e) => { e.target.parentElement.style.display = 'none'; }} />
                                          {i === 3 && imgs.length > 5 && (
                                            <div style={{
                                              position: 'absolute', inset: 0,
                                              background: 'rgba(15,23,42,0.65)',
                                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                                              color: '#fff', fontWeight: '800', fontSize: '18px', letterSpacing: '-0.5px'
                                            }}>+{imgs.length - 5}</div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{
                                padding: '36px 20px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                background: 'linear-gradient(135deg, #F8FAFF 0%, #EFF6FF 100%)', gap: '10px'
                              }}>
                                <div style={{ fontSize: '44px', opacity: 0.35 }}>🏢</div>
                                <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>No office images uploaded yet</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              
              <div className="interview-questions">
                <h3>Expectations from Candidates</h3>
                <ul className="question-list">
                  {selectedRecruiter.interviewQuestions.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </div>

              {/* Awards & Achievements */}
              {selectedRecruiter.awards && selectedRecruiter.awards.length > 0 && (
                <div className="awards-achievements">
                  <h3 className="awards-heading">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                    Awards & Achievements
                  </h3>
                  <div className="awards-grid">
                    {selectedRecruiter.awards.map((award, index) => {
                      const description = award.description || '';
                      const isLong = description.length > 120;
                      const previewText = isLong ? description.slice(0, 120).trimEnd() + '…' : description;
                      return (
                        <div key={index} className="award-card">
                          {award.image && (
                            <div className="award-card-image">
                              <img src={award.image} alt={award.title} />
                            </div>
                          )}
                          <div className="award-card-content">
                            <div className="award-badge">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                            </div>
                            <h4 className="award-card-title">{award.title}</h4>
                            {description && (
                              <p className="award-card-description">{previewText}</p>
                            )}
                            {isLong && (
                              <button
                                className="award-read-more-btn"
                                onClick={() => setSelectedAward(award)}
                                aria-label={`Read more about ${award.title}`}
                              >
                                Read More
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Award Detail Modal */}
              {selectedAward && (
                <div
                  className="award-modal-overlay"
                  onClick={() => setSelectedAward(null)}
                  role="dialog"
                  aria-modal="true"
                  aria-label={`Award details: ${selectedAward.title}`}
                >
                  <div
                    className="award-modal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="award-modal-close"
                      onClick={() => setSelectedAward(null)}
                      aria-label="Close"
                    >
                      ✕
                    </button>
                    {selectedAward.image && (
                      <div className="award-modal-image">
                        <img src={selectedAward.image} alt={selectedAward.title} />
                      </div>
                    )}
                    <div className="award-modal-body">
                      <div className="award-modal-badge">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                        Achievement
                      </div>
                      <h3 className="award-modal-title">{selectedAward.title}</h3>
                      <p className="award-modal-description">{selectedAward.description}</p>
                    </div>
                  </div>
                </div>
              )}
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
          ? `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${encodeURI(heroImages[currentImageIndex]?.url)})` 
          : 'linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(/recruiterbanner.jpg)', 
        height: '500px',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        transition: 'background-image 1s ease-in-out',
        backgroundColor: '#1a202c'
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
        {filteredRecruiters.length > 0 ? (
          <div className="recruiters-grid">
            {filteredRecruiters.map(recruiter => {
              // Get first letter of recruiter name for avatar
              const avatarLetter = recruiter.recruiterName ? recruiter.recruiterName.charAt(0).toUpperCase() : 'R';
              
              return (
                <div 
                  key={recruiter.id} 
                  className="recruiter-card-new"
                >
                  {/* Top Section: Logo, Name, Industry Badge */}
                  <div className="recruiter-card-top">
                    <div className="recruiter-logo-new">
                      <img src={recruiter.logo} alt={`${recruiter.name} logo`} />
                    </div>
                    <div className="recruiter-header-info">
                      <div className="recruiter-name-row">
                        <h3 className="recruiter-name-new">{recruiter.name}</h3>
                        <span className="openings-badge">{recruiter.openJobs} Openings</span>
                      </div>
                      <span className="industry-badge">{recruiter.industry}</span>
                    </div>
                  </div>

                  {/* Location - Real Data */}
                  <div className="recruiter-location">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>{recruiter.location}{recruiter.pincode ? ` ${recruiter.pincode}` : ''}</span>
                  </div>

                  {/* Contact Person Section - Real Data */}
                  <div className="recruiter-contact-person">
                    <div className="contact-avatar">{avatarLetter}</div>
                    <div className="contact-info">
                      <h4>{recruiter.recruiterName}</h4>
                      <p>{recruiter.designation} • {recruiter.experience}</p>
                    </div>
                  </div>

                  {/* Description - Real Data */}
                  <p className="recruiter-description">
                    {recruiter.companyDescription}
                  </p>

                  {/* Office Images - Real Data */}
                  <div className="recruiter-office-images">
                    {recruiter.officeImages && recruiter.officeImages.length > 0 ? (
                      recruiter.officeImages.map((img, index) => (
                        <div 
                          key={index} 
                          className="office-img-placeholder"
                          style={{
                            backgroundImage: `url(${img})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        ></div>
                      ))
                    ) : (
                      // Show placeholder if no images
                      <>
                        <div className="office-img-placeholder"></div>
                        <div className="office-img-placeholder"></div>
                        <div className="office-img-placeholder"></div>
                      </>
                    )}
                    {/* Fill remaining slots with placeholders if less than 3 images */}
                    {recruiter.officeImages && recruiter.officeImages.length > 0 && recruiter.officeImages.length < 3 && (
                      Array.from({ length: 3 - recruiter.officeImages.length }).map((_, index) => (
                        <div key={`placeholder-${index}`} className="office-img-placeholder"></div>
                      ))
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="recruiter-card-actions" style={{
                    display: 'flex',
                    flexDirection: user && user.role === 'institute' ? 'row' : 'column',
                    gap: '10px',
                    justifyContent: user && user.role === 'institute' ? 'space-between' : 'center',
                    alignItems: 'center'
                  }}>
                    <button 
                      className="view-profile-btn"
                      onClick={() => {
                        if (!isLoggedIn) {
                          onShowLogin();
                          return;
                        }
                        handleRecruiterSelect(recruiter);
                      }}
                      style={{
                        width: user && user.role === 'institute' ? 'auto' : '100%',
                        textAlign: 'center'
                      }}
                    >
                      View Profile
                    </button>
                    {user && user.role === 'institute' && (
                      <button 
                        className="campus-invite-btn"
                        onClick={() => handleCampusInvite(recruiter)}
                        disabled={campusRequestSent.has(recruiter.id)}
                      >
                        {campusRequestSent.has(recruiter.id) ? '✓ Request Sent' : 'Campus Invite'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-recruiters-found">
            <h3>No recruiters found matching your criteria</h3>
            <p>Try adjusting your search terms or check back later.</p>
          </div>
        )}
      </section>

      {/* Campus Invite Modal */}
      {showCampusInviteModal && campusInviteRecruiter && (
        <CampusInviteModal
          recruiter={campusInviteRecruiter}
          onClose={() => { setShowCampusInviteModal(false); setCampusInviteRecruiter(null); }}
          onSuccess={() => handleCampusInviteSuccess(campusInviteRecruiter.id)}
        />
      )}
    </div>
  );
};

export default RecruiterPage;