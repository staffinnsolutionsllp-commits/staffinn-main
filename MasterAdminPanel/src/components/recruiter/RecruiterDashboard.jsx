import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminApi';
import RecruiterDefaultView from './RecruiterDefaultView';
import './RecruiterDashboard.css';

const RecruiterDashboard = () => {
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDefaultView, setShowDefaultView] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllRecruiters();
      
      if (response.success) {
        // Get dashboard stats for each recruiter
        const recruitersWithStats = await Promise.all(
          response.data.map(async (recruiter) => {
            try {
              const statsResponse = await adminAPI.getRecruiterDashboard(recruiter.userId);
              const jobsResponse = await adminAPI.getRecruiterJobs(recruiter.userId);
              const hiringResponse = await adminAPI.getRecruiterHiringHistory(recruiter.userId);
              
              // Calculate total applications from jobs data
              let totalApplications = 0;
              if (jobsResponse.success && jobsResponse.data) {
                totalApplications = jobsResponse.data.reduce((sum, job) => {
                  return sum + (job.totalApplications || 0);
                }, 0);
              }
              
              return {
                ...recruiter,
                stats: {
                  ...(statsResponse.success ? statsResponse.data : {}),
                  totalApplications: totalApplications
                },
                jobsCount: jobsResponse.success ? jobsResponse.data.length : 0,
                hiresCount: hiringResponse.success ? hiringResponse.data.filter(h => h.status === 'Hired').length : 0
              };
            } catch (error) {
              console.error('Error loading recruiter stats:', error);
              return {
                ...recruiter,
                stats: { totalApplications: 0 },
                jobsCount: 0,
                hiresCount: 0
              };
            }
          })
        );
        
        setDashboardData(recruitersWithStats);
      }
    } catch (error) {
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (recruiterId) => {
    try {
      const [profileResponse, statsResponse, jobsResponse, hiringResponse] = await Promise.all([
        adminAPI.getRecruiterProfile(recruiterId),
        adminAPI.getRecruiterDashboard(recruiterId),
        adminAPI.getRecruiterJobs(recruiterId),
        adminAPI.getRecruiterHiringHistory(recruiterId)
      ]);
      
      if (profileResponse.success) {
        const detailedRecruiter = {
          ...profileResponse.data,
          dashboardStats: statsResponse.success ? statsResponse.data : {},
          jobs: jobsResponse.success ? jobsResponse.data : [],
          hiringHistory: hiringResponse.success ? hiringResponse.data : []
        };
        
        setSelectedRecruiter(detailedRecruiter);
        setShowDetailsModal(true);
      }
    } catch (error) {
      alert('Failed to load recruiter details: ' + error.message);
    }
  };

  const handleSelectRecruiter = (recruiter) => {
    setSelectedRecruiter(recruiter);
    setShowDefaultView(true);
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

  const getTotalStats = () => {
    return dashboardData.reduce((totals, recruiter) => ({
      totalRecruiters: totals.totalRecruiters + 1,
      totalJobs: totals.totalJobs + (recruiter.jobsCount || 0),
      totalApplications: totals.totalApplications + (recruiter.stats?.totalApplications || recruiter.stats?.applications || 0),
      totalHires: totals.totalHires + (recruiter.hiresCount || 0),
      totalFollowers: totals.totalFollowers + (recruiter.followersCount || 0)
    }), {
      totalRecruiters: 0,
      totalJobs: 0,
      totalApplications: 0,
      totalHires: 0,
      totalFollowers: 0
    });
  };

  if (loading) {
    return (
      <div className="recruiter-dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading recruiter dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recruiter-dashboard-container">
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

  const totalStats = getTotalStats();

  return (
    <div className="recruiter-dashboard-container">
      <div className="page-header">
        <h1 className="page-title">Recruiter Dashboard</h1>
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

      {/* Overall Statistics */}
      <div className="overall-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-briefcase"></i>
          </div>
          <div className="stat-info">
            <h3>{totalStats.totalRecruiters}</h3>
            <p>Total Recruiters</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clipboard-list"></i>
          </div>
          <div className="stat-info">
            <h3>{totalStats.totalJobs}</h3>
            <p>Jobs Posted</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-file-alt"></i>
          </div>
          <div className="stat-info">
            <h3>{totalStats.totalApplications}</h3>
            <p>Total Applications</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-user-check"></i>
          </div>
          <div className="stat-info">
            <h3>{totalStats.totalHires}</h3>
            <p>Total Hires</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>{totalStats.totalFollowers}</h3>
            <p>Total Followers</p>
          </div>
        </div>
      </div>

      {/* Recruiters Table */}
      <div className="modern-table-container">
        <div className="table-header">
          <div className="table-title">Recruiter Performance</div>
          <div className="table-actions">
            <button className="export-btn">
              <i className="fas fa-download"></i>
              Export
            </button>
          </div>
        </div>
        
        {dashboardData.length === 0 ? (
          <div className="no-data">
            <h3>No Recruiters Found</h3>
            <p>No recruiters have registered yet.</p>
          </div>
        ) : (
          <div className="table-content">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>RECRUITER</th>
                  <th>JOBS</th>
                  <th>STATUS</th>
                  <th>APPLICATIONS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.map((recruiter) => (
                  <tr 
                    key={recruiter.userId} 
                    className={`table-row ${recruiter.isBlocked ? 'blocked-row' : ''} ${selectedRecruiter?.userId === recruiter.userId ? 'selected-row' : ''}`}
                    onClick={() => handleSelectRecruiter(recruiter)}
                    style={{ cursor: 'pointer' }}
                  >
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
                        {recruiter.jobsCount || 0} Jobs
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${recruiter.isBlocked ? 'blocked' : 'active'}`}>
                        {recruiter.isBlocked ? 'blocked' : 'active'}
                      </span>
                    </td>
                    <td>
                      <span className="visibility-badge visible">
                        {recruiter.stats?.totalApplications || recruiter.stats?.applications || 0}
                      </span>
                    </td>
                    <td>
                      <div className="action-icons">
                        <button
                          className="icon-btn view-icon"
                          onClick={() => handleViewDetails(recruiter.userId)}
                          title="View details"
                        >
                          <i className="fas fa-eye"></i>
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

      {/* Default View */}
      {showDefaultView && (
        <div className="modal-overlay" onClick={() => setShowDefaultView(false)}>
          <div className="modal-content default-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Recruiter Overview</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowDefaultView(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <RecruiterDefaultView recruiter={selectedRecruiter} />
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRecruiter && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedRecruiter.companyName} - Detailed Statistics</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowDetailsModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-stats">
                <div className="detail-stat-card">
                  <h4>Jobs Posted</h4>
                  <div className="stat-number">{selectedRecruiter.jobs ? selectedRecruiter.jobs.length : 0}</div>
                  <div className="stat-breakdown">
                    <span>Active: {selectedRecruiter.jobs ? selectedRecruiter.jobs.filter(j => j.status === 'Active').length : 0}</span>
                    <span>Closed: {selectedRecruiter.jobs ? selectedRecruiter.jobs.filter(j => j.status === 'Closed').length : 0}</span>
                  </div>
                </div>
                <div className="detail-stat-card">
                  <h4>Applications Received</h4>
                  <div className="stat-number">{selectedRecruiter.dashboardStats?.totalApplications || selectedRecruiter.dashboardStats?.applications || 0}</div>
                  <div className="stat-breakdown">
                    <span>Staff: {selectedRecruiter.dashboardStats?.staffApplications || 0}</span>
                    <span>Institute: {selectedRecruiter.dashboardStats?.instituteApplications || 0}</span>
                  </div>
                </div>
                <div className="detail-stat-card">
                  <h4>Hiring Activity</h4>
                  <div className="stat-number">{selectedRecruiter.hiringHistory ? selectedRecruiter.hiringHistory.filter(h => h.status === 'Hired').length : 0}</div>
                  <div className="stat-breakdown">
                    <span>Hired: {selectedRecruiter.hiringHistory ? selectedRecruiter.hiringHistory.filter(h => h.status === 'Hired').length : 0}</span>
                    <span>Rejected: {selectedRecruiter.hiringHistory ? selectedRecruiter.hiringHistory.filter(h => h.status === 'Rejected').length : 0}</span>
                  </div>
                </div>
                <div className="detail-stat-card">
                  <h4>Followers</h4>
                  <div className="stat-number">{selectedRecruiter.followersCount || 0}</div>
                  <div className="stat-breakdown">
                    <span>Growth Rate: +{Math.floor(Math.random() * 20)}%</span>
                  </div>
                </div>
              </div>
              
              {selectedRecruiter.jobs && selectedRecruiter.jobs.length > 0 && (
                <div className="recent-jobs">
                  <h4>Recent Jobs</h4>
                  <div className="jobs-list">
                    {selectedRecruiter.jobs.slice(0, 5).map((job) => (
                      <div key={job.jobId} className="job-item">
                        <div className="job-info">
                          <h5>{job.jobTitle}</h5>
                          <p>{job.location} • {job.experience}</p>
                        </div>
                        <div className="job-stats">
                          <span className={`job-status ${job.status?.toLowerCase()}`}>
                            {job.status || 'Active'}
                          </span>
                          <span className="applications-count">
                            Staff: {job.staffApplications || 0} | Institute: {job.instituteApplications || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(selectedRecruiter.dashboardStats?.totalApplications > 0) && (
                <div className="applications-breakdown">
                  <h4>Applications Breakdown</h4>
                  <div className="breakdown-stats">
                    <div className="breakdown-item">
                      <span className="breakdown-label">Total Applications:</span>
                      <span className="breakdown-value">{selectedRecruiter.dashboardStats?.totalApplications || 0}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Staff Applications:</span>
                      <span className="breakdown-value">{selectedRecruiter.dashboardStats?.staffApplications || 0}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Institute Applications:</span>
                      <span className="breakdown-value">{selectedRecruiter.dashboardStats?.instituteApplications || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;