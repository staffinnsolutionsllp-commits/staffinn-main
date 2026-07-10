import { useState } from 'react'
import { Plus, Calendar, Clock, CheckSquare, X, Edit, Trash, AlertCircle, Building2, Tag, User, TrendingUp } from 'lucide-react'
import { Task, Employee } from '../types'
import { database } from '../store/database'
import { useAuth } from '../contexts/AuthContext'

// Department → Task Category mapping
const DEPARTMENT_CATEGORIES: Record<string, string[]> = {
  'HR': ['Recruitment','Resume Screening','Interview Scheduling','Candidate Follow-up','Employee Onboarding','Attendance Management','Leave Management','Employee Documentation','Payroll Coordination','Training Coordination','Employee Engagement','Performance Review','Exit Formalities','HR Compliance','Policy Communication','Grievance Resolution','Employee Verification','HR Reports & MIS','Employee Record Update','Other'],
  'Reception': ['Visitor Management','Call Management','Courier Management','Front Desk Support','Meeting Coordination','Appointment Scheduling','Record Maintenance','Inquiry Handling','Document Receiving','Gate Pass Management','Hospitality Arrangement','Other'],
  'Accounts & Finance': ['Invoice Preparation','Payment Processing','Salary Processing','Reimbursement Processing','Expense Verification','Vendor Payment','Petty Cash Management','GST Filing','TDS Compliance','PF & ESI Compliance','Bank Reconciliation','Financial Reporting','Budget Preparation','Audit Support','Account Reconciliation','Collection Follow-up','Billing','Tax Compliance','Other'],
  'Project / Operations': ['Project Planning','Batch Creation','Candidate Verification','Mobilization Support','Centre Coordination','Documentation','Government Portal Update','Assessment Coordination','Certification Follow-up','Client Coordination','Partner Coordination','Project Monitoring','Compliance Monitoring','MIS Preparation','Report Submission','Field Visit','Project Review','Project Closure','Issue Resolution','Other'],
  'Administration / Office Management': ['Office Maintenance','Housekeeping Coordination','Asset Management','Asset Issue/Return','Inventory Management','Stationery Management','Procurement','Vendor Coordination','Facility Management','Meeting Arrangement','Conference Room Booking','Courier & Dispatch','Office Logistics','Vehicle Management','Utility Management','Event Arrangement','AMC Coordination','Security Coordination','Other'],
  'Sales / Business Development': ['Lead Generation','Cold Calling','Client Follow-up','Client Meeting','Proposal Submission','Quotation Preparation','Business Presentation','College Visit','Corporate Visit','Partnership Development','MoU Discussion','CRM Update','Market Research','Payment Follow-up','Business Expansion','Customer Relationship','Sales Reporting','Other'],
  'IT': ['User Account Management','Email Configuration','HRMS Support','Website Management','Software Installation','Hardware Installation','System Maintenance','Network Support','Printer Support','Data Backup','Data Recovery','Cyber Security','Bug Fixing','Software Development','Technical Support','Server Maintenance','System Upgrade','Other'],
  'Media': ['Photography','Videography','Video Editing','Reel Creation','Social Media Management','Content Writing','Event Coverage','YouTube Management','Facebook Management','Instagram Management','LinkedIn Management','Campaign Management','Advertisement Management','Digital Marketing','SEO Activities','Content Planning','Media Coordination','Other'],
  'Design': ['Logo Design','Banner Design','Brochure Design','Flyer Design','Social Media Creative','Presentation Design','Certificate Design','ID Card Design','Website Graphics','Print Design','Branding Material','Infographic Design','UI/UX Design','Packaging Design','Creative Revision','Artwork Finalization','Other'],
}

const DEPARTMENTS = Object.keys(DEPARTMENT_CATEGORIES)
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
const STATUSES = ['Assigned', 'In Progress', 'Pending Review', 'Completed']

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
    department: '',
    taskCategory: '',
    priority: 'Medium',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'Assigned',
    progress: 0
  })

  const getTaskCounts = () => {
    return {
      total: tasks.length,
      inProgress: tasks.filter(t => t.status === 'in-progress' || t.status === 'assigned').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => {
        const today = new Date().toISOString().split('T')[0]
        return t.dueDate < today && t.status !== 'completed'
      }).length
    }
  }

  const taskCounts = getTaskCounts()

  const validateForm = () => {
    if (!taskForm.title.trim()) { setError('Task title is required'); return false }
    if (!taskForm.assignedTo) { setError('Please assign the task to an employee'); return false }
    if (!taskForm.department) { setError('Please select a department'); return false }
    if (!taskForm.taskCategory) { setError('Please select a task category'); return false }
    if (!taskForm.startDate) { setError('Start date is required'); return false }
    if (!taskForm.dueDate) { setError('Due date is required'); return false }
    if (!taskForm.priority) { setError('Priority is required'); return false }
    return true
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validateForm() || !user) return

    try {
      database.createTask({
        title: taskForm.title,
        description: taskForm.description,
        assignedTo: taskForm.assignedTo,
        department: taskForm.department,
        taskCategory: taskForm.taskCategory,
        priority: taskForm.priority.toLowerCase() as Task['priority'],
        startDate: taskForm.startDate,
        dueDate: taskForm.dueDate,
        status: (taskForm.status === 'Assigned' ? 'pending' : taskForm.status === 'In Progress' ? 'in-progress' : 'completed') as Task['status'],
        progress: taskForm.progress,
        createdBy: user.id
      })
      setTasks(database.getTasks())
      resetForm()
    } catch {
      setError('Failed to create task')
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo,
      department: task.department || '',
      taskCategory: task.taskCategory || '',
      priority: task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium',
      startDate: task.startDate || '',
      dueDate: task.dueDate,
      status: task.status === 'pending' ? 'Assigned' : task.status === 'in-progress' ? 'In Progress' : task.status === 'completed' ? 'Completed' : 'Assigned',
      progress: task.progress || 0
    })
    setShowAddForm(true)
  }

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validateForm() || !editingTask) return

    try {
      database.updateTask(editingTask.id, {
        title: taskForm.title,
        description: taskForm.description,
        assignedTo: taskForm.assignedTo,
        department: taskForm.department,
        taskCategory: taskForm.taskCategory,
        priority: taskForm.priority.toLowerCase() as Task['priority'],
        startDate: taskForm.startDate,
        dueDate: taskForm.dueDate,
        status: (taskForm.status === 'Assigned' ? 'pending' : taskForm.status === 'In Progress' ? 'in-progress' : taskForm.status === 'Pending Review' ? 'pending-review' : 'completed') as Task['status'],
        progress: taskForm.progress
      })
      setTasks(database.getTasks())
      resetForm()
    } catch {
      setError('Failed to update task')
    }
  }

  const handleDeleteTask = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      database.deleteTask(id)
      setTasks(database.getTasks())
    }
  }

  const handleStatusUpdate = (id: string, status: Task['status']) => {
    database.updateTaskStatus(id, status)
    setTasks(database.getTasks())
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? employee.name : 'Unassigned'
  }

  const resetForm = () => {
    setShowAddForm(false)
    setEditingTask(null)
    setError('')
    setTaskForm({ title: '', description: '', assignedTo: '', department: '', taskCategory: '', priority: 'Medium', startDate: new Date().toISOString().split('T')[0], dueDate: '', status: 'Assigned', progress: 0 })
  }

  const isOverdue = (dueDate: string, status: Task['status']) => {
    const today = new Date().toISOString().split('T')[0]
    return dueDate < today && status !== 'completed'
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return 'Assigned'
      case 'in-progress': return 'In Progress'
      case 'pending-review': return 'Pending Review'
      case 'completed': return 'Completed'
      case 'assigned': return 'Assigned'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'critical': return 'bg-purple-100 text-purple-800'
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'pending-review': return 'bg-orange-100 text-orange-800'
      case 'pending': case 'assigned': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task & Project Management</h1>
          <p className="text-gray-600">Assign, track and manage department tasks</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={16} /><span>Assign Task</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Tasks', count: taskCounts.total, color: 'bg-blue-500', icon: CheckSquare },
          { label: 'In Progress', count: taskCounts.inProgress, color: 'bg-yellow-500', icon: Clock },
          { label: 'Completed', count: taskCounts.completed, color: 'bg-green-500', icon: CheckSquare },
          { label: 'Overdue', count: taskCounts.overdue, color: 'bg-red-500', icon: AlertCircle }
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon size={24} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b"><h3 className="text-lg font-semibold">All Tasks</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task, index) => (
                <tr key={task.id} className={`hover:bg-gray-50 ${isOverdue(task.dueDate, task.status) ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 text-gray-700 font-medium">{index + 1}</td>
                  <td className="px-4 py-3 text-gray-700">{task.department || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{task.taskCategory || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    {task.description && <div className="text-xs text-gray-500 mt-0.5">{task.description.substring(0, 50)}{task.description.length > 50 ? '...' : ''}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{getEmployeeName(task.assignedTo)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{task.startDate || '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={isOverdue(task.dueDate, task.status) ? 'text-red-600 font-bold' : 'text-gray-700'}>{task.dueDate}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditTask(task)} className="text-blue-600 hover:text-blue-800" title="Edit"><Edit size={15} /></button>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-red-600 hover:text-red-800" title="Delete"><Trash size={15} /></button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${task.progress || 0}%` }}></div>
                      </div>
                      <span className="text-xs font-medium text-gray-600">{task.progress || 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && <div className="text-center py-8 text-gray-500">No tasks created yet. Assign your first task to get started.</div>}
        </div>
      </div>

      {/* Assign/Edit Task Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">{editingTask ? 'Edit Task' : 'Assign New Task'}</h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {error && (
              <div className="mx-6 mt-4 flex items-center space-x-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={16} /><span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={editingTask ? handleUpdateTask : handleAddTask} className="p-6 space-y-5">
              {/* Row 1: Department + Task Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select value={taskForm.department} onChange={(e) => setTaskForm({ ...taskForm, department: e.target.value, taskCategory: '' })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Category *</label>
                  <select value={taskForm.taskCategory} onChange={(e) => setTaskForm({ ...taskForm, taskCategory: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required disabled={!taskForm.department}>
                    <option value="">Select Category</option>
                    {taskForm.department && DEPARTMENT_CATEGORIES[taskForm.department]?.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Task Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
                <input type="text" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="e.g. Hire Project Coordinator" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
              </div>

              {/* Row 3: Assigned To + Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To *</label>
                  <select value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                    <option value="">Select Employee</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} — {emp.position}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4: Start Date + Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" value={taskForm.startDate} onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required min={taskForm.startDate || undefined} />
                </div>
              </div>

              {/* Row 5: Status + Progress */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                  <input type="number" min="0" max="100" value={taskForm.progress} onChange={(e) => setTaskForm({ ...taskForm, progress: parseInt(e.target.value) || 0 })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} rows={3} placeholder="Describe the task details..." className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">{editingTask ? 'Update Task' : 'Assign Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
