import { useState, useEffect } from 'react'
import { Play, Download, CreditCard, Calendar, Users, TrendingUp, AlertCircle, FileText, Eye } from 'lucide-react'
import { apiService } from '../services/api'

interface PayrollRecord {
  payrollRecordId: string
  month: string
  employeeId: string
  employeeName: string
  department: string
  designation: string
  basicSalary: number
  salaryType: string
  totalWorkingDays: number
  daysPresent: number
  daysAbsent: number
  halfDays: number
  paidLeaves: number
  unpaidLeaves: number
  overtimeHours: number
  allowances: Array<{
    name: string
    amount: number
    type: string
    taxable: boolean
  }>
  bonus: number
  overtime: number
  totalEarnings: number
  deductions: Array<{
    name: string
    amount: number
    type: string
  }>
  totalDeductions: number
  netSalary: number
  paymentStatus: string
  paymentDate: string | null
  createdAt: string
}

interface PayrollSummary {
  totalRecords: number
  totalGrossSalary: number
  totalDeductions: number
  totalNetSalary: number
  pendingPayments: number
  paidPayments: number
}

export default function Payroll() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7))
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [summary, setSummary] = useState<PayrollSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    loadPayrollData()
  }, [selectedMonth])

  const loadPayrollData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Load payroll records for selected month
      const recordsResponse = await apiService.getPayrollByMonth(selectedMonth)
      if (recordsResponse.success) {
        setPayrollRecords(recordsResponse.data || [])
      }

      // Load summary
      const summaryResponse = await apiService.getPayrollSummary(selectedMonth)
      if (summaryResponse.success) {
        setSummary(summaryResponse.data)
      }
    } catch (err: any) {
      console.error('Error loading payroll data:', err)
      setError(err.message || 'Failed to load payroll data')
    } finally {
      setLoading(false)
    }
  }

  const handleRunPayroll = async () => {
    if (!confirm(`Are you sure you want to run payroll for ${selectedMonth}? This will process salary for all active employees.`)) {
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const response = await apiService.runPayroll(selectedMonth)
      
      if (response.success) {
        setSuccess(`Payroll processed successfully! ${response.data.totalEmployees} employees processed.`)
        await loadPayrollData()
      } else {
        setError(response.message || 'Failed to run payroll')
      }
    } catch (err: any) {
      console.error('Error running payroll:', err)
      setError(err.message || 'Failed to run payroll')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (record: PayrollRecord) => {
    setSelectedRecord(record)
    setShowDetailModal(true)
  }

  const handleDownloadPayslip = (record: PayrollRecord) => {
    // Generate payslip content
    const payslipContent = `
PAYSLIP - ${record.month}
=====================================

Employee Details:
Name: ${record.employeeName}
ID: ${record.employeeId}
Department: ${record.department}
Designation: ${record.designation}

Attendance Summary:
Total Working Days: ${record.totalWorkingDays}
Days Present: ${record.daysPresent}
Days Absent: ${record.daysAbsent}
Paid Leaves: ${record.paidLeaves}
Unpaid Leaves: ${record.unpaidLeaves}
Overtime Hours: ${record.overtimeHours}

EARNINGS:
Basic Salary: ₹${record.basicSalary.toLocaleString()}
${record.allowances.map(a => `${a.name}: ₹${a.amount.toLocaleString()}`).join('\n')}
Bonus: ₹${record.bonus.toLocaleString()}
Overtime: ₹${record.overtime.toLocaleString()}
-----------------------------------
Total Earnings: ₹${record.totalEarnings.toLocaleString()}

DEDUCTIONS:
${record.deductions.map(d => `${d.name}: ₹${d.amount.toLocaleString()}`).join('\n')}
-----------------------------------
Total Deductions: ₹${record.totalDeductions.toLocaleString()}

NET SALARY: ₹${record.netSalary.toLocaleString()}

Payment Status: ${record.paymentStatus.toUpperCase()}
Generated: ${new Date(record.createdAt).toLocaleString()}
    `.trim()

    const blob = new Blob([payslipContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Payslip_${record.employeeName}_${record.month}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportPayroll = () => {
    if (payrollRecords.length === 0) {
      alert('No payroll records to export')
      return
    }

    const csvContent = [
      'Employee ID,Employee Name,Department,Designation,Basic Salary,Total Earnings,Total Deductions,Net Salary,Payment Status',
      ...payrollRecords.map(record => 
        `"${record.employeeId}","${record.employeeName}","${record.department}","${record.designation}",${record.basicSalary},${record.totalEarnings},${record.totalDeductions},${record.netSalary},"${record.paymentStatus}"`
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Payroll_${selectedMonth}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600">Automated salary processing and payslip generation</p>
        </div>
        <div className="flex space-x-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={handleExportPayroll}
            disabled={payrollRecords.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          <button 
            onClick={handleRunPayroll}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Play size={16} />
            <span>{loading ? 'Processing...' : 'Run Payroll'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-4 text-red-700 bg-red-100 border border-red-300 rounded-lg">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 p-4 text-green-700 bg-green-100 border border-green-300 rounded-lg">
          <AlertCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalRecords}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Gross Salary</p>
                <p className="text-2xl font-bold text-gray-900">₹{summary.totalGrossSalary.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-100 rounded-full">
                <CreditCard className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Deductions</p>
                <p className="text-2xl font-bold text-gray-900">₹{summary.totalDeductions.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <CreditCard className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Payable</p>
                <p className="text-2xl font-bold text-gray-900">₹{summary.totalNetSalary.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Payroll Records - {selectedMonth}</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>{payrollRecords.length} records</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Present</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payrollRecords.map((record) => (
                <tr key={record.payrollRecordId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{record.employeeName}</div>
                      <div className="text-sm text-gray-500">{record.employeeId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{record.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {record.daysPresent}/{record.totalWorkingDays}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ₹{record.totalEarnings.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600">
                    ₹{record.totalDeductions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">
                    ₹{record.netSalary.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      record.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(record)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownloadPayslip(record)}
                        className="text-green-600 hover:text-green-800"
                        title="Download Payslip"
                      >
                        <FileText size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payrollRecords.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No payroll records for {selectedMonth}</p>
              <p className="text-sm mt-2">Click "Run Payroll" to process salaries for this month</p>
            </div>
          )}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading payroll data...</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Payslip Details - {selectedRecord.month}</h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Employee Info */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-2">Employee Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{selectedRecord.employeeName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">ID:</span>
                    <span className="ml-2 font-medium">{selectedRecord.employeeId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Department:</span>
                    <span className="ml-2 font-medium">{selectedRecord.department}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Designation:</span>
                    <span className="ml-2 font-medium">{selectedRecord.designation}</span>
                  </div>
                </div>
              </div>

              {/* Attendance */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-2">Attendance Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Working Days:</span>
                    <span className="ml-2 font-medium">{selectedRecord.totalWorkingDays}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Present:</span>
                    <span className="ml-2 font-medium text-green-600">{selectedRecord.daysPresent}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Absent:</span>
                    <span className="ml-2 font-medium text-red-600">{selectedRecord.daysAbsent}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Paid Leaves:</span>
                    <span className="ml-2 font-medium">{selectedRecord.paidLeaves}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Unpaid Leaves:</span>
                    <span className="ml-2 font-medium text-red-600">{selectedRecord.unpaidLeaves}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Overtime:</span>
                    <span className="ml-2 font-medium text-blue-600">{selectedRecord.overtimeHours}h</span>
                  </div>
                </div>
              </div>

              {/* Earnings */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-2 text-green-700">Earnings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Basic Salary</span>
                    <span className="font-medium">₹{selectedRecord.basicSalary.toLocaleString()}</span>
                  </div>
                  {selectedRecord.allowances.map((allowance, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{allowance.name} ({allowance.type})</span>
                      <span className="font-medium">₹{allowance.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {selectedRecord.bonus > 0 && (
                    <div className="flex justify-between">
                      <span>Bonus</span>
                      <span className="font-medium">₹{selectedRecord.bonus.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedRecord.overtime > 0 && (
                    <div className="flex justify-between">
                      <span>Overtime</span>
                      <span className="font-medium">₹{selectedRecord.overtime.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total Earnings</span>
                    <span className="text-green-600">₹{selectedRecord.totalEarnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-2 text-red-700">Deductions</h4>
                <div className="space-y-2 text-sm">
                  {selectedRecord.deductions.map((deduction, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{deduction.name} ({deduction.type})</span>
                      <span className="font-medium">₹{deduction.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total Deductions</span>
                    <span className="text-red-600">₹{selectedRecord.totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Net Salary</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ₹{selectedRecord.netSalary.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Payment Status: <span className={`font-medium ${
                    selectedRecord.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                  }`}>{selectedRecord.paymentStatus.toUpperCase()}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleDownloadPayslip(selectedRecord)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Download Payslip
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
