import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { dtrAPI, taskAPI } from '../services/api';
import {
  ClipboardList, Clock, AlertTriangle, CheckCircle2, Send,
  Upload, X, FileText, Calendar, ChevronDown, Eye,
  AlertCircle, Timer, Image as ImageIcon
} from 'lucide-react';

const STATUS_OPTIONS = ['In Progress', 'Completed', 'Blocked', 'On Hold'];
const STATUS_COLORS = {
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Blocked': 'bg-red-50 text-red-700 border-red-200',
  'On Hold': 'bg-amber-50 text-amber-700 border-amber-200'
};

export default function DailyTaskReport() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('submit');
  const [dtrStatus, setDtrStatus] = useState(null);
  const [myDTRs, setMyDTRs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [missingDTRs, setMissingDTRs] = useState(null);

  const [formData, setFormData] = useState({
    workDescription: '',
    hoursSpent: '',
    completionPercentage: '',
    status: 'In Progress',
    challengesFaced: '',
    plannedForTomorrow: '',
    remarks: ''
  });

  const today = new Date().toISOString().split('T')[0];

  const fetchDTRStatus = useCallback(async () => {
    try {
      const res = await dtrAPI.getDTRStatus();
      setDtrStatus(res.data.data);
    } catch (err) {
      console.error('Error fetching DTR status:', err);
    }
  }, []);

  const fetchMyDTRs = useCallback(async () => {
    try {
      const res = await dtrAPI.getMyDTRs({ date: today });
      setMyDTRs(res.data.data || []);
    } catch (err) {
      console.error('Error fetching DTRs:', err);
    }
  }, [today]);

  const fetchMissingDTRs = useCallback(async () => {
    try {
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      const res = await dtrAPI.getMissingDTRs(month, year);
      setMissingDTRs(res.data.data);
    } catch (err) {
      console.error('Error fetching missing DTRs:', err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchDTRStatus(), fetchMyDTRs(), fetchMissingDTRs()]);
      setLoading(false);
    };
    load();
  }, [fetchDTRStatus, fetchMyDTRs, fetchMissingDTRs]);

  const handleSubmitDTR = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (!formData.workDescription.trim()) {
      alert('Please describe the work you did today');
      return;
    }
    if (!formData.hoursSpent || parseFloat(formData.hoursSpent) <= 0) {
      alert('Please enter valid hours spent');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        taskId: selectedTask.taskId,
        date: today,
        workDescription: formData.workDescription.trim(),
        hoursSpent: parseFloat(formData.hoursSpent),
        completionPercentage: formData.completionPercentage ? parseInt(formData.completionPercentage) : undefined,
        status: formData.status,
        challengesFaced: formData.challengesFaced.trim(),
        plannedForTomorrow: formData.plannedForTomorrow.trim(),
        remarks: formData.remarks.trim()
      };

      const res = await dtrAPI.submitDTR(payload);

      // Upload attachment if present
      if (uploadFile && res.data.data?.reportId) {
        const fd = new FormData();
        fd.append('file', uploadFile);
        try {
          await dtrAPI.uploadAttachment(res.data.data.reportId, fd);
        } catch (uploadErr) {
          console.error('Attachment upload failed:', uploadErr);
        }
      }

      alert(res.data.message || 'DTR submitted successfully!');
      resetForm();
      await Promise.all([fetchDTRStatus(), fetchMyDTRs()]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit DTR';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      workDescription: '',
      hoursSpent: '',
      completionPercentage: '',
      status: 'In Progress',
      challengesFaced: '',
      plannedForTomorrow: '',
      remarks: ''
    });
    setSelectedTask(null);
    setShowForm(false);
    setUploadFile(null);
  };

  const selectTaskForDTR = (task) => {
    setSelectedTask(task);
    setShowForm(true);
    setFormData(prev => ({ ...prev, status: task.status === 'Completed' ? 'Completed' : 'In Progress' }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading DTR...</span>
      </div>
    );
  }

  return (
    <div className="p-7 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Daily Task Report (DTR)</h1>
          <p className="text-slate-500 text-sm mt-0.5">Submit your daily work progress for assigned tasks</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-700">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Urgency Banner */}
      {dtrStatus?.hasCheckedOut && !dtrStatus?.isWindowExpired && dtrStatus?.pendingCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-pulse">
          <Timer size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">⏰ Submit DTR Now! Time Remaining: {dtrStatus.timeRemainingMinutes} minutes</p>
            <p className="text-xs text-red-600 mt-0.5">
              You have {dtrStatus.pendingCount} pending task report(s). If not submitted within 30 minutes of checkout, your attendance will be marked as <strong>ABSENT</strong>.
            </p>
          </div>
        </div>
      )}

      {dtrStatus?.hasCheckedOut && dtrStatus?.isWindowExpired && dtrStatus?.pendingCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">⚠️ DTR Window Expired - Late Submission</p>
            <p className="text-xs text-amber-600 mt-0.5">
              The 30-minute window has passed. You can still submit but it will be marked as a late submission.
            </p>
          </div>
        </div>
      )}

      {/* Status Cards */}
      {dtrStatus && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Tasks', val: dtrStatus.totalActiveTasks, icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-l-indigo-500' },
            { label: 'DTR Submitted', val: dtrStatus.submittedCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-l-emerald-500' },
            { label: 'Pending DTR', val: dtrStatus.pendingCount, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-l-red-500' },
            { label: 'Time Left', val: dtrStatus.timeRemainingMinutes !== null ? `${dtrStatus.timeRemainingMinutes}m` : 'N/A', icon: Timer, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-l-amber-500' },
          ].map(({ label, val, icon: Icon, color, bg, border }) => (
            <div key={label} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${border} p-4 flex items-center gap-3 card-hover`}>
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon size={16} className={color} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className={`text-xl font-bold ${color} leading-tight`}>{val}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {[
          { id: 'submit', label: 'Submit DTR', icon: Send },
          { id: 'history', label: "Today's Reports", icon: FileText },
          { id: 'missing', label: 'Missing Days', icon: AlertTriangle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Submit Tab */}
      {activeTab === 'submit' && (
        <div className="space-y-4">
          {/* Pending Tasks List */}
          {!showForm && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <ClipboardList size={16} className="text-slate-400" />
                  Pending Tasks - Select to Submit DTR
                </h2>
                <span className="text-xs text-slate-400">{dtrStatus?.pendingCount || 0} pending</span>
              </div>

              {dtrStatus?.pendingTasks?.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <CheckCircle2 size={36} className="text-emerald-300" />
                  <p className="text-sm font-medium text-emerald-600">All DTRs submitted for today! 🎉</p>
                  <p className="text-xs text-slate-400">No pending tasks require DTR submission</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {(dtrStatus?.pendingTasks || []).map(task => (
                    <div key={task.taskId} className="px-5 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-400">{task.category || 'General'}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            task.priority === 'High' || task.priority === 'Critical' ? 'bg-red-50 text-red-600' :
                            task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                          }`}>{task.priority}</span>
                          {task.deadline && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar size={10} /> Due: {new Date(task.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => selectTaskForDTR(task)}
                        className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 flex-shrink-0"
                      >
                        <Send size={12} /> Fill DTR
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DTR Form */}
          {showForm && selectedTask && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-800 text-sm">Submit DTR for: {selectedTask.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Category: {selectedTask.category || 'General'} | Priority: {selectedTask.priority}</p>
                </div>
                <button onClick={resetForm} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitDTR} className="p-5 space-y-5">
                {/* Work Description - Required */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Work Done Today <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.workDescription}
                    onChange={e => setFormData(p => ({ ...p, workDescription: e.target.value }))}
                    placeholder="Describe in detail what work you completed today for this task..."
                    rows={4}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    required
                  />
                </div>

                {/* Hours + Completion + Status Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Hours Spent <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      value={formData.hoursSpent}
                      onChange={e => setFormData(p => ({ ...p, hoursSpent: e.target.value }))}
                      placeholder="e.g. 4.5"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Task Completion %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.completionPercentage}
                      onChange={e => setFormData(p => ({ ...p, completionPercentage: e.target.value }))}
                      placeholder="e.g. 75"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Challenges Faced */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Challenges / Blockers Faced
                  </label>
                  <textarea
                    value={formData.challengesFaced}
                    onChange={e => setFormData(p => ({ ...p, challengesFaced: e.target.value }))}
                    placeholder="Any issues, blockers, or challenges you encountered (optional)"
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Plan for Tomorrow */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Plan for Tomorrow
                  </label>
                  <textarea
                    value={formData.plannedForTomorrow}
                    onChange={e => setFormData(p => ({ ...p, plannedForTomorrow: e.target.value }))}
                    placeholder="What do you plan to work on next for this task? (optional)"
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Additional Remarks
                  </label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={e => setFormData(p => ({ ...p, remarks: e.target.value }))}
                    placeholder="Any additional notes (optional)"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* File Upload (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Attachment / Screenshot (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                      <Upload size={14} className="text-slate-400" />
                      <span className="text-xs text-slate-500">{uploadFile ? uploadFile.name : 'Choose file (max 10MB)'}</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,.gif"
                        onChange={e => setUploadFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                    {uploadFile && (
                      <button type="button" onClick={() => setUploadFile(null)} className="text-red-400 hover:text-red-600">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Supported: JPG, PNG, WEBP, PDF, GIF</p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-2">
                  <button type="button" onClick={resetForm} className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Submit DTR
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Today's Reports Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              Today's Submitted Reports
            </h2>
            <span className="text-xs text-slate-400">{myDTRs.length} reports</span>
          </div>

          {myDTRs.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <FileText size={36} className="text-slate-200" />
              <p className="text-sm font-medium text-slate-500">No DTRs submitted today</p>
              <p className="text-xs text-slate-400">Submit your first Daily Task Report above</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {myDTRs.map(dtr => (
                <div key={dtr.reportId} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{dtr.taskTitle}</p>
                        {dtr.isLate && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">Late</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dtr.workDescription}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {dtr.hoursSpent}h worked
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[dtr.status] || 'bg-slate-50 text-slate-600'}`}>
                          {dtr.status}
                        </span>
                        {dtr.completionPercentage != null && (
                          <span className="text-xs text-slate-400">{dtr.completionPercentage}% complete</span>
                        )}
                        {dtr.attachmentUrl && (
                          <a href={dtr.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 flex items-center gap-1 hover:underline">
                            <ImageIcon size={10} /> Attachment
                          </a>
                        )}
                      </div>
                      {dtr.challengesFaced && (
                        <p className="text-xs text-red-500 mt-1.5">⚠️ Challenges: {dtr.challengesFaced}</p>
                      )}
                      {dtr.plannedForTomorrow && (
                        <p className="text-xs text-emerald-600 mt-1">📋 Tomorrow: {dtr.plannedForTomorrow}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {new Date(dtr.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Missing Days Tab */}
      {activeTab === 'missing' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Missing DTR Days (This Month)
            </h2>
            {missingDTRs && (
              <span className="text-xs text-slate-400">
                {missingDTRs.dtrSubmittedDays}/{missingDTRs.totalWorkingDays} days submitted
              </span>
            )}
          </div>

          {!missingDTRs || missingDTRs.missingDays === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <CheckCircle2 size={36} className="text-emerald-300" />
              <p className="text-sm font-medium text-emerald-600">No missing DTRs this month! 🎉</p>
              <p className="text-xs text-slate-400">You have submitted DTR for all working days</p>
            </div>
          ) : (
            <div>
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                <p className="text-xs text-amber-700 font-medium">
                  ⚠️ You have {missingDTRs.missingDays} day(s) without DTR submission. Days marked absent due to missing DTR cannot be reversed.
                </p>
              </div>
              <div className="divide-y divide-slate-50">
                {missingDTRs.details.map((day, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">
                        {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      day.markedAbsent ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {day.markedAbsent ? 'Marked Absent' : 'Missed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <AlertCircle size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-slate-700">DTR Submission Rules</p>
          <ul className="text-xs text-slate-500 mt-1 space-y-0.5 list-disc list-inside">
            <li>DTR must be submitted within <strong>30 minutes</strong> of checkout</li>
            <li>If not submitted on time, attendance will be marked as <strong>Absent</strong></li>
            <li>Fill DTR for each assigned active task daily</li>
            <li>You can attach screenshots/images as proof of work (optional)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
