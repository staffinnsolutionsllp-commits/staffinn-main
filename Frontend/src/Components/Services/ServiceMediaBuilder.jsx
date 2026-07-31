/* eslint-disable react/prop-types */
import React, { useState, useRef } from 'react';
import { FiImage, FiUpload, FiTrash2, FiPlay } from 'react-icons/fi';
import { toast } from 'sonner';
import * as serviceApi from '../../services/serviceApi';

const ACCEPTED = 'image/jpeg,image/png,image/webp';
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_GALLERY = 6;

const ServiceMediaBuilder = ({ serviceId, service, onServiceUpdated }) => {
  const [uploading, setUploading] = useState(false);
  const [removingIdx, setRemovingIdx] = useState(null);
  const coverRef = useRef(null);
  const galleryRef = useRef(null);

  const coverMediaUrl = service?.coverMediaUrl || null;
  const galleryMediaUrls = service?.galleryMediaUrls || [];
  const videoUrl = service?.videoUrl || '';

  const validateFile = (file) => {
    if (!file) return false;
    if (file.size > MAX_SIZE) { toast.error('File too large (max 5MB)'); return false; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Only JPEG, PNG, WebP accepted'); return false; }
    return true;
  };

  const handleCoverUpload = async (file) => {
    if (!validateFile(file) || !serviceId || !service) return;
    setUploading(true);
    try {
      const res = await serviceApi.uploadServiceCover(serviceId, file, service.version);
      if (res.success) { onServiceUpdated(res.data); toast.success('Cover uploaded'); }
    } catch (err) { toast.error(err.message || 'Cover upload failed'); }
    finally { setUploading(false); }
  };

  const handleGalleryUpload = async (file) => {
    if (!validateFile(file) || !serviceId || !service) return;
    if (galleryMediaUrls.length >= MAX_GALLERY) { toast.error('Maximum 6 gallery images'); return; }
    setUploading(true);
    try {
      const res = await serviceApi.uploadServiceGallery(serviceId, file, service.version);
      if (res.success) { onServiceUpdated(res.data); toast.success('Gallery image added'); }
    } catch (err) { toast.error(err.message || 'Gallery upload failed'); }
    finally { setUploading(false); }
  };

  const handleRemoveCover = async () => {
    if (!serviceId || !service) return;
    setUploading(true);
    try {
      const res = await serviceApi.deleteServiceMedia(serviceId, 'cover', '0', service.version);
      if (res.success) { onServiceUpdated(res.data); toast.success('Cover removed'); }
    } catch (err) { toast.error(err.message || 'Remove failed'); }
    finally { setUploading(false); }
  };

  const handleRemoveGallery = async (index) => {
    if (!serviceId || !service) return;
    setRemovingIdx(index);
    try {
      const res = await serviceApi.deleteServiceMedia(serviceId, 'gallery', String(index), service.version);
      if (res.success) { onServiceUpdated(res.data); toast.success('Image removed'); }
    } catch (err) { toast.error(err.message || 'Remove failed'); }
    finally { setRemovingIdx(null); }
  };

  const handleVideoSave = async (url) => {
    if (!serviceId || !service) return;
    try {
      const res = await serviceApi.updateService(serviceId, { videoUrl: url || null }, service.version);
      if (res.success) { onServiceUpdated(res.data); }
    } catch { /* silent — saved with next manual save */ }
  };

  if (!serviceId) {
    return (
      <div>
        <h2 className="sv-step-title">Service Media</h2>
        <div className="pf-section-card" style={{ background: 'var(--pf-primary-light)', borderColor: 'rgba(72,99,247,0.15)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--pf-primary)', margin: 0 }}>💡 Save your service first, then you can upload images.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="sv-step-title">Service Media</h2>
      <p className="sv-step-desc">Add images and video to showcase your service. Images are permanently stored.</p>

      {/* Cover */}
      <div className="pf-form-group">
        <label className="pf-label">Cover Image</label>
        <div className="pf-cover-uploader" style={{ minHeight: 180 }}
          onClick={() => { if (!coverMediaUrl && !uploading) coverRef.current?.click(); }}
          onDrop={e => { e.preventDefault(); handleCoverUpload(e.dataTransfer.files[0]); }}
          onDragOver={e => e.preventDefault()}>
          <input ref={coverRef} type="file" accept={ACCEPTED} hidden onChange={e => handleCoverUpload(e.target.files[0])} />
          {uploading && <div className="pf-upload-overlay"><div className="pf-upload-spinner" /><span className="pf-upload-text">Uploading...</span></div>}
          {coverMediaUrl ? (
            <>
              <img src={coverMediaUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {!uploading && <div className="pf-cover-actions">
                <button className="pf-cover-action-btn" onClick={e => { e.stopPropagation(); coverRef.current?.click(); }} aria-label="Replace"><FiUpload size={14} /></button>
                <button className="pf-cover-action-btn" onClick={e => { e.stopPropagation(); handleRemoveCover(); }} aria-label="Remove"><FiTrash2 size={14} /></button>
              </div>}
            </>
          ) : (
            <div className="pf-upload-placeholder">
              <FiImage className="icon" />
              <span>Drop image or click to upload</span>
              <span style={{ fontSize: '0.72rem' }}>JPEG, PNG, WebP · Max 5MB</span>
            </div>
          )}
        </div>
      </div>

      {/* Gallery */}
      <div className="pf-form-group">
        <label className="pf-label">Gallery Images <span className="pf-helper">(max {MAX_GALLERY})</span></label>
        <div className="pf-gallery-grid">
          {galleryMediaUrls.map((url, i) => (
            <div key={i} className="pf-gallery-item">
              <img src={url} alt={`Gallery ${i + 1}`} />
              <button className="pf-gallery-remove" onClick={() => handleRemoveGallery(i)} disabled={removingIdx === i} aria-label="Remove">
                {removingIdx === i ? '...' : '×'}
              </button>
            </div>
          ))}
          {galleryMediaUrls.length < MAX_GALLERY && (
            <div className="pf-gallery-add" onClick={() => { if (!uploading) galleryRef.current?.click(); }}>
              {uploading ? <div className="pf-upload-spinner" /> : <><FiImage className="icon" /><span>Add</span></>}
            </div>
          )}
        </div>
        <input ref={galleryRef} type="file" accept={ACCEPTED} hidden onChange={e => handleGalleryUpload(e.target.files[0])} />
        <div className="pf-helper">{galleryMediaUrls.length}/{MAX_GALLERY} images</div>
      </div>

      {/* Video */}
      <div className="pf-form-group">
        <label className="pf-label"><FiPlay size={13} /> Video URL (optional)</label>
        <input className="pf-input" defaultValue={videoUrl} onBlur={e => handleVideoSave(e.target.value)} placeholder="https://youtube.com/watch?v=... or Vimeo/Loom" />
        <div className="pf-helper">YouTube, Vimeo, or Loom links only</div>
      </div>
    </div>
  );
};

export default ServiceMediaBuilder;
