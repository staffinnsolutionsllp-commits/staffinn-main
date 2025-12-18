import React, { useState, useEffect } from 'react';
import { createTrainingCenter, updateTrainingCenter, getTrainingCenters, deleteTrainingCenter } from '../../services/api';
import { useStateCityAPI } from '../../hooks/useStateCityAPI';
import './TrainingCenterDetails.css';

const TrainingCenterDetails = () => {
  const [formData, setFormData] = useState({
    trainingCentreName: '',
    stateUT: '',
    city: '',
    tehsilMandalBlock: '',
    address: '',
    pincode: '',
    subDistrict: '',
    landmark: '',
    typeOfBuilding: ''
  });
  const [centers, setCenters] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { states, cities, handleStateChange, handleCityChange } = useStateCityAPI();

  useEffect(() => {
    console.log('Component mounted, fetching centers...');
    fetchCenters();
  }, []);

  useEffect(() => {
    console.log('Centers state updated:', centers);
  }, [centers]);

  const fetchCenters = async () => {
    try {
      console.log('fetchCenters called');
      console.log('Calling getTrainingCenters API...');
      const response = await getTrainingCenters();
      console.log('getTrainingCenters response:', response);
      if (response && response.success && response.data) {
        console.log('Setting centers:', response.data);
        setCenters(response.data);
      } else {
        console.log('No data or failed, setting empty array');
        setCenters([]);
      }
    } catch (error) {
      console.error('fetchCenters error:', error);
      setCenters([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'stateUT') {
      const selectedStateObj = states.find(s => s.name === value);
      if (selectedStateObj) {
        handleStateChange(selectedStateObj.iso2);
      }
      setFormData({ ...formData, stateUT: value, city: '' });
    } else if (name === 'city') {
      handleCityChange(value);
      setFormData({ ...formData, city: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = editingId 
        ? await updateTrainingCenter(editingId, formData)
        : await createTrainingCenter(formData);
      
      if (response && response.success) {
        alert(editingId ? 'Training center updated!' : 'Training center created!');
        resetForm();
        await fetchCenters();
      } else {
        alert(response?.message || 'Operation failed');
      }
    } catch (error) {
      alert('Operation failed');
    }
    setLoading(false);
  };

  const handleEdit = (center) => {
    setFormData(center);
    setEditingId(center.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this training center?')) {
      const response = await deleteTrainingCenter(id);
      if (response.success) {
        alert('Training center deleted!');
        fetchCenters();
      }
    }
  };

  const resetForm = () => {
    setFormData({ trainingCentreName: '', stateUT: '', city: '', tehsilMandalBlock: '', address: '', pincode: '', subDistrict: '', landmark: '', typeOfBuilding: '' });
    setEditingId(null);
  };

  return (
    <div className="training-center-container">
      <h2>Training Center Details</h2>
      <form onSubmit={handleSubmit} className="training-center-form">
        <input name="trainingCentreName" value={formData.trainingCentreName} onChange={handleChange} placeholder="Training Centre Name *" required />
        <select name="stateUT" value={formData.stateUT} onChange={handleChange} required>
          <option value="">Select State/UT *</option>
          {states.map(state => (
            <option key={state.iso2} value={state.name}>{state.name}</option>
          ))}
        </select>
        <select name="city" value={formData.city} onChange={handleChange} required disabled={!formData.stateUT}>
          <option value="">Select City *</option>
          {cities.map(city => (
            <option key={city.id} value={city.name}>{city.name}</option>
          ))}
        </select>
        <input name="tehsilMandalBlock" value={formData.tehsilMandalBlock} onChange={handleChange} placeholder="Tehsil / Mandal / Block *" required />
        <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Address *" required />
        <input name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Pincode *" required />
        <input name="subDistrict" value={formData.subDistrict} onChange={handleChange} placeholder="Sub District" />
        <input name="landmark" value={formData.landmark} onChange={handleChange} placeholder="Landmark" />
        <select name="typeOfBuilding" value={formData.typeOfBuilding} onChange={handleChange} required>
          <option value="">Type of Building *</option>
          <option value="Owned">Owned</option>
          <option value="Leased">Leased</option>
        </select>
        <div className="form-actions">
          <button type="submit" disabled={loading}>{editingId ? 'Update' : 'Create'}</button>
          {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <div className="centers-list">
        <h3>List of Centers <button onClick={fetchCenters} style={{marginLeft: '10px', padding: '5px 10px'}}>Refresh</button></h3>
        <p style={{fontSize: '12px', color: '#999'}}>Total centers: {centers.length}</p>
        {centers.length === 0 ? (
          <p style={{textAlign: 'center', color: '#666', padding: '20px'}}>No training centers added yet. Click Refresh to load.</p>
        ) : (
          <table className="centers-table">
            <thead>
              <tr>
                <th>Training Centre Name</th>
                <th>State/UT</th>
                <th>City</th>
                <th>Tehsil / Mandal / Block</th>
                <th>Address</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {centers.map(center => (
                <tr key={center.id}>
                  <td>{center.trainingCentreName}</td>
                  <td>{center.stateUT}</td>
                  <td>{center.city || center.district}</td>
                  <td>{center.tehsilMandalBlock}</td>
                  <td>{center.address}</td>
                  <td>
                    <button onClick={() => handleEdit(center)} className="edit-btn">Edit</button>
                    <button onClick={() => handleDelete(center.id)} className="delete-btn">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TrainingCenterDetails;
