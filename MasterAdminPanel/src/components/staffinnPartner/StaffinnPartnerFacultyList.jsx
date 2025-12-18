import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminApi';
import './StaffinnPartnerFacultyList.css';

const StaffinnPartnerFacultyList = () => {
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [faculty, setFaculty] = useState([]);
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

  const loadFaculty = async (instituteId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await adminAPI.getStaffinnPartnerFaculty(instituteId);
      if (response.success) {
        setFaculty(response.data || []);
      } else {
        setError('Failed to load faculty');
      }
    } catch (error) {
      setError(error.message || 'Failed to load faculty');
    } finally {
      setLoading(false);
    }
  };

  const handleInstituteChange = (e) => {
    const instituteId = e.target.value;
    setSelectedInstitute(instituteId);
    if (instituteId) {
      loadFaculty(instituteId);
    } else {
      setFaculty([]);
    }
  };

  const handleDelete = async (facultyId) => {
    if (!window.confirm('Are you sure you want to delete this faculty member?')) {
      return;
    }
    
    try {
      await adminAPI.deleteFaculty(facultyId);
      // Reload faculty data
      if (selectedInstitute) {
        loadFaculty(selectedInstitute);
      }
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
  };

  return (
    <div className="staffinn-partner-faculty-list-container">
      <div className="page-header">
        <h1 className="page-title">Faculty List</h1>
        <p className="page-subtitle">View faculty list for Staffinn Partner institutes</p>
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
          <p>Loading faculty...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {faculty.length > 0 && !loading && (
        <div className="faculty-content">
          <div className="content-header">
            <h2>Faculty List</h2>
            <p>Faculty members for {institutes.find(i => i.instituteId === selectedInstitute)?.instituteName}</p>
          </div>

          <div className="faculty-table-container">
            <table className="faculty-table">
              <thead>
                <tr>
                  <th>S. No</th>
                  <th>Enrollment No</th>
                  <th>Name</th>
                  <th>DOB</th>
                  <th>Gender</th>
                  <th>Mobile</th>
                  <th>Qualification</th>
                  <th>Skills</th>
                  <th>Address</th>
                  <th>Email</th>
                  <th>Trainer Code</th>
                  <th>Profile Photo</th>
                  <th>Certificate Photo</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {faculty.map((member, index) => (
                  <tr key={member.id || member.misfaculty || index}>
                    <td>{index + 1}</td>
                    <td>{member.enrollmentNo || '-'}</td>
                    <td>{member.name || '-'}</td>
                    <td>{member.dob || '-'}</td>
                    <td>{member.gender || '-'}</td>
                    <td>{member.mobile || '-'}</td>
                    <td>{member.qualification || '-'}</td>
                    <td>{member.skills || '-'}</td>
                    <td>{member.address || '-'}</td>
                    <td>{member.email || '-'}</td>
                    <td>{member.trainerCode || '-'}</td>
                    <td>
                      {member.profilePhotoUrl ? (
                        <img 
                          src={`https://staffinn-files.s3.ap-south-1.amazonaws.com/faculty-profiles/${member.profilePhotoUrl.split('/').pop()}`}
                          alt="Profile Photo" 
                          className="faculty-photo"
                          onClick={() => window.open(`https://staffinn-files.s3.ap-south-1.amazonaws.com/faculty-profiles/${member.profilePhotoUrl.split('/').pop()}`, '_blank')}
                        />
                      ) : '-'}
                    </td>
                    <td>
                      {member.certificateUrl ? (
                        <img 
                          src={`https://staffinn-files.s3.ap-south-1.amazonaws.com/faculty-certificates/${member.certificateUrl.split('/').pop()}`}
                          alt="Certificate Photo" 
                          className="faculty-photo"
                          onClick={() => window.open(`https://staffinn-files.s3.ap-south-1.amazonaws.com/faculty-certificates/${member.certificateUrl.split('/').pop()}`, '_blank')}
                        />
                      ) : '-'}
                    </td>
                    <td>
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDelete(member.id || member.misfaculty)}
                      >
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

      {selectedInstitute && faculty.length === 0 && !loading && !error && (
        <div className="no-data">
          <h3>No Faculty Found</h3>
          <p>This institute has not added any faculty members yet.</p>
        </div>
      )}

      {!selectedInstitute && !loading && (
        <div className="no-selection">
          <h3>Select an Institute</h3>
          <p>Please select a Staffinn Partner institute from the dropdown above to view their faculty list.</p>
        </div>
      )}
    </div>
  );
};

export default StaffinnPartnerFacultyList;