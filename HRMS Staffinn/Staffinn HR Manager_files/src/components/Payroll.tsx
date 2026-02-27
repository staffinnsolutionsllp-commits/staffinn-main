import  { useState } from 'react'
import { Plus, Download, CreditCard, X, AlertCircle } from 'lucide-react'
import { Employee } from '../types'
import { database } from '../store/database'

interface PayrollRecord {
  id: string
  employeeId: string
  month: string
  basicSalary: number
  allowances: number
  deductions: number
  netSalary: number
  status: 'draft' | 'processed' | 'paid'
  generatedAt: string
}

export default function Payroll() {
  const [employees] = useState<Employee[]>(database.getEmployees())
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [error, setError] = useState('')
  const [salaryForm, setSalaryForm] = useState({
    employeeId: '',
    month: new Date().toISOString().substring(0, 7),
    allowances: 0,
    deductions: 0
  })

  const handleGeneratePayroll = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!salaryForm.employeeId || !salaryForm.month) {
      setError('Please select employee and month')
      return
    }

    const employee = employees.find(emp => emp.id === salaryForm.employeeId)
    if (!employee) {
      setError('Employee not found')
      return
    }

    const basicSalary = employee.salary / 12 // Convert annual to monthly
    const netSalary = basicSalary + salaryForm.allowances - salaryForm.deductions

    const newRecord: PayrollRecord = {
      id: Date.now().toString(),
      employeeId: salaryForm.employeeId,
      month: salaryForm.month,
      basicSalary,
      allowances: salaryForm.allowances,
      deductions: salaryForm.deductions,
      netSalary,
      status: 'draft',
      generatedAt: new Date().toISOString()
    }

    setPayrollRecords([...payrollRecords, newRecord])
    setShowGenerateForm(false)
    setSalaryForm({
      employeeId: '',
      month: new Date().toISOString().substring(0, 7),
      allowances: 0,
      deductions: 0
    })
  }

  const handleStatusUpdate = (id: string, status: PayrollRecord['status']) => {
    setPayrollRecords(records => 
      records.map(record => 
        record.id === id ? { ...record, status } : record
      )
    )
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? employee.name : 'Unknown'
  }

  const totalPayroll = payrollRecords
    .filter(record => record.status === 'paid')
    .reduce((sum, record) => sum + record.netSalary, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600">Manage employee salaries and payroll processing</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download size={16} />
            <span>Export Payroll</span>
          </button>
          <button 
            onClick={() => setShowGenerateForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            <span>Generate Payroll</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <CreditCard className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <CreditCard className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Processed Payroll</p>
              <p className="text-2xl font-bold text-gray-900">{payrollRecords.filter(r => r.status === 'paid').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <CreditCard className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Disbursed</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalPayroll.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Payroll Records</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allowances</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payrollRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{getEmployeeName(record.employeeId)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{record.month}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">₹{record.basicSalary.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">₹{record.allowances.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">₹{record.deductions.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{record.netSalary.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <select
                      value={record.status}
                      onChange={(e) => handleStatusUpdate(record.id, e.target.value as PayrollRecord['status'])}
                      className={`px-2 py-1 text-xs rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${
                        record.status === 'paid' ? 'bg-green-100 text-green-800' :
                        record.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="draft">Draft</option>
                      <option value="processed">Processed</option>
                      <option value="paid">Paid</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payrollRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No payroll records generated yet.
            </div>
          )}
        </div>
      </div>

      {showGenerateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Generate Payroll</h3>
              <button 
                onClick={() => setShowGenerateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 flex items-center space-x-2 p-3 text-red-700 bg-red-100 border border-red-300 rounded-lg">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleGeneratePayroll} className="space-y-4">
              <select
                value={salaryForm.employeeId}
                onChange={(e) => setSalaryForm({ ...salaryForm, employeeId: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - ₹{(employee.salary / 12).toLocaleString()}/month
                  </option>
                ))}
              </select>
              <input
                type="month"
                value={salaryForm.month}
                onChange={(e) => setSalaryForm({ ...salaryForm, month: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                placeholder="Allowances"
                value={salaryForm.allowances || ''}
                onChange={(e) => setSalaryForm({ ...salaryForm, allowances: parseInt(e.target.value) || 0 })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              <input
                type="number"
                placeholder="Deductions"
                value={salaryForm.deductions || ''}
                onChange={(e) => setSalaryForm({ ...salaryForm, deductions: parseInt(e.target.value) || 0 })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateForm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 