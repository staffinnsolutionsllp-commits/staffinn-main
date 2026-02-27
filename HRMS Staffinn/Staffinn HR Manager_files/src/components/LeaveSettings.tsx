import { useState, useEffect } from 'react'
import { Save, Calendar, Settings as SettingsIcon } from 'lucide-react'
import { apiService } from '../services/api'

export default function LeaveSettings() {
  const [settings, setSettings] = useState({ holidayList: [] as any[], workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], weekendDays: ['Saturday', 'Sunday'], financialYearStart: '04-01', payrollIntegration: 'Yes', attendanceSync: 'Yes' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '', type: 'Public' })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await apiService.getLeaveSettings()
      setSettings(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      await apiService.updateLeaveSettings(settings)
      alert('Settings saved!')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const addHoliday = () => {
    if (newHoliday.date && newHoliday.name) {
      setSettings({ ...settings, holidayList: [...settings.holidayList, { ...newHoliday, id: Date.now().toString() }] })
      setNewHoliday({ date: '', name: '', type: 'Public' })
    }
  }

  const removeHoliday = (id: string) => {
    setSettings({ ...settings, holidayList: settings.holidayList.filter(h => h.id !== id) })
  }

  const toggleWorkingDay = (day: string) => {
    if (settings.workingDays.includes(day)) {
      setSettings({ ...settings, workingDays: settings.workingDays.filter(d => d !== day), weekendDays: [...settings.weekendDays, day] })
    } else {
      setSettings({ ...settings, workingDays: [...settings.workingDays, day], weekendDays: settings.weekendDays.filter(d => d !== day) })
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Leave System Settings</h2>
        <button onClick={handleSaveSettings} disabled={saving} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"><Save size={18} /><span>{saving ? 'Saving...' : 'Save'}</span></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center"><Calendar className="mr-2" size={20} />Holiday List</h3>
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-3 gap-2">
              <input type="date" value={newHoliday.date} onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <input type="text" value={newHoliday.name} onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" placeholder="Holiday Name" />
              <button onClick={addHoliday} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Add</button>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {settings.holidayList.map((holiday) => (
              <div key={holiday.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div><p className="font-medium text-sm">{holiday.name}</p><p className="text-xs text-gray-500">{new Date(holiday.date).toLocaleDateString()}</p></div>
                <button onClick={() => removeHoliday(holiday.id)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
              </div>
            ))}
            {settings.holidayList.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No holidays added</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center"><SettingsIcon className="mr-2" size={20} />Working Days</h3>
          <div className="space-y-3">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
              <label key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <span className="font-medium text-sm">{day}</span>
                <input type="checkbox" checked={settings.workingDays.includes(day)} onChange={() => toggleWorkingDay(day)} className="w-5 h-5 text-blue-600" />
              </label>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700"><span className="font-semibold">Working:</span> {settings.workingDays.join(', ')}</p>
            <p className="text-sm text-gray-700 mt-1"><span className="font-semibold">Weekend:</span> {settings.weekendDays.join(', ')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">System Integration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><label className="block text-sm font-medium mb-2">Financial Year Start</label><input type="text" value={settings.financialYearStart} onChange={(e) => setSettings({ ...settings, financialYearStart: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="MM-DD" /><p className="text-xs text-gray-500 mt-1">Format: MM-DD</p></div>
          <div><label className="block text-sm font-medium mb-2">Payroll Integration</label><select value={settings.payrollIntegration} onChange={(e) => setSettings({ ...settings, payrollIntegration: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="Yes">Enabled</option><option value="No">Disabled</option></select><p className="text-xs text-gray-500 mt-1">LWP reflects in payroll</p></div>
          <div><label className="block text-sm font-medium mb-2">Attendance Sync</label><select value={settings.attendanceSync} onChange={(e) => setSettings({ ...settings, attendanceSync: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="Yes">Enabled</option><option value="No">Disabled</option></select><p className="text-xs text-gray-500 mt-1">Sync with attendance</p></div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Integration Status</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2"><div className={`w-2 h-2 rounded-full ${settings.payrollIntegration === 'Yes' ? 'bg-green-500' : 'bg-gray-400'}`} /><span>Payroll: {settings.payrollIntegration === 'Yes' ? 'Active' : 'Inactive'}</span></div>
          <div className="flex items-center space-x-2"><div className={`w-2 h-2 rounded-full ${settings.attendanceSync === 'Yes' ? 'bg-green-500' : 'bg-gray-400'}`} /><span>Attendance: {settings.attendanceSync === 'Yes' ? 'Active' : 'Inactive'}</span></div>
          <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span>Audit Logs: Active</span></div>
        </div>
      </div>
    </div>
  )
}
