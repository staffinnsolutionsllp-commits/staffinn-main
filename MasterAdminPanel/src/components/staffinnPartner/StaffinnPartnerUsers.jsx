import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminApi';
import './StaffinnPartnerUsers.css';

const StaffinnPartnerUsers = () => {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStaffinnPartners();
  }, []);

  const loadStaffinnPartners = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllMisRequests();
      
      if (response.success) {
        // Filter for approved MIS requests to get Staffinn Partners
        const approvedMisRequests = response.data.filter(request => 
          request.status === 'approved'
        );
        
        console.log('Approved MIS requests:', approvedMisRequests);
        setInstitutes(approvedMisRequests);
      }
    } catch (error) {
      setError(error.message || 'Failed to load Staffinn Partners');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (instituteId) => {
    console.log('View profile for institute:', instituteId);
  };

  const handleLockProfile = async (instituteId) => {
    try {
      const response = await adminAPI.toggleInstituteVisibility(instituteId);
      if (response.success) {
        loadStaffinnPartners();
      }
    } catch (error) {
      alert('Failed to lock/unlock profile: ' + error.message);
    }
  };

  const handleBlockProfile = async (instituteId) => {
    try {
      const response = await adminAPI.toggleInstituteBlock(instituteId);
      if (response.success) {
        loadStaffinnPartners();
      }
    } catch (error) {
      alert('Failed to block/unblock profile: ' + error.message);
    }
  };

  const handleDeleteProfile = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this Staffinn Partner?')) {
      try {
        const response = await adminAPI.deleteMisRequest(requestId);
        if (response.success) {
          loadStaffinnPartners();
        }
      } catch (error) {
        alert('Failed to delete profile: ' + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="staffinn-partner-users-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Staffinn Partners...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="staffinn-partner-users-container">
        <div className="error-message">
          <h3>Error Loading Staffinn Partners</h3>
          <p>{error}</p>
          <button onClick={loadStaffinnPartners} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="staffinn-partner-users-container">
      <div className="page-header">
        <h1 className="page-title">Staffinn Partner Users</h1>
        <p className="page-subtitle">Manage all registered Staffinn Partner institutes</p>
      </div>

      <div className="modern-table-container">
        <div className="table-header">
          <div className="table-title">Staffinn Partners ({institutes.length})</div>
        </div>
        
        {institutes.length === 0 ? (
          <div className="no-data">
            <h3>No Staffinn Partners Found</h3>
            <p>No institutes have registered as Staffinn Partners yet.</p>
          </div>
        ) : (
          <div className="table-content">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>INSTITUTE</th>
                  <th>CONTACT</th>
                  <th>LOCATION</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {institutes.map((institute) => (
                  <tr key={institute.id || institute.requestId} className="table-row">
                    <td>
                      <div className="institute-info">
                        <div className="institute-avatar">
                          {institute.instituteName ? institute.instituteName.charAt(0).toUpperCase() : 'I'}
                        </div>
                        <div className="institute-details">
                          <div className="institute-name">{institute.instituteName || 'Unknown Institute'}</div>
                          <div className="institute-type">{institute.instituteType || 'Institute'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="email">{institute.email}</div>
                        <div className="phone">{institute.phoneNumber || 'N/A'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="location-info">
                        <div className="city">{institute.city || 'N/A'}</div>
                        <div className="state">{institute.state || 'N/A'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="status-badges">
                        <span className={`status-badge ${institute.isBlocked ? 'blocked' : 'active'}`}>
                          {institute.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                        <span className={`visibility-badge ${institute.isHidden ? 'hidden' : 'visible'}`}>
                          {institute.isHidden ? 'Hidden' : 'Visible'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleViewProfile(institute.id || institute.requestId)}
                          title="View Profile"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className={`action-btn lock-btn ${institute.isHidden ? 'locked' : ''}`}
                          onClick={() => handleLockProfile(institute.id || institute.requestId)}
                          title={institute.isHidden ? 'Unlock Profile' : 'Lock Profile'}
                        >
                          <i className={`fas ${institute.isHidden ? 'fa-unlock' : 'fa-lock'}`}></i>
                        </button>
                        <button
                          className={`action-btn block-btn ${institute.isBlocked ? 'blocked' : ''}`}
                          onClick={() => handleBlockProfile(institute.id || institute.requestId)}
                          title={institute.isBlocked ? 'Unblock Profile' : 'Block Profile'}
                        >
                          <i className={`fas ${institute.isBlocked ? 'fa-user-check' : 'fa-user-times'}`}></i>
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteProfile(institute.id || institute.requestId)}
                          title="Delete Profile"
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
        )}
      </div>
    </div>
  );
};

export default StaffinnPartnerUsers;