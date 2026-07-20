import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { organogramAPI, dtrAPI } from '../services/api';
import {
  ClipboardList, Plus, X, Play, CheckCircle2, Star,
  CalendarDays, Clock, Tag, User, Send, FileText, Upload,
  AlertTriangle, Timer
} from 'lucide-react';

export default function Tasks() {
  const { user }         = useAuth();
  const [tasks,           setTasks]           = useState([]);
  const [assignedByMe,    setAssignedByMe]    = useState([]);
  const [ratings,         setRatings]         = useState([]);
  const [subordinates,    setSubordinates]    = useState([]);
  const [hasSubordinates, setHasSubordinates] = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [activeTab,       setActiveTab]       = useState('tasks');
  const [showAssignForm,  setShowAssignForm]  = useState(false);
  const [assignFormData,  setAssignFormData]  = useState({
    employeeId: '', title: '', description: '', priority: 'Medium',
    startDate: new Date().toISOString().split('T')[0], endDate: '', deadline: '',
    department: '', taskCategory: '', customCategory: '', taskType: 'One-Time',
    status: 'Yet-to-Start', progress: 0, performedValue: '', performedUnit: '%age'
  });

  useEffect(() => { fetchTasks(); fetchRatings(); fetchSubordinates(); fetchAssignedByMe(); }, []);

  // DTR state
  const [dtrFormOpen, setDtrFormOpen] = useState(null); // taskId or null
  const [dtrSubmitting, setDtrSubmitting] = useState(false);
  const [dtrUploadFile, setDtrUploadFile] = useState(null);
  const [dtrForm, setDtrForm] = useState({
    workDescription: '', hoursSpent: '', completionPercentage: '',
    status: 'In Progress', challengesFaced: '', plannedForTomorrow: '', remarks: ''
  });

  const today = new Date().toISOString().split('T')[0];

  const handleSubmitDTR = async (task) => {
    if (!dtrForm.workDescription.trim()) { alert('Please describe the work you did today'); return; }
    if (!dtrForm.hoursSpent || parseFloat(dtrForm.hoursSpent) <= 0) { alert('Please enter valid hours spent'); return; }

    setDtrSubmitting(true);
    try {
      const payload = {
        taskId: task.taskId,
        date: today,
        workDescription: dtrForm.workDescription.trim(),
        hoursSpent: parseFloat(dtrForm.hoursSpent),
        completionPercentage: dtrForm.completionPercentage ? parseInt(dtrForm.completionPercentage) : undefined,
        status: dtrForm.status,
        challengesFaced: dtrForm.challengesFaced.trim(),
        plannedForTomorrow: dtrForm.plannedForTomorrow.trim(),
        remarks: dtrForm.remarks.trim()
      };

      const res = await dtrAPI.submitDTR(payload);

      // Upload attachment if present
      if (dtrUploadFile && res.data.data?.reportId) {
        const fd = new FormData();
        fd.append('file', dtrUploadFile);
        try { await dtrAPI.uploadAttachment(res.data.data.reportId, fd); } catch (e) { console.error('Upload failed:', e); }
      }

      alert(res.data.message || 'DTR submitted successfully!');
      setDtrFormOpen(null);
      setDtrForm({ workDescription: '', hoursSpent: '', completionPercentage: '', status: 'In Progress', challengesFaced: '', plannedForTomorrow: '', remarks: '' });
      setDtrUploadFile(null);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit DTR');
    } finally {
      setDtrSubmitting(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const r = await api.get('/employee/tasks');
      setTasks(r.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  const fetchAssignedByMe = async () => {
    try { const r = await api.get('/employee/tasks/assigned-by-me'); setAssignedByMe(r.data.data || []); } catch {}
  };
  const fetchRatings = async () => {
    try { const r = await api.get('/employee/performance/ratings'); setRatings(r.data.data || []); } catch {}
  };
  const fetchSubordinates = async () => {
    try {
      const r = await organogramAPI.getSubordinatesHierarchy();
      if (r.data.success) {
        setHasSubordinates(r.data.data.hasSubordinates);
        setSubordinates(r.data.data.subordinates || []);
      }
    } catch {}
  };

  const DEPARTMENT_CATEGORIES = {
    'HR': ['Recruitment','Resume Screening','Interview Scheduling','Candidate Follow-up','Employee Onboarding','Attendance Management','Leave Management','Employee Documentation','Payroll Coordination','Training Coordination','Employee Engagement','Performance Review','Exit Formalities','HR Compliance','Policy Communication','Grievance Resolution','Employee Verification','HR Reports & MIS','Employee Record Update','Other'],
    'Reception': ['Visitor Management','Call Management','Courier Management','Front Desk Support','Meeting Coordination','Appointment Scheduling','Record Maintenance','Inquiry Handling','Document Receiving','Gate Pass Management','Hospitality Arrangement','Other'],
    'Accounts & Finance': ['Invoice Preparation','Payment Processing','Salary Processing','Reimbursement Processing','Expense Verification','Vendor Payment','Petty Cash Management','GST Filing','TDS Compliance','PF & ESI Compliance','Bank Reconciliation','Financial Reporting','Budget Preparation','Audit Support','Account Reconciliation','Collection Follow-up','Billing','Tax Compliance','Other'],
    'Project / Operations': ['Project Planning','Batch Creation','Candidate Verification','Mobilization Support','Centre Coordination','Documentation','Government Portal Update','Assessment Coordination','Certification Follow-up','Client Coordination','Partner Coordination','Project Monitoring','Compliance Monitoring','MIS Preparation','Report Submission','Field Visit','Project Review','Project Closure','Issue Resolution','Other'],
    'Administration / Office Management': ['Office Maintenance','Housekeeping Coordination','Asset Management','Asset Issue/Return','Inventory Management','Stationery Management','Procurement','Vendor Coordination','Facility Management','Meeting Arrangement','Conference Room Booking','Courier & Dispatch','Office Logistics','Vehicle Management','Utility Management','Event Arrangement','AMC Coordination','Security Coordination','Other'],
    'Sales / Business Development': ['Lead Generation','Cold Calling','Client Follow-up','Client Meeting','Proposal Submission','Quotation Preparation','Business Presentation','College Visit','Corporate Visit','Partnership Development','MoU Discussion','CRM Update','Market Research','Payment Follow-up','Business Expansion','Customer Relationship','Sales Reporting','Other'],
    'IT': ['User Account Management','Email Configuration','HRMS Support','Website Management','Software Installation','Hardware Installation','System Maintenance','Network Support','Printer Support','Data Backup','Data Recovery','Cyber Security','Bug Fixing','Software Development','Technical Support','Server Maintenance','System Upgrade','Other'],
    'Media': ['Photography','Videography','Video Editing','Reel Creation','Social Media Management','Content Writing','Event Coverage','YouTube Management','Facebook Management','Instagram Management','LinkedIn Management','Campaign Management','Advertisement Management','Digital Marketing','SEO Activities','Content Planning','Media Coordination','Other'],
    'Design': ['Logo Design','Banner Design','Brochure Design','Flyer Design','Social Media Creative','Presentation Design','Certificate Design','ID Card Design','Website Graphics','Print Design','Branding Material','Infographic Design','UI/UX Design','Packaging Design','Creative Revision','Artwork Finalization','Other'],
  };

  const TASK_TYPES = ['One-Time', 'New Initiative', 'Carry Forward', 'Crisis', 'Daily', 'Monthly'];
  const TASK_STATUSES = ['Yet-to-Start', 'In-Progress', 'Completed', 'On-Hold', 'Pending', 'Cancelled'];
  const PERFORMED_UNITS = ['Days', 'Nos.', '%age'];

  const DEPARTMENTS = Object.keys(DEPARTMENT_CATEGORIES);

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!assignFormData.employeeId || !assignFormData.title || !assignFormData.deadline || !assignFormData.department || !assignFormData.taskCategory) {
      alert('Please fill in all required fields (Employee, Title, Department, Task Category, Deadline)'); return;
    }
    // If category is "Other" and customCategory is empty, require it
    if (assignFormData.taskCategory === 'Other' && !assignFormData.customCategory.trim()) {
      alert('Please enter a custom category name'); return;
    }
    try {
      await api.post('/employee/tasks/assign', {
        employeeIds:    [assignFormData.employeeId],
        title:          assignFormData.title,
        description:    assignFormData.description,
        priority:       assignFormData.priority,
        startDate:      assignFormData.startDate,
        endDate:        assignFormData.endDate,
        deadline:       assignFormData.deadline,
        department:     assignFormData.department,
        taskCategory:   assignFormData.taskCategory === 'Other' ? assignFormData.customCategory : assignFormData.taskCategory,
        customCategory: assignFormData.taskCategory === 'Other' ? assignFormData.customCategory : '',
        taskType:       assignFormData.taskType,
        status:         assignFormData.status,
        progress:       assignFormData.progress,
        performedValue: assignFormData.performedValue ? parseFloat(assignFormData.performedValue) : 0,
        performedUnit:  assignFormData.performedUnit
      });
      alert('Task assigned successfully!');
      setShowAssignForm(false);
      setAssignFormData({ employeeId: '', title: '', description: '', priority: 'Medium', startDate: new Date().toISOString().split('T')[0], endDate: '', deadline: '', department: '', taskCategory: '', customCategory: '', taskType: 'One-Time', status: 'Yet-to-Start', progress: 0, performedValue: '', performedUnit: '%age' });
      fetchTasks(); fetchAssignedByMe();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const updateTaskStatus = async (taskId, status, percentage, performedVal, performedUn) => {
    try {
      const payload = { status, completionPercentage: percentage };
      if (performedVal !== undefined) payload.performedValue = performedVal;
      if (performedUn) payload.performedUnit = performedUn;
      await api.put(`/employee/tasks/${taskId}`, payload);
      alert('Task updated successfully');
      fetchTasks();
    } catch (error) {
      alert('Error updating task: ' + (error.response?.data?.message || error.message));
    }
  };

  const priorityStyle = { High: 'bg-red-50 text-red-700', Medium: 'bg-amber-50 text-amber-700', Low: 'bg-emerald-50 text-emerald-700', Critical: 'bg-purple-50 text-purple-700' };
  const statusStyle   = { Completed: 'bg-emerald-50 text-emerald-700', 'In-Progress': 'bg-blue-50 text-blue-700', 'Yet-to-Start': 'bg-slate-100 text-slate-600', 'On-Hold': 'bg-amber-50 text-amber-700', Pending: 'bg-orange-50 text-orange-700', Cancelled: 'bg-red-50 text-red-700', Started: 'bg-blue-50 text-blue-700', 'In Progress': 'bg-blue-50 text-blue-700' };

  return (
    <div className="p-8 space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks & Performance</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your tasks and track performance</p>
        </div>
        {hasSubordinates && (
          <button onClick={() => setShowAssignForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/25">
            <Plus size={15} /> Assign Task
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 gap-1">
        {[
          { key: 'tasks',       label: 'My Tasks',          icon: ClipboardList },
          ...(hasSubordinates ? [{ key: 'assigned', label: 'Assigned by Me', icon: Send }] : []),
          { key: 'performance', label: 'Performance Ratings', icon: Star },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
              activeTab === key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}>
            <Icon size={15} /> {label}
            {key === 'assigned' && assignedByMe.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-full">{assignedByMe.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              Loading tasks…
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center py-20 bg-white rounded-2xl border border-slate-200 gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <ClipboardList size={26} className="text-slate-300" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-700">No tasks assigned</p>
                <p className="text-xs text-slate-400 mt-1">Tasks assigned to you will appear here.</p>
              </div>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.taskId} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden card-hover">
                {/* Card header */}
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h3 className="font-bold text-slate-900">{task.title}</h3>
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${priorityStyle[task.priority] || 'bg-slate-100 text-slate-600'}`}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && <p className="text-sm text-slate-500 leading-relaxed">{task.description}</p>}
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${statusStyle[task.status] || 'bg-slate-100 text-slate-600'}`}>
                    {task.status}
                  </span>
                </div>

                {/* Details */}
                <div className="px-6 py-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { icon: CalendarDays, label: 'Start', value: new Date(task.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { icon: Clock,        label: 'Deadline', value: new Date(task.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }), color: 'text-red-500', bg: 'bg-red-50' },
                      { icon: Tag,          label: 'Department', value: task.department || task.category || '—', color: 'text-violet-600', bg: 'bg-violet-50' },
                      { icon: User,         label: 'Task Category', value: task.taskCategory || task.category || '—', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    ].map(({ icon: Icon, label, value, color, bg }) => (
                      <div key={label} className="flex items-start gap-2.5">
                        <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon size={14} className={color} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</p>
                          <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  {task.status !== 'Pending' && (
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">Progress</span>
                        <span className="font-bold text-indigo-600">{task.completionPercentage || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                          style={{ width: `${task.completionPercentage || 0}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {task.status !== 'Completed' ? (
                    <div className="flex gap-3 flex-wrap">
                      {task.status === 'Pending' && (
                        <button onClick={() => updateTaskStatus(task.taskId, 'Started', 10)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors">
                          <Play size={12} /> Start Task
                        </button>
                      )}
                      <button onClick={() => updateTaskStatus(task.taskId, 'Completed', 100)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors">
                        <CheckCircle2 size={12} /> Mark Complete
                      </button>
                      <button onClick={() => { setDtrFormOpen(dtrFormOpen === task.taskId ? null : task.taskId); setDtrForm({ workDescription: '', hoursSpent: '', completionPercentage: '', status: 'In Progress', challengesFaced: '', plannedForTomorrow: '', remarks: '' }); setDtrUploadFile(null); }}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl transition-colors">
                        <FileText size={12} /> Fill DTR
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3 flex-wrap items-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200">
                        <CheckCircle2 size={13} /> Task Completed
                      </div>
                      <button onClick={() => { setDtrFormOpen(dtrFormOpen === task.taskId ? null : task.taskId); setDtrForm({ workDescription: '', hoursSpent: '', completionPercentage: '100', status: 'Completed', challengesFaced: '', plannedForTomorrow: '', remarks: '' }); setDtrUploadFile(null); }}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl transition-colors">
                        <FileText size={12} /> Fill DTR
                      </button>
                    </div>
                  )}

                  {/* Inline DTR Form */}
                  {dtrFormOpen === task.taskId && (
                    <div className="mt-4 p-5 bg-orange-50 border border-orange-200 rounded-xl space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-orange-800 flex items-center gap-2">
                          <FileText size={14} /> Daily Task Report — {today}
                        </h4>
                        <button onClick={() => setDtrFormOpen(null)} className="text-orange-400 hover:text-orange-600">
                          <X size={16} />
                        </button>
                      </div>

                      {/* Work Description */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Work Done Today <span className="text-red-500">*</span></label>
                        <textarea value={dtrForm.workDescription}
                          onChange={e => setDtrForm(p => ({...p, workDescription: e.target.value}))}
                          placeholder="Describe in detail what work you completed today..."
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" required />
                      </div>

                      {/* Hours + Completion + Status */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Hours Spent <span className="text-red-500">*</span></label>
                          <input type="number" step="0.5" min="0.5" max="24"
                            value={dtrForm.hoursSpent}
                            onChange={e => setDtrForm(p => ({...p, hoursSpent: e.target.value}))}
                            placeholder="e.g. 4.5"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" required />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Completion %</label>
                          <input type="number" min="0" max="100"
                            value={dtrForm.completionPercentage}
                            onChange={e => setDtrForm(p => ({...p, completionPercentage: e.target.value}))}
                            placeholder="e.g. 75"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Status <span className="text-red-500">*</span></label>
                          <select value={dtrForm.status}
                            onChange={e => setDtrForm(p => ({...p, status: e.target.value}))}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Blocked">Blocked</option>
                            <option value="On Hold">On Hold</option>
                          </select>
                        </div>
                      </div>

                      {/* Challenges + Plan */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Challenges / Blockers</label>
                          <textarea value={dtrForm.challengesFaced}
                            onChange={e => setDtrForm(p => ({...p, challengesFaced: e.target.value}))}
                            placeholder="Any issues faced? (optional)"
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Plan for Tomorrow</label>
                          <textarea value={dtrForm.plannedForTomorrow}
                            onChange={e => setDtrForm(p => ({...p, plannedForTomorrow: e.target.value}))}
                            placeholder="What next? (optional)"
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
                        </div>
                      </div>

                      {/* Attachment + Remarks */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Attachment (Optional)</label>
                          <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-white transition-colors">
                            <Upload size={12} className="text-slate-400" />
                            <span className="text-xs text-slate-500 truncate">{dtrUploadFile ? dtrUploadFile.name : 'Choose file'}</span>
                            <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.gif"
                              onChange={e => setDtrUploadFile(e.target.files?.[0] || null)}
                              className="hidden" />
                          </label>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
                          <input type="text" value={dtrForm.remarks}
                            onChange={e => setDtrForm(p => ({...p, remarks: e.target.value}))}
                            placeholder="Additional notes (optional)"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-xs text-orange-600 flex items-center gap-1">
                          <AlertTriangle size={11} /> Submit within 30 mins of checkout
                        </p>
                        <button onClick={() => handleSubmitDTR(task)} disabled={dtrSubmitting}
                          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50">
                          {dtrSubmitting ? (
                            <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                          ) : (
                            <><Send size={12} /> Submit DTR</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Assigned by Me */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          {assignedByMe.length === 0 ? (
            <div className="flex flex-col items-center py-20 bg-white rounded-2xl border border-slate-200 gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Send size={26} className="text-slate-300" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-700">No tasks assigned by you</p>
                <p className="text-xs text-slate-400 mt-1">Tasks you assign to subordinates will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Assigned To', 'Title', 'Task Type', 'Priority', 'Start Date', 'End Date', 'Deadline', 'Status', 'Performed'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {assignedByMe.map((task) => (
                      <tr key={task.taskId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{task.employeeId}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{task.title}</p>
                          {task.department && <p className="text-xs text-slate-400">{task.department} · {task.taskCategory || task.category}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{task.taskType || 'One-Time'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${priorityStyle[task.priority] || 'bg-slate-100 text-slate-600'}`}>{task.priority}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{task.startDate ? new Date(task.startDate).toLocaleDateString('en-IN', {day:'numeric',month:'short'}) : '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{task.endDate ? new Date(task.endDate).toLocaleDateString('en-IN', {day:'numeric',month:'short'}) : '—'}</td>
                        <td className="px-4 py-3 text-xs text-red-600 font-medium">{task.deadline ? new Date(task.deadline).toLocaleDateString('en-IN', {day:'numeric',month:'short'}) : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusStyle[task.status] || 'bg-slate-100 text-slate-600'}`}>{task.status}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-700">{task.performedValue || 0} {task.performedUnit || '%age'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance */}
      {activeTab === 'performance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {ratings.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3 text-slate-400">
                <Star size={36} className="text-slate-200" />
                <p className="text-sm text-slate-500">No performance ratings available</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Cycle', 'Year', 'Work Quality', 'Task Completion', 'Overall'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {ratings.map((r) => (
                    <tr key={r.ratingId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-slate-800">{r.cycle}</td>
                      <td className="px-6 py-3.5 text-slate-600">{r.year}</td>
                      <td className="px-6 py-3.5 text-slate-600">{r.workQuality}/5</td>
                      <td className="px-6 py-3.5 text-slate-600">{r.taskCompletion}/5</td>
                      <td className="px-6 py-3.5">
                        <span className="font-bold text-indigo-600">{r.overallPerformance}/5</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-900">Assign Task</h2>
              <button onClick={() => setShowAssignForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAssignTask} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Department + Task Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Department *</label>
                  <select value={assignFormData.department}
                    onChange={(e) => setAssignFormData({ ...assignFormData, department: e.target.value, taskCategory: '', customCategory: '' })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" required>
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Task Category *</label>
                  <select value={assignFormData.taskCategory}
                    onChange={(e) => setAssignFormData({ ...assignFormData, taskCategory: e.target.value, customCategory: '' })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" required disabled={!assignFormData.department}>
                    <option value="">Select Category</option>
                    {assignFormData.department && DEPARTMENT_CATEGORIES[assignFormData.department]?.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {/* Custom Category if "Other" selected */}
              {assignFormData.taskCategory === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Custom Category Name *</label>
                  <input type="text" value={assignFormData.customCategory}
                    onChange={(e) => setAssignFormData({ ...assignFormData, customCategory: e.target.value })}
                    placeholder="Enter custom category name..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" required />
                </div>
              )}
              {/* Task Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Task Type *</label>
                  <select value={assignFormData.taskType}
                    onChange={(e) => setAssignFormData({ ...assignFormData, taskType: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white">
                    {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Assign To *</label>
                  <select value={assignFormData.employeeId}
                    onChange={(e) => setAssignFormData({ ...assignFormData, employeeId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" required>
                    <option value="">Select Subordinate</option>
                    {subordinates.map(s => (
                      <option key={s.employeeId} value={s.employeeId}>{s.employee?.fullName || s.employee?.name} — {s.position}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Task Title *</label>
                <input type="text" value={assignFormData.title}
                  onChange={(e) => setAssignFormData({ ...assignFormData, title: e.target.value })}
                  placeholder="e.g. Hire Project Coordinator"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" required />
              </div>
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                <textarea value={assignFormData.description}
                  onChange={(e) => setAssignFormData({ ...assignFormData, description: e.target.value })}
                  rows="2" placeholder="Describe the task details..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white resize-none" />
              </div>
              {/* Priority + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Priority *</label>
                  <select value={assignFormData.priority} onChange={(e) => setAssignFormData({ ...assignFormData, priority: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white">
                    <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Status</label>
                  <select value={assignFormData.status} onChange={(e) => setAssignFormData({ ...assignFormData, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white">
                    {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {/* 3 Dates: Start, End, Deadline */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Start Date *</label>
                  <input type="date" value={assignFormData.startDate}
                    onChange={(e) => setAssignFormData({ ...assignFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">End Date</label>
                  <input type="date" value={assignFormData.endDate}
                    onChange={(e) => setAssignFormData({ ...assignFormData, endDate: e.target.value })}
                    min={assignFormData.startDate || undefined}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Deadline *</label>
                  <input type="date" value={assignFormData.deadline}
                    onChange={(e) => setAssignFormData({ ...assignFormData, deadline: e.target.value })}
                    min={assignFormData.startDate || undefined}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" required />
                </div>
              </div>
              {/* Performed + Unit */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Task Performed</label>
                  <input type="number" min="0" value={assignFormData.performedValue}
                    onChange={(e) => setAssignFormData({ ...assignFormData, performedValue: e.target.value })}
                    placeholder="e.g. 40"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Unit</label>
                  <select value={assignFormData.performedUnit}
                    onChange={(e) => setAssignFormData({ ...assignFormData, performedUnit: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white">
                    {PERFORMED_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Progress (%)</label>
                  <input type="number" min="0" max="100" value={assignFormData.progress}
                    onChange={(e) => setAssignFormData({ ...assignFormData, progress: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAssignForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
