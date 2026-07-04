/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './Home.css';
import Footer from '../Footer/Footer';
import HomeImage from '../../assets/Home.jpg';
import JobCard from '../common/JobCard';
import CourseCard from '../common/CourseCard';
import apiWithLoading from '../../services/apiWithLoading';
import { getSectors, getRolesForSector } from '../../utils/sectorRoleData';
import { AuthContext } from '../../context/AuthContext';
import ChatButton from '../Messages/ChatButton';
import { FaComments, FaEnvelope, FaWhatsapp, FaSearch, FaBriefcase, FaFileAlt, FaCheckCircle, FaRocket, FaShieldAlt } from 'react-icons/fa';
import { FaLinkedin, FaXTwitter, FaInstagram, FaFacebook, FaYoutube, FaGithub, FaGlobe } from 'react-icons/fa6';

function Home({ isLoggedIn, onShowLogin }) {
   const { user } = useContext(AuthContext);
   const [states, setStates] = useState([]);
   const [cities, setCities] = useState([]);
   const [areas, setAreas] = useState([]);
   const [selectedState, setSelectedState] = useState('');
   const [selectedCity, setSelectedCity] = useState('');
   const [selectedSector, setSelectedSector] = useState('');
   const [selectedRole, setSelectedRole] = useState('');
   const [availableRoles, setAvailableRoles] = useState([]);
   const [searchResults, setSearchResults] = useState([]);
   const [isSearching, setIsSearching] = useState(false);
   const [showSearchResults, setShowSearchResults] = useState(false);
   const [showModal, setShowModal] = useState(false);
   const [selectedStaff, setSelectedStaff] = useState(null);
   const [viewMode, setViewMode] = useState('profile'); // 'profile', 'photo', 'resume', 'certificate', 'reviews'
   const [trendingStaffData, setTrendingStaffData] = useState([]);
   const [trendingStaffLoading, setTrendingStaffLoading] = useState(true);
   const [trendingJobsData, setTrendingJobsData] = useState([]);
   const [trendingJobsLoading, setTrendingJobsLoading] = useState(true);
   const [trendingCoursesData, setTrendingCoursesData] = useState([]);
   const [trendingCoursesLoading, setTrendingCoursesLoading] = useState(true);
   const [heroImages, setHeroImages] = useState([]);
   const [currentImageIndex, setCurrentImageIndex] = useState(0);
   
   // Review states
   const [reviews, setReviews] = useState([]);
   const [reviewRating, setReviewRating] = useState(0);
   const [reviewFeedback, setReviewFeedback] = useState('');
   const [reviewsLoading, setReviewsLoading] = useState(false);
   const [showMoreReviews, setShowMoreReviews] = useState(false);
   const [reviewOffset, setReviewOffset] = useState(0);

   const sectors = getSectors();
   const API_KEY = 'Rzk1SnVRU3NDTWpzb2ZiMERwU1RKTXRpT0R4Nmh0ZmhsZHlNM0pacw==';


   const handleFindJobs = () => {
       window.location.href = '/jobs';
   };

   const handlePostJob = () => {
       // Check if user is logged in
       if (!isLoggedIn) {
           alert('Please login to post a job');
           onShowLogin();
           return;
       }
       
       // Check if user is a recruiter
       if (user && user.role?.toLowerCase() === 'recruiter') {
           // Redirect to recruiter dashboard job management section
           window.location.href = '/dashboard/recruiter#job-management';
       } else {
           alert('Only recruiters can post jobs. Please register as a recruiter to access this feature.');
       }
   };

   const getAvailabilityStatus = (availability) => {
      switch(availability) {
         case 'Available':
            return { text: 'Available ✓', class: 'available' };
         case 'Busy':
            return { text: 'Busy ✗', class: 'busy' };
         case 'Open for Offers':
            return { text: 'Open for Offers', class: 'open-for-offers' };
         default:
            return { text: 'Available ✓', class: 'available' };
      }
   };

   useEffect(() => {
       const fetchStates = async () => {
           try {
               const response = await axios.get(
                   'https://api.countrystatecity.in/v1/countries/IN/states',
                   { headers: { "X-CSCAPI-KEY": API_KEY } }
               );
               setStates(response.data);
           } catch (error) {
               console.error('Error fetching states:', error);
           }
       };
       fetchStates();
       loadTrendingStaff();
       loadTrendingJobs();
       loadTrendingCourses();
       loadHeroImages();
       
       // Refresh hero images every 10 seconds to catch updates
       const heroImageInterval = setInterval(() => {
           loadHeroImages();
       }, 10000);
       
       return () => clearInterval(heroImageInterval);
   }, []);

   // Load hero images from API
   const loadHeroImages = async () => {
       try {
           // Add timestamp to prevent caching
           const timestamp = new Date().getTime();
           const response = await axios.get(
               `${import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1'}/hero-images/home/public?t=${timestamp}`,
               {
                   headers: {
                       'Cache-Control': 'no-cache',
                       'Pragma': 'no-cache'
                   }
               }
           );
           
           if (response.data.success && response.data.data.images && response.data.data.images.length > 0) {
               setHeroImages(response.data.data.images);
               setCurrentImageIndex(0); // Reset to first image
           } else {
               setHeroImages([]);
               setCurrentImageIndex(0);
           }
       } catch (error) {
           console.error('❌ Error loading hero images:', error);
           setHeroImages([]);
           setCurrentImageIndex(0);
       }
   };

   // Slideshow effect for multiple images
   useEffect(() => {
       if (heroImages.length > 1) {
           const interval = setInterval(() => {
               setCurrentImageIndex((prevIndex) => {
                   const nextIndex = prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1;
                   return nextIndex;
               });
           }, 5000); // Change image every 5 seconds
           
           return () => clearInterval(interval);
       } else {
           setCurrentImageIndex(0);
       }
   }, [heroImages]);

   // Get current hero image
   const getCurrentHeroImage = () => {
       if (heroImages.length > 0) {
           const currentImage = heroImages[currentImageIndex];
           if (currentImage?.url) {
               return currentImage.url;
           }
       }
       return HomeImage; // Fallback to default image
   };

   // Update available roles when sector changes
   useEffect(() => {
       if (selectedSector) {
           const roles = getRolesForSector(selectedSector);
           setAvailableRoles(roles);
           setSelectedRole(''); // Reset role when sector changes
       } else {
           setAvailableRoles([]);
           setSelectedRole('');
       }
   }, [selectedSector]);

   const loadTrendingStaff = async () => {
       try {
           setTrendingStaffLoading(true);
           // Try the new trending staff API first
           let response = await apiWithLoading.getTrendingStaff(6);
           
           // If trending API fails, fallback to active staff profiles
           if (!response.success) {
               response = await apiWithLoading.getActiveStaffProfiles();
           }
           
           if (response.success && response.data) {
               let staffData = response.data;
               
               // If using fallback API, sort by profile views
               if (!response.data.some(staff => staff.profileViews !== undefined)) {
                   staffData = response.data
                       .sort((a, b) => (b.profileViews || 0) - (a.profileViews || 0))
                       .slice(0, 6);
               }
               
               const formattedStaff = staffData.map(staff => ({
                   name: staff.fullName,
                   profession: staff.skills?.split(',')[0] || 'Professional',
                   rating: staff.rating || '0.0',
                   photo: staff.profilePhoto || `https://via.placeholder.com/150x150/4863f7/white?text=${staff.fullName?.charAt(0) || 'S'}`,
                   skills: staff.skills ? staff.skills.split(',').map(s => s.trim()) : [],
                   certificates: staff.certificates || [],
                   workExperience: staff.experiences?.map(exp => `${exp.jobTitle} at ${exp.company}`).join(', ') || 'Experience not specified',
                   education: staff.education?.degree || 'Education not specified',
                   expectedSalary: 'Contact by Chat',
                   phone: staff.phone || '+91-XXXXXXXXXX',
                   email: staff.email || 'Email not available',
                   resume: staff.resumeUrl || 'https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document',
                   location: staff.address || 'Location not specified',
                   area: staff.area,
                   pincode: staff.pincode,
                   experience: staff.experiences?.length ? `${staff.experiences.length} Years` : 'Fresher',
                   availability: staff.availability || 'Available',
                   userId: staff.userId,
                   sector: staff.sector,
                   role: staff.role,
                   state: staff.state,
                   city: staff.city,
                   // Add all the original staff data for detailed view
                   fullData: staff
               }));
               
               setTrendingStaffData(formattedStaff);
           }
       } catch (error) {
           console.error('Error loading trending staff:', error);
           setTrendingStaffData([]);
       } finally {
           setTrendingStaffLoading(false);
       }
   };

   const loadTrendingJobs = async () => {
       try {
           setTrendingJobsLoading(true);
           const response = await apiWithLoading.getTrendingJobs(8);
           
           if (response.success && response.data) {
               // Enhance job data with recruiter info including logo
               const enhancedJobs = await Promise.all(response.data.map(async (job) => {
                   // Try to fetch recruiter details to get logo
                   try {
                       const recruiterResponse = await apiWithLoading.getRecruiterById(job.recruiterId);
                       
                       if (recruiterResponse.success && recruiterResponse.data) {
                           const recruiter = recruiterResponse.data;
                           
                           // Process logo URL
                           let logoUrl = null;
                           if (recruiter.profilePhoto) {
                               if (recruiter.profilePhoto.startsWith('http://') || recruiter.profilePhoto.startsWith('https://')) {
                                   logoUrl = recruiter.profilePhoto;
                               } else {
                                   const backendUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4001';
                                   logoUrl = `${backendUrl}${recruiter.profilePhoto}`;
                               }
                           }
                           
                           return {
                               ...job,
                               recruiterInfo: {
                                   companyName: recruiter.companyName || job.recruiterInfo?.companyName || 'Company',
                                   companyLogo: logoUrl,
                                   logo: logoUrl,
                                   profilePhoto: logoUrl,
                                   verified: true
                               }
                           };
                       }
                   } catch (error) {
                       // Silently handle error
                   }
                   
                   // Fallback if recruiter fetch fails
                   return {
                       ...job,
                       recruiterInfo: {
                           companyName: job.recruiterInfo?.companyName || 'Company',
                           verified: true
                       }
                   };
               }));
               
               setTrendingJobsData(enhancedJobs);
           } else {
               console.error('Failed to load trending jobs:', response.message);
               setTrendingJobsData([]);
           }
       } catch (error) {
           console.error('Error loading trending jobs:', error);
           setTrendingJobsData([]);
       } finally {
           setTrendingJobsLoading(false);
       }
   };

   const loadTrendingCourses = async () => {
       try {
           setTrendingCoursesLoading(true);
           const response = await apiWithLoading.getTrendingCourses(6);
           
           if (response.success && response.data) {
               setTrendingCoursesData(response.data);
           } else {
               console.error('Failed to load trending courses:', response.message);
               setTrendingCoursesData([]);
           }
       } catch (error) {
           console.error('Error loading trending courses:', error);
           setTrendingCoursesData([]);
       } finally {
           setTrendingCoursesLoading(false);
       }
   };

   useEffect(() => {
       const fetchCities = async () => {
           if (!selectedState) return;
           try {
               const response = await fetch(
                   `https://api.countrystatecity.in/v1/countries/IN/states/${selectedState}/cities`,
                   { 
                       method: 'GET',
                       headers: { "X-CSCAPI-KEY": API_KEY }
                   }
               );
               const data = await response.json();
               setCities(data);
           } catch (error) {
               console.error('Error fetching cities:', error);
           }
       };
       fetchCities();
   }, [selectedState]);

   const handleViewProfile = async (staff) => {
       // Check authentication first
       if (!isLoggedIn) {
           onShowLogin();
           return;
       }
       
       try {
           // Use the same API call as StaffPage to get detailed profile
           const response = await apiWithLoading.getStaffProfileById(staff.userId);
           
           if (response.success) {
               const detailedProfile = response.data;
               setSelectedStaff({
                   ...detailedProfile,
                   name: detailedProfile.fullName,
                   profession: detailedProfile.skills?.split(',')[0] || 'Professional',
                   photo: detailedProfile.profilePhoto,
                   skillsArray: detailedProfile.skills ? detailedProfile.skills.split(',').map(s => s.trim()) : [],
                   experienceLevel: getExperienceLevel(detailedProfile),
                   phone: detailedProfile.phone || '+91-XXXXXXXXXX',
                   email: detailedProfile.email,
                   resume: detailedProfile.resumeUrl,
                   certificates: detailedProfile.certificates || [],
                   workExperience: detailedProfile.experiences || [],
                   education: detailedProfile.education || {},
                   area: detailedProfile.area
               });
               setViewMode('profile');
               setShowModal(true);
               
               // Load reviews for this staff member
               loadReviews(detailedProfile.userId);
           } else {
               alert('Failed to load profile details');
           }
       } catch (error) {
           console.error('Error fetching profile details:', error);
           alert('Failed to load profile details');
       }
   };

   // Helper function to get experience level (same as StaffPage)
   const getExperienceLevel = (staff) => {
       const experiences = staff.experiences || [];
       if (experiences.length === 0) return 'Fresher';
       
       const totalExperience = experiences.reduce((total, exp) => {
           if (exp.startDate && exp.endDate) {
               const start = new Date(exp.startDate);
               const end = new Date(exp.endDate);
               const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
               return total + years;
           }
           return total;
       }, 0);

       if (totalExperience <= 1) return 'Fresher';
       if (totalExperience <= 3) return 'Junior';
       if (totalExperience <= 5) return 'Mid-Level';
       return 'Senior';
   };

   // Load reviews for staff member
   const loadReviews = async (staffId, offset = 0) => {
       try {
           setReviewsLoading(true);
           const response = await apiWithLoading.getReviews(staffId, 10, offset);
           
           if (response.success) {
               if (offset === 0) {
                   setReviews(response.data.reviews);
               } else {
                   setReviews(prev => [...prev, ...response.data.reviews]);
               }
               setShowMoreReviews(response.data.hasMore);
               setReviewOffset(offset + 10);
           }
       } catch (error) {
           console.error('Error loading reviews:', error);
       } finally {
           setReviewsLoading(false);
       }
   };
   
   // Submit review
   const handleSubmitReview = async () => {
       if (reviewRating === 0) {
           alert('Please select a rating');
           return;
       }
       
       try {
           const response = await apiWithLoading.addReview(selectedStaff.userId, reviewRating, reviewFeedback);
           
           if (response.success) {
               alert('Review submitted successfully!');
               setReviewRating(0);
               setReviewFeedback('');
               
               // Reload reviews and update staff rating
               loadReviews(selectedStaff.userId, 0);
               
               // Update staff rating in the list
               setTrendingStaffData(prev => prev.map(staff => 
                   staff.userId === selectedStaff.userId 
                       ? { ...staff, rating: response.data.averageRating, reviewCount: response.data.reviewCount }
                       : staff
               ));
               
               // Update selected staff rating
               setSelectedStaff(prev => ({
                   ...prev,
                   rating: response.data.averageRating,
                   reviewCount: response.data.reviewCount
               }));
           } else {
               alert('Failed to submit review: ' + response.message);
           }
       } catch (error) {
           console.error('Error submitting review:', error);
           alert('Failed to submit review');
       }
   };

   const closeModal = () => {
       setShowModal(false);
       setSelectedStaff(null);
       setViewMode('profile');
       setReviews([]);
       setReviewRating(0);
       setReviewFeedback('');
       setReviewOffset(0);
   };

   const handleWhatsApp = (phone, name) => {
       const message = `Hi ${name}, I found your profile on Staffinn. I'm interested in hiring you.`;
       window.open(`https://wa.me/${phone.replace('+91-', '91')}?text=${encodeURIComponent(message)}`, '_blank');
   };

   const handleEmail = (email, name) => {
       const subject = `Job Opportunity - Staffinn`;
       const body = `Hi ${name},\n\nI found your profile on Staffinn and I'm interested in hiring you.\n\nPlease let me know if you're available.\n\nBest regards`;
       window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
   };

   const handleCall = (phone, staff) => {
       if (phone && phone !== '+91-XXXXXXXXXX') {
           window.open(`tel:${phone}`, '_self');
       } else {
           alert('Phone number not available');
       }
   };

   const handleViewJob = (job) => {
       // Check authentication first
       if (!isLoggedIn) {
           onShowLogin();
           return;
       }
       
       const recruiterId = job.recruiterId;
       const jobId = job.jobId || job.id;
       
       if (recruiterId && jobId) {
           // Redirect to recruiter page with job ID for scroll and highlight
           window.location.href = `/recruiter/${recruiterId}#job-${jobId}`;
       } else if (recruiterId) {
           // Fallback: just go to recruiter page
           window.location.href = `/recruiter/${recruiterId}`;
       }
   };

   const handleViewCourse = (course) => {
       // Check authentication first
       if (!isLoggedIn) {
           onShowLogin();
           return;
       }
       
       if (course.instituteId) {
           // Redirect to institute page
           window.location.href = `/institute/${course.instituteId}`;
       }
   };

   const handleSearch = async () => {
       try {
           setIsSearching(true);
           
           // Get selected state and city names
           const selectedStateName = selectedState ? states.find(s => s.iso2 === selectedState)?.name : '';
           const selectedCityName = selectedCity ? cities.find(c => c.id === selectedCity)?.name : '';
           
           const searchParams = {
               state: selectedStateName,
               city: selectedCityName,
               sector: selectedSector,
               role: selectedRole
           };
           
           // If no search criteria selected, show trending staff
           if (!selectedState && !selectedCity && !selectedSector && !selectedRole) {
               setShowSearchResults(false);
               return;
           }
           
           const response = await apiWithLoading.searchStaff(searchParams);
           
           if (response.success) {
               // Format search results similar to trending staff
               const formattedResults = response.data.map(staff => ({
                   name: staff.fullName,
                   profession: staff.sector && staff.role ? `${staff.role}` : (staff.skills?.split(',')[0] || 'Professional'),
                   rating: staff.rating || '0.0',
                   photo: staff.profilePhoto || `https://via.placeholder.com/150x150/4863f7/white?text=${staff.fullName?.charAt(0) || 'S'}`,
                   skills: staff.skills ? staff.skills.split(',').map(s => s.trim()) : [],
                   certificates: staff.certificates || [],
                   workExperience: staff.experiences?.map(exp => `${exp.jobTitle} at ${exp.company}`).join(', ') || 'Experience not specified',
                   education: staff.education?.degree || 'Education not specified',
                   expectedSalary: 'Contact by Chat',
                   phone: staff.phone || '+91-XXXXXXXXXX',
                   email: staff.email || 'Email not available',
                   resume: staff.resumeUrl || 'https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document',
                   location: staff.address || 'Location not specified',
                   area: staff.area,
                   pincode: staff.pincode,
                   experience: staff.experiences?.length ? `${staff.experiences.length} Years` : 'Fresher',
                   availability: staff.availability || 'Available',
                   userId: staff.userId,
                   sector: staff.sector,
                   role: staff.role,
                   state: staff.state,
                   city: staff.city,
                   fullData: staff
               }));
               
               setSearchResults(formattedResults);
               setShowSearchResults(true);
           } else {
               console.error('Search failed:', response.message);
               setSearchResults([]);
               setShowSearchResults(true);
           }
       } catch (error) {
           console.error('Search error:', error);
           setSearchResults([]);
           setShowSearchResults(true);
       } finally {
           setIsSearching(false);
       }
   };

   const clearSearch = () => {
       setSelectedState('');
       setSelectedCity('');
       setSelectedSector('');
       setSelectedRole('');
       setSearchResults([]);
       setShowSearchResults(false);
       setCities([]);
       setAvailableRoles([]);
   };

   return (
       <div className="home-page">
           <section className="hero-section" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '5rem', paddingBottom: '5rem' }}>
               {/* Background Layer with Image Slideshow */}
               <div 
                   className="hero-image" 
                   style={{ 
                       position: 'absolute',
                       top: 0,
                       left: 0,
                       width: '100%',
                       height: '100%',
                       backgroundImage: `url("${getCurrentHeroImage()}")`,
                       backgroundSize: 'cover',
                       backgroundPosition: 'center',
                       backgroundRepeat: 'no-repeat',
                       filter: 'brightness(0.85)',
                       zIndex: 0
                   }}
               />
               
               {/* Slideshow Indicators */}
               {heroImages.length > 1 && (
                   <div className="slideshow-indicators" style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 10 }}>
                       {heroImages.map((_, index) => (
                           <span 
                               key={index} 
                               className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                               onClick={() => setCurrentImageIndex(index)}
                               style={{ width: '12px', height: '12px', borderRadius: '50%', background: index === currentImageIndex ? 'rgba(37,99,235,1)' : 'rgba(255,255,255,0.5)', border: '2px solid rgba(255,255,255,0.8)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                           />
                       ))}
                   </div>
               )}
               
               {/* Main Content */}
               <div style={{ position: 'relative', zIndex: 4, width: '100%', maxWidth: '80rem', margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
                   {/* Badge */}
                   <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '9999px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', marginBottom: '2rem' }}>
                       <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                       <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>India's trusted talent & recruitment network</span>
                   </div>
                   
                   {/* Headline */}
                   <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: 'white', marginBottom: '1.5rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                       Hire Smarter. Connect Faster. <span style={{ color: '#2563EB' }}>Grow Stronger.</span>
                   </h1>
                   
                   {/* Subheading */}
                   <p style={{ fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', color: '#cbd5e1', maxWidth: '42rem', margin: '0 auto 2rem', fontWeight: 500, lineHeight: 1.6 }}>
                       Staffinn brings together verified professionals, recruiters, and institutes — so the right people meet the right opportunities, faster.
                   </p>
                   
                   {/* Feature Pills */}
                   <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '9999px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }}>
                           <FaRocket style={{ color: '#10B981', fontSize: '1.25rem' }} />
                           <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>Smart Skill Matching</span>
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '9999px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }}>
                           <FaShieldAlt style={{ color: '#10B981', fontSize: '1.25rem' }} />
                           <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>Verified Recruiters</span>
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '9999px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }}>
                           <FaCheckCircle style={{ color: '#10B981', fontSize: '1.25rem' }} />
                           <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>Faster Hiring Process</span>
                       </div>
                   </div>
                   
                   {/* CTA Buttons */}
                   <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
                       <button 
                           onClick={handleFindJobs}
                           style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', borderRadius: '9999px', background: '#2563EB', color: 'white', fontSize: '0.875rem', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(37,99,235,0.3)', transition: 'all 0.3s ease' }} 
                           onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#1d4ed8'; }} 
                           onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#2563EB'; }}
                       >
                           <FaBriefcase style={{ fontSize: '1.1rem' }} />
                           Find Jobs
                       </button>
                       <button 
                           onClick={handlePostJob}
                           style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.875rem', fontWeight: 700, border: '2px solid rgba(255,255,255,0.4)', cursor: 'pointer', backdropFilter: 'blur(12px)', transition: 'all 0.3s ease' }} 
                           onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }} 
                           onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                       >
                           <FaFileAlt style={{ fontSize: '1.1rem' }} />
                           Post a Job
                       </button>
                   </div>
                   
                   {/* Search Bar */}
                   <div style={{ maxWidth: '72rem', margin: '0 auto 1rem', padding: '1.25rem', borderRadius: '1rem', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(24px)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
                           <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} style={{ height: '3rem', padding: '0 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.95)', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer', outline: 'none' }}>
                               <option value="">Select State</option>
                               {states.map((state) => (
                                   <option key={state.iso2} value={state.iso2}>{state.name}</option>
                               ))}
                           </select>
                           <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} style={{ height: '3rem', padding: '0 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.95)', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer', outline: 'none' }}>
                               <option value="">Select City</option>
                               {cities.map((city) => (
                                   <option key={city.id} value={city.id}>{city.name}</option>
                               ))}
                           </select>
                           <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} style={{ height: '3rem', padding: '0 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.95)', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer', outline: 'none' }}>
                               <option value="">Select Sector</option>
                               {sectors.map((sector, index) => (
                                   <option key={index} value={sector}>{sector}</option>
                               ))}
                           </select>
                           <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} disabled={!selectedSector} style={{ height: '3rem', padding: '0 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.95)', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer', outline: 'none', opacity: !selectedSector ? 0.5 : 1 }}>
                               <option value="">Select Role</option>
                               {availableRoles.map((role, index) => (
                                   <option key={index} value={role}>{role}</option>
                               ))}
                           </select>
                           <button onClick={handleSearch} disabled={isSearching} style={{ height: '3rem', padding: '0 1.75rem', borderRadius: '0.75rem', background: '#2563EB', color: 'white', fontSize: '0.875rem', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.3s ease' }}>
                               <FaSearch style={{ fontSize: '1rem' }} />
                               {isSearching ? 'Searching...' : 'Search'}
                           </button>
                       </div>
                   </div>
                   
                   {/* Popular Searches */}
                   <p style={{ fontSize: '0.875rem', color: '#cbd5e1', textAlign: 'center', marginBottom: '2.5rem' }}>
                       Popular: <span style={{ color: 'white', cursor: 'pointer' }}>Software Developer</span> • <span style={{ color: 'white', cursor: 'pointer' }}>HR Manager</span> • <span style={{ color: 'white', cursor: 'pointer' }}>Data Analyst</span>
                   </p>
                   
                   {/* Stats */}
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxWidth: '72rem', margin: '0 auto' }}>
                       <div style={{ padding: '1.5rem 1rem', borderRadius: '1rem', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', textAlign: 'center' }}>
                           <div style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 600, color: 'white', marginBottom: '0.25rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>10,000+</div>
                           <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Staff</div>
                       </div>
                       <div style={{ padding: '1.5rem 1rem', borderRadius: '1rem', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', textAlign: 'center' }}>
                           <div style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 600, color: 'white', marginBottom: '0.25rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>500+</div>
                           <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recruiters</div>
                       </div>
                       <div style={{ padding: '1.5rem 1rem', borderRadius: '1rem', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', textAlign: 'center' }}>
                           <div style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 600, color: 'white', marginBottom: '0.25rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>200+</div>
                           <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Institutes</div>
                       </div>
                       <div style={{ padding: '1.5rem 1rem', borderRadius: '1rem', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', textAlign: 'center' }}>
                           <div style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 600, color: 'white', marginBottom: '0.25rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>95%</div>
                           <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Placement Success</div>
                       </div>
                   </div>
               </div>
           </section>

           <section className="home-trending-staff-section">
               <div className="home-section-header">
                   <h2>{showSearchResults ? 'Search Results' : 'Trending Staff'}</h2>
                   <p>{showSearchResults ? 'Staff matching your search criteria' : 'Top staff members based on profile views'}</p>
               </div>
               {(trendingStaffLoading || isSearching) ? (
                   <div className="loading-section">
                       <p>{isSearching ? 'Searching staff...' : 'Loading trending staff...'}</p>
                   </div>
               ) : (
                   <div className="home-trending-staff-container">
                       {(showSearchResults ? searchResults : trendingStaffData).length > 0 ? (
                           (showSearchResults ? searchResults : trendingStaffData).map((staff, index) => (
                               <div key={staff.userId || index} className="clean-staff-card">
                                   <div className="clean-card-header">
                                       <div className="staffinn-staff-label">
                                           staffinn staff
                                       </div>
                                       {staff.availability && (
                                           <span className={`status-badge ${staff.availability?.toLowerCase()?.replace(' ', '-') || 'available'}`}>
                                               {staff.availability?.charAt(0)?.toUpperCase() + staff.availability?.slice(1) || 'Available'}
                                           </span>
                                       )}
                                       <div className="clean-avatar">
                                           {staff.photo ? (
                                               <img src={staff.photo} alt={staff.name} className="avatar-img" />
                                           ) : (
                                               <div className="avatar-placeholder">
                                                   {staff.name?.charAt(0) || 'S'}
                                               </div>
                                           )}
                                       </div>
                                   </div>
                                   
                                   <div className="clean-info">
                                       <h3 className="clean-name">{staff.name}</h3>
                                       <p className="clean-profession">{staff.profession}</p>
                                       
                                       {staff.sector && staff.role && (
                                           <div className="clean-sector-role">{staff.sector} - {staff.role}</div>
                                       )}
                                       
                                       <div className="clean-skills">
                                           {staff.skills.slice(0, 3).map((skill, skillIndex) => (
                                               <span key={skillIndex} className="skill-tag">{skill}</span>
                                           ))}
                                           {staff.skills.length > 3 && (
                                               <span className="more-skills">+{staff.skills.length - 3}</span>
                                           )}
                                       </div>
                                   </div>
                                   
                                   <div className="clean-stats-row">
                                       <div className="clean-stat-item">
                                           <img src="/satisfaction.png" alt="Rating" className="stat-icon" />
                                           <div className="stat-value">
                                               {staff.rating ? parseFloat(staff.rating).toFixed(1) : '0.0'}
                                           </div>
                                           <div className="stat-label" style={{ color: '#000000' }}>Rating</div>
                                       </div>
                                       <div className="stat-divider"></div>
                                       <div className="clean-stat-item">
                                           <img src="/call.png" alt="Clients" className="stat-icon" />
                                           <div className="stat-value">
                                               {staff.reviewCount || 0}
                                           </div>
                                           <div className="stat-label" style={{ color: '#000000' }}>Clients</div>
                                       </div>
                                       <div className="stat-divider"></div>
                                       <div className="clean-stat-item">
                                           <img src="/certification_11112875.png" alt="Experience" className="stat-icon" />
                                           <div className="stat-value">
                                               {staff.experience?.includes('Year') ? staff.experience.split(' ')[0] : (staff.experience === 'Fresher' ? '0' : '0')}
                                           </div>
                                           <div className="stat-label" style={{ color: '#000000' }}>Experience</div>
                                       </div>
                                   </div>
                                   
                                   <div className="clean-actions">
                                       {/* Social icons on card — only if links exist */}
                                       {staff.socialLinks && Object.values(staff.socialLinks).some(v => v) && (
                                           <div className="card-social-icons">
                                               {staff.socialLinks.linkedin && <a href={staff.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="card-social-link"><FaLinkedin style={{color:'#0A66C2'}}/></a>}
                                               {staff.socialLinks.twitter && <a href={staff.socialLinks.twitter} target="_blank" rel="noopener noreferrer" title="X (Twitter)" className="card-social-link"><FaXTwitter style={{color:'#000'}}/></a>}
                                               {staff.socialLinks.instagram && <a href={staff.socialLinks.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" className="card-social-link"><FaInstagram style={{color:'#E1306C'}}/></a>}
                                               {staff.socialLinks.facebook && <a href={staff.socialLinks.facebook} target="_blank" rel="noopener noreferrer" title="Facebook" className="card-social-link"><FaFacebook style={{color:'#1877F2'}}/></a>}
                                               {staff.socialLinks.youtube && <a href={staff.socialLinks.youtube} target="_blank" rel="noopener noreferrer" title="YouTube" className="card-social-link"><FaYoutube style={{color:'#FF0000'}}/></a>}
                                               {staff.socialLinks.github && <a href={staff.socialLinks.github} target="_blank" rel="noopener noreferrer" title="GitHub" className="card-social-link"><FaGithub style={{color:'#24292e'}}/></a>}
                                               {staff.socialLinks.portfolio && <a href={staff.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" title="Portfolio" className="card-social-link"><FaGlobe style={{color:'#4863f7'}}/></a>}
                                           </div>
                                       )}
                                       <button 
                                           className="clean-view-btn"
                                           onClick={() => handleViewProfile(staff)}
                                       >
                                           Get In Touch
                                       </button>
                                   </div>
                               </div>
                           ))
                       ) : (
                           <div className="no-staff-message">
                               <p>{showSearchResults ? 'No staff found matching your search criteria.' : 'No trending staff available at the moment.'}</p>
                               {showSearchResults && (
                                   <button className="clear-search-btn" onClick={clearSearch}>
                                       View Trending Staff
                                   </button>
                               )}
                           </div>
                       )}
                   </div>
               )}
           </section>

           <section className="home-trending-jobs-section">
               <div className="home-section-header">
                   <h2>Trending Jobs</h2>
                   <p>Most applied jobs from top recruiters</p>
               </div>
               {trendingJobsLoading ? (
                   <div className="loading-section">
                       <p>Loading trending jobs...</p>
                   </div>
               ) : (
                   <div className="job-cards-grid">
                       {trendingJobsData.length > 0 ? (
                           trendingJobsData.map((job) => (
                               <JobCard 
                                   key={job.jobId} 
                                   job={job} 
                                   onApply={handleViewJob}
                                   showApplyButton={true}
                                   buttonText="View Job"
                               />
                           ))
                       ) : (
                           <div className="no-jobs-message">
                               <p>No trending jobs available at the moment.</p>
                           </div>
                       )}
                   </div>
               )}
           </section>

           <section className="home-trending-courses-section">
               <div className="home-section-header">
                   <h2>Trending Courses</h2>
                   <p>Popular courses from top institutes</p>
               </div>
               {trendingCoursesLoading ? (
                   <div className="loading-section">
                       <p>Loading trending courses...</p>
                   </div>
               ) : (
                   <div className="courses-grid">
                       {trendingCoursesData.length > 0 ? (
                           trendingCoursesData.map(course => (
                               <CourseCard 
                                   key={course.coursesId} 
                                   course={course} 
                                   onViewCourse={handleViewCourse}
                                   buttonText="View Course"
                               />
                           ))
                       ) : (
                           <div className="no-courses-message">
                               <p>No trending courses available at the moment.</p>
                           </div>
                       )}
                   </div>
               )}
           </section>

           {/* Clean Staff Profile Modal */}
           {showModal && selectedStaff && (
               <div className="clean-modal-overlay" onClick={closeModal}>
                   <div className="clean-modal-content" onClick={(e) => e.stopPropagation()}>
                       <div className="clean-modal-header">
                           <div className="clean-modal-info">
                               <div className="clean-modal-avatar">
                                   {selectedStaff.photo ? (
                                       <img src={selectedStaff.photo} alt={selectedStaff.name} className="modal-avatar-img" />
                                   ) : (
                                       <div className="modal-avatar-placeholder">
                                           {selectedStaff.name?.charAt(0) || 'S'}
                                       </div>
                                   )}
                               </div>
                               <div className="clean-modal-details">
                                   <h2>{selectedStaff.name}</h2>
                                   <p className="modal-profession">{selectedStaff.profession}</p>
                                   <div className="modal-rating">
                                       <span className="star">⭐</span>
                                       <span className="rating-text">{selectedStaff.rating || 'New'}</span>
                                       <span className="experience-text">({selectedStaff.experienceLevel} level)</span>
                                   </div>
                               </div>
                           </div>
                           <button className="clean-modal-close" onClick={closeModal}>×</button>
                       </div>

                       <div className="clean-modal-nav">
                           <button 
                               className={`clean-nav-tab ${viewMode === 'profile' ? 'active' : ''}`} 
                               onClick={() => setViewMode('profile')}
                           >
                               Profile Details
                           </button>
                           {selectedStaff.resume && user && user.role?.toLowerCase() === 'recruiter' && (
                               <button 
                                   className={`clean-nav-tab ${viewMode === 'resume' ? 'active' : ''}`} 
                                   onClick={() => setViewMode('resume')}
                               >
                                   Resume
                               </button>
                           )}
                           {selectedStaff.certificates && selectedStaff.certificates.length > 0 && (
                               <button 
                                   className={`clean-nav-tab ${viewMode === 'certificate' ? 'active' : ''}`} 
                                   onClick={() => setViewMode('certificate')}
                               >
                                   Certificates
                               </button>
                           )}
                           <button 
                               className={`clean-nav-tab ${viewMode === 'reviews' ? 'active' : ''}`} 
                               onClick={() => setViewMode('reviews')}
                           >
                               Reviews
                           </button>
                       </div>

                       <div className="clean-modal-body">
                           {viewMode === 'profile' && (
                               <div className="clean-profile-content">
                                   <div className="clean-profile-section">
                                       <h4>Profile Details</h4>
                                       <div className="clean-detail-item">
                                           <span className="detail-icon">📍</span>
                                           <span>
                                               {[selectedStaff.area, selectedStaff.city, selectedStaff.state, selectedStaff.pincode].filter(Boolean).join(', ') || 'Location not specified'}
                                           </span>
                                       </div>
                                       {selectedStaff.sector && (
                                           <div className="clean-detail-item">
                                               <span className="detail-label">Sector:</span>
                                               <span>{selectedStaff.sector}</span>
                                           </div>
                                       )}
                                       {selectedStaff.role && (
                                           <div className="clean-detail-item">
                                               <span className="detail-label">Role:</span>
                                               <span>{selectedStaff.role}</span>
                                           </div>
                                       )}

                                       <div className="clean-detail-item">
                                           <span className="detail-label">Email:</span>
                                           <span>{selectedStaff.email}</span>
                                       </div>
                                       <div className="clean-detail-item">
                                           <span className="detail-label">Availability:</span>
                                           <span className={`clean-availability ${selectedStaff.availability?.toLowerCase()?.replace(' ', '-') || 'available'}`}>
                                               {selectedStaff.availability?.charAt(0)?.toUpperCase() + selectedStaff.availability?.slice(1) || 'Available'}
                                           </span>
                                       </div>
                                   </div>

                                   <div className="clean-profile-section">
                                       <h4>Skills</h4>
                                       <div className="clean-skills-list">
                                           {selectedStaff.skillsArray?.map((skill, index) => (
                                               <span key={index} className="clean-skill-tag">{skill}</span>
                                           )) || <span>No skills specified</span>}
                                       </div>
                                   </div>

                                   {selectedStaff.workExperience && selectedStaff.workExperience.length > 0 && (
                                       <div className="clean-profile-section">
                                           <h4>Work Experience</h4>
                                           {selectedStaff.workExperience.map((exp, index) => (
                                               <div key={index} className="experience-item">
                                                   <h5>{exp.role} at {exp.company}</h5>
                                                   <p className="experience-duration">
                                                       {exp.startDate} - {exp.endDate || 'Present'}
                                                   </p>
                                                   {exp.salary && <p className="experience-salary">Salary: {exp.salary}</p>}
                                               </div>
                                           ))}
                                       </div>
                                   )}

                                   {selectedStaff.education && (
                                       <div className="clean-profile-section">
                                           <h4>Education</h4>
                                           {selectedStaff.education.graduation?.degree && (
                                               <div className="education-item">
                                                   <h5>{selectedStaff.education.graduation.degree}</h5>
                                                   <p>{selectedStaff.education.graduation.college}</p>
                                                   <p>Percentage: {selectedStaff.education.graduation.percentage}</p>
                                                   <p>{selectedStaff.education.graduation.startDate} - {selectedStaff.education.graduation.endDate}</p>
                                               </div>
                                           )}
                                           {selectedStaff.education.twelfth?.percentage && (
                                               <div className="education-item">
                                                   <h5>12th Grade</h5>
                                                   <p>{selectedStaff.education.twelfth.school}</p>
                                                   <p>Percentage: {selectedStaff.education.twelfth.percentage}%</p>
                                                   <p>Year: {selectedStaff.education.twelfth.year}</p>
                                               </div>
                                           )}
                                           {selectedStaff.education.tenth?.percentage && (
                                               <div className="education-item">
                                                   <h5>10th Grade</h5>
                                                   <p>{selectedStaff.education.tenth.school}</p>
                                                   <p>Percentage: {selectedStaff.education.tenth.percentage}%</p>
                                                   <p>Year: {selectedStaff.education.tenth.year}</p>
                                               </div>
                                           )}
                                       </div>
                                   )}

                                   {/* Social Media Links in modal */}
                                   {selectedStaff.socialLinks && Object.values(selectedStaff.socialLinks).some(v => v) && (
                                       <div className="clean-profile-section">
                                           <h4>Social Media</h4>
                                           <div className="modal-social-links">
                                               {selectedStaff.socialLinks.linkedin && (
                                                   <a href={selectedStaff.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="modal-social-link linkedin" title="LinkedIn">
                                                       <FaLinkedin /> <span>LinkedIn</span>
                                                   </a>
                                               )}
                                               {selectedStaff.socialLinks.twitter && (
                                                   <a href={selectedStaff.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="modal-social-link twitter" title="X (Twitter)">
                                                       <FaXTwitter /> <span>X (Twitter)</span>
                                                   </a>
                                               )}
                                               {selectedStaff.socialLinks.instagram && (
                                                   <a href={selectedStaff.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="modal-social-link instagram" title="Instagram">
                                                       <FaInstagram /> <span>Instagram</span>
                                                   </a>
                                               )}
                                               {selectedStaff.socialLinks.facebook && (
                                                   <a href={selectedStaff.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="modal-social-link facebook" title="Facebook">
                                                       <FaFacebook /> <span>Facebook</span>
                                                   </a>
                                               )}
                                               {selectedStaff.socialLinks.youtube && (
                                                   <a href={selectedStaff.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="modal-social-link youtube" title="YouTube">
                                                       <FaYoutube /> <span>YouTube</span>
                                                   </a>
                                               )}
                                               {selectedStaff.socialLinks.github && (
                                                   <a href={selectedStaff.socialLinks.github} target="_blank" rel="noopener noreferrer" className="modal-social-link github" title="GitHub">
                                                       <FaGithub /> <span>GitHub</span>
                                                   </a>
                                               )}
                                               {selectedStaff.socialLinks.portfolio && (
                                                   <a href={selectedStaff.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="modal-social-link portfolio" title="Portfolio">
                                                       <FaGlobe /> <span>Portfolio</span>
                                                   </a>
                                               )}
                                           </div>
                                       </div>
                                   )}

                                   <div className="clean-contact-section">
                                       <h4>Contact Options</h4>
                                       <div className="clean-contact-buttons">
                                           <ChatButton 
                                               recipientId={selectedStaff.userId}
                                               recipientName={selectedStaff.name}
                                               buttonClass="contact-option-btn chat-btn"
                                               buttonText=""
                                           />
                                           <button 
                                               className="contact-option-btn email-btn"
                                               onClick={() => handleEmail(selectedStaff.email, selectedStaff.name)}
                                               title="Email"
                                               style={{
                                                   background: 'white',
                                                   color: '#4863f7',
                                                   border: '2px solid #e5e7eb',
                                                   width: '60px',
                                                   height: '60px',
                                                   borderRadius: '50%',
                                                   padding: '0',
                                                   display: 'flex',
                                                   alignItems: 'center',
                                                   justifyContent: 'center',
                                                   cursor: 'pointer',
                                                   transition: 'all 0.3s ease',
                                                   boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                               }}
                                               onMouseEnter={(e) => {
                                                   e.currentTarget.style.background = '#4863f7';
                                                   e.currentTarget.style.color = 'white';
                                                   e.currentTarget.style.borderColor = '#4863f7';
                                                   e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                                                   e.currentTarget.style.boxShadow = '0 6px 20px rgba(72, 99, 247, 0.4)';
                                               }}
                                               onMouseLeave={(e) => {
                                                   e.currentTarget.style.background = 'white';
                                                   e.currentTarget.style.color = '#4863f7';
                                                   e.currentTarget.style.borderColor = '#e5e7eb';
                                                   e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                   e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                               }}
                                           >
                                               <FaEnvelope style={{ fontSize: '30px' }} />
                                           </button>
                                           {user && user.role?.toLowerCase() === 'recruiter' && (
                                               <button 
                                                   className="contact-option-btn whatsapp-btn"
                                                   onClick={() => handleWhatsApp(selectedStaff.phone, selectedStaff.name)}
                                                   title="WhatsApp"
                                                   style={{
                                                       background: 'white',
                                                       color: '#4863f7',
                                                       border: '2px solid #e5e7eb',
                                                       width: '60px',
                                                       height: '60px',
                                                       borderRadius: '50%',
                                                       padding: '0',
                                                       display: 'flex',
                                                       alignItems: 'center',
                                                       justifyContent: 'center',
                                                       cursor: 'pointer',
                                                       transition: 'all 0.3s ease',
                                                       boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                                   }}
                                                   onMouseEnter={(e) => {
                                                       e.currentTarget.style.background = '#4863f7';
                                                       e.currentTarget.style.color = 'white';
                                                       e.currentTarget.style.borderColor = '#4863f7';
                                                       e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                                                       e.currentTarget.style.boxShadow = '0 6px 20px rgba(72, 99, 247, 0.4)';
                                                   }}
                                                   onMouseLeave={(e) => {
                                                       e.currentTarget.style.background = 'white';
                                                       e.currentTarget.style.color = '#4863f7';
                                                       e.currentTarget.style.borderColor = '#e5e7eb';
                                                       e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                       e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                                   }}
                                               >
                                                   <FaWhatsapp style={{ fontSize: '30px' }} />
                                               </button>
                                           )}
                                       </div>
                                   </div>
                               </div>
                           )}

                           {viewMode === 'resume' && selectedStaff.resume && user && user.role?.toLowerCase() === 'recruiter' && (
                               <div className="modern-resume-view">
                                   <div className="resume-container">
                                       <div className="resume-header">
                                           <h4>Resume - {selectedStaff.name}</h4>
                                           <a 
                                               href={selectedStaff.resume} 
                                               target="_blank" 
                                               rel="noopener noreferrer"
                                               className="download-btn"
                                           >
                                               📥 Download
                                           </a>
                                       </div>
                                       <div className="resume-preview">
                                           <iframe 
                                               src={selectedStaff.resume}
                                               title={`${selectedStaff.name}'s Resume`}
                                               className="resume-iframe"
                                               frameBorder="0"
                                           />
                                       </div>
                                   </div>
                               </div>
                           )}

                           {viewMode === 'certificate' && selectedStaff.certificates && selectedStaff.certificates.length > 0 && (
                               <div className="modern-certificate-view">
                                   <h4>Certificates & Qualifications</h4>
                                   <div className="modern-certificate-grid">
                                       {selectedStaff.certificates.map((cert, index) => (
                                           <div key={index} className="modern-certificate-card">
                                               <div className="certificate-badge">🏆</div>
                                               <div className="certificate-info">
                                                   <h5>{cert.name}</h5>
                                                   <p><strong>Issuer:</strong> {cert.issuer}</p>
                                                   <p><strong>Issued:</strong> {cert.issued}</p>
                                                   <p><strong>Duration:</strong> {cert.duration}</p>
                                                   {cert.url && (
                                                       <a 
                                                           href={cert.url} 
                                                           target="_blank" 
                                                           rel="noopener noreferrer"
                                                           className="view-certificate-link"
                                                       >
                                                           View Certificate
                                                       </a>
                                                   )}
                                               </div>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           )}

                           {viewMode === 'reviews' && (
                               <div className="reviews-section">
                                   <h4>Reviews & Ratings</h4>
                                   
                                   {/* Review Form */}
                                   <div className="review-form">
                                       <h5>Write a Review</h5>
                                       <div className="rating-input">
                                           <span>Rating: </span>
                                           {[1, 2, 3, 4, 5].map((star) => (
                                               <button
                                                   key={star}
                                                   className={`star-btn ${reviewRating >= star ? 'active' : ''}`}
                                                   onClick={() => setReviewRating(star)}
                                               >
                                                   ⭐
                                               </button>
                                           ))}
                                       </div>
                                       <textarea
                                           value={reviewFeedback}
                                           onChange={(e) => setReviewFeedback(e.target.value)}
                                           placeholder="Share your experience with this staff member..."
                                           rows="3"
                                       />
                                       <button 
                                           className="submit-review-btn"
                                           onClick={handleSubmitReview}
                                           disabled={reviewRating === 0}
                                       >
                                           Submit Review
                                       </button>
                                   </div>
                                   
                                   {/* Reviews List */}
                                   <div className="reviews-list">
                                       <h5>Previous Reviews ({reviews.length})</h5>
                                       {reviewsLoading && <p>Loading reviews...</p>}
                                       {reviews.length > 0 ? (
                                           <>
                                               {reviews.map((review) => (
                                                   <div key={review.reviewId} className="review-item">
                                                       <div className="review-header">
                                                           <span className="reviewer-name">{review.reviewerName}</span>
                                                           <div className="review-rating">
                                                               {[1, 2, 3, 4, 5].map((star) => (
                                                                   <span key={star} className={star <= review.rating ? 'star-filled' : 'star-empty'}>
                                                                       ⭐
                                                                   </span>
                                                               ))}
                                                           </div>
                                                           <span className="review-date">
                                                               {new Date(review.createdAt).toLocaleDateString()}
                                                           </span>
                                                       </div>
                                                       {review.feedback && (
                                                           <p className="review-feedback">{review.feedback}</p>
                                                       )}
                                                   </div>
                                               ))}
                                               {showMoreReviews && (
                                                   <button 
                                                       className="view-more-btn"
                                                       onClick={() => loadReviews(selectedStaff.userId, reviewOffset)}
                                                       disabled={reviewsLoading}
                                                   >
                                                       {reviewsLoading ? 'Loading...' : 'View More Reviews'}
                                                   </button>
                                               )}
                                           </>
                                       ) : (
                                           <p>No reviews yet. Be the first to review!</p>
                                       )}
                                   </div>
                               </div>
                           )}
                       </div>
                   </div>
               </div>
           )}

           <Footer />
       </div>
   );
}

export default Home;