import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

export const useLenis = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    // Prevent Lenis from handling scroll events on specific elements
    const preventLenisElements = [
      '.clean-modal-content',
      '.staff-dashboard-sidebar',
      '.recruiter-dashboard-sidebar', 
      '.institute-dashboard-sidebar',
      '.institute-modal-content',
      '.institute-modal-overlay',
      '.institute-modal-form',
      '.registration-popup',
      '.registration-popup-overlay',
      '.login-modal',
      '.popup-overlay',
      '.popup-content'
    ];

    const handleWheel = (e) => {
      const target = e.target.closest(preventLenisElements.join(','));
      const isModalOpen = document.body.classList.contains('modal-open');
      
      if (target || isModalOpen) {
        e.stopPropagation();
        lenis.stop();
        
        // Only restart Lenis if no modal is open
        if (!isModalOpen) {
          setTimeout(() => lenis.start(), 100);
        }
      }
    };

    const handleTouchMove = (e) => {
      const target = e.target.closest(preventLenisElements.join(','));
      const isModalOpen = document.body.classList.contains('modal-open');
      
      if (target || isModalOpen) {
        e.stopPropagation();
        lenis.stop();
        
        // Only restart Lenis if no modal is open
        if (!isModalOpen) {
          setTimeout(() => lenis.start(), 100);
        }
      }
    };

    // Monitor modal state changes
    const modalObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isModalOpen = document.body.classList.contains('modal-open');
          if (isModalOpen) {
            lenis.stop();
          } else {
            lenis.start();
          }
        }
      });
    });

    modalObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    document.addEventListener('wheel', handleWheel, { capture: true });
    document.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      document.removeEventListener('wheel', handleWheel, { capture: true });
      document.removeEventListener('touchmove', handleTouchMove, { capture: true });
      modalObserver.disconnect();
      lenis.destroy();
    };
  }, []);
};