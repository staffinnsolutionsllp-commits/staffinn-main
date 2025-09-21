import React, { useState, useEffect } from 'react';
import adminAPI from '../services/adminApi';

const GovernmentSchemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [formData, setFormData] = useState({
    schemeName: '',
    schemeLink: '',
    description: '',
    visibility: 'All'
  });

  useEffect(() => {
    loadSchemes();
  }, []);

  const loadSchemes = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getGovernmentSchemes();
      if (response.success) {
        setSchemes(response.data || []);
      }
    } catch (error) {
      console.error('Error loading schemes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.schemeName.trim() || !formData.schemeLink.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      if (editingScheme) {
        const response = await adminAPI.updateGovernmentScheme(editingScheme.schemeId, formData);
        if (response.success) {
          alert('Scheme updated successfully!');
          await loadSchemes();
        } else {
          alert('Failed to update scheme: ' + response.message);
        }
      } else {
        const response = await adminAPI.addGovernmentScheme(formData);
        if (response.success) {
          alert('Scheme added successfully!');
          await loadSchemes();
        } else {
          alert('Failed to add scheme: ' + response.message);
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error submitting scheme:', error);
      alert('Failed to submit scheme');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (scheme) => {
    setEditingScheme(scheme);
    setFormData({
      schemeName: scheme.schemeName,
      schemeLink: scheme.schemeLink,
      description: scheme.description || '',
      visibility: scheme.visibility
    });
    setShowForm(true);
  };

  const handleDelete = async (schemeId) => {
    if (!window.confirm('Are you sure you want to delete this scheme?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.deleteGovernmentScheme(schemeId);
      if (response.success) {
        alert('Scheme deleted successfully!');
        await loadSchemes();
      } else {
        alert('Failed to delete scheme: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting scheme:', error);
      alert('Failed to delete scheme');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      schemeName: '',
      schemeLink: '',
      description: '',
      visibility: 'All'
    });
    setShowForm(false);
    setEditingScheme(null);
  };

  const getVisibilityBadge = (visibility) => {
    const colors = {
      'All': '#28a745',
      'Staff': '#007bff',
      'Recruiter': '#6f42c1'
    };
    
    return (
      <span 
        style={{
          backgroundColor: colors[visibility] || '#6c757d',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        {visibility}
      </span>
    );
  };

  return (
    <div className="government-schemes">
      <div className="schemes-header">
        <h2>Government Schemes Management</h2>
        <button 
          className="add-scheme-btn"
          onClick={() => setShowForm(true)}
          disabled={loading}
        >
          + Add New Scheme
        </button>
      </div>

      {showForm && (
        <div className="scheme-form-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingScheme ? 'Edit Scheme' : 'Add New Scheme'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Scheme Name *</label>
                <input
                  type="text"
                  name="schemeName"
                  value={formData.schemeName}
                  onChange={handleInputChange}
                  placeholder="Enter scheme name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Scheme Link *</label>
                <input
                  type="url"
                  name="schemeLink"
                  value={formData.schemeLink}
                  onChange={handleInputChange}
                  placeholder="https://example.com/scheme"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter scheme description (optional)"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Visibility *</label>
                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleInputChange}
                  required
                >
                  <option value="All">All (Staff & Recruiters)</option>
                  <option value="Staff">Staff Only</option>
                  <option value="Recruiter">Recruiters Only</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={resetForm} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingScheme ? 'Update Scheme' : 'Add Scheme')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="schemes-list">
        {loading && schemes.length === 0 ? (
          <div className="loading">Loading schemes...</div>
        ) : schemes.length === 0 ? (
          <div className="no-schemes">
            <p>No government schemes added yet.</p>
            <p>Click "Add New Scheme" to create your first scheme.</p>
          </div>
        ) : (
          <div className="schemes-table">
            <table>
              <thead>
                <tr>
                  <th>Scheme Name</th>
                  <th>Description</th>
                  <th>Link</th>
                  <th>Visibility</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schemes.map((scheme) => (
                  <tr key={scheme.schemeId}>
                    <td>{scheme.schemeName}</td>
                    <td>
                      <div className="description-cell">
                        {scheme.description ? (
                          <span title={scheme.description}>
                            {scheme.description.length > 50 
                              ? `${scheme.description.substring(0, 50)}...` 
                              : scheme.description
                            }
                          </span>
                        ) : (
                          <span className="no-description">No description</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <a 
                        href={scheme.schemeLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="scheme-link"
                      >
                        View Link
                      </a>
                    </td>
                    <td>{getVisibilityBadge(scheme.visibility)}</td>
                    <td>{new Date(scheme.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(scheme)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(scheme.schemeId)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .government-schemes {
          padding: 20px;
        }

        .schemes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .schemes-header h2 {
          margin: 0;
          color: #333;
        }

        .add-scheme-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 500;
        }

        .add-scheme-btn:hover {
          background: #0056b3;
        }

        .add-scheme-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .scheme-form-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 0;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h3 {
          margin: 0;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .close-btn:hover {
          color: #333;
        }

        form {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #007bff;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 30px;
        }

        .form-actions button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .form-actions button[type="button"] {
          background: #6c757d;
          color: white;
        }

        .form-actions button[type="submit"] {
          background: #28a745;
          color: white;
        }

        .form-actions button:hover {
          opacity: 0.9;
        }

        .form-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading,
        .no-schemes {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .schemes-table {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .schemes-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .schemes-table th,
        .schemes-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .schemes-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
        }

        .scheme-link {
          color: #007bff;
          text-decoration: none;
        }

        .scheme-link:hover {
          text-decoration: underline;
        }

        .edit-btn,
        .delete-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          margin-right: 5px;
        }

        .edit-btn {
          background: #ffc107;
          color: #212529;
        }

        .delete-btn {
          background: #dc3545;
          color: white;
        }

        .edit-btn:hover,
        .delete-btn:hover {
          opacity: 0.9;
        }

        .edit-btn:disabled,
        .delete-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .description-cell {
          max-width: 200px;
        }

        .no-description {
          color: #999;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default GovernmentSchemes;