import React, { useState, useEffect } from 'react';
import apiService from '../../../services/api';

const StudentStatusModal = ({ student, onClose }) => {
  const [statusData, setStatusData] = useState({
    hired: [],
    rejected: [],
    pending: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentStatus();
  }, [student]);

  const loadStudentStatus = async () => {
    try {
      setLoading(true);
      const response = await apiService.getStudentPlacementStatus(student.studentId);
      if (response.success && response.data) {
        // Ensure all arrays exist and are valid
        const safeData = {
          hired: Array.isArray(response.data.hired) ? response.data.hired : [],
          rejected: Array.isArray(response.data.rejected) ? response.data.rejected : [],
          pending: Array.isArray(response.data.pending) ? response.data.pending : []
        };
        setStatusData(safeData);
      } else {
        // Set safe fallback data
        setStatusData({
          hired: [],
          rejected: [],
          pending: []
        });
      }
    } catch (error) {
      console.error('Error loading student status:', error);
      // Set safe fallback data on error
      setStatusData({
        hired: [],
        rejected: [],
        pending: []
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Placement Status - {student.studentName}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="placement-loading">
              <div className="placement-loading-spinner"></div>
              <p>Loading placement status...</p>
            </div>
          ) : (
            <div className="status-sections">
              {/* Hired Companies */}
              <div className="status-section">
                <h4 className="status-title hired">
                  ✅ Hired Companies ({(statusData.hired && Array.isArray(statusData.hired)) ? statusData.hired.length : 0})
                </h4>
                {(statusData.hired && Array.isArray(statusData.hired) && statusData.hired.length > 0) ? (
                  <div className="status-list">
                    {statusData.hired.map((application, index) => (
                      <div key={index} className="status-item hired">
                        <div className="company-info">
                          <strong>{application?.companyName || 'Unknown Company'}</strong>
                          <span className="job-title">{application?.jobTitle || 'Unknown Position'}</span>
                        </div>
                        <div className="application-date">
                          Hired on: {application?.hiredDate ? new Date(application.hiredDate).toLocaleDateString() : 'Unknown Date'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No companies have hired this student yet.</p>
                )}
              </div>

              {/* Rejected Companies */}
              <div className="status-section">
                <h4 className="status-title rejected">
                  ❌ Rejected Companies ({(statusData.rejected && Array.isArray(statusData.rejected)) ? statusData.rejected.length : 0})
                </h4>
                {(statusData.rejected && Array.isArray(statusData.rejected) && statusData.rejected.length > 0) ? (
                  <div className="status-list">
                    {statusData.rejected.map((application, index) => (
                      <div key={index} className="status-item rejected">
                        <div className="company-info">
                          <strong>{application?.companyName || 'Unknown Company'}</strong>
                          <span className="job-title">{application?.jobTitle || 'Unknown Position'}</span>
                        </div>
                        <div className="application-date">
                          Rejected on: {application?.rejectedDate ? new Date(application.rejectedDate).toLocaleDateString() : 'Unknown Date'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No rejections from companies.</p>
                )}
              </div>

              {/* Pending Applications */}
              <div className="status-section">
                <h4 className="status-title pending">
                  ⏳ Pending Applications ({(statusData.pending && Array.isArray(statusData.pending)) ? statusData.pending.length : 0})
                </h4>
                {(statusData.pending && Array.isArray(statusData.pending) && statusData.pending.length > 0) ? (
                  <div className="status-list">
                    {statusData.pending.map((application, index) => (
                      <div key={index} className="status-item pending">
                        <div className="company-info">
                          <strong>{application?.companyName || 'Unknown Company'}</strong>
                          <span className="job-title">{application?.jobTitle || 'Unknown Position'}</span>
                        </div>
                        <div className="application-date">
                          Applied on: {application?.appliedDate ? new Date(application.appliedDate).toLocaleDateString() : 'Unknown Date'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No pending applications.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="placement-action-btn view" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          margin: 0;
          color: #2c3e50;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #64748b;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: #dc3545;
        }

        .modal-body {
          padding: 30px;
        }

        .status-sections {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .status-section {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }

        .status-title {
          margin: 0;
          padding: 15px 20px;
          font-size: 16px;
          font-weight: 600;
        }

        .status-title.hired {
          background: #d4edda;
          color: #155724;
        }

        .status-title.rejected {
          background: #f8d7da;
          color: #721c24;
        }

        .status-title.pending {
          background: #fff3cd;
          color: #856404;
        }

        .status-list {
          padding: 0;
        }

        .status-item {
          padding: 15px 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-item:last-child {
          border-bottom: none;
        }

        .status-item.hired {
          background: #f8fff9;
        }

        .status-item.rejected {
          background: #fef8f8;
        }

        .status-item.pending {
          background: #fffef7;
        }

        .company-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .company-info strong {
          color: #2c3e50;
        }

        .job-title {
          color: #64748b;
          font-size: 14px;
        }

        .application-date {
          color: #64748b;
          font-size: 12px;
        }

        .no-data {
          padding: 20px;
          text-align: center;
          color: #64748b;
          font-style: italic;
          margin: 0;
        }

        .modal-footer {
          padding: 20px 30px;
          border-top: 1px solid #e2e8f0;
          text-align: right;
        }

        @media (max-width: 768px) {
          .modal-content {
            width: 95%;
            margin: 20px;
          }

          .modal-header,
          .modal-body,
          .modal-footer {
            padding: 20px;
          }

          .status-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentStatusModal;