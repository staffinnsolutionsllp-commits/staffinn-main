import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminApi';
import StaffProfileModal from './StaffProfileModal';
import './StaffUsers.css';

const StaffUsers = () => {
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadStaffUsers();
  }, []);

  const loadStaffUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllStaffUsers();
      
      if (response.success) {
        setStaffUsers(response.data);
      }
    } catch (error) {
      setError(error.message || 'Failed to load staff users');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (userId) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: 'viewing' }));
      const response = await adminAPI.getStaffProfile(userId);
      
      if (response.success) {
        setSelectedStaff(response.data);
        setShowProfileModal(true);
      }
    } catch (error) {
      alert('Failed to load staff profile: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  const handleToggleVisibility = async (userId, currentVisibility) => {
    const action = currentVisibility ? 'hide' : 'show';
    
    if (!confirm(`Are you sure you want to ${action} this staff profile?`)) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [userId]: 'visibility' }));
      const response = await adminAPI.toggleStaffVisibility(userId);
      
      if (response.success) {
        // Update local state
        setStaffUsers(prev => prev.map(staff => 
          staff.userId === userId 
            ? { ...staff, isVisible: !currentVisibility }
            : staff
        ));
        alert(`Profile ${action}n successfully!`);
      }
    } catch (error) {
      alert('Failed to toggle visibility: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  const handleToggleBlock = async (userId, currentBlockStatus) => {
    const action = currentBlockStatus ? 'unblock' : 'block';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [userId]: 'block' }));
      const response = await adminAPI.toggleStaffBlock(userId);
      
      if (response.success) {
        // Update local state
        setStaffUsers(prev => prev.map(staff => 
          staff.userId === userId 
            ? { ...staff, isBlocked: !currentBlockStatus }
            : staff
        ));
        alert(`User ${action}ed successfully!`);
      }
    } catch (error) {
      alert('Failed to toggle block status: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  const handleDeleteUser = async (userId, staffName) => {
    if (!confirm(`Are you sure you want to permanently delete ${staffName}? This action cannot be undone.`)) {
      return;
    }

    if (!confirm('This will completely remove the user account and all associated data. Are you absolutely sure?')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [userId]: 'deleting' }));
      const response = await adminAPI.deleteStaffUser(userId);
      
      if (response.success) {
        // Remove from local state
        setStaffUsers(prev => prev.filter(staff => staff.userId !== userId));
        alert('User deleted successfully!');
      }
    } catch (error) {
      alert('Failed to delete user: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
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
      <div className="staff-users-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading staff users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="staff-users-container">
        <div className="error-message">
          <h3>Error Loading Staff Users</h3>
          <p>{error}</p>
          <button onClick={loadStaffUsers} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-users-container">
      <div className="page-header">
        <h1 className="page-title">Staff Management</h1>
        <div className="search-filter-section">
          <div className="search-box">
            <i className="fas fa-search search-icon"></i>
            <input 
              type="text" 
              placeholder="Search staff members..." 
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

      {staffUsers.length === 0 ? (
        <div className="no-data">
          <h3>No Staff Users Found</h3>
          <p>No staff members have registered yet.</p>
        </div>
      ) : (
        <div className="modern-table-container">
          <div className="table-header">
            <div className="table-title">Staff Members</div>
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
                  <th>STAFF MEMBER</th>
                  <th>ROLE</th>
                  <th>STATUS</th>
                  <th>VISIBILITY</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {staffUsers.map((staff) => (
                  <tr key={staff.userId} className={`table-row ${staff.isBlocked ? 'blocked-row' : ''}`}>
                    <td>
                      <div className="staff-info">
                        <div className="staff-avatar">
                          {(staff.profilePhoto || staff.profilePicture || staff.user?.profilePhoto) ? (
                            <img src={staff.profilePhoto || staff.profilePicture || staff.user?.profilePhoto} alt="Profile" />
                          ) : (
                            <div className="avatar-placeholder">
                              {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : 'S'}
                            </div>
                          )}
                        </div>
                        <div className="staff-details">
                          <div className="staff-name">{staff.fullName || 'Unknown'}</div>
                          <div className="staff-email">{staff.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="role-badge">
                        {staff.isActiveStaff ? 'Active Staff' : 'Seeker'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${staff.isBlocked ? 'blocked' : 'active'}`}>
                        {staff.isBlocked ? 'blocked' : 'active'}
                      </span>
                    </td>
                    <td>
                      <span className={`visibility-badge ${staff.isVisible ? 'visible' : 'hidden'}`}>
                        {staff.isVisible ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div className="action-icons">
                        <button
                          className="icon-btn view-icon"
                          onClick={() => handleViewProfile(staff.userId)}
                          disabled={actionLoading[staff.userId]}
                          title="View profile"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        
                        <button
                          className={`icon-btn lock-icon ${staff.isVisible ? 'unlocked' : 'locked'}`}
                          onClick={() => handleToggleVisibility(staff.userId, staff.isVisible)}
                          disabled={actionLoading[staff.userId]}
                          title={staff.isVisible ? 'Lock profile (Hide)' : 'Unlock profile (Show)'}
                        >
                          <i className={`fas ${staff.isVisible ? 'fa-lock-open' : 'fa-lock'}`}></i>
                        </button>
                        
                        <button
                          className={`icon-btn block-icon ${staff.isBlocked ? 'blocked' : 'unblocked'}`}
                          onClick={() => handleToggleBlock(staff.userId, staff.isBlocked)}
                          disabled={actionLoading[staff.userId]}
                          title={staff.isBlocked ? 'Unblock user' : 'Block user'}
                        >
                          {staff.isBlocked ? '🚫' : '🟢'}
                        </button>
                        
                        <button
                          className="icon-btn delete-icon"
                          onClick={() => handleDeleteUser(staff.userId, staff.fullName)}
                          disabled={actionLoading[staff.userId]}
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
      {showProfileModal && selectedStaff && (
        <StaffProfileModal
          staff={selectedStaff}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedStaff(null);
          }}
        />
      )}
    </div>
  );
};

export default StaffUsers;