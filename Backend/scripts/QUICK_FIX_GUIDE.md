# Quick Fix Guide: recruiterId Field Consistency

## 🎯 Problem Fixed
Field name inconsistency between `recruiterId` (camelCase) and `recruiter_id` (snake_case)

## ✅ Solution Applied
All code now uses **camelCase**: `recruiterId`

## 🚀 Quick Start

### Step 1: Verify Current State
```bash
node Backend/scripts/verify-field-consistency.js
```

### Step 2: Run Manual Fix (for companies without HRMS user link)
```bash
node Backend/scripts/manual-fix-recruiterid.js
```

### Step 3: Run Migration (for companies with HRMS user)
```bash
node Backend/scripts/migrate-add-recruiter-to-company.js
```

### Step 4: Ensure GSI Exists
```bash
node Backend/scripts/add-recruiterid-gsi-to-companies.js
```

### Step 5: Verify Fix
```bash
node Backend/scripts/verify-field-consistency.js
```

## 📝 Files Modified

1. **hrmsCompanyController.js**
   - Added `recruiterId` to all responses
   - New endpoint: `GET /api/hrms/companies/recruiter/:recruiterId`

2. **hrmsCompanyRoutes.js**
   - Added route for fetching companies by recruiterId

3. **migrate-add-recruiter-to-company.js**
   - Handles both camelCase and snake_case input
   - Always outputs camelCase

4. **manual-fix-recruiterid.js** (NEW)
   - Fixes companies where HRMS user has no recruiterId
   - Uses companyId as fallback recruiterId

5. **add-recruiterid-gsi-to-companies.js**
   - Fixed to handle PAY_PER_REQUEST billing mode

6. **verify-field-consistency.js** (NEW)
   - Checks field consistency across all companies

7. **FIELD_CONSISTENCY_FIX.md** (NEW)
   - Complete documentation

## 🔍 Verification Commands

```bash
# Check field consistency
node Backend/scripts/verify-field-consistency.js

# Test API endpoint
curl http://localhost:5000/api/hrms/companies/recruiter/YOUR_RECRUITER_ID

# Check company profile
curl http://localhost:5000/api/hrms/companies/YOUR_COMPANY_ID/profile
```

## 📊 Expected Output

All companies should have:
```json
{
  "companyId": "COMP-XXX",
  "recruiterId": "REC-XXX",  // ✅ camelCase
  "companyName": "...",
  ...
}
```

## ⚠️ Important Notes

- Migration is **idempotent** (safe to run multiple times)
- No data is deleted or lost
- Only adds/updates `recruiterId` field
- Uses camelCase consistently throughout

## 🎉 Benefits

1. ✅ Consistent field naming across entire codebase
2. ✅ Efficient queries using GSI
3. ✅ Better code maintainability
4. ✅ Easier debugging and testing
5. ✅ Future-proof architecture

## 📞 Need Help?

Run verification script first:
```bash
node Backend/scripts/verify-field-consistency.js
```

Check the detailed documentation:
```bash
cat Backend/scripts/FIELD_CONSISTENCY_FIX.md
```
