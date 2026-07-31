/* eslint-disable react/prop-types */
import React, { useEffect, useRef } from 'react';

const VersionConflictDialog = ({ onReload, onCopy, onDismiss }) => {
  const reloadRef = useRef(null);

  useEffect(() => {
    reloadRef.current?.focus();
    document.body.classList.add('modal-open');
    const handleEsc = (e) => { if (e.key === 'Escape') onDismiss(); };
    document.addEventListener('keydown', handleEsc);
    return () => { document.body.classList.remove('modal-open'); document.removeEventListener('keydown', handleEsc); };
  }, [onDismiss]);

  return (
    <div className="pf-modal-overlay" onClick={onDismiss} role="dialog" aria-modal="true" aria-labelledby="conflict-title">
      <div className="pf-modal" onClick={e => e.stopPropagation()}>
        <div className="pf-modal-header">
          <h3 id="conflict-title">This service was updated in another session</h3>
          <p>A newer saved version is available. Your current unsaved changes have been preserved locally.</p>
        </div>
        <div className="pf-modal-body">
          <p style={{ fontSize: '0.82rem', color: 'var(--pf-text-secondary)', lineHeight: 1.6 }}>
            Choose how to proceed:
          </p>
        </div>
        <div className="pf-modal-footer" style={{ flexWrap: 'wrap', gap: 8 }}>
          <button className="pf-btn pf-btn-ghost" onClick={onDismiss}>Continue Reviewing</button>
          {onCopy && <button className="pf-btn pf-btn-secondary" onClick={onCopy}>Copy My Unsaved Text</button>}
          <button className="pf-btn pf-btn-primary" onClick={onReload} ref={reloadRef}>Reload Latest</button>
        </div>
      </div>
    </div>
  );
};

export default VersionConflictDialog;
