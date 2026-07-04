import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

// Social icons as SVG since lucide-react doesn't have all social icons
const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
  </svg>
);

const NewsletterFooter = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Subscribed!', {
        description: `We'll keep ${email} in the loop.`
      });
      setEmail('');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <footer
      style={{
        backgroundColor: 'var(--primary)',
        color: 'white',
        padding: '4rem 0 2rem'
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1rem'
        }}
      >
        {/* Newsletter Section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '2rem',
            marginBottom: '3rem'
          }}
          className="newsletter-grid"
        >
          {/* Left: Heading & Subhead */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                fontWeight: 700,
                marginBottom: '0.75rem',
                lineHeight: 1.2
              }}
            >
              Stay updated with Staffinn News
            </h2>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '1.125rem',
                color: 'rgba(255, 255, 255, 0.8)',
                maxWidth: '600px'
              }}
            >
              Get the latest news, insights, and job opportunities delivered straight to your inbox. Join thousands of professionals staying ahead.
            </p>
          </motion.div>

          {/* Right: Email Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxWidth: '500px'
            }}
            className="newsletter-form"
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                gap: '0.75rem'
              }}
              className="newsletter-input-wrapper"
            >
              <div
                style={{
                  position: 'relative',
                  flex: 1
                }}
              >
                <Mail
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '1rem 1rem 1rem 3rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '50px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '1rem',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.borderColor = 'var(--editorial-red)';
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: 'var(--editorial-red)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(215, 38, 56, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>

            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0
              }}
            >
              By subscribing, you agree to our Privacy Policy and consent to receive updates.
            </p>
          </motion.form>
        </div>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            margin: '2rem 0'
          }}
        />

        {/* Bottom Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}
        >
          {/* Logo */}
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.5rem',
              fontWeight: 700
            }}
          >
            <span style={{ color: 'white' }}>Staff</span>
            <span style={{ color: 'var(--editorial-red)' }}>inn</span>
          </div>

          {/* Social Icons */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem'
            }}
          >
            {[
              { Icon: TwitterIcon, label: 'Twitter', href: '#' },
              { Icon: LinkedinIcon, label: 'LinkedIn', href: '#' },
              { Icon: FacebookIcon, label: 'Facebook', href: '#' }
            ].map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Icon size={20} />
              </a>
            ))}
          </div>

          {/* Copyright */}
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.6)',
              width: '100%',
              textAlign: 'center',
              marginTop: '1rem'
            }}
            className="copyright"
          >
            © {new Date().getFullYear()} Staffinn. All rights reserved.
          </div>
        </motion.div>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (min-width: 1024px) {
          .newsletter-grid {
            grid-template-columns: 1fr 1fr;
            align-items: center;
          }

          .newsletter-form {
            margin-left: auto;
          }

          .copyright {
            width: auto !important;
            margin-top: 0 !important;
          }
        }

        @media (max-width: 640px) {
          .newsletter-input-wrapper {
            flex-direction: column !important;
          }

          .newsletter-input-wrapper button {
            width: 100%;
          }
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </footer>
  );
};

export default NewsletterFooter;
