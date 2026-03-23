import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { grievanceAPI } from '../services/api';
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle, Users, Eye, UserX } from 'lucide-react';
import io from 'socket.io-client';

export default function Grievances() {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [assignedGrievances, setAssignedGrievances] = useState([]);
  const [reportingManagers, setReportingManagers] = useState({ immediateManager: null, nextLevelManager: null });
  const [organizationEmployees, setOrganizationEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('my-grievances');
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionRemark, setActionRemark] = useState('');
  const [grievanceType, setGrievanceType] = useState('general'); // 'general' or 'complaint'
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    priority: 'medium',
    description: '',
    assignedTo: '',
    complaintAgainstEmployeeId: ''
  });

  useEffect(() => {
    fetchGrievances();
    fetchAssignedGrievances();
    fetchReportingManagers();
    fetchOrganizationEmployees();
    
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

    socket.on('grievance-assigned', (data) => {
      console.log('📡 New grievance assigned:', data);
      fetchAssignedGrievances();
    });

    socket.on('grievance-escalated', (data) => {
      console.log('📡 Grievance escalated:', data);
      fetchAssignedGrievances();
    });
    
    return () => {
      socket.disconnect();
    };
  }, [user]);

  const fetchGrievances = async () => {
    try {
      const response = await grievanceAPI.getMyGrievances();
      setGrievances(response.data.data || []);
    } catch (error) {
      console.error('Error fetching grievances:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedGrievances = async () => {
    try {
      const response = await grievanceAPI.getAssignedGrievances();
      setAssignedGrievances(response.data.data || []);
    } catch (error) {
      console.error('Error fetching assigned grievances:', error);
    }
  };

  const fetchReportingManagers = async () => {
    try {
      console.log('🔍 Fetching reporting managers...');
      const response = await grievanceAPI.getReportingManagers();
      console.log('📊 Reporting managers FULL response:', response);
      console.log('📊 Reporting managers response.data:', response.data);
      
      if (response.data.success) {
        console.log('✅ Managers data:', response.data.data);
        console.log('✅ Immediate Manager:', response.data.data.immediateManager);
        console.log('✅ Next Level Manager:', response.data.data.nextLevelManager);
        setReportingManagers(response.data.data);
      } else {
        console.error('❌ Failed to fetch managers:', response.data.message);
        setReportingManagers({ immediateManager: null, nextLevelManager: null });
      }
    } catch (error) {
      console.error('❌ Error fetching reporting managers:', error);
      console.error('❌ Error details:', error.response?.data);
      setReportingManagers({ immediateManager: null, nextLevelManager: null });
    }
  };

  const fetchOrganizationEmployees = async () => {
    try {
      console.log('🔍 Fetching organization employees...');
      const response = await grievanceAPI.getOrganizationEmployees();
      console.log('📊 Organization employees response:', response.data);
      if (response.data.success) {
        const employees = response.data.data || [];
        console.log('✅ Employees loaded:', employees.length, employees);
        setOrganizationEmployees(employees);
      } else {
        console.error('❌ Failed to fetch employees:', response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching organization employees:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate based on grievance type
    if (grievanceType === 'complaint') {
      if (!formData.complaintAgainstEmployeeId) {
        alert('Please select an employee to file complaint against');
        return;
      }
    }
    
    try {
      const submitData = {
        title: formData.title,
        category: formData.category,
        priority: formData.priority,
        description: formData.description
      };
      
      // Add complaint-specific field if needed
      if (grievanceType === 'complaint') {
        submitData.complaintAgainstEmployeeId = formData.complaintAgainstEmployeeId;
      }
      
      await grievanceAPI.submitGrievance(submitData);
      alert('Grievance submitted successfully');
      setShowForm(false);
      setGrievanceType('general');
      setFormData({ 
        title: '', 
        category: '', 
        priority: 'medium', 
        description: '', 
        assignedTo: '',
        complaintAgainstEmployeeId: ''
      });
      fetchGrievances();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error submitting grievance';
      alert(errorMessage);
    }
  };

  const handleStatusUpdate = async (grievanceId, status) => {
    try {
      await grievanceAPI.updateGrievanceStatus(grievanceId, {
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
          
          {/* Grievance Type Selection */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-3">Grievance Type</label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => {
                  setGrievanceType('general');
                  setFormData({ ...formData, complaintAgainstEmployeeId: '' });
                }}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  grievanceType === 'general'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <MessageSquare size={20} />
                  <span className="font-medium">General Grievance</span>
                </div>
                <p className="text-xs mt-1">Automatically assigned to your reporting manager</p>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setGrievanceType('complaint');
                  setFormData({ ...formData, assignedTo: '' });
                }}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  grievanceType === 'complaint'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <UserX size={20} />
                  <span className="font-medium">Complaint Against Employee</span>
                </div>
                <p className="text-xs mt-1">Automatically assigned to the employee's manager</p>
              </button>
            </div>
          </div>

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
            
            {/* Conditional Field Based on Grievance Type */}
            {grievanceType === 'complaint' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complaint Against Employee <span className="text-red-500">*</span>
                </label>
                
                {/* Custom Employee Cards Grid */}
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
                  {organizationEmployees.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-2">No employees found</p>
                      <p className="text-xs text-gray-400">Make sure employees are added to your organization</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {organizationEmployees.map((emp) => (
                        <div
                          key={emp.employeeId}
                          onClick={() => setFormData({ ...formData, complaintAgainstEmployeeId: emp.employeeId })}
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.complaintAgainstEmployeeId === emp.employeeId
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50'
                          }`}
                        >
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                              {emp.fullName?.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          
                          {/* Employee Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {emp.fullName}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {emp.designation}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {emp.department}
                            </p>
                          </div>
                          
                          {/* Selection Indicator */}
                          {formData.complaintAgainstEmployeeId === emp.employeeId && (
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-red-600 mt-2 flex items-center">
                  <span className="mr-1">ℹ️</span>
                  This complaint will be automatically assigned to the selected employee's manager
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Automatic Assignment</h4>
                    <p className="text-sm text-blue-800">
                      This grievance will be automatically assigned to your immediate reporting manager based on the organization hierarchy.
                    </p>
                    <p className="text-xs text-blue-700 mt-2">
                      ⏱️ If no action is taken within 2 days, it will automatically escalate to the next level manager.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
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
                      {grievance.complaintAgainstEmployeeName && (
                        <div className="mt-1 text-xs text-red-600 font-medium">
                          🚨 Complaint against: {grievance.complaintAgainstEmployeeName}
                        </div>
                      )}
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

                {selectedGrievance.complaintAgainstEmployeeName && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <label className="text-sm font-medium text-red-700">Complaint Against</label>
                    <p className="text-red-900 font-medium">{selectedGrievance.complaintAgainstEmployeeName}</p>
                    <p className="text-sm text-red-600">{selectedGrievance.complaintAgainstEmployeeEmail}</p>
                  </div>
                )}

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
