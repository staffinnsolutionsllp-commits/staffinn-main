import React, { useState, useEffect } from 'react';
import apiService from '../../../services/api';
import StudentStatusModal from './StudentStatusModal';

const StudentWiseAnalytics = () => {
  const [studentData, setStudentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    loadStudentWiseData();
  }, []);

  const loadStudentWiseData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getStudentWiseAnalytics();
      setStudentData(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading student wise data:', error);
      setStudentData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStatus = async (student) => {
    setSelectedStudent(student);
    setShowStatusModal(true);
  };

  if (loading) {
    return (
      <div className="placement-loading">
        <div className="placement-loading-spinner"></div>
        <p>Loading student wise analytics...</p>
      </div>
    );
  }

  if (studentData.length === 0) {
    return (
      <div className="placement-empty">
        <div className="placement-empty-icon">👨🎓</div>
        <h3>No Student Data Available</h3>
        <p>No placement data found for students yet.</p>
      </div>
    );
  }

  return (
    <div className="student-wise-analytics">
      <div className="analytics-header">
        <h3>👨🎓 Student Wise Placement Analytics</h3>
        <p>Track individual student placement performance and history</p>
      </div>

      {/* Summary Cards */}
      <div className="placement-dashboard-cards">
        <div className="placement-card success">
          <div className="placement-card-icon">👥</div>
          <div className="placement-card-value">{studentData.length}</div>
          <div className="placement-card-label">Total Students</div>
        </div>

        <div className="placement-card info">
          <div className="placement-card-icon">✅</div>
          <div className="placement-card-value">
            {studentData.filter(student => (student.placedCount || 0) > 0).length}
          </div>
          <div className="placement-card-label">Placed Students</div>
        </div>

        <div className="placement-card warning">
          <div className="placement-card-icon">📈</div>
          <div className="placement-card-value">
            {studentData.length > 0 ? 
              Math.round((studentData.filter(student => (student.placedCount || 0) > 0).length / studentData.length) * 100) 
              : 0}%
          </div>
          <div className="placement-card-label">Success Rate</div>
        </div>
      </div>

      {/* Student Data Table */}
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
            <tr key={student.studentId || student.id || index}>
              <td>
                <strong>{student.studentName || student.name || 'N/A'}</strong>
              </td>
              <td>{student.qualification || 'N/A'}</td>
              <td>{student.center || student.trainingCenter || 'N/A'}</td>
              <td>{student.course || student.courseName || 'N/A'}</td>
              <td>{student.batch || student.batchId || 'N/A'}</td>
              <td>{student.sector || 'N/A'}</td>
              <td>
                <span className={`status-badge ${student.placedCount > 0 ? 'hired' : 'pending'}`}>
                  {student.placedCount || 0}
                </span>
              </td>
              <td>{student.totalApplications || 0}</td>
              <td>
                <button 
                  className="placement-action-btn view"
                  onClick={() => handleViewStatus(student)}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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

export default StudentWiseAnalytics;