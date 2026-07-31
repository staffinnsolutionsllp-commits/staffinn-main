/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiStar, FiMapPin, FiClock, FiPackage, FiCheck, FiMessageSquare, FiExternalLink } from 'react-icons/fi';
import * as serviceApi from '../../services/serviceApi';
import './services.css';

const ServiceDetailPage = () => {
  const { serviceSlug } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPkg, setSelectedPkg] = useState(0);

  useEffect(() => {
    if (!serviceSlug) return;
    const fetch = async () => {
      try {
        const res = await serviceApi.getServiceDetail(serviceSlug);
        if (res.success) setService(res.data);
        else setError('Service not found');
      } catch (err) { setError(err.message || 'Failed to load service'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [serviceSlug]);

  if (loading) {
    return (
      <div className="sv-detail-page">
        <div className="sv-detail-container">
          <div className="pf-skeleton" style={{ height: 300, marginBottom: 24 }} />
          <div className="pf-skeleton" style={{ height: 40, width: 300, marginBottom: 12 }} />
          <div className="pf-skeleton" style={{ height: 200 }} />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="sv-detail-page">
        <div className="sv-detail-container" style={{ textAlign: 'center', padding: '80px 24px' }}>
          <h2>Service Not Found</h2>
          <p style={{ color: 'var(--pf-text-muted)', marginTop: 8 }}>{error || 'This service is unavailable.'}</p>
          <button className="pf-btn pf-btn-primary" onClick={() => navigate(-1)} style={{ marginTop: 20 }}>Go Back</button>
        </div>
      </div>
    );
  }

  const packages = service.packages || [];
  const faqs = service.faqs || [];
  const currentPkg = packages[selectedPkg];
  const priceDisplay = (price) => price ? `₹${Number(price).toLocaleString('en-IN')}` : 'Custom Quote';

  return (
    <div className="sv-detail-page">
      <div className="sv-detail-container">
        {/* Back */}
        <button className="pf-btn pf-btn-ghost pf-btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
          <FiArrowLeft size={14} /> Back
        </button>

        <div className="sv-detail-layout">
          {/* Main Content */}
          <div className="sv-detail-main">
            {/* Hero */}
            {service.coverMediaUrl && (
              <div className="sv-detail-cover">
                <img src={service.coverMediaUrl} alt={service.title} />
              </div>
            )}

            <h1 className="sv-detail-title">{service.title}</h1>

            <div className="sv-detail-meta-row">
              {service.category && <span className="sv-public-card-category">{service.category}</span>}
              {service.workMode && <span className="sv-public-card-mode"><FiMapPin size={12} /> {service.workMode.replace('_', '-')}</span>}
              {service.rating > 0 && <span className="sv-public-card-rating"><FiStar size={12} className="star" /> {Number(service.rating).toFixed(1)} ({service.reviewCount || 0})</span>}
            </div>

            {/* Description */}
            {service.detailedDescription && (
              <section className="sv-detail-section">
                <h2>About This Service</h2>
                <p className="sv-detail-description">{service.detailedDescription}</p>
              </section>
            )}

            {/* Package Comparison */}
            {packages.length > 1 && (
              <section className="sv-detail-section">
                <h2>Compare Packages</h2>
                <div className="sv-compare-table-wrap">
                  <table className="sv-compare-table">
                    <thead>
                      <tr>
                        <th>Feature</th>
                        {packages.map((pkg, i) => (
                          <th key={i} className={pkg.recommended ? 'recommended' : ''}>{pkg.displayName || pkg.key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Price</td>
                        {packages.map((pkg, i) => <td key={i}><strong>{priceDisplay(pkg.price)}</strong></td>)}
                      </tr>
                      <tr>
                        <td>Delivery</td>
                        {packages.map((pkg, i) => <td key={i}>{pkg.deliveryValue} {pkg.deliveryUnit || 'days'}</td>)}
                      </tr>
                      <tr>
                        <td>Revisions</td>
                        {packages.map((pkg, i) => <td key={i}>{pkg.unlimitedRevisions ? 'Unlimited' : (pkg.revisions || '0')}</td>)}
                      </tr>
                      {/* Dynamic features from first package that has features */}
                      {(packages[0]?.features || []).map((f, fi) => (
                        <tr key={fi}>
                          <td>{f.label || `Feature ${fi + 1}`}</td>
                          {packages.map((pkg, pi) => {
                            const feat = (pkg.features || [])[fi];
                            if (!feat) return <td key={pi}>—</td>;
                            if (feat.included === false) return <td key={pi} style={{ color: 'var(--pf-text-muted)' }}>✗</td>;
                            return <td key={pi}>{feat.value || '✓'}</td>;
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
              <section className="sv-detail-section">
                <h2>Frequently Asked Questions</h2>
                <div className="sv-detail-faqs">
                  {faqs.map((faq, i) => <FAQItem key={i} faq={faq} />)}
                </div>
              </section>
            )}
          </div>

          {/* Pricing Sidebar */}
          <aside className="sv-detail-sidebar">
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

              {/* Selected Package / Pricing Info */}
              {currentPkg ? (
                <div className="sv-pricing-content">
                  <div className="sv-pricing-price">{priceDisplay(currentPkg.price)}</div>
                  {currentPkg.title && <h4 className="sv-pricing-pkg-title">{currentPkg.title}</h4>}
                  {currentPkg.description && <p className="sv-pricing-pkg-desc">{currentPkg.description}</p>}
                  <div className="sv-pricing-details">
                    <span><FiClock size={13} /> {currentPkg.deliveryValue || '—'} {currentPkg.deliveryUnit || 'days'} delivery</span>
                    <span>✎ {currentPkg.unlimitedRevisions ? 'Unlimited' : (currentPkg.revisions || '0')} revisions</span>
                  </div>
                  {(currentPkg.features || []).filter(f => f.included !== false).length > 0 && (
                    <div className="sv-pricing-features">
                      {currentPkg.features.filter(f => f.included !== false).map((f, i) => (
                        <div key={i} className="sv-pricing-feature"><FiCheck size={12} /> {f.label}{f.value ? `: ${f.value}` : ''}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="sv-pricing-content">
                  <div className="sv-pricing-price">{priceDisplay(service.startingPrice)}</div>
                  {service.deliveryTime && <div className="sv-pricing-details"><span><FiClock size={13} /> {service.deliveryTime} {service.deliveryUnit || 'days'} delivery</span></div>}
                </div>
              )}

              {/* CTA */}
              <div className="sv-pricing-cta">
                <button className="pf-btn pf-btn-primary pf-btn-full pf-btn-lg">
                  <FiMessageSquare size={15} /> Contact Staff
                </button>
                {service.customQuoteEnabled && (
                  <button className="pf-btn pf-btn-secondary pf-btn-full" style={{ marginTop: 8 }}>
                    Request Custom Quote
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const FAQItem = ({ faq }) => {
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

export default ServiceDetailPage;
