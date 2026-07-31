/* eslint-disable react/prop-types */
import React from 'react';
import { FiPlus, FiTrash2, FiChevronUp, FiChevronDown } from 'react-icons/fi';

const QUESTION_TYPES = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'single_select', label: 'Single Select' },
  { value: 'multi_select', label: 'Multi Select' },
  { value: 'file_upload', label: 'File Upload' },
  { value: 'url', label: 'URL' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
  { value: 'budget', label: 'Budget' },
];

const RequirementsBuilder = ({ requirements = [], onChange }) => {
  const addReq = () => {
    if (requirements.length >= 20) return;
    onChange([...requirements, { question: '', helpText: '', type: 'short_text', required: false, options: [], placeholder: '', active: true }]);
  };

  const updateReq = (index, field, value) => {
    const updated = [...requirements];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeReq = (index) => { onChange(requirements.filter((_, i) => i !== index)); };
  const moveUp = (i) => { if (i === 0) return; const u = [...requirements]; [u[i-1], u[i]] = [u[i], u[i-1]]; onChange(u); };
  const moveDown = (i) => { if (i >= requirements.length - 1) return; const u = [...requirements]; [u[i], u[i+1]] = [u[i+1], u[i]]; onChange(u); };

  const needsOptions = (type) => ['single_select', 'multi_select'].includes(type);

  return (
    <div>
      <h2 className="sv-step-title">Client Requirements</h2>
      <p className="sv-step-desc">Define what information you need from the client before starting work.</p>

      {requirements.map((req, i) => (
        <div key={i} className="sv-faq-item">
          <div className="sv-faq-item-header">
            <span className="sv-faq-num">Q{i + 1}</span>
            <div className="sv-faq-item-actions">
              <button className="pf-btn pf-btn-ghost pf-btn-sm" onClick={() => moveUp(i)} disabled={i === 0} aria-label="Move up"><FiChevronUp size={13} /></button>
              <button className="pf-btn pf-btn-ghost pf-btn-sm" onClick={() => moveDown(i)} disabled={i >= requirements.length - 1} aria-label="Move down"><FiChevronDown size={13} /></button>
              <button className="pf-btn pf-btn-ghost pf-btn-sm" style={{ color: 'var(--pf-destructive)' }} onClick={() => removeReq(i)} aria-label="Remove"><FiTrash2 size={13} /></button>
            </div>
          </div>
          <div className="pf-form-group">
            <input className="pf-input" value={req.question} onChange={e => updateReq(i, 'question', e.target.value)} placeholder="What do you need from the client?" maxLength={200} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="pf-form-group">
              <select className="pf-select" style={{ width: '100%' }} value={req.type} onChange={e => updateReq(i, 'type', e.target.value)}>
                {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <label className="sv-check-label" style={{ paddingTop: 10 }}>
              <input type="checkbox" checked={req.required} onChange={e => updateReq(i, 'required', e.target.checked)} /> Required
            </label>
          </div>
          {needsOptions(req.type) && (
            <div className="pf-form-group">
              <input className="pf-input" value={(req.options || []).join(', ')} onChange={e => updateReq(i, 'options', e.target.value.split(',').map(o => o.trim()).filter(Boolean))} placeholder="Option 1, Option 2, Option 3" />
              <div className="pf-helper">Comma-separated options</div>
            </div>
          )}
          <div className="pf-form-group">
            <input className="pf-input" value={req.helpText || ''} onChange={e => updateReq(i, 'helpText', e.target.value)} placeholder="Help text (optional)" maxLength={200} />
          </div>
        </div>
      ))}

      {requirements.length < 20 && (
        <button className="pf-btn pf-btn-secondary" onClick={addReq}><FiPlus size={14} /> Add Requirement</button>
      )}
      <div className="pf-helper" style={{ marginTop: 8 }}>{requirements.length}/20 requirements</div>
    </div>
  );
};

export default RequirementsBuilder;
