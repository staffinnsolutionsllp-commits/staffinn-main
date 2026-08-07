import React from 'react';
import { getTotalExperienceYears } from '../../../utils/staffUtils';

const StaffProfileHero = ({ profile }) => {
  const {
    fullName, professionalTitle, profilePhoto, sector, role,
    state, city, availability, rating, reviewCount, experiences,
    employmentType, isProfileComplete
  } = profile;

  const expYears = getTotalExperienceYears(experiences);
  const initials = (fullName || 'S').charAt(0).toUpperCase();

  return (
    <section className="sp-hero">
      <div className="sp-hero__inner">
        <div className="sp-hero__photo">
          {profilePhoto ? (
            <img src={profilePhoto} alt={fullName} className="sp-hero__img" />
          ) : (
            <div className="sp-hero__initials">{initials}</div>
          )}
          {availability && (
            <span className={`sp-hero__availability sp-hero__availability--${availability}`}>
              {availability.charAt(0).toUpperCase() + availability.slice(1)}
            </span>
          )}
        </div>

        <div className="sp-hero__info">
          <h1 className="sp-hero__name">
            {fullName || 'Staff Professional'}
            {isProfileComplete && (
              <span
                className="sp-hero__blue-tick"
                title="This staff's profile is fully complete"
                aria-label="Profile complete"
              >
                ✔
              </span>
            )}
          </h1>
          {professionalTitle && (
            <p className="sp-hero__title">{professionalTitle}</p>
          )}
          
          <div className="sp-hero__meta">
            {sector && role && (
              <span className="sp-hero__meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                {sector} · {role}
              </span>
            )}
            {(city || state) && (
              <span className="sp-hero__meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {[city, state].filter(Boolean).join(', ')}
              </span>
            )}
            {employmentType && (
              <span className="sp-hero__meta-item sp-hero__employment-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                {employmentType}
              </span>
            )}
          </div>

          <div className="sp-hero__stats">
            <div className="sp-hero__stat">
              <span className="sp-hero__stat-value">
                {rating ? parseFloat(rating).toFixed(1) : '0.0'}
              </span>
              <span className="sp-hero__stat-icon">★</span>
              <span className="sp-hero__stat-label">
                ({reviewCount || 0} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
            {expYears > 0 && (
              <div className="sp-hero__stat">
                <span className="sp-hero__stat-value">{expYears}</span>
                <span className="sp-hero__stat-label">
                  {expYears === 1 ? 'year exp.' : 'years exp.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StaffProfileHero;
