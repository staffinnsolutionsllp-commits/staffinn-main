import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle, Users, Eye } from 'lucide-react';
import io from 'socket.io-client';

export default function Grievances() {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [assignedGrievances, setAssignedGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('my-grievances');
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionRemark, setActionRemark] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    priority: 'medium',
    description: ''
  });

  useEffect(() => {
    fetchGrievances();
    fetchAssignedGrievances();
    
    // Setup WebSocket for real-time updates
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4001');
    
    socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket');
      socket.emit('join-employee-room', user?.userId);
    });
    
    socket.on('grievance-status-update', (data) => {
      console.log('📡 Received grievance update:', data);
      fetchGrievances();
      fetchAssignedGrievances();
    });
    
    return () => {
      socket.disconnect();
    };
  }, [user]);

  const fetchGrievances = async () => {
    try {
      const response = await api.get('/employee/grievances');
      setGrievances(response.data.data || []);
    } catch (error) {
      console.error('Error fetching grievances:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedGrievances = async () => {
    try {
      const response = await api.get('/employee/grievances/assigned');
      setAssignedGrievances(response.data.data || []);
    } catch (error) {
      console.error('Error fetching assigned grievances:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employee/grievances', formData);
      alert('Grievance submitted successfully');
      setShowForm(false);
      setFormData({ title: '', category: '', priority: 'medium', description: '' });
      fetchGrievances();
    } catch (error) {
      alert('Error submitting grievance');
    }
  };

  const handleStatusUpdate = async (grievanceId, status) => {
    try {
      await api.put(`/employee/grievances/${grievanceId}/status`, {
        status,
        remark: actionRemark
      });
      alert(`Grievance ${status} successfully`);
      setShowDetailModal(false);
      setActionRemark('');
      fetchAssignedGrievances();
    } catch (error) {
      alert('Error updating grievance status');
    }
  };

  const openDetailModal = (grievance) => {
    setSelectedGrievance(grievance);
    setShowDetailModal(true);
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'in review': return 'bg-blue-100 text-blue-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority) => {
    const priorityLower = priority?.toLowerCase();
    switch (priorityLower) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getStatusCounts = () => {
    const allGrievances = activeTab === 'my-grievances' ? grievances : assignedGrievances;
    return {
      total: allGrievances.length,
      open: allGrievances.filter(g => g.status?.toLowerCase() === 'open' || g.status?.toLowerCase() === 'submitted').length,
      inProgress: allGrievances.filter(g => g.status?.toLowerCase() === 'in review').length,
      resolved: allGrievances.filter(g => g.status?.toLowerCase() === 'resolved').length
    };
  };

  const counts = getStatusCounts();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grievances</h1>
          <p className="text-gray-600">Submit and track your grievances</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>{showForm ? 'Cancel' : 'Submit Grievance'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('my-grievances')}
            className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'my-grievances'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MessageSquare size={16} />
              <span>My Grievances</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('assigned-grievances')}
            className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'assigned-grievances'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users size={16} />
              <span>Assigned to Me</span>
              {assignedGrievances.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                  {assignedGrievances.length}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <MessageSquare className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-2xl font-bold text-gray-900">{counts.open}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <AlertCircle className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{counts.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{counts.resolved}</p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Submit New Grievance</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Category</option>
                <option value="Workplace Harassment">Workplace Harassment</option>
                <option value="Salary Issues">Salary Issues</option>
                <option value="Work Environment">Work Environment</option>
                <option value="Manager Issues">Manager Issues</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                required
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Submit Grievance
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                {activeTab === 'assigned-grievances' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                {activeTab === 'assigned-grievances' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={activeTab === 'assigned-grievances' ? '7' : '5'} className="px-6 py-4 text-center">Loading...</td></tr>
              ) : (activeTab === 'my-grievances' ? grievances : assignedGrievances).length === 0 ? (
                <tr><td colSpan={activeTab === 'assigned-grievances' ? '7' : '5'} className="px-6 py-4 text-center text-gray-500">
                  {activeTab === 'my-grievances' ? 'No grievances submitted' : 'No grievances assigned to you'}
                </td></tr>
              ) : (
                (activeTab === 'my-grievances' ? grievances : assignedGrievances).map((grievance) => (
                  <tr key={grievance.grievanceId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{grievance.title || grievance.subject}</div>
                      <div className="text-sm text-gray-600">{grievance.description?.substring(0, 50)}...</div>
                      {grievance.escalationLevel > 0 && (
                        <div className="mt-1 text-xs text-orange-600 font-medium">
                          ⚠️ Escalated (Level {grievance.escalationLevel})
                        </div>
                      )}
                    </td>
                    {activeTab === 'assigned-grievances' && (
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{grievance.employeeName}</div>
                        <div className="text-xs text-gray-500">{grievance.employeeEmail}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-900">{grievance.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(grievance.priority)}`}>
                        {grievance.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(grievance.status)}`}>
                        {grievance.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(grievance.submittedDate || grievance.createdAt).toLocaleDateString()}
                    </td>
                    {activeTab === 'assigned-grievances' && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openDetailModal(grievance)}
                          className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <Eye size={14} />
                          <span>View & Act</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grievance Detail Modal */}
      {showDetailModal && selectedGrievance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Grievance Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Title</label>
                  <p className="text-gray-900 font-medium">{selectedGrievance.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="text-gray-900">{selectedGrievance.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    <p>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedGrievance.priority)}`}>
                        {selectedGrievance.priority}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employee</label>
                    <p className="text-gray-900">{selectedGrievance.employeeName}</p>
                    <p className="text-sm text-gray-500">{selectedGrievance.employeeEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedGrievance.status)}`}>
                        {selectedGrievance.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedGrievance.description}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Submitted Date</label>
                  <p className="text-gray-900">
                    {new Date(selectedGrievance.submittedDate || selectedGrievance.createdAt).toLocaleString()}
                  </p>
                </div>

                {selectedGrievance.escalationLevel > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm text-orange-800">
                      ⚠️ This grievance has been escalated {selectedGrievance.escalationLevel} time(s)
                    </p>
                  </div>
                )}

                {/* Status History */}
                {selectedGrievance.statusHistory && selectedGrievance.statusHistory.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Status History</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedGrievance.statusHistory.map((history, index) => (
                        <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                          <div className="flex justify-between">
                            <span className="font-medium">{history.action || history.status}</span>
                            <span className="text-gray-500 text-xs">
                              {new Date(history.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-gray-600 text-xs">
                            By: {history.changedByName} {history.assignedToName && `→ Assigned to: ${history.assignedToName}`}
                          </div>
                          {history.remark && (
                            <div className="text-gray-600 text-xs mt-1">Remark: {history.remark}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Remark (Optional)</label>
                  <textarea
                    value={actionRemark}
                    onChange={(e) => setActionRemark(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Add a remark about your action..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleStatusUpdate(selectedGrievance.grievanceId, 'In Review')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <AlertCircle size={16} />
                    <span>In Review</span>
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedGrievance.grievanceId, 'Resolved')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <CheckCircle size={16} />
                    <span>Resolve</span>
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedGrievance.grievanceId, 'Closed')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
