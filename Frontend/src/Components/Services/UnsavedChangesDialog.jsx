/* eslint-disable react/prop-types */
import React, { useEffect, useRef } from 'react';

const UnsavedChangesDialog = ({ onStay, onDiscard }) => {
  const stayRef = useRef(null);

  useEffect(() => {
    stayRef.current?.focus();
    document.body.classList.add('modal-open');
    const handleEsc = (e) => { if (e.key === 'Escape') onStay(); };
    document.addEventListener('keydown', handleEsc);
    return () => { document.body.classList.remove('modal-open'); document.removeEventListener('keydown', handleEsc); };
  }, [onStay]);

  return (
    <div className="pf-modal-overlay" onClick={onStay} role="dialog" aria-modal="true" aria-labelledby="unsaved-title">
      <div className="pf-modal" onClick={e => e.stopPropagation()}>
        <div className="pf-modal-header">
          <h3 id="unsaved-title">You have unsaved changes</h3>
          <p>Leaving now will discard changes that have not been saved.</p>
        </div>
        <div className="pf-modal-footer">
          <button className="pf-btn pf-btn-destructive" onClick={onDiscard}>Discard Changes</button>
          <button className="pf-btn pf-btn-primary" onClick={onStay} ref={stayRef}>Continue Editing</button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesDialog;
