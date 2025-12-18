import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminApi';
import './StaffinnPartnerTrainingCenters.css';

const StaffinnPartnerTrainingCenters = () => {
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [trainingCenters, setTrainingCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInstitutes();
  }, []);

  const loadInstitutes = async () => {
    try {
      const response = await adminAPI.getStaffinnPartnerInstitutes();
      if (response.success) {
        setInstitutes(response.data);
      }
    } catch (error) {
      console.error('Error loading institutes:', error);
    }
  };

  const loadTrainingCenters = async (instituteId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await adminAPI.getInstituteTrainingCenters(instituteId);
      if (response.success) {
        setTrainingCenters(response.data);
      } else {
        setError('Failed to load training centers');
      }
    } catch (error) {
      setError(error.message || 'Failed to load training centers');
    } finally {
      setLoading(false);
    }
  };

  const handleInstituteChange = (e) => {
    const instituteId = e.target.value;
    setSelectedInstitute(instituteId);
    if (instituteId) {
      loadTrainingCenters(instituteId);
    } else {
      setTrainingCenters([]);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      if (type === 'center') {
        await adminAPI.deleteTrainingCenter(id);
      }
      // Reload data
      if (selectedInstitute) {
        loadTrainingCenters(selectedInstitute);
      }
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
  };

  return (
    <div className="staffinn-partner-training-centers-container">
      <div className="page-header">
        <h1 className="page-title">Training Center Details</h1>
        <p className="page-subtitle">View training center details for Staffinn Partner institutes</p>
      </div>

      <div className="institute-selector">
        <label htmlFor="institute-select">Select Staffinn Partner Institute:</label>
        <select 
          id="institute-select"
          value={selectedInstitute} 
          onChange={handleInstituteChange}
          className="institute-dropdown"
        >
          <option value="">-- Select Institute --</option>
          {institutes.map((institute) => (
            <option key={institute.instituteId} value={institute.instituteId}>
              {institute.instituteName}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading training centers...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {trainingCenters.length > 0 && !loading && (
        <div className="training-centers-content">
          <div className="content-header">
            <h2>Training Centers</h2>
            <p>List of training centers for {institutes.find(i => i.instituteId === selectedInstitute)?.instituteName}</p>
          </div>

          <div className="centers-table-container">
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
                {trainingCenters.map((center, index) => (
                  <tr key={center.id || index}>
                    <td>{center.trainingCentreName}</td>
                    <td>{center.stateUT}</td>
                    <td>{center.city || center.district}</td>
                    <td>{center.tehsilMandalBlock}</td>
                    <td>{center.address}</td>
                    <td>
                      <button className="delete-btn" onClick={() => handleDelete(center.id, 'center')}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedInstitute && trainingCenters.length === 0 && !loading && !error && (
        <div className="no-data">
          <h3>No Training Centers Found</h3>
          <p>This institute has not added any training centers yet.</p>
        </div>
      )}

      {!selectedInstitute && !loading && (
        <div className="no-selection">
          <h3>Select an Institute</h3>
          <p>Please select a Staffinn Partner institute from the dropdown above to view their training centers.</p>
        </div>
      )}
    </div>
  );
};

export default StaffinnPartnerTrainingCenters;