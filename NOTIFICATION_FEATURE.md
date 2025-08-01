# Follow Recruiter & Notifications Feature

## Overview
This feature allows users to follow recruiters and receive real-time notifications when those recruiters post new jobs.

## Features Implemented

### ✅ Backend Implementation
1. **Notification Controller** (`controllers/notificationController.js`)
   - Create notifications
   - Get user notifications
   - Mark notifications as read
   - Delete notifications
   - Send job notifications to followers

2. **Notification Routes** (`routes/notificationRoutes.js`)
   - `GET /api/v1/notifications` - Get user notifications
   - `PUT /api/v1/notifications/:id/read` - Mark as read
   - `PUT /api/v1/notifications/read-all` - Mark all as read
   - `DELETE /api/v1/notifications/:id` - Delete notification

3. **Database Table** (`staffinn-notifications`)
   - Stores all notifications with user associations
   - Tracks read/unread status
   - Includes notification metadata

4. **Job Creation Integration**
   - Modified job controller to send notifications to followers
   - Automatic notification when recruiter posts new job

### ✅ Frontend Implementation
1. **Notification Bell Component** (`Components/Header/NotificationBell.jsx`)
   - Bell icon with unread count badge
   - Dropdown with notification list
   - Real-time updates every 30 seconds
   - Mark as read/delete functionality

2. **API Integration** (`services/api.js`)
   - Complete notification API endpoints
   - Error handling and loading states

3. **Header Integration**
   - Notification bell appears next to profile section
   - Only visible when user is logged in

## How It Works

### 1. Following a Recruiter
- User goes to recruiter page
- Clicks "Follow Recruiter" button
- User ID is added to recruiter's followers list

### 2. Job Posting Notification
- Recruiter posts a new job via dashboard
- System automatically finds all followers
- Creates notification for each follower
- Notification includes job title and recruiter name

### 3. Real-time Notifications
- Notification bell shows unread count
- Polls for new notifications every 30 seconds
- Users can mark as read or delete notifications
- Dropdown closes when clicking outside

## Testing the Feature

### Prerequisites
1. Backend server running on port 5000
2. Frontend server running on port 3000
3. DynamoDB tables created (automatic on server start)

### Test Steps
1. **Setup Test Data**
   ```bash
   cd Backend
   node test-notification-flow.js
   ```

2. **Manual Testing**
   - Register/login as a staff user
   - Go to recruiter page and follow a recruiter
   - Login as that recruiter
   - Post a new job from recruiter dashboard
   - Check notification bell as the staff user

3. **Expected Results**
   - Notification bell shows red badge with count
   - Clicking bell shows notification dropdown
   - Notification message: "New job [job name] has been posted by [recruiter name]"
   - Can mark as read or delete notifications

## Database Schema

### staffinn-notifications Table
```json
{
  "notificationId": "uuid",
  "userId": "string",
  "type": "new_job",
  "title": "string",
  "message": "string",
  "data": {
    "jobId": "string",
    "jobTitle": "string",
    "recruiterId": "string",
    "recruiterName": "string"
  },
  "read": false,
  "createdAt": "ISO string",
  "readAt": "ISO string (optional)"
}
```

## API Endpoints

### Notifications
- `GET /api/v1/notifications?limit=20&unreadOnly=false`
- `PUT /api/v1/notifications/:notificationId/read`
- `PUT /api/v1/notifications/read-all`
- `DELETE /api/v1/notifications/:notificationId`

### Follow System (Existing)
- `POST /api/v1/recruiter/:recruiterId/follow`
- `DELETE /api/v1/recruiter/:recruiterId/follow`
- `GET /api/v1/recruiter/:recruiterId/follow-status`

## Files Modified/Created

### Backend Files
- ✅ `controllers/notificationController.js` (NEW)
- ✅ `routes/notificationRoutes.js` (NEW)
- ✅ `controllers/jobController.js` (MODIFIED - added notification sending)
- ✅ `server.js` (MODIFIED - added notification routes)
- ✅ `config/dynamodb.js` (MODIFIED - added notifications table)
- ✅ `.env` (MODIFIED - added NOTIFICATIONS_TABLE)

### Frontend Files
- ✅ `Components/Header/NotificationBell.jsx` (NEW)
- ✅ `Components/Header/NotificationBell.css` (NEW)
- ✅ `Components/Header/Header.jsx` (MODIFIED - added notification bell)
- ✅ `Components/Header/Header.css` (MODIFIED - styling updates)
- ✅ `services/api.js` (MODIFIED - added notification endpoints)

## Real-time Features
- ✅ Notifications sent immediately when job is posted
- ✅ Frontend polls for new notifications every 30 seconds
- ✅ Unread count updates in real-time
- ✅ Works for both new and existing followers

## Security & Performance
- ✅ All notification endpoints require authentication
- ✅ Users can only access their own notifications
- ✅ Efficient database queries with proper filtering
- ✅ Graceful error handling throughout the system

The notification system is now fully functional and ready for production use!