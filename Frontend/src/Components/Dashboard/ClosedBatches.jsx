import React, { useState, useEffect } from 'react';
import './FacultyList.css';
import BatchTable from './BatchTable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';

const ClosedBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/batches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const closedBatches = data.data.filter(b => b.status === 'Closed');
        setBatches(closedBatches);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (batchId) => {
    if (window.confirm('Delete this batch?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/batches/${batchId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
          alert('Batch deleted!');
          fetchBatches();
        }
      } catch (error) {
        alert('Delete failed');
      }
    }
  };

  return (
    <div className="faculty-list-container">
      <div className="faculty-header">Closed Batches</div>
      
      <div className="faculty-list-section">
        {loading ? (
          <p>Loading batches...</p>
        ) : batches.length === 0 ? (
          <p>No closed batches.</p>
        ) : (
          <BatchTable 
            batches={batches}
            onDelete={handleDelete}
            showActions={{ delete: true }}
          />
        )}
      </div>
    </div>
  );
};

export default ClosedBatches;