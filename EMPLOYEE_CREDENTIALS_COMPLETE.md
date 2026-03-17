# Employee Portal Credentials - Complete Implementation

## ✅ What's Been Implemented

### 1. Backend (Complete)
- **Auto-generate credentials** during employee onboarding
- **Password format**: `Emp@{employeeId}` (e.g., `Emp@1001`)
- **Username**: Employee's email address
- **Storage**: `staffinn-hrms-employee-users` table in DynamoDB
- **API Endpoint**: `GET /api/v1/hrms/employees/:id/credentials`
- **First login flag**: `isFirstLogin: true` set automatically
- **Password change**: Updates password and sets `isFirstLogin: false`

### 2. HRMS Frontend (Complete)
- **View Credentials Button** added in Onboarding table Actions column
- **Credentials Modal** shows email and password with copy buttons
- **Works for all employees** - new and existing
- **Professional UI** with icons and styling

### 3. Employee Portal (Complete)
- **Login flow** checks `isFirstLogin` flag
- **Change Password page** with validation:
  - Minimum 8 characters
  - One uppercase letter
  - One lowercase letter
  - One number
- **Password update** in real-time to DynamoDB
- **Redirect to dashboard** after password change

## 📋 Setup Instructions

### Step 1: Create Email Index (Required for Login)
Run this command in the Backend directory:
```bash
cd d:\Staffinn-main\Backend
node scripts/add-email-index.js
```

This creates a Global Secondary Index on the email field for fast login lookups.

### Step 2: Restart Backend Server
```bash
# Stop current server (Ctrl+C)
# Start again
node server.js
```

### Step 3: Test the Flow

#### A. Onboard a New Employee (HRMS)
1. Login to HRMS
2. Go to "Onboarding" section
3. Click "Onboard Employee"
4. Fill all required fields (Employee ID must be numeric)
5. Complete onboarding
6. Employee credentials are auto-generated

#### B. View Credentials (HRMS)
1. In the employee table, find the employee
2. Click the green User icon (View Credentials button)
3. Modal shows:
   - Email/Username
   - Password
   - Copy buttons for both
4. Share these with the employee

#### C. First Login (Employee Portal)
1. Employee goes to Employee Portal
2. Enters email and password
3. Automatically redirected to Change Password page
4. Must enter:
   - Current password (the temp one)
   - New password (meeting requirements)
   - Confirm new password
5. After changing, redirected to login
6. Login again with new password
7. Access granted to Employee Portal

## 🗄️ Database Structure

### Table: `staffinn-hrms-employee-users`
```javascript
{
  userId: "USER_1001_1234567890",  // Primary Key
  employeeId: "1001",
  email: "employee@company.com",    // GSI: email-index
  password: "hashed_password",
  roleId: "ROLE_EMPLOYEE",
  companyId: "recruiter_id",
  isFirstLogin: true,               // Changed to false after password change
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  lastLogin: "2024-01-01T00:00:00Z"
}
```

## 🔐 Security Features

1. **Passwords are hashed** using bcrypt
2. **Temporary passwords** must be changed on first login
3. **Password validation** enforces strong passwords
4. **JWT tokens** for authentication
5. **Company isolation** - employees only see their company data

## 🎯 Key Features

### For HR/Admin:
- ✅ Instant credential generation
- ✅ View credentials anytime
- ✅ Works for existing employees too
- ✅ Copy to clipboard functionality
- ✅ Professional UI with clear instructions

### For Employees:
- ✅ Secure first-time login
- ✅ Forced password change
- ✅ Password strength validation
- ✅ Show/hide password toggle
- ✅ Clear error messages

## 📝 Files Modified/Created

### Backend:
- ✅ `controllers/hrms/hrmsEmployeeController.js` - Added `getEmployeeCredentials`
- ✅ `routes/hrms/hrmsEmployeeRoutes.js` - Added credentials route
- ✅ `controllers/hrms/employeeAuthController.js` - Already had password change
- ✅ `scripts/add-email-index.js` - New script for GSI

### HRMS Frontend:
- ✅ `components/Onboarding.tsx` - Added credentials button and modal
- ✅ `services/api.js` - Added `getEmployeeCredentials` method

### Employee Portal:
- ✅ `pages/ChangePassword.jsx` - New page for first-time password change
- ✅ `pages/Login.jsx` - Already checks `isFirstLogin`
- ✅ `App.jsx` - Already has change-password route

## 🚀 Testing Checklist

- [ ] Run email index script
- [ ] Restart backend server
- [ ] Onboard new employee in HRMS
- [ ] Click "View Credentials" button
- [ ] Copy credentials from modal
- [ ] Login to Employee Portal with temp password
- [ ] Verify redirect to Change Password page
- [ ] Change password successfully
- [ ] Login again with new password
- [ ] Verify access to Employee Portal
- [ ] Test with existing employee (credentials should be generated)

## 💡 Important Notes

1. **Employee ID must be numeric** - This is enforced in the onboarding form
2. **Email is the username** - Employees login with their email
3. **Temp password format**: `Emp@{employeeId}` - Easy to remember
4. **First login is mandatory** - Cannot skip password change
5. **Credentials persist** - Can be viewed anytime by HR

## 🔧 Troubleshooting

### Issue: Login fails with "Invalid credentials"
- **Solution**: Run the email index script first

### Issue: "View Credentials" button doesn't work
- **Solution**: Check backend is running and API endpoint is accessible

### Issue: Password change fails
- **Solution**: Ensure new password meets all requirements

### Issue: Existing employees don't have credentials
- **Solution**: Click "View Credentials" - they will be auto-generated

## ✨ Success!

The complete employee credentials system is now implemented with:
- ✅ Auto-generation during onboarding
- ✅ View anytime in HRMS
- ✅ Secure first-time login
- ✅ Real-time password updates
- ✅ Professional UI/UX
- ✅ Complete data isolation by company
