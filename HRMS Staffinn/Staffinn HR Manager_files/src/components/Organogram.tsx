import { useState, useEffect } from 'react'
import { Plus, Edit, Trash, Users, Building2, ChevronDown, ChevronRight, GitBranch, List } from 'lucide-react'
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

export default function Organogram() {
  const [orgData, setOrgData] = useState<{ nodes: OrgNode[], hierarchy: OrgNode[] }>({ nodes: [], hierarchy: [] })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [showAddForm, setShowAddForm] = useState(false)
  const [viewMode, setViewMode] = useState<'diagram' | 'list'>('diagram')
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null)
  const [formData, setFormData] = useState({
    employeeId: '',
    parentId: '',
    level: 0,
    position: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('Loading organization data...')
      const [orgResponse, empResponse] = await Promise.all([
        apiService.getOrganizationChart(),
        apiService.getEmployees()
      ])
      
      console.log('Organization response:', orgResponse)
      console.log('Employees response:', empResponse)
      
      if (orgResponse.success) {
        console.log('Setting org data:', orgResponse.data)
        setOrgData(orgResponse.data)
      } else {
        console.error('Organization API failed:', orgResponse)
      }
      
      if (empResponse.success) {
        console.log('Setting employees data:', empResponse.data)
        setEmployees(empResponse.data)
      } else {
        console.error('Employees API failed:', empResponse)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.position.trim()) {
      alert('Position title is required')
      return
    }
    
    try {
      console.log('Creating org node with data:', formData)
      const response = await apiService.createOrgNode(formData)
      console.log('Create org node response:', response)
      
      if (response.success) {
        await loadData()
        setShowAddForm(false)
        setFormData({ employeeId: '', parentId: '', level: 0, position: '' })
      } else {
        console.error('API returned error:', response)
        alert(response.message || 'Failed to create organization node')
      }
    } catch (error) {
      console.error('Error creating node:', error)
      alert(error.message || 'Failed to create organization node')
    }
  }

  const handleEditNode = (node: OrgNode) => {
    setEditingNode(node)
    setFormData({
      employeeId: node.employeeId,
      parentId: node.parentId || '',
      level: node.level,
      position: node.position
    })
    setShowAddForm(true)
  }

  const handleUpdateNode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNode) return

    try {
      const response = await apiService.updateOrgNode(editingNode.nodeId, formData)
      if (response.success) {
        await loadData()
        setShowAddForm(false)
        setEditingNode(null)
        setFormData({ employeeId: '', parentId: '', level: 0, position: '' })
      }
    } catch (error) {
      console.error('Error updating node:', error)
      alert('Failed to update organization node')
    }
  }

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('Are you sure you want to delete this organization node?')) return

    try {
      const response = await apiService.deleteOrgNode(nodeId)
      if (response.success) {
        await loadData()
      }
    } catch (error) {
      console.error('Error deleting node:', error)
      alert('Failed to delete organization node')
    }
  }

  const renderOrgNode = (node: OrgNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.nodeId)

    return (
      <div key={node.nodeId} className="mb-2">
        <div 
          className={`flex items-center p-3 bg-white rounded-lg shadow border-l-4 border-blue-500 ml-${depth * 8}`}
          style={{ marginLeft: `${depth * 2}rem` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.nodeId)}
              className="mr-2 p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {node.employee ? (node.employee.fullName || node.employee.name || 'Unknown') : 'No Employee Assigned'}
                </h4>
                <p className="text-sm text-gray-600">
                  {node.position || (node.employee && (node.employee.designation || node.employee.position)) || 'No Position'}
                </p>
                <p className="text-xs text-gray-500">
                  {node.employee?.department || 'No Department'} • Level {node.level}
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleEditNode(node)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              title="Edit Node"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDeleteNode(node.nodeId)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
              title="Delete Node"
            >
              <Trash size={16} />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2">
            {node.children.map(child => renderOrgNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderDiagramNode = (node: OrgNode, x: number, y: number, level: number): JSX.Element => {
    const nodeWidth = 200
    const nodeHeight = 100
    const hasChildren = node.children && node.children.length > 0
    
    return (
      <g key={node.nodeId}>
        {/* Node Box */}
        <rect
          x={x - nodeWidth/2}
          y={y}
          width={nodeWidth}
          height={nodeHeight}
          rx={8}
          fill="white"
          stroke="#3B82F6"
          strokeWidth={2}
          className="drop-shadow-md"
        />
        
        {/* Employee Avatar */}
        {node.employee?.profilePictureUrl ? (
          <image
            x={x - nodeWidth/2 + 10}
            y={y + 10}
            width={40}
            height={40}
            href={node.employee.profilePictureUrl}
            clipPath="circle(20px at 20px 20px)"
          />
        ) : (
          <>
            <circle
              cx={x - nodeWidth/2 + 30}
              cy={y + 30}
              r={20}
              fill="#DBEAFE"
              stroke="#3B82F6"
              strokeWidth={2}
            />
            <text
              x={x - nodeWidth/2 + 30}
              y={y + 35}
              textAnchor="middle"
              className="text-sm font-semibold fill-blue-600"
            >
              {node.employee && (node.employee.fullName || node.employee.name) ? 
                (node.employee.fullName || node.employee.name).charAt(0).toUpperCase() : '?'}
            </text>
          </>
        )}
        
        {/* Employee Name */}
        <text
          x={x - nodeWidth/2 + 65}
          y={y + 25}
          className="text-sm font-semibold fill-gray-900"
        >
          {node.employee ? 
            ((node.employee.fullName || node.employee.name || '').length > 15 ? 
              (node.employee.fullName || node.employee.name || '').substring(0, 15) + '...' : 
              (node.employee.fullName || node.employee.name || 'Unknown')) : 
            'Vacant Position'
          }
        </text>
        
        {/* Position Title */}
        <text
          x={x - nodeWidth/2 + 65}
          y={y + 45}
          className="text-xs fill-gray-600"
        >
          {node.position.length > 20 ? node.position.substring(0, 20) + '...' : node.position}
        </text>
        
        {/* Department & Level */}
        <text
          x={x - nodeWidth/2 + 65}
          y={y + 60}
          className="text-xs fill-gray-500"
        >
          {node.employee?.department || 'No Dept'} • L{node.level}
        </text>
        
        {/* Team Name */}
        {node.employee?.teamName && (
          <text
            x={x - nodeWidth/2 + 65}
            y={y + 75}
            className="text-xs fill-blue-600 font-semibold"
          >
            Team: {node.employee.teamName}
          </text>
        )}
        
        {/* Action Buttons */}
        <g>
          <rect
            x={x + nodeWidth/2 - 60}
            y={y + 75}
            width={25}
            height={20}
            rx={4}
            fill="#EFF6FF"
            stroke="#3B82F6"
            className="cursor-pointer hover:fill-blue-50"
            onClick={() => handleEditNode(node)}
          />
          <text
            x={x + nodeWidth/2 - 47.5}
            y={y + 87}
            textAnchor="middle"
            className="text-xs fill-blue-600 cursor-pointer"
            onClick={() => handleEditNode(node)}
          >
            ✎
          </text>
          
          <rect
            x={x + nodeWidth/2 - 30}
            y={y + 75}
            width={25}
            height={20}
            rx={4}
            fill="#FEF2F2"
            stroke="#EF4444"
            className="cursor-pointer hover:fill-red-50"
            onClick={() => handleDeleteNode(node.nodeId)}
          />
          <text
            x={x + nodeWidth/2 - 17.5}
            y={y + 87}
            textAnchor="middle"
            className="text-xs fill-red-600 cursor-pointer"
            onClick={() => handleDeleteNode(node.nodeId)}
          >
            ✕
          </text>
        </g>
        
        {/* Connection Lines to Children */}
        {hasChildren && node.children.map((child, index) => {
          const childrenCount = node.children.length
          const childX = x + (index - (childrenCount - 1) / 2) * 250
          const childY = y + 150
          
          return (
            <g key={`line-${child.nodeId}`}>
              {/* Vertical line down */}
              <line
                x1={x}
                y1={y + nodeHeight}
                x2={x}
                y2={y + nodeHeight + 25}
                stroke="#6B7280"
                strokeWidth={2}
              />
              
              {/* Horizontal line */}
              {childrenCount > 1 && (
                <line
                  x1={x + (0 - (childrenCount - 1) / 2) * 250}
                  y1={y + nodeHeight + 25}
                  x2={x + ((childrenCount - 1) - (childrenCount - 1) / 2) * 250}
                  y2={y + nodeHeight + 25}
                  stroke="#6B7280"
                  strokeWidth={2}
                />
              )}
              
              {/* Vertical line to child */}
              <line
                x1={childX}
                y1={y + nodeHeight + 25}
                x2={childX}
                y2={childY}
                stroke="#6B7280"
                strokeWidth={2}
              />
            </g>
          )
        })}
        
        {/* Render Children */}
        {hasChildren && node.children.map((child, index) => {
          const childrenCount = node.children.length
          const childX = x + (index - (childrenCount - 1) / 2) * 250
          const childY = y + 150
          
          return renderDiagramNode(child, childX, childY, level + 1)
        })}
      </g>
    )
  }

  const renderDiagram = () => {
    if (orgData.hierarchy.length === 0) {
      return (
        <div className="text-center py-16 text-gray-500">
          <Building2 size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg">No organizational structure defined yet.</p>
          <p className="text-sm">Add positions to build your organization chart.</p>
        </div>
      )
    }

    // Calculate SVG dimensions based on hierarchy
    const maxLevel = Math.max(...orgData.nodes.map(n => n.level))
    const svgHeight = Math.max(600, (maxLevel + 1) * 200)
    const svgWidth = Math.max(1000, orgData.hierarchy.length * 300)

    return (
      <div className="overflow-auto bg-gray-50 rounded-lg p-4" style={{ minHeight: '500px' }}>
        <svg width={svgWidth} height={svgHeight} className="mx-auto">
          {orgData.hierarchy.map((node, index) => {
            const x = (index + 1) * (svgWidth / (orgData.hierarchy.length + 1))
            const y = 50
            return renderDiagramNode(node, x, y, 0)
          })}
        </svg>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organization chart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Chart</h1>
          <p className="text-gray-600">Visual representation of company hierarchy and reporting structure</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('diagram')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'diagram' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <GitBranch size={16} />
              <span>Diagram</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List size={16} />
              <span>List</span>
            </button>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            <span>Add Position</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Building2 className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Positions</p>
              <p className="text-2xl font-bold text-gray-900">{orgData.nodes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Filled Positions</p>
              <p className="text-2xl font-bold text-gray-900">
                {orgData.nodes.filter(n => n.employee).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-full">
              <Building2 className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Vacant Positions</p>
              <p className="text-2xl font-bold text-gray-900">
                {orgData.nodes.filter(n => !n.employee).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Organizational Hierarchy</h3>
        
        
        {viewMode === 'diagram' ? (
          renderDiagram()
        ) : (
          orgData.hierarchy.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No organizational structure defined yet.</p>
              <p className="text-sm">Add positions to build your organization chart.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orgData.hierarchy.map(node => renderOrgNode(node))}
            </div>
          )
        )}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingNode ? 'Edit Position' : 'Add New Position'}
            </h3>

            <form onSubmit={editingNode ? handleUpdateNode : handleAddNode} className="space-y-4">
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Employee (Vacant Position)</option>
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.fullName || emp.name || 'Unknown'} - {emp.designation || emp.position || 'No Position'}
                  </option>
                ))}
              </select>

              <select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Parent (Top Level)</option>
                {orgData.nodes.map((node) => (
                  <option key={node.nodeId} value={node.nodeId}>
                    {(node.employee && (node.employee.fullName || node.employee.name)) || 'Vacant'} - {node.position}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Hierarchy Level"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 0 })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
              />

              <input
                type="text"
                placeholder="Position Title *"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingNode(null)
                    setFormData({ employeeId: '', parentId: '', level: 0, position: '' })
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
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