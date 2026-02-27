# MORX BioFace Device Configuration Guide

## Step 1: Access Device Web Interface

1. Open browser and go to: `http://192.168.1.24`
2. Login with admin credentials

## Step 2: Configure HTTP Push Settings

Navigate to: **Communication Settings** → **Network Settings**

### Required Configuration:

```
Server Settings:
├── Server IP: <YOUR-EC2-PUBLIC-IP>
├── Server Port: 4001
├── Push URL: /api/attendance/webhook
├── Protocol: HTTP
├── Mode: Real-time Upload / LogClient
└── Communication Password: (leave blank)

Data Format:
├── Format: JSON
└── Method: POST
```

## Step 3: Test Configuration

### Device will send data in this format:

```json
{
  "enrollNumber": "EMP001",
  "name": "John Doe",
  "verifyMode": 15,
  "inOutMode": 0,
  "workCode": 0,
  "dateTime": "2024-01-15T09:30:00",
  "deviceId": "1"
}
```

### Field Meanings:
- **verifyMode**: 1=Fingerprint, 15=Face, 4=Password
- **inOutMode**: 0=Check-in, 1=Check-out, 2=Break-out, 3=Break-in
- **workCode**: 0=Normal, 1=Overtime, 2=Holiday

## Step 4: EC2 Security Group Settings

Add inbound rule:
```
Type: Custom TCP
Port: 4001
Source: <Device-Public-IP> or 0.0.0.0/0
```

## Step 5: Verify Connection

1. Mark attendance on device
2. Check EC2 logs: `pm2 logs staffinn-backend`
3. Verify DynamoDB entry
4. Check HRMS frontend

## Troubleshooting:

### Device not connecting?
- Check EC2 security group
- Verify device can reach EC2: `ping <EC2-IP>`
- Check device logs

### Data not saving?
- Check Node.js logs
- Verify DynamoDB table exists
- Check IAM permissions

## Alternative: If HTTP Push Not Available

Use SDK polling approach (requires Windows machine):
- Install Windows Service on local machine
- Service polls device every 30 seconds
- Pushes data to EC2 API
