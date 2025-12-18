import React, { useState, useEffect } from 'react';
import './StaffinnPartnerDashboard.css';
import apiService from '../../services/api';

const StaffinnPartnerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalCenters: 0,
    totalCourses: 0,
    totalStudents: 0,
    totalTrainedStudents: 0
  });
  const [enrollmentTrends, setEnrollmentTrends] = useState([]);
  const [placementTrends, setPlacementTrends] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Loading dashboard data...');
      
      // Load dashboard stats
      console.log('📊 Fetching dashboard stats...');
      const statsResponse = await apiService.getDashboardStats();
      console.log('📊 Dashboard stats response:', statsResponse);
      
      // Load MIS student count separately
      console.log('👨🎓 Fetching MIS student count...');
      const misCountResponse = await apiService.getMisStudentCount();
      console.log('👨🎓 MIS student count response:', misCountResponse);
      
      if (statsResponse.success) {
        console.log('✅ Dashboard stats loaded:', statsResponse.data);
        
        // Use MIS student count if available, otherwise use dashboard stats
        const misStudentCount = misCountResponse.success ? misCountResponse.count : 0;
        const updatedStats = {
          ...statsResponse.data,
          totalStudents: misStudentCount
        };
        
        console.log('📊 Final dashboard data with MIS count:', updatedStats);
        setDashboardData(updatedStats);
      } else {
        console.error('❌ Dashboard stats failed:', statsResponse.message);
        
        // Try to get at least MIS student count
        const misStudentCount = misCountResponse.success ? misCountResponse.count : 0;
        
        // Set default data if API fails
        setDashboardData({
          totalCenters: 0,
          totalCourses: 0,
          totalStudents: misStudentCount,
          totalTrainedStudents: 0
        });
      }

      // Load enrollment trends
      console.log('📈 Fetching enrollment trends...');
      const enrollmentResponse = await apiService.getEnrollmentTrends(new Date().getFullYear(), 12);
      console.log('📈 Enrollment trends response:', enrollmentResponse);
      
      if (enrollmentResponse.success) {
        console.log('✅ Enrollment trends loaded:', enrollmentResponse.data);
        setEnrollmentTrends(enrollmentResponse.data);
      } else {
        console.error('❌ Enrollment trends failed:', enrollmentResponse.message);
        // Set default data if API fails
        setEnrollmentTrends([
          { name: 'Jan', students: 0 },
          { name: 'Feb', students: 0 },
          { name: 'Mar', students: 0 },
          { name: 'Apr', students: 0 },
          { name: 'May', students: 0 },
          { name: 'Jun', students: 0 }
        ]);
      }

      // Load placement trends
      console.log('📊 Fetching placement trends...');
      const placementResponse = await apiService.getPlacementTrends(new Date().getFullYear(), 12);
      console.log('📊 Placement trends response:', placementResponse);
      
      if (placementResponse.success) {
        console.log('✅ Placement trends loaded:', placementResponse.data);
        setPlacementTrends(placementResponse.data);
      } else {
        console.error('❌ Placement trends failed:', placementResponse.message);
        // Set default data if API fails
        setPlacementTrends([
          { name: 'Jan', rate: 0 },
          { name: 'Feb', rate: 0 },
          { name: 'Mar', rate: 0 },
          { name: 'Apr', rate: 0 },
          { name: 'May', rate: 0 },
          { name: 'Jun', rate: 0 }
        ]);
      }

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      
      // Set default data in case of complete failure
      setDashboardData({
        totalCenters: 0,
        totalCourses: 0,
        totalStudents: 0,
        totalTrainedStudents: 0
      });
      
      setEnrollmentTrends([
        { name: 'Jan', students: 0 },
        { name: 'Feb', students: 0 },
        { name: 'Mar', students: 0 },
        { name: 'Apr', students: 0 },
        { name: 'May', students: 0 },
        { name: 'Jun', students: 0 }
      ]);
      
      setPlacementTrends([
        { name: 'Jan', rate: 0 },
        { name: 'Feb', rate: 0 },
        { name: 'Mar', rate: 0 },
        { name: 'Apr', rate: 0 },
        { name: 'May', rate: 0 },
        { name: 'Jun', rate: 0 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="staffinn-partner-dashboard">
      <div className="dashboard-header">
        <h2>📊 Partner Dashboard</h2>
        <p>Real-time overview of your institute's performance</p>
      </div>

      {/* Dashboard Cards */}
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
            <div className="card-value">{dashboardData.totalCourses || 0}</div>
            <div className="card-label">Active Courses</div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">👨‍🎓</div>
          <div className="card-content">
            <h3>Total Students</h3>
            <div className="card-value">{dashboardData.totalStudents || 0}</div>
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

      {/* Dashboard Charts */}
      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>Student Enrollment Trends</h3>
          <div className="chart-wrapper">
            <EnrollmentChart data={enrollmentTrends} />
          </div>
        </div>

        <div className="chart-container">
          <h3>Placement Success Rate</h3>
          <div className="chart-wrapper">
            <PlacementChart data={placementTrends} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Bar Chart Component for Enrollment
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

// Simple Line Chart Component for Placement
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
        
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f0f0f0" strokeWidth="0.5"/>
        ))}
        
        {/* Area under curve */}
        <path
          d={`${pathData} L 100 100 L 0 100 Z`}
          fill="url(#gradient)"
        />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="#8884d8"
          strokeWidth="2"
        />
        
        {/* Points */}
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

export default StaffinnPartnerDashboard;