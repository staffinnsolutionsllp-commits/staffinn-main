/* eslint-disable react/prop-types */
import React, { useState, useRef } from 'react';
import { FiUpload, FiTrash2, FiImage } from 'react-icons/fi';
import { toast } from 'sonner';
import * as portfolioApi from '../../services/portfolioApi';

const ACCEPTED = 'image/jpeg,image/png,image/webp';
const MAX_SIZE = 5 * 1024 * 1024;

const CoverUploader = ({ project, onUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const coverUrl = project?.coverMedia?.thumbnailUrl || project?.coverMedia?.detailUrl || null;

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_SIZE) { toast.error('File too large (max 5MB)'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP accepted');
      return;
    }
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      await portfolioApi.uploadCover(project.projectId, file, project.version);
      toast.success('Cover image updated');
      onUploaded();
    } catch (err) {
      toast.error(portfolioApi.getErrorMessage(err));
      setPreview(null);
    } finally { setUploading(false); }
  };

  const handleRemove = async () => {
    if (!project?.coverMedia?.mediaId) return;
    setUploading(true);
    try {
      await portfolioApi.deleteMedia(project.projectId, project.coverMedia.mediaId, project.version);
      toast.success('Cover removed');
      setPreview(null);
      onUploaded();
    } catch (err) { toast.error(portfolioApi.getErrorMessage(err)); }
    finally { setUploading(false); }
  };

  const displayUrl = preview || coverUrl;

  return (
    <div
      className={`pf-cover-uploader ${displayUrl ? 'has-image' : ''}`}
      onClick={() => { if (!displayUrl && !uploading) fileRef.current?.click(); }}
      onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
      onDragOver={e => e.preventDefault()}
    >
      <input ref={fileRef} type="file" accept={ACCEPTED} hidden onChange={e => handleFile(e.target.files[0])} />
      {uploading && <div className="pf-upload-overlay"><div className="pf-upload-spinner" /><span className="pf-upload-text">Uploading...</span></div>}
      {displayUrl ? (
        <>
          <img src={displayUrl} alt="Cover preview" />
          {!uploading && (
            <div className="pf-cover-actions">
              <button className="pf-cover-action-btn" onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} aria-label="Replace cover"><FiUpload size={14} /></button>
              <button className="pf-cover-action-btn" onClick={(e) => { e.stopPropagation(); handleRemove(); }} aria-label="Remove cover"><FiTrash2 size={14} /></button>
            </div>
          )}
        </>
      ) : (
        <div className="pf-upload-placeholder">
          <FiImage className="icon" />
          <span>Drop image or click to upload</span>
          <span style={{ fontSize: '0.72rem' }}>JPEG, PNG, WebP · Max 5MB</span>
        </div>
      )}
    </div>
  );
};

export default CoverUploader;
