/**
 * HRMS Claim Management V2 Controller
 * Enterprise-grade, production-ready implementation
 * Supports: 5 claim types, multi-line items, file attachments,
 * approval workflow with limit-based routing, full audit trail
 */

'use strict';

const { dynamoClient } = require('../../config/dynamodb-wrapper');
const {
  PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand
} = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');
const { createNotification, NOTIFICATION_TYPES, PRIORITY } = require('../../services/hrmsNotificationService');

// ── Table Names ──────────────────────────────────────────────────────────────
const CLAIM_TYPES_TABLE    = 'hrms-claim-types';
const CLAIMS_TABLE         = 'hrms-claims-v2';
const LINE_ITEMS_TABLE     = 'hrms-claim-line-items';
const APPROVALS_TABLE      = 'hrms-claim-approvals';
const EMPLOYEES_TABLE      = 'staffinn-hrms-employee-users';
const HRMS_USERS_TABLE     = 'staffinn-hrms-users';

// ── Valid Enumerations ───────────────────────────────────────────────────────
const VALID_CLAIM_TYPES   = ['Travel', 'Accommodation', 'Meal', 'Conveyance', 'Miscellaneous'];
const VALID_STATUSES      = ['Draft','Submitted','Under Review','Manager Approved','HR Verified','Accounts Approved','Rejected','Returned','Payment Processed','Paid'];
const VALID_STAGES        = ['TEAM_LEAD','HR','ACCOUNTS','FINANCE'];
const VALID_ACTIONS       = ['Approved','Rejected','Returned'];
const VALID_MODES_TRAVEL  = ['Bus','Train','Flight','Taxi','Auto','Cab','Personal Vehicle','Other'];
const VALID_MEAL_TYPES    = ['Breakfast','Lunch','Dinner','Snacks','Other'];
const VALID_PURPOSES      = ['Client Meeting','Training','Official Visit','Site Inspection','College Visit','Mobilization Activity','Other'];

// ── Sanitisation helper ──────────────────────────────────────────────────────
const sanitiseString = (v, max = 500) =>
  typeof v === 'string' ? v.trim().substring(0, max) : '';

const sanitiseNumber = (v) => {
  const n = parseFloat(v);
  return isNaN(n) || n < 0 ? 0 : Math.round(n * 100) / 100;
};

// ── Find recruiterId for any user (HR admin or employee) ─────────────────────
const resolveRecruiterId = async (req) => {
  // Priority 1: directly in req.user (HRMS admin token always has this)
  if (req.user?.recruiterId) return req.user.recruiterId;

  const userId = req.user?.userId || req.user?.employeeId;
  if (!userId) return null;

  // Priority 2: userId exists in staffinn-hrms-users (admin) — return their recruiterId
  try {
    const r = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_USERS_TABLE,
      FilterExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId }
    }));
    if (r.Items && r.Items.length > 0 && r.Items[0].recruiterId) {
      return r.Items[0].recruiterId;
    }
  } catch (_) {}

  // Priority 3: look up in staffinn-hrms-employees (onboarding table) by userId or email
  try {
    const r = await dynamoClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-employees',
      FilterExpression: 'userId = :uid OR email = :email OR officialEmail = :email',
      ExpressionAttributeValues: {
        ':uid':   userId,
        ':email': req.user?.email || userId
      }
    }));
    if (r.Items && r.Items.length > 0 && r.Items[0].recruiterId) {
      return r.Items[0].recruiterId;
    }
  } catch (_) {}

  // Priority 4: look up in staffinn-hrms-employee-users by userId to get email,
  // then find that email in staffinn-hrms-employees
  try {
    const empUser = await dynamoClient.send(new ScanCommand({
      TableName: EMPLOYEES_TABLE,
      FilterExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId }
    }));
    if (empUser.Items && empUser.Items.length > 0) {
      const email = empUser.Items[0].email;
      if (email) {
        const empRecord = await dynamoClient.send(new ScanCommand({
          TableName: 'staffinn-hrms-employees',
          FilterExpression: 'email = :e OR officialEmail = :e',
          ExpressionAttributeValues: { ':e': email.toLowerCase() }
        }));
        if (empRecord.Items && empRecord.Items.length > 0 && empRecord.Items[0].recruiterId) {
          return empRecord.Items[0].recruiterId;
        }
      }
    }
  } catch (_) {}

  return null;
};

// ── Find employee/HR-user by userId — returns full profile ────────────────────
const findUserById = async (userId) => {
  // 1. Try staffinn-hrms-employees (onboarding table — has fullName, department, designation)
  try {
    const r = await dynamoClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-employees',
      FilterExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId }
    }));
    if (r.Items && r.Items.length > 0) return { ...r.Items[0], _source: 'hrms_employees' };
  } catch (_) {}

  // 2. Try staffinn-hrms-employee-users (login table — has email but limited profile)
  try {
    const r = await dynamoClient.send(new ScanCommand({
      TableName: EMPLOYEES_TABLE,
      FilterExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId }
    }));
    if (r.Items && r.Items.length > 0) {
      const empUser = r.Items[0];
      // Cross-lookup: find full profile via email in hrms-employees
      if (empUser.email) {
        try {
          const r2 = await dynamoClient.send(new ScanCommand({
            TableName: 'staffinn-hrms-employees',
            FilterExpression: 'email = :e OR officialEmail = :e',
            ExpressionAttributeValues: { ':e': empUser.email.toLowerCase() }
          }));
          if (r2.Items && r2.Items.length > 0) {
            // Merge: prefer onboarding table for profile fields
            return { ...empUser, ...r2.Items[0], _source: 'merged' };
          }
        } catch (_) {}
      }
      return { ...empUser, _source: 'employee_users' };
    }
  } catch (_) {}

  // 3. Fallback to HRMS admin table
  try {
    const r = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_USERS_TABLE,
      FilterExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId }
    }));
    if (r.Items && r.Items.length > 0) return { ...r.Items[0], _source: 'hrms_user' };
  } catch (_) {}

  return null;
};

// ════════════════════════════════════════════════════════════════════════════
//  CLAIM TYPE CONFIG  (HR Admin)
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /hrms/v2/claim-types
 * List all claim types for this recruiter
 */
const getClaimTypes = async (req, res) => {
  try {
    const recruiterId = await resolveRecruiterId(req);
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID missing — contact HR Admin'));

    const result = await dynamoClient.send(new ScanCommand({
      TableName: CLAIM_TYPES_TABLE,
      FilterExpression: 'recruiterId = :rid AND isActive = :t',
      ExpressionAttributeValues: { ':rid': recruiterId, ':t': true }
    }));

    return res.json(successResponse(result.Items || [], 'Claim types retrieved'));
  } catch (err) {
    console.error('❌ getClaimTypes error:', err.message, err.code);
    handleError(err, res);
  }
};

/**
 * POST /hrms/v2/claim-types
 * Create a new claim type with approval limit
 */
const createClaimType = async (req, res) => {
  try {
    const recruiterId = await resolveRecruiterId(req);
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID missing'));

    const {
      name, description,
      approvalLimit,           // ₹ threshold
      withinLimitApprover,     // 'TEAM_LEAD'
      exceedLimitApprover,     // 'HR_ADMIN'
      ratePerKM,               // for Conveyance
      requiresAttachment,
      allowedFileFormats
    } = req.body;

    // Validate
    if (!name || !VALID_CLAIM_TYPES.includes(name))
      return res.status(400).json(errorResponse(`name must be one of: ${VALID_CLAIM_TYPES.join(', ')}`));
    if (approvalLimit !== undefined && (isNaN(approvalLimit) || Number(approvalLimit) < 0))
      return res.status(400).json(errorResponse('approvalLimit must be a non-negative number'));

    const claimTypeId = generateId();
    const item = {
      claimTypeId,
      recruiterId,
      name: sanitiseString(name, 50),
      description: sanitiseString(description, 300),
      approvalLimit: sanitiseNumber(approvalLimit ?? 10000),
      withinLimitApprover: withinLimitApprover === 'HR_ADMIN' ? 'HR_ADMIN' : 'TEAM_LEAD',
      exceedLimitApprover: 'HR_ADMIN',
      ratePerKM: sanitiseNumber(ratePerKM ?? 4),
      requiresAttachment: requiresAttachment !== false,
      allowedFileFormats: Array.isArray(allowedFileFormats)
        ? allowedFileFormats.filter(f => ['pdf','jpg','jpeg','png'].includes(f.toLowerCase()))
        : ['pdf','jpg','jpeg','png'],
      isActive: true,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    await dynamoClient.send(new PutCommand({ TableName: CLAIM_TYPES_TABLE, Item: item }));
    return res.status(201).json(successResponse(item, 'Claim type created'));
  } catch (err) { handleError(err, res); }
};

/**
 * PUT /hrms/v2/claim-types/:claimTypeId
 */
const updateClaimType = async (req, res) => {
  try {
    const recruiterId = await resolveRecruiterId(req);
    const { claimTypeId } = req.params;
    if (!claimTypeId) return res.status(400).json(errorResponse('claimTypeId required'));

    const result = await dynamoClient.send(new ScanCommand({
      TableName: CLAIM_TYPES_TABLE,
      FilterExpression: 'claimTypeId = :id AND recruiterId = :rid',
      ExpressionAttributeValues: { ':id': claimTypeId, ':rid': recruiterId }
    }));
    if (!result.Items || result.Items.length === 0)
      return res.status(404).json(errorResponse('Claim type not found'));

    const existing = result.Items[0];
    const allowed = ['description','approvalLimit','withinLimitApprover','ratePerKM','requiresAttachment','allowedFileFormats','isActive'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.approvalLimit !== undefined) updates.approvalLimit = sanitiseNumber(updates.approvalLimit);
    if (updates.ratePerKM !== undefined)     updates.ratePerKM     = sanitiseNumber(updates.ratePerKM);

    const updated = { ...existing, ...updates, updatedAt: getCurrentTimestamp() };
    await dynamoClient.send(new PutCommand({ TableName: CLAIM_TYPES_TABLE, Item: updated }));
    return res.json(successResponse(updated, 'Claim type updated'));
  } catch (err) { handleError(err, res); }
};

/**
 * DELETE /hrms/v2/claim-types/:claimTypeId  (soft delete)
 */
const deleteClaimType = async (req, res) => {
  try {
    const recruiterId = await resolveRecruiterId(req);
    const { claimTypeId } = req.params;

    const result = await dynamoClient.send(new ScanCommand({
      TableName: CLAIM_TYPES_TABLE,
      FilterExpression: 'claimTypeId = :id AND recruiterId = :rid',
      ExpressionAttributeValues: { ':id': claimTypeId, ':rid': recruiterId }
    }));
    if (!result.Items || result.Items.length === 0)
      return res.status(404).json(errorResponse('Claim type not found'));

    const item = { ...result.Items[0], isActive: false, updatedAt: getCurrentTimestamp() };
    await dynamoClient.send(new PutCommand({ TableName: CLAIM_TYPES_TABLE, Item: item }));
    return res.json(successResponse(null, 'Claim type deactivated'));
  } catch (err) { handleError(err, res); }
};

// ════════════════════════════════════════════════════════════════════════════
//  CLAIMS  (Employee)
// ════════════════════════════════════════════════════════════════════════════

/**
 * POST /hrms/v2/claims   — Create or save-as-draft
 */
const createClaim = async (req, res) => {
  try {
    const actorId    = req.user?.userId || req.user?.employeeId;
    const recruiterId = await resolveRecruiterId(req);
    if (!actorId || !recruiterId) return res.status(401).json(errorResponse('Unauthorised'));

    // Auto-fill employee snapshot
    const emp = await findUserById(actorId);

    const {
      claimTypeId, businessPurpose, purposeDetail,
      isDraft = false, lineItems = []
    } = req.body;

    // Validate claimTypeId
    if (!claimTypeId) return res.status(400).json(errorResponse('claimTypeId is required'));
    const ctResult = await dynamoClient.send(new ScanCommand({
      TableName: CLAIM_TYPES_TABLE,
      FilterExpression: 'claimTypeId = :id AND recruiterId = :rid AND isActive = :t',
      ExpressionAttributeValues: { ':id': claimTypeId, ':rid': recruiterId, ':t': true }
    }));
    if (!ctResult.Items || ctResult.Items.length === 0)
      return res.status(400).json(errorResponse('Invalid or inactive claim type'));
    const claimType = ctResult.Items[0];

    if (businessPurpose && !VALID_PURPOSES.includes(businessPurpose) && businessPurpose !== 'Other')
      return res.status(400).json(errorResponse('Invalid businessPurpose value'));

    // Validate and build line items
    const builtLineItems = [];
    let totalAmount = 0;
    for (const li of lineItems) {
      const lineItemId = generateId();
      const amount = sanitiseNumber(li.amount ?? 0);
      totalAmount += amount;

      // Conveyance auto-calc
      let finalAmount = amount;
      if (claimType.name === 'Conveyance') {
        const dist = sanitiseNumber(li.subTypeFields?.distanceKM ?? 0);
        const rate = sanitiseNumber(li.subTypeFields?.ratePerKM ?? claimType.ratePerKM ?? 4);
        finalAmount = Math.round(dist * rate * 100) / 100;
        totalAmount = totalAmount - amount + finalAmount;
      }

      builtLineItems.push({
        lineItemId,
        claimTypeId,
        claimTypeName: claimType.name,
        date: sanitiseString(li.date, 20),
        description: sanitiseString(li.description, 300),
        amount: finalAmount,
        subTypeFields: li.subTypeFields || {},
        attachmentUrls: Array.isArray(li.attachmentUrls)
          ? li.attachmentUrls.filter(u => typeof u === 'string' && u.startsWith('https://')).slice(0, 10)
          : [],
        createdAt: getCurrentTimestamp()
      });
    }

    const claimId = generateId();
    const now = getCurrentTimestamp();

    // Determine routing
    let firstStage = null;
    let currentApproverId = null;
    if (!isDraft) {
      if (totalAmount <= claimType.approvalLimit) {
        firstStage = 'TEAM_LEAD';
        currentApproverId = emp?.reportingManagerId || null;
      } else {
        firstStage = 'HR';
      }
    }

    const claim = {
      claimId,
      recruiterId,
      employeeId: actorId,
      employeeName: sanitiseString(emp?.fullName || emp?.name || emp?.employeeName || '', 100),
      department: sanitiseString(emp?.department || '', 100),
      designation: sanitiseString(emp?.designation || emp?.position || '', 100),
      reportingManagerId: sanitiseString(emp?.reportingManagerId || emp?.managerId || '', 50),
      branchLocation: sanitiseString(emp?.workLocation || emp?.branchLocation || '', 100),
      claimTypeId,
      claimTypeName: claimType.name,
      businessPurpose: sanitiseString(businessPurpose || '', 50),
      purposeDetail: sanitiseString(purposeDetail || '', 500),
      totalAmount,
      isDraft: Boolean(isDraft),
      status: isDraft ? 'Draft' : 'Submitted',
      currentStage: firstStage,
      currentApproverId,
      submittedAt: isDraft ? null : now,
      createdAt: now,
      updatedAt: now,
      approvalLimit: claimType.approvalLimit,
      ratePerKM: claimType.ratePerKM
    };

    await dynamoClient.send(new PutCommand({ TableName: CLAIMS_TABLE, Item: claim }));

    // Store line items
    for (const li of builtLineItems) {
      await dynamoClient.send(new PutCommand({
        TableName: LINE_ITEMS_TABLE,
        Item: { ...li, claimId, recruiterId }
      }));
    }

    // Notify approver if submitted
    if (!isDraft && currentApproverId) {
      try {
        await createNotification({
          employeeId: currentApproverId, recruiterId,
          type: 'CLAIM_APPROVAL_REQUESTED',
          title: 'Claim Approval Required',
          message: `${claim.employeeName} submitted a ${claimType.name} claim of ₹${totalAmount} awaiting your approval`,
          relatedEntityId: claimId, relatedEntityType: 'CLAIM',
          actionUrl: '/claims', priority: PRIORITY.HIGH
        });
      } catch (_) {}
    }

    return res.status(201).json(successResponse({ claimId, status: claim.status, totalAmount }, 'Claim saved'));
  } catch (err) { handleError(err, res); }
};

/**
 * PUT /hrms/v2/claims/:claimId  — Update a Draft claim (fields + line items)
 */
const updateClaim = async (req, res) => {
  try {
    const actorId    = req.user?.userId || req.user?.employeeId;
    const recruiterId = await resolveRecruiterId(req);
    const { claimId } = req.params;

    const result = await dynamoClient.send(new ScanCommand({
      TableName: CLAIMS_TABLE,
      FilterExpression: 'claimId = :id AND employeeId = :eid AND recruiterId = :rid',
      ExpressionAttributeValues: { ':id': claimId, ':eid': actorId, ':rid': recruiterId }
    }));
    if (!result.Items || result.Items.length === 0)
      return res.status(404).json(errorResponse('Claim not found'));

    const claim = result.Items[0];
    if (!['Draft', 'Returned'].includes(claim.status))
      return res.status(400).json(errorResponse('Only Draft or Returned claims can be updated'));

    // ── Update scalar fields ──────────────────────────────────────────────
    const allowed = ['businessPurpose','purposeDetail'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = sanitiseString(req.body[k], 500); });

    // ── Replace line items if provided ────────────────────────────────────
    let totalAmount = claim.totalAmount || 0;
    if (Array.isArray(req.body.lineItems) && req.body.lineItems.length > 0) {
      // Fetch claim type for validation / conveyance calc
      const ctResult = await dynamoClient.send(new ScanCommand({
        TableName: CLAIM_TYPES_TABLE,
        FilterExpression: 'claimTypeId = :id AND recruiterId = :rid',
        ExpressionAttributeValues: { ':id': claim.claimTypeId, ':rid': recruiterId }
      }));
      const claimType = ctResult.Items?.[0] || {};

      // Delete existing line items for this claim
      const existingLI = await dynamoClient.send(new ScanCommand({
        TableName: LINE_ITEMS_TABLE,
        FilterExpression: 'claimId = :cid',
        ExpressionAttributeValues: { ':cid': claimId }
      }));
      for (const li of (existingLI.Items || [])) {
        await dynamoClient.send(new DeleteCommand({
          TableName: LINE_ITEMS_TABLE,
          Key: { lineItemId: li.lineItemId, claimId: li.claimId }
        }));
      }

      // Insert new line items
      totalAmount = 0;
      for (const li of req.body.lineItems) {
        const lineItemId = generateId();
        let amount = sanitiseNumber(li.amount ?? 0);

        if (claimType.name === 'Conveyance') {
          const dist = sanitiseNumber(li.subTypeFields?.distanceKM ?? 0);
          const rate = sanitiseNumber(li.subTypeFields?.ratePerKM ?? claimType.ratePerKM ?? 4);
          amount = Math.round(dist * rate * 100) / 100;
        }
        totalAmount += amount;

        await dynamoClient.send(new PutCommand({
          TableName: LINE_ITEMS_TABLE,
          Item: {
            lineItemId,
            claimId,
            recruiterId,
            claimTypeId: claim.claimTypeId,
            claimTypeName: claim.claimTypeName,
            date:          sanitiseString(li.date, 20),
            description:   sanitiseString(li.description, 300),
            amount,
            subTypeFields: li.subTypeFields || {},
            attachmentUrls: Array.isArray(li.attachmentUrls)
              ? li.attachmentUrls.filter(u => typeof u === 'string' && u.startsWith('https://')).slice(0, 10)
              : [],
            attachmentNames: Array.isArray(li.attachmentNames) ? li.attachmentNames.slice(0, 10) : [],
            createdAt: getCurrentTimestamp()
          }
        }));
      }
      updates.totalAmount = totalAmount;
    }

    const updated = { ...claim, ...updates, updatedAt: getCurrentTimestamp() };
    await dynamoClient.send(new PutCommand({ TableName: CLAIMS_TABLE, Item: updated }));
    return res.json(successResponse(updated, 'Claim updated'));
  } catch (err) { handleError(err, res); }
};

/**
 * POST /hrms/v2/claims/:claimId/submit  — Submit a Draft
 */
const submitClaim = async (req, res) => {
  try {
    const actorId    = req.user?.userId || req.user?.employeeId;
    const recruiterId = await resolveRecruiterId(req);
    const { claimId } = req.params;

    const result = await dynamoClient.send(new ScanCommand({
      TableName: CLAIMS_TABLE,
      FilterExpression: 'claimId = :id AND employeeId = :eid AND recruiterId = :rid',
      ExpressionAttributeValues: { ':id': claimId, ':eid': actorId, ':rid': recruiterId }
    }));
    if (!result.Items || result.Items.length === 0)
      return res.status(404).json(errorResponse('Claim not found'));

    const claim = result.Items[0];
    if (!['Draft', 'Returned'].includes(claim.status))
      return res.status(400).json(errorResponse('Only Draft or Returned claims can be submitted'));

    // Check at least one line item exists
    const liResult = await dynamoClient.send(new ScanCommand({
      TableName: LINE_ITEMS_TABLE,
      FilterExpression: 'claimId = :id',
      ExpressionAttributeValues: { ':id': claimId }
    }));
    if (!liResult.Items || liResult.Items.length === 0)
      return res.status(400).json(errorResponse('Add at least one expense item before submitting'));

    const firstStage = claim.totalAmount <= claim.approvalLimit ? 'TEAM_LEAD' : 'HR';
    const emp = await findUserById(actorId);
    const currentApproverId = firstStage === 'TEAM_LEAD' ? (emp?.reportingManagerId || null) : null;

    const updated = {
      ...claim, isDraft: false, status: 'Submitted',
      currentStage: firstStage, currentApproverId,
      submittedAt: getCurrentTimestamp(), updatedAt: getCurrentTimestamp()
    };
    await dynamoClient.send(new PutCommand({ TableName: CLAIMS_TABLE, Item: updated }));

    if (currentApproverId) {
      try {
        await createNotification({
          employeeId: currentApproverId, recruiterId,
          type: 'CLAIM_APPROVAL_REQUESTED',
          title: 'Claim Approval Required',
          message: `${claim.employeeName} submitted a ${claim.claimTypeName} claim of ₹${claim.totalAmount}`,
          relatedEntityId: claimId, relatedEntityType: 'CLAIM',
          actionUrl: '/claims', priority: PRIORITY.HIGH
        });
      } catch (_) {}
    }

    return res.json(successResponse({ claimId, status: 'Submitted' }, 'Claim submitted successfully'));
  } catch (err) { handleError(err, res); }
};

/**
 * GET /hrms/v2/claims/my  — Employee: own claims
 */
const getMyClaims = async (req, res) => {
  try {
    const actorId     = req.user?.userId || req.user?.employeeId;
    const recruiterId = await resolveRecruiterId(req);

    // Filter by employeeId always; add recruiterId filter only if available
    let filterExpr = 'employeeId = :eid';
    const exprVals = { ':eid': actorId };

    if (recruiterId) {
      filterExpr += ' AND recruiterId = :rid';
      exprVals[':rid'] = recruiterId;
    }

    const result = await dynamoClient.send(new ScanCommand({
      TableName: CLAIMS_TABLE,
      FilterExpression: filterExpr,
      ExpressionAttributeValues: exprVals
    }));

    const claims = (result.Items || []).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return res.json(successResponse(claims, 'Claims retrieved'));
  } catch (err) { handleError(err, res); }
};

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN / APPROVER VIEWS
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /hrms/v2/claims  — HR Admin: all claims with filters
 */
const getAllClaims = async (req, res) => {
  try {
    const recruiterId = await resolveRecruiterId(req);
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID missing'));

    const { status, claimTypeName, employeeId, fromDate, toDate } = req.query;

    const result = await dynamoClient.send(new ScanCommand({
      TableName: CLAIMS_TABLE,
      FilterExpression: 'recruiterId = :rid',
      ExpressionAttributeValues: { ':rid': recruiterId }
    }));

    let claims = result.Items || [];

    // Apply filters (server-side safe filtering)
    if (status && VALID_STATUSES.includes(status))
      claims = claims.filter(c => c.status === status);
    if (claimTypeName && VALID_CLAIM_TYPES.includes(claimTypeName))
      claims = claims.filter(c => c.claimTypeName === claimTypeName);
    if (employeeId)
      claims = claims.filter(c => c.employeeId === sanitiseString(employeeId, 50));
    if (fromDate)
      claims = claims.filter(c => c.submittedAt >= fromDate);
    if (toDate)
      claims = claims.filter(c => c.submittedAt <= toDate + 'T23:59:59');

    claims.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return res.json(successResponse(claims, 'Claims retrieved'));
  } catch (err) { handleError(err, res); }
};

/**
 * GET /hrms/v2/claims/stats  — Dashboard stats
 */
const getClaimStats = async (req, res) => {
  try {
    const recruiterId = await resolveRecruiterId(req);

    const result = await dynamoClient.send(new ScanCommand({
      TableName: CLAIMS_TABLE,
      FilterExpression: 'recruiterId = :rid',
      ExpressionAttributeValues: { ':rid': recruiterId }
    }));

    const claims = result.Items || [];
    const stats = {
      total:             claims.length,
      draft:             claims.filter(c => c.status === 'Draft').length,
      submitted:         claims.filter(c => c.status === 'Submitted').length,
      underReview:       claims.filter(c => c.status === 'Under Review').length,
      managerApproved:   claims.filter(c => c.status === 'Manager Approved').length,
      hrVerified:        claims.filter(c => c.status === 'HR Verified').length,
      accountsApproved:  claims.filter(c => c.status === 'Accounts Approved').length,
      rejected:          claims.filter(c => c.status === 'Rejected').length,
      paid:              claims.filter(c => c.status === 'Paid').length,
      totalPendingAmount: claims
        .filter(c => !['Draft','Rejected','Paid','Payment Processed'].includes(c.status))
        .reduce((s, c) => s + (c.totalAmount || 0), 0)
    };
    return res.json(successResponse(stats, 'Stats retrieved'));
  } catch (err) { handleError(err, res); }
};

/**
 * GET /hrms/v2/claims/:claimId  — Full claim detail + line items + history
 */
const getClaimById = async (req, res) => {
  try {
    const recruiterId = await resolveRecruiterId(req);
    const { claimId } = req.params;

    const [claimResult, liResult, apResult] = await Promise.all([
      dynamoClient.send(new ScanCommand({
        TableName: CLAIMS_TABLE,
        FilterExpression: 'claimId = :id AND recruiterId = :rid',
        ExpressionAttributeValues: { ':id': claimId, ':rid': recruiterId }
      })),
      dynamoClient.send(new ScanCommand({
        TableName: LINE_ITEMS_TABLE,
        FilterExpression: 'claimId = :id',
        ExpressionAttributeValues: { ':id': claimId }
      })),
      dynamoClient.send(new ScanCommand({
        TableName: APPROVALS_TABLE,
        FilterExpression: 'claimId = :id',
        ExpressionAttributeValues: { ':id': claimId }
      }))
    ]);

    if (!claimResult.Items || claimResult.Items.length === 0)
      return res.status(404).json(errorResponse('Claim not found'));

    const claim    = claimResult.Items[0];
    const lineItems = (liResult.Items || []).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const history   = (apResult.Items || []).sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));

    return res.json(successResponse({ ...claim, lineItems, approvalHistory: history }, 'Claim detail retrieved'));
  } catch (err) { handleError(err, res); }
};

// ════════════════════════════════════════════════════════════════════════════
//  APPROVAL WORKFLOW
// ════════════════════════════════════════════════════════════════════════════

// Workflow order
const STAGE_ORDER = ['TEAM_LEAD','HR','ACCOUNTS','FINANCE'];
const STAGE_NEXT  = { TEAM_LEAD: 'HR', HR: 'ACCOUNTS', ACCOUNTS: 'FINANCE', FINANCE: null };
const STATUS_AFTER_APPROVAL = {
  TEAM_LEAD: 'Manager Approved',
  HR:        'HR Verified',
  ACCOUNTS:  'Accounts Approved',
  FINANCE:   'Payment Processed'
};

/**
 * POST /hrms/v2/claims/:claimId/action
 * Body: { action: 'Approved'|'Rejected'|'Returned', remarks, stage }
 * Approver: TL, HR, Accounts, or Finance
 */
const processClaimAction = async (req, res) => {
  try {
    const actorId    = req.user?.userId || req.user?.employeeId;
    const recruiterId = await resolveRecruiterId(req);
    const { claimId } = req.params;
    const { action, remarks, stage } = req.body;

    // Validate inputs
    if (!VALID_ACTIONS.includes(action))
      return res.status(400).json(errorResponse(`action must be one of: ${VALID_ACTIONS.join(', ')}`));
    if (!stage || !VALID_STAGES.includes(stage))
      return res.status(400).json(errorResponse(`stage must be one of: ${VALID_STAGES.join(', ')}`));
    if (action === 'Rejected' && !remarks?.trim())
      return res.status(400).json(errorResponse('Rejection remarks are mandatory'));
    if (action === 'Returned' && !remarks?.trim())
      return res.status(400).json(errorResponse('Return remarks are mandatory'));

    const result = await dynamoClient.send(new ScanCommand({
      TableName: CLAIMS_TABLE,
      FilterExpression: 'claimId = :id AND recruiterId = :rid',
      ExpressionAttributeValues: { ':id': claimId, ':rid': recruiterId }
    }));
    if (!result.Items || result.Items.length === 0)
      return res.status(404).json(errorResponse('Claim not found'));

    const claim = result.Items[0];

    // Ensure claim is in an actionable state
    const nonActionable = ['Draft','Rejected','Paid','Payment Processed'];
    if (nonActionable.includes(claim.status))
      return res.status(400).json(errorResponse(`Claim in ${claim.status} state cannot be actioned`));

    // Record approval step
    const approvalId = generateId();
    const now = getCurrentTimestamp();
    const approver = await findUserById(actorId);

    await dynamoClient.send(new PutCommand({
      TableName: APPROVALS_TABLE,
      Item: {
        approvalId, claimId, recruiterId,
        stage,
        approverId: actorId,
        approverName: sanitiseString(approver?.fullName || approver?.name || '', 100),
        action,
        remarks: sanitiseString(remarks || '', 1000),
        timestamp: now
      }
    }));

    // Compute new claim state
    let newStatus = claim.status;
    let newStage  = claim.currentStage;
    let newApproverId = claim.currentApproverId;

    if (action === 'Approved') {
      const nextStage = STAGE_NEXT[stage];
      if (nextStage) {
        newStatus     = STATUS_AFTER_APPROVAL[stage];
        newStage      = nextStage;
        newApproverId = null; // HR admin will handle next manually
      } else {
        // FINANCE approved → done
        newStatus     = 'Payment Processed';
        newStage      = null;
        newApproverId = null;
      }
    } else if (action === 'Rejected') {
      newStatus     = 'Rejected';
      newStage      = null;
      newApproverId = null;
    } else if (action === 'Returned') {
      // Return to employee for correction — distinct status so employee sees it separately
      newStatus     = 'Returned';
      newStage      = null;
      newApproverId = null;
    }

    const updated = {
      ...claim, status: newStatus, currentStage: newStage,
      currentApproverId: newApproverId, updatedAt: now
    };
    await dynamoClient.send(new PutCommand({ TableName: CLAIMS_TABLE, Item: updated }));

    // Notify employee
    try {
      if (action === 'Approved' && newStatus === 'Payment Processed') {
        await createNotification({
          employeeId: claim.employeeId, recruiterId,
          type: NOTIFICATION_TYPES.CLAIM_APPROVED,
          title: 'Claim Approved — Payment Processing',
          message: `Your ${claim.claimTypeName} claim of ₹${claim.totalAmount} has been fully approved`,
          relatedEntityId: claimId, relatedEntityType: 'CLAIM',
          actionUrl: '/claims', priority: PRIORITY.HIGH
        });
      } else if (action === 'Rejected') {
        await createNotification({
          employeeId: claim.employeeId, recruiterId,
          type: NOTIFICATION_TYPES.CLAIM_REJECTED,
          title: 'Claim Rejected',
          message: `Your ${claim.claimTypeName} claim of ₹${claim.totalAmount} was rejected. Reason: ${remarks}`,
          relatedEntityId: claimId, relatedEntityType: 'CLAIM',
          actionUrl: '/claims', priority: PRIORITY.HIGH
        });
      } else if (action === 'Returned') {
        await createNotification({
          employeeId: claim.employeeId, recruiterId,
          type: 'CLAIM_RETURNED',
          title: 'Claim Returned for Correction',
          message: `Your ${claim.claimTypeName} claim was returned. Please correct and resubmit. Remarks: ${remarks}`,
          relatedEntityId: claimId, relatedEntityType: 'CLAIM',
          actionUrl: '/claims', priority: PRIORITY.MEDIUM
        });
      }
    } catch (_) {}

    return res.json(successResponse({ claimId, status: newStatus }, `Claim ${action.toLowerCase()} successfully`));
  } catch (err) { handleError(err, res); }
};

/**
 * GET /hrms/v2/claims/pending-approvals
 * Returns claims waiting at the requesting user's approval stage
 */
const getPendingApprovals = async (req, res) => {
  try {
    const actorId    = req.user?.userId || req.user?.employeeId;
    const recruiterId = await resolveRecruiterId(req);

    const result = await dynamoClient.send(new ScanCommand({
      TableName: CLAIMS_TABLE,
      FilterExpression: 'recruiterId = :rid AND #st <> :draft AND #st <> :rejected AND #st <> :paid AND #st <> :pp',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: {
        ':rid': recruiterId, ':draft': 'Draft',
        ':rejected': 'Rejected', ':paid': 'Paid', ':pp': 'Payment Processed'
      }
    }));

    // Return claims where currentApproverId matches actor, or stage is HR/ACCOUNTS/FINANCE (admin handles)
    const pending = (result.Items || []).filter(c =>
      c.currentApproverId === actorId ||
      (c.currentStage && ['HR','ACCOUNTS','FINANCE'].includes(c.currentStage))
    );

    pending.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
    return res.json(successResponse(pending, 'Pending approvals retrieved'));
  } catch (err) { handleError(err, res); }
};

// ════════════════════════════════════════════════════════════════════════════
//  LINE ITEMS
// ════════════════════════════════════════════════════════════════════════════

/**
 * POST /hrms/v2/claims/:claimId/line-items
 */
const addLineItem = async (req, res) => {
  try {
    const actorId    = req.user?.userId || req.user?.employeeId;
    const recruiterId = await resolveRecruiterId(req);
    const { claimId } = req.params;

    // Verify claim ownership and draft state
    const result = await dynamoClient.send(new ScanCommand({
      TableName: CLAIMS_TABLE,
      FilterExpression: 'claimId = :id AND employeeId = :eid AND recruiterId = :rid',
      ExpressionAttributeValues: { ':id': claimId, ':eid': actorId, ':rid': recruiterId }
    }));
    if (!result.Items || result.Items.length === 0)
      return res.status(404).json(errorResponse('Claim not found'));
    const claim = result.Items[0];
    if (!['Draft','Submitted'].includes(claim.status) && claim.status !== 'Draft')
      return res.status(400).json(errorResponse('Cannot add items to a submitted claim'));

    const { date, description, amount, subTypeFields, attachmentUrls } = req.body;
    if (!date || amount === undefined)
      return res.status(400).json(errorResponse('date and amount are required'));

    let finalAmount = sanitiseNumber(amount);
    if (claim.claimTypeName === 'Conveyance') {
      const dist = sanitiseNumber(subTypeFields?.distanceKM ?? 0);
      const rate = sanitiseNumber(subTypeFields?.ratePerKM ?? claim.ratePerKM ?? 4);
      finalAmount = Math.round(dist * rate * 100) / 100;
    }

    const lineItemId = generateId();
    const li = {
      lineItemId, claimId, recruiterId,
      claimTypeId:   claim.claimTypeId,
      claimTypeName: claim.claimTypeName,
      date:          sanitiseString(date, 20),
      description:   sanitiseString(description || '', 300),
      amount:        finalAmount,
      subTypeFields: subTypeFields || {},
      attachmentUrls: Array.isArray(attachmentUrls)
        ? attachmentUrls.filter(u => typeof u === 'string' && u.startsWith('https://')).slice(0, 10)
        : [],
      createdAt: getCurrentTimestamp()
    };

    await dynamoClient.send(new PutCommand({ TableName: LINE_ITEMS_TABLE, Item: li }));

    // Recalculate claim total
    const allLI = await dynamoClient.send(new ScanCommand({
      TableName: LINE_ITEMS_TABLE,
      FilterExpression: 'claimId = :id',
      ExpressionAttributeValues: { ':id': claimId }
    }));
    const newTotal = (allLI.Items || []).reduce((s, i) => s + (i.amount || 0), 0);
    await dynamoClient.send(new PutCommand({
      TableName: CLAIMS_TABLE,
      Item: { ...claim, totalAmount: Math.round(newTotal * 100) / 100, updatedAt: getCurrentTimestamp() }
    }));

    return res.status(201).json(successResponse(li, 'Line item added'));
  } catch (err) { handleError(err, res); }
};

/**
 * DELETE /hrms/v2/claims/:claimId/line-items/:lineItemId
 */
const deleteLineItem = async (req, res) => {
  try {
    const actorId    = req.user?.userId || req.user?.employeeId;
    const recruiterId = await resolveRecruiterId(req);
    const { claimId, lineItemId } = req.params;

    // Verify claim ownership
    const claimResult = await dynamoClient.send(new ScanCommand({
      TableName: CLAIMS_TABLE,
      FilterExpression: 'claimId = :id AND employeeId = :eid AND recruiterId = :rid',
      ExpressionAttributeValues: { ':id': claimId, ':eid': actorId, ':rid': recruiterId }
    }));
    if (!claimResult.Items || claimResult.Items.length === 0)
      return res.status(404).json(errorResponse('Claim not found'));
    const claim = claimResult.Items[0];
    if (claim.status !== 'Draft')
      return res.status(400).json(errorResponse('Cannot delete items from a submitted claim'));

    // Find line item
    const liResult = await dynamoClient.send(new ScanCommand({
      TableName: LINE_ITEMS_TABLE,
      FilterExpression: 'lineItemId = :lid AND claimId = :cid',
      ExpressionAttributeValues: { ':lid': lineItemId, ':cid': claimId }
    }));
    if (!liResult.Items || liResult.Items.length === 0)
      return res.status(404).json(errorResponse('Line item not found'));

    await dynamoClient.send(new DeleteCommand({
      TableName: LINE_ITEMS_TABLE,
      Key: { lineItemId, claimId }
    }));

    // Recalculate total
    const allLI = await dynamoClient.send(new ScanCommand({
      TableName: LINE_ITEMS_TABLE,
      FilterExpression: 'claimId = :id',
      ExpressionAttributeValues: { ':id': claimId }
    }));
    const newTotal = (allLI.Items || []).reduce((s, i) => s + (i.amount || 0), 0);
    await dynamoClient.send(new PutCommand({
      TableName: CLAIMS_TABLE,
      Item: { ...claim, totalAmount: Math.round(newTotal * 100) / 100, updatedAt: getCurrentTimestamp() }
    }));

    return res.json(successResponse(null, 'Line item deleted'));
  } catch (err) { handleError(err, res); }
};

// ════════════════════════════════════════════════════════════════════════════
//  MARK AS PAID
// ════════════════════════════════════════════════════════════════════════════
const markAsPaid = async (req, res) => {
  try {
    const recruiterId = await resolveRecruiterId(req);
    const { claimId } = req.params;
    const { paymentReference } = req.body;

    const result = await dynamoClient.send(new ScanCommand({
      TableName: CLAIMS_TABLE,
      FilterExpression: 'claimId = :id AND recruiterId = :rid',
      ExpressionAttributeValues: { ':id': claimId, ':rid': recruiterId }
    }));
    if (!result.Items || result.Items.length === 0)
      return res.status(404).json(errorResponse('Claim not found'));

    const claim = result.Items[0];
    if (claim.status !== 'Payment Processed')
      return res.status(400).json(errorResponse('Only Payment Processed claims can be marked Paid'));

    const updated = {
      ...claim, status: 'Paid',
      paymentReference: sanitiseString(paymentReference || '', 100),
      paidAt: getCurrentTimestamp(), updatedAt: getCurrentTimestamp()
    };
    await dynamoClient.send(new PutCommand({ TableName: CLAIMS_TABLE, Item: updated }));

    try {
      await createNotification({
        employeeId: claim.employeeId, recruiterId,
        type: NOTIFICATION_TYPES.CLAIM_APPROVED,
        title: 'Claim Payment Released',
        message: `₹${claim.totalAmount} for your ${claim.claimTypeName} claim has been paid`,
        relatedEntityId: claimId, relatedEntityType: 'CLAIM',
        actionUrl: '/claims', priority: PRIORITY.HIGH
      });
    } catch (_) {}

    return res.json(successResponse({ claimId, status: 'Paid' }, 'Claim marked as paid'));
  } catch (err) { handleError(err, res); }
};

// ════════════════════════════════════════════════════════════════════════════
//  EXPORTS
// ════════════════════════════════════════════════════════════════════════════
module.exports = {
  // Claim types
  getClaimTypes, createClaimType, updateClaimType, deleteClaimType,
  // Claims
  createClaim, updateClaim, submitClaim,
  getMyClaims, getAllClaims, getClaimStats, getClaimById,
  // Approval
  processClaimAction, getPendingApprovals, markAsPaid,
  // Line items
  addLineItem, deleteLineItem
};
