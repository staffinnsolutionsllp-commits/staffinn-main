# 🔄 HRMS URL Configuration Change

## Change Summary

**Date:** $(date)
**Status:** ✅ Updated for Local Testing

---

## What Was Changed?

### File Modified:
`Frontend/src/Components/Dashboard/RecruiterDashboard.jsx`

### Function Updated:
`handleHRMSAccess()`

---

## Changes Made:

### Before (Production):
```javascript
const hrmsUrl = `https://hrms.staffinn.com?recruiterId=${currentUser.userId}`;
```

### After (Local Testing):
```javascript
const hrmsUrl = `http://localhost:5175?recruiterId=${currentUser.userId}`;
```

---

## Impact:

✅ **Local Testing:** HRMS ab localhost:5175 pe open hoga
✅ **Recruiter Dashboard:** Sidebar me "HRMS" button click karne pe local HRMS khulega
✅ **recruiterId Parameter:** Automatically pass hoga URL me

---

## How to Test:

1. **Start Backend:**
   ```bash
   cd Backend
   npm start
   ```

2. **Start Frontend:**
   ```bash
   cd Frontend
   npm run dev
   ```

3. **Start HRMS:**
   ```bash
   cd "HRMS Staffinn/Staffinn HR Manager_files"
   npm run dev
   ```

4. **Test Flow:**
   - Login as Recruiter in Frontend (http://localhost:5173)
   - Go to Recruiter Dashboard
   - Click "HRMS" in sidebar
   - HRMS should open in new tab at http://localhost:5175?recruiterId=YOUR_ID

---

## Reverting to Production:

Jab production me deploy karna ho, toh yeh change wapis karo:

```javascript
// Change back to production URL
const hrmsUrl = `https://hrms.staffinn.com?recruiterId=${currentUser.userId}`;
```

---

## Important Notes:

⚠️ **Remember:** Production me deploy karne se pehle URL wapis production URL pe change karna hai
✅ **Testing:** Local testing ke liye yeh configuration perfect hai
🔗 **Port:** HRMS port 5175 pe configured hai

---

## Quick Reference:

| Environment | HRMS URL |
|-------------|----------|
| **Local (Current)** | `http://localhost:5175` |
| **Production** | `https://hrms.staffinn.com` |

---

**Status:** Ready for local testing! 🚀
