import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, X, AlertCircle, FileCheck } from 'lucide-react';
import { separationAPI } from '../services/api';

const StatusIcon = ({ status }) => {
  if (status === 'Approved') return <CheckCircle size={18} className="text-green-500" />;
  if (status === 'Rejected') return <X size={18} className="text-red-500" />;
  return <Clock size={18} className="text-yellow-500" />;
};

const StatusBadge = ({ status }) => {
  const map = {
    'Approved':  'bg-green-100 text-green-800',
    'Cleared':   'bg-green-100 text-green-800',
    'Rejected':  'bg-red-100 text-red-800',
    'Not Cleared': 'bg-red-100 text-red-800',
    'Pending':   'bg-gray-100 text-gray-600',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'All Departments Cleared': 'bg-emerald-100 text-emerald-800'
  };
  return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
};

export default function NoDuesClearance() {
  const { separationId } = useParams();
  const navigate         = useNavigate();
  const [ndc,      setNDC]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [signing,  setSigning]  = useState(false);
  const [signed,   setSigned]   = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => { loadNDC(); }, [separationId]);

  const loadNDC = async () => {
    setLoading(true);
    try {
      const r = await separationAPI.getMyNDC(separationId);
      if (r.data.success) {
        setNDC(r.data.data);
        setSigned(r.data.data.employeeDeclaration?.signed || false);
      }
    } catch { setError('Failed to load No Dues Clearance form.'); }
    finally   { setLoading(false); }
  };

  const handleSign = async () => {
    if (!window.confirm('By clicking confirm, you agree to the declaration statement. This action cannot be undone.')) return;
    setSigning(true);
    try {
      const r = await separationAPI.submitDeclaration(separationId);
      if (r.data.success) { setSigned(true); loadNDC(); }
    } catch { setError('Failed to submit declaration.'); }
    finally   { setSigning(false); }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );

  if (error || !ndc) return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate('/resignation')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-4"><ArrowLeft size={16} />Back</button>
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">{error || 'NDC not found.'}</div>
    </div>
  );

  const emp = ndc.employeeDetails || {};
  const DEPTS = [
    { key: 'itClearance',       label: 'IT & Administration' },
    { key: 'mediaClearance',    label: 'Media Department' },
    { key: 'projectClearance',  label: 'Project Department' },
    { key: 'accountsClearance', label: 'Accounts Department' },
    { key: 'hrClearance',       label: 'HR Department' }
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate('/resignation')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm">
        <ArrowLeft size={16} />Back to Resignation
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileCheck size={22} className="text-indigo-600" />
              <h1 className="text-xl font-bold text-slate-900">Employee No Dues Clearance</h1>
            </div>
            <p className="text-xs text-slate-400">Auto Generated · Read Only</p>
          </div>
          <StatusBadge status={ndc.overallStatus || 'In Progress'} />
        </div>
      </div>

      {/* Employee Details */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Employee Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Employee Name',     emp.employeeName || '-'],
            ['Employee ID',       emp.employeeId   || '-'],
            ['Department',        emp.department   || '-'],
            ['Designation',       emp.designation  || '-'],
            ['Date of Joining',   emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString('en-IN') : '-'],
            ['Last Working Date', emp.lastWorkingDate ? new Date(emp.lastWorkingDate).toLocaleDateString('en-IN') : '-'],
            ['Reporting Manager', emp.reportingManager || '-'],
            ['Exit Type',         emp.exitType || '-']
          ].map(([k, v]) => (
            <div key={k} className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">{k}</p>
              <p className="font-semibold text-slate-800 mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Department Clearance Status */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Department Clearance Status</h2>
        <div className="space-y-3">
          {DEPTS.map(d => {
            const dept   = ndc[d.key] || {};
            const status = dept.status || 'Pending';
            return (
              <div key={d.key} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50">
                <div className="flex items-center gap-3">
                  <StatusIcon status={status} />
                  <span className="text-sm font-medium text-slate-700">{d.label}</span>
                  {dept.approvedByName && status !== 'Pending' && (
                    <span className="text-xs text-slate-400">by {dept.approvedByName}</span>
                  )}
                </div>
                <StatusBadge status={status} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Summary (Accounts) */}
      {ndc.accountsClearance?.financialSummary && (
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Financial Summary</h2>
          <div className="border rounded-xl overflow-hidden text-sm">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Particular</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  ['Salary Payable',         ndc.accountsClearance.financialSummary.salaryPayable],
                  ['Expense Claims Pending', ndc.accountsClearance.financialSummary.expenseClaimsPending],
                  ['Advance Outstanding',    ndc.accountsClearance.financialSummary.advanceOutstanding],
                  ['Loan Recovery',          ndc.accountsClearance.financialSummary.loanRecovery],
                  ['Asset Recovery',         ndc.accountsClearance.financialSummary.assetRecovery]
                ].map(([label, val]) => (
                  <tr key={label}>
                    <td className="px-4 py-3 text-slate-700">{label}</td>
                    <td className="px-4 py-3 text-right text-slate-800">₹{(val || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                <tr className="bg-green-50 font-bold">
                  <td className="px-4 py-3 text-green-800">Full & Final Amount</td>
                  <td className="px-4 py-3 text-right text-green-800 text-base">₹{(ndc.accountsClearance.financialSummary.fullFinalAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Declaration */}
      <div className={`rounded-2xl border shadow-sm p-6 ${signed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <h2 className={`font-semibold mb-3 ${signed ? 'text-green-800' : 'text-amber-800'}`}>Employee Declaration</h2>
        <p className={`text-sm italic mb-4 ${signed ? 'text-green-700' : 'text-amber-700'}`}>
          "{ndc.employeeDeclaration?.text}"
        </p>
        {signed ? (
          <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
            <CheckCircle size={18} />
            Signed on {ndc.employeeDeclaration?.signedAt ? new Date(ndc.employeeDeclaration.signedAt).toLocaleDateString('en-IN') : '-'}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-100 rounded-lg p-3">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              By signing, you confirm the above declaration is true and accurate.
            </div>
            <button onClick={handleSign} disabled={signing} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {signing ? 'Signing...' : 'Sign Declaration'}
            </button>
          </div>
        )}
      </div>

      {/* Final HR Approval */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Final HR Approval</h2>
        {ndc.finalClearance?.status === 'Cleared' || ndc.finalClearance?.status === 'Not Cleared' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <StatusBadge status={ndc.finalClearance.status} />
              {ndc.finalClearance.approvedByName && <span className="text-sm text-slate-500">by {ndc.finalClearance.approvedByName}</span>}
              {ndc.finalClearance.approvedAt && <span className="text-sm text-slate-400">{new Date(ndc.finalClearance.approvedAt).toLocaleDateString('en-IN')}</span>}
            </div>
            {ndc.finalClearance.reason && <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{ndc.finalClearance.reason}</p>}
          </div>
        ) : (
          <p className="text-sm text-slate-400 flex items-center gap-2"><Clock size={16} className="text-yellow-500" />Awaiting final HR approval after all departments clear.</p>
        )}
      </div>
    </div>
  );
}
