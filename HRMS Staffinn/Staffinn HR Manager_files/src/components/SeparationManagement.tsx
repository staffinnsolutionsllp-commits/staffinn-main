import { useState, useEffect } from 'react'
import { LogOut, Plus, Eye, Filter, Users, Clock, FileText, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'
import { apiService } from '../services/api'

export default function SeparationManagement() {
  const [separations, setSeparations] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, inNoticePeriod: 0, pendingFnF: 0, pendingExitInterview: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ employeeId: '', status: '', department: '', startDate: '', endDate: '' })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSeparation, setSelectedSeparation] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('details')
  const [separationForm, setSeparationForm] = useState({
    employeeId: '',
    resignationReason: '',
    lastWorkingDate: '',
    noticePeriodDays: 30,
    resignationDocuments: []
  })

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadSeparations(), loadStats(), loadEmployees()])
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

  const loadSeparations = async () => {
    try {
      const response = await apiService.getSeparations(filters)
      if (response.success) setSeparations(response.data)
    } catch (error) {
      console.error('Error loading separations:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiService.getSeparationStats()
      if (response.success) setStats(response.data.stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleCreateSeparation = async () => {
    try {
      if (!separationForm.employeeId || !separationForm.resignationReason || !separationForm.lastWorkingDate) {
        alert('Please fill all required fields')
        return
      }
      const employee = employees.find(e => (e.employeeId || e.id || e.userId) === separationForm.employeeId)
      const payload = {
        ...separationForm,
        employeeName: employee?.name || employee?.employeeName || employee?.fullName || '',
        department: employee?.department || ''
      }
      await apiService.createSeparation(payload)
      setShowCreateModal(false)
      setSeparationForm({ employeeId: '', resignationReason: '', lastWorkingDate: '', noticePeriodDays: 30, resignationDocuments: [] })
      loadData()
    } catch (error) {
      alert('Failed to create separation record')
    }
  }

  const handleUpdateStatus = async (status: string, remark: string = '') => {
    try {
      await apiService.updateSeparationStatus(selectedSeparation.separationId, { status, remark })
      const updated = await apiService.getSeparationById(selectedSeparation.separationId)
      if (updated.success) setSelectedSeparation(updated.data)
      loadData()
    } catch (error) {
      alert('Failed to update status')
    }
  }

  const calculateRemainingDays = (endDate: string) => {
    const end = new Date(endDate)
    const today = new Date()
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Separation Management</h1>
          <p className="text-gray-600">Manage employee exit lifecycle</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} />
          <span>Create Separation</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full"><LogOut className="text-blue-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-full"><Users className="text-orange-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-full"><Clock className="text-yellow-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">In Notice</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inNoticePeriod}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-full"><DollarSign className="text-purple-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Pending F&F</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingFnF}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-full"><AlertCircle className="text-red-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Pending Exit</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingExitInterview}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full"><CheckCircle className="text-green-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
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
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="">All Status</option>
              <option value="Initiated">Initiated</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="In Notice Period">In Notice Period</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <input type="text" value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Department" />
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resignation Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Working Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {separations.map((sep) => {
                const employee = employees.find(e => (e.employeeId || e.id || e.userId) === sep.employeeId)
                const empName = employee?.name || employee?.employeeName || employee?.fullName || sep.employeeName || '-'
                return (
                  <tr key={sep.separationId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{sep.separationId.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{empName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{sep.employeeId}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{sep.department || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(sep.resignationDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(sep.lastWorkingDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        sep.resignationStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                        sep.resignationStatus === 'Approved' || sep.resignationStatus === 'In Notice Period' ? 'bg-yellow-100 text-yellow-800' :
                        sep.resignationStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>{sep.resignationStatus}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => { setSelectedSeparation(sep); setActiveTab('details'); }} className="text-blue-600 hover:text-blue-800">
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-semibold mb-4">Create Separation Record</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Employee *</label>
                <select value={separationForm.employeeId} onChange={(e) => setSeparationForm({ ...separationForm, employeeId: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select Employee</option>
                  {employees.map(emp => {
                    const displayName = emp.name || emp.employeeName || emp.fullName || emp.email || 'Unknown'
                    const displayId = emp.employeeId || emp.id || emp.userId || ''
                    return <option key={displayId} value={displayId}>{displayName} ({displayId})</option>
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Resignation Reason *</label>
                <textarea value={separationForm.resignationReason} onChange={(e) => setSeparationForm({ ...separationForm, resignationReason: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Last Working Date *</label>
                  <input type="date" value={separationForm.lastWorkingDate} onChange={(e) => setSeparationForm({ ...separationForm, lastWorkingDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notice Period (Days)</label>
                  <input type="number" value={separationForm.noticePeriodDays} onChange={(e) => setSeparationForm({ ...separationForm, noticePeriodDays: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreateSeparation} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
            </div>
          </div>
        </div>
      )}

      {selectedSeparation && (
        <SeparationDetailsModal 
          separation={selectedSeparation}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setSelectedSeparation(null)}
          onUpdate={loadData}
          calculateRemainingDays={calculateRemainingDays}
        />
      )}
    </div>
  )
}

function SeparationDetailsModal({ separation, activeTab, setActiveTab, onClose, onUpdate, calculateRemainingDays }: any) {
  const [statusUpdate, setStatusUpdate] = useState({ status: '', remark: '' })
  const [noticePeriod, setNoticePeriod] = useState({ earlyRelease: false, absconding: false, handoverCompleted: false })
  const [exitInterview, setExitInterview] = useState({ status: '', scheduledDate: '', responses: [], hrRemarks: '' })
  const [fnf, setFnf] = useState({ status: '', finalSalary: 0, leaveEncashment: 0, loanDeductions: 0, noticeShortfall: 0, bonus: 0 })
  const [finalRating, setFinalRating] = useState({ rating: 0, feedback: '' })

  const handleUpdateStatus = async () => {
    if (!statusUpdate.status) return alert('Select status')
    await apiService.updateSeparationStatus(separation.separationId, statusUpdate)
    setStatusUpdate({ status: '', remark: '' })
    onUpdate()
  }

  const handleUpdateNoticePeriod = async () => {
    await apiService.updateNoticePeriod(separation.separationId, noticePeriod)
    onUpdate()
  }

  const handleUpdateExitInterview = async () => {
    await apiService.updateExitInterview(separation.separationId, exitInterview)
    setExitInterview({ status: '', scheduledDate: '', responses: [], hrRemarks: '' })
    onUpdate()
  }

  const handleUpdateFnF = async () => {
    await apiService.updateFnFSettlement(separation.separationId, fnf)
    setFnf({ status: '', finalSalary: 0, leaveEncashment: 0, loanDeductions: 0, noticeShortfall: 0, bonus: 0 })
    onUpdate()
  }

  const handleUpdateRating = async () => {
    if (!finalRating.rating) return alert('Enter rating')
    await apiService.updateFinalRating(separation.separationId, finalRating)
    setFinalRating({ rating: 0, feedback: '' })
    onUpdate()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">Separation Details</h3>
        
        <div className="flex space-x-4 border-b mb-4">
          <button onClick={() => setActiveTab('details')} className={`px-4 py-2 ${activeTab === 'details' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>Details</button>
          <button onClick={() => setActiveTab('notice')} className={`px-4 py-2 ${activeTab === 'notice' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>Notice Period</button>
          <button onClick={() => setActiveTab('exit')} className={`px-4 py-2 ${activeTab === 'exit' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>Exit Interview</button>
          <button onClick={() => setActiveTab('fnf')} className={`px-4 py-2 ${activeTab === 'fnf' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>F&F Settlement</button>
          <button onClick={() => setActiveTab('documents')} className={`px-4 py-2 ${activeTab === 'documents' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>Documents</button>
          <button onClick={() => setActiveTab('rating')} className={`px-4 py-2 ${activeTab === 'rating' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>Final Rating</button>
        </div>

        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
              <div><span className="font-medium">Separation ID:</span> {separation.separationId}</div>
              <div><span className="font-medium">Employee Name:</span> {separation.employeeName}</div>
              <div><span className="font-medium">Employee ID:</span> {separation.employeeId}</div>
              <div><span className="font-medium">Department:</span> {separation.department || '-'}</div>
              <div><span className="font-medium">Resignation Date:</span> {new Date(separation.resignationDate).toLocaleDateString()}</div>
              <div><span className="font-medium">Last Working Date:</span> {new Date(separation.lastWorkingDate).toLocaleDateString()}</div>
              <div><span className="font-medium">Status:</span> <span className={`px-2 py-1 text-xs rounded-full ${
                separation.resignationStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                separation.resignationStatus === 'Approved' ? 'bg-yellow-100 text-yellow-800' :
                separation.resignationStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                'bg-orange-100 text-orange-800'
              }`}>{separation.resignationStatus}</span></div>
            </div>
            <div><span className="font-medium">Resignation Reason:</span><p className="mt-2 text-gray-700">{separation.resignationReason}</p></div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Update Status</h4>
              <div className="grid grid-cols-2 gap-4">
                <select value={statusUpdate.status} onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })} className="px-3 py-2 border rounded-lg">
                  <option value="">Select Status</option>
                  <option value="Initiated">Initiated</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="In Notice Period">In Notice Period</option>
                  <option value="Completed">Completed</option>
                </select>
                <button onClick={handleUpdateStatus} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update</button>
              </div>
              <textarea value={statusUpdate.remark} onChange={(e) => setStatusUpdate({ ...statusUpdate, remark: e.target.value })} className="w-full px-3 py-2 border rounded-lg mt-2" rows={2} placeholder="Remark (optional)" />
            </div>

            {separation.statusHistory && separation.statusHistory.length > 0 && (
              <div className="border-t pt-4">
                <span className="font-medium">Status History:</span>
                <div className="mt-2 space-y-2">
                  {separation.statusHistory.map((h: any, i: number) => (
                    <div key={i} className="bg-blue-50 p-3 rounded text-sm">
                      <div className="flex justify-between"><span className="font-medium">{h.status}</span><span className="text-gray-500">{new Date(h.timestamp).toLocaleString()}</span></div>
                      <p className="text-gray-600">By {h.changedByName}</p>
                      {h.remark && <p className="mt-1">{h.remark}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notice' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
              <div><span className="font-medium">Notice Period:</span> {separation.noticePeriod.days} days</div>
              <div><span className="font-medium">Start Date:</span> {new Date(separation.noticePeriod.startDate).toLocaleDateString()}</div>
              <div><span className="font-medium">End Date:</span> {new Date(separation.noticePeriod.endDate).toLocaleDateString()}</div>
              <div><span className="font-medium">Remaining Days:</span> {calculateRemainingDays(separation.noticePeriod.endDate)}</div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center"><input type="checkbox" checked={noticePeriod.earlyRelease} onChange={(e) => setNoticePeriod({ ...noticePeriod, earlyRelease: e.target.checked })} className="mr-2" /><label>Early Release Approved</label></div>
              <div className="flex items-center"><input type="checkbox" checked={noticePeriod.absconding} onChange={(e) => setNoticePeriod({ ...noticePeriod, absconding: e.target.checked })} className="mr-2" /><label>Mark as Absconding</label></div>
              <div className="flex items-center"><input type="checkbox" checked={noticePeriod.handoverCompleted} onChange={(e) => setNoticePeriod({ ...noticePeriod, handoverCompleted: e.target.checked })} className="mr-2" /><label>Handover Completed</label></div>
              <button onClick={handleUpdateNoticePeriod} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Notice Period</button>
            </div>
          </div>
        )}

        {activeTab === 'exit' && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded"><span className="font-medium">Status:</span> {separation.exitInterview.status}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Status</label><select value={exitInterview.status} onChange={(e) => setExitInterview({ ...exitInterview, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="">Select</option><option value="Pending">Pending</option><option value="Scheduled">Scheduled</option><option value="Completed">Completed</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Scheduled Date</label><input type="date" value={exitInterview.scheduledDate} onChange={(e) => setExitInterview({ ...exitInterview, scheduledDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">HR Remarks</label><textarea value={exitInterview.hrRemarks} onChange={(e) => setExitInterview({ ...exitInterview, hrRemarks: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={4} /></div>
            <button onClick={handleUpdateExitInterview} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Exit Interview</button>
          </div>
        )}

        {activeTab === 'fnf' && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded"><span className="font-medium">Status:</span> {separation.fnfSettlement.status} | <span className="font-medium">Total Payable:</span> ₹{separation.fnfSettlement.totalPayable}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Status</label><select value={fnf.status} onChange={(e) => setFnf({ ...fnf, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="">Select</option><option value="Pending">Pending</option><option value="In Process">In Process</option><option value="Completed">Completed</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Final Salary</label><input type="number" value={fnf.finalSalary} onChange={(e) => setFnf({ ...fnf, finalSalary: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Leave Encashment</label><input type="number" value={fnf.leaveEncashment} onChange={(e) => setFnf({ ...fnf, leaveEncashment: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Loan Deductions</label><input type="number" value={fnf.loanDeductions} onChange={(e) => setFnf({ ...fnf, loanDeductions: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Notice Shortfall</label><input type="number" value={fnf.noticeShortfall} onChange={(e) => setFnf({ ...fnf, noticeShortfall: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Bonus</label><input type="number" value={fnf.bonus} onChange={(e) => setFnf({ ...fnf, bonus: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
            <button onClick={handleUpdateFnF} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update F&F Settlement</button>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border p-4 rounded"><span className="font-medium">Experience Letter:</span> {separation.exitDocuments.experienceLetter ? '✓ Issued' : '✗ Pending'}</div>
              <div className="border p-4 rounded"><span className="font-medium">Relieving Letter:</span> {separation.exitDocuments.relievingLetter ? '✓ Issued' : '✗ Pending'}</div>
              <div className="border p-4 rounded"><span className="font-medium">No Dues Certificate:</span> {separation.exitDocuments.noDuesCertificate ? '✓ Issued' : '✗ Pending'}</div>
              <div className="border p-4 rounded"><span className="font-medium">Salary Certificate:</span> {separation.exitDocuments.salaryCertificate ? '✓ Issued' : '✗ Pending'}</div>
            </div>
            <p className="text-sm text-gray-500">Document upload functionality can be integrated with file upload service</p>
          </div>
        )}

        {activeTab === 'rating' && (
          <div className="space-y-4">
            {separation.finalRating.rating > 0 && (
              <div className="bg-gray-50 p-4 rounded"><span className="font-medium">Current Rating:</span> {separation.finalRating.rating}/5 | <span className="font-medium">Rated By:</span> {separation.finalRating.ratedByName}</div>
            )}
            <div><label className="block text-sm font-medium mb-1">Final Rating (1-5)</label><input type="number" min="1" max="5" value={finalRating.rating} onChange={(e) => setFinalRating({ ...finalRating, rating: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Feedback</label><textarea value={finalRating.feedback} onChange={(e) => setFinalRating({ ...finalRating, feedback: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={4} /></div>
            <button onClick={handleUpdateRating} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Submit Rating</button>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  )
}
