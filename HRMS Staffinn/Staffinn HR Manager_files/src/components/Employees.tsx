import  { useState, useRef } from 'react'
import { Plus, Search, Edit, Trash, Upload, X, Download, AlertCircle } from 'lucide-react'
import { Employee } from '../types'
import { database } from '../store/database'
import { useAuth } from '../contexts/AuthContext'
import { validateEmail } from '../utils/auth'

export default function Employees() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>(database.getEmployees())
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    salary: 0
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required')
      return false
    }
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }
    if (!formData.position.trim()) {
      setError('Position is required')
      return false
    }
    if (!formData.department.trim()) {
      setError('Department is required')
      return false
    }
    if (formData.salary <= 0) {
      setError('Please enter a valid salary')
      return false
    }

    // Check for duplicate email
    const existingEmployee = employees.find(emp => 
      emp.email === formData.email && (!editingEmployee || emp.id !== editingEmployee.id)
    )
    if (existingEmployee) {
      setError('An employee with this email already exists')
      return false
    }

    return true
  }

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm() || !user) return

    try {
      const newEmployee = database.createEmployee({
        ...formData,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active',
        createdBy: user.id
      })
      setEmployees(database.getEmployees())
      setShowAddForm(false)
      setFormData({ name: '', email: '', position: '', department: '', salary: 0 })
    } catch (err) {
      setError('Failed to add employee')
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email,
      position: employee.position,
      department: employee.department,
      salary: employee.salary
    })
    setShowAddForm(true)
  }

  const handleUpdateEmployee = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm() || !editingEmployee) return

    try {
      database.updateEmployee(editingEmployee.id, formData)
      setEmployees(database.getEmployees())
      setShowAddForm(false)
      setEditingEmployee(null)
      setFormData({ name: '', email: '', position: '', department: '', salary: 0 })
    } catch (err) {
      setError('Failed to update employee')
    }
  }

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      try {
        database.deleteEmployee(id)
        setEmployees(database.getEmployees())
      } catch (err) {
        alert('Failed to delete employee')
      }
    }
  }

  const handleBulkImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          alert('CSV file must contain a header row and at least one data row')
          return
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const requiredHeaders = ['name', 'email', 'position', 'department', 'salary']
        
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
        if (missingHeaders.length > 0) {
          alert(`Missing required columns: ${missingHeaders.join(', ')}`)
          return
        }

        const employeesToAdd = []
        const errors = []

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim())
          const employee: any = {}
          
          headers.forEach((header, index) => {
            if (values[index]) {
              employee[header] = header === 'salary' ? parseFloat(values[index]) : values[index]
            }
          })

          // Validate each employee
          if (!employee.name || !employee.email || !employee.position || !employee.department || !employee.salary) {
            errors.push(`Row ${i + 1}: Missing required fields`)
            continue
          }

          if (!validateEmail(employee.email)) {
            errors.push(`Row ${i + 1}: Invalid email format`)
            continue
          }

          if (employee.salary <= 0) {
            errors.push(`Row ${i + 1}: Invalid salary`)
            continue
          }

          employeesToAdd.push({
            name: employee.name,
            email: employee.email,
            position: employee.position,
            department: employee.department,
            salary: employee.salary,
            joinDate: new Date().toISOString().split('T')[0],
            status: 'active' as const
          })
        }

        if (errors.length > 0) {
          alert(`Import completed with errors:\n${errors.join('\n')}`)
        }

        if (employeesToAdd.length > 0) {
          database.bulkCreateEmployees(employeesToAdd, user.id)
          setEmployees(database.getEmployees())
          alert(`Successfully imported ${employeesToAdd.length} employees`)
        }
      } catch (err) {
        alert('Failed to parse CSV file. Please check the format.')
      }
    }
    reader.readAsText(file)
  }

  const handleExportEmployees = () => {
    const csvContent = [
      'Name,Email,Position,Department,Salary,Join Date,Status',
      ...employees.map(emp => 
        `"${emp.name}","${emp.email}","${emp.position}","${emp.department}",${emp.salary},"${emp.joinDate}","${emp.status}"`
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const resetForm = () => {
    setShowAddForm(false)
    setEditingEmployee(null)
    setError('')
    setFormData({ name: '', email: '', position: '', department: '', salary: 0 })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600">Manage your workforce efficiently</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleExportEmployees}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          <button 
            onClick={handleBulkImport}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Upload size={16} />
            <span>Bulk Import</span>
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Join Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{employee.position}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{employee.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">₹{employee.salary.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{employee.joinDate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditEmployee(employee)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit Employee"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Employee"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No employees found matching your search.' : 'No employees added yet.'}
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <button 
                onClick={resetForm}
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

            <form onSubmit={editingEmployee ? handleUpdateEmployee : handleAddEmployee} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Position *"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Department *"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                placeholder="Annual Salary *"
                value={formData.salary || ''}
                onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingEmployee ? 'Update' : 'Add'} Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 