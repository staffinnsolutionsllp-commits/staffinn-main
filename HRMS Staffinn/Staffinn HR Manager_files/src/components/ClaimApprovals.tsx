/**
 * ClaimApprovals — Phase 4
 * Dedicated approval portal for Team Lead / RM, Accounts, and Finance approvers.
 * Shows claims routed to the logged-in user's stage, full detail view,
 * approve / reject / return with remarks, and complete audit trail.
 */
import { useState, useEffect } from 'react'
import {
  CheckCircle, XCircle, RotateCcw, Eye, Clock, AlertCircle,
  ChevronLeft, X, BadgeCheck, FileText, TrendingUp, Users
} from 'lucide-react'
import { apiService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

// ── Types ────────────────────────────────────────────────────────────────────
interface Claim {
  claimId: string
  employeeName: string
  department: string
  designation: string
  claimTypeName: string
  businessPurpose: string
  purposeDetail: string
  totalAmount: number
  status: string
  currentStage: string | null
  submittedAt: string
  approvalLimit: number
  lineItems?: any[]
  approvalHistory?: any[]
}

const STATUS_COLOR: Record<string, string> = {
  Draft:               'bg-gray-100 text-gray-600',
  Submitted:           'bg-blue-100 text-blue-700',
  'Under Review':      'bg-yellow-100 text-yellow-700',
  'Manager Approved':  'bg-indigo-100 text-indigo-700',
  'HR Verified':       'bg-purple-100 text-purple-700',
  'Accounts Approved': 'bg-teal-100 text-teal-700',
  Rejected:            'bg-red-100 text-red-700',
  'Payment Processed': 'bg-green-100 text-green-700',
  Paid:                'bg-emerald-100 text-emerald-700',
}

const STAGE_LABELS: Record<string, string> = {
  TEAM_LEAD: 'Team Lead / RM',
  HR:        'HR Admin',
  ACCOUNTS:  'Accounts',
  FINANCE:   'Finance',
}

// Map role → approver stage
const ROLE_TO_STAGE: Record<string, string> = {
  admin:    'HR',
  hr:       'HR',
  manager:  'TEAM_LEAD',
  employee: 'TEAM_LEAD',
}

export default function ClaimApprovals() {
  const { user } = useAuth()

  const [allPending, setAllPending]         = useState<Claim[]>([])
  const [historyItems, setHistoryItems]     = useState<Claim[]>([])
  const [stats, setStats]                   = useState({ pending: 0, approvedToday: 0, rejectedToday: 0, totalPendingAmount: 0 })
  const [loading, setLoading]               = useState(true)
  const [selectedTab, setSelectedTab]       = useState<'pending' | 'history'>('pending')
  const [detail, setDetail]                 = useState<Claim | null>(null)
  const [detailLoading, setDetailLoading]   = useState(false)
  const [actionModal, setActionModal]       = useState<{ claim: Claim; action: string } | null>(null)
  const [remarks, setRemarks]               = useState('')
  const [stage, setStage]                   = useState('')
  const [submitting, setSubmitting]         = useState(false)
  const [actionError, setActionError]       = useState('')

  // Determine this approver's default stage from their role
  const myDefaultStage = ROLE_TO_STAGE[user?.role || ''] || 'TEAM_LEAD'

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [pendingRes, statsRes, allRes] = await Promise.all([
        apiService.getPendingApprovalsV2(),
        apiService.getClaimStatsV2(),
        apiService.getAllClaimsV2({ status: 'Manager Approved' })
          .catch(() => ({ success: false, data: [] }))
      ])

      if (pendingRes.success) setAllPending(pendingRes.data || [])

      if (statsRes.success) {
        const s = statsRes.data
        setStats({
          pending:            s.submitted + s.underReview || 0,
          approvedToday:      s.managerApproved + s.hrVerified + s.accountsApproved || 0,
          rejectedToday:      s.rejected || 0,
          totalPendingAmount: s.totalPendingAmount || 0,
        })
      }

      // History = claims that are past initial submission stage
      if (allRes.success) setHistoryItems(allRes.data || [])
    } catch (e) {
      console.error('ClaimApprovals loadData error:', e)
    }
    setLoading(false)
  }

  const openDetail = async (claim: Claim) => {
    setDetailLoading(true)
    setDetail(null)
    try {
      const res = await apiService.getClaimByIdV2(claim.claimId)
      if (res.success) setDetail(res.data)
      else setDetail(claim)
    } catch { setDetail(claim) }
    setDetailLoading(false)
  }

  const openAction = (claim: Claim, action: string) => {
    setActionModal({ claim, action })
    setRemarks('')
    setStage(claim.currentStage || myDefaultStage)
    setActionError('')
  }

  const submitAction = async () => {
    if (!actionModal) return
    if ((actionModal.action === 'Rejected' || actionModal.action === 'Returned') && !remarks.trim()) {
      setActionError('Remarks are mandatory for rejection or return.')
      return
    }
    setSubmitting(true)
    setActionError('')
    try {
      const res = await apiService.processClaimActionV2(actionModal.claim.claimId, {
        action: actionModal.action,
        remarks: remarks.trim(),
        stage,
      })
      if (res.success) {
        setActionModal(null)
        setDetail(null)
        await loadData()
      } else {
        setActionError(res.message || 'Action failed. Please try again.')
      }
    } catch (e: any) {
      setActionError(e.message || 'Action failed.')
    }
    setSubmitting(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Claim Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Review and action pending reimbursement claims</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending Action',  value: allPending.length,                icon: Clock,       color: 'yellow' },
          { label: 'Approved',        value: stats.approvedToday,              icon: CheckCircle, color: 'green'  },
          { label: 'Rejected',        value: stats.rejectedToday,              icon: XCircle,     color: 'red'    },
          { label: 'Pending Amount',  value: `₹${(stats.totalPendingAmount || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'blue' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`p-2.5 bg-${color}-50 rounded-xl`}>
              <Icon size={20} className={`text-${color}-500`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-lg font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'pending',  label: `Pending (${allPending.length})` },
          { key: 'history',  label: 'Approved History' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setSelectedTab(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${selectedTab === key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Pending Tab ── */}
      {selectedTab === 'pending' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {allPending.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
              <CheckCircle size={40} className="text-green-200" />
              <p className="text-sm font-medium text-gray-500">No pending approvals</p>
              <p className="text-xs text-gray-400">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {allPending.map(claim => (
                <div key={claim.claimId} className="p-4 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-base flex-shrink-0">
                      {(claim.employeeName || '?').charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{claim.employeeName}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-sm text-gray-500">{claim.department}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[claim.status] || 'bg-gray-100 text-gray-600'}`}>
                          {claim.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-sm text-gray-600 font-medium">{claim.claimTypeName} Claim</span>
                        <span className="text-sm font-bold text-indigo-700">₹{(claim.totalAmount || 0).toLocaleString('en-IN')}</span>
                        {claim.businessPurpose && (
                          <span className="text-xs text-gray-400">{claim.businessPurpose}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          Stage: <span className="font-medium text-gray-600">{STAGE_LABELS[claim.currentStage || ''] || claim.currentStage || '—'}</span>
                        </span>
                        {claim.submittedAt && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-400">Submitted {new Date(claim.submittedAt).toLocaleDateString('en-IN')}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                      <button onClick={() => openDetail(claim)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                        <Eye size={13} /> View
                      </button>
                      <button onClick={() => openAction(claim, 'Returned')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
                        <RotateCcw size={13} /> Return
                      </button>
                      <button onClick={() => openAction(claim, 'Rejected')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                        <XCircle size={13} /> Reject
                      </button>
                      <button onClick={() => openAction(claim, 'Approved')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                        <CheckCircle size={13} /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── History Tab ── */}
      {selectedTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Employee','Type','Amount','Status','Stage','Date',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {historyItems.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">No history yet</td></tr>
              ) : historyItems.map(claim => (
                <tr key={claim.claimId} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{claim.employeeName}</p>
                    <p className="text-xs text-gray-400">{claim.department}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{claim.claimTypeName}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">₹{(claim.totalAmount||0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[claim.status] || 'bg-gray-100'}`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{STAGE_LABELS[claim.currentStage || ''] || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(claim)}
                      className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Claim Detail Drawer ── */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-end z-50">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto flex flex-col">
            {/* Drawer header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-base font-bold text-gray-900">Claim Detail</h3>
                {detail && (
                  <p className="text-xs text-gray-500 mt-0.5">{detail.claimTypeName} · {detail.employeeName}</p>
                )}
              </div>
              <button onClick={() => setDetail(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : detail ? (
              <div className="flex-1 p-6 space-y-6">
                {/* Status badge */}
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLOR[detail.status] || 'bg-gray-100'}`}>
                  {detail.status}
                </span>

                {/* Employee snapshot */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
                  {[
                    ['Employee',         detail.employeeName],
                    ['Department',       detail.department],
                    ['Designation',      detail.designation],
                    ['Claim Type',       detail.claimTypeName],
                    ['Business Purpose', detail.businessPurpose],
                    ['Total Amount',     `₹${(detail.totalAmount||0).toLocaleString('en-IN')}`],
                    ['Approval Limit',   `₹${(detail.approvalLimit||0).toLocaleString('en-IN')}`],
                    ['Current Stage',    STAGE_LABELS[detail.currentStage || ''] || detail.currentStage || '—'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-xs text-gray-400">{k}</p>
                      <p className="text-sm font-medium text-gray-900">{v || '—'}</p>
                    </div>
                  ))}
                  {detail.purposeDetail && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">Notes</p>
                      <p className="text-sm text-gray-700">{detail.purposeDetail}</p>
                    </div>
                  )}
                </div>

                {/* Line items */}
                {detail.lineItems && detail.lineItems.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Expense Items</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
                        <thead className="bg-gray-50">
                          <tr>{['Date','Description','Sub-details','Amount','Docs'].map(h => (
                            <th key={h} className="px-3 py-2 text-left text-xs text-gray-400 font-semibold">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {detail.lineItems.map((li: any, i: number) => {
                            // Build sub-detail string
                            const sf = li.subTypeFields || {}
                            const sub = [
                              sf.fromLocation && sf.toLocation && `${sf.fromLocation}→${sf.toLocation}`,
                              sf.modeOfTravel,
                              sf.mealType,
                              sf.hotelName && sf.city && `${sf.hotelName}, ${sf.city}`,
                              sf.distanceKM && `${sf.distanceKM}km @ ₹${sf.ratePerKM}/km`,
                              sf.vendorName,
                            ].filter(Boolean).join(' · ')

                            return (
                              <tr key={i} className="hover:bg-gray-50/60">
                                <td className="px-3 py-2 text-xs text-gray-600">{li.date || '—'}</td>
                                <td className="px-3 py-2 text-gray-700 max-w-[100px] truncate">{li.description || '—'}</td>
                                <td className="px-3 py-2 text-xs text-gray-400 max-w-[120px] truncate">{sub || '—'}</td>
                                <td className="px-3 py-2 font-semibold text-gray-900">₹{(li.amount||0).toLocaleString('en-IN')}</td>
                                <td className="px-3 py-2">
                                  {li.attachmentUrls?.length > 0 ? (
                                    <div className="flex gap-1 flex-wrap">
                                      {li.attachmentUrls.map((url: string, j: number) => {
                                        const name = li.attachmentNames?.[j] || `File ${j+1}`;
                                        const isPdf = url.toLowerCase().includes('.pdf');
                                        return (
                                          <a key={j} href={url} target="_blank" rel="noreferrer" title={name}
                                            className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700 hover:bg-blue-100 max-w-[110px]">
                                            <span>{isPdf ? '📄' : '🖼️'}</span>
                                            <span className="truncate">{name}</span>
                                          </a>
                                        );
                                      })}
                                    </div>
                                  ) : <span className="text-xs text-gray-300">—</span>}
                                </td>
                              </tr>
                            )
                          })}
                          <tr className="bg-gray-50 font-bold">
                            <td colSpan={3} className="px-3 py-2 text-right text-sm text-gray-700">Total</td>
                            <td className="px-3 py-2 text-indigo-700">₹{(detail.totalAmount||0).toLocaleString('en-IN')}</td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Approval history */}
                {detail.approvalHistory && detail.approvalHistory.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Approval History</p>
                    <div className="relative pl-4">
                      <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gray-100" />
                      {detail.approvalHistory.map((h: any, i: number) => (
                        <div key={i} className="relative mb-4 pl-4">
                          <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2
                            ${h.action==='Approved'?'bg-green-500 border-green-300':h.action==='Rejected'?'bg-red-500 border-red-300':'bg-orange-400 border-orange-200'}`} />
                          <div className={`p-3 rounded-xl border text-sm
                            ${h.action==='Approved'?'bg-green-50 border-green-100':h.action==='Rejected'?'bg-red-50 border-red-100':'bg-orange-50 border-orange-100'}`}>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <span className="font-semibold text-gray-800">{h.approverName || 'Approver'}</span>
                                <span className="mx-2 text-gray-300">·</span>
                                <span className="text-xs text-gray-500">{STAGE_LABELS[h.stage] || h.stage}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                                  ${h.action==='Approved'?'bg-green-100 text-green-700':h.action==='Rejected'?'bg-red-100 text-red-700':'bg-orange-100 text-orange-700'}`}>
                                  {h.action}
                                </span>
                                <span className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleDateString('en-IN')}</span>
                              </div>
                            </div>
                            {h.remarks && (
                              <p className="text-xs text-gray-600 mt-1.5 italic">"{h.remarks}"</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Sticky footer actions */}
            {detail && !['Draft','Rejected','Paid','Payment Processed'].includes(detail.status) && (
              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
                <button onClick={() => openAction(detail, 'Returned')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-orange-200 text-orange-600 rounded-xl text-sm font-medium hover:bg-orange-50">
                  <RotateCcw size={14} /> Return
                </button>
                <button onClick={() => openAction(detail, 'Rejected')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">
                  <XCircle size={14} /> Reject
                </button>
                <button onClick={() => openAction(detail, 'Approved')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
                  <CheckCircle size={14} /> Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Action Confirmation Modal ── */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-1">
              {actionModal.action === 'Approved' ? '✅ Approve Claim'
                : actionModal.action === 'Rejected' ? '❌ Reject Claim'
                : '↩ Return to Employee'}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              {actionModal.claim.employeeName} · <strong>{actionModal.claim.claimTypeName}</strong> · ₹{(actionModal.claim.totalAmount||0).toLocaleString('en-IN')}
            </p>

            <div className="space-y-4">
              {/* Stage selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Approval Stage</label>
                <select value={stage} onChange={e => setStage(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['TEAM_LEAD','HR','ACCOUNTS','FINANCE'].map(s => (
                    <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Remarks {actionModal.action !== 'Approved' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  rows={3}
                  placeholder={
                    actionModal.action === 'Approved'
                      ? 'Optional: add a note for the employee'
                      : 'Please provide a reason (required)'
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {actionError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {actionError}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setActionModal(null); setActionError('') }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={submitAction}
                disabled={submitting}
                className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                  ${actionModal.action === 'Approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : actionModal.action === 'Rejected'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-500 hover:bg-orange-600'
                  }`}>
                {submitting ? 'Processing…' : `Confirm ${actionModal.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
