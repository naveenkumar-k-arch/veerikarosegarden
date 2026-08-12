import React, { useState, useMemo } from 'react';
import { Order, Product, Category, Review, Coupon, Banner, Combo } from '../types';
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
  Send,
  Box,
  CheckCircle,
  ShoppingBag,
  AlertTriangle,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit,
  Upload,
  Save,
  Eye,
  Camera,
  Layers,
  Sparkles
} from 'lucide-react';
import { A4LabelSheetPrint } from './A4LabelSheetPrint';

export interface MobileAdminWorkflowProps {
  orders: Order[];
  products: Product[];
  categories: Category[];
  reviews: Review[];
  combos?: Combo[];
  coupons?: Coupon[];
  banners?: Banner[];
  settings?: any;
  finances?: any[];
  adminUser?: any;
  onUpdateOrderStatus: (orderId: string, status: string, paymentStatus?: string) => Promise<void>;
  onSaveTracking: (orderId: string, data: { courierName: string; trackingNumber: string; trackingLink?: string }) => Promise<void>;
  onSaveProduct?: (prod: any) => Promise<void>;
  onDeleteProduct?: (id: string, name: string) => Promise<void>;
  onSaveCategory?: (cat: any) => Promise<void>;
  onDeleteCategory?: (id: string, name: string) => Promise<void>;
  onSaveReview?: (rev: any) => void;
  onDeleteReview?: (id: string) => void;
  onSaveCoupon?: (coupon: any) => Promise<void>;
  onDeleteCoupon?: (id: string) => Promise<void>;
  onSaveCombo?: (combo: any) => Promise<void>;
  onDeleteCombo?: (id: string) => Promise<void>;
  onSaveSettings?: (settings: any) => Promise<void>;
  onOpenDesktopTab?: (tabKey: string) => void;
  onBackToStore: () => void;
  onLogout?: () => void;
}

export type ScreenType =
  | 'dashboard'
  | 'orders_list'
  | 'order_details'
  | 'generate_labels'
  | 'dispatch_order'
  | 'order_timeline'
  | 'products'
  | 'categories'
  | 'combos'
  | 'inventory'
  | 'coupons'
  | 'banners'
  | 'reviews'
  | 'finances'
  | 'settings'
  | 'audit'
  | 'menu_drawer';

export const MobileAdminWorkflow: React.FC<MobileAdminWorkflowProps> = ({
  orders,
  products,
  categories,
  reviews,
  combos = [],
  coupons = [],
  banners = [],
  settings: initialSettings,
  finances = [],
  adminUser,
  onUpdateOrderStatus,
  onSaveTracking,
  onSaveProduct,
  onDeleteProduct,
  onSaveCategory,
  onDeleteCategory,
  onSaveReview,
  onDeleteReview,
  onSaveCoupon,
  onDeleteCoupon,
  onSaveCombo,
  onDeleteCombo,
  onSaveSettings,
  onOpenDesktopTab,
  onBackToStore,
  onLogout
}) => {
  // Current screen state
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [activeBottomTab, setActiveBottomTab] = useState<'dashboard' | 'orders' | 'labels' | 'menu'>('dashboard');
  
  // Selected order for detail views
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // 4 Stage Filter: 'confirmed' | 'packing' | 'dispatched' | 'delivered'
  const [orderStageFilter, setOrderStageFilter] = useState<'confirmed' | 'packing' | 'dispatched' | 'delivered'>('confirmed');
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

  // ==================== PRODUCT MODAL STATE ====================
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [productForm, setProductForm] = useState({
    name: '',
    tamilName: '',
    categoryId: 'cat-roses',
    categoryName: 'Roses',
    mrp: 299,
    sellingPrice: 199,
    stock: 25,
    plantHeight: '1-2 Feet',
    potSize: '8 Inch Polybag',
    sunlight: 'Full Sun',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    description: ''
  });

  // ==================== CATEGORY MODAL STATE ====================
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    tamilName: '',
    slug: '',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    description: ''
  });

  // ==================== REVIEW MODAL STATE ====================
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    userName: '',
    location: 'Pennagaram, TN',
    rating: 5,
    title: '',
    comment: '',
    imageUrl: '',
    productName: 'Dutch Hybrid Red Rose',
    status: 'APPROVED' as 'APPROVED' | 'PENDING',
    featured: true
  });

  // ==================== COMBO MODAL STATE ====================
  const [showComboModal, setShowComboModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [comboForm, setComboForm] = useState({
    title: '',
    subtitle: '',
    badge: '3-IN-1 COMBO',
    productIds: [] as string[],
    originalPrice: 599,
    comboPrice: 399,
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    active: true,
    freeDelivery: true
  });

  // ==================== SETTINGS FORM STATE ====================
  const [settingsForm, setSettingsForm] = useState(initialSettings || {
    upiId: '9842624508@okbizaxis',
    payeeName: 'Veerika Rose Garden',
    deliveryCharge: 60,
    freeDeliveryThreshold: 499,
    phone: '9842624508',
    email: 'nv01110612@gmail.com',
    address: 'Pennagaram Main Road, Dharmapuri, Tamil Nadu - 636810'
  });
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

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

    const paidOrders = orders.filter(o => o.paymentStatus === 'SUCCESS');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const lowStockCount = products.filter(p => (p.stock || 0) <= 15).length;

    return {
      confirmedCount: confirmedOrders.length,
      packingCount: packingOrders.length,
      dispatchedCount: dispatchedOrders.length,
      deliveredCount: deliveredOrders.length,
      totalCount: orders.length,
      totalRevenue,
      lowStockCount
    };
  }, [orders, products]);

  // Formatters
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

  // WhatsApp Message Generator
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
      return `🌿 *Veerika Rose Garden (VRG Nursery)*\nOrder Confirmation 📦\n\nDear *${customerName}*,\nThank you for ordering with us! Your order has been *Confirmed* successfully.\n\n📋 *Order ID:* ${order.id}\n📅 *Date:* ${dateStr}\n💰 *Total Amount:* ₹${order.grandTotal}\n\n🌱 *Your Ordered Plants:*\n${itemsList || '• Nursery Plants & Garden Saplings'}\n\nWe will pack your plants with fresh cocopeat and protective wraps.\n\nThank you! 🌿\n*Veerika Rose Garden*`;
    }

    if (stage === 'packing') {
      return `📦 *Veerika Rose Garden (VRG Nursery)*\nNursery Packing Update 🌿\n\nDear *${customerName}*,\nYour plants for *Order #${order.id}* are now in the *Nursery Packing* stage!\n\n🌿 Our expert team is carefully inspecting, watering, and packing your plants with moist root balls and sturdy cardboard boxes to guarantee fresh delivery.\n\nYour package will be handed over to the courier shortly! 🚚\n\nThank you!\n*Veerika Rose Garden*`;
    }

    if (stage === 'dispatched') {
      const courier = order.courierName || dispatchForm.courierName || 'Courier Partner';
      const awb = order.trackingNumber || dispatchForm.awbNumber || 'In Transit';
      const link = order.deliveryNotes || dispatchForm.trackingLink || `https://www.google.com/search?q=${encodeURIComponent(courier + ' ' + awb)}`;

      return `🚚 *Veerika Rose Garden (VRG Nursery)*\nCourier Dispatch & Tracking Update!\n\nDear *${customerName}*,\nGreat news! Your plant order *#${order.id}* has been *Dispatched* via courier.\n\n📦 *Courier Partner:* ${courier}\n🏷️ *AWB / Tracking No:* ${awb}\n\n🔗 *Track Shipment:*\n${link}\n\nPlease keep your phone available during delivery.\nThank you for choosing Veerika Rose Garden! 🌿`;
    }

    return `🌸 *Veerika Rose Garden (VRG Nursery)*\nDelivered with Care! 🪴\n\nDear *${customerName}*,\nYour order *#${order.id}* has been *Delivered* successfully!\n\n🌱 *Quick Plant Care Tips:*\n1. Unbox your plants gently in a shaded area.\n2. Water the roots moderately and allow them to rest for 24 hours before repotting.\n3. Keep away from harsh direct afternoon sunlight for the first 3 days.\n\nWe would love your feedback! Please visit us again. 🌿\n*Veerika Rose Garden*`;
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
      handleOpenWhatsApp(updated, 'dispatched');
    } catch (e) {
      console.error('Failed to save dispatch tracking', e);
      setSavingDispatch(false);
    }
  };

  // Review Photo Upload
  const handleReviewPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setReviewForm(prev => ({ ...prev, imageUrl: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Filtered Orders
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

  // Filtered Products
  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (productCategoryFilter !== 'ALL') {
      list = list.filter(p => p.categoryId === productCategoryFilter);
    }
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.tamilName && p.tamilName.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, productCategoryFilter, productSearch]);

  const selectedLabelOrders = useMemo(() => {
    return orders.filter(o => selectedLabelOrderIds.includes(o.id));
  }, [orders, selectedLabelOrderIds]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 pb-20">
      
      {/* Top Mobile Unified Header */}
      <header className="bg-white border-b border-slate-200/90 px-4 py-3 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
            <Sprout className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <span className="text-base font-black tracking-wider text-emerald-900 uppercase">
              VRG NURSERY
            </span>
          </div>
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

      {/* Main Mobile App Container */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-4 space-y-4">
        
        {/* ========================================================= */}
        {/* 1. DASHBOARD SCREEN                                        */}
        {/* ========================================================= */}
        {currentScreen === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">Admin Dashboard</h2>
              {adminUser && (
                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
                  Admin: {adminUser.name?.split(' ')[0] || 'Admin'}
                </span>
              )}
            </div>

            {/* Quick Overview Summary Banner */}
            <div className="bg-[#14532d] text-white p-4 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Total Farm Sales</span>
                <span className="text-[11px] bg-emerald-800/80 px-2 py-0.5 rounded-full font-bold">Live Data</span>
              </div>
              <p className="text-3xl font-black">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
              <div className="flex items-center justify-between text-xs pt-1 text-emerald-100 border-t border-emerald-800/60">
                <span>📦 Total Orders: <strong>{orders.length}</strong></span>
                <span>🌿 Total Plants: <strong>{products.length}</strong></span>
              </div>
            </div>

            {/* 4 Status KPI Metric Cards (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-3">
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
                <span className="text-[10px] text-slate-400 font-medium">In packaging</span>
              </button>

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

            {/* Quick Shortcuts Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <button
                onClick={() => setCurrentScreen('products')}
                className="p-3 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 active:scale-95 transition-all shadow-xs cursor-pointer flex flex-col items-center gap-1"
              >
                <Package className="w-5 h-5 text-emerald-700" />
                <span>Plants ({products.length})</span>
              </button>

              <button
                onClick={() => setCurrentScreen('categories')}
                className="p-3 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 active:scale-95 transition-all shadow-xs cursor-pointer flex flex-col items-center gap-1"
              >
                <FolderTree className="w-5 h-5 text-emerald-700" />
                <span>Categories</span>
              </button>

              <button
                onClick={() => setCurrentScreen('reviews')}
                className="p-3 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 active:scale-95 transition-all shadow-xs cursor-pointer flex flex-col items-center gap-1"
              >
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>Reviews ({reviews.length})</span>
              </button>
            </div>

            {/* Recent Orders Section */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Recent Orders</h3>
                <button
                  onClick={() => {
                    setOrderStageFilter('confirmed');
                    setCurrentScreen('orders_list');
                    setActiveBottomTab('orders');
                  }}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View Orders ({orders.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {orders.slice(0, 6).map((order) => {
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
                        <span className="text-xs font-semibold text-slate-700 truncate">
                          {order.customerName || order.shippingAddress?.fullName || 'Customer'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium shrink-0">
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
        {/* 2. ORDERS LIST SCREEN (4 Stages)                           */}
        {/* ========================================================= */}
        {currentScreen === 'orders_list' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Orders List</h2>
              </div>
              <button
                onClick={() => setCurrentScreen('menu_drawer')}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
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
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            {/* Exactly the 4 Dedicated Order Stage Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-200/90 rounded-2xl">
              {[
                { key: 'confirmed', label: '1. Confirmed', count: stats.confirmedCount, color: 'text-emerald-700' },
                { key: 'packing', label: '2. Packing', count: stats.packingCount, color: 'text-amber-600' },
                { key: 'dispatched', label: '3. Courier', count: stats.dispatchedCount, color: 'text-blue-600' },
                { key: 'delivered', label: '4. Delivered', count: stats.deliveredCount, color: 'text-purple-700' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setOrderStageFilter(tab.key as any)}
                  className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
                    orderStageFilter === tab.key
                      ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 font-bold'
                  }`}
                >
                  <span className="block text-[11px] leading-tight truncate">{tab.label}</span>
                  <span className={`block text-xs font-black mt-0.5 ${orderStageFilter === tab.key ? tab.color : 'text-slate-500'}`}>
                    {tab.count}
                  </span>
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
                        <span>Manage Order</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredOrders.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                  <p className="text-xs font-bold text-slate-500">No orders found in this stage</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. ORDER DETAILS SCREEN (Actions & WhatsApp)               */}
        {/* ========================================================= */}
        {currentScreen === 'order_details' && selectedOrder && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('orders_list')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Manage Order</h2>
              </div>
              <button
                onClick={() => setCurrentScreen('menu_drawer')}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                aria-label="Open menu"
                title="Open Menu"
              >
                <Menu className="w-5 h-5 text-slate-800" />
              </button>
            </div>

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
                  <p className="text-xs text-slate-400 italic py-2">No items listed.</p>
                )}
              </div>
            </div>

            {/* Payment Details */}
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
                  selectedOrder.paymentStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                }`}>
                  {selectedOrder.paymentStatus || 'PENDING'}
                </span>
              </div>
            </div>

            {/* 4-Stage Action Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900">Update Order Stage</h3>
              
              <div className="grid grid-cols-2 gap-2">
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

              {/* WhatsApp Notification Buttons */}
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
        {/* 4. DISPATCH COURIER FORM                                   */}
        {/* ========================================================= */}
        {currentScreen === 'dispatch_order' && selectedOrder && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('order_details')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Courier Dispatch</h2>
              </div>
              <button
                onClick={() => setCurrentScreen('menu_drawer')}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                aria-label="Open menu"
                title="Open Menu"
              >
                <Menu className="w-5 h-5 text-slate-800" />
              </button>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-900">Order #{selectedOrder.id}</span>
              <span className="font-semibold text-slate-600">{selectedOrder.customerName || selectedOrder.shippingAddress?.fullName}</span>
            </div>

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
                  <option value="Self Delivery">Self Delivery</option>
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
                <label className="text-xs font-bold text-slate-700 block">Tracking URL</label>
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
        {/* 5. GENERATE LABELS SCREEN                                  */}
        {/* ========================================================= */}
        {currentScreen === 'generate_labels' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Generate Labels</h2>
              </div>
              <button
                onClick={() => setCurrentScreen('menu_drawer')}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                aria-label="Open menu"
                title="Open Menu"
              >
                <Menu className="w-5 h-5 text-slate-800" />
              </button>
            </div>

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

            <div className="text-xs font-extrabold text-slate-900 px-1">
              Selected Orders: {selectedLabelOrderIds.length}
            </div>

            <button
              onClick={() => setShowLabelPrintPreview(true)}
              disabled={selectedLabelOrderIds.length === 0}
              className="w-full py-3.5 bg-[#14532d] hover:bg-[#0f3d21] disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Generate Label Sheet (A4 PDF)</span>
            </button>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center text-xs font-semibold text-slate-700 space-y-1">
              <p>📄 4 Orders = 1 A4 Sheet (2x2 Grid)</p>
              <p>📄 8 Orders = 2 A4 Sheets</p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. ORDER TIMELINE SCREEN                                   */}
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
                    className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-base font-extrabold text-slate-900">Order Timeline</h2>
                </div>
                <button
                  onClick={() => setCurrentScreen('menu_drawer')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  aria-label="Open menu"
                  title="Open Menu"
                >
                  <Menu className="w-5 h-5 text-slate-800" />
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                {/* 1. Confirmed */}
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

                {/* 2. Packing */}
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

                {/* 3. Dispatched */}
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

                {/* 4. Delivered */}
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

        {/* ========================================================= */}
        {/* 7. PRODUCTS CATALOG SCREEN (Mobile)                       */}
        {/* ========================================================= */}
        {currentScreen === 'products' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Products Catalog</h2>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    name: '',
                    tamilName: '',
                    categoryId: categories[0]?.id || 'cat-roses',
                    categoryName: categories[0]?.name || 'Roses',
                    mrp: 299,
                    sellingPrice: 199,
                    stock: 25,
                    plantHeight: '1-2 Feet',
                    potSize: '8 Inch Bag',
                    sunlight: 'Full Sun',
                    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
                    description: ''
                  });
                  setShowProductModal(true);
                }}
                className="px-3 py-1.5 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Plant</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search plants by name, Tamil name..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            {/* Products List Cards */}
            <div className="space-y-2.5">
              {filteredProducts.map(p => (
                <div key={p.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <img
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'}
                    alt={p.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-100"
                  />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="font-bold text-xs text-slate-900 truncate">{p.name}</p>
                    {p.tamilName && <p className="text-[11px] text-emerald-800 font-medium truncate">{p.tamilName}</p>}
                    <div className="flex items-center gap-2 text-xs pt-0.5">
                      <span className="font-extrabold text-emerald-800">₹{p.sellingPrice}</span>
                      {p.mrp > p.sellingPrice && <span className="text-slate-400 line-through text-[10px]">₹{p.mrp}</span>}
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        p.stock <= 10 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Stock: {p.stock}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingProduct(p);
                        setProductForm({
                          name: p.name,
                          tamilName: p.tamilName || '',
                          categoryId: p.categoryId || 'cat-roses',
                          categoryName: p.categoryName || 'Roses',
                          mrp: p.mrp || 299,
                          sellingPrice: p.sellingPrice || 199,
                          stock: p.stock || 25,
                          plantHeight: p.plantHeight || '1-2 Feet',
                          potSize: p.potSize || '8 Inch Bag',
                          sunlight: p.sunlight || 'Full Sun',
                          imageUrl: p.images?.[0] || '',
                          description: p.description || ''
                        });
                        setShowProductModal(true);
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 cursor-pointer"
                      title="Edit Plant"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteProduct && (
                      <button
                        onClick={() => onDeleteProduct(p.id, p.name)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-600 cursor-pointer"
                        title="Delete Plant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                  <Package className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">No plants found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 8. CATEGORIES SCREEN (Mobile)                             */}
        {/* ========================================================= */}
        {currentScreen === 'categories' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Categories ({categories.length})</h2>
              </div>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({
                    name: '',
                    tamilName: '',
                    slug: '',
                    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
                    description: ''
                  });
                  setShowCategoryModal(true);
                }}
                className="px-3 py-1.5 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {categories.map(c => {
                const prodCount = products.filter(p => p.categoryId === c.id).length;
                return (
                  <div key={c.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'}
                        alt={c.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-100"
                      />
                      <div>
                        <p className="font-bold text-xs text-slate-900">{c.name}</p>
                        {c.tamilName && <p className="text-[11px] text-emerald-800 font-medium">{c.tamilName}</p>}
                        <p className="text-[10px] text-slate-400">{prodCount} plants attached</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCategory(c);
                          setCategoryForm({
                            name: c.name,
                            tamilName: c.tamilName || '',
                            slug: c.slug || '',
                            image: c.image || '',
                            description: c.description || ''
                          });
                          setShowCategoryModal(true);
                        }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteCategory && (
                        <button
                          onClick={() => onDeleteCategory(c.id, c.name)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 8.5 COMBO OFFERS SCREEN (3-in-1 Bundles)                   */}
        {/* ========================================================= */}
        {currentScreen === 'combos' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Plant Combos ({combos.length})</h2>
              </div>
              <button
                onClick={() => {
                  setEditingCombo(null);
                  setComboForm({
                    title: '',
                    subtitle: '',
                    badge: '3-IN-1 COMBO',
                    productIds: products.slice(0, 3).map(p => p.id),
                    originalPrice: 599,
                    comboPrice: 399,
                    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
                    active: true,
                    freeDelivery: true
                  });
                  setShowComboModal(true);
                }}
                className="px-3 py-1.5 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Combo</span>
              </button>
            </div>

            <div className="space-y-3">
              {combos.map(combo => {
                const discount = combo.originalPrice > combo.comboPrice
                  ? Math.round(((combo.originalPrice - combo.comboPrice) / combo.originalPrice) * 100)
                  : 0;

                return (
                  <div key={combo.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      {combo.imageUrl && (
                        <img
                          src={combo.imageUrl}
                          alt={combo.title}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
                            {combo.badge || 'COMBO'}
                          </span>
                          {combo.freeDelivery && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                              🚚 Free Delivery
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900 mt-1 truncate">{combo.title}</h4>
                        {combo.subtitle && <p className="text-[11px] text-slate-500 truncate">{combo.subtitle}</p>}
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-black text-emerald-800">₹{combo.comboPrice}</span>
                          {combo.originalPrice > combo.comboPrice && (
                            <span className="text-xs text-slate-400 line-through">₹{combo.originalPrice}</span>
                          )}
                          {discount > 0 && (
                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1 rounded">
                              {discount}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        combo.active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {combo.active ? 'Active on Store' : 'Hidden'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCombo(combo);
                            setComboForm({
                              title: combo.title,
                              subtitle: combo.subtitle || '',
                              badge: combo.badge || '3-IN-1 COMBO',
                              productIds: combo.productIds || [],
                              originalPrice: combo.originalPrice || 599,
                              comboPrice: combo.comboPrice || 399,
                              imageUrl: combo.imageUrl || '',
                              active: combo.active !== false,
                              freeDelivery: combo.freeDelivery || false
                            });
                            setShowComboModal(true);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteCombo && (
                          <button
                            onClick={() => onDeleteCombo(combo.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {combos.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                  <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No combo packages created yet</p>
                  <p className="text-[11px] text-slate-400">Click "+ Add Combo" to bundle 3 plants with special offer pricing.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 9. INVENTORY & STOCK ALERTS SCREEN                         */}
        {/* ========================================================= */}
        {currentScreen === 'inventory' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Inventory & Stock</h2>
              </div>
              <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                {stats.lowStockCount} Low Stock
              </span>
            </div>

            <div className="space-y-2.5">
              {products.map(p => (
                <div key={p.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-bold text-xs text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">₹{p.sellingPrice} • Stock: <strong className={p.stock <= 10 ? 'text-rose-600' : 'text-emerald-700'}>{p.stock} units</strong></p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={async () => {
                        const newStock = Math.max(0, p.stock - 5);
                        if (onSaveProduct) await onSaveProduct({ ...p, stock: newStock });
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      -5
                    </button>
                    <button
                      onClick={async () => {
                        const newStock = p.stock + 5;
                        if (onSaveProduct) await onSaveProduct({ ...p, stock: newStock });
                      }}
                      className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 rounded-lg text-xs font-bold text-emerald-800 cursor-pointer"
                    >
                      +5
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 10. CUSTOMER REVIEWS SCREEN                                */}
        {/* ========================================================= */}
        {currentScreen === 'reviews' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Reviews ({reviews.length})</h2>
              </div>
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-3 py-1.5 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Review</span>
              </button>
            </div>

            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-900">{r.userName}</p>
                      <p className="text-[10px] text-slate-400">{r.location || 'Customer'}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-medium italic">"{r.comment}"</p>

                  {r.imageUrl && (
                    <div className="w-full h-36 rounded-xl overflow-hidden border border-slate-200">
                      <img src={r.imageUrl} alt="Customer plant review" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <span className={`font-bold px-2 py-0.5 rounded-md ${
                      r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {r.status === 'APPROVED' ? '✓ Approved' : 'Pending'}
                    </span>
                    {onDeleteReview && (
                      <button
                        onClick={() => onDeleteReview(r.id)}
                        className="text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {reviews.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                  <Star className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">No reviews published yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 11. FINANCES SCREEN                                       */}
        {/* ========================================================= */}
        {currentScreen === 'finances' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Farm Finances</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Gross Revenue</span>
                <p className="text-xl font-black text-emerald-700">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
                <span className="text-[10px] text-slate-400 font-medium">From customer orders</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Orders</span>
                <p className="text-xl font-black text-slate-900">{orders.length}</p>
                <span className="text-[10px] text-slate-400 font-medium">{stats.deliveredCount} delivered</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900">Payment Breakdown</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">UPI / QR Payments</span>
                  <span className="font-bold text-emerald-700">
                    ₹{orders.filter(o => o.paymentMethod !== 'COD' && o.paymentStatus === 'SUCCESS').reduce((s, o) => s + (o.grandTotal || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Cash on Delivery (COD)</span>
                  <span className="font-bold text-amber-700">
                    ₹{orders.filter(o => o.paymentMethod === 'COD').reduce((s, o) => s + (o.grandTotal || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 12. SETTINGS SCREEN                                        */}
        {/* ========================================================= */}
        {currentScreen === 'settings' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Store Settings</h2>
              </div>
            </div>

            {settingsSavedToast && (
              <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold text-center border border-emerald-300">
                ✓ Settings saved successfully!
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (onSaveSettings) await onSaveSettings(settingsForm);
                setSettingsSavedToast(true);
                setTimeout(() => setSettingsSavedToast(false), 2500);
              }}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">UPI ID for Direct QR Payments</label>
                <input
                  type="text"
                  value={settingsForm.upiId}
                  onChange={e => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Delivery Fee (₹)</label>
                <input
                  type="number"
                  value={settingsForm.deliveryCharge}
                  onChange={e => setSettingsForm({ ...settingsForm, deliveryCharge: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Free Delivery Min Order (₹)</label>
                <input
                  type="number"
                  value={settingsForm.freeDeliveryThreshold}
                  onChange={e => setSettingsForm({ ...settingsForm, freeDeliveryThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Support Phone Number</label>
                <input
                  type="text"
                  value={settingsForm.phone}
                  onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Store Settings</span>
              </button>
            </form>
          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* 13. SLIDE-OVER DRAWER MENU                                 */}
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
                { screen: 'products', label: `🌿 Products Catalog (${products.length})`, icon: <Package className="w-4 h-4 text-emerald-700" /> },
                { screen: 'combos', label: `🎁 Plant Combos & Offers (${combos.length})`, icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
                { screen: 'categories', label: `📁 Categories (${categories.length})`, icon: <FolderTree className="w-4 h-4 text-emerald-700" /> },
                { screen: 'orders_list', label: `📦 All Orders (${orders.length})`, icon: <ShoppingBag className="w-4 h-4 text-blue-600" /> },
                { screen: 'inventory', label: '⚠️ Inventory & Low Stock Alerts', icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
                { screen: 'reviews', label: `⭐ Customer Reviews (${reviews.length})`, icon: <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> },
                { screen: 'finances', label: '💰 Finances & Profit/Loss', icon: <DollarSign className="w-4 h-4 text-emerald-600" /> },
                { screen: 'settings', label: '⚙️ Store & Payment Settings', icon: <SettingsIcon className="w-4 h-4 text-slate-600" /> },
              ].map(item => (
                <button
                  key={item.screen}
                  onClick={() => setCurrentScreen(item.screen as any)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer font-semibold text-xs text-left"
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Footer Actions */}
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
      {/* 14. ADD/EDIT PRODUCT MODAL                                 */}
      {/* ========================================================= */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingProduct ? 'Edit Plant' : 'Add New Plant'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (onSaveProduct) {
                  await onSaveProduct({
                    id: editingProduct?.id,
                    name: productForm.name,
                    tamilName: productForm.tamilName,
                    categoryId: productForm.categoryId,
                    categoryName: productForm.categoryName,
                    mrp: Number(productForm.mrp),
                    sellingPrice: Number(productForm.sellingPrice),
                    stock: Number(productForm.stock),
                    plantHeight: productForm.plantHeight,
                    potSize: productForm.potSize,
                    sunlight: productForm.sunlight,
                    images: [productForm.imageUrl],
                    description: productForm.description || productForm.name
                  });
                }
                setShowProductModal(false);
              }}
              className="p-4 overflow-y-auto space-y-3 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Plant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Red Rose"
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Tamil Name</label>
                <input
                  type="text"
                  placeholder="e.g. சிவப்பு ரோஜா"
                  value={productForm.tamilName}
                  onChange={e => setProductForm({ ...productForm, tamilName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.sellingPrice}
                    onChange={e => setProductForm({ ...productForm, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">MRP (₹)</label>
                  <input
                    type="number"
                    value={productForm.mrp}
                    onChange={e => setProductForm({ ...productForm, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Stock Quantity *</label>
                <input
                  type="number"
                  required
                  value={productForm.stock}
                  onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Image URL</label>
                <input
                  type="text"
                  value={productForm.imageUrl}
                  onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-[11px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {editingProduct ? 'Save Plant Changes' : 'Add Plant to Store'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 15. ADD/EDIT CATEGORY MODAL                                */}
      {/* ========================================================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (onSaveCategory) {
                  await onSaveCategory({
                    id: editingCategory?.id,
                    name: categoryForm.name,
                    tamilName: categoryForm.tamilName,
                    slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
                    image: categoryForm.image,
                    description: categoryForm.description
                  });
                }
                setShowCategoryModal(false);
              }}
              className="p-4 overflow-y-auto space-y-3 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Roses"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Tamil Name</label>
                <input
                  type="text"
                  placeholder="e.g. ரோஜா வகைகள்"
                  value={categoryForm.tamilName}
                  onChange={e => setCategoryForm({ ...categoryForm, tamilName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Image URL</label>
                <input
                  type="text"
                  value={categoryForm.image}
                  onChange={e => setCategoryForm({ ...categoryForm, image: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-[11px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {editingCategory ? 'Save Category Changes' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD/EDIT COMBO MODAL                                       */}
      {/* ========================================================= */}
      {showComboModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingCombo ? 'Edit Plant Combo' : 'Create 3-in-1 Combo Offer'}
              </h3>
              <button onClick={() => setShowComboModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (onSaveCombo) {
                  await onSaveCombo({
                    id: editingCombo?.id,
                    title: comboForm.title,
                    subtitle: comboForm.subtitle,
                    badge: comboForm.badge,
                    productIds: comboForm.productIds,
                    originalPrice: Number(comboForm.originalPrice),
                    comboPrice: Number(comboForm.comboPrice),
                    imageUrl: comboForm.imageUrl,
                    active: comboForm.active,
                    freeDelivery: comboForm.freeDelivery
                  });
                }
                setShowComboModal(false);
              }}
              className="p-4 overflow-y-auto space-y-3 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Combo Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3-in-1 Fragrant Rose Special"
                  value={comboForm.title}
                  onChange={e => setComboForm({ ...comboForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Subtitle / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Damask + Kashmiri + Button Rose"
                  value={comboForm.subtitle}
                  onChange={e => setComboForm({ ...comboForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Badge Text</label>
                <input
                  type="text"
                  placeholder="e.g. 3-IN-1 COMBO, 40% OFF"
                  value={comboForm.badge}
                  onChange={e => setComboForm({ ...comboForm, badge: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Original Total (₹) *</label>
                  <input
                    type="number"
                    required
                    value={comboForm.originalPrice}
                    onChange={e => setComboForm({ ...comboForm, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Combo Offer Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={comboForm.comboPrice}
                    onChange={e => setComboForm({ ...comboForm, comboPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Select Plants in this Combo ({comboForm.productIds.length} Selected)</label>
                <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {products.map(p => {
                    const isSelected = comboForm.productIds.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer select-none text-xs">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setComboForm(prev => ({ ...prev, productIds: prev.productIds.filter(id => id !== p.id) }));
                            } else {
                              setComboForm(prev => ({ ...prev, productIds: [...prev.productIds, p.id] }));
                            }
                          }}
                          className="w-3.5 h-3.5 text-emerald-700 rounded"
                        />
                        <span className="truncate flex-1 font-semibold">{p.name} (₹{p.sellingPrice})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Banner Image URL</label>
                <input
                  type="text"
                  value={comboForm.imageUrl}
                  onChange={e => setComboForm({ ...comboForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-[11px]"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={comboForm.active}
                    onChange={e => setComboForm({ ...comboForm, active: e.target.checked })}
                    className="w-4 h-4 text-emerald-700 rounded"
                  />
                  <span>Active on Store</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-800">
                  <input
                    type="checkbox"
                    checked={comboForm.freeDelivery}
                    onChange={e => setComboForm({ ...comboForm, freeDelivery: e.target.checked })}
                    className="w-4 h-4 text-emerald-700 rounded"
                  />
                  <span>🚚 Free Delivery</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {editingCombo ? 'Save Combo Changes' : 'Publish Combo Offer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 16. ADD REVIEW MODAL WITH LOCAL PHOTO UPLOADER             */}
      {/* ========================================================= */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Add Customer Review</h3>
              <button onClick={() => setShowReviewModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onSaveReview) {
                  onSaveReview({
                    id: `rev-${Date.now()}`,
                    userName: reviewForm.userName,
                    location: reviewForm.location,
                    rating: Number(reviewForm.rating),
                    title: reviewForm.title,
                    comment: reviewForm.comment,
                    imageUrl: reviewForm.imageUrl,
                    productName: reviewForm.productName,
                    status: reviewForm.status,
                    featured: reviewForm.featured,
                    createdAt: new Date().toISOString()
                  });
                }
                setShowReviewModal(false);
              }}
              className="p-4 overflow-y-auto space-y-3 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={reviewForm.userName}
                  onChange={e => setReviewForm({ ...reviewForm, userName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Rating (1 to 5 Stars)</label>
                <select
                  value={reviewForm.rating}
                  onChange={e => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value={5}>★★★★★ (5 Stars)</option>
                  <option value={4}>★★★★☆ (4 Stars)</option>
                  <option value={3}>★★★☆☆ (3 Stars)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Review Comment *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Customer feedback on plant quality..."
                  value={reviewForm.comment}
                  onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Upload Customer Plant Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReviewPhotoUpload}
                  className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-700 file:text-white cursor-pointer"
                />
                {reviewForm.imageUrl && (
                  <img src={reviewForm.imageUrl} alt="Preview" className="w-full h-24 object-cover rounded-xl mt-1 border" />
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Publish Review to Store
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 17. WHATSAPP NOTIFICATION PREVIEW MODAL                    */}
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

            <div className="bg-[#E7FFDB] p-3.5 rounded-2xl border border-[#d2f3be] text-xs font-sans text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed shadow-inner">
              {whatsAppModal.message}
            </div>

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
      {/* 18. A4 PRINT LABEL SHEET MODAL                             */}
      {/* ========================================================= */}
      {showLabelPrintPreview && (
        <A4LabelSheetPrint
          orders={selectedLabelOrders}
          onClose={() => setShowLabelPrintPreview(false)}
        />
      )}

      {/* ========================================================= */}
      {/* 19. BOTTOM NAVIGATION BAR                                  */}
      {/* ========================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-6 py-2 flex items-center justify-between shadow-lg max-w-lg mx-auto">
        <button
          onClick={() => {
            setActiveBottomTab('dashboard');
            setCurrentScreen('dashboard');
          }}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeBottomTab === 'dashboard' && currentScreen === 'dashboard' ? 'text-[#14532d] font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        <button
          onClick={() => {
            setActiveBottomTab('orders');
            setOrderStageFilter('confirmed');
            setCurrentScreen('orders_list');
          }}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer relative ${
            currentScreen === 'orders_list' || currentScreen === 'order_details' ? 'text-[#14532d] font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Orders</span>
          {stats.confirmedCount > 0 && (
            <span className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveBottomTab('labels');
            setCurrentScreen('generate_labels');
          }}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            currentScreen === 'generate_labels' ? 'text-[#14532d] font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px]">Label Sheet</span>
        </button>

        <button
          onClick={() => {
            setActiveBottomTab('menu');
            setCurrentScreen('menu_drawer');
          }}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            currentScreen === 'menu_drawer' ? 'text-[#14532d] font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">Menu</span>
        </button>
      </nav>
    </div>
  );
};
