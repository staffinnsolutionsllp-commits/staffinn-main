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

    // All modal/overlay selectors that should block Lenis
    const modalSelectors = [
      '.clean-modal-content',
      '.institute-modal-content',
      '.institute-modal-overlay',
      '.institute-modal-form',
      '.registration-popup',
      '.registration-popup-overlay',
      '.login-modal',
      '.popup-overlay',
      '.popup-content',
      '.cie-modal-panel',
      '.cie-modal-body',
      '.cie-modal-overlay',
      '.cim-modal',
      '.cim-body',
      '.cim-overlay',
      '.sam-overlay',
      '.sam-modal',
      '.modal-overlay',
      '.student-selection-modal',
      '.pom-overlay',
      '.pom-box',
      '.recruiter-modal-overlay',
      '.recruiter-job-form-modal',
      '.recruiter-job-form',
      '.modern-job-modal-overlay',
      '.modern-job-modal',
    ];

    // Sidebars — should NOT stop lenis (they scroll independently but don't need lenis stopped)
    const sidebarSelectors = [
      '.staff-dashboard-sidebar',
      '.recruiter-dashboard-sidebar',
      '.institute-dashboard-sidebar',
    ];

    const allPreventSelectors = [...modalSelectors, ...sidebarSelectors];

    /** Check if any modal is currently open in the DOM */
    const isAnyModalOpen = () => {
      return modalSelectors.some(sel => document.querySelector(sel) !== null)
        || document.body.classList.contains('modal-open')
        || document.querySelector('[data-lenis-prevent]') !== null;
    };

    /** Safely start Lenis only if no modal is open */
    const tryStartLenis = () => {
      if (!isAnyModalOpen()) {
        lenis.start();
      }
    };

    // --- Wheel handler ---
    const handleWheel = (e) => {
      const onPreventEl = e.target.closest(allPreventSelectors.join(','));
      const onLenisPrevent = e.target.closest('[data-lenis-prevent]');

      if (onPreventEl || onLenisPrevent || document.body.classList.contains('modal-open')) {
        e.stopPropagation();
        lenis.stop();
      }
    };

    // --- Touch handler ---
    const handleTouchMove = (e) => {
      const onPreventEl = e.target.closest(allPreventSelectors.join(','));
      const onLenisPrevent = e.target.closest('[data-lenis-prevent]');

      if (onPreventEl || onLenisPrevent || document.body.classList.contains('modal-open')) {
        e.stopPropagation();
        lenis.stop();
      }
    };

    // --- MutationObserver: watch entire document for modal nodes being added/removed ---
    const domObserver = new MutationObserver(() => {
      if (isAnyModalOpen()) {
        lenis.stop();
      } else {
        // Small delay to let React finish unmounting
        setTimeout(tryStartLenis, 50);
      }
    });

    domObserver.observe(document.body, {
      childList: true,      // modal added/removed from DOM
      subtree: true,        // deep — catch nested portal renders
      attributes: true,     // class changes on body (modal-open)
      attributeFilter: ['class', 'data-lenis-prevent'],
    });

    document.addEventListener('wheel', handleWheel, { capture: true });
    document.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });

    // RAF loop
    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('wheel', handleWheel, { capture: true });
      document.removeEventListener('touchmove', handleTouchMove, { capture: true });
      domObserver.disconnect();
      lenis.destroy();
    };
  }, []);
};
