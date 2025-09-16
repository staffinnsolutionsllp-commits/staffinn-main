import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminApi';
import InstituteProfileModal from './InstituteProfileModal';
import './InstituteUsers.css';

const InstituteUsers = () => {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadInstitutes();
  }, []);

  const loadInstitutes = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllInstitutes();
      
      if (response.success) {
        setInstitutes(response.data);
      }
    } catch (error) {
      setError(error.message || 'Failed to load institutes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (instituteId) => {
    try {
      setActionLoading(prev => ({ ...prev, [instituteId]: 'viewing' }));
      const response = await adminAPI.getInstituteProfile(instituteId);
      
      if (response.success) {
        setSelectedInstitute(response.data);
        setShowProfileModal(true);
      }
    } catch (error) {
      alert('Failed to load institute profile: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [instituteId]: null }));
    }
  };

  const handleToggleVisibility = async (instituteId, currentVisibility) => {
    const action = currentVisibility ? 'hide' : 'show';
    
    if (!confirm(`Are you sure you want to ${action} this institute profile?`)) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [instituteId]: 'visibility' }));
      const response = await adminAPI.toggleInstituteVisibility(instituteId);
      
      if (response.success) {
        setInstitutes(prev => prev.map(institute => 
          institute.userId === instituteId 
            ? { ...institute, isVisible: !currentVisibility }
            : institute
        ));
        alert(`Profile ${action}n successfully!`);
      }
    } catch (error) {
      alert('Failed to toggle visibility: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [instituteId]: null }));
    }
  };

  const handleToggleBlock = async (instituteId, currentBlockStatus) => {
    const action = currentBlockStatus ? 'unblock' : 'block';
    
    if (!confirm(`Are you sure you want to ${action} this institute?`)) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [instituteId]: 'block' }));
      const response = await adminAPI.toggleInstituteBlock(instituteId);
      
      if (response.success) {
        setInstitutes(prev => prev.map(institute => 
          institute.userId === instituteId 
            ? { ...institute, isBlocked: !currentBlockStatus }
            : institute
        ));
        alert(`Institute ${action}ed successfully!`);
      }
    } catch (error) {
      alert('Failed to toggle block status: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [instituteId]: null }));
    }
  };

  const handleDeleteInstitute = async (instituteId, instituteName) => {
    if (!confirm(`Are you sure you want to permanently delete ${instituteName}? This action cannot be undone.`)) {
      return;
    }

    if (!confirm('This will completely remove the institute account and all associated data. Are you absolutely sure?')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [instituteId]: 'deleting' }));
      const response = await adminAPI.deleteInstitute(instituteId);
      
      if (response.success) {
        setInstitutes(prev => prev.filter(institute => institute.userId !== instituteId));
        alert('Institute deleted successfully!');
      }
    } catch (error) {
      alert('Failed to delete institute: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [instituteId]: null }));
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Filter institutes based on search and status
  const filteredInstitutes = institutes.filter(institute => {
    const matchesSearch = !searchTerm || 
      (institute.name && institute.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (institute.instituteName && institute.instituteName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (institute.email && institute.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !institute.isBlocked) ||
      (statusFilter === 'blocked' && institute.isBlocked) ||
      (statusFilter === 'hidden' && !institute.isVisible);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="institute-users-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading institutes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="institute-users-container">
        <div className="error-message">
          <h3>Error Loading Institutes</h3>
          <p>{error}</p>
          <button onClick={loadInstitutes} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="institute-users-container">
      <div className="page-header">
        <h1 className="page-title">Institute Management</h1>
        <div className="search-filter-section">
          <div className="search-box">
            <i className="fas fa-search search-icon"></i>
            <input 
              type="text" 
              placeholder="Search institutes..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-dropdown">
            <select 
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>
      </div>

      {filteredInstitutes.length === 0 ? (
        <div className="no-data">
          <h3>No Institutes Found</h3>
          <p>
            {searchTerm || statusFilter !== 'all' 
              ? 'No institutes match your search criteria.' 
              : 'No institutes have registered yet.'
            }
          </p>
        </div>
      ) : (
        <div className="modern-table-container">
          <div className="table-header">
            <div className="table-title">
              Institutes ({filteredInstitutes.length})
            </div>
            <div className="table-actions">
              <button className="export-btn">
                <i className="fas fa-download"></i>
                Export
              </button>
            </div>
          </div>
          
          <div className="table-content">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>INSTITUTE</th>
                  <th>CONTACT</th>
                  <th>STATUS</th>
                  <th>VISIBILITY</th>
                  <th>REGISTERED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstitutes.map((institute) => (
                  <tr key={institute.userId} className={`table-row ${institute.isBlocked ? 'blocked-row' : ''}`}>
                    <td>
                      <div className="institute-info">
                        <div className="institute-avatar">
                          {institute.profileImage || institute.logo ? (
                            <img src={institute.profileImage || institute.logo} alt="Institute" />
                          ) : (
                            <div className="avatar-placeholder">
                              {(institute.name || institute.instituteName || 'I').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="institute-details">
                          <div className="institute-name">
                            {institute.name || institute.instituteName || 'Unknown Institute'}
                          </div>
                          <div className="institute-email">{institute.email}</div>
                          {institute.registrationNumber && (
                            <div className="registration-number">
                              Reg: {institute.registrationNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="phone">{institute.phone || 'Not provided'}</div>
                        {institute.address && (
                          <div className="address">{institute.address}</div>
                        )}
                        {institute.website && (
                          <div className="website">
                            <a href={institute.website} target="_blank" rel="noopener noreferrer">
                              {institute.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${institute.isBlocked ? 'blocked' : 'active'}`}>
                        {institute.isBlocked ? 'blocked' : 'active'}
                      </span>
                    </td>
                    <td>
                      <span className={`visibility-badge ${institute.isVisible ? 'visible' : 'hidden'}`}>
                        {institute.isVisible ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div className="date-info">
                        {formatDate(institute.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div className="action-icons">
                        <button
                          className="icon-btn view-icon"
                          onClick={() => handleViewProfile(institute.userId)}
                          disabled={actionLoading[institute.userId]}
                          title="View profile"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        
                        <button
                          className={`icon-btn lock-icon ${institute.isVisible ? 'unlocked' : 'locked'}`}
                          onClick={() => handleToggleVisibility(institute.userId, institute.isVisible)}
                          disabled={actionLoading[institute.userId]}
                          title={institute.isVisible ? 'Lock profile (Hide)' : 'Unlock profile (Show)'}
                        >
                          <i className={`fas ${institute.isVisible ? 'fa-lock-open' : 'fa-lock'}`}></i>
                        </button>
                        
                        <button
                          className={`icon-btn block-icon ${institute.isBlocked ? 'blocked' : 'unblocked'}`}
                          onClick={() => handleToggleBlock(institute.userId, institute.isBlocked)}
                          disabled={actionLoading[institute.userId]}
                          title={institute.isBlocked ? 'Unblock institute' : 'Block institute'}
                        >
                          {institute.isBlocked ? '🚫' : '🟢'}
                        </button>
                        
                        <button
                          className="icon-btn delete-icon"
                          onClick={() => handleDeleteInstitute(institute.userId, institute.name || institute.instituteName)}
                          disabled={actionLoading[institute.userId]}
                          title="Delete institute"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedInstitute && (
        <InstituteProfileModal
          institute={selectedInstitute}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedInstitute(null);
          }}
        />
      )}
    </div>
  );
};

export default InstituteUsers;