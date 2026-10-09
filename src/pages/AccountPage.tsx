import React, { useState } from 'react';
import { User, Order, Product } from '../types';
import { User as UserIcon, Package, Heart, LogOut, Phone, KeyRound, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { getOrderStage, STAGE_CONFIG, isWhatsAppOrder } from '../utils/orderStages';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '../lib/firebase';


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

  // Firebase Phone OTP State
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const recaptchaVerifierRef = React.useRef<RecaptchaVerifier | null>(null);

  // Feedback State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Resend Countdown Timer
  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCountdown]);

  // Clean up reCAPTCHA verifier on unmount
  React.useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {}
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const clearRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch {}
      recaptchaVerifierRef.current = null;
    }
    const container = document.getElementById('recaptcha-container');
    if (container) {
      container.innerHTML = '';
    }
  };

  const getOrCreateRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }
    const container = document.getElementById('recaptcha-container');
    if (!container) return null;
    container.innerHTML = '';

    const verifier = new RecaptchaVerifier(auth, container, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        clearRecaptcha();
      }
    });
    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  // Handler: Send Phone OTP via Firebase
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = otpPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const appVerifier = getOrCreateRecaptcha();
      if (!appVerifier) {
        throw new Error('reCAPTCHA container could not be initialized. Please refresh.');
      }

      const formattedPhone = `+91${cleanPhone}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setResendCountdown(60);
      setSuccessMsg(`SMS OTP sent to +91 ${cleanPhone}. Please enter the 6-digit code received.`);
    } catch (err: any) {
      console.error('[FIREBASE_PHONE_AUTH_SEND_ERROR]', err);
      clearRecaptcha();

      if (err?.code === 'auth/invalid-phone-number') {
        setErrorMsg('Invalid mobile number format. Please enter a valid 10-digit Indian number.');
      } else if (err?.code === 'auth/too-many-requests') {
        setErrorMsg('Too many OTP attempts. Please wait a few minutes before trying again.');
      } else if (err?.code === 'auth/quota-exceeded') {
        setErrorMsg('Daily SMS limit reached. Please contact nursery support or sign in with Google.');
      } else if (err?.code === 'auth/captcha-check-failed') {
        setErrorMsg('reCAPTCHA check failed. Please refresh the page and try again.');
      } else if (err?.code === 'auth/app-not-authorized') {
        setErrorMsg(`Domain (${window.location.hostname}) not authorized in Firebase Console -> Auth -> Settings.`);
      } else {
        setErrorMsg(err?.message || 'Failed to send OTP code. Please check your network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler: Verify Firebase Phone OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 6) {
      setErrorMsg('Please enter the full 6-digit OTP code.');
      return;
    }

    if (!confirmationResult) {
      setErrorMsg('OTP session expired. Please request a new OTP code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Confirm code with Firebase client
      const credential = await confirmationResult.confirm(cleanCode);
      const idToken = await credential.user.getIdToken();

      // 2. Exchange with VRG Express Backend for HttpOnly session cookies
      const res = await fetch('/api/auth/firebase-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setSuccessMsg('Phone verified successfully! Signing you in...');
        onLogin(data.user);
      } else {
        setErrorMsg(data.message || 'Failed to sync phone account with server.');
      }
    } catch (err: any) {
      console.error('[FIREBASE_PHONE_AUTH_VERIFY_ERROR]', err);
      if (err?.code === 'auth/invalid-verification-code') {
        setErrorMsg('Incorrect OTP code. Please check your SMS and enter the 6-digit code.');
      } else if (err?.code === 'auth/code-expired') {
        setErrorMsg('This OTP code has expired. Please click Resend OTP.');
      } else {
        setErrorMsg(err?.message || 'Failed to verify OTP code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler: Change Phone Number
  const handleChangePhone = () => {
    setOtpSent(false);
    setOtpCode('');
    setErrorMsg('');
    setSuccessMsg('');
    setConfirmationResult(null);
    clearRecaptcha();
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
            <p className="text-xs text-emerald-200">Sign in with Mobile OTP or Google to manage orders & wishlist</p>
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

            {/* PRIMARY: MOBILE OTP LOGIN */}
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number (+91):</label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="e.g. 9876543210"
                        value={otpPhone}
                        onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      A 6-digit verification code will be sent to your mobile via SMS.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpPhone.replace(/\D/g, '').length < 10}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {loading ? 'Sending OTP via SMS...' : 'Send OTP via SMS'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700 block">Enter 6-Digit OTP Code:</label>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        +91 {otpPhone.replace(/\D/g, '').slice(-10)}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        autoFocus
                        maxLength={6}
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-sm font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleChangePhone}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Change Phone
                    </button>
                    <button
                      type="button"
                      disabled={loading || resendCountdown > 0}
                      onClick={() => handleSendOtp()}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      {resendCountdown > 0 ? `Resend (${resendCountdown}s)` : 'Resend OTP'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.trim().length < 6}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>

                  <p className="text-[10px] text-slate-400 text-center leading-normal">
                    Didn't receive SMS? Cellular SMS in India can be delayed by carrier DND filters. You can use your Firebase test code (e.g. 123456) or sign in with <strong>Google</strong> below.
                  </p>
                </form>
              )}
            </div>

            {/* SECONDARY: SIGN IN WITH GOOGLE */}
            <div className="pt-2 space-y-3">
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  Or continue with Google
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
              <GoogleAuthButton
                onSuccess={(userData) => {
                  onLogin(userData);
                }}
              />
            </div>

            {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
            <div id="recaptcha-container"></div>
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">Order #{o.id}</span>
                        {isWhatsAppOrder(o) && (
                          <span className="inline-flex items-center gap-1 bg-[#25D366] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                            <WhatsAppIcon className="w-3 h-3 fill-white" />
                            <span>WhatsApp Order</span>
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isWhatsAppOrder(o)
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300 font-extrabold'
                            : (o.paymentStatus === 'FAILED' || (o.orderStatus || '').toUpperCase() === 'CANCELLED')
                            ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                            : o.paymentStatus === 'SUCCESS' 
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold' 
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {isWhatsAppOrder(o)
                            ? '💬 WHATSAPP / DIRECT ORDER'
                            : (o.paymentStatus === 'FAILED' || (o.orderStatus || '').toUpperCase() === 'CANCELLED')
                            ? (o.paymentMethod === 'RAZORPAY' ? '❌ RAZORPAY (Cancelled / Failed)' : '❌ ORDER CANCELLED')
                            : o.paymentMethod === 'COD' 
                            ? (o.paymentStatus === 'SUCCESS' ? '💵 COD PAID (Cash Collected)' : '⏳ COD PENDING (Pay on Delivery)') 
                            : (o.paymentMethod === 'QR_PAYMENT' || o.paymentMethod === 'UPI_DIRECT')
                            ? (o.paymentStatus === 'SUCCESS' ? '✅ QR PAID (Verified)' : '⏳ QR PENDING VERIFICATION')
                            : o.paymentMethod === 'RAZORPAY'
                            ? (o.paymentStatus === 'SUCCESS' ? '⚡ RAZORPAY (Paid)' : '⏳ RAZORPAY (Payment Incomplete)')
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
                        <span className={`text-sm block font-black ${
                          (o.orderStatus || '').toUpperCase() === 'CANCELLED' || o.paymentStatus === 'FAILED' ? 'text-rose-700' : 'text-emerald-800'
                        }`}>
                          ₹{o.grandTotal}
                        </span>
                        {(() => {
                          const s = (o.orderStatus || '').toUpperCase();
                          if (s === 'CANCELLED' || o.paymentStatus === 'FAILED') {
                            return (
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-block bg-rose-700 text-white shadow-2xs">
                                ❌ Cancelled
                              </span>
                            );
                          }
                          const stage = getOrderStage(o.orderStatus);
                          return (
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-block shadow-2xs ${
                              stage === 'delivered' ? 'bg-purple-700 text-white' :
                              stage === 'dispatched' ? 'bg-blue-600 text-white' :
                              stage === 'packing' ? 'bg-amber-600 text-white' :
                              'bg-emerald-700 text-white'
                            }`}>
                              {STAGE_CONFIG[stage].label}
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
