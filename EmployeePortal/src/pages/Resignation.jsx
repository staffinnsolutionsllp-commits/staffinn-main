import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, AlertCircle, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { separationAPI } from '../services/api';

export default function Resignation() {
  const navigate = useNavigate();
  const [mySeparation, setMySeparation] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [form, setForm] = useState({ resignationReason: '', lastWorkingDate: '', noticePeriodDays: 30 });
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadMyResignation(); }, []);

  const loadMyResignation = async () => {
    setLoading(true);
    try {
      const r = await separationAPI.getMyResignation();
      if (r.data.success) setMySeparation(r.data.data.active);
    } catch {}
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.resignationReason.trim()) { setError('Please provide a resignation reason.'); return; }
    if (!form.lastWorkingDate)          { setError('Please select your last working date.'); return; }
    const lwd = new Date(form.lastWorkingDate);
    if (lwd <= new Date())              { setError('Last working date must be in the future.'); return; }
    setSubmitting(true);
    try {
      const r = await separationAPI.submitResignation(form);
      if (r.data.success) {
        setSuccess('Your resignation has been submitted successfully. HR will review and respond shortly.');
        setShowForm(false);
        loadMyResignation();
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to submit resignation. Please try again.');
    } finally { setSubmitting(false); }
  };

  const STATUS_STEPS = [
    { key: 'Initiated',        label: 'Submitted',       desc: 'Resignation received' },
    { key: 'Manager Approved', label: 'Manager Approved', desc: 'Manager accepted' },
    { key: 'HR Accepted',      label: 'HR Accepted',      desc: 'HR formally accepted' },
    { key: 'In Notice Period', label: 'Notice Period',    desc: 'Serving notice period' },
    { key: 'Completed',        label: 'Completed',        desc: 'Separation completed' }
  ];

  const currentStepIndex = (status) => STATUS_STEPS.findIndex(s => s.key === status);

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Resignation</h1>
          <p className="text-slate-500 text-sm mt-0.5">Submit and track your resignation status</p>
        </div>
        {!mySeparation && !showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            <LogOut size={16} /> Submit Resignation
          </button>
        )}
      </div>

      {/* Success / Error alerts */}
      {success && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
          <CheckCircle size={18} className="flex-shrink-0 mt-0.5" /><span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {/* Resignation Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-800">Submit Resignation</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <AlertCircle size={16} className="inline mr-2" />
            This action will initiate the formal resignation process. Your manager and HR will be notified.
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Resignation *</label>
            <textarea value={form.resignationReason} onChange={e => setForm({ ...form, resignationReason: e.target.value })} rows={4} placeholder="Please describe your reason for resignation..." className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Working Date *</label>
              <input type="date" value={form.lastWorkingDate} min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} onChange={e => setForm({ ...form, lastWorkingDate: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notice Period (Days)</label>
              <input type="number" min={0} value={form.noticePeriodDays} onChange={e => setForm({ ...form, noticePeriodDays: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowForm(false); setError(''); }} className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Resignation'}
            </button>
          </div>
        </div>
      )}

      {/* Active Separation Status */}
      {mySeparation && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-slate-800">Resignation Status</h2>
              <p className="text-xs text-slate-500 mt-0.5">Submitted on {new Date(mySeparation.resignationDate).toLocaleDateString('en-IN')}</p>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
              mySeparation.resignationStatus === 'Completed'       ? 'bg-green-100 text-green-800' :
              mySeparation.resignationStatus === 'Rejected'        ? 'bg-red-100 text-red-800' :
              mySeparation.resignationStatus === 'In Notice Period' ? 'bg-yellow-100 text-yellow-800' :
              'bg-indigo-100 text-indigo-800'
            }`}>{mySeparation.resignationStatus}</span>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              {STATUS_STEPS.map((step, idx) => {
                const curIdx = currentStepIndex(mySeparation.resignationStatus);
                const done   = idx < curIdx || mySeparation.resignationStatus === 'Completed';
                const active = idx === curIdx;
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-green-500 text-white' : active ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-gray-200 text-gray-400'}`}>
                        {done ? '✓' : idx + 1}
                      </div>
                      <p className="text-xs font-medium mt-1 text-center text-slate-600 max-w-16">{step.label}</p>
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div className="px-6 pb-6 grid grid-cols-2 gap-4 text-sm">
            {[
              ['Exit Type',         mySeparation.exitType || 'Resignation'],
              ['Last Working Date', mySeparation.lastWorkingDate ? new Date(mySeparation.lastWorkingDate).toLocaleDateString('en-IN') : '-'],
              ['Notice Period',     `${mySeparation.noticePeriod?.days || 0} days`],
              ['NDC Status',        mySeparation.ndcGenerated ? 'Generated' : 'Pending']
            ].map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500">{k}</p>
                <p className="font-semibold text-slate-800 mt-0.5">{v}</p>
              </div>
            ))}
          </div>

          {/* NDC Link */}
          {mySeparation.ndcGenerated && (
            <div className="px-6 pb-6">
              <button onClick={() => navigate(`/separation/${mySeparation.separationId}/ndc`)} className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-medium text-indigo-700 hover:bg-indigo-100">
                <span className="flex items-center gap-2"><CheckCircle size={16} />View No Dues Clearance Form</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* No separation and no form */}
      {!mySeparation && !showForm && (
        <div className="bg-white rounded-2xl border shadow-sm p-10 text-center">
          <LogOut size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No Active Resignation</h3>
          <p className="text-sm text-slate-400 mb-6">You don't have any active resignation record. If you wish to resign, click the button above.</p>
        </div>
      )}
    </div>
  );
}
