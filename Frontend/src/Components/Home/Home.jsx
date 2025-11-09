/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css';
import Footer from '../Footer/Footer';
import HomeImage from '../../assets/Home.jpg';
import JobCard from '../common/JobCard';
import CourseCard from '../common/CourseCard';
import apiWithLoading from '../../services/apiWithLoading';
import { getSectors, getRolesForSector } from '../../utils/sectorRoleData';

function Home() {
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
   
   // Review states
   const [reviews, setReviews] = useState([]);
   const [reviewRating, setReviewRating] = useState(0);
   const [reviewFeedback, setReviewFeedback] = useState('');
   const [reviewsLoading, setReviewsLoading] = useState(false);
   const [showMoreReviews, setShowMoreReviews] = useState(false);
   const [reviewOffset, setReviewOffset] = useState(0);

   const sectors = getSectors();
   const API_KEY = 'Rzk1SnVRU3NDTWpzb2ZiMERwU1RKTXRpT0R4Nmh0ZmhsZHlNM0pacw==';


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
   }, []);

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
                   expectedSalary: 'Contact for rates',
                   phone: staff.phone || '+91-XXXXXXXXXX',
                   email: staff.email || 'Email not available',
                   resume: staff.resumeUrl || 'https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document',
                   location: staff.address || 'Location not specified',
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
               setTrendingJobsData(response.data);
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
                   education: detailedProfile.education || {}
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
       if (job.recruiterId) {
           // Redirect to recruiter page
           window.location.href = `/recruiter/${job.recruiterId}`;
       }
   };

   const handleViewCourse = (course) => {
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
           
           console.log('Search params:', searchParams);
           
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
                   expectedSalary: 'Contact for rates',
                   phone: staff.phone || '+91-XXXXXXXXXX',
                   email: staff.email || 'Email not available',
                   resume: staff.resumeUrl || 'https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document',
                   location: staff.address || 'Location not specified',
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
           <section className="hero-section">
               <div className="hero-image" style={{ backgroundImage: `url(${HomeImage})` }}>
                   <div className="home-search-container">
                       <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
                           <option value="">Select State</option>
                           {states.map((state) => (
                               <option key={state.iso2} value={state.iso2}>{state.name}</option>
                           ))}
                       </select>

                       <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                           <option value="">Select City</option>
                           {cities.map((city) => (
                               <option key={city.id} value={city.id}>{city.name}</option>
                           ))}
                       </select>

                       <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)}>
                           <option value="">Select Sector</option>
                           {sectors.map((sector, index) => (
                               <option key={index} value={sector}>{sector}</option>
                           ))}
                       </select>

                       <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} disabled={!selectedSector}>
                           <option value="">Select Role</option>
                           {availableRoles.map((role, index) => (
                               <option key={index} value={role}>{role}</option>
                           ))}
                       </select>

                       <button className="home-search-btn" onClick={handleSearch} disabled={isSearching}>
                           {isSearching ? 'Searching...' : 'Search'}
                       </button>
                       
                       {showSearchResults && (
                           <button className="home-clear-btn" onClick={clearSearch}>
                               Clear
                           </button>
                       )}
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
                                       <div className="clean-avatar">
                                           {staff.photo ? (
                                               <img src={staff.photo} alt={staff.name} className="avatar-img" />
                                           ) : (
                                               <div className="avatar-placeholder">
                                                   {staff.name?.charAt(0) || 'S'}
                                               </div>
                                           )}
                                       </div>
                                       <div className="clean-info">
                                           <h3 className="clean-name">{staff.name}</h3>
                                           <p className="clean-profession">{staff.profession}</p>
                                           {staff.sector && staff.role && (
                                               <p className="clean-sector-role">{staff.sector} - {staff.role}</p>
                                           )}
                                           {staff.state && staff.city && (
                                               <p className="clean-location-info">{staff.city}, {staff.state}</p>
                                           )}
                                           <div className="clean-rating">
                                               <span className="rating-text">
                                                   ⭐ {staff.rating ? `${staff.rating}` : '0.0'} (0 reviews)
                                               </span>
                                               <span className={`status-badge ${getAvailabilityStatus(staff.availability).class}`}>
                                                   {staff.availability?.charAt(0)?.toUpperCase() + staff.availability?.slice(1) || 'Available'}
                                               </span>
                                           </div>
                                       </div>
                                   </div>
                                   
                                   <div className="clean-location">
                                       <span className="location-icon">📍</span>
                                       <span>
                                           {staff.fullData?.address && staff.city && staff.state 
                                               ? `${staff.fullData.address}, ${staff.city}, ${staff.state}${staff.pincode ? `, ${staff.pincode}` : ''}` 
                                               : (staff.state && staff.city 
                                                   ? `${staff.city}, ${staff.state}${staff.pincode ? `, ${staff.pincode}` : ''}` 
                                                   : staff.location
                                               )
                                           }
                                       </span>
                                   </div>
                                   
                                   <div className="clean-details">
                                       <span>Experience: {staff.experience}</span>
                                   </div>
                                   
                                   <div className="clean-rate">
                                       <span>Contact for rates</span>
                                   </div>
                                   
                                   <div className="clean-skills">
                                       {staff.skills.slice(0, 2).map((skill, skillIndex) => (
                                           <span key={skillIndex} className="skill-tag">{skill}</span>
                                       ))}
                                       {staff.skills.length > 2 && (
                                           <span className="more-skills">+{staff.skills.length - 2} more</span>
                                       )}
                                   </div>
                                   
                                   <div className="clean-actions">
                                       <button 
                                           className="clean-view-btn"
                                           onClick={() => handleViewProfile(staff)}
                                       >
                                           View Profile
                                       </button>
                                       <button 
                                           className="clean-contact-btn"
                                           onClick={() => handleCall(staff.phone, staff)}
                                       >
                                           📞
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
                           {selectedStaff.resume && (
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
                                               {selectedStaff.state && selectedStaff.city 
                                                   ? `${selectedStaff.city}, ${selectedStaff.state}` 
                                                   : (selectedStaff.address || 'Location not specified')
                                               }
                                           </span>
                                           {selectedStaff.pincode && (
                                               <span className="pincode-display"> - {selectedStaff.pincode}</span>
                                           )}
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
                                           <span className="detail-label">Phone:</span>
                                           <span>{selectedStaff.phone}</span>
                                       </div>
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

                                   <div className="clean-contact-section">
                                       <h4>Contact Options</h4>
                                       <div className="clean-contact-buttons">
                                           <button 
                                               className="contact-option-btn call-btn"
                                               onClick={() => handleCall(selectedStaff.phone, selectedStaff)}
                                           >
                                               <span className="contact-icon">📞</span>
                                               Call
                                           </button>
                                           <button 
                                               className="contact-option-btn whatsapp-btn"
                                               onClick={() => handleWhatsApp(selectedStaff.phone, selectedStaff.name)}
                                           >
                                               <span className="contact-icon">💬</span>
                                               WhatsApp
                                           </button>
                                           <button 
                                               className="contact-option-btn email-btn"
                                               onClick={() => handleEmail(selectedStaff.email, selectedStaff.name)}
                                           >
                                               <span className="contact-icon">📧</span>
                                               Email
                                           </button>
                                       </div>
                                   </div>
                               </div>
                           )}

                           {viewMode === 'resume' && selectedStaff.resume && (
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