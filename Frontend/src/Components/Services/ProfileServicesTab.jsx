/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { FiPackage, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './services.css';

const ProfileServicesTab = ({ profileSlug, profile, isOwner }) => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch services from backend when Phase 2F is complete
    // For now, show empty state
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [profileSlug]);

  if (loading) {
    return (
      <div className="sv-tab-loading">
        <div className="pf-skeleton" style={{ height: 180, marginBottom: 16 }} />
        <div className="pf-skeleton" style={{ height: 180 }} />
      </div>
    );
  }

  if (services.length === 0) {
    if (isOwner) {
      return (
        <div className="sv-empty-state">
          <div className="sv-empty-icon"><FiPackage /></div>
          <h3>Create your first service</h3>
          <p>Define what you offer — pricing, packages, and delivery details — so clients can discover and hire you directly.</p>
          <button className="pf-btn pf-btn-primary" onClick={() => navigate('/dashboard/staff?tab=services')}>
            <FiPlus /> Add Service
          </button>
        </div>
      );
    }
    return null; // Hide section for non-owners when no services exist
  }

  return (
    <div className="sv-tab">
      <div className="sv-tab-header">
        <span className="sv-tab-count">{services.length} service{services.length !== 1 ? 's' : ''} available</span>
        {isOwner && (
          <button className="pf-btn pf-btn-secondary pf-btn-sm" onClick={() => navigate('/dashboard/staff?tab=services')}>
            Manage Services
          </button>
        )}
      </div>
      {/* Service cards will be rendered here when backend is ready */}
      <div className="sv-grid">
        {services.map(service => (
          <div key={service.serviceId} className="sv-card">
            {/* Placeholder for future ServiceCard component */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileServicesTab;
