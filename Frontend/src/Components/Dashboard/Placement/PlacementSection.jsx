import React, { useState, useEffect } from 'react';
import './PlacementSection.css';
import PlacementDashboard from './PlacementDashboard';
import CenterWiseAnalytics from './CenterWiseAnalytics';
import SectorWiseAnalytics from './SectorWiseAnalytics';
import StudentWiseAnalytics from './StudentWiseAnalytics';
import apiService from '../../../services/api';

const PlacementSection = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    placementRate: 0,
    studentsPlaced: 0,
    avgSalaryPackage: 0,
    totalApplications: 0
  });

  // Load dashboard summary on component mount
  useEffect(() => {
    loadDashboardSummary();
  }, []);

  const loadDashboardSummary = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPlacementDashboardSummary();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error loading placement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="placement-section">
      <div className="placement-header">
        <h2>💼 Placement Analytics</h2>
        <p>Track and analyze placement performance across different dimensions</p>
      </div>

      <div className="placement-navigation">
        <button 
          className={`placement-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`placement-nav-btn ${activeTab === 'center-wise' ? 'active' : ''}`}
          onClick={() => setActiveTab('center-wise')}
        >
          🏢 Center Wise
        </button>
        <button 
          className={`placement-nav-btn ${activeTab === 'sector-wise' ? 'active' : ''}`}
          onClick={() => setActiveTab('sector-wise')}
        >
          🏭 Sector Wise
        </button>
        <button 
          className={`placement-nav-btn ${activeTab === 'student-wise' ? 'active' : ''}`}
          onClick={() => setActiveTab('student-wise')}
        >
          👨‍🎓 Student Wise
        </button>
      </div>

      <div className="placement-content">
        {activeTab === 'dashboard' && (
          <PlacementDashboard 
            data={dashboardData} 
            loading={loading}
            onRefresh={loadDashboardSummary}
          />
        )}
        {activeTab === 'center-wise' && <CenterWiseAnalytics />}
        {activeTab === 'sector-wise' && <SectorWiseAnalytics />}
        {activeTab === 'student-wise' && <StudentWiseAnalytics />}
      </div>
    </div>
  );
};

export default PlacementSection;