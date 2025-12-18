import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminApi';
import './StaffinnPartnerDashboard.css';

const StaffinnPartnerDashboard = () => {
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInstitutes();
  }, []);

  const loadInstitutes = async () => {
    try {
      const response = await adminAPI.getAllMisRequests();
      if (response.success) {
        const staffinnPartners = response.data.filter(request => 
          request.status === 'approved'
        );
        setInstitutes(staffinnPartners);
      }
    } catch (error) {
      console.error('Error loading institutes:', error);
    }
  };

  const loadDashboardData = async (instituteId) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Loading dashboard data for institute:', instituteId);
      
      // Load dashboard stats
      const statsResponse = await adminAPI.getStaffinnPartnerDashboard(instituteId);
      console.log('📊 Dashboard stats response:', statsResponse);
      
      if (statsResponse.success) {
        console.log('✅ Dashboard stats loaded:', statsResponse.data);
        setDashboardData(statsResponse.data);
      } else {
        console.error('❌ Dashboard stats failed:', statsResponse.message);
        setError(statsResponse.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleInstituteChange = (e) => {
    const instituteId = e.target.value;
    setSelectedInstitute(instituteId);
    if (instituteId) {
      loadDashboardData(instituteId);
    } else {
      setDashboardData(null);
    }
  };

  const EnrollmentChart = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.students), 1);
    
    return (
      <div className="bar-chart">
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color enrolled"></span>
            <span>Enrolled Students</span>
          </div>
        </div>
        
        <div className="chart-bars">
          {data.map((item, index) => (
            <div key={index} className="bar-group">
              <div className="bars">
                <div 
                  className="bar enrolled"
                  style={{ height: `${(item.students / maxValue) * 100}%` }}
                  title={`${item.students} enrolled`}
                ></div>
              </div>
              <div className="bar-label">{item.name}</div>
            </div>
          ))}
        </div>
        
        <div className="chart-y-axis">
          <div className="y-axis-label">{maxValue}</div>
          <div className="y-axis-label">{Math.floor(maxValue * 0.75)}</div>
          <div className="y-axis-label">{Math.floor(maxValue * 0.5)}</div>
          <div className="y-axis-label">{Math.floor(maxValue * 0.25)}</div>
          <div className="y-axis-label">0</div>
        </div>
      </div>
    );
  };

  const PlacementChart = ({ data }) => {
    const maxRate = Math.max(...data.map(d => d.rate));
    const points = data.map((item, index) => ({
      x: (index / (data.length - 1)) * 100,
      y: 100 - (item.rate / maxRate) * 100
    }));
    
    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    return (
      <div className="line-chart">
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color placement"></span>
            <span>Placement Rate (%)</span>
          </div>
        </div>
        
        <svg className="chart-svg" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8884d8" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#8884d8" stopOpacity="0"/>
            </linearGradient>
          </defs>
          
          {[0, 25, 50, 75, 100].map(y => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f0f0f0" strokeWidth="0.5"/>
          ))}
          
          <path
            d={`${pathData} L 100 100 L 0 100 Z`}
            fill="url(#gradient)"
          />
          
          <path
            d={pathData}
            fill="none"
            stroke="#8884d8"
            strokeWidth="2"
          />
          
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="2"
              fill="#8884d8"
            />
          ))}
        </svg>
        
        <div className="chart-x-labels">
          {data.map((item, index) => (
            <div key={index} className="x-label">{item.name}</div>
          ))}
        </div>
        
        <div className="chart-y-labels">
          <div className="y-label">100</div>
          <div className="y-label">75</div>
          <div className="y-label">50</div>
          <div className="y-label">25</div>
          <div className="y-label">0</div>
        </div>
      </div>
    );
  };

  return (
    <div className="staffinn-partner-dashboard-container">
      <div className="page-header">
        <h1 className="page-title">Staffinn Partner Dashboard</h1>
        <p className="page-subtitle">View dashboard data for any Staffinn Partner institute</p>
      </div>

      <div className="institute-selector">
        <label htmlFor="institute-select">Select Staffinn Partner Institute:</label>
        <select 
          id="institute-select"
          value={selectedInstitute} 
          onChange={handleInstituteChange}
          className="institute-dropdown"
        >
          <option value="">-- Select Institute --</option>
          {institutes.map((institute) => (
            <option key={institute.userId} value={institute.userId}>
              {institute.instituteName}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {dashboardData && !loading && (
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h2>📊 Partner Dashboard</h2>
            <p>Real-time overview of {institutes.find(i => i.userId === selectedInstitute)?.instituteName}'s performance</p>
          </div>

          <div className="dashboard-cards">
            <div className="dashboard-card">
              <div className="card-icon">🏢</div>
              <div className="card-content">
                <h3>Total Centers</h3>
                <div className="card-value">{dashboardData.totalCenters}</div>
                <div className="card-label">Training Centers</div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">📚</div>
              <div className="card-content">
                <h3>Total Courses</h3>
                <div className="card-value">{dashboardData.totalCourses}</div>
                <div className="card-label">Active Courses</div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">👨🎓</div>
              <div className="card-content">
                <h3>Total Students</h3>
                <div className="card-value">{dashboardData.totalStudents}</div>
                <div className="card-label">Enrolled Students</div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">🎓</div>
              <div className="card-content">
                <h3>Trained Students</h3>
                <div className="card-value">{dashboardData.totalTrainedStudents}</div>
                <div className="card-label">Successfully Trained</div>
              </div>
            </div>
          </div>

          <div className="dashboard-charts">
            <div className="chart-container">
              <h3>Student Enrollment Trends</h3>
              <div className="chart-wrapper">
                <EnrollmentChart data={dashboardData.enrollmentTrends || []} />
              </div>
            </div>

            <div className="chart-container">
              <h3>Placement Success Rate</h3>
              <div className="chart-wrapper">
                <PlacementChart data={dashboardData.placementTrends || []} />
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedInstitute && !loading && (
        <div className="no-selection">
          <h3>Select an Institute</h3>
          <p>Please select a Staffinn Partner institute from the dropdown above to view their dashboard data.</p>
        </div>
      )}
    </div>
  );
};

export default StaffinnPartnerDashboard;