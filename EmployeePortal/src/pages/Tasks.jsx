import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    fetchTasks();
    fetchRatings();
  }, []);

  const fetchTasks = async () => {
    try {
      console.log('Fetching tasks...');
      const response = await api.get('/employee/tasks');
      console.log('Tasks response:', response.data);
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      console.error('Error response:', error.response?.data);
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
      console.error('Error response:', error.response?.data);
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
      console.error('Error response:', error.response?.data);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tasks & Performance</h1>

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
            <div className="text-center py-8">Loading...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tasks assigned</div>
          ) : (
            tasks.map((task) => (
              <div key={task.taskId} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Start Date:</span>
                    <span className="ml-2 text-gray-900">{new Date(task.startDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Deadline:</span>
                    <span className="ml-2 text-gray-900">{new Date(task.deadline).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-2 text-gray-900">{task.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Assigned By:</span>
                    <span className="ml-2 text-gray-900">{task.assignedByName}</span>
                  </div>
                </div>
                {task.status !== 'Started' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="text-gray-900">{task.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${task.completionPercentage}%` }}></div>
                    </div>
                  </div>
                )}
                <div className="flex space-x-2">
                  {task.status !== 'Completed' && (
                    <>
                      <button
                        onClick={() => updateTaskStatus(task.taskId, 'Started', task.completionPercentage)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => updateTaskStatus(task.taskId, 'Completed', 100)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Complete
                      </button>
                    </>
                  )}
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
    </div>
  );
}
