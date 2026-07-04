import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Eye, X } from 'lucide-react';

const ExpertInsights = ({ insights }) => {
  const [playingVideo, setPlayingVideo] = useState(null);

  if (!insights || insights.length === 0) return null;

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleVideoClick = (insight) => {
    const videoId = extractYouTubeId(insight.youtubeUrl || insight.videoUrl || insight.youtubeUrl);
    if (videoId) {
      setPlayingVideo({ ...insight, videoId });
    }
  };

  return (
    <>
      <section
        id="experts"
        style={{
          backgroundColor: 'var(--secondary)',
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
            transition={{ duration: 0.6 }}
            style={{
              marginBottom: '2rem'
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                fontWeight: 700,
                color: 'var(--foreground)',
                marginBottom: '0.5rem'
              }}
            >
              Expert Insights
            </h2>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '1rem',
                color: 'var(--text-secondary)'
              }}
            >
              Learn from industry leaders.
            </p>
          </motion.div>

          {/* Insights Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.5rem'
            }}
            className="insights-grid"
          >
            {insights.map((insight, index) => {
              const videoId = extractYouTubeId(insight.youtubeUrl || insight.videoUrl);
              const thumbnail = videoId 
                ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                : insight.thumbnail || insight.image;

              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                  onClick={() => handleVideoClick(insight)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }}
                  className="insight-card"
                >
                  {/* Video Thumbnail */}
                  <div
                    style={{
                      position: 'relative',
                      paddingTop: '56.25%',
                      backgroundColor: 'var(--muted)',
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      src={thumbnail}
                      alt={insight.title || insight.videoTitle}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=450&fit=crop';
                      }}
                    />

                    {/* Dark Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        transition: 'background-color 0.3s ease'
                      }}
                      className="video-overlay"
                    />

                    {/* Play Button — plain div, no motion to avoid layout shift */}
                    <div
                      className="expert-play-btn"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        pointerEvents: 'none'
                      }}
                    >
                      <Play size={24} fill="currentColor" />
                    </div>

                    {/* Duration Badge */}
                    {insight.duration && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '0.75rem',
                          right: '0.75rem',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          borderRadius: '4px'
                        }}
                      >
                        {insight.duration}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '1.25rem' }}>
                    {/* Expert Info */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1rem'
                      }}
                    >
                      {insight.avatar && (
                        <img
                          src={insight.avatar}
                          alt={insight.expertName}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: 'var(--foreground)'
                          }}
                        >
                          {insight.expertName}
                        </div>
                        <div
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {insight.designation}
                          {insight.company && ` · ${insight.company}`}
                        </div>
                      </div>
                    </div>

                    {/* Video Title */}
                    <h3
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        lineHeight: 1.3,
                        color: 'var(--foreground)',
                        marginBottom: '0.75rem'
                      }}
                    >
                      {insight.title || insight.videoTitle || insight.topic}
                    </h3>

                    {/* Footer */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      {insight.views && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <Eye size={14} />
                          {insight.views}
                        </div>
                      )}
                      <span
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--editorial-red)'
                        }}
                      >
                        Watch Now →
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {playingVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPlayingVideo(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '1000px',
                width: '100%',
                position: 'relative',
                backgroundColor: 'black',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setPlayingVideo(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                <X size={20} />
              </button>

              {/* YouTube iFrame */}
              <div style={{ paddingTop: '56.25%', position: 'relative' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${playingVideo.videoId}?autoplay=1`}
                  title={playingVideo.title || playingVideo.videoTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover Effect CSS */}
      <style>{`
        .video-overlay:hover {
          background-color: rgba(0,0,0,0.4);
        }
        .insight-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.15) !important;
        }
        .expert-play-btn {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .insight-card:hover .expert-play-btn {
          transform: translate(-50%, -50%) scale(1.08);
        }
        @media (max-width: 1024px) {
          .insights-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .insights-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
};

export default ExpertInsights;
