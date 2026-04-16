import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

const AwardsRecognition = () => {
    const [awards, setAwards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [awardForm, setAwardForm] = useState({
        title: '',
        description: '',
        photos: []
    });
    const [editingAwardId, setEditingAwardId] = useState(null);
    const [photoFiles, setPhotoFiles] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);

    useEffect(() => {
        loadAwards();
    }, []);

    const loadAwards = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAwards();
            if (response.success) {
                setAwards(response.data || []);
            }
        } catch (error) {
            console.error('Error loading awards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + photoFiles.length > 10) {
            alert('Maximum 10 photos allowed');
            return;
        }

        const validFiles = files.filter(file => {
            if (file.size > 5 * 1024 * 1024) {
                alert(`${file.name} is too large. Maximum size is 5MB`);
                return false;
            }
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                alert(`${file.name} is not a valid image type`);
                return false;
            }
            return true;
        });

        setPhotoFiles([...photoFiles, ...validFiles]);

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreviews(prev => [...prev, e.target.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index) => {
        setPhotoFiles(photoFiles.filter((_, i) => i !== index));
        setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!awardForm.title || !awardForm.description) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);

            const submitData = {
                title: awardForm.title,
                description: awardForm.description,
                photos: photoFiles
            };

            let response;
            if (editingAwardId) {
                response = await apiService.updateAward(editingAwardId, submitData);
            } else {
                response = await apiService.addAward(submitData);
            }

            if (response.success) {
                alert(`Award ${editingAwardId ? 'updated' : 'added'} successfully!`);
                resetForm();
                await loadAwards();
            } else {
                alert(response.message || `Failed to ${editingAwardId ? 'update' : 'add'} award`);
            }
        } catch (error) {
            console.error('Error submitting award:', error);
            alert(`Failed to ${editingAwardId ? 'update' : 'add'} award`);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (award) => {
        setAwardForm({
            title: award.title,
            description: award.description,
            photos: []
        });
        setEditingAwardId(award.awardId);
        setPhotoPreviews(award.photos || []);
        setPhotoFiles([]);
    };

    const handleDelete = async (awardId, title) => {
        if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
            try {
                setLoading(true);
                const response = await apiService.deleteAward(awardId);
                if (response.success) {
                    alert('Award deleted successfully!');
                    await loadAwards();
                } else {
                    alert(response.message || 'Failed to delete award');
                }
            } catch (error) {
                console.error('Error deleting award:', error);
                alert('Failed to delete award');
            } finally {
                setLoading(false);
            }
        }
    };

    const resetForm = () => {
        setAwardForm({
            title: '',
            description: '',
            photos: []
        });
        setEditingAwardId(null);
        setPhotoFiles([]);
        setPhotoPreviews([]);
    };

    return (
        <div className="institute-achievements-tab">
            <div className="institute-tab-header">
                <h1>Awards and Recognition</h1>
                <p>Showcase your institute's achievements, awards, and recognitions</p>
            </div>

            <div className="institute-tab-section">
                <h3>{editingAwardId ? 'Edit Award' : 'Add New Award'}</h3>
                <form onSubmit={handleSubmit} className="institute-award-form">
                    <div className="institute-form-group">
                        <label>Award Title *</label>
                        <input
                            type="text"
                            value={awardForm.title}
                            onChange={(e) => setAwardForm({...awardForm, title: e.target.value})}
                            placeholder="Enter award title"
                            required
                        />
                    </div>

                    <div className="institute-form-group">
                        <label>Description *</label>
                        <textarea
                            value={awardForm.description}
                            onChange={(e) => setAwardForm({...awardForm, description: e.target.value})}
                            placeholder="Describe the award and achievement"
                            rows="4"
                            required
                        />
                    </div>

                    <div className="institute-form-group">
                        <label>Photos (Max 10)</label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoChange}
                            disabled={photoFiles.length >= 10}
                        />
                        <div className="photo-previews" style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px'}}>
                            {photoPreviews.map((preview, index) => (
                                <div key={index} style={{position: 'relative', width: '100px', height: '100px'}}>
                                    <img 
                                        src={preview} 
                                        alt={`Preview ${index + 1}`} 
                                        style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px'}}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(index)}
                                        style={{
                                            position: 'absolute',
                                            top: '-5px',
                                            right: '-5px',
                                            background: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            lineHeight: '1'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="institute-form-buttons">
                        <button type="submit" className="institute-primary-button" disabled={loading}>
                            {loading ? 'Saving...' : editingAwardId ? 'Update Award' : 'Add Award'}
                        </button>
                        {editingAwardId && (
                            <button type="button" className="institute-action-button" onClick={resetForm}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="institute-tab-section">
                <h3>Your Awards ({awards.length})</h3>
                {awards.length > 0 ? (
                    <div className="institute-awards-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
                        {awards.map(award => (
                            <div key={award.awardId} className="institute-award-card" style={{border: '1px solid #dee2e6', borderRadius: '8px', padding: '15px', backgroundColor: 'white'}}>
                                <h4 style={{marginBottom: '10px', color: '#2c3e50'}}>{award.title}</h4>
                                <p style={{color: '#6c757d', fontSize: '0.9rem', marginBottom: '10px'}}>{award.description}</p>
                                {award.photos && award.photos.length > 0 && (
                                    <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px'}}>
                                        {award.photos.slice(0, 3).map((photo, index) => (
                                            <img 
                                                key={index}
                                                src={photo} 
                                                alt={`Award ${index + 1}`}
                                                style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px'}}
                                            />
                                        ))}
                                        {award.photos.length > 3 && (
                                            <div style={{width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', borderRadius: '4px', color: '#6c757d'}}>
                                                +{award.photos.length - 3}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                                    <button 
                                        onClick={() => handleEdit(award)}
                                        className="institute-table-action edit"
                                        style={{backgroundColor: '#28a745', color: 'white', padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer'}}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(award.awardId, award.title)}
                                        className="institute-table-action delete"
                                        style={{backgroundColor: '#dc3545', color: 'white', padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer'}}
                                        disabled={loading}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                        <p>No awards added yet. Add your first award above.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AwardsRecognition;
