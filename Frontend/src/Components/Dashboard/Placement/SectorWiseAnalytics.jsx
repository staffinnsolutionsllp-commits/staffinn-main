import React, { useState, useEffect } from 'react';
import apiService from '../../../services/api';

const SectorWiseAnalytics = () => {
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState('');
  const [studentData, setStudentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    loadSectors();
  }, []);

  const loadSectors = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPlacementSectors();
      setSectors(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading sectors:', error);
      setSectors([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSectorStudents = async (sector) => {
    if (!sector) {
      setStudentData([]);
      return;
    }
    
    try {
      setStudentsLoading(true);
      const response = await apiService.getSectorWiseStudents(sector);
      setStudentData(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading sector students:', error);
      setStudentData([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleSectorChange = (sector) => {
    setSelectedSector(sector);
    loadSectorStudents(sector);
  };

  if (loading) {
    return (
      <div className="placement-loading">
        <div className="placement-loading-spinner"></div>
        <p>Loading sectors...</p>
      </div>
    );
  }

  return (
    <div className="sector-wise-analytics">
      <div className="analytics-header">
        <h3>🏭 Sector Wise Placement Analytics</h3>
        <p>Select a sector to view students and their placement data</p>
      </div>

      {/* Sector Selection Dropdown */}
      <div className="sector-selection" style={{ marginBottom: '20px' }}>
        <label htmlFor="sector-dropdown" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Select Sector:
        </label>
        <select 
          id="sector-dropdown"
          value={selectedSector}
          onChange={(e) => handleSectorChange(e.target.value)}
          style={{
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontSize: '14px',
            minWidth: '250px'
          }}
        >
          <option value="">-- Select a Sector --</option>
          {Array.isArray(sectors) && sectors.map((sector, index) => (
            <option key={index} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </div>

      {/* Students Table */}
      {selectedSector && (
        <div className="sector-students">
          <h4 style={{ marginBottom: '15px' }}>Students in {selectedSector} Sector</h4>
          
          {studentsLoading ? (
            <div className="placement-loading">
              <div className="placement-loading-spinner"></div>
              <p>Loading students...</p>
            </div>
          ) : studentData.length === 0 ? (
            <div className="placement-empty">
              <div className="placement-empty-icon">👥</div>
              <h3>No Students Found</h3>
              <p>No students found for the selected sector.</p>
            </div>
          ) : (
            <table className="placement-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Qualification</th>
                  <th>Center</th>
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Sector</th>
                  <th>Placed Count</th>
                  <th>Total Applications</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentData.map((student, index) => (
                  <tr key={index}>
                    <td><strong>{student.studentName}</strong></td>
                    <td>{student.qualification}</td>
                    <td>{student.center}</td>
                    <td>{student.course}</td>
                    <td>{student.batch}</td>
                    <td>
                      <span className="sector-badge">{student.sector}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${student.placedCount > 0 ? 'hired' : 'pending'}`}>
                        {student.placedCount}
                      </span>
                    </td>
                    <td>{student.totalApplications}</td>
                    <td>
                      <button 
                        className="placement-action-btn view"
                        onClick={() => {
                          alert(`Student: ${student.studentName}\nSector: ${student.sector}\nStatus: ${student.status}\nCompany: ${student.companyName}`);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!selectedSector && (
        <div className="placement-empty">
          <div className="placement-empty-icon">🏭</div>
          <h3>Select a Sector</h3>
          <p>Choose a sector from the dropdown above to view students and their placement data.</p>
        </div>
      )}
    </div>
  );
};

export default SectorWiseAnalytics;