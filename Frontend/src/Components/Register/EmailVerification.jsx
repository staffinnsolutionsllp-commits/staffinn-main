/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import './EmailVerification.css';

const EmailVerification = ({ 
  email, 
  onVerificationComplete, 
  onResendOTP, 
  onCancel,
  isVisible = true 
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer for OTP expiry
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setError('OTP has expired. Please request a new one.');
    }
  }, [timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCooldown]);

  // Initialize resend availability after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanResend(true);
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes + ':' + remainingSeconds.toString().padStart(2, '0');
  };

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^[0-9]$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById('otp-' + (index + 1));
      if (nextInput) nextInput.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById('otp-' + (index - 1));
      if (prevInput) {
        prevInput.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById('otp-' + (index - 1));
      if (prevInput) prevInput.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      const nextInput = document.getElementById('otp-' + (index + 1));
      if (nextInput) nextInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setError('');
      
      // Auto-verify pasted OTP
      handleVerifyOTP(pastedData);
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otpCode
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Email verified successfully!');
        setTimeout(() => {
          onVerificationComplete(true);
        }, 1500);
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        const firstInput = document.getElementById('otp-0');
        if (firstInput) firstInput.focus();
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || resendCooldown > 0) return;

    setCanResend(false);
    setResendCooldown(60); // 1 minute cooldown
    setError('');
    setOtp(['', '', '', '', '', '']);
    setTimeLeft(600); // Reset timer to 10 minutes

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('New OTP sent to your email!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
        setCanResend(true);
        setResendCooldown(0);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Failed to send OTP. Please try again.');
      setCanResend(true);
      setResendCooldown(0);
    }

    if (onResendOTP) {
      onResendOTP();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    handleVerifyOTP(otpCode);
  };

  if (!isVisible) return null;

  return (
    <div className="email-verification-overlay">
      <div className="email-verification-container">
        <div className="verification-header">
          <div className="verification-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#4863f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22,6 12,13 2,6" stroke="#4863f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>Verify Your Email</h2>
          <p className="verification-subtitle">
            We've sent a 6-digit verification code to
          </p>
          <p className="email-display">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="verification-form">
          <div className="otp-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={'otp-' + index}
                type="text"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={'otp-input' + (error ? ' error' : '') + (success ? ' success' : '')}
                maxLength="1"
                disabled={isVerifying || success}
                autoComplete="off"
              />
            ))}
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠</span>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <span className="success-icon">✓</span>
              {success}
            </div>
          )}

          <div className="verification-timer">
            {timeLeft > 0 ? (
              <p>Code expires in: <span className="timer">{formatTime(timeLeft)}</span></p>
            ) : (
              <p className="expired">Code has expired</p>
            )}
          </div>

          <div className="verification-actions">
            <button
              type="submit"
              className={'verify-btn' + (isVerifying ? ' loading' : '')}
              disabled={isVerifying || otp.some(digit => digit === '') || success}
            >
              {isVerifying ? (
                <>
                  <span className="loading-spinner"></span>
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>

            <div className="resend-section">
              <p>Didn't receive the code?</p>
              <button
                type="button"
                className={'resend-btn' + (!canResend || resendCooldown > 0 ? ' disabled' : '')}
                onClick={handleResendOTP}
                disabled={!canResend || resendCooldown > 0}
              >
                {resendCooldown > 0 
                  ? 'Resend in ' + resendCooldown + 's'
                  : 'Resend Code'
                }
              </button>
            </div>
          </div>

          <button
            type="button"
            className="cancel-btn"
            onClick={onCancel}
            disabled={isVerifying}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailVerification;