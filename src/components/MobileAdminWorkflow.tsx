import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Order, Product, Category, Review, Coupon, Banner, Combo, FinancialEntry, SiteSettings } from '../types';
import { processLocalImageFile } from '../utils/imageUpload';
import { toast } from '../utils/toast';
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
  Sparkles,
  CreditCard,
  QrCode,
  TrendingUp,
  TrendingDown,
  CheckSquare
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
  finances?: FinancialEntry[];
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
  onSaveFinance?: (entry: any) => Promise<void>;
  onDeleteFinance?: (id: string) => Promise<void>;
  onSaveBanner?: (banner: any) => Promise<void>;
  onDeleteBanner?: (id: string) => Promise<void>;
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
  onSaveFinance,
  onDeleteFinance,
  onSaveBanner,
  onDeleteBanner,
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
  
  // QR Payment Receipt Zoom Modal State
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);
  const [copiedUtrToast, setCopiedUtrToast] = useState(false);
  
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
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productModalError, setProductModalError] = useState<string | null>(null);
  const [productSuccessToast, setProductSuccessToast] = useState<string | null>(null);
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

  // Mobile Product Image Upload State
  const [mobileProdImgTab, setMobileProdImgTab] = useState<'upload' | 'url'>('upload');
  const [isUploadingMobileImage, setIsUploadingMobileImage] = useState(false);

  const handleMobileProductLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMobileImage(true);
    try {
      const dataUrl = await processLocalImageFile(file);
      if (dataUrl) {
        setProductForm(prev => ({ ...prev, imageUrl: dataUrl }));
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to process image');
    } finally {
      setIsUploadingMobileImage(false);
      e.target.value = '';
    }
  };


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

  // ==================== COUPON MODAL STATE ====================
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT',
    discountValue: 10,
    minOrderAmount: 0,
    maxUsageCount: 100,
    expiryDate: '',
    isActive: true,
    description: ''
  });
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);

  // ==================== FINANCE MODAL STATE ====================
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [editingFinance, setEditingFinance] = useState<FinancialEntry | null>(null);
  const [financeForm, setFinanceForm] = useState({
    type: 'EXPENSE' as 'EXPENSE' | 'SALE',
    title: '',
    category: 'Fertilizer' as FinancialEntry['category'],
    costAmount: 0,
    sellAmount: 0,
    quantity: 1,
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  // ==================== BANNER MODAL STATE ====================
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    link: '',
    ctaText: 'Shop Plants',
    active: true,
    order: 1
  });

  // ==================== SETTINGS FORM STATE ====================
  const [settingsForm, setSettingsForm] = useState<any>(initialSettings || {
    businessName: 'Veerika Rose Garden',
    tagline: 'Fresh Live Rose Plants & Nursery',
    phone: '9842624508',
    email: 'nv01110612@gmail.com',
    whatsapp: '9842624508',
    address: 'Pennagaram Main Road, Dharmapuri, Tamil Nadu - 636810',
    googleMapsUrl: '',
    shippingFee: 60,
    freeShippingThreshold: 499,
    deliveryCharge: 60,
    freeDeliveryThreshold: 499,
    enableCod: true,
    enablePhonePe: true,
    enableQrPayment: true,
    enableRazorpay: true,
    razorpayKeyId: 'rzp_test_TPhhoBxVXsxTpD',
    razorpayKeySecret: 'deYVUZfzzRp1mXaqioKd3GZw',
    upiId: '9842624508@okbizaxis',
    payeeName: 'Veerika Rose Garden',
    qrInstructions: 'Scan QR using any UPI app (GPay, PhonePe, Paytm) and upload screenshot',
    phonepeMerchantId: 'M22G1Y3J3W6D2',
    phonepeSaltKey: '21396eb1-d507-4e0e-9f37-9ad841d13db7',
    phonepeSaltIndex: '1',
    phonepeEnv: 'SANDBOX'
  });

  // Helper to close all modal states locally without pushing history
  const closeAllModalsLocally = useCallback(() => {
    setShowProductModal(false);
    setShowCategoryModal(false);
    setShowComboModal(false);
    setShowCouponModal(false);
    setShowFinanceModal(false);
    setShowBannerModal(false);
    setShowReviewModal(false);
    setShowLabelPrintPreview(false);
    setSelectedProofOrder(null);
    setWhatsAppModal(null);
  }, []);

  // Centralized Screen Navigation with Browser History Integration
  const navigateScreen = useCallback((screen: ScreenType, order?: Order | null, replace = false) => {
    closeAllModalsLocally();
    if (order !== undefined) {
      setSelectedOrder(order);
    }
    setCurrentScreen(screen);

    // Sync bottom active tab
    if (screen === 'dashboard') setActiveBottomTab('dashboard');
    else if (screen === 'orders_list' || screen === 'order_details' || screen === 'dispatch_order' || screen === 'order_timeline') setActiveBottomTab('orders');
    else if (screen === 'generate_labels') setActiveBottomTab('labels');
    else if (screen === 'menu_drawer') setActiveBottomTab('menu');

    const stateObj = {
      vrgAdmin: true,
      page: 'admin',
      adminScreen: screen,
      orderId: order ? order.id : (screen === 'order_details' || screen === 'dispatch_order' || screen === 'order_timeline') ? (order === null ? undefined : selectedOrder?.id) : undefined,
      stageFilter: orderStageFilter,
      modal: null
    };

    if (replace) {
      window.history.replaceState(stateObj, '', '/admin');
    } else {
      window.history.pushState(stateObj, '', '/admin');
    }
  }, [closeAllModalsLocally, selectedOrder, orderStageFilter]);

  // Centralized Modal Open with Browser History Integration
  const openAdminModal = useCallback((
    modalName: 'product' | 'category' | 'combo' | 'coupon' | 'finance' | 'banner' | 'review' | 'proof' | 'whatsapp' | 'label_preview',
    extra?: any
  ) => {
    const stateObj = {
      vrgAdmin: true,
      page: 'admin',
      adminScreen: currentScreen,
      orderId: selectedOrder?.id,
      stageFilter: orderStageFilter,
      modal: modalName
    };
    window.history.pushState(stateObj, '', '/admin');

    if (modalName === 'product') {
      setShowProductModal(true);
      if (extra?.product !== undefined) setEditingProduct(extra.product);
    } else if (modalName === 'category') {
      setShowCategoryModal(true);
      if (extra?.category !== undefined) setEditingCategory(extra.category);
    } else if (modalName === 'combo') {
      setShowComboModal(true);
      if (extra?.combo !== undefined) setEditingCombo(extra.combo);
    } else if (modalName === 'coupon') {
      setShowCouponModal(true);
    } else if (modalName === 'finance') {
      setShowFinanceModal(true);
      if (extra?.finance !== undefined) setEditingFinance(extra.finance);
    } else if (modalName === 'banner') {
      setShowBannerModal(true);
      if (extra?.banner !== undefined) setEditingBanner(extra.banner);
    } else if (modalName === 'review') {
      setShowReviewModal(true);
    } else if (modalName === 'proof') {
      if (extra?.order) setSelectedProofOrder(extra.order);
    } else if (modalName === 'whatsapp') {
      if (extra?.modal) setWhatsAppModal(extra.modal);
    } else if (modalName === 'label_preview') {
      setShowLabelPrintPreview(true);
    }
  }, [currentScreen, selectedOrder, orderStageFilter]);

  // Handle Close Modal via History Back or Local Closer
  const handleCloseModal = useCallback((closer: () => void) => {
    if (window.history.state && window.history.state.modal) {
      window.history.back();
    } else {
      closer();
    }
  }, []);

  // Handle Back Navigation from In-App Back Arrows
  const handleGoBack = useCallback((fallbackScreen: ScreenType = 'dashboard') => {
    if (window.history.state && window.history.state.vrgAdmin && window.history.state.adminScreen && window.history.state.adminScreen !== 'dashboard') {
      window.history.back();
    } else {
      navigateScreen(fallbackScreen);
    }
  }, [navigateScreen]);

  // Popstate Listener for Mobile Admin Workflow
  useEffect(() => {
    // Replace initial state with VRG Admin state on mount if not present
    if (!window.history.state || !window.history.state.vrgAdmin) {
      window.history.replaceState({
        vrgAdmin: true,
        page: 'admin',
        adminScreen: currentScreen,
        stageFilter: orderStageFilter,
        modal: null
      }, '', '/admin');
    }

    const handleAdminPopState = (e: PopStateEvent) => {
      const state = e.state;
      if (state && state.vrgAdmin) {
        // 1. Synchronize modals
        if (!state.modal) {
          setShowProductModal(false);
          setShowCategoryModal(false);
          setShowComboModal(false);
          setShowCouponModal(false);
          setShowFinanceModal(false);
          setShowBannerModal(false);
          setShowReviewModal(false);
          setShowLabelPrintPreview(false);
          setSelectedProofOrder(null);
          setWhatsAppModal(null);
        } else {
          if (state.modal === 'product') setShowProductModal(true);
          else if (state.modal === 'category') setShowCategoryModal(true);
          else if (state.modal === 'combo') setShowComboModal(true);
          else if (state.modal === 'coupon') setShowCouponModal(true);
          else if (state.modal === 'finance') setShowFinanceModal(true);
          else if (state.modal === 'banner') setShowBannerModal(true);
          else if (state.modal === 'review') setShowReviewModal(true);
          else if (state.modal === 'label_preview') setShowLabelPrintPreview(true);
        }

        // 2. Synchronize screen
        if (state.adminScreen) {
          setCurrentScreen(state.adminScreen);
          if (state.adminScreen === 'dashboard') setActiveBottomTab('dashboard');
          else if (state.adminScreen === 'orders_list' || state.adminScreen === 'order_details' || state.adminScreen === 'dispatch_order' || state.adminScreen === 'order_timeline') setActiveBottomTab('orders');
          else if (state.adminScreen === 'generate_labels') setActiveBottomTab('labels');
          else if (state.adminScreen === 'menu_drawer') setActiveBottomTab('menu');
        }

        // 3. Synchronize selected order
        if (state.orderId) {
          const found = orders.find(o => o.id === state.orderId);
          if (found) setSelectedOrder(found);
        } else if (state.adminScreen === 'dashboard' || state.adminScreen === 'orders_list' || state.adminScreen === 'products' || state.adminScreen === 'categories') {
          setSelectedOrder(null);
        }

        // 4. Synchronize stage filter
        if (state.stageFilter) {
          setOrderStageFilter(state.stageFilter);
        }
      }
    };

    window.addEventListener('popstate', handleAdminPopState);
    return () => window.removeEventListener('popstate', handleAdminPopState);
  }, [orders]);

  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Sync settingsForm when initialSettings loads
  React.useEffect(() => {
    if (initialSettings) {
      setSettingsForm((prev: any) => ({ ...prev, ...initialSettings }));
    }
  }, [initialSettings]);

  // Financial Profit & Loss Calculations
  const financesStats = useMemo(() => {
    const paidOrders = orders.filter(o => o.paymentStatus === 'SUCCESS' || (o.paymentMethod === 'COD' && o.orderStatus === 'DELIVERED'));
    const orderSales = paidOrders.reduce((s, o) => s + (o.grandTotal || 0), 0);
    const customSales = finances.filter(f => f.type === 'SALE').reduce((s, f) => s + (f.sellAmount || 0), 0);
    const totalRevenue = orderSales + customSales;
    const totalSpending = finances.reduce((s, f) => s + (f.costAmount || 0), 0);
    const netProfit = totalRevenue - totalSpending;
    const isProfit = netProfit >= 0;
    const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

    return {
      orderSales,
      customSales,
      totalRevenue,
      totalSpending,
      netProfit,
      isProfit,
      margin
    };
  }, [orders, finances]);

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

    const paidOrders = orders.filter(o => {
      const pStatus = (o.paymentStatus || '').toString().toUpperCase();
      const oStatus = (o.orderStatus || '').toString().toUpperCase();
      return pStatus === 'SUCCESS' || pStatus === 'PAID' || pStatus === 'APPROVED' || oStatus === 'DELIVERED' || oStatus === 'COMPLETED';
    });
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

    openAdminModal('whatsapp', {
      modal: {
        open: true,
        stage,
        order,
        message: msg,
        phone: cleanPhone
      }
    });
  };

  const handleCopyMessage = () => {
    if (whatsAppModal?.message) {
      navigator.clipboard.writeText(whatsAppModal.message);
      setCopiedToast(true);
      toast.success('WhatsApp message template copied!', 'Copied');
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
    const updated: Order = {
      ...selectedOrder,
      orderStatus: 'DISPATCHED' as const,
      courierName: dispatchForm.courierName,
      trackingNumber: dispatchForm.awbNumber,
      deliveryNotes: dispatchForm.trackingLink
    };
    setSelectedOrder(updated);
    navigateScreen('order_details', updated, true);
    handleOpenWhatsApp(updated, 'dispatched');

    onSaveTracking(selectedOrder.id, {
      courierName: dispatchForm.courierName,
      trackingNumber: dispatchForm.awbNumber,
      trackingLink: dispatchForm.trackingLink
    }).catch(() => {});
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
      const filterLower = productCategoryFilter.toLowerCase();
      list = list.filter(p => 
        (p.categoryId && p.categoryId.toLowerCase() === filterLower) ||
        (p.categoryName && p.categoryName.toLowerCase() === filterLower) ||
        (p.tags && Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase() === filterLower))
      );
    }
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.tamilName && p.tamilName.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q))
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
          onClick={() => navigateScreen('menu_drawer')}
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
                  navigateScreen('orders_list');
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
                  navigateScreen('orders_list');
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
                  navigateScreen('orders_list');
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
                  navigateScreen('orders_list');
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
                onClick={() => navigateScreen('products')}
                className="p-3 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 active:scale-95 transition-all shadow-xs cursor-pointer flex flex-col items-center gap-1"
              >
                <Package className="w-5 h-5 text-emerald-700" />
                <span>Plants ({products.length})</span>
              </button>

              <button
                onClick={() => navigateScreen('categories')}
                className="p-3 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 active:scale-95 transition-all shadow-xs cursor-pointer flex flex-col items-center gap-1"
              >
                <FolderTree className="w-5 h-5 text-emerald-700" />
                <span>Categories</span>
              </button>

              <button
                onClick={() => navigateScreen('reviews')}
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
                    navigateScreen('orders_list');
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
                        navigateScreen('order_details', order);
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

                      <div className="flex items-center justify-between pt-1 flex-wrap gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
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

                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            order.paymentStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-900' : order.paymentStatus === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {order.paymentStatus === 'SUCCESS' ? '✓ Paid' : order.paymentStatus === 'FAILED' ? '✗ Failed' : '⏳ Pending'}
                          </span>

                          {(order.paymentProofUrl || order.paymentMethod === 'QR_PAYMENT' || order.paymentMethod === 'UPI_DIRECT') && (
                            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-900 px-1.5 py-0.5 rounded border border-indigo-200">
                              📸 QR
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {order.paymentProofUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openAdminModal('proof', { order });
                              }}
                              className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer"
                            >
                              <Camera className="w-3 h-3" />
                              <span>Receipt</span>
                            </button>
                          )}
                          <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-0.5">
                            <span>Manage</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
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
                  onClick={() => handleGoBack('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Orders List</h2>
              </div>
              <button
                onClick={() => navigateScreen('menu_drawer')}
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
                      navigateScreen('order_details', order);
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

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 flex-wrap gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
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

                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          order.paymentStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-900' : order.paymentStatus === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {order.paymentStatus === 'SUCCESS' ? '✓ Paid' : order.paymentStatus === 'FAILED' ? '✗ Failed' : '⏳ Pending'}
                        </span>

                        {(order.paymentProofUrl || order.paymentMethod === 'QR_PAYMENT' || order.paymentMethod === 'UPI_DIRECT') && (
                          <span className="text-[9px] font-bold bg-indigo-50 text-indigo-900 px-1.5 py-0.5 rounded border border-indigo-200">
                            📸 QR
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {order.paymentProofUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAdminModal('proof', { order });
                            }}
                            className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        )}
                        <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-0.5">
                          <span>Manage Order</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
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
                  onClick={() => handleGoBack('orders_list')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Manage Order</h2>
              </div>
              <button
                onClick={() => navigateScreen('menu_drawer')}
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

            {/* Payment & QR Receipt Verification Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>Payment & Verification</span>
                </h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  selectedOrder.paymentStatus === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : selectedOrder.paymentStatus === 'FAILED'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {selectedOrder.paymentStatus === 'SUCCESS' ? '✅ VERIFIED & PAID' : selectedOrder.paymentStatus === 'FAILED' ? '❌ PAYMENT FAILED / REJECTED' : '⏳ PENDING MANUAL VERIFICATION'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-medium">Grand Total</span>
                  <p className="font-black text-sm text-slate-900">₹{selectedOrder.grandTotal}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-medium">Payment Mode</span>
                  <p className="font-bold text-xs text-slate-800 truncate">
                    {selectedOrder.paymentMethod === 'COD'
                      ? '💵 Cash on Delivery'
                      : (selectedOrder.paymentMethod === 'QR_PAYMENT' || selectedOrder.paymentMethod === 'UPI_DIRECT' || selectedOrder.paymentProofUrl)
                      ? '📸 Direct QR / UPI'
                      : selectedOrder.paymentMethod === 'RAZORPAY'
                      ? '🔵 Razorpay PG'
                      : '🟣 PhonePe PG'}
                  </p>
                </div>
              </div>

              {/* Payment Verification Card */}
              {selectedOrder.paymentMethod === 'PHONEPE' && (
                <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-purple-950 flex items-center gap-1.5 text-[11px]">
                      <CreditCard className="w-3.5 h-3.5 text-purple-700" />
                      <span>PhonePe PG Online Gateway</span>
                    </span>
                    <span className="text-[10px] bg-purple-200 text-purple-900 font-bold px-2 py-0.5 rounded-full">
                      Automated PG
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-purple-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-bold">Merchant Txn ID:</span>
                      <span className="font-mono font-bold text-xs text-purple-950">{selectedOrder.merchantTransactionId || selectedOrder.id}</span>
                    </div>
                    <p className="text-[10px] text-purple-800 leading-relaxed pt-1 border-t border-purple-100">
                      ℹ️ <strong>Why no screenshot?</strong> PhonePe is an online automated gateway. Customer is redirected directly to PhonePe and does not upload manual screenshots.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-bold text-purple-950">⚙️ Manual Payment Override & Verification:</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          await onUpdateOrderStatus(selectedOrder.id, selectedOrder.orderStatus === 'PENDING' ? 'CONFIRMED' : selectedOrder.orderStatus, 'SUCCESS');
                          setSelectedOrder({ ...selectedOrder, paymentStatus: 'SUCCESS' });
                        }}
                        className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          selectedOrder.paymentStatus === 'SUCCESS'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark Paid</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await onUpdateOrderStatus(selectedOrder.id, selectedOrder.orderStatus, 'PENDING');
                          setSelectedOrder({ ...selectedOrder, paymentStatus: 'PENDING' });
                        }}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          selectedOrder.paymentStatus === 'PENDING' || !selectedOrder.paymentStatus
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-50'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>Pending</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await onUpdateOrderStatus(selectedOrder.id, selectedOrder.orderStatus, 'FAILED');
                          setSelectedOrder({ ...selectedOrder, paymentStatus: 'FAILED' });
                        }}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          selectedOrder.paymentStatus === 'FAILED'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50'
                        }`}
                      >
                        <X className="w-3 h-3" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Receipt Photo & UTR Reference Box */}
              {(selectedOrder.paymentProofUrl || selectedOrder.paymentMethod === 'QR_PAYMENT' || selectedOrder.paymentMethod === 'UPI_DIRECT') && (
                <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-indigo-950 flex items-center gap-1 text-[11px]">
                      <Camera className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Customer Payment Screenshot</span>
                    </span>
                    {selectedOrder.paymentProofUploadedAt && (
                      <span className="text-[10px] text-indigo-700 font-mono">
                        {formatDateTime(selectedOrder.paymentProofUploadedAt)}
                      </span>
                    )}
                  </div>

                  {selectedOrder.paymentProofUrl ? (
                    <div
                      onClick={() => openAdminModal('proof', { order: selectedOrder })}
                      className="relative group cursor-pointer w-full h-36 rounded-xl overflow-hidden border-2 border-indigo-300 bg-slate-900 flex items-center justify-center shadow-xs"
                    >
                      <img
                        src={selectedOrder.paymentProofUrl}
                        alt="Customer Payment Receipt Proof"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/10 flex items-center justify-center transition-opacity">
                        <span className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Tap to Zoom Full Receipt</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-white rounded-xl border border-indigo-200 text-center text-[11px] text-indigo-900 font-medium">
                      ⚠️ No screenshot image uploaded by customer (paid directly via UPI app).
                    </div>
                  )}

                  {selectedOrder.transactionId && (
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-indigo-200">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">Customer UTR / Ref No:</span>
                        <span className="font-mono font-black text-xs text-indigo-950">{selectedOrder.transactionId}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedOrder.transactionId || '');
                          setCopiedUtrToast(true);
                          toast.success('UTR reference copied to clipboard!', 'Copied');
                          setTimeout(() => setCopiedUtrToast(false), 2000);
                        }}
                        className="p-1.5 text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer"
                        title="Copy UTR"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {copiedUtrToast && (
                    <p className="text-[10px] text-emerald-800 font-bold text-center">✓ UTR copied to clipboard!</p>
                  )}

                  {/* Payment Verification Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-bold text-indigo-950">⚙️ Verify Payment with Nursery UPI / Bank:</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          await onUpdateOrderStatus(selectedOrder.id, selectedOrder.orderStatus === 'PENDING' ? 'CONFIRMED' : selectedOrder.orderStatus, 'SUCCESS');
                          setSelectedOrder({ ...selectedOrder, paymentStatus: 'SUCCESS' });
                        }}
                        className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          selectedOrder.paymentStatus === 'SUCCESS'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark Paid</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await onUpdateOrderStatus(selectedOrder.id, selectedOrder.orderStatus, 'PENDING');
                          setSelectedOrder({ ...selectedOrder, paymentStatus: 'PENDING' });
                        }}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          selectedOrder.paymentStatus === 'PENDING' || !selectedOrder.paymentStatus
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-50'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>Pending</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await onUpdateOrderStatus(selectedOrder.id, selectedOrder.orderStatus, 'FAILED');
                          setSelectedOrder({ ...selectedOrder, paymentStatus: 'FAILED' });
                        }}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          selectedOrder.paymentStatus === 'FAILED'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50'
                        }`}
                      >
                        <X className="w-3 h-3" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Cash on Delivery (COD) Card */}
              {selectedOrder.paymentMethod === 'COD' && (
                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-950 flex items-center gap-1.5 text-[11px]">
                      <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                      <span>Cash on Delivery (COD)</span>
                    </span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      Doorstep Cash
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    Collect ₹{selectedOrder.grandTotal} in cash upon doorstep delivery by courier.
                  </p>
                </div>
              )}
            </div>

            {/* 4-Stage Action Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900">Update Order Stage</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const newStatus = 'CONFIRMED';
                    const newPayment = 'SUCCESS';
                    setSelectedOrder(prev => prev ? { ...prev, orderStatus: newStatus, paymentStatus: newPayment } : null);
                    onUpdateOrderStatus(selectedOrder.id, newStatus, newPayment).catch(() => {});
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    selectedOrder.orderStatus === 'CONFIRMED' || selectedOrder.orderStatus === 'PENDING' || !selectedOrder.orderStatus
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>1. Confirmed</span>
                </button>

                <button
                  onClick={() => {
                    const newStatus = 'PACKED';
                    setSelectedOrder(prev => prev ? { ...prev, orderStatus: newStatus } : null);
                    onUpdateOrderStatus(selectedOrder.id, newStatus).catch(() => {});
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    selectedOrder.orderStatus === 'PACKED' || selectedOrder.orderStatus === 'PROCESSING'
                      ? 'bg-amber-600 text-white shadow-xs'
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
                    navigateScreen('dispatch_order', selectedOrder);
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    selectedOrder.orderStatus === 'DISPATCHED' || selectedOrder.orderStatus === 'OUT_FOR_DELIVERY'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>3. Courier</span>
                </button>

                <button
                  onClick={() => {
                    const newStatus = 'DELIVERED';
                    setSelectedOrder(prev => prev ? { ...prev, orderStatus: newStatus } : null);
                    onUpdateOrderStatus(selectedOrder.id, newStatus).catch(() => {});
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    selectedOrder.orderStatus === 'DELIVERED'
                      ? 'bg-purple-700 text-white shadow-xs'
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
                    className="py-2.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Send className="w-3 h-3 text-emerald-700" />
                    <span>Confirmation</span>
                  </button>

                  <button
                    onClick={() => handleOpenWhatsApp(selectedOrder, 'packing')}
                    className="py-2.5 px-2.5 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Send className="w-3 h-3 text-amber-700" />
                    <span>Packing Update</span>
                  </button>

                  <button
                    onClick={() => handleOpenWhatsApp(selectedOrder, 'dispatched')}
                    className="py-2.5 px-2.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Send className="w-3 h-3 text-blue-700" />
                    <span>Tracking Link</span>
                  </button>

                  <button
                    onClick={() => handleOpenWhatsApp(selectedOrder, 'delivered')}
                    className="py-2.5 px-2.5 bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Send className="w-3 h-3 text-purple-700" />
                    <span>Delivered + Care</span>
                  </button>
                </div>
              </div>

              {/* View Timeline Button */}
              <button
                onClick={() => navigateScreen('order_timeline', selectedOrder)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
                  onClick={() => handleGoBack('order_details')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Courier Dispatch</h2>
              </div>
              <button
                onClick={() => navigateScreen('menu_drawer')}
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
                  onClick={() => handleGoBack('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Generate Labels</h2>
              </div>
              <button
                onClick={() => navigateScreen('menu_drawer')}
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
              onClick={() => openAdminModal('label_preview')}
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
                    onClick={() => handleGoBack('order_details')}
                    className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-base font-extrabold text-slate-900">Order Timeline</h2>
                </div>
                <button
                  onClick={() => navigateScreen('menu_drawer')}
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
                  onClick={() => handleGoBack('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Products Catalog</h2>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductModalError(null);
                  const activeCat = (productCategoryFilter !== 'ALL' ? categories.find(c => c.id === productCategoryFilter || c.name === productCategoryFilter) : null) || categories[0];
                  setProductForm({
                    name: '',
                    tamilName: '',
                    categoryId: activeCat?.id || 'cat-roses',
                    categoryName: activeCat?.name || 'Roses',
                    mrp: 299,
                    sellingPrice: 199,
                    stock: 25,
                    plantHeight: '1-2 Feet',
                    potSize: '8 Inch Bag',
                    sunlight: 'Full Sun',
                    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
                    description: ''
                  });
                  openAdminModal('product', { product: null });
                }}
                className="px-3 py-1.5 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Plant</span>
              </button>
            </div>

            {/* Success Toast */}
            {productSuccessToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{productSuccessToast}</span>
              </div>
            )}

            {/* Search & Quick Category Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search plants by name, Tamil name..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={e => setProductCategoryFilter(e.target.value)}
                  className="px-2.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs shrink-0 max-w-[130px] truncate cursor-pointer"
                  title="Select Plant Variety"
                >
                  <option value="ALL">All Varieties ({products.length})</option>
                  {categories.map(cat => {
                    const cnt = products.filter(p => p.categoryId === cat.id || p.categoryName?.toLowerCase() === cat.name.toLowerCase()).length;
                    return (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cnt})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Horizontal Scrollable Variety Selector Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none no-scrollbar">
                <button
                  type="button"
                  onClick={() => setProductCategoryFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 ${
                    productCategoryFilter === 'ALL'
                      ? 'bg-[#14532d] text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>🌿 All Plants</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    productCategoryFilter === 'ALL' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {products.length}
                  </span>
                </button>

                {categories.map(cat => {
                  const isSelected = productCategoryFilter === cat.id || productCategoryFilter === cat.name;
                  const count = products.filter(p => 
                    p.categoryId === cat.id || 
                    p.categoryName?.toLowerCase() === cat.name.toLowerCase()
                  ).length;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setProductCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 ${
                        isSelected
                          ? 'bg-[#14532d] text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {cat.tamilName && <span className="opacity-75 text-[10px]">({cat.tamilName})</span>}
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Variety Header & Count */}
              <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-600">
                <span>
                  Showing {filteredProducts.length} {productCategoryFilter !== 'ALL' ? `in "${categories.find(c => c.id === productCategoryFilter)?.name || productCategoryFilter}"` : 'plants'}
                </span>
                {(productCategoryFilter !== 'ALL' || productSearch) && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductCategoryFilter('ALL');
                      setProductSearch('');
                    }}
                    className="text-emerald-700 hover:underline font-bold"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
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
                        setProductModalError(null);
                        setProductForm({
                          name: p.name || '',
                          tamilName: p.tamilName || '',
                          categoryId: p.categoryId || categories[0]?.id || 'cat-roses',
                          categoryName: p.categoryName || categories.find(c => c.id === p.categoryId)?.name || 'Roses',
                          mrp: p.mrp || p.sellingPrice || 299,
                          sellingPrice: p.sellingPrice || 199,
                          stock: p.stock ?? 25,
                          plantHeight: p.plantHeight || '1-2 Feet',
                          potSize: p.potSize || '8 Inch Bag',
                          sunlight: p.sunlight || 'Full Sun',
                          imageUrl: p.images?.[0] || '',
                          description: p.description || ''
                        });
                        openAdminModal('product', { product: p });
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
                  onClick={() => handleGoBack('dashboard')}
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
                  openAdminModal('category', { category: null });
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
                          openAdminModal('category', { category: c });
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
                  onClick={() => handleGoBack('dashboard')}
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
                  openAdminModal('combo', { combo: null });
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
                            openAdminModal('combo', { combo });
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
                  onClick={() => handleGoBack('dashboard')}
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
                  onClick={() => handleGoBack('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Reviews ({reviews.length})</h2>
              </div>
              <button
                onClick={() => openAdminModal('review')}
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
        {/* DISCOUNT COUPONS SCREEN                                    */}
        {/* ========================================================= */}
        {currentScreen === 'coupons' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGoBack('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Discount Coupons ({coupons.length})</h2>
              </div>
              <button
                onClick={() => {
                  setCouponForm({
                    code: '',
                    discountType: 'PERCENTAGE',
                    discountValue: 10,
                    minOrderAmount: 0,
                    maxUsageCount: 100,
                    expiryDate: '',
                    isActive: true,
                    description: ''
                  });
                  openAdminModal('coupon');
                }}
                className="px-3 py-1.5 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Coupon</span>
              </button>
            </div>

            {copiedCouponId && (
              <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold text-center border border-emerald-300">
                ✓ Coupon code copied to clipboard!
              </div>
            )}

            <div className="space-y-3">
              {coupons.map((c) => {
                const isPercent = (c.type || (c as any).discountType) === 'PERCENT' || (c as any).discountType === 'PERCENTAGE';
                const discVal = c.value ?? (c as any).discountValue ?? 10;
                const minOrder = c.minOrder ?? (c as any).minOrderAmount ?? 0;
                const isActive = (c.active ?? (c as any).isActive) !== false;

                return (
                  <div key={c.id || c.code} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 uppercase tracking-wider">
                            {c.code}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(c.code);
                              setCopiedCouponId(c.code);
                              setTimeout(() => setCopiedCouponId(null), 2000);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                            title="Copy code"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="font-extrabold text-xs text-slate-800 mt-2">
                          {isPercent ? `${discVal}% OFF Entire Order` : `₹${discVal} FLAT Discount`}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {minOrder > 0 ? `Min. order ₹${minOrder}` : 'No minimum order required'}
                          {c.expiryDate ? ` • Expires ${formatDate(c.expiryDate)}` : ''}
                        </p>
                        {c.description && <p className="text-[10px] text-slate-400 italic mt-0.5">{c.description}</p>}
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isActive ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[10px] text-slate-400">
                        Usage: {(c as any).usageCount || 0} / {(c as any).maxUsageCount || 100}
                      </span>
                      {onDeleteCoupon && (
                        <button
                          onClick={() => onDeleteCoupon(c.id || c.code)}
                          className="px-2.5 py-1 text-rose-600 font-bold bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {coupons.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                  <Tag className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">No discount coupons found</p>
                  <p className="text-[11px] text-slate-400">Click "+ Add Coupon" to create promo codes for your nursery.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 11. FINANCES & PROFIT/LOSS SCREEN                          */}
        {/* ========================================================= */}
        {currentScreen === 'finances' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGoBack('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Expenses & Profit/Loss</h2>
              </div>
              <button
                onClick={() => {
                  setEditingFinance(null);
                  setFinanceForm({
                    type: 'EXPENSE',
                    title: '',
                    category: 'Fertilizer',
                    costAmount: 0,
                    sellAmount: 0,
                    quantity: 1,
                    notes: '',
                    date: new Date().toISOString().split('T')[0]
                  });
                  openAdminModal('finance', { finance: null });
                }}
                className="px-3 py-1.5 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Log / Expense</span>
              </button>
            </div>

            {/* 4 KPI Metric Cards (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">💰</span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Gross Revenue</span>
                </div>
                <p className="text-xl font-black text-emerald-800">₹{financesStats.totalRevenue.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-slate-400">₹{financesStats.orderSales} store + ₹{financesStats.customSales} custom</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">💸</span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Total Spending</span>
                </div>
                <p className="text-xl font-black text-rose-700">₹{financesStats.totalSpending.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-slate-400">Fertilizer, bags, soil, labor & freight</p>
              </div>

              <div className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
                financesStats.isProfit ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
              }`}>
                <div className="flex items-center gap-1.5">
                  {financesStats.isProfit ? <TrendingUp className="w-3.5 h-3.5 text-emerald-700" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-700" />}
                  <span className={`text-[11px] font-bold uppercase ${financesStats.isProfit ? 'text-emerald-900' : 'text-rose-900'}`}>
                    {financesStats.isProfit ? 'Net Profit' : 'Net Loss'}
                  </span>
                </div>
                <p className={`text-xl font-black ${financesStats.isProfit ? 'text-emerald-800' : 'text-rose-700'}`}>
                  {financesStats.isProfit ? `+₹${financesStats.netProfit}` : `-₹${Math.abs(financesStats.netProfit)}`}
                </p>
                <p className={`text-[10px] font-bold ${financesStats.isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {financesStats.isProfit ? '✅ Profitable Farm Operation' : '⚠️ Expenses Exceed Revenue'}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">📊</span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Profit Margin</span>
                </div>
                <p className={`text-xl font-black ${Number(financesStats.margin) >= 0 ? 'text-emerald-800' : 'text-rose-600'}`}>
                  {financesStats.margin}%
                </p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full ${Number(financesStats.margin) >= 0 ? 'bg-emerald-600' : 'bg-rose-600'}`}
                    style={{ width: `${Math.min(100, Math.max(0, Number(financesStats.margin)))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Payment Methods Gross Breakdown */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <h3 className="text-xs font-extrabold text-slate-900">Payment Breakdown</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">UPI / QR / Gateway Payments</span>
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

            {/* Financial History Ledger */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-extrabold text-slate-900">Farm Spending & Sale Logs ({finances.length})</h3>
                <span className="text-[10px] text-slate-400">Line-item calculations</span>
              </div>

              {finances.map((f) => {
                const itemCost = f.costAmount || 0;
                const itemSell = f.type === 'SALE' ? (f.sellAmount || 0) : 0;
                const itemDiff = f.type === 'SALE' ? (itemSell - itemCost) : -itemCost;
                const isItemProfit = itemDiff >= 0;

                return (
                  <div key={f.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                            f.type === 'SALE' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-rose-100 text-rose-900 border border-rose-200'
                          }`}>
                            {f.type === 'SALE' ? '🛍️ CUSTOM SALE' : '💸 SPENDING'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{f.date}</span>
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900 mt-1">{f.title}</h4>
                        <p className="text-[11px] text-slate-500">{f.category} {f.notes ? `• ${f.notes}` : ''}</p>
                      </div>

                      <span className={`text-xs font-black px-2 py-1 rounded-xl shrink-0 ${
                        f.type === 'SALE'
                          ? isItemProfit ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {f.type === 'SALE' ? (isItemProfit ? `+₹${itemDiff} Profit` : `-₹${Math.abs(itemDiff)} Loss`) : `-₹${itemCost} Expense`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">
                        Qty: <strong>{f.quantity}</strong> • Cost: <strong className="text-rose-700">₹{itemCost}</strong>
                        {f.type === 'SALE' && ` • Sell: ₹${itemSell}`}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingFinance(f);
                            setFinanceForm({
                              type: f.type,
                              title: f.title,
                              category: f.category,
                              costAmount: f.costAmount,
                              sellAmount: f.sellAmount || 0,
                              quantity: f.quantity || 1,
                              notes: f.notes || '',
                              date: f.date || new Date().toISOString().split('T')[0]
                            });
                            openAdminModal('finance', { finance: f });
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteFinance && (
                          <button
                            onClick={() => onDeleteFinance(f.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {finances.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                  <DollarSign className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">No spending logs recorded yet</p>
                  <p className="text-[11px] text-slate-400">Click "+ Add Expense / Sale" to record farm spending or custom nursery sales.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 12. STORE & PAYMENT SETTINGS SCREEN                        */}
        {/* ========================================================= */}
        {currentScreen === 'settings' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGoBack('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Store & Payment Settings</h2>
              </div>
            </div>

            {settingsSavedToast && (
              <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold text-center border border-emerald-300">
                ✓ Settings & Payment Methods saved successfully!
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (onSaveSettings) await onSaveSettings(settingsForm);
                setSettingsSavedToast(true);
                toast.success('Store & Payment Settings saved successfully!', 'Settings Saved');
                setTimeout(() => setSettingsSavedToast(false), 2500);
              }}
              className="space-y-4 text-xs"
            >
              {/* SECTION 1: INTERACTIVE PAYMENT METHOD SWITCHES */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span>Payment Methods Active on Store</span>
                  </h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                    Customer Options
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* PhonePe PG Toggle */}
                  <div
                    onClick={() => setSettingsForm({ ...settingsForm, enablePhonePe: !settingsForm.enablePhonePe })}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between ${
                      settingsForm.enablePhonePe
                        ? 'bg-purple-50/70 border-purple-500 text-purple-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">PhonePe PG</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        settingsForm.enablePhonePe ? 'bg-purple-600 text-white' : 'bg-slate-400 text-white'
                      }`}>
                        {settingsForm.enablePhonePe ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">UPI & Netbanking</span>
                  </div>

                  {/* Razorpay PG Toggle */}
                  <div
                    onClick={() => setSettingsForm({ ...settingsForm, enableRazorpay: !settingsForm.enableRazorpay })}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between ${
                      settingsForm.enableRazorpay
                        ? 'bg-blue-50/70 border-blue-500 text-blue-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Razorpay PG</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        settingsForm.enableRazorpay ? 'bg-blue-600 text-white' : 'bg-slate-400 text-white'
                      }`}>
                        {settingsForm.enableRazorpay ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">GPay, Paytm, Cards</span>
                  </div>

                  {/* Direct QR Toggle */}
                  <div
                    onClick={() => setSettingsForm({ ...settingsForm, enableQrPayment: !settingsForm.enableQrPayment })}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between ${
                      settingsForm.enableQrPayment
                        ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Manual QR / UPI</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        settingsForm.enableQrPayment ? 'bg-emerald-700 text-white' : 'bg-slate-400 text-white'
                      }`}>
                        {settingsForm.enableQrPayment ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">Direct Bank Transfer</span>
                  </div>

                  {/* Cash on Delivery (COD) Toggle */}
                  <div
                    onClick={() => setSettingsForm({ ...settingsForm, enableCod: !settingsForm.enableCod })}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between ${
                      settingsForm.enableCod
                        ? 'bg-amber-50/70 border-amber-500 text-amber-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Cash on Delivery</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        settingsForm.enableCod ? 'bg-amber-600 text-white' : 'bg-slate-400 text-white'
                      }`}>
                        {settingsForm.enableCod ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">Doorstep Cash Payment</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PHONEPE CREDENTIALS */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-2">
                  🟣 PhonePe Payment Gateway Credentials
                </h3>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Merchant ID</label>
                  <input
                    type="text"
                    value={settingsForm.phonepeMerchantId || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, phonepeMerchantId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Salt Key</label>
                  <input
                    type="password"
                    value={settingsForm.phonepeSaltKey || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, phonepeSaltKey: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Salt Index</label>
                    <input
                      type="text"
                      value={settingsForm.phonepeSaltIndex || '1'}
                      onChange={e => setSettingsForm({ ...settingsForm, phonepeSaltIndex: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Environment</label>
                    <select
                      value={settingsForm.phonepeEnv || 'SANDBOX'}
                      onChange={e => setSettingsForm({ ...settingsForm, phonepeEnv: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    >
                      <option value="SANDBOX">SANDBOX (Testing)</option>
                      <option value="PRODUCTION">PRODUCTION (Live PG)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: RAZORPAY CREDENTIALS */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-2">
                  🔵 Razorpay Gateway Credentials
                </h3>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Razorpay Key ID</label>
                  <input
                    type="text"
                    placeholder="rzp_live_... or rzp_test_..."
                    value={settingsForm.razorpayKeyId || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, razorpayKeyId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Razorpay Key Secret</label>
                  <input
                    type="password"
                    value={settingsForm.razorpayKeySecret || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, razorpayKeySecret: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              {/* SECTION 4: DIRECT QR / UPI DETAILS */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-2">
                  📱 Direct UPI & QR Code Transfer Details
                </h3>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">UPI ID for Direct Transfers</label>
                  <input
                    type="text"
                    value={settingsForm.upiId || '9842624508@okbizaxis'}
                    onChange={e => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-emerald-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Payee Business Name</label>
                  <input
                    type="text"
                    value={settingsForm.payeeName || 'Veerika Rose Garden'}
                    onChange={e => setSettingsForm({ ...settingsForm, payeeName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* SECTION 5: DELIVERY & NURSERY INFO */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-2">
                  🏡 Nursery Farm & Shipping Info
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Delivery Charge (₹)</label>
                    <input
                      type="number"
                      value={settingsForm.deliveryCharge || settingsForm.shippingFee || 60}
                      onChange={e => setSettingsForm({ ...settingsForm, deliveryCharge: Number(e.target.value), shippingFee: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Free Shipping Above (₹)</label>
                    <input
                      type="number"
                      value={settingsForm.freeDeliveryThreshold || settingsForm.freeShippingThreshold || 499}
                      onChange={e => setSettingsForm({ ...settingsForm, freeDeliveryThreshold: Number(e.target.value), freeShippingThreshold: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Nursery Support Phone</label>
                  <input
                    type="text"
                    value={settingsForm.phone || '9842624508'}
                    onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Nursery Support Email</label>
                  <input
                    type="email"
                    value={settingsForm.email || 'nv01110612@gmail.com'}
                    onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Farm Physical Address</label>
                  <textarea
                    rows={2}
                    value={settingsForm.address || 'Pennagaram Main Road, Dharmapuri, Tamil Nadu - 636810'}
                    onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save All Settings & Payment Methods</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* HOMEPAGE BANNERS SCREEN                                    */}
        {/* ========================================================= */}
        {currentScreen === 'banners' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGoBack('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Homepage Banners ({banners.length})</h2>
              </div>
              <button
                onClick={() => {
                  setEditingBanner(null);
                  setBannerForm({
                    title: '',
                    subtitle: '',
                    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
                    link: '',
                    ctaText: 'Shop Plants',
                    active: true,
                    order: banners.length + 1
                  });
                  openAdminModal('banner', { banner: null });
                }}
                className="px-3 py-1.5 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Banner</span>
              </button>
            </div>

            <div className="space-y-3">
              {banners.map((b) => (
                <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-100">
                    <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">{b.title}</h4>
                      {b.subtitle && <p className="text-[11px] text-slate-500">{b.subtitle}</p>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {b.active ? 'ACTIVE' : 'HIDDEN'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <span className="text-[10px] text-slate-400">Order: {b.order ?? 1}</span>
                    {onDeleteBanner && (
                      <button
                        onClick={() => onDeleteBanner(b.id)}
                        className="text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {banners.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">No promo banners configured</p>
                  <p className="text-[11px] text-slate-400">Click "+ Add Banner" to upload hero promotional carousels.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECURITY & AUDIT LOGS SCREEN                               */}
        {/* ========================================================= */}
        {currentScreen === 'audit' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGoBack('dashboard')}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-slate-900">Security & Audit Logs</h2>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-slate-800">Admin Session Protection</span>
              </div>
              <p className="text-slate-600">Authenticated Admin: <strong className="text-emerald-900">{adminUser?.email || 'nv01110612@gmail.com'}</strong></p>
              <p className="text-slate-500 text-[11px]">All administrative actions, order status changes, and database modifications are cryptographically logged with timestamps.</p>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* 13. SLIDE-OVER DRAWER MENU                                 */}
      {/* ========================================================= */}
      {currentScreen === 'menu_drawer' && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => handleGoBack('dashboard')}
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
                onClick={() => handleGoBack('dashboard')}
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
                  navigateScreen('orders_list');
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
                  navigateScreen('orders_list');
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
                  navigateScreen('orders_list');
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
                  navigateScreen('orders_list');
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
                { screen: 'inventory', label: `⚠️ Inventory & Stock (${stats.lowStockCount} Low)`, icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
                { screen: 'coupons', label: `🏷️ Discount Coupons (${coupons.length})`, icon: <Tag className="w-4 h-4 text-emerald-700" /> },
                { screen: 'banners', label: `🖼️ Homepage Banners (${banners.length})`, icon: <ImageIcon className="w-4 h-4 text-indigo-600" /> },
                { screen: 'reviews', label: `⭐ Customer Reviews (${reviews.length})`, icon: <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> },
                { screen: 'finances', label: '💰 Finances & Profit/Loss', icon: <DollarSign className="w-4 h-4 text-emerald-600" /> },
                { screen: 'settings', label: '⚙️ Store & Payment Settings', icon: <SettingsIcon className="w-4 h-4 text-slate-600" /> },
                { screen: 'audit', label: '🛡️ Security & Audit Logs', icon: <ShieldCheck className="w-4 h-4 text-teal-600" /> },
              ].map(item => (
                <button
                  key={item.screen}
                  onClick={() => {
                    navigateScreen(item.screen as any);
                  }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-700" />
                <span>{editingProduct ? 'Edit Plant' : 'Add New Plant'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  handleCloseModal(() => setShowProductModal(false));
                  setProductModalError(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setProductModalError(null);

                const trimmedName = productForm.name.trim();
                if (!trimmedName) {
                  setProductModalError('Please enter a plant name.');
                  return;
                }

                const sellingPrice = Number(productForm.sellingPrice);
                if (isNaN(sellingPrice) || sellingPrice <= 0) {
                  setProductModalError('Please enter a valid selling price (> 0).');
                  return;
                }

                const mrp = Number(productForm.mrp) > 0 ? Number(productForm.mrp) : sellingPrice;
                const stock = Number(productForm.stock) >= 0 ? Number(productForm.stock) : 0;
                const catObj = categories.find(c => c.id === productForm.categoryId);

                // Instantly dismiss modal and show success feedback (0ms)
                handleCloseModal(() => setShowProductModal(false));
                const toastMsg = editingProduct ? `Plant "${trimmedName}" updated successfully!` : `Plant "${trimmedName}" added!`;
                setProductSuccessToast(toastMsg);
                toast.success(toastMsg, 'Product Saved');
                setTimeout(() => setProductSuccessToast(null), 3000);

                if (onSaveProduct) {
                  onSaveProduct({
                    id: editingProduct?.id,
                    name: trimmedName,
                    tamilName: productForm.tamilName.trim() || trimmedName,
                    categoryId: productForm.categoryId || categories[0]?.id || 'cat-roses',
                    categoryName: productForm.categoryName || catObj?.name || 'Roses',
                    mrp,
                    sellingPrice,
                    stock,
                    plantHeight: productForm.plantHeight || '1-2 Feet',
                    potSize: productForm.potSize || '8 Inch Bag',
                    sunlight: productForm.sunlight || 'Full Sun',
                    images: productForm.imageUrl ? [productForm.imageUrl] : [],
                    imageUrl: productForm.imageUrl,
                    description: productForm.description.trim() || trimmedName
                  }).catch(err => {
                    console.error('Background error saving plant:', err);
                  });
                }
              }}
              className="p-4 overflow-y-auto space-y-3 text-xs"
            >
              {productModalError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-semibold text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="flex-1">{productModalError}</span>
                </div>
              )}

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
                <label className="font-bold text-slate-700 block">Tamil Name (தமிழ்)</label>
                <input
                  type="text"
                  placeholder="e.g. சிவப்பு ரோஜா"
                  value={productForm.tamilName}
                  onChange={e => setProductForm({ ...productForm, tamilName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-800"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block">Category / Variety *</label>
                  <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 truncate max-w-[170px]">
                    {productForm.categoryName || 'Roses'}
                  </span>
                </div>

                {/* Touch-Friendly Category Selection Pills */}
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {categories.map(c => {
                    const isSelected = productForm.categoryId === c.id || productForm.categoryName === c.name;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setProductForm({
                            ...productForm,
                            categoryId: c.id,
                            categoryName: c.name
                          });
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 text-left shrink-0 ${
                          isSelected
                            ? 'bg-[#14532d] text-white shadow-xs ring-2 ring-emerald-600'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{isSelected ? '✓ ' : ''}{c.name}</span>
                        {c.tamilName && <span className="text-[9px] opacity-75 truncate max-w-[100px]">({c.tamilName})</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Dropdown Alternative */}
                <select
                  value={productForm.categoryId}
                  onChange={e => {
                    const selCat = categories.find(c => c.id === e.target.value);
                    setProductForm({
                      ...productForm,
                      categoryId: e.target.value,
                      categoryName: selCat?.name || productForm.categoryName
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.tamilName ? `(${c.tamilName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={productForm.sellingPrice}
                    onChange={e => setProductForm({ ...productForm, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">MRP (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={productForm.mrp}
                    onChange={e => setProductForm({ ...productForm, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Plant Height</label>
                  <input
                    type="text"
                    placeholder="e.g. 1-2 Feet"
                    value={productForm.plantHeight}
                    onChange={e => setProductForm({ ...productForm, plantHeight: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Plant Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the plant variety, blooming habits..."
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 text-xs flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Plant Image *</span>
                  </label>
                  <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setMobileProdImgTab('upload')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${mobileProdImgTab === 'upload' ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600'}`}
                    >
                      📁 Local Storage
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileProdImgTab('url')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${mobileProdImgTab === 'url' ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600'}`}
                    >
                      🔗 Web URL
                    </button>
                  </div>
                </div>

                {mobileProdImgTab === 'upload' ? (
                  <label className="cursor-pointer border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all group">
                    <Upload className="w-5 h-5 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-slate-800 text-[11px]">
                      {isUploadingMobileImage ? 'Uploading & compressing image...' : 'Click to Upload from Local Storage / Camera'}
                    </span>
                    <span className="text-[9.5px] text-slate-500 mt-0.5">Select photo file from your device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMobileProductLocalFileUpload}
                      disabled={isUploadingMobileImage}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <input
                    type="text"
                    placeholder="Paste Image URL (https://... or /products/rose.jpg)"
                    value={productForm.imageUrl}
                    onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-[11px]"
                  />
                )}

                {productForm.imageUrl && (
                  <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 bg-white p-1.5 flex items-center gap-3">
                    <img src={productForm.imageUrl} alt="Plant preview" className="w-14 h-14 object-cover rounded-lg shrink-0 border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-emerald-800 truncate">
                        {productForm.imageUrl.startsWith('data:') ? '📁 Uploaded from Local Storage' : '🔗 Web Image URL'}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate">{productForm.imageUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, imageUrl: '' })}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0 cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSavingProduct}
                className="w-full py-3 bg-[#14532d] hover:bg-[#0f3d21] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSavingProduct ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{editingProduct ? 'Saving Plant Changes...' : 'Adding Plant to Store...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{editingProduct ? 'Save Plant Changes' : 'Add Plant to Store'}</span>
                  </>
                )}
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
              <button onClick={() => handleCloseModal(() => setShowCategoryModal(false))} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  if (onSaveCategory) {
                    await onSaveCategory({
                      id: editingCategory?.id,
                      name: categoryForm.name.trim(),
                      tamilName: categoryForm.tamilName.trim() || categoryForm.name.trim(),
                      slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
                      image: categoryForm.image,
                      description: categoryForm.description
                    });
                  }
                  handleCloseModal(() => setShowCategoryModal(false));
                } catch (err: any) {
                  alert(err?.message || 'Failed to save category');
                }
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
              <button onClick={() => handleCloseModal(() => setShowComboModal(false))} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  if (onSaveCombo) {
                    await onSaveCombo({
                      id: editingCombo?.id,
                      title: comboForm.title.trim(),
                      subtitle: comboForm.subtitle.trim(),
                      badge: comboForm.badge.trim(),
                      productIds: comboForm.productIds,
                      originalPrice: Number(comboForm.originalPrice),
                      comboPrice: Number(comboForm.comboPrice),
                      imageUrl: comboForm.imageUrl,
                      active: comboForm.active,
                      freeDelivery: comboForm.freeDelivery
                    });
                  }
                  handleCloseModal(() => setShowComboModal(false));
                } catch (err: any) {
                  alert(err?.message || 'Failed to save combo offer');
                }
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
              <button onClick={() => handleCloseModal(() => setShowReviewModal(false))} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
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
                onClick={() => handleCloseModal(() => setWhatsAppModal(null))}
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
      {/* ADD/EDIT COUPON MODAL                                      */}
      {/* ========================================================= */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">
                Create Discount Coupon
              </h3>
              <button onClick={() => handleCloseModal(() => setShowCouponModal(false))} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (onSaveCoupon) {
                  await onSaveCoupon({
                    code: couponForm.code.toUpperCase().trim(),
                    type: couponForm.discountType === 'PERCENTAGE' ? 'PERCENT' : 'FIXED',
                    value: Number(couponForm.discountValue),
                    minOrder: Number(couponForm.minOrderAmount),
                    maxUsageCount: Number(couponForm.maxUsageCount),
                    expiryDate: couponForm.expiryDate || undefined,
                    active: couponForm.isActive,
                    description: couponForm.description
                  });
                }
                setShowCouponModal(false);
              }}
              className="p-4 overflow-y-auto space-y-3 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Coupon Promo Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ROSE20, FREEDEL"
                  value={couponForm.code}
                  onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black uppercase text-emerald-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Discount Type</label>
                  <select
                    value={couponForm.discountType}
                    onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="PERCENTAGE">Percentage (% Off)</option>
                    <option value="FLAT">Flat Amount (₹ Off)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Discount Value *</label>
                  <input
                    type="number"
                    required
                    value={couponForm.discountValue}
                    onChange={e => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Min. Order (₹)</label>
                  <input
                    type="number"
                    value={couponForm.minOrderAmount}
                    onChange={e => setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Max Uses</label>
                  <input
                    type="number"
                    value={couponForm.maxUsageCount}
                    onChange={e => setCouponForm({ ...couponForm, maxUsageCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Expiry Date</label>
                <input
                  type="date"
                  value={couponForm.expiryDate}
                  onChange={e => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Description / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Special festive discount"
                  value={couponForm.description}
                  onChange={e => setCouponForm({ ...couponForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer select-none font-bold text-xs">
                <input
                  type="checkbox"
                  checked={couponForm.isActive}
                  onChange={e => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-700 rounded"
                />
                <span>Active and Redeemable by Customers</span>
              </label>

              <button
                type="submit"
                className="w-full py-3 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Save Coupon
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD/EDIT FINANCE LOG MODAL                                */}
      {/* ========================================================= */}
      {showFinanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingFinance ? 'Edit Farm Financial Log' : 'Record Farm Spending / Sale'}
              </h3>
              <button onClick={() => handleCloseModal(() => setShowFinanceModal(false))} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (onSaveFinance) {
                  await onSaveFinance({
                    id: editingFinance?.id,
                    type: financeForm.type,
                    title: financeForm.title,
                    category: financeForm.category,
                    costAmount: Number(financeForm.costAmount),
                    sellAmount: Number(financeForm.sellAmount || 0),
                    quantity: Number(financeForm.quantity || 1),
                    notes: financeForm.notes,
                    date: financeForm.date
                  });
                }
                setShowFinanceModal(false);
              }}
              className="p-4 overflow-y-auto space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFinanceForm({ ...financeForm, type: 'EXPENSE' })}
                  className={`py-2 rounded-xl font-bold border transition-all text-xs cursor-pointer ${
                    financeForm.type === 'EXPENSE'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  💸 Farm Spending
                </button>
                <button
                  type="button"
                  onClick={() => setFinanceForm({ ...financeForm, type: 'SALE' })}
                  className={`py-2 rounded-xl font-bold border transition-all text-xs cursor-pointer ${
                    financeForm.type === 'SALE'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  🛍️ Custom Sale
                </button>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Item / Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vermicompost 50kg Bags, Worker wages"
                  value={financeForm.title}
                  onChange={e => setFinanceForm({ ...financeForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Category</label>
                  <select
                    value={financeForm.category}
                    onChange={e => setFinanceForm({ ...financeForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Fertilizer">Fertilizer</option>
                    <option value="Pots & Bags">Pots & Bags</option>
                    <option value="Soil & Manure">Soil & Manure</option>
                    <option value="Labor & Workers">Labor & Workers</option>
                    <option value="Transport & Freight">Transport & Freight</option>
                    <option value="Plant Wholesale">Plant Wholesale</option>
                    <option value="Direct Nursery Sale">Direct Nursery Sale</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Quantity</label>
                  <input
                    type="number"
                    value={financeForm.quantity}
                    onChange={e => setFinanceForm({ ...financeForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Total Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    value={financeForm.costAmount}
                    onChange={e => setFinanceForm({ ...financeForm, costAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-rose-700"
                  />
                </div>

                {financeForm.type === 'SALE' && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Selling Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      value={financeForm.sellAmount}
                      onChange={e => setFinanceForm({ ...financeForm, sellAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-700"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Date *</label>
                <input
                  type="date"
                  required
                  value={financeForm.date}
                  onChange={e => setFinanceForm({ ...financeForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Notes / Vendor Details</label>
                <input
                  type="text"
                  placeholder="e.g. Bought from Dharmapuri Agro Supplies"
                  value={financeForm.notes}
                  onChange={e => setFinanceForm({ ...financeForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {editingFinance ? 'Save Changes' : 'Log Entry'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD/EDIT BANNER MODAL                                     */}
      {/* ========================================================= */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingBanner ? 'Edit Banner' : 'Add Homepage Hero Banner'}
              </h3>
              <button onClick={() => handleCloseModal(() => setShowBannerModal(false))} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (onSaveBanner) {
                  await onSaveBanner({
                    id: editingBanner?.id,
                    title: bannerForm.title,
                    subtitle: bannerForm.subtitle,
                    imageUrl: bannerForm.imageUrl,
                    link: bannerForm.link,
                    ctaText: bannerForm.ctaText,
                    active: bannerForm.active,
                    order: Number(bannerForm.order || 1)
                  });
                }
                handleCloseModal(() => setShowBannerModal(false));
              }}
              className="p-4 overflow-y-auto space-y-3 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Banner Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Festive Season Rose Sale"
                  value={bannerForm.title}
                  onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. 50+ Hybrid Varieties • Direct Nursery Price"
                  value={bannerForm.subtitle}
                  onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Banner Image URL *</label>
                <input
                  type="text"
                  required
                  value={bannerForm.imageUrl}
                  onChange={e => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px]"
                />
                {bannerForm.imageUrl && (
                  <img src={bannerForm.imageUrl} alt="Preview" className="w-full h-24 object-cover rounded-xl mt-1 border" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Button CTA Text</label>
                  <input
                    type="text"
                    value={bannerForm.ctaText}
                    onChange={e => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Display Order</label>
                  <input
                    type="number"
                    value={bannerForm.order}
                    onChange={e => setBannerForm({ ...bannerForm, order: Number(bannerForm.order) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer select-none font-bold text-xs">
                <input
                  type="checkbox"
                  checked={bannerForm.active}
                  onChange={e => setBannerForm({ ...bannerForm, active: e.target.checked })}
                  className="w-4 h-4 text-emerald-700 rounded"
                />
                <span>Show on Homepage Carousel</span>
              </label>

              <button
                type="submit"
                className="w-full py-3 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {editingBanner ? 'Save Banner Changes' : 'Publish Banner'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* QR PAYMENT RECEIPT FULLSCREEN ZOOM MODAL                  */}
      {/* ========================================================= */}
      {selectedProofOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-700 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs">Payment Receipt Screenshot</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Order #{selectedProofOrder.id}</p>
                </div>
              </div>
              <button
                onClick={() => handleCloseModal(() => setSelectedProofOrder(null))}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Image Area */}
            <div className="flex-1 bg-slate-950 p-2 flex items-center justify-center overflow-hidden min-h-[260px] max-h-[50vh]">
              {selectedProofOrder.paymentProofUrl ? (
                <img
                  src={selectedProofOrder.paymentProofUrl}
                  alt="Customer Payment Receipt Proof"
                  className="max-w-full max-h-[48vh] object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="p-6 text-center text-slate-400 space-y-1">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-300">No screenshot image attached</p>
                  <p className="text-[10px] text-slate-500">Customer entered UTR or direct UPI transfer without uploading photo</p>
                </div>
              )}
            </div>

            {/* Details Strip */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Order Amount:</span>
                <span className="font-black text-sm text-emerald-800">₹{selectedProofOrder.grandTotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Customer:</span>
                <span className="font-bold text-slate-800">{selectedProofOrder.customerName || selectedProofOrder.shippingAddress?.fullName}</span>
              </div>
              {selectedProofOrder.transactionId && (
                <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-bold">UTR / Ref:</span>
                  <span className="font-mono font-black text-xs text-indigo-900">{selectedProofOrder.transactionId}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    await onUpdateOrderStatus(selectedProofOrder.id, selectedProofOrder.orderStatus === 'PENDING' ? 'CONFIRMED' : selectedProofOrder.orderStatus, 'SUCCESS');
                    if (selectedOrder && selectedOrder.id === selectedProofOrder.id) {
                      setSelectedOrder({ ...selectedOrder, paymentStatus: 'SUCCESS' });
                    }
                    handleCloseModal(() => setSelectedProofOrder(null));
                  }}
                  className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve (Paid)</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await onUpdateOrderStatus(selectedProofOrder.id, selectedProofOrder.orderStatus, 'FAILED');
                    if (selectedOrder && selectedOrder.id === selectedProofOrder.id) {
                      setSelectedOrder({ ...selectedOrder, paymentStatus: 'FAILED' });
                    }
                    handleCloseModal(() => setSelectedProofOrder(null));
                  }}
                  className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject Payment</span>
                </button>
              </div>
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
          onClose={() => handleCloseModal(() => setShowLabelPrintPreview(false))}
        />
      )}

      {/* ========================================================= */}
      {/* 19. BOTTOM NAVIGATION BAR                                  */}
      {/* ========================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-6 py-2 flex items-center justify-between shadow-lg max-w-lg mx-auto">
        <button
          onClick={() => {
            navigateScreen('dashboard');
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
            setOrderStageFilter('confirmed');
            navigateScreen('orders_list');
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
            navigateScreen('generate_labels');
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
            navigateScreen('menu_drawer');
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
