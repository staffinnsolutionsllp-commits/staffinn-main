/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { FiPackage, FiPlus, FiClock, FiCheck, FiChevronDown, FiChevronUp, FiMapPin, FiStar, FiMessageSquare, FiImage, FiX, FiChevronLeft, FiChevronRight, FiCalendar, FiLayers, FiExternalLink, FiGithub } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import * as serviceApi from '../../services/serviceApi';
import * as portfolioApi from '../../services/portfolioApi';
import ChatButton from '../Messages/ChatButton';
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
  const [projectModal, setProjectModal] = useState(null);

  useEffect(() => {
    if (!profileSlug) return;
    const fetchServices = async () => {
      try {
        const res = await serviceApi.getProfileServices(profileSlug);
        if (res.success && res.data.services?.length > 0) {
          setServices(res.data.services);
          loadServiceDetail(res.data.services[0].slug);
          setSelectedService(res.data.services[0].slug);
        }
      } catch { setError(true); }
      finally { setLoading(false); }
    };
    fetchServices();
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

  const handleServiceSelect = (slug) => { setSelectedService(slug); loadServiceDetail(slug); };

  if (loading) return (<div className="sv-tab-loading"><div className="pf-skeleton" style={{ height: 40, marginBottom: 16 }} /><div className="pf-skeleton" style={{ height: 500 }} /></div>);
  if (error || services.length === 0) {
    if (isOwner) return (<div className="sv-empty-state"><div className="sv-empty-icon"><FiPackage /></div><h3>Create your first service</h3><p>Define what you offer — pricing, packages, and delivery details — so clients can discover and hire you directly.</p><button className="pf-btn pf-btn-primary" onClick={() => navigate('/dashboard/staff?tab=services')}><FiPlus /> Add Service</button></div>);
    return null;
  }

  return (
    <div className="sv-profile-tab">
      {/* Service Selector */}
      <div className="sv-service-selector">
        {services.map(s => (<button key={s.slug} className={`sv-service-btn ${selectedService === s.slug ? 'active' : ''}`} onClick={() => handleServiceSelect(s.slug)}>{s.title}</button>))}
        {isOwner && <button className="sv-service-btn sv-service-btn-manage" onClick={() => navigate('/dashboard/staff?tab=services')}>Manage Services</button>}
      </div>
      {detailLoading && <div className="pf-skeleton" style={{ height: 500, marginTop: 20 }} />}
      {!detailLoading && serviceDetail && (
        <ServiceInlineDetail service={serviceDetail} profile={profile} portfolioProjects={serviceDetail.selectedProjects?.length > 0 ? portfolioProjects.filter(p => serviceDetail.selectedProjects.includes(p.projectId)) : portfolioProjects} onProjectClick={setProjectModal} />
      )}
      {/* Project Detail Modal */}
      {projectModal && <ProjectModal project={projectModal} projects={portfolioProjects} onClose={() => setProjectModal(null)} onNavigate={setProjectModal} staffName={profile?.fullName} staffAvatar={profile?.profilePhoto} />}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════════
// SERVICE INLINE DETAIL
// ═══════════════════════════════════════════════════════════════════════
const ServiceInlineDetail = ({ service, profile, portfolioProjects, onProjectClick }) => {
  const [selectedPkg, setSelectedPkg] = useState(0);
  const [showIncluded, setShowIncluded] = useState(false);
  const packages = service.packages || [];
  const faqs = service.faqs || [];
  const currentPkg = packages[selectedPkg];
  const priceDisplay = (p) => p ? `₹${Number(p).toLocaleString('en-IN')}` : 'Custom Quote';
  const [activeProject, setActiveProject] = useState(0);

  return (
    <div className="sv-inline-detail">
      {/* LEFT */}
      <div className="sv-inline-main">
        <h2 className="sv-inline-title">{service.title}</h2>
        <div className="sv-inline-seller">
          {profile?.profilePhoto ? <img src={profile.profilePhoto} alt={profile.fullName} className="sv-inline-seller-img" /> : <div className="sv-inline-seller-avatar">{(profile?.fullName || 'S').charAt(0)}</div>}
          <span className="sv-inline-seller-name">{profile?.fullName}</span>
          {service.rating > 0 && <span className="sv-inline-rating"><FiStar size={14} className="star" /> {Number(service.rating).toFixed(1)} ({service.reviewCount || 0} reviews)</span>}
        </div>

        {service.coverMediaUrl && <div className="sv-inline-cover"><img src={service.coverMediaUrl} alt={service.title} /></div>}

        {service.detailedDescription && (<section className="sv-inline-section"><h3>About this service</h3><p className="sv-inline-desc">{service.detailedDescription}</p></section>)}

        <section className="sv-inline-section">
          <div className="sv-inline-info-grid">
            {service.category && <div className="sv-inline-info-item"><span className="sv-inline-info-label">Category</span><span className="sv-inline-info-value">{service.category}</span></div>}
            {service.workMode && <div className="sv-inline-info-item"><span className="sv-inline-info-label">Work Mode</span><span className="sv-inline-info-value">{service.workMode.replace('_', ' ')}</span></div>}
            {service.deliveryTime && <div className="sv-inline-info-item"><span className="sv-inline-info-label">Delivery Time</span><span className="sv-inline-info-value">{service.deliveryTime} {service.deliveryUnit || 'days'}</span></div>}
            {service.location && <div className="sv-inline-info-item"><span className="sv-inline-info-label">Location</span><span className="sv-inline-info-value">{service.location}</span></div>}
          </div>
        </section>

        {/* MY PORTFOLIO — Fiverr-style horizontal showcase */}
        {portfolioProjects.length > 0 && (
          <section className="sv-inline-section">
            <h3>My Portfolio</h3>
            {/* Active Project (large horizontal card) */}
            <div className="sv-portfolio-showcase" onClick={() => onProjectClick(portfolioProjects[activeProject])}>
              <div className="sv-portfolio-showcase-img">
                {portfolioProjects[activeProject]?.coverImageUrl ? (
                  <img src={portfolioProjects[activeProject].coverImageUrl} alt={portfolioProjects[activeProject].title} />
                ) : <div className="sv-portfolio-showcase-placeholder"><FiImage size={36} /></div>}
                {portfolioProjects[activeProject]?.galleryCount > 0 && <div className="sv-portfolio-img-count"><FiLayers size={11} /> {(portfolioProjects[activeProject].galleryCount || 0) + 1}</div>}
              </div>
              <div className="sv-portfolio-showcase-content">
                {portfolioProjects[activeProject]?.startDate && <div className="sv-portfolio-date"><FiCalendar size={12} /> From: {new Date(portfolioProjects[activeProject].startDate + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>}
                <h4 className="sv-portfolio-showcase-title">{portfolioProjects[activeProject]?.title}</h4>
                <p className="sv-portfolio-showcase-desc">{portfolioProjects[activeProject]?.shortDescription || ''}</p>
                {portfolioProjects[activeProject]?.technologies?.length > 0 && (
                  <div className="sv-portfolio-tags">
                    {portfolioProjects[activeProject].technologies.slice(0, 3).map(t => <span key={t} className="sv-portfolio-tag">{t}</span>)}
                    {portfolioProjects[activeProject].technologies.length > 3 && <span className="sv-portfolio-tag-more">+{portfolioProjects[activeProject].technologies.length - 3}</span>}
                  </div>
                )}
              </div>
            </div>
            {/* Thumbnail navigation */}
            {portfolioProjects.length > 1 && (
              <div className="sv-portfolio-thumbs">
                {portfolioProjects.map((proj, i) => (
                  <div key={proj.projectId} className={`sv-portfolio-thumb ${i === activeProject ? 'active' : ''}`} onClick={() => setActiveProject(i)}>
                    {proj.coverImageUrl ? <img src={proj.coverImageUrl} alt={proj.title} /> : <FiImage size={14} />}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Compare Packages */}
        {packages.length > 1 && (
          <section className="sv-inline-section">
            <h3>Compare packages</h3>
            <div className="sv-compare-table-wrap"><table className="sv-compare-table"><thead><tr><th>Package</th>{packages.map((pkg, i) => (<th key={i}><div className="sv-compare-pkg-price">{priceDisplay(pkg.price)}</div><div className="sv-compare-pkg-name">{pkg.displayName || pkg.key}</div><div className="sv-compare-pkg-title">{pkg.title || ''}</div></th>))}</tr></thead><tbody><tr><td>Description</td>{packages.map((pkg, i) => <td key={i} className="sv-compare-desc">{pkg.description || '—'}</td>)}</tr><tr><td>Delivery</td>{packages.map((pkg, i) => <td key={i}>{pkg.deliveryValue || '—'} {pkg.deliveryUnit || 'days'}</td>)}</tr><tr><td>Revisions</td>{packages.map((pkg, i) => <td key={i}>{pkg.unlimitedRevisions ? 'Unlimited' : (pkg.revisions || '0')}</td>)}</tr>{(packages[0]?.features || []).map((f, fi) => (<tr key={fi}><td>{f.label || `Feature ${fi+1}`}</td>{packages.map((pkg, pi) => { const feat = (pkg.features || [])[fi]; if (!feat) return <td key={pi}>—</td>; if (feat.included === false) return <td key={pi} className="sv-compare-no">✗</td>; return <td key={pi} className="sv-compare-yes">{feat.value || '✓'}</td>; })}</tr>))}</tbody></table></div>
          </section>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (<section className="sv-inline-section"><h3>FAQ</h3><div className="sv-inline-faqs">{faqs.map((faq, i) => <FAQAccordion key={i} faq={faq} />)}</div></section>)}
      </div>

      {/* RIGHT: Sticky Pricing */}
      <aside className="sv-inline-sidebar">
        <div className="sv-pricing-panel">
          {packages.length > 1 && (<div className="sv-pricing-tabs">{packages.map((pkg, i) => (<button key={i} className={`sv-pricing-tab ${i === selectedPkg ? 'active' : ''}`} onClick={() => setSelectedPkg(i)}>{pkg.displayName || pkg.key}</button>))}</div>)}
          <div className="sv-pricing-content">
            {currentPkg ? (<>
              <div className="sv-pricing-pkg-header"><span className="sv-pricing-pkg-name">{currentPkg.title || currentPkg.displayName}</span></div>
              <div className="sv-pricing-price">{priceDisplay(currentPkg.price)}</div>
              {currentPkg.description && <p className="sv-pricing-pkg-desc">{currentPkg.description}</p>}
              <div className="sv-pricing-details"><span><FiClock size={13} /> {currentPkg.deliveryValue || '—'}-day delivery</span><span>✎ {currentPkg.unlimitedRevisions ? 'Unlimited' : (currentPkg.revisions || '0')} Revisions</span></div>
              {(currentPkg.features || []).length > 0 && (<div className="sv-pricing-included"><button className="sv-pricing-included-toggle" onClick={() => setShowIncluded(!showIncluded)}>What's Included {showIncluded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}</button>{showIncluded && (<div className="sv-pricing-included-list">{currentPkg.features.filter(f => f.included !== false).map((f, i) => (<div key={i} className="sv-pricing-feature"><FiCheck size={12} /> {f.label}{f.value ? `: ${f.value}` : ''}</div>))}</div>)}</div>)}
            </>) : (<><div className="sv-pricing-price">{priceDisplay(service.startingPrice)}</div>{service.deliveryTime && <div className="sv-pricing-details"><span><FiClock size={13} /> {service.deliveryTime} {service.deliveryUnit} delivery</span></div>}</>)}
          </div>
          <div className="sv-pricing-cta"><button className="pf-btn pf-btn-primary pf-btn-full pf-btn-lg sv-continue-btn">Continue <span>→</span></button><ChatButton recipientId={profile?.userId} recipientName={profile?.fullName} buttonClass="pf-btn pf-btn-secondary pf-btn-full sv-contact-btn" buttonText="💬 Contact me" /></div>
        </div>
      </aside>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// PROJECT DETAIL MODAL (Fiverr-style)
// ═══════════════════════════════════════════════════════════════════════
const ProjectModal = ({ project, projects, onClose, onNavigate, staffName, staffAvatar }) => {
  const currentIdx = projects.findIndex(p => p.projectId === project.projectId);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < projects.length - 1;
  const [fullProject, setFullProject] = useState(null);

  useEffect(() => {
    setFullProject(null); // reset on project change
    if (project.slug) {
      const pathParts = window.location.pathname.split('/');
      const profileSlug = pathParts[pathParts.indexOf('staff') + 1];
      if (profileSlug) {
        portfolioApi.getProfileProject(profileSlug, project.slug)
          .then(res => { if (res.success) setFullProject(res.data); })
          .catch(() => {});
      }
    }
  }, [project]);

  // Use full detail if available, else fallback to card data
  const p = fullProject || project;

  useEffect(() => {
    document.body.classList.add('modal-open');
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => { document.body.classList.remove('modal-open'); document.removeEventListener('keydown', handleEsc); };
  }, [onClose]);

  return (
    <div className="sv-project-modal-overlay" onClick={onClose}>
      <div className="sv-project-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sv-project-modal-header">
          <div className="sv-project-modal-maker">
            {staffAvatar ? <img src={staffAvatar} alt={staffName} /> : <div className="sv-project-modal-avatar">{(staffName || 'S').charAt(0)}</div>}
            <span>Made by <strong>{staffName}</strong></span>
          </div>
          <div className="sv-project-modal-nav">
            <button disabled={!hasPrev} onClick={() => onNavigate(projects[currentIdx - 1])} aria-label="Previous"><FiChevronLeft /></button>
            <span>{currentIdx + 1} of {projects.length}</span>
            <button disabled={!hasNext} onClick={() => onNavigate(projects[currentIdx + 1])} aria-label="Next"><FiChevronRight /></button>
            <button onClick={onClose} aria-label="Close" className="sv-project-modal-close"><FiX size={18} /></button>
          </div>
        </div>
        {/* Body */}
        <div className="sv-project-modal-body">
          {p.startDate && <div className="sv-project-modal-date"><FiCalendar size={13} /> From: {new Date(p.startDate + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>}
          <h2 className="sv-project-modal-title">{p.title}</h2>
          {p.shortDescription && <p className="sv-project-modal-desc">{p.shortDescription}</p>}

          {/* Project Type & Role */}
          {(p.projectType || p.roleOrContribution) && (
            <div className="sv-project-modal-section">
              <div className="sv-project-modal-field">
                {p.projectType && <><span className="sv-project-modal-field-label">Type</span><span className="sv-project-modal-chip">{p.projectType}</span></>}
              </div>
              {p.roleOrContribution && <div className="sv-project-modal-field"><span className="sv-project-modal-field-label">Role</span><span className="sv-project-modal-field-value">{p.roleOrContribution}</span></div>}
            </div>
          )}

          {/* Technologies as chips */}
          {p.technologies?.length > 0 && (
            <div className="sv-project-modal-section">
              <span className="sv-project-modal-field-label">Skills & Technologies</span>
              <div className="sv-project-modal-tech-chips">
                {p.technologies.map(t => <span key={t} className="sv-project-modal-tech-chip">{t}</span>)}
              </div>
            </div>
          )}

          {/* Cover Image */}
          {(p.coverImageUrl || project.coverImageUrl) && <div className="sv-project-modal-cover"><img src={p.coverImageUrl || project.coverImageUrl} alt={p.title} /></div>}

          {/* Gallery Images */}
          {p.galleryImages?.length > 0 && (
            <div className="sv-project-modal-gallery">
              {p.galleryImages.map((img, i) => (
                <div key={i} className="sv-project-modal-gallery-item">
                  <img src={img.fullUrl || img.url} alt={`Gallery ${i + 1}`} />
                </div>
              ))}
            </div>
          )}

          {/* Links */}
          {(p.liveUrl || p.repositoryUrl) && (
            <div className="sv-project-modal-links">
              {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="pf-btn pf-btn-primary pf-btn-sm"><FiExternalLink size={13} /> View Live</a>}
              {p.repositoryUrl && <a href={p.repositoryUrl} target="_blank" rel="noopener noreferrer" className="pf-btn pf-btn-secondary pf-btn-sm"><FiGithub size={13} /> Source Code</a>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FAQAccordion = ({ faq }) => { const [open, setOpen] = useState(false); return (<div className={`sv-faq-accordion ${open ? 'open' : ''}`}><button className="sv-faq-accordion-trigger" onClick={() => setOpen(!open)} aria-expanded={open}>{faq.question}<span>{open ? '−' : '+'}</span></button>{open && <div className="sv-faq-accordion-content">{faq.answer}</div>}</div>); };

export default ProfileServicesTab;
