import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, ArrowLeft, ArrowRight, ShoppingBag, Check, Truck, MapPin, Tag,
  ShieldCheck, Package, CheckCircle2, CreditCard, QrCode, Copy,
  CheckCircle, Upload, AlertCircle, Image as ImageIcon, Trash2, Plus, Minus,
  Download, ExternalLink, RefreshCw, FileText
} from 'lucide-react';
import { CartItem, ShippingAddress, PaymentMethod, User, SiteSettings } from '../types';
import { INDIAN_STATES, isTamilNadu } from '../utils/delivery';
import { computeOrderTotals } from '../utils/orderTotals';

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
  }) => Promise<{ success: boolean; orderId?: string; message?: string }>;
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onNavigateToAccount: () => void;
}

type DeliveryOptionType = 'REDUCED_SOIL' | 'FULL_SOIL' | 'METTUR_PARCEL';

const getDeliveryChargeForOption = (opt: DeliveryOptionType, count: number): number => {
  if (opt === 'REDUCED_SOIL') return count * 60;
  if (opt === 'FULL_SOIL') return count * 100;
  if (opt === 'METTUR_PARCEL') {
    if (count < 3) return 60;
    return Math.ceil(count / 6) * 60;
  }
  return count * 60;
};

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
  onUpdateQuantity,
  onRemoveItem,
  onNavigateToAccount,
}) => {
  // ── Step state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);

  // Go to step with browser history push
  const goTo = useCallback((next: number, replace = false) => {
    if (animating) return;
    const isForward = next > step;
    setDirection(isForward ? 'forward' : 'back');
    setAnimating(true);
    setStep(next);

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
    if (window.history.state && window.history.state.vrgCart) {
      window.history.back();
    } else {
      onClose();
    }
  }, [onClose]);

  // Handle in-app back buttons with history sync
  const handleGoBack = useCallback((fallbackStep?: number) => {
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

    // Push initial step 1 state if not already set
    if (!window.history.state || !window.history.state.vrgCart) {
      window.history.pushState({
        vrgCart: true,
        cartStep: 1
      }, '', window.location.pathname);
    }

    const handleCartPopState = (e: PopStateEvent) => {
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
  const [address, setAddress] = useState<ShippingAddress>({
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
    addressType: 'Home',
  });
  const [addrError, setAddrError] = useState<string | null>(null);

  // ── Delivery / Packing Selection ──────────────────────────────────────────
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOptionType>('REDUCED_SOIL');

  // Total plant count
  const subtotal = items.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0);
  const totalPlantCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Auto fallback if option becomes unavailable due to plant count changes
  useEffect(() => {
    if (deliveryOption === 'FULL_SOIL' && totalPlantCount > 5) {
      setDeliveryOption('REDUCED_SOIL');
    }
    if (deliveryOption === 'METTUR_PARCEL' && totalPlantCount < 3) {
      setDeliveryOption('REDUCED_SOIL');
    }
  }, [totalPlantCount, deliveryOption]);

  const shippingCharge = getDeliveryChargeForOption(deliveryOption, totalPlantCount);
  const potCharge = 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, subtotal + shippingCharge - discountAmount);

  // ── Terms ──────────────────────────────────────────────────────────────────
  const [termsAccepted, setTermsAccepted] = useState(false);

  // ── Payment ────────────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PHONEPE');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // ── Order result ───────────────────────────────────────────────────────────
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [fetchedOrder, setFetchedOrder] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);

  // scroll to top on step change
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // fetch site settings
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { if (d.success && d.settings) setSiteSettings(d.settings); })
      .catch(() => {});
  }, []);

  // reset step when opened
  useEffect(() => {
    if (isOpen) setStep(1);
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

  const isPhonePeEnabled = siteSettings ? siteSettings.enablePhonePe !== false : true;
  const isCodEnabled = siteSettings ? siteSettings.enableCod !== false : true;
  const isQrEnabled = siteSettings ? siteSettings.enableQrPayment !== false : true;
  const isRazorpayEnabled = siteSettings?.enableRazorpay === true;

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

  const handlePlaceOrder = async () => {
    if (!user) { setOrderError('🔒 Login required to place an order.'); return; }
    if (uploadingImage) { setOrderError('Please wait — processing payment screenshot.'); return; }
    const effectivePM: PaymentMethod = (paymentMethod === 'QR_PAYMENT' || Boolean(paymentProofUrl)) ? 'QR_PAYMENT' : paymentMethod;
    if (effectivePM === 'QR_PAYMENT' && !paymentProofUrl) {
      setOrderError('📸 Please upload payment screenshot before placing order.');
      return;
    }
    setLoading(true);
    setOrderError(null);
    try {
      const rawPhone = (address.phone || user.phone || '').replace(/\D/g, '');
      const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
      const cleanEmail = (user.email?.includes('@')) ? user.email : `cust${cleanPhone}@veerikanursery.com`;
      const res = await onPlaceOrder({
        customerName: address.fullName || user.name || 'Customer',
        customerPhone: cleanPhone,
        customerEmail: cleanEmail,
        shippingAddress: { ...address, phone: cleanPhone },
        paymentMethod: effectivePM,
        paymentProofUrl: effectivePM === 'QR_PAYMENT' ? paymentProofUrl : undefined,
        transactionId: effectivePM === 'QR_PAYMENT' ? transactionId : undefined,
        potCharge: 0,
        potOption: deliveryOption === 'METTUR_PARCEL' ? 'Mettur Parcel Service' : deliveryOption === 'FULL_SOIL' ? 'Professional Courier - Full Soil' : 'Professional Courier - Reduced Soil',
      });
      setLoading(false);
      if (res.success) {
        setPlacedOrderId(res.orderId || null);
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-white" style={{ touchAction: 'pan-y' }}>
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
        className="flex-1 overflow-y-auto overscroll-contain"
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
                items.map((item) => (
                  <div key={item.product.id} className="flex gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 items-center">
                    <img
                      src={item.product.images?.[0] || '/products/double-delight.jpeg'}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{item.product.name}</h4>
                      {item.product.tamilName && (
                        <p className="text-[11px] text-emerald-700 font-medium">{item.product.tamilName}</p>
                      )}
                      <p className="text-xs font-extrabold text-slate-800 mt-0.5">₹{item.product.sellingPrice}</p>
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
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-4 pb-6 pt-3 border-t border-slate-100 bg-white space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span className="font-medium">{items.reduce((s, i) => s + i.quantity, 0)} plant(s) in cart</span>
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
            STEP 2 — Order Summary
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col min-h-full">
            <Header title="Order Summary" subtitle={`(${items.length} item${items.length !== 1 ? 's' : ''})`} onBack={() => handleGoBack(1)} />

            <div className="flex-1 px-4 py-3 space-y-4">
              {/* State selector */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
                <label className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  🚚 Delivery State Rate Preview:
                </label>
                <select
                  value={previewState}
                  onChange={(e) => setPreviewState(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                >
                  {INDIAN_STATES.map(st => (
                    <option key={st} value={st}>{st} {isTamilNadu(st) ? '(₹60 base shipping)' : '(₹100 base shipping)'}</option>
                  ))}
                </select>
              </div>

              {/* Coupon */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
                <label className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  Apply Coupon / Discount Code
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
                    <span className="font-bold text-emerald-800">✅ {appliedCoupon.code} (−₹{appliedCoupon.discountAmount})</span>
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

              {/* Price breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-bold text-slate-900">₹{summaryTotals.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Delivery Fee:</span>
                  <span className="font-bold text-slate-900">₹{summaryTotals.shippingFee}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount:</span>
                    <span>−₹{summaryTotals.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-emerald-800 text-base">₹{summaryTotals.grandTotal}</span>
                </div>
              </div>
            </div>

            <div className="px-4 pb-6 pt-3 border-t border-slate-100 bg-white">
              {!user && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold">
                  🔒 Login required to checkout.{' '}
                  <button onClick={() => { handleClose(); onNavigateToAccount(); }} className="underline font-bold cursor-pointer">Login / Sign Up →</button>
                </div>
              )}
              <ProceedBtn label="PROCEED TO CHECKOUT" onClick={() => goTo(3)} />
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
              <ProceedBtn label="PROCEED TO PAYMENT METHOD" type="submit" />
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 4 — Delivery / Packing
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="flex flex-col min-h-full">
            <Header title="🚚 Delivery / Packing" subtitle="Options change automatically based on plant quantity." onBack={() => handleGoBack(3)} />

            <div className="flex-1 px-4 py-3 space-y-4">
              {/* Items Summary */}
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.product.id} className="flex gap-3 bg-white p-3 rounded-2xl border border-slate-200 items-center">
                    <img src={item.product.images?.[0] || '/products/double-delight.jpeg'} alt={item.product.name} className="w-12 h-12 object-cover rounded-xl border shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[11px] text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-xs text-slate-900">₹{item.product.sellingPrice * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Delivery / Packing options */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    🚚 Delivery / Packing Options
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Options change automatically based on plant quantity ({totalPlantCount} plant{totalPlantCount !== 1 ? 's' : ''}).
                  </p>
                </div>

                <div className="space-y-2.5">
                  {/* Option 1: Professional Courier - Reduced Soil */}
                  <div
                    onClick={() => setDeliveryOption('REDUCED_SOIL')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${deliveryOption === 'REDUCED_SOIL' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <input type="radio" checked={deliveryOption === 'REDUCED_SOIL'} onChange={() => setDeliveryOption('REDUCED_SOIL')} className="mt-0.5 accent-emerald-600 cursor-pointer" />
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">🌿 Professional Courier – Reduced Soil</h4>
                          <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded-md mt-1">Available</span>
                          <p className="text-[10px] text-slate-600 font-semibold mt-1">Delivery Charge: ₹60 for each plant</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-slate-900 block">₹{totalPlantCount * 60}</span>
                        <span className="text-[9px] text-slate-400 font-medium">({totalPlantCount} × ₹60)</span>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Professional Courier - Full Soil */}
                  {(() => {
                    const isAvail = totalPlantCount <= 5;
                    return (
                      <div
                        onClick={() => { if (isAvail) setDeliveryOption('FULL_SOIL'); }}
                        className={`p-3.5 rounded-xl border-2 transition-all ${!isAvail ? 'opacity-50 border-slate-200 bg-slate-100 cursor-not-allowed' : deliveryOption === 'FULL_SOIL' ? 'border-emerald-600 bg-emerald-50 cursor-pointer' : 'border-slate-200 bg-white cursor-pointer'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <input type="radio" disabled={!isAvail} checked={deliveryOption === 'FULL_SOIL'} onChange={() => { if (isAvail) setDeliveryOption('FULL_SOIL'); }} className="mt-0.5 accent-emerald-600 cursor-pointer" />
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-900">🌱 Professional Courier – Full Soil</h4>
                              <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold rounded-md mt-1 ${isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {isAvail ? 'Maximum 5 plants' : 'Unavailable (Max 5 plants)'}
                              </span>
                              <p className="text-[10px] text-slate-600 font-semibold mt-1">Delivery Charge: ₹100 for each plant</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-slate-900 block">₹{totalPlantCount * 100}</span>
                            <span className="text-[9px] text-slate-400 font-medium">({totalPlantCount} × ₹100)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Option 3: Mettur Parcel Service */}
                  {(() => {
                    const isAvail = totalPlantCount >= 3;
                    const metturCharge = getDeliveryChargeForOption('METTUR_PARCEL', totalPlantCount);
                    return (
                      <div
                        onClick={() => { if (isAvail) setDeliveryOption('METTUR_PARCEL'); }}
                        className={`p-3.5 rounded-xl border-2 transition-all ${!isAvail ? 'opacity-60 border-slate-200 bg-amber-50/50 cursor-not-allowed' : deliveryOption === 'METTUR_PARCEL' ? 'border-emerald-600 bg-emerald-50 cursor-pointer' : 'border-slate-200 bg-white cursor-pointer'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <input type="radio" disabled={!isAvail} checked={deliveryOption === 'METTUR_PARCEL'} onChange={() => { if (isAvail) setDeliveryOption('METTUR_PARCEL'); }} className="mt-0.5 accent-emerald-600 cursor-pointer" />
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-900">📦 Mettur Parcel Service</h4>
                              <p className="text-[10px] text-slate-500 font-medium">All India • Available from 3 plants • Full Soil / Open Box</p>
                              <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold rounded-md mt-1 ${isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {isAvail ? 'Available' : 'Available from 3 plants'}
                              </span>
                              <p className="text-[10px] text-slate-600 font-semibold mt-1">Packing / Delivery Charge: ₹60 (upto 6 plants ₹60, 7–12 plants ₹120)</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {isAvail ? (
                              <>
                                <span className="text-xs font-extrabold text-slate-900 block">₹{metturCharge}</span>
                                <span className="text-[9px] text-emerald-700 font-bold">{totalPlantCount <= 6 ? 'Upto 6 plants' : '7–12 plants'}</span>
                              </>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700 block">Min 3 plants</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
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
                      {deliveryOption === 'METTUR_PARCEL' ? 'Mettur Parcel Service' : deliveryOption === 'FULL_SOIL' ? 'Courier (Full Soil)' : 'Courier (Reduced Soil)'}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">₹{shippingCharge}</span>
                </div>
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
              <ProceedBtn label="PROCEED TO CHECKOUT" onClick={() => goTo(5)} />
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

              {/* QR Payment Panel */}
              {paymentMethod === 'QR_PAYMENT' && isQrEnabled && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-4 space-y-4">
                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-2 rounded-2xl border-2 border-indigo-200 shadow-sm">
                      <img src={qrCodeUrl} alt="UPI QR Code" className="w-44 h-44 object-contain rounded-xl" />
                    </div>
                    <p className="text-[11px] font-extrabold text-indigo-900">📱 Scan to pay ₹{grandTotal}</p>
                    <a href={upiDeepLink} className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer">
                      ⚡ Pay ₹{grandTotal} via GPay/PhonePe
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
              <button
                onClick={handlePlaceOrder}
                disabled={loading || !user}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>CONFIRM & PLACE ORDER</span>
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
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 text-xs">
                {fetchedOrder ? (
                  <>
                    {fetchedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-none">
                        <span className="font-semibold text-slate-800">{item.name} × {item.quantity}</span>
                        <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Plant Total</span>
                      <span className="font-bold text-slate-900">₹{fetchedOrder.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Delivery</span>
                      <span className="font-bold text-slate-900">
                        {fetchedOrder.potOption && fetchedOrder.potOption !== 'NONE' ? 'Reduced Soil' : `₹${fetchedOrder.shippingCharge}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Grand Total</span>
                      <span className="text-emerald-800">₹{fetchedOrder.grandTotal}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-600">Status</span>
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                        {fetchedOrder.paymentMethod === 'COD' ? 'COD CONFIRMED' : fetchedOrder.paymentStatus}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center">
                    <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 mt-2">Loading order details...</p>
                  </div>
                )}
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-[11px] text-emerald-800 font-medium">
                🌱 Your order will normally be dispatched within 5–6 working days after order confirmation. After dispatch, you will normally receive the plants within 1–2 days.
              </div>
            </div>

            <div className="px-4 pb-6 pt-3 border-t border-slate-100 bg-white">
              <button
                onClick={() => goTo(8)}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>VIEW RECEIPT →</span>
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

                  {fetchedOrder?.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="font-semibold text-slate-700">{item.name} × {item.quantity}</span>
                      <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}

                  <div className="border-t border-slate-200 pt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Plant Total</span>
                      <span className="font-semibold text-slate-900">₹{fetchedOrder?.subtotal ?? subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Delivery Charge</span>
                      <span className="font-semibold text-slate-900">₹{fetchedOrder?.shippingCharge ?? shippingCharge}</span>
                    </div>
                    {(fetchedOrder?.potCharge > 0 || potCharge > 0) && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Pot Charge</span>
                        <span className="font-semibold text-slate-900">₹{fetchedOrder?.potCharge ?? potCharge}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-extrabold text-sm border-t border-slate-300 pt-2">
                      <span className="text-slate-900">Grand Total</span>
                      <span className="text-emerald-800">₹{fetchedOrder?.grandTotal ?? grandTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Payment</span>
                      <span className={`font-extrabold text-[11px] px-2.5 py-0.5 rounded-full ${fetchedOrder?.paymentStatus === 'SUCCESS' || fetchedOrder?.paymentMethod === 'COD' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {fetchedOrder?.paymentMethod === 'COD' ? 'COD' : fetchedOrder?.paymentStatus || 'Pending'}
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
