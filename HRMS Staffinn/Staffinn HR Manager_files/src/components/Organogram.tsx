import { useState, useEffect, useRef } from 'react'
import { Plus, Edit, Trash, Users, Building2, GitBranch, List, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { apiService } from '../services/api'

interface Employee {
  employeeId: string
  name?: string
  fullName?: string
  email: string
  position?: string
  designation?: string
  department: string
  teamName?: string
  isPeopleManager?: string
  roleLevel?: string
  profilePictureUrl?: string
}

interface OrgNode {
  nodeId: string
  employeeId: string
  parentId: string | null
  level: number
  position: string
  children: OrgNode[]
  employee: Employee | null
}

// ── Role badge color ─────────────────────────────────────────────────────────
const roleBadgeColor = (level: string | undefined) => {
  switch (level) {
    case 'RM':         return 'bg-purple-100 text-purple-700'
    case 'Manager':    return 'bg-blue-100 text-blue-700'
    case 'Team Lead':  return 'bg-green-100 text-green-700'
    case 'Employee':   return 'bg-gray-100 text-gray-600'
    default:           return 'bg-gray-100 text-gray-600'
  }
}

export default function Organogram() {
  const [orgData, setOrgData] = useState<{ nodes: OrgNode[], hierarchy: OrgNode[] }>({ nodes: [], hierarchy: [] })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [showAddForm, setShowAddForm] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'diagram'>('list')
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)
  const [formData, setFormData] = useState({ employeeId: '', parentId: '', level: 0, position: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [orgResponse, empResponse] = await Promise.all([
        apiService.getOrganizationChart(),
        apiService.getEmployees()
      ])
      if (orgResponse.success) setOrgData(orgResponse.data)
      if (empResponse.success) setEmployees(empResponse.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // expand all nodes by default
  useEffect(() => {
    if (orgData.nodes.length > 0) {
      setExpandedNodes(new Set(orgData.nodes.map(n => n.nodeId)))
    }
  }, [orgData])

  const toggleNode = (nodeId: string) => {
    const s = new Set(expandedNodes)
    s.has(nodeId) ? s.delete(nodeId) : s.add(nodeId)
    setExpandedNodes(s)
  }

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.position.trim()) { alert('Position title is required'); return }
    try {
      const res = await apiService.createOrgNode(formData)
      if (res.success) { await loadData(); setShowAddForm(false); setFormData({ employeeId: '', parentId: '', level: 0, position: '' }) }
      else alert(res.message || 'Failed to create node')
    } catch (err: any) { alert(err.message || 'Failed') }
  }

  const handleEditNode = (node: OrgNode) => {
    setEditingNode(node)
    setFormData({ employeeId: node.employeeId, parentId: node.parentId || '', level: node.level, position: node.position })
    setShowAddForm(true)
  }

  const handleUpdateNode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNode) return
    try {
      const res = await apiService.updateOrgNode(editingNode.nodeId, formData)
      if (res.success) { await loadData(); setShowAddForm(false); setEditingNode(null); setFormData({ employeeId: '', parentId: '', level: 0, position: '' }) }
    } catch { alert('Failed to update') }
  }

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('Delete this node?')) return
    try {
      const res = await apiService.deleteOrgNode(nodeId)
      if (res.success) await loadData()
    } catch { alert('Failed to delete') }
  }

  // ── Zoom / Pan handlers ────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsPanning(true)
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y })
  }

  const handleMouseUp = () => setIsPanning(false)
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  // ── List view: recursive card ──────────────────────────────────────────────
  const renderListNode = (node: OrgNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.nodeId)
    const emp = node.employee
    const initials = emp ? (emp.fullName || emp.name || '?').charAt(0).toUpperCase() : '?'
    const roleLevel = emp?.roleLevel

    return (
      <div key={node.nodeId} style={{ marginLeft: depth * 28 }}>
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 mb-2 shadow-sm hover:shadow-md transition-shadow">
          {/* expand toggle */}
          <button
            onClick={() => hasChildren && toggleNode(node.nodeId)}
            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold transition-colors
              ${hasChildren ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer' : 'cursor-default opacity-0'}`}
          >
            {isExpanded ? '−' : '+'}
          </button>

          {/* avatar */}
          <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center text-blue-700 font-bold text-base flex-shrink-0 overflow-hidden">
            {emp?.profilePictureUrl
              ? <img src={emp.profilePictureUrl} alt="" className="w-full h-full object-cover" />
              : initials}
          </div>

          {/* info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm truncate">
                {emp ? (emp.fullName || emp.name || 'Unknown') : 'Vacant Position'}
              </span>
              {roleLevel && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor(roleLevel)}`}>
                  {roleLevel}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {node.position || emp?.designation || '—'} &bull; {emp?.department || 'No Dept'} &bull; L{node.level}
            </p>
          </div>

          {/* actions */}
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => handleEditNode(node)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit">
              <Edit size={14} />
            </button>
            <button onClick={() => handleDeleteNode(node.nodeId)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
              <Trash size={14} />
            </button>
          </div>
        </div>

        {/* connector line */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-dashed border-blue-200 ml-7 pl-2">
            {node.children.map(child => renderListNode(child, 0))}
          </div>
        )}
      </div>
    )
  }

  // ── Diagram: measure tree width recursively ───────────────────────────────
  const NODE_W = 220
  const NODE_H = 110
  const H_GAP = 40   // horizontal gap between siblings
  const V_GAP = 80   // vertical gap between levels

  const measureWidth = (node: OrgNode): number => {
    if (!node.children || node.children.length === 0) return NODE_W
    const childTotal = node.children.reduce((sum, c) => sum + measureWidth(c) + H_GAP, -H_GAP)
    return Math.max(NODE_W, childTotal)
  }

  const renderDiagramNode = (node: OrgNode, cx: number, cy: number): JSX.Element[] => {
    const emp = node.employee
    const initials = emp ? (emp.fullName || emp.name || '?').charAt(0).toUpperCase() : '?'
    const name = emp ? (emp.fullName || emp.name || 'Unknown') : 'Vacant'
    const title = (node.position || emp?.designation || '').substring(0, 22) + ((node.position || emp?.designation || '').length > 22 ? '…' : '')
    const dept = (emp?.department || 'No Dept').substring(0, 20)
    const roleLevel = emp?.roleLevel

    const elements: JSX.Element[] = []

    // card shadow rect
    elements.push(
      <rect key={`shadow-${node.nodeId}`} x={cx - NODE_W/2 + 3} y={cy + 3}
        width={NODE_W} height={NODE_H} rx={12} fill="rgba(0,0,0,0.08)" />
    )
    // card
    elements.push(
      <rect key={`card-${node.nodeId}`} x={cx - NODE_W/2} y={cy}
        width={NODE_W} height={NODE_H} rx={12} fill="white"
        stroke={roleLevel === 'RM' ? '#7C3AED' : roleLevel === 'Manager' ? '#2563EB' : roleLevel === 'Team Lead' ? '#059669' : '#CBD5E1'}
        strokeWidth={2} />
    )
    // avatar bg
    elements.push(
      <circle key={`av-bg-${node.nodeId}`} cx={cx - NODE_W/2 + 32} cy={cy + 38}
        r={22} fill="#DBEAFE" stroke="#3B82F6" strokeWidth={2} />
    )
    // avatar initials
    elements.push(
      <text key={`av-txt-${node.nodeId}`} x={cx - NODE_W/2 + 32} y={cy + 44}
        textAnchor="middle" fontSize={14} fontWeight="700" fill="#1D4ED8">{initials}</text>
    )
    // name
    elements.push(
      <text key={`name-${node.nodeId}`} x={cx - NODE_W/2 + 64} y={cy + 24}
        fontSize={12} fontWeight="700" fill="#111827"
      >{name.length > 18 ? name.substring(0, 18) + '…' : name}</text>
    )
    // role badge bg
    if (roleLevel) {
      const badgeColors: Record<string, string> = { RM: '#EDE9FE', Manager: '#DBEAFE', 'Team Lead': '#D1FAE5', Employee: '#F1F5F9' }
      const badgeText: Record<string, string> = { RM: '#6D28D9', Manager: '#1D4ED8', 'Team Lead': '#065F46', Employee: '#475569' }
      elements.push(<rect key={`badge-bg-${node.nodeId}`} x={cx - NODE_W/2 + 64} y={cy + 29} width={roleLevel.length * 7 + 8} height={14} rx={7} fill={badgeColors[roleLevel] || '#F1F5F9'} />)
      elements.push(<text key={`badge-${node.nodeId}`} x={cx - NODE_W/2 + 68} y={cy + 40} fontSize={9} fontWeight="600" fill={badgeText[roleLevel] || '#475569'}>{roleLevel}</text>)
    }
    // title
    elements.push(
      <text key={`title-${node.nodeId}`} x={cx - NODE_W/2 + 64} y={cy + 56}
        fontSize={10} fill="#4B5563">{title}</text>
    )
    // dept + level
    elements.push(
      <text key={`dept-${node.nodeId}`} x={cx - NODE_W/2 + 64} y={cy + 70}
        fontSize={9} fill="#9CA3AF">{dept} • L{node.level}</text>
    )
    // edit button
    elements.push(
      <g key={`edit-${node.nodeId}`} onClick={() => handleEditNode(node)} style={{ cursor: 'pointer' }}>
        <rect x={cx + NODE_W/2 - 52} y={cy + NODE_H - 24} width={22} height={18} rx={4} fill="#EFF6FF" stroke="#BFDBFE" />
        <text x={cx + NODE_W/2 - 41} y={cy + NODE_H - 11} textAnchor="middle" fontSize={11} fill="#2563EB">✎</text>
      </g>
    )
    // delete button
    elements.push(
      <g key={`del-${node.nodeId}`} onClick={() => handleDeleteNode(node.nodeId)} style={{ cursor: 'pointer' }}>
        <rect x={cx + NODE_W/2 - 26} y={cy + NODE_H - 24} width={22} height={18} rx={4} fill="#FEF2F2" stroke="#FECACA" />
        <text x={cx + NODE_W/2 - 15} y={cy + NODE_H - 11} textAnchor="middle" fontSize={11} fill="#DC2626">✕</text>
      </g>
    )

    // children
    if (node.children && node.children.length > 0) {
      const childWidths = node.children.map(c => measureWidth(c))
      const totalW = childWidths.reduce((s, w) => s + w + H_GAP, -H_GAP)
      let childX = cx - totalW / 2

      // vertical stem down from parent
      elements.push(<line key={`stem-${node.nodeId}`} x1={cx} y1={cy + NODE_H} x2={cx} y2={cy + NODE_H + V_GAP/2} stroke="#94A3B8" strokeWidth={1.5} />)

      // horizontal bar
      if (node.children.length > 1) {
        const firstChildCX = childX + childWidths[0] / 2
        const lastChildCX = cx + totalW/2 - childWidths[node.children.length-1]/2
        elements.push(<line key={`hbar-${node.nodeId}`} x1={firstChildCX} y1={cy + NODE_H + V_GAP/2} x2={lastChildCX} y2={cy + NODE_H + V_GAP/2} stroke="#94A3B8" strokeWidth={1.5} />)
      }

      node.children.forEach((child, i) => {
        const childCX = childX + childWidths[i] / 2
        const childCY = cy + NODE_H + V_GAP
        // stem down to child
        elements.push(<line key={`cstem-${child.nodeId}`} x1={childCX} y1={cy + NODE_H + V_GAP/2} x2={childCX} y2={childCY} stroke="#94A3B8" strokeWidth={1.5} />)
        elements.push(...renderDiagramNode(child, childCX, childCY))
        childX += childWidths[i] + H_GAP
      })
    }

    return elements
  }

  const renderDiagram = () => {
    if (orgData.hierarchy.length === 0) {
      return (
        <div className="text-center py-16 text-gray-400">
          <Building2 size={56} className="mx-auto mb-3 opacity-30" />
          <p>No organizational structure yet. Add positions to get started.</p>
        </div>
      )
    }

    // total width for all roots side by side
    const rootWidths = orgData.hierarchy.map(n => measureWidth(n))
    const totalRootsW = rootWidths.reduce((s, w) => s + w + H_GAP * 2, 0)
    const svgW = Math.max(900, totalRootsW + 80)

    // height: deepest node level
    const maxLevel = orgData.nodes.length > 0 ? Math.max(...orgData.nodes.map(n => n.level)) : 0
    const svgH = Math.max(400, (maxLevel + 1) * (NODE_H + V_GAP) + 120)

    let rootX = 40
    const allElements: JSX.Element[] = []
    orgData.hierarchy.forEach((node, i) => {
      const cx = rootX + rootWidths[i] / 2
      allElements.push(...renderDiagramNode(node, cx, 40))
      rootX += rootWidths[i] + H_GAP * 2
    })

    return (
      <div
        className="relative bg-slate-50 rounded-xl border border-slate-200"
        style={{ height: 520, overflow: 'hidden', cursor: isPanning ? 'grabbing' : 'grab', userSelect: 'none' }}
        onWheel={(e) => {
          // prevent page scroll, only zoom diagram
          e.preventDefault()
          e.stopPropagation()
          const delta = e.deltaY > 0 ? -0.1 : 0.1
          setZoom(z => Math.min(3, Math.max(0.3, +(z + delta).toFixed(2))))
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* zoom controls — fixed inside container */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 z-10" onMouseDown={e => e.stopPropagation()}>
          <button onClick={() => setZoom(z => Math.min(3, +(z + 0.15).toFixed(2)))}
            className="w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 text-gray-600">
            <ZoomIn size={15} />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.15).toFixed(2)))}
            className="w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 text-gray-600">
            <ZoomOut size={15} />
          </button>
          <button onClick={resetView}
            className="w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 text-gray-600" title="Reset view">
            <Maximize2 size={13} />
          </button>
          <span className="text-center text-xs text-gray-400 mt-0.5">{Math.round(zoom * 100)}%</span>
        </div>

        <div className="absolute bottom-3 left-3 text-xs text-gray-400 select-none z-10 bg-white/70 px-2 py-1 rounded-md">
          Scroll to zoom • Drag to pan
        </div>

        {/* SVG fills container, transform only on inner <g> so header/stats stay fixed */}
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ display: 'block' }}
          className="select-none"
        >
          <g style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
            {allElements}
          </g>
        </svg>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">Loading organization chart…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Chart</h1>
          <p className="text-sm text-gray-500">Company hierarchy and reporting structure</p>
        </div>
        <div className="flex items-center gap-3">
          {/* view toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <List size={15} /> List
            </button>
            <button onClick={() => setViewMode('diagram')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${viewMode === 'diagram' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <GitBranch size={15} /> Diagram
            </button>
          </div>
          <button onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={15} /> Add Position
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Positions', value: orgData.nodes.length, color: 'blue', Icon: Building2 },
          { label: 'Filled',          value: orgData.nodes.filter(n => n.employee).length, color: 'green', Icon: Users },
          { label: 'Vacant',          value: orgData.nodes.filter(n => !n.employee).length, color: 'orange', Icon: Building2 },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className={`p-3 bg-${color}-50 rounded-xl`}>
              <Icon size={22} className={`text-${color}-500`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main view */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Organizational Hierarchy</h3>

        {viewMode === 'list' ? (
          orgData.hierarchy.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Building2 size={48} className="mx-auto mb-3 opacity-30" />
              <p>No organizational structure yet.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {orgData.hierarchy.map(node => renderListNode(node, 0))}
            </div>
          )
        ) : renderDiagram()}
      </div>

      {/* Add/Edit modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">{editingNode ? 'Edit Position' : 'Add New Position'}</h3>
            <form onSubmit={editingNode ? handleUpdateNode : handleAddNode} className="space-y-4">
              <select value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">No Employee (Vacant)</option>
                {employees.map(emp => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.fullName || emp.name} — {emp.designation || emp.position || 'No Position'}
                  </option>
                ))}
              </select>
              <select value={formData.parentId} onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">No Parent (Top Level)</option>
                {orgData.nodes.map(node => (
                  <option key={node.nodeId} value={node.nodeId}>
                    {(node.employee && (node.employee.fullName || node.employee.name)) || 'Vacant'} — {node.position}
                  </option>
                ))}
              </select>
              <input type="number" placeholder="Hierarchy Level" min="0" value={formData.level}
                onChange={e => setFormData({ ...formData, level: parseInt(e.target.value) || 0 })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <input type="text" placeholder="Position Title *" value={formData.position}
                onChange={e => setFormData({ ...formData, position: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowAddForm(false); setEditingNode(null); setFormData({ employeeId: '', parentId: '', level: 0, position: '' }) }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
                <button type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                  {editingNode ? 'Update' : 'Add'} Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
