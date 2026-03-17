import { useState, useEffect } from 'react'
import { Plus, X, AlertCircle, Upload, User, Briefcase, Building2, DollarSign, FileText, Shield, Trash2, Edit2, Eye } from 'lucide-react'
import { apiService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

interface Employee {
  employeeId: string
  name?: string
  fullName?: string
  email: string
  position?: string
  designation?: string
  department: string
  profilePictureUrl?: string
  teamName?: string
  isPeopleManager?: string
}

export default function Onboarding() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [managers, setManagers] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [viewingEmployee, setViewingEmployee] = useState<any | null>(null)
  const [showCredentials, setShowCredentials] = useState<{email: string, password: string} | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState('')

  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    // Employee ID
    employeeId: '',
    
    // Basic Info
    fullName: '',
    preferredName: '',
    gender: '',
    dateOfBirth: '',
    maritalStatus: '',
    bloodGroup: '',
    profilePictureUrl: '',
    
    // Contact
    personalMobile: '',
    personalEmail: '',
    officialEmail: '',
    currentAddress: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    emergencyContactRelation: '',
    
    // Identification
    aadhaarNumber: '',
    panNumber: '',
    uanNumber: '',
    
    // Banking
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    
    // Employment
    employmentType: 'Full-Time',
    department: '',
    designation: '',
    gradeLevel: '',
    dateOfJoining: '',
    probationPeriod: '3',
    workLocation: '',
    shiftTiming: 'Fixed',
    checkInTime: '09:00',
    checkOutTime: '18:00',
    reportingManagerId: '',
    
    // Organogram
    roleLevel: 'Manager',
    isPeopleManager: 'No',
    teamName: '',
    
    // Compensation
    annualCTC: '',
    basicPay: '',
    basicSalary: '',
    salaryType: 'Monthly',
    paymentCycle: 'Monthly',
    hra: '',
    pfApplicable: 'Yes',
    bonus: '',
    overtimeRate: '',
    
    // System Access
    hrmsAccess: 'Yes',
    roleBasedAccess: 'Employee',
    
    // Documents
    aadhaarCardUrl: '',
    panCardUrl: '',
    educationCertificateUrl: '',
    experienceLetterUrl: '',
    relievingLetterUrl: '',
    passportPhotoUrl: '',
    bankStatementUrl: '',
    otherDocumentUrl: ''
  })

  const [allowances, setAllowances] = useState<Array<{name: string, amount: string, type: string, taxable: string, carryForward: string}>>([])
  const [deductions, setDeductions] = useState<Array<{name: string, amount: string, type: string}>>([])
  const [documentFiles, setDocumentFiles] = useState<{[key: string]: File | null}>({})
  const [uploadingDocs, setUploadingDocs] = useState(false)

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const response = await apiService.getEmployees()
      if (response.success) {
        setEmployees(response.data)
        setManagers(response.data)
      }
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee? This will also remove them from the organogram.')) {
      return
    }

    try {
      await apiService.deleteEmployee(employeeId)
      
      const orgResponse = await apiService.getOrganizationChart()
      if (orgResponse.success) {
        const orgNode = orgResponse.data.nodes.find((node: any) => node.employeeId === employeeId)
        if (orgNode) {
          await apiService.deleteOrgNode(orgNode.nodeId)
        }
      }
      
      await loadEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('Failed to delete employee')
    }
  }

  const handleEditEmployee = async (employee: Employee) => {
    try {
      const response = await apiService.getEmployees()
      if (response.success) {
        const fullData = response.data.find((e: any) => e.employeeId === employee.employeeId)
        if (!fullData) {
          alert('Employee data not found')
          return
        }
        
        setEditingEmployee(employee)
        setFormData({
          employeeId: fullData.employeeId || '',
          fullName: fullData.fullName || fullData.name || '',
          preferredName: fullData.preferredName || '',
          gender: fullData.gender || '',
          dateOfBirth: fullData.dateOfBirth || '',
          maritalStatus: fullData.maritalStatus || '',
          bloodGroup: fullData.bloodGroup || '',
          profilePictureUrl: fullData.profilePictureUrl || '',
          personalMobile: fullData.personalMobile || fullData.phone || '',
          personalEmail: fullData.personalEmail || fullData.email || '',
          officialEmail: fullData.officialEmail || fullData.email || '',
          currentAddress: fullData.currentAddress || '',
          emergencyContactName: fullData.emergencyContactName || '',
          emergencyContactNumber: fullData.emergencyContactNumber || '',
          emergencyContactRelation: fullData.emergencyContactRelation || '',
          aadhaarNumber: fullData.aadhaarNumber || '',
          panNumber: fullData.panNumber || '',
          uanNumber: fullData.uanNumber || '',
          bankName: fullData.bankName || '',
          accountNumber: fullData.accountNumber || '',
          ifscCode: fullData.ifscCode || '',
          employmentType: fullData.employmentType || 'Full-Time',
          department: fullData.department || '',
          designation: fullData.designation || fullData.position || '',
          gradeLevel: fullData.gradeLevel || '',
          dateOfJoining: fullData.dateOfJoining || '',
          probationPeriod: fullData.probationPeriod || '3',
          workLocation: fullData.workLocation || '',
          shiftTiming: fullData.shiftTiming || 'Fixed',
          checkInTime: fullData.checkInTime || '09:00',
          checkOutTime: fullData.checkOutTime || '18:00',
          reportingManagerId: fullData.reportingManagerId || fullData.managerId || '',
          roleLevel: fullData.roleLevel || 'Manager',
          isPeopleManager: fullData.isPeopleManager || 'No',
          teamName: fullData.teamName || '',
          annualCTC: fullData.annualCTC?.toString() || fullData.salary?.toString() || '',
          basicPay: fullData.basicPay?.toString() || fullData.basicSalary?.toString() || '',
          basicSalary: fullData.basicSalary?.toString() || fullData.basicPay?.toString() || '',
          salaryType: fullData.salaryType || 'Monthly',
          paymentCycle: fullData.paymentCycle || 'Monthly',
          hra: fullData.hra?.toString() || '',
          pfApplicable: fullData.pfApplicable || 'Yes',
          bonus: fullData.bonus?.toString() || '',
          overtimeRate: fullData.overtimeRate?.toString() || '',
          hrmsAccess: fullData.hrmsAccess || 'Yes',
          roleBasedAccess: fullData.roleBasedAccess || 'Employee'
        })
        
        // Load allowances
        if (fullData.allowances && Array.isArray(fullData.allowances)) {
          setAllowances(fullData.allowances.map((a: any) => ({
            name: a.name || '',
            amount: a.amount?.toString() || '',
            type: a.type || 'Fixed',
            taxable: a.taxable ? 'Yes' : 'No',
            carryForward: a.carryForward ? 'Yes' : 'No'
          })))
        } else {
          setAllowances([])
        }
        
        // Load deductions
        if (fullData.deductions && Array.isArray(fullData.deductions)) {
          setDeductions(fullData.deductions.map((d: any) => ({
            name: d.name || '',
            amount: d.amount?.toString() || '',
            type: d.type || 'Fixed'
          })))
        } else {
          setDeductions([])
        }
        
        // Load document URLs
        setFormData(prev => ({
          ...prev,
          aadhaarCardUrl: fullData.aadhaarCardUrl || '',
          panCardUrl: fullData.panCardUrl || '',
          educationCertificateUrl: fullData.educationCertificateUrl || '',
          experienceLetterUrl: fullData.experienceLetterUrl || '',
          relievingLetterUrl: fullData.relievingLetterUrl || '',
          passportPhotoUrl: fullData.passportPhotoUrl || '',
          bankStatementUrl: fullData.bankStatementUrl || '',
          otherDocumentUrl: fullData.otherDocumentUrl || ''
        }))
        
        setProfilePicturePreview(fullData.profilePictureUrl || '')
        setShowForm(true)
      }
    } catch (error) {
      console.error('Error loading employee data:', error)
      alert('Failed to load employee data')
    }
  }

  const handleViewCredentials = async (employeeId: string) => {
    try {
      const response = await apiService.getEmployeeCredentials(employeeId)
      if (response.success) {
        setShowCredentials(response.data)
      }
    } catch (error) {
      console.error('Error fetching credentials:', error)
      alert('Failed to fetch credentials')
    }
  }

  const handleViewEmployee = async (employee: Employee) => {
    try {
      const response = await apiService.getEmployees()
      if (response.success) {
        const fullData = response.data.find((e: any) => e.employeeId === employee.employeeId)
        setViewingEmployee(fullData)
      }
    } catch (error) {
      console.error('Error loading employee data:', error)
      alert('Failed to load employee data')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfilePicture(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDocumentChange = (docType: string, file: File | null) => {
    setDocumentFiles(prev => ({ ...prev, [docType]: file }))
  }

  const handleSubmit = async () => {
    setError('')
    setUploading(true)

    try {
      let profilePictureUrl = formData.profilePictureUrl
      
      if (profilePicture) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', profilePicture)
        uploadFormData.append('folder', `hrms/${user?.userId}/employees/${formData.employeeId}/profile`)
        
        const uploadResponse = await fetch('http://localhost:4001/api/upload', {
          method: 'POST',
          body: uploadFormData
        })
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          profilePictureUrl = uploadData.url
        }
      }

      // Upload documents
      setUploadingDocs(true)
      const documentUrls: any = {}
      const docTypes = ['aadhaarCard', 'panCard', 'educationCertificate', 'experienceLetter', 'relievingLetter', 'passportPhoto', 'bankStatement', 'otherDocument']
      
      for (const docType of docTypes) {
        const file = documentFiles[docType]
        if (file) {
          const uploadFormData = new FormData()
          uploadFormData.append('file', file)
          uploadFormData.append('folder', `hrms/${user?.userId}/employees/${formData.employeeId}/documents`)
          
          const uploadResponse = await fetch('http://localhost:4001/api/upload', {
            method: 'POST',
            body: uploadFormData
          })
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            documentUrls[`${docType}Url`] = uploadData.url
          }
        }
      }
      setUploadingDocs(false)

      const employeeData = {
        employeeId: formData.employeeId,
        recruiterId: user?.userId,
        name: formData.fullName,
        fullName: formData.fullName,
        email: formData.officialEmail || formData.personalEmail,
        phone: formData.personalMobile,
        position: formData.designation,
        designation: formData.designation,
        department: formData.department,
        salary: parseFloat(formData.annualCTC) || 0,
        annualCTC: formData.annualCTC,
        basicSalary: parseFloat(formData.basicSalary) || 0,
        basicPay: formData.basicSalary,
        salaryType: formData.salaryType,
        paymentCycle: formData.paymentCycle,
        bonus: parseFloat(formData.bonus) || 0,
        overtimeRate: parseFloat(formData.overtimeRate) || 0,
        allowances: allowances.map(a => ({
          name: a.name,
          amount: parseFloat(a.amount) || 0,
          type: a.type,
          taxable: a.taxable === 'Yes',
          carryForward: a.carryForward === 'Yes'
        })),
        deductions: deductions.map(d => ({
          name: d.name,
          amount: parseFloat(d.amount) || 0,
          type: d.type
        })),
        managerId: formData.reportingManagerId || null,
        reportingManagerId: formData.reportingManagerId || null,
        roleLevel: formData.roleLevel,
        isPeopleManager: formData.isPeopleManager,
        teamName: formData.teamName,
        profilePictureUrl: profilePictureUrl,
        preferredName: formData.preferredName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        maritalStatus: formData.maritalStatus,
        bloodGroup: formData.bloodGroup,
        personalMobile: formData.personalMobile,
        personalEmail: formData.personalEmail,
        officialEmail: formData.officialEmail,
        currentAddress: formData.currentAddress,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactNumber: formData.emergencyContactNumber,
        emergencyContactRelation: formData.emergencyContactRelation,
        aadhaarNumber: formData.aadhaarNumber,
        panNumber: formData.panNumber,
        uanNumber: formData.uanNumber,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        employmentType: formData.employmentType,
        gradeLevel: formData.gradeLevel,
        dateOfJoining: formData.dateOfJoining,
        probationPeriod: formData.probationPeriod,
        workLocation: formData.workLocation,
        shiftTiming: formData.shiftTiming,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        hra: formData.hra,
        pfApplicable: formData.pfApplicable,
        hrmsAccess: formData.hrmsAccess,
        roleBasedAccess: formData.roleBasedAccess,
        ...documentUrls
      }

      const response = editingEmployee
        ? await apiService.updateEmployee(editingEmployee.employeeId, employeeData)
        : await apiService.createEmployee(employeeData)
      
      if (response.success) {
        if (!editingEmployee) {
          const newEmployeeId = response.data.employeeId
          
          let parentNodeId = null
          if (formData.reportingManagerId) {
            const orgResponse = await apiService.getOrganizationChart()
            if (orgResponse.success) {
              const parentNode = orgResponse.data.nodes.find(
                (node: any) => node.employeeId === formData.reportingManagerId
              )
              if (parentNode) {
                parentNodeId = parentNode.nodeId
              }
            }
          }
          
          const orgNodeData = {
            employeeId: newEmployeeId,
            parentId: parentNodeId,
            level: !parentNodeId ? 0 : (formData.roleLevel === 'Head' ? 1 : formData.roleLevel === 'Manager' ? 2 : formData.roleLevel === 'Team Lead' ? 3 : 4),
            position: formData.designation
          }
          
          await apiService.createOrgNode(orgNodeData)
        }
        
        await loadEmployees()
        setShowForm(false)
        setEditingEmployee(null)
        setCurrentStep(1)
        setFormData({
          employeeId: '',
          fullName: '', preferredName: '', gender: '', dateOfBirth: '', maritalStatus: '', bloodGroup: '',
          personalMobile: '', personalEmail: '', officialEmail: '', currentAddress: '',
          emergencyContactName: '', emergencyContactNumber: '', emergencyContactRelation: '',
          aadhaarNumber: '', panNumber: '', uanNumber: '',
          bankName: '', accountNumber: '', ifscCode: '',
          employmentType: 'Full-Time', department: '', designation: '', gradeLevel: '',
          dateOfJoining: '', probationPeriod: '3', workLocation: '', shiftTiming: 'Fixed',
          checkInTime: '09:00', checkOutTime: '18:00',
          reportingManagerId: '', roleLevel: 'Manager', isPeopleManager: 'No',
          teamName: '', annualCTC: '', basicPay: '', basicSalary: '', salaryType: 'Monthly',
          paymentCycle: 'Monthly', hra: '', pfApplicable: 'Yes', bonus: '', overtimeRate: '',
          hrmsAccess: 'Yes', roleBasedAccess: 'Employee', profilePictureUrl: ''
        })
        setAllowances([])
        setDeductions([])
        setProfilePicture(null)
        setProfilePicturePreview('')
      } else {
        setError(response.message || 'Failed to save employee')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save employee')
    } finally {
      setUploading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <User size={18} />
              Basic Information
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Employee ID *</h4>
              <input 
                type="text" 
                placeholder="Enter Employee ID (numeric only) *" 
                value={formData.employeeId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    handleInputChange('employeeId', value);
                  }
                }}
                disabled={!!editingEmployee}
                className="w-full p-3 border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed" 
                required 
              />
              <p className="text-sm text-blue-700 mt-2">
                {editingEmployee 
                  ? '⚠️ Employee ID cannot be changed after creation'
                  : '💡 Enter a unique numeric ID that will be synced to the biometric attendance system'}
              </p>
            </div>
            
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-2 border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center">
                  {profilePicturePreview ? (
                    <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-gray-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                  <Upload size={16} />
                  <input type="file" accept="image/*" onChange={handleProfilePictureChange} className="hidden" />
                </label>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Full Name *" value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="col-span-2 p-3 border rounded-lg" required />
              <input type="text" placeholder="Preferred Name" value={formData.preferredName}
                onChange={(e) => handleInputChange('preferredName', e.target.value)}
                className="p-3 border rounded-lg" />
              <select value={formData.gender} onChange={(e) => handleInputChange('gender', e.target.value)}
                className="p-3 border rounded-lg">
                <option value="">Gender *</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input type="date" placeholder="Date of Birth *" value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="p-3 border rounded-lg" required />
              <select value={formData.maritalStatus} onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                className="p-3 border rounded-lg">
                <option value="">Marital Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
              </select>
              <input type="text" placeholder="Blood Group" value={formData.bloodGroup}
                onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                className="p-3 border rounded-lg" />
            </div>

            <h3 className="font-semibold text-gray-900 mt-6">Contact Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="tel" placeholder="Personal Mobile *" value={formData.personalMobile}
                onChange={(e) => handleInputChange('personalMobile', e.target.value)}
                className="p-3 border rounded-lg" required />
              <input type="email" placeholder="Personal Email *" value={formData.personalEmail}
                onChange={(e) => handleInputChange('personalEmail', e.target.value)}
                className="p-3 border rounded-lg" required />
              <input type="email" placeholder="Official Email" value={formData.officialEmail}
                onChange={(e) => handleInputChange('officialEmail', e.target.value)}
                className="col-span-2 p-3 border rounded-lg" />
              <textarea placeholder="Current Address *" value={formData.currentAddress}
                onChange={(e) => handleInputChange('currentAddress', e.target.value)}
                className="col-span-2 p-3 border rounded-lg h-20" required />
              <input type="text" placeholder="Emergency Contact Name *" value={formData.emergencyContactName}
                onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                className="p-3 border rounded-lg" required />
              <input type="tel" placeholder="Emergency Contact Number *" value={formData.emergencyContactNumber}
                onChange={(e) => handleInputChange('emergencyContactNumber', e.target.value)}
                className="p-3 border rounded-lg" required />
              <input type="text" placeholder="Relationship" value={formData.emergencyContactRelation}
                onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
                className="p-3 border rounded-lg" />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Shield size={18} />
              Identification & Banking
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Aadhaar Number *" value={formData.aadhaarNumber}
                onChange={(e) => handleInputChange('aadhaarNumber', e.target.value)}
                className="p-3 border rounded-lg" required />
              <input type="text" placeholder="PAN Number *" value={formData.panNumber}
                onChange={(e) => handleInputChange('panNumber', e.target.value)}
                className="p-3 border rounded-lg" required />
              <input type="text" placeholder="UAN Number" value={formData.uanNumber}
                onChange={(e) => handleInputChange('uanNumber', e.target.value)}
                className="col-span-2 p-3 border rounded-lg" />
            </div>

            <h3 className="font-semibold text-gray-900 mt-6">Bank Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Bank Name *" value={formData.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                className="p-3 border rounded-lg" required />
              <input type="text" placeholder="Account Number *" value={formData.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                className="p-3 border rounded-lg" required />
              <input type="text" placeholder="IFSC Code *" value={formData.ifscCode}
                onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                className="col-span-2 p-3 border rounded-lg" required />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase size={18} />
              Employment Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <select value={formData.employmentType} onChange={(e) => handleInputChange('employmentType', e.target.value)}
                className="p-3 border rounded-lg">
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Intern">Intern</option>
                <option value="Consultant">Consultant</option>
                <option value="Contract">Contract</option>
              </select>
              <input type="text" placeholder="Department *" value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="p-3 border rounded-lg" required />
              <input type="text" placeholder="Designation *" value={formData.designation}
                onChange={(e) => handleInputChange('designation', e.target.value)}
                className="p-3 border rounded-lg" required />
              <input type="text" placeholder="Grade/Level" value={formData.gradeLevel}
                onChange={(e) => handleInputChange('gradeLevel', e.target.value)}
                className="p-3 border rounded-lg" />
              <input type="date" placeholder="Date of Joining *" value={formData.dateOfJoining}
                onChange={(e) => handleInputChange('dateOfJoining', e.target.value)}
                className="p-3 border rounded-lg" required />
              <input type="number" placeholder="Probation Period (months)" value={formData.probationPeriod}
                onChange={(e) => handleInputChange('probationPeriod', e.target.value)}
                className="p-3 border rounded-lg" />
              <input type="text" placeholder="Work Location *" value={formData.workLocation}
                onChange={(e) => handleInputChange('workLocation', e.target.value)}
                className="p-3 border rounded-lg" required />
              <select value={formData.shiftTiming} onChange={(e) => handleInputChange('shiftTiming', e.target.value)}
                className="p-3 border rounded-lg">
                <option value="Fixed">Fixed</option>
                <option value="Rotational">Rotational</option>
              </select>
            </div>

            <h3 className="font-semibold text-gray-900 mt-6">Working Hours Configuration</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-700">
                💡 Configure official check-in and check-out times. These will be used for attendance tracking and late/early marking calculations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Check-in Time *</label>
                <input type="time" value={formData.checkInTime}
                  onChange={(e) => handleInputChange('checkInTime', e.target.value)}
                  className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Check-out Time *</label>
                <input type="time" value={formData.checkOutTime}
                  onChange={(e) => handleInputChange('checkOutTime', e.target.value)}
                  className="w-full p-3 border rounded-lg" required />
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mt-6 flex items-center gap-2">
              <Building2 size={18} />
              Organogram & Hierarchy
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <select value={formData.reportingManagerId} onChange={(e) => handleInputChange('reportingManagerId', e.target.value)}
                  className="w-full p-3 border rounded-lg">
                  <option value="">No Manager (Top Level Position)</option>
                  {managers.length > 0 && <optgroup label="Available Managers">
                    {managers.map(mgr => (
                      <option key={mgr.employeeId} value={mgr.employeeId}>
                        {mgr.fullName || mgr.name} - {mgr.designation || mgr.position}
                      </option>
                    ))}
                  </optgroup>}
                </select>
                {employees.length === 0 && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    ✓ This is your first employee - no manager needed
                  </p>
                )}
                {formData.roleLevel === 'Head' && (
                  <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                    💡 Top-level positions typically don't have a reporting manager
                  </p>
                )}
              </div>
              <select value={formData.roleLevel} onChange={(e) => handleInputChange('roleLevel', e.target.value)}
                className="p-3 border rounded-lg">
                <option value="Team Lead">Team Lead</option>
                <option value="Manager">Manager</option>
                <option value="Head">Head</option>
              </select>
              <select value={formData.isPeopleManager} onChange={(e) => handleInputChange('isPeopleManager', e.target.value)}
                className="p-3 border rounded-lg">
                <option value="No">Is People Manager? - No</option>
                <option value="Yes">Is People Manager? - Yes</option>
              </select>
              {formData.isPeopleManager === 'Yes' && (
                <input type="text" placeholder="Team Name *" value={formData.teamName}
                  onChange={(e) => handleInputChange('teamName', e.target.value)}
                  className="col-span-2 p-3 border rounded-lg" required />
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign size={18} />
              Compensation & Payroll Structure
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                💡 Define complete salary structure for automated payroll processing
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Annual CTC *" value={formData.annualCTC}
                onChange={(e) => handleInputChange('annualCTC', e.target.value)}
                className="p-3 border rounded-lg" required />
              <input type="number" placeholder="Basic Salary (Monthly) *" value={formData.basicSalary}
                onChange={(e) => handleInputChange('basicSalary', e.target.value)}
                className="p-3 border rounded-lg" required />
              <select value={formData.salaryType} onChange={(e) => handleInputChange('salaryType', e.target.value)}
                className="p-3 border rounded-lg">
                <option value="Monthly">Salary Type - Monthly</option>
                <option value="Daily">Salary Type - Daily</option>
                <option value="Hourly">Salary Type - Hourly</option>
              </select>
              <select value={formData.paymentCycle} onChange={(e) => handleInputChange('paymentCycle', e.target.value)}
                className="p-3 border rounded-lg">
                <option value="Monthly">Payment Cycle - Monthly</option>
              </select>
              <input type="number" placeholder="Bonus (Monthly)" value={formData.bonus}
                onChange={(e) => handleInputChange('bonus', e.target.value)}
                className="p-3 border rounded-lg" />
              <input type="number" placeholder="Overtime Rate (Per Hour)" value={formData.overtimeRate}
                onChange={(e) => handleInputChange('overtimeRate', e.target.value)}
                className="p-3 border rounded-lg" />
            </div>

            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-900">Allowances</h4>
                <button
                  type="button"
                  onClick={() => setAllowances([...allowances, {name: '', amount: '', type: 'Fixed', taxable: 'Yes', carryForward: 'No'}])}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <Plus size={14} /> Add Allowance
                </button>
              </div>
              {allowances.map((allowance, idx) => (
                <div key={idx} className="grid grid-cols-6 gap-2 mb-2 p-3 bg-gray-50 rounded">
                  <input type="text" placeholder="Name" value={allowance.name}
                    onChange={(e) => {
                      const updated = [...allowances]
                      updated[idx].name = e.target.value
                      setAllowances(updated)
                    }}
                    className="p-2 border rounded text-sm" />
                  <input type="number" placeholder="Amount" value={allowance.amount}
                    onChange={(e) => {
                      const updated = [...allowances]
                      updated[idx].amount = e.target.value
                      setAllowances(updated)
                    }}
                    className="p-2 border rounded text-sm" />
                  <select value={allowance.type}
                    onChange={(e) => {
                      const updated = [...allowances]
                      updated[idx].type = e.target.value
                      setAllowances(updated)
                    }}
                    className="p-2 border rounded text-sm">
                    <option value="Fixed">Fixed</option>
                    <option value="Variable">Variable</option>
                  </select>
                  <select value={allowance.taxable}
                    onChange={(e) => {
                      const updated = [...allowances]
                      updated[idx].taxable = e.target.value
                      setAllowances(updated)
                    }}
                    className="p-2 border rounded text-sm">
                    <option value="Yes">Taxable</option>
                    <option value="No">Non-Taxable</option>
                  </select>
                  <select value={allowance.carryForward}
                    onChange={(e) => {
                      const updated = [...allowances]
                      updated[idx].carryForward = e.target.value
                      setAllowances(updated)
                    }}
                    className="p-2 border rounded text-sm">
                    <option value="No">No Carry</option>
                    <option value="Yes">Carry Forward</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setAllowances(allowances.filter((_, i) => i !== idx))}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-900">Deductions</h4>
                <button
                  type="button"
                  onClick={() => setDeductions([...deductions, {name: '', amount: '', type: 'Fixed'}])}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <Plus size={14} /> Add Deduction
                </button>
              </div>
              {deductions.map((deduction, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 mb-2 p-3 bg-gray-50 rounded">
                  <input type="text" placeholder="Name (PF, ESI, Tax, etc.)" value={deduction.name}
                    onChange={(e) => {
                      const updated = [...deductions]
                      updated[idx].name = e.target.value
                      setDeductions(updated)
                    }}
                    className="p-2 border rounded text-sm" />
                  <input type="number" placeholder="Amount" value={deduction.amount}
                    onChange={(e) => {
                      const updated = [...deductions]
                      updated[idx].amount = e.target.value
                      setDeductions(updated)
                    }}
                    className="p-2 border rounded text-sm" />
                  <select value={deduction.type}
                    onChange={(e) => {
                      const updated = [...deductions]
                      updated[idx].type = e.target.value
                      setDeductions(updated)
                    }}
                    className="p-2 border rounded text-sm">
                    <option value="Fixed">Fixed</option>
                    <option value="Variable">Variable</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setDeductions(deductions.filter((_, i) => i !== idx))}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <h3 className="font-semibold text-gray-900 mt-6">System Access</h3>
            <div className="grid grid-cols-2 gap-4">
              <select value={formData.roleBasedAccess} onChange={(e) => handleInputChange('roleBasedAccess', e.target.value)}
                className="col-span-2 p-3 border rounded-lg">
                <option value="Employee">Role: Employee</option>
                <option value="Manager">Role: Manager</option>
                <option value="HR">Role: HR</option>
                <option value="Admin">Role: Admin</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h4 className="font-semibold text-blue-900 mb-2">Important Note</h4>
              <p className="text-sm text-blue-700">
                The Employee ID you enter will be used across all systems including biometric attendance.
              </p>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText size={18} />
              Document Upload
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                📄 Upload employee documents for record keeping. All documents will be securely stored.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="border rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">Aadhaar Card *</label>
                {formData.aadhaarCardUrl ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-sm">✓ Already uploaded</span>
                    <a href={formData.aadhaarCardUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">View</a>
                    <button type="button" onClick={() => handleInputChange('aadhaarCardUrl', '')} className="text-red-600 text-sm hover:underline">Remove</button>
                  </div>
                ) : null}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleDocumentChange('aadhaarCard', e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded mt-2"
                />
              </div>

              <div className="border rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">PAN Card *</label>
                {formData.panCardUrl ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-sm">✓ Already uploaded</span>
                    <a href={formData.panCardUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">View</a>
                    <button type="button" onClick={() => handleInputChange('panCardUrl', '')} className="text-red-600 text-sm hover:underline">Remove</button>
                  </div>
                ) : null}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleDocumentChange('panCard', e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded mt-2"
                />
              </div>

              <div className="border rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">Education Certificate</label>
                {formData.educationCertificateUrl ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-sm">✓ Already uploaded</span>
                    <a href={formData.educationCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">View</a>
                    <button type="button" onClick={() => handleInputChange('educationCertificateUrl', '')} className="text-red-600 text-sm hover:underline">Remove</button>
                  </div>
                ) : null}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleDocumentChange('educationCertificate', e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded mt-2"
                />
              </div>

              <div className="border rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">Experience Letter</label>
                {formData.experienceLetterUrl ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-sm">✓ Already uploaded</span>
                    <a href={formData.experienceLetterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">View</a>
                    <button type="button" onClick={() => handleInputChange('experienceLetterUrl', '')} className="text-red-600 text-sm hover:underline">Remove</button>
                  </div>
                ) : null}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleDocumentChange('experienceLetter', e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded mt-2"
                />
              </div>

              <div className="border rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">Relieving Letter</label>
                {formData.relievingLetterUrl ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-sm">✓ Already uploaded</span>
                    <a href={formData.relievingLetterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">View</a>
                    <button type="button" onClick={() => handleInputChange('relievingLetterUrl', '')} className="text-red-600 text-sm hover:underline">Remove</button>
                  </div>
                ) : null}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => handleDocumentChange('relievingLetter', e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded mt-2"
                />
              </div>

              <div className="border rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">Passport Size Photo</label>
                {formData.passportPhotoUrl ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-sm">✓ Already uploaded</span>
                    <a href={formData.passportPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">View</a>
                    <button type="button" onClick={() => handleInputChange('passportPhotoUrl', '')} className="text-red-600 text-sm hover:underline">Remove</button>
                  </div>
                ) : null}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => handleDocumentChange('passportPhoto', e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded mt-2"
                />
              </div>

              <div className="border rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">Bank Statement / Cancelled Cheque</label>
                {formData.bankStatementUrl ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-sm">✓ Already uploaded</span>
                    <a href={formData.bankStatementUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">View</a>
                    <button type="button" onClick={() => handleInputChange('bankStatementUrl', '')} className="text-red-600 text-sm hover:underline">Remove</button>
                  </div>
                ) : null}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleDocumentChange('bankStatement', e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded mt-2"
                />
              </div>

              <div className="border rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">Other Document (Optional)</label>
                {formData.otherDocumentUrl ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-sm">✓ Already uploaded</span>
                    <a href={formData.otherDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">View</a>
                    <button type="button" onClick={() => handleInputChange('otherDocumentUrl', '')} className="text-red-600 text-sm hover:underline">Remove</button>
                  </div>
                ) : null}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleDocumentChange('otherDocument', e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded mt-2"
                />
              </div>
            </div>

            {uploadingDocs && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-700">📤 Uploading documents... Please wait.</p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Onboarding</h1>
          <p className="text-gray-600">Complete employee onboarding with organogram integration</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>Onboard Employee</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Active Employees</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((emp) => (
                <tr key={emp.employeeId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{emp.employeeId}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{emp.fullName || emp.name}</div>
                    <div className="text-sm text-gray-500">{emp.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{emp.designation || emp.position}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{emp.department}</td>
                  <td className="px-6 py-4 flex space-x-2">
                    <button
                      onClick={() => handleViewCredentials(emp.employeeId)}
                      className="text-green-600 hover:text-green-800"
                      title="View Portal Credentials"
                    >
                      <User size={18} />
                    </button>
                    <button
                      onClick={() => handleViewEmployee(emp)}
                      className="text-gray-600 hover:text-gray-800"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEditEmployee(emp)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit Employee"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp.employeeId)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete Employee"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {employees.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No employees onboarded yet. Start by adding your first employee.
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{editingEmployee ? 'Update Employee' : 'Employee Onboarding Form'}</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                      ${currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {step}
                    </div>
                    {step < 5 && <div className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="mx-6 mt-4 flex items-center space-x-2 p-3 text-red-700 bg-red-100 border border-red-300 rounded-lg">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form className="p-6" onSubmit={(e) => e.preventDefault()}>
              {renderStepContent()}

              <div className="flex justify-between mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 1) {
                      setShowForm(false)
                      setEditingEmployee(null)
                      setCurrentStep(1)
                    } else {
                      setCurrentStep(Math.max(1, currentStep - 1))
                    }
                  }}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  {currentStep === 1 ? 'Cancel' : 'Previous'}
                </button>
                
                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={uploading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Saving...' : (editingEmployee ? 'Update Employee' : 'Complete Onboarding')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Employee Details</h3>
                <button onClick={() => setViewingEmployee(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {viewingEmployee.profilePictureUrl && (
                <div className="flex justify-center">
                  <img src={viewingEmployee.profilePictureUrl} alt="Profile" className="w-32 h-32 rounded-full object-cover border-2 border-gray-300" />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Employee ID:</strong> {viewingEmployee.employeeId}</div>
                <div><strong>Name:</strong> {viewingEmployee.name || viewingEmployee.fullName}</div>
                <div><strong>Email:</strong> {viewingEmployee.email}</div>
                <div><strong>Phone:</strong> {viewingEmployee.phone || viewingEmployee.personalMobile}</div>
                <div><strong>Position:</strong> {viewingEmployee.position || viewingEmployee.designation}</div>
                <div><strong>Department:</strong> {viewingEmployee.department}</div>
                <div><strong>Gender:</strong> {viewingEmployee.gender}</div>
                <div><strong>Date of Birth:</strong> {viewingEmployee.dateOfBirth}</div>
                <div><strong>Marital Status:</strong> {viewingEmployee.maritalStatus}</div>
                <div><strong>Blood Group:</strong> {viewingEmployee.bloodGroup}</div>
                <div><strong>Aadhaar:</strong> {viewingEmployee.aadhaarNumber}</div>
                <div><strong>PAN:</strong> {viewingEmployee.panNumber}</div>
                <div><strong>Bank:</strong> {viewingEmployee.bankName}</div>
                <div><strong>Account:</strong> {viewingEmployee.accountNumber}</div>
                <div><strong>IFSC:</strong> {viewingEmployee.ifscCode}</div>
                <div><strong>Role Level:</strong> {viewingEmployee.roleLevel}</div>
                <div><strong>People Manager:</strong> {viewingEmployee.isPeopleManager}</div>
                <div><strong>Team Name:</strong> {viewingEmployee.teamName}</div>
                <div><strong>Annual CTC:</strong> {viewingEmployee.salary || viewingEmployee.annualCTC}</div>
                <div className="col-span-2"><strong>Address:</strong> {viewingEmployee.currentAddress}</div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <FileText size={18} />
                  Uploaded Documents
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {viewingEmployee.aadhaarCardUrl && (
                    <div className="border rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Aadhaar Card</div>
                      <a href={viewingEmployee.aadhaarCardUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        <FileText size={14} /> View Document
                      </a>
                    </div>
                  )}
                  {viewingEmployee.panCardUrl && (
                    <div className="border rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">PAN Card</div>
                      <a href={viewingEmployee.panCardUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        <FileText size={14} /> View Document
                      </a>
                    </div>
                  )}
                  {viewingEmployee.educationCertificateUrl && (
                    <div className="border rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Education Certificate</div>
                      <a href={viewingEmployee.educationCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        <FileText size={14} /> View Document
                      </a>
                    </div>
                  )}
                  {viewingEmployee.experienceLetterUrl && (
                    <div className="border rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Experience Letter</div>
                      <a href={viewingEmployee.experienceLetterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        <FileText size={14} /> View Document
                      </a>
                    </div>
                  )}
                  {viewingEmployee.relievingLetterUrl && (
                    <div className="border rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Relieving Letter</div>
                      <a href={viewingEmployee.relievingLetterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        <FileText size={14} /> View Document
                      </a>
                    </div>
                  )}
                  {viewingEmployee.passportPhotoUrl && (
                    <div className="border rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Passport Photo</div>
                      <a href={viewingEmployee.passportPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        <FileText size={14} /> View Document
                      </a>
                    </div>
                  )}
                  {viewingEmployee.bankStatementUrl && (
                    <div className="border rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Bank Statement</div>
                      <a href={viewingEmployee.bankStatementUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        <FileText size={14} /> View Document
                      </a>
                    </div>
                  )}
                  {viewingEmployee.otherDocumentUrl && (
                    <div className="border rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Other Document</div>
                      <a href={viewingEmployee.otherDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        <FileText size={14} /> View Document
                      </a>
                    </div>
                  )}
                </div>
                {!viewingEmployee.aadhaarCardUrl && !viewingEmployee.panCardUrl && !viewingEmployee.educationCertificateUrl && 
                 !viewingEmployee.experienceLetterUrl && !viewingEmployee.relievingLetterUrl && !viewingEmployee.passportPhotoUrl && 
                 !viewingEmployee.bankStatementUrl && !viewingEmployee.otherDocumentUrl && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No documents uploaded yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="bg-green-600 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <User size={24} />
                  Employee Portal Credentials
                </h3>
                <button onClick={() => setShowCredentials(null)} className="text-white hover:text-gray-200">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 mb-3">
                  🔐 Share these credentials with the employee to access the Employee Portal
                </p>
              </div>

              <div className="space-y-3">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email / Username</label>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono font-semibold text-gray-900">{showCredentials.email}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(showCredentials.email)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono font-semibold text-gray-900">{showCredentials.password}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(showCredentials.password)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-700">
                  ⚠️ <strong>Important:</strong> Employee will be required to change password on first login
                </p>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowCredentials(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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
