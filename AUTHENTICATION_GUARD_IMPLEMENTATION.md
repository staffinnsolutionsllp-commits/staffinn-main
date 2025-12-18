# Authentication Guard Implementation

## Overview
This implementation adds a global authentication check system that triggers the existing Sign In popup when unauthenticated users try to access restricted actions across the application.

## Features Implemented

### 1. AuthGuard Context (`AuthGuardContext.jsx`)
- Created a new context that wraps the existing authentication system
- Provides a `requireAuth()` function that checks if user is logged in
- Shows the existing LoginPopup with a 5-second message: "Please register yourself on the portal first."
- No new popup created - uses the same existing Sign In popup

### 2. Authentication Checks Added to Restricted Actions

#### Home Page (`Home.jsx`)
- **View Profile** on staff cards - requires authentication
- **View Job** buttons - requires authentication  
- **View Course** buttons - requires authentication

#### Staff Page (`StaffPage.jsx`)
- **View Profile** on staff cards - requires authentication
- **View Profile** on trending staff - requires authentication

#### Institute Page (`InstitutePage.jsx`)
- **View Details** on course cards - requires authentication
- **Contact** buttons (Hire from Institute, Schedule Campus Drive) - requires authentication

#### Recruiter Page (`RecruiterPage.jsx`)
- **View Details** on recruiter cards - requires authentication
- Recruiter card clicks - requires authentication

#### News Page (`NewsPage.jsx`)
- **Read More** buttons on news articles - requires authentication
- **View Job** buttons in job alerts - requires authentication

### 3. Implementation Details

#### Context Structure
```javascript
// AuthGuardProvider wraps the app and provides requireAuth function
const { requireAuth } = useAuthGuard();

// Usage in components
onClick={() => {
  if (requireAuth()) {
    // Execute restricted action
  }
}}
```

#### Message Display
- Message appears at the top of the login popup for 5 seconds
- Styled with red background (#ff6b6b) and white text
- Positioned 80px from top to avoid header overlap
- Auto-disappears after 5 seconds

#### Integration
- Added to App.jsx component hierarchy: `AuthProvider > AuthGuardProvider > AppContent`
- Uses existing LoginPopup component - no new popup created
- Maintains all existing authentication flows and design

### 4. Files Modified

#### New Files
- `Frontend/src/context/AuthGuardContext.jsx` - Main authentication guard logic
- `Frontend/src/context/AuthGuardContext.css` - Styling for auth message

#### Modified Files
- `Frontend/src/context/index.js` - Added AuthGuard exports
- `Frontend/src/App.jsx` - Added AuthGuardProvider to component hierarchy
- `Frontend/src/Components/Home/Home.jsx` - Added auth checks to restricted buttons
- `Frontend/src/Components/Pages/StaffPage.jsx` - Added auth checks to View Profile buttons
- `Frontend/src/Components/Pages/InstitutePage.jsx` - Added auth checks to View Details and Contact buttons
- `Frontend/src/Components/Pages/RecruiterPage.jsx` - Added auth checks to View Details buttons
- `Frontend/src/Components/Pages/NewsPage.jsx` - Added auth checks to Read More and View Job buttons

### 5. User Experience Flow

1. **Unauthenticated user** clicks any restricted button (View Profile, View Job, View Course, etc.)
2. **Authentication check** runs via `requireAuth()` function
3. **Login popup opens** (same existing popup, no new design)
4. **Message displays** at top: "Please register yourself on the portal first."
5. **Message auto-hides** after 5 seconds
6. **User can sign in** using existing login form
7. **After login**, user can access all restricted features

### 6. Technical Benefits

- **Minimal code changes** - Only added authentication checks where needed
- **Reuses existing components** - No new popup or authentication UI
- **Consistent experience** - Same login flow across all pages
- **Maintainable** - Centralized authentication logic in AuthGuard context
- **Non-breaking** - All existing functionality preserved

### 7. Testing

To test the implementation:
1. **Log out** of the application
2. **Navigate** to any page (Home, Staff, Institute, Recruiter, News)
3. **Click** any restricted button (View Profile, View Job, View Course, Contact, etc.)
4. **Verify** that the login popup opens with the message
5. **Check** that the message disappears after 5 seconds
6. **Login** and verify that all features work normally

The implementation successfully adds authentication protection to all specified restricted actions while maintaining the existing user experience and design consistency.