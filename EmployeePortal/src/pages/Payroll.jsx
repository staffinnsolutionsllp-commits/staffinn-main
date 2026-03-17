import { useState, useEffect } from 'react';
import { payrollAPI } from '../services/api';

export default function Payroll() {
  const [payslips, setPayslips] = useState([]);

  useEffect(() => {
    loadPayslips();
  }, []);

  const loadPayslips = async () => {
    try {
      const response = await payrollAPI.getMyPayslips();
      setPayslips(response.data.data);
    } catch (error) {
      console.error('Error loading payslips:', error);
    }
  };

  return (
    <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Payslips</h1>
          <p className="text-gray-600 mt-1">View your salary details and payslips</p>
        </div>

        <div className="space-y-4">
          {payslips.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
              No payslips found
            </div>
          ) : (
            payslips.map((payslip) => (
              <div key={payslip.payrollId} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{payslip.month} {payslip.year}</h3>
                    <p className="text-sm text-gray-600 mt-1">Payslip ID: {payslip.payrollId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">₹{payslip.netSalary?.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Net Salary</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Basic Salary</p>
                    <p className="font-semibold text-gray-900">₹{payslip.basicSalary?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Allowances</p>
                    <p className="font-semibold text-gray-900">₹{payslip.totalAllowances?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Deductions</p>
                    <p className="font-semibold text-red-600">-₹{payslip.totalDeductions?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      payslip.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payslip.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
    </div>
  );
}
