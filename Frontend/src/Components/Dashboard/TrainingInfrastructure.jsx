import React, { useState, useEffect } from 'react';
import { getTrainingCenters } from '../../services/api';
import { createTrainingInfrastructure, getTrainingInfrastructures, updateTrainingInfrastructure, deleteTrainingInfrastructure, uploadInfrastructurePhotos } from '../../services/trainingInfrastructureApi';
import './TrainingInfrastructure.css';

const TrainingInfrastructure = () => {
  const [centers, setCenters] = useState([]);
  const [infrastructures, setInfrastructures] = useState([]);
  const [formData, setFormData] = useState({
    trainingCenterId: '',
    trainingCenterName: '',
    totalArea: '',
    totalTrainingHours: '',
    workingHours: '',
    totalClassrooms: '',
    totalLabs: '',
    washroomsMale: '',
    washroomsFemale: '',
    washroomsDifferentlyAbled: '',
    drinkingWaterFacilities: '',
    firstAidAvailability: '',
    fireFightingEquipment: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [showPhotos, setShowPhotos] = useState({});
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchCenters();
    fetchInfrastructures();
  }, []);

  const fetchCenters = async () => {
    const response = await getTrainingCenters();
    if (response.success) setCenters(response.data);
  };

  const fetchInfrastructures = async () => {
    const response = await getTrainingInfrastructures();
    if (response.success) setInfrastructures(response.data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'trainingCenterId') {
      const selectedCenter = centers.find(c => c.id === value);
      setFormData({ ...formData, trainingCenterId: value, trainingCenterName: selectedCenter?.trainingCentreName || '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const response = editingId 
      ? await updateTrainingInfrastructure(editingId, formData)
      : await createTrainingInfrastructure(formData);
    
    if (response.success) {
      // If creating new infrastructure and have pending photos, upload them
      if (!editingId && pendingPhotos.length > 0) {
        const uploadResponse = await uploadInfrastructurePhotos(response.data.id, pendingPhotos);
        if (!uploadResponse.success) {
          alert('Infrastructure created but photo upload failed: ' + uploadResponse.message);
        }
      }
      alert(editingId ? 'Infrastructure updated!' : 'Infrastructure created!');
      resetForm();
      fetchInfrastructures();
    } else {
      alert(response.message || 'Operation failed');
    }
    setLoading(false);
  };

  const handleEdit = (infra) => {
    setFormData(infra);
    setEditingId(infra.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this infrastructure?')) {
      const response = await deleteTrainingInfrastructure(id);
      if (response.success) {
        alert('Infrastructure deleted!');
        fetchInfrastructures();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      trainingCenterId: '', trainingCenterName: '', totalArea: '', totalTrainingHours: '',
      workingHours: '', totalClassrooms: '', totalLabs: '', washroomsMale: '',
      washroomsFemale: '', washroomsDifferentlyAbled: '', drinkingWaterFacilities: '',
      firstAidAvailability: '', fireFightingEquipment: ''
    });
    setEditingId(null);
    setSelectedFiles([]);
    setPendingPhotos([]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    if (!editingId) {
      setPendingPhotos(files);
    }
  };

  const handlePhotoUpload = async (infrastructureId) => {
    if (selectedFiles.length === 0) {
      alert('Please select photos to upload');
      return;
    }

    setUploadingPhotos(infrastructureId);
    const response = await uploadInfrastructurePhotos(infrastructureId, selectedFiles);
    
    if (response.success) {
      alert('Photos uploaded successfully!');
      setSelectedFiles([]);
      fetchInfrastructures();
    } else {
      alert(response.message || 'Failed to upload photos');
    }
    setUploadingPhotos(null);
  };

  const togglePhotos = (infrastructureId) => {
    setShowPhotos(prev => ({
      ...prev,
      [infrastructureId]: !prev[infrastructureId]
    }));
  };

  const openPhotoModal = (photo) => {
    setSelectedPhoto(photo);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  return (
    <div className="training-infrastructure-container">
      <h2>Training Infrastructure</h2>
      <form onSubmit={handleSubmit} className="infrastructure-form">
        <div className="form-row">
          <label>Select Training Center *</label>
          <select name="trainingCenterId" value={formData.trainingCenterId} onChange={handleChange} required>
            <option value="">Select Center</option>
            {centers.map(c => <option key={c.id} value={c.id}>{c.trainingCentreName}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label>Total Area of the Infrastructure (in Sq.ft) *</label>
          <input name="totalArea" value={formData.totalArea} onChange={handleChange} placeholder="5000" required />
        </div>
        <div className="form-row">
          <label>Total Training Hours (per day) *</label>
          <input name="totalTrainingHours" value={formData.totalTrainingHours} onChange={handleChange} placeholder="Please enter training hours per day" required />
        </div>
        <div className="form-row">
          <label>Working Hours (per day) *</label>
          <input name="workingHours" value={formData.workingHours} onChange={handleChange} placeholder="Please enter total working hours in a day" required />
        </div>
        <div className="form-row">
          <label>Total No. of Classrooms *</label>
          <input name="totalClassrooms" value={formData.totalClassrooms} onChange={handleChange} placeholder="2" required />
        </div>
        <div className="form-row">
          <label>Total No. of Labs *</label>
          <input name="totalLabs" value={formData.totalLabs} onChange={handleChange} placeholder="4" required />
        </div>
        <div className="form-row">
          <label>No. of Washrooms for Female *</label>
          <input name="washroomsFemale" value={formData.washroomsFemale} onChange={handleChange} placeholder="1" required />
        </div>
        <div className="form-row">
          <label>No. of Washrooms for Male *</label>
          <input name="washroomsMale" value={formData.washroomsMale} onChange={handleChange} placeholder="1" required />
        </div>
        <div className="form-row">
          <label>No. of Washrooms for Differently Abled *</label>
          <input name="washroomsDifferentlyAbled" value={formData.washroomsDifferentlyAbled} onChange={handleChange} placeholder="1" required />
        </div>
        <div className="form-row">
          <label>No. of Drinking Water Facility *</label>
          <input name="drinkingWaterFacilities" value={formData.drinkingWaterFacilities} onChange={handleChange} placeholder="1" required />
        </div>
        <div className="form-row">
          <label>Availability of the First Aid Kit *</label>
          <select name="firstAidAvailability" value={formData.firstAidAvailability} onChange={handleChange} required>
            <option value="">Yes</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div className="form-row">
          <label>Availability of the Fire Fighting Equipment *</label>
          <select name="fireFightingEquipment" value={formData.fireFightingEquipment} onChange={handleChange} required>
            <option value="">Yes</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div className="form-row">
          <label>Upload Infrastructure Photos (Optional)</label>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleFileSelect}
          />
          {selectedFiles.length > 0 && (
            <p style={{fontSize: '12px', color: '#28a745', marginTop: '5px'}}>
              {selectedFiles.length} photo(s) selected {!editingId ? '- will be uploaded after creating infrastructure' : ''}
            </p>
          )}
          {editingId && (
            <button 
              type="button"
              onClick={() => handlePhotoUpload(editingId)}
              disabled={uploadingPhotos === editingId || selectedFiles.length === 0}
              className="upload-btn"
            >
              {uploadingPhotos === editingId ? 'Uploading...' : 'Upload Photos'}
            </button>
          )}
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>{editingId ? 'Update' : 'Submit'}</button>
          {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <div className="infrastructure-list">
        <h3>List of Infrastructure Centers</h3>
        {infrastructures.length === 0 ? (
          <p>No infrastructure added yet.</p>
        ) : (
          <table className="infrastructure-table">
            <thead>
              <tr>
                <th>Training Center Name</th>
                <th>Total Area (Sq.ft)</th>
                <th>Training Hours/day</th>
                <th>Working Hours/day</th>
                <th>Classrooms</th>
                <th>Labs</th>
                <th>Photos</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {infrastructures.map(infra => (
                <React.Fragment key={infra.id}>
                  <tr>
                    <td>{infra.trainingCenterName}</td>
                    <td>{infra.totalArea}</td>
                    <td>{infra.totalTrainingHours}</td>
                    <td>{infra.workingHours}</td>
                    <td>{infra.totalClassrooms}</td>
                    <td>{infra.totalLabs}</td>
                    <td>
                      <button 
                        onClick={() => togglePhotos(infra.id)} 
                        className="view-photos-btn"
                      >
                        View Photos ({(infra.photos || []).length})
                      </button>
                    </td>
                    <td>
                      <button onClick={() => handleEdit(infra)} className="edit-btn">Edit</button>
                      <button onClick={() => handleDelete(infra.id)} className="delete-btn">Delete</button>
                    </td>
                  </tr>
                  {showPhotos[infra.id] && (
                    <tr>
                      <td colSpan="8">
                        <div className="photos-gallery">
                          <h4>Infrastructure Photos</h4>
                          {(infra.photos || []).length === 0 ? (
                            <p>No photos uploaded yet.</p>
                          ) : (
                            <div className="photos-grid">
                              {infra.photos.map((photo, index) => (
                                <div key={index} className="photo-item">
                                  <img 
                                    src={photo.url} 
                                    alt={photo.filename} 
                                    onClick={() => openPhotoModal(photo)}
                                    style={{cursor: 'pointer'}}
                                  />
                                  <p>{photo.filename}</p>
                                  <small>Uploaded: {new Date(photo.uploadedAt).toLocaleDateString()}</small>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="photo-modal" onClick={closePhotoModal}>
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="photo-modal-close" onClick={closePhotoModal}>&times;</button>
            <img src={selectedPhoto.url} alt={selectedPhoto.filename} className="photo-modal-image" />
            <div className="photo-modal-info">
              <h4>{selectedPhoto.filename}</h4>
              <p>Uploaded: {new Date(selectedPhoto.uploadedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingInfrastructure;
