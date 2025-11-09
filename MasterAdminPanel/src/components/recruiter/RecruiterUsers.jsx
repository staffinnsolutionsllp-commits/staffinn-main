import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminApi';
import RecruiterProfileModal from './RecruiterProfileModal';
import './RecruiterUsers.css';

const RecruiterUsers = () => {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadRecruiters();
  }, []);

  const loadRecruiters = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllRecruiters();
      
      if (response.success) {
        setRecruiters(response.data);
      }
    } catch (error) {
      setError(error.message || 'Failed to load recruiters');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (recruiterId) => {
    try {
      setActionLoading(prev => ({ ...prev, [recruiterId]: 'viewing' }));
      const response = await adminAPI.getRecruiterProfile(recruiterId);
      
      if (response.success) {
        setSelectedRecruiter(response.data);
        setShowProfileModal(true);
      }
    } catch (error) {
      alert('Failed to load recruiter profile: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [recruiterId]: null }));
    }
  };

  const handleToggleVisibility = async (recruiterId, currentVisibility) => {
    const action = currentVisibility ? 'hide' : 'show';
    
    if (!confirm(`Are you sure you want to ${action} this recruiter?`)) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [recruiterId]: 'visibility' }));
      const response = await adminAPI.toggleRecruiterVisibility(recruiterId);
      
      if (response.success) {
        setRecruiters(prev => prev.map(recruiter => 
          recruiter.userId === recruiterId 
            ? { ...recruiter, isVisible: response.data.isVisible }
            : recruiter
        ));
        alert(`Recruiter ${action}n successfully!`);
      }
    } catch (error) {
      alert('Failed to toggle visibility: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [recruiterId]: null }));
    }
  };

  const handleToggleBlock = async (recruiterId, currentBlockStatus) => {
    const action = currentBlockStatus ? 'unblock' : 'block';
    
    if (!confirm(`Are you sure you want to ${action} this recruiter?`)) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [recruiterId]: 'block' }));
      const response = await adminAPI.toggleRecruiterBlock(recruiterId);
      
      if (response.success) {
        setRecruiters(prev => prev.map(recruiter => 
          recruiter.userId === recruiterId 
            ? { ...recruiter, isBlocked: !currentBlockStatus }
            : recruiter
        ));
        alert(`Recruiter ${action}ed successfully!`);
      }
    } catch (error) {
      alert('Failed to toggle block status: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [recruiterId]: null }));
    }
  };

  const handleDeleteRecruiter = async (recruiterId, companyName) => {
    if (!confirm(`Are you sure you want to permanently delete ${companyName}? This action cannot be undone.`)) {
      return;
    }

    if (!confirm('This will completely remove the recruiter account and all associated data. Are you absolutely sure?')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [recruiterId]: 'deleting' }));
      const response = await adminAPI.deleteRecruiter(recruiterId);
      
      if (response.success) {
        setRecruiters(prev => prev.filter(recruiter => recruiter.userId !== recruiterId));
        alert('Recruiter deleted successfully!');
      }
    } catch (error) {
      alert('Failed to delete recruiter: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [recruiterId]: null }));
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

  if (loading) {
    return (
      <div className="recruiter-users-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading recruiters...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recruiter-users-container">
        <div className="error-message">
          <h3>Error Loading Recruiters</h3>
          <p>{error}</p>
          <button onClick={loadRecruiters} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recruiter-users-container">
      <div className="page-header">
        <h1 className="page-title">Recruiter Management</h1>
        <div className="search-filter-section">
          <div className="search-box">
            <i className="fas fa-search search-icon"></i>
            <input 
              type="text" 
              placeholder="Search recruiters..." 
              className="search-input"
            />
          </div>
          <div className="filter-dropdown">
            <select className="status-filter">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>
      </div>

      {recruiters.length === 0 ? (
        <div className="no-data">
          <h3>No Recruiters Found</h3>
          <p>No recruiters have registered yet.</p>
        </div>
      ) : (
        <div className="modern-table-container">
          <div className="table-header">
            <div className="table-title">Recruiters</div>
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
                  <th>RECRUITER</th>
                  <th>COMPANY</th>
                  <th>STATUS</th>
                  <th>VISIBILITY</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {recruiters.map((recruiter) => (
                  <tr key={recruiter.userId} className={`table-row ${recruiter.isBlocked ? 'blocked-row' : ''}`}>
                    <td>
                      <div className="staff-info">
                        <div className="staff-avatar">
                          {recruiter.profilePhoto ? (
                            <img src={recruiter.profilePhoto} alt="Profile" />
                          ) : (
                            <div className="avatar-placeholder">
                              {recruiter.companyName ? recruiter.companyName.charAt(0).toUpperCase() : 'R'}
                            </div>
                          )}
                        </div>
                        <div className="staff-details">
                          <div className="staff-name">{recruiter.companyName || 'Unknown Company'}</div>
                          <div className="staff-email">{recruiter.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="role-badge">
                        {recruiter.companyName || 'Company'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${recruiter.isBlocked ? 'blocked' : 'active'}`}>
                        {recruiter.isBlocked ? 'blocked' : 'active'}
                      </span>
                    </td>
                    <td>
                      <span className={`visibility-badge ${recruiter.isVisible ? 'visible' : 'hidden'}`}>
                        {recruiter.isVisible ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div className="action-icons">
                        <button
                          className="icon-btn view-icon"
                          onClick={() => handleViewProfile(recruiter.userId)}
                          disabled={actionLoading[recruiter.userId]}
                          title="View profile"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        
                        <button
                          className={`icon-btn lock-icon ${recruiter.isVisible ? 'unlocked' : 'locked'}`}
                          onClick={() => handleToggleVisibility(recruiter.userId, recruiter.isVisible)}
                          disabled={actionLoading[recruiter.userId]}
                          title={recruiter.isVisible ? 'Lock profile (Hide)' : 'Unlock profile (Show)'}
                        >
                          <i className={`fas ${recruiter.isVisible ? 'fa-lock-open' : 'fa-lock'}`}></i>
                        </button>
                        
                        <button
                          className={`icon-btn block-icon ${recruiter.isBlocked ? 'blocked' : 'unblocked'}`}
                          onClick={() => handleToggleBlock(recruiter.userId, recruiter.isBlocked)}
                          disabled={actionLoading[recruiter.userId]}
                          title={recruiter.isBlocked ? 'Unblock user' : 'Block user'}
                        >
                          {recruiter.isBlocked ? '🚫' : '🟢'}
                        </button>
                        
                        <button
                          className="icon-btn delete-icon"
                          onClick={() => handleDeleteRecruiter(recruiter.userId, recruiter.companyName)}
                          disabled={actionLoading[recruiter.userId]}
                          title="Delete user"
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
      {showProfileModal && selectedRecruiter && (
        <RecruiterProfileModal
          recruiter={selectedRecruiter}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedRecruiter(null);
          }}
        />
      )}
    </div>
  );
};

export default RecruiterUsers;