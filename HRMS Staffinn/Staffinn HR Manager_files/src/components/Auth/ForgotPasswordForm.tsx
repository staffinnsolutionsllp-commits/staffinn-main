import { useState, useEffect, useRef } from 'react'
import { KeyRound, Mail, Lock, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { apiService } from '../../services/api'

type Step = 'email' | 'otp' | 'newPassword' | 'success'

interface ForgotPasswordFormProps {
  prefillEmail?: string
  onBackToLogin: () => void
}

export default function ForgotPasswordForm({ prefillEmail = '', onBackToLogin }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState(prefillEmail)
  const [emailLocked, setEmailLocked] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [canResend, setCanResend] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // On mount: fetch registered email from recruiterId in URL and lock the field
  useEffect(() => {
    const recruiterId = new URLSearchParams(window.location.search).get('recruiterId')
    if (!recruiterId) return
    apiService.checkRecruiterRegistration(recruiterId)
      .then((res: any) => {
        if (res?.data?.isRegistered && res?.data?.user?.email) {
          setEmail(res.data.user.email)
          setEmailLocked(true)
        }
      })
      .catch(() => {/* silently ignore */})
  }, [])

  // Sync prefill from login form if no locked email yet
  useEffect(() => {
    if (!emailLocked && prefillEmail) setEmail(prefillEmail)
  }, [prefillEmail, emailLocked])

  // OTP countdown timer
  useEffect(() => {
    if (step === 'otp' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
    if (step === 'otp' && countdown === 0) {
      setCanResend(true)
    }
  }, [step, countdown])

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // ── Step 1: Send OTP ────────────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiService.forgotPasswordSendOTP(email)
      if (res.success) {
        setStep('otp')
        setCountdown(600) // 10 minutes
        setCanResend(false)
        setTimeout(() => otpRefs.current[0]?.focus(), 100)
      } else {
        setError(res.message || 'Failed to send reset code. Please try again.')
      }
    } catch {
      setError('Failed to send reset code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── OTP input handling ──────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return
    const next = [...otp]
    next[index] = value
    setOtp(next)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    const next = [...otp]
    text.split('').forEach((ch, i) => { if (i < 6) next[i] = ch })
    setOtp(next)
    const focusIdx = Math.min(text.length, 5)
    otpRefs.current[focusIdx]?.focus()
  }

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await apiService.forgotPasswordVerifyOTP(email, otpString)
      if (res.success) {
        const token = res.data?.resetToken || res.resetToken
        if (!token) {
          setError('Verification failed. Please try again.')
          return
        }
        setResetToken(token)
        setStep('newPassword')
      } else {
        setError(res.message || 'Invalid or expired code. Please try again.')
      }
    } catch {
      setError('Failed to verify code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Resend OTP ──────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!canResend || loading) return
    setError('')
    setLoading(true)
    try {
      const res = await apiService.forgotPasswordResendOTP(email)
      if (res.success) {
        setOtp(['', '', '', '', '', ''])
        setCountdown(600)
        setCanResend(false)
        setTimeout(() => otpRefs.current[0]?.focus(), 100)
      } else {
        setError(res.message || 'Failed to resend code.')
      }
    } catch {
      setError('Failed to resend code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: Reset password ──────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
      setError('Password must contain at least one letter and one number.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await apiService.forgotPasswordReset(email, resetToken, newPassword)
      if (res.success) {
        setStep('success')
        setTimeout(onBackToLogin, 3000)
      } else {
        setError(res.message || 'Failed to reset password. Please try again.')
      }
    } catch {
      setError('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Password reset!</h2>
        <p className="text-sm text-gray-600">
          Your password has been changed successfully. Redirecting to login…
        </p>
        <Loader2 size={24} className="animate-spin text-blue-600 mx-auto" />
      </div>
    )
  }

  const stepTitles: Record<Step, string> = {
    email: 'Forgot password?',
    otp: 'Enter verification code',
    newPassword: 'Set new password',
    success: '',
  }

  const stepSubtitles: Record<Step, string> = {
    email: 'Enter your registered email and we\'ll send you a 6-digit reset code.',
    otp: `We sent a 6-digit code to ${email}`,
    newPassword: 'Choose a new password for your account.',
    success: '',
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={step === 'email' ? onBackToLogin : () => setStep(step === 'otp' ? 'email' : 'otp')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={14} />
        {step === 'email' ? 'Back to sign in' : 'Back'}
      </button>

      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center">
          <div className="p-3 bg-yellow-100 rounded-full">
            <KeyRound className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">{stepTitles[step]}</h2>
        <p className="mt-1 text-sm text-gray-500">{stepSubtitles[step]}</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 p-3 text-red-700 bg-red-100 border border-red-300 rounded-lg">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* ── Step 1: Email ── */}
      {step === 'email' && (
        <form className="space-y-5" onSubmit={handleSendOTP}>
          <div>
            <label htmlFor="fp-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                id="fp-email"
                type="email"
                required
                value={email}
                onChange={(e) => !emailLocked && setEmail(e.target.value)}
                readOnly={emailLocked}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                  emailLocked
                    ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                    : 'border-gray-300 bg-white'
                }`}
                placeholder="you@company.com"
              />
              {emailLocked && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">🔒</span>
              )}
            </div>
            {emailLocked && (
              <p className="text-xs text-gray-400 mt-1">Reset code will be sent to the registered email</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Sending…' : 'Send reset code'}
          </button>
          <button type="button" onClick={onBackToLogin} className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <ArrowLeft size={14} />
            Back to sign in
          </button>
        </form>
      )}

      {/* ── Step 2: OTP ── */}
      {step === 'otp' && (
        <form className="space-y-5" onSubmit={handleVerifyOTP}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">6-digit code</label>
            <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el }}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 text-center text-xl font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              ))}
            </div>
            <div className="mt-3 text-center text-sm text-gray-500">
              {countdown > 0
                ? <>Code expires in <span className="font-medium text-gray-700">{formatCountdown(countdown)}</span></>
                : <span className="text-red-500">Code expired</span>
              }
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || otp.join('').length !== 6}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Verifying…' : 'Verify code'}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || loading}
            className="w-full text-sm text-yellow-600 hover:text-yellow-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Didn't receive a code? Resend
          </button>
        </form>
      )}

      {/* ── Step 3: New password ── */}
      {step === 'newPassword' && (
        <form className="space-y-5" onSubmit={handleResetPassword}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Min. 8 characters"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showNew ? 'Hide' : 'Show'}>
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Re-enter password"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showConfirm ? 'Hide' : 'Show'}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
            <li>At least 8 characters</li>
            <li>Contains at least one letter and one number</li>
          </ul>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      )}
    </div>
  )
}
