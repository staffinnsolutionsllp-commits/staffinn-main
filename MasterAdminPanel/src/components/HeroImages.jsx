import React, { useState, useEffect } from 'react';
import adminAPI from '../services/adminApi';
import './HeroImages.css';

const HeroImages = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    loadHeroImages();
  }, [activeTab]);

  const loadHeroImages = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getHeroImagesBySection(activeTab);
      if (response.success) {
        setImages(response.data.images || []);
      }
    } catch (error) {
      console.error('Error loading hero images:', error);
      alert('Failed to load hero images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);

    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one image');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await adminAPI.uploadHeroImagesBySection(activeTab, formData);
      
      if (response.success) {
        alert(`${selectedFiles.length} image(s) uploaded successfully! Images will appear on ${activeTab} page within 10 seconds.`);
        setSelectedFiles([]);
        setPreviewUrls([]);
        // Clear preview URLs
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        // Reload images immediately
        await loadHeroImages();
      } else {
        alert('Failed to upload images: ' + response.message);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await adminAPI.deleteHeroImageBySection(activeTab, imageId);
      if (response.success) {
        alert(`Image deleted successfully! ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} page will update within 10 seconds.`);
        await loadHeroImages();
      } else {
        alert('Failed to delete image: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image: ' + error.message);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL hero images? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await adminAPI.deleteAllHeroImagesBySection(activeTab);
      if (response.success) {
        alert(`All images deleted successfully! ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} page will show default image within 10 seconds.`);
        await loadHeroImages();
      } else {
        alert('Failed to delete images: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting all images:', error);
      alert('Failed to delete all images: ' + error.message);
    }
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    // Revoke preview URLs to free memory
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
  };

  if (loading) {
    return <div className="hero-images-loading">Loading hero images...</div>;
  }

  return (
    <div className="hero-images-container">
      <div className="hero-images-header">
        <div>
          <h2>Hero Images Management</h2>
          <p>Upload and manage hero images for different pages. Images will appear as a slideshow if multiple images are uploaded.</p>
        </div>
        <button className="refresh-btn" onClick={loadHeroImages} disabled={loading}>
          {loading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Page Tabs */}
      <div className="page-tabs">
        <button 
          className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          🏠 Home Page
        </button>
        <button 
          className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          👥 Staff Page
        </button>
        <button 
          className={`tab-btn ${activeTab === 'institute' ? 'active' : ''}`}
          onClick={() => setActiveTab('institute')}
        >
          🎓 Institute Page
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recruiter' ? 'active' : ''}`}
          onClick={() => setActiveTab('recruiter')}
        >
          💼 Recruiter Page
        </button>
      </div>

      <div className="hero-images-upload-section">
        <h3>Upload New Images for {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Page</h3>
        <div className="upload-controls">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            id="hero-image-input"
            style={{ display: 'none' }}
          />
          <label htmlFor="hero-image-input" className="select-files-btn">
            Select Images
          </label>
          {selectedFiles.length > 0 && (
            <>
              <button 
                className="upload-btn" 
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image(s)`}
              </button>
              <button className="clear-btn" onClick={clearSelection}>
                Clear
              </button>
            </>
          )}
        </div>

        {previewUrls.length > 0 && (
          <div className="preview-section">
            <h4>Selected Images Preview:</h4>
            <div className="preview-grid">
              {previewUrls.map((url, index) => (
                <div key={index} className="preview-item">
                  <img src={url} alt={`Preview ${index + 1}`} />
                  <span className="preview-name">{selectedFiles[index].name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="hero-images-list-section">
        <div className="list-header">
          <h3>Current Hero Images ({images.length})</h3>
          {images.length > 0 && (
            <button className="delete-all-btn" onClick={handleDeleteAll}>
              Delete All
            </button>
          )}
        </div>

        {images.length === 0 ? (
          <div className="no-images">
            <p>No hero images uploaded yet. Upload images to display them on the home page.</p>
          </div>
        ) : (
          <div className="images-grid">
            {images.map((image, index) => (
              <div key={image.imageId} className="image-card">
                <div className="image-number">#{index + 1}</div>
                <img src={image.url} alt={`Hero ${index + 1}`} />
                <div className="image-info">
                  <span className="upload-date">
                    {new Date(image.uploadedAt).toLocaleDateString()}
                  </span>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(image.imageId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="slideshow-info">
          <p>ℹ️ Multiple images detected. These will display as a slideshow on the home page.</p>
        </div>
      )}
    </div>
  );
};

export default HeroImages;
