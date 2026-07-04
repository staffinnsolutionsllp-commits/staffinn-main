import { useState, useEffect } from 'react'
import { Users, Link as LinkIcon, Trash2, Plus, AlertCircle, CheckCircle, X } from 'lucide-react'
import { apiService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function EmployeeDeviceMapping() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<any[]>([])
  const [mappings, setMappings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [deviceUserId, setDeviceUserId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [empRes, mapRes] = await Promise.all([
        apiService.getEmployees(),
        apiService.getMappings()
      ])
      
      if (empRes.success) {
        setEmployees(empRes.data || [])
      }
      
      if (mapRes.success) {
        setMappings(mapRes.data || [])
      }
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError('Failed to load data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMapping = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedEmployee || !deviceUserId) {
      setError('Please select an employee and enter device user ID')
      return
    }

    try {
      const response = await apiService.createMapping({
        employeeId: selectedEmployee,
        deviceUserId: deviceUserId.trim()
      })

      if (response.success) {
        setSuccess('Mapping created successfully!')
        setSelectedEmployee('')
        setDeviceUserId('')
        setShowAddForm(false)
        await loadData()
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(response.message || 'Failed to create mapping')
      }
    } catch (err: any) {
      console.error('Error creating mapping:', err)
      setError(err.response?.data?.message || err.message || 'Failed to create mapping')
    }
  }

  const handleDeleteMapping = async (mappingId: string) => {
    if (!confirm('Are you sure you want to delete this mapping?')) {
      return
    }

    try {
      const response = await apiService.deleteMapping(mappingId)
      
      if (response.success) {
        setSuccess('Mapping deleted successfully!')
        await loadData()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(response.message || 'Failed to delete mapping')
      }
    } catch (err: any) {
      console.error('Error deleting mapping:', err)
      setError(err.message || 'Failed to delete mapping')
    }
  }

  const getMappedEmployeeIds = () => {
    return new Set(mappings.map(m => m.employeeId))
  }

  const getUnmappedEmployees = () => {
    const mappedIds = getMappedEmployeeIds()
    return employees.filter(emp => !mappedIds.has(emp.employeeId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mappings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee-Device Mapping</h2>
          <p className="text-gray-600">Map employee IDs to biometric device user IDs</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>Add Mapping</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="text-green-500" size={20} />
            <span className="text-green-700">{success}</span>
            <button 
              onClick={() => setSuccess('')}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-red-500" size={20} />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-blue-600 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">How to Map Employees</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Enroll employee fingerprint on the biometric device with a User ID (e.g., 1001)</li>
              <li>In HRMS, create a mapping between the Employee ID and Device User ID</li>
              <li>When employee punches, the system will automatically identify them</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Users className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <LinkIcon className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Mapped</p>
              <p className="text-2xl font-bold text-gray-900">{mappings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <AlertCircle className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unmapped</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length - mappings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Mapping Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Employee Mapping</h3>
              <button 
                onClick={() => {
                  setShowAddForm(false)
                  setError('')
                  setSelectedEmployee('')
                  setDeviceUserId('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMapping} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Employee *
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose an employee...</option>
                  {getUnmappedEmployees().map(emp => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.fullName || emp.name} ({emp.employeeId})
                    </option>
                  ))}
                </select>
                {getUnmappedEmployees().length === 0 && (
                  <p className="text-sm text-orange-600 mt-1">
                    All employees are already mapped
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device User ID *
                </label>
                <input
                  type="text"
                  value={deviceUserId}
                  onChange={(e) => setDeviceUserId(e.target.value)}
                  placeholder="e.g., 1001"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the User ID assigned to this employee on the biometric device
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setError('')
                    setSelectedEmployee('')
                    setDeviceUserId('')
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={getUnmappedEmployees().length === 0}
                >
                  Create Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mappings Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Existing Mappings</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mappings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <AlertCircle className="mx-auto mb-2" size={32} />
                    <p>No mappings configured yet</p>
                    <p className="text-sm">Click "Add Mapping" to get started</p>
                  </td>
                </tr>
              ) : (
                mappings.map(mapping => {
                  const employee = employees.find(e => e.employeeId === mapping.employeeId)
                  return (
                    <tr key={mapping.mappingId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {mapping.employeeId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {employee?.fullName || employee?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {employee?.department || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                          {mapping.deviceUserId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteMapping(mapping.mappingId)}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                          <span className="text-sm">Delete</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
