import React, { useState, useEffect } from 'react';
import { CartItem, ShippingAddress, PaymentMethod, User, SiteSettings } from '../types';
import { ShieldCheck, Truck, ArrowLeft, Check, Lock, Smartphone, Home, MapPin, Building2, CreditCard, QrCode, Upload, Copy, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { calculateDeliveryFee, INDIAN_STATES, isSouthState, isTamilNadu, isGrapeItem } from '../utils/delivery';
import { computeOrderTotals } from '../utils/orderTotals';

interface CheckoutPageProps {
  items: CartItem[];
  user?: User | null;
  onBackToCart: () => void;
  appliedCoupon: { code: string; discountAmount: number } | null;
  onPlaceOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    shippingAddress: ShippingAddress;
    paymentMethod: PaymentMethod;
    paymentProofUrl?: string;
    transactionId?: string;
    potCharge?: number;
    potOption?: string;
  }) => Promise<{ success: boolean; orderId?: string; phonepePayUrl?: string; merchantTransactionId?: string; razorpayOrderId?: string; razorpayKeyId?: string; amount?: number; message?: string }>;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  user,
  onBackToCart,
  appliedCoupon,
  onPlaceOrder
}) => {
  // Helper to safely read sessionStorage JSON
  const getSessionItem = <T,>(key: string, fallback: T): T => {
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) return JSON.parse(saved) as T;
    } catch {}
    return fallback;
  };

  const [step, setStep] = useState<1 | 2>(() => {
    const saved = getSessionItem<number>('vrg_checkout_step', 1);
    return (saved === 2 ? 2 : 1);
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  // QR Payment & Proof Upload States
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>(() => getSessionItem<string>('vrg_checkout_txnId', ''));
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  // Helper to sanitize phone input (strip Google OAuth dummy IDs)
  const getInitialPhone = (p?: string) => {
    if (!p) return '';
    const clean = p.trim();
    if (clean.startsWith('g_') || clean.includes('@') || /[a-zA-Z]/.test(clean)) return '';
    return clean;
  };

  // Clean Address State — default to empty fields
  const [address, setAddress] = useState<ShippingAddress>(() => {
    return {
      fullName: '',
      phone: '',
      alternatePhone: '',
      houseNo: '',
      street: '',
      villageTown: '',
      district: '',
      state: 'Tamil Nadu',
      pincode: '',
      landmark: '',
      addressType: 'Home'
    };
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    const saved = getSessionItem<string>('vrg_checkout_payment', '');
    if (['PHONEPE', 'RAZORPAY', 'QR_PAYMENT', 'COD'].includes(saved)) return saved as PaymentMethod;
    return 'PHONEPE';
  });
  const [selectedPot, setSelectedPot] = useState<'NONE' | '6_INCH' | '8_INCH'>(() => {
    const saved = getSessionItem<string>('vrg_checkout_pot', '');
    if (['NONE', '6_INCH', '8_INCH'].includes(saved)) return saved as 'NONE' | '6_INCH' | '8_INCH';
    return 'NONE';
  });

  // Fetch settings to check enabled payment methods
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setSiteSettings(data.settings);
          // Auto-select first available payment method ONLY if not restored from session
          const savedPayment = getSessionItem<string>('vrg_checkout_payment', '');
          if (!savedPayment) {
            if (data.settings.enableRazorpay) {
              setPaymentMethod('RAZORPAY');
            } else if (data.settings.enablePhonePe !== false) {
              setPaymentMethod('PHONEPE');
            } else if (data.settings.enableQrPayment) {
              setPaymentMethod('QR_PAYMENT');
            } else if (data.settings.enableCod !== false) {
              setPaymentMethod('COD');
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  // Persist checkout state to sessionStorage so refresh preserves progress
  useEffect(() => {
    try {
      sessionStorage.setItem('vrg_checkout_step', JSON.stringify(step));
      sessionStorage.setItem('vrg_checkout_address', JSON.stringify(address));
      sessionStorage.setItem('vrg_checkout_payment', JSON.stringify(paymentMethod));
      sessionStorage.setItem('vrg_checkout_pot', JSON.stringify(selectedPot));
      sessionStorage.setItem('vrg_checkout_txnId', JSON.stringify(transactionId));
    } catch {}
  }, [step, address, paymentMethod, selectedPot, transactionId]);

  const {
    subtotal,
    totalPlantCount,
    potUnitFee,
    potCharge,
    shippingFee: shippingCharge,
    discountAmount,
    grandTotal
  } = computeOrderTotals({
    items,
    state: address.state,
    selectedPot,
    appliedCoupon
  });

const compressImageBase64 = (dataUrl: string, maxWidth = 1000, maxHeight = 1000, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) return resolve(dataUrl);
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

  // Handle Image File Upload for QR Screenshot Proof
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('📸 INVALID FILE FORMAT\n\nPlease select a valid image file (JPG, JPEG, PNG, WebP) for the payment proof screenshot. PDF or documents are not supported.');
      e.target.value = '';
      return;
    }

    // Limit maximum raw file size to 10 MB
    const MAX_UPLOAD_MB = 10;
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      const fileMb = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMsg(`📸 SCREENSHOT SIZE LIMIT EXCEEDED (${fileMb} MB)\n\nYour selected payment screenshot is ${fileMb} MB, which exceeds the ${MAX_UPLOAD_MB} MB maximum upload limit.\n\nPlease select a smaller image or capture a quick phone screenshot from your UPI app (GPay / PhonePe) and re-upload.`);
      e.target.value = '';
      return;
    }

    setUploadingImage(true);
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const rawBase64 = (reader.result as string) || '';

      try {
        const compressedBase64 = await compressImageBase64(rawBase64);
        const finalBase64 = (compressedBase64 && compressedBase64.length > 50) ? compressedBase64 : rawBase64;
        
        // Enforce 3.5MB max base64 size limit
        const MAX_BASE64_BYTES = 3.5 * 1024 * 1024;
        if (finalBase64.length > MAX_BASE64_BYTES) {
          const compMb = (finalBase64.length / (1024 * 1024)).toFixed(1);
          setErrorMsg(`📸 IMAGE COMPRESSION OVERSIZE (${compMb} MB)\n\nThe payment proof image is too large (${compMb} MB) to upload reliably.\n\nPlease choose a normal phone screenshot under 5 MB.`);
          setPaymentProofUrl('');
          setProofPreview(null);
          e.target.value = '';
          return;
        }

        setPaymentProofUrl(finalBase64);
        setProofPreview(finalBase64);
        setPaymentMethod('QR_PAYMENT');
      } catch (err) {
        console.warn('Image compression error:', err);
        setErrorMsg('📸 COMPRESSION ERROR\n\nFailed to process screenshot image. Please choose another screenshot from your gallery.');
        e.target.value = '';
      } finally {
        setUploadingImage(false);
      }
    };
    reader.onerror = () => {
      setUploadingImage(false);
      setErrorMsg('📸 UPLOAD ERROR\n\nFailed to read image file. Please try selecting the screenshot again.');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleCopyUpi = () => {
    const upi = siteSettings?.upiId || '7200826129@ybl';
    navigator.clipboard.writeText(upi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 3000);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPincode = address.pincode.trim();
    if (!address.fullName.trim() || !address.phone.trim() || !address.houseNo.trim() || !address.street.trim() || !address.villageTown.trim() || !address.district.trim() || !cleanPincode) {
      setErrorMsg('Please fill in all required address fields (Name, Phone, House No, Street, Village/Town, District, Pincode).');
      return;
    }
    if (!/^\d{6}$/.test(cleanPincode)) {
      setErrorMsg('Pincode must be exactly 6 digits (numbers only).');
      return;
    }
    setAddress(prev => ({ ...prev, pincode: cleanPincode }));
    setErrorMsg(null);
    setStep(2);
  };

  const handleFinalPlaceOrder = async () => {
    if (!user) {
      setErrorMsg('🔒 Login or Sign Up is required to complete your purchase.');
      return;
    }

    if (uploadingImage) {
      setErrorMsg('⌛ Processing payment screenshot photo... Please wait a second.');
      return;
    }

    const effectivePaymentMethod = (paymentMethod === 'QR_PAYMENT' || Boolean(paymentProofUrl)) ? 'QR_PAYMENT' : paymentMethod;

    // MANDATORY SCREENSHOT: Only for manual QR/UPI transfers. PhonePe & Razorpay are gateway-verified.
    if (effectivePaymentMethod === 'QR_PAYMENT' || effectivePaymentMethod === 'UPI_DIRECT') {
      if (!paymentProofUrl || !paymentProofUrl.trim()) {
        setErrorMsg('📸 MANDATORY PAYMENT SCREENSHOT: You must upload your GPay / PhonePe / UPI payment screenshot before placing a QR payment order.');
        return;
      }
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const rawPhone = (address.phone || user?.phone || '').replace(/\D/g, '');
      const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
      const cleanEmail = (user?.email && user.email.includes('@')) 
        ? user.email 
        : `cust${cleanPhone || Date.now()}@veerikanursery.com`;

      const res = await onPlaceOrder({
        customerName: address.fullName || user?.name || 'Valued Customer',
        customerPhone: cleanPhone || address.phone,
        customerEmail: cleanEmail,
        shippingAddress: {
          ...address,
          phone: cleanPhone || address.phone
        },
        paymentMethod: effectivePaymentMethod,
        paymentProofUrl: effectivePaymentMethod === 'QR_PAYMENT' ? paymentProofUrl : undefined,
        transactionId: effectivePaymentMethod === 'QR_PAYMENT' ? transactionId : undefined,
        potCharge,
        potOption: selectedPot
      });

      setLoading(false);
      if (res.success) {
        // Clear checkout session data after successful order
        try {
          sessionStorage.removeItem('vrg_checkout_step');
          sessionStorage.removeItem('vrg_checkout_address');
          sessionStorage.removeItem('vrg_checkout_payment');
          sessionStorage.removeItem('vrg_checkout_pot');
          sessionStorage.removeItem('vrg_checkout_txnId');
        } catch {}

        // Handle Razorpay Checkout Popup if Razorpay order created
        if (effectivePaymentMethod === 'RAZORPAY' && res.razorpayOrderId) {
          handleRazorpayPayment(res);
          return;
        }
      } else {
        setErrorMsg(res.message || 'Failed to place order.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Checkout error occurred.');
    }
  };

  // Dynamically load Razorpay SDK script if not loaded
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (orderRes: any) => {
    setLoading(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setErrorMsg('Failed to load Razorpay SDK. Please check your internet connection and try again.');
      setLoading(false);
      return;
    }

    const options = {
      key: orderRes.razorpayKeyId || (import.meta as any).env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TPhOIp2VtwhOxH',
      amount: Math.round(orderRes.amount * 100), // in paise
      currency: 'INR',
      name: siteSettings?.businessName || 'Veerika Rose Garden',
      description: `Plant Order #${orderRes.orderId}`,
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&q=80',
      order_id: orderRes.razorpayOrderId,
      handler: async function (response: any) {
        setLoading(true);
        try {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderRes.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
          });
          const verifyData = await verifyRes.json();
          setLoading(false);
          if (verifyData.success) {
            window.location.hash = `#/order-status/${orderRes.orderId}`;
          } else {
            setErrorMsg(verifyData.message || 'Razorpay payment verification failed.');
          }
        } catch (err: any) {
          setLoading(false);
          setErrorMsg('Error verifying Razorpay payment.');
        }
      },
      prefill: {
        name: orderRes.customerName || address.fullName,
        email: orderRes.customerEmail,
        contact: orderRes.customerPhone || address.phone
      },
      theme: {
        color: '#16a34a'
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
          setErrorMsg('Razorpay payment popup was closed before completing payment.');
        }
      }
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setLoading(false);
        setErrorMsg(`Razorpay Payment Failed: ${response.error?.description || 'Transaction declined'}`);
      });
      rzp.open();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('Failed to open Razorpay payment modal.');
    }
  };

  const isRazorpayEnabled = siteSettings ? siteSettings.enableRazorpay === true : false;
  const isPhonePeEnabled = siteSettings ? siteSettings.enablePhonePe !== false : true;
  const isCodEnabled = siteSettings ? siteSettings.enableCod !== false : true;
  const isQrEnabled = siteSettings ? siteSettings.enableQrPayment !== false : true;

  const upiId = siteSettings?.upiId || '7200826129@ybl';
  const upiName = siteSettings?.upiName || 'Veerika Rose Garden Nursery';
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${grandTotal}&cu=INR`;
  const primaryQrUrl = `https://quickchart.io/qr?size=400&text=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${upiName}&cu=INR`)}`;
  const qrCodeImg = primaryQrUrl;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-32 sm:pb-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          onClick={onBackToCart}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Cart</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Veerika Nursery Verified Checkout</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 text-xs font-bold">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-800' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-emerald-700 text-white' : 'bg-slate-200'}`}>
            1
          </span>
          <span>Delivery Address</span>
        </div>

        <span className="text-slate-300">———</span>

        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-800' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-emerald-700 text-white' : 'bg-slate-200'}`}>
            2
          </span>
          <span>Payment Method</span>
        </div>
      </div>

      {!user && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 shadow-sm">
          <div>
            <h4 className="font-extrabold text-sm flex items-center gap-1.5 text-amber-950">
              🔒 Account Login Required
            </h4>
            <p className="text-xs font-medium text-amber-800">
              Please sign in or create an account to place your plant order and track your delivery.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToCart}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs whitespace-nowrap transition-colors cursor-pointer"
          >
            🔑 Go to Login / Sign Up
          </button>
        </div>
      )}

      {/* Interactive High-Priority Error Popup Modal Overlay */}
      {errorMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border-2 border-rose-500 space-y-4 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto text-rose-600 shadow-inner">
              <AlertCircle className="w-9 h-9 animate-bounce" />
            </div>
            
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
              ⚠️ Attention Required
            </h3>

            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs font-extrabold text-rose-900 leading-relaxed text-left whitespace-pre-line shadow-xs">
              {errorMsg}
            </div>

            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider"
            >
              OK, I UNDERSTAND & WILL FIX THIS
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step Form Column */}
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <form onSubmit={handleAddressSubmit} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-700" /> Village / City Shipping Address
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">House / Door No *</label>
                  <input
                    type="text"
                    required
                    value={address.houseNo}
                    onChange={(e) => setAddress({ ...address, houseNo: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Street / Gramam Name *</label>
                  <input
                    type="text"
                    required
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State *</label>
                  <select
                    required
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st} {isTamilNadu(st) ? '(₹60 base shipping)' : '(₹100 base shipping)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Village / Town *</label>
                  <input
                    type="text"
                    required
                    value={address.villageTown}
                    onChange={(e) => setAddress({ ...address, villageTown: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={address.district}
                    onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nearby Landmark (For Courier Driver)</label>
                <input
                  type="text"
                  placeholder="e.g. Near Pillaiyar Kovil / Bus Stand / Post Office"
                  value={address.landmark}
                  onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-2xl shadow-md transition-all pt-3 cursor-pointer"
              >
                PROCEED TO PAYMENT METHOD
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Select Payment Method</span>
                <button onClick={() => setStep(1)} className="text-emerald-700 hover:underline font-semibold text-xs cursor-pointer">
                  Edit Address
                </button>
              </h3>

              {/* Payment Methods */}
              <div className="space-y-3">
                {/* Razorpay Option */}
                {isRazorpayEnabled && (
                  <div
                    onClick={() => setPaymentMethod('RAZORPAY')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      paymentMethod === 'RAZORPAY'
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      <CreditCard className="w-4 h-4" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">Razorpay Online Gateway</h4>
                        <span className="bg-blue-100 text-blue-900 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                          ⚡ GPay, PhonePe, Paytm, Cards & NetBanking
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1 font-medium">
                        Pay instantly via <strong className="text-blue-900">Google Pay, PhonePe, Paytm, BHIM, Navi, Cred UPI</strong>, Cards (Visa, RuPay, Mastercard) & NetBanking.
                      </p>
                    </div>
                  </div>
                )}

                {/* PhonePe Option */}
                {isPhonePeEnabled && (
                  <div
                    onClick={() => setPaymentMethod('PHONEPE')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      paymentMethod === 'PHONEPE'
                        ? 'border-[#5f259f] bg-purple-50/60 ring-2 ring-purple-500/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-8 h-8 bg-[#5f259f] text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      पे
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">PhonePe Payment Gateway</h4>
                        <span className="bg-purple-200 text-purple-900 font-bold text-[10px] px-2 py-0.5 rounded-full">
                          100% Instant & Secure
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1">
                        Pay via PhonePe UPI, GPay, Paytm, RuPay Cards & All Indian NetBanking.
                      </p>
                    </div>
                  </div>
                )}

                {/* Scan QR Code Payment Option */}
                {isQrEnabled && (
                  <div
                    onClick={() => setPaymentMethod('QR_PAYMENT')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      paymentMethod === 'QR_PAYMENT'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      <QrCode className="w-4 h-4" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">Scan QR Code & Upload Receipt (Manual UPI)</h4>
                        <span className="bg-indigo-100 text-indigo-900 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                          📸 Mandatory Screenshot
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1">
                        Scan nursery QR using GPay/PhonePe/Paytm, pay ₹{grandTotal}, and upload successful payment screenshot.
                      </p>
                    </div>
                  </div>
                )}

                {/* Cash on Delivery Option */}
                {isCodEnabled && (
                  <div
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      paymentMethod === 'COD'
                        ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-8 h-8 bg-emerald-800 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      💵
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">Cash on Delivery (COD)</h4>
                        <span className="bg-emerald-100 text-emerald-900 font-bold text-[10px] px-2 py-0.5 rounded-full">
                          Pay on Delivery
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1">
                        Pay cash to courier driver upon plant arrival at your village/city address.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* QR PAYMENT SCANNER & PROOF UPLOADER PANEL */}
              {paymentMethod === 'QR_PAYMENT' && isQrEnabled && (
                <div className="p-5 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-3xl border-2 border-indigo-200 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs">
                    {/* QR Code Image */}
                    <div className="text-center shrink-0 space-y-2.5">
                      <div className="bg-white p-2 rounded-2xl border-2 border-indigo-200 shadow-md inline-block">
                        <img
                          src={qrCodeImg}
                          alt="Nursery UPI QR Code"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.retried) {
                              target.dataset.retried = 'true';
                              target.src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${upiName}&cu=INR`)}`;
                            }
                          }}
                          className="w-48 h-48 object-contain rounded-xl"
                        />
                      </div>
                      <p className="text-[11px] font-extrabold text-indigo-950 block">📱 Scan to pay ₹{grandTotal}</p>
                      
                      {/* Mobile Direct Pay Button */}
                      <a
                        href={upiDeepLink}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <span>⚡ Pay ₹{grandTotal} via GPay/PhonePe App</span>
                      </a>
                    </div>

                    {/* UPI Details & Copy Button */}
                    <div className="flex-1 space-y-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Merchant UPI ID:</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="bg-indigo-50 text-indigo-900 font-mono font-bold text-sm px-3 py-1.5 rounded-xl border border-indigo-200">
                            {siteSettings?.upiId || '7200826129@ybl'}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                          >
                            {copiedUpi ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Account Holder Name:</span>
                        <p className="font-bold text-slate-900 text-xs">{siteSettings?.upiName || 'Veerika Rose Garden Nursery'}</p>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-900 font-medium whitespace-pre-line">
                        {siteSettings?.qrInstructions || '1. Scan QR code using GPay, PhonePe, Paytm or any UPI app.\n2. Pay exact order total amount.\n3. Take a screenshot of successful payment receipt.\n4. Upload the screenshot below to confirm your order.'}
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Payment Screenshot Upload Box */}
                  <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-indigo-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-indigo-600" />
                        <span>Upload Paid Screenshot / Receipt *</span>
                      </label>
                      <span className="bg-rose-100 text-rose-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                        MANDATORY
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium">
                      Upload your GPay/PhonePe payment confirmation screenshot photo. Orders without receipt screenshot will be rejected.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <label className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all">
                        <Upload className="w-4 h-4" />
                        <span>{paymentProofUrl ? 'Change Receipt Photo' : 'Select Screenshot Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>

                      {proofPreview && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-xl font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <img src={proofPreview} alt="Screenshot proof" className="w-7 h-7 object-cover rounded border" />
                          <span>Screenshot Uploaded!</span>
                        </div>
                      )}
                    </div>

                    {/* UTR / Transaction ID (Optional) */}
                    <div className="pt-2">
                      <label className="font-bold text-slate-700 text-[11px] block mb-1">
                        UPI UTR / Transaction Ref No. (Optional):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 421598231049 (12-digit UTR)"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleFinalPlaceOrder}
                disabled={loading}
                className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>CONFIRM & PLACE ORDER (₹{grandTotal})</span>
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 text-xs space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>📦</span> Order Items ({items.length})
              </span>
            </h3>

            <div className="space-y-3 max-h-52 sm:max-h-64 overflow-y-auto pr-1.5 overscroll-contain scrollbar-thin">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-2.5 items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-10 h-10 object-cover rounded-lg border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate text-[11px]">{item.product.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Qty: {item.quantity} × ₹{item.product.sellingPrice}
                    </p>
                  </div>
                  <span className="font-bold text-slate-900">₹{item.product.sellingPrice * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Plant Pot Requirement Options */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <span>🪴</span> Plant Pot Requirement:
              </label>

              <div className="grid grid-cols-1 gap-2">
                {/* 1. No Pot Required */}
                <div
                  onClick={() => setSelectedPot('NONE')}
                  className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedPot === 'NONE'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="potRequirement"
                      checked={selectedPot === 'NONE'}
                      onChange={() => setSelectedPot('NONE')}
                      className="accent-emerald-700 cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold">🌱 No pot required(reduced soil)</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-700">₹0</span>
                </div>

                {/* 2. Below 6 inch */}
                <div
                  onClick={() => setSelectedPot('6_INCH')}
                  className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedPot === '6_INCH'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="potRequirement"
                      checked={selectedPot === '6_INCH'}
                      onChange={() => setSelectedPot('6_INCH')}
                      className="accent-emerald-700 cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold">🪴 below 6 inch (no delivery charges )</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-extrabold text-slate-900 block">+₹{99 * totalPlantCount}</span>
                    <span className="text-[9px] text-emerald-700 font-bold block">({totalPlantCount} {totalPlantCount === 1 ? 'pot' : 'pots'})</span>
                  </div>
                </div>

                {/* 3. Above 6 inch */}
                <div
                  onClick={() => setSelectedPot('8_INCH')}
                  className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedPot === '8_INCH'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="potRequirement"
                      checked={selectedPot === '8_INCH'}
                      onChange={() => setSelectedPot('8_INCH')}
                      className="accent-emerald-700 cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold">🪴 Above 6 inch (no delivery charges)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-extrabold text-slate-900 block">+₹{199 * totalPlantCount}</span>
                    <span className="text-[9px] text-emerald-700 font-bold block">({totalPlantCount} {totalPlantCount === 1 ? 'pot' : 'pots'})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Calculations & Emojis */}
            <div className="pt-3 border-t border-slate-200 space-y-2 text-slate-600">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 font-medium">🧾 Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{subtotal}</span>
              </div>

              {potCharge > 0 && (
                <div className="flex justify-between items-center text-emerald-800 font-semibold text-xs">
                  <span className="flex items-center gap-1">
                    🪴 Pot Charge ({selectedPot === '6_INCH' ? 'below 6 inch' : 'Above 6 inch'} × {totalPlantCount} {totalPlantCount === 1 ? 'pot' : 'pots'}):
                  </span>
                  <span className="font-bold text-emerald-700">+₹{potCharge}</span>
                </div>
              )}

              <div className="flex justify-between items-start">
                <div>
                  <span className="flex items-center gap-1 font-medium">🚚 Delivery Charge:</span>
                  <span className="text-[10px] text-slate-500 block">
                    {selectedPot !== 'NONE'
                      ? 'Free delivery included with pot selection'
                      : `${address.state} (${isTamilNadu(address.state) ? 'Tamil Nadu Rate' : 'Other South States Rate'})`}
                  </span>
                </div>
                <span className="font-bold text-slate-900">
                  {selectedPot !== 'NONE' ? (
                    <span className="text-emerald-700 font-extrabold">FREE (With Pot)</span>
                  ) : (
                    shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`
                  )}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-semibold items-center">
                  <span className="flex items-center gap-1">🏷️ Coupon ({appliedCoupon.code}):</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-300 items-center">
                <span className="flex items-center gap-1 font-extrabold">💰 Grand Total:</span>
                <span className="text-emerald-800 text-lg font-extrabold">₹{grandTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
