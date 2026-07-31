/* eslint-disable react/prop-types */
import React, { useState, useRef } from 'react';
import { FiImage, FiUpload, FiTrash2, FiPlay } from 'react-icons/fi';
import { toast } from 'sonner';

const ACCEPTED = 'image/jpeg,image/png,image/webp';
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_GALLERY = 6;

const ServiceMediaBuilder = ({ coverMediaUrl, galleryMediaUrls = [], videoUrl, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const coverRef = useRef(null);
  const galleryRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return false;
    if (file.size > MAX_SIZE) { toast.error('File too large (max 5MB)'); return false; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Only JPEG, PNG, WebP accepted'); return false; }
    return true;
  };

  const handleCover = (file) => {
    if (!validateFile(file)) return;
    // For now, create object URL for preview. Real upload uses service media endpoint later.
    const url = URL.createObjectURL(file);
    onChange({ coverMediaUrl: url, galleryMediaUrls, videoUrl });
    toast.success('Cover image set');
  };

  const handleGallery = (file) => {
    if (!validateFile(file)) return;
    if (galleryMediaUrls.length >= MAX_GALLERY) { toast.error(`Maximum ${MAX_GALLERY} gallery images`); return; }
    const url = URL.createObjectURL(file);
    onChange({ coverMediaUrl, galleryMediaUrls: [...galleryMediaUrls, url], videoUrl });
    toast.success('Gallery image added');
  };

  const removeGalleryItem = (index) => {
    onChange({ coverMediaUrl, galleryMediaUrls: galleryMediaUrls.filter((_, i) => i !== index), videoUrl });
  };

  const removeCover = () => { onChange({ coverMediaUrl: null, galleryMediaUrls, videoUrl }); };

  const handleVideoChange = (url) => { onChange({ coverMediaUrl, galleryMediaUrls, videoUrl: url }); };

  return (
    <div>
      <h2 className="sv-step-title">Service Media</h2>
      <p className="sv-step-desc">Add images and video to showcase your service.</p>

      {/* Cover Image */}
      <div className="pf-form-group">
        <label className="pf-label">Cover Image</label>
        <div className="pf-cover-uploader" style={{ minHeight: 180 }}
          onClick={() => { if (!coverMediaUrl) coverRef.current?.click(); }}
          onDrop={e => { e.preventDefault(); handleCover(e.dataTransfer.files[0]); }}
          onDragOver={e => e.preventDefault()}>
          <input ref={coverRef} type="file" accept={ACCEPTED} hidden onChange={e => handleCover(e.target.files[0])} />
          {coverMediaUrl ? (
            <>
              <img src={coverMediaUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="pf-cover-actions">
                <button className="pf-cover-action-btn" onClick={e => { e.stopPropagation(); coverRef.current?.click(); }} aria-label="Replace"><FiUpload size={14} /></button>
                <button className="pf-cover-action-btn" onClick={e => { e.stopPropagation(); removeCover(); }} aria-label="Remove"><FiTrash2 size={14} /></button>
              </div>
            </>
          ) : (
            <div className="pf-upload-placeholder">
              <FiImage className="icon" />
              <span>Drop image or click to upload</span>
              <span style={{ fontSize: '0.72rem' }}>JPEG, PNG, WebP · Max 5MB · 16:9 recommended</span>
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
              <button className="pf-gallery-remove" onClick={() => removeGalleryItem(i)} aria-label="Remove">×</button>
            </div>
          ))}
          {galleryMediaUrls.length < MAX_GALLERY && (
            <div className="pf-gallery-add" onClick={() => galleryRef.current?.click()}>
              <FiImage className="icon" /><span>Add</span>
            </div>
          )}
        </div>
        <input ref={galleryRef} type="file" accept={ACCEPTED} hidden onChange={e => handleGallery(e.target.files[0])} />
        <div className="pf-helper">{galleryMediaUrls.length}/{MAX_GALLERY} images</div>
      </div>

      {/* Video URL */}
      <div className="pf-form-group">
        <label className="pf-label"><FiPlay size={13} style={{ marginRight: 4 }} /> Video URL (optional)</label>
        <input className="pf-input" value={videoUrl || ''} onChange={e => handleVideoChange(e.target.value)} placeholder="https://youtube.com/watch?v=... or Vimeo/Loom" />
        <div className="pf-helper">YouTube, Vimeo, or Loom links only</div>
      </div>
    </div>
  );
};

export default ServiceMediaBuilder;
