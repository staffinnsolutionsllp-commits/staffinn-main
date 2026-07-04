import React from 'react';
import { motion } from 'framer-motion';

const NewsHero = ({ hero, onReadMore }) => {
  if (!hero) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '600px',
        borderRadius: '0',
        overflow: 'hidden',
        marginBottom: '4rem',
        marginTop: '-100px'
      }}
    >
      {/* Background Image with Gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${hero.bannerImage || hero.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)'
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          minHeight: '600px',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '4rem 2rem',
          maxWidth: '1280px',
          margin: '0 auto'
        }}
      >
        <div style={{ maxWidth: '900px' }}>
          {/* Category Badge - Exact Screenshot Style */}
          <motion.div variants={itemVariants}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--editorial-red)',
                color: 'white',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.5rem 1rem',
                borderRadius: '50px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '1.5rem'
              }}
            >
              <span style={{ fontSize: '0.625rem' }}>●</span>
              FEATURED TODAY
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={itemVariants}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              color: 'white',
              marginBottom: '1.5rem',
              textShadow: '0 2px 20px rgba(0,0,0,0.3)'
            }}
          >
            {hero.title}
          </motion.h1>

          {/* Excerpt */}
          <motion.p
            variants={itemVariants}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '1.125rem',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '2rem',
              maxWidth: '800px'
            }}
          >
            {hero.excerpt || hero.description?.substring(0, 200)}
          </motion.p>

          {/* Meta Info - Screenshot Style: Avatar + Name · Date · Read Time */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '2rem',
              fontSize: '0.875rem',
              color: 'rgba(255,255,255,0.9)'
            }}
          >
            {/* Author Avatar & Name */}
            {hero.authorAvatar && (
              <img
                src={hero.authorAvatar}
                alt={hero.author}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}
              />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {hero.author && (
                <span style={{ fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                  {hero.author}
                </span>
              )}
              {(hero.publishDate || hero.date) && (
                <>
                  <span style={{ opacity: 0.7 }}>·</span>
                  <span>{hero.publishDate || hero.date}</span>
                </>
              )}
              {hero.readTime && (
                <>
                  <span style={{ opacity: 0.7 }}>·</span>
                  <span>{hero.readTime}</span>
                </>
              )}
            </div>
          </motion.div>

          {/* Tags */}
          {hero.tags && hero.tags.length > 0 && (
            <motion.div
              variants={itemVariants}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '2rem'
              }}
            >
              {(Array.isArray(hero.tags) ? hero.tags : hero.tags.split(',')).map((tag, index) => (
                <span
                  key={index}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    borderRadius: '20px'
                  }}
                >
                  {typeof tag === 'string' ? tag.trim() : tag}
                </span>
              ))}
            </motion.div>
          )}

          {/* CTA Buttons - Screenshot Style: Read Full Article + Share */}
          <motion.div
            variants={itemVariants}
            style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
          >
            <motion.button
              onClick={() => onReadMore && onReadMore(hero)}
              style={{
                backgroundColor: 'white',
                color: 'var(--primary)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '1rem',
                fontWeight: 600,
                padding: '1rem 2rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              whileHover={{
                backgroundColor: 'var(--editorial-red)',
                color: 'white',
                y: -2
              }}
              whileTap={{ scale: 0.98 }}
            >
              Read Full Article
            </motion.button>
            
            <motion.button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href).catch(() => {});
                }
                import('sonner').then(({ toast }) => toast.success('Link copied!')).catch(() => {});
              }}
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '1rem',
                fontWeight: 600,
                padding: '1rem 2rem',
                borderRadius: '8px',
                border: '2px solid white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              whileHover={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                y: -2
              }}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Share
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Responsive Styles */}
      <style>{`
        .news-hero-section {
          min-height: 600px;
        }
        @media (max-width: 768px) {
          .news-hero-section {
            min-height: 500px !important;
          }
        }
        @media (max-width: 640px) {
          .news-hero-section {
            min-height: 420px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default NewsHero;
