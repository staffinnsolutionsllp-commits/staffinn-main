import React, { useState, useEffect } from 'react';
import './StudentSelectionModal.css';

const StudentSelectionModal = ({ 
  isOpen, 
  onClose, 
  onApply, 
  jobTitle, 
  companyName, 
  students = [], 
  loading = false 
}) => {
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset selections when modal opens
      setSelectedStudents(new Set());
    }
  }, [isOpen]);

  const handleStudentToggle = (studentId, isDisabled) => {
    if (isDisabled) return;
    
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleApply = async () => {
    if (selectedStudents.size === 0) {
      alert('Please select at least one student to apply.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onApply(Array.from(selectedStudents));
      onClose();
    } catch (error) {
      console.error('Error applying students:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableStudents = students.filter(student => !student.hasApplied);
  const appliedStudents = students.filter(student => student.hasApplied);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="student-selection-modal">
        <div className="modal-header">
          <h2>Apply Students to Job</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="job-info">
          <h3>{jobTitle}</h3>
          <p>{companyName}</p>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-state">
              <p>Loading students...</p>
            </div>
          ) : (
            <>
              {students.length === 0 ? (
                <div className="no-students">
                  <p>No students found in your Student Management.</p>
                  <p>Please add students first before applying to jobs.</p>
                </div>
              ) : (
                <div className="students-container">
                  {appliedStudents.length > 0 && (
                    <div className="applied-students-section">
                      <h4>Already Applied Students</h4>
                      <div className="students-table">
                        <div className="table-header">
                          <div className="col-name">Student Name</div>
                          <div className="col-email">Email</div>
                          <div className="col-phone">Phone</div>
                          <div className="col-degree">Degree</div>
                          <div className="col-action">Status</div>
                        </div>
                        {appliedStudents.map(student => (
                          <div key={student.instituteStudntsID} className="table-row applied">
                            <div className="col-name">{student.fullName}</div>
                            <div className="col-email">{student.email}</div>
                            <div className="col-phone">{student.phoneNumber}</div>
                            <div className="col-degree">{student.degreeName}</div>
                            <div className="col-action">
                              <span className="applied-badge">Applied</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {availableStudents.length > 0 && (
                    <div className="available-students-section">
                      <h4>Available Students ({availableStudents.length})</h4>
                      <div className="students-table">
                        <div className="table-header">
                          <div className="col-name">Student Name</div>
                          <div className="col-email">Email</div>
                          <div className="col-phone">Phone</div>
                          <div className="col-degree">Degree</div>
                          <div className="col-action">Select</div>
                        </div>
                        {availableStudents.map(student => (
                          <div key={student.instituteStudntsID} className="table-row">
                            <div className="col-name">{student.fullName}</div>
                            <div className="col-email">{student.email}</div>
                            <div className="col-phone">{student.phoneNumber}</div>
                            <div className="col-degree">{student.degreeName}</div>
                            <div className="col-action">
                              <input
                                type="checkbox"
                                checked={selectedStudents.has(student.instituteStudntsID)}
                                onChange={() => handleStudentToggle(student.instituteStudntsID, false)}
                                className="student-checkbox"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {availableStudents.length === 0 && appliedStudents.length > 0 && (
                    <div className="no-available-students">
                      <p>All your students have already been applied to this job.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button 
            className="apply-btn" 
            onClick={handleApply}
            disabled={isSubmitting || selectedStudents.size === 0 || availableStudents.length === 0}
          >
            {isSubmitting ? 'Applying...' : `Apply ${selectedStudents.size} Student${selectedStudents.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentSelectionModal;