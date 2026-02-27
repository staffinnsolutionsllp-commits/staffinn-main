import { useState, useEffect } from 'react'
import { MessageSquare, Filter, Eye, TrendingUp, AlertCircle, CheckCircle, Clock, Calendar, User } from 'lucide-react'
import { apiService } from '../services/api'

export default function GrievanceManagement() {
  const [grievances, setGrievances] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, pending: 0 })
  const [categoryBreakdown, setCategoryBreakdown] = useState<any>({})
  const [departmentBreakdown, setDepartmentBreakdown] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ employeeId: '', category: '', status: '', department: '', startDate: '', endDate: '' })
  const [selectedGrievance, setSelectedGrievance] = useState<any>(null)
  const [remarkText, setRemarkText] = useState('')
  const [statusUpdate, setStatusUpdate] = useState({ status: '', priority: '', remark: '' })

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadGrievances(), loadStats(), loadEmployees()])
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const response = await apiService.getEmployees()
      if (response.success) setEmployees(response.data)
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const loadGrievances = async () => {
    try {
      const response = await apiService.getGrievances(filters)
      if (response.success) setGrievances(response.data)
    } catch (error) {
      console.error('Error loading grievances:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiService.getGrievanceStats()
      if (response.success) {
        setStats(response.data.stats)
        setCategoryBreakdown(response.data.categoryBreakdown)
        setDepartmentBreakdown(response.data.departmentBreakdown)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleUpdateStatus = async () => {
    try {
      if (!statusUpdate.status) {
        alert('Please select a status')
        return
      }
      await apiService.updateGrievanceStatus(selectedGrievance.grievanceId, statusUpdate)
      setStatusUpdate({ status: '', priority: '', remark: '' })
      loadData()
      const updated = await apiService.getGrievanceById(selectedGrievance.grievanceId)
      if (updated.success) setSelectedGrievance(updated.data)
    } catch (error) {
      alert('Failed to update status')
    }
  }

  const handleAddRemark = async () => {
    try {
      if (!remarkText.trim()) {
        alert('Please enter a remark')
        return
      }
      await apiService.addGrievanceRemark(selectedGrievance.grievanceId, remarkText)
      setRemarkText('')
      const updated = await apiService.getGrievanceById(selectedGrievance.grievanceId)
      if (updated.success) setSelectedGrievance(updated.data)
      loadData()
    } catch (error) {
      alert('Failed to add remark')
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grievance Management</h1>
          <p className="text-gray-600">View and manage all employee grievances</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full"><MessageSquare className="text-blue-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-full"><AlertCircle className="text-orange-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-full"><Clock className="text-yellow-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full"><CheckCircle className="text-green-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gray-100 rounded-full"><CheckCircle className="text-gray-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-full"><TrendingUp className="text-red-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Employee</label>
            <select value={filters.employeeId} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="">All Employees</option>
              {employees.map(emp => {
                const displayName = emp.name || emp.employeeName || emp.fullName || emp.email || 'Unknown'
                const displayId = emp.employeeId || emp.id || emp.userId || ''
                return <option key={displayId} value={displayId}>{displayName} ({displayId})</option>
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="">All Categories</option>
              <option value="Workplace Harassment">Workplace Harassment</option>
              <option value="Discrimination">Discrimination</option>
              <option value="Salary Issues">Salary Issues</option>
              <option value="Work Environment">Work Environment</option>
              <option value="Management Issues">Management Issues</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {grievances.map((grievance) => {
                const employee = employees.find(e => (e.employeeId || e.id || e.userId) === grievance.employeeId)
                const empName = employee?.name || employee?.employeeName || employee?.fullName || grievance.employeeName || '-'
                return (
                  <tr key={grievance.grievanceId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{grievance.grievanceId.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{empName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{grievance.employeeId}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{grievance.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{grievance.subject}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{grievance.department || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(grievance.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        grievance.status === 'Resolved' || grievance.status === 'Closed' ? 'bg-green-100 text-green-800' :
                        grievance.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>{grievance.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        grievance.priority === 'High' ? 'bg-red-100 text-red-800' :
                        grievance.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>{grievance.priority}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelectedGrievance(grievance)} className="text-blue-600 hover:text-blue-800">
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

      {selectedGrievance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Grievance Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                <div><span className="font-medium">Grievance ID:</span> {selectedGrievance.grievanceId}</div>
                <div><span className="font-medium">Employee Name:</span> {employees.find(e => (e.employeeId || e.id || e.userId) === selectedGrievance.employeeId)?.name || employees.find(e => (e.employeeId || e.id || e.userId) === selectedGrievance.employeeId)?.employeeName || selectedGrievance.employeeName || '-'}</div>
                <div><span className="font-medium">Employee ID:</span> {selectedGrievance.employeeId}</div>
                <div><span className="font-medium">Department:</span> {selectedGrievance.department || '-'}</div>
                <div><span className="font-medium">Category:</span> {selectedGrievance.category}</div>
                <div><span className="font-medium">Status:</span> <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedGrievance.status === 'Resolved' || selectedGrievance.status === 'Closed' ? 'bg-green-100 text-green-800' :
                  selectedGrievance.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-orange-100 text-orange-800'
                }`}>{selectedGrievance.status}</span></div>
                <div><span className="font-medium">Priority:</span> <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedGrievance.priority === 'High' ? 'bg-red-100 text-red-800' :
                  selectedGrievance.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>{selectedGrievance.priority}</span></div>
                <div><span className="font-medium">Submitted Date:</span> {new Date(selectedGrievance.createdAt).toLocaleString()}</div>
                <div><span className="font-medium">Confidential:</span> {selectedGrievance.isConfidential ? 'Yes' : 'No'}</div>
                <div><span className="font-medium">Submitted By:</span> {selectedGrievance.submittedByName || '-'}</div>
              </div>
              
              <div className="border-t pt-4">
                <span className="font-medium">Subject:</span>
                <p className="mt-2 text-gray-700">{selectedGrievance.subject}</p>
              </div>
              
              <div className="border-t pt-4">
                <span className="font-medium">Description:</span>
                <p className="mt-2 text-gray-700 whitespace-pre-wrap">{selectedGrievance.description}</p>
              </div>

              {selectedGrievance.statusHistory && selectedGrievance.statusHistory.length > 0 && (
                <div className="border-t pt-4">
                  <span className="font-medium">Status History:</span>
                  <div className="mt-2 space-y-2">
                    {selectedGrievance.statusHistory.map((history: any, idx: number) => (
                      <div key={idx} className="bg-blue-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium text-sm">{history.status}</span>
                          <span className="text-xs text-gray-500">{new Date(history.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">By {history.changedByName}</p>
                        {history.remark && <p className="text-sm mt-1">{history.remark}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedGrievance.remarks && selectedGrievance.remarks.length > 0 && (
                <div className="border-t pt-4">
                  <span className="font-medium">Remarks:</span>
                  <div className="mt-2 space-y-2">
                    {selectedGrievance.remarks.map((remark: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded">
                        <p className="text-sm">{remark.text}</p>
                        <p className="text-xs text-gray-500 mt-1">By {remark.addedByName} on {new Date(remark.timestamp).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Update Status</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select value={statusUpdate.status} onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                      <option value="">Select Status</option>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select value={statusUpdate.priority} onChange={(e) => setStatusUpdate({ ...statusUpdate, priority: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                      <option value="">Keep Current</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button onClick={handleUpdateStatus} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Status</button>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">Remark (optional)</label>
                  <textarea value={statusUpdate.remark} onChange={(e) => setStatusUpdate({ ...statusUpdate, remark: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="Add a remark with status update" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Add Remark</h4>
                <textarea value={remarkText} onChange={(e) => setRemarkText(e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={3} placeholder="Enter your remark..." />
                <button onClick={handleAddRemark} className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add Remark</button>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => { setSelectedGrievance(null); setStatusUpdate({ status: '', priority: '', remark: '' }); setRemarkText(''); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
