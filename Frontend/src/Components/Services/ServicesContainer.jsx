/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import ServicesDashboard from './ServicesDashboard';
import ServiceBuilder from './ServiceBuilder';

/**
 * Services Container: manages internal navigation between
 * dashboard, create, and edit views within the StaffDashboard tab.
 */
const ServicesContainer = () => {
  const [view, setView] = useState({ page: 'dashboard', serviceId: null });

  const handleNavigate = (page, serviceId = null) => {
    setView({ page, serviceId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  switch (view.page) {
    case 'create':
      return <ServiceBuilder serviceId={null} onNavigate={handleNavigate} />;
    case 'edit':
      return <ServiceBuilder serviceId={view.serviceId} onNavigate={handleNavigate} />;
    default:
      return <ServicesDashboard onNavigate={handleNavigate} />;
  }
};

export default ServicesContainer;
