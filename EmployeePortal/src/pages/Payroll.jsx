import { useState, useEffect } from 'react';
import { payrollAPI } from '../services/api';
import { IndianRupee, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

export default function Payroll() {
  const [payslips, setPayslips] = useState([]);

  useEffect(() => { loadPayslips(); }, []);

  const loadPayslips = async () => {
    try {
      const response = await payrollAPI.getMyPayslips();
      setPayslips(response.data.data);
    } catch (error) {
      console.error('Error loading payslips:', error);
    }
  };

  return (
    <div className="p-8 space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll & Payslips</h1>
        <p className="text-slate-500 text-sm mt-0.5">View your salary details and download payslips</p>
      </div>

      {payslips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 gap-4">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
            <Wallet size={26} className="text-slate-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-700">No payslips found</p>
            <p className="text-sm text-slate-400 mt-1">Your payslips will appear here once processed.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {payslips.map((payslip) => (
            <div key={payslip.payrollId} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden card-hover">
              {/* Card header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900">{payslip.month} {payslip.year}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">ID: {payslip.payrollId}</p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="text-2xl font-black text-emerald-600">₹{payslip.netSalary?.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Net Salary</p>
                  </div>
                  <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                    payslip.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {payslip.status}
                  </span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100">
                <PayItem icon={<Wallet size={14} className="text-slate-500" />}    label="Basic Salary"  value={`₹${payslip.basicSalary?.toLocaleString()}`} />
                <PayItem icon={<TrendingUp size={14} className="text-emerald-500" />} label="Allowances"  value={`₹${payslip.totalAllowances?.toLocaleString()}`} valueColor="text-emerald-600" />
                <PayItem icon={<TrendingDown size={14} className="text-red-400" />}   label="Deductions"  value={`-₹${payslip.totalDeductions?.toLocaleString()}`} valueColor="text-red-500" />
                <PayItem icon={<IndianRupee size={14} className="text-indigo-500" />} label="Net Salary"  value={`₹${payslip.netSalary?.toLocaleString()}`} valueColor="text-indigo-600" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PayItem({ icon, label, value, valueColor = 'text-slate-900' }) {
  return (
    <div className="bg-white px-5 py-4">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>
      <p className={`font-bold text-sm ${valueColor}`}>{value}</p>
    </div>
  );
}
