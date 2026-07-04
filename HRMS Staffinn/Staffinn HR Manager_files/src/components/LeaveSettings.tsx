/**
 * LeaveSettings.tsx
 * Working Days section REMOVED (moved to employee onboarding).
 * Holidays tab wired to HolidayManagement component.
 */
import { useState, useEffect } from 'react'
import { Save, Calendar, Settings as SettingsIcon } from 'lucide-react'
import { apiService } from '../services/api'
import HolidayManagement from './HolidayManagement'

export default function LeaveSettings() {
  const [settings, setSettings] = useState({
    holidayList: [] as any[],
    financialYearStart: '04-01',
    payrollIntegration: 'Yes',
    attendanceSync: 'Yes',
    lateArrivalPolicy: 'Half Day',  // Half Day | Full Day | Warning
    lateGracePeriodMinutes: 15,     // minutes after shift start before marking late
  })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [activeSection, setActiveSection] = useState<'system' | 'holidays'>('holidays')

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await apiService.getLeaveSettings()
      if (data) setSettings(prev => ({ ...prev, ...data }))
    } catch (e) { console.error('Error loading settings:', e) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await apiService.updateLeaveSettings(settings)
      alert('Settings saved successfully!')
    } catch { alert('Failed to save settings') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Leave System Settings</h2>
      </div>

      {/* Section tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { id: 'holidays', label: 'Holidays', icon: Calendar },
            { id: 'system',   label: 'System Settings', icon: SettingsIcon },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveSection(id as any)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeSection === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
      </div>

      {activeSection === 'holidays' && <HolidayManagement />}

      {activeSection === 'system' && (
        <div className="space-y-6">
          {/* Late Arrival Policy */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Late Arrival Policy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Late Arrival Action</label>
                <select value={settings.lateArrivalPolicy}
                  onChange={e => setSettings({ ...settings, lateArrivalPolicy: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm">
                  <option value="Half Day">Mark Half Day (salary deduction)</option>
                  <option value="Full Day">Mark Full Day Absent</option>
                  <option value="Warning">Warning Only (no deduction)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Action taken when employee arrives after grace period</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (minutes)</label>
                <input type="number" min={0} max={60} value={settings.lateGracePeriodMinutes}
                  onChange={e => setSettings({ ...settings, lateGracePeriodMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                <p className="text-xs text-gray-500 mt-1">Minutes after shift start before marking as "Late"</p>
              </div>
            </div>
          </div>

          {/* System Integration */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">System Integration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year Start</label>
                <input type="text" value={settings.financialYearStart}
                  onChange={e => setSettings({ ...settings, financialYearStart: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  placeholder="MM-DD" />
                <p className="text-xs text-gray-500 mt-1">Format: MM-DD (e.g. 04-01)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payroll Integration</label>
                <select value={settings.payrollIntegration}
                  onChange={e => setSettings({ ...settings, payrollIntegration: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm">
                  <option value="Yes">Enabled</option>
                  <option value="No">Disabled</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">LWP &amp; leaves reflect in payroll</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Sync</label>
                <select value={settings.attendanceSync}
                  onChange={e => setSettings({ ...settings, attendanceSync: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm">
                  <option value="Yes">Enabled</option>
                  <option value="No">Disabled</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Sync leaves with attendance records</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">Integration Status</h4>
            <div className="space-y-1.5 text-sm">
              {[
                { label: 'Payroll Integration', active: settings.payrollIntegration === 'Yes' },
                { label: 'Attendance Sync',     active: settings.attendanceSync === 'Yes' },
                { label: 'Audit Logs',          active: true },
              ].map(({ label, active }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-gray-700">{label}: <strong>{active ? 'Active' : 'Inactive'}</strong></span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
              <Save size={16} /> {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
