import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { toast } from 'sonner';

const TrendingSection = ({ topics, onTopicClick }) => {
  const [bookmarkedTopics, setBookmarkedTopics] = useState([]);

  if (!topics || topics.length === 0) return null;

  const handleBookmark = (topicId, e) => {
    e.stopPropagation();
    const isBookmarked = bookmarkedTopics.includes(topicId);
    
    if (isBookmarked) {
      setBookmarkedTopics(prev => prev.filter(id => id !== topicId));
      toast.success('Removed from bookmarks');
    } else {
      setBookmarkedTopics(prev => [...prev, topicId]);
      toast.success('Added to bookmarks');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  return (
    <section
      id="all"
      style={{
        borderTop: '1px solid var(--border)',
        padding: '3rem 0',
        backgroundColor: 'var(--background)'
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2.5rem'
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                fontWeight: 700,
                color: 'var(--foreground)',
                marginBottom: '0.5rem'
              }}
            >
              Trending Topics 🔥
            </h2>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '1rem',
                color: 'var(--text-secondary)'
              }}
            >
              What everyone in education and hiring is talking about right now.
            </p>
          </div>

          <a
            href="#all"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--editorial-red)',
              textDecoration: 'none',
              display: 'inline-block'
            }}
            className="view-all-link"
          >
            View All →
          </a>
        </div>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}
          className="trending-grid"
        >
          {topics.map((topic, index) => (
            <motion.div
              key={topic.id}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              onClick={() => onTopicClick && onTopicClick(topic)}
              style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              }}
            >
              {/* Image Container */}
              <div
                style={{
                  position: 'relative',
                  height: '200px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${topic.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transition: 'transform 0.5s ease'
                  }}
                  className="trending-image"
                />

                {/* Gradient Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '70%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
                  }}
                />

                {/* Title Overlay */}
                <h3
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '1.5rem',
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    color: 'white',
                    margin: 0
                  }}
                >
                  {topic.title}
                </h3>

                {/* Bookmark Button */}
                <button
                  onClick={(e) => handleBookmark(topic.id, e)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <Bookmark
                    size={18}
                    color="white"
                    fill={bookmarkedTopics.includes(topic.id) ? 'white' : 'none'}
                  />
                </button>
              </div>

              {/* Description */}
              {topic.description && (
                <div
                  style={{
                    padding: '1.25rem',
                    backgroundColor: 'white'
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      color: 'var(--text-secondary)',
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {topic.description}
                  </p>

                  {/* Tags */}
                  {topic.tags && topic.tags.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginTop: '0.75rem'
                      }}
                    >
                      {(Array.isArray(topic.tags) ? topic.tags.slice(0, 3) : topic.tags.split(',').slice(0, 3)).map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.625rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: 'var(--tag-bg)',
                            color: 'var(--tag-fg)',
                            borderRadius: '20px'
                          }}
                        >
                          {typeof tag === 'string' ? tag.trim() : tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Responsive CSS */}
      <style>{`
        .trending-grid {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .trending-grid::-webkit-scrollbar {
          display: none;
        }

        .trending-image:hover {
          transform: scale(1.1);
        }

        @media (min-width: 1024px) {
          .view-all-link {
            display: inline-block !important;
          }
        }

        @media (max-width: 640px) {
          .trending-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 1rem;
            padding-bottom: 1rem;
          }

          .trending-grid > div {
            min-width: 280px;
            scroll-snap-align: start;
          }
        }
      `}</style>
    </section>
  );
};

export default TrendingSection;
