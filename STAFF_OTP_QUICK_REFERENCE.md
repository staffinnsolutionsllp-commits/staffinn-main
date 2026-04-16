# Staff Registration OTP - Quick Reference

## API Endpoints

### 1. Send OTP
```
POST /api/auth/send-otp
Body: { "email": "user@example.com" }
```

### 2. Verify OTP
```
POST /api/auth/verify-otp
Body: { "email": "user@example.com", "otp": "123456" }
```

### 3. Register Staff
```
POST /api/staff/register
Body: {
  "fullName": "John Doe",
  "email": "user@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "phoneNumber": "9876543210"
}
```

## Complete Flow

```
1. User enters email → Click "Send OTP"
   ↓
2. Backend generates 6-digit OTP
   ↓
3. Resend API sends email with OTP
   ↓
4. User receives email and enters OTP
   ↓
5. User clicks "Verify OTP"
   ↓
6. Backend validates OTP
   ↓
7. Email marked as verified
   ↓
8. User fills remaining form fields
   ↓
9. User clicks "Register"
   ↓
10. Backend checks email verification
    ↓
11. User account created
    ↓
12. JWT tokens returned
```

## Key Features

✅ 6-digit OTP
✅ 10-minute expiry
✅ 3 verification attempts
✅ Rate limiting (3 requests per 15 min)
✅ Email uniqueness check
✅ One-time use OTPs
✅ Automatic cleanup

## Security

- OTPs stored in-memory (use Redis for production)
- Rate limiting prevents abuse
- Email verification required before registration
- OTP deleted after successful registration
- Idempotency keys prevent duplicate emails

## Configuration

**Environment Variable:**
```
RESEND_API_KEY=re_XDmEgB48_4nBWaP7nBrmrv5MgbLXBeJVw
```

**OTP Settings:**
- Length: 6 digits
- Expiry: 10 minutes
- Max Attempts: 3
- Rate Limit: 3 per 15 minutes

## Production Checklist

- [ ] Verify domain at https://resend.com/domains
- [ ] Update `from` email in emailService.js
- [ ] Implement Redis for OTP storage
- [ ] Enable HTTPS
- [ ] Add request logging
- [ ] Monitor rate limits
- [ ] Set up error alerts

## Testing Commands

**Send OTP:**
```bash
curl -X POST http://localhost:4001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Verify OTP:**
```bash
curl -X POST http://localhost:4001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp": "123456"}'
```

**Register:**
```bash
curl -X POST http://localhost:4001/api/staff/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "test@example.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123",
    "phoneNumber": "9876543210"
  }'
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Email is already registered" | Email exists in database | Use different email |
| "Please verify your email first" | OTP not verified | Complete OTP verification |
| "Invalid or expired OTP" | Wrong OTP or expired | Request new OTP |
| "Failed to send OTP" | Rate limit exceeded | Wait 15 minutes |

## Files Modified

1. `Backend/services/emailService.js` - Resend integration
2. `Backend/routes/authRoutes.js` - OTP endpoints
3. `Backend/controllers/authController.js` - sendOTP function
4. `Backend/controllers/staffController.js` - Email verification check
5. `Backend/.env` - Resend API key

## Support

Check logs: `Backend/server.js`
OTP stats: Available in `otpService.js`
