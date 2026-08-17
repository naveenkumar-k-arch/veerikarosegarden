import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, ArrowLeft, ArrowRight, ShoppingBag, Check, Truck, MapPin, Tag,
  ShieldCheck, Package, CheckCircle2, CreditCard, QrCode, Copy,
  CheckCircle, Upload, AlertCircle, Image as ImageIcon, Trash2, Plus, Minus,
  Download, ExternalLink, RefreshCw, FileText
} from 'lucide-react';
import { CartItem, ShippingAddress, PaymentMethod, User, SiteSettings, Product } from '../types';
import { INDIAN_STATES, isTamilNadu, getDeliveryChargeForOption, DeliveryOptionType } from '../utils/delivery';
import { computeOrderTotals } from '../utils/orderTotals';
import { CourierSelectionSection, CourierPartnerType } from './CourierSelectionSection';
import { PlantProtectivePackingSection, PackingOptionType } from './PlantProtectivePackingSection';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────────────────

interface MobileCheckoutFlowProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  user: User | null;
  appliedCoupon: { code: string; discountAmount: number } | null;
  onApplyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  onRemoveCoupon: () => void;
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
    packingCharge?: number;
    packingOption?: string;
    courierName?: string;
    courierDistrict?: string;
    courierBranch?: string;
    shippingCharge?: number;
  }) => Promise<{
    success: boolean;
    orderId?: string;
    razorpayOrderId?: string;
    razorpayKeyId?: string;
    amount?: number;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    message?: string;
  }>;
  onOrderConfirmed?: (confirmedOrder: any) => void;
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onNavigateToAccount: () => void;
}

const DELIVERY_TERMS = [
  '🌿 Plants are live/semi-dormant saplings. Minor leaf stress during transit is normal and temporary.',
  '📦 Orders are normally dispatched within 5–6 working days after confirmation.',
  '🚚 After dispatch, delivery takes 1–2 working days within Tamil Nadu.',
  '📸 For QR/UPI payment orders, screenshot upload is mandatory. No screenshot = order rejected.',
  '💧 We pack plants with moisture-retaining material to survive courier transit safely.',
  '🪴 Pot orders include free delivery. No-pot orders attract state-based delivery charges.',
  '🔄 No refund/return once the plant is dispatched. Live plants are non-returnable.',
  '📞 For any issue, contact us via WhatsApp within 24 hours of delivery with unboxing video.',
  '🏡 We deliver to villages, towns, and metro cities across all listed states.',
  '✅ By placing an order, you agree to these terms and our full nursery policies.',
];

// ─────────────────────────────────────────────────────────────────────────────
// Step Progress Bar
// ─────────────────────────────────────────────────────────────────────────────

const STEP_LABELS = [
  'Cart', 'Summary', 'Address', 'Items', 'Terms', 'Payment', 'Confirmed', 'Receipt', 'Track'
];

const StepBar: React.FC<{ step: number }> = ({ step }) => {
  const pct = Math.round(((step - 1) / 8) * 100);
  return (
    <div className="px-4 pt-2 pb-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-emerald-700">Step {step} of 9 · {STEP_LABELS[step - 1]}</span>
        <span className="text-[10px] font-bold text-slate-500">{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Image compression helper
// ─────────────────────────────────────────────────────────────────────────────

const compressImageBase64 = (dataUrl: string, maxW = 1000, maxH = 1000, q = 0.75): Promise<string> =>
  new Promise((resolve) => {
    if (!dataUrl?.startsWith('data:image')) return resolve(dataUrl);
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxW || height > maxH) {
        if (width > height) { height = Math.round((height * maxW) / width); width = maxW; }
        else { width = Math.round((width * maxH) / height); height = maxH; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', q)); }
      else resolve(dataUrl);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const MobileCheckoutFlow: React.FC<MobileCheckoutFlowProps> = ({
  isOpen,
  onClose,
  items,
  user,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  onPlaceOrder,
  onOrderConfirmed,
  onUpdateQuantity,
  onRemoveItem,
  onNavigateToAccount,
}) => {
  // ── Step state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('vrg_checkout_step') || localStorage.getItem('vrg_checkout_step');
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num) && num >= 1 && num <= 9) {
          if (num >= 7) return num;
          if (items.length > 0) return num;
        }
      }
    } catch {}
    return 1;
  });
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);
  const isPaymentInProgressRef = useRef(false);
  const paymentCompletedRef = useRef(false);
  const [hasReturnedFromUpi, setHasReturnedFromUpi] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem('vrg_checkout_step', String(step));
      localStorage.setItem('vrg_checkout_step', String(step));
    } catch {}
  }, [step]);

  // Eagerly pre-load Razorpay SDK in background as soon as checkout modal is opened
  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript().catch(() => {});
    }
  }, [isOpen]);

  // Check returning from UPI Lite / UPI app
  useEffect(() => {
    const checkUpiReturn = () => {
      try {
        const raw = localStorage.getItem('vrg_pending_upi_payment');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.timestamp && (Date.now() - parsed.timestamp < 3600000)) {
            setHasReturnedFromUpi(true);
            setPaymentMethod('QR_PAYMENT');
          }
        }
      } catch {}
    };

    checkUpiReturn();
    window.addEventListener('focus', checkUpiReturn);
    document.addEventListener('visibilitychange', checkUpiReturn);
    return () => {
      window.removeEventListener('focus', checkUpiReturn);
      document.removeEventListener('visibilitychange', checkUpiReturn);
    };
  }, []);

  // Go to step with browser history push
  const goTo = useCallback((next: number, replace = false) => {
    if (animating) return;
    const isForward = next > step;
    setDirection(isForward ? 'forward' : 'back');
    setAnimating(true);
    setStep(next);

    try {
      sessionStorage.setItem('vrg_checkout_step', String(next));
      localStorage.setItem('vrg_checkout_step', String(next));
    } catch {}

    const stateObj = {
      vrgCart: true,
      cartStep: next
    };

    if (replace) {
      window.history.replaceState(stateObj, '', window.location.pathname);
    } else {
      window.history.pushState(stateObj, '', window.location.pathname);
    }

    setTimeout(() => {
      setAnimating(false);
    }, 220);
  }, [animating, step]);

  // Handle close cart with clean history
  const handleClose = useCallback(() => {
    if (isPaymentInProgressRef.current || paymentCompletedRef.current) return;
    try {
      sessionStorage.removeItem('vrg_checkout_step');
      localStorage.removeItem('vrg_checkout_step');
    } catch {}
    if (window.history.state && window.history.state.vrgCart) {
      window.history.back();
    } else {
      onClose();
    }
  }, [onClose]);

  // Handle in-app back buttons with history sync
  const handleGoBack = useCallback((fallbackStep?: number) => {
    if (isPaymentInProgressRef.current || paymentCompletedRef.current) return;
    if (window.history.state && window.history.state.vrgCart && typeof window.history.state.cartStep === 'number' && window.history.state.cartStep > 1) {
      window.history.back();
    } else if (step > 1) {
      goTo(fallbackStep !== undefined ? fallbackStep : step - 1);
    } else {
      handleClose();
    }
  }, [step, goTo, handleClose]);

  // Popstate listener for mobile 9-step checkout flow
  useEffect(() => {
    if (!isOpen) return;

    // Push initial step state if not already set
    if (!window.history.state || !window.history.state.vrgCart) {
      window.history.pushState({
        vrgCart: true,
        cartStep: step
      }, '', window.location.pathname);
    }

    const handleCartPopState = (e: PopStateEvent) => {
      if (isPaymentInProgressRef.current || paymentCompletedRef.current) {
        // App was switched during Razorpay payment or order is confirmed — do NOT pop back to Step 1!
        return;
      }
      const state = e.state;
      if (state && state.vrgCart && typeof state.cartStep === 'number') {
        const targetStep = state.cartStep;
        setDirection(targetStep > step ? 'forward' : 'back');
        setStep(targetStep);
      } else {
        // User popped before the cart opened
        onClose();
      }
    };

    window.addEventListener('popstate', handleCartPopState);
    return () => window.removeEventListener('popstate', handleCartPopState);
  }, [isOpen, step, onClose]);

  // ── Summary step state ─────────────────────────────────────────────────────
  const [previewState, setPreviewState] = useState('Tamil Nadu');
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Address state ──────────────────────────────────────────────────────────
  const [address, setAddress] = useState<ShippingAddress>(() => {
    try {
      const saved = localStorage.getItem('vrg_checkout_address');
      if (saved) {
        const p = JSON.parse(saved);
        if (p && typeof p === 'object') {
          return {
            fullName: p.fullName || user?.name || '',
            phone: p.phone || user?.phone || '',
            alternatePhone: p.alternatePhone || '',
            houseNo: p.houseNo || '',
            street: p.street || '',
            villageTown: p.villageTown || '',
            district: p.district || '',
            state: p.state || 'Tamil Nadu',
            pincode: p.pincode || '',
            landmark: p.landmark || '',
            addressType: p.addressType || 'Home',
          };
        }
      }
    } catch {}
    return {
      fullName: user?.name || '',
      phone: user?.phone || '',
      alternatePhone: '',
      houseNo: '',
      street: '',
      villageTown: '',
      district: '',
      state: 'Tamil Nadu',
      pincode: '',
      landmark: '',
      addressType: 'Home',
    };
  });
  const [addrError, setAddrError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (address.fullName || address.phone || address.houseNo || address.pincode) {
        localStorage.setItem('vrg_checkout_address', JSON.stringify(address));
      }
    } catch {}
  }, [address]);

  // ── Delivery / Packing Selection ──────────────────────────────────────────
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOptionType>(() => {
    try {
      const saved = sessionStorage.getItem('vrg_checkout_delivery_option') as any;
      if (saved === 'FULL_SOIL_6INCH' || saved === 'FULL_SOIL_8INCH' || saved === 'FULL_SOIL' || saved === 'REDUCED_SOIL') return saved;
    } catch {}
    return 'REDUCED_SOIL';
  });
  const [courierPartner, setCourierPartner] = useState<CourierPartnerType>(() => {
    try {
      const saved = sessionStorage.getItem('vrg_checkout_courier_partner');
      if (saved === 'METTUR_PARCEL' || saved === 'PROFESSIONAL_COURIER') return saved;
    } catch {}
    return 'PROFESSIONAL_COURIER';
  });
  const [metturState, setMetturState] = useState<string>('Tamil Nadu');
  const [metturDistrict, setMetturDistrict] = useState<string>('Salem');
  const [metturBranch, setMetturBranch] = useState<string>('Salem Main Hub (Shevapet)');
  const [selectedPacking, setSelectedPacking] = useState<PackingOptionType>(() => {
    try {
      const saved = sessionStorage.getItem('vrg_checkout_packing');
      if (saved === 'STANDARD' || saved === 'EXTRA_SECURE' || saved === 'MAX_PROTECTION') return saved;
    } catch {}
    return 'STANDARD';
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('vrg_checkout_delivery_option', deliveryOption);
      sessionStorage.setItem('vrg_checkout_courier_partner', courierPartner);
      sessionStorage.setItem('vrg_checkout_packing', selectedPacking);
    } catch {}
  }, [deliveryOption, courierPartner, selectedPacking]);

  // Total plant count (including plants bundled inside combos)
  const subtotal = items.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0);
  const totalPlantCount = items.reduce((sum, i) => {
    const isCombo = i.isCombo || i.product.id.startsWith('combo-') || (i.product as any).isCombo;
    const bundleCount = (i.comboProducts && i.comboProducts.length > 0)
      ? i.comboProducts.length
      : ((i.product as any).comboProducts?.length || 1);
    return sum + (isCombo ? bundleCount * i.quantity : i.quantity);
  }, 0);

  // Check if cart has free delivery (e.g. combo bundle offers)
  const hasAllFreeDelivery = items.length > 0 && items.every(i => i.freeDelivery === true || (i.product as any).freeDelivery === true);
  const chargeablePlantCount = items.reduce((sum, i) => {
    const isFree = i.freeDelivery === true || (i.product as any).freeDelivery === true;
    if (isFree) return sum;
    const isCombo = i.isCombo || i.product.id.startsWith('combo-') || (i.product as any).isCombo;
    const bundleCount = (i.comboProducts && i.comboProducts.length > 0)
      ? i.comboProducts.length
      : ((i.product as any).comboProducts?.length || 1);
    return sum + (isCombo ? bundleCount * i.quantity : i.quantity);
  }, 0);

  // Auto fallback if option becomes unavailable due to state or plant count changes
  useEffect(() => {
    const inTN = isTamilNadu(address.state);
    const isFullSoil = deliveryOption === 'FULL_SOIL_6INCH' || deliveryOption === 'FULL_SOIL_8INCH' || deliveryOption === 'FULL_SOIL';
    if (isFullSoil && (!inTN || totalPlantCount > 5)) {
      setDeliveryOption('REDUCED_SOIL');
    }
    if (courierPartner === 'METTUR_PARCEL' && totalPlantCount < 3) {
      setCourierPartner('PROFESSIONAL_COURIER');
      setDeliveryOption('REDUCED_SOIL');
    }
  }, [totalPlantCount, deliveryOption, courierPartner, address.state]);

  const baseShipping = getDeliveryChargeForOption(
    courierPartner === 'METTUR_PARCEL' ? 'METTUR_PARCEL' : deliveryOption,
    chargeablePlantCount,
    address.state
  );
  const shippingCharge = hasAllFreeDelivery ? 0 : (chargeablePlantCount === 0 ? 0 : baseShipping);
  const packingCharge = courierPartner === 'METTUR_PARCEL'
    ? (selectedPacking === 'EXTRA_SECURE' ? 10 : selectedPacking === 'MAX_PROTECTION' ? 15 : 0)
    : 0;
  const potCharge = 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, subtotal + shippingCharge + packingCharge - discountAmount);

  // ── Terms ──────────────────────────────────────────────────────────────────
  const [termsAccepted, setTermsAccepted] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('vrg_checkout_terms') === 'true';
    } catch {}
    return false;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('vrg_checkout_terms', String(termsAccepted));
    } catch {}
  }, [termsAccepted]);

  // ── Payment ────────────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(() => {
    try {
      const saved = sessionStorage.getItem('vrg_checkout_payment_method');
      if (saved) return saved as PaymentMethod;
    } catch {}
    return null;
  });
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    if (paymentMethod) {
      try {
        sessionStorage.setItem('vrg_checkout_payment_method', paymentMethod);
      } catch {}
    }
  }, [paymentMethod]);

  // ── Order result ───────────────────────────────────────────────────────────
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('vrg_placed_order_id') || null;
    } catch {}
    return null;
  });
  const [fetchedOrder, setFetchedOrder] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);

  // scroll to top on step change
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    if ((step === 7 || step === 8) && placedOrderId) {
      handleFetchOrderForTracking();
    }
  }, [step, placedOrderId]);

  // fetch site settings
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.settings) {
          setSiteSettings(d.settings);
          const s = d.settings;
          // Auto-select first genuinely enabled payment method
          if (s.enableRazorpay) {
            setPaymentMethod('RAZORPAY');
          } else if (s.enablePhonePe !== false) {
            setPaymentMethod('PHONEPE');
          } else if (s.enableQrPayment !== false) {
            setPaymentMethod('QR_PAYMENT');
          } else if (s.enableCod !== false) {
            setPaymentMethod('COD');
          }
        }
      })
      .catch(() => {});
  }, []);

  // restore step when opened if saved in storage
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = sessionStorage.getItem('vrg_checkout_step') || localStorage.getItem('vrg_checkout_step');
        if (saved) {
          const num = parseInt(saved, 10);
          if (!isNaN(num) && num >= 1 && num <= 9) {
            setStep(num);
          }
        }
      } catch {}
    }
  }, [isOpen]);

  // fetch order on step 7
  useEffect(() => {
    if (step === 7 && placedOrderId && !fetchedOrder) {
      fetch(`/api/orders/${placedOrderId}`)
        .then(r => r.json())
        .then(d => { if (d.success && d.order) setFetchedOrder(d.order); })
        .catch(() => {});
    }
  }, [step, placedOrderId]);

  if (!isOpen) return null;

  // Summary Step preview calculation
  const summaryTotals = computeOrderTotals({ items, state: previewState, appliedCoupon });

  const upiId = siteSettings?.upiId || '7200826129@ybl';
  const upiName = siteSettings?.upiName || 'Veerika Rose Garden Nursery';
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${grandTotal}&cu=INR`;
  const qrCodeUrl = `https://quickchart.io/qr?size=300&text=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${upiName}&cu=INR`)}`;

  const isPhonePeEnabled = siteSettings ? siteSettings.enablePhonePe !== false : false;
  const isCodEnabled = siteSettings ? siteSettings.enableCod !== false : true;
  const isQrEnabled = siteSettings ? siteSettings.enableQrPayment !== false : true;
  const isRazorpayEnabled = siteSettings ? siteSettings.enableRazorpay === true : false;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMsg(null);
    const res = await onApplyCoupon(couponCode.trim());
    setCouponLoading(false);
    if (res.success) { setCouponMsg({ type: 'success', text: res.message }); setCouponCode(''); }
    else setCouponMsg({ type: 'error', text: res.message });
  };

  const handleAddressNext = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = address.pincode.trim();
    if (!address.fullName.trim() || !address.phone.trim() || !address.houseNo.trim() ||
      !address.street.trim() || !address.villageTown.trim() || !address.district.trim() || !cleanPin) {
      setAddrError('Please fill all required fields (Name, Phone, House No, Street, Village, District, Pincode).');
      return;
    }
    if (!/^\d{6}$/.test(cleanPin)) {
      setAddrError('Pincode must be exactly 6 digits.');
      return;
    }
    setAddrError(null);
    setAddress(prev => ({ ...prev, pincode: cleanPin }));
    goTo(4);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setOrderError('Please select a valid image file.'); e.target.value = ''; return; }
    if (file.size > 10 * 1024 * 1024) { setOrderError('Image too large. Max 10MB.'); e.target.value = ''; return; }
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const compressed = await compressImageBase64(reader.result as string);
        if (compressed.length > 3.5 * 1024 * 1024) { setOrderError('Image too large after compression. Try a smaller screenshot.'); return; }
        setPaymentProofUrl(compressed);
        setProofPreview(compressed);
        setPaymentMethod('QR_PAYMENT');
      } finally { setUploadingImage(false); }
    };
    reader.onerror = () => { setUploadingImage(false); setOrderError('Failed to read image.'); };
    reader.readAsDataURL(file);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 3000);
  };

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
    isPaymentInProgressRef.current = true;
    paymentCompletedRef.current = false;
    setLoading(true);
    setOrderError(null);

    // Save pending payment in localStorage so return from GPay / app switch is automatically reconciled
    try {
      localStorage.setItem('vrg_pending_razorpay_order', JSON.stringify({
        orderId: orderRes.orderId,
        razorpayOrderId: orderRes.razorpayOrderId,
        amount: orderRes.amount || grandTotal,
        timestamp: Date.now()
      }));
    } catch {}

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      isPaymentInProgressRef.current = false;
      setOrderError('Failed to load Razorpay SDK. Please check your internet connection and try again.');
      setLoading(false);
      return;
    }

    // Auto status poller: Polls server in background while user completes payment in UPI app / Razorpay
    const pollInterval = setInterval(async () => {
      try {
        const check = await fetch(`/api/orders/${orderRes.orderId}`);
        const d = await check.json();
        if (d.success && d.order && (d.order.paymentStatus === 'SUCCESS' || d.order.orderStatus === 'CONFIRMED')) {
          clearInterval(pollInterval);
          try { localStorage.removeItem('vrg_pending_razorpay_order'); } catch {}
          paymentCompletedRef.current = true;
          isPaymentInProgressRef.current = false;
          setLoading(false);
          setOrderError(null);
          setPlacedOrderId(orderRes.orderId);
          setFetchedOrder(d.order);
          if (onOrderConfirmed) {
            onOrderConfirmed(d.order);
          }
          goTo(7, true);
        }
      } catch {}
    }, 2500);

    // Timeout poller after 2 minutes
    setTimeout(() => clearInterval(pollInterval), 120000);

    const options: any = {
      key: orderRes.razorpayKeyId || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_live_TQ5xDdZB7QWIn2',
      amount: Math.round((orderRes.amount || grandTotal) * 100), // in paise
      currency: 'INR',
      name: siteSettings?.businessName || 'Veerika Rose Garden',
      description: `Plant Order #${orderRes.orderId}`,
      image: '/products/double-delight.jpeg',
      order_id: orderRes.razorpayOrderId,
      callback_url: `${window.location.origin}/api/razorpay/callback?orderId=${orderRes.orderId}`,
      modal: {
        ondismiss: async () => {
          if (paymentCompletedRef.current) return;
          // Final background check on dismiss in case payment finished just as modal closed
          try {
            const check = await fetch(`/api/orders/${orderRes.orderId}`);
            const d = await check.json();
            if (d.success && d.order && (d.order.paymentStatus === 'SUCCESS' || d.order.orderStatus === 'CONFIRMED')) {
              clearInterval(pollInterval);
              paymentCompletedRef.current = true;
              isPaymentInProgressRef.current = false;
              setLoading(false);
              setOrderError(null);
              setPlacedOrderId(orderRes.orderId);
              setFetchedOrder(d.order);
              if (onOrderConfirmed) {
                onOrderConfirmed(d.order);
              }
              goTo(7, true);
              return;
            }
          } catch {}

          isPaymentInProgressRef.current = false;
          setLoading(false);
          setOrderError('Payment was not completed. Your items are safe in cart — tap Pay Now to try again.');
        }
      },
      handler: async function (response: any) {
        clearInterval(pollInterval);
        paymentCompletedRef.current = true;
        isPaymentInProgressRef.current = true;
        setLoading(true);
        setOrderError(null);
        setPlacedOrderId(orderRes.orderId);
        goTo(7, true);

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
          isPaymentInProgressRef.current = false;
          if (verifyData.success) {
            paymentCompletedRef.current = true;
            if (onOrderConfirmed) {
              onOrderConfirmed(verifyData.order || { id: orderRes.orderId, grandTotal: orderRes.amount });
            }
            setPlacedOrderId(orderRes.orderId);
            goTo(7, true);
          } else {
            paymentCompletedRef.current = false;
            setOrderError(verifyData.message || 'Razorpay payment verification failed.');
          }
        } catch (err: any) {
          setLoading(false);
          isPaymentInProgressRef.current = false;
          paymentCompletedRef.current = false;
          setOrderError('Error verifying Razorpay payment with server.');
        }
      },
      prefill: {
        name: orderRes.customerName || address.fullName || user?.name || 'Customer',
        email: orderRes.customerEmail || user?.email || '',
        contact: orderRes.customerPhone || address.phone || user?.phone || ''
      },
      theme: {
        color: '#15803d'
      }
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', async function (response: any) {
        if (paymentCompletedRef.current) return;
        isPaymentInProgressRef.current = false;
        setLoading(false);
        setOrderError(`Razorpay Payment Failed: ${response.error?.description || 'Transaction declined'}`);
      });
      rzp.open();
    } catch (err: any) {
      isPaymentInProgressRef.current = false;
      setLoading(false);
      setOrderError('Failed to open Razorpay payment modal.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) { setOrderError('🔒 Login required to place an order.'); return; }
    if (!paymentMethod) {
      setOrderError('⚠️ Please select a payment method before placing your order.');
      return;
    }
    if (paymentMethod === 'PHONEPE' && !isPhonePeEnabled) {
      setOrderError('⚠️ PhonePe payment is currently disabled. Please select QR Code or another payment option.');
      return;
    }
    if (paymentMethod === 'RAZORPAY' && !isRazorpayEnabled) {
      setOrderError('⚠️ Razorpay payment is currently disabled. Please select another payment option.');
      return;
    }
    if (paymentMethod === 'COD' && !isCodEnabled) {
      setOrderError('⚠️ Cash on Delivery is currently disabled. Please select another payment option.');
      return;
    }
    if (paymentMethod === 'QR_PAYMENT' && !isQrEnabled) {
      setOrderError('⚠️ Scan QR payment is currently disabled. Please select another payment option.');
      return;
    }
    if (uploadingImage) { setOrderError('Please wait — processing payment screenshot.'); return; }
    const effectivePM: PaymentMethod = (paymentMethod === 'QR_PAYMENT' || Boolean(paymentProofUrl)) ? 'QR_PAYMENT' : paymentMethod;
    if (effectivePM === 'QR_PAYMENT' && !paymentProofUrl) {
      setOrderError('📸 Please upload payment screenshot before placing order.');
      return;
    }
    setLoading(true);
    setOrderError(null);
    try {
      const rawPhone = (address.phone || user?.phone || '').replace(/\D/g, '');
      const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
      const cleanEmail = (user?.email?.includes('@')) ? user.email : `cust${cleanPhone}@veerikanursery.com`;
      const courierLabel = courierPartner === 'METTUR_PARCEL'
        ? 'Mettur Parcel Service'
        : deliveryOption === 'FULL_SOIL_6INCH'
          ? 'Professional Courier (6" Full Soil)'
          : deliveryOption === 'FULL_SOIL_8INCH'
            ? 'Professional Courier (8" Full Soil)'
            : deliveryOption === 'FULL_SOIL'
              ? 'Professional Courier (6" Full Soil)'
              : 'Professional Courier (Reduced Soil)';

      const res = await onPlaceOrder({
        customerName: address.fullName || user?.name || 'Customer',
        customerPhone: cleanPhone,
        customerEmail: cleanEmail,
        shippingAddress: { ...address, phone: cleanPhone },
        paymentMethod: effectivePM,
        paymentProofUrl: effectivePM === 'QR_PAYMENT' ? paymentProofUrl : undefined,
        transactionId: effectivePM === 'QR_PAYMENT' ? transactionId : undefined,
        potCharge: 0,
        potOption: deliveryOption,
        packingCharge,
        packingOption: selectedPacking,
        courierName: courierLabel,
        courierDistrict: courierPartner === 'METTUR_PARCEL' ? metturDistrict : undefined,
        courierBranch: courierPartner === 'METTUR_PARCEL' ? metturBranch : undefined,
        shippingCharge: shippingCharge
      });
      setLoading(false);
      if (res.success) {
        try {
          sessionStorage.removeItem('vrg_checkout_step');
          localStorage.removeItem('vrg_checkout_step');
          localStorage.removeItem('vrg_pending_upi_payment');
        } catch {}
        if (effectivePM === 'RAZORPAY' && res.razorpayOrderId) {
          handleRazorpayPayment(res);
          return;
        }
        setPlacedOrderId(res.orderId || null);
        try {
          if (res.orderId) sessionStorage.setItem('vrg_placed_order_id', res.orderId);
        } catch {}
        goTo(7);
      } else {
        setOrderError(res.message || 'Failed to place order. Please try again.');
      }
    } catch (err: any) {
      setLoading(false);
      setOrderError(err.message || 'An error occurred. Please retry.');
    }
  };

  const handleFetchOrderForTracking = async () => {
    if (!placedOrderId) return;
    setTrackLoading(true);
    try {
      const res = await fetch(`/api/orders/${placedOrderId}`);
      const d = await res.json();
      if (d.success && d.order) setFetchedOrder(d.order);
    } finally { setTrackLoading(false); }
  };

  const handleDownloadReceipt = () => {
    const order = fetchedOrder || {
      id: placedOrderId || 'ORD-1001',
      createdAt: new Date().toISOString(),
      customerName: address.fullName || user?.name || 'Valued Customer',
      customerPhone: address.phone || user?.phone || '',
      shippingAddress: address,
      items: items.map(i => ({ name: i.product.name, price: i.product.sellingPrice, quantity: i.quantity })),
      subtotal,
      shippingCharge,
      potCharge,
      grandTotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'CONFIRMED' : 'SUCCESS',
    };

    const printHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt_${order.id}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; max-width: 600px; margin: 0 auto; line-height: 1.5; font-size: 13px; }
    .no-print { display: flex; justify-content: flex-end; margin-bottom: 16px; }
    .btn-pdf { background: #15803d; color: #ffffff; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .header { text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 16px; margin-bottom: 20px; }
    .brand { font-size: 22px; font-weight: 900; color: #14532d; margin: 0; }
    .subbrand { font-size: 12px; color: #16a34a; font-weight: 700; margin: 2px 0 0 0; }
    .contact { font-size: 11px; color: #64748b; margin-top: 6px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; p: 12px; padding: 12px; }
    .box-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .table th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 800; border-radius: 6px; }
    .table td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
    .grand-row td { border-top: 2px solid #0f172a; font-size: 15px; font-weight: 900; color: #14532d; padding-top: 12px; }
    .badge { display: inline-block; background: #dcfce7; color: #15803d; font-weight: 800; padding: 2px 8px; border-radius: 6px; font-size: 10px; }
    .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()" class="btn-pdf">📄 Save as PDF / Print Receipt</button>
  </div>

  <div class="header">
    <h1 class="brand">🌸 Veerika Rose Garden</h1>
    <p class="subbrand">Official Order Receipt & Tax Invoice</p>
    <div class="contact">Pennagaram, Dharmapuri, Tamil Nadu - 636810 | Phone: +91 72008 26129</div>
  </div>

  <div class="grid">
    <div class="box">
      <div class="box-title">Order Details</div>
      <strong>Order ID:</strong> ${order.id}<br>
      <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN')}<br>
      <strong>Payment:</strong> ${order.paymentMethod}<br>
      <strong>Status:</strong> <span class="badge">${order.paymentStatus || 'CONFIRMED'}</span>
    </div>
    <div class="box">
      <div class="box-title">Delivery Address</div>
      <strong>${order.shippingAddress?.fullName || order.customerName}</strong><br>
      ${order.shippingAddress?.houseNo ? order.shippingAddress.houseNo + ', ' : ''}${order.shippingAddress?.street || ''}<br>
      ${order.shippingAddress?.villageTown || ''}, ${order.shippingAddress?.district || ''}<br>
      ${order.shippingAddress?.state || 'Tamil Nadu'} - ${order.shippingAddress?.pincode || ''}<br>
      📱 ${order.shippingAddress?.phone || order.customerPhone}
    </div>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>Plant Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${(order.items || []).map((i: any) => `
        <tr>
          <td><strong>${i.name}</strong></td>
          <td style="text-align: center;">${i.quantity}</td>
          <td style="text-align: right;">₹${i.price * i.quantity}</td>
        </tr>
      `).join('')}
      <tr>
        <td colspan="2" style="text-align: right; color: #64748b;">Subtotal:</td>
        <td style="text-align: right; font-weight: 700;">₹${order.subtotal || subtotal}</td>
      </tr>
      <tr>
        <td colspan="2" style="text-align: right; color: #64748b;">Delivery Charge:</td>
        <td style="text-align: right; font-weight: 700;">₹${order.shippingCharge ?? shippingCharge}</td>
      </tr>
      ${(order.potCharge || potCharge) > 0 ? `
        <tr>
          <td colspan="2" style="text-align: right; color: #64748b;">Pot Charge:</td>
          <td style="text-align: right; font-weight: 700;">+₹${order.potCharge || potCharge}</td>
        </tr>
      ` : ''}
      <tr class="grand-row">
        <td colspan="2" style="text-align: right;">Grand Total:</td>
        <td style="text-align: right;">₹${order.grandTotal || grandTotal}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    🌱 Dispatch: 5-6 working days | Delivery: 1-2 days after dispatch<br>
    Thank you for choosing Veerika Rose Garden Nursery!
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 200);
    };
  </script>
</body>
</html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(printHtml);
      printWin.document.close();
    } else {
      // Text fallback if popups disabled
      const content = `VRG NURSERY — ORDER RECEIPT\nOrder ID: ${order.id}\nGrand Total: ₹${order.grandTotal || grandTotal}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `VRG-Receipt-${order.id}.txt`;
      a.click(); URL.revokeObjectURL(url);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Shared UI Components
  // ─────────────────────────────────────────────────────────────────────────

  const ProceedBtn: React.FC<{ label: string; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean }> =
    ({ label, onClick, type = 'button', disabled }) => (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
      >
        {disabled && type === 'button' ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>{label}</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    );

  const Header: React.FC<{ title: string; subtitle?: string; showBack?: boolean; onBack?: () => void }> =
    ({ title, subtitle, showBack = true, onBack }) => (
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-slate-900 text-base leading-tight">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showBack && onBack && (
              <button onClick={onBack} className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[990] flex flex-col bg-white"
      style={{
        top: '54px',
        height: 'calc(100dvh - 54px)',
        touchAction: 'pan-y'
      }}
    >
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 shrink-0" />

      {/* Step progress */}
      <div className="shrink-0 border-b border-slate-100 bg-white">
        <StepBar step={step} />
      </div>

      {/* Scrollable content — animated slide per step */}
      <div
        ref={scrollRef}
        key={step}
        className="flex-1 overflow-y-auto overscroll-contain pb-8"
        style={{
          animation: animating
            ? (direction === 'forward'
                ? 'slideOutLeft 0.22s ease forwards'
                : 'slideOutRight 0.22s ease forwards')
            : (direction === 'forward'
                ? 'slideInRight 0.25s ease'
                : 'slideInLeft 0.25s ease'),
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
          @keyframes slideInLeft {
            from { transform: translateX(-100%); opacity: 0; }
            to   { transform: translateX(0);     opacity: 1; }
          }
          @keyframes slideOutLeft {
            from { transform: translateX(0);    opacity: 1; }
            to   { transform: translateX(-100%); opacity: 0; }
          }
          @keyframes slideOutRight {
            from { transform: translateX(0);   opacity: 1; }
            to   { transform: translateX(100%); opacity: 0; }
          }
        `}</style>

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 1 — Your Shopping Cart
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col min-h-full">
            <Header
              title="Your Shopping Cart"
              subtitle="Review your plant order items before proceeding to secure checkout"
              showBack={false}
            />

            {/* Cart items */}
            <div className="flex-1 px-4 py-2 space-y-3">
              {items.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-10 h-10 text-emerald-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Your cart is empty</p>
                  <button onClick={handleClose} className="px-5 py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer">
                    Browse Plants
                  </button>
                </div>
              ) : (
                items.map((item) => {
                  const isCombo = item.isCombo || item.product.id.startsWith('combo-') || item.product.categoryId === 'combos';
                  const hasFreeDelivery = item.freeDelivery === true || (item.product as any).freeDelivery === true;

                  return (
                    <div key={item.product.id} className="flex gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 items-center">
                      <div className="relative shrink-0">
                        <img
                          src={item.product.images?.[0] || '/products/double-delight.jpeg'}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-xl border border-slate-200"
                        />
                        {isCombo && (
                          <span className="absolute -top-1.5 -left-1.5 bg-amber-600 text-white font-black text-[8px] px-1.5 py-0.2 rounded-full uppercase">
                            {item.comboBadge || 'COMBO'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{item.product.name}</h4>
                        {item.product.tamilName && (
                          <p className="text-[11px] text-emerald-700 font-medium">{item.product.tamilName}</p>
                        )}
                        {hasFreeDelivery && (
                          <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded inline-flex items-center gap-0.5 mt-0.5">
                            <Truck className="w-2.5 h-2.5" /> Free Delivery
                          </span>
                        )}
                        {isCombo && (
                          <div className="bg-amber-50/90 border border-amber-300/80 rounded-xl p-2 mt-1.5 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-bold text-amber-900 border-b border-amber-200/60 pb-1">
                              <span>🌿 Included in Bundle ({(item.comboProducts || (item.product as any).comboProducts || []).length} Plants):</span>
                            </div>
                            <div className="space-y-1">
                              {(item.comboProducts || (item.product as any).comboProducts || []).map((p: Product, idx: number) => (
                                <div key={p.id || idx} className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-amber-200/80 text-[10px]">
                                  {p.images?.[0] ? (
                                    <img src={p.images[0]} alt={p.name} className="w-5 h-5 rounded object-cover border border-slate-200 shrink-0" />
                                  ) : (
                                    <span className="text-xs shrink-0">🌿</span>
                                  )}
                                  <span className="truncate flex-1 font-semibold text-slate-800">{p.name}</span>
                                  <span className="text-[9px] font-mono text-emerald-800 font-bold shrink-0">₹{p.sellingPrice}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <p className="text-xs font-extrabold text-slate-800">₹{item.product.sellingPrice}</p>
                          {item.product.mrp > item.product.sellingPrice && (
                            <span className="text-[10px] text-slate-400 line-through">₹{item.product.mrp}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button onClick={() => onRemoveItem(item.product.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-center border border-slate-200 rounded-xl bg-white">
                          <button onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)} className="p-1.5 text-slate-500 hover:text-emerald-700 cursor-pointer">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-extrabold text-slate-900 font-mono">{item.quantity}</span>
                          <button onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= 20} className="p-1.5 text-slate-500 hover:text-emerald-700 disabled:opacity-30 cursor-pointer">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-4 pb-6 pt-3 border-t border-slate-100 bg-white space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">🌱 {totalPlantCount} Live Plant{totalPlantCount !== 1 ? 's' : ''} ({items.length} cart item{items.length !== 1 ? 's' : ''})</span>
                  <span className="font-extrabold text-slate-900">₹{items.reduce((s, i) => s + i.product.sellingPrice * i.quantity, 0)}</span>
                </div>
                <ProceedBtn label="PROCEED TO CHECKOUT" onClick={() => goTo(2)} />
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Secure & Encrypted Checkout</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 2 — Apply Coupon / Discounts
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col min-h-full">
            <Header title="Apply Coupon" subtitle="Add discount or voucher code to your order" onBack={() => handleGoBack(1)} />

            <div className="flex-1 px-4 py-3 space-y-4">
              {/* Coupon */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2.5">
                <label className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  Have a Coupon / Promo Code?
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
                    <span className="font-bold text-emerald-800">✅ {appliedCoupon.code} (−₹{appliedCoupon.discountAmount} Applied)</span>
                    <button onClick={onRemoveCoupon} className="text-rose-600 font-bold hover:underline text-xs cursor-pointer">Remove</button>
                  </div>
                ) : (
                  <form onSubmit={handleCouponSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <button type="submit" disabled={couponLoading || !couponCode.trim()} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl cursor-pointer">
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </form>
                )}
                {couponMsg && (
                  <p className={`text-[11px] font-bold ${couponMsg.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {couponMsg.text}
                  </p>
                )}
              </div>
            </div>

            <div className="px-4 pb-6 pt-3 border-t border-slate-100 bg-white">
              {!user && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold">
                  🔒 Login required to checkout.{' '}
                  <button onClick={() => { handleClose(); onNavigateToAccount(); }} className="underline font-bold cursor-pointer">Login / Sign Up →</button>
                </div>
              )}
              <ProceedBtn label="PROCEED TO DELIVERY ADDRESS" onClick={() => goTo(3)} />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 3 — Delivery Address
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <form onSubmit={handleAddressNext} className="flex flex-col min-h-full">
            <Header title="Delivery Address" subtitle="Village / City Shipping Address" onBack={() => handleGoBack(2)} />

            <div className="flex-1 px-4 py-3 space-y-3">
              {addrError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {addrError}
                </div>
              )}

              {[
                { label: 'Full Name *', field: 'fullName', type: 'text', placeholder: 'Your full name' },
                { label: 'Mobile Number (WhatsApp) *', field: 'phone', type: 'tel', placeholder: '10-digit mobile number' },
                { label: 'House / Door No *', field: 'houseNo', type: 'text', placeholder: 'e.g. 12A' },
                { label: 'Street / Gramam Name *', field: 'street', type: 'text', placeholder: 'Street or village name' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">{label}</label>
                  <input
                    type={type}
                    required
                    placeholder={placeholder}
                    value={(address as any)[field]}
                    onChange={(e) => setAddress(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              ))}

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">State *</label>
                <select
                  required
                  value={address.state}
                  onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                >
                  {INDIAN_STATES.map(st => (
                    <option key={st} value={st}>{st} {isTamilNadu(st) ? '(₹60 base shipping)' : '(₹100 base shipping)'}</option>
                  ))}
                </select>
              </div>

              {[
                { label: 'Pincode *', field: 'pincode', type: 'text', placeholder: '6-digit pincode' },
                { label: 'Village / Town *', field: 'villageTown', type: 'text', placeholder: 'Village or town name' },
                { label: 'District *', field: 'district', type: 'text', placeholder: 'District name' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">{label}</label>
                  <input
                    type={type}
                    required={field !== 'landmark'}
                    placeholder={placeholder}
                    value={(address as any)[field]}
                    onChange={(e) => setAddress(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              ))}

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Nearby Landmark (For Courier Driver)</label>
                <input
                  type="text"
                  placeholder="e.g. Near Pillaiyar Kovil / Bus Stand / Post Office"
                  value={address.landmark || ''}
                  onChange={(e) => setAddress(prev => ({ ...prev, landmark: e.target.value }))}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="px-4 pb-6 pt-3 border-t border-slate-100 bg-white">
              <ProceedBtn label="PROCEED TO COURIER & PACKING" type="submit" />
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 4 — Courier & Protective Packing
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="flex flex-col min-h-full">
            <Header title="🚚 Courier & Packing Selection" subtitle="Choose your courier partner and plant protective packaging." onBack={() => handleGoBack(3)} />

            <div className="flex-1 px-4 py-3 space-y-4">
              {/* Items Summary */}
              <div className="space-y-2">
                {items.map(item => {
                  const isCombo = item.isCombo || item.product.id.startsWith('combo-') || item.product.categoryId === 'combos';
                  const comboPlants = item.comboProducts || (item.product as any).comboProducts || [];
                  const plantCount = comboPlants.length || (isCombo ? 4 : 1);

                  return (
                    <div key={item.product.id} className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex gap-3 items-center">
                        <img src={item.product.images?.[0] || '/products/double-delight.jpeg'} alt={item.product.name} className="w-12 h-12 object-cover rounded-xl border shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[11px] text-slate-900 truncate">{item.product.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {isCombo ? `Qty: ${item.quantity} Bundle (${plantCount * item.quantity} Plants)` : `Qty: ${item.quantity} Plant${item.quantity > 1 ? 's' : ''}`}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-xs text-slate-900 shrink-0">₹{item.product.sellingPrice * item.quantity}</span>
                      </div>

                      {isCombo && comboPlants.length > 0 && (
                        <div className="bg-emerald-50/70 rounded-xl p-2 border border-emerald-100/80">
                          <p className="text-[9px] font-extrabold text-emerald-900 mb-1 flex items-center gap-1">
                            <span>🌿 Included {comboPlants.length} Live Plants:</span>
                          </p>
                          <div className="grid grid-cols-2 gap-1">
                            {comboPlants.map((cp: Product, idx: number) => (
                              <div key={cp.id || idx} className="flex items-center gap-1 text-[9px] text-slate-700 font-medium bg-white px-1.5 py-1 rounded-md border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="truncate">{cp.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Courier Partner Selection & Mettur Parcel Branch Availability */}
              <CourierSelectionSection
                selectedCourier={courierPartner}
                onChangeCourier={(c) => {
                  setCourierPartner(c);
                  if (c === 'METTUR_PARCEL') {
                    setDeliveryOption('METTUR_PARCEL');
                  } else {
                    setDeliveryOption('REDUCED_SOIL');
                    setSelectedPacking('STANDARD');
                  }
                }}
                shippingState={address.state}
                shippingDistrict={address.district}
                metturState={metturState}
                onChangeMetturState={setMetturState}
                metturDistrict={metturDistrict}
                onChangeMetturDistrict={setMetturDistrict}
                metturBranch={metturBranch}
                onChangeMetturBranch={setMetturBranch}
                totalPlantCount={totalPlantCount}
                deliveryOption={deliveryOption}
                onChangeDeliveryOption={setDeliveryOption}
                hasFreeDelivery={hasAllFreeDelivery}
              />

              {/* Plant Protective Packing Selection ("Pick Protective Packing for Your Plants' Journey") — INSIDE METTUR SERVICE ONLY */}
              {courierPartner === 'METTUR_PARCEL' && (
                <PlantProtectivePackingSection
                  items={items}
                  selectedPacking={selectedPacking}
                  onChangePacking={setSelectedPacking}
                />
              )}

              {/* Delivery State Rate Preview Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
                <p className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Truck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>🚚 Delivery State Rate Preview:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800">🌿 Tamil Nadu</span>
                    <span className="font-black text-emerald-800">₹60 base shipping</span>
                  </div>
                  <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800">🌿 Karnataka</span>
                    <span className="font-black text-emerald-800">₹100 base shipping</span>
                  </div>
                  <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800">🌿 Kerala</span>
                    <span className="font-black text-emerald-800">₹100 base shipping</span>
                  </div>
                  <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800">🌿 Andhra Pradesh</span>
                    <span className="font-black text-emerald-800">₹100 base shipping</span>
                  </div>
                  <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800">🌿 Puducherry</span>
                    <span className="font-black text-emerald-800">₹100 base shipping</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-medium pt-0.5">
                  💡 Reduced Soil: ₹60 (TN) / ₹100 (Other states) for 1st plant + ₹20 for each additional plant.
                </p>
              </div>

              {/* Price summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">🧾 Subtotal:</span>
                  <span className="font-semibold text-slate-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="flex items-center gap-1">🚚 Delivery Charge:</span>
                    <span className="text-[10px] text-slate-400 block">
                      {hasAllFreeDelivery
                        ? '100% Free Doorstep Delivery Included'
                        : courierPartner === 'METTUR_PARCEL'
                          ? `Mettur Parcel (${metturDistrict || 'Tamil Nadu'})`
                          : deliveryOption === 'FULL_SOIL_6INCH'
                            ? 'Professional Courier (6" Full Soil - ₹140/plant)'
                            : deliveryOption === 'FULL_SOIL_8INCH'
                              ? 'Professional Courier (8" Full Soil - ₹190/plant)'
                              : deliveryOption === 'FULL_SOIL'
                                ? 'Professional Courier (6" Full Soil - ₹140/plant)'
                                : 'Professional Courier (Reduced Soil)'}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {shippingCharge === 0 ? (
                      <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">FREE</span>
                    ) : (
                      `₹${shippingCharge}`
                    )}
                  </span>
                </div>

                {/* Protective Packing Fee - Only show for Mettur Parcel Service */}
                {courierPartner === 'METTUR_PARCEL' && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">🛡️ Plant Protective Packing:</span>
                    <span className="font-bold text-slate-900">
                      {packingCharge === 0 ? (
                        <span className="text-slate-500 font-semibold">Standard Safe (₹0)</span>
                      ) : (
                        <span className="text-emerald-800 font-black">+₹{packingCharge} ({selectedPacking === 'EXTRA_SECURE' ? 'Extra Secure' : 'Max Protection'})</span>
                      )}
                    </span>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>🏷️ Coupon:</span>
                    <span>−₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span className="flex items-center gap-1">💰 Grand Total:</span>
                  <span className="text-emerald-800 text-base">₹{grandTotal}</span>
                </div>
              </div>
            </div>

            <div className="px-4 pb-6 pt-3 border-t border-slate-100 bg-white">
              <ProceedBtn label="PROCEED TO DELIVERY TERMS" onClick={() => goTo(5)} />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 5 — Delivery & Courier Terms
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 5 && (
          <div className="flex flex-col min-h-full">
            <Header title="📜 Delivery & Courier Terms" onBack={() => handleGoBack(4)} />

            <div className="flex-1 px-4 py-3 space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                {DELIVERY_TERMS.map((term, i) => (
                  <p key={i} className="text-[11px] text-amber-900 font-medium leading-relaxed">{term}</p>
                ))}
              </div>

              <label className="flex items-start gap-3 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
                />
                <span className="text-xs font-bold text-emerald-900">
                  I have read and understood the Delivery & Courier Terms.
                </span>
              </label>
            </div>

            <div className="px-4 pb-6 pt-3 border-t border-slate-100 bg-white">
              <button
                onClick={() => goTo(6)}
                disabled={!termsAccepted}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>PROCEED TO PAYMENT →</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 6 — Payment Method
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 6 && (
          <div className="flex flex-col min-h-full">
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-slate-900 text-base">Payment Method</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => goTo(3)} className="text-[11px] text-emerald-700 font-bold border border-emerald-200 bg-emerald-50 px-2.5 py-1 rounded-lg cursor-pointer">
                    Edit Address
                  </button>
                  <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Select Payment Method</p>
            </div>

            <div className="flex-1 px-4 py-3 space-y-3">
              {/* Error */}
              {orderError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{orderError}</span>
                </div>
              )}

              {/* Payment options */}
              <div className="space-y-2.5">
                {isRazorpayEnabled && (
                  <div onClick={() => setPaymentMethod('RAZORPAY')} className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${paymentMethod === 'RAZORPAY' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs">Razorpay Online Gateway</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">GPay, PhonePe, Paytm, Cards & NetBanking</p>
                    </div>
                    {paymentMethod === 'RAZORPAY' && <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-1" />}
                  </div>
                )}

                {isPhonePeEnabled && (
                  <div onClick={() => setPaymentMethod('PHONEPE')} className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${paymentMethod === 'PHONEPE' ? 'border-purple-600 bg-purple-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="w-8 h-8 bg-[#5f259f] text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">पे</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs">PhonePe Payment Gateway</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">UPI, GPay, Cards & NetBanking</p>
                    </div>
                    {paymentMethod === 'PHONEPE' && <CheckCircle className="w-4 h-4 text-purple-600 shrink-0 mt-1" />}
                  </div>
                )}

                {isQrEnabled && (
                  <div onClick={() => setPaymentMethod('QR_PAYMENT')} className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${paymentMethod === 'QR_PAYMENT' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs">Scan QR & Upload Receipt</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">📸 Mandatory screenshot required</p>
                    </div>
                    {paymentMethod === 'QR_PAYMENT' && <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-1" />}
                  </div>
                )}

                {isCodEnabled && (
                  <div onClick={() => setPaymentMethod('COD')} className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${paymentMethod === 'COD' ? 'border-emerald-700 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="w-8 h-8 bg-emerald-800 text-white rounded-full flex items-center justify-center font-bold text-base shrink-0">💵</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs">Cash on Delivery (COD)</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Pay cash on delivery</p>
                    </div>
                    {paymentMethod === 'COD' && <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-1" />}
                  </div>
                )}
              </div>

              {/* UPI Return Recovery Helper Banner */}
              {hasReturnedFromUpi && (
                <div className="p-3.5 bg-emerald-50 border-2 border-emerald-500 rounded-2xl space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-950 font-black text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>👋 Welcome back from UPI / UPI Lite!</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                    If payment of <strong>₹{grandTotal}</strong> was made, attach your <strong>screenshot</strong> below or enter <strong>12-digit UPI UTR</strong>, then tap the green button to confirm!
                  </p>
                </div>
              )}

              {/* QR Payment Panel */}
              {paymentMethod === 'QR_PAYMENT' && isQrEnabled && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-4 space-y-4">
                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-2 rounded-2xl border-2 border-indigo-200 shadow-sm">
                      <img src={qrCodeUrl} alt="UPI QR Code" className="w-44 h-44 object-contain rounded-xl" />
                    </div>
                    <p className="text-[11px] font-extrabold text-indigo-900">📱 Scan to pay ₹{grandTotal}</p>
                    <a
                      href={upiDeepLink}
                      onClick={() => {
                        try {
                          localStorage.setItem('vrg_pending_upi_payment', JSON.stringify({
                            amount: grandTotal,
                            timestamp: Date.now(),
                            phone: address.phone || user?.phone || '',
                            customerName: address.fullName || user?.name || ''
                          }));
                          sessionStorage.setItem('vrg_checkout_step', '6');
                          localStorage.setItem('vrg_checkout_step', '6');
                          sessionStorage.setItem('vrg_checkout_payment_method', 'QR_PAYMENT');
                        } catch {}
                        setHasReturnedFromUpi(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      ⚡ Pay ₹{grandTotal} via GPay/PhonePe/UPI Lite
                    </a>
                  </div>

                  {/* UPI ID */}
                  <div className="bg-white rounded-xl border border-indigo-100 p-3 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Merchant UPI ID:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-indigo-50 text-indigo-900 font-mono font-bold text-xs px-2 py-1 rounded-lg border border-indigo-200 flex-1">{upiId}</code>
                      <button type="button" onClick={handleCopyUpi} className="p-2 bg-indigo-600 text-white rounded-lg cursor-pointer">
                        {copiedUpi ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{upiName}</p>
                  </div>

                  {/* Upload */}
                  <div className="bg-white rounded-xl border-2 border-dashed border-indigo-300 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Upload Paid Screenshot *
                      </label>
                      <span className="bg-rose-100 text-rose-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full">MANDATORY</span>
                    </div>
                    <label className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      {paymentProofUrl ? 'Change Receipt Photo' : 'Select Screenshot Image'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    {proofPreview && (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-2 py-1.5 rounded-lg text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <img src={proofPreview} alt="Proof" className="w-7 h-7 object-cover rounded border" />
                        <span className="font-bold text-emerald-800">Screenshot Uploaded!</span>
                      </div>
                    )}
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">UPI Transaction Ref (Optional):</label>
                      <input
                        type="text"
                        placeholder="12-digit UTR number"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 pb-6 pt-3 border-t border-slate-100 bg-white">
              {!paymentMethod && (
                <p className="text-center text-[11px] text-amber-700 font-bold mb-2">
                  👆 Please tap to select your payment option above
                </p>
              )}
              <button
                onClick={handlePlaceOrder}
                disabled={loading || !user || !paymentMethod}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting to Secure Razorpay...</span>
                  </div>
                ) : (
                  <>
                    <span>{!paymentMethod ? 'SELECT PAYMENT METHOD' : `CONFIRM & PLACE NURSERY ORDER (₹${grandTotal})`}</span>
                    {paymentMethod && <Check className="w-4 h-4" />}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 7 — Order Confirmed
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 7 && (
          <div className="flex flex-col min-h-full">
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 text-base">Order Confirmed</h2>
              <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-100 text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 px-4 py-3 space-y-4">
              {/* Success banner */}
              <div className="bg-emerald-900 rounded-3xl p-5 text-white text-center space-y-3 shadow-lg">
                <div className="w-16 h-16 bg-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9 text-emerald-200" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-300 uppercase tracking-wide">Payment successful</p>
                  <h3 className="text-xl font-black text-white mt-1">Order ID</h3>
                  <p className="font-mono font-bold text-emerald-300 text-sm">{placedOrderId || 'ORD-...'}</p>
                </div>
              </div>

              {/* Order details card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 text-xs shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-500 text-[11px]">ORDER SUMMARY</span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    (fetchedOrder?.paymentStatus === 'SUCCESS' || paymentMethod === 'RAZORPAY')
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : paymentMethod === 'COD'
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {fetchedOrder?.paymentStatus === 'SUCCESS' ? '✅ PAID & CONFIRMED' : paymentMethod === 'COD' ? '💵 COD CONFIRMED' : '⏳ PENDING VERIFICATION'}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {(fetchedOrder?.items || items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.sellingPrice, image: i.product.images?.[0] }))).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-none gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200" />
                        )}
                        <div className="truncate">
                          <p className="font-bold text-slate-800 text-xs truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-500">Qty: {item.quantity} × ₹{item.price}</p>
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-900 shrink-0">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-slate-100 pt-2 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Plants Subtotal</span>
                    <span className="font-bold text-slate-900">₹{fetchedOrder?.subtotal ?? subtotal}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Courier ({fetchedOrder?.courierName || (courierPartner === 'METTUR_PARCEL' ? 'Mettur Parcel Service' : 'Professional Courier')})</span>
                    <span className="font-bold text-slate-900">₹{fetchedOrder?.shippingCharge ?? shippingCharge}</span>
                  </div>

                  {(fetchedOrder?.packingCharge > 0 || packingCharge > 0) && (
                    <div className="flex justify-between text-slate-600">
                      <span>Protective Packing</span>
                      <span className="font-bold text-slate-900">₹{fetchedOrder?.packingCharge ?? packingCharge}</span>
                    </div>
                  )}

                  {(fetchedOrder?.discount > 0 || discountAmount > 0) && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount Coupon</span>
                      <span>-₹{fetchedOrder?.discount ?? discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Grand Total Paid</span>
                    <span className="text-emerald-800 text-base">₹{fetchedOrder?.grandTotal ?? grandTotal}</span>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] space-y-0.5">
                  <p className="font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-700" />
                    <span>Delivery Address</span>
                  </p>
                  <p className="text-slate-800 font-semibold">{address.fullName || user?.name} • {address.phone || user?.phone}</p>
                  <p className="text-slate-600 text-[10px]">{[address.houseNo, address.street, address.villageTown, address.district, address.state, address.pincode].filter(Boolean).join(', ')}</p>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-[11px] text-emerald-800 font-medium leading-relaxed">
                🌱 Your order will normally be dispatched within 5–6 working days after order confirmation. After dispatch, you will normally receive the plants within 1–2 days.
              </div>
            </div>

            <div className="px-4 pb-6 pt-3 border-t border-slate-100 bg-white">
              <button
                onClick={() => goTo(8)}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <span>VIEW OFFICIAL RECEIPT →</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 8 — Customer Receipt
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 8 && (
          <div className="flex flex-col min-h-full">
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 text-base">🧾 Customer Receipt</h2>
              <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-100 text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 px-4 py-3">
              {/* Receipt card */}
              <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
                {/* Receipt header */}
                <div className="bg-emerald-900 text-white p-5 text-center space-y-1">
                  <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">VRG NURSERY</p>
                  <h3 className="text-lg font-black">Veerika Rose Garden</h3>
                  <p className="text-[10px] text-emerald-200">Official Order Receipt</p>
                </div>

                {/* Receipt body */}
                <div className="p-4 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-600">Order ID</span>
                    <span className="font-mono font-extrabold text-slate-900">{fetchedOrder?.id || placedOrderId}</span>
                  </div>

                  {(fetchedOrder?.items || items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.sellingPrice }))).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-0.5">
                      <span className="font-semibold text-slate-700">{item.name} × {item.quantity}</span>
                      <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}

                  <div className="border-t border-slate-200 pt-2 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Plant Total</span>
                      <span className="font-semibold text-slate-900">₹{fetchedOrder?.subtotal ?? subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Courier ({fetchedOrder?.courierName || (courierPartner === 'METTUR_PARCEL' ? 'Mettur Parcel' : 'Professional')})</span>
                      <span className="font-semibold text-slate-900">₹{fetchedOrder?.shippingCharge ?? shippingCharge}</span>
                    </div>
                    {(fetchedOrder?.packingCharge > 0 || packingCharge > 0) && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Packing Charge</span>
                        <span className="font-semibold text-slate-900">₹{fetchedOrder?.packingCharge ?? packingCharge}</span>
                      </div>
                    )}
                    {(fetchedOrder?.discount > 0 || discountAmount > 0) && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Discount Coupon</span>
                        <span>-₹{fetchedOrder?.discount ?? discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-extrabold text-sm border-t border-slate-300 pt-2">
                      <span className="text-slate-900">Grand Total</span>
                      <span className="text-emerald-800">₹{fetchedOrder?.grandTotal ?? grandTotal}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Payment Status</span>
                      <span className={`font-extrabold text-[11px] px-2.5 py-0.5 rounded-full ${fetchedOrder?.paymentStatus === 'SUCCESS' || paymentMethod === 'RAZORPAY' || fetchedOrder?.paymentMethod === 'COD' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {fetchedOrder?.paymentMethod === 'COD' ? '💵 COD' : (fetchedOrder?.paymentStatus === 'SUCCESS' || paymentMethod === 'RAZORPAY') ? '⚡ Razorpay (Paid)' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[10px] text-emerald-800 font-medium leading-relaxed">
                    🌱 Your order will normally be dispatched within 5–6 working days after order confirmation. After dispatch, you will normally receive the plants within 1–2 days.
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 pb-6 pt-3 border-t border-slate-100 bg-white space-y-2.5">
              <button
                onClick={handleDownloadReceipt}
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                ⬇️ DOWNLOAD RECEIPT PDF
              </button>
              <button
                onClick={() => { goTo(9); handleFetchOrderForTracking(); }}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Package className="w-4 h-4" />
                TRACK MY ORDER →
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 9 — Track My Order
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 9 && (
          <div className="flex flex-col min-h-full">
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 text-base">📦 Track My Order</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => goTo(8)} className="p-1.5 rounded-xl bg-slate-100 text-slate-600 cursor-pointer">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-100 text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 px-4 py-3 space-y-4">
              {/* Order ID & Status */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">Order ID</span>
                  <span className="font-mono font-extrabold text-slate-900">{fetchedOrder?.id || placedOrderId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">Status</span>
                  <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                    {fetchedOrder?.orderStatus || 'Order Confirmed'}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-0">
                {[
                  { label: 'Order Confirmed', icon: <CheckCircle2 className="w-4 h-4" />, active: true, sub: '✓' },
                  { label: 'Processing / Packing', icon: <Package className="w-4 h-4" />, active: fetchedOrder?.orderStatus !== 'PENDING', sub: '' },
                  { label: 'Dispatched', icon: <Truck className="w-4 h-4" />, active: fetchedOrder?.orderStatus === 'DISPATCHED' || fetchedOrder?.orderStatus === 'DELIVERED' || fetchedOrder?.orderStatus === 'OUT_FOR_DELIVERY', sub: '' },
                  { label: 'Out for Delivery', icon: <Truck className="w-4 h-4" />, active: fetchedOrder?.orderStatus === 'OUT_FOR_DELIVERY' || fetchedOrder?.orderStatus === 'DELIVERED', sub: '' },
                  { label: 'Delivered', icon: <CheckCircle2 className="w-4 h-4" />, active: fetchedOrder?.orderStatus === 'DELIVERED', sub: '' },
                ].map((s, i, arr) => (
                  <div key={s.label} className="flex items-start gap-3">
                    {/* Icon column */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${s.active ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                        {s.icon}
                      </div>
                      {i < arr.length - 1 && (
                        <div className={`w-0.5 h-6 ${s.active ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                      )}
                    </div>
                    {/* Label */}
                    <div className="pt-1.5 pb-4">
                      <p className={`text-xs font-bold ${s.active ? 'text-emerald-900' : 'text-slate-400'}`}>
                        {s.label} {s.active && s.sub && <span className="text-emerald-600">{s.sub}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Courier tracking */}
              {fetchedOrder?.trackingNumber && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
                  <p className="font-bold text-emerald-900">Courier: {fetchedOrder.courierName}</p>
                  <p className="font-mono font-semibold text-emerald-800">AWB: {fetchedOrder.trackingNumber}</p>
                  <a
                    href={`https://www.google.com/search?q=${fetchedOrder.courierName}+tracking+${fetchedOrder.trackingNumber}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-emerald-700 font-bold hover:underline"
                  >
                    Track Online <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="px-4 pb-6 pt-3 border-t border-slate-100 bg-white space-y-2.5">
              <button
                onClick={handleFetchOrderForTracking}
                disabled={trackLoading}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {trackLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                🔎 TRACK YOUR ORDER
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
              >
                Back to Shop
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
