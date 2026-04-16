import React, { useState, useEffect } from 'react';
import apiService from '../../../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const PlacementTracking = () => {
  const [trackingData, setTrackingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    recruiter: 'all',
    jobRole: ''
  });
  const [recruiters, setRecruiters] = useState([]);

  useEffect(() => {
    loadPlacementTracking();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, trackingData]);

  const loadPlacementTracking = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching placement tracking data...');
      const response = await apiService.getPlacementTracking();
      console.log('📦 API Response:', response);
      
      if (response.success && Array.isArray(response.data)) {
        console.log('✅ Data is valid array with', response.data.length, 'applications');
        console.log('📋 Sample application data:', response.data[0]);
        
        // Data is already flattened from backend - each item is an application
        const applications = response.data.map(app => {
          console.log('🔍 Raw status from backend:', app.status);
          console.log('🔍 Raw recruiterName:', app.recruiterName);
          console.log('🔍 Raw companyName:', app.companyName);
          
          // Use companyName as recruiterName since that's where the actual name is
          const actualRecruiterName = app.companyName || app.recruiterName || 'Unknown Recruiter';
          
          const normalizedStatus = app.status === 'hired' || app.status === 'Hired' ? 'Hired' : 
                  app.status === 'rejected' || app.status === 'Rejected' ? 'Rejected' : 
                  app.status === 'applied' || app.status === 'Applied' ? 'Applied' :
                  app.status === 'shortlisted' || app.status === 'Shortlisted' ? 'Shortlisted' :
                  app.status === 'interview_scheduled' || app.status === 'Interview' ? 'Interview' : 'Applied';
          console.log('✅ Normalized status:', normalizedStatus);
          console.log('✅ Using recruiter name:', actualRecruiterName);
          
          return {
            applicationId: app.applicationId || app.staffinnjob,
            studentName: app.studentName,
            studentId: app.studentId,
            jobTitle: app.jobTitle,
            recruiterName: actualRecruiterName,
            status: normalizedStatus,
            appliedDate: app.appliedDate || app.timestamp,
            updatedAt: app.updatedAt || app.lastUpdated
          };
        });
        
        console.log('📊 Processed applications:', applications.length);
        console.log('📋 Sample processed application:', applications[0]);
        setTrackingData(applications);
        
        // Extract unique recruiters
        const uniqueRecruiters = [...new Set(applications.map(item => item.recruiterName).filter(Boolean))];
        setRecruiters(uniqueRecruiters);
      } else {
        console.warn('⚠️ Invalid response format:', response);
      }
    } catch (error) {
      console.error('❌ Error loading placement tracking:', error);
      setTrackingData([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...trackingData];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Filter by recruiter
    if (filters.recruiter !== 'all') {
      filtered = filtered.filter(item => item.recruiterName === filters.recruiter);
    }

    // Filter by job role
    if (filters.jobRole.trim()) {
      const searchTerm = filters.jobRole.toLowerCase();
      filtered = filtered.filter(item => 
        item.jobTitle?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredData(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Hired':
        return 'status-badge hired';
      case 'Rejected':
        return 'status-badge rejected';
      case 'Applied':
        return 'status-badge applied';
      case 'Shortlisted':
        return 'status-badge shortlisted';
      case 'Interview':
        return 'status-badge interview';
      default:
        return 'status-badge';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="placement-loading">
        <div className="placement-loading-spinner"></div>
        <p>Loading placement tracking data...</p>
      </div>
    );
  }

  return (
    <div className="placement-tracking">
      <div className="tracking-header">
        <h3>📋 Placement Tracking</h3>
        <p>Real-time tracking of student applications and placement status</p>
      </div>

      {/* Filters Section */}
      <div className="tracking-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="Applied">Applied</option>
            <option value="Hired">Hired</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Recruiter:</label>
          <select 
            value={filters.recruiter}
            onChange={(e) => handleFilterChange('recruiter', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Recruiters</option>
            {recruiters.map((recruiter, index) => (
              <option key={index} value={recruiter}>{recruiter}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Job Role:</label>
          <input
            type="text"
            placeholder="Search by job role..."
            value={filters.jobRole}
            onChange={(e) => handleFilterChange('jobRole', e.target.value)}
            className="filter-input"
          />
        </div>

        <button 
          className="filter-reset-btn"
          onClick={() => setFilters({ status: 'all', recruiter: 'all', jobRole: '' })}
        >
          Reset Filters
        </button>
      </div>

      {/* Summary Cards */}
      <div className="tracking-summary">
        <div className="summary-card total">
          <div className="summary-icon">
            <img src="/application.png" alt="Total Applications" />
          </div>
          <div className="summary-content">
            <div className="summary-value">{trackingData.length}</div>
            <div className="summary-label">Total Applications</div>
          </div>
        </div>

        <div className="summary-card applied">
          <div className="summary-icon">
            <img src="/Applied.png" alt="Applied" />
          </div>
          <div className="summary-content">
            <div className="summary-value">
              {trackingData.filter(item => item.status === 'Applied').length}
            </div>
            <div className="summary-label">Applied</div>
          </div>
        </div>

        <div className="summary-card hired">
          <div className="summary-icon">
            <img src="/Hired.png" alt="Hired" />
          </div>
          <div className="summary-content">
            <div className="summary-value">
              {trackingData.filter(item => item.status === 'Hired').length}
            </div>
            <div className="summary-label">Hired</div>
          </div>
        </div>

        <div className="summary-card rejected">
          <div className="summary-icon">
            <img src="/Rejected.png" alt="Rejected" />
          </div>
          <div className="summary-content">
            <div className="summary-value">
              {trackingData.filter(item => item.status === 'Rejected').length}
            </div>
            <div className="summary-label">Rejected</div>
          </div>
        </div>
      </div>

      {/* Pie Chart Section */}
      <div className="pie-chart-section">
        <div className="pie-chart-container">
          <h4>📊 Application Status Distribution</h4>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={[
                  { 
                    name: 'Applied', 
                    value: trackingData.filter(item => item.status === 'Applied').length,
                    percentage: trackingData.length > 0 ? Math.round((trackingData.filter(item => item.status === 'Applied').length / trackingData.length) * 100) : 0
                  },
                  { 
                    name: 'Hired', 
                    value: trackingData.filter(item => item.status === 'Hired').length,
                    percentage: trackingData.length > 0 ? Math.round((trackingData.filter(item => item.status === 'Hired').length / trackingData.length) * 100) : 0
                  },
                  { 
                    name: 'Rejected', 
                    value: trackingData.filter(item => item.status === 'Rejected').length,
                    percentage: trackingData.length > 0 ? Math.round((trackingData.filter(item => item.status === 'Rejected').length / trackingData.length) * 100) : 0
                  }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                <Cell fill="#f59e0b" />
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [`${value} applications (${props.payload.percentage}%)`, name]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => {
                  const data = entry.payload;
                  return `${value}: ${data.value} (${data.percentage}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      {filteredData.length === 0 ? (
        <div className="placement-empty">
          <div className="placement-empty-icon">📭</div>
          <h3>No Applications Found</h3>
          <p>No placement applications match the selected filters.</p>
        </div>
      ) : (
        <div className="tracking-table-container">
          <table className="placement-table tracking-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Student ID</th>
                <th>Job Title</th>
                <th>Recruiter Name</th>
                <th>Status</th>
                <th>Applied Date</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => {
                console.log(`Row ${index} status:`, item.status);
                const statusClass = getStatusBadgeClass(item.status);
                console.log(`Row ${index} statusClass:`, statusClass);
                return (
                  <tr key={item.applicationId || index}>
                    <td>
                      <strong>{item.studentName || 'N/A'}</strong>
                    </td>
                    <td>{item.studentId || 'N/A'}</td>
                    <td>{item.jobTitle || 'N/A'}</td>
                    <td>{item.recruiterName || 'N/A'}</td>
                    <td className="status-cell">
                      <span className={statusClass}>{item.status || 'Unknown'}</span>
                    </td>
                    <td>{formatDate(item.appliedDate)}</td>
                    <td>{formatDate(item.updatedAt || item.appliedDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .placement-tracking {
          padding: 20px;
        }

        .tracking-header {
          margin-bottom: 30px;
        }

        .tracking-header h3 {
          font-size: 24px;
          color: #2c3e50;
          margin-bottom: 8px;
        }

        .tracking-header p {
          color: #64748b;
          font-size: 14px;
        }

        .tracking-filters {
          display: flex;
          gap: 15px;
          margin-bottom: 25px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 180px;
        }

        .filter-group label {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }

        .filter-select,
        .filter-input {
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 14px;
          background: white;
        }

        .filter-select:focus,
        .filter-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .filter-reset-btn {
          padding: 8px 16px;
          background: #64748b;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .filter-reset-btn:hover {
          background: #475569;
        }

        .tracking-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .summary-card {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 20px;
          border-radius: 10px;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .summary-card.total {
          border-left: 4px solid #3b82f6;
        }

        .summary-card.applied {
          border-left: 4px solid #f59e0b;
        }

        .summary-card.hired {
          border-left: 4px solid #10b981;
        }

        .summary-card.rejected {
          border-left: 4px solid #ef4444;
        }

        .summary-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .summary-icon img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .summary-content {
          display: flex;
          flex-direction: column;
        }

        .summary-value {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
        }

        .summary-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .pie-chart-section {
          margin-bottom: 30px;
        }

        .pie-chart-container {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .pie-chart-container h4 {
          font-size: 20px;
          color: #2c3e50;
          margin-bottom: 25px;
          text-align: center;
          font-weight: 600;
        }

        .tracking-table-container {
          overflow-x: auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .tracking-table {
          width: 100%;
          border-collapse: collapse;
        }

        .tracking-table thead {
          background: #f8fafc;
        }

        .tracking-table th {
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e2e8f0;
        }

        .tracking-table td {
          padding: 15px;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
          font-size: 14px;
          vertical-align: middle;
        }

        .tracking-table td.status-cell {
          padding: 15px;
          position: relative;
        }

        .tracking-table tbody tr:hover {
          background: #f8fafc;
        }

        .status-badge {
          display: inline-block !important;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          visibility: visible !important;
          position: static !important;
        }

        .status-badge.applied {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.hired {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.rejected {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-badge.shortlisted {
          background: #e0e7ff;
          color: #3730a3;
        }

        .status-badge.interview {
          background: #fef3c7;
          color: #92400e;
        }

        @media (max-width: 768px) {
          .tracking-filters {
            flex-direction: column;
          }

          .filter-group {
            width: 100%;
          }

          .tracking-summary {
            grid-template-columns: 1fr;
          }

          .summary-icon {
            width: 40px;
            height: 40px;
          }

          .summary-value {
            font-size: 24px;
          }

          .tracking-table-container {
            overflow-x: scroll;
          }
        }

        @media (max-width: 480px) {
          .summary-card {
            padding: 15px;
            gap: 12px;
          }

          .summary-icon {
            width: 36px;
            height: 36px;
          }

          .summary-value {
            font-size: 22px;
          }

          .summary-label {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default PlacementTracking;
