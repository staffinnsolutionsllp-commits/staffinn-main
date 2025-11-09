import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import adminAPI from '../services/adminApi';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalStaff: 0,
    activeStaff: 0,
    totalSeekers: 0,
    totalRecruiters: 0,
    totalJobs: 0,
    totalInstitutes: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalHired: 0
  });
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedMonth, selectedYear]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // For real-time dashboard, don't pass month/year parameters
      const response = await adminAPI.getDashboardData();
      
      if (response.success) {
        setDashboardData(response.data);
        
        // Prepare chart data
        const chartData = [
          { name: 'Users', value: response.data.totalUsers },
          { name: 'Staff', value: response.data.totalStaff },
          { name: 'Recruiters', value: response.data.totalRecruiters },
          { name: 'Institutes', value: response.data.totalInstitutes },
          { name: 'Students', value: response.data.totalStudents },
          { name: 'Jobs', value: response.data.totalJobs },
          { name: 'Courses', value: response.data.totalCourses },
          { name: 'Hired', value: response.data.totalHired }
        ];
        setChartData(chartData);

        // Prepare pie chart data
        const pieData = [
          { name: 'Active Staff', value: response.data.activeStaff },
          { name: 'Seekers', value: response.data.totalSeekers },
          { name: 'Students', value: response.data.totalStudents },
          { name: 'Hired', value: response.data.totalHired }
        ];
        setPieData(pieData);
      }
    } catch (error) {
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h2>Master Dashboard</h2>
            <p>Real-time overview of all platform metrics</p>
          </div>
          <button onClick={loadDashboardData} className="refresh-btn" disabled={loading}>
            <i className="fas fa-sync-alt"></i>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-icon users">
            <i className="fas fa-users"></i>
          </div>
          <div className="card-content">
            <h3>Total Users</h3>
            <div className="card-number">{dashboardData.totalUsers.toLocaleString()}</div>
            <p>All registered users</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon staff">
            <i className="fas fa-user-tie"></i>
          </div>
          <div className="card-content">
            <h3>Total Staff</h3>
            <div className="card-number">{dashboardData.totalStaff.toLocaleString()}</div>
            <p>Active: {dashboardData.activeStaff.toLocaleString()}</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon seekers">
            <i className="fas fa-search"></i>
          </div>
          <div className="card-content">
            <h3>Total Seekers</h3>
            <div className="card-number">{dashboardData.totalSeekers.toLocaleString()}</div>
            <p>Staff in seeker mode</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon recruiters">
            <i className="fas fa-briefcase"></i>
          </div>
          <div className="card-content">
            <h3>Total Recruiters</h3>
            <div className="card-number">{dashboardData.totalRecruiters.toLocaleString()}</div>
            <p>Registered recruiters</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon jobs">
            <i className="fas fa-clipboard-list"></i>
          </div>
          <div className="card-content">
            <h3>Total Jobs</h3>
            <div className="card-number">{dashboardData.totalJobs.toLocaleString()}</div>
            <p>Posted by recruiters</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon institutes">
            <i className="fas fa-university"></i>
          </div>
          <div className="card-content">
            <h3>Total Institutes</h3>
            <div className="card-number">{dashboardData.totalInstitutes.toLocaleString()}</div>
            <p>Registered institutes</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon students">
            <i className="fas fa-user-graduate"></i>
          </div>
          <div className="card-content">
            <h3>Total Students</h3>
            <div className="card-number">{dashboardData.totalStudents.toLocaleString()}</div>
            <p>Added by institutes</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon courses">
            <i className="fas fa-book"></i>
          </div>
          <div className="card-content">
            <h3>Total Courses</h3>
            <div className="card-number">{dashboardData.totalCourses.toLocaleString()}</div>
            <p>Created by institutes</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon hired">
            <i className="fas fa-user-check"></i>
          </div>
          <div className="card-content">
            <h3>Total Hired</h3>
            <div className="card-number">{dashboardData.totalHired.toLocaleString()}</div>
            <p>Students + Active Staff</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-filters">
          <h3>Data Visualization</h3>
          <div className="filters">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="filter-select"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="filter-select"
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="charts-container">
          <div className="chart-card">
            <h4>Platform Overview - Bar Chart</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4>User Distribution - Pie Chart</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;