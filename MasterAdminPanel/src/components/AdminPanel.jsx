import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import StaffDashboard from './staff/StaffDashboard';
import StaffUsers from './staff/StaffUsers';
import RecruiterDashboard from './recruiter/RecruiterDashboard';
import RecruiterUsers from './recruiter/RecruiterUsers';
import RecruiterInstitutesSection from './recruiter/RecruiterInstitutesSection';
import RecruiterJobsSection from './recruiter/RecruiterJobsSection';
import RecruiterHiringSection from './recruiter/RecruiterHiringSection';
import InstituteDashboard from './institute/InstituteDashboard';
import InstituteUsers from './institute/InstituteUsers';
import InstituteStudents from './institute/InstituteStudents';
import InstituteCourses from './institute/InstituteCourses';
import StaffinnPartnerUsers from './staffinnPartner/StaffinnPartnerUsers';
import StaffinnPartnerDashboard from './staffinnPartner/StaffinnPartnerDashboard';
import StaffinnPartnerTrainingCenters from './staffinnPartner/StaffinnPartnerTrainingCenters';
import StaffinnPartnerInfrastructure from './staffinnPartner/StaffinnPartnerInfrastructure';
import StaffinnPartnerFacultyList from './staffinnPartner/StaffinnPartnerFacultyList';
import StaffinnPartnerStudents from './staffinnPartner/StaffinnPartnerStudents';
import Issues from './Issues';
import Notifications from './Notifications';
import GovernmentSchemes from './GovernmentSchemes';
import RegistrationRequests from './RegistrationRequests';
import ManualRegistration from './ManualRegistration';
import MisRequests from './MisRequests';
import HeroImages from './HeroImages';
import Chats from './Chats';
import adminAPI from '../services/adminApi';
import './AdminPanel.css';

const AdminPanel = ({ adminData, onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeSubSection, setActiveSubSection] = useState('');
  const [activeStaffinnPartnerSection, setActiveStaffinnPartnerSection] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Define allowed sections based on role
  const getAllowedSections = (role) => {
    console.log('Admin role:', role); // Debug log
    if (role === 'staff') {
      return ['dashboard', 'staff', 'notifications', 'issues', 'government-schemes', 'chats'];
    }
    if (role === 'recruiter') {
      return ['dashboard', 'recruiter', 'notifications', 'issues', 'government-schemes', 'registration-requests', 'manual-registration'];
    }
    if (role === 'institute') {
      return ['dashboard', 'institute', 'notifications', 'issues', 'government-schemes', 'registration-requests', 'manual-registration', 'mis-requests'];
    }
    // Admin/Master admin has access to all sections (including admin, master-admin, or any other admin role)
    return ['dashboard', 'staff', 'institute', 'recruiter', 'staffinn-partner-mis', 'notifications', 'issues', 'government-schemes', 'registration-requests', 'manual-registration', 'mis-requests', 'hero-images', 'chats'];
  };
  
  const allowedSections = getAllowedSections(adminData?.role);
  console.log('Allowed sections:', allowedSections); // Debug log
  
  const isSectionAllowed = (section) => {
    // Always allow staffinn-partner-mis for admin roles
    if (section === 'staffinn-partner-mis' && (adminData?.role === 'admin' || adminData?.role === 'master-admin' || !adminData?.role || adminData?.role === 'Admin')) {
      return true;
    }
    const allowed = allowedSections.includes(section);
    console.log(`Section ${section} allowed:`, allowed, 'Role:', adminData?.role); // Debug log
    return allowed;
  };

  const handleLogout = () => {
    adminAPI.logout();
    localStorage.removeItem('adminData');
    onLogout();
  };

  const renderContent = () => {
    if (activeSection === 'dashboard') {
      return <Dashboard />;
    }
    
    if (activeSection === 'staff') {
      switch (activeSubSection) {
        case 'dashboard':
          return <StaffDashboard />;
        case 'users':
          return <StaffUsers />;
        default:
          return <StaffDashboard />;
      }
    }
    
    if (activeSection === 'recruiter') {
      switch (activeSubSection) {
        case 'dashboard':
          return <RecruiterDashboard />;
        case 'users':
          return <RecruiterUsers />;
        case 'institutes':
          return <RecruiterInstitutesSection />;
        case 'jobs':
          return <RecruiterJobsSection />;
        case 'hiring':
          return <RecruiterHiringSection />;
        default:
          return <RecruiterDashboard />;
      }
    }
    
    if (activeSection === 'institute') {
      switch (activeSubSection) {
        case 'dashboard':
          return <InstituteDashboard />;
        case 'users':
          return <InstituteUsers />;
        case 'students':
          return <InstituteStudents />;
        case 'courses':
          return <InstituteCourses />;
        default:
          return <InstituteDashboard />;
      }
    }
    
    if (activeSection === 'staffinn-partner-mis') {
      switch (activeSubSection) {
        case 'users':
          return <StaffinnPartnerUsers />;
        case 'dashboard':
          return <StaffinnPartnerDashboard />;
        case 'training-centers':
          return <StaffinnPartnerTrainingCenters />;
        case 'training-infrastructure':
          return <StaffinnPartnerInfrastructure section="infrastructure" />;
        case 'courses':
          return <StaffinnPartnerInfrastructure section="courses" />;
        case 'faculty':
          return <StaffinnPartnerFacultyList />;
        case 'students':
          return <StaffinnPartnerStudents />;
        default:
          return <StaffinnPartnerUsers />;
      }
    }
    
    if (activeSection === 'notifications') {
      return <Notifications />;
    }
    
    if (activeSection === 'issues') {
      return <Issues />;
    }
    
    if (activeSection === 'government-schemes') {
      return <GovernmentSchemes />;
    }
    
    if (activeSection === 'registration-requests') {
      return <RegistrationRequests />;
    }
    
    if (activeSection === 'manual-registration') {
      return <ManualRegistration />;
    }
    
    if (activeSection === 'mis-requests') {
      return <MisRequests />;
    }
    
    if (activeSection === 'hero-images') {
      return <HeroImages />;
    }
    
    if (activeSection === 'chats') {
      return <Chats />;
    }
    
    return (
      <div className="coming-soon">
        <h2>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Section</h2>
        <p>This section is coming soon...</p>
      </div>
    );
  };

  return (
    <div className="admin-panel">
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="admin-info">
            <div className="admin-avatar">
              {adminData.adminId.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="admin-details">
                <h3>{adminData.adminId}</h3>
                <p>{adminData.role === 'staff' ? 'Staff Admin' : adminData.role === 'recruiter' ? 'Recruiter Admin' : adminData.role === 'institute' ? 'Institute Admin' : 'Admin'}</p>
              </div>
            )}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {/* Dashboard Section */}
          <div className="nav-section">
            <button
              className={`nav-section-btn ${activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('dashboard');
                setActiveSubSection('');
              }}
            >
              <i className="fas fa-chart-pie"></i>
              {!sidebarCollapsed && <span>Dashboard</span>}
            </button>
          </div>

          {/* Staff Section */}
          {isSectionAllowed('staff') && (
          <div className="nav-section">
            <button
              className={`nav-section-btn ${activeSection === 'staff' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('staff');
                setActiveSubSection('dashboard');
              }}
            >
              <i className="fas fa-users"></i>
              {!sidebarCollapsed && <span>Staff</span>}
            </button>
            
            {activeSection === 'staff' && !sidebarCollapsed && (
              <div className="nav-subsection">
                <button
                  className={`nav-item ${activeSubSection === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('dashboard')}
                >
                  <i className="fas fa-chart-bar"></i>
                  Dashboard
                </button>
                <button
                  className={`nav-item ${activeSubSection === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('users')}
                >
                  <i className="fas fa-user-friends"></i>
                  Users
                </button>
              </div>
            )}
          </div>
          )}

          {/* Institute Section */}
          {isSectionAllowed('institute') && (
            <div className="nav-section">
              <button
                className={`nav-section-btn ${activeSection === 'institute' ? 'active' : ''}`}
                onClick={() => {
                  setActiveSection('institute');
                  setActiveSubSection('dashboard');
                }}
              >
                <i className="fas fa-university"></i>
                {!sidebarCollapsed && <span>Institute</span>}
              </button>
            
            {activeSection === 'institute' && !sidebarCollapsed && (
              <div className="nav-subsection">
                <button
                  className={`nav-item ${activeSubSection === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('dashboard')}
                >
                  <i className="fas fa-chart-bar"></i>
                  Dashboard
                </button>
                <button
                  className={`nav-item ${activeSubSection === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('users')}
                >
                  <i className="fas fa-building"></i>
                  Users
                </button>
                <button
                  className={`nav-item ${activeSubSection === 'students' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('students')}
                >
                  <i className="fas fa-user-graduate"></i>
                  Students
                </button>
                <button
                  className={`nav-item ${activeSubSection === 'courses' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('courses')}
                >
                  <i className="fas fa-book"></i>
                  Courses
                </button>
              </div>
            )}
            </div>
          )}

          {/* Recruiter Section */}
          {isSectionAllowed('recruiter') && (
          <div className="nav-section">
            <button
              className={`nav-section-btn ${activeSection === 'recruiter' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('recruiter');
                setActiveSubSection('dashboard');
              }}
            >
              <i className="fas fa-briefcase"></i>
              {!sidebarCollapsed && <span>Recruiter</span>}
            </button>
            
            {activeSection === 'recruiter' && !sidebarCollapsed && (
              <div className="nav-subsection">
                <button
                  className={`nav-item ${activeSubSection === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('dashboard')}
                >
                  <i className="fas fa-chart-bar"></i>
                  Dashboard
                </button>
                <button
                  className={`nav-item ${activeSubSection === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('users')}
                >
                  <i className="fas fa-user-tie"></i>
                  Users
                </button>
                <button
                  className={`nav-item ${activeSubSection === 'institutes' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('institutes')}
                >
                  <i className="fas fa-university"></i>
                  Institutes
                </button>
                <button
                  className={`nav-item ${activeSubSection === 'jobs' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('jobs')}
                >
                  <i className="fas fa-briefcase"></i>
                  Jobs Posted
                </button>
                <button
                  className={`nav-item ${activeSubSection === 'hiring' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('hiring')}
                >
                  <i className="fas fa-user-check"></i>
                  Hiring History
                </button>
              </div>
            )}
          </div>
          )}

          {/* Staffinn Partner MIS Section */}
          {isSectionAllowed('staffinn-partner-mis') && (
            <div className="nav-section">
              <button
                className={`nav-section-btn ${activeSection === 'staffinn-partner-mis' ? 'active' : ''}`}
                onClick={() => {
                  setActiveSection('staffinn-partner-mis');
                  setActiveSubSection('users');
                }}
              >
                <i className="fas fa-handshake"></i>
                {!sidebarCollapsed && <span>Staffinn Partner MIS</span>}
              </button>
            
            {activeSection === 'staffinn-partner-mis' && !sidebarCollapsed && (
              <div className="nav-subsection">
                <button
                  className={`nav-item ${activeSubSection === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('users')}
                >
                  <i className="fas fa-users"></i>
                  Users
                </button>
                <button
                  className={`nav-item ${activeSubSection === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('dashboard')}
                >
                  <i className="fas fa-chart-bar"></i>
                  Dashboard
                </button>
                <button
                  className={`nav-item ${activeSubSection === 'training-centers' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('training-centers')}
                >
                  <i className="fas fa-building"></i>
                  Training Centers
                </button>
                <button
                  className={`nav-item ${activeSubSection === 'training-infrastructure' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('training-infrastructure')}
                >
                  <i className="fas fa-tools"></i>
                  Training Infrastructure
                </button>
                <button
                  className={`nav-item ${activeSubSection === 'courses' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('courses')}
                >
                  <i className="fas fa-book"></i>
                  Courses
                </button>
                <button
                  className={`nav-item ${activeSubSection === 'faculty' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('faculty')}
                >
                  <i className="fas fa-chalkboard-teacher"></i>
                  Faculty
                </button>
                <button
                  className={`nav-item ${activeSubSection === 'students' ? 'active' : ''}`}
                  onClick={() => setActiveSubSection('students')}
                >
                  <i className="fas fa-user-graduate"></i>
                  Students
                </button>
              </div>
            )}
            </div>
          )}

          {/* Notifications Section */}
          <div className="nav-section">
            <button
              className={`nav-section-btn ${activeSection === 'notifications' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('notifications');
                setActiveSubSection('');
              }}
            >
              <i className="fas fa-bell"></i>
              {!sidebarCollapsed && <span>Notifications</span>}
            </button>
          </div>

          {/* Issues Section */}
          <div className="nav-section">
            <button
              className={`nav-section-btn ${activeSection === 'issues' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('issues');
                setActiveSubSection('');
              }}
            >
              <i className="fas fa-exclamation-triangle"></i>
              {!sidebarCollapsed && <span>Issues</span>}
            </button>
          </div>

          {/* Government Schemes Section */}
          <div className="nav-section">
            <button
              className={`nav-section-btn ${activeSection === 'government-schemes' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('government-schemes');
                setActiveSubSection('');
              }}
            >
              <i className="fas fa-university"></i>
              {!sidebarCollapsed && <span>Government Schemes</span>}
            </button>
          </div>

          {/* Registration Requests Section */}
          {isSectionAllowed('registration-requests') && (
          <div className="nav-section">
            <button
              className={`nav-section-btn ${activeSection === 'registration-requests' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('registration-requests');
                setActiveSubSection('');
              }}
            >
              <i className="fas fa-user-plus"></i>
              {!sidebarCollapsed && <span>Registration Requests</span>}
            </button>
          </div>
          )}

          {/* Manual Registration Section */}
          {isSectionAllowed('manual-registration') && (
          <div className="nav-section">
            <button
              className={`nav-section-btn ${activeSection === 'manual-registration' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('manual-registration');
                setActiveSubSection('');
              }}
            >
              <i className="fas fa-user-cog"></i>
              {!sidebarCollapsed && <span>Manual Registration</span>}
            </button>
          </div>
          )}

          {/* MIS Requests Section */}
          {isSectionAllowed('mis-requests') && (
          <div className="nav-section">
            <button
              className={`nav-section-btn ${activeSection === 'mis-requests' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('mis-requests');
                setActiveSubSection('');
              }}
            >
              <i className="fas fa-file-contract"></i>
              {!sidebarCollapsed && <span>MIS Requests</span>}
            </button>
          </div>
          )}

          {/* Hero Images Section */}
          {isSectionAllowed('hero-images') && (
          <div className="nav-section">
            <button
              className={`nav-section-btn ${activeSection === 'hero-images' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('hero-images');
                setActiveSubSection('');
              }}
            >
              <i className="fas fa-images"></i>
              {!sidebarCollapsed && <span>Hero Images</span>}
            </button>
          </div>
          )}

          {/* Chats Section */}
          {isSectionAllowed('chats') && (
          <div className="nav-section">
            <button
              className={`nav-section-btn ${activeSection === 'chats' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('chats');
                setActiveSubSection('');
              }}
            >
              <i className="fas fa-comments"></i>
              {!sidebarCollapsed && <span>Chats</span>}
            </button>
          </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <div className="main-header">
          <div className="breadcrumb">
            <span className="breadcrumb-item">{activeSection === 'staffinn-partner-mis' ? 'Staffinn Partner MIS' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</span>
            {activeSubSection && (
              <>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-item active">{activeSubSection.charAt(0).toUpperCase() + activeSubSection.slice(1)}</span>
              </>
            )}
          </div>
          <div className="header-actions">
            <div className="current-time">
              {new Date().toLocaleString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>

        <div className="main-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;