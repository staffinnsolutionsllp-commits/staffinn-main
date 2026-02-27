# HRMS Company Setup - Production Ready Implementation

## Overview
Company details ab DynamoDB se fetch hote hain instead of localStorage. Ye production-ready solution hai.

## Changes Made

### Backend Changes

1. **hrmsAuthController.js** - Updated `login` and `getProfile` endpoints
   - Ab ye endpoints automatically company details fetch karte hain DynamoDB se
   - `adminEmail-index` GSI use karke company ko find karte hain
   - User object me `companyId` aur `companyName` add kar dete hain

2. **Database Schema**
   - Table: `staffinn-hrms-companies`
   - GSI: `adminEmail-index` (adminEmail par query karne ke liye)

### Frontend Changes

1. **AuthContext.tsx** - Simplified logic
   - localStorage dependency remove ki
   - Backend se hi company details aate hain
   - Modal sirf tab dikhta hai jab backend se company details nahi milte

2. **CompanySetupModal.tsx** - Cleanup
   - localStorage save logic remove ki
   - Sirf backend API call karta hai

## Setup Instructions

### 1. DynamoDB Table Setup

Agar table already exist karta hai aur GSI nahi hai:

```bash
cd Backend
node scripts/update-hrms-companies-gsi.js
```

Agar table nahi hai:

```bash
cd Backend
node scripts/create-hrms-companies-table.js
```

### 2. Backend Deployment

```bash
cd Backend
npm install
# Production me deploy karo
```

### 3. Frontend Build

```bash
cd "HRMS Staffinn/Staffinn HR Manager_files"
npm install
npm run build
```

## How It Works

### First Time User Registration
1. User register karta hai → HRMS user create hota hai
2. CompanySetupModal dikhta hai
3. User company name enter karta hai
4. Backend me company create hota hai DynamoDB me
5. Company details user ke email se link ho jate hain

### Subsequent Logins / Page Refresh
1. User login karta hai ya page refresh hota hai
2. Backend automatically `adminEmail-index` GSI use karke company details fetch karta hai
3. User object me company details add ho jate hain
4. Modal nahi dikhta kyunki company already exist karta hai

### Data Flow

```
User Login/Refresh
    ↓
Backend: getProfile() or login()
    ↓
Query DynamoDB: adminEmail-index
    ↓
Company Found? → Add to user object
    ↓
Frontend: Receive user with companyId & companyName
    ↓
No Modal (Company exists) ✅
```

## Benefits

✅ **Production Ready**: No localStorage dependency
✅ **Scalable**: DynamoDB se fetch hota hai
✅ **Secure**: Company details backend me stored hain
✅ **Multi-device**: Kisi bhi device se login karo, company details milenge
✅ **No Duplicate Error**: Email already registered error nahi aayega

## Testing

1. Register new user → Company setup modal dikhega
2. Create company → Credentials save honge
3. Refresh page → Modal nahi dikhega, company details automatically load honge
4. Logout aur login karo → Company details automatically load honge

## Troubleshooting

### Issue: "Email already registered" error
**Solution**: Ye fix ho gaya hai. Ab backend se company details fetch hote hain.

### Issue: Modal bar bar dikhta hai
**Solution**: Check karo ki DynamoDB me company entry hai ya nahi:
```bash
aws dynamodb query \
  --table-name staffinn-hrms-companies \
  --index-name adminEmail-index \
  --key-condition-expression "adminEmail = :email" \
  --expression-attribute-values '{":email":{"S":"user@example.com"}}'
```

### Issue: GSI not found error
**Solution**: Run the GSI update script:
```bash
node scripts/update-hrms-companies-gsi.js
```

## Environment Variables

Backend `.env` me ye variables hone chahiye:
```
AWS_REGION=ap-south-1
JWT_SECRET=your_secret_key
```

## API Endpoints

- `POST /api/hrms/auth/register` - User registration
- `POST /api/hrms/auth/login` - User login (returns company details)
- `GET /api/hrms/auth/profile` - Get profile (returns company details)
- `POST /api/hrms/company/register` - Company registration

## Database Structure

### staffinn-hrms-users
```json
{
  "userId": "uuid",
  "email": "admin@company.com",
  "name": "Admin Name",
  "role": "admin",
  "password": "hashed",
  "createdAt": "timestamp"
}
```

### staffinn-hrms-companies
```json
{
  "companyId": "COMP-XXXX",
  "companyName": "Company Name",
  "adminEmail": "admin@company.com",
  "apiKey": "sk_live_xxx",
  "subscription": "active",
  "devices": [],
  "createdAt": "timestamp"
}
```

## Notes

- GSI `adminEmail-index` eventually consistent hai
- Company creation ke turant baad query karne me slight delay ho sakta hai
- Production me proper error handling aur retry logic add karo
