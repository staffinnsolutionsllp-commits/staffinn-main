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

  const removeTech = (tech) => {
    onChange(technologies.filter(t => t !== tech));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTech(input);
    }
    if (e.key === 'Backspace' && !input && technologies.length > 0) {
      onChange(technologies.slice(0, -1));
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
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) addTech(input); }}
          placeholder={technologies.length === 0 ? 'Type and press Enter...' : ''}
          disabled={technologies.length >= 15}
          aria-label="Add technology"
        />
      </div>
      <div className="pf-helper">{technologies.length}/15 technologies. Press Enter or comma to add.</div>
      {error && <div className="pf-error-text">{error}</div>}
    </div>
  );
};

export default TechnologyInput;
