# Staff Registration OTP Flow - Visual Diagram

## Complete Registration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     STAFF REGISTRATION WITH OTP                      │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   FRONTEND   │
└──────┬───────┘
       │
       │ 1. User enters email
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Email Input Field                                            │
│  ┌────────────────────────────────────┐  ┌──────────────┐   │
│  │ user@example.com                   │  │  Send OTP    │   │
│  └────────────────────────────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────────┘
       │
       │ 2. Click "Send OTP"
       │
       ▼
┌──────────────┐
│   BACKEND    │
└──────┬───────┘
       │
       │ 3. POST /api/auth/send-otp
       │    { "email": "user@example.com" }
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  authController.sendOTP()                                    │
│  ├─ Validate email format                                   │
│  ├─ Check if email already registered                       │
│  └─ Call emailService.sendVerificationOTP()                 │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  otpService.generateOTP()                                    │
│  ├─ Check rate limit (3 per 15 min)                         │
│  ├─ Generate 6-digit OTP                                    │
│  ├─ Set expiry (10 minutes)                                 │
│  └─ Store in memory                                         │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  emailService.sendOTPEmail()                                 │
│  ├─ Initialize Resend client                                │
│  ├─ Create email with OTP                                   │
│  ├─ Set idempotency key                                     │
│  └─ Send via Resend API                                     │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│  RESEND API  │
└──────┬───────┘
       │
       │ 4. Email sent to user
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  USER'S EMAIL INBOX                                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ From: Staffinn <onboarding@resend.dev>               │  │
│  │ Subject: Verify Your Email - Staffinn Registration   │  │
│  │                                                       │  │
│  │ Your OTP: 123456                                      │  │
│  │                                                       │  │
│  │ This OTP will expire in 10 minutes.                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
       │
       │ 5. User receives email and enters OTP
       │
       ▼
┌──────────────┐
│   FRONTEND   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  OTP Input Field                                              │
│  ┌────────────────────────────────────┐  ┌──────────────┐   │
│  │ 123456                             │  │  Verify OTP  │   │
│  └────────────────────────────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────────┘
       │
       │ 6. Click "Verify OTP"
       │
       ▼
┌──────────────┐
│   BACKEND    │
└──────┬───────┘
       │
       │ 7. POST /api/auth/verify-otp
       │    { "email": "user@example.com", "otp": "123456" }
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  authController.verifyOTP()                                  │
│  └─ Call emailService.verifyOTP()                           │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  otpService.verifyOTP()                                      │
│  ├─ Check if OTP exists                                     │
│  ├─ Check if expired (< 10 min)                             │
│  ├─ Check if already used                                   │
│  ├─ Check attempts (< 3)                                    │
│  ├─ Verify OTP matches                                      │
│  └─ Mark as verified                                        │
└──────────────────────────────────────────────────────────────┘
       │
       │ ✅ OTP Verified
       │
       ▼
┌──────────────┐
│   FRONTEND   │
└──────┬───────┘
       │
       │ 8. Show "Email Verified ✓"
       │    Enable registration form
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Registration Form                                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Full Name:        [John Doe                         ]  │  │
│  │ Email:            [user@example.com] ✓ Verified      │  │
│  │ Phone:            [9876543210                       ]  │  │
│  │ Password:         [••••••••••                       ]  │  │
│  │ Confirm Password: [••••••••••                       ]  │  │
│  │                                                       │  │
│  │                    [ Register ]                       │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
       │
       │ 9. User fills form and clicks "Register"
       │
       ▼
┌──────────────┐
│   BACKEND    │
└──────┬───────┘
       │
       │ 10. POST /api/staff/register
       │     { fullName, email, password, phoneNumber }
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  staffController.registerStaff()                             │
│  ├─ Validate registration data                              │
│  ├─ Check email verification status ⚠️                      │
│  ├─ Check email uniqueness                                  │
│  ├─ Create user account                                     │
│  ├─ Create staff profile                                    │
│  ├─ Generate JWT tokens                                     │
│  └─ Clean up OTP                                            │
└──────────────────────────────────────────────────────────────┘
       │
       │ ✅ Registration Complete
       │
       ▼
┌──────────────┐
│   FRONTEND   │
└──────┬───────┘
       │
       │ 11. Receive tokens and user data
       │     Store in localStorage
       │     Redirect to dashboard
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  SUCCESS!                                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ✅ Registration Successful!                            │  │
│  │                                                        │  │
│  │ Welcome, John Doe!                                     │  │
│  │                                                        │  │
│  │ Redirecting to dashboard...                           │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      ERROR SCENARIOS                         │
└─────────────────────────────────────────────────────────────┘

1. EMAIL ALREADY REGISTERED
   ┌──────────────────────────────────────┐
   │ POST /api/auth/send-otp              │
   │ { "email": "existing@example.com" }  │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ ❌ Error 400                         │
   │ "Email is already registered"        │
   └──────────────────────────────────────┘

2. RATE LIMIT EXCEEDED
   ┌──────────────────────────────────────┐
   │ POST /api/auth/send-otp (4th time)   │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ ❌ Error 400                         │
   │ "Failed to send OTP. Rate limit"     │
   └──────────────────────────────────────┘

3. INVALID OTP
   ┌──────────────────────────────────────┐
   │ POST /api/auth/verify-otp            │
   │ { "email": "...", "otp": "000000" }  │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ ❌ Error 400                         │
   │ "Invalid or expired OTP"             │
   └──────────────────────────────────────┘

4. OTP EXPIRED
   ┌──────────────────────────────────────┐
   │ POST /api/auth/verify-otp            │
   │ (after 10 minutes)                   │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ ❌ Error 400                         │
   │ "Invalid or expired OTP"             │
   └──────────────────────────────────────┘

5. MAX ATTEMPTS EXCEEDED
   ┌──────────────────────────────────────┐
   │ POST /api/auth/verify-otp            │
   │ (4th attempt with wrong OTP)         │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ ❌ Error 400                         │
   │ "Invalid or expired OTP"             │
   │ (OTP deleted from storage)           │
   └──────────────────────────────────────┘

6. REGISTRATION WITHOUT VERIFICATION
   ┌──────────────────────────────────────┐
   │ POST /api/staff/register             │
   │ (without verifying email)            │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ ❌ Error 400                         │
   │ "Please verify your email first"     │
   └──────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA STORAGE                            │
└─────────────────────────────────────────────────────────────┘

OTP STORAGE (In-Memory)
┌─────────────────────────────────────────────────────────────┐
│ Map<email, otpData>                                          │
│                                                              │
│ "user@example.com" → {                                       │
│   otp: "123456",                                             │
│   purpose: "registration",                                   │
│   createdAt: 1234567890,                                     │
│   expiryTime: 1234568490,  // +10 minutes                   │
│   attempts: 0,                                               │
│   maxAttempts: 3,                                            │
│   verified: false                                            │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
       │
       │ After verification
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ "user@example.com" → {                                       │
│   ...                                                        │
│   verified: true  ✅                                         │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
       │
       │ After registration
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ OTP DELETED (cleanup)                                        │
└─────────────────────────────────────────────────────────────┘

USER STORAGE (DynamoDB)
┌─────────────────────────────────────────────────────────────┐
│ staffinn-users table                                         │
│                                                              │
│ {                                                            │
│   userId: "uuid-here",                                       │
│   fullName: "John Doe",                                      │
│   email: "user@example.com",                                 │
│   password: "hashed-password",                               │
│   phoneNumber: "9876543210",                                 │
│   role: "staff",                                             │
│   createdAt: "2025-01-...",                                  │
│   isBlocked: false                                           │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘

STAFF PROFILE STORAGE (DynamoDB)
┌─────────────────────────────────────────────────────────────┐
│ staffinn-staff-profiles table                                │
│                                                              │
│ {                                                            │
│   staffId: "uuid-here",                                      │
│   userId: "user-uuid",                                       │
│   fullName: "John Doe",                                      │
│   email: "user@example.com",                                 │
│   phone: "9876543210",                                       │
│   isActiveStaff: false,  // Default: seeker mode            │
│   profileVisibility: "private",                              │
│   skills: "",                                                │
│   address: "",                                               │
│   ... (other profile fields)                                 │
│   createdAt: "2025-01-...",                                  │
│   updatedAt: "2025-01-..."                                   │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY MEASURES                         │
└─────────────────────────────────────────────────────────────┘

RATE LIMITING
┌─────────────────────────────────────────────────────────────┐
│ Request 1: ✅ OTP sent                                       │
│ Request 2: ✅ OTP sent (new OTP)                            │
│ Request 3: ✅ OTP sent (new OTP)                            │
│ Request 4: ❌ Rate limit exceeded                           │
│                                                              │
│ Wait 15 minutes...                                           │
│                                                              │
│ Request 5: ✅ OTP sent (rate limit reset)                   │
└─────────────────────────────────────────────────────────────┘

OTP EXPIRY
┌─────────────────────────────────────────────────────────────┐
│ Time 0:00  → OTP generated                                   │
│ Time 5:00  → ✅ OTP valid                                    │
│ Time 9:59  → ✅ OTP valid                                    │
│ Time 10:00 → ❌ OTP expired                                  │
└─────────────────────────────────────────────────────────────┘

ATTEMPT LIMITING
┌─────────────────────────────────────────────────────────────┐
│ Attempt 1: Wrong OTP → ❌ Invalid (attempts: 1)             │
│ Attempt 2: Wrong OTP → ❌ Invalid (attempts: 2)             │
│ Attempt 3: Wrong OTP → ❌ Invalid (attempts: 3)             │
│ Attempt 4: Any OTP   → ❌ Max attempts exceeded             │
│                         (OTP deleted)                        │
└─────────────────────────────────────────────────────────────┘

ONE-TIME USE
┌─────────────────────────────────────────────────────────────┐
│ First verification:  ✅ OTP verified (marked as used)       │
│ Second verification: ❌ OTP already used                     │
└─────────────────────────────────────────────────────────────┘

EMAIL UNIQUENESS
┌─────────────────────────────────────────────────────────────┐
│ Check 1: Email not in database → ✅ Proceed                 │
│ Check 2: Email exists          → ❌ Already registered      │
└─────────────────────────────────────────────────────────────┘
```

---

## Timeline Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TYPICAL USER JOURNEY                      │
└─────────────────────────────────────────────────────────────┘

0:00 │ User opens registration page
     │
0:05 │ User enters email
     │
0:10 │ User clicks "Send OTP"
     │ ├─ Backend validates email
     │ ├─ OTP generated
     │ └─ Email sent via Resend
     │
0:15 │ User receives email
     │
0:20 │ User enters OTP
     │
0:25 │ User clicks "Verify OTP"
     │ └─ OTP verified ✅
     │
0:30 │ User fills registration form
     │
1:00 │ User clicks "Register"
     │ ├─ Account created
     │ ├─ Profile created
     │ ├─ Tokens generated
     │ └─ OTP cleaned up
     │
1:05 │ User redirected to dashboard
     │
     ✅ REGISTRATION COMPLETE

Total Time: ~1 minute
```

---

This visual diagram helps understand the complete flow of the OTP email verification system!
