import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import adminAPI from '../../services/adminApi';
import './StaffDashboard.css';

const StaffDashboard = () => {
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStaffDashboardData();
      
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = (userId, section) => {
    const key = `${userId}-${section}`;
    setExpandedRows(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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
      <div className="staff-dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="staff-dashboard-container">
        <div className="error-message">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={loadDashboardData} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-dashboard-container">
      <div className="dashboard-header">
        <h2>Staff Dashboard Overview</h2>
        <p>Complete dashboard data for all registered staff members</p>
      </div>

      {dashboardData.length === 0 ? (
        <div className="no-data">
          <h3>No Staff Data Available</h3>
          <p>No staff members have registered yet.</p>
        </div>
      ) : (
        <div className="dashboard-table-container">
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Profile Mode</th>
                  <th>Total Applications</th>
                  <th>Profile Views</th>
                  <th>Application Trend</th>
                  <th>Recent Applications</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.map((staff) => (
                  <tr key={staff.userId}>
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
                          <h4>{staff.fullName || 'Unknown'}</h4>
                          <p>{staff.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`profile-mode ${staff.profileMode === 'Active Staff' ? 'active' : 'seeker'}`}>
                        {staff.profileMode}
                      </span>
                    </td>
                    <td>
                      <div className="stat-number">
                        {staff.totalApplications || 0}
                      </div>
                    </td>
                    <td>
                      <div className="stat-number">
                        {staff.profileViews || 0}
                      </div>
                    </td>
                    <td>
                      <div className="trend-cell">
                        {staff.applicationTrend && staff.applicationTrend.length > 0 ? (
                          <>
                            <button
                              className="view-trend-btn"
                              onClick={() => toggleRowExpansion(staff.userId, 'trend')}
                            >
                              View Trend
                            </button>
                            {expandedRows[`${staff.userId}-trend`] && (
                              <div className="trend-chart-container">
                                <ResponsiveContainer width="100%" height={200}>
                                  <LineChart data={staff.applicationTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line 
                                      type="monotone" 
                                      dataKey="applications" 
                                      stroke="#4f46e5" 
                                      strokeWidth={2}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="no-data-text">No trend data</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="applications-cell">
                        {staff.recentApplications && staff.recentApplications.length > 0 ? (
                          <>
                            <button
                              className="view-applications-btn"
                              onClick={() => toggleRowExpansion(staff.userId, 'applications')}
                            >
                              View ({staff.recentApplications.length})
                            </button>
                            {expandedRows[`${staff.userId}-applications`] && (
                              <div className="applications-list">
                                {staff.recentApplications.map((app, index) => (
                                  <div key={index} className="application-item">
                                    <div className="app-company">{app.companyName}</div>
                                    <div className="app-position">{app.jobTitle}</div>
                                    <div className="app-date">{formatDate(app.appliedAt)}</div>
                                    <div className="app-status">{app.status}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="no-data-text">No applications</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;