import React, { useState, useEffect } from 'react';
import './FacultyList.css';
import BatchTable from './BatchTable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';

const ApprovedBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBatches();
    
    // Check for expired batches every hour
    const interval = setInterval(() => {
      fetchBatches();
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const checkAndMoveExpiredBatches = async (batches) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiredBatches = batches.filter(batch => {
      if (!batch.endDate) return false;
      const endDate = new Date(batch.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate < today;
    });

    for (const batch of expiredBatches) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/batches/${batch.batchId}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'Closed' })
        });
      } catch (error) {
        console.error('Error moving batch to closed:', error);
      }
    }

    return batches.filter(batch => {
      if (!batch.endDate) return true;
      const endDate = new Date(batch.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate >= today;
    });
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/batches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const approvedBatches = data.data.filter(b => b.status === 'Approved');
        const activeBatches = await checkAndMoveExpiredBatches(approvedBatches);
        setBatches(activeBatches);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (batch) => {
    alert('Edit functionality - Coming soon');
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
      <div className="faculty-header">Approved Batches</div>
      
      <div className="faculty-list-section">
        {loading ? (
          <p>Loading batches...</p>
        ) : batches.length === 0 ? (
          <p>No approved batches.</p>
        ) : (
          <BatchTable 
            batches={batches}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showActions={{ edit: true, delete: true }}
          />
        )}
      </div>
    </div>
  );
};

export default ApprovedBatches;
