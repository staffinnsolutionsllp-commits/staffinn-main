# Chat UI Improvements - Quick Testing Guide

## Quick Start

### 1. Start the Application
```bash
# Backend
cd Backend
npm start

# Frontend
cd Frontend
npm run dev
```

### 2. Test Profile Photo Display

**Steps:**
1. Open the application
2. Navigate to Staff Page
3. Click "Get In Touch" on any staff card
4. Open the chat window
5. **Expected Result:** Profile photo should appear in the chat header (top-left circle)
   - If user has profile photo: Shows actual image
   - If no profile photo: Shows first letter of name

**Verification:**
- Check browser console for any errors
- Verify image loads correctly
- Check if image is circular and properly sized (40x40px)

### 3. Test Send Icon

**Steps:**
1. Open chat window
2. Type a message in the input field
3. Look at the right side of input field
4. **Expected Result:** Blue circular button with paper plane icon (➤)
5. Click the send button
6. **Expected Result:** Message sends and appears in chat

**Verification:**
- Send icon is visible and styled correctly
- Icon changes to spinner while sending
- Message appears after sending

### 4. Test File Upload - Plus Icon

**Steps:**
1. Open chat window
2. Look at the left side of input field
3. **Expected Result:** Blue "+" icon button
4. Click the "+" button
5. **Expected Result:** Menu appears with 3 options:
   - 📄 Document
   - 🖼️ Photo
   - 🎥 Video

**Verification:**
- Plus icon is visible and clickable
- Menu appears above the button
- Menu has proper styling and hover effects

### 5. Test Document Upload

**Steps:**
1. Click "+" icon
2. Select "Document"
3. Choose a PDF file (< 50MB)
4. **Expected Result:** 
   - File uploads (shows "Uploading file..." in input)
   - Document appears in chat as clickable link
   - Link format: 📄 filename.pdf

**Test Files:**
- ✅ PDF file (< 5MB)
- ✅ DOC file
- ✅ DOCX file
- ✅ TXT file
- ❌ Large file (> 50MB) - should show error

**Verification:**
- File uploads to S3
- Message appears with document link
- Clicking link opens document in new tab
- File stored in correct S3 path: `chat-files/{senderId}/{receiverId}/`

### 6. Test Photo Upload

**Steps:**
1. Click "+" icon
2. Select "Photo"
3. Choose an image file (JPG, PNG, etc.)
4. **Expected Result:**
   - Photo uploads
   - Image displays inline in chat (max 200px width)
   - Image is clickable

**Test Files:**
- ✅ JPG image
- ✅ PNG image
- ✅ GIF image
- ❌ Non-image file - should show error

**Verification:**
- Image displays correctly
- Image maintains aspect ratio
- Image has rounded corners (8px)
- Image stored in S3

### 7. Test Video Upload

**Steps:**
1. Click "+" icon
2. Select "Video"
3. Choose a video file (MP4, MOV, etc.)
4. **Expected Result:**
   - Video uploads
   - Video player appears in chat (max 200px width)
   - Video has playback controls

**Test Files:**
- ✅ MP4 video
- ✅ MOV video
- ❌ Large video (> 50MB) - should show error

**Verification:**
- Video player displays
- Video can be played/paused
- Video controls work
- Video stored in S3

### 8. Test Data Isolation

**Steps:**
1. Login as User A
2. Send files to User B
3. Logout and login as User C
4. Try to access User A's chat with User B
5. **Expected Result:** User C cannot see User A's files

**Verification:**
- Files stored in user-specific S3 paths
- Each conversation has isolated file storage
- No data leakage between users

### 9. Test Real-time Updates

**Steps:**
1. Open chat with User A
2. Send a message
3. Wait 15 seconds
4. **Expected Result:** Messages refresh automatically
5. Send a file
6. **Expected Result:** File appears in chat after upload

**Verification:**
- Messages update every 15 seconds
- New messages appear without manual refresh
- File messages appear after upload

### 10. Test Error Handling

**Test Cases:**

#### Large File Upload
1. Try to upload file > 50MB
2. **Expected:** Error message appears

#### Invalid File Type
1. Try to upload .exe file as document
2. **Expected:** File picker doesn't allow selection

#### Network Error
1. Disconnect internet
2. Try to send message
3. **Expected:** Error message appears

#### Missing Profile Photo
1. Chat with user who has no profile photo
2. **Expected:** First letter displays instead

## Browser Testing

Test in multiple browsers:
- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## Mobile Testing

Test on mobile devices:
- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Responsive design (< 768px width)

**Expected Mobile Behavior:**
- Chat window fills entire screen
- File menu appears correctly
- Images/videos scale properly
- Touch interactions work

## Performance Testing

### File Upload Speed
- Small file (< 1MB): Should upload in < 2 seconds
- Medium file (5-10MB): Should upload in < 10 seconds
- Large file (20-50MB): Should upload in < 30 seconds

### Chat Loading
- Chat window opens: < 1 second
- Messages load: < 2 seconds
- Profile photo loads: < 1 second

## Common Issues & Solutions

### Issue: Profile photo not showing
**Solution:** 
- Check if user has profile photo in database
- Verify S3 URL is accessible
- Check browser console for CORS errors

### Issue: File upload fails
**Solution:**
- Check AWS credentials in .env file
- Verify S3 bucket permissions
- Check file size (must be < 50MB)
- Check internet connection

### Issue: Plus icon menu doesn't appear
**Solution:**
- Check z-index in CSS
- Verify JavaScript console for errors
- Check if showFileMenu state is updating

### Issue: Send icon not working
**Solution:**
- Check if message input has text
- Verify sending state is not stuck
- Check network tab for API errors

### Issue: Files not displaying
**Solution:**
- Verify S3 URLs are public
- Check CORS configuration
- Ensure file URLs are properly formatted

## API Testing (Postman/cURL)

### Send File Message
```bash
curl -X POST http://localhost:4001/api/v1/messages/send-file \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "receiverId=user-123" \
  -F "fileType=document"
```

### Get User Profile
```bash
curl -X GET http://localhost:4001/api/v1/staff/profile/user-123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Conversation
```bash
curl -X GET http://localhost:4001/api/v1/messages/conversation/user-123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Success Criteria

All tests pass when:
- ✅ Profile photos display correctly
- ✅ Plus icon opens file menu
- ✅ All file types upload successfully
- ✅ Files display correctly in chat
- ✅ Send icon works properly
- ✅ Data isolation is maintained
- ✅ Real-time updates work
- ✅ Error handling works
- ✅ Mobile responsive
- ✅ No console errors

## Reporting Issues

When reporting issues, include:
1. Browser and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots/screen recording
5. Console errors (if any)
6. Network tab errors (if any)

---

**Last Updated:** 2026-04-08
**Version:** 1.0.0
