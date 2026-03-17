import React, { useState, useEffect } from 'react';
import './StudentEnrollmentModal.css';
import apiService from '../../services/api';

const StudentEnrollmentModal = ({ isOpen, onClose, course, instituteId }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableStudents();
    }
  }, [isOpen]);

  const fetchAvailableStudents = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 [FRONTEND] Fetching available students for enrollment...');
      console.log('🔍 [FRONTEND] Token exists:', !!localStorage.getItem('token'));
      console.log('🔍 [FRONTEND] Calling API endpoint: /institute-course-enrollment/available-students');
      
      const response = await apiService.getAvailableStudentsForEnrollment();
      console.log('📊 [FRONTEND] Full API Response:', JSON.stringify(response, null, 2));
      console.log('📊 [FRONTEND] Response success:', response.success);
      console.log('📊 [FRONTEND] Response data length:', response.data?.length);
      console.log('📊 [FRONTEND] Response data:', response.data);
      
      if (response.success) {
        console.log('✅ [FRONTEND] Students loaded:', response.data?.length || 0, 'students');
        setStudents(response.data || []);
      } else {
        console.error('❌ [FRONTEND] API returned error:', response.message);
        setError(response.message || 'Failed to load students');
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error fetching students:', error);
      console.error('❌ [FRONTEND] Error message:', error.message);
      console.error('❌ [FRONTEND] Error stack:', error.stack);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    const filteredStudentIds = filteredStudents.map(s => s.studentsId);
    if (selectedStudents.length === filteredStudentIds.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudentIds);
    }
  };

  const handleEnroll = async () => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }

    try {
      setEnrolling(true);
      setError('');

      const paymentDetails = {
        paymentStatus: 'completed',
        paymentMethod: 'institute_enrollment',
        transactionId: `TXN-${Date.now()}`,
        paymentDate: new Date().toISOString()
      };

      const response = await apiService.enrollStudentsInCourse(
        course.coursesId,
        selectedStudents,
        paymentDetails
      );

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setSelectedStudents([]);
        }, 2000);
      } else {
        setError(response.message || 'Failed to enroll students');
      }
    } catch (error) {
      console.error('Error enrolling students:', error);
      setError('Failed to enroll students');
    } finally {
      setEnrolling(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.fatherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = course.fees * selectedStudents.length;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="student-enrollment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Enroll Students in Course</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* Course Info */}
          <div className="course-info-section">
            <h3>{course.courseName}</h3>
            <div className="course-details-grid">
              <div className="detail-item">
                <span className="label">Duration:</span>
                <span className="value">{course.duration}</span>
              </div>
              <div className="detail-item">
                <span className="label">Fees per Student:</span>
                <span className="value">₹{course.fees}</span>
              </div>
              <div className="detail-item">
                <span className="label">Mode:</span>
                <span className="value">{course.mode}</span>
              </div>
              <div className="detail-item">
                <span className="label">Instructor:</span>
                <span className="value">{course.instructor}</span>
              </div>
            </div>
          </div>

          {/* Search and Select All */}
          <div className="search-section">
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button 
              className="select-all-button"
              onClick={handleSelectAll}
              disabled={loading || filteredStudents.length === 0}
            >
              {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="success-message">
              <span>✅ Students enrolled successfully!</span>
            </div>
          )}

          {/* Students List */}
          <div className="students-list-section">
            <div className="section-header">
              <h4>Select Students ({selectedStudents.length} selected)</h4>
            </div>

            {loading ? (
              <div className="loading-state">
                <p>Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="empty-state">
                <p>No students available for enrollment</p>
                <small>Add students in Student Management section first</small>
              </div>
            ) : (
              <div className="students-grid">
                {filteredStudents.map(student => (
                  <div
                    key={student.studentsId}
                    className={`student-card ${selectedStudents.includes(student.studentsId) ? 'selected' : ''}`}
                    onClick={() => handleStudentToggle(student.studentsId)}
                  >
                    <div className="student-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.studentsId)}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="student-avatar">
                      {student.profilePhotoUrl ? (
                        <img src={student.profilePhotoUrl} alt={student.studentName} />
                      ) : (
                        <div className="avatar-placeholder">
                          {student.studentName?.charAt(0).toUpperCase() || 'S'}
                        </div>
                      )}
                    </div>
                    <div className="student-info">
                      <h5>{student.studentName || 'N/A'}</h5>
                      <p className="student-email">{student.email || 'N/A'}</p>
                      {student.mobile && (
                        <p className="student-phone">{student.mobile}</p>
                      )}
                      {student.fatherName && (
                        <p className="student-father" style={{fontSize: '12px', color: '#666'}}>Father: {student.fatherName}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary Section */}
          {selectedStudents.length > 0 && (
            <div className="enrollment-summary">
              <div className="summary-row">
                <span>Selected Students:</span>
                <strong>{selectedStudents.length}</strong>
              </div>
              <div className="summary-row">
                <span>Fee per Student:</span>
                <strong>₹{course.fees}</strong>
              </div>
              <div className="summary-row total">
                <span>Total Amount:</span>
                <strong>₹{totalAmount.toLocaleString()}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="cancel-button" 
            onClick={onClose}
            disabled={enrolling}
          >
            Cancel
          </button>
          <button 
            className="enroll-button"
            onClick={handleEnroll}
            disabled={enrolling || selectedStudents.length === 0 || loading}
          >
            {enrolling ? 'Enrolling...' : `Enroll ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentEnrollmentModal;
