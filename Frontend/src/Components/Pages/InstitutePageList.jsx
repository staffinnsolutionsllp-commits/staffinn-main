import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import apiWithLoading from '../../services/apiWithLoading';
import './InstitutePageList.css';
import '../Dashboard/Categories.css';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaCheckCircle, FaSearch, FaGraduationCap, FaUniversity, FaUserGraduate, FaChartLine, FaSchool, FaChalkboardTeacher, FaTh, FaList, FaBriefcase, FaCalendarAlt } from 'react-icons/fa';
import InstitutepageImage from '../../assets/Institutepage.jpg';
import { useGlobalLoading } from '../../hooks/useGlobalLoading';
import RecruiterCampusInviteModal from '../Dashboard/RecruiterCampusInviteModal';

const InstitutePageList = ({ isLoggedIn, onShowLogin, currentUser }) => {
  const [nameLocationSearch, setNameLocationSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [institutes, setInstitutes] = useState([]);
  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroImages, setHeroImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedState, setSelectedState] = useState('');
  const [stateSearchTerm, setStateSearchTerm] = useState('');
  const [selectedAffiliations, setSelectedAffiliations] = useState([]);
  const [staffinnVerifiedOnly, setStaffinnVerifiedOnly] = useState(false);
  const [experienceRange, setExperienceRange] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const heroSectionRef = useRef(null);
  const [selectedInstituteForInvite, setSelectedInstituteForInvite] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Use global loading hook
  const { withLoading } = useGlobalLoading();

  // Check if current user is a logged-in recruiter
  const isRecruiter = isLoggedIn && currentUser?.role === 'recruiter';

  // Load institutes from API
  useEffect(() => {
    loadInstitutes();
    loadHeroImages();
  }, []);

  const loadInstitutes = async () => {
    try {
      setLoading(true);
      const response = await apiWithLoading.getAllInstitutes();
      
      if (response.success && response.data) {
        // Transform API data to match component expectations
        const transformedInstitutes = await Promise.all(response.data.map(async (institute) => {
          // Fetch courses for each institute
          let courses = [];
          try {
            const coursesResponse = await apiWithLoading.getPublicCourses(institute.instituteId);
            if (coursesResponse.success && coursesResponse.data) {
              courses = coursesResponse.data;
            }
          } catch (error) {
            console.error(`Error fetching courses for institute ${institute.instituteId}:`, error);
          }
          
          return {
            id: institute.instituteId,
            name: institute.instituteName,
            location: institute.address,
            pincode: institute.pincode,
            phone: institute.phone,
            email: institute.email,
            website: institute.website,
            experience: institute.experience,
            badges: institute.badges || [],
            profileImage: institute.profileImage,
            courses: courses,
            categories: institute.categories || [], // Add categories from API
            isBrainaryVerified: institute.isLive || false,
            isTrendingAchiever: institute.isLive || false
          };
        }));
        setInstitutes(transformedInstitutes);
        setFilteredInstitutes(transformedInstitutes);
      } else {
        // Fallback to sample data if API fails
        const sampleInstitutes = [
          {
            id: 'sample-1',
            name: 'Sample Institute',
            location: 'Sample Location',
            phone: '+91 12345 67890',
            email: 'info@sample.edu',
            website: 'www.sample.edu',
            experience: 'Sample Experience',
            badges: ['Sample Badge'],
            isBrainaryVerified: false,
            isTrendingAchiever: false
          }
        ];
        setInstitutes(sampleInstitutes);
        setFilteredInstitutes(sampleInstitutes);
      }
    } catch (error) {
      console.error('Error loading institutes:', error);
      setInstitutes([]);
      setFilteredInstitutes([]);
    } finally {
      setLoading(false);
    }
  };

  // Load hero images from API
  const loadHeroImages = async () => {
    try {
      const timestamp = new Date().getTime();
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1'}/hero-images/institute/public?t=${timestamp}`;
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.data.success && response.data.data.images && response.data.data.images.length > 0) {
        setHeroImages(response.data.data.images);
        setCurrentImageIndex(0);
      } else {
        setHeroImages([]);
        setCurrentImageIndex(0);
      }
    } catch (error) {
      console.error('❌ Error loading institute hero images:', error);
      setHeroImages([]);
      setCurrentImageIndex(0);
    }
  };

  // Slideshow effect for multiple images
  useEffect(() => {
    let slideInterval;
    
    if (heroImages.length > 1) {
      setCurrentImageIndex(0);
      
      slideInterval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => {
          const nextIndex = prevIndex >= heroImages.length - 1 ? 0 : prevIndex + 1;
          return nextIndex;
        });
      }, 5000);
    } else {
      setCurrentImageIndex(0);
    }
    
    return () => {
      if (slideInterval) {
        clearInterval(slideInterval);
      }
    };
  }, [heroImages]);



  // Get current hero image (memoized)
  const currentHeroImage = useMemo(() => {
    if (heroImages.length > 0) {
      const validIndex = Math.max(0, Math.min(currentImageIndex, heroImages.length - 1));
      const currentImage = heroImages[validIndex];
      const imageUrl = currentImage?.url || InstitutepageImage;
      return imageUrl;
    }
    return InstitutepageImage;
  }, [heroImages, currentImageIndex]);

  // Update background image using ref
  useEffect(() => {
    if (heroSectionRef.current && currentHeroImage) {
      heroSectionRef.current.style.setProperty('background-image', `url("${currentHeroImage}")`, 'important');
      heroSectionRef.current.style.setProperty('background-size', 'cover', 'important');
      heroSectionRef.current.style.setProperty('background-position', 'center', 'important');
      heroSectionRef.current.style.setProperty('background-repeat', 'no-repeat', 'important');
    }
  }, [currentHeroImage]);

  // Extract unique affiliations from institutes
  const getUniqueAffiliations = () => {
    const affiliations = new Set();
    institutes.forEach(institute => {
      if (institute.badges && Array.isArray(institute.badges)) {
        institute.badges.forEach(badge => affiliations.add(badge));
      }
    });
    return Array.from(affiliations).sort();
  };

  const uniqueAffiliations = getUniqueAffiliations();

  // Extract unique states from institutes
  const getUniqueStates = () => {
    const states = new Set();
    institutes.forEach(institute => {
      if (institute.location) {
        const locationParts = institute.location.split(',').map(part => part.trim());
        const state = locationParts[locationParts.length - 1];
        if (state) states.add(state);
      }
    });
    return Array.from(states).sort();
  };

  const uniqueStates = getUniqueStates();

  // Filter states based on search term
  const filteredStates = uniqueStates.filter(state => 
    state.toLowerCase().includes(stateSearchTerm.toLowerCase())
  );

  // Filter institutes based on search terms and selected filter
  useEffect(() => {
    let results = institutes;
    
    // Apply name/location/pincode search filter
    if (nameLocationSearch) {
      results = results.filter(institute => 
        institute.name.toLowerCase().includes(nameLocationSearch.toLowerCase()) ||
        institute.location.toLowerCase().includes(nameLocationSearch.toLowerCase()) ||
        (institute.pincode && institute.pincode.toString().includes(nameLocationSearch))
      );
    }
    
    // Apply course search filter
    if (courseSearch) {
      results = results.filter(institute => 
        institute.courses && institute.courses.length > 0 && institute.courses.some(course => 
          course.courseName?.toLowerCase().includes(courseSearch.toLowerCase()) ||
          course.courseTitle?.toLowerCase().includes(courseSearch.toLowerCase()) ||
          course.name?.toLowerCase().includes(courseSearch.toLowerCase()) ||
          course.title?.toLowerCase().includes(courseSearch.toLowerCase())
        )
      );
    }
    
    // Apply state filter
    if (selectedState) {
      results = results.filter(institute => {
        if (institute.location) {
          const locationParts = institute.location.split(',').map(part => part.trim());
          const state = locationParts[locationParts.length - 1];
          return state === selectedState;
        }
        return false;
      });
    }
    
    // Apply category filter
    if (filter === 'colleges') {
      results = results.filter(institute => institute.categories && institute.categories.includes('Colleges'));
    } else if (filter === 'skill-vocational') {
      results = results.filter(institute => institute.categories && institute.categories.includes('Skill and Vocational'));
    } else if (filter === 'upskilling') {
      results = results.filter(institute => institute.categories && institute.categories.includes('Upskilling'));
    } else if (filter === 'school') {
      results = results.filter(institute => institute.categories && institute.categories.includes('School'));
    } else if (filter === 'coaching-centre') {
      results = results.filter(institute => institute.categories && institute.categories.includes('Coaching Centre'));
    }

    // Apply affiliation filter
    if (selectedAffiliations.length > 0) {
      results = results.filter(institute => 
        institute.badges && selectedAffiliations.some(aff => institute.badges.includes(aff))
      );
    }

    // Apply Staffinn Verified filter
    if (staffinnVerifiedOnly) {
      results = results.filter(institute => institute.isBrainaryVerified);
    }

    // Apply experience range filter
    if (experienceRange !== 'all') {
      results = results.filter(institute => {
        const exp = parseInt(institute.experience);
        if (isNaN(exp)) return false;
        
        switch(experienceRange) {
          case '0-5':
            return exp >= 0 && exp <= 5;
          case '5-10':
            return exp > 5 && exp <= 10;
          case '10-20':
            return exp > 10 && exp <= 20;
          case '20+':
            return exp > 20;
          default:
            return true;
        }
      });
    }
    
    setFilteredInstitutes(results);
  }, [nameLocationSearch, courseSearch, filter, institutes, selectedState, selectedAffiliations, staffinnVerifiedOnly, experienceRange]);

  return (
    <div className="institute-list-page">
      {/* Hero Section with Dynamic Images */}
      <div 
        ref={heroSectionRef}
        className="institute-search-section" 
        data-hero-image={currentHeroImage}
        data-has-images={heroImages.length > 0}
      >
        {heroImages.length > 1 && (
          <div className="slideshow-indicators" key={`indicators-${heroImages.length}`}>
            {heroImages.map((_, index) => (
              <span 
                key={`indicator-${index}-${heroImages[index]?.imageId || index}`}
                className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => {
                  setCurrentImageIndex(index);
                }}
                title={`Image ${index + 1} of ${heroImages.length}`}
              />
            ))}
          </div>
        )}
        <div className="hero-content">
          <h1 className="page-title">Find Your Institute</h1>
        </div>
        <div className="institute-search-container">
          <div className="dual-search-inputs">
            <input 
              type="text" 
              placeholder="Search by Name/Location/Pincode..." 
              value={nameLocationSearch}
              onChange={(e) => setNameLocationSearch(e.target.value)}
              className="search-input name-location-search"
            />
            <input 
              type="text" 
              placeholder="Search by Courses..." 
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              className="search-input course-search"
            />
            <button className="search-btn" onClick={() => withLoading(() => Promise.resolve(), 'Searching institutes...')}>
              <FaSearch />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar and Cards */}
      <div className="institutes-content-wrapper">
        {/* Sidebar Filters */}
        <aside className="institutes-sidebar">
          <h3 className="sidebar-title">Filters</h3>
          <p className="sidebar-subtitle">REFINE YOUR SEARCH</p>
          
          {/* Category Filters */}
          <div className="category-filters">
            <div 
              className={`category-filter-item ${filter === '' ? 'active' : ''}`}
              onClick={() => setFilter('')}
            >
              <div className="category-icon"><FaGraduationCap /></div>
              <span className="category-label">All Institutes</span>
            </div>
            <div 
              className={`category-filter-item ${filter === 'colleges' ? 'active' : ''}`}
              onClick={() => setFilter('colleges')}
            >
              <div className="category-icon"><FaUniversity /></div>
              <span className="category-label">Colleges</span>
            </div>
            <div 
              className={`category-filter-item ${filter === 'skill-vocational' ? 'active' : ''}`}
              onClick={() => setFilter('skill-vocational')}
            >
              <div className="category-icon"><FaUserGraduate /></div>
              <span className="category-label">Skill and Vocational</span>
            </div>
            <div 
              className={`category-filter-item ${filter === 'upskilling' ? 'active' : ''}`}
              onClick={() => setFilter('upskilling')}
            >
              <div className="category-icon"><FaChartLine /></div>
              <span className="category-label">Upskilling</span>
            </div>
            <div 
              className={`category-filter-item ${filter === 'school' ? 'active' : ''}`}
              onClick={() => setFilter('school')}
            >
              <div className="category-icon"><FaSchool /></div>
              <span className="category-label">School</span>
            </div>
            <div 
              className={`category-filter-item ${filter === 'coaching-centre' ? 'active' : ''}`}
              onClick={() => setFilter('coaching-centre')}
            >
              <div className="category-icon"><FaChalkboardTeacher /></div>
              <span className="category-label">Coaching Centre</span>
            </div>
          </div>

          {/* Affiliation Filters */}
          {uniqueAffiliations.length > 0 && (
            <>
              <h4 className="filter-section-title">AFFILIATION</h4>
              <div className="affiliation-filters">
                {uniqueAffiliations.map((affiliation, index) => (
                  <div key={index} className="affiliation-item">
                    <input 
                      type="checkbox"
                      id={`affiliation-${index}`}
                      checked={selectedAffiliations.includes(affiliation)}
                      onChange={() => {
                        setSelectedAffiliations(prev => 
                          prev.includes(affiliation)
                            ? prev.filter(a => a !== affiliation)
                            : [...prev, affiliation]
                        );
                      }}
                    />
                    <label htmlFor={`affiliation-${index}`}>{affiliation}</label>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Verification Filter */}
          <h4 className="filter-section-title">VERIFICATION</h4>
          <div className="verification-toggle">
            <div className="verification-label">
              <FaCheckCircle className="verification-icon" />
              Staffinn Verified
            </div>
            <div 
              className={`toggle-switch ${staffinnVerifiedOnly ? 'active' : ''}`}
              onClick={() => setStaffinnVerifiedOnly(!staffinnVerifiedOnly)}
            >
              <div className="toggle-slider"></div>
            </div>
          </div>

          {/* Experience Range Filter */}
          <h4 className="filter-section-title">EXPERIENCE RANGE</h4>
          <select 
            className="experience-dropdown"
            value={experienceRange}
            onChange={(e) => setExperienceRange(e.target.value)}
          >
            <option value="all">All Years</option>
            <option value="0-5">0-5 Years</option>
            <option value="5-10">5-10 Years</option>
            <option value="10-20">10-20 Years</option>
            <option value="20+">20+ Years</option>
          </select>
        </aside>

        {/* Institutes Grid */}
        <div className="institutes-grid">
          {/* Results Header */}
          <div className="results-header">
            <div className="results-count">
              Showing <span>{filteredInstitutes.length}</span> Institutes
            </div>
            <div className="view-toggle">
              <button 
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <FaTh />
              </button>
              <button 
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <FaList />
              </button>
            </div>
          </div>
        {loading ? (
          <div className="loading-message">
            <p>Loading institutes...</p>
          </div>
        ) : filteredInstitutes.length > 0 ? (
          filteredInstitutes.map(institute => (
            <div key={institute.id} className="institute-card-horizontal">
              <div className="institute-card-left">
                <div className="institute-logo-horizontal">
                  <img 
                    src={institute.profileImage || `https://via.placeholder.com/120?text=${institute.name.charAt(0)}`} 
                    alt={`${institute.name} Logo`} 
                  />
                </div>
              </div>
              
              <div className="institute-card-middle">
                <div className="institute-name-section">
                  <h2>{institute.name}</h2>
                  {institute.isBrainaryVerified && (
                    <div className="brainary-verified">
                      <FaCheckCircle /> Staffinn Verified
                    </div>
                  )}
                </div>
                
                <div className="institute-badges">
                  {institute.badges && institute.badges.map((badge, index) => (
                    <span key={index} className="badge">{badge}</span>
                  ))}
                  {institute.categories && institute.categories.map((category, index) => (
                    <span key={`cat-${index}`} className="category-badge">{category}</span>
                  ))}
                </div>
                
                <div className="institute-details-horizontal">
                  <div className="info-card">
                    <div className="info-card-icon">
                      <FaMapMarkerAlt />
                    </div>
                    <div className="info-card-content">
                      <span className="info-value">
                        {institute?.location}
                        {institute?.pincode && ` - ${institute.pincode}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="info-card experience-card">
                    <div className="info-card-icon">
                      <FaBriefcase />
                    </div>
                    <div className="info-card-content">
                      <span className="info-value">{institute.experience ? `${institute.experience}+ Years of Experience` : 'Experience Not Available'}</span>
                    </div>
                  </div>
                  
                  <div className="info-card">
                    <div className="info-card-icon">
                      <FaPhone />
                    </div>
                    <div className="info-card-content">
                      <span className="info-value">{institute.phone}</span>
                    </div>
                  </div>
                  
                  <div className="info-card">
                    <div className="info-card-icon">
                      <FaGlobe />
                    </div>
                    <div className="info-card-content">
                      {institute.website ? (
                        <a href={institute.website.startsWith('http') ? institute.website : `https://${institute.website}`} target="_blank" rel="noopener noreferrer" className="info-value website-link">
                          {institute.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                        </a>
                      ) : (
                        <span className="info-value" style={{color: '#cbd5e1'}}>Website Not Available</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="institute-card-right">
                <button 
                  className="view-institute-btn"
                  onClick={() => {
                    if (!isLoggedIn) {
                      onShowLogin();
                      return;
                    }
                    window.location.href = `/institute/${institute.id}`;
                  }}
                >
                  View Details
                </button>
                {isRecruiter && (
                  <button 
                    className="campus-invite-btn"
                    onClick={() => {
                      setSelectedInstituteForInvite(institute);
                      setShowInviteModal(true);
                    }}
                  >
                    <FaCalendarAlt style={{ marginRight: '6px' }} />
                    Campus Invite
                  </button>
                )}
                {institute.email && (
                  <button 
                    className="contact-institute-btn"
                    onClick={() => {
                      window.open(`mailto:${institute.email}`, '_self');
                    }}
                  >
                    Contact
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <h3>No institutes found matching your criteria</h3>
            <p>Try adjusting your search or filter settings</p>
          </div>
        )}
        </div>
      </div>

      {/* Recruiter Campus Invite Modal */}
      {showInviteModal && selectedInstituteForInvite && (
        <RecruiterCampusInviteModal
          institute={selectedInstituteForInvite}
          onClose={() => {
            setShowInviteModal(false);
            setSelectedInstituteForInvite(null);
          }}
          onSuccess={() => {
            setShowInviteModal(false);
            setSelectedInstituteForInvite(null);
            // Show success message
            alert('Campus invite sent successfully!');
          }}
        />
      )}
    </div>
  );
};

export default InstitutePageList;