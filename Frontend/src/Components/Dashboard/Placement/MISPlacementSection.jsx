import React, { useState, useEffect } from 'react';
import './PlacementSection.css';
import MISPlacementTracking from './MISPlacementTracking';
import MISCenterWiseAnalytics from './MISCenterWiseAnalytics';
import MISSectorWiseAnalytics from './MISSectorWiseAnalytics';
import MISStudentWiseAnalytics from './MISStudentWiseAnalytics';
import apiService from '../../../services/api';

const MISPlacementSection = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    placementRate: 0,
    studentsPlaced: 0,
    avgSalaryPackage: 0,
    totalApplications: 0
  });

  useEffect(() => {
    loadMISDashboardSummary();
  }, []);

  const loadMISDashboardSummary = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading MIS placement dashboard summary...');
      const response = await apiService.getMISPlacementDashboardSummary();
      console.log('📊 MIS Dashboard Response:', response);
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('❌ Error loading MIS placement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="placement-section">
      <div className="placement-header">
        <h2>💼 MIS Student Placement Analytics</h2>
        <p>Track and analyze MIS student placement performance</p>
      </div>

      {/* Dashboard Summary Cards */}
      <div className="mis-dashboard-summary">
        <div className="mis-summary-card">
          <div className="mis-summary-icon">📊</div>
          <div className="mis-summary-content">
            <div className="mis-summary-label">Placement Rate</div>
            <div className="mis-summary-value">{dashboardData.placementRate}%</div>
          </div>
        </div>

        <div className="mis-summary-card">
          <div className="mis-summary-icon">👨🎓</div>
          <div className="mis-summary-content">
            <div className="mis-summary-label">Students Placed</div>
            <div className="mis-summary-value">{dashboardData.studentsPlaced}</div>
          </div>
        </div>

        <div className="mis-summary-card">
          <div className="mis-summary-icon">💰</div>
          <div className="mis-summary-content">
            <div className="mis-summary-label">Avg. Salary Package</div>
            <div className="mis-summary-value">₹{dashboardData.avgSalaryPackage}L</div>
          </div>
        </div>

        <div className="mis-summary-card">
          <div className="mis-summary-icon">📝</div>
          <div className="mis-summary-content">
            <div className="mis-summary-label">Total Applications</div>
            <div className="mis-summary-value">{dashboardData.totalApplications}</div>
          </div>
        </div>
      </div>

      <div className="placement-navigation">
        <button 
          className={`placement-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`placement-nav-btn ${activeTab === 'placement-tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('placement-tracking')}
        >
          📋 Placement Tracking
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
          👨🎓 Student Wise
        </button>
      </div>

      <div className="placement-content">
        {activeTab === 'dashboard' && (
          <div className="placement-dashboard">
            <div className="placement-dashboard-header">
              <h3>MIS Placement Overview</h3>
              <button 
                className="placement-action-btn view"
                onClick={loadMISDashboardSummary}
                disabled={loading}
              >
                🔄 Refresh
              </button>
            </div>

            <div className="placement-dashboard-cards">
              <div className="placement-card success">
                <div className="placement-card-icon">📈</div>
                <div className="placement-card-value">{dashboardData.placementRate}%</div>
                <div className="placement-card-label">Placement Rate</div>
              </div>

              <div className="placement-card info">
                <div className="placement-card-icon">👥</div>
                <div className="placement-card-value">{dashboardData.studentsPlaced}</div>
                <div className="placement-card-label">Students Placed</div>
              </div>

              <div className="placement-card primary">
                <div className="placement-card-icon">📊</div>
                <div className="placement-card-value">{dashboardData.totalApplications}</div>
                <div className="placement-card-label">Total Applications</div>
              </div>
            </div>

            <div className="placement-dashboard-info">
              <div className="info-section">
                <h4>📋 Quick Stats</h4>
                <ul>
                  <li>Track MIS student placement success across all programs</li>
                  <li>Monitor salary trends and industry demands</li>
                  <li>Analyze MIS student performance by various metrics</li>
                  <li>Generate comprehensive placement reports</li>
                </ul>
              </div>
              
              <div className="info-section">
                <h4>🎯 Key Features</h4>
                <ul>
                  <li><strong>Center Wise:</strong> Compare MIS student performance across training centers</li>
                  <li><strong>Sector Wise:</strong> Analyze MIS placements by industry sectors</li>
                  <li><strong>Student Wise:</strong> Individual MIS student placement tracking</li>
                  <li><strong>Real-time Updates:</strong> Live placement status monitoring</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'placement-tracking' && <MISPlacementTracking />}
        {activeTab === 'center-wise' && <MISCenterWiseAnalytics />}
        {activeTab === 'sector-wise' && <MISSectorWiseAnalytics />}
        {activeTab === 'student-wise' && <MISStudentWiseAnalytics />}
      </div>

      <style>{`
        .mis-dashboard-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .mis-summary-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 25px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .mis-summary-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
        }

        .mis-summary-icon {
          font-size: 48px;
          flex-shrink: 0;
        }

        .mis-summary-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mis-summary-label {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .mis-summary-value {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
        }

        @media (max-width: 768px) {
          .mis-dashboard-summary {
            grid-template-columns: 1fr;
          }

          .mis-summary-card {
            padding: 20px;
          }

          .mis-summary-icon {
            font-size: 40px;
          }

          .mis-summary-value {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
};

export default MISPlacementSection;
