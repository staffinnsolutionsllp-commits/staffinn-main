# Authentication Guard Implementation

## Overview
This implementation adds authentication guards to all restricted actions across the Staffinn platform. When a non-authenticated user tries to access restricted content, they are redirected to the existing Sign In popup with a message.

## Features Implemented

### 1. Authentication Guard Utility (`utils/authGuard.js`)
- `requireAuth()` - Checks if user is logged in
- `showLoginWithMessage()` - Shows login modal with registration message
- `triggerLoginModal()` - Alternative method to trigger login modal
- CSS animations for smooth message display/hide

### 2. App-Level Changes (`App.jsx`)
- Added `openLoginPopupWithMessage()` function
- Passed authentication state and login modal functions to all page components
- Updated Header component to use shared login modal state

### 3. Protected Actions by Page

#### Home Page (`Components/Home/Home.jsx`)
- **View Profile** on staff cards - requires authentication
- **View Job** buttons - requires authentication  
- **View Course** buttons - requires authentication

#### Staff Page (`Components/Pages/StaffPage.jsx`)
- **View Profile** on staff cards - requires authentication

#### Institute Page List (`Components/Pages/InstitutePageList.jsx`)
- **View Details** buttons on institute cards - requires authentication
- **Contact** buttons on institute cards - requires authentication

#### Institute Page (`Components/Pages/InstitutePage.jsx`)
- **View Details** buttons on course cards - requires authentication

#### Recruiter Page (`Components/Pages/RecruiterPage.jsx`)
- **View Details** buttons on recruiter cards - requires authentication
- Card click handlers - requires authentication

#### News Page (`Components/Pages/NewsPage.jsx`)
- **Read More** buttons on news articles - requires authentication
- **Read Full Article** buttons on featured news - requires authentication
- Trending topic card clicks - requires authentication

### 4. User Experience
- When a non-authenticated user clicks any protected action:
  1. The existing Sign In popup (class="login-modal") opens automatically
  2. A red message appears at the top: "Please register yourself on the portal first."
  3. The message disappears after 5 seconds with a fade-out animation
  4. No new popups are created - only the existing login modal is used

### 5. Technical Implementation
- Minimal code changes to existing components
- Reuses existing login modal infrastructure
- No breaking changes to existing functionality
- Authentication state passed down from App component
- Consistent behavior across all pages

## Files Modified

1. `src/utils/authGuard.js` - New utility file
2. `src/App.jsx` - Added auth props passing
3. `src/Components/Header/Header.jsx` - Updated to use shared modal state
4. `src/Components/Home/Home.jsx` - Added auth guards
5. `src/Components/Pages/StaffPage.jsx` - Added auth guards
6. `src/Components/Pages/InstitutePageList.jsx` - Added auth guards
7. `src/Components/Pages/InstitutePage.jsx` - Added auth guards
8. `src/Components/Pages/RecruiterPage.jsx` - Added auth guards
9. `src/Components/Pages/NewsPage.jsx` - Added auth guards

## Testing
To test the implementation:
1. Log out of the application
2. Try clicking any "View Profile", "View Job", "View Course", "View Details", "Contact", or "Read More" button
3. Verify that the Sign In popup opens with the registration message
4. Verify that the message disappears after 5 seconds
5. Verify that existing functionality still works when logged in

## Benefits
- Improved user experience for new visitors
- Consistent authentication flow across all pages
- Encourages user registration
- Maintains existing UI/UX patterns
- No performance impact on existing functionality