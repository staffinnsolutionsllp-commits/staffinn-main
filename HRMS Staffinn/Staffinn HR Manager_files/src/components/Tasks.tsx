import  { useState } from 'react'
import { Plus, Calendar, Clock, CheckSquare, X, Edit, Trash, AlertCircle } from 'lucide-react'
import { Task, Employee } from '../types'
import { database } from '../store/database'
import { useAuth } from '../contexts/AuthContext'

export default function Tasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>(database.getTasks())
  const [employees] = useState<Employee[]>(database.getEmployees())
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [error, setError] = useState('')
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium' as Task['priority'],
    dueDate: ''
  })

  const getTaskCounts = () => {
    return {
      total: tasks.length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => {
        const today = new Date().toISOString().split('T')[0]
        return t.dueDate < today && t.status !== 'completed'
      }).length
    }
  }

  const taskCounts = getTaskCounts()

  const validateForm = () => {
    if (!taskForm.title.trim()) {
      setError('Task title is required')
      return false
    }
    if (!taskForm.assignedTo) {
      setError('Please assign the task to an employee')
      return false
    }
    if (!taskForm.dueDate) {
      setError('Due date is required')
      return false
    }
    return true
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm() || !user) return

    try {
      const newTask = database.createTask({
        ...taskForm,
        status: 'pending',
        createdBy: user.id
      })
      setTasks(database.getTasks())
      resetForm()
    } catch (err) {
      setError('Failed to create task')
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo,
      priority: task.priority,
      dueDate: task.dueDate
    })
    setShowAddForm(true)
  }

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm() || !editingTask) return

    try {
      database.updateTask(editingTask.id, taskForm)
      setTasks(database.getTasks())
      resetForm()
    } catch (err) {
      setError('Failed to update task')
    }
  }

  const handleDeleteTask = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        database.deleteTask(id)
        setTasks(database.getTasks())
      } catch (err) {
        alert('Failed to delete task')
      }
    }
  }

  const handleStatusUpdate = (id: string, status: Task['status']) => {
    try {
      database.updateTaskStatus(id, status)
      setTasks(database.getTasks())
    } catch (err) {
      alert('Failed to update task status')
    }
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? employee.name : 'Unassigned'
  }

  const resetForm = () => {
    setShowAddForm(false)
    setEditingTask(null)
    setError('')
    setTaskForm({
      title: '',
      description: '',
      assignedTo: '',
      priority: 'medium',
      dueDate: ''
    })
  }

  const isOverdue = (dueDate: string, status: Task['status']) => {
    const today = new Date().toISOString().split('T')[0]
    return dueDate < today && status !== 'completed'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task & Project Management</h1>
          <p className="text-gray-600">Assign, track and manage project tasks</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>Create Task</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Tasks', count: taskCounts.total, color: 'bg-blue-500' },
          { label: 'In Progress', count: taskCounts.inProgress, color: 'bg-yellow-500' },
          { label: 'Completed', count: taskCounts.completed, color: 'bg-green-500' },
          { label: 'Overdue', count: taskCounts.overdue, color: 'bg-red-500' }
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <CheckSquare size={24} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">All Tasks</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id} className={`hover:bg-gray-50 ${
                  isOverdue(task.dueDate, task.status) ? 'bg-red-50' : ''
                }`}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500">{task.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{getEmployeeName(task.assignedTo)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span className={isOverdue(task.dueDate, task.status) ? 'text-red-600 font-medium' : ''}>
                        {task.dueDate}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusUpdate(task.id, e.target.value as Task['status'])}
                      className={`px-2 py-1 text-xs rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditTask(task)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit Task"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Task"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No tasks created yet. Create your first task to get started.
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 flex items-center space-x-2 p-3 text-red-700 bg-red-100 border border-red-300 rounded-lg">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={editingTask ? handleUpdateTask : handleAddTask} className="space-y-4">
              <input
                type="text"
                placeholder="Task Title *"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <textarea
                placeholder="Task Description (Optional)"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                rows={3}
              />
              <select
                value={taskForm.assignedTo}
                onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Assign To *</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position}
                  </option>
                ))}
              </select>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Task['priority'] })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min={new Date().toISOString().split('T')[0]}
              />
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTask ? 'Update' : 'Create'} Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 