/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiWithLoading from '../../services/apiWithLoading';
import './InstitutePageList.css';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaCheckCircle, FaSearch } from 'react-icons/fa';
import InstitutepageImage from '../../assets/Institutepage.jpg';
import { useGlobalLoading } from '../../hooks/useGlobalLoading';

const InstitutePageList = () => {
  const [nameLocationSearch, setNameLocationSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [institutes, setInstitutes] = useState([]);
  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Use global loading hook
  const { withLoading } = useGlobalLoading();

  // Load institutes from API
  useEffect(() => {
    loadInstitutes();
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
    if (filter === 'brainary') {
      results = results.filter(institute => institute.isBrainaryVerified);
    } else if (filter === 'trending') {
      results = results.filter(institute => institute.isTrendingAchiever);
    }
    
    setFilteredInstitutes(results);
  }, [nameLocationSearch, courseSearch, filter, institutes]);

  return (
    <div className="institute-list-page">
      {/* Hero Section with Background Image */}
      <div className="institute-search-section" style={{backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${InstitutepageImage})`}}>
        <h1 className="page-title">Find Your Institute</h1>
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
              id="filter-brainary" 
              name="institute-filter" 
              value="brainary"
              checked={filter === 'brainary'}
              onChange={() => setFilter('brainary')}
            />
            <label htmlFor="filter-brainary">Brainary Verified Institutes</label>
          </div>
          <div className="filter-option">
            <input 
              type="radio" 
              id="filter-trending" 
              name="institute-filter" 
              value="trending"
              checked={filter === 'trending'}
              onChange={() => setFilter('trending')}
            />
            <label htmlFor="filter-trending">Trending Achievers</label>
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
                  <span>{institute.website}</span>
                </div>
                <div className="info-item experience">
                  <span>{institute.experience}</span>
                </div>
              </div>
              <div className="institute-actions">
                <Link to={`/institute/${institute.id}`} className="view-institute-btn">View Details</Link>
                <button className="contact-institute-btn">Contact</button>
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