import React, { useState, useEffect } from 'react';
import apiService from '../../../services/api';
import StudentStatusModal from './StudentStatusModal';

const CenterWiseAnalytics = () => {
  const [trainingCenters, setTrainingCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState('');
  const [studentData, setStudentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    loadTrainingCenters();
  }, []);

  const loadTrainingCenters = async () => {
    try {
      setLoading(true);
      const result = await apiService.getPlacementTrainingCenters();
      if (result.success) {
        setTrainingCenters(Array.isArray(result.data) ? result.data : []);
      } else {
        setTrainingCenters([]);
      }
    } catch (error) {
      console.error('Error loading training centers:', error);
      setTrainingCenters([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCenterStudents = async (centerId) => {
    try {
      setLoadingStudents(true);
      const result = await apiService.getCenterWiseStudents(centerId);
      if (result.success) {
        setStudentData(Array.isArray(result.data) ? result.data : []);
      } else {
        setStudentData([]);
      }
    } catch (error) {
      console.error('Error loading center students:', error);
      setStudentData([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleCenterChange = (e) => {
    const centerId = e.target.value;
    setSelectedCenter(centerId);
    if (centerId) {
      loadCenterStudents(centerId);
    } else {
      setStudentData([]);
    }
  };

  const handleViewStatus = (student) => {
    setSelectedStudent(student);
    setShowStatusModal(true);
  };

  if (loading) {
    return (
      <div className="placement-loading">
        <div className="placement-loading-spinner"></div>
        <p>Loading training centers...</p>
      </div>
    );
  }

  return (
    <div className="center-wise-analytics">
      <div className="analytics-header">
        <h3>🏢 Center Wise Placement Analytics</h3>
        <p>Select a training center to view placement analytics for students from that center</p>
      </div>

      {/* Center Selection Dropdown */}
      <div className="center-selection" style={{ marginBottom: '30px' }}>
        <label htmlFor="centerSelect" style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#2c3e50' }}>
          Select Training Center:
        </label>
        <select 
          id="centerSelect"
          value={selectedCenter} 
          onChange={handleCenterChange}
          style={{
            padding: '12px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '16px',
            minWidth: '300px',
            backgroundColor: 'white'
          }}
        >
          <option value="">-- Select a Training Center --</option>
          {Array.isArray(trainingCenters) && trainingCenters.map(center => (
            <option key={center.id} value={center.id}>
              {center.name} {center.location && `(${center.location})`}
            </option>
          ))}
        </select>
      </div>

      {selectedCenter && (
        <>
          {/* Summary Cards for Selected Center */}
          <div className="placement-dashboard-cards">
            <div className="placement-card success">
              <div className="placement-card-icon">👥</div>
              <div className="placement-card-value">{studentData.length}</div>
              <div className="placement-card-label">Total Students</div>
            </div>

            <div className="placement-card info">
              <div className="placement-card-icon">✅</div>
              <div className="placement-card-value">
                {studentData.filter(student => student.status === 'Hired').length}
              </div>
              <div className="placement-card-label">Placed Students</div>
            </div>

            <div className="placement-card warning">
              <div className="placement-card-icon">📈</div>
              <div className="placement-card-value">
                {studentData.length > 0 ? 
                  Math.round((studentData.filter(student => student.status === 'Hired').length / studentData.length) * 100) 
                  : 0}%
              </div>
              <div className="placement-card-label">Success Rate</div>
            </div>
          </div>

          {/* Students Table */}
          {loadingStudents ? (
            <div className="placement-loading">
              <div className="placement-loading-spinner"></div>
              <p>Loading students for selected center...</p>
            </div>
          ) : studentData.length > 0 ? (
            <table className="placement-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Qualification</th>
                  <th>Center</th>
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Sector</th>
                  <th>Placed Count</th>
                  <th>Total Applications</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentData.map((student, index) => (
                  <tr key={index}>
                    <td><strong>{student.studentName}</strong></td>
                    <td>{student.qualification}</td>
                    <td>{student.center}</td>
                    <td>{student.course}</td>
                    <td>{student.batch}</td>
                    <td>{student.sector}</td>
                    <td>
                      <span className={`status-badge ${student.status === 'Hired' ? 'hired' : (student.status === 'Rejected' ? 'rejected' : 'pending')}`}>
                        {student.placedCount}
                      </span>
                    </td>
                    <td>{student.totalApplications}</td>
                    <td>
                      <button 
                        className="placement-action-btn view"
                        onClick={() => handleViewStatus(student)}
                      >
                        View Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="placement-empty">
              <div className="placement-empty-icon">👥</div>
              <h3>No Students Found</h3>
              <p>No students found for the selected training center.</p>
            </div>
          )}
        </>
      )}

      {!selectedCenter && (
        <div className="placement-empty">
          <div className="placement-empty-icon">🏢</div>
          <h3>Select a Training Center</h3>
          <p>Please select a training center from the dropdown above to view student placement analytics.</p>
        </div>
      )}

      {/* Student Status Modal */}
      {showStatusModal && selectedStudent && (
        <StudentStatusModal
          student={selectedStudent}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
};

export default CenterWiseAnalytics;