import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { organogramAPI } from '../services/api';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [subordinates, setSubordinates] = useState([]);
  const [hasSubordinates, setHasSubordinates] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignFormData, setAssignFormData] = useState({
    employeeId: '',
    title: '',
    description: '',
    priority: 'Medium',
    deadline: '',
    category: 'General'
  });

  useEffect(() => {
    fetchTasks();
    fetchRatings();
    fetchSubordinates();
  }, []);

  const fetchTasks = async () => {
    try {
      console.log('Fetching tasks...');
      const response = await api.get('/employee/tasks');
      console.log('Tasks response:', response.data);
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      console.log('Fetching ratings...');
      const response = await api.get('/employee/performance/ratings');
      console.log('Ratings response:', response.data);
      setRatings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const fetchSubordinates = async () => {
    try {
      console.log('Fetching subordinates...');
      const response = await organogramAPI.getSubordinatesHierarchy();
      console.log('Subordinates response:', response.data);
      
      if (response.data.success) {
        const data = response.data.data;
        setHasSubordinates(data.hasSubordinates);
        setSubordinates(data.subordinates || []);
        console.log(`Has subordinates: ${data.hasSubordinates}, Count: ${data.subordinates?.length || 0}`);
      }
    } catch (error) {
      console.error('Error fetching subordinates:', error);
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    
    if (!assignFormData.employeeId || !assignFormData.title || !assignFormData.deadline) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      console.log('Assigning task:', assignFormData);
      
      const response = await api.post('/employee/tasks/assign', {
        employeeIds: [assignFormData.employeeId],
        title: assignFormData.title,
        description: assignFormData.description,
        priority: assignFormData.priority,
        deadline: assignFormData.deadline,
        category: assignFormData.category,
        startDate: new Date().toISOString()
      });
      
      console.log('Task assigned:', response.data);
      alert('Task assigned successfully!');
      
      setShowAssignForm(false);
      setAssignFormData({
        employeeId: '',
        title: '',
        description: '',
        priority: 'Medium',
        deadline: '',
        category: 'General'
      });
      
      fetchTasks();
    } catch (error) {
      console.error('Error assigning task:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to assign task';
      alert('Error: ' + errorMessage);
    }
  };

  const updateTaskStatus = async (taskId, status, percentage) => {
    try {
      console.log('Updating task:', { taskId, status, percentage });
      const response = await api.put(`/employee/tasks/${taskId}`, { status, completionPercentage: percentage });
      console.log('Update response:', response.data);
      alert('Task updated successfully');
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task: ' + (error.response?.data?.message || error.message));
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Started': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks & Performance</h1>
        
        {hasSubordinates && (
          <button
            onClick={() => setShowAssignForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Assign Task</span>
          </button>
        )}
      </div>

      <div className="mb-6 border-b">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 font-medium ${activeTab === 'tasks' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            My Tasks
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 font-medium ${activeTab === 'performance' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Performance Ratings
          </button>
        </div>
      </div>

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks assigned</h3>
              <p className="text-sm text-gray-500">You don't have any tasks at the moment</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.taskId} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden">
                {/* Header with Priority and Status */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>
                    </div>
                    <span className={`px-4 py-2 text-xs font-semibold rounded-full whitespace-nowrap ml-4 ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                </div>

                {/* Task Details */}
                <div className="px-6 py-5">
                  <div className="grid grid-cols-2 gap-6 mb-5">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start Date</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Deadline</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{task.category}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned By</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{task.assignedByName || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {task.status !== 'Pending' && (
                    <div className="mb-5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-bold text-blue-600">{task.completionPercentage || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${task.completionPercentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    {task.status !== 'Completed' && (
                      <>
                        {task.status === 'Pending' && (
                          <button
                            onClick={() => updateTaskStatus(task.taskId, 'Started', 10)}
                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Start Task</span>
                          </button>
                        )}
                        <button
                          onClick={() => updateTaskStatus(task.taskId, 'Completed', 100)}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm hover:shadow"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Mark Complete</span>
                        </button>
                      </>
                    )}
                    {task.status === 'Completed' && (
                      <div className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-50 text-green-700 text-sm font-semibold rounded-lg border border-green-200">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Task Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cycle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Quality</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task Completion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overall</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ratings.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-4 text-center">No ratings available</td></tr>
              ) : (
                ratings.map((rating) => (
                  <tr key={rating.ratingId}>
                    <td className="px-6 py-4 text-sm text-gray-900">{rating.cycle}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{rating.year}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{rating.workQuality}/5</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{rating.taskCompletion}/5</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{rating.overallPerformance}/5</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAssignForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Assign Task</h2>
              <button
                onClick={() => setShowAssignForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignFormData.employeeId}
                  onChange={(e) => setAssignFormData({...assignFormData, employeeId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Employee</option>
                  {subordinates.map(sub => (
                    <option key={sub.employeeId} value={sub.employeeId}>
                      {sub.employee?.fullName || sub.employee?.name} - {sub.position}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  You can only assign tasks to your direct or indirect subordinates
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={assignFormData.title}
                  onChange={(e) => setAssignFormData({...assignFormData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={assignFormData.description}
                  onChange={(e) => setAssignFormData({...assignFormData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Enter task description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={assignFormData.priority}
                    onChange={(e) => setAssignFormData({...assignFormData, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={assignFormData.deadline}
                    onChange={(e) => setAssignFormData({...assignFormData, deadline: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={assignFormData.category}
                  onChange={(e) => setAssignFormData({...assignFormData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="General">General</option>
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                  <option value="Testing">Testing</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
