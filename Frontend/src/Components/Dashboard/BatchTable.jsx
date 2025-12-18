import React from 'react';
import './FacultyList.css';

const BatchTable = ({ batches, onApprove, onReject, onEdit, onDelete, onReApprove, showActions }) => {
  return (
    <table className="faculty-table">
      <thead>
        <tr>
          <th>S. No</th>
          <th>Batch ID</th>
          <th>Batch Type</th>
          <th>Course</th>
          <th>Trainer Name / TOT</th>
          <th>Trainer Code</th>
          <th>Batch Start Date</th>
          <th>Batch End Date</th>
          <th>Batch Timings</th>
          <th>Total Students</th>
          <th>Batch Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {batches.map((batch, index) => (
          <tr key={batch.batchId}>
            <td>{index + 1}</td>
            <td>{batch.batchId}</td>
            <td>Regular</td>
            <td>{batch.courseName || '-'}</td>
            <td>{batch.trainerName || '-'}</td>
            <td>{batch.trainerCode || '-'}</td>
            <td>{batch.startDate || '-'}</td>
            <td>{batch.endDate || '-'}</td>
            <td>
              {batch.startTime && batch.endTime 
                ? `${batch.startTime} - ${batch.endTime}` 
                : '-'}
            </td>
            <td>{batch.selectedStudents?.length || 0}</td>
            <td>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 
                  batch.status === 'Approved' ? '#28a745' :
                  batch.status === 'Rejected' ? '#dc3545' : '#ffc107',
                color: '#fff',
                fontSize: '12px'
              }}>
                {batch.status}
              </span>
            </td>
            <td>
              {showActions.approve && (
                <button onClick={() => onApprove(batch.batchId)} className="edit-btn" style={{marginRight: '5px'}}>
                  Approve
                </button>
              )}
              {showActions.reject && (
                <button onClick={() => onReject(batch.batchId)} className="delete-btn" style={{marginRight: '5px'}}>
                  Reject
                </button>
              )}
              {showActions.edit && (
                <button onClick={() => onEdit(batch)} className="edit-btn" style={{marginRight: '5px'}}>
                  Edit
                </button>
              )}
              {showActions.reApprove && (
                <button onClick={() => onReApprove(batch.batchId)} className="edit-btn" style={{marginRight: '5px'}}>
                  Re-Approve
                </button>
              )}
              {showActions.delete && (
                <button onClick={() => onDelete(batch.batchId)} className="delete-btn">
                  Delete
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default BatchTable;
