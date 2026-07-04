/**
 * ClaimManagement — HR Admin Portal
 * Enterprise-grade claim management with approval workflow,
 * claim type configuration, and full audit trail.
 */
import { useState, useEffect } from 'react'
import {
  DollarSign, Filter, Download, Eye, CheckCircle, XCircle, Clock,
  Plus, Edit2, Trash2, Settings, ChevronDown, RotateCcw, BadgeCheck,
  AlertTriangle, TrendingUp, FileText, X, ChevronRight
} from 'lucide-react'
import { apiService } from '../services/api'

// ── Types ────────────────────────────────────────────────────────────────────
interface ClaimType {
  claimTypeId: string
  name: string
  description: string
  approvalLimit: number
  withinLimitApprover: string
  exceedLimitApprover: string
  ratePerKM: number
  requiresAttachment: boolean
  allowedFileFormats: string[]
  isActive: boolean
}

interface Claim {
  claimId: string
  employeeName: string
  department: string
  designation: string
  claimTypeName: string
  businessPurpose: string
  totalAmount: number
  status: string
  currentStage: string | null
  submittedAt: string
  createdAt: string
  isDraft: boolean
  lineItems?: any[]
  approvalHistory?: any[]
}

const CLAIM_TYPE_NAMES  = ['Travel','Accommodation','Meal','Conveyance','Miscellaneous']
const VALID_STATUSES    = ['Submitted','Under Review','Manager Approved','HR Verified','Accounts Approved','Rejected','Payment Processed','Paid']
const STAGE_LABELS: Record<string,string> = {
  TEAM_LEAD: 'Team Lead / RM', HR: 'HR Admin',
  ACCOUNTS: 'Accounts', FINANCE: 'Finance'
}

const statusColor: Record<string,string> = {
  Draft:              'bg-gray-100 text-gray-600',
  Submitted:          'bg-blue-100 text-blue-700',
  'Under Review':     'bg-yellow-100 text-yellow-700',
  'Manager Approved': 'bg-indigo-100 text-indigo-700',
  'HR Verified':      'bg-purple-100 text-purple-700',
  'Accounts Approved':'bg-teal-100 text-teal-700',
  Returned:           'bg-orange-100 text-orange-700',
  Rejected:           'bg-red-100 text-red-700',
  'Payment Processed':'bg-green-100 text-green-700',
  Paid:               'bg-emerald-100 text-emerald-700',
}

export default function ClaimManagement() {
  // ── State ──────────────────────────────────────────────────────────────
  const [tab, setTab]                       = useState<'claims'|'types'|'pending'>('claims')
  const [claims, setClaims]                 = useState<Claim[]>([])
  const [claimTypes, setClaimTypes]         = useState<ClaimType[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<Claim[]>([])
  const [stats, setStats]                   = useState<any>({})
  const [loading, setLoading]               = useState(true)
  const [filters, setFilters]               = useState({ status: '', claimTypeName: '', employeeId: '' })
  const [selectedClaim, setSelectedClaim]   = useState<Claim | null>(null)
  const [actionModal, setActionModal]       = useState<{claim:Claim,action:string}|null>(null)
  const [actionRemarks, setActionRemarks]   = useState('')
  const [actionStage, setActionStage]       = useState('')
  const [actionLoading, setActionLoading]   = useState(false)
  const [showTypeModal, setShowTypeModal]   = useState(false)
  const [editingType, setEditingType]       = useState<ClaimType|null>(null)
  const [typeForm, setTypeForm]             = useState({
    name: 'Travel', description: '', approvalLimit: 5000,
    ratePerKM: 4, requiresAttachment: true,
    allowedFileFormats: ['pdf','jpg','jpeg','png']
  })

  useEffect(() => { loadAll() }, [])
  useEffect(() => { loadClaims() }, [filters])

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([loadClaims(), loadStats(), loadClaimTypes(), loadPendingApprovals()])
    setLoading(false)
  }

  const loadClaims = async () => {
    try {
      const res = await apiService.getAllClaimsV2(filters)
      if (res.success) setClaims(res.data || [])
    } catch {}
  }

  const loadStats = async () => {
    try {
      const res = await apiService.getClaimStatsV2()
      if (res.success) setStats(res.data || {})
    } catch {}
  }

  const loadClaimTypes = async () => {
    try {
      const res = await apiService.getClaimTypesV2()
      if (res.success) setClaimTypes(res.data || [])
    } catch {}
  }

  const loadPendingApprovals = async () => {
    try {
      const res = await apiService.getPendingApprovalsV2()
      if (res.success) setPendingApprovals(res.data || [])
    } catch {}
  }

  const openClaimDetail = async (claim: Claim) => {
    try {
      const res = await apiService.getClaimByIdV2(claim.claimId)
      if (res.success) setSelectedClaim(res.data)
    } catch { setSelectedClaim(claim) }
  }

  const openActionModal = (claim: Claim, action: string) => {
    setActionModal({ claim, action })
    setActionRemarks('')
    setActionStage(claim.currentStage || 'HR')
  }

  const submitAction = async () => {
    if (!actionModal) return
    if ((actionModal.action === 'Rejected' || actionModal.action === 'Returned') && !actionRemarks.trim()) {
      alert('Remarks are required for rejection/return'); return
    }
    setActionLoading(true)
    try {
      await apiService.processClaimActionV2(actionModal.claim.claimId, {
        action: actionModal.action, remarks: actionRemarks, stage: actionStage
      })
      setActionModal(null)
      setSelectedClaim(null)
      loadAll()
    } catch { alert('Action failed. Please try again.') }
    finally { setActionLoading(false) }
  }

  const markPaid = async (claim: Claim) => {
    const ref = prompt('Enter payment reference (UTR/Cheque/Transfer ID):')
    if (!ref) return
    try {
      await apiService.markClaimPaidV2(claim.claimId, { paymentReference: ref })
      loadAll()
    } catch { alert('Failed to mark as paid') }
  }

  const saveClaimType = async () => {
    try {
      if (editingType) {
        await apiService.updateClaimTypeV2(editingType.claimTypeId, typeForm)
      } else {
        await apiService.createClaimTypeV2(typeForm)
      }
      setShowTypeModal(false); setEditingType(null)
      loadClaimTypes()
    } catch { alert('Failed to save claim type') }
  }

  const deleteClaimType = async (id: string) => {
    if (!confirm('Deactivate this claim type?')) return
    try { await apiService.deleteClaimTypeV2(id); loadClaimTypes() }
    catch { alert('Failed') }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claim Management</h1>
          <p className="text-sm text-gray-500">Enterprise reimbursement management system</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setShowTypeModal(true); setEditingType(null); setTypeForm({ name:'Travel', description:'', approvalLimit:5000, ratePerKM:4, requiresAttachment:true, allowedFileFormats:['pdf','jpg','jpeg','png'] }) }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium">
            <Settings size={16} /> Configure Claim Types
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {[
          { label:'Total',          value: stats.total || 0,            icon: FileText,    color:'blue' },
          { label:'Submitted',      value: stats.submitted || 0,        icon: Clock,       color:'yellow' },
          { label:'Pending Approval',value:stats.underReview || 0,      icon: AlertTriangle,color:'orange' },
          { label:'Approved',       value: (stats.hrVerified||0)+(stats.accountsApproved||0), icon:CheckCircle, color:'green' },
          { label:'Rejected',       value: stats.rejected || 0,         icon: XCircle,     color:'red' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`p-2.5 bg-${color}-50 rounded-xl`}>
              <Icon size={20} className={`text-${color}-500`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key:'claims',  label:'All Claims' },
          { key:'pending', label:`Pending Approval ${pendingApprovals.length > 0 ? `(${pendingApprovals.length})` : ''}` },
          { key:'types',   label:'Claim Types' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── All Claims Tab ── */}
      {tab === 'claims' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm"><Filter size={15} /> Filters:</div>
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
              <option value="">All Statuses</option>
              {VALID_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.claimTypeName} onChange={e => setFilters({ ...filters, claimTypeName: e.target.value })}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
              <option value="">All Types</option>
              {CLAIM_TYPE_NAMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={() => setFilters({ status:'', claimTypeName:'', employeeId:'' })}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">Clear</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Employee','Type','Business Purpose','Amount','Stage','Status','Date','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {claims.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center text-gray-400 text-sm">No claims found</td></tr>
                ) : claims.map(claim => (
                  <tr key={claim.claimId} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{claim.employeeName}</p>
                      <p className="text-xs text-gray-400">{claim.department}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{claim.claimTypeName}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{claim.businessPurpose || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">₹{(claim.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{claim.currentStage ? STAGE_LABELS[claim.currentStage] || claim.currentStage : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[claim.status] || 'bg-gray-100 text-gray-600'}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openClaimDetail(claim)} title="View"
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Eye size={14} /></button>
                        {!['Draft','Rejected','Paid','Payment Processed'].includes(claim.status) && (
                          <>
                            <button onClick={() => openActionModal(claim,'Approved')} title="Approve"
                              className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg"><CheckCircle size={14} /></button>
                            <button onClick={() => openActionModal(claim,'Rejected')} title="Reject"
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><XCircle size={14} /></button>
                            <button onClick={() => openActionModal(claim,'Returned')} title="Return"
                              className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg"><RotateCcw size={14} /></button>
                          </>
                        )}
                        {claim.status === 'Payment Processed' && (
                          <button onClick={() => markPaid(claim)} title="Mark Paid"
                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg"><BadgeCheck size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pending Approvals Tab ── */}
      {tab === 'pending' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Claims Waiting for Action</h3>
          </div>
          {pendingApprovals.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No pending approvals</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingApprovals.map(claim => (
                <div key={claim.claimId} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{claim.employeeName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[claim.status]}`}>{claim.status}</span>
                      <span className="text-xs text-gray-400">{claim.currentStage ? STAGE_LABELS[claim.currentStage] : ''} stage</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{claim.claimTypeName} · ₹{(claim.totalAmount||0).toLocaleString('en-IN')} · {claim.businessPurpose || '—'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openClaimDetail(claim)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">View</button>
                    <button onClick={() => openActionModal(claim,'Approved')} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
                    <button onClick={() => openActionModal(claim,'Rejected')} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Claim Types Tab ── */}
      {tab === 'types' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Configured Claim Types</h3>
            <button onClick={() => { setShowTypeModal(true); setEditingType(null) }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus size={15} /> Add Claim Type
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {claimTypes.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">No claim types configured yet</p>
            ) : claimTypes.map(ct => (
              <div key={ct.claimTypeId} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{ct.name}</span>
                    {ct.name === 'Conveyance' && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">₹{ct.ratePerKM}/km</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{ct.description || '—'}</p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-400">
                    <span>Approval limit: ₹{(ct.approvalLimit||0).toLocaleString('en-IN')}</span>
                    <span>Within limit → {STAGE_LABELS[ct.withinLimitApprover] || ct.withinLimitApprover}</span>
                    <span>Exceed → HR Admin</span>
                    {ct.requiresAttachment && <span>Attachment required</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingType(ct); setTypeForm({ name: ct.name, description: ct.description, approvalLimit: ct.approvalLimit, ratePerKM: ct.ratePerKM, requiresAttachment: ct.requiresAttachment, allowedFileFormats: ct.allowedFileFormats }); setShowTypeModal(true) }}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={15} /></button>
                  <button onClick={() => deleteClaimType(ct.claimTypeId)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Claim Detail Modal ── */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Claim Details</h3>
              <button onClick={() => setSelectedClaim(null)}><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Employee info */}
              <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
                {[
                  ['Employee', selectedClaim.employeeName],
                  ['Department', selectedClaim.department],
                  ['Designation', selectedClaim.designation],
                  ['Claim Type', selectedClaim.claimTypeName],
                  ['Business Purpose', selectedClaim.businessPurpose],
                  ['Total Amount', `₹${(selectedClaim.totalAmount||0).toLocaleString('en-IN')}`],
                ].map(([label,value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="font-medium text-gray-900 text-sm">{value || '—'}</p>
                  </div>
                ))}
              </div>
              {/* Status timeline */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Status</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusColor[selectedClaim.status]}`}>
                  {selectedClaim.status}
                </span>
              </div>
              {/* Line items */}
              {selectedClaim.lineItems && selectedClaim.lineItems.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Expense Items</p>
                  <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>{['Date','Description','Amount','Attachments'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs text-gray-500">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedClaim.lineItems.map((li: any) => (
                        <tr key={li.lineItemId}>
                          <td className="px-3 py-2">{li.date}</td>
                          <td className="px-3 py-2 text-gray-600">{li.description || '—'}</td>
                          <td className="px-3 py-2 font-semibold">₹{(li.amount||0).toLocaleString('en-IN')}</td>
                          <td className="px-3 py-2">
                            {li.attachmentUrls?.length > 0 ? (
                              <div className="flex gap-1 flex-wrap">
                                {li.attachmentUrls.map((url: string, i: number) => {
                                  const name = li.attachmentNames?.[i] || `File ${i+1}`;
                                  const isPdf = url.toLowerCase().includes('.pdf');
                                  return (
                                    <a key={i} href={url} target="_blank" rel="noreferrer" title={name}
                                      className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700 hover:bg-blue-100 max-w-[130px]">
                                      <span>{isPdf ? '📄' : '🖼️'}</span>
                                      <span className="truncate">{name}</span>
                                    </a>
                                  );
                                })}
                              </div>
                            ) : <span className="text-xs text-gray-300">—</span>}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan={2} className="px-3 py-2 text-right text-gray-700">Total</td>
                        <td className="px-3 py-2">₹{(selectedClaim.totalAmount||0).toLocaleString('en-IN')}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              {/* Approval history */}
              {selectedClaim.approvalHistory && selectedClaim.approvalHistory.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Approval History</p>
                  <div className="space-y-2">
                    {selectedClaim.approvalHistory.map((h: any) => (
                      <div key={h.approvalId} className={`flex gap-3 p-3 rounded-lg border text-sm
                        ${h.action==='Approved'?'bg-green-50 border-green-100':h.action==='Rejected'?'bg-red-50 border-red-100':'bg-orange-50 border-orange-100'}`}>
                        <div className="flex-1">
                          <span className="font-medium">{h.approverName || 'HR Admin'}</span>
                          <span className="mx-2 text-gray-400">·</span>
                          <span className="text-xs">{STAGE_LABELS[h.stage] || h.stage}</span>
                          <span className="mx-2 text-gray-400">·</span>
                          <span className={`font-semibold ${h.action==='Approved'?'text-green-700':h.action==='Rejected'?'text-red-700':'text-orange-700'}`}>{h.action}</span>
                        </div>
                        <div className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleString('en-IN')}</div>
                        {h.remarks && <div className="text-xs text-gray-600 mt-1">{h.remarks}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Action buttons */}
              {!['Draft','Rejected','Paid','Payment Processed'].includes(selectedClaim.status) && (
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button onClick={() => { openActionModal(selectedClaim,'Returned'); setSelectedClaim(null) }}
                    className="flex-1 px-4 py-2 border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 text-sm font-medium">Return</button>
                  <button onClick={() => { openActionModal(selectedClaim,'Rejected'); setSelectedClaim(null) }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Reject</button>
                  <button onClick={() => { openActionModal(selectedClaim,'Approved'); setSelectedClaim(null) }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Approve</button>
                </div>
              )}
              {selectedClaim.status === 'Payment Processed' && (
                <button onClick={() => { markPaid(selectedClaim); setSelectedClaim(null) }}
                  className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">Mark as Paid</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Action Modal ── */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-1">
              {actionModal.action === 'Approved' ? '✅ Approve Claim' : actionModal.action === 'Rejected' ? '❌ Reject Claim' : '↩ Return Claim'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {actionModal.claim.employeeName} · ₹{(actionModal.claim.totalAmount||0).toLocaleString('en-IN')} · {actionModal.claim.claimTypeName}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Approval Stage</label>
                <select value={actionStage} onChange={e => setActionStage(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm">
                  {['TEAM_LEAD','HR','ACCOUNTS','FINANCE'].map(s => (
                    <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Remarks {(actionModal.action !== 'Approved') && <span className="text-red-500">*</span>}
                </label>
                <textarea value={actionRemarks} onChange={e => setActionRemarks(e.target.value)}
                  rows={3} placeholder="Add remarks..."
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setActionModal(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={submitAction} disabled={actionLoading}
                className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50
                  ${actionModal.action==='Approved'?'bg-green-600 hover:bg-green-700':actionModal.action==='Rejected'?'bg-red-600 hover:bg-red-700':'bg-orange-500 hover:bg-orange-600'}`}>
                {actionLoading ? 'Processing…' : `Confirm ${actionModal.action}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Claim Type Modal ── */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold">{editingType ? 'Edit Claim Type' : 'Add Claim Type'}</h3>
              <button onClick={() => setShowTypeModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Claim Type *</label>
                <select value={typeForm.name} onChange={e => setTypeForm({ ...typeForm, name: e.target.value })}
                  disabled={!!editingType}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50">
                  {CLAIM_TYPE_NAMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <input value={typeForm.description} onChange={e => setTypeForm({ ...typeForm, description: e.target.value })}
                  placeholder="Optional description" className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Approval Limit (₹)</label>
                  <input type="number" min="0" value={typeForm.approvalLimit}
                    onChange={e => setTypeForm({ ...typeForm, approvalLimit: Number(e.target.value) })}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" />
                  <p className="text-xs text-gray-400 mt-1">Within limit → Team Lead, Over limit → HR</p>
                </div>
                {typeForm.name === 'Conveyance' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Rate per KM (₹)</label>
                    <input type="number" min="0" step="0.5" value={typeForm.ratePerKM}
                      onChange={e => setTypeForm({ ...typeForm, ratePerKM: Number(e.target.value) })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" />
                  </div>
                )}
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={typeForm.requiresAttachment}
                  onChange={e => setTypeForm({ ...typeForm, requiresAttachment: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-700">Require supporting document attachment</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowTypeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={saveClaimType}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                {editingType ? 'Update' : 'Create'} Claim Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
