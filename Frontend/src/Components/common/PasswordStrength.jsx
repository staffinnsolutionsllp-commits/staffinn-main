/* eslint-disable no-unused-vars */

  /* eslint-disable react/prop-types */
import React from 'react';
import { getPasswordStrength } from '../../services/validation';
import './PasswordStrength.css';

const PasswordStrength = ({ password, showRequirements = true, className = '' }) => {
  const strength = getPasswordStrength(password);

  if (!password) {
    return null;
  }

  return (
    <div className={`password-strength-container ${className}`}>
      {/* Strength Bar */}
      <div className="password-strength-bar">
        <div 
          className="password-strength-fill"
          style={{ 
            width: strength.width,
            backgroundColor: strength.color,
            transition: 'all 0.3s ease'
          }}
        />
      </div>
      
      {/* Strength Label */}
      <div className="password-strength-label">
        <span 
          className="strength-text"
          style={{ color: strength.color }}
        >
          {strength.label}
        </span>
        {strength.score > 0 && (
          <span className="strength-score">
            {strength.score}/5
          </span>
        )}
      </div>

      {/* Requirements List */}
      {showRequirements && strength.feedback.length > 0 && (
        <div className="password-requirements">
          <p className="requirements-title">Password must have:</p>
          <ul className="requirements-list">
            {strength.feedback.map((requirement, index) => (
              <li key={index} className="requirement-item">
                <span className="requirement-icon">•</span>
                {requirement}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Message */}
      {strength.score >= 4 && (
        <div className="password-success">
          <span className="success-icon">✓</span>
          <span className="success-text">Strong password!</span>
        </div>
      )}
    </div>
  );
};

export default PasswordStrength;