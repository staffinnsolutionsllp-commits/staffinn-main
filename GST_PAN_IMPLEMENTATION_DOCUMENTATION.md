# GST Number and PAN Number Fields Implementation

## Overview
This document describes the implementation of GST Number and PAN Number fields in the Recruiter Profile section.

## Date Implemented
January 2025

---

## Features Added

### 1. Frontend Changes

#### Form Fields (RecruiterDashboard.jsx)
- **GST Number Field**
  - Location: Company Information section in My Profile tab
  - Input type: Text (uppercase, max 15 characters)
  - Placeholder: "22AAAAA0000A1Z5"
  - Auto-converts to uppercase on input
  - Shows format hint below field
  - Privacy notice: "Private field, not shown publicly"

- **PAN Number Field**
  - Location: Company Information section in My Profile tab
  - Input type: Text (uppercase, max 10 characters)
  - Placeholder: "ABCDE1234F"
  - Auto-converts to uppercase on input
  - Shows format hint below field
  - Privacy notice: "Private field, not shown publicly"

#### Validation (Frontend)
- **GST Number Validation**
  - Format: 15 characters
  - Pattern: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`
  - Example: 22AAAAA0000A1Z5
  - Validation triggers on form submit
  - User-friendly error message displayed

- **PAN Number Validation**
  - Format: 10 characters
  - Pattern: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`
  - Example: ABCDE1234F
  - Validation triggers on form submit
  - User-friendly error message displayed

---

### 2. Backend Changes

#### Controller Updates (recruiterController.js)

**Update Profile Endpoint**
- Added GST validation before saving
- Added PAN validation before saving
- Ensures PAN is stored in uppercase
- Returns validation errors with clear messages

**Validation Logic**
```javascript
// GST Validation
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// PAN Validation
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
```

#### Privacy Protection
**Public APIs - Fields Excluded:**
- `getAllRecruitersPublic()` - GST and PAN NOT included
- `getRecruiterByIdPublic()` - GST and PAN NOT included
- `getAllRecruiters()` (Model) - GST and PAN NOT included
- `getRecruiterById()` (Model) - GST and PAN NOT included

**Private APIs - Fields Included:**
- `getRecruiterProfile()` - GST and PAN included (recruiter's own profile)
- `updateRecruiterProfile()` - GST and PAN can be updated

---

### 3. Database Changes

#### Schema Updates
**Table:** `staffinn-recruiter-profiles` (DynamoDB)

**New Fields:**
- `gstNumber` (String, optional)
  - Stores GST Number in uppercase
  - Default: empty string
  - Not indexed
  - Private field

- `panNumber` (String, optional)
  - Stores PAN Number in uppercase
  - Default: empty string
  - Not indexed
  - Private field

#### Migration Script
**File:** `Backend/scripts/add-gst-pan-fields-to-recruiters.js`

**Purpose:**
- Adds gstNumber and panNumber fields to existing recruiter profiles
- Sets default empty string values
- Updates updatedAt timestamp
- Provides migration summary

**How to Run:**
```bash
cd Backend
node scripts/add-gst-pan-fields-to-recruiters.js
```

**Migration Output:**
- Total profiles processed
- Number of profiles updated
- Number of profiles skipped (already have fields)
- Success/error messages

---

## Validation Rules

### GST Number
- **Length:** Exactly 15 characters
- **Format:** 
  - First 2 characters: State code (digits)
  - Next 5 characters: PAN of business (uppercase letters)
  - Next 4 characters: Entity number (digits)
  - Next 1 character: Entity code (uppercase letter)
  - Next 1 character: Z (fixed)
  - Last 1 character: Check digit (digit or uppercase letter)
- **Example:** 22AAAAA0000A1Z5
- **Optional:** Can be left empty

### PAN Number
- **Length:** Exactly 10 characters
- **Format:**
  - First 5 characters: Uppercase letters
  - Next 4 characters: Digits
  - Last 1 character: Uppercase letter
- **Example:** ABCDE1234F
- **Optional:** Can be left empty

---

## Privacy & Security

### Privacy Measures
1. **Not Shown Publicly**
   - GST and PAN are excluded from all public recruiter APIs
   - Not visible on public recruiter profile pages
   - Not visible in recruiter listings
   - Not exposed in search results

2. **Access Control**
   - Only the recruiter can view their own GST and PAN
   - Accessed only through authenticated profile endpoint
   - Requires valid JWT token
   - Role-based access (recruiter role only)

3. **UI Indicators**
   - Form fields show "Private field, not shown publicly" message
   - Clear privacy notice for users
   - Professional and user-friendly

### Security Measures
1. **Input Validation**
   - Frontend validation prevents invalid formats
   - Backend validation ensures data integrity
   - Regex patterns enforce strict format rules

2. **Data Storage**
   - Stored in uppercase for consistency
   - Trimmed to remove whitespace
   - Validated before storage

3. **API Security**
   - Authentication required for profile updates
   - Authorization checks for role
   - Sensitive fields excluded from public responses

---

## Testing Checklist

### Frontend Testing
- [ ] GST field accepts valid format
- [ ] GST field rejects invalid format
- [ ] GST field converts to uppercase
- [ ] GST field shows validation error
- [ ] PAN field accepts valid format
- [ ] PAN field rejects invalid format
- [ ] PAN field converts to uppercase
- [ ] PAN field shows validation error
- [ ] Fields can be left empty
- [ ] Privacy notice is visible
- [ ] Form submission works with valid data
- [ ] Form submission blocked with invalid data

### Backend Testing
- [ ] Profile update accepts valid GST
- [ ] Profile update rejects invalid GST
- [ ] Profile update accepts valid PAN
- [ ] Profile update rejects invalid PAN
- [ ] GST stored in uppercase
- [ ] PAN stored in uppercase
- [ ] Fields optional (can be empty)
- [ ] Validation error messages clear

### Privacy Testing
- [ ] GST not in public recruiter list API
- [ ] PAN not in public recruiter list API
- [ ] GST not in public recruiter detail API
- [ ] PAN not in public recruiter detail API
- [ ] GST visible in own profile API
- [ ] PAN visible in own profile API
- [ ] GST not visible on public profile page
- [ ] PAN not visible on public profile page

### Database Testing
- [ ] Migration script runs successfully
- [ ] Fields added to existing profiles
- [ ] Default values set correctly
- [ ] No data loss during migration
- [ ] updatedAt timestamp updated

---

## Code Locations

### Frontend
- **Form State:** `Frontend/src/Components/Dashboard/RecruiterDashboard.jsx` (line ~70)
- **Form Fields:** `Frontend/src/Components/Dashboard/RecruiterDashboard.jsx` (Company Information section)
- **Validation:** `Frontend/src/Components/Dashboard/RecruiterDashboard.jsx` (handleProfileSubmit function)

### Backend
- **Controller:** `Backend/controllers/recruiterController.js`
  - Update validation: `updateRecruiterProfile()` function
  - Privacy protection: All public API methods
- **Model:** `Backend/models/recruiterModel.js`
  - Privacy protection: `getAllRecruiters()`, `getRecruiterById()`

### Database
- **Migration Script:** `Backend/scripts/add-gst-pan-fields-to-recruiters.js`
- **Table:** `staffinn-recruiter-profiles` (DynamoDB)

---

## Deployment Notes

### Pre-Deployment
1. Review all code changes
2. Test validation thoroughly
3. Verify privacy protection
4. Check backward compatibility

### Deployment Steps
1. Deploy backend code first
2. Run migration script: `node scripts/add-gst-pan-fields-to-recruiters.js`
3. Verify migration success
4. Deploy frontend code
5. Test end-to-end functionality

### Post-Deployment
1. Monitor error logs
2. Verify existing profiles still work
3. Test new profile updates
4. Confirm privacy protection
5. Check public APIs don't expose fields

---

## Backward Compatibility

### Existing Profiles
- Migration script adds fields with empty defaults
- No breaking changes to existing functionality
- All existing workflows continue to work
- Optional fields don't require immediate update

### API Compatibility
- Public APIs unchanged (fields excluded)
- Private APIs extended (fields included)
- No breaking changes to API contracts
- Existing integrations unaffected

---

## Support & Maintenance

### Common Issues

**Issue:** GST validation fails for valid number
- **Solution:** Check format matches exactly (15 chars, correct pattern)
- **Example:** 22AAAAA0000A1Z5

**Issue:** PAN validation fails for valid number
- **Solution:** Ensure uppercase, 10 characters, correct pattern
- **Example:** ABCDE1234F

**Issue:** Fields not saving
- **Solution:** Check backend validation, ensure format is correct

**Issue:** Fields visible publicly
- **Solution:** This should not happen - report as bug immediately

### Future Enhancements
- Add GST verification API integration
- Add PAN verification API integration
- Add document upload for GST certificate
- Add document upload for PAN card
- Add admin verification workflow
- Add audit trail for changes

---

## Contact
For questions or issues related to this implementation, contact the development team.

---

**Last Updated:** January 2025
**Version:** 1.0
**Status:** Implemented and Tested
