import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

const InstituteNews = ({ news, onReadMore }) => {
  const [activeFilter, setActiveFilter] = useState('All');

  if (!news || news.length === 0) return null;

  // Derive real types from actual data — no hardcoded dummies
  const realTypes = ['All', ...Array.from(new Set(news.map(n => n.type).filter(Boolean)))];

  const filteredNews = activeFilter === 'All'
    ? news
    : news.filter(item => item.type === activeFilter);

  const getTypeStyle = (type) => {
    const map = {
      'Achievement': { bg: '#fef3c7', color: '#92400e' },
      'Placement':   { bg: '#d1fae5', color: '#065f46' },
      'Event':       { bg: '#dbeafe', color: '#1e40af' },
      'Campus Event':{ bg: '#dbeafe', color: '#1e40af' },
      'Exam Update': { bg: '#ede9fe', color: '#5b21b6' },
      'Workshop':    { bg: '#ffedd5', color: '#9a3412' },
      'Research':    { bg: '#f3e8ff', color: '#6b21a8' },
      'General':     { bg: '#f3f4f6', color: '#374151' },
    };
    return map[type] || { bg: '#f3f4f6', color: '#374151' };
  };

  const getFilterCount = (type) => {
    if (type === 'All') return news.length;
    return news.filter(item => item.type === type).length;
  };

  return (
    <section
      id="institute"
      style={{
        backgroundColor: 'var(--background)',
        padding: '3rem 0'
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1rem'
        }}
      >
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}
        >
          <GraduationCap size={32} color="var(--editorial-red)" />
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
              fontWeight: 700,
              color: 'var(--foreground)',
              margin: 0
            }}
          >
            Institute Events &amp; Updates
          </h2>
        </motion.div>

        {/* Filter row — dropdowns + pill chips matching screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginBottom: '1.75rem'
          }}
        >
          {/* "All" dropdown stub */}
          <select
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '8px',
              border: '1.5px solid #d1d5db',
              fontSize: '0.875rem',
              fontFamily: "'DM Sans', sans-serif",
              color: '#374151',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option>All</option>
          </select>
          {/* "All time" dropdown stub */}
          <select
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '8px',
              border: '1.5px solid #d1d5db',
              fontSize: '0.875rem',
              fontFamily: "'DM Sans', sans-serif",
              color: '#374151',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option>All time</option>
          </select>

          {/* Pill filters */}
          {realTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.8125rem',
                fontWeight: 600,
                padding: '0.4rem 0.875rem',
                borderRadius: '50px',
                border: 'none',
                backgroundColor: activeFilter === type ? '#0f172a' : '#f3f4f6',
                color: activeFilter === type ? 'white' : '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {type}
            </button>
          ))}
        </motion.div>

        {/* List rows — compact, matching screenshot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filteredNews.map((newsItem, index) => {
            const typeStyle = getTypeStyle(newsItem.type);
            return (
              <motion.article
                key={newsItem.id || index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s ease'
                }}
                className="institute-list-row"
              >
                {/* Thumbnail — small fixed square */}
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    backgroundColor: '#f3f4f6'
                  }}
                >
                  {newsItem.bannerImage ? (
                    <img
                      src={newsItem.bannerImage}
                      alt={newsItem.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem'
                      }}
                    >
                      🏫
                    </div>
                  )}
                </div>

                {/* Main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Institute name + type badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.375rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: '#0f172a'
                      }}
                    >
                      {newsItem.instituteName}
                    </span>
                    {newsItem.type && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: typeStyle.bg,
                          color: typeStyle.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px'
                        }}
                      >
                        {newsItem.type}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '1rem',
                      fontWeight: 700,
                      lineHeight: 1.3,
                      color: '#0f172a',
                      margin: '0 0 0.3rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {newsItem.title}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.8125rem',
                      color: '#6b7280',
                      margin: '0 0 0.375rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {newsItem.description}
                  </p>

                  {/* Date */}
                  {newsItem.date && (
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.75rem',
                        color: '#9ca3af'
                      }}
                    >
                      {newsItem.date}
                    </span>
                  )}
                </div>

                {/* Read More — right side */}
                <button
                  onClick={(e) => { e.stopPropagation(); onReadMore && onReadMore(newsItem); }}
                  style={{
                    flexShrink: 0,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--editorial-red)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Read More ↓
                </button>
              </motion.article>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredNews.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              color: 'var(--text-secondary)'
            }}
          >
            <p>No {activeFilter} updates available at the moment.</p>
          </div>
        )}
      </div>

      <style>{`
        .institute-list-row:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.10) !important;
        }
      `}</style>
    </section>
  );
};

export default InstituteNews;
