import React, { useEffect, useState } from 'react';
import { Package, ArrowLeft, RefreshCw, CheckCircle2, Printer, Truck, ExternalLink, XCircle, AlertCircle, ShoppingBag } from 'lucide-react';
import { Order } from '../types';
import { InvoicePrint } from '../components/InvoicePrint';
import { getOrderStage, STAGE_CONFIG, isWhatsAppOrder } from '../utils/orderStages';
import { WhatsAppIcon } from '../components/WhatsAppIcon';


interface OrderStatusPageProps {
  orderId: string;
  onBackToHome: () => void;
}

export const OrderStatusPage: React.FC<OrderStatusPageProps> = ({ orderId, onBackToHome }) => {
  // Initialize from local caches instantly (< 0ms)
  const getInitialOrder = (): Order | null => {
    try {
      const cleanTarget = (orderId || '').toLowerCase().trim();
      const keys = ['vrg_my_orders', 'vrg_orders'];
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const found = list.find((o: any) => 
              o && (
                (o.id && String(o.id).toLowerCase() === cleanTarget) ||
                (o.merchantTransactionId && String(o.merchantTransactionId).toLowerCase() === cleanTarget) ||
                (o.trackingNumber && String(o.trackingNumber).toLowerCase() === cleanTarget)
              )
            );
            if (found) return found;
          }
        }
      }
    } catch {}
    return null;
  };

  const [order, setOrder] = useState<Order | null>(getInitialOrder);
  const [loading, setLoading] = useState(!order);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const fetchOrder = async () => {
    try {
      const cleanTarget = (orderId || '').trim();
      const res = await fetch(`/api/orders/${encodeURIComponent(cleanTarget)}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        try {
          const raw = localStorage.getItem('vrg_my_orders');
          const list = raw ? JSON.parse(raw) : [];
          if (Array.isArray(list)) {
            const idx = list.findIndex((o: any) => o.id === data.order.id || o.merchantTransactionId === data.order.merchantTransactionId);
            if (idx >= 0) {
              list[idx] = data.order;
            } else {
              list.unshift(data.order);
            }
            localStorage.setItem('vrg_my_orders', JSON.stringify(list));
          }
        } catch {}
      } else if (res.status === 404 || (data && !data.success)) {
        setOrder(null);
        // Clear from local caches
        ['vrg_my_orders', 'vrg_orders'].forEach(k => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                localStorage.setItem(k, JSON.stringify(list.filter((o: any) => 
                  o && o.id && 
                  String(o.id).toLowerCase() !== cleanTarget.toLowerCase() && 
                  (!o.merchantTransactionId || String(o.merchantTransactionId).toLowerCase() !== cleanTarget.toLowerCase())
                )));
              }
            }
          } catch {}
        });
      }
    } catch (err) {
      console.error('Error fetching order status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Terminal states require no further polling — order won't change
    const TERMINAL_STATUSES = new Set(['DELIVERED', 'CANCELLED', 'FAILED', 'REFUNDED']);
    const isTerminal = (o: Order | null) =>
      o && (TERMINAL_STATUSES.has(o.orderStatus) || TERMINAL_STATUSES.has(o.paymentStatus));

    // Adaptive poll: 10s for first 60s, then slow to 30s, stops on terminal state
    let elapsed = 0;
    const FAST_INTERVAL = 10000;  // 10s
    const SLOW_INTERVAL = 30000;  // 30s
    const FAST_PHASE_MS = 60000;  // stay fast for 1 min
    let intervalId: ReturnType<typeof setInterval>;

    const schedulePoll = () => {
      const delay = elapsed < FAST_PHASE_MS ? FAST_INTERVAL : SLOW_INTERVAL;
      intervalId = setInterval(async () => {
        // Stop polling once order is in a terminal state
        if (isTerminal(order)) {
          clearInterval(intervalId);
          return;
        }
        elapsed += delay;
        await fetchOrder();
        // Reschedule with potentially slower interval
        clearInterval(intervalId);
        schedulePoll();
      }, delay);
    };
    schedulePoll();

    // Instant 0ms cross-tab and in-window event listener
    const handleSync = (e: any) => {
      const detail = e?.detail;
      const targetClean = (orderId || '').trim().toLowerCase();
      if (detail && detail.orderId && detail.orderId.toLowerCase() === targetClean) {
        setOrder(prev => prev ? {
          ...prev,
          orderStatus: detail.status || prev.orderStatus,
          paymentStatus: detail.paymentStatus || prev.paymentStatus,
          updatedAt: new Date().toISOString()
        } : prev);
      }
      fetchOrder();
    };

    const handleOrderDeleted = (e: any) => {
      const delId = (e?.detail?.id || e?.detail?.deletedId || '').toLowerCase().trim();
      const targetClean = (orderId || '').trim().toLowerCase();
      if (delId && (delId === targetClean || delId === order?.merchantTransactionId?.toLowerCase())) {
        setOrder(null);
      }
    };

    window.addEventListener('orderStatusUpdated', handleSync);
    window.addEventListener('vrg_order_deleted', handleOrderDeleted);
    window.addEventListener('vrg_orders_sync', handleOrderDeleted);
    window.addEventListener('storage', handleSync);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('orderStatusUpdated', handleSync);
      window.removeEventListener('vrg_order_deleted', handleOrderDeleted);
      window.removeEventListener('vrg_orders_sync', handleOrderDeleted);
      window.removeEventListener('storage', handleSync);
    };
  }, [orderId]);

  if (loading && !order) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Loading live order & tracking details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Package className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-base">Order Not Found</h3>
        <p className="text-xs text-slate-500">
          We couldn't locate order reference <strong className="font-mono">{orderId}</strong>. Please verify the order number or check your account orders.
        </p>
        <button
          onClick={onBackToHome}
          className="w-full py-2.5 bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-900 transition-colors cursor-pointer"
        >
          Return to Nursery Shop
        </button>
      </div>
    );
  }

  const isCod = order.paymentMethod === 'COD';
  const isCancelled = (order.orderStatus || '').toUpperCase() === 'CANCELLED' || order.paymentStatus === 'FAILED';
  const isPendingOnline = !isCancelled && !isCod && order.paymentStatus === 'PENDING';
  const isSuccess = !isCancelled && !isPendingOnline && (order.paymentStatus === 'SUCCESS' || isCod);

  const currentStage = getOrderStage(order.orderStatus);
  const isDelivered = !isCancelled && currentStage === 'delivered';
  const isDispatched = !isCancelled && (currentStage === 'dispatched' || isDelivered);
  const isPacking = !isCancelled && (currentStage === 'packing' || isDispatched);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Nursery Shop</span>
        </button>

        <button
          onClick={fetchOrder}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Live Status</span>
        </button>
      </div>

      {/* Main Status Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border text-white shadow-lg space-y-4 ${
        isCancelled
          ? 'bg-rose-950 border-rose-800'
          : isPendingOnline
          ? 'bg-amber-950 border-amber-800'
          : isSuccess
          ? 'bg-emerald-900 border-emerald-800'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              isCancelled
                ? 'bg-rose-800 text-rose-100'
                : isPendingOnline
                ? 'bg-amber-800 text-amber-100'
                : isSuccess
                ? 'bg-emerald-700 text-emerald-100'
                : 'bg-slate-800 text-slate-200'
            }`}>
              {isCancelled ? (
                <XCircle className="w-8 h-8" />
              ) : isPendingOnline ? (
                <AlertCircle className="w-8 h-8" />
              ) : (
                <CheckCircle2 className="w-8 h-8" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-bold uppercase tracking-wider block">
                  {isCancelled
                    ? (order.paymentMethod === 'RAZORPAY' ? '❌ Razorpay Payment Cancelled / Unsuccessful' : '❌ Order Cancelled')
                    : isPendingOnline
                    ? (order.paymentMethod === 'RAZORPAY' ? '⏳ Razorpay Payment Incomplete' : '⏳ Payment Pending Verification')
                    : isWhatsAppOrder(order)
                    ? 'WhatsApp / Direct Order Confirmed'
                    : isCod 
                    ? '💵 Cash on Delivery Order Confirmed' 
                    : (order.paymentMethod === 'QR_PAYMENT' || order.paymentMethod === 'UPI_DIRECT')
                    ? (order.paymentStatus === 'SUCCESS' ? '✅ Scan QR Payment Verified' : order.paymentStatus === 'FAILED' ? '❌ Scan QR Payment Rejected (Unverified)' : '⏳ Scan QR Payment Pending Verification')
                    : isSuccess ? 'Payment Verified & Order Confirmed' : 'Payment Pending'}
                </span>
                {isWhatsAppOrder(order) && (
                  <span className="inline-flex items-center gap-1 bg-[#25D366] text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                    <span>WhatsApp Order</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-white">Order Reference #{order.id}</h1>
              <p className={`text-xs font-medium mt-0.5 ${
                isCancelled ? 'text-rose-200' : isPendingOnline ? 'text-amber-200' : 'text-emerald-200'
              }`}>
                {isCancelled
                  ? 'Payment was not completed. No amount was charged from your account.'
                  : isPendingOnline
                  ? 'We have not received payment confirmation for this order yet.'
                  : `Merchant Txn ID: `}
                {!isCancelled && !isPendingOnline && (
                  <strong className="font-mono text-white">{order.merchantTransactionId}</strong>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
            {isSuccess && (
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="px-4 py-2 bg-white text-emerald-950 font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Tax Invoice</span>
              </button>
            )}
            {isCancelled && (
              <button
                onClick={onBackToHome}
                className="px-4 py-2 bg-white text-rose-950 font-bold text-xs rounded-xl shadow-xs hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Shop Again</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dispatch & Courier Tracking Timeline */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-700" /> Live Nursery Delivery Timeline
          </h3>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border inline-block w-fit ${
            isCancelled
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : isPendingOnline
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            Current Stage: {isCancelled ? '❌ Order Cancelled / Unconfirmed' : isPendingOnline ? '⏳ Awaiting Payment' : isDelivered ? '4. Delivered' : isDispatched ? '3. Dispatched' : isPacking ? '2. Nursery Packing' : '1. Order Confirmed'}
          </span>
        </div>

        {/* Horizontal Timeline Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Stage 1 */}
          <div className={`p-3.5 rounded-2xl border-2 space-y-1 shadow-2xs ${
            isCancelled
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : isPendingOnline
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
          }`}>
            <div className="flex items-center justify-between">
              {isCancelled ? (
                <XCircle className="w-5 h-5 text-rose-700" />
              ) : isPendingOnline ? (
                <AlertCircle className="w-5 h-5 text-amber-700" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              )}
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                isCancelled
                  ? 'text-rose-900 bg-rose-100'
                  : isPendingOnline
                  ? 'text-amber-900 bg-amber-100'
                  : 'text-emerald-800 bg-emerald-100'
              }`}>
                {isCancelled ? '❌ CANCELLED' : isPendingOnline ? '⏳ PENDING' : '✓ DONE'}
              </span>
            </div>
            <p className="font-bold text-xs">
              {isCancelled ? '1. Not Confirmed' : isPendingOnline ? '1. Pending Payment' : '1. Order Confirmed'}
            </p>
            <p className={`text-[10.5px] ${isCancelled ? 'text-rose-700' : isPendingOnline ? 'text-amber-700' : 'text-emerald-800'}`}>
              {isCancelled
                ? (order.paymentMethod === 'RAZORPAY' ? 'Razorpay Cancelled' : 'Order Cancelled')
                : isPendingOnline
                ? 'Payment Unfinished'
                : isCod 
                ? 'Cash on Delivery' 
                : order.paymentMethod === 'RAZORPAY' 
                ? 'Razorpay Paid' 
                : (order.paymentMethod === 'QR_PAYMENT' || order.paymentMethod === 'UPI_DIRECT') 
                ? 'Scan QR Paid' 
                : 'Paid Online'}
            </p>
          </div>

          {/* Stage 2 */}
          <div className={`p-3.5 rounded-2xl border-2 space-y-1 transition-all shadow-2xs ${
            isPacking
              ? (currentStage === 'packing')
                ? 'bg-purple-50 border-purple-400 text-purple-950 font-bold ring-2 ring-purple-300'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center justify-between">
              <Package className={`w-5 h-5 ${isPacking ? (currentStage === 'packing' ? 'text-purple-700' : 'text-emerald-700') : 'text-slate-400'}`} />
              {isPacking && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                  currentStage === 'packing'
                    ? 'text-purple-900 bg-purple-100 animate-pulse'
                    : 'text-emerald-800 bg-emerald-100'
                }`}>
                  {currentStage === 'packing' ? '⚡ IN PROGRESS' : '✓ DONE'}
                </span>
              )}
            </div>
            <p className="font-bold text-xs">2. Nursery Packing</p>
            <p className="text-[10.5px] text-slate-600">
              {isPacking ? 'Roots packed with cocopeat' : 'Pending packaging'}
            </p>
          </div>

          {/* Stage 3 */}
          <div className={`p-3.5 rounded-2xl border-2 space-y-1 transition-all shadow-2xs ${
            isDispatched
              ? (currentStage === 'dispatched')
                ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-2 ring-blue-300'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center justify-between">
              <Truck className={`w-5 h-5 ${isDispatched ? (currentStage === 'dispatched' ? 'text-blue-700' : 'text-emerald-700') : 'text-slate-400'}`} />
              {isDispatched && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                  currentStage === 'dispatched' ? 'text-blue-900 bg-blue-100 animate-pulse' : 'text-emerald-800 bg-emerald-100'
                }`}>
                  {currentStage === 'dispatched' ? '🚚 IN TRANSIT' : '✓ DONE'}
                </span>
              )}
            </div>
            <p className="font-bold text-xs">3. Dispatched</p>
            <p className="text-[10.5px] text-slate-600">
              {order.courierName ? `${order.courierName}` : isDispatched ? 'Courier in transit' : 'Awaiting dispatch'}
            </p>
          </div>

          {/* Stage 4 */}
          <div className={`p-3.5 rounded-2xl border-2 space-y-1 transition-all shadow-2xs ${
            isDelivered
              ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-black ring-2 ring-emerald-400'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center justify-between">
              <CheckCircle2 className={`w-5 h-5 ${isDelivered ? 'text-emerald-700' : 'text-slate-400'}`} />
              {isDelivered && (
                <span className="text-[10px] font-black text-emerald-900 bg-emerald-200 px-1.5 py-0.5 rounded-md">
                  🎉 DELIVERED
                </span>
              )}
            </div>
            <p className="font-bold text-xs">4. Delivered</p>
            <p className="text-[10.5px] text-slate-600">{isDelivered ? 'Delivered safely' : 'Awaiting delivery'}</p>
          </div>
        </div>

        {/* Courier Tracking Link Box */}
        {order.trackingNumber && (
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-emerald-900 block text-sm">Courier Partner: {order.courierName || 'ST Courier'}</span>
              <span className="font-mono font-semibold text-emerald-800">AWB Tracking No: {order.trackingNumber}</span>
            </div>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(order.courierName || 'Courier')}+tracking+${encodeURIComponent(order.trackingNumber)}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <span>Track Courier Online</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Order Item Details Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-base text-slate-900">
            Plants in This Shipment ({order.items.length})
          </h3>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
            {order.items.map(i => i.name).join(', ')}
          </span>
        </div>

        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-3">
                <img src={item.image || '/products/eq.jpeg'} alt={item.name} className="w-12 h-12 object-cover rounded-xl border shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{item.name}</h4>
                  {item.tamilName && <p className="text-emerald-800 font-semibold text-[11px]">{item.tamilName}</p>}
                  {item.sku && <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</p>}
                </div>
              </div>
              <div className="text-right font-bold text-slate-900 shrink-0">
                <p>Qty: {item.quantity}</p>
                <p className="text-emerald-800 text-xs">₹{item.price * item.quantity}</p>
                {item.quantity > 1 && <p className="text-[10px] text-slate-400 font-normal">(₹{item.price} each)</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing & Courier Details Breakdown */}
        <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs text-slate-700">
          <div className="flex justify-between items-center">
            <span className="font-medium">
              {(order as any).courierPartner === 'METTUR_PARCEL' || order.courierName?.includes('Mettur') ? '📦 Packing Fee:' : '🚚 Courier Delivery:'}
            </span>
            <span className="font-bold text-slate-900">
              {order.courierName || 'Professional Courier'}
              {order.courierBranch ? ` (${order.courierBranch})` : ''}
              {order.shippingCharge === 0 ? ' — FREE' : ` — ₹${order.shippingCharge}`}
            </span>
          </div>

          {Boolean(order.packingCharge) && (
            <div className="flex justify-between items-center text-emerald-800 font-semibold">
              <span className="flex items-center gap-1">🛡️ Protective Packaging:</span>
              <span className="font-bold">
                +₹{order.packingCharge} ({order.packingOption === 'EXTRA_SECURE' ? 'Extra Secure' : 'Maximum Protection'})
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>
              {isCancelled 
                ? 'Total Amount (Unpaid / Cancelled):' 
                : isCod 
                ? 'Total Payable via Cash on Delivery:' 
                : order.paymentMethod === 'RAZORPAY' 
                ? 'Total Paid via Razorpay:' 
                : 'Total Paid Online:'}
            </span>
            <span className={isCancelled ? 'text-rose-700 text-base font-bold' : 'text-emerald-800 text-base font-black'}>
              ₹{order.grandTotal}
            </span>
          </div>
        </div>
      </div>

      {/* Courier & Reduce Soil Planting Care Instructions Guide */}
      <div className="bg-amber-50/80 p-6 rounded-3xl border-2 border-amber-300 shadow-xs space-y-4 text-xs text-slate-800">
        <div className="flex items-center justify-between border-b border-amber-200 pb-3">
          <h3 className="font-extrabold text-sm sm:text-base text-amber-950 flex items-center gap-2">
            <span>📦</span>
            <span>Professional Courier & Reduce Soil Plant Care Instructions</span>
          </h3>
          <span className="bg-rose-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
            📹 UNBOXING VIDEO MUST
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 space-y-2">
          <p className="font-bold text-amber-900 text-xs">
            🚚 Your parcel dispatched today / In Transit
          </p>
          <p className="text-slate-700 leading-relaxed">
            ⚠️ <strong>If parcel didn't receive in 2 days</strong> remind me once & check nearby courier office or check website:
          </p>
          <p className="font-semibold text-amber-950 bg-amber-100/60 p-2.5 rounded-xl border border-amber-200">
            "உங்களுடைய கொரியர் 2 வேலை நாட்களில் வரவில்லை என்றால் அருகில் உள்ள கொரியர் ஆஃபீஸ் ஐ அணுகவும். அப்படி இல்லையென்றால் என்னிடம் தெரிவிக்கவும்."
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 space-y-3">
          <h4 className="font-extrabold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span>🌿</span>
            <span>For Reduce Soil Plants 👇 (மண்ணை குறைத்து வாங்கும் முறையில் வாங்கினால்)</span>
          </h4>

          <ol className="space-y-2.5 text-slate-700 list-decimal list-inside font-medium leading-relaxed">
            <li>
              <strong>Professional Courier la chedi vanguringana:</strong> Plants receive pannathum oru bucket la thanni oothi athula covers ellam chinna holes potu vachirunga.
            </li>
            <li>
              Oru <strong>4 to 5 hrs kalichu</strong> chediyai red soil la nadalam nga (chinna cover remove pannirunga).
            </li>
            <li>
              <strong>Pot la vachingana:</strong> Half shade (oralavuku veyil padura mari) area ah va paathu oru 10 naaliku vainga. <strong>Nilathula vachingana:</strong> 10 days ku shade irukura mari edhachum erpaduthi vainga (Fulla nilal vendaam sunlight padura mari oralavuku).
            </li>
            <li>
              <strong>20 days la irunthu 30 days varaikum:</strong> Entha uramum (DAP) kudukathinga. தொழு உரமும் use பண்ணாதீங்க.
            </li>
            <li>
              <strong>Regular ah watering panunga:</strong> Iram ilamal kaaya vidathinga (Water thengi irukumpadi vaikathinga).
            </li>
            <li>
              Chedi vaikkum thottiyai dry aagamal <strong>kaalai, maalai iru velaikalum</strong> iiramaga irukumpadi paarthu kollaum (Athey samayam thanner thengamaal paarthukollaum).
            </li>
          </ol>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-bold text-[11px] leading-relaxed">
            🚫 Chediyai coco peat vaithu nadavu seiyya vendam. Chedi cut seithaal manjal thuul vaikka koodathu. Mukkiyamaga soil red soil dhan use panna vendum (Your garden soil literally same as red soil athu kooda use pannikalam).
            <p className="mt-1 text-rose-950 font-black">
              *IF NOT FOLLOW THIS INSTRUCTIONS AND PLANT DIE BACK AGAIN WE ARE NOT RESPONSIBLE FOR THAT*
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 space-y-2.5">
          <h4 className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
            <span>⭐</span>
            <span>Customer Review Procedure (intha method la unga kita ithu ellam iruntha use panunga illana mela solli iruka koodiya procedure use panunga)</span>
          </h4>
          <ul className="space-y-1.5 text-slate-700 list-disc list-inside font-medium leading-relaxed">
            <li>Mudhalil chediyai oru bucket la 6 hrs cover (reduce soil plants) holes pottu kandipa vaikanum. Apo dhan chedi ku dullness koncham pogum.</li>
            <li>Reduce soil vanguningana antha cover ah remove panitu 1 gm alavu <strong>EPSOM SALT</strong> one litre water la mix pani karaichitu, 1st chediyai fulla dip panirunga nanaikira maari. Then antha soil ah wash pani bare root ah eduthukonga.</li>
            <li>Then 1 gm of <strong>SAAF</strong> one litre la mix pani, THEN plant ah fulla saaf water la dip pani edunga.</li>
            <li>Aduthatha chediyai red soil konchama tholu uram irunthal mix panikonga athula plant pani sun light padura mari vaikalam.</li>
          </ul>
          <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
            "Intha method customer enga kita reduce soil la vangi avanga epdi valarthanga apdindratha sonna method. Ungaluku pudichi panna mudium na intha method um try panalam. Ithu naana solala review sonathu ungalukum share paniruken."
          </p>
        </div>
      </div>

      {/* Printable Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
          <InvoicePrint order={order} onClose={() => setShowInvoiceModal(false)} />
        </div>
      )}
    </div>
  );
};
