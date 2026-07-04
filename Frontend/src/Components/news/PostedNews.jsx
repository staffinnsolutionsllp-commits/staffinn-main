import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const PostedNews = ({ news, onReadMore }) => {
  const [expandedNews, setExpandedNews] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);

  if (!news || news.length === 0) return null;

  const toggleExpand = (newsId) => {
    setExpandedNews(prev =>
      prev.includes(newsId)
        ? prev.filter(id => id !== newsId)
        : [...prev, newsId]
    );
  };

  const handleShare = (newsItem, e) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    toast.success('Link copied to clipboard!');
  };

  const getCategoryColor = (category) => {
    const c = (category || '').toLowerCase();
    if (c === 'editorial') return '#0f172a';
    if (c === 'general') return '#374151';
    if (c === 'recruitment') return '#D72638';
    if (c === 'education') return '#3b82f6';
    if (c === 'ai') return '#8b5cf6';
    return '#0f172a';
  };

  const visibleNews = news.slice(0, visibleCount);
  const hasMore = news.length > visibleCount;

  return (
    <section
      id="editorial"
      style={{ backgroundColor: 'var(--background)', padding: '3rem 0' }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}
        >
          <Newspaper size={32} color="var(--editorial-red)" />
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            fontWeight: 700,
            color: 'var(--foreground)',
            margin: 0
          }}>
            Latest News
          </h2>
        </motion.div>

        {/* Uniform grid — 3 equal columns, cards same height per row */}
        <div className="posted-news-grid">
          {visibleNews.map((newsItem, index) => {
            const isExpanded = expandedNews.includes(newsItem.id);
            return (
              <motion.article
                key={newsItem.id || index}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: (index % 3) * 0.06 }}
                className="news-card"
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                }}
              >
                {/* Share button */}
                <button
                  onClick={(e) => handleShare(newsItem, e)}
                  style={{
                    position: 'absolute', top: '0.875rem', right: '0.875rem',
                    width: '32px', height: '32px', borderRadius: '50%',
                    border: 'none', backgroundColor: 'rgba(255,255,255,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,0.12)', zIndex: 10
                  }}
                >
                  <Share2 size={14} />
                </button>

                {/* Fixed-height image */}
                <div style={{ position: 'relative', height: '200px', flexShrink: 0, overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                  <img
                    src={newsItem.bannerImage || newsItem.image}
                    alt={newsItem.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.45s ease' }}
                    className="news-image"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop';
                    }}
                  />
                  {/* Category badge */}
                  <div style={{
                    position: 'absolute', top: '0.875rem', left: '0.875rem',
                    backgroundColor: getCategoryColor(newsItem.category),
                    color: 'white', fontSize: '0.6875rem', fontWeight: 700,
                    padding: '0.2rem 0.6rem', borderRadius: '4px',
                    textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    {newsItem.category || 'General'}
                  </div>
                </div>

                {/* Card content — flex grow so all cards in a row reach equal height */}
                <div style={{ padding: '1.125rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Title — fixed 2-line clamp so all titles occupy same space */}
                  <h3 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '1.0625rem',
                    fontWeight: 700,
                    lineHeight: 1.35,
                    color: 'var(--foreground)',
                    marginBottom: '0.625rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '2.7em',
                  }}>
                    {newsItem.title}
                  </h3>

                  {/* Excerpt — fixed 2-line clamp */}
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.875rem',
                    lineHeight: 1.55,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.875rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '2.7em',
                  }}>
                    {newsItem.excerpt || newsItem.description}
                  </p>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '0.9rem',
                          lineHeight: 1.75,
                          color: 'var(--foreground)',
                          marginBottom: '0.875rem',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid #f3f4f6'
                        }}>
                          {(newsItem.content || newsItem.fullContent || newsItem.description || '')
                            .split('\n\n')
                            .map((para, idx) => (
                              <p key={idx} style={{ marginBottom: '0.75rem' }}>{para}</p>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Spacer pushes meta + actions to bottom */}
                  <div style={{ flex: 1 }} />

                  {/* Meta */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    fontSize: '0.78rem', color: 'var(--text-secondary)',
                    marginBottom: '0.75rem', flexWrap: 'wrap'
                  }}>
                    {newsItem.author && <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{newsItem.author}</span>}
                    {newsItem.author && newsItem.date && <span>·</span>}
                    {newsItem.date && <span>{newsItem.date}</span>}
                    {newsItem.readTime && <><span>·</span><span>{newsItem.readTime}</span></>}
                  </div>

                  {/* Actions row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      onClick={() => toggleExpand(newsItem.id)}
                      style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
                        fontWeight: 600, color: 'var(--editorial-red)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0
                      }}
                    >
                      {isExpanded ? <><ChevronUp size={15} />Show Less</> : <>Read More <ChevronDown size={15} /></>}
                    </button>

                    {onReadMore && (
                      <button
                        onClick={() => onReadMore(newsItem)}
                        style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
                          fontWeight: 600, color: '#6b7280',
                          background: 'none', border: 'none', cursor: 'pointer',
                          marginLeft: 'auto', padding: 0
                        }}
                      >
                        Full Article →
                      </button>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Load More */}
        {hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginTop: '2.5rem' }}
          >
            <button
              onClick={() => setVisibleCount(prev => prev + 3)}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem',
                fontWeight: 600, color: 'var(--foreground)',
                background: 'white', border: '2px solid var(--border)',
                padding: '0.875rem 2.5rem', borderRadius: '50px', cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--editorial-red)'; e.currentTarget.style.color = 'var(--editorial-red)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--foreground)'; }}
            >
              Load More News
            </button>
          </motion.div>
        )}
      </div>

      <style>{`
        .posted-news-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          align-items: start;
        }
        .news-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
          transform: translateY(-3px);
        }
        .news-card:hover .news-image {
          transform: scale(1.04);
        }
        @media (max-width: 1024px) {
          .posted-news-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .posted-news-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
};

export default PostedNews;
