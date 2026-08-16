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
import { CourierSelectionSection, CourierPartnerType } from '../components/CourierSelectionSection';
import { PlantProtectivePackingSection, PackingOptionType } from '../components/PlantProtectivePackingSection';

export interface CheckoutPageProps {
  items: CartItem[];
  user?: User | null;
  onBackToCart: () => void;
  appliedCoupon: { code: string; discountAmount: number } | null;
  onApplyCoupon?: (code: string) => Promise<{ success: boolean; message: string }>;
  onRemoveCoupon?: () => void;
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
    phonepePayUrl?: string;
    merchantTransactionId?: string;
    razorpayOrderId?: string;
    razorpayKeyId?: string;
    amount?: number;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    message?: string;
  }>;
  onOrderConfirmed?: (confirmedOrder: any) => void;
  onUpdateQuantity?: (productId: string, qty: number) => void;
  onRemoveItem?: (productId: string) => void;
  onNavigateToAccount?: () => void;
  onNavigateToHome?: () => void;
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

const STEP_LABELS = [
  'Cart Items', 'Summary & Coupon', 'Delivery Address', 'Courier & Packing', 'Delivery Terms', 'Payment Method', 'Order Confirmed', 'Official Receipt', 'Track Shipment'
];

const StepBar: React.FC<{ step: number }> = ({ step }) => {
  const pct = Math.round(((step - 1) / 8) * 100);
  return (
    <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50/70">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-black text-emerald-800 tracking-tight">
          Step {step} of 9 · <span className="text-slate-700">{STEP_LABELS[step - 1]}</span>
        </span>
        <span className="text-xs font-black text-slate-500">{pct}% Complete</span>
      </div>
      <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

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

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  user,
  onBackToCart,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  onPlaceOrder,
  onOrderConfirmed,
  onUpdateQuantity,
  onRemoveItem,
  onNavigateToAccount,
  onNavigateToHome
}) => {
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
  const paymentCompletedRef = useRef(false);
  const [hasReturnedFromUpi, setHasReturnedFromUpi] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem('vrg_checkout_step', String(step));
      localStorage.setItem('vrg_checkout_step', String(step));
    } catch {}
  }, [step]);

  const goTo = useCallback((next: number) => {
    if (animating && next !== 7) return;
    const isForward = next > step;
    setDirection(isForward ? 'forward' : 'back');
    setAnimating(true);
    setStep(next);
    try {
      sessionStorage.setItem('vrg_checkout_step', String(next));
      localStorage.setItem('vrg_checkout_step', String(next));
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setAnimating(false);
    }, 220);
  }, [animating, step]);

  const handleGoBack = useCallback((fallbackStep?: number) => {
    if (step > 1) {
      goTo(fallbackStep !== undefined ? fallbackStep : step - 1);
    } else {
      try {
        sessionStorage.removeItem('vrg_checkout_step');
        localStorage.removeItem('vrg_checkout_step');
      } catch {}
      onBackToCart();
    }
  }, [step, goTo, onBackToCart]);

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
      const saved = sessionStorage.getItem('vrg_checkout_delivery_option');
      if (saved === 'FULL_SOIL' || saved === 'REDUCED_SOIL') return saved;
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

  // Auto fallback if option becomes unavailable due to plant count changes
  // Auto fallback if option becomes unavailable due to state or plant count changes
  useEffect(() => {
    const inTN = isTamilNadu(address.state);
    if (deliveryOption === 'FULL_SOIL' && (!inTN || totalPlantCount > 5)) {
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

  // Eagerly pre-load Razorpay SDK on mount
  useEffect(() => {
    loadRazorpayScript().catch(() => {});
  }, []);

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

  // Fetch site settings
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.settings) {
          setSiteSettings(d.settings);
          const s = d.settings;
          setPaymentMethod(prev => {
            if (prev) return prev;
            if (s.enableRazorpay) return 'RAZORPAY';
            if (s.enablePhonePe !== false) return 'PHONEPE';
            if (s.enableQrPayment !== false) return 'QR_PAYMENT';
            if (s.enableCod !== false) return 'COD';
            return null;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Fetch order on step 7
  useEffect(() => {
    if (step === 7 && placedOrderId && !fetchedOrder) {
      fetch(`/api/orders/${placedOrderId}`)
        .then(r => r.json())
        .then(d => { if (d.success) setFetchedOrder(d.order); })
        .catch(() => {});
    }
  }, [step, placedOrderId, fetchedOrder]);

  const handleFetchOrderForTracking = () => {
    const id = placedOrderId || (fetchedOrder && fetchedOrder.id);
    if (!id) return;
    setTrackLoading(true);
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(d => {
        setTrackLoading(false);
        if (d.success && d.order) setFetchedOrder(d.order);
      })
      .catch(() => setTrackLoading(false));
  };

  const handleDownloadReceipt = () => {
    const orderData = fetchedOrder || {
      id: placedOrderId || 'ORD-NEW',
      items,
      subtotal,
      shippingCharge,
      packingCharge,
      packingOption: selectedPacking,
      grandTotal,
      paymentMethod: paymentMethod || 'ONLINE',
      paymentStatus: paymentMethod === 'COD' ? 'CONFIRMED' : 'SUCCESS',
      createdAt: new Date().toISOString()
    };
    const htmlContent = `
      <html>
        <head>
          <title>Order Receipt - ${orderData.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.4; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 16px; }
            .header h1 { margin: 0; color: #065f46; font-size: 22px; }
            .details { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f1f5f9; }
            .totals { margin-left: auto; width: 250px; font-size: 13px; }
            .totals div { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .grand-total { font-weight: bold; font-size: 15px; border-top: 2px solid #0f172a; padding-top: 6px; color: #065f46; }
            .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Veerika Rose Garden</h1>
            <p>Pennagaram, Dharmapuri District, Tamil Nadu - 636810 | Phone: +91 72008 26129</p>
            <h3>ORDER TAX INVOICE & RECEIPT</h3>
          </div>
          <div class="details">
            <p><strong>Order ID:</strong> ${orderData.id}</p>
            <p><strong>Date:</strong> ${new Date(orderData.createdAt).toLocaleDateString('en-IN')}</p>
            <p><strong>Payment Mode:</strong> ${orderData.paymentMethod} (${orderData.paymentStatus})</p>
            <p><strong>Courier:</strong> ${courierPartner === 'METTUR_PARCEL' ? 'Mettur Parcel Service' : 'Professional Courier'}</p>
          </div>
          <table>
            <thead>
              <tr><th>Plant Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${(orderData.items || []).map((i: any) => `
                <tr>
                  <td>${i.name || i.product?.name}</td>
                  <td>${i.quantity}</td>
                  <td>₹${i.price || i.product?.sellingPrice}</td>
                  <td>₹${(i.price || i.product?.sellingPrice) * i.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div><span>Subtotal:</span><span>₹${orderData.subtotal}</span></div>
            <div><span>Delivery Fee:</span><span>₹${orderData.shippingCharge}</span></div>
            ${orderData.packingCharge ? `<div><span>Protective Packing:</span><span>₹${orderData.packingCharge}</span></div>` : ''}
            <div class="grand-total"><span>Grand Total:</span><span>₹${orderData.grandTotal}</span></div>
          </div>
          <div class="footer">
            <p>Thank you for growing with Veerika Rose Garden! 🌱</p>
          </div>
        </body>
      </html>
    `;
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => { printWin.print(); }, 250);
    }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !onApplyCoupon) return;
    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const res = await onApplyCoupon(couponCode.trim());
      setCouponLoading(false);
      if (res.success) {
        setCouponMsg({ type: 'success', text: res.message });
      } else {
        setCouponMsg({ type: 'error', text: res.message });
      }
    } catch {
      setCouponLoading(false);
      setCouponMsg({ type: 'error', text: 'Failed to apply coupon.' });
    }
  };

  const handleAddressNext = (e: React.FormEvent) => {
    e.preventDefault();
    setAddrError(null);
    if (!address.fullName.trim()) { setAddrError('Please enter your full name'); return; }
    const phoneClean = address.phone.replace(/\D/g, '');
    if (phoneClean.length < 10) { setAddrError('Please enter a valid 10-digit mobile number'); return; }
    if (!address.houseNo.trim()) { setAddrError('Please enter House/Door No.'); return; }
    if (!address.street.trim()) { setAddrError('Please enter Street/Gramam name'); return; }
    if (!address.villageTown.trim()) { setAddrError('Please enter Village or Town name'); return; }
    if (!address.district.trim()) { setAddrError('Please enter District name'); return; }
    if (!address.pincode.trim() || address.pincode.length < 6) { setAddrError('Please enter a valid 6-digit pincode'); return; }
    goTo(4);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setOrderError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    setUploadingImage(true);
    setOrderError(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const raw = reader.result as string;
        setProofPreview(raw);
        try {
          const compressed = await compressImageBase64(raw, 1000, 1000, 0.75);
          setPaymentProofUrl(compressed);
        } catch {
          setPaymentProofUrl(raw);
        }
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingImage(false);
      setOrderError('Failed to process image. Please retry.');
    }
  };

  const handleCopyUpi = () => {
    const id = siteSettings?.upiId || '7200826129@ybl';
    navigator.clipboard.writeText(id).then(() => {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    });
  };

  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleRazorpayPayment = async (orderRes: any) => {
    paymentCompletedRef.current = false;
    setLoading(true);
    setOrderError(null);

    // Save pending payment in localStorage so return from GPay / app switch is automatically reconciled
    try {
      localStorage.setItem('vrg_pending_razorpay_order', JSON.stringify({
        orderId: orderRes.orderId,
        razorpayOrderId: orderRes.razorpayOrderId,
        amount: orderRes.amount,
        timestamp: Date.now()
      }));
    } catch {}

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setOrderError('Failed to load Razorpay SDK. Please check internet connection.');
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
          setLoading(false);
          setOrderError(null);
          setPlacedOrderId(orderRes.orderId);
          setFetchedOrder(d.order);
          if (onOrderConfirmed) {
            onOrderConfirmed(d.order);
          }
          setStep(7);
          goTo(7);
        }
      } catch {}
    }, 2500);

    // Timeout poller after 2 minutes
    setTimeout(() => clearInterval(pollInterval), 120000);

    const options: any = {
      key: orderRes.razorpayKeyId || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_live_TQ5xDdZB7QWIn2',
      amount: Math.round(orderRes.amount * 100),
      currency: 'INR',
      name: siteSettings?.businessName || 'Veerika Rose Garden',
      description: `Plant Order #${orderRes.orderId}`,
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&q=80',
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
              setLoading(false);
              setOrderError(null);
              setPlacedOrderId(orderRes.orderId);
              setFetchedOrder(d.order);
              if (onOrderConfirmed) {
                onOrderConfirmed(d.order);
              }
              setStep(7);
              goTo(7);
              return;
            }
          } catch {}

          setLoading(false);
          setOrderError('Payment was not completed. Your items are safe in cart — click Pay Now to try again.');
        }
      },
      handler: async (response: any) => {
        clearInterval(pollInterval);
        paymentCompletedRef.current = true;
        setLoading(true);
        setOrderError(null);
        setPlacedOrderId(orderRes.orderId);
        setStep(7);
        goTo(7);

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
            paymentCompletedRef.current = true;
            if (onOrderConfirmed) {
              onOrderConfirmed(verifyData.order || { id: orderRes.orderId, grandTotal: orderRes.amount });
            }
            setPlacedOrderId(orderRes.orderId);
            setStep(7);
            goTo(7);
          }
        } catch {
          setLoading(false);
        }
      },
      prefill: {
        name: address.fullName || user?.name || '',
        contact: address.phone || user?.phone || '',
        email: user?.email || `cust${address.phone}@veerikanursery.com`
      },
      theme: { color: '#047857' }
    };
    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', async (resp: any) => {
        if (paymentCompletedRef.current) return;
        setOrderError(`Payment failed: ${resp.error?.description || 'Transaction declined.'}`);
        setLoading(false);
      });
      rzp.open();
    } catch {
      clearInterval(pollInterval);
      setLoading(false);
      setOrderError('Failed to open Razorpay payment window.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      if (onNavigateToAccount) onNavigateToAccount();
      return;
    }
    if (!paymentMethod) {
      setOrderError('Please select a payment method.');
      return;
    }
    if (uploadingImage) {
      setOrderError('Please wait — processing payment screenshot.');
      return;
    }
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
        : 'Professional Courier';

      const res = await onPlaceOrder({
        customerName: address.fullName || user?.name || 'Customer',
        customerPhone: cleanPhone,
        customerEmail: cleanEmail,
        shippingAddress: { ...address, phone: cleanPhone },
        paymentMethod: effectivePM,
        paymentProofUrl: effectivePM === 'QR_PAYMENT' ? paymentProofUrl : undefined,
        transactionId: effectivePM === 'QR_PAYMENT' ? transactionId : undefined,
        potCharge: 0,
        potOption: 'NONE',
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

  const summaryTotals = computeOrderTotals({
    items,
    state: previewState,
    selectedPot: 'NONE',
    selectedPacking,
    appliedCoupon
  });

  const upiId = siteSettings?.upiId || '7200826129@ybl';
  const upiName = encodeURIComponent(siteSettings?.businessName || 'Veerika Rose Garden Nursery');
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${upiName}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent(`Plant Order ${user?.name || ''}`)}`;

  const Header: React.FC<{ title: string; subtitle?: string; onBack?: () => void }> = ({ title, subtitle, onBack }) => (
    <div className="px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-white">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>}
        </div>
      </div>
      <button
        onClick={onBackToCart}
        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
        aria-label="Back to cart"
      >
        <ShoppingBag className="w-4 h-4" />
      </button>
    </div>
  );

  const ProceedBtn: React.FC<{ label: string; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean }> = ({
    label, onClick, type = 'button', disabled = false
  }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
    >
      <span>{label}</span>
      <ArrowRight className="w-4 h-4" />
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-emerald-50/30 py-4 sm:py-8 px-3 sm:px-6">
      <div className="max-w-3xl w-full mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col">
        {/* Step Progress Bar Header */}
        <StepBar step={step} />

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 1 — Cart Items
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col flex-1">
            <Header title="Your Cart Plants" subtitle={`${items.length} unique plant selection`} />

            <div className="flex-1 px-4 sm:px-6 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-2xl">🌱</div>
                  <p className="font-extrabold text-slate-800 text-sm">Your cart is empty</p>
                  <button onClick={onBackToCart} className="px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer">
                    Browse Plants
                  </button>
                </div>
              ) : (
                items.map(item => {
                  const isCombo = item.isCombo || item.product.id.startsWith('combo-') || item.product.categoryId === 'combos';
                  const comboPlants = item.comboProducts || (item.product as any).comboProducts || [];
                  const bundleCount = comboPlants.length || (isCombo ? 4 : 1);

                  return (
                    <div key={item.product.id} className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 flex items-start gap-3 sm:gap-4">
                      <img
                        src={item.product.images?.[0] || '/products/double-delight.jpeg'}
                        alt={item.product.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">{item.product.name}</h3>
                          {isCombo && (
                            <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md">
                              Combo ({bundleCount} Plants)
                            </span>
                          )}
                        </div>

                        {isCombo && comboPlants.length > 0 && (
                          <div className="bg-white/80 rounded-xl p-2 mt-1.5 border border-slate-200/80 space-y-1">
                            <p className="text-[10px] font-extrabold text-emerald-800 flex items-center gap-1">
                              <span>🌿 Bundled Plants ({comboPlants.length}):</span>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                              {comboPlants.map((p: Product, idx: number) => (
                                <div key={p.id || idx} className="flex items-center gap-1.5 text-[10px] text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  <span className="truncate flex-1 font-medium">{p.name}</span>
                                  <span className="font-mono text-emerald-800 font-bold shrink-0">₹{p.sellingPrice}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-baseline gap-2 mt-1.5">
                          <span className="text-xs sm:text-sm font-black text-slate-900">₹{item.product.sellingPrice}</span>
                          {item.product.mrp > item.product.sellingPrice && (
                            <span className="text-[11px] text-slate-400 line-through font-medium">₹{item.product.mrp}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2.5 shrink-0">
                        {onRemoveItem && (
                          <button onClick={() => onRemoveItem(item.product.id)} className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {onUpdateQuantity && (
                          <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-2xs">
                            <button onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)} className="p-1.5 text-slate-600 hover:text-emerald-700 cursor-pointer">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-xs font-black text-slate-900 font-mono">{item.quantity}</span>
                            <button onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= 20} className="p-1.5 text-slate-600 hover:text-emerald-700 disabled:opacity-30 cursor-pointer">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="px-4 sm:px-6 pb-6 pt-3 border-t border-slate-100 bg-white space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span className="font-bold text-slate-700">🌱 {totalPlantCount} Live Plant{totalPlantCount !== 1 ? 's' : ''} ({items.length} cart item{items.length !== 1 ? 's' : ''})</span>
                  <span className="font-extrabold text-slate-900 text-sm">₹{items.reduce((s, i) => s + i.product.sellingPrice * i.quantity, 0)}</span>
                </div>
                <ProceedBtn label="PROCEED TO ORDER SUMMARY" onClick={() => goTo(2)} />
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Safe Nursery Transit & Fast Courier Dispatch</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 2 — Apply Coupon / Discounts
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col flex-1">
            <Header title="Apply Coupon" subtitle="Add discount or voucher code to your order" onBack={() => handleGoBack(1)} />

            <div className="flex-1 px-4 sm:px-6 py-4 space-y-4">
              {/* Coupon */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2.5">
                <label className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  Have a Coupon / Promo Code?
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
                    <span className="font-bold text-emerald-800">✅ {appliedCoupon.code} (−₹{appliedCoupon.discountAmount} Applied)</span>
                    {onRemoveCoupon && (
                      <button onClick={onRemoveCoupon} className="text-rose-600 font-bold hover:underline text-xs cursor-pointer">Remove</button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleCouponSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <button type="submit" disabled={couponLoading || !couponCode.trim()} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl cursor-pointer">
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

            <div className="px-4 sm:px-6 pb-6 pt-3 border-t border-slate-100 bg-white">
              {!user && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold">
                  🔒 Login required to checkout.{' '}
                  {onNavigateToAccount && (
                    <button onClick={onNavigateToAccount} className="underline font-bold cursor-pointer">Login / Sign Up →</button>
                  )}
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
          <form onSubmit={handleAddressNext} className="flex flex-col flex-1">
            <Header title="Delivery Address" subtitle="Village / Town Doorstep Delivery Address" onBack={() => handleGoBack(2)} />

            <div className="flex-1 px-4 sm:px-6 py-4 space-y-3">
              {addrError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {addrError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Your full name"
                    value={address.fullName}
                    onChange={(e) => setAddress(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Mobile Number (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={address.phone}
                    onChange={(e) => setAddress(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">House / Door No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12A / Flat 301"
                    value={address.houseNo}
                    onChange={(e) => setAddress(prev => ({ ...prev, houseNo: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Street / Gramam Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Street or village name"
                    value={address.street}
                    onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">State *</label>
                <select
                  required
                  value={address.state}
                  onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                >
                  {INDIAN_STATES.map(st => (
                    <option key={st} value={st}>{st} {isTamilNadu(st) ? '(₹60 base shipping)' : '(₹100 base shipping)'}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    placeholder="6-digit pincode"
                    value={address.pincode}
                    onChange={(e) => setAddress(prev => ({ ...prev, pincode: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Village / Town *</label>
                  <input
                    type="text"
                    required
                    placeholder="Town / village"
                    value={address.villageTown}
                    onChange={(e) => setAddress(prev => ({ ...prev, villageTown: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">District *</label>
                  <input
                    type="text"
                    required
                    placeholder="District name"
                    value={address.district}
                    onChange={(e) => setAddress(prev => ({ ...prev, district: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">Nearby Landmark (For Courier Driver)</label>
                <input
                  type="text"
                  placeholder="e.g. Near Pillaiyar Kovil / Bus Stand / Post Office"
                  value={address.landmark || ''}
                  onChange={(e) => setAddress(prev => ({ ...prev, landmark: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="px-4 sm:px-6 pb-6 pt-3 border-t border-slate-100 bg-white">
              <ProceedBtn label="PROCEED TO COURIER & PACKING" type="submit" />
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 4 — Courier & Protective Packing
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="flex flex-col flex-1">
            <Header title="Courier & Packing Selection" subtitle="Choose your courier partner and plant protective packaging." onBack={() => handleGoBack(3)} />

            <div className="flex-1 px-4 sm:px-6 py-4 space-y-4">
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
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                <p className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  <span>🚚 Delivery State Rate Preview:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                  <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-800">🌿 Tamil Nadu</span>
                    <span className="font-black text-emerald-800">₹60 base shipping</span>
                  </div>
                  <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-800">🌿 Karnataka</span>
                    <span className="font-black text-emerald-800">₹100 base shipping</span>
                  </div>
                  <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-800">🌿 Kerala</span>
                    <span className="font-black text-emerald-800">₹100 base shipping</span>
                  </div>
                  <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-800">🌿 Andhra Pradesh</span>
                    <span className="font-black text-emerald-800">₹100 base shipping</span>
                  </div>
                  <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
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
                          : `Professional Courier (${deliveryOption === 'FULL_SOIL' ? 'Full Soil' : 'Reduced Soil'})`}
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

            <div className="px-4 sm:px-6 pb-6 pt-3 border-t border-slate-100 bg-white">
              <ProceedBtn label="PROCEED TO DELIVERY TERMS" onClick={() => goTo(5)} />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 5 — Delivery & Courier Terms
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 5 && (
          <div className="flex flex-col flex-1">
            <Header title="Delivery & Courier Terms" onBack={() => handleGoBack(4)} />

            <div className="flex-1 px-4 sm:px-6 py-4 space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-2.5">
                {DELIVERY_TERMS.map((term, i) => (
                  <p key={i} className="text-xs text-amber-950 font-medium leading-relaxed">{term}</p>
                ))}
              </div>

              <label className="flex items-start gap-3 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl cursor-pointer hover:bg-emerald-100/60 transition-colors">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 accent-emerald-700 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-extrabold text-emerald-900">
                  I have read, understood, and accept all the delivery conditions and live plant policies.
                </span>
              </label>
            </div>

            <div className="px-4 sm:px-6 pb-6 pt-3 border-t border-slate-100 bg-white">
              <ProceedBtn
                label="PROCEED TO PAYMENT METHOD"
                onClick={() => goTo(6)}
                disabled={!termsAccepted}
              />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 6 — Payment Method & Upload Proof
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 6 && (
          <div className="flex flex-col flex-1">
            <Header title="Payment Options" subtitle={`Total: ₹${grandTotal}`} onBack={() => handleGoBack(5)} />

            <div className="flex-1 px-4 sm:px-6 py-4 space-y-4">
              {orderError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {orderError}
                </div>
              )}

              {/* Payment Methods */}
              <div className="space-y-3">
                {/* 1. Razorpay */}
                {siteSettings?.enableRazorpay && (
                  <div
                    onClick={() => setPaymentMethod('RAZORPAY')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      paymentMethod === 'RAZORPAY'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'RAZORPAY'}
                        onChange={() => setPaymentMethod('RAZORPAY')}
                        className="mt-1 accent-emerald-700 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900">
                            ⚡ Razorpay Online Gateway
                          </h4>
                          <span className="text-[9px] font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md">
                            Instant Auto-Confirm
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Google Pay, PhonePe, Paytm, BHIM, UPI, RuPay / Visa Cards & NetBanking.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PhonePe */}
                {siteSettings?.enablePhonePe !== false && (
                  <div
                    onClick={() => setPaymentMethod('PHONEPE')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      paymentMethod === 'PHONEPE'
                        ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'PHONEPE'}
                        onChange={() => setPaymentMethod('PHONEPE')}
                        className="mt-1 accent-purple-700 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-black text-purple-950">
                            पे PhonePe Payment Gateway
                          </h4>
                          <span className="text-[9px] font-black bg-purple-100 text-purple-900 px-2 py-0.5 rounded-md">
                            100% Instant
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Pay directly via PhonePe UPI, Cards, and NetBanking.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Scan QR Code Payment */}
                {siteSettings?.enableQrPayment !== false && (
                  <div
                    onClick={() => setPaymentMethod('QR_PAYMENT')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      paymentMethod === 'QR_PAYMENT'
                        ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'QR_PAYMENT'}
                        onChange={() => setPaymentMethod('QR_PAYMENT')}
                        className="mt-1 accent-indigo-700 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-black text-indigo-950">
                            📱 Scan QR Code Payment (GPay / PhonePe / Paytm)
                          </h4>
                          <span className="text-[9px] font-black bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-md">
                            Direct Bank Transfer
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Scan the nursery UPI QR code, pay the exact amount, and upload the payment screenshot.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. COD */}
                {siteSettings?.enableCod && (
                  <div
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      paymentMethod === 'COD'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="mt-1 accent-emerald-700 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900">
                          💵 Cash on Delivery (COD)
                        </h4>
                        <p className="text-[11px] text-slate-600">
                          Pay in cash when your plant parcel arrives at your doorstep.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* UPI Return Recovery Helper Banner */}
              {hasReturnedFromUpi && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-950 font-black text-xs sm:text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>👋 Welcome back from UPI App / UPI Lite!</span>
                  </div>
                  <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                    If your payment of <strong>₹{grandTotal}</strong> was completed:
                    <br />
                    1. 📸 <strong>Attach your payment screenshot</strong> below, OR
                    <br />
                    2. 🔢 Enter the <strong>12-digit UPI UTR number</strong>, then tap the green button below to confirm your order!
                  </p>
                </div>
              )}

              {/* Scan QR Code Details Box */}
              {paymentMethod === 'QR_PAYMENT' && (
                <div className="bg-indigo-50/90 rounded-2xl border border-indigo-200 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <div className="bg-white p-2 rounded-2xl border border-indigo-200 shadow-sm shrink-0">
                      <img
                        src={siteSettings?.qrCodeImageUrl || '/nursery-qr.svg'}
                        alt="Nursery QR Code"
                        className="w-36 h-36 object-contain rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-black text-indigo-950">
                        📱 Scan QR code with any UPI app to pay ₹{grandTotal}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Supports Google Pay, PhonePe, Paytm, BHIM, Cred & all UPI banking apps.
                      </p>
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
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <span>⚡ Pay ₹{grandTotal} via UPI App</span>
                      </a>
                    </div>
                  </div>

                  {/* UPI ID Copy Bar */}
                  <div className="bg-white rounded-xl border border-indigo-100 p-3 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Official Nursery UPI ID:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-indigo-50 text-indigo-900 font-mono font-bold text-xs px-2.5 py-1.5 rounded-lg border border-indigo-200 flex-1">{upiId}</code>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{siteSettings?.businessName || 'Veerika Rose Garden Nursery'}</p>
                  </div>

                  {/* Upload Payment Screenshot Input */}
                  <div className="bg-white rounded-xl border-2 border-dashed border-indigo-300 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-indigo-600" /> Upload Payment Screenshot *
                      </label>
                      <span className="bg-rose-100 text-rose-800 font-black text-[9px] px-2 py-0.5 rounded-full">
                        MANDATORY
                      </span>
                    </div>
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>{paymentProofUrl ? 'Change Receipt Screenshot' : 'Select Screenshot Image'}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    {proofPreview && (
                      <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <img src={proofPreview} alt="Screenshot proof" className="w-8 h-8 object-cover rounded-lg border border-emerald-200" />
                        <span className="font-bold text-emerald-800">Screenshot Attached!</span>
                      </div>
                    )}
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">UPI Reference / UTR Number (Optional):</label>
                      <input
                        type="text"
                        placeholder="e.g. 423891234567"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 pb-6 pt-3 border-t border-slate-100 bg-white">
              <button
                onClick={handlePlaceOrder}
                disabled={loading || !paymentMethod}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>CONFIRM & PLACE NURSERY ORDER (₹{grandTotal})</span>
                    <Check className="w-4 h-4" />
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
          <div className="flex flex-col flex-1">
            <div className="px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-white">
              <h2 className="font-black text-slate-900 text-base sm:text-lg">🎉 Order Confirmed!</h2>
              {onNavigateToHome && (
                <button onClick={onNavigateToHome} className="p-2 rounded-xl bg-slate-100 text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 px-4 sm:px-6 py-4 space-y-4">
              {/* Success Banner */}
              <div className="bg-emerald-900 rounded-3xl p-6 text-white text-center space-y-2.5 shadow-lg">
                <div className="w-16 h-16 bg-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9 text-emerald-200" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Order Placed Successfully</p>
                  <h3 className="text-2xl font-black text-white mt-1">Order #{placedOrderId || 'ORD-...'}</h3>
                </div>
              </div>

              {/* Order Items & Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 text-xs">
                {fetchedOrder ? (
                  <>
                    {fetchedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-none">
                        <span className="font-bold text-slate-800">{item.name} × {item.quantity}</span>
                        <span className="font-extrabold text-slate-900">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-bold text-slate-900">₹{fetchedOrder.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Courier Delivery</span>
                      <span className="font-bold text-slate-900">
                        {fetchedOrder.courierName || 'ST Courier'} ({fetchedOrder.shippingCharge === 0 ? 'FREE' : `₹${fetchedOrder.shippingCharge}`})
                      </span>
                    </div>
                    {Boolean(fetchedOrder.packingCharge) && (
                      <div className="flex justify-between text-emerald-800 font-bold">
                        <span>Protective Packaging</span>
                        <span>+₹{fetchedOrder.packingCharge} ({fetchedOrder.packingOption === 'EXTRA_SECURE' ? 'Extra Secure' : 'Max Protection'})</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Grand Total</span>
                      <span className="text-emerald-800">₹{fetchedOrder.grandTotal}</span>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center">
                    <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 mt-2">Loading order summary...</p>
                  </div>
                )}
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 font-medium leading-relaxed">
                🌱 Your live plants will normally be dispatched within 5–6 working days. You will receive SMS & WhatsApp tracking details once dispatched.
              </div>
            </div>

            <div className="px-4 sm:px-6 pb-6 pt-3 border-t border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => goTo(8)}
                className="py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <FileText className="w-4 h-4" />
                <span>VIEW INVOICE / RECEIPT →</span>
              </button>
              <button
                onClick={() => { goTo(9); handleFetchOrderForTracking(); }}
                className="py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Truck className="w-4 h-4" />
                <span>TRACK SHIPMENT →</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 8 — Customer Receipt / Invoice
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 8 && (
          <div className="flex flex-col flex-1">
            <div className="px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-white">
              <h2 className="font-black text-slate-900 text-base sm:text-lg">🧾 Customer Tax Invoice</h2>
              <button onClick={() => goTo(7)} className="p-2 rounded-xl bg-slate-100 text-slate-600 cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 px-4 sm:px-6 py-4">
              <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-emerald-900 text-white p-5 text-center space-y-1">
                  <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">VRG NURSERY</p>
                  <h3 className="text-lg sm:text-xl font-black">Veerika Rose Garden</h3>
                  <p className="text-[11px] text-emerald-200">Official Order Invoice & Receipt</p>
                </div>

                <div className="p-4 sm:p-6 space-y-3.5 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-600">Invoice ID</span>
                    <span className="font-mono font-extrabold text-slate-900">{fetchedOrder?.id || placedOrderId}</span>
                  </div>

                  {fetchedOrder?.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="font-semibold text-slate-700">{item.name} × {item.quantity}</span>
                      <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}

                  <div className="border-t border-slate-200 pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-semibold text-slate-900">₹{fetchedOrder?.subtotal ?? subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Delivery Charge</span>
                      <span className="font-semibold text-slate-900">₹{fetchedOrder?.shippingCharge ?? shippingCharge}</span>
                    </div>
                    {(fetchedOrder?.packingCharge > 0 || packingCharge > 0) && (
                      <div className="flex justify-between text-emerald-800 font-bold">
                        <span>Protective Packing ({fetchedOrder?.packingOption === 'EXTRA_SECURE' || selectedPacking === 'EXTRA_SECURE' ? 'Extra Secure' : 'Max Protection'})</span>
                        <span>+₹{fetchedOrder?.packingCharge ?? packingCharge}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-extrabold text-sm border-t border-slate-300 pt-2">
                      <span className="text-slate-900">Grand Total</span>
                      <span className="text-emerald-800">₹{fetchedOrder?.grandTotal ?? grandTotal}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 pb-6 pt-3 border-t border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleDownloadReceipt}
                className="py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>PRINT / DOWNLOAD PDF</span>
              </button>
              <button
                onClick={() => { goTo(9); handleFetchOrderForTracking(); }}
                className="py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Truck className="w-4 h-4" />
                <span>TRACK MY ORDER →</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 9 — Live Tracking
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 9 && (
          <div className="flex flex-col flex-1">
            <div className="px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-white">
              <h2 className="font-black text-slate-900 text-base sm:text-lg">📦 Live Shipment Tracking</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => goTo(8)} className="p-2 rounded-xl bg-slate-100 text-slate-600 cursor-pointer">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                {onNavigateToHome && (
                  <button onClick={onNavigateToHome} className="p-2 rounded-xl bg-slate-100 text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 px-4 sm:px-6 py-4 space-y-4">
              {/* Order Status Box */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">Order Reference:</span>
                  <span className="font-mono font-extrabold text-slate-900">{fetchedOrder?.id || placedOrderId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">Current Status:</span>
                  <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                    {fetchedOrder?.orderStatus || 'Order Confirmed'}
                  </span>
                </div>
              </div>

              {/* 5-Step Pipeline Timeline */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-0">
                {[
                  { label: 'Order Confirmed', icon: <CheckCircle2 className="w-4 h-4" />, active: true },
                  { label: 'Nursery Packing & Coco Peat Wrap', icon: <Package className="w-4 h-4" />, active: fetchedOrder?.orderStatus !== 'PENDING' },
                  { label: 'Dispatched from Nursery', icon: <Truck className="w-4 h-4" />, active: fetchedOrder?.orderStatus === 'DISPATCHED' || fetchedOrder?.orderStatus === 'DELIVERED' || fetchedOrder?.orderStatus === 'OUT_FOR_DELIVERY' },
                  { label: 'Out for Delivery', icon: <Truck className="w-4 h-4" />, active: fetchedOrder?.orderStatus === 'OUT_FOR_DELIVERY' || fetchedOrder?.orderStatus === 'DELIVERED' },
                  { label: 'Delivered Safely', icon: <CheckCircle2 className="w-4 h-4" />, active: fetchedOrder?.orderStatus === 'DELIVERED' },
                ].map((s, i, arr) => (
                  <div key={s.label} className="flex items-start gap-3.5">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${s.active ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                        {s.icon}
                      </div>
                      {i < arr.length - 1 && (
                        <div className={`w-0.5 h-6 ${s.active ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                      )}
                    </div>
                    <div className="pt-1.5 pb-4">
                      <p className={`text-xs font-bold ${s.active ? 'text-emerald-950 font-black' : 'text-slate-400'}`}>
                        {s.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Courier Tracking Link */}
              {fetchedOrder?.trackingNumber && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
                  <p className="font-bold text-emerald-900">Courier Partner: {fetchedOrder.courierName}</p>
                  <p className="font-mono font-bold text-emerald-800">AWB Tracking Number: {fetchedOrder.trackingNumber}</p>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(fetchedOrder.courierName || 'Courier')}+tracking+${encodeURIComponent(fetchedOrder.trackingNumber)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-700 font-bold hover:underline"
                  >
                    <span>Track Courier Live</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 pb-6 pt-3 border-t border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleFetchOrderForTracking}
                disabled={trackLoading}
                className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {trackLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>REFRESH STATUS</span>
              </button>
              {onNavigateToHome && (
                <button
                  onClick={onNavigateToHome}
                  className="py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>RETURN TO SHOPPING</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
