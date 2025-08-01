/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './InstitutePageList.css';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaCheckCircle, FaSearch } from 'react-icons/fa';
import InstitutepageImage from '../../assets/Institutepage.jpg';

const InstitutePageList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('');
  const [filteredInstitutes, setFilteredInstitutes] = useState([]);

  // Sample data for institutes
  const institutes = [
    {
      id: 1,
      name: 'JECRC Foundation',
      location: 'Jaipur, Rajasthan',
      phone: '+91 141 2770120',
      email: 'info@jecrc.ac.in',
      website: 'www.jecrc.ac.in',
      experience: '25+ Years of Excellence in Education',
      badges: ['AICTE Approved', 'ISO 9001:2015', 'NSDC Partner'],
      isBrainaryVerified: true,
      isTrendingAchiever: true
    },
    {
      id: 2,
      name: 'Tech Skills Academy',
      location: 'Bangalore, Karnataka',
      phone: '+91 80 12345678',
      email: 'info@techskillsacademy.edu',
      website: 'www.techskillsacademy.edu',
      experience: '15+ Years of Excellence in Training',
      badges: ['AICTE Approved', 'ISO 9001:2015', 'NSDC Partner'],
      isBrainaryVerified: true,
      isTrendingAchiever: false
    },
    {
      id: 3,
      name: 'Digital Engineering Institute',
      location: 'Mumbai, Maharashtra',
      phone: '+91 22 98765432',
      email: 'info@digitalengineering.edu',
      website: 'www.digitalengineering.edu',
      experience: '10+ Years of Digital Excellence',
      badges: ['AICTE Approved', 'NAAC A++'],
      isBrainaryVerified: false,
      isTrendingAchiever: true
    },
    {
      id: 4,
      name: 'National Institute of Technology',
      location: 'Delhi, New Delhi',
      phone: '+91 11 87654321',
      email: 'info@nationaltech.edu',
      website: 'www.nationaltech.edu',
      experience: '30+ Years of Academic Excellence',
      badges: ['UGC Recognized', 'NAAC A++', 'NBA Accredited'],
      isBrainaryVerified: true,
      isTrendingAchiever: true
    },
    {
      id: 5,
      name: 'Pinnacle Management College',
      location: 'Chennai, Tamil Nadu',
      phone: '+91 44 56789012',
      email: 'info@pinnaclemgmt.edu',
      website: 'www.pinnaclemgmt.edu',
      experience: '12+ Years in Management Education',
      badges: ['AICTE Approved', 'AACSB Accredited'],
      isBrainaryVerified: false,
      isTrendingAchiever: false
    },
    {
      id: 6,
      name: 'Global Institute of Engineering',
      location: 'Hyderabad, Telangana',
      phone: '+91 40 23456789',
      email: 'info@globalengineering.edu',
      website: 'www.globalengineering.edu',
      experience: '20+ Years of Engineering Excellence',
      badges: ['NBA Accredited', 'ISO 9001:2015'],
      isBrainaryVerified: true,
      isTrendingAchiever: false
    },
    {
      id: 7,
      name: 'Innovate Design School',
      location: 'Pune, Maharashtra',
      phone: '+91 20 34567890',
      email: 'info@innovatedesign.edu',
      website: 'www.innovatedesign.edu',
      experience: '8+ Years of Creative Excellence',
      badges: ['Design Council Certified', 'International Design Association Member'],
      isBrainaryVerified: false,
      isTrendingAchiever: true
    },
    {
      id: 8,
      name: 'Advanced Computing Academy',
      location: 'Bangalore, Karnataka',
      phone: '+91 80 45678901',
      email: 'info@advancedcomputing.edu',
      website: 'www.advancedcomputing.edu',
      experience: '10+ Years in Computer Science Education',
      badges: ['AICTE Approved', 'NASSCOM Partnership'],
      isBrainaryVerified: true,
      isTrendingAchiever: true
    }
  ];

  // Initialize filteredInstitutes with all institutes when component mounts
  useEffect(() => {
    setFilteredInstitutes(institutes);
  }, []);

  // Filter institutes based on search term and selected filter
  useEffect(() => {
    let results = institutes;
    
    // Apply search term filter
    if (searchTerm) {
      results = results.filter(institute => 
        institute.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        institute.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filter === 'brainary') {
      results = results.filter(institute => institute.isBrainaryVerified);
    } else if (filter === 'trending') {
      results = results.filter(institute => institute.isTrendingAchiever);
    }
    
    setFilteredInstitutes(results);
  }, [searchTerm, filter]);

  return (
    <div className="institute-list-page">
      {/* Hero Section with Background Image */}
      <div className="institute-search-section" style={{backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${InstitutepageImage})`}}>
        <h1 className="page-title">Find Your Institute</h1>
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search by name or location..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <FaSearch className="search-icon" />
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
        {filteredInstitutes.length > 0 ? (
          filteredInstitutes.map(institute => (
            <div key={institute.id} className="institute-card">
              <div className="institute-header">
                <div className="institute-logo">
                  <img src={`https://via.placeholder.com/80?text=${institute.name.charAt(0)}`} alt={`${institute.name} Logo`} />
                </div>
                <div className="institute-name">
                  <h2>{institute.name}</h2>
                  {institute.isBrainaryVerified && (
                    <div className="brainary-verified">
                      <FaCheckCircle /> Brainary Verified
                    </div>
                  )}
                </div>
              </div>
              <div className="institute-badges">
                {institute.badges.map((badge, index) => (
                  <span key={index} className="badge">{badge}</span>
                ))}
              </div>
              <div className="institute-details">
                <div className="info-item">
                  <FaMapMarkerAlt />
                  <span>{institute.location}</span>
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