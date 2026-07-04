import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Download, Copy, CheckCircle, AlertCircle, ExternalLink, Users, Link as LinkIcon } from 'lucide-react'
import EmployeeDeviceMapping from './EmployeeDeviceMapping'

interface DeviceSetupProps {
  companyId: string
  apiKey: string
}

export default function DeviceSetup({ companyId, apiKey }: DeviceSetupProps) {
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})
  const [activeTab, setActiveTab] = useState<'setup' | 'mapping'>('setup')

  console.log('DeviceSetup props:', { companyId, apiKey }); // Debug log

  useEffect(() => {
    checkDevices()
    const interval = setInterval(checkDevices, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const checkDevices = async () => {
    try {
      const token = localStorage.getItem('hrms_token');
      const response = await fetch('https://api.staffinn.com/api/v1/hrms/attendance/device-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Device status:', data);
        
        // If device is connected, add to devices array
        if (data.data?.connected) {
          setDevices([{
            id: 'device-1',
            name: 'Biometric Device',
            status: 'online',
            lastSeen: data.data.lastSeen
          }]);
        } else {
          setDevices([]);
        }
      } else {
        setDevices([]);
      }
    } catch (error) {
      console.error('Error checking devices:', error);
      setDevices([]);
    } finally {
      setLoading(false);
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
    const downloadUrl = 'https://staffinn-files.s3.ap-south-1.amazonaws.com/downloads/StaffInn-Attendance-Bridge-Setup.exe';
    window.open(downloadUrl, '_blank');
    
    setTimeout(() => {
      alert('Bridge Software Download Started!\n\nAfter installation:\n1. Open StaffInn Attendance Bridge\n2. Enter your Company ID and API Key\n3. Connect your biometric device\n4. Start syncing attendance automatically');
    }, 500);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('setup')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'setup'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Wifi size={18} />
                <span>Device Setup</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('mapping')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'mapping'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <LinkIcon size={18} />
                <span>Employee Mapping</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'mapping' ? (
        <EmployeeDeviceMapping />
      ) : (
        <>
          {/* Device Status — show only when devices are connected */}
          {devices.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Device Status</h3>
              <div className="flex items-center space-x-2 text-green-600">
                <Wifi size={20} />
                <span className="text-sm font-medium">{devices.length} Device(s) Connected</span>
              </div>
            </div>
            <div className="space-y-3">
              {devices.map((device) => (
                <div key={device.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="text-green-600" size={24} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{device.name}</h4>
                        <p className="text-sm text-gray-600">
                          Status: <span className="text-green-600 font-medium">Online</span>
                        </p>
                        {device.lastSeen && (
                          <p className="text-xs text-gray-500 mt-1">
                            Last seen: {new Date(device.lastSeen).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 font-medium">Connected</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

      {/* Recommended Device */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recommended Device</h3>
        <div className="border rounded-lg p-4">
          <div className="flex items-start space-x-4">
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">Device Image</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Mantra MFS100 / Mivanta BioFace</h4>
              <p className="text-sm text-gray-600 mt-1">Fingerprint & Face Recognition Device</p>
              <p className="text-sm text-gray-500 mt-2">Price: ₹15,000 - ₹25,000</p>
              <a
                href="https://www.amazon.in/s?k=biometric+attendance+device"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <span>Buy on Amazon</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bridge Software Setup */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Setup Bridge Software</h3>
        
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Download Bridge Software</h4>
              <p className="text-sm text-gray-600 mt-1">Download and install the StaffInn Attendance Bridge on your Windows PC</p>
              <button
                onClick={handleDownloadBridge}
                className="mt-2 inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <Download size={16} />
                <span>Download Bridge Software</span>
              </button>
              <p className="text-xs text-gray-500 mt-2">Version 1.0.7 | Windows 10/11 | 105 MB</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Configure Credentials</h4>
              <p className="text-sm text-gray-600 mt-1">Use these credentials to configure the Bridge software</p>
              
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Company ID</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={companyId}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 font-mono text-sm"
                    />
                    <button
                      onClick={() => handleCopy(companyId, 'companyId')}
                      className="p-2 border rounded-lg hover:bg-gray-50"
                      title="Copy"
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">API Key</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={apiKey}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 font-mono text-xs"
                    />
                    <button
                      onClick={() => handleCopy(apiKey, 'apiKey')}
                      className="p-2 border rounded-lg hover:bg-gray-50"
                      title="Copy"
                    >
                      {copied.apiKey ? (
                        <CheckCircle className="text-green-600" size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Connect Device</h4>
              <p className="text-sm text-gray-600 mt-1">Connect your biometric device via USB or Network and start the Bridge software</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
              4
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Start Tracking</h4>
              <p className="text-sm text-gray-600 mt-1">Once connected, attendance data will automatically sync to your dashboard</p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Need Help?</p>
            <p>Check our <a href="#" className="underline font-medium">Setup Guide</a> or watch the <a href="#" className="underline font-medium">Video Tutorial</a></p>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
}
