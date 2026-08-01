/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiArrowLeft, FiSave, FiCheck, FiPackage, FiMapPin, FiDollarSign, FiClock, FiTag, FiFileText, FiHelpCircle, FiImage, FiCalendar, FiEye } from 'react-icons/fi';
import { toast } from 'sonner';
import * as serviceApi from '../../services/serviceApi';
import { getSectors, getRolesForSector } from '../../utils/sectorRoleData';
import PackageBuilder from './PackageBuilder';
import FAQBuilder from './FAQBuilder';
import RequirementsBuilder from './RequirementsBuilder';
import AddonsBuilder from './AddonsBuilder';
import AvailabilityBuilder from './AvailabilityBuilder';
import ServiceMediaBuilder from './ServiceMediaBuilder';
import SEOBuilder from './SEOBuilder';
import UnsavedChangesDialog from './UnsavedChangesDialog';
import VersionConflictDialog from './VersionConflictDialog';
import './services.css';

const STEPS = [
  { key: 'overview', label: 'Overview', icon: <FiPackage size={14} /> },
  { key: 'category', label: 'Category', icon: <FiTag size={14} /> },
  { key: 'workmode', label: 'Work Mode', icon: <FiMapPin size={14} /> },
  { key: 'pricing', label: 'Pricing', icon: <FiDollarSign size={14} /> },
  { key: 'packages', label: 'Packages', icon: <FiPackage size={14} /> },
  { key: 'addons', label: 'Add-Ons', icon: <FiPackage size={14} /> },
  { key: 'description', label: 'Description', icon: <FiFileText size={14} /> },
  { key: 'requirements', label: 'Requirements', icon: <FiHelpCircle size={14} /> },
  { key: 'media', label: 'Media', icon: <FiImage size={14} /> },
  { key: 'availability', label: 'Availability', icon: <FiCalendar size={14} /> },
  { key: 'faqs', label: 'FAQs', icon: <FiHelpCircle size={14} /> },
  { key: 'seo', label: 'SEO', icon: <FiTag size={14} /> },
  { key: 'delivery', label: 'Delivery', icon: <FiClock size={14} /> },
  { key: 'preview', label: 'Preview', icon: <FiEye size={14} /> },
];

const PRICING_MODES = [
  { value: 'fixed', label: 'Fixed Price' }, { value: 'tiered', label: 'Tiered Packages' },
  { value: 'hourly', label: 'Hourly' }, { value: 'daily', label: 'Daily' },
  { value: 'per_visit', label: 'Per Visit' }, { value: 'per_session', label: 'Per Session' },
  { value: 'per_item', label: 'Per Item' }, { value: 'monthly', label: 'Monthly' },
  { value: 'custom_quote', label: 'Custom Quote Only' }
];
const WORK_MODES = [{ value: 'remote', label: 'Remote' }, { value: 'on_site', label: 'On-Site' }, { value: 'hybrid', label: 'Hybrid' }];

const ServiceBuilder = ({ serviceId, onNavigate }) => {
  const isEdit = Boolean(serviceId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const idempotencyKeyRef = useRef(crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
  const autosaveTimerRef = useRef(null);
  const pendingNavigateRef = useRef(null);
  const [form, setForm] = useState({
    title: '', shortDescription: '', detailedDescription: '',
    sector: '', category: '', workMode: 'remote',
    pricingMode: 'fixed', startingPrice: '', currency: 'INR',
    customQuoteEnabled: false, deliveryTime: '', deliveryUnit: 'days',
    location: '', serviceRadius: '', tags: [],
    packages: [], faqs: [], addons: [], requirements: [],
    availability: { acceptingOrders: true, workingDays: ['Monday','Tuesday','Wednesday','Thursday','Friday'], startTime: '09:00', endTime: '18:00', timeZone: 'Asia/Kolkata', queueLimit: '', bookingNotice: '', responseTime: '', holidayMode: false, holidayStart: '', holidayEnd: '' },
    coverMediaUrl: null, galleryMediaUrls: [], videoUrl: '', seo: {}
  });
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');

  const sectors = getSectors();
  const roles = form.sector ? getRolesForSector(form.sector) : [];

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await serviceApi.getMyService(serviceId);
        if (res.success) {
          setService(res.data);
          setForm({
            title: res.data.title || '', shortDescription: res.data.shortDescription || '',
            detailedDescription: res.data.detailedDescription || '',
            sector: res.data.sector || '', category: res.data.category || '',
            workMode: res.data.workMode || 'remote', pricingMode: res.data.pricingMode || 'fixed',
            startingPrice: res.data.startingPrice || '', currency: res.data.currency || 'INR',
            customQuoteEnabled: res.data.customQuoteEnabled || false,
            deliveryTime: res.data.deliveryTime || '', deliveryUnit: res.data.deliveryUnit || 'days',
            location: res.data.location || '', serviceRadius: res.data.serviceRadius || '',
            tags: res.data.tags || [], packages: res.data.packages || [], faqs: res.data.faqs || [],
            addons: res.data.addons || [], requirements: res.data.requirements || [],
            availability: res.data.availability || { acceptingOrders: true, workingDays: ['Monday','Tuesday','Wednesday','Thursday','Friday'], startTime: '09:00', endTime: '18:00', timeZone: 'Asia/Kolkata', queueLimit: '', bookingNotice: '', responseTime: '', holidayMode: false, holidayStart: '', holidayEnd: '' },
            coverMediaUrl: res.data.coverMediaUrl || null, galleryMediaUrls: res.data.galleryMediaUrls || [], videoUrl: res.data.videoUrl || '', seo: res.data.seo || {}
          });
        }
      } catch { toast.error('Failed to load service'); }
      finally { setLoading(false); }
    };
    load();
  }, [isEdit, serviceId]);

  const updateField = (field, value) => { setForm(prev => ({ ...prev, [field]: value })); setDirty(true); if (errors[field]) setErrors(prev => ({ ...prev, [field]: null })); };
  const addTag = (val) => { const t = val.trim(); if (!t || form.tags.includes(t) || form.tags.length >= 10) return; updateField('tags', [...form.tags, t]); setTagInput(''); };
  const removeTag = (tag) => { updateField('tags', form.tags.filter(t => t !== tag)); };

  const handleSave = useCallback(async (silent = false) => {
    if (!form.title.trim()) { if (!silent) { setErrors({ title: 'Title is required' }); setCurrentStep(0); toast.error('Title is required'); } return; }
    setSaving(true);
    try {
      if (isEdit) {
        const fields = {};
        const compare = (key, formVal, svcVal) => { if (JSON.stringify(formVal) !== JSON.stringify(svcVal)) fields[key] = formVal; };
        compare('title', form.title.trim(), service.title);
        compare('shortDescription', form.shortDescription, service.shortDescription || '');
        compare('detailedDescription', form.detailedDescription, service.detailedDescription || '');
        compare('sector', form.sector || null, service.sector);
        compare('category', form.category || null, service.category);
        compare('workMode', form.workMode, service.workMode);
        compare('pricingMode', form.pricingMode, service.pricingMode);
        compare('startingPrice', form.startingPrice ? Number(form.startingPrice) : null, service.startingPrice);
        compare('currency', form.currency, service.currency);
        compare('customQuoteEnabled', form.customQuoteEnabled, service.customQuoteEnabled);
        compare('deliveryTime', form.deliveryTime ? Number(form.deliveryTime) : null, service.deliveryTime);
        compare('deliveryUnit', form.deliveryUnit, service.deliveryUnit);
        compare('location', form.location || null, service.location);
        compare('serviceRadius', form.serviceRadius ? Number(form.serviceRadius) : null, service.serviceRadius);
        compare('tags', form.tags, service.tags || []);
        compare('addons', form.addons, service.addons || []);
        compare('requirements', form.requirements, service.requirements || []);
        compare('availability', form.availability, service.availability || {});
        compare('seo', form.seo, service.seo || {});
        compare('coverMediaUrl', form.coverMediaUrl, service.coverMediaUrl);
        compare('galleryMediaUrls', form.galleryMediaUrls, service.galleryMediaUrls || []);
        if (Object.keys(fields).length === 0 && JSON.stringify(form.packages) === JSON.stringify(service.packages || []) && JSON.stringify(form.faqs) === JSON.stringify(service.faqs || [])) {
          if (!silent) toast.success('No changes to save'); setSaving(false); return;
        }
        // Save main fields
        if (Object.keys(fields).length > 0) {
          const res = await serviceApi.updateService(serviceId, fields, service.version);
          if (res.success) setService(res.data);
        }
        // Save packages if changed
        if (JSON.stringify(form.packages) !== JSON.stringify(service.packages || [])) {
          const currentVersion = service.version + (Object.keys(fields).length > 0 ? 1 : 0);
          const res = await serviceApi.updatePackages(serviceId, form.packages, currentVersion);
          if (res.success) setService(res.data);
        }
        // Save FAQs if changed
        if (JSON.stringify(form.faqs) !== JSON.stringify(service.faqs || [])) {
          const latestService = await serviceApi.getMyService(serviceId);
          if (latestService.success) {
            await serviceApi.updateFaqs(serviceId, form.faqs, latestService.data.version);
          }
        }
        // Refresh
        const refreshed = await serviceApi.getMyService(serviceId);
        if (refreshed.success) setService(refreshed.data);
        setDirty(false);
        setLastSaved(new Date());
        if (!silent) toast.success('Service saved');
      } else {
        const res = await serviceApi.createService({ title: form.title.trim(), shortDescription: form.shortDescription, sector: form.sector || null, category: form.category || null, workMode: form.workMode, pricingMode: form.pricingMode, startingPrice: form.startingPrice ? Number(form.startingPrice) : null, currency: form.currency, deliveryTime: form.deliveryTime ? Number(form.deliveryTime) : null, deliveryUnit: form.deliveryUnit, tags: form.tags, detailedDescription: form.detailedDescription || null, customQuoteEnabled: form.customQuoteEnabled, location: form.location || null, serviceRadius: form.serviceRadius ? Number(form.serviceRadius) : null }, idempotencyKeyRef.current);
        if (res.success) {
          const newServiceId = res.data.serviceId;
          // Save structured data that create endpoint doesn't handle
          const structuredFields = {};
          if (form.addons.length > 0) structuredFields.addons = form.addons;
          if (form.requirements.length > 0) structuredFields.requirements = form.requirements;
          if (form.availability && Object.keys(form.availability).length > 0) structuredFields.availability = form.availability;
          if (form.seo && Object.keys(form.seo).length > 0) structuredFields.seo = form.seo;
          if (Object.keys(structuredFields).length > 0) {
            try { await serviceApi.updateService(newServiceId, structuredFields, res.data.version); } catch {}
          }
          if (form.packages.length > 0) {
            try { await serviceApi.updatePackages(newServiceId, form.packages, res.data.version + (Object.keys(structuredFields).length > 0 ? 1 : 0)); } catch {}
          }
          if (form.faqs.length > 0) {
            const latestVer = res.data.version + (Object.keys(structuredFields).length > 0 ? 1 : 0) + (form.packages.length > 0 ? 1 : 0);
            try { await serviceApi.updateFaqs(newServiceId, form.faqs, latestVer); } catch {}
          }
          setDirty(false); idempotencyKeyRef.current = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2); toast.success('Service created'); onNavigate('edit', newServiceId);
        }
      }
    } catch (err) {
      if (err.code === 'VERSION_CONFLICT') {
        if (!silent) setShowConflictDialog(true);
        else toast.error('Save conflict — please save manually');
      } else if (!silent) { toast.error(err.message || 'Save failed'); }
    } finally { setSaving(false); }
  }, [form, service, isEdit, serviceId, onNavigate]);

  const handleBack = () => {
    if (dirty) {
      pendingNavigateRef.current = 'dashboard';
      setShowUnsavedDialog(true);
    } else {
      onNavigate('dashboard');
    }
  };

  const handleUnsavedStay = () => { setShowUnsavedDialog(false); pendingNavigateRef.current = null; };
  const handleUnsavedDiscard = () => { setShowUnsavedDialog(false); setDirty(false); onNavigate(pendingNavigateRef.current || 'dashboard'); };

  const handleConflictReload = async () => {
    setShowConflictDialog(false);
    if (isEdit) {
      const r = await serviceApi.getMyService(serviceId);
      if (r.success) { setService(r.data); toast.success('Loaded latest version'); }
    }
  };
  const handleConflictCopy = () => { navigator.clipboard?.writeText(JSON.stringify(form, null, 2)); toast.success('Form data copied to clipboard'); };
  const handleConflictDismiss = () => { setShowConflictDialog(false); };

  // Autosave (debounced 5s after last change, only in edit mode)
  useEffect(() => {
    if (!isEdit || !dirty || saving) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => { handleSave(true); }, 5000);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [form, isEdit, dirty, saving]);

  if (loading) return (<div className="pf-editor-page"><div className="pf-skeleton" style={{ width: 200, height: 28, marginBottom: 24 }} />{[1,2,3].map(i => <div key={i} className="pf-skeleton" style={{ height: 160, marginBottom: 16 }} />)}</div>);

  // Step completion checks — only show green tick when fields are actually filled
  function isStepCompleted(stepKey, f) {
    switch (stepKey) {
      case 'overview': return !!f.title.trim() && !!f.shortDescription;
      case 'category': return !!f.sector && !!f.category;
      case 'workmode': return !!f.workMode;
      case 'pricing': return f.pricingMode === 'custom_quote' || !!f.startingPrice;
      case 'packages': return f.pricingMode !== 'tiered' || f.packages.length > 0;
      case 'addons': return f.addons.length > 0;
      case 'description': return !!f.detailedDescription;
      case 'requirements': return f.requirements.length > 0;
      case 'media': return !!f.coverMediaUrl;
      case 'availability': return (f.availability?.workingDays || []).length > 0;
      case 'faqs': return f.faqs.length > 0;
      case 'seo': return !!(f.seo?.title || f.seo?.description);
      case 'delivery': return !!f.deliveryTime;
      case 'preview': return false; // Preview is never "completed"
      default: return false;
    }
  }

  return (
    <div className="sv-builder">
      {/* Header */}
      <div className="sv-builder-header">
        <div className="sv-builder-header-left">
          <button className="pf-back-btn" onClick={handleBack} aria-label="Back"><FiArrowLeft /></button>
          <div>
            <h1 className="sv-builder-title">{isEdit ? 'Edit Service' : 'Create Service'}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {service && <span className="sv-builder-status">{service.status} · v{service.version}</span>}
              {lastSaved && <span className="sv-builder-status">Saved {lastSaved.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
              {saving && <span className="sv-builder-status" style={{ color: 'var(--pf-primary)' }}>Saving...</span>}
            </div>
          </div>
        </div>
        <div className="sv-builder-header-actions">
          <button className="pf-btn pf-btn-primary" onClick={() => handleSave(false)} disabled={saving}><FiSave size={14} /> {saving ? 'Saving...' : 'Save Draft'}</button>
        </div>
      </div>

      <div className="sv-builder-layout">
        {/* Step Navigation */}
        <nav className="sv-builder-steps" aria-label="Builder steps">
          {STEPS.map((step, idx) => {
            const isCompleted = isStepCompleted(step.key, form);
            return (
              <button key={step.key} className={`sv-step ${idx === currentStep ? 'active' : ''} ${isCompleted ? 'completed' : ''}`} onClick={() => setCurrentStep(idx)} aria-current={idx === currentStep ? 'step' : undefined}>
                <span className="sv-step-icon">{isCompleted ? <FiCheck size={12} /> : step.icon}</span>
                <span className="sv-step-label">{step.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Step Content */}
        <div className="sv-builder-content">
          {currentStep === 0 && <StepOverview form={form} errors={errors} updateField={updateField} tagInput={tagInput} setTagInput={setTagInput} addTag={addTag} removeTag={removeTag} />}
          {currentStep === 1 && <StepCategory form={form} updateField={updateField} sectors={sectors} roles={roles} />}
          {currentStep === 2 && <StepWorkMode form={form} updateField={updateField} />}
          {currentStep === 3 && <StepPricing form={form} updateField={updateField} errors={errors} />}
          {currentStep === 4 && <PackageBuilder packages={form.packages} pricingMode={form.pricingMode} onChange={pkgs => updateField('packages', pkgs)} />}
          {currentStep === 5 && <AddonsBuilder addons={form.addons} onChange={addons => updateField('addons', addons)} />}
          {currentStep === 6 && <StepDescription form={form} updateField={updateField} />}
          {currentStep === 7 && <RequirementsBuilder requirements={form.requirements} onChange={reqs => updateField('requirements', reqs)} />}
          {currentStep === 8 && <ServiceMediaBuilder serviceId={serviceId} service={service} onServiceUpdated={(updated) => { setService(updated); setForm(prev => ({ ...prev, coverMediaUrl: updated.coverMediaUrl, galleryMediaUrls: updated.galleryMediaUrls || [], videoUrl: updated.videoUrl || '' })); }} />}
          {currentStep === 9 && <AvailabilityBuilder availability={form.availability} onChange={avail => updateField('availability', avail)} />}
          {currentStep === 10 && <FAQBuilder faqs={form.faqs} onChange={faqs => updateField('faqs', faqs)} />}
          {currentStep === 11 && <SEOBuilder seo={form.seo} title={form.title} shortDescription={form.shortDescription} onChange={seo => updateField('seo', seo)} />}
          {currentStep === 12 && <StepDelivery form={form} updateField={updateField} />}
          {currentStep === 13 && <StepPreview form={form} service={service} />}

          {/* Navigation */}
          <div className="sv-builder-nav">
            {currentStep > 0 && <button className="pf-btn pf-btn-secondary" onClick={() => setCurrentStep(s => s - 1)}>Previous</button>}
            {currentStep < STEPS.length - 1 && <button className="pf-btn pf-btn-primary" onClick={() => setCurrentStep(s => s + 1)}>Continue</button>}
            {currentStep === STEPS.length - 1 && <button className="pf-btn pf-btn-primary" onClick={() => handleSave(false)} disabled={saving}><FiSave size={14} /> {saving ? 'Saving...' : 'Save Service'}</button>}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {showUnsavedDialog && <UnsavedChangesDialog onStay={handleUnsavedStay} onDiscard={handleUnsavedDiscard} />}
      {showConflictDialog && <VersionConflictDialog onReload={handleConflictReload} onCopy={handleConflictCopy} onDismiss={handleConflictDismiss} />}
    </div>
  );
};

// ─── Steps ────────────────────────────────────────────────────────────

const StepOverview = ({ form, errors, updateField, tagInput, setTagInput, addTag, removeTag }) => (
  <div><h2 className="sv-step-title">Service Overview</h2><p className="sv-step-desc">Describe what you offer clearly and concisely.</p>
    <div className="pf-form-group"><label className="pf-label">Service Title <span className="required">*</span></label><input className={`pf-input ${errors.title ? 'error' : ''}`} value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="e.g., Professional Website Development" maxLength={150} /><div className="pf-char-count">{form.title.length}/150</div>{errors.title && <div className="pf-error-text">{errors.title}</div>}</div>
    <div className="pf-form-group"><label className="pf-label">Short Description</label><textarea className="pf-textarea" value={form.shortDescription} onChange={e => updateField('shortDescription', e.target.value)} placeholder="Brief summary visible in search and cards" maxLength={300} rows={3} /><div className="pf-char-count">{form.shortDescription.length}/300</div></div>
    <div className="pf-form-group"><label className="pf-label">Search Tags</label><div className="pf-tags-container">{form.tags.map(t => <span key={t} className="pf-tag">{t}<button className="pf-tag-remove" onClick={() => removeTag(t)}>×</button></span>)}<input className="pf-tag-input" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); } }} onBlur={() => { if (tagInput.trim()) addTag(tagInput); }} placeholder={form.tags.length === 0 ? 'Press Enter to add...' : ''} disabled={form.tags.length >= 10} /></div><div className="pf-helper">{form.tags.length}/10</div></div>
  </div>
);

const StepCategory = ({ form, updateField, sectors, roles }) => (
  <div><h2 className="sv-step-title">Category</h2><p className="sv-step-desc">Choose the sector and category that best describes your service.</p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div className="pf-form-group"><label className="pf-label">Sector</label><select className="pf-select" style={{ width: '100%' }} value={form.sector} onChange={e => { updateField('sector', e.target.value); updateField('category', ''); }}><option value="">Select sector</option>{sectors.map(s => <option key={s} value={s}>{s}</option>)}</select></div><div className="pf-form-group"><label className="pf-label">Category</label><select className="pf-select" style={{ width: '100%' }} value={form.category} onChange={e => updateField('category', e.target.value)} disabled={!form.sector}><option value="">Select category</option>{roles.map(r => <option key={r} value={r}>{r}</option>)}</select></div></div>
  </div>
);

const StepWorkMode = ({ form, updateField }) => (
  <div><h2 className="sv-step-title">Work Mode & Location</h2><p className="sv-step-desc">How and where do you deliver this service?</p>
    <div className="pf-form-group"><label className="pf-label">Work Mode</label><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{WORK_MODES.map(m => <label key={m.value} className={`sv-mode-option ${form.workMode === m.value ? 'active' : ''}`}><input type="radio" name="workMode" value={m.value} checked={form.workMode === m.value} onChange={e => updateField('workMode', e.target.value)} />{m.label}</label>)}</div></div>
    {form.workMode !== 'remote' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div className="pf-form-group"><label className="pf-label">Location</label><input className="pf-input" value={form.location} onChange={e => updateField('location', e.target.value)} placeholder="e.g., Delhi NCR" /></div><div className="pf-form-group"><label className="pf-label">Radius (km)</label><input className="pf-input" type="number" value={form.serviceRadius} onChange={e => updateField('serviceRadius', e.target.value)} min={0} /></div></div>}
  </div>
);

const StepPricing = ({ form, updateField, errors }) => (
  <div><h2 className="sv-step-title">Pricing</h2><p className="sv-step-desc">Choose how you charge for this service.</p>
    <div className="pf-form-group"><label className="pf-label">Pricing Model</label><select className="pf-select" style={{ width: '100%' }} value={form.pricingMode} onChange={e => updateField('pricingMode', e.target.value)}>{PRICING_MODES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
    {form.pricingMode !== 'custom_quote' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div className="pf-form-group"><label className="pf-label">Starting Price (₹)</label><input className={`pf-input ${errors.startingPrice ? 'error' : ''}`} type="number" value={form.startingPrice} onChange={e => updateField('startingPrice', e.target.value)} min={0} /></div><div className="pf-form-group"><label className="pf-label">Currency</label><select className="pf-select" style={{ width: '100%' }} value={form.currency} onChange={e => updateField('currency', e.target.value)}><option value="INR">₹ INR</option><option value="USD">$ USD</option></select></div></div>}
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--pf-text-secondary)', marginTop: 12 }}><input type="checkbox" checked={form.customQuoteEnabled} onChange={e => updateField('customQuoteEnabled', e.target.checked)} /> Also accept custom quote requests</label>
  </div>
);

const StepDescription = ({ form, updateField }) => (
  <div><h2 className="sv-step-title">Description</h2><p className="sv-step-desc">Provide a detailed description of your service.</p>
    <div className="pf-form-group"><label className="pf-label">Full Description</label><textarea className="pf-textarea" style={{ minHeight: 200 }} value={form.detailedDescription} onChange={e => updateField('detailedDescription', e.target.value)} placeholder="Describe what's included, your process, tools used, deliverables..." /></div>
  </div>
);

const StepDelivery = ({ form, updateField }) => (
  <div><h2 className="sv-step-title">Delivery</h2><p className="sv-step-desc">How long does it take to complete this service?</p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div className="pf-form-group"><label className="pf-label">Delivery Time</label><input className="pf-input" type="number" value={form.deliveryTime} onChange={e => updateField('deliveryTime', e.target.value)} placeholder="e.g., 7" min={1} /></div><div className="pf-form-group"><label className="pf-label">Unit</label><select className="pf-select" style={{ width: '100%' }} value={form.deliveryUnit} onChange={e => updateField('deliveryUnit', e.target.value)}><option value="hours">Hours</option><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option></select></div></div>
  </div>
);

const StepPreview = ({ form, service }) => {
  const priceDisplay = form.startingPrice ? `₹${Number(form.startingPrice).toLocaleString('en-IN')}` : 'Custom Quote';
  return (
    <div>
      <h2 className="sv-step-title">Preview & Submit</h2>
      <p className="sv-step-desc">Review how your service will appear to clients.</p>
      <div className="sv-preview-card">
        <div className="sv-preview-header">
          <h3>{form.title || 'Untitled Service'}</h3>
          {form.category && <span className="pf-badge pf-badge-published">{form.category}</span>}
          {form.workMode && <span className="sv-mgmt-mode">{form.workMode.replace('_', '-')}</span>}
        </div>
        <p className="sv-preview-desc">{form.shortDescription || 'No short description provided.'}</p>
        <div className="sv-preview-price">
          <strong>{priceDisplay}</strong>
          {form.pricingMode !== 'custom_quote' && form.pricingMode !== 'fixed' && <span> / {form.pricingMode.replace('_', ' ')}</span>}
          {form.deliveryTime && <span style={{ marginLeft: 16, color: 'var(--pf-text-muted)' }}>Delivery: {form.deliveryTime} {form.deliveryUnit}</span>}
        </div>
        {form.packages.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <strong style={{ fontSize: '0.82rem' }}>Packages:</strong>
            <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              {form.packages.map((pkg, i) => (
                <div key={i} style={{ padding: '10px 16px', border: '1px solid var(--pf-border)', borderRadius: 8, flex: '1 1 0', minWidth: 140 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{pkg.displayName || 'Package'}</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 4 }}>₹{Number(pkg.price || 0).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-muted)' }}>{pkg.deliveryValue} {pkg.deliveryUnit || 'days'} delivery</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {form.faqs.length > 0 && <div style={{ marginTop: 16, fontSize: '0.82rem', color: 'var(--pf-text-muted)' }}>{form.faqs.length} FAQ{form.faqs.length !== 1 ? 's' : ''} configured</div>}
        {form.addons.length > 0 && <div style={{ fontSize: '0.82rem', color: 'var(--pf-text-muted)' }}>{form.addons.length} add-on{form.addons.length !== 1 ? 's' : ''} available</div>}
        {form.requirements.length > 0 && <div style={{ fontSize: '0.82rem', color: 'var(--pf-text-muted)' }}>{form.requirements.length} client requirement{form.requirements.length !== 1 ? 's' : ''}</div>}
      </div>

      {/* Readiness Checklist */}
      <div style={{ marginTop: 24 }}>
        <h4 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Publish Readiness</h4>
        <div className="sv-checklist">
          <CheckItem done={!!form.title.trim()} label="Service title" />
          <CheckItem done={!!form.shortDescription} label="Short description" />
          <CheckItem done={!!form.sector} label="Sector selected" />
          <CheckItem done={!!form.category} label="Category selected" />
          <CheckItem done={form.pricingMode === 'custom_quote' || !!form.startingPrice} label="Pricing configured" />
          <CheckItem done={form.pricingMode !== 'tiered' || form.packages.length > 0} label="Packages defined (if tiered)" />
          <CheckItem done={!!form.detailedDescription} label="Detailed description" />
          <CheckItem done={!!form.deliveryTime} label="Delivery time set" />
        </div>
      </div>
    </div>
  );
};

const CheckItem = ({ done, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: '0.82rem' }}>
    <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--pf-success-light)' : 'var(--pf-background)', color: done ? 'var(--pf-success)' : 'var(--pf-text-muted)', border: `1px solid ${done ? 'var(--pf-success)' : 'var(--pf-border)'}`, fontSize: '0.7rem' }}>{done ? '✓' : '−'}</span>
    <span style={{ color: done ? 'var(--pf-text-primary)' : 'var(--pf-text-muted)' }}>{label}</span>
  </div>
);

export default ServiceBuilder;
