/**
 * HolidayManagement.tsx
 * Full CRUD holiday calendar with real-time save/update/delete.
 * 26 Jan + 15 Aug are mandatory national holidays (cannot be deleted).
 */
import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Save, X, Calendar, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { apiService } from '../services/api'

interface Holiday {
  holidayId: string
  date: string
  name: string
  type: string
  description?: string
  mandatory?: boolean
}

const HOLIDAY_TYPES = ['National', 'Public', 'Declared', 'Restricted', 'Company']

export default function HolidayManagement() {
  const [holidays, setHolidays]       = useState<Holiday[]>([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [toast, setToast]             = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [newHoliday, setNewHoliday]   = useState({ date: '', name: '', type: 'Declared', description: '' })
  const [editData, setEditData]       = useState<Partial<Holiday>>({})
  const [showAddForm, setShowAddForm] = useState(false)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const load = async () => {
    try {
      setLoading(true)
      const res = await apiService.getHolidays()
      setHolidays(res.data || [])
    } catch { showToast('error', 'Failed to load holidays') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  /* ── Seed national holidays ── */
  const handleSeedNational = async () => {
    try {
      setSaving(true)
      const res = await apiService.seedNationalHolidays()
      showToast('success', `Seeded ${res.data?.length || 0} national holidays`)
      await load()
    } catch { showToast('error', 'Failed to seed national holidays') }
    finally { setSaving(false) }
  }

  /* ── Add holiday ── */
  const handleAdd = async () => {
    if (!newHoliday.date || !newHoliday.name.trim()) {
      showToast('error', 'Date and name are required')
      return
    }
    try {
      setSaving(true)
      await apiService.createHoliday(newHoliday)
      setNewHoliday({ date: '', name: '', type: 'Declared', description: '' })
      setShowAddForm(false)
      showToast('success', 'Holiday added successfully')
      await load()
    } catch (e: any) { showToast('error', e.message || 'Failed to add holiday') }
    finally { setSaving(false) }
  }

  /* ── Start edit ── */
  const startEdit = (h: Holiday) => {
    setEditingId(h.holidayId)
    setEditData({ date: h.date, name: h.name, type: h.type, description: h.description || '' })
  }

  /* ── Save edit ── */
  const handleSaveEdit = async (holidayId: string) => {
    if (!editData.name?.trim()) { showToast('error', 'Name is required'); return }
    try {
      setSaving(true)
      await apiService.updateHoliday(holidayId, editData)
      setEditingId(null)
      showToast('success', 'Holiday updated')
      await load()
    } catch (e: any) { showToast('error', e.message || 'Failed to update') }
    finally { setSaving(false) }
  }

  /* ── Delete ── */
  const handleDelete = async (h: Holiday) => {
    if (h.mandatory) { showToast('error', 'Cannot delete mandatory national holiday'); return }
    if (!confirm(`Delete "${h.name}"?`)) return
    try {
      setSaving(true)
      await apiService.deleteHoliday(h.holidayId)
      showToast('success', 'Holiday deleted')
      await load()
    } catch (e: any) { showToast('error', e.message || 'Failed to delete') }
    finally { setSaving(false) }
  }

  /* ── Group by month ── */
  const grouped = holidays.reduce((acc: Record<string, Holiday[]>, h) => {
    const key = h.date.substring(0, 7) // YYYY-MM
    if (!acc[key]) acc[key] = []
    acc[key].push(h)
    return acc
  }, {})
  const sortedMonths = Object.keys(grouped).sort()

  const monthLabel = (key: string) => {
    const [y, m] = key.split('-')
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  const typeColor = (type: string) => {
    switch (type) {
      case 'National':  return 'bg-red-100 text-red-800'
      case 'Public':    return 'bg-orange-100 text-orange-800'
      case 'Declared':  return 'bg-blue-100 text-blue-800'
      case 'Restricted':return 'bg-purple-100 text-purple-800'
      case 'Company':   return 'bg-green-100 text-green-800'
      default:          return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm
          ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Holiday Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {holidays.length} holiday{holidays.length !== 1 ? 's' : ''} declared · 26 Jan &amp; 15 Aug are compulsory
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={handleSeedNational} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">
            <Calendar size={15} /> Seed National Holidays
          </button>
          <button onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={15} /> Add Holiday
          </button>
        </div>
      </div>

      {/* Add Holiday Form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-blue-900">New Holiday</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" value={newHoliday.date}
                onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" placeholder="e.g. Diwali" value={newHoliday.name}
                onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select value={newHoliday.type}
                onChange={e => setNewHoliday({ ...newHoliday, type: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none">
                {HOLIDAY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <input type="text" placeholder="Optional" value={newHoliday.description}
                onChange={e => setNewHoliday({ ...newHoliday, description: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAdd} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save size={15} /> {saving ? 'Saving…' : 'Save Holiday'}
            </button>
          </div>
        </div>
      )}

      {/* Holiday list grouped by month */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : holidays.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No holidays declared yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Seed National Holidays" to add 26 Jan &amp; 15 Aug, or add manually.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedMonths.map(mKey => (
            <div key={mKey} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">{monthLabel(mKey)}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {grouped[mKey].sort((a, b) => a.date.localeCompare(b.date)).map(h => (
                  <div key={h.holidayId} className="px-5 py-4">
                    {editingId === h.holidayId ? (
                      /* Edit row */
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                        <input type="date" value={editData.date || ''}
                          onChange={e => setEditData({ ...editData, date: e.target.value })}
                          className="px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                        <input type="text" value={editData.name || ''}
                          onChange={e => setEditData({ ...editData, name: e.target.value })}
                          className="px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                        <select value={editData.type || 'Declared'}
                          onChange={e => setEditData({ ...editData, type: e.target.value })}
                          className="px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none">
                          {HOLIDAY_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveEdit(h.holidayId)} disabled={saving}
                            className="flex items-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                            <Save size={14} /> Save
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display row */
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-14 text-center flex-shrink-0">
                            <p className="text-lg font-bold text-gray-900 leading-none">
                              {new Date(h.date + 'T00:00:00').getDate()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(h.date + 'T00:00:00').toLocaleString('default', { weekday: 'short' })}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-gray-900 text-sm">{h.name}</p>
                              {h.mandatory && (
                                <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                                  Compulsory
                                </span>
                              )}
                            </div>
                            {h.description && <p className="text-xs text-gray-500 mt-0.5">{h.description}</p>}
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${typeColor(h.type)}`}>
                            {h.type}
                          </span>
                        </div>
                        {!h.mandatory && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => startEdit(h)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit2 size={15} />
                            </button>
                            <button onClick={() => handleDelete(h)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Policy note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">Leave Policy — Declared Holidays</p>
        <p className="text-sm text-amber-700">
          Declared Holidays (DH) have no limit — purely at HRD discretion. Two compulsory DHs: 26th January (Republic Day) and 15th August (Independence Day).
          Employees working on Sunday, DH, or HRD-announced working days are eligible for Compensatory Off (CO): Full Day = 5h service, Half Day = 2.5h service.
          Must be approved by Team Lead.
        </p>
      </div>
    </div>
  )
}
