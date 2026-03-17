import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import apiWithLoading from '../../services/apiWithLoading';
import './InstitutePageList.css';
import '../Dashboard/Categories.css';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaCheckCircle, FaSearch } from 'react-icons/fa';
import InstitutepageImage from '../../assets/Institutepage.jpg';
import { useGlobalLoading } from '../../hooks/useGlobalLoading';

const InstitutePageList = ({ isLoggedIn, onShowLogin }) => {
  const [nameLocationSearch, setNameLocationSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [institutes, setInstitutes] = useState([]);
  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroImages, setHeroImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Use global loading hook
  const { withLoading } = useGlobalLoading();

  // Load institutes from API
  useEffect(() => {
    loadInstitutes();
    loadHeroImages();
    
    // Refresh hero images every 10 seconds to catch updates
    const heroImageInterval = setInterval(() => {
      loadHeroImages();
    }, 10000);
    
    return () => clearInterval(heroImageInterval);
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
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1'}/hero-images/institute/public?t=${timestamp}`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      
      if (response.data.success && response.data.data.images && response.data.data.images.length > 0) {
        console.log('Institute hero images loaded:', response.data.data.images.length);
        setHeroImages(response.data.data.images);
        setCurrentImageIndex(0); // Reset to first image
      } else {
        console.log('No institute hero images found, using default');
        setHeroImages([]);
        setCurrentImageIndex(0);
      }
    } catch (error) {
      console.error('Error loading institute hero images:', error);
      setHeroImages([]);
      setCurrentImageIndex(0);
    }
  };

  // Slideshow effect for multiple images
  useEffect(() => {
    let slideInterval;
    
    if (heroImages.length > 1) {
      console.log('🎬 Starting institute slideshow with', heroImages.length, 'images');
      console.log('🖼️ Available images:', heroImages.map((img, idx) => `${idx}: ${img.imageId}`));
      
      // Reset to 0 when starting slideshow
      setCurrentImageIndex(0);
      
      slideInterval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => {
          console.log('📊 Before calculation - prevIndex:', prevIndex, 'heroImages.length:', heroImages.length);
          
          // Simple increment with reset logic
          let nextIndex;
          if (prevIndex >= heroImages.length - 1) {
            nextIndex = 0; // Reset to first image
          } else {
            nextIndex = prevIndex + 1; // Go to next image
          }
          
          console.log('🔄 Institute slideshow:', prevIndex, '→', nextIndex, '(total:', heroImages.length, ')');
          console.log('🎯 Sequence check: 0→1→2→0 - Current transition:', prevIndex, '→', nextIndex);
          
          return nextIndex;
        });
      }, 5000);
    } else {
      console.log('🖼️ Single or no institute image, no slideshow needed');
      setCurrentImageIndex(0);
    }
    
    return () => {
      if (slideInterval) {
        console.log('⏹️ Stopping institute slideshow');
        clearInterval(slideInterval);
      }
    };
  }, [heroImages]);

  // Debug currentImageIndex changes
  useEffect(() => {
    console.log('🔄 currentImageIndex changed to:', currentImageIndex, 'heroImages.length:', heroImages.length);
    if (heroImages.length > 0 && currentImageIndex < heroImages.length) {
      console.log('🎯 Now showing image:', heroImages[currentImageIndex]?.url);
    }
  }, [currentImageIndex, heroImages]);

  // Get current hero image
  const getCurrentHeroImage = () => {
    if (heroImages.length > 0) {
      // Ensure index is within bounds
      const validIndex = Math.max(0, Math.min(currentImageIndex, heroImages.length - 1));
      const currentImage = heroImages[validIndex];
      
      console.log('🎯 Current institute hero image:', validIndex, 'of', heroImages.length, ':', currentImage?.url);
      
      if (currentImage?.url) {
        return currentImage.url;
      }
    }
    
    console.log('⚠️ Using default institute image');
    return InstitutepageImage;
  };

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
    
    // Apply category filter
    if (filter === 'colleges') {
      results = results.filter(institute => institute.categories && institute.categories.includes('Colleges'));
    } else if (filter === 'skill-vocational') {
      results = results.filter(institute => institute.categories && institute.categories.includes('Skill and Vocational'));
    } else if (filter === 'upskilling') {
      results = results.filter(institute => institute.categories && institute.categories.includes('Upskilling'));
    }
    
    setFilteredInstitutes(results);
  }, [nameLocationSearch, courseSearch, filter, institutes]);

  return (
    <div className="institute-list-page">
      {/* Hero Section with Dynamic Images */}
      <div 
        className="institute-search-section" 
        style={{ 
          backgroundImage: `url("${getCurrentHeroImage()}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {heroImages.length > 1 && (
          <div className="slideshow-indicators" key={`indicators-${heroImages.length}`}>
            {heroImages.map((_, index) => (
              <span 
                key={`indicator-${index}-${heroImages[index]?.imageId || index}`}
                className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => {
                  console.log('👆 Indicator clicked:', index, 'Current:', currentImageIndex);
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

      {/* Filters Section - Now above the institute cards */}
      <div className="institute-filters">
        <h3>Filters</h3>
        <div className="filter-options">
          <div className="filter-option">
            <input 
              type="radio" 
              id="filter-all" 
              name="institute-filter" 
              value=""
              checked={filter === ''}
              onChange={() => setFilter('')}
            />
            <label htmlFor="filter-all">All Institutes</label>
          </div>
          <div className="filter-option">
            <input 
              type="radio" 
              id="filter-colleges" 
              name="institute-filter" 
              value="colleges"
              checked={filter === 'colleges'}
              onChange={() => setFilter('colleges')}
            />
            <label htmlFor="filter-colleges">Colleges</label>
          </div>
          <div className="filter-option">
            <input 
              type="radio" 
              id="filter-skill-vocational" 
              name="institute-filter" 
              value="skill-vocational"
              checked={filter === 'skill-vocational'}
              onChange={() => setFilter('skill-vocational')}
            />
            <label htmlFor="filter-skill-vocational">Skill and Vocational</label>
          </div>
          <div className="filter-option">
            <input 
              type="radio" 
              id="filter-upskilling" 
              name="institute-filter" 
              value="upskilling"
              checked={filter === 'upskilling'}
              onChange={() => setFilter('upskilling')}
            />
            <label htmlFor="filter-upskilling">Upskilling</label>
          </div>
        </div>
      </div>

      {/* Institutes Grid */}
      <div className="institutes-grid">
        {loading ? (
          <div className="loading-message">
            <p>Loading institutes...</p>
          </div>
        ) : filteredInstitutes.length > 0 ? (
          filteredInstitutes.map(institute => (
            <div key={institute.id} className="institute-card">
              <div className="institute-header">
                <div className="institute-logo">
                  <img 
                    src={institute.profileImage || `https://via.placeholder.com/80?text=${institute.name.charAt(0)}`} 
                    alt={`${institute.name} Logo`} 
                  />
                </div>
                <div className="institute-name">
                  <h2>{institute.name}</h2>
                  {institute.isBrainaryVerified && (
                    <div className="brainary-verified">
                      <FaCheckCircle /> Staffinn Verified
                    </div>
                  )}
                </div>
              </div>
              <div className="institute-badges">
                {institute.badges && institute.badges.map((badge, index) => (
                  <span key={index} className="badge">{badge}</span>
                ))}
                {institute.categories && institute.categories.map((category, index) => (
                  <span key={`cat-${index}`} className="category-badge">{category}</span>
                ))}
              </div>
              <div className="institute-details">
                <div className="info-item">
                  <FaMapMarkerAlt />
                  <span>
                    {institute?.location}
                    {institute?.pincode && `, ${institute.pincode}`}
                  </span>
                </div>
                <div className="info-item">
                  <FaPhone />
                  <span>{institute.phone}</span>
                </div>
                <div className="info-item">
                  <FaEnvelope />
                  <span>{institute.email}</span>
                </div>
                <div className="info-item">
                  <FaGlobe />
                  {institute.website ? (
                    <a href={institute.website} target="_blank" rel="noopener noreferrer" className="website-link">
                      Website
                    </a>
                  ) : (
                    <span>Website Not Available</span>
                  )}
                </div>
                <div className="info-item experience">
                  <span>{institute.experience ? `${institute.experience}+ Years of Experience` : 'Experience Not Available'}</span>
                </div>
              </div>
              <div className="institute-actions">
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
                <button 
                  className="contact-institute-btn"
                  onClick={() => {
                    if (!isLoggedIn) {
                      onShowLogin();
                      return;
                    }
                    // Handle contact functionality here
                  }}
                >
                  Contact
                </button>
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
  );
};

export default InstitutePageList;