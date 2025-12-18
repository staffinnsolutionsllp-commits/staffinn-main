import React from 'react';

const PlacementDashboard = ({ data, loading, onRefresh }) => {
  if (loading) {
    return (
      <div className="placement-loading">
        <div className="placement-loading-spinner"></div>
        <p>Loading placement dashboard...</p>
      </div>
    );
  }

  return (
    <div className="placement-dashboard">
      <div className="placement-dashboard-header">
        <h3>Placement Overview</h3>
        <button 
          className="placement-action-btn view"
          onClick={onRefresh}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      <div className="placement-dashboard-cards">
        <div className="placement-card success">
          <div className="placement-card-icon">📈</div>
          <div className="placement-card-value">{data.placementRate}%</div>
          <div className="placement-card-label">Placement Rate</div>
        </div>

        <div className="placement-card info">
          <div className="placement-card-icon">👥</div>
          <div className="placement-card-value">{data.studentsPlaced}</div>
          <div className="placement-card-label">Students Placed</div>
        </div>



        <div className="placement-card primary">
          <div className="placement-card-icon">📊</div>
          <div className="placement-card-value">{data.totalApplications}</div>
          <div className="placement-card-label">Total Applications</div>
        </div>
      </div>

      <div className="placement-dashboard-info">
        <div className="info-section">
          <h4>📋 Quick Stats</h4>
          <ul>
            <li>Track placement success across all programs</li>
            <li>Monitor salary trends and industry demands</li>
            <li>Analyze student performance by various metrics</li>
            <li>Generate comprehensive placement reports</li>
          </ul>
        </div>
        
        <div className="info-section">
          <h4>🎯 Key Features</h4>
          <ul>
            <li><strong>Center Wise:</strong> Compare performance across training centers</li>
            <li><strong>Sector Wise:</strong> Analyze placements by industry sectors</li>
            <li><strong>Student Wise:</strong> Individual student placement tracking</li>
            <li><strong>Real-time Updates:</strong> Live placement status monitoring</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PlacementDashboard;