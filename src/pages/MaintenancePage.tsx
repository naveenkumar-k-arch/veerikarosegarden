import React, { useState } from 'react';
import { Wrench, Phone, MessageSquare, Search, RefreshCw, KeyRound, ShieldCheck, Sparkles, AlertTriangle, ArrowRight, Package } from 'lucide-react';
import { SITE_CONFIG } from '../config/siteConfig';

interface MaintenancePageProps {
  onBypass: () => void;
  onTrackOrder?: (orderId: string) => void;
  onNavigateAdmin?: () => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({
  onBypass,
  onTrackOrder,
  onNavigateAdmin
}) => {
  const config = SITE_CONFIG.maintenance;
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState(false);

  const [trackInput, setTrackInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handlePasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkeyInput.trim() === config.previewPasskey) {
      try {
        sessionStorage.setItem('vrg_maintenance_bypass', 'true');
      } catch {}
      onBypass();
    } else {
      setPasskeyError(true);
      setTimeout(() => setPasskeyError(false), 3000);
    }
  };

  const handleCheckLive = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInput.trim() && onTrackOrder) {
      onTrackOrder(trackInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative overflow-hidden font-sans">
      
      {/* Background Decorative Ambient Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.webp"
            alt="Veerika Rose Garden Logo"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover shadow-lg border border-emerald-500/30 bg-emerald-900"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <span className="text-base sm:text-lg font-black tracking-tight text-white block">
              Veerika Rose Garden
            </span>
            <span className="text-[11px] font-semibold text-emerald-400 block -mt-0.5">
              வீரிகா ரோஜா கார்டன் • Pennagaram, TN
            </span>
          </div>
        </div>

        {/* Admin/Developer Bypass button */}
        <button
          onClick={() => setShowPasskeyModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-all cursor-pointer shadow-sm"
          title="Staff / Developer Preview Access"
        >
          <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
          <span>Staff Access</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 text-center my-auto space-y-8">
        
        {/* Glowing Status Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/50 backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>⚡ System Maintenance & Improvements in Progress</span>
        </div>

        {/* Main Title & Subtitles */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            We are Updating Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-rose-400">Nursery Store</span>
          </h1>
          <p className="text-sm sm:text-base text-emerald-200/90 font-medium max-w-xl mx-auto leading-relaxed">
            {config.message}
          </p>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-lg mx-auto leading-relaxed bg-slate-900/40 py-2 px-4 rounded-xl border border-slate-800/60">
            {config.titleTamil}
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-2 text-left">
          
          {/* Card 1: WhatsApp Helpline */}
          <a
            href={`https://wa.me/${config.whatsappNumber}?text=Hello%20Veerika%20Rose%20Garden!%20I%20saw%20the%20site%20is%20temporarily%20under%20maintenance.%20I%20would%20like%20to%20place/track%20an%20order.`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-emerald-500/30 hover:border-emerald-400 transition-all duration-200 group flex items-start gap-4 shadow-xl hover:-translate-y-0.5 cursor-pointer backdrop-blur-sm"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                WhatsApp Nursery Chat
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>
              <p className="text-xs text-slate-400 mt-1">Direct order inquiries & plant catalog assistance on WhatsApp.</p>
              <span className="inline-block mt-2 text-[11px] font-bold text-emerald-400">Chat +91 72008 26129 →</span>
            </div>
          </a>

          {/* Card 2: Phone Helpline */}
          <a
            href={`tel:${config.primaryPhone.replace(/\s+/g, '')}`}
            className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-emerald-400 transition-all duration-200 group flex items-start gap-4 shadow-xl hover:-translate-y-0.5 cursor-pointer backdrop-blur-sm"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-600/20 text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
                Call Nursery Helpline
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>
              <p className="text-xs text-slate-400 mt-1">Speak directly with our farm experts in Pennagaram.</p>
              <span className="inline-block mt-2 text-[11px] font-bold text-teal-400">Call {config.primaryPhone} →</span>
            </div>
          </a>
        </div>

        {/* Quick Order Lookup Form */}
        <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl backdrop-blur-sm space-y-3 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Already placed an order? Track Live Parcel Status</span>
          </div>
          <form onSubmit={handleTrackSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Order ID (e.g. ORD-1080) or Phone"
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              className="flex-1 bg-slate-950/80 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors font-mono"
            />
            <button
              type="submit"
              disabled={!trackInput.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer shrink-0"
            >
              Track
            </button>
          </form>
        </div>

        {/* Reload / Check Status Button */}
        <div className="pt-2">
          <button
            onClick={handleCheckLive}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isRefreshing ? 'Checking system status...' : 'Check If Store Is Back Online'}</span>
          </button>
        </div>

      </main>

      {/* Footer Info */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-500 border-t border-slate-800/80 space-y-1">
        <p className="font-semibold text-slate-400">
          Veerika Rose Garden (வீரிகா ரோஜா கார்டன்) • {config.location}
        </p>
        <p className="text-[11px] text-slate-600">
          Live plant nursery & hybrid rose cultivation • Support: {config.supportEmail}
        </p>
      </footer>

      {/* Staff / Developer Passkey Modal */}
      {showPasskeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Staff & Developer Access</span>
              </div>
              <button
                onClick={() => setShowPasskeyModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter developer passkey or go to the Admin portal to continue working while maintenance mode is active.
            </p>

            <form onSubmit={handlePasskeySubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Developer Passkey</label>
                <input
                  type="password"
                  autoFocus
                  placeholder="Enter passkey (vrg2026)"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                />
              </div>

              {passkeyError && (
                <p className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Invalid passkey. Please try again.</span>
                </p>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Bypass & Open Store
                </button>
                {onNavigateAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasskeyModal(false);
                      onNavigateAdmin();
                    }}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    Admin Login
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
