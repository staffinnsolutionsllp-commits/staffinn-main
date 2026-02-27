import { useState, useEffect } from 'react'
import { CheckSquare, TrendingUp, Filter, Plus, Eye, Edit2, Calendar, AlertCircle, Star } from 'lucide-react'
import { apiService } from '../services/api'

export default function TaskPerformance() {
  const [activeView, setActiveView] = useState('tasks')
  const [tasks, setTasks] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 })
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [ratings, setRatings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ employeeId: '', status: '', priority: '' })
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [ratingEmployeeSearch, setRatingEmployeeSearch] = useState('')
  const [taskForm, setTaskForm] = useState({
    employeeIds: [] as string[],
    title: '',
    description: '',
    priority: 'Medium',
    startDate: '',
    deadline: '',
    category: 'General'
  })
  const [ratingForm, setRatingForm] = useState({
    employeeId: '',
    cycle: 'Q1',
    year: new Date().getFullYear(),
    workQuality: 0,
    taskCompletion: 0,
    discipline: 0,
    teamCollaboration: 0,
    overallPerformance: 0,
    remarks: ''
  })

  useEffect(() => {
    loadData()
  }, [activeView, filters])

  const loadData = async () => {
    try {
      setLoading(true)
      if (activeView === 'tasks') {
        await Promise.all([loadTasks(), loadStats(), loadEmployees()])
      } else if (activeView === 'performance') {
        await loadPerformanceData()
      } else if (activeView === 'ratings') {
        await loadRatings()
      }
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const response = await apiService.getEmployees()
      console.log('Employee API Response:', response)
      if (response.success) {
        console.log('Employees Data:', response.data)
        setEmployees(response.data)
      }
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const loadTasks = async () => {
    try {
      const response = await apiService.getTasks(filters)
      if (response.success) setTasks(response.data)
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiService.getTaskStats()
      if (response.success) setStats(response.data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadPerformanceData = async () => {
    try {
      const response = await apiService.getPerformanceChart()
      if (response.success) setPerformanceData(response.data)
    } catch (error) {
      console.error('Error loading performance data:', error)
    }
  }

  const loadRatings = async () => {
    try {
      const response = await apiService.getRatings()
      if (response.success) setRatings(response.data)
    } catch (error) {
      console.error('Error loading ratings:', error)
    }
  }

  const handleAssignTask = async () => {
    try {
      if (!taskForm.employeeIds.length || !taskForm.title || !taskForm.deadline) {
        alert('Please fill all required fields')
        return
      }
      await apiService.assignTask(taskForm)
      setShowTaskModal(false)
      setTaskForm({ employeeIds: [], title: '', description: '', priority: 'Medium', startDate: '', deadline: '', category: 'General' })
      setEmployeeSearch('')
      loadData()
    } catch (error) {
      alert('Failed to assign task')
    }
  }

  const handleAddRating = async () => {
    try {
      if (!ratingForm.employeeId) {
        alert('Please select an employee')
        return
      }
      await apiService.addRating(ratingForm)
      setShowRatingModal(false)
      setRatingForm({ employeeId: '', cycle: 'Q1', year: new Date().getFullYear(), workQuality: 0, taskCompletion: 0, discipline: 0, teamCollaboration: 0, overallPerformance: 0, remarks: '' })
      setRatingEmployeeSearch('')
      loadData()
    } catch (error) {
      alert('Failed to add rating')
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const searchLower = employeeSearch.toLowerCase()
    const empName = (emp.name || emp.employeeName || emp.fullName || '').toLowerCase()
    const empId = (emp.employeeId || emp.id || emp.userId || '').toString().toLowerCase()
    const empEmail = (emp.email || '').toLowerCase()
    console.log('Filtering employee:', { emp, empName, empId, searchLower })
    return empName.includes(searchLower) || empId.includes(searchLower) || empEmail.includes(searchLower)
  })

  const filteredRatingEmployees = employees.filter(emp => {
    const searchLower = ratingEmployeeSearch.toLowerCase()
    const empName = (emp.name || emp.employeeName || emp.fullName || '').toLowerCase()
    const empId = (emp.employeeId || emp.id || emp.userId || '').toString().toLowerCase()
    const empEmail = (emp.email || '').toLowerCase()
    return empName.includes(searchLower) || empId.includes(searchLower) || empEmail.includes(searchLower)
  })

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      await apiService.updateTaskStatus(taskId, { status })
      loadData()
    } catch (error) {
      alert('Failed to update task status')
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task & Performance</h1>
          <p className="text-gray-600">Manage tasks and track employee performance</p>
        </div>
        <div className="flex space-x-3">
          {activeView === 'tasks' && (
            <button onClick={() => setShowTaskModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus size={18} />
              <span>Assign Task</span>
            </button>
          )}
          {activeView === 'ratings' && (
            <button onClick={() => setShowRatingModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Star size={18} />
              <span>Add Rating</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex space-x-4 border-b">
        <button onClick={() => setActiveView('tasks')} className={`px-4 py-2 ${activeView === 'tasks' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
          <CheckSquare className="inline mr-2" size={18} />
          Tasks
        </button>
        <button onClick={() => setActiveView('performance')} className={`px-4 py-2 ${activeView === 'performance' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
          <TrendingUp className="inline mr-2" size={18} />
          Performance Chart
        </button>
        <button onClick={() => setActiveView('ratings')} className={`px-4 py-2 ${activeView === 'ratings' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
          <Star className="inline mr-2" size={18} />
          ACR / Ratings
        </button>
      </div>

      {activeView === 'tasks' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-full"><CheckSquare className="text-blue-600" size={24} /></div>
                <div>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-orange-100 rounded-full"><Calendar className="text-orange-600" size={24} /></div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-yellow-100 rounded-full"><Edit2 className="text-yellow-600" size={24} /></div>
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-full"><CheckSquare className="text-green-600" size={24} /></div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-red-100 rounded-full"><AlertCircle className="text-red-600" size={24} /></div>
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-4 mb-4">
              <Filter size={20} className="text-gray-500" />
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 border rounded-lg">
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="px-3 py-2 border rounded-lg">
                <option value="">All Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tasks.map((task) => {
                    const employee = employees.find(e => (e.employeeId || e.id || e.userId) === task.employeeId)
                    const empName = employee?.name || employee?.employeeName || employee?.fullName || '-'
                    return (
                      <tr key={task.taskId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{task.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{empName}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{task.employeeId}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            task.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                            task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>{task.priority}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{new Date(task.deadline).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>{task.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => setSelectedTask(task)} className="text-blue-600 hover:text-blue-800">
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeView === 'performance' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Employee Performance Overview</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Tasks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overdue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {performanceData.map((emp) => {
                  const employee = employees.find(e => (e.employeeId || e.id || e.userId) === emp.employeeId)
                  const empName = employee?.name || employee?.employeeName || employee?.fullName || '-'
                  return (
                    <tr key={emp.employeeId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{empName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{emp.employeeId}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{emp.totalTasks}</td>
                      <td className="px-6 py-4 text-sm text-green-600">{emp.completed}</td>
                      <td className="px-6 py-4 text-sm text-orange-600">{emp.pending}</td>
                      <td className="px-6 py-4 text-sm text-red-600">{emp.overdue}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{emp.completionRate}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'ratings' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">ACR / Internal Ratings</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cycle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Quality</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task Completion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overall</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rated By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ratings.map((rating) => {
                  const employee = employees.find(e => (e.employeeId || e.id || e.userId) === rating.employeeId)
                  const empName = employee?.name || employee?.employeeName || employee?.fullName || '-'
                  return (
                    <tr key={rating.ratingId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{empName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{rating.employeeId}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{rating.cycle}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{rating.year}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{rating.workQuality}/5</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{rating.taskCompletion}/5</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{rating.overallPerformance}/5</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{rating.ratedByName}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Assign Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Employees *</label>
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mb-2"
                />
                {employeeSearch && (
                  <select multiple value={taskForm.employeeIds} onChange={(e) => setTaskForm({ ...taskForm, employeeIds: Array.from(e.target.selectedOptions, option => option.value) })} className="w-full px-3 py-2 border rounded-lg" size={5}>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map(emp => {
                        const displayName = emp.name || emp.employeeName || emp.fullName || emp.email || 'Unknown'
                        const displayId = emp.employeeId || emp.id || emp.userId || ''
                        console.log('Rendering employee option:', { displayName, displayId, emp })
                        return <option key={displayId} value={displayId}>{displayName} ({displayId})</option>
                      })
                    ) : (
                      <option disabled>No employees found</option>
                    )}
                  </select>
                )}
                {taskForm.employeeIds.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {taskForm.employeeIds.length} employee(s)
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input type="text" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input type="text" value={taskForm.category} onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input type="date" value={taskForm.startDate} onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Deadline *</label>
                  <input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowTaskModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAssignTask} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Assign Task</button>
            </div>
          </div>
        </div>
      )}

      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Add Performance Rating</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3">
                  <label className="block text-sm font-medium mb-1">Employee *</label>
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={ratingEmployeeSearch}
                    onChange={(e) => setRatingEmployeeSearch(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg mb-2"
                  />
                  {ratingEmployeeSearch && (
                    <select value={ratingForm.employeeId} onChange={(e) => setRatingForm({ ...ratingForm, employeeId: e.target.value })} className="w-full px-3 py-2 border rounded-lg mb-2" size={5}>
                      <option value="">Select Employee</option>
                      {filteredRatingEmployees.length > 0 ? (
                        filteredRatingEmployees.map(emp => {
                          const displayName = emp.name || emp.employeeName || emp.fullName || emp.email || 'Unknown'
                          const displayId = emp.employeeId || emp.id || emp.userId || ''
                          return <option key={displayId} value={displayId}>{displayName} ({displayId})</option>
                        })
                      ) : (
                        <option disabled>No employees found</option>
                      )}
                    </select>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cycle</label>
                  <select value={ratingForm.cycle} onChange={(e) => setRatingForm({ ...ratingForm, cycle: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="Q1">Q1</option>
                    <option value="Q2">Q2</option>
                    <option value="Q3">Q3</option>
                    <option value="Q4">Q4</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Year</label>
                  <input type="number" value={ratingForm.year} onChange={(e) => setRatingForm({ ...ratingForm, year: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Work Quality (0-5)</label>
                  <input type="number" min="0" max="5" step="0.5" value={ratingForm.workQuality} onChange={(e) => setRatingForm({ ...ratingForm, workQuality: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Task Completion (0-5)</label>
                  <input type="number" min="0" max="5" step="0.5" value={ratingForm.taskCompletion} onChange={(e) => setRatingForm({ ...ratingForm, taskCompletion: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discipline (0-5)</label>
                  <input type="number" min="0" max="5" step="0.5" value={ratingForm.discipline} onChange={(e) => setRatingForm({ ...ratingForm, discipline: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Team Collaboration (0-5)</label>
                  <input type="number" min="0" max="5" step="0.5" value={ratingForm.teamCollaboration} onChange={(e) => setRatingForm({ ...ratingForm, teamCollaboration: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Overall Performance (0-5)</label>
                <input type="number" min="0" max="5" step="0.5" value={ratingForm.overallPerformance} onChange={(e) => setRatingForm({ ...ratingForm, overallPerformance: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <textarea value={ratingForm.remarks} onChange={(e) => setRatingForm({ ...ratingForm, remarks: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowRatingModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddRating} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Rating</button>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-semibold mb-4">Task Details</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-medium">Title:</span> {selectedTask.title}</div>
                <div><span className="font-medium">Employee Name:</span> {employees.find(e => (e.employeeId || e.id || e.userId) === selectedTask.employeeId)?.name || employees.find(e => (e.employeeId || e.id || e.userId) === selectedTask.employeeId)?.employeeName || employees.find(e => (e.employeeId || e.id || e.userId) === selectedTask.employeeId)?.fullName || '-'}</div>
                <div><span className="font-medium">Employee ID:</span> {selectedTask.employeeId}</div>
                <div><span className="font-medium">Priority:</span> {selectedTask.priority}</div>
                <div><span className="font-medium">Status:</span> {selectedTask.status}</div>
                <div><span className="font-medium">Deadline:</span> {new Date(selectedTask.deadline).toLocaleDateString()}</div>
                <div><span className="font-medium">Category:</span> {selectedTask.category}</div>
              </div>
              <div><span className="font-medium">Description:</span> {selectedTask.description}</div>
              <div><span className="font-medium">Assigned By:</span> {selectedTask.assignedByName}</div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setSelectedTask(null)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>
              {selectedTask.status !== 'Completed' && (
                <>
                  <button onClick={() => { handleUpdateTaskStatus(selectedTask.taskId, 'In Progress'); setSelectedTask(null); }} className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Mark In Progress</button>
                  <button onClick={() => { handleUpdateTaskStatus(selectedTask.taskId, 'Completed'); setSelectedTask(null); }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Mark Completed</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
