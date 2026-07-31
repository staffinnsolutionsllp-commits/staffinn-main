/* eslint-disable react/prop-types */
import React from 'react';
import { FiPlus, FiTrash2, FiChevronUp, FiChevronDown } from 'react-icons/fi';

const FAQBuilder = ({ faqs = [], onChange }) => {
  const addFaq = () => {
    if (faqs.length >= 10) return;
    onChange([...faqs, { question: '', answer: '', active: true }]);
  };

  const updateFaq = (index, field, value) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeFaq = (index) => { onChange(faqs.filter((_, i) => i !== index)); };

  const moveUp = (index) => {
    if (index === 0) return;
    const updated = [...faqs];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  };

  const moveDown = (index) => {
    if (index >= faqs.length - 1) return;
    const updated = [...faqs];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  };

  return (
    <div>
      <h2 className="sv-step-title">Frequently Asked Questions</h2>
      <p className="sv-step-desc">Help clients understand your service better.</p>

      {faqs.map((faq, i) => (
        <div key={i} className="sv-faq-item">
          <div className="sv-faq-item-header">
            <span className="sv-faq-num">Q{i + 1}</span>
            <div className="sv-faq-item-actions">
              <button className="pf-btn pf-btn-ghost pf-btn-sm" onClick={() => moveUp(i)} disabled={i === 0} aria-label="Move up"><FiChevronUp size={13} /></button>
              <button className="pf-btn pf-btn-ghost pf-btn-sm" onClick={() => moveDown(i)} disabled={i >= faqs.length - 1} aria-label="Move down"><FiChevronDown size={13} /></button>
              <button className="pf-btn pf-btn-ghost pf-btn-sm" style={{ color: 'var(--pf-destructive)' }} onClick={() => removeFaq(i)} aria-label="Remove"><FiTrash2 size={13} /></button>
            </div>
          </div>
          <div className="pf-form-group">
            <input className="pf-input" value={faq.question} onChange={e => updateFaq(i, 'question', e.target.value)} placeholder="Question" maxLength={200} />
          </div>
          <div className="pf-form-group">
            <textarea className="pf-textarea" rows={3} value={faq.answer} onChange={e => updateFaq(i, 'answer', e.target.value)} placeholder="Answer" maxLength={1000} />
          </div>
        </div>
      ))}

      {faqs.length < 10 && (
        <button className="pf-btn pf-btn-secondary" onClick={addFaq}>
          <FiPlus size={14} /> Add FAQ
        </button>
      )}
      <div className="pf-helper" style={{ marginTop: 8 }}>{faqs.length}/10 FAQs</div>
    </div>
  );
};

export default FAQBuilder;
