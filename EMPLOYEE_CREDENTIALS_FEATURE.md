# Employee Portal Credentials Feature

## Implementation Summary

### Backend Changes:
1. **Added `getEmployeeCredentials` endpoint** in `hrmsEmployeeController.js`
   - Retrieves or generates credentials for an employee
   - Password format: `Emp@{employeeId}`
   - Stores in `staffinn-hrms-employee-users` table
   - Sets `isFirstLogin: true` for password change requirement

2. **Added route** in `hrmsEmployeeRoutes.js`
   - `GET /api/v1/hrms/employees/:id/credentials`
   - Requires admin/hr role

### Frontend Changes Needed:
1. **HRMS Employees Component**
   - Add "View Credentials" button in Actions column
   - Show modal with email and password when clicked
   - Call `apiService.getEmployeeCredentials(employeeId)`

2. **Employee Portal Login**
   - Check `isFirstLogin` flag after login
   - Redirect to Change Password page if true
   - Update password in real-time in DynamoDB
   - Set `isFirstLogin: false` after password change

### Database Structure:
```
staffinn-hrms-employee-users:
- userId (PK)
- employeeId
- email
- password (hashed)
- roleId: 'ROLE_EMPLOYEE'
- companyId (recruiterId)
- isFirstLogin: true/false
- isActive: true/false
- createdAt
```

### Password Flow:
1. HR onboards employee → Credentials auto-generated
2. HR clicks "View Credentials" → Shows email & temp password
3. Employee logs in first time → Forced to change password
4. Password updated → `isFirstLogin` set to false
5. Employee can access portal normally

## Next Steps:
1. Update HRMS Employees.tsx to add credentials button
2. Update Employee Portal login to check isFirstLogin
3. Create ChangePassword page for first-time login
