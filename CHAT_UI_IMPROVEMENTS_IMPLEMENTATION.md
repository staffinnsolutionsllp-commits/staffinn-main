# Chat UI Improvements Implementation

## Overview
This document describes the implementation of chat UI improvements including profile photo display, file upload functionality, and enhanced messaging features.

## Changes Implemented

### 1. Frontend Changes

#### ChatWindow.jsx
**Location:** `Frontend/src/Components/Messages/ChatWindow.jsx`

**New Features:**
- **Profile Photo Display**: Chat avatar now displays the actual user profile photo instead of just the first letter
- **File Upload Menu**: Added "+" icon button that opens a menu with options to upload:
  - Documents (.pdf, .doc, .docx, .txt)
  - Photos (image/*)
  - Videos (video/*)
- **Send Icon**: Added proper send arrow icon button for sending messages
- **File Attachments**: Messages can now display attached files (photos, videos, documents)

**New State Variables:**
```javascript
const [showFileMenu, setShowFileMenu] = useState(false);
const [uploadingFile, setUploadingFile] = useState(false);
const [recipientProfilePhoto, setRecipientProfilePhoto] = useState(null);
```

**New Functions:**
- `fetchRecipientProfile()`: Fetches the recipient's profile photo
- `handleFileUpload(file, fileType)`: Handles file upload to backend
- `handleFileSelect(fileType)`: Opens file picker based on file type

#### ChatWindow.css
**Location:** `Frontend/src/Components/Messages/ChatWindow.css`

**New Styles:**
- `.chat-avatar-img`: Styles for profile photo in chat header
- `.file-upload-section`: Container for file upload button
- `.file-upload-btn`: Styles for the "+" button
- `.file-menu`: Dropdown menu for file type selection
- `.message-attachments`: Container for file attachments in messages
- `.attachment-item`: Individual attachment display styles

#### messageApi.js
**Location:** `Frontend/src/services/messageApi.js`

**New API Methods:**
```javascript
// Send file message with attachment
sendFileMessage: async (formData) => {
  // Uploads file and sends message
}

// Get user profile for profile photo
getUserProfile: async (userId) => {
  // Fetches user profile data
}
```

### 2. Backend Changes

#### messageController.js
**Location:** `Backend/controllers/messageController.js`

**New Controller Method:**
```javascript
static async sendFileMessage(req, res) {
  // Handles file upload to S3
  // Creates message with attachment metadata
  // Ensures data isolation per user
}
```

**Features:**
- Validates receiver exists
- Uploads file to S3 in user-specific path: `chat-files/{senderId}/{receiverId}/{timestamp}-{filename}`
- Stores file metadata in message attachments array
- Returns message with file URL

#### messageRoutes.js
**Location:** `Backend/routes/messageRoutes.js`

**New Route:**
```javascript
// POST /api/v1/messages/send-file
router.post('/send-file', upload.single('file'), MessageController.sendFileMessage);
```

**Multer Configuration:**
- Memory storage for efficient S3 upload
- 50MB file size limit
- Single file upload per request

### 3. AWS S3 Integration

**Bucket:** `staffinn-files`

**File Storage Structure:**
```
staffinn-files/
└── chat-files/
    └── {senderId}/
        └── {receiverId}/
            └── {timestamp}-{filename}
```

**Features:**
- Automatic file organization by sender and receiver
- Unique filenames using timestamp
- Public read access for authorized users
- Proper data isolation between different user conversations

### 4. Data Isolation & Security

**Implemented Measures:**
1. **User Authentication**: All routes require authentication token
2. **Sender Validation**: Sender ID extracted from authenticated user
3. **Receiver Validation**: Receiver existence checked before sending
4. **File Path Isolation**: Files stored in sender/receiver specific paths
5. **Access Control**: Only sender and receiver can access conversation files

**Message Model Updates:**
- Attachments array stores file metadata:
  ```javascript
  {
    url: string,           // S3 file URL
    fileName: string,      // Original filename
    fileType: string,      // 'photo', 'video', 'document'
    fileSize: number,      // File size in bytes
    mimeType: string       // MIME type
  }
  ```

## Usage Instructions

### For Users

#### Sending a Text Message:
1. Type message in input field
2. Click send arrow icon or press Enter

#### Sending a File:
1. Click the "+" icon on the left of input field
2. Select file type (Document, Photo, or Video)
3. Choose file from device
4. File uploads automatically and appears in chat

#### Viewing Attachments:
- **Photos**: Display inline with preview
- **Videos**: Display with video player controls
- **Documents**: Show as clickable link with file icon

### For Developers

#### Testing File Upload:
```javascript
// Frontend test
const formData = new FormData();
formData.append('file', file);
formData.append('receiverId', 'user-123');
formData.append('fileType', 'photo');

const response = await messageApi.sendFileMessage(formData);
```

#### Backend API Endpoint:
```
POST /api/v1/messages/send-file
Headers:
  Authorization: Bearer {token}
Body (multipart/form-data):
  file: File
  receiverId: string
  fileType: 'photo' | 'video' | 'document'
```

## File Type Support

### Documents
- **Extensions**: .pdf, .doc, .docx, .txt
- **Max Size**: 50MB
- **Display**: Clickable link with file icon

### Photos
- **Extensions**: All image formats (jpg, png, gif, etc.)
- **Max Size**: 50MB
- **Display**: Inline preview (max 200px width)

### Videos
- **Extensions**: All video formats (mp4, mov, avi, etc.)
- **Max Size**: 50MB
- **Display**: Video player with controls (max 200px width)

## Environment Variables Required

```env
# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=staffinn-files

# Optional: CloudFront URL for faster delivery
CLOUDFRONT_URL=https://your-cloudfront-domain.cloudfront.net
```

## Database Schema

### Messages Table (DynamoDB)
```javascript
{
  messageId: string,           // Primary Key
  createdAt: string,           // Sort Key (ISO timestamp)
  senderId: string,
  receiverId: string,
  subject: string,
  message: string,
  messageType: string,         // 'general' | 'file'
  status: string,              // 'unread' | 'read'
  attachments: [               // Array of file attachments
    {
      url: string,
      fileName: string,
      fileType: string,
      fileSize: number,
      mimeType: string
    }
  ],
  updatedAt: string
}
```

## Real-time Updates

- Messages refresh every 15 seconds when chat is open
- New messages appear immediately after sending
- File uploads show loading state during upload
- Conversation updates automatically after file upload

## Error Handling

### Frontend
- File size validation before upload
- File type validation
- Upload progress indication
- Error messages for failed uploads

### Backend
- Receiver existence validation
- File upload error handling
- S3 upload failure handling
- Proper error responses with status codes

## Performance Optimizations

1. **Memory Storage**: Files stored in memory before S3 upload (no disk I/O)
2. **Lazy Loading**: Profile photos loaded only when chat opens
3. **Efficient Polling**: 15-second refresh interval (not too frequent)
4. **Optimized File Paths**: Organized S3 structure for fast retrieval

## Future Enhancements

1. **File Preview**: Preview files before sending
2. **Multiple Files**: Send multiple files at once
3. **File Compression**: Compress images before upload
4. **Progress Bar**: Show upload progress percentage
5. **File Search**: Search messages by file type
6. **Download All**: Download all files from conversation
7. **File Expiry**: Auto-delete old files after certain period

## Testing Checklist

- [ ] Profile photo displays correctly in chat header
- [ ] Plus icon opens file menu
- [ ] Document upload works
- [ ] Photo upload works and displays inline
- [ ] Video upload works and plays
- [ ] Send icon sends messages
- [ ] Files stored in correct S3 path
- [ ] Data isolation verified (users can't access other's files)
- [ ] Error handling works for invalid files
- [ ] Real-time updates work correctly
- [ ] Mobile responsive design works

## Troubleshooting

### Profile Photo Not Showing
- Check if user has profile photo in database
- Verify S3 URL is accessible
- Check browser console for errors

### File Upload Fails
- Verify AWS credentials are correct
- Check S3 bucket permissions
- Ensure file size is under 50MB
- Check network connection

### Files Not Displaying
- Verify S3 URLs are public
- Check CORS configuration on S3 bucket
- Ensure file URLs are properly formatted

## Support

For issues or questions, contact the development team or refer to:
- AWS S3 Documentation: https://docs.aws.amazon.com/s3/
- Multer Documentation: https://github.com/expressjs/multer
- React File Upload Guide: https://react.dev/

---

**Implementation Date:** 2026-04-08
**Version:** 1.0.0
**Status:** ✅ Complete
