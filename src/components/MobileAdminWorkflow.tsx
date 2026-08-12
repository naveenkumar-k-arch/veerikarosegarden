import React, { useState, useMemo } from 'react';
import { Order, Product, Category, Review } from '../types';
import {
  Sprout,
  LayoutDashboard,
  Calendar,
  FileText,
  Sliders,
  ArrowLeft,
  Check,
  Phone,
  MapPin,
  User,
  Package,
  Printer,
  Truck,
  ExternalLink,
  Copy,
  ChevronRight,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  FolderTree,
  Tag,
  Star,
  DollarSign,
  Settings as SettingsIcon,
  ShieldCheck,
  LogOut,
  Monitor,
  X
} from 'lucide-react';
import { A4LabelSheetPrint } from './A4LabelSheetPrint';

export interface MobileAdminWorkflowProps {
  orders: Order[];
  products: Product[];
  categories: Category[];
  reviews: Review[];
  adminUser?: { id: string; name: string; email: string; role: string } | null;
  onUpdateOrderStatus: (orderId: string, newStatus: string, paymentStatus?: string) => Promise<void>;
  onSaveTracking: (orderId: string, trackingData: { courierName: string; trackingNumber: string; deliveryNotes?: string }) => Promise<void>;
  onBackToStore: () => void;
  onOpenDesktopTab?: (tabKey: string) => void;
  onLogout?: () => void;
}

type ScreenType =
  | 'dashboard'
  | 'orders_new'
  | 'orders_confirmed'
  | 'verify_payment'
  | 'confirm_order'
  | 'generate_labels'
  | 'dispatch_order'
  | 'order_timeline'
  | 'menu_drawer';

export const MobileAdminWorkflow: React.FC<MobileAdminWorkflowProps> = ({
  orders,
  products,
  adminUser,
  onUpdateOrderStatus,
  onSaveTracking,
  onBackToStore,
  onOpenDesktopTab,
  onLogout
}) => {
  // Navigation & Screen state
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [activeBottomTab, setActiveBottomTab] = useState<'dashboard' | 'orders' | 'labels' | 'menu'>('dashboard');
  
  // Selected order for detailed workflow screens (Verify Payment, Confirm, Dispatch, Timeline)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Orders filter states
  const [orderListFilter, setOrderListFilter] = useState<'new' | 'pending_payment' | 'all'>('new');
  const [confirmedFilter, setConfirmedFilter] = useState<'all' | 'packing' | 'dispatched'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Label Generation State
  const [selectedLabelOrderIds, setSelectedLabelOrderIds] = useState<string[]>([]);
  const [showLabelPrintPreview, setShowLabelPrintPreview] = useState(false);

  // WhatsApp Modal State (For Screen 6 & 11)
  const [whatsAppModal, setWhatsAppModal] = useState<{
    open: boolean;
    type: 'confirmation' | 'tracking';
    order: Order | null;
    message: string;
    phone: string;
  } | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Dispatch Form State (Screen 10)
  const [dispatchForm, setDispatchForm] = useState({
    courierName: 'Delhivery',
    dispatchId: '',
    trackingId: '',
    trackingLink: ''
  });
  const [savingDispatch, setSavingDispatch] = useState(false);

  // Quick stats calculation
  const stats = useMemo(() => {
    const newOrders = orders.filter(o => o.orderStatus === 'PENDING' || !o.orderStatus);
    const pendingPayment = orders.filter(o => o.paymentStatus === 'PENDING' || !o.paymentStatus);
    const confirmedOrders = orders.filter(o => 
      o.orderStatus === 'CONFIRMED' || 
      o.orderStatus === 'PROCESSING' || 
      (o.orderStatus as any) === 'PACKING' || 
      (o.orderStatus as any) === 'PACKED'
    );
    const dispatchedOrders = orders.filter(o => o.orderStatus === 'DISPATCHED');

    return {
      newOrdersCount: newOrders.length,
      pendingPaymentCount: pendingPayment.length,
      confirmedCount: confirmedOrders.length,
      dispatchedCount: dispatchedOrders.length
    };
  }, [orders]);

  // Helpers for formatted dates & addresses
  const formatDate = (dateStr?: string) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr?: string) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatAddress = (address: any) => {
    if (!address) return 'No delivery address recorded';
    if (typeof address === 'string') return address;
    const parts = [
      address.houseNo,
      address.street,
      address.villageTown,
      address.district,
      address.state,
      address.pincode
    ].filter(Boolean);
    return parts.join(', ');
  };

  // WhatsApp Message Generator (Screen 6 & 11)
  const generateConfirmationMessage = (order: Order) => {
    const customerName = order.customerName || order.shippingAddress?.fullName || 'Customer';
    const dateStr = formatDate(order.createdAt);
    
    let itemsList = '';
    if (order.items && order.items.length > 0) {
      itemsList = order.items
        .map((item, idx) => `${idx + 1}. ${item.name} - ${item.quantity || 1} No`)
        .join('\n');
    } else {
      itemsList = '1. Nursery Plant Sapling - 1 No';
    }

    return `🚚 Dear ${customerName},

Thank you for your order!
Your order has been confirmed successfully.

📦 Order ID: ${order.id}
📅 Date: ${dateStr}

Your Ordered Plants:
${itemsList}

We will pack your plants with care and deliver safe & fresh.

Thank you! 🌿
- VRG Nursery`;
  };

  const generateTrackingMessage = (order: Order, courier: string, trackingId: string, trackLink: string) => {
    const customerName = order.customerName || order.shippingAddress?.fullName || 'Customer';
    const link = trackLink || `https://${courier.toLowerCase().replace(/\s+/g, '')}.com/track/${trackingId}`;

    return `🚚 Dear ${customerName},

Your order has been dispatched successfully.

📦 Order ID: ${order.id}
📦 Courier: ${courier}
📦 Tracking ID: ${trackingId}

🔗 Track your order using the link below 👇
${link}

Thank you for shopping with VRG Nursery! 🌿`;
  };

  const handleOpenWhatsAppConfirmation = (order: Order) => {
    const msg = generateConfirmationMessage(order);
    const rawPhone = order.customerPhone || order.shippingAddress?.phone || '';
    const phone = rawPhone.replace(/[^0-9]/g, '');
    setWhatsAppModal({
      open: true,
      type: 'confirmation',
      order,
      message: msg,
      phone: phone.startsWith('91') ? phone : `91${phone}`
    });
  };

  const handleOpenWhatsAppTracking = (order: Order) => {
    const courier = order.courierName || 'Delhivery';
    const trackId = order.trackingNumber || '1234567890123';
    const trackLink = order.deliveryNotes?.includes('http') ? order.deliveryNotes : `https://delhivery.com/track/${trackId}`;
    const msg = generateTrackingMessage(order, courier, trackId, trackLink);
    const rawPhone = order.customerPhone || order.shippingAddress?.phone || '';
    const phone = rawPhone.replace(/[^0-9]/g, '');
    setWhatsAppModal({
      open: true,
      type: 'tracking',
      order,
      message: msg,
      phone: phone.startsWith('91') ? phone : `91${phone}`
    });
  };

  const handleCopyMessage = () => {
    if (whatsAppModal?.message) {
      navigator.clipboard.writeText(whatsAppModal.message);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  const handleLaunchWhatsApp = () => {
    if (whatsAppModal) {
      const url = `https://wa.me/${whatsAppModal.phone}?text=${encodeURIComponent(whatsAppModal.message)}`;
      window.open(url, '_blank');
    }
  };

  // Tracking link auto-generator helper
  const handleCourierChange = (courier: string) => {
    setDispatchForm(prev => {
      let link = '';
      const tid = prev.trackingId || prev.dispatchId;
      if (tid) {
        if (courier === 'Delhivery') link = `https://delhivery.com/track/${tid}`;
        else if (courier === 'ST Courier') link = `https://stcourier.com/track/${tid}`;
        else if (courier === 'Professional Courier') link = `https://www.tpcindia.com/track.aspx?docno=${tid}`;
        else if (courier === 'DTDC') link = `https://www.dtdc.in/tracking/tracking_results.asp?Tid=${tid}`;
        else if (courier === 'India Post') link = `https://www.indiapost.gov.in/`;
        else link = `https://${courier.toLowerCase().replace(/\s+/g, '')}.com/track/${tid}`;
      }
      return { ...prev, courierName: courier, trackingLink: link };
    });
  };

  const handleAwbChange = (awb: string) => {
    setDispatchForm(prev => {
      let link = prev.trackingLink;
      if (prev.courierName === 'Delhivery') link = `https://delhivery.com/track/${awb}`;
      else if (prev.courierName === 'ST Courier') link = `https://stcourier.com/track/${awb}`;
      else if (prev.courierName === 'Professional Courier') link = `https://www.tpcindia.com/track.aspx?docno=${awb}`;
      else if (prev.courierName === 'DTDC') link = `https://www.dtdc.in/tracking/tracking_results.asp?Tid=${awb}`;
      return {
        ...prev,
        dispatchId: awb,
        trackingId: awb,
        trackingLink: link
      };
    });
  };

  // Filtering orders for Screen 3 & Screen 7
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (currentScreen === 'orders_new') {
      if (orderListFilter === 'new') {
        list = list.filter(o => o.orderStatus === 'PENDING' || !o.orderStatus);
      } else if (orderListFilter === 'pending_payment') {
        list = list.filter(o => o.paymentStatus === 'PENDING' || !o.paymentStatus);
      }
    } else if (currentScreen === 'orders_confirmed') {
      if (confirmedFilter === 'all') {
        list = list.filter(o => 
          o.orderStatus === 'CONFIRMED' || 
          o.orderStatus === 'PROCESSING' || 
          (o.orderStatus as any) === 'PACKING' || 
          (o.orderStatus as any) === 'PACKED' ||
          o.orderStatus === 'DISPATCHED'
        );
      } else if (confirmedFilter === 'packing') {
        list = list.filter(o => o.orderStatus === 'PROCESSING' || (o.orderStatus as any) === 'PACKING' || (o.orderStatus as any) === 'PACKED');
      } else if (confirmedFilter === 'dispatched') {
        list = list.filter(o => o.orderStatus === 'DISPATCHED');
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o => 
        o.id?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerPhone?.includes(q)
      );
    }

    return list;
  }, [orders, currentScreen, orderListFilter, confirmedFilter, searchQuery]);

  // Handle Verify Payment Action (Screen 4 -> Screen 5)
  const handleVerifyPayment = async () => {
    if (!selectedOrder) return;
    try {
      await onUpdateOrderStatus(selectedOrder.id, 'PROCESSING', 'SUCCESS');
      const updatedOrder = { ...selectedOrder, paymentStatus: 'SUCCESS' as const, orderStatus: 'PROCESSING' as const };
      setSelectedOrder(updatedOrder);
      setCurrentScreen('confirm_order');
    } catch (e) {
      console.error('Failed to verify payment', e);
    }
  };

  // Handle Confirm Order Action (Screen 5 -> Screen 7)
  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;
    try {
      await onUpdateOrderStatus(selectedOrder.id, 'PROCESSING', 'SUCCESS');
      const updatedOrder = { ...selectedOrder, orderStatus: 'PROCESSING' as const };
      setSelectedOrder(updatedOrder);
      // Auto preselect in label generation list
      setSelectedLabelOrderIds(prev => Array.from(new Set([...prev, updatedOrder.id])));
      setCurrentScreen('orders_confirmed');
    } catch (e) {
      console.error('Failed to confirm order', e);
    }
  };

  // Handle Save Dispatch Action (Screen 10 -> Screen 11)
  const handleSaveDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSavingDispatch(true);

    try {
      const courier = dispatchForm.courierName || 'Delhivery';
      const tracking = dispatchForm.trackingId || dispatchForm.dispatchId || '1234567890123';
      const link = dispatchForm.trackingLink || `https://delhivery.com/track/${tracking}`;

      await onSaveTracking(selectedOrder.id, {
        courierName: courier,
        trackingNumber: tracking,
        deliveryNotes: link
      });

      const updated = {
        ...selectedOrder,
        orderStatus: 'DISPATCHED' as const,
        courierName: courier,
        trackingNumber: tracking,
        deliveryNotes: link
      };
      setSelectedOrder(updated);
      setSavingDispatch(false);

      // Open WhatsApp tracking preview directly (Screen 11)
      handleOpenWhatsAppTracking(updated);
    } catch (e) {
      console.error('Failed to save dispatch tracking', e);
      setSavingDispatch(false);
    }
  };

  // Orders selected for label printing
  const selectedLabelOrders = useMemo(() => {
    return orders.filter(o => selectedLabelOrderIds.includes(o.id));
  }, [orders, selectedLabelOrderIds]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-20">
      {/* Top Mobile Brand Header (matching mockups) */}
      <header className="bg-white border-b border-slate-200/90 px-4 py-3 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
            <Sprout className="w-5 h-5 text-emerald-700" />
          </div>
          <span className="text-base font-black tracking-wider text-emerald-900 uppercase">
            VRG NURSERY
          </span>
        </div>

        <button
          onClick={() => setCurrentScreen('menu_drawer')}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
          aria-label="Open mobile navigation menu"
        >
          <Sliders className="w-5 h-5 text-slate-800" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-4">
        
        {/* ========================================================= */}
        {/* SCREEN 2: DASHBOARD (matching 2.jpeg)                     */}
        {/* ========================================================= */}
        {currentScreen === 'dashboard' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">Dashboard</h2>
              {adminUser && (
                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                  Admin: {adminUser.name?.split(' ')[0]}
                </span>
              )}
            </div>

            {/* 4 Status KPI Metric Cards (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-3">
              {/* 1. New Orders */}
              <button
                onClick={() => {
                  setOrderListFilter('new');
                  setCurrentScreen('orders_new');
                  setActiveBottomTab('orders');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 text-left transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-600 block">New Orders</span>
                <span className="text-2xl font-black text-rose-600 block mt-1">
                  {stats.newOrdersCount}
                </span>
              </button>

              {/* 2. Pending Payment */}
              <button
                onClick={() => {
                  setOrderListFilter('pending_payment');
                  setCurrentScreen('orders_new');
                  setActiveBottomTab('orders');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 text-left transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-600 block">Pending Payment</span>
                <span className="text-2xl font-black text-amber-500 block mt-1">
                  {stats.pendingPaymentCount}
                </span>
              </button>

              {/* 3. Confirmed Orders */}
              <button
                onClick={() => {
                  setConfirmedFilter('all');
                  setCurrentScreen('orders_confirmed');
                  setActiveBottomTab('orders');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 text-left transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-600 block">Confirmed Orders</span>
                <span className="text-2xl font-black text-emerald-600 block mt-1">
                  {stats.confirmedCount}
                </span>
              </button>

              {/* 4. Dispatched Orders */}
              <button
                onClick={() => {
                  setConfirmedFilter('dispatched');
                  setCurrentScreen('orders_confirmed');
                  setActiveBottomTab('orders');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 text-left transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-600 block">Dispatched Orders</span>
                <span className="text-2xl font-black text-blue-600 block mt-1">
                  {stats.dispatchedCount}
                </span>
              </button>
            </div>

            {/* Recent Orders Section */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Recent Orders</h3>
                <button
                  onClick={() => {
                    setCurrentScreen('orders_new');
                    setActiveBottomTab('orders');
                  }}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-0.5"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {orders.slice(0, 5).map((order) => {
                  const isNew = order.orderStatus === 'PENDING' || !order.orderStatus;
                  const isConfirmed = order.orderStatus === 'CONFIRMED' || order.orderStatus === 'PROCESSING';
                  const isDispatched = order.orderStatus === 'DISPATCHED';

                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order);
                        if (isNew) setCurrentScreen('verify_payment');
                        else if (isConfirmed) setCurrentScreen('orders_confirmed');
                        else if (isDispatched) setCurrentScreen('order_timeline');
                        else setCurrentScreen('verify_payment');
                      }}
                      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 active:scale-[0.99] transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {order.id}
                        </span>
                        <span className="font-extrabold text-sm text-slate-900">
                          ₹{order.grandTotal}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">
                          {order.customerName || order.shippingAddress?.fullName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isNew 
                            ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                            : isConfirmed 
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                            : isDispatched 
                            ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isNew ? 'New' : isConfirmed ? 'Confirmed' : isDispatched ? 'Dispatched' : order.orderStatus}
                        </span>

                        <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-0.5">
                          <span>Details</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}

                {orders.length === 0 && (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                    <Package className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-500">No orders recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 3: NEW ORDERS RECEIVED (matching 3.jpeg)            */}
        {/* ========================================================= */}
        {currentScreen === 'orders_new' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">Orders</h2>
              <span className="text-xs text-slate-500 font-medium">{filteredOrders.length} orders found</span>
            </div>

            {/* Filter Tabs Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setOrderListFilter('new')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  orderListFilter === 'new'
                    ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-600'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                New ({stats.newOrdersCount})
              </button>

              <button
                onClick={() => setOrderListFilter('pending_payment')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  orderListFilter === 'pending_payment'
                    ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-600'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Payment Pending ({stats.pendingPaymentCount})
              </button>

              <button
                onClick={() => setOrderListFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  orderListFilter === 'all'
                    ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-600'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                All
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Order ID or Name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Order Card List matching 3.jpeg */}
            <div className="space-y-2.5">
              {filteredOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setCurrentScreen('verify_payment');
                  }}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 active:scale-[0.99] transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {order.id}
                    </span>
                    <span className="font-extrabold text-sm text-slate-900">
                      ₹{order.grandTotal}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800">
                    {order.customerName || order.shippingAddress?.fullName}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {formatDateTime(order.createdAt)}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                      {order.orderStatus === 'PENDING' || !order.orderStatus ? 'New' : order.orderStatus}
                    </span>
                  </div>
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                  <p className="text-xs font-bold text-slate-500">No matching orders in this view</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 4: VERIFY PAYMENT (matching 4.jpeg)                 */}
        {/* ========================================================= */}
        {currentScreen === 'verify_payment' && selectedOrder && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header with Back Arrow */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentScreen('orders_new')}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-extrabold text-slate-900">Order Details</h2>
            </div>

            {/* Order ID Banner */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-900">Order ID :</span>
                <span className="text-xs font-mono font-bold text-slate-800">{selectedOrder.id}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                {selectedOrder.orderStatus === 'PENDING' || !selectedOrder.orderStatus ? 'New' : selectedOrder.orderStatus}
              </span>
            </div>

            {/* Customer Details Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <h3 className="text-xs font-extrabold text-slate-900">Customer Details</h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-800">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-bold">{selectedOrder.customerName || selectedOrder.shippingAddress?.fullName}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-800">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <a href={`tel:${selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone}`} className="font-semibold text-emerald-800 hover:underline">
                    +91 {selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone}
                  </a>
                </div>

                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">
                    {formatAddress(selectedOrder.shippingAddress)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Details Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900">Payment Details</h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Amount</span>
                  <span className="font-extrabold text-slate-900 text-sm">₹{selectedOrder.grandTotal}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Payment Method</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'UPI'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Transaction ID</span>
                  <span className="font-mono font-bold text-slate-700 text-[11px]">
                    {selectedOrder.transactionId || selectedOrder.merchantTransactionId || 'TXN5245123658'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Payment Status</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    selectedOrder.paymentStatus === 'SUCCESS' 
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {selectedOrder.paymentStatus === 'SUCCESS' ? 'Success' : 'Pending Verification'}
                  </span>
                </div>
              </div>
            </div>

            {/* Verify Payment Action Button */}
            <div className="pt-2">
              <button
                onClick={handleVerifyPayment}
                className="w-full py-3.5 bg-[#14532d] hover:bg-[#0f3d21] active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Verify Payment</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 5: CONFIRM ORDER (matching 5.jpeg)                  */}
        {/* ========================================================= */}
        {currentScreen === 'confirm_order' && selectedOrder && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentScreen('verify_payment')}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-extrabold text-slate-900">Confirm Order</h2>
            </div>

            {/* Order ID Banner */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-900">Order ID :</span>
                <span className="text-xs font-mono font-bold text-slate-800">{selectedOrder.id}</span>
              </div>
            </div>

            {/* Customer Details Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <h3 className="text-xs font-extrabold text-slate-900">Customer Details</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-800">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-bold">{selectedOrder.customerName || selectedOrder.shippingAddress?.fullName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold">+91 {selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">
                    {formatAddress(selectedOrder.shippingAddress)}
                  </span>
                </div>
              </div>
            </div>

            {/* Ordered Plants (X) Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <h3 className="text-xs font-extrabold text-slate-900">
                Ordered Plants ({selectedOrder.items?.length || 1})
              </h3>

              <div className="space-y-2 text-xs">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-none">
                      <span className="font-semibold text-slate-800">
                        {idx + 1}. {item.name}
                      </span>
                      <span className="font-bold text-slate-900">
                        - {item.quantity} No
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="space-y-1.5 text-slate-700">
                    <p>1. Rainy blue - 1 No</p>
                    <p>2. Adenium (Red) - 1 No</p>
                    <p>3. Bougainvillea (Pink) - 1 No</p>
                    <p>4. Ixora (Red) - 1 No</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleConfirmOrder}
                className="w-full py-3.5 bg-[#14532d] hover:bg-[#0f3d21] active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Order</span>
              </button>

              <button
                onClick={() => handleOpenWhatsAppConfirmation(selectedOrder)}
                className="w-full py-3.5 bg-white hover:bg-slate-50 active:scale-[0.99] text-emerald-800 font-bold text-xs rounded-xl border border-emerald-600 shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 fill-emerald-600" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <span>Send Order Confirmation</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 7: CONFIRMED ORDERS (matching 7.jpeg)               */}
        {/* ========================================================= */}
        {currentScreen === 'orders_confirmed' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header with Back Arrow and Label Shortcut */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Confirmed Orders</h2>
              </div>

              <button
                onClick={() => {
                  setCurrentScreen('generate_labels');
                  setActiveBottomTab('labels');
                }}
                className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                title="Generate Label Sheet"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setConfirmedFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  confirmedFilter === 'all'
                    ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-600'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                All ({stats.confirmedCount + stats.dispatchedCount})
              </button>

              <button
                onClick={() => setConfirmedFilter('packing')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  confirmedFilter === 'packing'
                    ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-600'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Packing (0)
              </button>

              <button
                onClick={() => setConfirmedFilter('dispatched')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  confirmedFilter === 'dispatched'
                    ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-600'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Dispatched ({stats.dispatchedCount})
              </button>
            </div>

            {/* Confirmed Orders Card List matching 7.jpeg */}
            <div className="space-y-2.5">
              {filteredOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900 block">
                        {order.id}
                      </span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                        {order.customerName || order.shippingAddress?.fullName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0">
                      Confirmed
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setDispatchForm({
                          courierName: order.courierName || 'Delhivery',
                          dispatchId: order.trackingNumber || '',
                          trackingId: order.trackingNumber || '',
                          trackingLink: order.deliveryNotes || ''
                        });
                        setCurrentScreen('dispatch_order');
                      }}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5 text-slate-600" />
                      <span>Dispatch</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setCurrentScreen('order_timeline');
                      }}
                      className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Timeline</span>
                    </button>
                  </div>
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                  <p className="text-xs font-bold text-slate-500">No confirmed orders in this section</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 8: GENERATE LABEL SHEET (matching 8.jpeg)          */}
        {/* ========================================================= */}
        {currentScreen === 'generate_labels' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentScreen('orders_confirmed')}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-extrabold text-slate-900">Generate Label Sheet</h2>
            </div>

            {/* Checklist Box */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900">
                  Select Orders (Max 4 per sheet)
                </h3>
                <button
                  onClick={() => {
                    if (selectedLabelOrderIds.length === orders.length) {
                      setSelectedLabelOrderIds([]);
                    } else {
                      setSelectedLabelOrderIds(orders.slice(0, 4).map(o => o.id));
                    }
                  }}
                  className="text-[11px] font-bold text-emerald-800 hover:underline"
                >
                  {selectedLabelOrderIds.length > 0 ? 'Clear All' : 'Select 4'}
                </button>
              </div>

              <div className="space-y-2">
                {orders.slice(0, 8).map(order => {
                  const isChecked = selectedLabelOrderIds.includes(order.id);
                  return (
                    <label
                      key={order.id}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedLabelOrderIds(prev => prev.filter(id => id !== order.id));
                          } else {
                            setSelectedLabelOrderIds(prev => [...prev, order.id]);
                          }
                        }}
                        className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700 border-slate-300 accent-[#14532d]"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        {order.id} - {order.customerName || order.shippingAddress?.fullName}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Summary Row */}
            <div className="text-xs font-extrabold text-slate-900 px-1">
              Selected Orders : {selectedLabelOrderIds.length}
            </div>

            {/* Primary Action Button */}
            <div>
              <button
                onClick={() => setShowLabelPrintPreview(true)}
                disabled={selectedLabelOrderIds.length === 0}
                className="w-full py-3.5 bg-[#14532d] hover:bg-[#0f3d21] disabled:opacity-40 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Generate Label Sheet (A4 PDF)</span>
              </button>
            </div>

            {/* Calculation Guide Box matching 8.jpeg */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center text-xs font-semibold text-slate-700 space-y-1.5">
              <p>4 Orders = 1 A4 Sheet</p>
              <p>8 Orders = 2 A4 Sheets</p>
              <p>12 Orders = 3 A4 Sheets</p>
              <p className="text-slate-400 font-normal">and so on...</p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 10: DISPATCH / TRACKING (matching 10.jpeg)          */}
        {/* ========================================================= */}
        {currentScreen === 'dispatch_order' && selectedOrder && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentScreen('orders_confirmed')}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-extrabold text-slate-900">Dispatch / Tracking</h2>
            </div>

            {/* Order ID Banner */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-900">Order ID :</span>
                <span className="text-xs font-mono font-bold text-slate-800">{selectedOrder.id}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                Confirmed
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveDispatch} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Courier Name</label>
                <select
                  value={dispatchForm.courierName}
                  onChange={e => handleCourierChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                >
                  <option value="Delhivery">Delhivery</option>
                  <option value="ST Courier">ST Courier</option>
                  <option value="Professional Courier">Professional Courier</option>
                  <option value="DTDC">DTDC</option>
                  <option value="India Post">India Post (Speed Post)</option>
                  <option value="Amazon Shipping">Amazon Shipping</option>
                  <option value="Porter">Porter</option>
                  <option value="Self Delivery">Self Nursery Delivery</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Dispatch ID / AWB No.</label>
                <input
                  type="text"
                  required
                  value={dispatchForm.dispatchId}
                  onChange={e => handleAwbChange(e.target.value)}
                  placeholder="1234567890123"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Tracking ID</label>
                <input
                  type="text"
                  value={dispatchForm.trackingId}
                  onChange={e => setDispatchForm({ ...dispatchForm, trackingId: e.target.value })}
                  placeholder="1234567890123"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Tracking Link (Optional)</label>
                <input
                  type="text"
                  value={dispatchForm.trackingLink}
                  onChange={e => setDispatchForm({ ...dispatchForm, trackingLink: e.target.value })}
                  placeholder="https://delhivery.com/track/1234567890123"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingDispatch}
                  className="w-full py-3.5 bg-[#14532d] hover:bg-[#0f3d21] disabled:opacity-50 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {savingDispatch ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Tracking...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Tracking Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 12: ORDER TIMELINE (matching 12.jpeg)               */}
        {/* ========================================================= */}
        {currentScreen === 'order_timeline' && selectedOrder && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentScreen('orders_confirmed')}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-extrabold text-slate-900">Order Timeline</h2>
            </div>

            {/* Stepper Timeline Box matching 12.jpeg */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              
              {/* Step 1: New Order */}
              <div className="flex items-start gap-4 relative">
                <div className="w-6 h-6 rounded-full bg-[#14532d] text-white flex items-center justify-center shrink-0 z-10">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-slate-900">New Order</p>
                  <p className="text-[11px] text-slate-500 font-medium">{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
                {/* Connecting Line */}
                <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-[#14532d] -z-0 h-10" />
              </div>

              {/* Step 2: Payment Verified */}
              <div className="flex items-start gap-4 relative">
                <div className="w-6 h-6 rounded-full bg-[#14532d] text-white flex items-center justify-center shrink-0 z-10">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-slate-900">Payment Verified</p>
                  <p className="text-[11px] text-slate-500 font-medium">{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
                <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-[#14532d] -z-0 h-10" />
              </div>

              {/* Step 3: Order Confirmed */}
              <div className="flex items-start gap-4 relative">
                <div className="w-6 h-6 rounded-full bg-[#14532d] text-white flex items-center justify-center shrink-0 z-10">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-slate-900">Order Confirmed</p>
                  <p className="text-[11px] text-slate-500 font-medium">{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
                <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-[#14532d] -z-0 h-10" />
              </div>

              {/* Step 4: Packing */}
              <div className="flex items-start gap-4 relative">
                <div className="w-6 h-6 rounded-full bg-[#14532d] text-white flex items-center justify-center shrink-0 z-10">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-slate-900">Packing</p>
                  <p className="text-[11px] text-slate-500 font-medium">{formatDateTime(selectedOrder.updatedAt || selectedOrder.createdAt)}</p>
                </div>
                <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-[#14532d] -z-0 h-10" />
              </div>

              {/* Step 5: Dispatched */}
              <div className="flex items-start gap-4 relative">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                  selectedOrder.orderStatus === 'DISPATCHED' || selectedOrder.orderStatus === 'DELIVERED'
                    ? 'bg-[#14532d] text-white'
                    : 'border-2 border-slate-300 bg-white'
                }`}>
                  {selectedOrder.orderStatus === 'DISPATCHED' || selectedOrder.orderStatus === 'DELIVERED' ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : null}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-slate-900">Dispatched</p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedOrder.orderStatus === 'DISPATCHED' || selectedOrder.orderStatus === 'DELIVERED'
                      ? formatDateTime(selectedOrder.updatedAt)
                      : 'Pending dispatch'}
                  </p>
                </div>
                <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-slate-200 -z-0 h-10" />
              </div>

              {/* Step 6: Delivered */}
              <div className="flex items-start gap-4 relative">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                  selectedOrder.orderStatus === 'DELIVERED'
                    ? 'bg-[#14532d] text-white'
                    : 'border-2 border-slate-300 bg-white'
                }`}>
                  {selectedOrder.orderStatus === 'DELIVERED' && (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-slate-900">Delivered</p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedOrder.orderStatus === 'DELIVERED' ? 'Delivered successfully' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>

            {/* Completion Banner matching 12.jpeg */}
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-emerald-900">
                Order completed successfully after delivery.
              </p>
            </div>

            {/* Quick Action to Mark Delivered */}
            {selectedOrder.orderStatus !== 'DELIVERED' && (
              <button
                onClick={async () => {
                  await onUpdateOrderStatus(selectedOrder.id, 'DELIVERED', 'SUCCESS');
                  setSelectedOrder({ ...selectedOrder, orderStatus: 'DELIVERED' });
                }}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Delivered & Complete</span>
              </button>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SLIDE-OVER MENU DRAWER (Access all other store tabs)       */}
        {/* ========================================================= */}
        {currentScreen === 'menu_drawer' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Sprout className="w-5 h-5 text-emerald-700" />
                </div>
                <span className="text-sm font-extrabold text-slate-900">Nursery Admin Menu</span>
              </div>

              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Admin Profile */}
            {adminUser && (
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-black flex items-center justify-center text-sm">
                  {adminUser.name?.[0] || 'A'}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">{adminUser.name}</p>
                  <p className="text-[11px] text-slate-500">{adminUser.email}</p>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">{adminUser.role}</span>
                </div>
              </div>
            )}

            {/* Workflow Navigation Links */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
              <button
                onClick={() => {
                  setCurrentScreen('dashboard');
                  setActiveBottomTab('dashboard');
                }}
                className="w-full p-3 text-left flex items-center justify-between hover:bg-slate-50 text-xs font-bold text-slate-800"
              >
                <span className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-emerald-700" />
                  <span>Dashboard Overview</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => {
                  setCurrentScreen('orders_new');
                  setActiveBottomTab('orders');
                }}
                className="w-full p-3 text-left flex items-center justify-between hover:bg-slate-50 text-xs font-bold text-slate-800"
              >
                <span className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-rose-600" />
                  <span>New & Pending Orders</span>
                </span>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                  {stats.newOrdersCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setCurrentScreen('orders_confirmed');
                  setActiveBottomTab('orders');
                }}
                className="w-full p-3 text-left flex items-center justify-between hover:bg-slate-50 text-xs font-bold text-slate-800"
              >
                <span className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Confirmed Orders</span>
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {stats.confirmedCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setCurrentScreen('generate_labels');
                  setActiveBottomTab('labels');
                }}
                className="w-full p-3 text-left flex items-center justify-between hover:bg-slate-50 text-xs font-bold text-slate-800"
              >
                <span className="flex items-center gap-2.5">
                  <Printer className="w-4 h-4 text-purple-600" />
                  <span>A4 Label Sheets (4-Grid)</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Store Management Desktop Modules */}
            <div className="space-y-1">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                Store Catalog & Administration
              </p>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
                {[
                  { key: 'products', label: `Products Catalog (${products.length})`, icon: <Package className="w-4 h-4 text-slate-700" /> },
                  { key: 'categories', label: 'Categories Manager', icon: <FolderTree className="w-4 h-4 text-slate-700" /> },
                  { key: 'coupons', label: 'Coupons & Offers', icon: <Tag className="w-4 h-4 text-amber-600" /> },
                  { key: 'inventory', label: 'Inventory Stock Alerts', icon: <Clock className="w-4 h-4 text-rose-600" /> },
                  { key: 'reviews', label: 'Customer Reviews', icon: <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> },
                  { key: 'finances', label: 'Nursery Expenses & Profit', icon: <DollarSign className="w-4 h-4 text-emerald-600" /> },
                  { key: 'settings', label: 'Store Settings & UPI Gateway', icon: <SettingsIcon className="w-4 h-4 text-slate-700" /> },
                  { key: 'audit', label: 'Audit Security Logs', icon: <ShieldCheck className="w-4 h-4 text-indigo-600" /> }
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (onOpenDesktopTab) onOpenDesktopTab(key);
                    }}
                    className="w-full p-3 text-left flex items-center justify-between hover:bg-slate-50 text-xs font-bold text-slate-700"
                  >
                    <span className="flex items-center gap-2.5">
                      {icon}
                      <span>{label}</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={onBackToStore}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Return to Customer Store</span>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Admin</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* SCREEN 6 & 11: WHATSAPP NOTIFICATION MODAL               */}
      {/* ========================================================= */}
      {whatsAppModal && whatsAppModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#e5ddd5] w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 border border-slate-300">
            {/* WhatsApp Top Header Bar */}
            <div className="bg-[#075e54] text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setWhatsAppModal(null)}
                  className="p-1 hover:bg-white/10 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>

                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm overflow-hidden">
                  <User className="w-5 h-5" />
                </div>

                <div>
                  <p className="font-bold text-sm leading-tight">
                    +{whatsAppModal.phone}
                  </p>
                  <p className="text-[11px] text-emerald-200">online</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWhatsAppModal(null)}
                  className="p-1 text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Conversation Bubble View */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto bg-[#e5ddd5]" style={{ backgroundImage: 'radial-gradient(#cfd8dc 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
              <div className="bg-white rounded-2xl p-3.5 shadow-sm text-xs text-slate-900 font-medium whitespace-pre-line leading-relaxed border border-slate-200/60 relative">
                {whatsAppModal.message}
                <div className="text-right text-[10px] text-slate-400 mt-1">11:35 AM ✓✓</div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-white p-3.5 border-t border-slate-200 flex items-center gap-2.5">
              <button
                onClick={handleCopyMessage}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
              >
                <Copy className="w-4 h-4 text-slate-600" />
                <span>{copiedToast ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={handleLaunchWhatsApp}
                className="flex-2 py-3 bg-[#25d366] hover:bg-[#20bd5a] active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <span>Open in WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SCREEN 9: LABEL SHEET PREVIEW (matching 9.jpeg)           */}
      {/* ========================================================= */}
      {showLabelPrintPreview && (
        <A4LabelSheetPrint
          orders={selectedLabelOrders}
          onClose={() => setShowLabelPrintPreview(false)}
        />
      )}

      {/* ========================================================= */}
      {/* BOTTOM MOBILE NAVIGATION BAR (matching 2.jpeg / 3.jpeg)   */}
      {/* ========================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 py-2 px-6 flex items-center justify-around shadow-lg">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => {
            setActiveBottomTab('dashboard');
            setCurrentScreen('dashboard');
          }}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeBottomTab === 'dashboard' ? 'text-[#14532d] font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        {/* Tab 2: Orders */}
        <button
          onClick={() => {
            setActiveBottomTab('orders');
            setCurrentScreen('orders_new');
          }}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer relative ${
            activeBottomTab === 'orders' ? 'text-[#14532d] font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Orders</span>
          {stats.newOrdersCount > 0 && (
            <span className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        {/* Tab 3: Label Sheet */}
        <button
          onClick={() => {
            setActiveBottomTab('labels');
            setCurrentScreen('generate_labels');
          }}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeBottomTab === 'labels' ? 'text-[#14532d] font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px]">Label Sheet</span>
        </button>

        {/* Tab 4: Menu */}
        <button
          onClick={() => {
            setActiveBottomTab('menu');
            setCurrentScreen('menu_drawer');
          }}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeBottomTab === 'menu' ? 'text-[#14532d] font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[10px]">Menu</span>
        </button>
      </nav>
    </div>
  );
};
