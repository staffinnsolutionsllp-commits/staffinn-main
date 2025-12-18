import React, { useState, useEffect } from 'react';
import './JobApplicationModal.css';
import apiService from '../../services/api';

const JobApplicationModal = ({ job, onClose, onApplicationSuccess }) => {
  const [applicationStep, setApplicationStep] = useState('loading'); // 'loading', 'options', 'institute', 'mis'
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applicationType, setApplicationType] = useState('');
  const [isStaffinPartner, setIsStaffinPartner] = useState(false);

  // Check if institute is Staffinn Partner on component mount
  useEffect(() => {
    checkStaffinPartnerStatus();
  }, []);

  const checkStaffinPartnerStatus = async () => {
    try {
      setLoading(true);
      // Load institute students first to check partner status
      const response = await apiService.getStudentsApplicationStatus(job.jobId, 'institute');
      if (response.success) {
        setIsStaffinPartner(response.isStaffinPartner || false);
        // If not a Staffinn Partner, go directly to institute students
        if (!response.isStaffinPartner) {
          setApplicationStep('institute');
          setApplicationType('institute');
          setStudents(response.data || []);
        } else {
          // Show options for Staffinn Partner
          setApplicationStep('options');
        }
      }
    } catch (error) {
      console.error('Error checking partner status:', error);
      // Default to institute students if error
      setApplicationStep('institute');
      setApplicationType('institute');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (type) => {
    setApplicationType(type);
    setApplicationStep(type);
    loadStudents(type);
  };

  const loadStudents = async (type) => {
    try {
      setLoading(true);
      const response = await apiService.getStudentsApplicationStatus(job.jobId, type);
      if (response.success) {
        setStudents(response.data || []);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      alert('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(student => 
        student.instituteStudntsID || student.studentsId
      ));
    }
  };

  const handleSubmitApplication = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    try {
      setLoading(true);
      
      let response;
      if (applicationType === 'mis') {
        response = await apiService.applyMisStudentsToJob({
          jobId: job.jobId,
          recruiterId: job.recruiterId,
          studentIds: selectedStudents
        });
      } else {
        response = await apiService.applyStudentsToJob({
          jobId: job.jobId,
          recruiterId: job.recruiterId,
          studentIds: selectedStudents
        });
      }

      if (response.success) {
        alert(`Successfully applied ${selectedStudents.length} students to the job!`);
        if (onApplicationSuccess) {
          onApplicationSuccess();
        }
        onClose();
      } else {
        alert(response.message || 'Failed to apply students');
      }
    } catch (error) {
      console.error('Error applying students:', error);
      alert('Failed to apply students');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (isStaffinPartner) {
      setApplicationStep('options');
    } else {
      // For non-Staffinn Partner institutes, close the modal
      onClose();
      return;
    }
    setStudents([]);
    setSelectedStudents([]);
    setApplicationType('');
  };

  return (
    <div className="job-application-modal-overlay" onClick={onClose}>
      <div className="job-application-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Apply for: {job.title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {applicationStep === 'loading' && (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p>Loading application options...</p>
            </div>
          )}

          {applicationStep === 'options' && isStaffinPartner && (
            <div className="application-options">
              <h4>Choose Application Type</h4>
              <p>As a Staffinn Partner institute, you can apply students from both sources:</p>
              
              <div className="option-cards">
                <div 
                  className="option-card"
                  onClick={() => handleOptionSelect('institute')}
                >
                  <div className="option-icon">🏫</div>
                  <h5>Apply Students of Institute</h5>
                  <p>Select and apply students from your own institute</p>
                </div>

                <div 
                  className="option-card staffinn-partner-option"
                  onClick={() => handleOptionSelect('mis')}
                >
                  <div className="option-icon">✅</div>
                  <h5>Apply Students of MIS</h5>
                  <p>Select and apply Staffinn Partner (MIS) students</p>
                  <div className="staffinn-verified-badge">✓ Staffinn Verified</div>
                </div>
              </div>
            </div>
          )}

          {(applicationStep === 'institute' || applicationStep === 'mis') && (
            <div className="student-selection">
              <div className="selection-header">
                <button className="back-btn" onClick={goBack}>
                  ← Back to Options
                </button>
                <h4>
                  {applicationType === 'mis' ? 'MIS Students' : 'Institute Students'}
                  {applicationType === 'mis' && (
                    <span className="verified-badge">✓ Staffinn Verified</span>
                  )}
                </h4>
              </div>

              {loading ? (
                <div className="loading-section">
                  <div className="loading-spinner"></div>
                  <p>Loading students...</p>
                </div>
              ) : students.length > 0 ? (
                <>
                  <div className="selection-controls">
                    <button 
                      className="select-all-btn"
                      onClick={handleSelectAll}
                    >
                      {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="selection-count">
                      {selectedStudents.length} of {students.length} selected
                    </span>
                  </div>

                  <div className="students-table-container">
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th>Select</th>
                          <th>Name</th>
                          <th>Qualification</th>
                          <th>Center</th>
                          <th>Course</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => {
                          const studentId = student.instituteStudntsID || student.studentsId;
                          return (
                            <tr key={studentId}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedStudents.includes(studentId)}
                                  onChange={() => handleStudentSelect(studentId)}
                                />
                              </td>
                              <td>
                                <div className="student-name">
                                  {student.isMisStudent && (
                                    <div className="staffinn-verified-tag">
                                      ✓ Staffinn Verified
                                    </div>
                                  )}
                                  {student.fullName || student.fatherName}
                                </div>
                              </td>
                              <td>{student.qualification || 'N/A'}</td>
                              <td>{student.center || 'Main Center'}</td>
                              <td>{student.course || 'N/A'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="no-students">
                  <p>No {applicationType === 'mis' ? 'MIS' : 'institute'} students available for application.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {(applicationStep === 'institute' || applicationStep === 'mis') && students.length > 0 && (
          <div className="modal-footer">
            <button className="cancel-btn" onClick={goBack}>
              Back
            </button>
            <button 
              className="apply-btn"
              onClick={handleSubmitApplication}
              disabled={loading || selectedStudents.length === 0}
            >
              {loading ? 'Applying...' : `Apply ${selectedStudents.length} Students`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplicationModal;