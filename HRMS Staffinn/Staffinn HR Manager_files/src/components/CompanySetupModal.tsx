import { useState } from 'react'
import { Building2, X, Copy, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { apiService } from '../services/api'

interface CompanySetupModalProps {
  userEmail: string
  onComplete: (companyData: any) => void
}

export default function CompanySetupModal({ userEmail, onComplete }: CompanySetupModalProps) {
  const [step, setStep] = useState<'form' | 'credentials'>('form')
  const [companyName, setCompanyName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [companyData, setCompanyData] = useState<any>(null)
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!companyName.trim()) {
      setError('Company name is required')
      return
    }

    setIsLoading(true)

    try {
      // Use a default password for company creation (user's email as identifier)
      const response = await apiService.registerCompany(
        companyName.trim(),
        userEmail,
        'temp_' + Date.now() // Temporary password for backend
      )

      if (response.success) {
        setCompanyData(response.data)
        setStep('credentials')
      } else {
        setError(response.message || 'Failed to create company')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create company')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied({ ...copied, [key]: true })
    setTimeout(() => {
      setCopied({ ...copied, [key]: false })
    }, 2000)
  }

  const handleDownloadBridge = () => {
    const downloadUrl = 'https://staffinn-files.s3.ap-south-1.amazonaws.com/downloads/StaffInn-Attendance-Bridge-Setup.exe'
    window.open(downloadUrl, '_blank')
  }

  const handleDownloadCSV = () => {
    const csvContent = `Field,Value\nCompany Name,${companyData?.companyName}\nCompany ID,${companyData?.companyId}\nAPI Key,${companyData?.apiKey}\nAdmin Email,${userEmail}\nCreated Date,${new Date().toLocaleDateString()}`
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${companyData?.companyId}_credentials.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleComplete = () => {
    if (companyData) {
      onComplete(companyData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {step === 'form' ? (
          <>
            <div className="p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Setup Your Company</h3>
                  <p className="text-sm text-gray-600">Create your company profile to continue</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center space-x-2 p-3 text-red-700 bg-red-100 border border-red-300 rounded-lg">
                  <AlertCircle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Welcome!</strong> To use HRMS features, please create your company profile first.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your company name"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Creating Company...' : 'Create Company'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Company Created Successfully!</h3>
                  <p className="text-sm text-gray-600">Save these credentials securely</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                  <div className="text-sm text-yellow-800">
                    <strong>Important:</strong> Save these credentials. You'll need them to configure biometric devices for attendance tracking.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company ID
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={companyData?.companyId || ''}
                    readOnly
                    className="flex-1 p-3 border rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(companyData?.companyId, 'companyId')}
                    className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied.companyId ? (
                      <CheckCircle className="text-green-600" size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={companyData?.apiKey || ''}
                    readOnly
                    className="flex-1 p-3 border rounded-lg bg-gray-50 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(companyData?.apiKey, 'apiKey')}
                    className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied.apiKey ? (
                      <CheckCircle className="text-green-600" size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ This key will not be shown again. Keep it secure.
                </p>
              </div>

              <button
                onClick={handleDownloadBridge}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center space-x-2"
              >
                <Download size={16} />
                <span>Download Bridge Software</span>
              </button>

              <button
                onClick={handleComplete}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Continue to Dashboard
              </button>

              <button
                onClick={handleDownloadCSV}
                className="w-full px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium flex items-center justify-center space-x-2"
              >
                <Download size={16} />
                <span>Download as CSV</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
