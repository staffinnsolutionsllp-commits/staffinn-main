import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './GovernmentSchemes.css';

const GovernmentSchemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      // Try to get schemes by visibility first (for authenticated users)
      let response = await apiService.getGovernmentSchemesByVisibility();
      
      // If that fails, fall back to public schemes
      if (!response.success) {
        response = await apiService.getGovernmentSchemes();
      }
      
      if (response.success) {
        setSchemes(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching schemes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchemes = schemes.filter(scheme => {
    const matchesSearch = (scheme.schemeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (scheme.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || scheme.visibility === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(schemes.map(scheme => scheme.visibility))].filter(Boolean);

  if (loading) {
    return (
      <div className="staff-loading-overlay">
        <div className="staff-loading-spinner">Loading schemes...</div>
      </div>
    );
  }

  return (
    <div className="government-schemes-section">
      <div className="government-schemes-search-section">
        <div className="government-schemes-search-container">
          <div className="search-input-container">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search schemes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="government-schemes-search-input"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="government-schemes-filter-select"
          >
            <option value="all">All Schemes</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredSchemes.length === 0 ? (
        <div className="government-schemes-empty-state">
          <i className="fas fa-clipboard-list"></i>
          <h3>No schemes found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="government-schemes-grid">
          {filteredSchemes.map((scheme) => (
            <div key={scheme.schemeId} className="government-scheme-card">
              <div className="scheme-card-header">
                <span className="scheme-visibility-badge">
                  {scheme.visibility}
                </span>
                <span className="scheme-date">
                  {new Date(scheme.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="scheme-title">{scheme.schemeName}</h3>
              
              {scheme.description && (
                <p className="scheme-description">{scheme.description}</p>
              )}

              <div className="scheme-meta">
                <div className="scheme-meta-item">
                  <i className="fas fa-calendar-alt"></i>
                  <span>Added: {new Date(scheme.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="scheme-actions">
                <a
                  href={scheme.schemeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="scheme-view-btn"
                >
                  View Scheme
                  <i className="fas fa-external-link-alt"></i>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GovernmentSchemes;