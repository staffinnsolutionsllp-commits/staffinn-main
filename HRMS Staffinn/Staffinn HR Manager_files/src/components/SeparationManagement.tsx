import { useState, useEffect } from 'react'
import {
  LogOut, Plus, Eye, Users, Clock, FileText, DollarSign,
  CheckCircle, AlertCircle, ChevronRight, ClipboardCheck,
  Shield, X, RefreshCw
} from 'lucide-react'
import { apiService } from '../services/api'

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Sep   = Record<string, any>
type NDC   = Record<string, any>
type Emp   = Record<string, any>

/* ─── Status badge helper ────────────────────────────────────────────────── */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    'Completed':          'bg-green-100 text-green-800',
    'Cleared':            'bg-green-100 text-green-800',
    'Approved':           'bg-blue-100 text-blue-800',
    'HR Accepted':        'bg-blue-100 text-blue-800',
    'Manager Approved':   'bg-indigo-100 text-indigo-800',
    'In Notice Period':   'bg-yellow-100 text-yellow-800',
    'In Progress':        'bg-yellow-100 text-yellow-800',
    'Initiated':          'bg-orange-100 text-orange-800',
    'Pending':            'bg-gray-100 text-gray-700',
    'Rejected':           'bg-red-100 text-red-800',
    'Not Cleared':        'bg-red-100 text-red-800',
    'All Departments Cleared': 'bg-emerald-100 text-emerald-800'
  }
  const cls = map[status] || 'bg-gray-100 text-gray-700'
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${cls}`}>{status}</span>
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function SeparationManagement() {
  const [separations, setSeparations]   = useState<Sep[]>([])
  const [employees,   setEmployees]     = useState<Emp[]>([])
  const [stats,       setStats]         = useState<any>({ total: 0, active: 0, inNoticePeriod: 0, pendingFnF: 0, pendingExitInterview: 0, completed: 0, ndcPending: 0 })
  const [loading,     setLoading]       = useState(true)
  const [filters,     setFilters]       = useState({ employeeId: '', status: '', department: '', startDate: '', endDate: '' })
  const [showCreate,  setShowCreate]    = useState(false)
  const [selected,    setSelected]      = useState<Sep | null>(null)
  const [activeTab,   setActiveTab]     = useState('details')
  const [form, setForm] = useState({ employeeId: '', exitType: 'Resignation', resignationReason: '', lastWorkingDate: '', noticePeriodDays: 30 })

  useEffect(() => { loadAll() }, [filters])

  const loadAll = async () => {
    setLoading(true)
    try { await Promise.all([loadSeparations(), loadStats(), loadEmployees()]) }
    finally { setLoading(false) }
  }

  const loadEmployees = async () => {
    try {
      const r = await apiService.getEmployees()
      if (r.success) setEmployees(r.data)
    } catch {}
  }

  const loadSeparations = async () => {
    try {
      const r = await apiService.getSeparations(filters)
      if (r.success) setSeparations(r.data)
    } catch {}
  }

  const loadStats = async () => {
    try {
      const r = await apiService.getSeparationStats()
      if (r.success) setStats(r.data.stats)
    } catch {}
  }

  const handleCreate = async () => {
    if (!form.employeeId || !form.resignationReason || !form.lastWorkingDate) {
      alert('Please fill all required fields'); return
    }
    const emp = employees.find(e => (e.employeeId || e.id) === form.employeeId)
    await apiService.createSeparation({ ...form, employeeName: emp?.fullName || emp?.name || '', department: emp?.department || '', designation: emp?.designation || '' })
    setShowCreate(false)
    setForm({ employeeId: '', exitType: 'Resignation', resignationReason: '', lastWorkingDate: '', noticePeriodDays: 30 })
    loadAll()
  }

  const openDetail = async (sep: Sep) => {
    try {
      const r = await apiService.getSeparationById(sep.separationId)
      if (r.success) setSelected(r.data)
      else setSelected(sep)
    } catch { setSelected(sep) }
    setActiveTab('details')
  }

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )

  const STAT_CARDS = [
    { label: 'Total', key: 'total',              icon: LogOut,       color: 'blue'   },
    { label: 'Active', key: 'active',             icon: Users,        color: 'orange' },
    { label: 'In Notice', key: 'inNoticePeriod',  icon: Clock,        color: 'yellow' },
    { label: 'Pending F&F', key: 'pendingFnF',    icon: DollarSign,   color: 'purple' },
    { label: 'Pending Exit', key: 'pendingExitInterview', icon: AlertCircle, color: 'red' },
    { label: 'NDC Pending', key: 'ndcPending',    icon: ClipboardCheck, color: 'indigo' },
    { label: 'Completed', key: 'completed',       icon: CheckCircle,  color: 'green'  }
  ]

  const COLOR_MAP: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600', orange: 'bg-orange-100 text-orange-600',
    yellow: 'bg-yellow-100 text-yellow-600', purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600', indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Separation Management</h1>
          <p className="text-gray-500 text-sm mt-1">Enterprise exit lifecycle — Resignation → NDC → Full & Final</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> Create Separation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        {STAT_CARDS.map(sc => {
          const Icon = sc.icon
          return (
            <div key={sc.key} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${COLOR_MAP[sc.color]}`}><Icon size={16} /></div>
                <div>
                  <p className="text-xs text-gray-500">{sc.label}</p>
                  <p className="text-xl font-bold text-gray-900">{(stats as any)[sc.key] ?? 0}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters + Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b grid grid-cols-2 md:grid-cols-5 gap-3">
          <select value={filters.employeeId} onChange={e => setFilters({ ...filters, employeeId: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">All Employees</option>
            {employees.map(emp => <option key={emp.employeeId || emp.id} value={emp.employeeId || emp.id}>{emp.fullName || emp.name} ({emp.employeeId})</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">All Status</option>
            {['Initiated','Manager Approved','HR Accepted','In Notice Period','Completed','Rejected'].map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="text" placeholder="Department" value={filters.department} onChange={e => setFilters({ ...filters, department: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <input type="date" value={filters.endDate}   onChange={e => setFilters({ ...filters, endDate:   e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                {['ID','Employee Name','Emp ID','Department','Exit Type','Resign Date','LWD','Status','NDC','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {separations.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No separation records found</td></tr>
              )}
              {separations.map(sep => (
                <tr key={sep.separationId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{sep.separationId?.slice(0,8)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{sep.employeeName || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{sep.employeeId}</td>
                  <td className="px-4 py-3 text-gray-600">{sep.department || '-'}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">{sep.exitType || 'Resignation'}</span></td>
                  <td className="px-4 py-3 text-gray-600">{sep.resignationDate ? new Date(sep.resignationDate).toLocaleDateString('en-IN') : '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{sep.lastWorkingDate ? new Date(sep.lastWorkingDate).toLocaleDateString('en-IN') : '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={sep.resignationStatus} /></td>
                  <td className="px-4 py-3">
                    {sep.ndcGenerated
                      ? <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle size={12} />Generated</span>
                      : <span className="text-xs text-gray-400">Not generated</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(sep)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Eye size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && <CreateSeparationModal employees={employees} onClose={() => setShowCreate(false)} onCreated={loadAll} />}

      {/* Detail Modal */}
      {selected && (
        <SeparationDetailModal
          separation={selected} activeTab={activeTab} setActiveTab={setActiveTab}
          onClose={() => setSelected(null)} onRefresh={loadAll}
        />
      )}
    </div>
  )
}

/* ─── Create Modal ───────────────────────────────────────────────────────── */
function CreateSeparationModal({ employees, onClose, onCreated }: any) {
  const [form, setForm] = useState({ employeeId: '', exitType: 'Resignation', resignationReason: '', lastWorkingDate: '', noticePeriodDays: 30 })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.employeeId || !form.resignationReason || !form.lastWorkingDate) { alert('Fill all required fields'); return }
    setSaving(true)
    try {
      const emp = employees.find((e: any) => (e.employeeId || e.id) === form.employeeId)
      await apiService.createSeparation({ ...form, employeeName: emp?.fullName || emp?.name || '', department: emp?.department || '', designation: emp?.designation || '' })
      onCreated(); onClose()
    } catch { alert('Failed to create separation record') }
    finally { setSaving(false) }
  }

  const EXIT_TYPES = ['Resignation','Termination','Retirement','End of Contract','Absconding','Mutual Separation','Death in Service']

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-semibold text-gray-900">Create Separation Record</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Employee *</label>
            <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">Select Employee</option>
              {employees.map((emp: any) => (
                <option key={emp.employeeId || emp.id} value={emp.employeeId || emp.id}>
                  {emp.fullName || emp.name} ({emp.employeeId}) — {emp.department}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Exit Type *</label>
            <select value={form.exitType} onChange={e => setForm({ ...form, exitType: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
              {EXIT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Reason *</label>
            <textarea value={form.resignationReason} onChange={e => setForm({ ...form, resignationReason: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" placeholder="Enter reason..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Last Working Date *</label>
              <input type="date" value={form.lastWorkingDate} onChange={e => setForm({ ...form, lastWorkingDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Notice Period (Days)</label>
              <input type="number" min={0} value={form.noticePeriodDays} onChange={e => setForm({ ...form, noticePeriodDays: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Detail Modal ───────────────────────────────────────────────────────── */
function SeparationDetailModal({ separation, activeTab, setActiveTab, onClose, onRefresh }: any) {
  const [ndc,         setNDC]         = useState<NDC | null>(null)
  const [ndcLoading,  setNDCLoading]  = useState(false)
  const [statusForm,  setStatusForm]  = useState({ status: '', remark: '' })
  const [noticeForm,  setNoticeForm]  = useState({ earlyRelease: false, absconding: false, handoverCompleted: false })
  const [exitForm,    setExitForm]    = useState({ status: '', scheduledDate: '', hrRemarks: '' })
  const [fnfForm,     setFnfForm]     = useState({ status: '', finalSalary: 0, leaveEncashment: 0, loanDeductions: 0, noticeShortfall: 0, bonus: 0 })

  const TABS = [
    { id: 'details',  label: 'Details' },
    { id: 'notice',   label: 'Notice Period' },
    { id: 'exit',     label: 'Exit Interview' },
    { id: 'fnf',      label: 'F&F Settlement' },
    { id: 'ndc',      label: 'No Dues Clearance' },
    { id: 'documents',label: 'Documents' },
    { id: 'rating',   label: 'Final Rating' }
  ]

  const loadNDC = async () => {
    if (!separation.ndcId) return
    setNDCLoading(true)
    try {
      const r = await apiService.getNDC(separation.separationId)
      if (r.success) setNDC(r.data)
    } catch {} finally { setNDCLoading(false) }
  }

  useEffect(() => { if (activeTab === 'ndc') loadNDC() }, [activeTab])

  const handleGenerateNDC = async () => {
    if (!confirm('Generate No Dues Clearance form? This will notify all department heads.')) return
    try {
      const r = await apiService.generateNDC(separation.separationId)
      if (r.success) { setNDC(r.data); onRefresh(); alert('NDC generated successfully') }
    } catch { alert('Failed to generate NDC') }
  }

  const handleUpdateStatus = async () => {
    if (!statusForm.status) return
    await apiService.updateSeparationStatus(separation.separationId, statusForm)
    onRefresh(); setStatusForm({ status: '', remark: '' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{separation.employeeName}</h3>
            <p className="text-sm text-gray-500">{separation.department} · {separation.exitType || 'Resignation'} · <StatusBadge status={separation.resignationStatus} /></p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b overflow-x-auto flex-shrink-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && <DetailsTab separation={separation} statusForm={statusForm} setStatusForm={setStatusForm} onUpdate={handleUpdateStatus} />}
          {activeTab === 'notice'   && <NoticeTab separation={separation} form={noticeForm} setForm={setNoticeForm} onRefresh={onRefresh} />}
          {activeTab === 'exit'     && <ExitTab   separation={separation} form={exitForm}   setForm={setExitForm}   onRefresh={onRefresh} />}
          {activeTab === 'fnf'      && <FnFTab    separation={separation} form={fnfForm}    setForm={setFnfForm}    onRefresh={onRefresh} />}
          {activeTab === 'ndc'      && <NDCTab    separation={separation} ndc={ndc} loading={ndcLoading} onGenerate={handleGenerateNDC} onRefresh={() => { loadNDC(); onRefresh() }} />}
          {activeTab === 'documents'&& <DocumentsTab separation={separation} onRefresh={onRefresh} />}
          {activeTab === 'rating'   && <RatingTab   separation={separation} onRefresh={onRefresh} />}
        </div>
      </div>
    </div>
  )
}

/* ─── Details Tab ────────────────────────────────────────────────────────── */
function DetailsTab({ separation, statusForm, setStatusForm, onUpdate }: any) {
  const fields = [
    ['Separation ID', separation.separationId],
    ['Employee Name', separation.employeeName || '-'],
    ['Employee ID',   separation.employeeId],
    ['Department',    separation.department   || '-'],
    ['Designation',   separation.designation  || '-'],
    ['Exit Type',     separation.exitType     || 'Resignation'],
    ['Resignation Date', separation.resignationDate ? new Date(separation.resignationDate).toLocaleDateString('en-IN') : '-'],
    ['Last Working Date', separation.lastWorkingDate ? new Date(separation.lastWorkingDate).toLocaleDateString('en-IN') : '-'],
    ['Initiated By',  separation.initiatedBy  || 'HR'],
    ['NDC Generated', separation.ndcGenerated ? 'Yes' : 'No']
  ]
  const STATUS_OPTIONS = ['Initiated','Manager Approved','HR Accepted','In Notice Period','Completed','Rejected']

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg text-sm">
        {fields.map(([k, v]) => (
          <div key={k}><span className="font-medium text-gray-600">{k}:</span> <span className="text-gray-900">{v as string}</span></div>
        ))}
      </div>
      <div>
        <p className="font-medium text-gray-700 mb-1 text-sm">Reason</p>
        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{separation.resignationReason || '-'}</p>
      </div>
      <div className="border-t pt-4">
        <p className="font-semibold text-gray-800 mb-3 text-sm">Update Status</p>
        <div className="flex gap-3 flex-wrap">
          <select value={statusForm.status} onChange={e => setStatusForm({ ...statusForm, status: e.target.value })} className="flex-1 min-w-40 px-3 py-2 border rounded-lg text-sm">
            <option value="">Select Status</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={onUpdate} disabled={!statusForm.status} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">Update</button>
        </div>
        <textarea placeholder="Remark (optional)" value={statusForm.remark} onChange={e => setStatusForm({ ...statusForm, remark: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm mt-2 resize-none" />
      </div>
      {separation.statusHistory?.length > 0 && (
        <div className="border-t pt-4">
          <p className="font-semibold text-gray-800 mb-3 text-sm">Status History</p>
          <div className="space-y-2">
            {[...separation.statusHistory].reverse().map((h: any, i: number) => (
              <div key={i} className="bg-blue-50 p-3 rounded-lg text-sm flex justify-between">
                <div>
                  <StatusBadge status={h.status} />
                  <span className="ml-2 text-gray-600">by {h.changedByName}</span>
                  {h.remark && <p className="text-gray-500 mt-1 text-xs">{h.remark}</p>}
                </div>
                <span className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Notice Period Tab ──────────────────────────────────────────────────── */
function NoticeTab({ separation, form, setForm, onRefresh }: any) {
  const np = separation.noticePeriod || {}
  const rem = () => { const d = new Date(np.endDate); const t = new Date(); const diff = Math.ceil((d.getTime() - t.getTime()) / 86400000); return diff > 0 ? diff : 0 }

  const handleUpdate = async () => {
    await apiService.updateNoticePeriod(separation.separationId, form)
    onRefresh()
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg text-sm">
        {[['Notice Days', np.days || '-'], ['Start Date', np.startDate ? new Date(np.startDate).toLocaleDateString('en-IN') : '-'], ['End Date', np.endDate ? new Date(np.endDate).toLocaleDateString('en-IN') : '-'], ['Days Remaining', rem()]].map(([k, v]) => (
          <div key={k as string}><span className="font-medium text-gray-600">{k}:</span> <span className="text-gray-900">{v as string}</span></div>
        ))}
      </div>
      <div className="space-y-3">
        {[['earlyRelease','Early Release Approved'],['absconding','Mark as Absconding'],['handoverCompleted','Handover Completed']].map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer text-sm">
            <input type="checkbox" checked={form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} className="w-4 h-4 rounded accent-blue-600" />
            <span>{label}</span>
          </label>
        ))}
        <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Update Notice Period</button>
      </div>
    </div>
  )
}

/* ─── Exit Interview Tab ─────────────────────────────────────────────────── */
function ExitTab({ separation, form, setForm, onRefresh }: any) {
  const ei = separation.exitInterview || {}
  const handleUpdate = async () => {
    await apiService.updateExitInterview(separation.separationId, form)
    onRefresh()
  }
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg text-sm">
        <span className="font-medium text-gray-600">Current Status: </span><StatusBadge status={ei.status || 'Pending'} />
        {ei.scheduledDate && <span className="ml-3 text-gray-600">Scheduled: {new Date(ei.scheduledDate).toLocaleDateString('en-IN')}</span>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Select</option>
            {['Pending','Scheduled','Completed'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Scheduled Date</label>
          <input type="date" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">HR Remarks</label>
        <textarea value={form.hrRemarks} onChange={e => setForm({ ...form, hrRemarks: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
      </div>
      <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Update Exit Interview</button>
    </div>
  )
}

/* ─── F&F Settlement Tab ─────────────────────────────────────────────────── */
function FnFTab({ separation, form, setForm, onRefresh }: any) {
  const fnf = separation.fnfSettlement || {}
  const total = (form.finalSalary + form.leaveEncashment + form.bonus) - (form.loanDeductions + form.noticeShortfall)
  const handleUpdate = async () => {
    await apiService.updateFnFSettlement(separation.separationId, form)
    onRefresh()
  }
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg text-sm flex gap-6">
        <div><span className="font-medium text-gray-600">Status: </span><StatusBadge status={fnf.status || 'Pending'} /></div>
        <div><span className="font-medium text-gray-600">Total Payable: </span><span className="font-bold text-green-700">₹{(fnf.totalPayable || 0).toLocaleString('en-IN')}</span></div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
          <option value="">Select</option>
          {['Pending','In Process','Completed'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[['finalSalary','Final Salary (₹)'],['leaveEncashment','Leave Encashment (₹)'],['bonus','Bonus (₹)'],['loanDeductions','Loan Deductions (₹)'],['noticeShortfall','Notice Shortfall (₹)']].map(([key, label]) => (
          <div key={key}>
            <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
            <input type="number" min={0} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        ))}
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-blue-800">Computed Total Payable</span>
          <span className="text-xl font-bold text-blue-900">₹{total.toLocaleString('en-IN')}</span>
        </div>
      </div>
      <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Update F&F Settlement</button>
    </div>
  )
}

/* ─── NDC Tab — main clearance view ─────────────────────────────────────── */
function NDCTab({ separation, ndc, loading, onGenerate, onRefresh }: any) {
  if (loading) return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  if (!separation.ndcGenerated || !ndc) {
    return (
      <div className="text-center py-12">
        <ClipboardCheck size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Dues Clearance Not Generated</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          Generate the NDC form after HR formally accepts the separation. All departments will be notified and can fill their respective sections.
        </p>
        <button onClick={onGenerate} className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium flex items-center gap-2 mx-auto">
          <Plus size={16} /> Generate No Dues Clearance
        </button>
      </div>
    )
  }

  const DEPTS = [
    { key: 'itClearance',       label: 'IT & Admin',  icon: Shield },
    { key: 'mediaClearance',    label: 'Media',       icon: FileText },
    { key: 'projectClearance',  label: 'Project',     icon: ClipboardCheck },
    { key: 'accountsClearance', label: 'Accounts',    icon: DollarSign },
    { key: 'hrClearance',       label: 'HR',          icon: Users }
  ]

  return (
    <div className="space-y-6">
      {/* Employee Details */}
      <div className="bg-slate-50 border rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3 text-sm">Employee Details (Auto-Fetched)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {Object.entries(ndc.employeeDetails || {}).map(([k, v]) => (
            <div key={k}>
              <p className="text-xs text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
              <p className="font-medium text-gray-800">{(v as string) || '-'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Status */}
      <div className="flex items-center justify-between bg-white border rounded-lg p-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Overall NDC Status</p>
          <StatusBadge status={ndc.overallStatus || 'In Progress'} />
        </div>
        <div className="flex gap-2">
          {DEPTS.map(d => {
            const st = ndc[d.key]?.status || 'Pending'
            return (
              <div key={d.key} className="text-center">
                <p className="text-xs text-gray-500 mb-1">{d.label}</p>
                {st === 'Approved' ? <CheckCircle size={20} className="text-green-500 mx-auto" /> :
                 st === 'Rejected' ? <X size={20} className="text-red-500 mx-auto" /> :
                 <Clock size={20} className="text-yellow-500 mx-auto" />}
              </div>
            )
          })}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Declaration</p>
            {ndc.employeeDeclaration?.signed ? <CheckCircle size={20} className="text-green-500 mx-auto" /> : <Clock size={20} className="text-yellow-500 mx-auto" />}
          </div>
        </div>
      </div>

      {/* Department Sections */}
      <ITClearanceSection ndc={ndc} separationId={separation.separationId} onRefresh={onRefresh} />
      <MediaClearanceSection ndc={ndc} separationId={separation.separationId} onRefresh={onRefresh} />
      <ProjectClearanceSection ndc={ndc} separationId={separation.separationId} onRefresh={onRefresh} />
      <AccountsClearanceSection ndc={ndc} separationId={separation.separationId} onRefresh={onRefresh} />
      <HRClearanceSection ndc={ndc} separationId={separation.separationId} onRefresh={onRefresh} />

      {/* Employee Declaration */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-800 mb-2 text-sm">Employee Declaration</h4>
        <p className="text-sm text-amber-700 italic mb-3">"{ndc.employeeDeclaration?.text}"</p>
        <div className="flex items-center gap-3">
          {ndc.employeeDeclaration?.signed
            ? <span className="flex items-center gap-1 text-green-700 text-sm font-medium"><CheckCircle size={16} />Signed on {ndc.employeeDeclaration.signedAt ? new Date(ndc.employeeDeclaration.signedAt).toLocaleDateString('en-IN') : ''}</span>
            : <span className="text-sm text-amber-600">Pending employee signature (from Employee Portal)</span>}
        </div>
      </div>

      {/* Final HR Approval */}
      <FinalHRApprovalSection ndc={ndc} separationId={separation.separationId} onRefresh={onRefresh} />
    </div>
  )
}

/* ─── Collapsible dept section wrapper ──────────────────────────────────── */
function DeptSection({ title, status, children }: { title: string; status: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-800">
        <span>{title}</span>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <ChevronRight size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
        </div>
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  )
}

/* ─── IT Clearance Section ───────────────────────────────────────────────── */
function ITClearanceSection({ ndc, separationId, onRefresh }: any) {
  const it = ndc.itClearance || {}
  const [assets, setAssets]   = useState(it.assets || {})
  const [access, setAccess]   = useState(it.systemAccess || {})
  const [remarks, setRemarks] = useState(it.remarks || '')
  const [status, setStatus]   = useState('')
  const [saving, setSaving]   = useState(false)

  const ASSET_KEYS = ['laptop','mouse','charger','mobileSim','otherIT','idCard','accessCard','officeKeys','uniform','visitorCard','otherAssets']
  const ASSET_LABELS: Record<string,string> = { laptop:'Laptop', mouse:'Mouse', charger:'Charger', mobileSim:'Mobile/SIM', otherIT:'Other IT Assets', idCard:'ID Card', accessCard:'Access Card', officeKeys:'Office Keys', uniform:'Uniform', visitorCard:'Visitor Card', otherAssets:'Other Assets' }
  const ACCESS_KEYS = ['emailDisabled','hrmsAccessDisabled','googleWorkspaceDisabled','softwareLicensesRevoked','vpnAccessDisabled']
  const ACCESS_LABELS: Record<string,string> = { emailDisabled:'Email ID Disabled', hrmsAccessDisabled:'HRMS Access Disabled', googleWorkspaceDisabled:'Google Workspace / Microsoft 365 Disabled', softwareLicensesRevoked:'Software Licenses Revoked', vpnAccessDisabled:'VPN Access Disabled' }

  const handleSave = async () => {
    setSaving(true)
    try { await apiService.updateITClearance(separationId, { assets, systemAccess: access, remarks, status: status || undefined }); onRefresh() }
    catch { alert('Save failed') } finally { setSaving(false) }
  }

  return (
    <DeptSection title="1. IT Department & Administration" status={it.status || 'Pending'}>
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Assets Issued</p>
        <div className="grid grid-cols-2 gap-2">
          {ASSET_KEYS.map(k => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={assets[k]?.returned || false} onChange={e => setAssets({ ...assets, [k]: { ...assets[k], returned: e.target.checked } })} className="w-4 h-4 accent-blue-600" />
              <span>{ASSET_LABELS[k]}</span>
              {assets[k]?.returned && <span className="text-xs text-green-600 font-medium">✓ Returned</span>}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">System Access Revocation</p>
        <div className="space-y-2">
          {ACCESS_KEYS.map(k => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={access[k] || false} onChange={e => setAccess({ ...access, [k]: e.target.checked })} className="w-4 h-4 accent-blue-600" />
              <span>{ACCESS_LABELS[k]}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">IT Remarks</label>
        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
      </div>
      <div className="flex items-center gap-3">
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Approve / Reject</option>
          <option value="Approved">✓ Approve</option>
          <option value="Rejected">✗ Reject</option>
        </select>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        {it.approvedByName && <span className="text-xs text-gray-500">Last updated by {it.approvedByName}</span>}
      </div>
    </DeptSection>
  )
}

/* ─── Media Clearance Section ────────────────────────────────────────────── */
function MediaClearanceSection({ ndc, separationId, onRefresh }: any) {
  const media = ndc.mediaClearance || {}
  const [equipment, setEquipment]     = useState(media.equipment || {})
  const [digital, setDigital]         = useState(media.digitalAssets || {})
  const [remarks, setRemarks]         = useState(media.remarks || '')
  const [status, setStatus]           = useState('')
  const [saving, setSaving]           = useState(false)

  const EQ_KEYS = ['camera','tripod','memoryCard','brandingKit']
  const EQ_LABELS: Record<string,string> = { camera:'Camera', tripod:'Tripod', memoryCard:'Memory Card', brandingKit:'Branding Kit' }
  const DIG_KEYS = ['creativeFilesSubmitted','projectFilesUploaded','socialMediaCredentialsHandedOver']
  const DIG_LABELS: Record<string,string> = { creativeFilesSubmitted:'Creative Files Submitted', projectFilesUploaded:'Project Files Uploaded', socialMediaCredentialsHandedOver:'Social Media Credentials Handed Over' }

  const handleSave = async () => {
    setSaving(true)
    try { await apiService.updateMediaClearance(separationId, { equipment, digitalAssets: digital, remarks, status: status || undefined }); onRefresh() }
    catch { alert('Save failed') } finally { setSaving(false) }
  }

  return (
    <DeptSection title="3. Media Department" status={media.status || 'Pending'}>
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Equipment Issued</p>
        <div className="grid grid-cols-2 gap-2">
          {EQ_KEYS.map(k => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={equipment[k]?.returned || false} onChange={e => setEquipment({ ...equipment, [k]: { ...equipment[k], returned: e.target.checked } })} className="w-4 h-4 accent-blue-600" />
              <span>{EQ_LABELS[k]}</span>
              {equipment[k]?.returned && <span className="text-xs text-green-600 font-medium">✓ Returned</span>}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Digital Assets</p>
        <div className="space-y-2">
          {DIG_KEYS.map(k => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={digital[k] || false} onChange={e => setDigital({ ...digital, [k]: e.target.checked })} className="w-4 h-4 accent-blue-600" />
              <span>{DIG_LABELS[k]}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Media Remarks</label>
        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
      </div>
      <div className="flex items-center gap-3">
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Approve / Reject</option>
          <option value="Approved">✓ Approve</option>
          <option value="Rejected">✗ Reject</option>
        </select>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        {media.approvedByName && <span className="text-xs text-gray-500">Last updated by {media.approvedByName}</span>}
      </div>
    </DeptSection>
  )
}

/* ─── Project Clearance Section ──────────────────────────────────────────── */
function ProjectClearanceSection({ ndc, separationId, onRefresh }: any) {
  const proj = ndc.projectClearance || {}
  const ts = proj.tasksSummary || {}
  const [docs, setDocs]           = useState(proj.documents || {})
  const [remarks, setRemarks]     = useState(proj.remarks || '')
  const [status, setStatus]       = useState('')
  const [saving, setSaving]       = useState(false)
  const DOC_KEYS = ['clientDocumentsSubmitted','reportsSubmitted','handoverCompleted']
  const DOC_LABELS: Record<string,string> = { clientDocumentsSubmitted:'Client Documents Submitted', reportsSubmitted:'Reports Submitted', handoverCompleted:'Handover Completed' }

  const handleSave = async () => {
    setSaving(true)
    try { await apiService.updateProjectClearance(separationId, { documents: docs, remarks, status: status || undefined }); onRefresh() }
    catch { alert('Save failed') } finally { setSaving(false) }
  }

  return (
    <DeptSection title="4. Project Department" status={proj.status || 'Pending'}>
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Tasks Summary (Auto-Fetched)</p>
        <div className="grid grid-cols-4 gap-3">
          {[['Total Assigned', ts.totalAssigned],['Completed', ts.completed],['Pending', ts.pending],['Delayed', ts.delayed]].map(([l, v]) => (
            <div key={l as string} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{v || 0}</p>
              <p className="text-xs text-gray-500">{l}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Documents & Handover</p>
        <div className="space-y-2">
          {DOC_KEYS.map(k => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={docs[k] || false} onChange={e => setDocs({ ...docs, [k]: e.target.checked })} className="w-4 h-4 accent-blue-600" />
              <span>{DOC_LABELS[k]}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Project Head Remarks</label>
        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
      </div>
      <div className="flex items-center gap-3">
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Approve / Reject</option>
          <option value="Approved">✓ Approve</option>
          <option value="Rejected">✗ Reject</option>
        </select>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </DeptSection>
  )
}

/* ─── Accounts Clearance Section ─────────────────────────────────────────── */
function AccountsClearanceSection({ ndc, separationId, onRefresh }: any) {
  const acc = ndc.accountsClearance || {}
  const fs  = acc.financialSummary || {}
  const [fin, setFin]         = useState({ salaryPayable: fs.salaryPayable || 0, expenseClaimsPending: fs.expenseClaimsPending || 0, advanceOutstanding: fs.advanceOutstanding || 0, loanRecovery: fs.loanRecovery || 0, assetRecovery: fs.assetRecovery || 0, fullFinalAmount: fs.fullFinalAmount || 0 })
  const [remarks, setRemarks] = useState(acc.remarks || '')
  const [status, setStatus]   = useState('')
  const [saving, setSaving]   = useState(false)

  const computeFF = (f: typeof fin) => (f.salaryPayable + f.expenseClaimsPending) - (f.advanceOutstanding + f.loanRecovery + f.assetRecovery)

  const updateFin = (key: string, val: number) => {
    const updated = { ...fin, [key]: val }
    updated.fullFinalAmount = computeFF(updated)
    setFin(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    try { await apiService.updateAccountsClearance(separationId, { financialSummary: fin, remarks, status: status || undefined }); onRefresh() }
    catch { alert('Save failed') } finally { setSaving(false) }
  }

  const FIN_ROWS = [
    { key: 'salaryPayable',        label: 'Salary Payable',           auto: true },
    { key: 'expenseClaimsPending', label: 'Expense Claims Pending',   auto: true },
    { key: 'advanceOutstanding',   label: 'Advance Outstanding',      auto: false },
    { key: 'loanRecovery',         label: 'Loan Recovery',            auto: false },
    { key: 'assetRecovery',        label: 'Asset Recovery',           auto: false }
  ]

  return (
    <DeptSection title="5. Accounts Department" status={acc.status || 'Pending'}>
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Financial Summary</p>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Particular</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Amount (₹)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {FIN_ROWS.map(row => (
                <tr key={row.key}>
                  <td className="px-4 py-2 font-medium text-gray-700">{row.label}</td>
                  <td className="px-4 py-2">
                    <input type="number" min={0} value={(fin as any)[row.key]} onChange={e => updateFin(row.key, parseFloat(e.target.value) || 0)} className="w-32 px-2 py-1 border rounded text-sm" />
                  </td>
                  <td className="px-4 py-2">{row.auto ? <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Auto-fetched</span> : <span className="text-xs text-gray-400">Manual</span>}</td>
                </tr>
              ))}
              <tr className="bg-green-50 font-bold">
                <td className="px-4 py-2 text-green-800">Full & Final Amount</td>
                <td className="px-4 py-2 text-green-800 text-base">₹{fin.fullFinalAmount.toLocaleString('en-IN')}</td>
                <td className="px-4 py-2"><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Computed</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Accounts Remarks</label>
        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
      </div>
      <div className="flex items-center gap-3">
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Approve / Reject</option>
          <option value="Approved">✓ Approve</option>
          <option value="Rejected">✗ Reject</option>
        </select>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </DeptSection>
  )
}

/* ─── HR Clearance Section ───────────────────────────────────────────────── */
function HRClearanceSection({ ndc, separationId, onRefresh }: any) {
  const hr = ndc.hrClearance || {}
  const [checklist, setChecklist] = useState(hr.checklist || {})
  const [remarks, setRemarks]     = useState(hr.remarks || '')
  const [status, setStatus]       = useState('')
  const [saving, setSaving]       = useState(false)

  const CL_KEYS = ['exitInterviewDone','resignationAccepted','attendanceUpdated','leaveBalanceVerified','noticePeriodCompleted','experienceLetterGenerated','relievingLetterGenerated']
  const CL_LABELS: Record<string,string> = {
    exitInterviewDone: 'Exit Interview Completed', resignationAccepted: 'Resignation Accepted',
    attendanceUpdated: 'Attendance Updated', leaveBalanceVerified: 'Leave Balance Verified',
    noticePeriodCompleted: 'Notice Period Completed', experienceLetterGenerated: 'Experience Letter Generated',
    relievingLetterGenerated: 'Relieving Letter Generated'
  }

  const handleSave = async () => {
    setSaving(true)
    try { await apiService.updateHRClearance(separationId, { checklist, remarks, status: status || undefined }); onRefresh() }
    catch { alert('Save failed') } finally { setSaving(false) }
  }

  return (
    <DeptSection title="6. HR Department" status={hr.status || 'Pending'}>
      {hr.leaveBalance !== undefined && (
        <div className="bg-blue-50 p-3 rounded-lg text-sm">
          <span className="font-medium text-blue-700">Leave Balance (Auto-Fetched): </span>
          <span className="text-blue-900 font-bold">{hr.leaveBalance} days</span>
        </div>
      )}
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">HR Checklist</p>
        <div className="space-y-2">
          {CL_KEYS.map(k => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={checklist[k] || false} onChange={e => setChecklist({ ...checklist, [k]: e.target.checked })} className="w-4 h-4 accent-blue-600" />
              <span>{CL_LABELS[k]}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">HR Remarks</label>
        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
      </div>
      <div className="flex items-center gap-3">
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Approve / Reject</option>
          <option value="Approved">✓ Approve</option>
          <option value="Rejected">✗ Reject</option>
        </select>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </DeptSection>
  )
}

/* ─── Final HR Approval Section ──────────────────────────────────────────── */
function FinalHRApprovalSection({ ndc, separationId, onRefresh }: any) {
  const fc = ndc.finalClearance || {}
  const [status, setStatus]   = useState(fc.status === 'Cleared' || fc.status === 'Not Cleared' ? fc.status : '')
  const [reason, setReason]   = useState(fc.reason || '')
  const [saving, setSaving]   = useState(false)

  const DEPTS = [
    ['IT',       ndc.itClearance?.status],
    ['Admin',    ndc.itClearance?.status],
    ['Media',    ndc.mediaClearance?.status],
    ['Project',  ndc.projectClearance?.status],
    ['Accounts', ndc.accountsClearance?.status],
    ['HR',       ndc.hrClearance?.status]
  ]

  const handleApprove = async () => {
    if (!status) { alert('Select clearance status'); return }
    setSaving(true)
    try { await apiService.updateFinalNDCApproval(separationId, { status, reason }); onRefresh() }
    catch { alert('Save failed') } finally { setSaving(false) }
  }

  return (
    <div className="border-2 border-blue-200 rounded-lg p-5 bg-blue-50">
      <h4 className="font-bold text-blue-800 mb-4">Final HR Approval</h4>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
        {DEPTS.map(([dept, st]) => (
          <div key={dept as string} className="text-center bg-white rounded-lg p-3 border">
            <p className="text-xs font-medium text-gray-600 mb-1">{dept}</p>
            {st === 'Approved' ? <CheckCircle size={20} className="text-green-500 mx-auto" /> :
             st === 'Rejected' ? <X size={20} className="text-red-500 mx-auto" /> :
             <Clock size={20} className="text-yellow-400 mx-auto" />}
          </div>
        ))}
      </div>
      {fc.status === 'Cleared' || fc.status === 'Not Cleared' ? (
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex gap-4 text-sm">
            <div><span className="font-medium text-gray-600">Final Status: </span><StatusBadge status={fc.status} /></div>
            {fc.approvedByName && <div><span className="font-medium text-gray-600">Approved by: </span>{fc.approvedByName}</div>}
            {fc.approvedAt && <div><span className="font-medium text-gray-600">Date: </span>{new Date(fc.approvedAt).toLocaleDateString('en-IN')}</div>}
          </div>
          {fc.reason && <p className="text-sm text-gray-600 mt-2">{fc.reason}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-3">
            <button onClick={() => setStatus('Cleared')} className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${status === 'Cleared' ? 'bg-green-600 text-white border-green-600' : 'border-green-300 text-green-700 hover:bg-green-50'}`}>☑ Cleared</button>
            <button onClick={() => setStatus('Not Cleared')} className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${status === 'Not Cleared' ? 'bg-red-600 text-white border-red-600' : 'border-red-300 text-red-700 hover:bg-red-50'}`}>☒ Not Cleared</button>
          </div>
          {status === 'Not Cleared' && (
            <textarea placeholder="Reason for not clearing..." value={reason} onChange={e => setReason(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
          )}
          <button onClick={handleApprove} disabled={saving || !status} className="w-full py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
            {saving ? 'Saving...' : 'Submit Final Clearance'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Documents Tab ──────────────────────────────────────────────────────── */
function DocumentsTab({ separation, onRefresh }: any) {
  const docs = separation.exitDocuments || {}
  const [form, setForm] = useState({ experienceLetter: docs.experienceLetter || false, relievingLetter: docs.relievingLetter || false, noDuesCertificate: docs.noDuesCertificate || false, salaryCertificate: docs.salaryCertificate || false })
  const [saving, setSaving] = useState(false)

  const handleUpdate = async () => {
    setSaving(true)
    try { await apiService.updateExitDocuments(separation.separationId, form); onRefresh() }
    catch { alert('Failed to update') } finally { setSaving(false) }
  }

  const DOC_LIST = [
    { key: 'experienceLetter',  label: 'Experience Letter',    desc: 'Certificate of employment duration and role' },
    { key: 'relievingLetter',   label: 'Relieving Letter',     desc: 'Official relieving from duties' },
    { key: 'noDuesCertificate', label: 'No Dues Certificate',  desc: 'Confirmation of all clearances' },
    { key: 'salaryCertificate', label: 'Salary Certificate',   desc: 'Salary details certificate' }
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Mark documents as issued. Upload functionality can be integrated with file storage.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOC_LIST.map(d => (
          <div key={d.key} className={`border-2 rounded-lg p-4 transition-all ${(form as any)[d.key] ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-800 text-sm">{d.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{d.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-3">
                <input type="checkbox" checked={(form as any)[d.key]} onChange={e => setForm({ ...form, [d.key]: e.target.checked })} className="sr-only peer" />
                <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
              </label>
            </div>
            {(form as any)[d.key] && <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1"><CheckCircle size={12} />Issued</p>}
          </div>
        ))}
      </div>
      <button onClick={handleUpdate} disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Update Documents'}</button>
    </div>
  )
}

/* ─── Final Rating Tab ───────────────────────────────────────────────────── */
function RatingTab({ separation, onRefresh }: any) {
  const fr = separation.finalRating || {}
  const [rating, setRating]   = useState(fr.rating || 0)
  const [feedback, setFeedback] = useState(fr.feedback || '')
  const [saving, setSaving]   = useState(false)

  const handleSubmit = async () => {
    if (!rating) { alert('Select a rating'); return }
    setSaving(true)
    try { await apiService.updateFinalRating(separation.separationId, { rating, feedback }); onRefresh() }
    catch { alert('Failed') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      {fr.rating > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg text-sm flex gap-4">
          <div><span className="font-medium text-gray-600">Current Rating: </span><span className="text-yellow-500 font-bold text-lg">{'★'.repeat(fr.rating)}{'☆'.repeat(5 - fr.rating)}</span> {fr.rating}/5</div>
          {fr.ratedByName && <div><span className="font-medium text-gray-600">Rated by: </span>{fr.ratedByName}</div>}
        </div>
      )}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Final Rating (1–5)</label>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(n)} className={`w-12 h-12 rounded-full text-xl font-bold border-2 transition-all ${rating >= n ? 'bg-yellow-400 border-yellow-400 text-white' : 'border-gray-300 text-gray-400 hover:border-yellow-300'}`}>★</button>
          ))}
          {rating > 0 && <span className="self-center text-sm text-gray-600 ml-2">{rating}/5</span>}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Feedback</label>
        <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" placeholder="Optional feedback about the departing employee..." />
      </div>
      <button onClick={handleSubmit} disabled={saving || !rating} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">{saving ? 'Submitting...' : 'Submit Rating'}</button>
    </div>
  )
}
