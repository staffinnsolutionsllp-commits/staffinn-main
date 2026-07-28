/* eslint-disable react/prop-types */
import React from 'react';
import { FiFolder, FiGlobe, FiEdit2, FiStar, FiArchive } from 'react-icons/fi';

const PortfolioStats = ({ stats }) => {
  const items = [
    { label: 'Total', value: stats.total, icon: <FiFolder />, cls: 'total' },
    { label: 'Published', value: stats.published, icon: <FiGlobe />, cls: 'published' },
    { label: 'Drafts', value: stats.drafts, icon: <FiEdit2 />, cls: 'draft' },
    { label: 'Featured', value: stats.featured, icon: <FiStar />, cls: 'featured' },
    { label: 'Archived', value: stats.archived, icon: <FiArchive />, cls: 'archived' },
  ];

  return (
    <div className="pf-stats-grid">
      {items.map(item => (
        <div className="pf-stat-card" key={item.label}>
          <div className={`pf-stat-icon ${item.cls}`}>{item.icon}</div>
          <div className="pf-stat-content">
            <h4>{item.value}</h4>
            <span>{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PortfolioStats;
