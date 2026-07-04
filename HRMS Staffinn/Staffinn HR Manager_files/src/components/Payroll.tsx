/**
 * Payroll.tsx — Production-grade payroll with:
 * • Date-range run (not just month)
 * • Employee filter
 * • Frozen snapshots (payroll runs history)
 * • Detailed breakdown: present/absent/half-day/holiday/weekly-off/LWP
 * • Professional PDF-quality payslip download
 */
import { useState, useEffect } from 'react'
import {
  Play, Download, CreditCard, Calendar, Users, TrendingUp,
  AlertCircle, FileText, Eye, History, Search, X, RefreshCw,
  IndianRupee, Clock, CheckCircle, XCircle, Briefcase
} from 'lucide-react'
import { apiService } from '../services/api'

interface PayrollRecord {
  payrollRecordId: string; runId: string; startDate: string; endDate: string; month: string
  employeeId: string; employeeName: string; department: string; designation: string
  basicSalary: number; salaryType: string; totalScheduledDays: number
  daysPresent: number; halfDays: number; fullAbsent: number
  paidLeaves: number; unpaidLeaves: number; weeklyOffs: number
  holidays: number; compOffs: number; overtimeHours: number
  lateHalfDayDeductions: number; lwpDays: number; perDaySalary: number
  allowances: any[]; bonus: number; overtimePay: number; totalEarnings: number
  deductions: any[]; totalDeductions: number; netSalary: number
  paymentStatus: string; isFrozen: boolean; createdAt: string
}

interface PayrollRun {
  runId: string; startDate: string; endDate: string; month: string
  totalEmployees: number; totalGrossSalary: number; totalDeductions: number
  totalNetSalary: number; generatedBy: string; generatedAt: string
}

type ViewMode = 'runs' | 'run-detail' | 'new-run'

export default function Payroll() {
  const [viewMode, setViewMode]           = useState<ViewMode>('runs')
  const [runs, setRuns]                   = useState<PayrollRun[]>([])
  const [runRecords, setRunRecords]       = useState<PayrollRecord[]>([])
  const [selectedRun, setSelectedRun]     = useState<PayrollRun | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null)
  const [employees, setEmployees]         = useState<any[]>([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState('')
  const [searchTerm, setSearchTerm]       = useState('')

  // New run form
  const today = new Date()
  const firstDay = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`
  const lastDay  = new Date(today.getFullYear(), today.getMonth()+1, 0).toISOString().split('T')[0]
  const [runForm, setRunForm] = useState({ startDate: firstDay, endDate: lastDay, employeeId: '' })

  useEffect(() => {
    loadRuns()
    loadEmployees()
  }, [])

  const loadRuns = async () => {
    try {
      setLoading(true)
      const res = await apiService.getPayrollRuns()
      setRuns(res.data || [])
    } catch { setError('Failed to load payroll runs') }
    finally { setLoading(false) }
  }

  const loadEmployees = async () => {
    try {
      const res = await apiService.getEmployees()
      if (res.success) setEmployees(res.data || [])
    } catch {}
  }

  const handleRunPayroll = async () => {
    if (!runForm.startDate || !runForm.endDate) { setError('Start and end dates are required'); return }
    if (runForm.startDate > runForm.endDate)     { setError('Start date must be before end date'); return }
    if (!confirm(`Run payroll for ${runForm.startDate} → ${runForm.endDate}?\n\nThis will generate a FROZEN payroll snapshot that cannot be modified later.`)) return

    try {
      setLoading(true); setError(''); setSuccess('')
      const res = await apiService.runPayroll(runForm.startDate, runForm.endDate, runForm.employeeId || null)
      if (res.success) {
        setSuccess(`✅ Payroll generated for ${res.data.totalEmployees} employees (${runForm.startDate} → ${runForm.endDate})`)
        await loadRuns()
        setViewMode('runs')
      } else { setError(res.message || 'Failed to run payroll') }
    } catch (e: any) { setError(e.message || 'Failed to run payroll') }
    finally { setLoading(false) }
  }

  const openRun = async (run: PayrollRun) => {
    try {
      setLoading(true)
      const res = await apiService.getPayrollByRun(run.runId)
      setRunRecords(res.data || [])
      setSelectedRun(run)
      setViewMode('run-detail')
    } catch { setError('Failed to load payroll records') }
    finally { setLoading(false) }
  }

  const filtered = runRecords.filter(r =>
    !searchTerm ||
    r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.department?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error   && <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl text-sm"><AlertCircle size={18}/>{error}<button onClick={()=>setError('')} className="ml-auto"><X size={16}/></button></div>}
      {success && <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-300 text-green-700 rounded-xl text-sm"><CheckCircle size={18}/>{success}<button onClick={()=>setSuccess('')} className="ml-auto"><X size={16}/></button></div>}

      {/* ── RUNS LIST VIEW ── */}
      {viewMode === 'runs' && (
        <RunsView runs={runs} loading={loading} onNewRun={()=>setViewMode('new-run')}
          onOpenRun={openRun} onRefresh={loadRuns} fmt={fmt} />
      )}

      {/* ── NEW RUN VIEW ── */}
      {viewMode === 'new-run' && (
        <NewRunView runForm={runForm} setRunForm={setRunForm} employees={employees}
          loading={loading} onRun={handleRunPayroll} onBack={()=>setViewMode('runs')} />
      )}

      {/* ── RUN DETAIL VIEW ── */}
      {viewMode === 'run-detail' && selectedRun && (
        <RunDetailView run={selectedRun} records={filtered} searchTerm={searchTerm}
          setSearchTerm={setSearchTerm} loading={loading}
          onBack={()=>{ setViewMode('runs'); setSelectedRun(null); setRunRecords([]) }}
          onViewRecord={setSelectedRecord} fmt={fmt} />
      )}

      {/* ── PAYSLIP MODAL ── */}
      {selectedRecord && (
        <PayslipModal record={selectedRecord} onClose={()=>setSelectedRecord(null)} fmt={fmt} />
      )}
    </div>
  )
}

/* ─── RunsView ─────────────────────────────────────────────────── */
function RunsView({ runs, loading, onNewRun, onOpenRun, onRefresh, fmt }: any) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Each run is a frozen snapshot — past payroll never changes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={onNewRun}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold shadow-md">
            <Play size={16} /> Run Payroll
          </button>
        </div>
      </div>

      {loading && runs.length === 0 ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"/></div>
      ) : runs.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
          <History size={52} className="mx-auto text-gray-300 mb-4"/>
          <p className="text-gray-600 font-semibold text-lg">No payroll runs yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">Run your first payroll to generate salary slips for all employees</p>
          <button onClick={onNewRun} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold">
            Run First Payroll
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run: any) => (
            <div key={run.runId}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 cursor-pointer group"
              onClick={() => onOpenRun(run)}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar size={22} className="text-blue-600"/>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {new Date(run.startDate+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                      {' → '}
                      {new Date(run.endDate+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Users size={11}/>{run.totalEmployees} employees</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">By {run.generatedBy}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{new Date(run.generatedAt).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8 flex-wrap">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Gross</p>
                    <p className="font-bold text-gray-800">{fmt(run.totalGrossSalary)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Deductions</p>
                    <p className="font-bold text-red-600">-{fmt(run.totalDeductions)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Net Payable</p>
                    <p className="font-bold text-emerald-600 text-lg">{fmt(run.totalNetSalary)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    🔒 Frozen
                  </div>
                  <Eye size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors"/>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── NewRunView ────────────────────────────────────────────────── */
function NewRunView({ runForm, setRunForm, employees, loading, onRun, onBack }: any) {
  const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-01`
  const monthEnd   = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).toISOString().split('T')[0]

  const presets = [
    { label: 'This Month',  start: monthStart, end: monthEnd },
    { label: 'Last Month',  start: (() => { const d=new Date(); d.setMonth(d.getMonth()-1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` })(),
      end: (() => { const d=new Date(); return new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split('T')[0] })() },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><X size={20}/></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Run Payroll</h1>
          <p className="text-sm text-gray-500">Generate a frozen payroll snapshot for the selected period</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        {/* Quick presets */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Quick Select</p>
          <div className="flex gap-2 flex-wrap">
            {presets.map(p => (
              <button key={p.label} onClick={() => setRunForm({ ...runForm, startDate: p.start, endDate: p.end })}
                className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">From Date *</label>
            <input type="date" value={runForm.startDate}
              onChange={e => setRunForm({ ...runForm, startDate: e.target.value })}
              className="w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">To Date *</label>
            <input type="date" value={runForm.endDate}
              onChange={e => setRunForm({ ...runForm, endDate: e.target.value })}
              className="w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"/>
          </div>
        </div>

        {/* Employee filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Employee Filter (optional)</label>
          <select value={runForm.employeeId}
            onChange={e => setRunForm({ ...runForm, employeeId: e.target.value })}
            className="w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm">
            <option value="">All Active Employees</option>
            {employees.map((e: any) => (
              <option key={e.employeeId} value={e.employeeId}>
                {e.fullName || e.name} — {e.department} ({e.employeeId})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Leave empty to process all employees</p>
        </div>

        {/* Policy reminder */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
          <p className="font-semibold">Payroll Calculation Policy (as configured)</p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-700 text-xs">
            <li>Workweek: Mon–Sat (Sunday = weekly off by default)</li>
            <li>CL / ML approved leaves = no deduction</li>
            <li>LWP / unpaid absences = full-day deduction per day</li>
            <li>Late arrival → half-day deduction per policy</li>
            <li>Holidays declared in Holiday Management = no deduction</li>
            <li>This snapshot is <strong>frozen on generation</strong> — attendance changes won't affect it</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button onClick={onBack} className="flex-1 py-2.5 border rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onRun} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-md">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Processing…</>
              : <><Play size={16}/> Generate Payroll</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── RunDetailView ─────────────────────────────────────────────── */
function RunDetailView({ run, records, searchTerm, setSearchTerm, loading, onBack, onViewRecord, fmt }: any) {
  const totalGross = records.reduce((s: number, r: any) => s + (r.totalEarnings || 0), 0)
  const totalDed   = records.reduce((s: number, r: any) => s + (r.totalDeductions || 0), 0)
  const totalNet   = records.reduce((s: number, r: any) => s + (r.netSalary || 0), 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500"><X size={20}/></button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {new Date(run.startDate+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                {' → '}
                {new Date(run.endDate+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
              </h1>
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200">🔒 Frozen</span>
            </div>
            <p className="text-xs text-gray-500">Generated by {run.generatedBy} · {new Date(run.generatedAt).toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input type="text" placeholder="Search employee…" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 w-56"/>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'Employees', val: records.length, icon: Users, color:'blue', bg:'bg-blue-50' },
          { label:'Gross Salary', val: fmt(totalGross), icon: TrendingUp, color:'green', bg:'bg-green-50' },
          { label:'Deductions', val: fmt(totalDed), icon: XCircle, color:'red', bg:'bg-red-50' },
          { label:'Net Payable', val: fmt(totalNet), icon: IndianRupee, color:'emerald', bg:'bg-emerald-50' },
        ].map(({ label, val, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}>
              <Icon size={18} className={`text-${color}-600`}/>
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`font-bold text-${color}-700 text-base leading-tight`}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"/></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Employee','Department','Days Present','Half Days','Absent','LWP Days','Gross','Deductions','Net Salary','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">No records found</td></tr>
                ) : records.map((r: any) => (
                  <tr key={r.payrollRecordId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{r.employeeName}</p>
                      <p className="text-xs text-gray-400">{r.employeeId}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.department}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        {r.daysPresent}/{r.totalScheduledDays}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-amber-600 text-xs font-medium">{r.halfDays}</td>
                    <td className="px-4 py-3 text-center text-red-500 text-xs font-medium">{r.fullAbsent}</td>
                    <td className="px-4 py-3 text-center text-red-600 text-xs font-medium">{r.lwpDays?.toFixed(1) || 0}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{fmt(r.totalEarnings)}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">-{fmt(r.totalDeductions)}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">{fmt(r.netSalary)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => onViewRecord(r)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <FileText size={12}/> Payslip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── PayslipModal — professional printable payslip ──────────────── */
function PayslipModal({ record: r, onClose, fmt }: any) {
  const fmtDate = (d: string) => d ? new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '—'

  const handleDownload = () => {
    const logo = 'STAFFINN HRMS'
    const content = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Payslip - ${r.employeeName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a2e; background: #fff; }
  .page { max-width: 800px; margin: 0 auto; padding: 32px; }

  /* Header */
  .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:20px; border-bottom:3px solid #1d4ed8; margin-bottom:20px; }
  .company-name { font-size:22px; font-weight:800; color:#1d4ed8; letter-spacing:-0.5px; }
  .company-sub  { font-size:11px; color:#6b7280; margin-top:2px; }
  .payslip-title { text-align:right; }
  .payslip-title h2 { font-size:18px; font-weight:700; color:#111827; }
  .payslip-title p  { font-size:11px; color:#6b7280; margin-top:2px; }

  /* Employee Info */
  .emp-section { display:grid; grid-template-columns:1fr 1fr; gap:16px; background:#f8faff; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:20px; }
  .emp-field label { font-size:10px; text-transform:uppercase; letter-spacing:.5px; color:#6b7280; font-weight:600; }
  .emp-field p    { font-size:13px; font-weight:600; color:#111827; margin-top:2px; }

  /* Attendance */
  .att-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin-bottom:20px; }
  .att-box  { text-align:center; padding:10px 6px; border-radius:8px; border:1px solid #e5e7eb; }
  .att-box .num { font-size:18px; font-weight:800; }
  .att-box .lbl { font-size:9px; text-transform:uppercase; color:#6b7280; margin-top:2px; font-weight:600; }
  .att-present { background:#ecfdf5; color:#059669; border-color:#a7f3d0; }
  .att-half    { background:#fffbeb; color:#d97706; border-color:#fde68a; }
  .att-absent  { background:#fef2f2; color:#dc2626; border-color:#fecaca; }
  .att-leave   { background:#eff6ff; color:#2563eb; border-color:#bfdbfe; }
  .att-other   { background:#f5f3ff; color:#6d28d9; border-color:#ddd6fe; }

  /* Earnings / Deductions */
  .ed-row { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; }
  .ed-box { border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; }
  .ed-box-header { padding:10px 14px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; }
  .ed-earn-header { background:#ecfdf5; color:#065f46; }
  .ed-ded-header  { background:#fef2f2; color:#991b1b; }
  .ed-item { display:flex; justify-content:space-between; padding:7px 14px; font-size:12px; border-top:1px solid #f3f4f6; }
  .ed-item:nth-child(even) { background:#fafafa; }
  .ed-total { display:flex; justify-content:space-between; padding:10px 14px; font-size:13px; font-weight:700; border-top:2px solid #e5e7eb; background:#f9fafb; }

  /* Net Salary */
  .net-box { background:linear-gradient(135deg,#1d4ed8,#4f46e5); color:#fff; border-radius:12px; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
  .net-box .label { font-size:12px; opacity:.8; }
  .net-box .amount { font-size:28px; font-weight:800; }

  /* Footer */
  .footer { border-top:1px solid #e5e7eb; padding-top:14px; display:flex; justify-content:space-between; font-size:10px; color:#9ca3af; }
  .frozen-badge { display:inline-flex; align-items:center; gap:4px; background:#fef3c7; color:#92400e; border:1px solid #fde68a; border-radius:20px; padding:3px 10px; font-size:10px; font-weight:600; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="company-name">${logo}</div>
      <div class="company-sub">Human Resource Management System</div>
    </div>
    <div class="payslip-title">
      <h2>SALARY SLIP</h2>
      <p>Pay Period: ${fmtDate(r.startDate)} → ${fmtDate(r.endDate)}</p>
      <p style="margin-top:6px"><span class="frozen-badge">🔒 Frozen Snapshot</span></p>
    </div>
  </div>

  <div class="emp-section">
    <div class="emp-field"><label>Employee Name</label><p>${r.employeeName}</p></div>
    <div class="emp-field"><label>Employee ID</label><p>${r.employeeId}</p></div>
    <div class="emp-field"><label>Department</label><p>${r.department}</p></div>
    <div class="emp-field"><label>Designation</label><p>${r.designation}</p></div>
    <div class="emp-field"><label>Basic Salary</label><p>${fmt(r.basicSalary)}</p></div>
    <div class="emp-field"><label>Per Day Rate</label><p>${fmt(r.perDaySalary)}</p></div>
  </div>

  <div class="att-grid">
    <div class="att-box att-present"><div class="num">${r.daysPresent}</div><div class="lbl">Present</div></div>
    <div class="att-box att-half"><div class="num">${r.halfDays}</div><div class="lbl">Half Days</div></div>
    <div class="att-box att-absent"><div class="num">${r.fullAbsent}</div><div class="lbl">Absent</div></div>
    <div class="att-box att-leave"><div class="num">${r.paidLeaves || 0}</div><div class="lbl">Paid Leave</div></div>
    <div class="att-box att-other"><div class="num">${r.weeklyOffs || 0} + ${r.holidays || 0}</div><div class="lbl">WO + Holiday</div></div>
  </div>

  <div class="ed-row">
    <div class="ed-box">
      <div class="ed-box-header ed-earn-header">Earnings</div>
      <div class="ed-item"><span>Basic Salary</span><span>${fmt(r.basicSalary)}</span></div>
      ${(r.allowances||[]).map((a:any) => `<div class="ed-item"><span>${a.name}</span><span>${fmt(a.amount)}</span></div>`).join('')}
      ${r.bonus > 0 ? `<div class="ed-item"><span>Bonus</span><span>${fmt(r.bonus)}</span></div>` : ''}
      ${r.overtimePay > 0 ? `<div class="ed-item"><span>Overtime (${r.overtimeHours?.toFixed(1)}h)</span><span>${fmt(r.overtimePay)}</span></div>` : ''}
      <div class="ed-total"><span>Total Earnings</span><span style="color:#059669">${fmt(r.totalEarnings)}</span></div>
    </div>
    <div class="ed-box">
      <div class="ed-box-header ed-ded-header">Deductions</div>
      ${(r.deductions||[]).map((d:any) => `<div class="ed-item"><span>${d.name}${d.breakdown ? '<br><small style="color:#9ca3af">'+d.breakdown+'</small>' : ''}</span><span>${fmt(d.amount)}</span></div>`).join('')}
      <div class="ed-total"><span>Total Deductions</span><span style="color:#dc2626">-${fmt(r.totalDeductions)}</span></div>
    </div>
  </div>

  <div class="net-box">
    <div><div class="label">Net Salary Payable</div><div style="font-size:11px;opacity:.7;margin-top:2px">${r.month} · ${r.totalScheduledDays} working days</div></div>
    <div class="amount">${fmt(r.netSalary)}</div>
  </div>

  <div class="footer">
    <span>Generated: ${new Date(r.createdAt).toLocaleString('en-IN')} · Run ID: ${r.runId}</span>
    <span>This is a computer-generated payslip. No signature required.</span>
  </div>
</div>
</body></html>`

    const blob = new Blob([content], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `Payslip_${r.employeeName.replace(/\s+/g,'-')}_${r.month}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-700 to-indigo-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Salary Slip</h2>
            <p className="text-blue-200 text-xs mt-0.5">{r.employeeName} · {r.month}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-colors border border-white/30">
              <Download size={15}/> Download
            </button>
            <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-colors"><X size={18}/></button>
          </div>
        </div>

        {/* Modal body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Employee info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[['Employee ID', r.employeeId],['Department', r.department],['Designation', r.designation],
              ['Pay Period', `${r.startDate} → ${r.endDate}`],['Basic Salary', fmt(r.basicSalary)],['Per Day', fmt(r.perDaySalary)]
            ].map(([l,v]) => (
              <div key={l} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide">{l}</p>
                <p className="font-semibold text-gray-800 text-sm mt-0.5">{v}</p>
              </div>
            ))}
          </div>

          {/* Attendance summary */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Attendance Summary</p>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label:'Present', val: r.daysPresent, bg:'bg-emerald-50', txt:'text-emerald-700' },
                { label:'Half Days', val: r.halfDays, bg:'bg-amber-50', txt:'text-amber-700' },
                { label:'Absent', val: r.fullAbsent, bg:'bg-red-50', txt:'text-red-600' },
                { label:'Paid Leave', val: r.paidLeaves||0, bg:'bg-blue-50', txt:'text-blue-700' },
                { label:'WO+Holiday', val:`${r.weeklyOffs||0}+${r.holidays||0}`, bg:'bg-purple-50', txt:'text-purple-700' },
              ].map(({ label, val, bg, txt }) => (
                <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                  <p className={`text-xl font-black ${txt}`}>{val}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            {r.lwpDays > 0 && (
              <p className="text-xs text-red-600 mt-2 bg-red-50 px-3 py-1.5 rounded-lg">
                LWP: {r.lwpDays?.toFixed(2)} days × {fmt(r.perDaySalary)}/day = <strong>-{fmt(r.lwpDays * r.perDaySalary)}</strong>
              </p>
            )}
          </div>

          {/* Earnings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-emerald-100 border-b border-emerald-200">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Earnings</p>
              </div>
              <div className="divide-y divide-emerald-100">
                <div className="flex justify-between px-4 py-2 text-sm"><span className="text-gray-600">Basic</span><span className="font-medium">{fmt(r.basicSalary)}</span></div>
                {(r.allowances||[]).map((a:any,i:number) => (
                  <div key={i} className="flex justify-between px-4 py-2 text-sm"><span className="text-gray-600">{a.name}</span><span className="font-medium">{fmt(a.amount)}</span></div>
                ))}
                {r.bonus > 0 && <div className="flex justify-between px-4 py-2 text-sm"><span className="text-gray-600">Bonus</span><span className="font-medium">{fmt(r.bonus)}</span></div>}
                {r.overtimePay > 0 && <div className="flex justify-between px-4 py-2 text-sm"><span className="text-gray-600">Overtime</span><span className="font-medium">{fmt(r.overtimePay)}</span></div>}
              </div>
              <div className="flex justify-between px-4 py-3 bg-emerald-100 font-bold text-sm border-t border-emerald-200">
                <span>Total Earnings</span><span className="text-emerald-700">{fmt(r.totalEarnings)}</span>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-red-100 border-b border-red-200">
                <p className="text-xs font-bold text-red-800 uppercase tracking-wide">Deductions</p>
              </div>
              <div className="divide-y divide-red-100">
                {(r.deductions||[]).map((d:any,i:number) => (
                  <div key={i} className="flex justify-between px-4 py-2 text-sm">
                    <div><span className="text-gray-600">{d.name}</span>{d.breakdown&&<p className="text-xs text-gray-400">{d.breakdown}</p>}</div>
                    <span className="font-medium text-red-600">-{fmt(d.amount)}</span>
                  </div>
                ))}
                {(r.deductions||[]).length === 0 && <div className="px-4 py-3 text-sm text-gray-400 text-center">No deductions</div>}
              </div>
              <div className="flex justify-between px-4 py-3 bg-red-100 font-bold text-sm border-t border-red-200">
                <span>Total Deductions</span><span className="text-red-700">-{fmt(r.totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Net salary */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-5 flex justify-between items-center text-white">
            <div>
              <p className="text-sm text-blue-200">Net Salary Payable</p>
              <p className="text-xs text-blue-300 mt-0.5">{r.totalScheduledDays} scheduled days · {r.month}</p>
            </div>
            <p className="text-3xl font-black">{fmt(r.netSalary)}</p>
          </div>

          <p className="text-center text-xs text-gray-400">
            Run ID: {r.runId} · Generated: {new Date(r.createdAt).toLocaleString('en-IN')} · Computer generated — no signature required
          </p>
        </div>
      </div>
    </div>
  )
}
