# HRMS Session Isolation - Quick Testing Guide

## 🚨 Critical Security Fix Applied

**Issue**: Multiple recruiters were sharing the same HRMS session
**Fix**: Implemented per-recruiter session isolation

## Quick Test (5 minutes)

### Test 1: Basic Session Isolation
```bash
# Step 1: Open Chrome (normal window)
1. Login as Recruiter A
2. Note the URL includes: ?recruiterId=RECRUITER_A_ID
3. Create a test employee
4. Verify employee appears in list

# Step 2: Open Chrome Incognito
5. Login as Recruiter B (different account)
6. Note the URL includes: ?recruiterId=RECRUITER_B_ID
7. Verify you DON'T see Recruiter A's employee
8. Create a different test employee

# Step 3: Verify Isolation
9. Go back to normal window (Recruiter A)
10. Refresh the page
11. ✅ PASS: You should still see only Recruiter A's employee
12. ✅ PASS: You should NOT see Recruiter B's employee
```

### Test 2: Session Hijacking Prevention
```bash
# Step 1: Login as Recruiter A
1. Open browser DevTools (F12)
2. Go to Application > Local Storage
3. Find key: hrms_token_RECRUITER_A_ID
4. Copy the token value

# Step 2: Try to use token for Recruiter B
5. Open new incognito window
6. Login as Recruiter B
7. Open DevTools > Application > Local Storage
8. Replace hrms_token_RECRUITER_B_ID value with Recruiter A's token
9. Refresh the page

# Expected Result:
✅ PASS: Session validation fails
✅ PASS: User is logged out automatically
✅ PASS: Error message: "Session validation failed"
```

## What Changed?

### Before (BROKEN)
```
localStorage:
  hrms_token: "abc123..." ← SHARED BY ALL RECRUITERS ❌
```

### After (FIXED)
```
localStorage:
  hrms_token_RECRUITER_A: "abc123..." ← Recruiter A only ✅
  hrms_token_RECRUITER_B: "xyz789..." ← Recruiter B only ✅

sessionStorage:
  current_recruiter_id: "RECRUITER_A" ← Tracks current session ✅
```

## Common Issues & Solutions

### Issue 1: "Session validation failed" error
**Cause**: Old token in localStorage
**Solution**: 
```javascript
// Open browser console and run:
localStorage.clear();
sessionStorage.clear();
// Then login again
```

### Issue 2: Still seeing other recruiter's data
**Cause**: Browser cache
**Solution**:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Logout and login again

### Issue 3: "recruiterId missing" error
**Cause**: Accessing HRMS directly without recruiterId in URL
**Solution**:
- Always access HRMS from "My Dashboard" button
- URL must include: ?recruiterId=YOUR_ID

## Developer Testing

### Test API Endpoints
```bash
# Test 1: Get employees for Recruiter A
curl -X GET "http://localhost:4001/api/v1/hrms/employees" \
  -H "Authorization: Bearer RECRUITER_A_TOKEN"

# Expected: Only Recruiter A's employees

# Test 2: Try to access with wrong token
curl -X GET "http://localhost:4001/api/v1/hrms/employees" \
  -H "Authorization: Bearer RECRUITER_B_TOKEN"

# Expected: Only Recruiter B's employees (NOT Recruiter A's)
```

### Check Logs
```bash
# Look for these log messages:
✅ "🔐 Auth middleware - User: { userId, recruiterId, companyId }"
✅ "✅ Recruiter context validated"
❌ "🚨 SECURITY: RecruiterId mismatch detected!"
```

## Verification Checklist

- [ ] Multiple recruiters can login simultaneously
- [ ] Each recruiter sees only their own data
- [ ] Session hijacking is prevented
- [ ] Token validation works correctly
- [ ] Logout clears only current recruiter's session
- [ ] Re-login works without issues
- [ ] No console errors during normal operation

## Rollback Plan (If Needed)

If critical issues occur:

1. **Immediate**: Revert frontend changes
   ```bash
   cd "HRMS Staffinn/Staffinn HR Manager_files/src"
   git checkout HEAD~1 services/api.js contexts/AuthContext.tsx
   ```

2. **Rebuild and deploy**
   ```bash
   npm run build
   ```

3. **Notify users**: "Please logout and login again"

## Success Criteria

✅ **PASS**: Each recruiter has isolated session
✅ **PASS**: No cross-recruiter data leakage
✅ **PASS**: Session hijacking prevented
✅ **PASS**: All existing functionality works
✅ **PASS**: No performance degradation

## Next Steps After Testing

1. ✅ Verify all tests pass
2. ✅ Monitor logs for security violations
3. ✅ Notify all recruiters to re-login
4. ✅ Update documentation
5. ✅ Set up monitoring alerts

## Emergency Contacts

If you find a security issue:
1. **DO NOT** share details publicly
2. Document the issue with screenshots
3. Contact the development team immediately
4. Include: recruiterId, timestamp, error messages

---

**Last Updated**: 2025-01-23
**Status**: ✅ FIXED - Ready for Production
**Priority**: 🔴 CRITICAL
