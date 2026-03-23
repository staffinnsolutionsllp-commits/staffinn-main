# Grievance Module Fixes - Summary

## Issues Fixed

### Issue 1: Manager Not Showing in "Assign to Manager" Dropdown
**Problem**: The dropdown showed "No managers found in your reporting hierarchy" even when managers existed in the organogram.

**Root Cause**: 
- The `getReportingManagers` function was filtering by both `employeeId` and `recruiterId`, which might fail if the recruiterId doesn't match exactly
- Deleted employees were not being filtered out from the manager list

**Fix Applied**:
1. Enhanced the `getReportingManagers` function to retry without recruiterId filter if initial search fails
2. Added filtering to exclude deleted employees (`isDeleted = true`) from manager results
3. Added comprehensive logging to debug hierarchy traversal

**Location**: `Backend/controllers/hrms/hrmsGrievanceController.js` - `getReportingManagers` function

---

### Issue 2: Incorrect Assignment in "Complaint Against Employee"
**Problem**: When filing a complaint against an employee, the grievance was being assigned to that employee instead of their manager.

**Status**: ✅ Already correctly implemented in backend

**How It Works**:
1. When `complaintAgainstEmployeeId` is provided, the system:
   - Fetches the employee being complained against
   - Finds their node in the organization chart
   - Traverses up to find their parent node (manager)
   - Assigns the grievance to that manager
   - NOT to the employee themselves

**Location**: `Backend/controllers/hrms/hrmsGrievanceController.js` - `createGrievance` function (lines 18-108)

---

## Key Changes Made

### 1. Enhanced Manager Fetching Logic
```javascript
// Now tries with and without recruiterId filter
if (isUsingMockDB()) {
  currentNode = allNodes.find(n => n.employeeId === employeeId && n.recruiterId === recruiterId);
  if (!currentNode) {
    // Retry without recruiterId filter
    currentNode = allNodes.find(n => n.employeeId === employeeId);
  }
}
```

### 2. Filter Out Deleted Employees
```javascript
// Only include active managers
if (managerEmployee && (!managerEmployee.isDeleted || managerEmployee.isDeleted === false)) {
  managers.immediateManager = { ... };
}
```

### 3. Added Validation
```javascript
// Ensure either assignedTo or complaintAgainstEmployeeId is provided
else {
  return res.status(400).json(errorResponse('Either assignedTo or complaintAgainstEmployeeId is required'));
}
```

---

## Testing Checklist

### For Issue 1 (Manager Dropdown):
- [ ] Verify employees are added to the organization chart with proper parent-child relationships
- [ ] Check that managers are not marked as deleted (`isDeleted = false`)
- [ ] Test with employees at different hierarchy levels
- [ ] Verify both immediate manager and next-level manager appear in dropdown

### For Issue 2 (Complaint Assignment):
- [ ] File a complaint against an employee
- [ ] Verify the grievance is assigned to that employee's manager (check `assignedTo` field)
- [ ] Verify the grievance is NOT assigned to the employee being complained against
- [ ] Check the status history shows correct assignment message

---

## Prerequisites for Proper Functioning

### 1. Organization Chart Setup
Ensure all employees are properly added to the organization chart:
- Each employee should have a node in `HRMS_ORGANIZATION_CHART_TABLE`
- Nodes should have proper `parentId` pointing to their manager's node
- The `employeeId` field in the node should match the employee's ID

### 2. Employee Data
- Employees should exist in `HRMS_EMPLOYEES_TABLE`
- Active employees should have `isDeleted = false` or no `isDeleted` field
- Each employee should have: `employeeId`, `fullName`, `email`, `designation`

### 3. Hierarchy Structure
```
CEO (no parentId)
  └─> Manager A (parentId = CEO's nodeId)
      └─> Employee 1 (parentId = Manager A's nodeId)
      └─> Employee 2 (parentId = Manager A's nodeId)
  └─> Manager B (parentId = CEO's nodeId)
      └─> Employee 3 (parentId = Manager B's nodeId)
```

---

## API Endpoints

### Get Reporting Managers
```
GET /api/v1/employee/grievances/reporting-managers
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "immediateManager": {
      "employeeId": "...",
      "fullName": "...",
      "email": "...",
      "designation": "..."
    },
    "nextLevelManager": { ... }
  }
}
```

### Submit Grievance (General)
```
POST /api/v1/employee/grievances
Authorization: Bearer <token>

Body:
{
  "title": "...",
  "description": "...",
  "category": "...",
  "priority": "medium",
  "assignedTo": "<manager-employee-id>"
}
```

### Submit Grievance (Complaint)
```
POST /api/v1/employee/grievances
Authorization: Bearer <token>

Body:
{
  "title": "...",
  "description": "...",
  "category": "...",
  "priority": "medium",
  "complaintAgainstEmployeeId": "<employee-id>"
}

Note: System automatically assigns to that employee's manager
```

---

## Troubleshooting

### If managers still don't show:
1. Check browser console for API response from `/reporting-managers` endpoint
2. Verify the employee exists in organization chart: Check `HRMS_ORGANIZATION_CHART_TABLE`
3. Verify the employee has a `parentId` set
4. Check backend logs for detailed hierarchy traversal information
5. Ensure the manager's employee record exists and is not deleted

### If complaint is assigned incorrectly:
1. Check the grievance record's `assignedTo` field
2. Verify the complained-against employee has a manager in the organogram
3. Check backend logs for the assignment flow
4. Verify the manager's node has a valid `employeeId`

---

## Console Logs for Debugging

The enhanced code includes comprehensive logging:
- `🔍` - Search/lookup operations
- `👤` - User/employee information
- `📊` - Data statistics
- `📋` - Node/record details
- `✅` - Success operations
- `⚠️` - Warnings
- `❌` - Errors
- `📤` - Response data

Monitor these logs to understand the flow and identify issues.

---

## Files Modified

1. `Backend/controllers/hrms/hrmsGrievanceController.js`
   - Enhanced `getReportingManagers` function
   - Added deleted employee filtering
   - Added fallback recruiterId logic
   - Added validation for required fields

---

## Next Steps

1. **Verify Organization Chart Data**: Ensure all employees are properly added to the organogram with correct parent-child relationships
2. **Test Manager Dropdown**: Log in as different employees and verify their managers appear
3. **Test Complaint Flow**: File a complaint and verify it goes to the correct manager
4. **Monitor Logs**: Check backend console for any warnings or errors during grievance submission

---

## Support

If issues persist:
1. Check the backend console logs for detailed error messages
2. Verify database records in `HRMS_ORGANIZATION_CHART_TABLE` and `HRMS_EMPLOYEES_TABLE`
3. Ensure the frontend is calling the correct API endpoints
4. Verify authentication tokens include correct `userId`, `employeeId`, and `recruiterId`
