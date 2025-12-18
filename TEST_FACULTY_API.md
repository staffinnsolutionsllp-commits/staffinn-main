# Test Faculty API

Backend server restart karne ke baad ye test karo:

## 1. Check if server is running
Open browser: http://localhost:4001/

## 2. Test GET endpoint
```bash
curl http://localhost:4001/api/v1/faculty-list
```

## 3. Backend terminal mein ye messages dikhne chahiye:
- "Server running on port 4001"
- "✅ Using real AWS DynamoDB"

## 4. Agar backend crash ho raha hai to:
- Backend terminal output copy karo
- Error stack trace share karo

## 5. Common issues:
- DynamoDB connection issue
- S3 upload issue  
- Multer file upload issue
- Too many attributes in DynamoDB

## Current Setup:
- Table: mis-faculty-list
- Partition Key: misfaculty
- Attributes: 16 (under limit of 20)

Backend restart karo aur form submit karte waqt backend terminal carefully dekho.
