import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, PenSquare, Menu, X } from 'lucide-react';

const NewsHeader = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('all');

  // Calculate scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { id: 'all', label: 'All News', href: '#all' },
    { id: 'editorial', label: 'Editorial', href: '#editorial' },
    { id: 'recruiter', label: 'Recruiter News', href: '#recruiter' },
    { id: 'institute', label: 'Institute Events', href: '#institute' },
    { id: 'experts', label: 'Expert Insights', href: '#experts' }
  ];

  const handleNavClick = (id, href) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    
    // Smooth scroll to section
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Scroll Progress Bar */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'var(--editorial-red)',
          transformOrigin: 'left',
          transform: `scaleX(${scrollProgress / 100})`,
          zIndex: 9999,
          transition: 'transform 0.1s ease-out'
        }}
      />

      {/* Sticky Header */}
      <header 
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(250, 250, 248, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1rem',
          transition: 'all 0.3s ease'
        }}
      >
        <div 
          style={{
            maxWidth: '1280px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Logo */}
          <Link 
            to="/news" 
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '24px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span style={{ color: '#1A1A1A' }}>Staff</span>
            <span style={{ color: 'var(--editorial-red)' }}>inn</span>
          </Link>

          {/* Desktop Navigation */}
          <nav 
            style={{
              display: 'none',
              gap: '2rem',
              alignItems: 'center'
            }}
            className="desktop-nav"
          >
            {navLinks.map(link => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.id, link.href);
                }}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                  fontWeight: 500,
                  color: activeSection === link.id ? 'var(--foreground)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--foreground)'}
                onMouseLeave={(e) => {
                  if (activeSection !== link.id) {
                    e.target.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Search Button */}
            <button
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Search"
            >
              <Search size={20} color="var(--foreground)" />
            </button>

            {/* Post News CTA - Desktop */}
            <Link
              to="/admin/news"
              className="post-news-cta"
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderRadius: '50px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--editorial-red)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <PenSquare size={16} />
              Post News
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-toggle"
              style={{
                display: 'none',
                width: '40px',
                height: '40px',
                border: 'none',
                backgroundColor: 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '64px',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'var(--background)',
              zIndex: 999,
              overflowY: 'auto'
            }}
          >
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                padding: '2rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.id, link.href);
                  }}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '2rem',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    textDecoration: 'none',
                    padding: '1rem 0',
                    borderBottom: index < navLinks.length - 1 ? '1px solid var(--border)' : 'none'
                  }}
                >
                  {link.label}
                </motion.a>
              ))}

              {/* Mobile Post News CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.05 }}
                style={{ marginTop: '2rem' }}
              >
                <Link
                  to="/admin/news"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    borderRadius: '50px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '16px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    width: '100%'
                  }}
                >
                  <PenSquare size={20} />
                  Post News
                </Link>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive CSS */}
      <style>{`
        @media (min-width: 1024px) {
          .desktop-nav {
            display: flex !important;
          }
          .post-news-cta {
            display: flex !important;
          }
          .mobile-menu-toggle {
            display: none !important;
          }
        }
        
        @media (max-width: 1023px) {
          .mobile-menu-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
};

export default NewsHeader;
