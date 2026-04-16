# Field Name Consistency Fix - HRMS Companies

## Problem
The HRMS companies table had potential inconsistencies in field naming between `recruiterId` (camelCase) and `recruiter_id` (snake_case).

## Solution
All code now consistently uses **camelCase** for field names:
- ✅ `recruiterId` (correct)
- ❌ `recruiter_id` (incorrect)

## Changes Made

### 1. Controller Updates (`hrmsCompanyController.js`)
- ✅ Ensured all API responses include `recruiterId` field
- ✅ Added new endpoint: `GET /api/hrms/companies/recruiter/:recruiterId`
- ✅ Returns companies filtered by recruiterId using GSI

### 2. Migration Script (`migrate-add-recruiter-to-company.js`)
- ✅ Handles both camelCase and snake_case input
- ✅ Always outputs camelCase (`recruiterId`)
- ✅ Links companies to recruiters via adminEmail

### 3. GSI Script (`add-recruiterid-gsi-to-companies.js`)
- ✅ Creates `recruiterId-index` GSI for efficient queries
- ✅ Uses camelCase field name

### 4. Verification Script (`verify-field-consistency.js`)
- ✅ Checks all companies for field consistency
- ✅ Reports any inconsistencies found

## Database Schema

### Table: staffinn-hrms-companies
**Primary Key:**
- `companyId` (String, HASH)

**Global Secondary Indexes:**
1. `adminEmail-index` - Query by admin email
2. `recruiterId-index` - Query by recruiter ID

**Fields:**
```javascript
{
  companyId: String,        // Primary key
  recruiterId: String,      // ✅ camelCase (consistent)
  companyName: String,
  adminEmail: String,
  adminName: String,
  adminPassword: String,    // Hashed
  apiKey: String,
  subscription: String,
  devices: Array,
  createdAt: String,
  updatedAt: String
}
```

## Usage

### 1. Verify Field Consistency
```bash
node Backend/scripts/verify-field-consistency.js
```

### 2. Run Migration (if needed)
```bash
node Backend/scripts/migrate-add-recruiter-to-company.js
```

### 3. Add GSI (if not exists)
```bash
node Backend/scripts/add-recruiterid-gsi-to-companies.js
```

## API Endpoints

### Get Companies by Recruiter ID
```http
GET /api/hrms/companies/recruiter/:recruiterId
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "companyId": "COMP-ABC123",
      "recruiterId": "REC123",
      "companyName": "Example Corp",
      "adminEmail": "admin@example.com",
      "apiKeyPreview": "sk_live_abc123...",
      "devices": []
    }
  ],
  "count": 1
}
```

### Get Company Profile
```http
GET /api/hrms/companies/:companyId/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companyId": "COMP-ABC123",
    "recruiterId": "REC123",
    "companyName": "Example Corp",
    "apiKeyPreview": "sk_live_abc123..."
  }
}
```

## Coding Standards

### ✅ DO:
- Use camelCase for all field names: `recruiterId`, `companyId`, `adminEmail`
- Always include `recruiterId` when creating/updating companies
- Use GSI for querying by `recruiterId`

### ❌ DON'T:
- Use snake_case: `recruiter_id`, `company_id`
- Mix naming conventions in the same codebase
- Query without using appropriate indexes

## Testing

After running the migration:

1. **Verify all companies have recruiterId:**
   ```bash
   node Backend/scripts/verify-field-consistency.js
   ```

2. **Test API endpoint:**
   ```bash
   curl http://localhost:5000/api/hrms/companies/recruiter/REC123
   ```

3. **Check DynamoDB Console:**
   - Navigate to staffinn-hrms-companies table
   - Verify all items have `recruiterId` field (camelCase)
   - Check GSI `recruiterId-index` is active

## Rollback Plan

If issues occur:
1. The migration script is idempotent (safe to run multiple times)
2. Original data is preserved (only adds `recruiterId` field)
3. No data is deleted or overwritten

## Future Considerations

- All new code should follow camelCase convention
- Add linting rules to enforce naming conventions
- Consider adding TypeScript for type safety
- Add validation middleware to ensure `recruiterId` is always present

## Support

For issues or questions:
1. Check verification script output
2. Review migration logs
3. Verify GSI is active in DynamoDB console
4. Check API responses include `recruiterId` field
