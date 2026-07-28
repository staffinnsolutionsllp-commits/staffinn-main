/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import PortfolioDashboard from './PortfolioDashboard';
import ProjectEditor from './ProjectEditor';

/**
 * Portfolio Container: manages internal navigation between
 * dashboard, create, and edit views within the StaffDashboard tab.
 */
const PortfolioContainer = () => {
  const [view, setView] = useState({ page: 'dashboard', projectId: null });

  const handleNavigate = (page, projectId = null) => {
    setView({ page, projectId });
    // Scroll to top of content area
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  switch (view.page) {
    case 'create':
      return <ProjectEditor projectId={null} onNavigate={handleNavigate} />;
    case 'edit':
      return <ProjectEditor projectId={view.projectId} onNavigate={handleNavigate} />;
    default:
      return <PortfolioDashboard onNavigate={handleNavigate} />;
  }
};

export default PortfolioContainer;
