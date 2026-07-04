import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { grievanceAPI } from '../services/api';
import {
  MessageSquare, Plus, Clock, CheckCircle, AlertCircle, Users, Eye,
  UserX, X, Info, Paperclip, Upload, Ticket, Calendar, ChevronDown,
  FileText, Download, Hash
} from 'lucide-react';
import io from 'socket.io-client';

const GRIEVANCE_CATEGORIES = [
  'HR & Employment',
  'Salary & Payroll',
  'Workplace & Administration',
  'IT & System Support',
  'Project & Work Allocation',
  'Manager / Supervisor Concern',
  'Harassment & Misconduct',
  'Health & Safety',
  'Training & Development',
  'Asset & Equipment',
  'Policy & Compliance',
  'Suggestion / Feedback',
  'Other',
];

const PRIORITY_OPTIONS = [
  { value: 'Low',      color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'Medium',   color: 'bg-amber-50   text-amber-700   border-amber-200'   },
  { value: 'High',     color: 'bg-orange-50  text-orange-700  border-orange-200'  },
  { value: 'Critical', color: 'bg-red-50     text-red-700     border-red-200'     },
];

const STATUS_COLORS = {
  'Open':         'bg-amber-50   text-amber-700',
  'Under Review': 'bg-blue-50    text-blue-700',
  'In Progress':  'bg-violet-50  text-violet-700',
  'Resolved':     'bg-emerald-50 text-emerald-700',
  'Closed':       'bg-slate-100  text-slate-600',
  'Rejected':     'bg-red-50     text-red-600',
  'submitted':    'bg-amber-50   text-amber-700',
  'in review':    'bg-blue-50    text-blue-700',
  'resolved':     'bg-emerald-50 text-emerald-700',
  'closed':       'bg-slate-100  text-slate-600',
};

const inputCls  = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white';
const labelCls  = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

export default function Grievances() {
  const { user } = useAuth();

  // ── data state ──────────────────────────────────────────────────────────────
  const [grievances,            setGrievances]            = useState([]);
  const [assignedGrievances,    setAssignedGrievances]    = useState([]);
  const [reportingManagers,     setReportingManagers]     = useState({ immediateManager: null, nextLevelManager: null });
  const [organizationEmployees, setOrganizationEmployees] = useState([]);
  const [loading,               setLoading]               = useState(true);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [showForm,         setShowForm]         = useState(false);
  const [activeTab,        setActiveTab]        = useState('my-grievances');
  const [selectedGrievance,setSelectedGrievance]= useState(null);
  const [showDetailModal,  setShowDetailModal]  = useState(false);
  const [actionRemark,     setActionRemark]     = useState('');
  const [grievanceType,    setGrievanceType]    = useState('general');
  const [submitting,       setSubmitting]       = useState(false);
  const [uploadingFile,    setUploadingFile]    = useState(false);
  const [uploadedFiles,    setUploadedFiles]    = useState([]);   // [{url,fileName,size}]
  const fileInputRef = useRef(null);

  // ── form state ──────────────────────────────────────────────────────────────
  const defaultForm = {
    subject: '', category: '', priority: 'Medium', description: '',
    dateOfGrievance: new Date().toISOString().split('T')[0],
    complaintAgainstEmployeeId: '',
    _empSearch: '',
  };
  const [formData, setFormData] = useState(defaultForm);

  // ── auto-fill from user profile ─────────────────────────────────────────────
  const emp = user?.employee || user || {};
  const employeeName      = emp.fullName  || emp.name  || user?.name  || '—';
  const employeeId        = emp.employeeId || user?.employeeId || '—';
  const department        = emp.department  || '—';
  const designation       = emp.designation || '—';
  const reportingManager  = reportingManagers.immediateManager?.fullName || '—';

  // ── lifecycle ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchGrievances();
    fetchAssignedGrievances();
    fetchReportingManagers();
    fetchOrganizationEmployees();

    const socket = io(import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4001');
    socket.on('connect', () => socket.emit('join-employee-room', user?.userId));
    socket.on('grievance-status-update', () => { fetchGrievances(); fetchAssignedGrievances(); });
    socket.on('grievance-assigned',      () => fetchAssignedGrievances());
    socket.on('grievance-escalated',     () => fetchAssignedGrievances());
    return () => socket.disconnect();
  }, [user]);

  // ── fetch helpers ────────────────────────────────────────────────────────────
  const fetchGrievances            = async () => { try { const r = await grievanceAPI.getMyGrievances();         setGrievances(r.data.data || []);        } catch {} finally { setLoading(false); } };
  const fetchAssignedGrievances    = async () => { try { const r = await grievanceAPI.getAssignedGrievances();   setAssignedGrievances(r.data.data || []); } catch {} };
  const fetchReportingManagers     = async () => { try { const r = await grievanceAPI.getReportingManagers();    if (r.data.success) setReportingManagers(r.data.data); } catch {} };
  const fetchOrganizationEmployees = async () => { try { const r = await grievanceAPI.getOrganizationEmployees(); if (r.data.success) setOrganizationEmployees(r.data.data || []); } catch {} };

  // ── file upload ──────────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // We upload after grievance is created; for now just stage locally
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedFiles(prev => [...prev, { name: file.name, size: file.size, file, localUrl: reader.result }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeFile = (idx) => setUploadedFiles(prev => prev.filter((_, i) => i !== idx));

  const uploadFilesForGrievance = async (grievanceId) => {
    const urls = [];
    for (const f of uploadedFiles) {
      if (f.url) { urls.push(f); continue; }
      try {
        const fd = new FormData();
        fd.append('file', f.file);
        const r = await grievanceAPI.uploadDocument(grievanceId, fd);
        if (r.data.success) urls.push({ url: r.data.data.url, fileName: f.name, size: f.size });
      } catch (err) { console.error('File upload failed:', err); }
    }
    return urls;
  };

  // ── form submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (grievanceType === 'complaint' && !formData.complaintAgainstEmployeeId) {
      alert('Please select an employee to file a complaint against'); return;
    }
    setSubmitting(true);
    try {
      const payload = {
        subject:           formData.subject,
        title:             formData.subject,
        category:          formData.category,
        priority:          formData.priority,
        description:       formData.description,
        dateOfGrievance:   formData.dateOfGrievance,
        attachments:       [],
      };
      if (grievanceType === 'complaint') payload.complaintAgainstEmployeeId = formData.complaintAgainstEmployeeId;

      const res = await grievanceAPI.submitGrievance(payload);
      const newGrievanceId = res.data.data?.grievanceId;

      // Upload documents if any
      if (uploadedFiles.length > 0 && newGrievanceId) {
        setUploadingFile(true);
        await uploadFilesForGrievance(newGrievanceId);
        setUploadingFile(false);
      }

      alert(`Grievance submitted successfully!\nTicket No: ${res.data.data?.ticketNo || newGrievanceId}`);
      setShowForm(false);
      setGrievanceType('general');
      setFormData(defaultForm);
      setUploadedFiles([]);
      fetchGrievances();
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting grievance');
    } finally {
      setSubmitting(false);
    }
  };

  // ── status update (manager side) ─────────────────────────────────────────────
  const handleStatusUpdate = async (grievanceId, status) => {
    try {
      await grievanceAPI.updateGrievanceStatus(grievanceId, { status, remark: actionRemark });
      alert(`Grievance marked as "${status}" successfully`);
      setShowDetailModal(false);
      setActionRemark('');
      fetchAssignedGrievances();
    } catch { alert('Error updating grievance status'); }
  };

  // ── helpers ──────────────────────────────────────────────────────────────────
  const openDetail = (g) => { setSelectedGrievance(g); setShowDetailModal(true); };
  const getStatusColor   = (s) => STATUS_COLORS[s] || STATUS_COLORS[s?.toLowerCase()] || 'bg-slate-100 text-slate-600';
  const getPriorityColor = (p) => {
    const map = { Low: 'bg-emerald-50 text-emerald-700', Medium: 'bg-amber-50 text-amber-700', High: 'bg-orange-50 text-orange-700', Critical: 'bg-red-50 text-red-700' };
    return map[p] || map[p?.charAt(0).toUpperCase() + p?.slice(1).toLowerCase()] || 'bg-slate-100 text-slate-600';
  };
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const currentList = activeTab === 'my-grievances' ? grievances : assignedGrievances;
  const counts = {
    total:      currentList.length,
    open:       currentList.filter(g => ['open','submitted'].includes(g.status?.toLowerCase())).length,
    inProgress: currentList.filter(g => ['in progress','under review','in review'].includes(g.status?.toLowerCase())).length,
    resolved:   currentList.filter(g => ['resolved','closed'].includes(g.status?.toLowerCase())).length,
  };

  return (
    <div className="p-8 space-y-6 animate-fadeIn">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Grievances</h1>
          <p className="text-slate-500 text-sm mt-0.5">Submit and track workplace grievances</p>
        </div>
        {activeTab === 'my-grievances' && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/25">
            {showForm ? <><X size={15}/> Cancel</> : <><Plus size={15}/> Submit Grievance</>}
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-slate-200 gap-1">
        {[
          { key: 'my-grievances',       icon: MessageSquare, label: 'My Grievances' },
          { key: 'assigned-grievances', icon: Users,         label: 'Assigned to Me', badge: assignedGrievances.length },
        ].map(({ key, icon: Icon, label, badge }) => (
          <button key={key} onClick={() => { setActiveTab(key); setShowForm(false); setFormData(defaultForm); setUploadedFiles([]); setGrievanceType('general'); }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${activeTab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <Icon size={15}/> {label}
            {badge > 0 && <span className="px-1.5 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">{badge}</span>}
          </button>
        ))}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: MessageSquare, bg: 'bg-indigo-50',  color: 'text-indigo-600',  accent: 'border-l-indigo-500',  label: 'Total',       val: counts.total },
          { icon: Clock,         bg: 'bg-amber-50',   color: 'text-amber-600',   accent: 'border-l-amber-500',   label: 'Open',        val: counts.open },
          { icon: AlertCircle,   bg: 'bg-blue-50',    color: 'text-blue-600',    accent: 'border-l-blue-500',    label: 'In Progress', val: counts.inProgress },
          { icon: CheckCircle,   bg: 'bg-emerald-50', color: 'text-emerald-600', accent: 'border-l-emerald-500', label: 'Resolved',    val: counts.resolved },
        ].map(({ icon: Icon, bg, color, accent, label, val }) => (
          <div key={label} className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${accent} shadow-sm p-4 flex items-center gap-3`}>
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={16} className={color}/>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-slate-900 leading-none mt-0.5">{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Grievance Form — only on My Grievances tab ── */}
      {showForm && activeTab === 'my-grievances' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-slideUp space-y-6">
          <h2 className="font-bold text-slate-900 text-lg">Submit New Grievance</h2>

          {/* Type selector */}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { setGrievanceType('general'); setFormData(p => ({ ...p, complaintAgainstEmployeeId: '' })); }}
              className={`p-4 rounded-xl border-2 transition-all text-left ${grievanceType === 'general' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare size={16} className={grievanceType === 'general' ? 'text-indigo-600' : 'text-slate-400'}/>
                <span className={`font-semibold text-sm ${grievanceType === 'general' ? 'text-indigo-700' : 'text-slate-700'}`}>General Grievance</span>
              </div>
              <p className="text-xs text-slate-500">Assigned to your reporting manager</p>
            </button>
            <button type="button" onClick={() => { setGrievanceType('complaint'); setFormData(p => ({ ...p })); fetchOrganizationEmployees(); }}
              className={`p-4 rounded-xl border-2 transition-all text-left ${grievanceType === 'complaint' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="flex items-center gap-2 mb-1">
                <UserX size={16} className={grievanceType === 'complaint' ? 'text-red-600' : 'text-slate-400'}/>
                <span className={`font-semibold text-sm ${grievanceType === 'complaint' ? 'text-red-700' : 'text-slate-700'}`}>Complaint Against Employee</span>
              </div>
              <p className="text-xs text-slate-500">Assigned to employee's manager</p>
            </button>
          </div>

          {/* Auto-filled Employee Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Employee Details (Auto-filled)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {[
                ['Employee Name',      employeeName],
                ['Employee ID',        employeeId],
                ['Department',         department],
                ['Designation',        designation],
                ['Reporting Manager',  reportingManager],
              ].map(([lbl, val]) => (
                <div key={lbl}>
                  <p className="text-xs text-slate-400 font-medium">{lbl}</p>
                  <p className="font-semibold text-slate-800 truncate">{val}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── Complaint Against Employee — shown immediately after type selector ── */}
            {grievanceType === 'complaint' && (
              <div>
                <label className={labelCls}>Select Employee to File Complaint Against *</label>
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  {/* Search box */}
                  <div className="p-2 border-b border-red-100 bg-red-50">
                    <input
                      type="text"
                      placeholder="Search employee name or designation…"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                      onChange={e => {
                        const q = e.target.value.toLowerCase();
                        setFormData(p => ({ ...p, _empSearch: q }));
                      }}
                    />
                  </div>
                  <div className="p-3 max-h-64 overflow-y-auto bg-white">
                    {organizationEmployees.length === 0 ? (
                      <div className="flex flex-col items-center py-8 gap-2 text-slate-400">
                        <UserX size={28}/>
                        <p className="text-sm font-medium">No employees found in your organisation</p>
                        <p className="text-xs text-slate-400">Please contact HR to set up the organisation chart</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(organizationEmployees.filter(e => {
                          const q = (formData._empSearch || '').toLowerCase();
                          return !q ||
                            (e.fullName || '').toLowerCase().includes(q) ||
                            (e.designation || '').toLowerCase().includes(q) ||
                            (e.department || '').toLowerCase().includes(q);
                        })).map(emp => (
                          <div
                            key={emp.employeeId}
                            onClick={() => setFormData(p => ({ ...p, complaintAgainstEmployeeId: emp.employeeId }))}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                              ${formData.complaintAgainstEmployeeId === emp.employeeId
                                ? 'border-red-500 bg-red-50 shadow-sm'
                                : 'border-slate-100 bg-slate-50 hover:border-red-300 hover:bg-red-50/40'}`}
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                              {(emp.fullName || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">{emp.fullName}</p>
                              <p className="text-xs text-slate-500 truncate">{emp.designation}{emp.department ? ` · ${emp.department}` : ''}</p>
                            </div>
                            {formData.complaintAgainstEmployeeId === emp.employeeId && (
                              <CheckCircle size={18} className="text-red-500 flex-shrink-0"/>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.complaintAgainstEmployeeId && organizationEmployees.find(e => e.employeeId === formData.complaintAgainstEmployeeId) && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-t border-red-200">
                      <CheckCircle size={14} className="text-red-500"/>
                      <span className="text-xs font-semibold text-red-700">
                        Selected: {organizationEmployees.find(e => e.employeeId === formData.complaintAgainstEmployeeId)?.fullName}
                      </span>
                      <button type="button" onClick={() => setFormData(p => ({ ...p, complaintAgainstEmployeeId: '' }))}
                        className="ml-auto text-red-400 hover:text-red-600 transition-colors"><X size={14}/></button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── General grievance info ── */}
            {grievanceType === 'general' && (
              <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                <Info size={16} className="text-indigo-600 flex-shrink-0 mt-0.5"/>
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Auto-assigned to your reporting manager</p>
                  <p className="text-xs text-indigo-700 mt-0.5">Escalates automatically if no action taken within 2 days.</p>
                </div>
              </div>
            )}

            {/* Category + Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Grievance Category *</label>
                <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} className={inputCls} required>
                  <option value="">Select category…</option>
                  {GRIEVANCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Subject *</label>
                <input type="text" value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                  className={inputCls} placeholder="Brief subject of grievance" required />
              </div>
            </div>

            {/* Date + Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Date of Grievance *</label>
                <input type="date" value={formData.dateOfGrievance} onChange={e => setFormData(p => ({ ...p, dateOfGrievance: e.target.value }))}
                  className={inputCls} max={new Date().toISOString().split('T')[0]} required />
              </div>
              <div>
                <label className={labelCls}>Priority *</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITY_OPTIONS.map(({ value, color }) => (
                    <button key={value} type="button" onClick={() => setFormData(p => ({ ...p, priority: value }))}
                      className={`py-2 text-xs font-semibold rounded-xl border-2 transition-all ${formData.priority === value ? color + ' border-current' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Description *</label>
              <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                className={`${inputCls} resize-none`} rows={4} placeholder="Describe your grievance in detail…" required />
            </div>

            {/* File Upload */}
            <div>
              <label className={labelCls}>Upload Supporting Documents (Optional)</label>
              <div onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all">
                <Upload size={20} className="text-slate-400"/>
                <p className="text-sm text-slate-500">Click to upload <span className="text-indigo-600 font-semibold">PDF, JPG, PNG</span></p>
                <p className="text-xs text-slate-400">Max 10 MB per file</p>
              </div>
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange}/>
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                      <FileText size={14} className="text-indigo-500 flex-shrink-0"/>
                      <span className="text-sm text-slate-700 flex-1 truncate">{f.name}</span>
                      <span className="text-xs text-slate-400">{(f.size / 1024).toFixed(1)} KB</span>
                      <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={14}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setFormData(defaultForm); setUploadedFiles([]); }}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting || uploadingFile}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Submitting…</> : 'Submit Grievance'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Grievance List Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"/>
              <span className="text-sm">Loading…</span>
            </div>
          ) : currentList.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <MessageSquare size={36} className="text-slate-200"/>
              <p className="text-sm text-slate-500">{activeTab === 'my-grievances' ? 'No grievances submitted yet' : 'No grievances assigned to you'}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Ticket No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
                  {activeTab === 'assigned-grievances' && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Employee</th>}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  {activeTab === 'assigned-grievances' && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentList.map(g => (
                  <tr key={g.grievanceId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">
                        <Hash size={10}/>{g.ticketNo || g.grievanceId?.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <p className="font-semibold text-slate-800 truncate">{g.subject || g.title}</p>
                      {g.complaintAgainstEmployeeName && <p className="text-xs text-red-600 font-medium mt-0.5">Against: {g.complaintAgainstEmployeeName}</p>}
                      {g.escalationLevel > 0 && <p className="text-xs text-orange-600 mt-0.5">⚠ Escalated (Level {g.escalationLevel})</p>}
                    </td>
                    {activeTab === 'assigned-grievances' && (
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-800">{g.employeeName}</p>
                        <p className="text-xs text-slate-400">{g.employeeEmail}</p>
                      </td>
                    )}
                    <td className="px-4 py-3.5 text-slate-600">{g.category}</td>
                    <td className="px-4 py-3.5"><span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getPriorityColor(g.priority)}`}>{g.priority}</span></td>
                    <td className="px-4 py-3.5"><span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(g.status)}`}>{g.status}</span></td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">{fmt(g.dateOfGrievance || g.submittedDate || g.createdAt)}</td>
                    {activeTab === 'assigned-grievances' && (
                      <td className="px-4 py-3.5">
                        <button onClick={() => openDetail(g)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                          <Eye size={12}/> View & Act
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Detail / Action Modal ── */}
      {showDetailModal && selectedGrievance && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scaleIn">

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Grievance Details</h2>
                <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                  {selectedGrievance.ticketNo || selectedGrievance.grievanceId?.slice(0, 12)}
                </span>
              </div>
              <button onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
                <X size={16}/>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className={labelCls}>Subject</p><p className="font-semibold text-slate-800">{selectedGrievance.subject || selectedGrievance.title}</p></div>
                <div><p className={labelCls}>Category</p><p className="text-slate-700">{selectedGrievance.category}</p></div>
                <div><p className={labelCls}>Priority</p><span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedGrievance.priority)}`}>{selectedGrievance.priority}</span></div>
                <div><p className={labelCls}>Status</p><span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedGrievance.status)}`}>{selectedGrievance.status}</span></div>
                <div><p className={labelCls}>Employee</p><p className="font-medium text-slate-800">{selectedGrievance.employeeName}</p><p className="text-xs text-slate-400">{selectedGrievance.employeeEmail}</p></div>
                <div><p className={labelCls}>Assigned To</p><p className="text-slate-700">{selectedGrievance.assignedToName || '—'}</p></div>
                <div><p className={labelCls}>Date of Grievance</p><p className="text-slate-700">{fmt(selectedGrievance.dateOfGrievance || selectedGrievance.submittedDate)}</p></div>
                {(selectedGrievance.dateOfClosure || selectedGrievance.resolvedDate) && (
                  <div><p className={labelCls}>Date of Closure</p><p className="text-slate-700">{fmt(selectedGrievance.dateOfClosure || selectedGrievance.resolvedDate)}</p></div>
                )}
              </div>

              <div><p className={labelCls}>Description</p><p className="text-slate-700 text-sm whitespace-pre-wrap bg-slate-50 rounded-xl p-3">{selectedGrievance.description}</p></div>

              {selectedGrievance.resolutionRemarks && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Resolution Remarks</p>
                  <p className="text-sm text-emerald-900">{selectedGrievance.resolutionRemarks}</p>
                </div>
              )}

              {selectedGrievance.complaintAgainstEmployeeName && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Complaint Against</p>
                  <p className="font-semibold text-red-900">{selectedGrievance.complaintAgainstEmployeeName}</p>
                  <p className="text-xs text-red-600">{selectedGrievance.complaintAgainstEmployeeEmail}</p>
                </div>
              )}

              {selectedGrievance.attachments?.length > 0 && (
                <div>
                  <p className={labelCls}>Supporting Documents</p>
                  <div className="space-y-2">
                    {selectedGrievance.attachments.map((att, i) => (
                      <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors text-sm text-indigo-600 font-medium">
                        <FileText size={14}/> {att.fileName || `Document ${i + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedGrievance.statusHistory?.length > 0 && (
                <div>
                  <p className={labelCls}>Status History</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedGrievance.statusHistory.map((h, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl text-xs">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-800">{h.action || h.status}</span>
                          <span className="text-slate-400">{new Date(h.timestamp).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-slate-500 mt-0.5">By: {h.changedByName} {h.assignedToName && `→ ${h.assignedToName}`}</p>
                        {h.remark && <p className="text-slate-500 mt-0.5 italic">"{h.remark}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manager action remark */}
              <div>
                <label className={labelCls}>Add Remark (Optional)</label>
                <textarea value={actionRemark} onChange={e => setActionRemark(e.target.value)}
                  className={`${inputCls} resize-none`} rows={3} placeholder="Add a remark about your action…"/>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap gap-2 flex-shrink-0">
              <button onClick={() => handleStatusUpdate(selectedGrievance.grievanceId, 'Under Review')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                <AlertCircle size={14}/> Under Review
              </button>
              <button onClick={() => handleStatusUpdate(selectedGrievance.grievanceId, 'In Progress')}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors">
                <Clock size={14}/> In Progress
              </button>
              <button onClick={() => handleStatusUpdate(selectedGrievance.grievanceId, 'Resolved')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors">
                <CheckCircle size={14}/> Resolve
              </button>
              <button onClick={() => handleStatusUpdate(selectedGrievance.grievanceId, 'Closed')}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors">
                Close
              </button>
              <button onClick={() => handleStatusUpdate(selectedGrievance.grievanceId, 'Rejected')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors">
                Reject
              </button>
              <button onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors ml-auto">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
