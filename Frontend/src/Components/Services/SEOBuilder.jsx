/* eslint-disable react/prop-types */
import React from 'react';
import { FiSearch, FiShare2 } from 'react-icons/fi';

const SEOBuilder = ({ seo = {}, title, shortDescription, onChange }) => {
  const update = (field, value) => onChange({ ...seo, [field]: value });

  const seoTitle = seo.title || title || '';
  const seoDesc = seo.description || shortDescription || '';

  return (
    <div>
      <h2 className="sv-step-title">SEO & Sharing</h2>
      <p className="sv-step-desc">Optimize how your service appears in search engines and social shares.</p>

      {/* SEO Title */}
      <div className="pf-form-group">
        <label className="pf-label">SEO Title</label>
        <input className="pf-input" value={seo.title || ''} onChange={e => update('title', e.target.value)} placeholder={title || 'Service title (auto-filled)'} maxLength={70} />
        <div className="pf-char-count">{(seo.title || '').length}/70</div>
      </div>

      {/* Meta Description */}
      <div className="pf-form-group">
        <label className="pf-label">Meta Description</label>
        <textarea className="pf-textarea" rows={3} value={seo.description || ''} onChange={e => update('description', e.target.value)} placeholder={shortDescription || 'Short description (auto-filled)'} maxLength={160} />
        <div className="pf-char-count">{(seo.description || '').length}/160</div>
      </div>

      {/* Keywords */}
      <div className="pf-form-group">
        <label className="pf-label">Keywords</label>
        <input className="pf-input" value={seo.keywords || ''} onChange={e => update('keywords', e.target.value)} placeholder="keyword1, keyword2, keyword3" maxLength={200} />
        <div className="pf-helper">Comma-separated keywords for search optimization</div>
      </div>

      {/* OG Title */}
      <div className="pf-form-group">
        <label className="pf-label">Social Share Title</label>
        <input className="pf-input" value={seo.ogTitle || ''} onChange={e => update('ogTitle', e.target.value)} placeholder={title || 'Defaults to service title'} maxLength={70} />
      </div>

      {/* OG Description */}
      <div className="pf-form-group">
        <label className="pf-label">Social Share Description</label>
        <textarea className="pf-textarea" rows={2} value={seo.ogDescription || ''} onChange={e => update('ogDescription', e.target.value)} placeholder={shortDescription || 'Defaults to short description'} maxLength={200} />
      </div>

      {/* Previews */}
      <div style={{ marginTop: 24 }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><FiSearch size={14} /> Search Preview</h4>
        <div className="sv-seo-preview">
          <div className="sv-seo-preview-title">{seoTitle || 'Service Title'} — Staffinn</div>
          <div className="sv-seo-preview-url">staffinn.com/services/your-service-slug</div>
          <div className="sv-seo-preview-desc">{seoDesc || 'Your service description will appear here in search results.'}</div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><FiShare2 size={14} /> Social Share Preview</h4>
        <div className="sv-social-preview">
          <div className="sv-social-preview-image">
            {seo.ogImage ? <img src={seo.ogImage} alt="OG" /> : <span style={{ color: 'var(--pf-text-muted)', fontSize: '0.75rem' }}>Service cover image</span>}
          </div>
          <div className="sv-social-preview-content">
            <div className="sv-social-preview-domain">staffinn.com</div>
            <div className="sv-social-preview-title">{seo.ogTitle || seoTitle || 'Service Title'}</div>
            <div className="sv-social-preview-desc">{seo.ogDescription || seoDesc || 'Description'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SEOBuilder;
