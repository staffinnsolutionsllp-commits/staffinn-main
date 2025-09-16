# Placement Images S3 Folder Fix

## Problem
The placement section images (company logos and student photos) were being saved with blob URLs instead of proper S3 URLs, and they were not being stored in the correct S3 folder structure.

## Solution
This fix implements the following changes:

### 1. Backend Changes (instituteController.js)
- **Fixed S3 folder structure**: 
  - Company logos now save to: `placement-company-logos/`
  - Student photos now save to: `placement-student-photos/`
- **Improved file upload handling**: Files are properly uploaded to S3 with correct folder structure
- **Enhanced error handling**: Better error messages and fallback handling
- **Fixed URL generation**: Proper S3 URLs are generated and stored in DynamoDB

### 2. Migration Script
Created `migrate-placement-images.js` to move existing images from old folder structure to new structure:
- Scans all placement sections in DynamoDB
- Moves company logos to `placement-company-logos/` folder
- Moves student photos to `placement-student-photos/` folder
- Updates DynamoDB records with new URLs
- Cleans up old files after successful migration

### 3. Frontend Integration
The frontend already handles file uploads correctly through the existing API service.

## How to Run the Migration

### Prerequisites
- Ensure your AWS credentials are properly configured in `.env`
- Make sure you have access to the S3 bucket and DynamoDB table
- Backup your data before running the migration (recommended)

### Running the Migration

1. **Navigate to the Backend directory:**
   ```bash
   cd Backend
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Run the migration script:**
   ```bash
   node run-placement-migration.js
   ```

   Or directly:
   ```bash
   node migrate-placement-images.js
   ```

### What the Migration Does

1. **Scans DynamoDB**: Finds all placement sections in the `Institute-placement-section` table
2. **Processes Company Logos**:
   - Extracts S3 keys from existing URLs
   - Copies files to `placement-company-logos/` folder
   - Updates URLs in DynamoDB
   - Deletes old files (if in different location)
3. **Processes Student Photos**:
   - Extracts S3 keys from existing URLs
   - Copies files to `placement-student-photos/` folder
   - Updates URLs in DynamoDB
   - Deletes old files (if in different location)
4. **Updates Database**: Saves new URLs back to DynamoDB

### Migration Output
The script provides detailed logging:
- ✅ Success messages for completed operations
- ⚠️ Warning messages for files that already exist or are missing
- ❌ Error messages for failed operations
- 📊 Summary statistics at the end

## Testing the Fix

### 1. Test New Uploads
1. Go to Institute Dashboard → Placements section
2. Add a new company logo or student photo
3. Verify the image appears correctly
4. Check the browser developer tools - the image URL should be a proper S3 URL like:
   - `https://staffinn-files.s3.ap-south-1.amazonaws.com/placement-company-logos/[filename]`
   - `https://staffinn-files.s3.ap-south-1.amazonaws.com/placement-student-photos/[filename]`

### 2. Test Public Display
1. Go to the institute's public page
2. Navigate to the Placements section
3. Verify that company logos and student photos display correctly
4. Images should load from S3 URLs, not blob URLs

### 3. Verify S3 Structure
Check your S3 bucket to ensure the folder structure is correct:
```
staffinn-files/
├── placement-company-logos/
│   ├── [uuid]-[timestamp].jpg
│   ├── [uuid]-[timestamp].png
│   └── ...
├── placement-student-photos/
│   ├── [uuid]-[timestamp].jpg
│   ├── [uuid]-[timestamp].png
│   └── ...
```

## Files Modified

### Backend Files
- `controllers/instituteController.js` - Updated placement file upload functions
- `migrate-placement-images.js` - New migration script
- `run-placement-migration.js` - Simple script runner

### Key Functions Updated
- `uploadPlacementFiles()` - Now uses correct folder names
- `deleteOldPlacementFiles()` - Improved S3 key extraction
- `updatePlacementSection()` - Enhanced file handling

## Environment Variables Required
Ensure these are set in your `.env` file:
```
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=staffinn-files
```

## Rollback Plan
If you need to rollback:
1. The migration script creates a backup of the original data structure
2. You can restore from DynamoDB backups if needed
3. Old files are only deleted after successful copying, so data loss is minimal

## Support
If you encounter any issues:
1. Check the console logs for detailed error messages
2. Verify AWS credentials and permissions
3. Ensure S3 bucket exists and is accessible
4. Check DynamoDB table permissions

## Future Enhancements
- Add support for batch operations for better performance
- Implement progress tracking for large migrations
- Add validation for image file types and sizes
- Consider implementing CDN integration for better performance