import React, { useState, useEffect } from 'react';
import './FacultyList.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';

const AssessedBatchesReport = () => {
  const [centers, setCenters] = useState([]);
  const [assessedBatches, setAssessedBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCenters();
    fetchAssessedBatches();
  }, []);

  const fetchCenters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/training-centers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        console.log('Centers loaded:', data.data);
        setCenters(data.data);
      }
    } catch (error) {
      console.error('Error fetching centers:', error);
    }
  };

  const fetchAssessedBatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/batches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const approvedBatches = data.data.filter(b => b.status === 'Approved');
        setAssessedBatches(approvedBatches);
      }
    } catch (error) {
      console.error('Error fetching assessed batches:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="faculty-list-container">
      <div className="faculty-header">Assessed Batches Report</div>
      
      <div className="faculty-list-section">
        {loading ? (
          <p>Loading batches...</p>
        ) : (
          <div>
            {centers.map(center => {
              const centerBatches = assessedBatches.filter(batch => {
                console.log('Checking batch:', batch.batchId, 'Center ID:', batch.trainingCentreId, 'vs', center.id);
                return batch.trainingCentreId === center.id;
              });
              if (centerBatches.length === 0) return null;
              
              return (
                <div key={center.id} style={{ marginBottom: '30px' }}>
                  <h3>Training Center: {center.trainingCentreName || center.centerName}</h3>
                  <table className="faculty-table">
                    <thead>
                      <tr>
                        <th>Batch ID</th>
                        <th>Batch Date & Time</th>
                        <th>Course</th>
                        <th>Trainer Name</th>
                        <th>Total Students</th>
                        <th>Trained</th>
                        <th>Assessed</th>
                        <th>Certified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {centerBatches.map(batch => (
                        <tr key={batch.batchId}>
                          <td>{batch.batchId}</td>
                          <td>
                            {batch.startDate} to {batch.endDate}
                            {batch.startTime && batch.endTime && (
                              <br />
                            )}
                            {batch.startTime && batch.endTime && 
                              `${batch.startTime}–${batch.endTime}`
                            }
                          </td>
                          <td>{batch.courseName}</td>
                          <td>{batch.trainerName}</td>
                          <td>{batch.selectedStudents?.length || 0}</td>
                          <td>{batch.selectedStudents?.length || 0}</td>
                          <td>{batch.selectedStudents?.length || 0}</td>
                          <td>{batch.selectedStudents?.length || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessedBatchesReport;