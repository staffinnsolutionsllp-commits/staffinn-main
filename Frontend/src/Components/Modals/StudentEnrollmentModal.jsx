import React, { useState, useEffect } from 'react';
import './StudentEnrollmentModal.css';
import apiService from '../../services/api';
import PaymentModal from '../Dashboard/PaymentModal';

const StudentEnrollmentModal = ({ isOpen, onClose, course, instituteId }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedStudentType, setSelectedStudentType] = useState(null);
  const [currentStep, setCurrentStep] = useState('selectType'); // selectType, selectStudents, selectPayment
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const response = await apiService.getProfile();
      if (response.success) {
        setUserProfile(response.data);
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (isOpen && course && userProfile) {
      // Reset all states
      setSelectedStudents([]);
      setError('');
      setSuccess(false);
      setSelectedPaymentMethod(null);
      
      // Check if Staffinn Partner
      const isStaffinnPartner = userProfile?.instituteType === 'staffinn_partner' || userProfile?.misApproved === true;
      
      if (isStaffinnPartner) {
        setCurrentStep('selectType');
        setSelectedStudentType(null);
      } else {
        setSelectedStudentType('institute');
        setCurrentStep('selectStudents');
      }
    }
  }, [isOpen, course, userProfile]);

  useEffect(() => {
    if (selectedStudentType && isOpen && course) {
      fetchAvailableStudents(selectedStudentType);
      fetchEnrolledStudents(selectedStudentType);
    }
  }, [selectedStudentType, isOpen, course]);

  const handleStudentTypeSelection = (type) => {
    setSelectedStudentType(type);
    setCurrentStep('selectStudents');
    setStudents([]);
    setEnrolledStudents(new Set());
    setSelectedStudents([]);
  };

  const handleProceedToPayment = () => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }
    setError('');
    setCurrentStep('selectPayment');
  };

  const handleBackToStudents = () => {
    setCurrentStep('selectStudents');
    setSelectedPaymentMethod(null);
  };

  const handleBackToType = () => {
    setCurrentStep('selectType');
    setSelectedStudentType(null);
    setStudents([]);
    setEnrolledStudents(new Set());
    setSelectedStudents([]);
  };

  const fetchAvailableStudents = async (studentType) => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      if (studentType === 'mis') {
        response = await apiService.getMisStudents();
      } else {
        response = await apiService.getAvailableStudentsForEnrollment();
      }
      
      if (response.success) {
        setStudents(response.data || []);
      } else {
        setError(response.message || 'Failed to load students');
      }
    } catch (error) {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledStudents = async (studentType) => {
    try {
      const response = await apiService.getEnrolledInstituteStudents(course.coursesId, studentType);
      
      if (response.success && response.data) {
        const enrolledIds = new Set(response.data.filter(id => id != null && id !== undefined && id !== ''));
        setEnrolledStudents(enrolledIds);
      } else {
        setEnrolledStudents(new Set());
      }
    } catch (error) {
      setEnrolledStudents(new Set());
    }
  };

  const handleStudentToggle = (studentId) => {
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
    const availableStudentIds = filteredStudents
      .filter(s => {
        const studentId = s.studentsId || s.instituteStudntsID;
        return !enrolledStudents.has(studentId);
      })
      .map(s => s.studentsId || s.instituteStudntsID);
    
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

    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    try {
      setEnrolling(true);
      setError('');
      setSuccess(false);

      if (selectedPaymentMethod === 'online') {
        // Show Razorpay payment modal
        setShowPaymentModal(true);
        setEnrolling(false);
      } else if (selectedPaymentMethod === 'institute') {
        // Handle Pay at Institute
        const paymentDetails = {
          paymentStatus: 'pending',
          paymentMethod: 'pay_at_institute',
          transactionId: `INST-${Date.now()}`,
          paymentDate: new Date().toISOString()
        };
        
        const response = await apiService.enrollStudentsInCourse(
          course.coursesId,
          selectedStudents,
          paymentDetails,
          selectedStudentType
        );

        if (response.success) {
          setSuccess(true);
          setError('');
          await fetchEnrolledStudents(selectedStudentType);
          setSelectedStudents([]);
          
          setTimeout(() => {
            setSuccess(false);
            onClose();
          }, 2000);
        } else {
          setError(response.message || 'Failed to enroll students');
          setSuccess(false);
        }
      }
    } catch (error) {
      setError(error.message || 'Failed to enroll students');
      setSuccess(false);
    } finally {
      if (selectedPaymentMethod !== 'online') {
        setEnrolling(false);
      }
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      setShowPaymentModal(false);
      setEnrolling(true);
      
      // After successful payment, enroll students
      const paymentDetails = {
        paymentStatus: 'completed',
        paymentMethod: 'razorpay',
        transactionId: `RAZORPAY-${Date.now()}`,
        paymentDate: new Date().toISOString(),
        amount: course.fees * selectedStudents.length
      };
      
      const response = await apiService.enrollStudentsInCourse(
        course.coursesId,
        selectedStudents,
        paymentDetails,
        selectedStudentType
      );

      if (response.success) {
        setSuccess(true);
        setError('');
        await fetchEnrolledStudents(selectedStudentType);
        setSelectedStudents([]);
        
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        setError(response.message || 'Failed to enroll students');
        setSuccess(false);
      }
    } catch (error) {
      setError(error.message || 'Failed to enroll students');
      setSuccess(false);
    } finally {
      setEnrolling(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const studentName = student.studentName || student.fullName || '';
    const fatherName = student.fatherName || '';
    const email = student.email || '';
    
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const totalAmount = course.fees * selectedStudents.length;

  if (!isOpen) return null;

  // Render PaymentModal outside step conditions
  if (showPaymentModal) {
    return (
      <PaymentModal
        course={{
          coursesId: course.coursesId,
          courseName: course.courseName,
          name: course.courseName,
          instructor: course.instructor,
          duration: course.duration,
          fees: totalAmount // Total amount for all students
        }}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    );
  }

  // Step 1: Student Type Selection
  if (currentStep === 'selectType') {
    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="student-enrollment-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
          <div className="modal-header">
            <h2>Select Student Type</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>

          <div className="modal-content" style={{ padding: '30px' }}>
            <p style={{ marginBottom: '20px', color: '#666', textAlign: 'center' }}>
              Which students do you want to enroll in this course?
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button
                onClick={() => handleStudentTypeSelection('institute')}
                style={{
                  padding: '20px',
                  backgroundColor: '#4863f7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🏫 Institute Students
              </button>
              
              <button
                onClick={() => handleStudentTypeSelection('mis')}
                style={{
                  padding: '20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📊 MIS Students
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Select Students
  if (currentStep === 'selectStudents') {
    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="student-enrollment-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2>Enroll Students in Course</h2>
              {selectedStudentType && (
                <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                  {selectedStudentType === 'institute' ? '🏫 Institute Students' : '📊 MIS Students'}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {(userProfile?.instituteType === 'staffinn_partner' || userProfile?.misApproved === true) && (
                <button className="change-type-button" onClick={handleBackToType}>
                  Change
                </button>
              )}
              <button className="close-button" onClick={onClose}>×</button>
            </div>
          </div>

          <div className="modal-content">
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
                {selectedStudents.length === filteredStudents.filter(s => !enrolledStudents.has(s.studentsId || s.instituteStudntsID)).length && filteredStudents.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            {error && (
              <div className="error-message">
                <span>⚠️ {error}</span>
              </div>
            )}

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
                    const studentId = student.studentsId || student.instituteStudntsID;
                    const isEnrolled = enrolledStudents.has(studentId);
                    const isSelected = selectedStudents.includes(studentId);
                    
                    return (
                    <div
                      key={studentId}
                      className={`student-card ${isSelected ? 'selected' : ''} ${isEnrolled ? 'enrolled' : ''}`}
                      onClick={() => !isEnrolled && handleStudentToggle(studentId)}
                      style={{ cursor: isEnrolled ? 'not-allowed' : 'pointer' }}
                    >
                      {!isEnrolled && (
                        <div className="student-checkbox">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleStudentToggle(studentId)}
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
            <button className="cancel-button" onClick={onClose} disabled={enrolling}>
              Cancel
            </button>
            <button 
              className="enroll-button"
              onClick={handleProceedToPayment}
              disabled={enrolling || selectedStudents.length === 0 || loading}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Select Payment Method
  if (currentStep === 'selectPayment') {
    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="student-enrollment-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
          <div className="modal-header">
            <h2>Choose Payment Method</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>

          <div className="modal-content" style={{ padding: '30px' }}>
            <div className="course-info-section" style={{ marginBottom: '20px' }}>
              <h3>{course.courseName}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <span>Mode: <strong>{course.mode}</strong></span>
                <span>Duration: <strong>{course.duration}</strong></span>
                <span>Fees: <strong>₹{course.fees}</strong></span>
              </div>
            </div>

            <div className="enrollment-summary" style={{ marginBottom: '30px' }}>
              <div className="summary-row">
                <span>Selected Students:</span>
                <strong>{selectedStudents.length}</strong>
              </div>
              <div className="summary-row total">
                <span>Total Amount:</span>
                <strong>₹{totalAmount.toLocaleString()}</strong>
              </div>
            </div>

            <p style={{ marginBottom: '20px', color: '#666', textAlign: 'center', fontSize: '16px' }}>
              Select Payment Method:
            </p>

            {error && (
              <div className="error-message" style={{ marginBottom: '20px' }}>
                <span>⚠️ {error}</span>
              </div>
            )}

            {success && (
              <div className="success-message" style={{ marginBottom: '20px' }}>
                <span>✅ Students enrolled successfully!</span>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div
                onClick={() => setSelectedPaymentMethod('online')}
                style={{
                  padding: '20px',
                  border: selectedPaymentMethod === 'online' ? '2px solid #4863f7' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedPaymentMethod === 'online' ? '#f0f4ff' : 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <input
                    type="radio"
                    checked={selectedPaymentMethod === 'online'}
                    onChange={() => setSelectedPaymentMethod('online')}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, marginBottom: '5px' }}>💳 Pay Here (Online)</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Pay securely using Razorpay</p>
                    <ul style={{ margin: '10px 0 0 20px', fontSize: '13px', color: '#666' }}>
                      <li>✓ Instant enrollment confirmation</li>
                      <li>✓ Secure payment gateway</li>
                      <li>✓ Multiple payment options</li>
                      <li>✓ Immediate access to course details</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div
                onClick={() => setSelectedPaymentMethod('institute')}
                style={{
                  padding: '20px',
                  border: selectedPaymentMethod === 'institute' ? '2px solid #10b981' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedPaymentMethod === 'institute' ? '#f0fdf4' : 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <input
                    type="radio"
                    checked={selectedPaymentMethod === 'institute'}
                    onChange={() => setSelectedPaymentMethod('institute')}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, marginBottom: '5px' }}>🏢 Pay at Institute</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Complete payment at the institute</p>
                    <ul style={{ margin: '10px 0 0 20px', fontSize: '13px', color: '#666' }}>
                      <li>✓ Pay in cash or other methods at institute</li>
                      <li>✓ Flexible payment options</li>
                      <li>✓ Direct interaction with institute staff</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="cancel-button" onClick={handleBackToStudents} disabled={enrolling}>
              Back
            </button>
            <button 
              className="enroll-button"
              onClick={handleEnroll}
              disabled={enrolling || !selectedPaymentMethod}
            >
              {enrolling ? 'Processing...' : 'Enroll Students'}
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default StudentEnrollmentModal;
