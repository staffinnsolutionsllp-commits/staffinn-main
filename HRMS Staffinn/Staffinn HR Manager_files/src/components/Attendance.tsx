import { useState, useEffect, useRef } from 'react'
import {
  Calendar, Clock, CheckCircle, Plus, X, AlertCircle,
  ChevronLeft, ChevronRight, User, Search, Users
} from 'lucide-react'
import { apiService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useAttendance } from '../contexts/AttendanceContext'
import DeviceSetup from './DeviceSetup'

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  present:    'Present',
  late:       'Late',
  'half-day': 'Half Day',
  absent:     'Absent',
  'week-off': 'Week Off',
}

const STATUS_CLASS: Record<string, string> = {
  present:    'bg-green-100 text-green-800',
  late:       'bg-orange-100 text-orange-800',
  'half-day': 'bg-amber-100 text-amber-800',
  absent:     'bg-red-100 text-red-800',
  'week-off': 'bg-slate-100 text-slate-600',
}

function StatusBadge({ status, lateByMinutes = 0 }: { status: string; lateByMinutes?: number }) {
  const label = STATUS_LABEL[status] ?? status
  const cls   = STATUS_CLASS[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${cls}`}>{label}</span>
      {status === 'late' && lateByMinutes > 0 && (
        <span className="text-xs text-orange-500 font-medium">+{lateByMinutes}m</span>
      )}
    </span>
  )
}

function fmt(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Attendance() {
  const { user }    = useAuth()
  const { stats, refreshStats, isLoading: attendanceLoading } = useAttendance()

  // Tab: 'date' | 'employee'
  const [activeTab, setActiveTab] = useState<'date' | 'employee'>('date')

  // ── Date-wise state ───────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate]   = useState(today)
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [employees, setEmployees]         = useState<any[]>([])
  const [loading, setLoading]             = useState(true)
  const [showMarkForm, setShowMarkForm]   = useState(false)
  const [markEmployee, setMarkEmployee]   = useState('')
  const [checkInTime, setCheckInTime]     = useState('')
  const [checkOutTime, setCheckOutTime]   = useState('')
  const [error, setError]                 = useState('')
  const [showDeviceSetup, setShowDeviceSetup] = useState(false)
  const isToday = selectedDate === today

  // ── Employee-wise state ───────────────────────────────────────────────
  const [empSearch, setEmpSearch]         = useState('')
  const [empDropOpen, setEmpDropOpen]     = useState(false)
  const [selectedEmp, setSelectedEmp]     = useState<any>(null)
  const [empRecords, setEmpRecords]       = useState<any[]>([])
  const [empEmployee, setEmpEmployee]     = useState<any>(null)
  const [empStartDate, setEmpStartDate]   = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 6)
    return d.toISOString().split('T')[0]
  })
  const [empEndDate, setEmpEndDate]       = useState(today)
  const [empLoading, setEmpLoading]       = useState(false)
  const [empError, setEmpError]           = useState('')

  const companyId = user?.companyId || ''
  const apiKey    = user?.apiKey    || ''
  const dropRef   = useRef<HTMLDivElement>(null)

  // Filtered employee list for dropdown
  const filteredEmps = employees.filter(e => {
    const name = (e.fullName || e.name || '').toLowerCase()
    const dept = (e.department || '').toLowerCase()
    const q    = empSearch.toLowerCase()
    return name.includes(q) || dept.includes(q) || String(e.employeeId).includes(q)
  })

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setEmpDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Load date-wise data ───────────────────────────────────────────────
  const loadDateWise = async () => {
    try {
      const [attRes, empRes] = await Promise.all([
        apiService.getAttendanceByDate(selectedDate),
        apiService.getEmployees()
      ])
      if (attRes.success)  setAttendanceData(attRes.data || [])
      if (empRes.success)  setEmployees(empRes.data || [])
    } catch {
      setError('Failed to load attendance data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDateWise()
    refreshStats(selectedDate)
    let interval: ReturnType<typeof setInterval> | null = null
    if (isToday) {
      interval = setInterval(() => { loadDateWise(); refreshStats(selectedDate) }, 30000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [selectedDate])

  // Real-time WebSocket for today
  useEffect(() => {
    if (!isToday) return
    let socket: any = null
    const connect = async () => {
      try {
        const { io } = await import('socket.io-client')
        const wsUrl = import.meta.env.PROD ? 'https://api.staffinn.com' : 'http://localhost:4001'
        socket = io(wsUrl, {
          auth: { token: localStorage.getItem('hrms_token') },
          transports: ['websocket', 'polling'],
          reconnection: true
        })
        socket.on('connect', () => {
          if (user?.recruiterId) socket.emit('join-room', `recruiter-${user.recruiterId}`)
        })
        socket.on('attendance-update', () => { loadDateWise(); refreshStats(selectedDate) })
      } catch { /* WebSocket optional */ }
    }
    connect()
    return () => { if (socket) socket.disconnect() }
  }, [isToday, user?.recruiterId])

  // ── Load employee-wise data ───────────────────────────────────────────
  const loadEmployeeWise = async () => {
    if (!selectedEmp) return
    setEmpLoading(true)
    setEmpError('')
    try {
      const res = await apiService.getEmployeeAttendance(selectedEmp.employeeId, empStartDate, empEndDate)
      if (res.success) {
        setEmpRecords(res.data.records || [])
        setEmpEmployee(res.data.employee || selectedEmp)
      } else {
        setEmpError(res.message || 'Failed to load attendance')
      }
    } catch {
      setEmpError('Failed to load attendance data.')
    } finally {
      setEmpLoading(false)
    }
  }

  useEffect(() => { if (selectedEmp) loadEmployeeWise() }, [selectedEmp, empStartDate, empEndDate])

  // ── Mark Attendance ───────────────────────────────────────────────────
  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!markEmployee || !checkInTime) { setError('Select employee and enter check-in time'); return }
    if (checkOutTime && checkOutTime <= checkInTime) { setError('Check-out must be after check-in'); return }
    try {
      const res = await apiService.markAttendance({
        employeeId: markEmployee, checkIn: checkInTime, checkOut: checkOutTime, date: selectedDate
      })
      if (res.success) {
        await loadDateWise(); await refreshStats()
        setShowMarkForm(false); setMarkEmployee(''); setCheckInTime(''); setCheckOutTime('')
      } else { setError(res.message || 'Failed to mark attendance') }
    } catch (err: any) { setError(err.message || 'Failed to mark attendance') }
  }

  // ── Guards ────────────────────────────────────────────────────────────
  if (!user) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Please log in to access attendance management.</p>
      </div>
    </div>
  )

  if (loading || attendanceLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Loading attendance data...</p>
      </div>
    </div>
  )

  // ── Summary stats for employee-wise view ──────────────────────────────
  const empSummary = empRecords.reduce(
    (acc, r) => {
      if (r.status === 'present')    acc.present++
      else if (r.status === 'late')  { acc.present++; acc.late++ }
      else if (r.status === 'half-day') acc.halfDay++
      else if (r.status === 'absent')   acc.absent++
      else if (r.status === 'week-off') acc.weekOff++
      return acc
    },
    { present: 0, late: 0, halfDay: 0, absent: 0, weekOff: 0 }
  )

  // ════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Global error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <span className="text-red-700 text-sm flex-1">{error}</span>
          <button onClick={() => setError('')}><X size={16} className="text-red-400" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-500 text-sm">Track and manage employee attendance in real-time</p>
        </div>
        {!showDeviceSetup && (
          <button onClick={() => setShowDeviceSetup(true)}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium text-sm">
            Device Setup
          </button>
        )}
      </div>

      {showDeviceSetup ? (
        <div>
          <button onClick={() => setShowDeviceSetup(false)} className="mb-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
            ← Back to Attendance
          </button>
          <DeviceSetup companyId={companyId} apiKey={apiKey} />
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full"><CheckCircle className="text-green-600" size={22} /></div>
              <div>
                <p className="text-xs text-gray-500">Present Today</p>
                <p className="text-2xl font-bold">{stats.presentToday}/{stats.totalEmployees}</p>
                <p className="text-xs text-gray-400">{stats.attendanceRate}% attendance</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full"><Clock className="text-orange-600" size={22} /></div>
              <div>
                <p className="text-xs text-gray-500">Late Arrivals</p>
                <p className="text-2xl font-bold">{stats.lateArrivals}</p>
                <p className="text-xs text-gray-400">After 9:30 AM</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full"><Calendar className="text-blue-600" size={22} /></div>
              <div>
                <p className="text-xs text-gray-500">Avg Hours</p>
                <p className="text-2xl font-bold">{stats.avgHours}h</p>
                <p className="text-xs text-gray-400">Daily average</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            <button onClick={() => setActiveTab('date')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeTab === 'date' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Users size={15} /> Date-Wise
            </button>
            <button onClick={() => setActiveTab('employee')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeTab === 'employee' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <User size={15} /> Employee-Wise
            </button>
          </div>

          {/* ── DATE-WISE TAB ── */}
          {activeTab === 'date' && (
            <div className="space-y-4">
              {/* Date controls + Mark button */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
                  <Calendar size={15} className="text-gray-400" />
                  <input type="date" value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="border-none outline-none bg-transparent text-sm" />
                  <button onClick={() => {
                    const d = new Date(selectedDate); d.setDate(d.getDate() - 1)
                    setSelectedDate(d.toISOString().split('T')[0])
                  }} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={14} /></button>
                  <button onClick={() => {
                    const d = new Date(selectedDate); d.setDate(d.getDate() + 1)
                    setSelectedDate(d.toISOString().split('T')[0])
                  }} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={14} /></button>
                  {!isToday && (
                    <button onClick={() => setSelectedDate(today)}
                      className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200">Today</button>
                  )}
                </div>
                {isToday && (
                  <button onClick={() => setShowMarkForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    <Plus size={15} /> Mark Attendance
                  </button>
                )}
                {isToday && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 ml-auto">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live Data
                  </div>
                )}
              </div>

              {/* Date-wise table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b">
                  <h3 className="font-semibold text-gray-800">
                    {isToday ? "Today's" : 'Historical'} Attendance — {fmt(selectedDate)}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {['Employee','Department','Check In','Check Out','Hours','Status'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {attendanceData.length === 0 ? (
                        <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                          No employees found for this date.
                        </td></tr>
                      ) : attendanceData.map((row: any) => {
                        const emp  = row.employee || {}
                        const name = emp.fullName || emp.name || `Employee ${row.employeeId}`
                        const dept = emp.department || '—'
                        return (
                          <tr key={row.employeeId} className="hover:bg-gray-50/60">
                            <td className="px-5 py-3.5">
                              <p className="font-medium text-gray-900">{name}</p>
                              <p className="text-xs text-gray-400">{emp.designation || emp.position || ''}</p>
                            </td>
                            <td className="px-5 py-3.5 text-gray-500 text-xs">{dept}</td>
                            <td className="px-5 py-3.5 text-gray-700">{row.checkIn || '—'}</td>
                            <td className="px-5 py-3.5 text-gray-700">{row.checkOut || '—'}</td>
                            <td className="px-5 py-3.5 text-gray-700">
                              {row.hours ? `${Number(row.hours).toFixed(1)}h` : '—'}
                            </td>
                            <td className="px-5 py-3.5">
                              <StatusBadge status={row.status || 'absent'} lateByMinutes={row.lateByMinutes} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── EMPLOYEE-WISE TAB ── */}
          {activeTab === 'employee' && (
            <div className="space-y-4">
              {/* Employee selector + date range */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
                <h3 className="font-semibold text-gray-800">Select Employee & Date Range</h3>
                <div className="flex flex-wrap gap-4 items-end">
                  {/* Employee search dropdown */}
                  <div className="relative flex-1 min-w-[220px]" ref={dropRef}>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Employee</label>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-white cursor-pointer hover:border-blue-400"
                      onClick={() => setEmpDropOpen(v => !v)}>
                      <Search size={14} className="text-gray-400 flex-shrink-0" />
                      <input
                        className="flex-1 text-sm outline-none bg-transparent"
                        placeholder="Search employee..."
                        value={selectedEmp ? (selectedEmp.fullName || selectedEmp.name) : empSearch}
                        onChange={e => { setEmpSearch(e.target.value); setSelectedEmp(null); setEmpDropOpen(true) }}
                        onFocus={() => setEmpDropOpen(true)}
                      />
                      {selectedEmp && (
                        <button onClick={e => { e.stopPropagation(); setSelectedEmp(null); setEmpSearch(''); setEmpRecords([]) }}>
                          <X size={13} className="text-gray-400 hover:text-red-400" />
                        </button>
                      )}
                    </div>
                    {empDropOpen && filteredEmps.length > 0 && (
                      <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                        {filteredEmps.map((emp: any) => (
                          <div key={emp.employeeId}
                            onClick={() => { setSelectedEmp(emp); setEmpSearch(''); setEmpDropOpen(false) }}
                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm">
                            <span className="font-medium text-gray-900">{emp.fullName || emp.name}</span>
                            <span className="ml-2 text-xs text-gray-400">{emp.department} · ID {emp.employeeId}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {empDropOpen && empSearch && filteredEmps.length === 0 && (
                      <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400">
                        No employees found
                      </div>
                    )}
                  </div>

                  {/* Date range */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">From</label>
                    <input type="date" value={empStartDate}
                      max={empEndDate}
                      onChange={e => setEmpStartDate(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">To</label>
                    <input type="date" value={empEndDate}
                      min={empStartDate} max={today}
                      onChange={e => setEmpEndDate(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {/* Quick range shortcuts */}
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: 'Last 7d',  days: 7  },
                      { label: 'Last 30d', days: 30 },
                      { label: 'Last 90d', days: 90 },
                    ].map(({ label, days }) => (
                      <button key={label}
                        onClick={() => {
                          const d = new Date(); d.setDate(d.getDate() - (days - 1))
                          setEmpStartDate(d.toISOString().split('T')[0])
                          setEmpEndDate(today)
                        }}
                        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-gray-600 font-medium">
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results */}
              {!selectedEmp && (
                <div className="bg-white rounded-xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
                  <User size={36} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm">Select an employee above to view their attendance</p>
                </div>
              )}

              {selectedEmp && empLoading && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              )}

              {selectedEmp && empError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2 items-center">
                  <AlertCircle size={16} className="text-red-500" />
                  <span className="text-red-700 text-sm">{empError}</span>
                </div>
              )}

              {selectedEmp && !empLoading && !empError && empRecords.length > 0 && (
                <div className="space-y-4">
                  {/* Employee info card */}
                  <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-6 items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                      {(empEmployee?.fullName || empEmployee?.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{empEmployee?.fullName || empEmployee?.name}</p>
                      <p className="text-xs text-gray-400">{empEmployee?.department} · {empEmployee?.designation || empEmployee?.position}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Week Off: <span className="font-medium text-gray-600">
                          {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
                            .filter(d => !(empEmployee?.workingDays || ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']).includes(d))
                            .join(', ') || 'None'}
                        </span>
                      </p>
                    </div>
                    {/* Summary chips */}
                    <div className="flex flex-wrap gap-2 ml-auto">
                      {[
                        { label: 'Present',  value: empSummary.present,  cls: 'bg-green-50 text-green-700 border-green-200' },
                        { label: 'Late',     value: empSummary.late,     cls: 'bg-orange-50 text-orange-700 border-orange-200' },
                        { label: 'Half Day', value: empSummary.halfDay,  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                        { label: 'Absent',   value: empSummary.absent,   cls: 'bg-red-50 text-red-700 border-red-200' },
                        { label: 'Week Off', value: empSummary.weekOff,  cls: 'bg-slate-50 text-slate-600 border-slate-200' },
                      ].map(({ label, value, cls }) => (
                        <div key={label} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${cls}`}>
                          {label}: {value}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attendance table */}
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b">
                      <h3 className="font-semibold text-gray-800">
                        Attendance — {fmt(empStartDate)} to {fmt(empEndDate)}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {['Date','Day','Check In','Check Out','Hours','Status'].map(h => (
                              <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {empRecords.map((row: any, i: number) => {
                            const dayName = new Date(row.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })
                            const isWO   = row.status === 'week-off'
                            return (
                              <tr key={i} className={`hover:bg-gray-50/60 ${isWO ? 'opacity-60' : ''}`}>
                                <td className="px-5 py-3.5 font-medium text-gray-800">{fmt(row.date)}</td>
                                <td className="px-5 py-3.5 text-gray-500 text-xs">{dayName}</td>
                                <td className="px-5 py-3.5 text-gray-700">{row.checkIn  || '—'}</td>
                                <td className="px-5 py-3.5 text-gray-700">{row.checkOut || '—'}</td>
                                <td className="px-5 py-3.5 text-gray-700">
                                  {row.hours ? `${Number(row.hours).toFixed(1)}h` : '—'}
                                </td>
                                <td className="px-5 py-3.5">
                                  <StatusBadge status={row.status || 'absent'} lateByMinutes={row.lateByMinutes} />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Mark Attendance Modal ── */}
          {showMarkForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Mark Attendance</h3>
                  <button onClick={() => { setShowMarkForm(false); setError('') }}>
                    <X size={20} className="text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
                {error && (
                  <div className="mb-4 flex items-center gap-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg text-sm">
                    <AlertCircle size={15} />{error}
                  </div>
                )}
                <form onSubmit={handleMarkAttendance} className="space-y-4">
                  <select value={markEmployee} onChange={e => setMarkEmployee(e.target.value)}
                    className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="">Select Employee</option>
                    {employees.map((emp: any) => {
                      const hasAtt = attendanceData.find((a: any) => a.employeeId === emp.employeeId && a.status !== 'absent' && a.status !== 'week-off')
                      return (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          {emp.fullName || emp.name} {hasAtt ? '(Marked)' : ''}
                        </option>
                      )
                    })}
                  </select>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Check In Time *</label>
                    <input type="time" value={checkInTime} onChange={e => setCheckInTime(e.target.value)}
                      className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Check Out Time (Optional)</label>
                    <input type="time" value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)}
                      className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => { setShowMarkForm(false); setError('') }}
                      className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                    <button type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                      Mark Attendance
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
