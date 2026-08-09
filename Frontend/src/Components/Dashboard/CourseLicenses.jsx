import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

const CourseLicenses = () => {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    setLoading(true);
    const response = await apiService.getMyCourseLicenses();
    if (response.success) setLicenses(response.data || []);
    setLoading(false);
  };

  const openLicenseDetail = async (license) => {
    setDetailLoading(true);
    setSelectedLicense(null);
    setSelectedEmployees([]);

    const [detailRes, empRes] = await Promise.all([
      apiService.getCourseLicenseDetails(license.licenseId),
      apiService.getAvailableEmployees(license.licenseId)
    ]);

    if (detailRes.success) setSelectedLicense(detailRes.data);
    if (empRes.success) setAvailableEmployees(empRes.data.available || []);
    setDetailLoading(false);
  };

  const handleAssign = async () => {
    if (selectedEmployees.length === 0) return alert('Select at least one employee');
    if (selectedEmployees.length > selectedLicense.quantityRemaining) {
      return alert(`Only ${selectedLicense.quantityRemaining} seat(s) remaining`);
    }

    setAssigning(true);
    const res = await apiService.assignCourseToEmployees(selectedLicense.licenseId, selectedEmployees);
    setAssigning(false);

    if (res.success) {
      alert(res.message);
      setSelectedEmployees([]);
      openLicenseDetail(selectedLicense);
      loadLicenses();
    } else {
      alert(res.message || 'Assignment failed');
    }
  };

  const handleRevoke = async (assignmentId, employeeName) => {
    if (!window.confirm(`Revoke course access for ${employeeName}?`)) return;
    const res = await apiService.revokeAssignment(assignmentId);
    if (res.success) {
      alert('Assignment revoked');
      openLicenseDetail(selectedLicense);
      loadLicenses();
    } else {
      alert(res.message || 'Failed to revoke');
    }
  };

  const toggleEmployee = (empId) => {
    setSelectedEmployees(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  if (loading) return <div style={{ padding: '24px', textAlign: 'center' }}>Loading course licenses...</div>;

  // ─── DETAIL VIEW ────────────────────────────────────────────────────────────
  if (selectedLicense) {
    return (
      <div style={{ padding: '0' }}>
        <button onClick={() => setSelectedLicense(null)} style={{
          background: 'none', border: 'none', color: '#2563eb', fontWeight: '600',
          cursor: 'pointer', marginBottom: '16px', fontSize: '14px'
        }}>← Back to Licenses</button>

        {/* License Header */}
        <div style={{
          background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
          padding: '24px', marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '18px' }}>{selectedLicense.courseName}</h3>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '14px', color: '#64748b' }}>
            <span>Purchased: <strong style={{ color: '#1e293b' }}>{selectedLicense.quantityPurchased}</strong></span>
            <span>Assigned: <strong style={{ color: '#d97706' }}>{selectedLicense.quantityAssigned}</strong></span>
            <span>Remaining: <strong style={{ color: '#059669' }}>{selectedLicense.quantityRemaining}</strong></span>
            <span>Total Paid: <strong style={{ color: '#1e293b' }}>₹{selectedLicense.totalAmount?.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Current Assignments */}
        {selectedLicense.assignments && selectedLicense.assignments.length > 0 && (
          <div style={{
            background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
            padding: '20px', marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '15px', color: '#374151' }}>
              Assigned Employees ({selectedLicense.assignments.filter(a => a.status !== 'revoked').length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedLicense.assignments.filter(a => a.status !== 'revoked').map(a => (
                <div key={a.assignmentId} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb'
                }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#1e293b' }}>{a.employeeName}</strong>
                    <span style={{ marginLeft: '10px', fontSize: '12px', color: '#64748b' }}>{a.employeeEmail}</span>
                    <span style={{
                      marginLeft: '10px', fontSize: '11px', fontWeight: '600',
                      padding: '2px 8px', borderRadius: '10px',
                      background: a.status === 'completed' ? '#dcfce7' : a.status === 'in-progress' ? '#fef3c7' : '#eff6ff',
                      color: a.status === 'completed' ? '#166534' : a.status === 'in-progress' ? '#92400e' : '#1e40af'
                    }}>{a.status} {a.progress > 0 ? `(${a.progress}%)` : ''}</span>
                  </div>
                  <button onClick={() => handleRevoke(a.assignmentId, a.employeeName)} style={{
                    background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                    borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '500'
                  }}>Revoke</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assign New Employees */}
        {selectedLicense.quantityRemaining > 0 && (
          <div style={{
            background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px'
          }}>
            <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#374151' }}>
              Assign Course to Employees
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
              Select employees to assign ({selectedLicense.quantityRemaining} seat(s) available)
            </p>

            {availableEmployees.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>No available employees (all assigned or no HRMS employees found)</p>
            ) : (
              <>
                <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                  {availableEmployees.map(emp => (
                    <label key={emp.employeeId} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                      background: selectedEmployees.includes(emp.employeeId) ? '#eff6ff' : '#fff'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp.employeeId)}
                        onChange={() => toggleEmployee(emp.employeeId)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{emp.fullName}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{emp.designation} • {emp.department}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {selectedEmployees.length > 0 && (
                  <button onClick={handleAssign} disabled={assigning} style={{
                    marginTop: '14px', padding: '10px 20px', background: '#2563eb',
                    color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600',
                    fontSize: '13px', cursor: assigning ? 'not-allowed' : 'pointer',
                    opacity: assigning ? 0.6 : 1
                  }}>
                    {assigning ? 'Assigning...' : `Assign to ${selectedEmployees.length} Employee(s)`}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '0' }}>
      {licenses.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
          <h3 style={{ color: '#374151', marginBottom: '8px' }}>No Course Licenses Yet</h3>
          <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
            Purchase course seats from the Courses section and manage employee assignments here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {licenses.map(license => (
            <div key={license.licenseId} onClick={() => openLicenseDetail(license)} style={{
              background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
              padding: '18px 22px', cursor: 'pointer', transition: 'box-shadow 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
            onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
            onMouseOut={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#1e293b' }}>{license.courseName}</h4>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Purchased: {new Date(license.purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Seats</div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#1e293b', fontWeight: '600' }}>{license.quantityPurchased} total</span>
                    <span style={{ color: '#d97706' }}>{license.quantityAssigned} used</span>
                    <span style={{ color: '#059669' }}>{license.quantityRemaining} free</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: '12px', height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '2px',
                  width: `${(license.quantityAssigned / license.quantityPurchased) * 100}%`,
                  background: license.quantityRemaining === 0 ? '#059669' : '#2563eb',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseLicenses;
