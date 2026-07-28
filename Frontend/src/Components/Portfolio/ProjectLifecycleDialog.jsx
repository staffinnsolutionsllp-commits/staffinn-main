/* eslint-disable react/prop-types */
import React, { useEffect, useRef } from 'react';

const dialogConfig = {
  publish: { title: 'Publish this project?', desc: 'It will become visible on your staff profile.', confirmText: 'Publish Project', cls: 'pf-btn-primary' },
  unpublish: { title: 'Move this project back to draft?', desc: 'It will no longer be visible on your profile.', confirmText: 'Unpublish', cls: 'pf-btn-secondary' },
  feature: { title: 'Feature this project?', desc: 'It will appear prominently on your profile.', confirmText: 'Feature', cls: 'pf-btn-primary' },
  unfeature: { title: 'Remove from featured?', desc: 'It will remain published but won\'t be highlighted.', confirmText: 'Unfeature', cls: 'pf-btn-secondary' },
  archive: { title: 'Archive this project?', desc: 'It will be removed from your portfolio but can be restored later.', confirmText: 'Archive', cls: 'pf-btn-secondary' },
  restore: { title: 'Restore this project?', desc: 'It will be moved back to drafts.', confirmText: 'Restore', cls: 'pf-btn-primary' },
  delete: { title: 'Permanently delete this project?', desc: 'This action cannot be undone. All project data including media will be permanently removed.', confirmText: 'Delete Permanently', cls: 'pf-btn-destructive' },
};

const ProjectLifecycleDialog = ({ action, project, loading, onConfirm, onCancel }) => {
  const config = dialogConfig[action] || {};
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const handleEscape = (e) => { if (e.key === 'Escape' && !loading) onCancel(); };
    document.addEventListener('keydown', handleEscape);
    document.body.classList.add('modal-open');
    return () => { document.removeEventListener('keydown', handleEscape); document.body.classList.remove('modal-open'); };
  }, [loading, onCancel]);

  return (
    <div className="pf-modal-overlay" onClick={loading ? undefined : onCancel} role="dialog" aria-modal="true" aria-labelledby="pf-dialog-title">
      <div className="pf-modal" onClick={e => e.stopPropagation()}>
        <div className="pf-modal-header">
          <h3 id="pf-dialog-title">{config.title}</h3>
          <p>{config.desc}</p>
          {project && <p style={{ fontSize: '0.8rem', color: 'var(--pf-text-muted)', marginTop: 8 }}>Project: {project.title}</p>}
        </div>
        <div className="pf-modal-footer">
          <button className="pf-btn pf-btn-ghost" onClick={onCancel} disabled={loading} ref={cancelRef}>Cancel</button>
          <button className={`pf-btn ${config.cls}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectLifecycleDialog;
