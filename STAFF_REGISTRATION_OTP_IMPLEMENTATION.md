# Staff Registration with OTP Email Verification

## Overview
This document describes the implementation of OTP-based email verification for staff registration using the Resend API.

## Features Implemented

### 1. Email Verification Flow
- User enters email address
- System sends 6-digit OTP to email via Resend API
- User enters OTP to verify email
- System validates OTP before allowing registration
- Registration completes only after successful email verification

### 2. Security Features
- **Rate Limiting**: Maximum 3 OTP requests per email within 15 minutes
- **OTP Expiry**: OTPs expire after 10 minutes
- **Attempt Limiting**: Maximum 3 verification attempts per OTP
- **One-time Use**: OTPs can only be used once
- **Idempotency**: Prevents duplicate email sends using unique keys

### 3. API Endpoints

#### Send OTP
```
POST /api/auth/send-otp
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email successfully"
}
```

**Error Responses:**
- 400: Email already registered
- 400: Failed to send OTP (rate limit exceeded)
- 500: Server error

#### Verify OTP
```
POST /api/auth/verify-otp
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Error Responses:**
- 400: Invalid or expired OTP
- 400: Email and OTP are required
- 500: Server error

#### Register Staff
```
POST /api/staff/register
```

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "user@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "phoneNumber": "9876543210"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Staff registered successfully. Complete your profile to become an Active Staff.",
  "data": {
    "user": {
      "userId": "uuid-here",
      "fullName": "John Doe",
      "email": "user@example.com",
      "role": "staff",
      "phoneNumber": "9876543210"
    },
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here"
  }
}
```

**Error Responses:**
- 400: Please verify your email first
- 400: Email is already registered
- 400: Validation errors
- 500: Server error

## Frontend Implementation Guide

### Step 1: Registration Form UI

```jsx
import { useState } from 'react';

function StaffRegistration() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  });
  
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Send OTP to email
  const handleSendOTP = async () => {
    if (!formData.email) {
      alert('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4001/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        alert('OTP sent to your email!');
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!otp) {
      alert('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4001/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: formData.email,
          otp: otp 
        })
      });

      const data = await response.json();

      if (data.success) {
        setEmailVerified(true);
        alert('Email verified successfully!');
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Register staff
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!emailVerified) {
      alert('Please verify your email first');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4001/api/staff/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Store tokens
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        
        alert('Registration successful!');
        // Redirect to dashboard or profile completion
        window.location.href = '/dashboard';
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-form">
      <h2>Register as Staff</h2>
      <p>Start filling out the form to become a quality staff member!</p>

      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email Address *</label>
          <div className="email-verification">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={otpSent}
              required
            />
            {!otpSent && (
              <button 
                type="button" 
                onClick={handleSendOTP}
                disabled={loading}
              >
                Send OTP
              </button>
            )}
            {emailVerified && <span className="verified">✓ Verified</span>}
          </div>
        </div>

        {otpSent && !emailVerified && (
          <div className="form-group">
            <label>Enter OTP *</label>
            <div className="otp-verification">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength="6"
                placeholder="Enter 6-digit OTP"
                required
              />
              <button 
                type="button" 
                onClick={handleVerifyOTP}
                disabled={loading}
              >
                Verify OTP
              </button>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Password *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Confirm Password *</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Phone Number *</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={!emailVerified || loading}
          className="register-btn"
        >
          {loading ? 'Processing...' : 'Register'}
        </button>
      </form>
    </div>
  );
}

export default StaffRegistration;
```

### Step 2: CSS Styling

```css
.registration-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.email-verification,
.otp-verification {
  display: flex;
  gap: 10px;
  align-items: center;
}

.email-verification input,
.otp-verification input {
  flex: 1;
}

.email-verification button,
.otp-verification button {
  padding: 10px 20px;
  background: #4863f7;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}

.email-verification button:hover,
.otp-verification button:hover {
  background: #3651d4;
}

.email-verification button:disabled,
.otp-verification button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.verified {
  color: #10b981;
  font-weight: 600;
}

.register-btn {
  width: 100%;
  padding: 12px;
  background: #4863f7;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.register-btn:hover {
  background: #3651d4;
}

.register-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

## Configuration

### Environment Variables
The following environment variable has been added to `.env`:

```env
RESEND_API_KEY=re_XDmEgB48_4nBWaP7nBrmrv5MgbLXBeJVw
```

### OTP Configuration
Default settings in `otpService.js`:
- OTP Length: 6 digits
- Expiry Time: 10 minutes
- Max Attempts: 3
- Rate Limit: 3 requests per 15 minutes

## Testing

### Test the OTP Flow

1. **Send OTP:**
```bash
curl -X POST http://localhost:4001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

2. **Verify OTP:**
```bash
curl -X POST http://localhost:4001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp": "123456"}'
```

3. **Register Staff:**
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

## Important Notes

### Production Considerations

1. **Email Domain**: Currently using `onboarding@resend.dev` for testing. For production:
   - Verify your domain at https://resend.com/domains
   - Update the `from` address in `emailService.js` to use your verified domain
   - Example: `from: 'Staffinn <noreply@yourdomain.com>'`

2. **Rate Limiting**: The current rate limit is 5 requests per second per team (Resend default). Request an increase if needed.

3. **OTP Storage**: Currently using in-memory storage. For production:
   - Consider using Redis for distributed systems
   - Implement persistent storage for audit trails

4. **Security**:
   - Never expose the Resend API key in client-side code
   - Use HTTPS in production
   - Implement CSRF protection
   - Add request logging for security audits

## Files Modified

1. **Backend/package.json** - Added `resend` dependency
2. **Backend/.env** - Added `RESEND_API_KEY`
3. **Backend/services/emailService.js** - Added Resend integration and OTP functions
4. **Backend/routes/authRoutes.js** - Added OTP endpoints
5. **Backend/controllers/authController.js** - Added sendOTP function
6. **Backend/controllers/staffController.js** - Added email verification check

## Troubleshooting

### OTP Not Received
- Check spam/junk folder
- Verify email address is correct
- Check rate limits haven't been exceeded
- Review server logs for Resend API errors

### OTP Verification Fails
- Ensure OTP hasn't expired (10 minutes)
- Check for typos in OTP entry
- Verify email address matches exactly
- Check if max attempts (3) exceeded

### Registration Fails
- Ensure email is verified first
- Check if email is already registered
- Verify all required fields are filled
- Check password meets requirements

## Support

For issues or questions:
- Check server logs: `Backend/server.js`
- Review OTP statistics: Available in `otpService.js`
- Contact: support@staffinn.com
