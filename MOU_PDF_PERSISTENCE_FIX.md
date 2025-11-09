# MOU PDF Persistence Fix

## Problem Description

The MOU (Memorandum of Understanding) PDFs uploaded in the Industry Collaborations section were not being stored permanently in the DynamoDB table. This caused the following issues:

1. **Data Loss**: PDF files were uploaded to S3 but the URLs were not being saved to the database
2. **Public Access Failure**: PDFs were not accessible on the public institute details page
3. **Form State Issues**: Existing PDF URLs were being lost during form updates

## Root Cause Analysis

The issue was in the data flow between the frontend and backend:

1. **Frontend Issue**: The `updateIndustryCollaborations` API function was not properly preserving existing PDF URLs when no new file was uploaded
2. **Backend Issue**: The controller was not correctly handling the preservation of existing PDF URLs during updates
3. **Data Validation**: The database model needed better logging to track PDF URL persistence

## Solution Implementation

### 1. Frontend API Service Fix (`api.js`)

**File**: `Frontend/src/services/api.js`

**Changes Made**:
- Improved PDF URL preservation logic in `updateIndustryCollaborations` function
- Added proper handling of `hasNewFile` and `fileId` properties
- Enhanced logging for debugging PDF upload process

**Key Fix**:
```javascript
if (mou.pdfFile && mou.pdfFile instanceof File) {
  // Handle new file upload
  formData.append(`mouPdf_${mouId}`, mou.pdfFile);
  mou.hasNewFile = true;
  mou.fileId = mouId;
  mou.pdfUrl = null; // Clear existing URL since we have new file
} else if (mou.pdfUrl && typeof mou.pdfUrl === 'string' && mou.pdfUrl.includes('http') && !mou.isRemoved) {
  // Preserve existing URL
  mou.hasNewFile = false;
  mou.fileId = null;
} else {
  // No file and no existing URL
  mou.pdfUrl = null;
  mou.hasNewFile = false;
  mou.fileId = null;
}
```

### 2. Backend Controller Fix (`instituteController.js`)

**File**: `Backend/controllers/instituteController.js`

**Changes Made**:
- Enhanced PDF URL preservation logic in `updateIndustryCollaborations` function
- Added comprehensive logging throughout the upload process
- Improved handling of existing vs new file uploads

**Key Fix**:
```javascript
// Ensure PDF URL is properly preserved - IMPROVED LOGIC
if (!mou.hasNewFile) {
  // If no new file is being uploaded, preserve existing PDF URL
  if (!mou.pdfUrl || typeof mou.pdfUrl !== 'string' || !mou.pdfUrl.includes('http')) {
    // Check if there's an existing PDF URL to preserve
    const existingMou = existingCollabData?.mouItems?.find(existing => 
      existing.title === mou.title
    ) || existingCollabData?.mouItems?.[i];
    
    if (existingMou && existingMou.pdfUrl && typeof existingMou.pdfUrl === 'string' && existingMou.pdfUrl.includes('http')) {
      mou.pdfUrl = existingMou.pdfUrl;
    } else {
      mou.pdfUrl = null;
    }
  }
} else {
  console.log(`New file uploaded for ${mou.title}, PDF URL will be set by upload process`);
}
```

### 3. Database Model Enhancement (`instituteIndustryCollabModel.js`)

**File**: `Backend/models/instituteIndustryCollabModel.js`

**Changes Made**:
- Added detailed logging for PDF URL validation and storage
- Enhanced verification step to confirm data persistence
- Improved error tracking for debugging

**Key Enhancement**:
```javascript
console.log('Saving collaboration data with validated URLs:', {
  collaborationCards: collaborationSection.collaborationCards.length,
  mouItems: collaborationSection.mouItems.length,
  mouItemsWithPdfs: collaborationSection.mouItems.filter(mou => mou.pdfUrl).length,
  mouItemDetails: collaborationSection.mouItems.map(mou => ({
    title: mou.title,
    hasPdf: !!mou.pdfUrl,
    pdfUrl: mou.pdfUrl ? mou.pdfUrl.substring(0, 50) + '...' : null
  }))
});
```

## Testing

### Automated Test Script

Created `test-mou-persistence.js` to verify the fix:

1. **Upload Test**: Uploads a new MOU with PDF file
2. **Persistence Test**: Verifies PDF URL is saved to database
3. **Accessibility Test**: Confirms PDF is publicly accessible
4. **Update Test**: Tests that existing PDF URLs are preserved during updates
5. **Public Access Test**: Verifies PDFs are visible on public institute pages

### Manual Testing Steps

1. **Upload New MOU**:
   - Go to Institute Dashboard → Industry Collaborations
   - Add a new MOU item with title, description, and PDF file
   - Click "Update Industry Collaborations"
   - Verify success message

2. **Verify Persistence**:
   - Refresh the page
   - Check that the MOU item still shows the PDF
   - Click "View PDF" link to verify accessibility

3. **Test Public Access**:
   - Go to the public institute details page
   - Navigate to Industry Collaborations section
   - Verify MOU items with PDFs are visible
   - Click PDF links to ensure they open correctly

4. **Test Updates**:
   - Edit an existing MOU item (change title/description only)
   - Do not upload a new PDF
   - Save changes
   - Verify the original PDF URL is preserved

## File Structure

```
Backend/
├── controllers/
│   └── instituteController.js          # Fixed PDF upload logic
├── models/
│   └── instituteIndustryCollabModel.js # Enhanced logging
├── routes/
│   └── instituteRoutes.js              # PDF serving route
└── test-mou-persistence.js             # Test script

Frontend/
└── src/
    └── services/
        └── api.js                       # Fixed API calls
```

## Public PDF Access

PDFs are now publicly accessible through:
- **Direct S3 URLs**: `https://bucket.s3.region.amazonaws.com/industry-collab-pdfs/filename.pdf`
- **API Route**: `/api/v1/institutes/mou-pdf/:filename` (redirects to S3)
- **Public Institute Page**: Embedded in industry collaborations section

## Security Considerations

1. **Public Access**: PDFs are intentionally made publicly accessible for transparency
2. **File Validation**: Only PDF files are accepted for MOU uploads
3. **Size Limits**: 10MB maximum file size for PDF uploads
4. **Access Control**: Upload/edit requires institute authentication

## Monitoring and Debugging

Enhanced logging has been added at multiple levels:

1. **Frontend**: Console logs for file processing and API calls
2. **Backend Controller**: Detailed logs for file handling and URL preservation
3. **Database Model**: Verification logs for data persistence
4. **S3 Operations**: Upload and deletion operation logs

## Rollback Plan

If issues occur, the fix can be rolled back by:

1. Reverting the three main files to their previous versions
2. Existing data in DynamoDB will remain intact
3. S3 files will remain accessible via their direct URLs

## Future Enhancements

1. **Batch Operations**: Support for multiple PDF uploads
2. **Version Control**: Track PDF version history
3. **Analytics**: Monitor PDF download/view statistics
4. **CDN Integration**: Use CloudFront for better PDF delivery performance

## Conclusion

This fix ensures that MOU PDFs are:
- ✅ Permanently stored in DynamoDB with proper URLs
- ✅ Publicly accessible on institute detail pages
- ✅ Preserved during form updates
- ✅ Properly validated and logged for debugging
- ✅ Accessible through multiple access methods

The implementation maintains backward compatibility and includes comprehensive testing to prevent regression issues.