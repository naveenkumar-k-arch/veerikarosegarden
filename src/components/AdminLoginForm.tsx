import React, { useState } from 'react';
import { User } from '../types';
import { Lock, Mail, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

interface AdminLoginFormProps {
  onLoginSuccess: (user: User) => void;
  onBackToStore: () => void;
}

export const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ onLoginSuccess, onBackToStore }) => {
  const [username, setUsername] = useState('admin@veerikarosegarden.com');
  const [password, setPassword] = useState('admin123');
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
        onLoginSuccess(data.user);
        return;
      }
    } catch {
      // Fallback local verification for demo & dev environment
    }

    // Local Verification for Admin Credentials
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (
      (cleanUser === 'admin@veerikarosegarden.com' || cleanUser === '7200826129' || cleanUser === 'admin' || cleanUser === 'kavinkumar.m30@gmail.com') &&
      (cleanPass === 'admin123' || cleanPass === 'VeerikaRose@2026' || cleanPass === 'admin')
    ) {
      const adminUser: User = {
        id: 'usr-admin-01',
        name: 'Veerika Nursery Admin',
        email: 'admin@veerikarosegarden.com',
        phone: '7200826129',
        role: 'SUPER_ADMIN',
        createdAt: new Date().toISOString()
      };
      onLoginSuccess(adminUser);
    } else {
      setError('Invalid Admin Username or Password');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <div className="bg-white rounded-3xl border-2 border-emerald-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 text-white p-8 text-center space-y-3 relative">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto border border-white/20 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-emerald-300" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Veerika Rose Garden</h2>
          <p className="text-xs text-emerald-200 font-medium">Administrator Access Portal & Nursery Control</p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleAdminSubmit} className="p-7 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Admin Username / Email:</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@veerikarosegarden.com"
                className="w-full pl-9 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Admin Password:</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>



          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-800 hover:to-green-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating Admin...' : 'Sign In to Admin Dashboard'} <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onBackToStore}
            className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-xs font-semibold text-center block transition-colors"
          >
            ← Return to Store
          </button>
        </form>
      </div>
    </div>
  );
};
