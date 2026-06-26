import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Users, BarChart3, Loader2 } from 'lucide-react';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.isFirstLogin) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: ShieldCheck, text: 'Secure, role-based access control' },
    { icon: BarChart3,   text: 'Real-time attendance & payroll insights' },
    { icon: Users,       text: 'Complete HR self-service in one place' },
  ];

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        {/* Brand */}
        <div className="relative flex items-center gap-3 animate-fadeInLeft">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
            <span className="text-white font-black text-xl tracking-tight">S</span>
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-none">StaffInn</p>
            <p className="text-indigo-200 text-xs mt-0.5 font-medium">Employee Portal</p>
          </div>
        </div>

        {/* Headline */}
        <div className="relative space-y-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div>
            <h2 className="text-white text-4xl font-bold leading-tight tracking-tight">
              Powering Smarter<br />Workplaces
            </h2>
            <p className="text-indigo-200 text-base mt-3 leading-relaxed">
              Your complete HR self-service platform — manage attendance, leaves, payroll and more from one place.
            </p>
          </div>
          <div className="space-y-3">
            {features.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-white" />
                </div>
                <p className="text-indigo-100 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="relative text-indigo-300 text-xs animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          © {new Date().getFullYear()} StaffInn · All rights reserved
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md animate-slideUp">

          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-base">S</span>
            </div>
            <span className="text-slate-900 font-bold text-lg">StaffInn</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
              <p className="text-slate-500 text-sm mt-1">Sign in to your employee account</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">⚠</span>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock size={16} className="text-slate-400" />
                  </div>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Forgot */}
              <div className="text-right">
                <a href="/forgot-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                  Forgot your password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in…
                  </>
                ) : 'Sign in'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Secured by StaffInn · Enterprise HR Platform
          </p>
        </div>
      </div>
    </div>
  );
}
