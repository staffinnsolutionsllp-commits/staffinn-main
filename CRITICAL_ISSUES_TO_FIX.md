# Critical Issues to Fix

## Issue 1: Faculty Add Not Working
**Error**: `ERR_CONNECTION_RESET` when clicking Add Faculty button

**Root Cause**: Backend server is crashing when trying to save to DynamoDB

**Possible Reasons**:
1. DynamoDB table `mis-faculty-list` doesn't exist
2. AWS credentials issue
3. Too many attributes (DynamoDB limit is 400 attributes, but practical limit is around 20 for performance)
4. File upload size too large
5. Multer middleware issue

**Solution Steps**:
1. Check if DynamoDB table exists:
   - Table name: `mis-faculty-list`
   - Partition key: `misfaculty` (String)

2. Check backend terminal for exact error when form is submitted

3. Test with minimal data first (no files)

4. Current attributes (16 total - should work):
   - misfaculty
   - name
   - enrollmentNo
   - dob
   - gender
   - mobile
   - email
   - qualification
   - skills
   - trainerCode
   - address (combined)
   - profilePhotoUrl
   - certificateUrl
   - maritalStatus
   - registrationDate
   - educationStream

## Issue 2: MIS API Called Repeatedly
**Problem**: MIS status API is being called every few seconds

**Files to Check**:
- Frontend components that call MIS API
- useEffect hooks with missing dependencies
- Polling intervals

**Solution**: Find and fix the component calling MIS API repeatedly

## Issue 3: Duplicate Congratulations Message
**Problem**: "Congratulations! Your MIS request has been approved!" appears twice

**Solution**: Check for duplicate alert() calls or useEffect triggers

## Immediate Action Required:
1. **Backend Terminal Output**: Share what appears in backend terminal when you click "Add Faculty"
2. **Check DynamoDB**: Verify table `mis-faculty-list` exists in AWS Console
3. **Test Simple Request**: Try adding faculty without uploading any files first

## Backend Server Must Show:
```
Creating faculty...
Saving to DynamoDB: {...}
Saved successfully
```

If these messages don't appear, request is not reaching the backend.
