import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { organogramAPI } from '../services/api';
import {
  ClipboardList, Plus, X, Play, CheckCircle2, Star,
  CalendarDays, Clock, Tag, User
} from 'lucide-react';

export default function Tasks() {
  const { user }         = useAuth();
  const [tasks,           setTasks]           = useState([]);
  const [ratings,         setRatings]         = useState([]);
  const [subordinates,    setSubordinates]    = useState([]);
  const [hasSubordinates, setHasSubordinates] = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [activeTab,       setActiveTab]       = useState('tasks');
  const [showAssignForm,  setShowAssignForm]  = useState(false);
  const [assignFormData,  setAssignFormData]  = useState({
    employeeId: '', title: '', description: '', priority: 'Medium', deadline: '', category: 'General'
  });

  useEffect(() => { fetchTasks(); fetchRatings(); fetchSubordinates(); }, []);

  const fetchTasks = async () => {
    try {
      const r = await api.get('/employee/tasks');
      setTasks(r.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
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

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!assignFormData.employeeId || !assignFormData.title || !assignFormData.deadline) {
      alert('Please fill in all required fields'); return;
    }
    try {
      await api.post('/employee/tasks/assign', {
        employeeIds: [assignFormData.employeeId],
        title:        assignFormData.title,
        description:  assignFormData.description,
        priority:     assignFormData.priority,
        deadline:     assignFormData.deadline,
        category:     assignFormData.category,
        startDate:    new Date().toISOString()
      });
      alert('Task assigned successfully!');
      setShowAssignForm(false);
      setAssignFormData({ employeeId: '', title: '', description: '', priority: 'Medium', deadline: '', category: 'General' });
      fetchTasks();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const updateTaskStatus = async (taskId, status, percentage) => {
    try {
      await api.put(`/employee/tasks/${taskId}`, { status, completionPercentage: percentage });
      alert('Task updated successfully');
      fetchTasks();
    } catch (error) {
      alert('Error updating task: ' + (error.response?.data?.message || error.message));
    }
  };

  const priorityStyle = { High: 'bg-red-50 text-red-700', Medium: 'bg-amber-50 text-amber-700', Low: 'bg-emerald-50 text-emerald-700' };
  const statusStyle   = { Completed: 'bg-emerald-50 text-emerald-700', Started: 'bg-blue-50 text-blue-700', 'In Progress': 'bg-blue-50 text-blue-700', Pending: 'bg-slate-100 text-slate-600' };

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
          { key: 'performance', label: 'Performance Ratings', icon: Star },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
              activeTab === key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}>
            <Icon size={15} /> {label}
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
                      { icon: Tag,          label: 'Category', value: task.category, color: 'text-violet-600', bg: 'bg-violet-50' },
                      { icon: User,         label: 'Assigned By', value: task.assignedByName || '—', color: 'text-indigo-600', bg: 'bg-indigo-50' },
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
                    <div className="flex gap-3">
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
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200">
                      <CheckCircle2 size={13} /> Task Completed
                    </div>
                  )}
                </div>
              </div>
            ))
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900">Assign Task</h2>
              <button onClick={() => setShowAssignForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAssignTask} className="p-6 space-y-4">
              {[
                { label: 'Assign To *', node: (
                  <select value={assignFormData.employeeId}
                    onChange={(e) => setAssignFormData({ ...assignFormData, employeeId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" required>
                    <option value="">Select Employee</option>
                    {subordinates.map(s => (
                      <option key={s.employeeId} value={s.employeeId}>{s.employee?.fullName || s.employee?.name} — {s.position}</option>
                    ))}
                  </select>
                )},
                { label: 'Task Title *', node: (
                  <input type="text" value={assignFormData.title}
                    onChange={(e) => setAssignFormData({ ...assignFormData, title: e.target.value })}
                    placeholder="Enter task title"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" required />
                )},
                { label: 'Description', node: (
                  <textarea value={assignFormData.description}
                    onChange={(e) => setAssignFormData({ ...assignFormData, description: e.target.value })}
                    rows="3" placeholder="Enter task description"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white resize-none" />
                )},
              ].map(({ label, node }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                  {node}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Priority</label>
                  <select value={assignFormData.priority} onChange={(e) => setAssignFormData({ ...assignFormData, priority: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white">
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Deadline *</label>
                  <input type="date" value={assignFormData.deadline}
                    onChange={(e) => setAssignFormData({ ...assignFormData, deadline: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
                <select value={assignFormData.category} onChange={(e) => setAssignFormData({ ...assignFormData, category: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white">
                  {['General','Development','Design','Testing','Documentation','Meeting','Other'].map(c => <option key={c}>{c}</option>)}
                </select>
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
