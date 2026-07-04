import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Share2, Bookmark } from 'lucide-react';
import { toast } from 'sonner';

const ReaderModal = ({ article: articleProp, newsItem, isOpen, onClose }) => {
  const article = articleProp || newsItem;
  const [scrollProgress, setScrollProgress] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [headings, setHeadings] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Add modal-open so Lenis stops, also lock body scroll
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';

      // Parse headings from content
      if (article?.fullContent || article?.content) {
        const content = article.fullContent || article.content || '';
        const headingMatches = content.match(/##\s+(.+)/g) || [];
        const parsedHeadings = headingMatches.map((h, i) => ({
          id: `heading-${i}`,
          text: h.replace('## ', '').trim()
        }));
        setHeadings(parsedHeadings);
      }

      // Reset scroll to top when opening
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
      setScrollProgress(0);
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    }

    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    };
  }, [isOpen, article]);

  // Track scroll progress inside the modal's own scroll container
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const scrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight - el.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    setScrollProgress(progress);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    toast.success('Link copied to clipboard!');
  };

  const handleBookmark = () => {
    setBookmarked(prev => !prev);
    toast.success(!bookmarked ? 'Added to bookmarks' : 'Removed from bookmarks');
  };

  const renderContent = () => {
    if (!article) return null;
    const content = article.fullContent || article.content || article.description || '';
    if (!content) return null;
    const paragraphs = content.split('\n\n');

    return paragraphs.map((para, index) => {
      if (para.startsWith('## ')) {
        const headingText = para.replace('## ', '').trim();
        return (
          <h2
            key={index}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#0f172a',
              marginTop: '2.5rem',
              marginBottom: '1rem',
            }}
          >
            {headingText}
          </h2>
        );
      }
      if (para.startsWith('- ')) {
        const items = para.split('\n').filter(l => l.startsWith('- '));
        return (
          <ul key={index} style={{ paddingLeft: '1.5rem', marginBottom: '1.25rem' }}>
            {items.map((item, i) => (
              <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1.0625rem', lineHeight: 1.8, color: '#374151', marginBottom: '0.375rem' }}>
                {item.replace('- ', '')}
              </li>
            ))}
          </ul>
        );
      }
      return (
        <p
          key={index}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '1.0625rem',
            lineHeight: 1.85,
            color: '#374151',
            marginBottom: '1.25rem',
          }}
        >
          {para}
        </p>
      );
    });
  };

  if (!article) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — separate from scrollable div so clicks outside close it */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
              zIndex: 9998,
            }}
          />

          {/* Modal panel — full screen, owns its own scroll */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            ref={scrollRef}
            onScroll={handleScroll}
            // data-lenis-prevent tells Lenis to not touch this element's scroll
            data-lenis-prevent
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#fafaf8',
              zIndex: 9999,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Reading Progress Bar */}
            <div
              style={{
                position: 'sticky',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                backgroundColor: '#e5e7eb',
                zIndex: 10001,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${scrollProgress}%`,
                  backgroundColor: '#D72638',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>

            {/* Sticky Header Bar */}
            <div
              style={{
                position: 'sticky',
                top: '3px',
                zIndex: 10000,
                backgroundColor: 'rgba(250,250,248,0.97)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #e5e7eb',
                padding: '0.875rem 2rem',
              }}
            >
              <div
                style={{
                  maxWidth: '900px',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <button
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'transparent',
                    border: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0f172a',
                    cursor: 'pointer',
                    padding: '0.375rem 0',
                  }}
                >
                  <ArrowLeft size={18} />
                  Back
                </button>

                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  <button
                    onClick={handleShare}
                    title="Share"
                    style={{
                      width: '38px', height: '38px', borderRadius: '50%',
                      border: '1px solid #e5e7eb', background: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={handleBookmark}
                    title="Bookmark"
                    style={{
                      width: '38px', height: '38px', borderRadius: '50%',
                      border: '1px solid #e5e7eb',
                      background: bookmarked ? '#D72638' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Bookmark size={16} color={bookmarked ? 'white' : '#374151'} fill={bookmarked ? 'white' : 'none'} />
                  </button>
                  <button
                    onClick={onClose}
                    title="Close"
                    style={{
                      width: '38px', height: '38px', borderRadius: '50%',
                      border: '1px solid #e5e7eb', background: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Article Body */}
            <div
              style={{
                maxWidth: '760px',
                margin: '0 auto',
                padding: '2.5rem 1.5rem 5rem',
              }}
            >
              {/* Banner Image */}
              {(article.bannerImage || article.image) && (
                <img
                  src={article.bannerImage || article.image}
                  alt={article.title}
                  style={{
                    width: '100%',
                    height: '360px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    marginBottom: '2rem',
                    display: 'block',
                  }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}

              {/* Category */}
              {article.category && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: '#D72638',
                  }}>
                    {article.category}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  fontWeight: 800,
                  lineHeight: 1.2,
                  color: '#0f172a',
                  marginBottom: '1.5rem',
                }}
              >
                {article.title}
              </h1>

              {/* Author + meta */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  paddingBottom: '1.5rem',
                  marginBottom: '2rem',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                {article.authorAvatar && (
                  <img
                    src={article.authorAvatar}
                    alt={article.author}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                    {article.author || 'Staffinn Editorial'}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', color: '#6b7280' }}>
                    {article.publishDate || article.date}
                    {(article.readTime) && ` · ${article.readTime}`}
                  </div>
                </div>
              </div>

              {/* Excerpt / lead */}
              {(article.excerpt && article.excerpt !== article.content) && (
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '1.125rem',
                  fontWeight: 500,
                  lineHeight: 1.75,
                  color: '#374151',
                  marginBottom: '2rem',
                  paddingLeft: '1rem',
                  borderLeft: '3px solid #D72638',
                }}>
                  {article.excerpt}
                </p>
              )}

              {/* Full Content */}
              <div>{renderContent()}</div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {(Array.isArray(article.tags) ? article.tags : String(article.tags).split(',')).map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.8125rem',
                          padding: '0.375rem 0.875rem',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          borderRadius: '20px',
                        }}
                      >
                        {typeof tag === 'string' ? tag.trim() : tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReaderModal;
