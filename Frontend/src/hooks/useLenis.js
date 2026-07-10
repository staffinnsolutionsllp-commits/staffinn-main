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

    // Selectors inside which Lenis scroll should be blocked
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

    const selectorString = preventLenisElements.join(',');

    const handleWheel = (e) => {
      const onModal = e.target.closest(selectorString);
      const onLenisPrevent = e.target.closest('[data-lenis-prevent]');
      const isModalOpen = document.body.classList.contains('modal-open');

      if (onModal || onLenisPrevent || isModalOpen) {
        e.stopPropagation();
        lenis.stop();
        // Restart after a short delay only when scrolled outside a modal
        setTimeout(() => {
          const stillOnModal = document.querySelector(selectorString);
          const stillModalOpen = document.body.classList.contains('modal-open');
          if (!stillOnModal && !stillModalOpen) {
            lenis.start();
          }
        }, 200);
      }
    };

    const handleTouchMove = (e) => {
      const onModal = e.target.closest(selectorString);
      const onLenisPrevent = e.target.closest('[data-lenis-prevent]');
      const isModalOpen = document.body.classList.contains('modal-open');

      if (onModal || onLenisPrevent || isModalOpen) {
        e.stopPropagation();
        lenis.stop();
        setTimeout(() => {
          const stillOnModal = document.querySelector(selectorString);
          const stillModalOpen = document.body.classList.contains('modal-open');
          if (!stillOnModal && !stillModalOpen) {
            lenis.start();
          }
        }, 200);
      }
    };

    // Watch body class changes (modal-open) only
    const classObserver = new MutationObserver(() => {
      // Do NOT stop Lenis on modal-open — modals use data-lenis-prevent internally
      // Lenis stopping was breaking click events on portaled modals
    });

    classObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
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
      classObserver.disconnect();
      lenis.destroy();
    };
  }, []);
};
