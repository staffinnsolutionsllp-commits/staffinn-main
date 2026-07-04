import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { claimAPI } from '../services/api';
import {
  CreditCard, Plus, X, FileText, ChevronRight, ChevronLeft,
  Trash2, Upload, CheckCircle, Clock, AlertCircle, Eye,
  Car, Utensils, Hotel, Plane, HelpCircle, RotateCcw,
  Paperclip, Loader2, ExternalLink
} from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg','image/jpg','image/png','image/webp','application/pdf'];
const MAX_MB = 10;

// ── Constants ──────────────────────────────────────────────────────────────
const CLAIM_TYPE_ICONS = {
  Travel: Plane, Accommodation: Hotel, Meal: Utensils,
  Conveyance: Car, Miscellaneous: HelpCircle
};

const BUSINESS_PURPOSES = [
  'Client Meeting','Training','Official Visit','Site Inspection',
  'College Visit','Mobilization Activity','Other'
];

const TRAVEL_MODES = ['Bus','Train','Flight','Taxi','Auto','Cab','Personal Vehicle','Other'];
const MEAL_TYPES   = ['Breakfast','Lunch','Dinner','Snacks','Other'];

const STATUS_STYLE = {
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
};

const STAGE_LABELS = {
  TEAM_LEAD: 'Team Lead / RM', HR: 'HR Admin',
  ACCOUNTS: 'Accounts', FINANCE: 'Finance'
};

// ── Empty line-item templates per type ────────────────────────────────────
const emptyItem = (typeName) => {
  const base = { date: '', description: '', amount: '', attachmentUrls: [] };
  if (typeName === 'Travel')        return { ...base, subTypeFields: { fromLocation:'', toLocation:'', modeOfTravel:'Bus', purposeOfTravel:'', remarks:'' } };
  if (typeName === 'Accommodation') return { ...base, subTypeFields: { checkIn:'', checkOut:'', city:'', hotelName:'', purposeOfStay:'', nights:1 } };
  if (typeName === 'Meal')          return { ...base, subTypeFields: { mealType:'Lunch', vendorName:'', location:'', purpose:'', billNumber:'' } };
  if (typeName === 'Conveyance')    return { ...base, amount: 0, subTypeFields: { fromAddress:'', toAddress:'', distanceKM:'', ratePerKM:4, purpose:'' } };
  return { ...base, subTypeFields: { category:'', vendor:'' } };
};

export default function Claims() {
  const { user } = useAuth();

  // ── View state ─────────────────────────────────────────────────────────
  const [view, setView]         = useState('list');    // 'list' | 'wizard' | 'detail'
  const [claims, setClaims]     = useState([]);
  const [claimTypes, setClaimTypes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [detailClaim, setDetailClaim] = useState(null);

  // ── Wizard state ───────────────────────────────────────────────────────
  const [step, setStep]         = useState(1);  // 1=Type, 2=Items, 3=Review+Submit
  const [selectedType, setSelectedType] = useState(null);
  const [businessPurpose, setBusinessPurpose] = useState('');
  const [purposeDetail, setPurposeDetail]     = useState('');
  const [lineItems, setLineItems] = useState([]);
  const [declaration, setDeclaration] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [wizardError, setWizardError] = useState('');
  const [draftClaimId, setDraftClaimId] = useState(null);

  // Per-item upload state: { [itemIdx]: { uploading: bool, error: string } }
  const [uploadState, setUploadState] = useState({});
  const fileInputRefs = useRef({});

  useEffect(() => { init(); }, []);

  const init = async () => {
    setLoading(true);
    try {
      const [claimsRes, typesRes] = await Promise.all([
        claimAPI.getMyClaimsV2(),
        claimAPI.getClaimTypes()
      ]);
      if (claimsRes.data?.success) setClaims(claimsRes.data.data || []);
      if (typesRes.data?.success)  setClaimTypes(typesRes.data.data || []);
    } catch { /* handled silently */ }
    setLoading(false);
  };

  const openDetail = async (claim) => {
    try {
      const res = await claimAPI.getClaimById(claim.claimId);
      setDetailClaim(res.data?.data || claim);
    } catch { setDetailClaim(claim); }
    setView('detail');
  };

  // ── Wizard helpers ─────────────────────────────────────────────────────
  const startWizard = () => {
    setStep(1); setSelectedType(null); setBusinessPurpose('');
    setPurposeDetail(''); setLineItems([]); setDeclaration(false);
    setWizardError(''); setDraftClaimId(null);
    setView('wizard');
  };

  // Open an existing Draft/Returned claim for editing — skip step 1, go straight to step 2
  const editDraft = async (claim) => {
    try {
      // Fetch full detail (with line items)
      const res = await claimAPI.getClaimById(claim.claimId);
      const full = res.data?.data || claim;

      // Find matching claimType object
      const ct = claimTypes.find(t => t.claimTypeId === full.claimTypeId) || {
        claimTypeId: full.claimTypeId,
        name: full.claimTypeName,
        ratePerKM: 4,
        approvalLimit: 10000,
      };

      setSelectedType(ct);
      setBusinessPurpose(full.businessPurpose || '');
      setPurposeDetail(full.purposeDetail || '');
      setDraftClaimId(full.claimId);
      setDeclaration(false);
      setWizardError('');
      setUploadState({});

      // Pre-fill line items from DB; if empty give one blank template
      if (full.lineItems && full.lineItems.length > 0) {
        setLineItems(full.lineItems.map(li => ({
          date:            li.date || '',
          description:     li.description || '',
          amount:          li.amount ?? '',
          subTypeFields:   li.subTypeFields || {},
          attachmentUrls:  li.attachmentUrls || [],
          attachmentNames: li.attachmentNames || [],
        })));
      } else {
        setLineItems([emptyItem(ct.name)]);
      }

      setStep(2);
      setView('wizard');
    } catch {
      alert('Could not load claim for editing. Please try again.');
    }
  };

  const pickType = (ct) => {
    setSelectedType(ct);
    setLineItems([emptyItem(ct.name)]);
    setStep(2);
  };

  // Line item field updates
  const updateItem = (idx, field, value) => {
    const next = [...lineItems];
    next[idx] = { ...next[idx], [field]: value };
    // Auto-calc conveyance
    if (selectedType?.name === 'Conveyance' && (field === 'subTypeFields')) {
      const sf = value;
      const dist = parseFloat(sf.distanceKM) || 0;
      const rate = parseFloat(sf.ratePerKM)  || selectedType.ratePerKM || 4;
      next[idx].amount = Math.round(dist * rate * 100) / 100;
    }
    setLineItems(next);
  };

  const updateSubField = (idx, subField, value) => {
    const next = [...lineItems];
    const sf = { ...next[idx].subTypeFields, [subField]: value };
    next[idx] = { ...next[idx], subTypeFields: sf };
    // Auto-calc conveyance
    if (selectedType?.name === 'Conveyance') {
      const dist = parseFloat(subField === 'distanceKM' ? value : sf.distanceKM) || 0;
      const rate = parseFloat(subField === 'ratePerKM'  ? value : sf.ratePerKM)  || selectedType.ratePerKM || 4;
      next[idx].amount = Math.round(dist * rate * 100) / 100;
    }
    setLineItems(next);
  };

  const addItem   = () => setLineItems([...lineItems, emptyItem(selectedType?.name)]);
  const removeItem = (idx) => setLineItems(lineItems.filter((_, i) => i !== idx));

  // ── File upload handler ──────────────────────────────────────────────────
  const handleFileUpload = async (idx, file) => {
    if (!file) return;

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadState(s => ({ ...s, [idx]: { uploading: false, error: 'Only PDF, JPG, PNG, WEBP allowed' } }));
      return;
    }
    // Validate size
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadState(s => ({ ...s, [idx]: { uploading: false, error: `Max file size is ${MAX_MB}MB` } }));
      return;
    }

    setUploadState(s => ({ ...s, [idx]: { uploading: true, error: '' } }));

    try {
      // Need a claim ID — save draft first if not created yet
      let cId = draftClaimId;
      if (!cId) {
        if (!selectedType) { setUploadState(s => ({ ...s, [idx]: { uploading: false, error: 'Select claim type first' } })); return; }
        const draftRes = await claimAPI.createClaim({
          claimTypeId: selectedType.claimTypeId,
          businessPurpose: businessPurpose || 'Other',
          purposeDetail,
          isDraft: true,
          lineItems: []
        });
        if (!draftRes.data?.success) throw new Error('Could not create draft');
        cId = draftRes.data.data.claimId;
        setDraftClaimId(cId);
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await claimAPI.uploadAttachment(cId, formData);
      if (!res.data?.success) throw new Error(res.data?.message || 'Upload failed');

      const url = res.data.data.url;

      // Attach URL to this line item
      const next = [...lineItems];
      next[idx] = {
        ...next[idx],
        attachmentUrls: [...(next[idx].attachmentUrls || []), url],
        attachmentNames: [...(next[idx].attachmentNames || []), file.name]
      };
      setLineItems(next);
      setUploadState(s => ({ ...s, [idx]: { uploading: false, error: '' } }));
    } catch (e) {
      setUploadState(s => ({ ...s, [idx]: { uploading: false, error: e.message || 'Upload failed' } }));
    }
  };

  const removeAttachment = (itemIdx, attIdx) => {
    const next = [...lineItems];
    next[itemIdx] = {
      ...next[itemIdx],
      attachmentUrls: next[itemIdx].attachmentUrls.filter((_, i) => i !== attIdx),
      attachmentNames: (next[itemIdx].attachmentNames || []).filter((_, i) => i !== attIdx)
    };
    setLineItems(next);
  };

  const totalAmount = lineItems.reduce((s, li) => s + (parseFloat(li.amount) || 0), 0);

  const buildPayload = (isDraft) => ({
    claimTypeId: selectedType?.claimTypeId,
    businessPurpose, purposeDetail, isDraft,
    lineItems: lineItems.map(li => ({
      date: li.date, description: li.description,
      amount: parseFloat(li.amount) || 0,
      subTypeFields: li.subTypeFields || {},
      attachmentUrls: li.attachmentUrls || []
    }))
  });

  const saveDraft = async () => {
    if (!selectedType) return;
    setSavingDraft(true); setWizardError('');
    try {
      let res;
      if (draftClaimId) {
        res = await claimAPI.updateClaim(draftClaimId, {
          businessPurpose,
          purposeDetail,
          lineItems: lineItems.map(li => ({
            date:            li.date,
            description:     li.description,
            amount:          parseFloat(li.amount) || 0,
            subTypeFields:   li.subTypeFields || {},
            attachmentUrls:  li.attachmentUrls  || [],
            attachmentNames: li.attachmentNames || []
          }))
        });
      } else {
        res = await claimAPI.createClaim(buildPayload(true));
        if (res.data?.success) setDraftClaimId(res.data.data.claimId);
      }
      if (res.data?.success) {
        alert('Draft saved successfully');
        init();
      }
    } catch { setWizardError('Failed to save draft. Please try again.'); }
    setSavingDraft(false);
  };

  const submitClaim = async () => {
    if (!declaration) { setWizardError('Please accept the declaration to submit.'); return; }
    if (lineItems.length === 0) { setWizardError('Add at least one expense item.'); return; }
    const emptyDate = lineItems.find(li => !li.date);
    if (emptyDate) { setWizardError('Please fill the date for all expense items.'); return; }

    setSubmitting(true); setWizardError('');
    try {
      let claimId = draftClaimId;
      if (!claimId) {
        // No draft yet — create + submit in one shot (lineItems included in payload)
        const createRes = await claimAPI.createClaim(buildPayload(false));
        if (!createRes.data?.success) throw new Error(createRes.data?.message || 'Failed to create claim');
        claimId = createRes.data.data.claimId;
      } else {
        // Draft exists — first save all current line items, then submit
        const updateRes = await claimAPI.updateClaim(draftClaimId, {
          businessPurpose,
          purposeDetail,
          lineItems: lineItems.map(li => ({
            date:           li.date,
            description:    li.description,
            amount:         parseFloat(li.amount) || 0,
            subTypeFields:  li.subTypeFields || {},
            attachmentUrls:  li.attachmentUrls  || [],
            attachmentNames: li.attachmentNames || []
          }))
        });
        if (!updateRes.data?.success) throw new Error(updateRes.data?.message || 'Failed to save items');

        const submitRes = await claimAPI.submitClaimV2(claimId);
        if (!submitRes.data?.success) throw new Error(submitRes.data?.message || 'Failed to submit');
      }
      await init();
      setView('list');
      alert('Claim submitted successfully! It has been routed for approval.');
    } catch (e) { setWizardError(e.message || 'Submission failed. Please try again.'); }
    setSubmitting(false);
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════════════
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );

  // ── CLAIM DETAIL ──────────────────────────────────────────────────────
  if (view === 'detail' && detailClaim) return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <button onClick={() => { setView('list'); setDetailClaim(null); }}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
        <ChevronLeft size={16} /> Back to Claims
      </button>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{detailClaim.claimTypeName} Claim</h2>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[detailClaim.status] || 'bg-gray-100 text-gray-600'}`}>
              {detailClaim.status}
            </span>
            {['Draft','Returned'].includes(detailClaim.status) && (
              <button
                onClick={() => { setDetailClaim(null); editDraft(detailClaim); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700">
                ✏️ Edit & {detailClaim.status === 'Returned' ? 'Resubmit' : 'Submit'}
              </button>
            )}
          </div>
        </div>
        {/* Employee info grid */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4 mb-4 text-sm">
          {[['Business Purpose', detailClaim.businessPurpose], ['Total Amount', `₹${(detailClaim.totalAmount||0).toLocaleString('en-IN')}`],
            ['Department', detailClaim.department], ['Stage', detailClaim.currentStage ? STAGE_LABELS[detailClaim.currentStage] : 'Completed'],
            ['Submitted', detailClaim.submittedAt ? new Date(detailClaim.submittedAt).toLocaleDateString('en-IN') : '—']
          ].map(([k,v]) => (
            <div key={k}><p className="text-xs text-slate-400">{k}</p><p className="font-medium text-slate-800">{v || '—'}</p></div>
          ))}
        </div>
        {/* Line items */}
        {detailClaim.lineItems?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Expense Items</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-100 rounded-xl overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>{['Date','Description','Amount','Attachments'].map(h=><th key={h} className="px-3 py-2 text-left text-xs text-slate-400 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {detailClaim.lineItems.map((li, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-xs">{li.date}</td>
                      <td className="px-3 py-2 text-slate-600 text-xs">{li.description || '—'}</td>
                      <td className="px-3 py-2 font-semibold text-xs">₹{(li.amount||0).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2">
                        {li.attachmentUrls?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {li.attachmentUrls.map((url, ai) => {
                              const name = li.attachmentNames?.[ai] || `File ${ai+1}`;
                              const isPdf = url.toLowerCase().includes('.pdf');
                              return (
                                <a key={ai} href={url} target="_blank" rel="noreferrer"
                                  title={name}
                                  className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 hover:bg-blue-100 max-w-[130px]">
                                  <span>{isPdf ? '📄' : '🖼️'}</span>
                                  <span className="truncate">{name}</span>
                                  <ExternalLink size={9} className="flex-shrink-0" />
                                </a>
                              );
                            })}
                          </div>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={3} className="px-3 py-2 text-right text-slate-700">Total</td>
                    <td className="px-3 py-2 text-indigo-700">₹{(detailClaim.totalAmount||0).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Approval history */}
        {detailClaim.approvalHistory?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Approval Timeline</p>
            <div className="space-y-2">
              {detailClaim.approvalHistory.map((h, i) => (
                <div key={i} className={`flex gap-3 p-3 rounded-lg text-sm border
                  ${h.action==='Approved'?'bg-green-50 border-green-100':h.action==='Rejected'?'bg-red-50 border-red-100':'bg-orange-50 border-orange-100'}`}>
                  <div className="flex-1">
                    <span className="font-medium">{h.approverName||'Approver'}</span>
                    <span className="mx-2 text-slate-400">·</span>
                    <span className={`font-semibold ${h.action==='Approved'?'text-green-700':h.action==='Rejected'?'text-red-700':'text-orange-700'}`}>{h.action}</span>
                    {h.remarks && <p className="text-xs text-slate-500 mt-0.5">{h.remarks}</p>}
                  </div>
                  <div className="text-xs text-slate-400 whitespace-nowrap">{new Date(h.timestamp).toLocaleDateString('en-IN')}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── WIZARD ────────────────────────────────────────────────────────────
  if (view === 'wizard') return (
    <div className="p-6 max-w-3xl mx-auto animate-fadeIn">
      {/* Wizard header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => { setView('list'); setDraftClaimId(null); }} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
          <ChevronLeft size={16} /> {draftClaimId ? 'Back to Claims' : 'Cancel'}
        </button>
        <div className="flex items-center gap-2">
          {draftClaimId && step > 1 && (
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full mr-1">✏️ Editing Draft</span>
          )}
          {[1,2,3].map(s => (
            <div key={s} className={`flex items-center gap-1`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{s}</div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
        <span className="text-xs text-slate-400">Step {step} of 3</span>
      </div>

      {wizardError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />{wizardError}
        </div>
      )}

      {/* ── Step 1: Select Claim Type ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Select Claim Type</h2>
            <p className="text-sm text-slate-500 mt-1">Choose the type of expense you want to reimburse</p>
          </div>
          {claimTypes.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5" />
              No claim types configured yet. Please contact your HR Admin.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {claimTypes.map(ct => {
                const Icon = CLAIM_TYPE_ICONS[ct.name] || HelpCircle;
                return (
                  <button key={ct.claimTypeId} onClick={() => pickType(ct)}
                    className="flex items-start gap-4 p-4 bg-white border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-xl text-left transition-all group">
                    <div className="p-2.5 bg-indigo-50 rounded-xl group-hover:bg-indigo-100">
                      <Icon size={22} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{ct.name} Claim</p>
                      <p className="text-xs text-slate-500 mt-0.5">{ct.description || `Submit ${ct.name.toLowerCase()} reimbursement`}</p>
                      {ct.name === 'Conveyance' && (
                        <p className="text-xs text-indigo-600 mt-1 font-medium">₹{ct.ratePerKM}/km auto-calculated</p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-500 mt-1 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Add Expense Items ── */}
      {step === 2 && selectedType && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{selectedType.name} Claim</h2>
            <p className="text-sm text-slate-500 mt-1">Add your expense details. You can add multiple entries.</p>
          </div>

          {/* Business Purpose */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Business Purpose *</label>
              <select value={businessPurpose} onChange={e => setBusinessPurpose(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white" required>
                <option value="">Select purpose</option>
                {BUSINESS_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Details / Notes</label>
              <input value={purposeDetail} onChange={e => setPurposeDetail(e.target.value)}
                placeholder="Additional context..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white" />
            </div>
          </div>

          {/* Line Items */}
          {lineItems.map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">Entry #{idx + 1}</span>
                {lineItems.length > 1 && (
                  <button onClick={() => removeItem(idx)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Common fields */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Date *</label>
                  <input type="date" value={item.date} onChange={e => updateItem(idx,'date',e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                  <input value={item.description} onChange={e => updateItem(idx,'description',e.target.value)}
                    placeholder="Brief description"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              {/* Travel-specific fields */}
              {selectedType.name === 'Travel' && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">From Location</label>
                    <input value={item.subTypeFields?.fromLocation||''} onChange={e=>updateSubField(idx,'fromLocation',e.target.value)} placeholder="Origin" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">To Location</label>
                    <input value={item.subTypeFields?.toLocation||''} onChange={e=>updateSubField(idx,'toLocation',e.target.value)} placeholder="Destination" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">Mode of Travel</label>
                    <select value={item.subTypeFields?.modeOfTravel||'Bus'} onChange={e=>updateSubField(idx,'modeOfTravel',e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {TRAVEL_MODES.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">Amount (₹) *</label>
                    <input type="number" min="0" step="0.01" value={item.amount||''} onChange={e=>updateItem(idx,'amount',e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                </div>
              )}

              {/* Accommodation-specific fields */}
              {selectedType.name === 'Accommodation' && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">Check-in Date</label>
                    <input type="date" value={item.subTypeFields?.checkIn||''} onChange={e=>updateSubField(idx,'checkIn',e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">Check-out Date</label>
                    <input type="date" value={item.subTypeFields?.checkOut||''} onChange={e=>updateSubField(idx,'checkOut',e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">City</label>
                    <input value={item.subTypeFields?.city||''} onChange={e=>updateSubField(idx,'city',e.target.value)} placeholder="City" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">Hotel Name</label>
                    <input value={item.subTypeFields?.hotelName||''} onChange={e=>updateSubField(idx,'hotelName',e.target.value)} placeholder="Hotel/Guest house" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                  <div className="col-span-2"><label className="block text-xs font-semibold text-slate-500 mb-1">Amount Claimed (₹) *</label>
                    <input type="number" min="0" step="0.01" value={item.amount||''} onChange={e=>updateItem(idx,'amount',e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                </div>
              )}

              {/* Meal-specific fields */}
              {selectedType.name === 'Meal' && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">Meal Type</label>
                    <select value={item.subTypeFields?.mealType||'Lunch'} onChange={e=>updateSubField(idx,'mealType',e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {MEAL_TYPES.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">Vendor / Restaurant</label>
                    <input value={item.subTypeFields?.vendorName||''} onChange={e=>updateSubField(idx,'vendorName',e.target.value)} placeholder="Restaurant name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">Location</label>
                    <input value={item.subTypeFields?.location||''} onChange={e=>updateSubField(idx,'location',e.target.value)} placeholder="City/Area" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">Amount (₹) *</label>
                    <input type="number" min="0" step="0.01" value={item.amount||''} onChange={e=>updateItem(idx,'amount',e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                </div>
              )}

              {/* Conveyance-specific fields */}
              {selectedType.name === 'Conveyance' && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">From Address</label>
                    <input value={item.subTypeFields?.fromAddress||''} onChange={e=>updateSubField(idx,'fromAddress',e.target.value)} placeholder="Starting point" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">To Address</label>
                    <input value={item.subTypeFields?.toAddress||''} onChange={e=>updateSubField(idx,'toAddress',e.target.value)} placeholder="Destination" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">Distance (KM) *</label>
                    <input type="number" min="0" step="0.1" value={item.subTypeFields?.distanceKM||''} onChange={e=>updateSubField(idx,'distanceKM',e.target.value)} placeholder="KMs" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">Rate/KM (₹)</label>
                    <input type="number" min="0" step="0.5" value={item.subTypeFields?.ratePerKM||selectedType.ratePerKM||4} onChange={e=>updateSubField(idx,'ratePerKM',e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                  <div className="col-span-2 flex items-end pb-0.5">
                    <div className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-indigo-600 font-medium">Auto-calculated amount</span>
                      <span className="text-base font-bold text-indigo-700">₹{(item.amount||0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Miscellaneous */}
              {selectedType.name === 'Miscellaneous' && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                    <input value={item.subTypeFields?.category||''} onChange={e=>updateSubField(idx,'category',e.target.value)} placeholder="e.g. Stationery, Courier" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                  <div><label className="block text-xs font-semibold text-slate-500 mb-1">Amount (₹) *</label>
                    <input type="number" min="0" step="0.01" value={item.amount||''} onChange={e=>updateItem(idx,'amount',e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                </div>
              )}

              {/* ── Attachment Upload ── */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-500">
                    Supporting Documents <span className="text-slate-400">(PDF, JPG, PNG, WEBP — max 10MB each)</span>
                  </label>
                  <div>
                    <input
                      ref={el => { fileInputRefs.current[idx] = el; }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={e => { if (e.target.files?.[0]) handleFileUpload(idx, e.target.files[0]); e.target.value = ''; }}
                    />
                    <button
                      type="button"
                      disabled={uploadState[idx]?.uploading}
                      onClick={() => fileInputRefs.current[idx]?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                    >
                      {uploadState[idx]?.uploading
                        ? <><Loader2 size={12} className="animate-spin" /> Uploading…</>
                        : <><Paperclip size={12} /> Attach File</>
                      }
                    </button>
                  </div>
                </div>

                {/* Error */}
                {uploadState[idx]?.error && (
                  <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                    <AlertCircle size={11} /> {uploadState[idx].error}
                  </p>
                )}

                {/* Uploaded files list */}
                {(item.attachmentUrls || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.attachmentUrls.map((url, ai) => {
                      const name = item.attachmentNames?.[ai] || `Attachment ${ai + 1}`;
                      const isPdf = url.toLowerCase().endsWith('.pdf');
                      return (
                        <div key={ai} className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 max-w-[200px]">
                          <CheckCircle size={11} className="flex-shrink-0" />
                          <a href={url} target="_blank" rel="noreferrer"
                            className="truncate hover:underline max-w-[120px]" title={name}>
                            {name}
                          </a>
                          <ExternalLink size={10} className="flex-shrink-0 opacity-60" />
                          <button type="button" onClick={() => removeAttachment(idx, ai)}
                            className="ml-0.5 text-green-400 hover:text-red-500 flex-shrink-0">
                            <X size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          <button onClick={addItem}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            <Plus size={16} /> Add Another Entry
          </button>

          {/* Running total */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-3 flex justify-between items-center">
            <span className="text-sm text-indigo-700 font-medium">Total Claim Amount</span>
            <span className="text-xl font-bold text-indigo-700">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50">
              <ChevronLeft size={16} /> Back
            </button>
            <div className="flex gap-3">
              <button onClick={saveDraft} disabled={savingDraft}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                {savingDraft ? 'Saving…' : 'Save Draft'}
              </button>
              <button onClick={() => { if(!businessPurpose){ setWizardError('Select a business purpose before continuing'); return; } setWizardError(''); setStep(3); }}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
                Review & Submit <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Review & Submit ── */}
      {step === 3 && selectedType && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Review & Submit</h2>
            <p className="text-sm text-slate-500 mt-1">Please review your claim before submitting</p>
          </div>
          {/* Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[['Claim Type', selectedType.name], ['Business Purpose', businessPurpose],
                ['Employee', user?.fullName || user?.name || '—'], ['Department', user?.department || '—'],
                ['Submitted On', new Date().toLocaleDateString('en-IN')]
              ].map(([k,v]) => (
                <div key={k}><p className="text-xs text-slate-400">{k}</p><p className="font-medium text-slate-800 text-sm">{v||'—'}</p></div>
              ))}
            </div>
            <table className="w-full text-sm border border-slate-100 rounded-xl overflow-hidden">
              <thead className="bg-slate-50">
                <tr>{['#','Date','Description','Amount'].map(h=><th key={h} className="px-3 py-2 text-left text-xs text-slate-400 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lineItems.map((li,i)=>(
                  <tr key={i}>
                    <td className="px-3 py-2 text-slate-400">{i+1}</td>
                    <td className="px-3 py-2">{li.date||'—'}</td>
                    <td className="px-3 py-2 text-slate-600">{li.description||'—'}</td>
                    <td className="px-3 py-2 font-semibold">₹{(parseFloat(li.amount)||0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={3} className="px-3 py-2 text-right text-slate-700">Total</td>
                  <td className="px-3 py-2 text-indigo-700">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Approval routing info */}
          <div className={`rounded-xl border p-4 text-sm flex items-start gap-3
            ${totalAmount <= selectedType.approvalLimit ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              {totalAmount <= selectedType.approvalLimit
                ? `Your claim (₹${totalAmount.toLocaleString('en-IN')}) is within the approval limit (₹${selectedType.approvalLimit.toLocaleString('en-IN')}). It will be routed to your Team Lead / Reporting Manager for approval.`
                : `Your claim (₹${totalAmount.toLocaleString('en-IN')}) exceeds the approval limit (₹${selectedType.approvalLimit.toLocaleString('en-IN')}). It will be sent directly to HR Admin for review.`
              }
            </div>
          </div>

          {/* Declaration */}
          <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <input type="checkbox" checked={declaration} onChange={e=>setDeclaration(e.target.checked)} className="mt-0.5 w-4 h-4 text-indigo-600 rounded" />
            <p className="text-sm text-slate-600 leading-relaxed">
              I hereby declare that the above expenses were incurred solely for official business purposes and the information provided is true and correct. Supporting documents attached are genuine.
            </p>
          </label>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50">
              <ChevronLeft size={16} /> Back
            </button>
            <button onClick={submitClaim} disabled={submitting || !declaration}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20">
              {submitting ? 'Submitting…' : <><CheckCircle size={16} /> Submit Claim</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── CLAIMS LIST ───────────────────────────────────────────────────────
  const drafts    = claims.filter(c => c.status === 'Draft');
  const returned  = claims.filter(c => c.status === 'Returned');
  const submitted = claims.filter(c => !['Draft','Returned'].includes(c.status));

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Claim Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Submit and track your expense reimbursements</p>
        </div>
        <button onClick={startWizard}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/25 transition-all">
          <Plus size={15} /> New Claim
        </button>
      </div>

      {/* Drafts */}
      {drafts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-700 mb-2">📝 Saved Drafts ({drafts.length})</p>
          <div className="space-y-2">
            {drafts.map(c => (
              <div key={c.claimId} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-amber-100">
                <div>
                  <span className="font-medium text-slate-800 text-sm">{c.claimTypeName}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-slate-500 text-xs">{c.businessPurpose||'No purpose set'}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editDraft(c)}
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium">
                    ✏️ Edit & Submit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Returned Claims */}
      {returned.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-orange-700 mb-2">↩️ Returned for Revision ({returned.length})</p>
          <div className="space-y-2">
            {returned.map(c => (
              <div key={c.claimId} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-orange-100">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-slate-800 text-sm">{c.claimTypeName}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-slate-500 text-xs">{c.businessPurpose||'—'}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="font-semibold text-slate-700 text-xs">₹{(c.totalAmount||0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex gap-2 ml-3">
                  <button onClick={() => openDetail(c)} className="text-xs text-slate-500 hover:underline flex items-center gap-1">
                    <Eye size={12}/> View
                  </button>
                  <button onClick={() => editDraft(c)}
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium">
                    ✏️ Edit & Resubmit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claims History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <CreditCard size={18} className="text-slate-400" />
          <h2 className="font-semibold text-slate-800">Claims History</h2>
          <span className="ml-auto text-xs text-slate-400">{submitted.length} claims</span>
        </div>
        {submitted.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-slate-400">
            <FileText size={36} className="text-slate-200" />
            <p className="text-sm text-slate-500">No claims submitted yet</p>
            <button onClick={startWizard} className="text-sm text-indigo-600 hover:underline">Submit your first claim</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Type','Purpose','Amount','Stage','Status','Date',''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {submitted.map(claim => (
                  <tr key={claim.claimId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-800">{claim.claimTypeName}</td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-[120px] truncate">{claim.businessPurpose||'—'}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">₹{(claim.totalAmount||0).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{claim.currentStage ? STAGE_LABELS[claim.currentStage] : '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[claim.status]||'bg-gray-100 text-gray-600'}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openDetail(claim)} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg" title="View"><Eye size={14}/></button>
                        {claim.status === 'Returned' && (
                          <button onClick={() => editDraft(claim)}
                            className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Edit & Resubmit">
                            <RotateCcw size={14}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
