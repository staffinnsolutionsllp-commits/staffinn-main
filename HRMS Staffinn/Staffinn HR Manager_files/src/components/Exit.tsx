import  { useState } from 'react'
import { Plus, FileText, Download, X, AlertCircle } from 'lucide-react'
import { Employee } from '../types'
import { database } from '../store/database'

interface ExitRecord {
  id: string
  employeeId: string
  resignationDate: string
  lastWorkingDay: string
  reason: string
  exitInterviewCompleted: boolean
  fnfSettled: boolean
  relievingLetterGenerated: boolean
  status: 'initiated' | 'in-progress' | 'completed'
  createdAt: string
}

export default function Exit() {
  const [employees] = useState<Employee[]>(database.getEmployees())
  const [exitRecords, setExitRecords] = useState<ExitRecord[]>([])
  const [showInitiateForm, setShowInitiateForm] = useState(false)
  const [error, setError] = useState('')
  const [exitForm, setExitForm] = useState({
    employeeId: '',
    resignationDate: '',
    lastWorkingDay: '',
    reason: ''
  })

  const handleInitiateExit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!exitForm.employeeId || !exitForm.resignationDate || !exitForm.lastWorkingDay) {
      setError('Please fill all required fields')
      return
    }

    const newExitRecord: ExitRecord = {
      id: Date.now().toString(),
      ...exitForm,
      exitInterviewCompleted: false,
      fnfSettled: false,
      relievingLetterGenerated: false,
      status: 'initiated',
      createdAt: new Date().toISOString()
    }

    setExitRecords([...exitRecords, newExitRecord])
    setShowInitiateForm(false)
    setExitForm({
      employeeId: '',
      resignationDate: '',
      lastWorkingDay: '',
      reason: ''
    })
  }

  const updateExitProcess = (id: string, field: keyof ExitRecord, value: any) => {
    setExitRecords(records => 
      records.map(record => {
        if (record.id === id) {
          const updated = { ...record, [field]: value }
          // Auto-update status based on completion
          if (updated.exitInterviewCompleted && updated.fnfSettled && updated.relievingLetterGenerated) {
            updated.status = 'completed'
          } else if (updated.exitInterviewCompleted || updated.fnfSettled || updated.relievingLetterGenerated) {
            updated.status = 'in-progress'
          }
          return updated
        }
        return record
      })
    )
  }

  const handleGenerateDocument = (type: string, employeeName: string) => {
    alert(`${type} generated successfully for ${employeeName}. In a real system, this would generate and download the document.`)
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? employee.name : 'Unknown'
  }

  const getStatusCounts = () => {
    return {
      total: exitRecords.length,
      initiated: exitRecords.filter(r => r.status === 'initiated').length,
      inProgress: exitRecords.filter(r => r.status === 'in-progress').length,
      completed: exitRecords.filter(r => r.status === 'completed').length
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exit Management</h1>
          <p className="text-gray-600">Manage employee resignations and exit processes</p>
        </div>
        <button 
          onClick={() => setShowInitiateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>Initiate Exit</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Exits', count: statusCounts.total, color: 'bg-gray-500' },
          { label: 'Initiated', count: statusCounts.initiated, color: 'bg-blue-500' },
          { label: 'In Progress', count: statusCounts.inProgress, color: 'bg-yellow-500' },
          { label: 'Completed', count: statusCounts.completed, color: 'bg-green-500' }
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <FileText size={24} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Exit Records</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resignation Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Working Day</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exit Interview</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">F&F Settled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Relieving Letter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {exitRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{getEmployeeName(record.employeeId)}</div>
                      <div className="text-sm text-gray-500">{record.reason}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{record.resignationDate}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{record.lastWorkingDay}</td>
                  <td className="px-6 py-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={record.exitInterviewCompleted}
                        onChange={(e) => updateExitProcess(record.id, 'exitInterviewCompleted', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">{record.exitInterviewCompleted ? 'Completed' : 'Pending'}</span>
                    </label>
                  </td>
                  <td className="px-6 py-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={record.fnfSettled}
                        onChange={(e) => updateExitProcess(record.id, 'fnfSettled', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">{record.fnfSettled ? 'Settled' : 'Pending'}</span>
                    </label>
                  </td>
                  <td className="px-6 py-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={record.relievingLetterGenerated}
                        onChange={(e) => updateExitProcess(record.id, 'relievingLetterGenerated', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">{record.relievingLetterGenerated ? 'Generated' : 'Pending'}</span>
                    </label>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      record.status === 'completed' ? 'bg-green-100 text-green-800' :
                      record.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button 
                      onClick={() => handleGenerateDocument('Relieving Letter', getEmployeeName(record.employeeId))}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Download size={12} />
                      <span>Generate</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {exitRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No exit records found. Initiate an exit process to get started.
            </div>
          )}
        </div>
      </div>

      {showInitiateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Initiate Exit Process</h3>
              <button 
                onClick={() => setShowInitiateForm(false)}
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

            <form onSubmit={handleInitiateExit} className="space-y-4">
              <select
                value={exitForm.employeeId}
                onChange={(e) => setExitForm({ ...exitForm, employeeId: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position}
                  </option>
                ))}
              </select>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resignation Date
                </label>
                <input
                  type="date"
                  value={exitForm.resignationDate}
                  onChange={(e) => setExitForm({ ...exitForm, resignationDate: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Working Day
                </label>
                <input
                  type="date"
                  value={exitForm.lastWorkingDay}
                  onChange={(e) => setExitForm({ ...exitForm, lastWorkingDay: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min={exitForm.resignationDate}
                />
              </div>
              <textarea
                placeholder="Reason for leaving"
                value={exitForm.reason}
                onChange={(e) => setExitForm({ ...exitForm, reason: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                rows={3}
              />
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInitiateForm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Initiate Exit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 