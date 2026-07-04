import { useState, useEffect } from 'react'
import {
  MessageSquare, Eye, TrendingUp, AlertCircle, CheckCircle, Clock,
  Hash, X, FileText, Filter, RefreshCw
} from 'lucide-react'
import { apiService } from '../services/api'

const CATEGORIES = [
  'HR & Employment', 'Salary & Payroll', 'Workplace & Administration',
  'IT & System Support', 'Project & Work Allocation', 'Manager / Supervisor Concern',
  'Harassment & Misconduct', 'Health & Safety', 'Training & Development',
  'Asset & Equipment', 'Policy & Compliance', 'Suggestion / Feedback', 'Other',
]

const ALL_STATUSES = ['Open', 'Under Review', 'In Progress', 'Resolved', 'Closed', 'Rejected']

const STATUS_COLORS: Record<string, string> = {
  'Open':         'bg-amber-100   text-amber-800',
  'Under Review': 'bg-blue-100    text-blue-800',
  'In Progress':  'bg-violet-100  text-violet-800',
  'Resolved':     'bg-emerald-100 text-emerald-800',
  'Closed':       'bg-gray-100    text-gray-700',
  'Rejected':     'bg-red-100     text-red-800',
}

const PRIORITY_COLORS: Record<string, string> = {
  'Low':      'bg-emerald-100 text-emerald-800',
  'Medium':   'bg-amber-100   text-amber-800',
  'High':     'bg-orange-100  text-orange-800',
  'Critical': 'bg-red-100     text-red-800',
}

const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function GrievanceManagement() {
  const [grievances,         setGrievances]         = useState<any[]>([])
  const [employees,          setEmployees]           = useState<any[]>([])
  const [stats,              setStats]               = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, rejected: 0, pending: 0 })
  const [loading,            setLoading]             = useState(true)
  const [selectedGrievance,  setSelectedGrievance]   = useState<any>(null)
  const [remarkText,         setRemarkText]          = useState('')
  const [resolutionRemarks,  setResolutionRemarks]   = useState('')
  const [statusUpdate,       setStatusUpdate]        = useState({ status: '', priority: '', remark: '' })
  const [filters,            setFilters]             = useState({
    employeeId: '', category: '', status: '', department: '', startDate: '', endDate: ''
  })
  const [showFilters,        setShowFilters]         = useState(false)

  useEffect(() => { loadData() }, [filters])

  const loadData = async () => {
    setLoading(true)
    try { await Promise.all([loadGrievances(), loadStats(), loadEmployees()]) }
    finally { setLoading(false) }
  }

  const loadEmployees = async () => {
    try {
      const r = await apiService.getEmployees()
      if (r.success) setEmployees(r.data)
    } catch {}
  }

  const loadGrievances = async () => {
    try {
      const r = await apiService.getGrievances(filters)
      if (r.success) setGrievances(r.data)
    } catch {}
  }

  const loadStats = async () => {
    try {
      const r = await apiService.getGrievanceStats()
      if (r.success) {
        const s = r.data.stats
        setStats({ ...s, rejected: s.rejected || 0 })
      }
    } catch {}
  }

  const handleUpdateStatus = async () => {
    if (!statusUpdate.status) { alert('Please select a status'); return }
    try {
      const payload: any = { ...statusUpdate }
      if (resolutionRemarks) payload.resolutionRemarks = resolutionRemarks
      await apiService.updateGrievanceStatus(selectedGrievance.grievanceId, payload)
      setStatusUpdate({ status: '', priority: '', remark: '' })
      setResolutionRemarks('')
      loadData()
      const updated = await apiService.getGrievanceById(selectedGrievance.grievanceId)
      if (updated.success) setSelectedGrievance(updated.data)
    } catch { alert('Failed to update status') }
  }

  const handleAddRemark = async () => {
    if (!remarkText.trim()) { alert('Please enter a remark'); return }
    try {
      await apiService.addGrievanceRemark(selectedGrievance.grievanceId, remarkText)
      setRemarkText('')
      const updated = await apiService.getGrievanceById(selectedGrievance.grievanceId)
      if (updated.success) setSelectedGrievance(updated.data)
      loadData()
    } catch { alert('Failed to add remark') }
  }

  const closeModal = () => {
    setSelectedGrievance(null)
    setStatusUpdate({ status: '', priority: '', remark: '' })
    setRemarkText('')
    setResolutionRemarks('')
  }

  const empName = (id: string, fallback?: string) => {
    const e = employees.find(e => (e.employeeId || e.id || e.userId) === id)
    return e?.fullName || e?.name || e?.employeeName || fallback || id
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grievance Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">View and manage all employee grievances</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter size={15}/> Filters
          </button>
          <button onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            <RefreshCw size={15}/> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { icon: MessageSquare, bg: 'bg-blue-100',    color: 'text-blue-600',    label: 'Total',        val: stats.total },
          { icon: AlertCircle,   bg: 'bg-amber-100',   color: 'text-amber-600',   label: 'Open',         val: stats.open },
          { icon: Clock,         bg: 'bg-violet-100',  color: 'text-violet-600',  label: 'In Progress',  val: stats.inProgress },
          { icon: CheckCircle,   bg: 'bg-emerald-100', color: 'text-emerald-600', label: 'Resolved',     val: stats.resolved },
          { icon: CheckCircle,   bg: 'bg-gray-100',    color: 'text-gray-600',    label: 'Closed',       val: stats.closed },
          { icon: X,             bg: 'bg-red-100',     color: 'text-red-600',     label: 'Rejected',     val: stats.rejected },
          { icon: TrendingUp,    bg: 'bg-orange-100',  color: 'text-orange-600',  label: 'Pending',      val: stats.pending },
        ].map(({ icon: Icon, bg, color, label, val }) => (
          <div key={label} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-2 ${bg} rounded-lg`}><Icon className={color} size={16}/></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{val}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Employee</label>
              <select value={filters.employeeId} onChange={e => setFilters({ ...filters, employeeId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">All Employees</option>
                {employees.map(emp => <option key={emp.employeeId || emp.userId} value={emp.employeeId || emp.userId}>{emp.fullName || emp.name} ({emp.employeeId})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">All Statuses</option>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <input type="text" value={filters.department} onChange={e => setFilters({ ...filters, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Filter by dept…"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
              <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
              <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
            </div>
          </div>
          <button onClick={() => setFilters({ employeeId: '', category: '', status: '', department: '', startDate: '', endDate: '' })}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors">Clear all filters</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {grievances.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
              <MessageSquare size={36}/>
              <p className="text-sm">No grievances found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Ticket No.','Employee','Dept','Category','Subject','Date','Priority','Status','Assigned To','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {grievances.map(g => (
                  <tr key={g.grievanceId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg whitespace-nowrap">
                        <Hash size={10}/>{g.ticketNo || g.grievanceId?.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 whitespace-nowrap">{g.employeeName || empName(g.employeeId, '—')}</p>
                      <p className="text-xs text-gray-400">{g.employeeId}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{g.employeeDepartment || g.department || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-[120px] truncate">{g.category}</td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="text-gray-900 truncate font-medium">{g.subject || g.title}</p>
                      {g.complaintAgainstEmployeeName && <p className="text-xs text-red-500">Against: {g.complaintAgainstEmployeeName}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(g.dateOfGrievance || g.submittedDate || g.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${PRIORITY_COLORS[g.priority] || 'bg-gray-100 text-gray-700'}`}>{g.priority || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[g.status] || 'bg-gray-100 text-gray-700'}`}>{g.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{g.assignedToName || g.reportingManager || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedGrievance(g)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors whitespace-nowrap">
                        <Eye size={12}/> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedGrievance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-900">Grievance Details</h3>
                <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                  {selectedGrievance.ticketNo || selectedGrievance.grievanceId?.slice(0, 12)}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_COLORS[selectedGrievance.status] || 'bg-gray-100 text-gray-700'}`}>
                  {selectedGrievance.status}
                </span>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X size={18} className="text-gray-500"/></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Auto-filled employee details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Employee Details</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {[
                    ['Employee Name',     selectedGrievance.employeeName || empName(selectedGrievance.employeeId, '—')],
                    ['Employee ID',       selectedGrievance.employeeId],
                    ['Department',        selectedGrievance.employeeDepartment || selectedGrievance.department || '—'],
                    ['Designation',       selectedGrievance.employeeDesignation || '—'],
                    ['Reporting Manager', selectedGrievance.reportingManager || selectedGrievance.assignedToName || '—'],
                    ['Assigned To',       selectedGrievance.assignedToName || '—'],
                  ].map(([lbl, val]) => (
                    <div key={lbl}>
                      <p className="text-xs text-gray-400">{lbl}</p>
                      <p className="font-semibold text-gray-800">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grievance details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><p className="text-xs text-gray-400 font-medium">Category</p><p className="font-semibold text-gray-800">{selectedGrievance.category}</p></div>
                <div><p className="text-xs text-gray-400 font-medium">Subject</p><p className="font-semibold text-gray-800">{selectedGrievance.subject || selectedGrievance.title}</p></div>
                <div><p className="text-xs text-gray-400 font-medium">Priority</p>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${PRIORITY_COLORS[selectedGrievance.priority] || 'bg-gray-100 text-gray-700'}`}>{selectedGrievance.priority}</span>
                </div>
                <div><p className="text-xs text-gray-400 font-medium">Date of Grievance</p><p className="text-gray-700">{fmt(selectedGrievance.dateOfGrievance || selectedGrievance.submittedDate)}</p></div>
                {(selectedGrievance.dateOfClosure || selectedGrievance.resolvedAt) && (
                  <div><p className="text-xs text-gray-400 font-medium">Date of Closure</p><p className="text-gray-700">{fmt(selectedGrievance.dateOfClosure || selectedGrievance.resolvedAt)}</p></div>
                )}
                <div><p className="text-xs text-gray-400 font-medium">Escalation Level</p><p className="text-gray-700">{selectedGrievance.escalationLevel ?? 0}</p></div>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Description</p>
                <p className="text-gray-700 text-sm whitespace-pre-wrap bg-gray-50 rounded-xl p-3">{selectedGrievance.description}</p>
              </div>

              {selectedGrievance.resolutionRemarks && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">Resolution Remarks</p>
                  <p className="text-sm text-emerald-900">{selectedGrievance.resolutionRemarks}</p>
                </div>
              )}

              {selectedGrievance.complaintAgainstEmployeeName && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">Complaint Against</p>
                  <p className="font-semibold text-red-900">{selectedGrievance.complaintAgainstEmployeeName}</p>
                  <p className="text-xs text-red-500">{selectedGrievance.complaintAgainstEmployeeEmail}</p>
                </div>
              )}

              {/* Attachments */}
              {selectedGrievance.attachments?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-2">Supporting Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedGrievance.attachments.map((att: any, i: number) => (
                      <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-blue-600 font-medium hover:border-blue-300 transition-colors">
                        <FileText size={14}/>{att.fileName || `Document ${i + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Status History */}
              {selectedGrievance.statusHistory?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-2">Status History</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedGrievance.statusHistory.map((h: any, i: number) => (
                      <div key={i} className="bg-gray-50 p-3 rounded-xl text-xs">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-800">{h.action || h.status}</span>
                          <span className="text-gray-400">{new Date(h.timestamp).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-gray-500 mt-0.5">By {h.changedByName}{h.assignedToName && ` → ${h.assignedToName}`}</p>
                        {h.remark && <p className="text-gray-500 mt-0.5 italic">"{h.remark}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remarks */}
              {selectedGrievance.remarks?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-2">Remarks</p>
                  <div className="space-y-2">
                    {selectedGrievance.remarks.map((r: any, i: number) => (
                      <div key={i} className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-sm text-gray-800">{r.text}</p>
                        <p className="text-xs text-gray-400 mt-1">By {r.addedByName} · {new Date(r.timestamp).toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Update Status */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-bold text-gray-700 mb-3">Update Status</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">New Status</label>
                    <select value={statusUpdate.status} onChange={e => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      <option value="">Select Status</option>
                      {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                    <select value={statusUpdate.priority} onChange={e => setStatusUpdate({ ...statusUpdate, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      <option value="">Keep Current</option>
                      {['Low','Medium','High','Critical'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Assigned To (RM/TL/HR)</label>
                    <select value={statusUpdate.remark} onChange={e => setStatusUpdate({ ...statusUpdate, remark: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      <option value="">— same as current —</option>
                      {employees.map(emp => <option key={emp.employeeId} value={emp.fullName || emp.name}>{emp.fullName || emp.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Resolution Remarks</label>
                  <textarea value={resolutionRemarks} onChange={e => setResolutionRemarks(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2}
                    placeholder="Add resolution remarks (shown to employee on closure)…"/>
                </div>
                <button onClick={handleUpdateStatus}
                  className="mt-3 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
                  Update Status
                </button>
              </div>

              {/* Add Remark */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-bold text-gray-700 mb-2">Add Remark</p>
                <textarea value={remarkText} onChange={e => setRemarkText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={3}
                  placeholder="Enter remark (internal note)…"/>
                <button onClick={handleAddRemark}
                  className="mt-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors">
                  Add Remark
                </button>
              </div>

            </div>

            <div className="flex justify-end px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={closeModal} className="px-5 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
