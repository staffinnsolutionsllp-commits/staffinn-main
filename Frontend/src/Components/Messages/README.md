# Messaging System Implementation

This messaging system provides in-app messaging functionality for Staffinn users.

## Components

### 1. MessageCenter
Main messaging dashboard with inbox/sent tabs and message management.

### 2. MessageList
Displays list of messages with pagination support.

### 3. MessageDetail
Shows individual message content with actions (delete, mark as read).

### 4. ComposeMessage
Form for creating and sending new messages.

### 5. QuickContactModal
Modal popup for quick messaging from user profiles.

### 6. MessageButton
Reusable button component for initiating messages.

## Usage Examples

### Adding Message Button to Staff Profile
```jsx
import MessageButton from '../Messages/MessageButton';

// In your staff profile component
<MessageButton 
  recipientId={staff.userId}
  recipientName={staff.fullName}
  size="medium"
  className="contact-message-btn"
/>
```

### Adding Message Button to Recruiter Profile
```jsx
import MessageButton from '../Messages/MessageButton';

// In your recruiter profile component
<MessageButton 
  recipientId={recruiter.userId}
  recipientName={recruiter.companyName}
  size="large"
/>
```

### Accessing Message Center
Users can access the message center by:
1. Clicking the notification bell and selecting "Messages"
2. Navigating to `/messages` directly

## API Endpoints

- `POST /api/v1/messages/send` - Send a message
- `GET /api/v1/messages/inbox` - Get inbox messages
- `GET /api/v1/messages/sent` - Get sent messages
- `GET /api/v1/messages/unread-count` - Get unread message count
- `PUT /api/v1/messages/:messageId/:createdAt/read` - Mark as read
- `DELETE /api/v1/messages/:messageId/:createdAt` - Delete message

## Database Schema

### Messages Table (DynamoDB)
- **Partition Key**: messageId (String)
- **Sort Key**: createdAt (String)
- **Attributes**:
  - senderId (String)
  - receiverId (String)
  - subject (String)
  - message (String)
  - messageType (String) - general, inquiry, job_application
  - status (String) - unread, read, replied
  - attachments (List) - Optional file attachments

### Global Secondary Indexes
- **SenderIndex**: senderId (PK), createdAt (SK)
- **ReceiverIndex**: receiverId (PK), createdAt (SK)

## Features

✅ Send and receive messages
✅ Real-time unread count in notification bell
✅ Message status tracking (unread/read)
✅ Message types (general, inquiry, job application)
✅ Quick contact from user profiles
✅ Responsive design
✅ Message search and filtering
✅ Pagination support
✅ File attachment support (ready for implementation)

## Integration Steps

1. **Backend**: Messages table is automatically created on server start
2. **Frontend**: Import and use MessageButton in profile components
3. **Navigation**: Message center accessible via `/messages` route
4. **Notifications**: Unread count appears in notification bell

## Customization

### Message Types
You can customize message types in the ComposeMessage component:
```jsx
<option value="general">General</option>
<option value="inquiry">Inquiry</option>
<option value="job_application">Job Application</option>
<option value="custom_type">Custom Type</option>
```

### Styling
Each component has its own CSS file for easy customization:
- `MessageCenter.css`
- `QuickContactModal.css`
- `MessageDetail.css`
- `ComposeMessage.css`

## Security

- All message endpoints require authentication
- Users can only access their own messages
- Message content is validated on the backend
- XSS protection through proper escaping

## Performance

- Pagination prevents loading too many messages at once
- Efficient DynamoDB queries using GSI
- Real-time updates via Socket.IO (optional)
- Lazy loading of message content