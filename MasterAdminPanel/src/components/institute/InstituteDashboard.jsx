import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import adminAPI from '../../services/adminApi';
import './InstituteDashboard.css';

const InstituteDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalInstitutes: 0,
    totalCourses: 0,
    totalStudents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getInstituteDashboardData();
      
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const barChartData = [
    {
      name: 'Institutes',
      count: dashboardData.totalInstitutes,
      fill: '#8884d8'
    },
    {
      name: 'Courses',
      count: dashboardData.totalCourses,
      fill: '#82ca9d'
    },
    {
      name: 'Students',
      count: dashboardData.totalStudents,
      fill: '#ffc658'
    }
  ];

  const pieChartData = [
    { name: 'Institutes', value: dashboardData.totalInstitutes, fill: '#8884d8' },
    { name: 'Courses', value: dashboardData.totalCourses, fill: '#82ca9d' },
    { name: 'Students', value: dashboardData.totalStudents, fill: '#ffc658' }
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

  if (loading) {
    return (
      <div className="institute-dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="institute-dashboard-container">
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
    <div className="institute-dashboard-container">
      <div className="dashboard-header">
        <h2>Institute Dashboard Overview</h2>
        <p>Real-time statistics for all institutes, courses, and students</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card institutes">
          <div className="stat-icon">
            <i className="fas fa-university"></i>
          </div>
          <div className="stat-content">
            <h3>Total Institutes</h3>
            <div className="stat-number">{dashboardData.totalInstitutes}</div>
            <p>Registered institutes</p>
          </div>
        </div>

        <div className="stat-card courses">
          <div className="stat-icon">
            <i className="fas fa-book"></i>
          </div>
          <div className="stat-content">
            <h3>Total Courses</h3>
            <div className="stat-number">{dashboardData.totalCourses}</div>
            <p>Courses uploaded</p>
          </div>
        </div>

        <div className="stat-card students">
          <div className="stat-icon">
            <i className="fas fa-user-graduate"></i>
          </div>
          <div className="stat-content">
            <h3>Total Students</h3>
            <div className="stat-number">{dashboardData.totalStudents}</div>
            <p>Students across all institutes</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <div className="chart-header">
            <h3>Statistics Overview - Bar Chart</h3>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>Distribution - Pie Chart</h3>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="summary-section">
        <div className="summary-card">
          <h3>Platform Summary</h3>
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-label">Average Courses per Institute:</span>
              <span className="summary-value">
                {dashboardData.totalInstitutes > 0 
                  ? (dashboardData.totalCourses / dashboardData.totalInstitutes).toFixed(1)
                  : '0'
                }
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Average Students per Institute:</span>
              <span className="summary-value">
                {dashboardData.totalInstitutes > 0 
                  ? (dashboardData.totalStudents / dashboardData.totalInstitutes).toFixed(1)
                  : '0'
                }
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Platform Growth:</span>
              <span className="summary-value">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstituteDashboard;