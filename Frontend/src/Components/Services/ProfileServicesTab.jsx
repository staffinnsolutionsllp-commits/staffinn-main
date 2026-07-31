/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { FiPackage, FiPlus, FiMapPin, FiClock, FiStar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import * as serviceApi from '../../services/serviceApi';
import './services.css';

const ProfileServicesTab = ({ profileSlug, profile, isOwner }) => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!profileSlug) return;
    const fetchServices = async () => {
      try {
        const res = await serviceApi.getProfileServices(profileSlug);
        if (res.success) setServices(res.data.services || []);
      } catch { setError(true); }
      finally { setLoading(false); }
    };
    fetchServices();
  }, [profileSlug]);

  if (loading) {
    return (
      <div className="sv-tab-loading">
        <div className="pf-skeleton" style={{ height: 200, marginBottom: 16 }} />
        <div className="pf-skeleton" style={{ height: 200 }} />
      </div>
    );
  }

  if (error) return null;

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
    return null;
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
      <div className="sv-public-grid">
        {services.map(service => (
          <PublicServiceCard key={service.serviceId} service={service} staffName={profile?.fullName} />
        ))}
      </div>
    </div>
  );
};

const PublicServiceCard = ({ service, staffName }) => {
  const priceDisplay = service.startingPrice
    ? `₹${Number(service.startingPrice).toLocaleString('en-IN')}`
    : 'Custom Quote';
  const unitLabels = { fixed: '', hourly: '/hr', daily: '/day', per_visit: '/visit', per_session: '/session', monthly: '/mo', per_item: '/item', tiered: '' };
  const unit = unitLabels[service.pricingMode] || '';

  return (
    <div className="sv-public-card">
      {/* Cover */}
      <div className="sv-public-card-cover">
        {service.coverMediaUrl ? (
          <img src={service.coverMediaUrl} alt={service.title} loading="lazy" />
        ) : (
          <div className="sv-public-card-cover-placeholder">
            <FiPackage size={28} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="sv-public-card-body">
        <h3 className="sv-public-card-title">{service.title}</h3>
        <p className="sv-public-card-desc">{service.shortDescription || ''}</p>

        {/* Meta */}
        <div className="sv-public-card-meta">
          {service.category && <span className="sv-public-card-category">{service.category}</span>}
          {service.workMode && (
            <span className="sv-public-card-mode">
              <FiMapPin size={11} /> {service.workMode.replace('_', '-')}
            </span>
          )}
          {service.deliveryTime && (
            <span className="sv-public-card-delivery">
              <FiClock size={11} /> {service.deliveryTime} {service.deliveryUnit || 'days'}
            </span>
          )}
        </div>

        {/* Rating */}
        {service.rating > 0 && (
          <div className="sv-public-card-rating">
            <FiStar size={12} className="star" /> {Number(service.rating).toFixed(1)}
            <span className="sv-public-card-reviews">({service.reviewCount || 0})</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sv-public-card-footer">
        <div className="sv-public-card-price">
          <span className="label">Starting at</span>
          {priceDisplay}{unit}
        </div>
      </div>
    </div>
  );
};

export default ProfileServicesTab;
