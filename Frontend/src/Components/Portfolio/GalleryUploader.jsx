/* eslint-disable react/prop-types */
import React, { useState, useRef } from 'react';
import { FiPlus, FiX, FiImage } from 'react-icons/fi';
import { toast } from 'sonner';
import * as portfolioApi from '../../services/portfolioApi';

const ACCEPTED = 'image/jpeg,image/png,image/webp';
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_GALLERY = 6;

const GalleryUploader = ({ project, onUpdated }) => {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(null);
  const fileRef = useRef(null);

  const gallery = project?.galleryMedia || [];
  const canAdd = gallery.length < MAX_GALLERY;

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_SIZE) { toast.error('File too large (max 5MB)'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP accepted'); return;
    }
    setUploading(true);
    try {
      await portfolioApi.uploadGallery(project.projectId, file, project.version);
      toast.success('Gallery image added');
      onUpdated();
    } catch (err) { toast.error(portfolioApi.getErrorMessage(err)); }
    finally { setUploading(false); }
  };

  const handleRemove = async (mediaId) => {
    setRemoving(mediaId);
    try {
      await portfolioApi.deleteMedia(project.projectId, mediaId, project.version);
      toast.success('Image removed');
      onUpdated();
    } catch (err) { toast.error(portfolioApi.getErrorMessage(err)); }
    finally { setRemoving(null); }
  };

  return (
    <div>
      <div className="pf-gallery-grid">
        {gallery.map(item => (
          <div key={item.mediaId} className="pf-gallery-item">
            {item.thumbnailUrl || item.detailUrl ? (
              <img src={item.thumbnailUrl || item.detailUrl} alt="Gallery" loading="lazy" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--pf-background)' }}>
                <FiImage color="var(--pf-text-muted)" />
              </div>
            )}
            <button className="pf-gallery-remove" onClick={() => handleRemove(item.mediaId)}
              disabled={removing === item.mediaId} aria-label="Remove image">
              <FiX size={12} />
            </button>
            {removing === item.mediaId && <div className="pf-upload-overlay"><div className="pf-upload-spinner" /></div>}
          </div>
        ))}
        {canAdd && (
          <div className="pf-gallery-add" onClick={() => { if (!uploading) fileRef.current?.click(); }}>
            {uploading ? <div className="pf-upload-spinner" /> : <><FiPlus className="icon" /><span>Add</span></>}
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept={ACCEPTED} hidden onChange={e => handleFile(e.target.files[0])} />
      <div className="pf-helper" style={{ marginTop: 8 }}>{gallery.length}/{MAX_GALLERY} images</div>
    </div>
  );
};

export default GalleryUploader;
