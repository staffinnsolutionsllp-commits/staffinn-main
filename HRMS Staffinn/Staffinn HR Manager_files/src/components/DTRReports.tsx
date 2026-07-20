import { useState, useEffect, useCallback } from 'react'
import { FileText, Users, Clock, AlertTriangle, CheckCircle, Search, Calendar, ChevronDown, Download, RefreshCw, Eye, Image as ImageIcon, Filter } from 'lucide-react'
import { apiService } from '../services/api'

interface DTRReport {
  reportId: string
  employeeId: string
  taskId: string
  taskTitle: string
  date: string
  workDescription: string
  hoursSpent: number
  completionPercentage: number | null
  status: string
  challengesFaced: string
  plannedForTomorrow: string
  category: string
  priority: string
  attachmentUrl: string
  attachmentFileName: string
  remarks: string
  submittedAt: string
  isLate: boolean
}

interface DTRStats {
  totalReports: number
  onTimeReports: number
  lateReports: number
  onTimePercentage: string
  uniqueEmployeesSubmitted: number
  statusBreakdown: Record<string, number>
  averageHoursPerReport: number
}

interface EmployeeSummary {
  summary: {
    totalReports: number
    onTimeSubmissions: number
    lateSubmissions: number
    totalHoursLogged: string
    uniqueTasksWorkedOn: number
    complianceRate: string
  }
  reports: DTRReport[]
}

export default function DTRReports() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'employee'>('overview')
  const [stats, setStats] = useState<DTRStats | null>(null)
  const [reports, setReports] = useState<DTRReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [filterEmployeeId, setFilterEmployeeId] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [complianceRunning, setComplianceRunning] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiService.getDTRStats({ date: selectedDate })
      setStats(res.data)
    } catch (err) {
      console.error('Error fetching DTR stats:', err)
    }
  }, [selectedDate])

  const fetchReports = useCallback(async () => {
    try {
      const filters: Record<string, string> = { date: selectedDate }
      if (filterEmployeeId) filters.employeeId = filterEmployeeId
      const res = await apiService.getDTRReports(filters)
      setReports(res.data || [])
    } catch (err) {
      console.error('Error fetching DTR reports:', err)
    }
  }, [selectedDate, filterEmployeeId])

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await apiService.getEmployees()
      setEmployees(res.data || [])
    } catch (err) {
      console.error('Error fetching employees:', err)
    }
  }, [])

  const fetchEmployeeDTR = async (empId: string) => {
    try {
      setSelectedEmployeeId(empId)
      const res = await apiService.getEmployeeDTRHistory(empId)
      setSelectedEmployee(res.data)
    } catch (err) {
      console.error('Error fetching employee DTR:', err)
    }
  }

  const runCompliance = async () => {
    if (!confirm('This will mark employees who missed DTR as ABSENT. Proceed?')) return
    setComplianceRunning(true)
    try {
      const res = await apiService.runDTRCompliance(selectedDate)
      alert(`Compliance check complete.\n- Total checked out: ${res.data.totalCheckedOut}\n- DTR submitted: ${res.data.totalSubmitted}\n- Non-compliant: ${res.data.nonCompliant}\n- Marked absent: ${res.data.absentMarked}`)
      fetchStats()
      fetchReports()
    } catch (err) {
      console.error('Compliance check error:', err)
      alert('Failed to run compliance check')
    } finally {
      setComplianceRunning(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchReports(), fetchEmployees()])
      setLoading(false)
    }
    load()
  }, [fetchStats, fetchReports, fetchEmployees])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-50 text-blue-700'
      case 'Completed': return 'bg-emerald-50 text-emerald-700'
      case 'Blocked': return 'bg-red-50 text-red-700'
      case 'On Hold': return 'bg-amber-50 text-amber-700'
      default: return 'bg-slate-50 text-slate-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading DTR Reports...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daily Task Reports (DTR)</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor employee daily task report submissions and compliance</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={runCompliance}
            disabled={complianceRunning}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <AlertTriangle size={14} />
            {complianceRunning ? 'Running...' : 'Run Compliance Check'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Reports', val: stats.totalReports, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'On-Time', val: stats.onTimeReports, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Late Submissions', val: stats.lateReports, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Employees Submitted', val: stats.uniqueEmployeesSubmitted, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Avg Hours/Report', val: `${stats.averageHoursPerReport}h`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(({ label, val, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{val}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compliance Rate Bar */}
      {stats && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">On-Time Compliance Rate</span>
            <span className="text-sm font-bold text-indigo-600">{stats.onTimePercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.onTimePercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { id: 'overview' as const, label: 'All Reports' },
          { id: 'employee' as const, label: 'Employee View' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* All Reports Tab */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              DTR Reports for {new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={filterEmployeeId}
                onChange={e => setFilterEmployeeId(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.fullName || emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
              <button onClick={() => { fetchStats(); fetchReports(); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="flex flex-col items-center py-14 gap-3">
              <FileText size={36} className="text-gray-200" />
              <p className="text-sm font-medium text-gray-500">No DTR reports found for this date</p>
              <p className="text-xs text-gray-400">Try selecting a different date or check if employees have submitted</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Employee', 'Task', 'Work Done', 'Hours', 'Completion', 'Status', 'Time', 'Late'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reports.map(r => (
                    <tr key={r.reportId} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => setExpandedReport(expandedReport === r.reportId ? null : r.reportId)}>
                      <td className="px-4 py-3 font-medium text-gray-800 text-xs">{r.employeeId}</td>
                      <td className="px-4 py-3 text-gray-700 text-xs max-w-[150px] truncate">{r.taskTitle}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs max-w-[200px] truncate">{r.workDescription}</td>
                      <td className="px-4 py-3 text-gray-700 text-xs font-medium">{r.hoursSpent}h</td>
                      <td className="px-4 py-3">
                        {r.completionPercentage != null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${r.completionPercentage}%` }} />
                            </div>
                            <span className="text-xs text-gray-500">{r.completionPercentage}%</span>
                          </div>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(r.status)}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(r.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        {r.isLate ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">Late</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">On Time</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Employee View Tab */}
      {activeTab === 'employee' && (
        <div className="space-y-4">
          {/* Employee Selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Employee to View DTR History</label>
            <div className="flex gap-3">
              <select
                value={selectedEmployeeId}
                onChange={e => { if (e.target.value) fetchEmployeeDTR(e.target.value) }}
                className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Select an Employee --</option>
                {employees.map(emp => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.fullName || emp.name} — {emp.designation || emp.department || emp.employeeId}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Employee Summary */}
          {selectedEmployee && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {[
                  { label: 'Total Reports', val: selectedEmployee.summary.totalReports },
                  { label: 'On-Time', val: selectedEmployee.summary.onTimeSubmissions },
                  { label: 'Late', val: selectedEmployee.summary.lateSubmissions },
                  { label: 'Hours Logged', val: `${selectedEmployee.summary.totalHoursLogged}h` },
                  { label: 'Tasks Worked', val: selectedEmployee.summary.uniqueTasksWorkedOn },
                  { label: 'Compliance', val: `${selectedEmployee.summary.complianceRate}%` },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-lg font-bold text-gray-800 mt-0.5">{item.val}</p>
                  </div>
                ))}
              </div>

              {/* Employee Reports Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 text-sm">DTR History</h3>
                </div>
                {selectedEmployee.reports.length === 0 ? (
                  <div className="flex flex-col items-center py-10 gap-2">
                    <FileText size={30} className="text-gray-200" />
                    <p className="text-sm text-gray-500">No DTR records found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {['Date', 'Task', 'Work Description', 'Hours', 'Status', 'Completion', 'Late', 'Attachment'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedEmployee.reports.map(r => (
                          <tr key={r.reportId} className="hover:bg-gray-50/60">
                            <td className="px-4 py-3 text-xs font-medium text-gray-800 whitespace-nowrap">
                              {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-700 max-w-[120px] truncate">{r.taskTitle}</td>
                            <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px] truncate">{r.workDescription}</td>
                            <td className="px-4 py-3 text-xs font-medium">{r.hoursSpent}h</td>
                            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(r.status)}`}>{r.status}</span></td>
                            <td className="px-4 py-3 text-xs">{r.completionPercentage != null ? `${r.completionPercentage}%` : '—'}</td>
                            <td className="px-4 py-3">
                              {r.isLate ? <span className="text-xs text-red-600 font-medium">Yes</span> : <span className="text-xs text-emerald-600">No</span>}
                            </td>
                            <td className="px-4 py-3">
                              {r.attachmentUrl ? (
                                <a href={r.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-xs flex items-center gap-1">
                                  <ImageIcon size={10} /> View
                                </a>
                              ) : <span className="text-xs text-gray-300">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Expanded Report Detail Modal */}
      {expandedReport && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setExpandedReport(null)} />
          <div className="fixed inset-x-4 top-[10%] max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            {(() => {
              const r = reports.find(rep => rep.reportId === expandedReport)
              if (!r) return null
              return (
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{r.taskTitle}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Employee: {r.employeeId} | Date: {r.date}</p>
                    </div>
                    <button onClick={() => setExpandedReport(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">✕</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Hours</p><p className="font-bold text-gray-800">{r.hoursSpent}h</p></div>
                    <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Status</p><p className="font-bold text-gray-800">{r.status}</p></div>
                    <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Completion</p><p className="font-bold text-gray-800">{r.completionPercentage ?? '—'}%</p></div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Work Description</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{r.workDescription}</p>
                  </div>
                  {r.challengesFaced && (
                    <div>
                      <p className="text-xs font-semibold text-red-600 mb-1">Challenges Faced</p>
                      <p className="text-sm text-gray-600 bg-red-50 p-3 rounded-lg">{r.challengesFaced}</p>
                    </div>
                  )}
                  {r.plannedForTomorrow && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 mb-1">Plan for Tomorrow</p>
                      <p className="text-sm text-gray-600 bg-emerald-50 p-3 rounded-lg">{r.plannedForTomorrow}</p>
                    </div>
                  )}
                  {r.remarks && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Remarks</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{r.remarks}</p>
                    </div>
                  )}
                  {r.attachmentUrl && (
                    <a href={r.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                      <ImageIcon size={14} /> View Attachment ({r.attachmentFileName || 'File'})
                    </a>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t">
                    <span>Submitted: {new Date(r.submittedAt).toLocaleString('en-IN')}</span>
                    <span className={r.isLate ? 'text-red-500 font-medium' : 'text-emerald-500'}>{r.isLate ? '⚠️ Late Submission' : '✅ On Time'}</span>
                  </div>
                </div>
              )
            })()}
          </div>
        </>
      )}
    </div>
  )
}
