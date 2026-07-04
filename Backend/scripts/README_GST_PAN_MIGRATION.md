# Database Migration: Add GST and PAN Fields

## Purpose
This migration script adds `gstNumber` and `panNumber` fields to all existing recruiter profiles in the `staffinn-recruiter-profiles` DynamoDB table.

## What It Does
1. Scans all recruiter profiles in the database
2. Checks if GST and PAN fields already exist
3. Adds empty string defaults for missing fields
4. Updates the `updatedAt` timestamp
5. Provides detailed migration summary

## Prerequisites
- Node.js installed
- AWS credentials configured
- Access to DynamoDB table
- Environment variables set in `.env` file

## How to Run

### Step 1: Navigate to Backend Directory
```bash
cd Backend
```

### Step 2: Ensure Environment Variables
Make sure your `.env` file contains:
```
RECRUITER_PROFILES_TABLE=staffinn-recruiter-profiles
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Step 3: Run Migration
```bash
node scripts/add-gst-pan-fields-to-recruiters.js
```

## Expected Output

### Successful Migration
```
Starting migration: Adding GST and PAN fields to recruiter profiles...
Target table: staffinn-recruiter-profiles
Found 25 recruiter profiles
✓ Updated profile for recruiter: rec-123-456
✓ Updated profile for recruiter: rec-789-012
...

=== Migration Summary ===
Total profiles: 25
Updated: 25
Skipped: 0
Migration completed successfully!

Migration script finished.
```

### Partial Migration (Some Already Updated)
```
Starting migration: Adding GST and PAN fields to recruiter profiles...
Target table: staffinn-recruiter-profiles
Found 25 recruiter profiles
Profile rec-123-456 already has GST and PAN fields. Skipping...
✓ Updated profile for recruiter: rec-789-012
...

=== Migration Summary ===
Total profiles: 25
Updated: 20
Skipped: 5
Migration completed successfully!

Migration script finished.
```

### No Profiles Found
```
Starting migration: Adding GST and PAN fields to recruiter profiles...
Target table: staffinn-recruiter-profiles
Found 0 recruiter profiles
No recruiter profiles found. Migration complete.

Migration script finished.
```

## Safety Features

### Idempotent
- Can be run multiple times safely
- Skips profiles that already have the fields
- No data loss or duplication

### Non-Destructive
- Only adds new fields
- Doesn't modify existing data
- Preserves all current profile information

### Error Handling
- Continues on individual profile errors
- Logs errors for debugging
- Provides summary of successes and failures

## Rollback

If you need to remove the fields (not recommended):
```javascript
// Manual rollback script (use with caution)
const dynamoService = require('../services/dynamoService');
const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE;

async function rollback() {
  const profiles = await dynamoService.scanItems(RECRUITER_PROFILES_TABLE);
  for (const profile of profiles) {
    delete profile.gstNumber;
    delete profile.panNumber;
    await dynamoService.putItem(RECRUITER_PROFILES_TABLE, profile);
  }
}
```

## Verification

### Check Migration Success
After running the migration, verify in AWS Console:
1. Go to DynamoDB
2. Select `staffinn-recruiter-profiles` table
3. View items
4. Check that `gstNumber` and `panNumber` fields exist

### Test in Application
1. Login as a recruiter
2. Go to My Profile
3. Check that GST and PAN fields are visible
4. Try updating the fields
5. Verify validation works

## Troubleshooting

### Error: "Cannot find module"
**Solution:** Run `npm install` in Backend directory

### Error: "Access Denied"
**Solution:** Check AWS credentials and permissions

### Error: "Table not found"
**Solution:** Verify `RECRUITER_PROFILES_TABLE` environment variable

### Migration Hangs
**Solution:** Check network connection and AWS region

## Post-Migration

### What to Do Next
1. ✅ Verify migration completed successfully
2. ✅ Test profile updates with GST/PAN
3. ✅ Verify validation works
4. ✅ Check privacy protection (fields not public)
5. ✅ Deploy frontend changes

### Monitoring
- Check application logs for errors
- Monitor DynamoDB metrics
- Test recruiter profile updates
- Verify no public exposure of fields

## Support

### Common Questions

**Q: Can I run this multiple times?**  
A: Yes, it's safe. Already updated profiles will be skipped.

**Q: Will this affect existing profiles?**  
A: No, it only adds new fields with empty defaults.

**Q: What if migration fails halfway?**  
A: Profiles already updated will be skipped on re-run.

**Q: Do I need to backup first?**  
A: Recommended but not required (migration is non-destructive).

### Contact
For issues or questions, contact the development team.

---

**Script Location:** `Backend/scripts/add-gst-pan-fields-to-recruiters.js`  
**Created:** January 2025  
**Version:** 1.0  
**Status:** Production Ready
