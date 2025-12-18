import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminApi';
import './StaffinnPartnerFacultyList.css';

const StaffinnPartnerStudents = () => {
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [students, setStudents] = useState([]);
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

  const loadStudents = async (instituteId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await adminAPI.getStaffinnPartnerStudents(instituteId);
      if (response.success) {
        setStudents(response.data || []);
      } else {
        setError('Failed to load students');
      }
    } catch (error) {
      setError(error.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleInstituteChange = (e) => {
    const instituteId = e.target.value;
    setSelectedInstitute(instituteId);
    if (instituteId) {
      loadStudents(instituteId);
    } else {
      setStudents([]);
    }
  };

  return (
    <div className="staffinn-partner-faculty-list-container">
      <div className="page-header">
        <h1 className="page-title">Students List</h1>
        <p className="page-subtitle">View students list for Staffinn Partner institutes</p>
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
          <p>Loading students...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {students.length > 0 && !loading && (
        <div className="faculty-content">
          <div className="content-header">
            <h2>Students List</h2>
            <p>Students for {institutes.find(i => i.instituteId === selectedInstitute)?.instituteName}</p>
          </div>

          <div className="faculty-table-container">
            <table className="faculty-table">
              <thead>
                <tr>
                  <th>S. No</th>
                  <th>Student Name</th>
                  <th>Father's Name</th>
                  <th>DOB</th>
                  <th>Gender</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Qualification</th>
                  <th>Category</th>
                  <th>Profile Photo</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.studentsId || index}>
                    <td>{index + 1}</td>
                    <td>{student.studentName || '-'}</td>
                    <td>{student.fatherName || '-'}</td>
                    <td>{student.dob || '-'}</td>
                    <td>{student.gender || '-'}</td>
                    <td>{student.mobile || '-'}</td>
                    <td>{student.email || '-'}</td>
                    <td>{student.qualification || '-'}</td>
                    <td>{student.category || '-'}</td>
                    <td>
                      {student.profilePhotoUrl ? (
                        <img 
                          src={student.profilePhotoUrl}
                          alt="Profile Photo" 
                          className="faculty-photo"
                          onClick={() => window.open(student.profilePhotoUrl, '_blank')}
                        />
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedInstitute && students.length === 0 && !loading && !error && (
        <div className="no-data">
          <h3>No Students Found</h3>
          <p>This institute has not added any students yet.</p>
        </div>
      )}

      {!selectedInstitute && !loading && (
        <div className="no-selection">
          <h3>Select an Institute</h3>
          <p>Please select a Staffinn Partner institute from the dropdown above to view their students list.</p>
        </div>
      )}
    </div>
  );
};

export default StaffinnPartnerStudents;