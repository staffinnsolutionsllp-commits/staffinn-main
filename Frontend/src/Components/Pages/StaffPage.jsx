/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from "../../context/AuthContext";
import apiWithLoading from "../../services/apiWithLoading";
import { getSectors, getRolesForSector } from '../../utils/sectorRoleData';
import './StaffPage.css';
import Footer from '../Footer/Footer';
import RegistrationPopup from '../Register/RegistrationPopup';
import StaffpageImage from '../../assets/Staffpage.jpg';

function StaffPage() {
    const { user, isStaff } = useContext(AuthContext);
    
    // State to track if user has staff profile
    const [hasStaffProfile, setHasStaffProfile] = useState(false);
    const [checkingStaffProfile, setCheckingStaffProfile] = useState(true);
    
    // States for API data
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [areas, setAreas] = useState([]);
    
    // Selected filter values
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedSector, setSelectedSector] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedExperience, setSelectedExperience] = useState('');
    const [selectedAvailability, setSelectedAvailability] = useState('');
    const [minimumRating, setMinimumRating] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [skillsInput, setSkillsInput] = useState('');
    const [availableRoles, setAvailableRoles] = useState([]);

    // Loading and error states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Real staff data from backend
    const [staffMembers, setStaffMembers] = useState([]);
    const [filteredStaff, setFilteredStaff] = useState([]);

   const API_KEY = 'Rzk1SnVRU3NDTWpzb2ZiMERwU1RKTXRpT0R4Nmh0ZmhsZHlNM0pacw==';
    const sectors = getSectors();
    
    // Experience levels
    const experienceLevels = [
        'Fresher (0-1 Year)',
        'Junior (1-3 Years)', 
        'Mid-Level (3-5 Years)',
        'Senior (5+ Years)'
    ];
    
    // Availability options
    const availabilityOptions = [
        'available',
        'busy', 
        'part-time'
    ];
    
    // Rating options
    const ratingOptions = ['3', '4', '5'];

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

    // State for profile preview
    const [selectedStaff, setSelectedStaff] = useState(null);
    
    // State for registration popup
    const [showRegistrationPopup, setShowRegistrationPopup] = useState(false);

    // State for modal and view mode
    const [showModal, setShowModal] = useState(false);
    const [viewMode, setViewMode] = useState('profile'); // 'profile', 'resume', 'certificate'
    
    // State for contact functionality
    const [contactedStaff, setContactedStaff] = useState(new Set());
    const [hiredStaff, setHiredStaff] = useState(new Set());
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [currentHiringId, setCurrentHiringId] = useState(null);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    
    // Review states
    const [reviews, setReviews] = useState([]);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewFeedback, setReviewFeedback] = useState('');
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [showMoreReviews, setShowMoreReviews] = useState(false);
    const [reviewOffset, setReviewOffset] = useState(0);

    // Fetch states using API
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
    }, []);

    // Fetch cities when state is selected
    useEffect(() => {
        const fetchCities = async () => {
            if (!selectedState) {
                setCities([]);
                return;
            }
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

    // Check if current user has staff profile
    useEffect(() => {
        const checkUserStaffProfile = async () => {
            if (!user) {
                setCheckingStaffProfile(false);
                return;
            }
            
            try {
                // Check if user is already registered as staff
                if (isStaff()) {
                    setHasStaffProfile(true);
                    setCheckingStaffProfile(false);
                    return;
                }
                
                // Check if user has staff profile in DynamoDB
                const response = await apiWithLoading.getStaffProfile();
                if (response.success && response.data) {
                    setHasStaffProfile(true);
                }
            } catch (error) {
                // If error (like 404), user doesn't have staff profile
                console.log('User does not have staff profile');
            } finally {
                setCheckingStaffProfile(false);
            }
        };
        
        checkUserStaffProfile();
    }, [user, isStaff]);

    // Fetch active staff profiles from backend
    useEffect(() => {
        fetchActiveStaffProfiles();
    }, []);

    const fetchActiveStaffProfiles = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiWithLoading.getActiveStaffProfiles();
            
            if (response.success) {
                setStaffMembers(response.data);
                setFilteredStaff(response.data);
            } else {
                throw new Error(response.message || 'Failed to fetch staff profiles');
            }
        } catch (error) {
            console.error('Error fetching staff profiles:', error);
            setError('Failed to load staff profiles. Please try again.');
            setStaffMembers([]);
            setFilteredStaff([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter staff based on all criteria
    useEffect(() => {
        let filtered = [...staffMembers];

        // Search term filter
        if (searchTerm.trim()) {
            filtered = filtered.filter(staff => 
                staff.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                staff.skills?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                staff.address?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // State filter
        if (selectedState) {
            const selectedStateName = states.find(state => state.iso2 === selectedState)?.name;
            if (selectedStateName) {
                filtered = filtered.filter(staff => 
                    staff.state === selectedStateName
                );
            }
        }

        // City filter
        if (selectedCity) {
            const selectedCityName = cities.find(city => city.id === parseInt(selectedCity))?.name;
            if (selectedCityName) {
                filtered = filtered.filter(staff => 
                    staff.city === selectedCityName
                );
            }
        }

        // Skills filter (text input)
        if (skillsInput.trim()) {
            filtered = filtered.filter(staff => 
                staff.skills?.toLowerCase().includes(skillsInput.toLowerCase())
            );
        }
        
        // Sector filter
        if (selectedSector) {
            filtered = filtered.filter(staff => 
                staff.sector === selectedSector
            );
        }
        
        // Role filter
        if (selectedRole) {
            filtered = filtered.filter(staff => 
                staff.role === selectedRole
            );
        }

        // Experience filter
        if (selectedExperience) {
            filtered = filtered.filter(staff => {
                const experiences = staff.experiences || [];
                if (experiences.length === 0) return selectedExperience === 'Fresher';
                
                // Calculate total experience from all experiences
                const totalExperience = experiences.reduce((total, exp) => {
                    if (exp.startDate && exp.endDate) {
                        const start = new Date(exp.startDate);
                        const end = new Date(exp.endDate);
                        const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
                        return total + years;
                    }
                    return total;
                }, 0);

                switch (selectedExperience) {
                    case 'Fresher':
                        return totalExperience <= 1;
                    case 'Junior':
                        return totalExperience > 1 && totalExperience <= 3;
                    case 'Mid-Level':
                        return totalExperience > 3 && totalExperience <= 5;
                    case 'Senior':
                        return totalExperience > 5;
                    default:
                        return true;
                }
            });
        }

        // Availability filter
        if (selectedAvailability) {
            filtered = filtered.filter(staff => 
                staff.availability === selectedAvailability
            );
        }

        // Rating filter (if you have rating data)
        if (minimumRating) {
            filtered = filtered.filter(staff => 
                (staff.rating || 0) >= parseInt(minimumRating)
            );
        }

        setFilteredStaff(filtered);
    }, [staffMembers, searchTerm, selectedState, selectedCity, skillsInput, selectedSector, selectedRole, selectedExperience, selectedAvailability, minimumRating, states, cities]);

    // Get experience level from staff data
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

    // Get skills array from staff data
    const getSkillsArray = (staff) => {
        if (!staff.skills) return [];
        return staff.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
    };

    // Handle view profile click
    const handleViewProfile = async (staff) => {
        try {
            // Record profile view
            if (user) {
                await apiWithLoading.recordProfileView(staff.userId);
            }
            
            // Fetch detailed staff profile
            const response = await apiWithLoading.getStaffProfileById(staff.userId);
            
            if (response.success) {
                const detailedProfile = response.data;
                setSelectedStaff({
                    ...detailedProfile,
                    name: detailedProfile.fullName,
                    profession: detailedProfile.skills?.split(',')[0] || 'Professional',
                    photo: detailedProfile.profilePhoto,
                    skillsArray: getSkillsArray(detailedProfile),
                    experienceLevel: getExperienceLevel(detailedProfile),
                    phone: detailedProfile.phone || '+91-XXXXXXXXXX',
                    email: detailedProfile.email,
                    resume: detailedProfile.resumeUrl,
                    certificates: detailedProfile.certificates || [],
                    workExperience: detailedProfile.experiences || [],
                    education: detailedProfile.education || {}
                });
                setViewMode('profile');
                document.dispatchEvent(new CustomEvent('modal-open'));
                setShowModal(true);
                
                // Load reviews for this staff member
                loadReviews(staff.userId);
            } else {
                alert('Failed to load profile details');
            }
        } catch (error) {
            console.error('Error fetching profile details:', error);
            alert('Failed to load profile details');
        }
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
        if (!user) {
            alert('Please login to submit a review');
            return;
        }
        
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
                setFilteredStaff(prev => prev.map(staff => 
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

    // Close modal
    const closeModal = () => {
        document.dispatchEvent(new CustomEvent('modal-close'));
        setShowModal(false);
        setSelectedStaff(null);
        setViewMode('profile');
        setReviews([]);
        setReviewRating(0);
        setReviewFeedback('');
        setReviewOffset(0);
    };
    
    // Handle contact actions with contact history recording
    const handleCall = async (phone, staffData) => {
        if (phone && phone !== '+91-XXXXXXXXXX') {
            window.open(`tel:${phone}`, '_self');
            await recordContact(staffData, 'call');
        } else {
            alert('Phone number not available');
        }
    };

    const handleWhatsApp = async (phone, name, staffData) => {
        if (phone && phone !== '+91-XXXXXXXXXX') {
            const message = `Hi ${name}, I found your profile on Staffinn. I'm interested in hiring you.`;
            window.open(`https://wa.me/${phone.replace('+91-', '91')}?text=${encodeURIComponent(message)}`, '_blank');
            await recordContact(staffData, 'whatsapp');
        } else {
            alert('Phone number not available');
        }
    };

    const handleEmail = async (email, name, staffData) => {
        if (email) {
            const subject = `Job Opportunity - Staffinn`;
            const body = `Hi ${name},\n\nI found your profile on Staffinn and I'm interested in hiring you.\n\nPlease let me know if you're available.\n\nBest regards`;
            window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
            await recordContact(staffData, 'email');
        } else {
            alert('Email not available');
        }
    };
    
    // Record contact interaction
    const recordContact = async (staffData, contactType) => {
        if (!user) {
            console.log('User not logged in, skipping contact recording');
            return;
        }
        
        try {
            console.log('Recording contact interaction:', { staffData, contactType });
            
            const response = await apiWithLoading.recordContact({
                staffId: staffData.userId,
                contactMethod: contactType
            });
            
            if (response.success) {
                console.log('Contact recorded successfully:', response.data);
                setContactedStaff(prev => new Set([...prev, staffData.userId]));
            } else {
                console.error('Failed to record contact:', response.message);
            }
        } catch (error) {
            console.error('Error recording contact:', error);
        }
    };
    
    // Handle Mark as Hired
    const handleMarkAsHired = (staffData) => {
        setHiredStaff(prev => new Set([...prev, staffData.userId]));
        setShowRatingModal(true);
    };
    
    // Handle rating submission
    const handleRatingSubmit = async () => {
        if (rating === 0) {
            alert('Please provide a rating.');
            return;
        }
        
        try {
            // For now, just show success message
            alert(`You hired ${selectedStaff.name}!`);
            setShowRatingModal(false);
            setRating(0);
            setFeedback('');
            setCurrentHiringId(null);
        } catch (error) {
            console.error('Error submitting rating:', error);
            alert('Failed to submit rating.');
        }
    };

    // Handle register button click - directly go to Staff form
    const handleRegisterClick = () => {
        setSelectedRole('Staff');
        setShowRegistrationPopup(true);
    };

    // Handle registration popup close
    const handleCloseRegistration = () => {
        setShowRegistrationPopup(false);
        setSelectedRole(null);
    };

    // Handle registration completion
    const handleRegistration = (userData, role) => {
        console.log('Registration data:', userData, 'Role:', role);
        alert(`Successfully registered as ${role}!`);
        setShowRegistrationPopup(false);
        setSelectedRole(null);
        // Refresh staff profiles after registration
        fetchActiveStaffProfiles();
    };

    // Handle search button click
    const handleSearch = () => {
        // The filtering is already handled by useEffect, so this just triggers a re-render
        // You can add additional search logic here if needed
        console.log('Searching with filters:', {
            selectedState,
            selectedCity,
            selectedSector,
            selectedRole,
            skillsInput
        });
    };

    // Get trending staff (staff with high ratings and recent activity)
    const trendingStaff = filteredStaff
        .filter(staff => (staff.rating || 0) >= 4.5)
        .slice(0, 4);

    return (
        <div className="staff-page">
            {/* Hero Section with Search */}
            <section className="staff-hero-section" style={{backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${StaffpageImage})`}}>
                <div className="hero-content">
                    <h1>Find Skilled Staff</h1>
                    <p>Connect with qualified professionals for your needs</p>
                </div>
                <div className="search-container">
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

                    <input 
                        type="text" 
                        placeholder="Enter Skills" 
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        className="search-input"
                    />

                    <button className="search-btn" onClick={handleSearch}>Search</button>
                </div>
            </section>

            {/* Advanced Filters Section */}
            <section className="advanced-filters-section">
                <div className="filters-container">
                    <div className="filter-group">
                        <input 
                            type="text" 
                            placeholder="Search by name or skills" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    
                    <div className="filter-group">
                        <select 
                            value={selectedExperience}
                            onChange={(e) => setSelectedExperience(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">Any Experience</option>
                            {experienceLevels.map((level, index) => (
                                <option key={index} value={level.split(' ')[0]}>{level}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <select 
                            value={selectedAvailability}
                            onChange={(e) => setSelectedAvailability(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">Any Availability</option>
                            {availabilityOptions.map((option, index) => (
                                <option key={index} value={option}>
                                    {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <select 
                            value={minimumRating}
                            onChange={(e) => setMinimumRating(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">Any Rating</option>
                            {ratingOptions.map((rating, index) => (
                                <option key={index} value={rating}>{rating}+ Stars</option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            {/* Loading and Error States */}
            {loading && (
                <div className="loading-section">
                    <div className="loading-spinner">Loading staff profiles...</div>
                </div>
            )}

            {error && (
                <div className="error-section">
                    <div className="error-message">
                        <p>{error}</p>
                        <button onClick={fetchActiveStaffProfiles} className="retry-btn">Retry</button>
                    </div>
                </div>
            )}

            {/* Staff Listing Section */}
            {!loading && !error && (
                <section className="staff-listing-section">
                    <h2>Available Staff ({filteredStaff.length})</h2>
                    
                    <div className="staff-cards-container">
                        {filteredStaff.length > 0 ? (
                            filteredStaff.map(staff => (
                                <div 
                                    className="clean-staff-card" 
                                    key={staff.userId}
                                >
                                    <div className="clean-card-header">
                                        <div className="clean-avatar">
                                            {staff.profilePhoto ? (
                                                <img src={staff.profilePhoto} alt={staff.fullName} className="avatar-img" />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {staff.fullName?.charAt(0) || 'S'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="clean-info">
                                            <h3 className="clean-name">{staff.fullName}</h3>
                                            <p className="clean-profession">{staff.skills?.split(',')[0] || 'Professional'}</p>
                                            <div className="clean-rating">
                                                <span className="rating-text">
                                                    ⭐ {staff.rating ? `${staff.rating}` : '0.0'} 
                                                    {staff.reviewCount ? ` (${staff.reviewCount} reviews)` : ' (0 reviews)'}
                                                </span>
                                                <span className={`status-badge ${staff.availability?.toLowerCase()?.replace(' ', '-') || 'available'}`}>
                                                    {staff.availability?.charAt(0)?.toUpperCase() + staff.availability?.slice(1) || 'Available'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {staff.sector && staff.role && (
                                        <div className="clean-sector-role">{staff.sector} - {staff.role}</div>
                                    )}
                                    {staff.address && staff.city && staff.state && (
                                        <div className="clean-location-info">
                                            {staff.address}, {staff.city}, {staff.state}{staff.pincode ? `, ${staff.pincode}` : ''}
                                        </div>
                                    )}
                                    

                                    
                                    <div className="clean-details">
                                        <span>Experience: {getExperienceLevel(staff)}</span>
                                    </div>
                                    
                                    <div className="clean-rate">
                                        <span>Contact for rates</span>
                                    </div>
                                    
                                    <div className="clean-skills">
                                        {getSkillsArray(staff).slice(0, 2).map((skill, index) => (
                                            <span key={index} className="skill-tag">{skill}</span>
                                        ))}
                                        {getSkillsArray(staff).length > 2 && (
                                            <span className="more-skills">+{getSkillsArray(staff).length - 2} more</span>
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
                            <div className="no-results">
                                <p>No staff members match your search criteria. Try adjusting your filters.</p>
                            </div>
                        )}
                    </div>
                </section>
            )}
            
            {/* Trending Staff Section */}
            {!loading && trendingStaff.length > 0 && (
                <section className="trending-staff-section">
                    <div className="section-header">
                        <h2>Top Rated Staff</h2>
                    </div>
                    <div className="trending-staff-container">
                        {trendingStaff.map((staff, index) => (
                            <div key={index} className="trending-staff-card">
                                <div className="profile-placeholder">
                                    {staff.profilePhoto ? (
                                        <img src={staff.profilePhoto} alt={staff.fullName} className="trending-avatar" />
                                    ) : (
                                        <span>{staff.fullName?.charAt(0) || 'S'}</span>
                                    )}
                                </div>
                                <h3>{staff.fullName}</h3>
                                <p>{staff.skills?.split(',')[0] || 'Professional'}</p>
                                <p className="staff-rating">Rating: {staff.rating || 'New'}⭐</p>
                                <button 
                                    className="view-profile-btn"
                                    onClick={() => handleViewProfile(staff)}
                                >
                                    View Profile
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Industry Insights Section */}
            <section className="insights-section">
                <h2>Industry Insights</h2>
                <div className="insights-container">
                    <div className="insight-card">
                        <h3>Trending Skills</h3>
                        <ul className="trending-skills">
                            <li>
                                <span className="skill-name">Web Development</span>
                                <div className="skill-demand">
                                    <div className="demand-bar" style={{ width: '85%' }}></div>
                                </div>
                            </li>
                            <li>
                                <span className="skill-name">Mobile Development</span>
                                <div className="skill-demand">
                                    <div className="demand-bar" style={{ width: '78%' }}></div>
                                </div>
                            </li>
                            <li>
                                <span className="skill-name">Data Science</span>
                                <div className="skill-demand">
                                    <div className="demand-bar" style={{ width: '90%' }}></div>
                                </div>
                            </li>
                            <li>
                                <span className="skill-name">Electrical Work</span>
                                <div className="skill-demand">
                                    <div className="demand-bar" style={{ width: '65%' }}></div>
                                </div>
                            </li>
                        </ul>
                    </div>
                    
                    <div className="insight-card">
                        <h3>Earning Potential</h3>
                        <div className="earning-potential">
                            <div className="earning-category">
                                <h4>Technical Staff</h4>
                                <div className="salary-range">
                                    <span>₹40,000</span>
                                    <div className="range-bar">
                                        <div className="range-fill"></div>
                                    </div>
                                    <span>₹120,000</span>
                                </div>
                            </div>
                            
                            <div className="earning-category">
                                <h4>Healthcare</h4>
                                <div className="salary-range">
                                    <span>₹35,000</span>
                                    <div className="range-bar">
                                        <div className="range-fill"></div>
                                    </div>
                                    <span>₹80,000</span>
                                </div>
                            </div>
                            
                            <div className="earning-category">
                                <h4>Skilled Labor</h4>
                                <div className="salary-range">
                                    <span>₹20,000</span>
                                    <div className="range-bar">
                                        <div className="range-fill"></div>
                                    </div>
                                    <span>₹45,000</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="insight-card">
                        <h3>Career Guidance</h3>
                        <div className="career-guidance">
                            <div className="guidance-tip">
                                <h4>Boost Your Tech Career</h4>
                                <p>Add these certifications to increase hiring chances:</p>
                                <ul>
                                    <li>AWS Certified Solutions Architect</li>
                                    <li>Google Cloud Professional</li>
                                    <li>Microsoft Azure Fundamentals</li>
                                </ul>
                            </div>
                            
                            <div className="guidance-tip">
                                <h4>Skilled Trade Enhancement</h4>
                                <p>Get these certifications for higher pay:</p>
                                <ul>
                                    <li>Advanced Electrical Licensing</li>
                                    <li>Commercial Plumbing Certification</li>
                                    <li>Industrial HVAC Specialist</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Call to Action Section - Only show if user is not registered as staff */}
            {!checkingStaffProfile && !hasStaffProfile && (
                <section className="cta-section">
                    <div className="cta-content">
                        <h2>Are You a Skilled Professional?</h2>
                        <p>Join our platform to connect with top recruiters and find your next opportunity</p>
                        <button className="cta-button" onClick={handleRegisterClick}>Register as Staff</button>
                    </div>
                </section>
            )}

            {/* Clean Staff Profile Modal */}
            {showModal && selectedStaff && (
                <div className="clean-modal-overlay" onClick={closeModal}>
                    <div className="clean-modal-content" onClick={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
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
                                                {selectedStaff.address && selectedStaff.city && selectedStaff.state 
                                                    ? `${selectedStaff.address}, ${selectedStaff.city}, ${selectedStaff.state}${selectedStaff.pincode ? `, ${selectedStaff.pincode}` : ''}` 
                                                    : (selectedStaff.state && selectedStaff.city 
                                                        ? `${selectedStaff.city}, ${selectedStaff.state}${selectedStaff.pincode ? `, ${selectedStaff.pincode}` : ''}` 
                                                        : (selectedStaff.address || 'Location not specified')
                                                    )
                                                }
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
                                                onClick={() => handleWhatsApp(selectedStaff.phone, selectedStaff.name, selectedStaff)}
                                            >
                                                <span className="contact-icon">💬</span>
                                                WhatsApp
                                            </button>
                                            <button 
                                                className="contact-option-btn email-btn"
                                                onClick={() => handleEmail(selectedStaff.email, selectedStaff.name, selectedStaff)}
                                            >
                                                <span className="contact-icon">📧</span>
                                                Email
                                            </button>
                                        </div>
                                        
                                        {/* Show Mark as Hired section after contact is made */}
                                        {contactedStaff.has(selectedStaff.userId) && !hiredStaff.has(selectedStaff.userId) && (
                                            <div className="hiring-section">
                                                <p className="hiring-message">
                                                    If you have already talked to the staff and want to hire them, then click on Mark as Hired.
                                                </p>
                                                <button 
                                                    className="mark-as-hired-btn"
                                                    onClick={() => handleMarkAsHired(selectedStaff)}
                                                >
                                                    Mark as Hired
                                                </button>
                                            </div>
                                        )}
                                        
                                        {/* Show hired confirmation */}
                                        {hiredStaff.has(selectedStaff.userId) && (
                                            <div className="hired-confirmation">
                                                <div className="hired-success">
                                                    <span className="success-icon">✅</span>
                                                    <span>You hired {selectedStaff.name}!</span>
                                                </div>
                                            </div>
                                        )}
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

            {/* Registration Popup */}
            {showRegistrationPopup && (
                <RegistrationPopup
                    onClose={handleCloseRegistration}
                    onRegister={handleRegistration}
                    initialRole={selectedRole}
                />
            )}
            
            {/* Rating Modal */}
            {showRatingModal && (
                <div className="rating-modal-overlay" onClick={() => setShowRatingModal(false)}>
                    <div className="rating-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="rating-modal-header">
                            <h3>Rate Your Experience</h3>
                            <button className="rating-modal-close" onClick={() => setShowRatingModal(false)}>×</button>
                        </div>
                        <div className="rating-modal-body">
                            <div className="rating-stars">
                                <p>How was your experience with this staff member?</p>
                                <div className="stars">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            className={`star ${rating >= star ? 'active' : ''}`}
                                            onClick={() => setRating(star)}
                                        >
                                            ⭐
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="rating-feedback">
                                <label>Feedback (Optional):</label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Share your experience..."
                                    rows="4"
                                />
                            </div>
                            <div className="rating-modal-actions">
                                <button className="rating-cancel-btn" onClick={() => setShowRatingModal(false)}>
                                    Cancel
                                </button>
                                <button className="rating-submit-btn" onClick={handleRatingSubmit}>
                                    Submit Rating
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

export default StaffPage;