/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { FiPackage, FiPlus, FiClock, FiCheck, FiChevronDown, FiChevronUp, FiMapPin, FiStar, FiMessageSquare, FiImage } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import * as serviceApi from '../../services/serviceApi';
import * as portfolioApi from '../../services/portfolioApi';
import './services.css';

const ProfileServicesTab = ({ profileSlug, profile, isOwner }) => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceDetail, setServiceDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [portfolioProjects, setPortfolioProjects] = useState([]);

  useEffect(() => {
    if (!profileSlug) return;
    const fetchServices = async () => {
      try {
        const res = await serviceApi.getProfileServices(profileSlug);
        if (res.success && res.data.services?.length > 0) {
          setServices(res.data.services);
          // Auto-select first service
          loadServiceDetail(res.data.services[0].slug);
          setSelectedService(res.data.services[0].slug);
        }
      } catch { setError(true); }
      finally { setLoading(false); }
    };
    fetchServices();
    // Load portfolio
    const fetchPortfolio = async () => {
      try {
        const res = await portfolioApi.getProfileProjects(profileSlug);
        if (res.success) setPortfolioProjects(res.data.projects || []);
      } catch {}
    };
    fetchPortfolio();
  }, [profileSlug]);

  const loadServiceDetail = async (slug) => {
    setDetailLoading(true);
    try {
      const res = await serviceApi.getServiceDetail(slug);
      if (res.success) setServiceDetail(res.data);
    } catch { setServiceDetail(null); }
    finally { setDetailLoading(false); }
  };

  const handleServiceSelect = (slug) => {
    setSelectedService(slug);
    loadServiceDetail(slug);
  };

  if (loading) {
    return (<div className="sv-tab-loading"><div className="pf-skeleton" style={{ height: 40, marginBottom: 16 }} /><div className="pf-skeleton" style={{ height: 400 }} /></div>);
  }

  if (error || services.length === 0) {
    if (isOwner) {
      return (
        <div className="sv-empty-state">
          <div className="sv-empty-icon"><FiPackage /></div>
          <h3>Create your first service</h3>
          <p>Define what you offer — pricing, packages, and delivery details — so clients can discover and hire you directly.</p>
          <button className="pf-btn pf-btn-primary" onClick={() => navigate('/dashboard/staff?tab=services')}><FiPlus /> Add Service</button>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="sv-profile-tab">
      {/* Service Selector Buttons */}
      <div className="sv-service-selector">
        {services.map(s => (
          <button key={s.slug} className={`sv-service-btn ${selectedService === s.slug ? 'active' : ''}`} onClick={() => handleServiceSelect(s.slug)}>
            {s.title}
          </button>
        ))}
        {isOwner && (
          <button className="sv-service-btn sv-service-btn-manage" onClick={() => navigate('/dashboard/staff?tab=services')}>
            Manage Services
          </button>
        )}
      </div>

      {/* Service Detail Inline */}
      {detailLoading && <div className="pf-skeleton" style={{ height: 500, marginTop: 20 }} />}
      {!detailLoading && serviceDetail && (
        <ServiceInlineDetail service={serviceDetail} profile={profile} portfolioProjects={portfolioProjects} />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SERVICE INLINE DETAIL (Fiverr-style 2-column layout)
// ═══════════════════════════════════════════════════════════════════════

const ServiceInlineDetail = ({ service, profile, portfolioProjects }) => {
  const [selectedPkg, setSelectedPkg] = useState(0);
  const [showIncluded, setShowIncluded] = useState(false);
  const packages = service.packages || [];
  const faqs = service.faqs || [];
  const currentPkg = packages[selectedPkg];
  const priceDisplay = (p) => p ? `₹${Number(p).toLocaleString('en-IN')}` : 'Custom Quote';

  return (
    <div className="sv-inline-detail">
      {/* LEFT: Main Content */}
      <div className="sv-inline-main">
        {/* Title & Seller Info */}
        <h2 className="sv-inline-title">{service.title}</h2>
        <div className="sv-inline-seller">
          {profile?.profilePhoto ? (
            <img src={profile.profilePhoto} alt={profile.fullName} className="sv-inline-seller-img" />
          ) : (
            <div className="sv-inline-seller-avatar">{(profile?.fullName || 'S').charAt(0)}</div>
          )}
          <span className="sv-inline-seller-name">{profile?.fullName}</span>
          {service.rating > 0 && <span className="sv-inline-rating"><FiStar size={13} className="star" /> {Number(service.rating).toFixed(1)} ({service.reviewCount || 0} reviews)</span>}
        </div>

        {/* Cover Image */}
        {service.coverMediaUrl && (
          <div className="sv-inline-cover">
            <img src={service.coverMediaUrl} alt={service.title} />
          </div>
        )}

        {/* Gallery */}
        {service.galleryMediaUrls?.length > 0 && (
          <div className="sv-inline-gallery">
            {service.galleryMediaUrls.map((url, i) => (
              <img key={i} src={url} alt={`Gallery ${i+1}`} className="sv-inline-gallery-img" />
            ))}
          </div>
        )}

        {/* About This Service */}
        {service.detailedDescription && (
          <section className="sv-inline-section">
            <h3>About this service</h3>
            <p className="sv-inline-desc">{service.detailedDescription}</p>
          </section>
        )}

        {/* Service Info Grid */}
        <section className="sv-inline-section">
          <div className="sv-inline-info-grid">
            {service.category && <div className="sv-inline-info-item"><span className="sv-inline-info-label">Category</span><span className="sv-inline-info-value">{service.category}</span></div>}
            {service.workMode && <div className="sv-inline-info-item"><span className="sv-inline-info-label">Work Mode</span><span className="sv-inline-info-value">{service.workMode.replace('_', ' ')}</span></div>}
            {service.deliveryTime && <div className="sv-inline-info-item"><span className="sv-inline-info-label">Delivery Time</span><span className="sv-inline-info-value">{service.deliveryTime} {service.deliveryUnit || 'days'}</span></div>}
            {service.location && <div className="sv-inline-info-item"><span className="sv-inline-info-label">Location</span><span className="sv-inline-info-value">{service.location}</span></div>}
          </div>
        </section>

        {/* Portfolio Section */}
        {portfolioProjects.length > 0 && (
          <section className="sv-inline-section">
            <h3>My Portfolio</h3>
            <div className="sv-inline-portfolio">
              {portfolioProjects.slice(0, 4).map(proj => (
                <div key={proj.projectId} className="sv-inline-portfolio-card">
                  <div className="sv-inline-portfolio-img">
                    {proj.coverImageUrl ? <img src={proj.coverImageUrl} alt={proj.title} /> : <FiImage size={20} color="var(--pf-text-muted)" />}
                  </div>
                  <div className="sv-inline-portfolio-info">
                    <h4>{proj.title}</h4>
                    <p>{proj.shortDescription || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Compare Packages Table */}
        {packages.length > 1 && (
          <section className="sv-inline-section">
            <h3>Compare packages</h3>
            <div className="sv-compare-table-wrap">
              <table className="sv-compare-table">
                <thead>
                  <tr>
                    <th>Package</th>
                    {packages.map((pkg, i) => (
                      <th key={i}>
                        <div className="sv-compare-pkg-price">{priceDisplay(pkg.price)}</div>
                        <div className="sv-compare-pkg-name">{pkg.displayName || pkg.key}</div>
                        <div className="sv-compare-pkg-title">{pkg.title || ''}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Description</td>{packages.map((pkg, i) => <td key={i} className="sv-compare-desc">{pkg.description || '—'}</td>)}</tr>
                  <tr><td>Delivery</td>{packages.map((pkg, i) => <td key={i}>{pkg.deliveryValue || '—'} {pkg.deliveryUnit || 'days'}</td>)}</tr>
                  <tr><td>Revisions</td>{packages.map((pkg, i) => <td key={i}>{pkg.unlimitedRevisions ? 'Unlimited' : (pkg.revisions || '0')}</td>)}</tr>
                  {/* Dynamic features */}
                  {(packages[0]?.features || []).map((f, fi) => (
                    <tr key={fi}>
                      <td>{f.label || `Feature ${fi+1}`}</td>
                      {packages.map((pkg, pi) => {
                        const feat = (pkg.features || [])[fi];
                        if (!feat) return <td key={pi}>—</td>;
                        if (feat.included === false) return <td key={pi} className="sv-compare-no">✗</td>;
                        return <td key={pi} className="sv-compare-yes">{feat.value || '✓'}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <section className="sv-inline-section">
            <h3>FAQ</h3>
            <div className="sv-inline-faqs">
              {faqs.map((faq, i) => <FAQAccordion key={i} faq={faq} />)}
            </div>
          </section>
        )}
      </div>

      {/* RIGHT: Sticky Pricing Panel */}
      <aside className="sv-inline-sidebar">
        <div className="sv-pricing-panel">
          {/* Package Tabs */}
          {packages.length > 1 && (
            <div className="sv-pricing-tabs">
              {packages.map((pkg, i) => (
                <button key={i} className={`sv-pricing-tab ${i === selectedPkg ? 'active' : ''}`} onClick={() => setSelectedPkg(i)}>
                  {pkg.displayName || pkg.key}
                </button>
              ))}
            </div>
          )}

          {/* Pricing Content */}
          <div className="sv-pricing-content">
            {currentPkg ? (
              <>
                <div className="sv-pricing-pkg-header">
                  <span className="sv-pricing-pkg-name">{currentPkg.title || currentPkg.displayName}</span>
                </div>
                <div className="sv-pricing-price">{priceDisplay(currentPkg.price)}</div>
                {currentPkg.description && <p className="sv-pricing-pkg-desc">{currentPkg.description}</p>}
                <div className="sv-pricing-details">
                  <span><FiClock size={13} /> {currentPkg.deliveryValue || '—'}-day delivery</span>
                  <span>✎ {currentPkg.unlimitedRevisions ? 'Unlimited' : (currentPkg.revisions || '0')} Revisions</span>
                </div>

                {/* What's Included */}
                {(currentPkg.features || []).length > 0 && (
                  <div className="sv-pricing-included">
                    <button className="sv-pricing-included-toggle" onClick={() => setShowIncluded(!showIncluded)}>
                      What's Included {showIncluded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                    </button>
                    {showIncluded && (
                      <div className="sv-pricing-included-list">
                        {currentPkg.features.filter(f => f.included !== false).map((f, i) => (
                          <div key={i} className="sv-pricing-feature"><FiCheck size={12} /> {f.label}{f.value ? `: ${f.value}` : ''}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="sv-pricing-price">{priceDisplay(service.startingPrice)}</div>
                {service.deliveryTime && <div className="sv-pricing-details"><span><FiClock size={13} /> {service.deliveryTime} {service.deliveryUnit} delivery</span></div>}
              </>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="sv-pricing-cta">
            <button className="pf-btn pf-btn-primary pf-btn-full pf-btn-lg sv-continue-btn">
              Continue <span>→</span>
            </button>
            <button className="pf-btn pf-btn-secondary pf-btn-full sv-contact-btn">
              <FiMessageSquare size={14} /> Contact me
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

// FAQ Accordion
const FAQAccordion = ({ faq }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`sv-faq-accordion ${open ? 'open' : ''}`}>
      <button className="sv-faq-accordion-trigger" onClick={() => setOpen(!open)} aria-expanded={open}>
        {faq.question}
        <span>{open ? '−' : '+'}</span>
      </button>
      {open && <div className="sv-faq-accordion-content">{faq.answer}</div>}
    </div>
  );
};

export default ProfileServicesTab;
