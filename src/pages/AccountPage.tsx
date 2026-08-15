import React, { useState } from 'react';
import { User, Order, Product } from '../types';
import { User as UserIcon, Package, Heart, LogOut, Phone, Mail, Lock, KeyRound, Sparkles, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GoogleAuthButton } from '../components/GoogleAuthButton';

interface AccountPageProps {
  user: User | null;
  orders: Order[];
  wishlist: Product[];
  onLogin: (user: User) => void;
  onLogout: () => void;
  onViewOrder: (orderId: string) => void;
  onAddToCart: (p: Product) => void;
  initialTab?: string;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  user,
  orders,
  wishlist,
  onLogin,
  onLogout,
  onViewOrder,
  onAddToCart,
  initialTab = 'orders'
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Authentication Form States
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | 'OTP' | 'FORGOT'>('LOGIN');
  
  // Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // OTP State
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);


  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);

  // Feedback State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check for reset token in URL parameters or hash link on mount
  React.useEffect(() => {
    try {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : search);
      const tokenFromUrl = params.get('token') || params.get('resetToken');
      if (tokenFromUrl) {
        setResetToken(tokenFromUrl);
        setAuthMode('FORGOT');
        setResetStep(2);
        setSuccessMsg('Reset code detected from link. Enter your new password below.');
      }
    } catch {}
  }, []);

  // Clear messages on mode switch
  const switchMode = (mode: 'LOGIN' | 'REGISTER' | 'OTP' | 'FORGOT') => {
    setAuthMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Handler: Login with Password
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();
      if (data.success && data.user) {
        onLogin(data.user);
      } else {
        setErrorMsg(data.message || 'Invalid email/phone or password.');
      }
    } catch (err: any) {
      setErrorMsg('Authentication error. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Register New Account
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setSuccessMsg(data.message || 'Account created! Signing you in...');
        setTimeout(async () => {
          // Auto login
          const loginRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ identifier: regEmail || regPhone, password: regPassword })
          });
          const loginData = await loginRes.json();
          if (loginData.success && loginData.user) {
            onLogin(loginData.user);
          }
        }, 1000);
      } else {
        const errorDetails = data.errors && Array.isArray(data.errors) && data.errors.length > 0
          ? `: ${data.errors.join(' ')}`
          : '';
        setErrorMsg((data.message || 'Registration failed.') + errorDetails);
      }
    } catch (err: any) {
      setErrorMsg('Registration error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Send Phone OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpPhone.trim()) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: otpPhone.trim() })
      });

      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setSuccessMsg(data.message || `OTP sent to +91 ${otpPhone.trim()}. Please enter the 6-digit code received.`);
      } else {
        setErrorMsg(data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setErrorMsg('Error requesting OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: otpPhone.trim(), code: otpCode.trim() })
      });

      const data = await res.json();
      if (data.success && data.user) {
        onLogin(data.user);
      } else {
        setErrorMsg(data.message || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      setErrorMsg('Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Request Password Reset
  const handleForgotPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await res.json();
      if (data.success) {
        setResetStep(2);
        setSuccessMsg('If your email is registered, a password reset code has been sent. Check your inbox.');
      } else {
        setErrorMsg(data.message || 'Error processing request.');
      }
    } catch (err) {
      setErrorMsg('Network error requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Reset Password
  const handleResetPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Password updated successfully! Please sign in with your new password.');
        setTimeout(() => switchMode('LOGIN'), 1500);
      } else {
        setErrorMsg(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setErrorMsg('Error resetting password.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-emerald-900 text-white p-6 text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-800 rounded-2xl flex items-center justify-center text-emerald-100 mx-auto border border-emerald-700/50">
              <UserIcon className="w-7 h-7 text-emerald-300" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Veerika Rose Garden</h2>
            <p className="text-xs text-emerald-200">Sign in or create an account to manage nursery orders & wishlist</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-slate-200 text-xs font-bold bg-slate-50">
            <button
              onClick={() => switchMode('LOGIN')}
              className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                authMode === 'LOGIN' ? 'border-emerald-700 text-emerald-800 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => switchMode('OTP')}
              className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                authMode === 'OTP' ? 'border-emerald-700 text-emerald-800 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Phone OTP
            </button>
            <button
              onClick={() => switchMode('REGISTER')}
              className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                authMode === 'REGISTER' ? 'border-emerald-700 text-emerald-800 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Register
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Feedback Alerts */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Google Quick Sign-In Option on Top */}
            <div className="space-y-2">
              <GoogleAuthButton
                onSuccess={(userData) => {
                  onLogin(userData);
                }}
              />
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-semibold uppercase">Or continue with</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
            </div>

            {/* FORM MODE: PASSWORD LOGIN */}
            {authMode === 'LOGIN' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email or Mobile Number:</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. name@email.com or 9876543210"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Password:</label>
                    <button
                      type="button"
                      onClick={() => switchMode('FORGOT')}
                      className="text-[11px] text-emerald-700 hover:underline font-bold"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? 'Authenticating...' : 'Sign In with Password'}
                </button>

              </form>
            )}

            {/* FORM MODE: PHONE OTP LOGIN */}
            {authMode === 'OTP' && (
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number (+91):</label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 9876543210"
                          value={otpPhone}
                          onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpPhone.length < 10}
                      className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {loading ? 'Sending OTP...' : 'Send OTP Code'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Enter 6-Digit OTP Code:</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-sm font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        Change Phone
                      </button>
                      <button
                        type="submit"
                        disabled={loading || otpCode.length < 6}
                        className="w-2/3 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors"
                      >
                        {loading ? 'Verifying...' : 'Verify & Sign In'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* FORM MODE: REGISTER */}
            {authMode === 'REGISTER' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kavitha Selvan"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number:</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email Address:</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. customer@gmail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Create Password:</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Min 8 chars, 1 uppercase, 1 symbol, 1 number"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Password requirements: 8+ chars, uppercase, lowercase, number, symbol (!@#$)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {loading ? 'Creating Account...' : 'Create Nursery Account'}
                </button>
              </form>
            )}

            {/* FORM MODE: FORGOT PASSWORD */}
            {authMode === 'FORGOT' && (
              <div className="space-y-4">
                {resetStep === 1 ? (
                  <form onSubmit={handleForgotPass} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Registered Email Address:</label>
                      <input
                        type="email"
                        required
                        placeholder="name@gmail.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => switchMode('LOGIN')}
                        className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-2/3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
                      >
                        {loading ? 'Processing...' : 'Get Reset Token'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPass} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Reset Code / Token:</label>
                      <input
                        type="text"
                        required
                        placeholder="Paste 64-char reset token or click reset link from email"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Enter the reset code sent to your registered email address or click your reset link.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">New Password:</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        placeholder="Enter new strong password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
                    >
                      {loading ? 'Updating Password...' : 'Reset Password'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* User Header Profile */}
      <div className="bg-emerald-900 text-white p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-700 rounded-2xl flex items-center justify-center text-emerald-100 font-bold text-xl border border-emerald-500/30">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-xs text-emerald-200">Email: {user.email || 'N/A'} • Phone: +91 {user.phone}</p>
            <span className="inline-block mt-1 bg-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-300 uppercase">
              Role: {user.role}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-bold rounded-xl border border-emerald-600 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Account Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'orders' ? 'border-emerald-700 text-emerald-800 font-extrabold' : 'border-transparent text-slate-500'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`px-5 py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'wishlist' ? 'border-emerald-700 text-emerald-800 font-extrabold' : 'border-transparent text-slate-500'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Wishlist ({wishlist.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-2">
              <p className="text-slate-500 text-xs">No orders placed yet under this account.</p>
            </div>
          ) : (
            orders.map((o) => (
                <div
                  key={o.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-600 shadow-2xs hover:shadow-md transition-all space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer" onClick={() => onViewOrder(o.id)}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Order #{o.id}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          o.paymentStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold' : o.paymentStatus === 'FAILED' ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold' : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {o.paymentMethod === 'COD' 
                            ? (o.paymentStatus === 'SUCCESS' ? '💵 COD PAID (Cash Collected)' : '⏳ COD PENDING (Pay on Delivery)') 
                            : (o.paymentMethod === 'QR_PAYMENT' || o.paymentMethod === 'UPI_DIRECT')
                            ? (o.paymentStatus === 'SUCCESS' ? '✅ QR PAID (Verified)' : o.paymentStatus === 'FAILED' ? '❌ QR REJECTED (Unverified)' : '⏳ QR PENDING VERIFICATION')
                            : o.paymentMethod === 'RAZORPAY'
                            ? (o.paymentStatus === 'SUCCESS' ? '⚡ RAZORPAY (Paid)' : '⏳ PAYMENT PENDING')
                            : (o.paymentStatus === 'SUCCESS' ? '✅ ONLINE PAID' : `⏳ ${o.paymentMethod || 'PAYMENT'} PENDING`)}
                        </span>
                      </div>
                      <p className="text-slate-500 font-mono">
                        Placed: {new Date(o.createdAt).toLocaleDateString()} • {o.items?.length || 0} Item{(o.items?.length || 0) > 1 ? 's' : ''}
                      </p>
                      <p className="text-slate-700 font-semibold">
                        Delivery Address: {typeof o.shippingAddress === 'string' ? o.shippingAddress : `${o.shippingAddress?.villageTown || ''}, ${o.shippingAddress?.district || ''}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right font-bold space-y-1">
                        <span className="text-emerald-800 text-sm block font-black">₹{o.grandTotal}</span>
                        {(() => {
                          const s = (o.orderStatus || '').toUpperCase();
                          const isDelivered = s === 'DELIVERED' || s === 'COMPLETED';
                          const isDispatched = s === 'DISPATCHED' || s === 'SHIPPED' || s === 'COURIER' || s === 'OUT_FOR_DELIVERY';
                          const isPacking = s === 'PROCESSING' || s === 'PACKING' || s === 'PACKED';
                          const isCancelled = s === 'CANCELLED';

                          return (
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-block ${
                              isDelivered ? 'bg-emerald-700 text-white shadow-2xs' :
                              isDispatched ? 'bg-blue-600 text-white shadow-2xs' :
                              isPacking ? 'bg-purple-700 text-white shadow-2xs' :
                              isCancelled ? 'bg-rose-700 text-white shadow-2xs' :
                              'bg-amber-600 text-white shadow-2xs'
                            }`}>
                              {isDelivered ? '4. Delivered' :
                               isDispatched ? '3. Dispatched' :
                               isPacking ? '2. Nursery Packing' :
                               isCancelled ? '❌ Cancelled' :
                               '1. Confirmed'}
                            </span>
                          );
                        })()}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>

                  {/* Ordered Product Showcase */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 border-b border-slate-200/50 pb-1">
                      <span>🛍️ Ordered Products:</span>
                      <button onClick={() => onViewOrder(o.id)} className="text-emerald-700 hover:underline text-[11px] cursor-pointer">View Tracking & Details →</button>
                    </div>
                    <div className="space-y-1.5">
                      {o.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200/70">
                          <div className="flex items-center gap-2.5">
                            <img src={item.image || '/products/eq.jpeg'} alt={item.name} className="w-9 h-9 object-cover rounded-lg border shrink-0" />
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{item.name}</p>
                              {item.tamilName && <p className="text-emerald-800 text-[10px] font-medium">{item.tamilName}</p>}
                            </div>
                          </div>
                          <div className="text-right text-xs shrink-0">
                            <span className="font-bold text-slate-700">Qty: {item.quantity}</span>
                            <span className="text-emerald-800 font-bold block">₹{item.price * item.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      {activeTab === 'wishlist' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.length === 0 ? (
            <p className="col-span-3 text-xs text-slate-500 italic text-center py-8">Your wishlist is currently empty.</p>
          ) : (
            wishlist.map((p) => (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <img src={p.images[0]} alt={p.name} className="w-full h-36 object-cover rounded-xl border" />
                <div>
                  <h4 className="font-bold text-slate-900">{p.name}</h4>
                  <p className="text-emerald-800 font-semibold">{p.tamilName}</p>
                  <p className="font-bold text-slate-900 mt-1">₹{p.sellingPrice}</p>
                </div>
                <button
                  onClick={() => onAddToCart(p)}
                  className="w-full py-2 bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Add to Cart
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
