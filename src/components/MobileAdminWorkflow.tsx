import React, { useState, useMemo } from 'react';
import { Order, Product, Category, Review } from '../types';
import {
  Sprout,
  LayoutDashboard,
  Calendar,
  FileText,
  Menu,
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
  X,
  ShoppingBag,
  AlertTriangle,
  Image as ImageIcon,
  Send,
  Box,
  CheckCircle
} from 'lucide-react';
import { A4LabelSheetPrint } from './A4LabelSheetPrint';

export interface MobileAdminWorkflowProps {
  orders: Order[];
  products: Product[];
  categories: Category[];
  reviews: Review[];
  adminUser?: any;
  onUpdateOrderStatus: (orderId: string, status: string, paymentStatus?: string) => Promise<void>;
  onSaveTracking: (orderId: string, data: { courierName: string; trackingNumber: string; trackingLink?: string }) => Promise<void>;
  onBackToStore: () => void;
  onOpenDesktopTab?: (tabKey: string) => void;
  onLogout?: () => void;
}

export type ScreenType =
  | 'dashboard'
  | 'orders_list'
  | 'order_details'
  | 'generate_labels'
  | 'dispatch_order'
  | 'order_timeline'
  | 'menu_drawer';

export const MobileAdminWorkflow: React.FC<MobileAdminWorkflowProps> = ({
  orders,
  products,
  categories,
  reviews,
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
  
  // Selected order for detail views
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // 4 Stage Filter: 'all' | 'confirmed' | 'packing' | 'dispatched' | 'delivered'
  const [orderStageFilter, setOrderStageFilter] = useState<'all' | 'confirmed' | 'packing' | 'dispatched' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Label Generation State
  const [selectedLabelOrderIds, setSelectedLabelOrderIds] = useState<string[]>([]);
  const [showLabelPrintPreview, setShowLabelPrintPreview] = useState(false);

  // WhatsApp Modal State
  const [whatsAppModal, setWhatsAppModal] = useState<{
    open: boolean;
    stage: 'confirmed' | 'packing' | 'dispatched' | 'delivered';
    order: Order | null;
    message: string;
    phone: string;
  } | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Dispatch Tracking Form State
  const [dispatchForm, setDispatchForm] = useState({
    courierName: 'Delhivery',
    awbNumber: '',
    trackingLink: ''
  });
  const [savingDispatch, setSavingDispatch] = useState(false);

  // 4-Stage Stats Calculation directly from real orders
  const stats = useMemo(() => {
    const confirmedOrders = orders.filter(o => 
      o.orderStatus === 'CONFIRMED' || 
      o.orderStatus === 'PENDING' || 
      !o.orderStatus
    );
    const packingOrders = orders.filter(o => 
      o.orderStatus === 'PACKED' || 
      o.orderStatus === 'PROCESSING'
    );
    const dispatchedOrders = orders.filter(o => 
      o.orderStatus === 'DISPATCHED' || 
      o.orderStatus === 'OUT_FOR_DELIVERY'
    );
    const deliveredOrders = orders.filter(o => 
      o.orderStatus === 'DELIVERED'
    );

    return {
      confirmedCount: confirmedOrders.length,
      packingCount: packingOrders.length,
      dispatchedCount: dispatchedOrders.length,
      deliveredCount: deliveredOrders.length,
      totalCount: orders.length
    };
  }, [orders]);

  // Helpers for formatted dates & addresses
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
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
    return parts.length > 0 ? parts.join(', ') : 'Address not specified';
  };

  // WhatsApp Message Generator for 4 Stages
  const generateWhatsAppMessage = (order: Order, stage: 'confirmed' | 'packing' | 'dispatched' | 'delivered') => {
    const customerName = order.customerName || order.shippingAddress?.fullName || 'Valued Customer';
    const dateStr = formatDate(order.createdAt);
    
    let itemsList = '';
    if (order.items && order.items.length > 0) {
      itemsList = order.items
        .map((item, idx) => `${idx + 1}. ${item.name} - ${item.quantity || 1} No`)
        .join('\n');
    }

    if (stage === 'confirmed') {
      return `🌿 *Veerika Rose Garden (VRG Nursery)*
Order Confirmation 📦

Dear *${customerName}*,
Thank you for ordering with us! Your order has been *Confirmed* successfully.

📋 *Order ID:* ${order.id}
📅 *Date:* ${dateStr}
💰 *Total Amount:* ₹${order.grandTotal}

🌱 *Your Ordered Plants:*
${itemsList || '• Nursery Plants & Garden Saplings'}

We will pack your plants with fresh cocopeat and protective wraps.

Thank you! 🌿
*Veerika Rose Garden*`;
    }

    if (stage === 'packing') {
      return `📦 *Veerika Rose Garden (VRG Nursery)*
Nursery Packing Update 🌿

Dear *${customerName}*,
Your plants for *Order #${order.id}* are now in the *Nursery Packing* stage!

🌿 Our expert team is carefully inspecting, watering, and packing your plants with moist root balls and sturdy cardboard boxes to guarantee fresh delivery.

Your package will be handed over to the courier shortly! 🚚

Thank you!
*Veerika Rose Garden*`;
    }

    if (stage === 'dispatched') {
      const courier = order.courierName || dispatchForm.courierName || 'Courier Partner';
      const awb = order.trackingNumber || dispatchForm.awbNumber || 'In Transit';
      const link = order.deliveryNotes || dispatchForm.trackingLink || `https://www.google.com/search?q=${encodeURIComponent(courier + ' ' + awb)}`;

      return `🚚 *Veerika Rose Garden (VRG Nursery)*
Courier Dispatch & Tracking Update!

Dear *${customerName}*,
Great news! Your plant order *#${order.id}* has been *Dispatched* via courier.

📦 *Courier Partner:* ${courier}
🏷️ *AWB / Tracking No:* ${awb}

🔗 *Track Shipment:*
${link}

Please keep your phone available during delivery.
Thank you for choosing Veerika Rose Garden! 🌿`;
    }

    // Delivered
    return `🌸 *Veerika Rose Garden (VRG Nursery)*
Delivered with Care! 🪴

Dear *${customerName}*,
Your order *#${order.id}* has been *Delivered* successfully!

🌱 *Quick Plant Care Tips:*
1. Unbox your plants gently in a shaded area.
2. Water the roots moderately and allow them to rest for 24 hours before repotting.
3. Keep away from harsh direct afternoon sunlight for the first 3 days.

We would love your feedback! Please visit us again. 🌿
*Veerika Rose Garden*`;
  };

  const handleOpenWhatsApp = (order: Order, stage: 'confirmed' | 'packing' | 'dispatched' | 'delivered') => {
    const msg = generateWhatsAppMessage(order, stage);
    const rawPhone = order.customerPhone || order.shippingAddress?.phone || '';
    const phone = rawPhone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;

    setWhatsAppModal({
      open: true,
      stage,
      order,
      message: msg,
      phone: cleanPhone
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

  // Tracking link helper
  const handleAwbChange = (awb: string) => {
    setDispatchForm(prev => {
      let link = '';
      if (prev.courierName === 'Delhivery') link = `https://delhivery.com/track/${awb}`;
      else if (prev.courierName === 'ST Courier') link = `https://stcourier.com/track/${awb}`;
      else if (prev.courierName === 'Professional Courier') link = `https://www.tpcindia.com/track.aspx?docno=${awb}`;
      else if (prev.courierName === 'DTDC') link = `https://www.dtdc.in/tracking/tracking_results.asp?Tid=${awb}`;
      else if (prev.courierName === 'India Post') link = `https://www.indiapost.gov.in/`;
      return {
        ...prev,
        awbNumber: awb,
        trackingLink: link
      };
    });
  };

  // Save Dispatch Tracking
  const handleSaveDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSavingDispatch(true);
    try {
      await onSaveTracking(selectedOrder.id, {
        courierName: dispatchForm.courierName,
        trackingNumber: dispatchForm.awbNumber,
        trackingLink: dispatchForm.trackingLink
      });
      await onUpdateOrderStatus(selectedOrder.id, 'DISPATCHED');
      
      const updated = {
        ...selectedOrder,
        orderStatus: 'DISPATCHED' as const,
        courierName: dispatchForm.courierName,
        trackingNumber: dispatchForm.awbNumber,
        deliveryNotes: dispatchForm.trackingLink
      };
      setSelectedOrder(updated);
      setSavingDispatch(false);

      // Open WhatsApp Dispatched notification preview
      handleOpenWhatsApp(updated, 'dispatched');
    } catch (e) {
      console.error('Failed to save dispatch tracking', e);
      setSavingDispatch(false);
    }
  };

  // 4 Stage Filter logic
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (orderStageFilter === 'confirmed') {
      list = list.filter(o => 
        o.orderStatus === 'CONFIRMED' || 
        o.orderStatus === 'PENDING' || 
        !o.orderStatus
      );
    } else if (orderStageFilter === 'packing') {
      list = list.filter(o => 
        o.orderStatus === 'PACKED' || 
        o.orderStatus === 'PROCESSING'
      );
    } else if (orderStageFilter === 'dispatched') {
      list = list.filter(o => 
        o.orderStatus === 'DISPATCHED' || 
        o.orderStatus === 'OUT_FOR_DELIVERY'
      );
    } else if (orderStageFilter === 'delivered') {
      list = list.filter(o => 
        o.orderStatus === 'DELIVERED'
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(o => 
        o.id.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.shippingAddress?.fullName && o.shippingAddress.fullName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.includes(q)) ||
        (o.shippingAddress?.phone && o.shippingAddress.phone.includes(q))
      );
    }

    return list;
  }, [orders, orderStageFilter, searchQuery]);

  // Selected orders for label sheet printing
  const selectedLabelOrders = useMemo(() => {
    return orders.filter(o => selectedLabelOrderIds.includes(o.id));
  }, [orders, selectedLabelOrderIds]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-20">
      
      {/* Top Mobile Clean Header */}
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
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
          aria-label="Open mobile navigation menu"
          title="Open Menu"
        >
          <Menu className="w-5 h-5 text-slate-800" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-4">
        
        {/* ========================================================= */}
        {/* 1. DASHBOARD (4 Key Stages: Confirmed, Packing, Courier, Delivered) */}
        {/* ========================================================= */}
        {currentScreen === 'dashboard' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">Dashboard</h2>
              {adminUser && (
                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
                  Admin: {adminUser.name?.split(' ')[0] || 'Admin'}
                </span>
              )}
            </div>

            {/* 4 Status KPI Metric Cards (2x2 Grid matching the 4 Web Stages) */}
            <div className="grid grid-cols-2 gap-3">
              
              {/* Stage 1: Order Confirmed */}
              <button
                onClick={() => {
                  setOrderStageFilter('confirmed');
                  setCurrentScreen('orders_list');
                  setActiveBottomTab('orders');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 text-left transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Order Confirmed</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-2xl font-black text-emerald-700 block mt-1">
                  {stats.confirmedCount}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Ready for packing</span>
              </button>

              {/* Stage 2: Nursery Packing */}
              <button
                onClick={() => {
                  setOrderStageFilter('packing');
                  setCurrentScreen('orders_list');
                  setActiveBottomTab('orders');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 text-left transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Nursery Packing</span>
                  <Box className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-2xl font-black text-amber-600 block mt-1">
                  {stats.packingCount}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Packing in progress</span>
              </button>

              {/* Stage 3: Courier Dispatched */}
              <button
                onClick={() => {
                  setOrderStageFilter('dispatched');
                  setCurrentScreen('orders_list');
                  setActiveBottomTab('orders');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 text-left transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Courier Dispatched</span>
                  <Truck className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-2xl font-black text-blue-600 block mt-1">
                  {stats.dispatchedCount}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">With tracking link</span>
              </button>

              {/* Stage 4: Delivered */}
              <button
                onClick={() => {
                  setOrderStageFilter('delivered');
                  setCurrentScreen('orders_list');
                  setActiveBottomTab('orders');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 text-left transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Delivered</span>
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-2xl font-black text-purple-700 block mt-1">
                  {stats.deliveredCount}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Completed orders</span>
              </button>
            </div>

            {/* Recent Orders List */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Recent Orders</h3>
                <button
                  onClick={() => {
                    setOrderStageFilter('all');
                    setCurrentScreen('orders_list');
                    setActiveBottomTab('orders');
                  }}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View All ({orders.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {orders.slice(0, 6).map((order) => {
                  const isPacking = order.orderStatus === 'PACKED' || order.orderStatus === 'PROCESSING';
                  const isDispatched = order.orderStatus === 'DISPATCHED' || order.orderStatus === 'OUT_FOR_DELIVERY';
                  const isDelivered = order.orderStatus === 'DELIVERED';
                  const isConfirmed = !isPacking && !isDispatched && !isDelivered;

                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order);
                        setCurrentScreen('order_details');
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
                          {order.customerName || order.shippingAddress?.fullName || 'Customer'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isDelivered
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : isDispatched
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : isPacking
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}>
                          {isDelivered ? 'Delivered' : isDispatched ? 'Courier Dispatched' : isPacking ? 'Nursery Packing' : 'Order Confirmed'}
                        </span>

                        <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-0.5">
                          <span>Manage</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}

                {orders.length === 0 && (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                    <Package className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-500">No orders recorded in system yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. ORDERS LIST (With 4 Stage Filter Pills)                 */}
        {/* ========================================================= */}
        {currentScreen === 'orders_list' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Orders List</h2>
              </div>
              <button
                onClick={() => setCurrentScreen('menu_drawer')}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Open menu"
                title="Open Menu"
              >
                <Menu className="w-5 h-5 text-slate-800" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Order ID, Name, Phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            {/* 4-Stage Filter Tabs Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { key: 'all', label: `All (${orders.length})` },
                { key: 'confirmed', label: `Confirmed (${stats.confirmedCount})` },
                { key: 'packing', label: `Packing (${stats.packingCount})` },
                { key: 'dispatched', label: `Dispatched (${stats.dispatchedCount})` },
                { key: 'delivered', label: `Delivered (${stats.deliveredCount})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setOrderStageFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                    orderStageFilter === tab.key
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Orders Feed */}
            <div className="space-y-2.5">
              {filteredOrders.map(order => {
                const isPacking = order.orderStatus === 'PACKED' || order.orderStatus === 'PROCESSING';
                const isDispatched = order.orderStatus === 'DISPATCHED' || order.orderStatus === 'OUT_FOR_DELIVERY';
                const isDelivered = order.orderStatus === 'DELIVERED';

                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrder(order);
                      setCurrentScreen('order_details');
                    }}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 active:scale-[0.99] transition-all cursor-pointer space-y-2"
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
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {order.customerName || order.shippingAddress?.fullName || 'Customer'}
                      </p>
                      <span className="text-[11px] text-slate-400 font-medium shrink-0">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isDelivered
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : isDispatched
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : isPacking
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}>
                        {isDelivered ? 'Delivered' : isDispatched ? 'Courier Dispatched' : isPacking ? 'Nursery Packing' : 'Order Confirmed'}
                      </span>

                      <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-0.5">
                        <span>Details & Actions</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredOrders.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                  <p className="text-xs font-bold text-slate-500">No orders found matching this filter</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. ORDER DETAILS & STAGE MANAGER (4-Stage Operations)      */}
        {/* ========================================================= */}
        {currentScreen === 'order_details' && selectedOrder && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('orders_list')}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Manage Order</h2>
              </div>
              <button
                onClick={() => setCurrentScreen('menu_drawer')}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Open menu"
                title="Open Menu"
              >
                <Menu className="w-5 h-5 text-slate-800" />
              </button>
            </div>

            {/* Order ID & Current Stage Badge */}
            <div className="flex items-center justify-between py-1 bg-white p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-500">Order ID:</span>
                <span className="text-xs font-mono font-bold text-slate-900">{selectedOrder.id}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                {selectedOrder.orderStatus || 'CONFIRMED'}
              </span>
            </div>

            {/* Customer Details Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <h3 className="text-xs font-extrabold text-slate-900">Customer Details</h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-800">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-bold">{selectedOrder.customerName || selectedOrder.shippingAddress?.fullName || 'Customer'}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-800">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <a href={`tel:${selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone}`} className="font-semibold text-emerald-800 hover:underline">
                    +91 {selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone || 'Not provided'}
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

            {/* Ordered Plants Itemized List */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900">
                  Ordered Plants ({selectedOrder.items?.length || 0})
                </h3>
                <span className="text-xs font-extrabold text-slate-900">₹{selectedOrder.grandTotal}</span>
              </div>

              <div className="divide-y divide-slate-100">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{idx + 1}. {item.name}</p>
                        {item.tamilName && (
                          <p className="text-[11px] text-emerald-800 font-medium">{item.tamilName}</p>
                        )}
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">{item.quantity || 1} No</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">No individual plant items attached to this order.</p>
                )}
              </div>
            </div>

            {/* Payment Details Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5 text-xs">
              <h3 className="font-extrabold text-slate-900">Payment Details</h3>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-extrabold text-slate-900">₹{selectedOrder.grandTotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-bold text-slate-800">{selectedOrder.paymentMethod || 'Online UPI'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment Status</span>
                <span className={`font-bold px-2 py-0.5 rounded-md ${
                  selectedOrder.paymentStatus === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {selectedOrder.paymentStatus || 'PENDING'}
                </span>
              </div>
            </div>

            {/* 4-Stage Action Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900">Update Order Stage</h3>
              
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Confirm Order */}
                <button
                  onClick={async () => {
                    await onUpdateOrderStatus(selectedOrder.id, 'CONFIRMED', 'SUCCESS');
                    setSelectedOrder({ ...selectedOrder, orderStatus: 'CONFIRMED', paymentStatus: 'SUCCESS' });
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedOrder.orderStatus === 'CONFIRMED' || selectedOrder.orderStatus === 'PENDING' || !selectedOrder.orderStatus
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>1. Confirmed</span>
                </button>

                {/* 2. Move to Packing */}
                <button
                  onClick={async () => {
                    await onUpdateOrderStatus(selectedOrder.id, 'PACKED');
                    setSelectedOrder({ ...selectedOrder, orderStatus: 'PACKED' });
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedOrder.orderStatus === 'PACKED' || selectedOrder.orderStatus === 'PROCESSING'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>2. Packing</span>
                </button>

                {/* 3. Courier Dispatched */}
                <button
                  onClick={() => {
                    setDispatchForm({
                      courierName: selectedOrder.courierName || 'Delhivery',
                      awbNumber: selectedOrder.trackingNumber || '',
                      trackingLink: selectedOrder.deliveryNotes || ''
                    });
                    setCurrentScreen('dispatch_order');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedOrder.orderStatus === 'DISPATCHED' || selectedOrder.orderStatus === 'OUT_FOR_DELIVERY'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>3. Courier</span>
                </button>

                {/* 4. Delivered */}
                <button
                  onClick={async () => {
                    await onUpdateOrderStatus(selectedOrder.id, 'DELIVERED');
                    setSelectedOrder({ ...selectedOrder, orderStatus: 'DELIVERED' });
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedOrder.orderStatus === 'DELIVERED'
                      ? 'bg-purple-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>4. Delivered</span>
                </button>
              </div>

              {/* WhatsApp Notification Triggers for 4 Stages */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-extrabold text-slate-600">Send WhatsApp Notification:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOpenWhatsApp(selectedOrder, 'confirmed')}
                    className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3 h-3 text-emerald-700" />
                    <span>Confirmation</span>
                  </button>

                  <button
                    onClick={() => handleOpenWhatsApp(selectedOrder, 'packing')}
                    className="py-2 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3 h-3 text-amber-700" />
                    <span>Packing Update</span>
                  </button>

                  <button
                    onClick={() => handleOpenWhatsApp(selectedOrder, 'dispatched')}
                    className="py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3 h-3 text-blue-700" />
                    <span>Tracking Link</span>
                  </button>

                  <button
                    onClick={() => handleOpenWhatsApp(selectedOrder, 'delivered')}
                    className="py-2 px-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3 h-3 text-purple-700" />
                    <span>Delivered + Care</span>
                  </button>
                </div>
              </div>

              {/* View Timeline Button */}
              <button
                onClick={() => setCurrentScreen('order_timeline')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                <span>View Order Timeline</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. DISPATCH / TRACKING FORM                                */}
        {/* ========================================================= */}
        {currentScreen === 'dispatch_order' && selectedOrder && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('order_details')}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Courier Dispatch</h2>
              </div>
              <button
                onClick={() => setCurrentScreen('menu_drawer')}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Open menu"
                title="Open Menu"
              >
                <Menu className="w-5 h-5 text-slate-800" />
              </button>
            </div>

            {/* Order Info */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-900">Order #{selectedOrder.id}</span>
              <span className="font-semibold text-slate-600">{selectedOrder.customerName || selectedOrder.shippingAddress?.fullName}</span>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveDispatch} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Courier Partner</label>
                <select
                  value={dispatchForm.courierName}
                  onChange={e => {
                    setDispatchForm({ ...dispatchForm, courierName: e.target.value });
                    handleAwbChange(dispatchForm.awbNumber);
                  }}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
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
                <label className="text-xs font-bold text-slate-700 block">AWB / Tracking Number *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter courier AWB number"
                  value={dispatchForm.awbNumber}
                  onChange={e => handleAwbChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Tracking URL (Auto-Generated)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={dispatchForm.trackingLink}
                  onChange={e => setDispatchForm({ ...dispatchForm, trackingLink: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <button
                type="submit"
                disabled={savingDispatch}
                className="w-full py-3.5 bg-[#14532d] hover:bg-[#0f3d21] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {savingDispatch ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Tracking Details...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    <span>Save Tracking & Open WhatsApp Preview</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. GENERATE LABEL SHEET (A4 4-Per-Page Printing)          */}
        {/* ========================================================= */}
        {currentScreen === 'generate_labels' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Generate Label Sheet</h2>
              </div>
              <button
                onClick={() => setCurrentScreen('menu_drawer')}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Open menu"
                title="Open Menu"
              >
                <Menu className="w-5 h-5 text-slate-800" />
              </button>
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
                  className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  {selectedLabelOrderIds.length > 0 ? 'Clear All' : 'Select First 4'}
                </button>
              </div>

              <div className="space-y-2">
                {orders.map(order => {
                  const isChecked = selectedLabelOrderIds.includes(order.id);
                  return (
                    <label
                      key={order.id}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer select-none border border-slate-100"
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
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-900 block font-mono">
                          {order.id}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate block">
                          {order.customerName || order.shippingAddress?.fullName || 'Customer'} • ₹{order.grandTotal}
                        </span>
                      </div>
                    </label>
                  );
                })}

                {orders.length === 0 && (
                  <p className="text-xs text-slate-500 italic text-center py-4">No orders currently available to generate labels.</p>
                )}
              </div>
            </div>

            {/* Selected Count */}
            <div className="text-xs font-extrabold text-slate-900 px-1">
              Selected Orders: {selectedLabelOrderIds.length}
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => setShowLabelPrintPreview(true)}
              disabled={selectedLabelOrderIds.length === 0}
              className="w-full py-3.5 bg-[#14532d] hover:bg-[#0f3d21] disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Generate Label Sheet (A4 PDF)</span>
            </button>

            {/* Calculation Guide Box matching 8.jpeg */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center text-xs font-semibold text-slate-700 space-y-1">
              <p>📄 4 Orders = 1 A4 Sheet (2x2 Grid)</p>
              <p>📄 8 Orders = 2 A4 Sheets</p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. ORDER TIMELINE (4-Stage Vertical Stepper)               */}
        {/* ========================================================= */}
        {currentScreen === 'order_timeline' && selectedOrder && (() => {
          const isPacking = selectedOrder.orderStatus === 'PACKED' || selectedOrder.orderStatus === 'PROCESSING';
          const isDispatched = selectedOrder.orderStatus === 'DISPATCHED' || selectedOrder.orderStatus === 'OUT_FOR_DELIVERY';
          const isDelivered = selectedOrder.orderStatus === 'DELIVERED';

          const stage1Done = true;
          const stage2Done = isPacking || isDispatched || isDelivered;
          const stage3Done = isDispatched || isDelivered;
          const stage4Done = isDelivered;

          return (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentScreen('order_details')}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-base font-extrabold text-slate-900">Order Timeline</h2>
                </div>
                <button
                  onClick={() => setCurrentScreen('menu_drawer')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Open menu"
                  title="Open Menu"
                >
                  <Menu className="w-5 h-5 text-slate-800" />
                </button>
              </div>

              {/* Stepper Timeline Box matching 12.jpeg */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                
                {/* Stage 1: Order Confirmed */}
                <div className="flex items-start gap-4 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    stage1Done ? 'bg-[#14532d] text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-slate-900">1. Order Confirmed</p>
                    <p className="text-[11px] text-slate-500 font-medium">{formatDateTime(selectedOrder.createdAt)}</p>
                  </div>
                  <div className={`absolute left-3 top-6 bottom-0 w-0.5 -z-0 h-10 ${stage2Done ? 'bg-[#14532d]' : 'bg-slate-200'}`} />
                </div>

                {/* Stage 2: Nursery Packing */}
                <div className="flex items-start gap-4 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    stage2Done ? 'bg-[#14532d] text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {stage2Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Box className="w-3 h-3" />}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-slate-900">2. Nursery Packing</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {stage2Done ? 'Roots wrapped & boxed safely' : 'Pending nursery packaging'}
                    </p>
                  </div>
                  <div className={`absolute left-3 top-6 bottom-0 w-0.5 -z-0 h-10 ${stage3Done ? 'bg-[#14532d]' : 'bg-slate-200'}`} />
                </div>

                {/* Stage 3: Courier Dispatched */}
                <div className="flex items-start gap-4 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    stage3Done ? 'bg-[#14532d] text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {stage3Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Truck className="w-3 h-3" />}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-slate-900">3. Courier Dispatched</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {stage3Done 
                        ? `${selectedOrder.courierName || 'Courier'} • ${selectedOrder.trackingNumber || 'Tracking Live'}` 
                        : 'Awaiting courier dispatch'}
                    </p>
                  </div>
                  <div className={`absolute left-3 top-6 bottom-0 w-0.5 -z-0 h-10 ${stage4Done ? 'bg-[#14532d]' : 'bg-slate-200'}`} />
                </div>

                {/* Stage 4: Delivered */}
                <div className="flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    stage4Done ? 'bg-[#14532d] text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {stage4Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <CheckCircle className="w-3 h-3" />}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-slate-900">4. Delivered</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {stage4Done ? 'Delivered to customer' : 'In delivery progress'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      </main>

      {/* ========================================================= */}
      {/* 7. SLIDE-OVER DRAWER MENU                                  */}
      {/* ========================================================= */}
      {currentScreen === 'menu_drawer' && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setCurrentScreen('dashboard')}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Sprout className="w-4 h-4 text-emerald-700" />
                </div>
                <span className="text-sm font-black tracking-wider text-emerald-900 uppercase">
                  VRG NURSERY
                </span>
              </div>
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Admin User Card */}
            <div className="p-4 bg-emerald-950 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center font-black text-sm">
                {adminUser?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{adminUser?.name || 'Admin User'}</p>
                <p className="text-[10px] text-emerald-300 truncate">{adminUser?.email || 'nv01110612@gmail.com'}</p>
              </div>
            </div>

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-bold">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
                4-Stage Order Workflow
              </div>
              
              <button
                onClick={() => {
                  setOrderStageFilter('confirmed');
                  setCurrentScreen('orders_list');
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>1. Confirmed Orders</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{stats.confirmedCount}</span>
              </button>

              <button
                onClick={() => {
                  setOrderStageFilter('packing');
                  setCurrentScreen('orders_list');
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-amber-500" />
                  <span>2. Nursery Packing</span>
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{stats.packingCount}</span>
              </button>

              <button
                onClick={() => {
                  setOrderStageFilter('dispatched');
                  setCurrentScreen('orders_list');
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>3. Courier Dispatched</span>
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{stats.dispatchedCount}</span>
              </button>

              <button
                onClick={() => {
                  setOrderStageFilter('delivered');
                  setCurrentScreen('orders_list');
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span>4. Delivered Orders</span>
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">{stats.deliveredCount}</span>
              </button>

              <div className="px-3 pt-3 pb-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
                Nursery Catalog & Management
              </div>

              {[
                { key: 'products', label: `🌿 Products Catalog (${products.length})`, icon: <Package className="w-4 h-4 text-emerald-700" /> },
                { key: 'categories', label: `📁 Categories (${categories.length})`, icon: <FolderTree className="w-4 h-4 text-emerald-700" /> },
                { key: 'orders', label: `📦 All Orders (${orders.length})`, icon: <ShoppingBag className="w-4 h-4 text-blue-600" /> },
                { key: 'inventory', label: '⚠️ Inventory & Low Stock Alerts', icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
                { key: 'coupons', label: '🏷️ Discount Coupons', icon: <Tag className="w-4 h-4 text-rose-500" /> },
                { key: 'banners', label: '🖼️ Homepage Banners', icon: <ImageIcon className="w-4 h-4 text-indigo-500" /> },
                { key: 'reviews', label: `⭐ Customer Reviews (${reviews.length})`, icon: <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> },
                { key: 'finances', label: '💰 Finances & Profit/Loss', icon: <DollarSign className="w-4 h-4 text-emerald-600" /> },
                { key: 'settings', label: '⚙️ Store & Payment Settings', icon: <SettingsIcon className="w-4 h-4 text-slate-600" /> },
                { key: 'audit', label: '🛡️ Security & Audit Logs', icon: <ShieldCheck className="w-4 h-4 text-purple-600" /> },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => {
                    if (onOpenDesktopTab) onOpenDesktopTab(item.key);
                    setCurrentScreen('dashboard');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer font-semibold text-xs text-left"
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-1.5">
              <button
                onClick={onBackToStore}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Return to Store</span>
              </button>

              <button
                onClick={() => {
                  if (onLogout) onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. WHATSAPP NOTIFICATION PREVIEW MODAL                     */}
      {/* ========================================================= */}
      {whatsAppModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center">
                  <Send className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900">WhatsApp Notification</h3>
                  <p className="text-[10px] text-slate-400 font-medium">To: +{whatsAppModal.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setWhatsAppModal(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Bubble Preview */}
            <div className="bg-[#E7FFDB] p-3.5 rounded-2xl border border-[#d2f3be] text-xs font-sans text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed shadow-inner">
              {whatsAppModal.message}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleLaunchWhatsApp}
                className="w-full py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open in WhatsApp & Send</span>
              </button>

              <button
                onClick={handleCopyMessage}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedToast ? 'Copied to Clipboard!' : 'Copy Message Text'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. A4 PRINT LABEL SHEET MODAL                              */}
      {/* ========================================================= */}
      {showLabelPrintPreview && (
        <A4LabelSheetPrint
          orders={selectedLabelOrders}
          onClose={() => setShowLabelPrintPreview(false)}
        />
      )}

      {/* ========================================================= */}
      {/* 10. BOTTOM NAVIGATION BAR                                  */}
      {/* ========================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-6 py-2 flex items-center justify-between shadow-lg max-w-md mx-auto">
        
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
            setOrderStageFilter('all');
            setCurrentScreen('orders_list');
          }}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer relative ${
            activeBottomTab === 'orders' ? 'text-[#14532d] font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Orders</span>
          {stats.confirmedCount > 0 && (
            <span className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
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
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">Menu</span>
        </button>
      </nav>
    </div>
  );
};
