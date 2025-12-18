import React, { useState } from 'react';
import RegistrationRequests from './RegistrationRequests';
import MisRequests from './MisRequests';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('registration');

  const tabs = [
    { id: 'registration', label: 'Registration Requests', component: RegistrationRequests },
    { id: 'mis', label: 'MIS Requests', component: MisRequests }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || RegistrationRequests;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Master Admin Panel</h1>
        <p>Manage Staffinn platform requests and approvals</p>
      </div>

      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default AdminDashboard;