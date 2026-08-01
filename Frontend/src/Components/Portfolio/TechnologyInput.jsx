/* eslint-disable react/prop-types */
import React, { useState, useRef } from 'react';
import { FiX } from 'react-icons/fi';

const TechnologyInput = ({ technologies = [], onChange, error }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const addTech = (value) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 40) return;
    if (technologies.includes(trimmed)) return;
    if (technologies.length >= 15) return;
    onChange([...technologies, trimmed]);
    setInput('');
  };

  const addMultiple = (text) => {
    const items = text.split(',').map(s => s.trim()).filter(s => s && s.length <= 40);
    const newTechs = [...technologies];
    for (const item of items) {
      if (newTechs.length >= 15) break;
      if (!newTechs.includes(item)) newTechs.push(item);
    }
    onChange(newTechs);
    setInput('');
  };

  const removeTech = (tech) => {
    onChange(technologies.filter(t => t !== tech));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (input.includes(',')) {
        addMultiple(input);
      } else {
        addTech(input);
      }
    }
    if (e.key === 'Backspace' && !input && technologies.length > 0) {
      onChange(technologies.slice(0, -1));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    if (pasted.includes(',')) {
      addMultiple(pasted);
    } else {
      setInput(prev => prev + pasted);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    // If user types a comma, immediately add what's before it
    if (val.includes(',')) {
      addMultiple(val);
    } else {
      setInput(val);
    }
  };

  return (
    <div>
      <div className="pf-tags-container" onClick={() => inputRef.current?.focus()}>
        {technologies.map(tech => (
          <span className="pf-tag" key={tech}>
            {tech}
            <button className="pf-tag-remove" onClick={() => removeTech(tech)} aria-label={`Remove ${tech}`}>
              <FiX size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="pf-tag-input"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => { if (input.trim()) { if (input.includes(',')) addMultiple(input); else addTech(input); } }}
          placeholder={technologies.length === 0 ? 'Type and press Enter, or paste comma-separated...' : ''}
          disabled={technologies.length >= 15}
          aria-label="Add technology"
        />
      </div>
      <div className="pf-helper">{technologies.length}/15 technologies. Press Enter, comma, or paste comma-separated list.</div>
      {error && <div className="pf-error-text">{error}</div>}
    </div>
  );
};

export default TechnologyInput;
