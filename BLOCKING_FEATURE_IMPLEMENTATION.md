# User Blocking and Help Request Feature Implementation

## Overview
This implementation adds a comprehensive user blocking system with help request functionality as specified in the requirements.

## Features Implemented

### 1. Enhanced User Blocking System

#### Backend Changes:
- **Updated User Model** (`models/userModel.js`):
  - Added `isBlocked` field to all user-related functions
  - Modified `authenticateUser`, `findUserById`, and `findUserByEmail` to include blocking status

- **Updated Authentication Controller** (`controllers/authController.js`):
  - Login now returns user blocking status
  - Blocked users can still authenticate but receive their blocking status

#### Frontend Changes:
- **Updated AuthContext** (`Frontend/src/context/AuthContext.jsx`):
  - Added `showBlockedScreen` state
  - Automatically detects blocked users on login/restore
  - Shows BlockedUser component when user is blocked

### 2. BlockedUser Component

#### Component Features:
- **Location**: `Frontend/src/Components/BlockedUser/`
- **Functionality**:
  - Shows "You are blocked from Staffinn" message
  - Provides "Request Help" button
  - Contains help request form with Name, Email, Query fields
  - Submits requests to backend API
  - Shows success confirmation after submission

#### Styling:
- Modern, responsive design
- Modal overlay with centered content
- Form validation and loading states
- Success and error handling

### 3. Help Request System

#### Backend Implementation:
- **Issue Model** (`models/issueModel.js`):
  - Creates and manages help requests in DynamoDB
  - Stores user details, query, and status
  - Supports CRUD operations

- **Issue Controller** (`controllers/issueController.js`):
  - `createIssue`: Creates new help requests (public endpoint)
  - `getAllIssues`: Retrieves all issues for admin
  - `resolveIssue`: Resolves issue and unblocks user
  - `deleteIssue`: Removes issue from system

- **Issue Routes** (`routes/issueRoutes.js`):
  - Public route for creating issues: `POST /api/v1/issues/create`

#### DynamoDB Table:
- **Table Name**: `staffinn-issue-section`
- **Partition Key**: `issuesection` (String)
- **Fields**: userId, name, email, query, status, createdAt, updatedAt

### 4. Master Admin Panel - Issues Section

#### Issues Component:
- **Location**: `MasterAdminPanel/src/components/Issues.jsx`
- **Features**:
  - Lists all help requests from blocked users
  - Shows user profile information
  - Displays issue status (pending/resolved)
  - Provides "Resolve & Unblock" action
  - Includes delete functionality
  - Real-time status updates

#### Admin API Integration:
- **Updated Admin API** (`MasterAdminPanel/src/services/adminApi.js`):
  - `getAllIssues()`: Fetches all help requests
  - `resolveIssue(issueId)`: Resolves issue and unblocks user
  - `deleteIssue(issueId)`: Deletes issue

#### Admin Panel Navigation:
- **Updated AdminPanel** (`MasterAdminPanel/src/components/AdminPanel.jsx`):
  - Added "Issues" section to sidebar navigation
  - Integrated Issues component into content rendering

### 5. Admin Routes Integration

#### Backend Routes:
- **Updated Admin Routes** (`routes/adminRoutes.js`):
  - `GET /api/v1/admin/issues`: Get all issues
  - `PUT /api/v1/admin/issues/:issueId/resolve`: Resolve issue and unblock user
  - `DELETE /api/v1/admin/issues/:issueId`: Delete issue

#### Server Integration:
- **Updated Server** (`server.js`):
  - Added issue routes to API endpoints
  - Included in main application routing

## Workflow Implementation

### 1. Blocking a User
1. Admin clicks "Block" in Staff Users section
2. User's `isBlocked` field is set to `true` in database
3. User remains logged in but sees blocked screen on next action

### 2. Blocked User Experience
1. Blocked user can still log in with email/password
2. Instead of normal dashboard, sees "You are blocked from Staffinn" screen
3. Can click "Request Help" to open help form
4. Submits name, email, and query to help system

### 3. Help Request Process
1. Form data is stored in `staffinn-issue-section` DynamoDB table
2. Request appears in Master Admin Panel → Issues section
3. Admin can view user profile details and query
4. Admin can resolve issue (automatically unblocks user) or delete request

### 4. Unblocking Process
1. Admin clicks "Resolve & Unblock" in Issues section
2. User's `isBlocked` field is set to `false`
3. Issue status is updated to "resolved"
4. User can immediately log in and access normal dashboard

## Database Schema

### Issues Table (`staffinn-issue-section`)
```json
{
  "issuesection": "uuid", // Partition Key
  "userId": "string|null", // User ID if found
  "name": "string",
  "email": "string", 
  "query": "string",
  "status": "pending|resolved",
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

### Users Table (Updated)
```json
{
  "userId": "string",
  "email": "string",
  "isBlocked": "boolean", // New field
  // ... other existing fields
}
```

## API Endpoints

### Public Endpoints
- `POST /api/v1/issues/create` - Create help request

### Admin Endpoints
- `GET /api/v1/admin/issues` - Get all issues
- `PUT /api/v1/admin/issues/:issueId/resolve` - Resolve and unblock
- `DELETE /api/v1/admin/issues/:issueId` - Delete issue
- `PUT /api/v1/admin/staff/toggle-block/:userId` - Block/unblock user

## Files Created/Modified

### New Files:
- `Backend/models/issueModel.js`
- `Backend/controllers/issueController.js`
- `Backend/routes/issueRoutes.js`
- `Backend/scripts/createIssuesTable.js`
- `Frontend/src/Components/BlockedUser/BlockedUser.jsx`
- `Frontend/src/Components/BlockedUser/BlockedUser.css`
- `MasterAdminPanel/src/components/Issues.jsx`
- `MasterAdminPanel/src/components/Issues.css`

### Modified Files:
- `Backend/models/userModel.js` - Added isBlocked field
- `Backend/controllers/adminController.js` - Added issue management
- `Backend/routes/adminRoutes.js` - Added issue routes
- `Backend/config/dynamodb-wrapper.js` - Added issues table
- `Backend/server.js` - Added issue routes
- `Frontend/src/context/AuthContext.jsx` - Added blocked user handling
- `MasterAdminPanel/src/services/adminApi.js` - Added issue APIs
- `MasterAdminPanel/src/components/AdminPanel.jsx` - Added Issues section

## Testing the Implementation

### 1. Test Blocking Flow:
1. Start backend server (`npm start` in Backend folder)
2. Start Master Admin Panel (`npm run dev` in MasterAdminPanel folder)
3. Login as admin and go to Staff → Users
4. Block a user using the "Block" button
5. Try logging in as that user in the main frontend

### 2. Test Help Request Flow:
1. When blocked user logs in, they should see blocked screen
2. Click "Request Help" and fill out the form
3. Submit the request
4. Check Master Admin Panel → Issues section
5. Resolve the issue to unblock the user

### 3. Test Unblocking:
1. After resolving an issue, the user should be unblocked
2. User can log in normally and access their dashboard

## Security Considerations

1. **Authentication**: Blocked users can still authenticate but are restricted from accessing normal features
2. **Public Endpoint**: Help request creation is public to allow blocked users to submit requests
3. **Admin Only**: Issue management is restricted to admin users only
4. **Data Validation**: All form inputs are validated on both frontend and backend

## Future Enhancements

1. **Email Notifications**: Send emails when issues are created/resolved
2. **Issue Categories**: Add categories for different types of help requests
3. **Admin Comments**: Allow admins to add comments to issues
4. **Bulk Actions**: Enable bulk resolution/deletion of issues
5. **User Notifications**: Notify users when their issues are resolved

## Conclusion

This implementation provides a complete user blocking and help request system that meets all the specified requirements. The system maintains existing functionality while adding the new blocking workflow seamlessly.