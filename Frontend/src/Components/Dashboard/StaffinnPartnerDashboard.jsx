import React, { useState, useEffect } from 'react';
import { FiHome, FiBookOpen, FiUsers, FiAward, FiTrendingUp, FiBarChart2 } from 'react-icons/fi';
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

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const statsResponse = await apiService.getDashboardStats();
      const misCountResponse = await apiService.getMisStudentCount();

      if (statsResponse.success) {
        const misStudentCount = misCountResponse.success ? misCountResponse.count : 0;
        setDashboardData({ ...statsResponse.data, totalStudents: misStudentCount });
      } else {
        const misStudentCount = misCountResponse.success ? misCountResponse.count : 0;
        setDashboardData({ totalCenters: 0, totalCourses: 0, totalStudents: misStudentCount, totalTrainedStudents: 0 });
      }

      const enrollmentResponse = await apiService.getEnrollmentTrends(new Date().getFullYear(), 12);
      if (enrollmentResponse.success) setEnrollmentTrends(enrollmentResponse.data);
      else setEnrollmentTrends([{ name: 'Jan', students: 0 },{ name: 'Feb', students: 0 },{ name: 'Mar', students: 0 },{ name: 'Apr', students: 0 },{ name: 'May', students: 0 },{ name: 'Jun', students: 0 }]);

      const placementResponse = await apiService.getPlacementTrends(new Date().getFullYear(), 12);
      if (placementResponse.success) setPlacementTrends(placementResponse.data);
      else setPlacementTrends([{ name: 'Jan', rate: 0 },{ name: 'Feb', rate: 0 },{ name: 'Mar', rate: 0 },{ name: 'Apr', rate: 0 },{ name: 'May', rate: 0 },{ name: 'Jun', rate: 0 }]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setDashboardData({ totalCenters: 0, totalCourses: 0, totalStudents: 0, totalTrainedStudents: 0 });
      setEnrollmentTrends([{ name: 'Jan', students: 0 },{ name: 'Feb', students: 0 },{ name: 'Mar', students: 0 },{ name: 'Apr', students: 0 },{ name: 'May', students: 0 },{ name: 'Jun', students: 0 }]);
      setPlacementTrends([{ name: 'Jan', rate: 0 },{ name: 'Feb', rate: 0 },{ name: 'Mar', rate: 0 },{ name: 'Apr', rate: 0 },{ name: 'May', rate: 0 },{ name: 'Jun', rate: 0 }]);
    } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="sp-dashboard-loading">
        <div className="sp-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="sp-dashboard">
      {/* Header */}
      <div className="sp-dashboard-header">
        <div>
          <h2 className="sp-dashboard-title">Partner Dashboard</h2>
          <p className="sp-dashboard-subtitle">Real-time overview of your institute's performance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="sp-stats-grid">
        <div className="sp-stat-card sp-stat-blue">
          <div className="sp-stat-icon"><FiHome /></div>
          <div className="sp-stat-info">
            <span className="sp-stat-value">{dashboardData.totalCenters}</span>
            <span className="sp-stat-label">Training Centers</span>
          </div>
        </div>
        <div className="sp-stat-card sp-stat-purple">
          <div className="sp-stat-icon"><FiBookOpen /></div>
          <div className="sp-stat-info">
            <span className="sp-stat-value">{dashboardData.totalCourses || 0}</span>
            <span className="sp-stat-label">Active Courses</span>
          </div>
        </div>
        <div className="sp-stat-card sp-stat-green">
          <div className="sp-stat-icon"><FiUsers /></div>
          <div className="sp-stat-info">
            <span className="sp-stat-value">{dashboardData.totalStudents || 0}</span>
            <span className="sp-stat-label">Enrolled Students</span>
          </div>
        </div>
        <div className="sp-stat-card sp-stat-orange">
          <div className="sp-stat-icon"><FiAward /></div>
          <div className="sp-stat-info">
            <span className="sp-stat-value">{dashboardData.totalTrainedStudents}</span>
            <span className="sp-stat-label">Successfully Trained</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="sp-charts-grid">
        <div className="sp-chart-card">
          <div className="sp-chart-header">
            <FiBarChart2 className="sp-chart-icon" />
            <h3>Student Enrollment Trends</h3>
          </div>
          <div className="sp-chart-body">
            <EnrollmentChart data={enrollmentTrends} />
          </div>
        </div>
        <div className="sp-chart-card">
          <div className="sp-chart-header">
            <FiTrendingUp className="sp-chart-icon" />
            <h3>Placement Success Rate</h3>
          </div>
          <div className="sp-chart-body">
            <PlacementChart data={placementTrends} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* Enrollment Bar Chart */
const EnrollmentChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.students), 1);
  return (
    <div className="sp-bar-chart">
      {data.map((item, i) => (
        <div key={i} className="sp-bar-col">
          <div className="sp-bar-track">
            <div className="sp-bar-fill" style={{ height: `${(item.students / maxValue) * 100}%` }} title={`${item.students} students`}></div>
          </div>
          <span className="sp-bar-label">{item.name}</span>
        </div>
      ))}
    </div>
  );
};

/* Placement Line Chart */
const PlacementChart = ({ data }) => {
  const maxRate = Math.max(...data.map(d => d.rate), 1);
  const points = data.map((item, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * 100,
    y: 100 - (item.rate / maxRate) * 100
  }));
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="sp-line-chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="sp-svg-chart">
        <defs>
          <linearGradient id="spGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0,25,50,75,100].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f1f5f9" strokeWidth="0.5"/>)}
        <path d={`${pathData} L 100 100 L 0 100 Z`} fill="url(#spGrad)" />
        <path d={pathData} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#6366f1" stroke="#fff" strokeWidth="1"/>)}
      </svg>
      <div className="sp-line-labels">
        {data.map((item, i) => <span key={i}>{item.name}</span>)}
      </div>
    </div>
  );
};

export default StaffinnPartnerDashboard;
