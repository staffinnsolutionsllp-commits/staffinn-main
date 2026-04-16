# 🐛 Frontend Debugging Guide - Admission Tracking

## Current Status
- ✅ Backend code is correct
- ✅ Database has data (production shows data)
- ✅ API endpoints are working (production works)
- ❌ Local frontend not showing data

## Step-by-Step Debugging

### Step 1: Check Browser Console 🔍

1. **Open Browser DevTools**
   - Press `F12`
   - Go to **Console** tab

2. **Look for these logs:**
   ```
   🔍 [FRONTEND] Fetching enrollment tracking data...
   📦 [FRONTEND] API Response: {success: true, data: [...]}
   ✅ [FRONTEND] Success! Data received: [...]
   📊 [FRONTEND] Number of courses: X
   📚 [FRONTEND] First course: {...}
   🏁 [FRONTEND] Fetch complete. Loading state: false
   📊 [FRONTEND] Rendering component...
   📊 [FRONTEND] Total tracking data: X
   📊 [FRONTEND] Online courses: X
   📊 [FRONTEND] On-Campus courses: X
   📊 [FRONTEND] Loading state: false
   ```

3. **Check for errors:**
   - Any red error messages?
   - Any 500 errors?
   - Any CORS errors?

### Step 2: Check Network Tab 🌐

1. **Go to Network tab in DevTools**
2. **Refresh the page** (Ctrl+R)
3. **Look for this API call:**
   ```
   GET /api/v1/institute-course-enrollment/course-enrollment-tracking
   ```

4. **Click on it and check:**
   - **Status**: Should be `200 OK`
   - **Response** tab: Should show JSON with data
   - **Preview** tab: Should show courses array

5. **Expected Response Format:**
   ```json
   {
     "success": true,
     "data": [
       {
         "courseId": "...",
         "courseName": "python",
         "courseMode": "Online",
         "courseDuration": "3 months",
         "courseFees": "1",
         "totalIndividualEnrollments": 3,
         "totalInstituteEnrollments": 0,
         "totalStudentsFromInstitutes": 0,
         "individualEnrollments": [...],
         "instituteEnrollments": []
       }
     ]
   }
   ```

### Step 3: Check Component State 🎯

**In Console, type:**
```javascript
// Check if React DevTools is available
window.__REACT_DEVTOOLS_GLOBAL_HOOK__
```

**If React DevTools is installed:**
1. Go to **Components** tab
2. Find `CourseEnrollmentHistory` component
3. Check `trackingData` state
4. Should show array of courses

### Step 4: Common Issues & Solutions 🔧

#### Issue 1: API Returns Empty Array
**Symptoms:**
```
📊 [FRONTEND] Number of courses: 0
```

**Solution:**
- Backend is not returning data
- Check backend logs
- Verify institute ID is correct
- Run: `node check-enrollment-data.js`

#### Issue 2: API Returns Error
**Symptoms:**
```
❌ [FRONTEND] API returned success=false
```

**Solution:**
- Check Network tab for error details
- Check backend logs for errors
- Verify JWT token is valid

#### Issue 3: Data Received But Not Rendering
**Symptoms:**
```
✅ [FRONTEND] Success! Data received: [...]
📊 [FRONTEND] Total tracking data: 4
📊 [FRONTEND] Online courses: 0
📊 [FRONTEND] On-Campus courses: 0
```

**This means courseMode field is wrong!**

**Solution:**
Check if `courseMode` in response matches exactly:
- Should be: `"Online"` or `"On Campus"`
- NOT: `"online"`, `"on-campus"`, `"Offline"`, etc.

**Fix in backend:**
```javascript
// In getCourseEnrollmentTracking function
courseMode: course.mode === 'Offline' ? 'On Campus' : course.mode
```

#### Issue 4: Loading State Stuck
**Symptoms:**
- Page shows "Loading enrollment data..." forever

**Solution:**
- API call is hanging
- Check Network tab for pending requests
- Check if backend server is running
- Verify API_URL in frontend config

#### Issue 5: CORS Error
**Symptoms:**
```
Access to fetch at 'http://localhost:4001/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solution:**
- Backend CORS not configured
- Check backend server.js for CORS setup
- Should allow `http://localhost:5173`

### Step 5: Manual API Test 🧪

**Test API directly in browser:**

1. **Get JWT Token:**
   - Login to the app
   - Open DevTools → Application → Local Storage
   - Copy `token` value

2. **Test in Postman or curl:**
   ```bash
   curl -X GET \
     http://localhost:4001/api/v1/institute-course-enrollment/course-enrollment-tracking \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json"
   ```

3. **Check response:**
   - Should return JSON with courses
   - Should have `success: true`
   - Should have `data` array

### Step 6: Check Frontend Build 🏗️

**If using Vite:**
```bash
cd d:\Staffinn-main\Frontend

# Clear cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

**If using Create React App:**
```bash
cd d:\Staffinn-main\Frontend

# Clear cache
rm -rf node_modules/.cache

# Restart dev server
npm start
```

### Step 7: Verify Component is Mounted 🎭

**In Console:**
```javascript
// Check if component is in DOM
document.querySelector('.course-enrollment-history')

// Should return the component element
// If null, component is not mounted
```

### Step 8: Check for JavaScript Errors 🚨

**Look for:**
- Syntax errors
- Import errors
- Undefined variables
- Type errors

**Common errors:**
```javascript
// Wrong:
course.courseMode === 'online'  // lowercase

// Correct:
course.courseMode === 'Online'  // capital O
```

## Quick Checklist ✅

Run through this checklist:

- [ ] Backend server is running (`npm start` in Backend folder)
- [ ] Frontend dev server is running (`npm run dev` in Frontend folder)
- [ ] Logged in as jecrc@gmail.com
- [ ] JWT token exists in localStorage
- [ ] Browser console shows no errors
- [ ] Network tab shows 200 OK for API call
- [ ] API response has `success: true`
- [ ] API response has `data` array with courses
- [ ] Console logs show data received
- [ ] Console logs show correct course counts
- [ ] Component is mounted in DOM
- [ ] No CORS errors
- [ ] Browser cache cleared (Ctrl+Shift+R)

## Expected Console Output (Success) ✅

```
🔍 [FRONTEND] Fetching enrollment tracking data...
📦 [FRONTEND] API Response: {success: true, data: Array(4)}
✅ [FRONTEND] Success! Data received: (4) [{…}, {…}, {…}, {…}]
📊 [FRONTEND] Number of courses: 4
📚 [FRONTEND] First course: {courseId: "...", courseName: "python", ...}
🏁 [FRONTEND] Fetch complete. Loading state: false
📊 [FRONTEND] Rendering component...
📊 [FRONTEND] Total tracking data: 4
📊 [FRONTEND] Online courses: 2
📊 [FRONTEND] On-Campus courses: 2
📊 [FRONTEND] Loading state: false
```

## What to Share for Help 🆘

If still not working, share:

1. **Browser Console Screenshot**
   - Full console output
   - Any errors in red

2. **Network Tab Screenshot**
   - API call details
   - Response data

3. **Backend Logs**
   - Terminal output
   - Any errors

4. **API Response**
   - Copy full JSON response
   - From Network tab → Response

## Next Steps 🚀

1. ✅ Save this file
2. ✅ Restart backend: `cd Backend && npm start`
3. ✅ Restart frontend: `cd Frontend && npm run dev`
4. ✅ Clear browser cache: `Ctrl+Shift+R`
5. ✅ Login as jecrc@gmail.com
6. ✅ Go to Admission Tracking
7. ✅ Open DevTools (F12)
8. ✅ Check Console tab
9. ✅ Check Network tab
10. ✅ Share screenshots if not working

---

**Remember:** The code is correct. If data shows in production, it will show locally too once we identify the issue!
