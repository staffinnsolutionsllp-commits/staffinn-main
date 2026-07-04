import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, MapPin, Calendar, X } from 'lucide-react';

const RecruiterNews = ({ news }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All time');
  const [selectedItem, setSelectedItem] = useState(null);

  if (!news || news.length === 0) return null;

  // Derive real event types from data — no dummy hardcoded ones
  const realEventTypes = ['All', ...Array.from(new Set(
    news.map(n => n.eventType).filter(Boolean)
  ))];

  const timeFilters = ['All time', 'Today', 'This Week', 'This Month'];

  const filteredNews = news.filter(item => {
    if (activeFilter !== 'All' && item.eventType !== activeFilter) return false;
    if (timeFilter === 'Today') {
      const today = new Date().toDateString();
      return new Date(item.date || item.createdAt).toDateString() === today;
    }
    if (timeFilter === 'This Week') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(item.date || item.createdAt) >= weekAgo;
    }
    if (timeFilter === 'This Month') {
      const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
      return new Date(item.date || item.createdAt) >= monthAgo;
    }
    return true;
  });

  const getEventColor = (eventType) => {
    const t = (eventType || '').toLowerCase();
    if (t.includes('hiring')) return '#ef4444';
    if (t.includes('company')) return '#1e293b';
    if (t.includes('office')) return '#3b82f6';
    if (t.includes('fund')) return '#10b981';
    if (t.includes('partner')) return '#8b5cf6';
    return '#6b7280';
  };

  const getFilterCount = (type) => {
    if (type === 'All') return news.length;
    return news.filter(item => item.eventType === type).length;
  };

  return (
    <>
      <section id="recruiter" style={{ backgroundColor: 'var(--secondary)', padding: '3rem 0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>

          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}
          >
            <Briefcase size={32} color="var(--editorial-red)" />
            <div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
                fontWeight: 700, color: 'var(--foreground)', margin: 0
              }}>
                Recruiter News &amp; Company Updates
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: 0 }}>
                Latest updates from top companies
              </p>
            </div>
          </motion.div>

          {/* Dropdowns */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}
          >
            <select
              style={{ padding: '0.5rem 0.875rem', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.875rem', fontFamily: "'DM Sans', sans-serif", color: '#374151', background: 'white', cursor: 'pointer' }}
              value={activeFilter}
              onChange={e => setActiveFilter(e.target.value)}
            >
              <option>All</option>
              {realEventTypes.filter(t => t !== 'All').map(t => <option key={t}>{t}</option>)}
            </select>
            <select
              style={{ padding: '0.5rem 0.875rem', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.875rem', fontFamily: "'DM Sans', sans-serif", color: '#374151', background: 'white', cursor: 'pointer' }}
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value)}
            >
              {timeFilters.map(f => <option key={f}>{f}</option>)}
            </select>

            {/* Real filter pills — only types that exist in data */}
            {realEventTypes.map(type => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', fontWeight: 600,
                  padding: '0.4rem 0.875rem', borderRadius: '50px', border: 'none',
                  backgroundColor: activeFilter === type ? '#0f172a' : '#f3f4f6',
                  color: activeFilter === type ? 'white' : '#374151',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: '0.375rem'
                }}
              >
                {type}
                <span style={{
                  fontSize: '0.75rem',
                  background: activeFilter === type ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
                  color: activeFilter === type ? 'white' : '#6b7280',
                  borderRadius: '20px', padding: '0 0.4rem'
                }}>
                  {getFilterCount(type)}
                </span>
              </button>
            ))}
          </motion.div>

          {/* Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }} className="recruiter-grid">
            {filteredNews.map((newsItem, index) => (
              <motion.article
                key={newsItem.id || index}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: (index % 3) * 0.06 }}
                style={{
                  backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.07)', cursor: 'pointer',
                  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                  display: 'flex', flexDirection: 'column'
                }}
                className="recruiter-card"
                onClick={() => setSelectedItem(newsItem)}
              >
                {/* Image */}
                <div style={{ position: 'relative', height: '180px', flexShrink: 0, overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                  {newsItem.bannerImage ? (
                    <img
                      src={newsItem.bannerImage}
                      alt={newsItem.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.45s ease' }}
                      className="recruiter-image"
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop'; }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Briefcase size={40} color="#9ca3af" />
                    </div>
                  )}
                  {/* Event type ribbon */}
                  {newsItem.eventType && (
                    <div style={{
                      position: 'absolute', top: '0.75rem', left: '-1.5rem',
                      backgroundColor: getEventColor(newsItem.eventType),
                      color: 'white', fontSize: '0.65rem', fontWeight: 700,
                      padding: '0.35rem 2.5rem',
                      transform: 'rotate(-45deg)', transformOrigin: 'center',
                      textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>
                      {newsItem.eventType}
                    </div>
                  )}
                </div>

                {/* Company logo */}
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  border: '3px solid white', background: newsItem.companyLogo ? 'white' : '#e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginLeft: '1.25rem', marginTop: '-1.5rem', position: 'relative', zIndex: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)', flexShrink: 0,
                  fontSize: '1.25rem', fontWeight: 700, color: '#6b7280'
                }}>
                  {newsItem.companyLogo
                    ? <img src={newsItem.companyLogo} alt={newsItem.companyName} style={{ width: '38px', height: '38px', objectFit: 'contain', borderRadius: '50%' }} onError={e => { e.target.style.display = 'none'; }} />
                    : (newsItem.companyName?.charAt(0) || '?')}
                </div>

                {/* Content */}
                <div style={{ padding: '0.75rem 1.125rem 1.125rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.3rem' }}>
                    {newsItem.companyName}
                  </div>
                  <h3 style={{
                    fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700,
                    lineHeight: 1.35, color: 'var(--foreground)', marginBottom: '0.5rem',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.7em'
                  }}>
                    {newsItem.title}
                  </h3>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', lineHeight: 1.55,
                    color: 'var(--text-secondary)', marginBottom: '0.75rem',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {newsItem.description}
                  </p>

                  <div style={{ flex: 1 }} />

                  {/* Footer meta */}
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
                    {newsItem.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <MapPin size={12} />{newsItem.location}
                      </span>
                    )}
                    {newsItem.date && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Calendar size={12} />{newsItem.date}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedItem(newsItem); }}
                    style={{
                      background: '#0f172a', color: 'white', width: '100%', padding: '0.65rem',
                      borderRadius: '6px', border: 'none', fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#D72638'}
                    onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
                  >
                    View Details
                  </button>
                </div>
              </motion.article>
            ))}
          </div>

          {filteredNews.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <p>No {activeFilter} news available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* View Details Modal */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 24 }}
              transition={{ duration: 0.25 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                pointerEvents: 'none'
              }}
            >
              <div
                onClick={e => e.stopPropagation()}
                data-lenis-prevent
                style={{
                  background: 'white',
                  borderRadius: '14px',
                  width: 'min(680px, 94vw)',
                  maxHeight: '85vh',
                  overflowY: 'auto',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
                  pointerEvents: 'all',
                  position: 'relative'
                }}
              >
              {/* Close */}
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  width: '36px', height: '36px', borderRadius: '50%',
                  border: '1px solid #e5e7eb', background: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 10
                }}
              >
                <X size={16} />
              </button>

              {selectedItem.bannerImage && (
                <img src={selectedItem.bannerImage} alt={selectedItem.title}
                  style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '14px 14px 0 0', display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}

              <div style={{ padding: '1.75rem' }}>
                {selectedItem.eventType && (
                  <span style={{
                    display: 'inline-block', background: getEventColor(selectedItem.eventType),
                    color: 'white', fontSize: '0.6875rem', fontWeight: 700,
                    padding: '0.2rem 0.6rem', borderRadius: '4px',
                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem'
                  }}>
                    {selectedItem.eventType}
                  </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  {selectedItem.companyLogo && (
                    <img src={selectedItem.companyLogo} alt={selectedItem.companyName}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'contain', border: '1px solid #e5e7eb' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.9375rem' }}>{selectedItem.companyName}</div>
                    {selectedItem.location && <div style={{ fontSize: '0.8125rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={12} />{selectedItem.location}</div>}
                  </div>
                </div>

                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3, color: '#0f172a', marginBottom: '1rem' }}>
                  {selectedItem.title}
                </h2>

                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', lineHeight: 1.75, color: '#374151', marginBottom: '1.25rem' }}>
                  {selectedItem.description}
                </p>

                {selectedItem.date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                    <Calendar size={14} />
                    <span>{selectedItem.date}</span>
                  </div>
                )}
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .recruiter-grid { }
        .recruiter-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
          transform: translateY(-3px);
        }
        .recruiter-card:hover .recruiter-image { transform: scale(1.04); }
        @media (max-width: 1024px) { .recruiter-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 640px) { .recruiter-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
};

export default RecruiterNews;
