import React, { useState, useEffect } from 'react';
import './StudentEnrollmentModal.css';
import apiService from '../../services/api';

const StudentEnrollmentModal = ({ isOpen, onClose, course, instituteId }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && course) {
      fetchAvailableStudents();
      fetchEnrolledStudents();
    }
  }, [isOpen, course]);

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

  const fetchEnrolledStudents = async () => {
    try {
      console.log('🔍 [FRONTEND] Fetching enrolled students for course:', course.coursesId);
      const response = await apiService.getEnrolledInstituteStudents(course.coursesId);
      console.log('📊 [FRONTEND] Enrolled students response:', response);
      
      if (response.success && response.data) {
        const enrolledIds = new Set(response.data.map(s => s.studentsId || s.studentId));
        console.log('✅ [FRONTEND] Enrolled student IDs:', Array.from(enrolledIds));
        setEnrolledStudents(enrolledIds);
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error fetching enrolled students:', error);
    }
  };

  const handleStudentToggle = (studentId) => {
    // Don't allow toggling already enrolled students
    if (enrolledStudents.has(studentId)) {
      return;
    }
    
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    // Only select students who are not already enrolled
    const availableStudentIds = filteredStudents
      .filter(s => !enrolledStudents.has(s.studentsId))
      .map(s => s.studentsId);
    
    if (selectedStudents.length === availableStudentIds.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(availableStudentIds);
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
      console.log('🎓 [FRONTEND] Starting enrollment process...');
      console.log('🎓 [FRONTEND] Course ID:', course.coursesId);
      console.log('🎓 [FRONTEND] Selected Students:', selectedStudents);
      console.log('🎓 [FRONTEND] Number of students:', selectedStudents.length);

      const paymentDetails = {
        paymentStatus: 'completed',
        paymentMethod: 'institute_enrollment',
        transactionId: `TXN-${Date.now()}`,
        paymentDate: new Date().toISOString()
      };

      console.log('💳 [FRONTEND] Payment Details:', paymentDetails);
      console.log('📤 [FRONTEND] Calling enrollStudentsInCourse API...');
      
      const response = await apiService.enrollStudentsInCourse(
        course.coursesId,
        selectedStudents,
        paymentDetails
      );

      console.log('📊 [FRONTEND] Enrollment API Response:', JSON.stringify(response, null, 2));
      console.log('📊 [FRONTEND] Response success:', response.success);
      console.log('📊 [FRONTEND] Response stats:', response.stats);

      if (response.success) {
        let successMsg = `Successfully enrolled ${response.stats?.enrolled || selectedStudents.length} student(s)!`;
        if (response.stats?.skipped > 0) {
          successMsg += ` (${response.stats.skipped} already enrolled)`;
        }
        if (response.stats?.notFound > 0) {
          successMsg += ` (${response.stats.notFound} not found)`;
        }
        
        console.log('✅ [FRONTEND] Enrollment successful:', successMsg);
        setSuccess(true);
        setError('');
        
        // Update enrolled students set
        const newlyEnrolled = new Set([...enrolledStudents, ...selectedStudents]);
        setEnrolledStudents(newlyEnrolled);
        
        // Clear selected students
        setSelectedStudents([]);
        
        const successDiv = document.querySelector('.success-message span');
        if (successDiv) {
          successDiv.textContent = `✅ ${successMsg}`;
        }
        
        console.log('🔄 [FRONTEND] Waiting 2 seconds before closing modal...');
        setTimeout(() => {
          console.log('🔄 [FRONTEND] Closing modal and reloading page...');
          onClose();
          setSuccess(false);
          window.location.reload();
        }, 2000);
      } else {
        console.error('❌ [FRONTEND] Enrollment failed:', response.message);
        setError(response.message || 'Failed to enroll students');
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error enrolling students:', error);
      console.error('❌ [FRONTEND] Error message:', error.message);
      console.error('❌ [FRONTEND] Error stack:', error.stack);
      setError(error.message || 'Failed to enroll students');
    } finally {
      setEnrolling(false);
      console.log('🏁 [FRONTEND] Enrollment process completed');
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
              <h4>
                Select Students 
                {selectedStudents.length > 0 && (
                  <span style={{color: '#4863f7', fontWeight: 'bold'}}>
                    ({selectedStudents.length} selected)
                  </span>
                )}
                {selectedStudents.length === 0 && (
                  <span style={{color: '#6b7280'}}>(0 selected)</span>
                )}
              </h4>
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
                {filteredStudents.map(student => {
                  const isEnrolled = enrolledStudents.has(student.studentsId);
                  const isSelected = selectedStudents.includes(student.studentsId);
                  
                  return (
                  <div
                    key={student.studentsId}
                    className={`student-card ${isSelected ? 'selected' : ''} ${isEnrolled ? 'enrolled' : ''}`}
                    onClick={() => !isEnrolled && handleStudentToggle(student.studentsId)}
                    style={{ cursor: isEnrolled ? 'not-allowed' : 'pointer' }}
                  >
                    {!isEnrolled && (
                      <div className="student-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleStudentToggle(student.studentsId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
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
                      {isEnrolled && (
                        <div className="enrolled-badge-wrapper">
                          <span className="enrolled-badge-inline">✓ Already Enrolled</span>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
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
