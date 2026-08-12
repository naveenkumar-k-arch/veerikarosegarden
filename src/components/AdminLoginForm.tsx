import React, { useState } from 'react';
import { User } from '../types';
import { Eye, EyeOff, AlertCircle, Sprout, ArrowLeft } from 'lucide-react';

interface AdminLoginFormProps {
  onLoginSuccess: (user: User) => void;
  onBackToStore: () => void;
}

export const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ onLoginSuccess, onBackToStore }) => {
  const [username, setUsername] = useState(() => localStorage.getItem('vrg_admin_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Try API login first
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier: username, password })
      });
      const data = await res.json();

      if (data.success && data.user && (data.user.role === 'SUPER_ADMIN' || data.user.role === 'ADMIN' || data.user.role === 'MANAGER')) {
        localStorage.setItem('vrg_user', JSON.stringify(data.user));
        if (rememberMe) {
          localStorage.setItem('vrg_admin_email', data.user.email);
          localStorage.setItem('vrg_admin_role', data.user.role);
          localStorage.setItem('vrg_remember_admin', 'true');
        }
        setLoading(false);
        onLoginSuccess(data.user);
        return;
      } else {
        setError(data.message || 'Invalid Admin Username or Password');
        setLoading(false);
        return;
      }
    } catch {
      setError('Unable to reach server. Please check your internet connection.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-6 px-4">
      {/* Top Header matching mobile view */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between py-3 border-b border-slate-200/80 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
            <Sprout className="w-5 h-5 text-emerald-700" />
          </div>
          <span className="text-base font-black tracking-wider text-emerald-900 uppercase">
            VRG NURSERY
          </span>
        </div>

        <button
          onClick={onBackToStore}
          className="text-xs font-bold text-slate-600 hover:text-emerald-800 flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="Return to store"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Store</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-extrabold text-slate-900">Admin Login</h2>
          <p className="text-xs text-slate-500 font-medium">Sign in to continue</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdminSubmit} className="space-y-5">
          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Username / Email</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username or email"
              className="w-full px-3.5 py-3 bg-slate-50/70 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:border-emerald-700 transition-all"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-3 bg-slate-50/70 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:border-emerald-700 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700 border-slate-300 cursor-pointer accent-emerald-800"
            />
            <label htmlFor="rememberMe" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
              Remember me
            </label>
          </div>

          {/* Login Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#14532d] hover:bg-[#0f3d21] active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center py-4">
        <p className="text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()} VRG Nursery
        </p>
      </div>
    </div>
  );
};

