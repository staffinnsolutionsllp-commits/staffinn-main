import { useState, useEffect } from 'react';
import { leaveAPI } from '../services/api';
import { PlaneTakeoff, CalendarDays, X, Plus, AlertCircle } from 'lucide-react';

export default function Leave() {
  const [leaves,     setLeaves]     = useState([]);
  const [balance,    setBalance]    = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [showForm,   setShowForm]   = useState(false);
  const [formData,   setFormData]   = useState({ leaveType: '', startDate: '', endDate: '', reason: '' });

  useEffect(() => { loadLeaves(); loadBalance(); loadLeaveTypes(); }, []);

  const loadLeaves = async () => {
    try { const r = await leaveAPI.getMyLeaves();    setLeaves(r.data.data); } catch {}
  };
  const loadBalance = async () => {
    try { const r = await leaveAPI.getLeaveBalance(); setBalance(r.data.data); } catch {}
  };
  const loadLeaveTypes = async () => {
    try {
      const r = await leaveAPI.getLeaveTypes();
      const types = r.data.data || [];
      setLeaveTypes(types);
      if (types.length > 0 && !formData.leaveType)
        setFormData(p => ({ ...p, leaveType: types[0] }));
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await leaveAPI.applyLeave(formData);
      alert('Leave applied successfully!');
      setShowForm(false);
      setFormData({ leaveType: leaveTypes[0] || '', startDate: '', endDate: '', reason: '' });
      loadLeaves(); loadBalance();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to apply leave');
    }
  };

  const handleCancel = async (id) => {
    if (confirm('Cancel this leave request?')) {
      try {
        await leaveAPI.cancelLeave(id);
        alert('Leave cancelled successfully!');
        loadLeaves();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to cancel leave');
      }
    }
  };

  const statusStyle = {
    Approved: 'bg-emerald-50 text-emerald-700',
    Rejected: 'bg-red-50 text-red-600',
    Pending:  'bg-amber-50 text-amber-700',
  };

  return (
    <div className="p-8 space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Apply and track your leave requests</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={leaveTypes.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} /> Apply Leave
        </button>
      </div>

      {/* Balance cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Leave Balance</h2>
        {balance.length === 0 ? (
          <div className="bg-white border border-amber-200 rounded-2xl p-6 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 text-sm">No leave balance configured</p>
              <p className="text-slate-500 text-xs mt-1">Please contact HR to set up your leave balance.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {balance.map((b, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow card-hover">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700">{b.leaveType}</p>
                  <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <CalendarDays size={16} className="text-indigo-600" />
                  </div>
                </div>
                <p className="text-3xl font-black text-indigo-600 leading-none">{b.balance || 0}</p>
                <p className="text-xs text-slate-500 mt-1 mb-3">Days Available</p>
                <div className="flex gap-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span><strong className="text-slate-700">{b.totalAllocated || 0}</strong> Total</span>
                  <span><strong className="text-slate-700">{b.used || 0}</strong> Used</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <PlaneTakeoff size={18} className="text-slate-400" />
          <h2 className="font-semibold text-slate-800">Leave History</h2>
        </div>
        <div className="overflow-x-auto">
          {leaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-3">
              <PlaneTakeoff size={36} className="text-slate-200" />
              <p className="text-sm text-slate-500">No leave applications found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Type', 'Start Date', 'End Date', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaves.map((leave) => (
                  <tr key={leave.leaveId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-800">{leave.leaveType}</td>
                    <td className="px-6 py-3.5 text-slate-600">{leave.startDate}</td>
                    <td className="px-6 py-3.5 text-slate-600">{leave.endDate}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${statusStyle[leave.status] || 'bg-slate-100 text-slate-600'}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {leave.status === 'Pending' && (
                        <button onClick={() => handleCancel(leave.leaveId)} className="text-red-500 hover:text-red-700 text-xs font-semibold transition-colors">
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Apply for Leave</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            {leaveTypes.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle size={40} className="text-amber-400 mx-auto mb-3" />
                <p className="font-semibold text-slate-800">No Leave Types Available</p>
                <p className="text-sm text-slate-500 mt-1 mb-5">Contact HR to configure leave types.</p>
                <button onClick={() => setShowForm(false)} className="px-5 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Leave Type</label>
                  <select
                    value={formData.leaveType}
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                    required
                  >
                    {leaveTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Start Date</label>
                    <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">End Date</label>
                    <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Reason</label>
                  <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required rows="3"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
                    Submit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
