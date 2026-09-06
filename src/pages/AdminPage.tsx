import React, { useState, useEffect } from 'react';
import { Product, Category, Order, Coupon, Banner, Review, SiteSettings, PaymentLog, FinancialEntry, Combo, PaymentStatus, OrderStatus } from '../types';
import { LayoutDashboard, Package, ShoppingBag, FolderTree, Tag, Image, Star, Settings as SettingsIcon, ShieldCheck, Plus, Edit, Trash2, Check, X, RefreshCw, Printer, AlertTriangle, Search, Lock, ExternalLink, DollarSign, TrendingUp, TrendingDown, Camera, CreditCard, ChevronDown, User, Phone, MapPin, Upload, MessageSquare, ThumbsUp, Eye, EyeOff, Sparkles, Monitor, Sprout, Menu, LogOut, Truck, Globe, ZoomIn } from 'lucide-react';

import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/catalogData';
import { INITIAL_REVIEWS } from '../data/reviewsData';
import { MobileAdminWorkflow } from '../components/MobileAdminWorkflow';
import { A4LabelSheetPrint } from '../components/A4LabelSheetPrint';
import { processLocalImageFile, processMultipleImageFiles } from '../utils/imageUpload';
import { toast } from '../utils/toast';
import { getOrderStage, STAGE_CONFIG, generateOrderWhatsAppMessage, isWhatsAppOrder, isUploadedByImage, isValidAdminOrder } from '../utils/orderStages';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { AIOrderImageUpload } from '../components/AIOrderImageUpload';
import { ExtractedOrderData } from '../utils/geminiOrderExtractor';


// ── Inline Coupon Creation Form ──────────────────────────────────────────────
const CouponForm: React.FC<{ categories: Category[]; onSave: (data: any) => Promise<void> }> = ({ onSave }) => {
  const [form, setForm] = useState({
    code: '', discountType: 'PERCENTAGE', discountValue: 10,
    minOrderAmount: 0, maxUsageCount: 100,
    expiryDate: '', isActive: true, description: ''
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) { setMsg('Coupon code is required'); return; }
    setSaving(true);
    setMsg('');
    try {
      await onSave({ ...form, code: form.code.toUpperCase().trim() });
      toast.success(`Coupon ${form.code.toUpperCase().trim()} created successfully!`, 'Coupon Created');
      setMsg('✅ Coupon created!');
      setForm({ code: '', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 0, maxUsageCount: 100, expiryDate: '', isActive: true, description: '' });
    } catch {
      toast.error('Failed to create coupon', 'Coupon Error');
      setMsg('❌ Failed to create coupon');
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Coupon Code *</label>
          <input type="text" required placeholder="e.g. ROSE20" value={form.code}
            onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black tracking-widest text-emerald-800 uppercase" />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Description</label>
          <input type="text" placeholder="e.g. 20% off roses" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Discount Type</label>
          <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold">
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FLAT">Flat Amount (₹)</option>
          </select>
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Discount Value *</label>
          <input type="number" required min={1} value={form.discountValue}
            onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold" />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Min Order Amount (₹)</label>
          <input type="number" min={0} value={form.minOrderAmount}
            onChange={e => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Max Usage Count</label>
          <input type="number" min={1} value={form.maxUsageCount}
            onChange={e => setForm({ ...form, maxUsageCount: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold" />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Expiry Date</label>
          <input type="date" value={form.expiryDate}
            onChange={e => setForm({ ...form, expiryDate: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold" />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Status</label>
          <select value={form.isActive ? 'true' : 'false'} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold">
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>
      {msg && <p className={`text-xs font-bold ${msg.startsWith('✅') ? 'text-emerald-700' : 'text-rose-600'}`}>{msg}</p>}
      <button type="submit" disabled={saving}
        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black text-xs rounded-xl flex items-center gap-2">
        <Plus className="w-4 h-4" /> {saving ? 'Creating...' : 'Create Coupon'}
      </button>
    </form>
  );
};

interface AdminPageProps {
  onBackToStore: () => void;
  adminUser?: { id: string; name: string; email: string; role: string } | null;
  reviews?: Review[];
  onUpdateReviews?: (updated: Review[]) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBackToStore, adminUser, reviews: propsReviews, onUpdateReviews }) => {
  const [adminLayoutMode, setAdminLayoutMode] = useState<'mobile_workflow' | 'desktop_full'>(() => {
    return 'mobile_workflow';
  });
  const [desktopLabelOrders, setDesktopLabelOrders] = useState<Order[] | null>(null);
  const [showAdminMenuDrawer, setShowAdminMenuDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'orders' | 'inventory' | 'coupons' | 'banners' | 'reviews' | 'settings' | 'audit' | 'finances' | 'payment_logs'>('dashboard');
  const [orderFilterStage, setOrderFilterStageState] = useState<'all' | 'week_based' | 'confirmed' | 'packing' | 'dispatched' | 'delivered' | 'holding'>(() => {
    try {
      const saved = sessionStorage.getItem('vrg_admin_stage_filter');
      if (saved && ['all', 'week_based', 'pending', 'confirmed', 'packing', 'dispatched', 'delivered', 'holding'].includes(saved)) {
        return (saved === 'pending' ? 'confirmed' : saved) as any;
      }
    } catch {}
    return 'all';
  });

  const setOrderFilterStage = (stage: 'all' | 'week_based' | 'confirmed' | 'packing' | 'dispatched' | 'delivered' | 'holding') => {
    setOrderFilterStageState(stage);
    try {
      sessionStorage.setItem('vrg_admin_stage_filter', stage);
    } catch {}
  };

  // Version-controlled persistent cache keys to purge stale order snapshots
  const ADMIN_CACHE_KEY_SESSION = 'vrg_admin_session_cache_v5';
  const ADMIN_CACHE_KEY_LOCAL = 'vrg_admin_persisted_cache_v5';

  // Multi-tiered persistent cache for instant (0ms) Stale-While-Revalidate UI hydration
  const getAdminSessionCache = (): any => {
    try {
      const sessionSaved = sessionStorage.getItem(ADMIN_CACHE_KEY_SESSION);
      if (sessionSaved) {
        const parsed = JSON.parse(sessionSaved);
        if (parsed && typeof parsed === 'object' && parsed.success) return parsed;
      }
      const localSaved = localStorage.getItem(ADMIN_CACHE_KEY_LOCAL);
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        if (parsed && typeof parsed === 'object' && parsed.success) return parsed;
      }
    } catch {}
    return null;
  };

  const getPendingSavedProducts = (): Map<string, { product: Product; savedAt: number }> => {
    const map = new Map<string, { product: Product; savedAt: number }>();
    try {
      const raw = sessionStorage.getItem('vrg_pending_saved_products');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const now = Date.now();
          arr.forEach((item: any) => {
            if (item && item.product && item.savedAt && (now - item.savedAt < 90000)) {
              map.set(item.product.id, item);
            }
          });
        }
      }
    } catch {}
    return map;
  };

  const savePendingProductToSession = (product: Product) => {
    try {
      const map = getPendingSavedProducts();
      map.set(product.id, { product, savedAt: Date.now() });
      const arr = Array.from(map.values());
      sessionStorage.setItem('vrg_pending_saved_products', JSON.stringify(arr));
    } catch {}
  };

  const clearPendingProductFromSession = (productId: string) => {
    try {
      const map = getPendingSavedProducts();
      map.delete(productId);
      const arr = Array.from(map.values());
      sessionStorage.setItem('vrg_pending_saved_products', JSON.stringify(arr));
    } catch {}
  };

  const persistAdminCache = (updater: (prev: any) => any) => {
    try {
      const raw = sessionStorage.getItem(ADMIN_CACHE_KEY_SESSION) || localStorage.getItem(ADMIN_CACHE_KEY_LOCAL);
      const cached = raw ? JSON.parse(raw) : { success: true };
      const next = updater(cached);
      const str = JSON.stringify({ success: true, ...next });
      sessionStorage.setItem(ADMIN_CACHE_KEY_SESSION, str);
      localStorage.setItem(ADMIN_CACHE_KEY_LOCAL, str);
    } catch {}
  };

  const initialCache = React.useMemo(() => getAdminSessionCache(), []);

  const [stats, setStats] = useState<any>(() => initialCache?.stats || null);
  const [products, setProducts] = useState<Product[]>(() => {
    const deletedProdSet = new Set(JSON.parse(localStorage.getItem('vrg_deleted_products') || '[]'));
    const pending = Array.from(getPendingSavedProducts().values()).map(x => x.product).filter(p => !deletedProdSet.has(p.id) && (!p.sku || !deletedProdSet.has(p.sku)));
    let baseList: Product[] = INITIAL_PRODUCTS;
    if (Array.isArray(initialCache?.products) && initialCache.products.length > 0) {
      baseList = initialCache.products;
    } else {
      try {
        const saved = localStorage.getItem('vrg_products');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) baseList = parsed;
        }
      } catch {}
    }
    baseList = baseList.filter(p => p && !deletedProdSet.has(p.id) && (!p.sku || !deletedProdSet.has(p.sku)));
    const baseIds = new Set(baseList.map(p => p.id));
    const toPrepend = pending.filter(p => !baseIds.has(p.id));
    return [...toPrepend, ...baseList];
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    if (Array.isArray(initialCache?.categories) && initialCache.categories.length > 0) return initialCache.categories;
    try {
      const saved = localStorage.getItem('vrg_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CATEGORIES;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    let deletedOrderSet = new Set<string>();
    try {
      const d = localStorage.getItem('vrg_deleted_orders');
      if (d) deletedOrderSet = new Set(JSON.parse(d));
    } catch {}
    const list = Array.isArray(initialCache?.orders) ? initialCache.orders : [];
    return list
      .filter((o: Order) => {
        if (!o || !o.id) return false;
        if (deletedOrderSet.has(o.id) || deletedOrderSet.has(o.merchantTransactionId || '') || deletedOrderSet.has(o.orderNumber || '')) return false;
        return isValidAdminOrder(o);
      })
      .sort((a: Order, b: Order) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return (b.id || '').localeCompare(a.id || '');
      });
  });
  const [orderSortBy, setOrderSortBy] = useState<'date_desc' | 'date_asc' | 'price_desc' | 'price_asc'>('date_desc');
  const [orderSourceFilter, setOrderSourceFilter] = useState<'all' | 'whatsapp' | 'website' | 'image'>('all');
  const [holdingOrderIds, setHoldingOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vrg_holding_order_ids');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  const [coupons, setCoupons] = useState<Coupon[]>(() => Array.isArray(initialCache?.coupons) ? initialCache.coupons : []);
  const [combos, setCombos] = useState<Combo[]>(() => Array.isArray(initialCache?.combos) ? initialCache.combos : []);
  const [showComboModal, setShowComboModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [comboSearchQuery, setComboSearchQuery] = useState('');
  const [comboForm, setComboForm] = useState({
    title: '',
    subtitle: '',
    badge: '3-IN-1 COMBO',
    productIds: [] as string[],
    originalPrice: 0,
    comboPrice: 0,
    imageUrl: '',
    active: true,
    freeDelivery: false
  });
  const getInitialAdminReviews = (): Review[] => {
    try {
      const saved = localStorage.getItem('vrg_reviews');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_REVIEWS;
  };

  const [banners, setBanners] = useState<Banner[]>(() => Array.isArray(initialCache?.banners) ? initialCache.banners : []);
  const [reviews, setReviews] = useState<Review[]>(propsReviews || getInitialAdminReviews());

  useEffect(() => {
    if (propsReviews && Array.isArray(propsReviews)) {
      setReviews(propsReviews);
    }
  }, [propsReviews]);

  const saveReviewsState = (updated: Review[]) => {
    setReviews(updated);
    if (onUpdateReviews) {
      onUpdateReviews(updated);
    }
    try {
      localStorage.setItem('vrg_reviews', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('vrg_reviews_updated', { detail: updated }));
    } catch {}
  };

  // Review Section Form & Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'approved' | 'pending' | 'photos'>('all');
  const [reviewSearch, setReviewSearch] = useState('');
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const [reviewForm, setReviewForm] = useState({
    userName: '',
    location: 'Pennagaram, TN',
    rating: 5,
    title: '',
    comment: '',
    productId: '',
    productName: 'Dutch Hybrid Red Rose',
    imageUrl: '',
    status: 'APPROVED' as 'APPROVED' | 'PENDING' | 'REJECTED',
    featured: true
  });

  const handleReviewPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setReviewForm(prev => ({ ...prev, imageUrl: compressedBase64 }));
        } else {
          setReviewForm(prev => ({ ...prev, imageUrl: event.target?.result as string }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.userName.trim() || !reviewForm.comment.trim()) {
      alert('Please fill customer name and review comment');
      return;
    }

    if (editingReview) {
      const payload = {
        userName: reviewForm.userName,
        location: reviewForm.location,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
        productId: reviewForm.productId,
        productName: reviewForm.productName,
        imageUrl: reviewForm.imageUrl,
        status: reviewForm.status,
        featured: reviewForm.featured,
      };

      const updated = reviews.map(r => r.id === editingReview.id ? { ...r, ...payload } : r);
      saveReviewsState(updated);
      toast.success('Customer review updated successfully!', 'Review Saved');

      try {
        await authFetch(`/api/admin/reviews/${editingReview.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error('API update review error:', err);
      }
    } else {
      const newReview: Review = {
        id: 'rev-' + Date.now(),
        userName: reviewForm.userName,
        location: reviewForm.location || 'Tamil Nadu',
        rating: reviewForm.rating,
        title: reviewForm.title || `${reviewForm.rating} Star Review`,
        comment: reviewForm.comment,
        productId: reviewForm.productId || 'custom',
        productName: reviewForm.productName || 'Nursery Plant',
        imageUrl: reviewForm.imageUrl,
        status: reviewForm.status,
        createdAt: new Date().toISOString().split('T')[0],
        isVerified: true,
        featured: reviewForm.featured,
      };

      saveReviewsState([newReview, ...reviews]);
      toast.success('Customer review added successfully!', 'Review Saved');

      try {
        await authFetch('/api/admin/reviews', {
          method: 'POST',
          body: JSON.stringify(newReview)
        });
      } catch (err) {
        console.error('API add review error:', err);
      }
    }

    setShowReviewModal(false);
    setEditingReview(null);
    setReviewForm({
      userName: '',
      location: 'Pennagaram, TN',
      rating: 5,
      title: '',
      comment: '',
      productId: '',
      productName: 'Dutch Hybrid Red Rose',
      imageUrl: '',
      status: 'APPROVED',
      featured: true
    });
  };

  const handleOpenEditReview = (r: Review) => {
    setEditingReview(r);
    setReviewForm({
      userName: r.userName || '',
      location: r.location || '',
      rating: r.rating || 5,
      title: r.title || '',
      comment: r.comment || '',
      productId: r.productId || '',
      productName: r.productName || '',
      imageUrl: r.imageUrl || '',
      status: r.status || 'APPROVED',
      featured: r.featured ?? true,
    });
    setShowReviewModal(true);
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer review?')) return;

    try {
      const savedDeleted = localStorage.getItem('vrg_deleted_reviews');
      let deletedList: string[] = [];
      if (savedDeleted) {
        const parsed = JSON.parse(savedDeleted);
        if (Array.isArray(parsed)) deletedList = parsed;
      }
      if (!deletedList.includes(id)) {
        deletedList.push(id);
      }
      localStorage.setItem('vrg_deleted_reviews', JSON.stringify(deletedList));
    } catch {}

    const updated = reviews.filter(r => r.id !== id);
    saveReviewsState(updated);
    toast.success('Review deleted.', 'Review Deleted');

    try {
      await authFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' }).catch(() => null);
      await fetch(`/api/reviews/${id}`, { method: 'DELETE' }).catch(() => null);
    } catch (err) {
      console.error('API delete review error:', err);
    }
  };

  const handleToggleReviewStatus = async (id: string) => {
    const target = reviews.find(r => r.id === id);
    if (!target) return;
    const newStatus = target.status === 'APPROVED' ? ('PENDING' as const) : ('APPROVED' as const);
    const updated = reviews.map(r => r.id === id ? { ...r, status: newStatus } : r);
    saveReviewsState(updated);
    toast.success(`Review status updated to ${newStatus}!`, 'Review Status');

    try {
      await authFetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error('API toggle review status error:', err);
    }
  };

  const handleToggleReviewFeatured = async (id: string) => {
    const target = reviews.find(r => r.id === id);
    if (!target) return;
    const newFeatured = !target.featured;
    const updated = reviews.map(r => r.id === id ? { ...r, featured: newFeatured } : r);
    saveReviewsState(updated);
    toast.success(newFeatured ? 'Review featured on store!' : 'Review unfeatured.', 'Review Featured');

    try {
      await authFetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ featured: newFeatured })
      });
    } catch (err) {
      console.error('API toggle review featured error:', err);
    }
  };

  const handleSaveReviewReply = async (id: string) => {
    if (!replyText.trim()) return;
    const text = replyText.trim();
    const updated = reviews.map(r => r.id === id ? { ...r, reply: text } : r);
    saveReviewsState(updated);
    setReplyingReviewId(null);
    setReplyText('');
    toast.success('Reply published successfully!', 'Reply Published');

    try {
      await authFetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ reply: text })
      });
    } catch (err) {
      console.error('API save review reply error:', err);
    }
  };
  const [settings, setSettings] = useState<SiteSettings | null>(() => initialCache?.settings || ({} as SiteSettings));
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>(() => Array.isArray(initialCache?.paymentLogs) ? initialCache.paymentLogs : []);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);


  // Financial P&L Entries state
  const [finances, setFinances] = useState<FinancialEntry[]>(() => Array.isArray(initialCache?.finances) ? initialCache.finances : []);
  const [editingFinance, setEditingFinance] = useState<FinancialEntry | null>(null);
  const [showFinanceModal, setShowFinanceModal] = useState(false);

  const [financeForm, setFinanceForm] = useState<{
    type: 'EXPENSE' | 'SALE';
    title: string;
    category: FinancialEntry['category'];
    costAmount: number;
    sellAmount: number;
    quantity: number;
    notes: string;
    date: string;
  }>({
    type: 'EXPENSE',
    title: '',
    category: 'Fertilizer',
    costAmount: 0,
    sellAmount: 0,
    quantity: 1,
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });


  const pendingStockRef = React.useRef<Map<string, number>>(new Map());
  // Track recently-edited order status so auto-poll doesn't overwrite user changes
  const pendingOrderStatusRef = React.useRef<Map<string, { status: string; paymentStatus?: string; courierName?: string; trackingNumber?: string; time: number }>>(new Map());
  // Track full order updates (address, items, details) to guarantee instant 0ms persistence against background polling
  const pendingOrderUpdatesRef = React.useRef<Map<string, { order: Order; time: number }>>(new Map());
  // Track recently-saved products so polling doesn't overwrite optimistic state with stale server data
  const pendingProductsRef = React.useRef<Map<string, { product: Product; savedAt: number }>>(new Map());

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSaving, setProductSaving] = useState(false);
  const [dispatchOrder, setDispatchOrder] = useState<Order | null>(null);
  const [courierName, setCourierName] = useState('ST Courier');
  const [trackingNumber, setTrackingNumber] = useState('');

  // WhatsApp / Offline Order Modal State
  const [showWhatsAppOrderModal, setShowWhatsAppOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [whatsAppOrderSaving, setWhatsAppOrderSaving] = useState(false);
  const [addOrderMode, setAddOrderMode] = useState<'manual' | 'ai_image'>('manual');
  const [uploadedOrderImagePreview, setUploadedOrderImagePreview] = useState<string | null>(null);
  const [showImageZoomModal, setShowImageZoomModal] = useState(false);
  const [showPlantsTextToggle, setShowPlantsTextToggle] = useState(false);
  const [whatsAppOrderForm, setWhatsAppOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    fullAddress: '',
    houseNo: '',
    street: '',
    villageTown: '',
    district: '',
    state: 'Tamil Nadu',
    pincode: '',
    plantsText: '',
    items: [] as any[],
    deliveryFee: 0,
    discount: 0,
    grandTotal: 140,
    paymentMethod: 'WHATSAPP' as 'WHATSAPP' | 'UPI' | 'GPAY' | 'PHONEPE' | 'COD' | 'BANK_TRANSFER',
    paymentStatus: 'SUCCESS' as PaymentStatus,
    orderStatus: 'CONFIRMED' as OrderStatus,
    notes: '',
    trackingNumber: '',
    courierName: 'Professional Courier – Reduced Soil'
  });

  // Category Modal & Reassignment State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCatTarget, setDeleteCatTarget] = useState<{ category: Category; productCount: number } | null>(null);
  const [reassignCategoryId, setReassignCategoryId] = useState<string>('');
  const [showSeoFields, setShowSeoFields] = useState(false);
  const [catForm, setCatForm] = useState({
    name: '',
    tamilName: '',
    slug: '',
    description: '',
    image: '/products/double-delight.jpeg',
    iconName: 'Flower2',
    order: 1,
    isActive: true,
    isFeatured: false,
    metaTitle: '',
    metaDescription: '',
    ogImage: '',
    canonicalUrl: ''
  });

  // New Product Form State
  const [prodForm, setProdForm] = useState<Partial<Product>>({
    name: '',
    englishName: '',
    tamilName: '',
    scientificName: '',
    categoryId: 'cat-rose',
    categoryName: 'Roses',
    description: '',
    mrp: 299,
    sellingPrice: 199,
    discount: 33,
    stock: 25,
    plantHeight: '1.5 Feet',
    potSize: '8 Inch Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Year',
    images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'],
    careInstructions: {
      watering: 'Water daily in the morning.',
      sunlight: 'Requires 5 hours direct sunlight.',
      fertilizer: 'Apply vermicompost every 15 days.',
      soil: 'Red soil mixed with coco peat.'
    },
    featured: true,
    bestSeller: false,
    trending: false,
    tags: ['Rose', 'Plant']
  });

  // Product Image Upload & Local Storage State
  const [prodImgTab, setProdImgTab] = useState<'upload' | 'url'>('upload');
  const [prodUrlInput, setProdUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleProdLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    try {
      const newImages = await processMultipleImageFiles(files);
      if (newImages.length > 0) {
        setProdForm(prev => {
          const currentImgs = (prev.images || []).filter(Boolean);
          const isDefaultOnly = currentImgs.length === 1 && currentImgs[0].includes('unsplash.com');
          return {
            ...prev,
            images: isDefaultOnly ? newImages : [...currentImgs, ...newImages]
          };
        });
        toast.success(`${newImages.length} image${newImages.length > 1 ? 's' : ''} added!`, 'Image Uploaded');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process local image file');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddProdUrlImage = () => {
    if (!prodUrlInput.trim()) return;
    setProdForm(prev => {
      const currentImgs = prev.images || [];
      const isDefaultOnly = currentImgs.length === 1 && currentImgs[0].includes('unsplash.com');
      return {
        ...prev,
        images: isDefaultOnly ? [prodUrlInput.trim()] : [...currentImgs, prodUrlInput.trim()]
      };
    });
    setProdUrlInput('');
  };

  const handleRemoveProdImage = (index: number) => {
    setProdForm(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const handleSetPrimaryProdImage = (index: number) => {
    setProdForm(prev => {
      const imgs = [...(prev.images || [])];
      if (index > 0 && index < imgs.length) {
        const [moved] = imgs.splice(index, 1);
        imgs.unshift(moved);
      }
      return { ...prev, images: imgs };
    });
  };

// Shared promise lock to deduplicate concurrent refresh requests across parallel fetch calls
let sharedRefreshPromise: Promise<boolean> | null = null;

const silentRefresh = async (): Promise<boolean> => {
  if (sharedRefreshPromise) {
    return sharedRefreshPromise;
  }
  sharedRefreshPromise = (async () => {
    try {
      const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      const refreshData = await refreshRes.json();
      return refreshData.success === true;
    } catch {
      return false;
    } finally {
      sharedRefreshPromise = null;
    }
  })();
  return sharedRefreshPromise;
};

  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    // If session expired (401), attempt silent token refresh automatically with deduplication lock
    if (res.status === 401) {
      const refreshed = await silentRefresh();
      if (refreshed) {
        // Retry original request with newly issued session cookie
        res = await fetch(url, {
          ...options,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
          }
        });
      }
    }

    if (res.status === 401) {
      console.warn('[SECURITY] Admin session unauthorized for endpoint:', url);
    }
    return res;
  };

  const fetchData = async () => {
    try {
      const bRes = await authFetch('/api/admin/bootstrap').then((r) => r.json()).catch(() => null);

      if (bRes?.success) {
        if (bRes.stats) setStats(bRes.stats);
        if (Array.isArray(bRes.combos)) {
          const deletedComboSet = new Set(JSON.parse(localStorage.getItem('vrg_deleted_combos') || '[]'));
          setCombos(prev => {
            const serverMap = new Map(bRes.combos.map((c: Combo) => [c.id, c]));
            const merged = bRes.combos.filter((c: Combo) => !deletedComboSet.has(c.id));
            prev.forEach(localC => {
              if (!deletedComboSet.has(localC.id) && !serverMap.has(localC.id)) {
                merged.unshift(localC);
              }
            });
            return merged;
          });
        }
        if (Array.isArray(bRes.finances)) {
          const deletedFinSet = new Set(JSON.parse(localStorage.getItem('vrg_deleted_finances') || '[]'));
          setFinances(bRes.finances.filter((f: FinancialEntry) => !deletedFinSet.has(f.id)));
        }
        if (Array.isArray(bRes.products) && bRes.products.length > 0) {
          const now = Date.now();
          const deletedProdSet = new Set(JSON.parse(localStorage.getItem('vrg_deleted_products') || '[]'));
          const pendingMap = getPendingSavedProducts();
          setProducts(prev => {
            let filtered = bRes.products.filter((p: Product) => !deletedProdSet.has(p.id) && !deletedProdSet.has(p.sku));
            
            // Prune pending products that the server has now returned
            const serverIds = new Set(filtered.map(p => p.id));
            const serverSkus = new Set(filtered.map(p => p.sku));
            pendingMap.forEach((item, pid) => {
              if (serverIds.has(pid) || (item.product.sku && serverSkus.has(item.product.sku))) {
                clearPendingProductFromSession(pid);
              }
            });

            // Merge edit and stock overrides for recently-edited products
            filtered = filtered.map((apiProd: Product) => {
              const pendingEdit = pendingProductsRef.current.get(apiProd.id) || (apiProd.sku ? pendingProductsRef.current.get(apiProd.sku) : undefined);
              if (pendingEdit && now - pendingEdit.savedAt < 60000) {
                return { ...apiProd, ...pendingEdit.product };
              }
              const editedAt = pendingStockRef.current.get(apiProd.id) || (apiProd.sku ? pendingStockRef.current.get(apiProd.sku) : undefined);
              if (editedAt && now - editedAt < 60000) {
                const local = prev.find(p => p.id === apiProd.id || (apiProd.sku && p.sku === apiProd.sku));
                return local ? { ...apiProd, stock: local.stock } : apiProd;
              }
              return apiProd;
            });

            const filteredIds = new Set(filtered.map((p: Product) => p.id));
            const filteredSkus = new Set(filtered.map((p: Product) => p.sku));

            // Merge any remaining pending products from sessionStorage
            pendingMap.forEach(({ product, savedAt }, id) => {
              if (
                now - savedAt < 90000 &&
                !filteredIds.has(id) &&
                (!product.sku || !filteredSkus.has(product.sku)) &&
                !deletedProdSet.has(id)
              ) {
                filtered.unshift(product);
                filteredIds.add(id);
                if (product.sku) filteredSkus.add(product.sku);
              }
            });

            return filtered;
          });
        }
        if (Array.isArray(bRes.categories) && bRes.categories.length > 0) setCategories(bRes.categories);
        if (Array.isArray(bRes.coupons)) setCoupons(bRes.coupons);
        if (Array.isArray(bRes.orders)) {
          const now = Date.now();
          let deletedOrderSet = new Set<string>();
          try {
            const d = localStorage.getItem('vrg_deleted_orders');
            if (d) deletedOrderSet = new Set(JSON.parse(d));
          } catch {}
          setOrders(
            bRes.orders
              .filter((o: Order) => {
                if (!o || !o.id) return false;
                if (deletedOrderSet.has(o.id) || deletedOrderSet.has(o.merchantTransactionId || '') || deletedOrderSet.has(o.orderNumber || '')) return false;
                return isValidAdminOrder(o);
              })
              .map((apiOrder: Order) => {
                const pendingFull = pendingOrderUpdatesRef.current.get(apiOrder.id) || (apiOrder.merchantTransactionId ? pendingOrderUpdatesRef.current.get(apiOrder.merchantTransactionId) : undefined);
                if (pendingFull && now - pendingFull.time < 60000) {
                  return {
                    ...apiOrder,
                    ...pendingFull.order,
                    updatedAt: pendingFull.order.updatedAt || apiOrder.updatedAt
                  };
                }
                const pending = pendingOrderStatusRef.current.get(apiOrder.id) || (apiOrder.merchantTransactionId ? pendingOrderStatusRef.current.get(apiOrder.merchantTransactionId) : undefined);
                if (pending && now - pending.time < 15000) {
                  return {
                    ...apiOrder,
                    orderStatus: (pending.status as any) || apiOrder.orderStatus,
                    paymentStatus: (pending.paymentStatus as any) || apiOrder.paymentStatus,
                    courierName: pending.courierName || (apiOrder as any).courierName,
                    trackingNumber: pending.trackingNumber || (apiOrder as any).trackingNumber
                  };
                }
                return apiOrder;
              })
          );
        }
        if (Array.isArray(bRes.banners)) setBanners(bRes.banners);
        if (Array.isArray(bRes.reviews)) setReviews(bRes.reviews);
        if (bRes.settings) setSettings(bRes.settings);
        if (Array.isArray(bRes.paymentLogs)) setPaymentLogs(bRes.paymentLogs);

        try {
          const str = JSON.stringify(bRes);
          sessionStorage.setItem(ADMIN_CACHE_KEY_SESSION, str);
          localStorage.setItem(ADMIN_CACHE_KEY_LOCAL, str);
        } catch {}
      } else {
        // Fast fallback: fetch public endpoints without 401 retry overhead
        const [pRes, cRes, cpRes, bResLeg, rRes, stRes, cbRes, ordRes] = await Promise.all([
          fetch('/api/products').then((r) => r.json()).catch(() => null),
          fetch('/api/categories').then((r) => r.json()).catch(() => null),
          fetch('/api/coupons').then((r) => r.json()).catch(() => null),
          fetch('/api/banners').then((r) => r.json()).catch(() => null),
          fetch('/api/reviews').then((r) => r.json()).catch(() => null),
          fetch('/api/settings').then((r) => r.json()).catch(() => null),
          fetch('/api/combos').then((r) => r.json()).catch(() => null),
          authFetch('/api/admin/orders').then((r) => r.json()).catch(() => null)
        ]);

        if (cbRes?.success && Array.isArray(cbRes.combos)) {
          const deletedComboSet = new Set(JSON.parse(localStorage.getItem('vrg_deleted_combos') || '[]'));
          setCombos(cbRes.combos.filter((c: Combo) => !deletedComboSet.has(c.id)));
        }
        if (pRes?.success && Array.isArray(pRes.products)) {
          const deletedProdSet = new Set(JSON.parse(localStorage.getItem('vrg_deleted_products') || '[]'));
          setProducts(pRes.products.filter((p: Product) => !deletedProdSet.has(p.id) && !deletedProdSet.has(p.sku)));
        }
        if (cRes?.success && Array.isArray(cRes.categories)) setCategories(cRes.categories);
        if (cpRes?.success && Array.isArray(cpRes.coupons)) setCoupons(cpRes.coupons);
        if (bResLeg?.success) setBanners(bResLeg.banners);
        if (rRes?.success) setReviews(rRes.reviews);
        if (stRes?.success) setSettings(stRes.settings);
        if (ordRes?.success && Array.isArray(ordRes.orders) && ordRes.orders.length > 0) {
          let deletedOrderSet = new Set<string>();
          try {
            const d = localStorage.getItem('vrg_deleted_orders');
            if (d) deletedOrderSet = new Set(JSON.parse(d));
          } catch {}
          setOrders(ordRes.orders.filter((o: Order) => {
            if (!o || !o.id) return false;
            if (deletedOrderSet.has(o.id) || deletedOrderSet.has(o.merchantTransactionId || '') || deletedOrderSet.has(o.orderNumber || '')) return false;
            return isValidAdminOrder(o);
          }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Purge legacy local storage keys that may contain stale snapshots
    const legacyKeys = [
      'vrg_admin_session_cache',
      'vrg_admin_persisted_cache',
      'vrg_admin_bootstrap_cache',
      'vrg_admin_session_cache_v2',
      'vrg_admin_persisted_cache_v2',
      'vrg_admin_session_cache_v3',
      'vrg_admin_persisted_cache_v3',
      'vrg_admin_session_cache_v4',
      'vrg_admin_persisted_cache_v4',
      'vrg_deleted_orders',
      'vrg_deleted_categories',
      'vrg_deleted_coupons',
      'veerika_admin_orders',
      'vrg_orders',
      'veerika_customer_orders',
      'vrg_user_orders',
      'vrg_my_orders'
    ];
    legacyKeys.forEach(k => {
      try {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      } catch {}
    });

    fetchData();

    // Security Re-validation: Verify session token server-side on mount with auto-refresh support
    const verifySession = async () => {
      try {
        let res = await fetch('/api/auth/me', { credentials: 'include' });
        let data = await res.json();
        if (!data.success) {
          const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
          const refreshData = await refreshRes.json();
          if (refreshData.success) {
            res = await fetch('/api/auth/me', { credentials: 'include' });
            data = await res.json();
          }
        }
        if (!data.success || !data.user || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(data.user.role)) {
          const storedUser = JSON.parse(localStorage.getItem('vrg_user') || 'null');
          if (!storedUser || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(storedUser.role)) {
            console.warn('[SECURITY] Unauthenticated or unauthorized access to Admin Dashboard. Redirecting.');
            localStorage.removeItem('vrg_user');
            onBackToStore();
          }
        }
      } catch {
        // If backend auth check fails, fallback to standard error handling in authFetch
      }
    };
    verifySession();

    // Poll every 60 seconds for live order feed (bootstrap cache is 60s TTL)
    const ADMIN_POLL_INTERVAL_MS = 60_000; // 60 seconds — matches server bootstrap cache TTL
    const interval = setInterval(() => {
      fetchData();
    }, ADMIN_POLL_INTERVAL_MS);

    const handleSync = () => fetchData();
    const handleVisibilitySync = () => {
      if (!document.hidden) fetchData();
    };
    const handleProductSync = (e: any) => {
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setProducts(e.detail);
      } else {
        fetchData();
      }
    };
    window.addEventListener('focus', handleSync);
    window.addEventListener('visibilitychange', handleVisibilitySync);
    window.addEventListener('orderStatusUpdated', handleSync);
    window.addEventListener('vrg_products_updated', handleProductSync);
    window.addEventListener('vrg_categories_updated', handleSync);
    window.addEventListener('vrg_combos_updated', handleSync);
    window.addEventListener('storage', handleProductSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('visibilitychange', handleVisibilitySync);
      window.removeEventListener('orderStatusUpdated', handleSync);
      window.removeEventListener('vrg_products_updated', handleProductSync);
      window.removeEventListener('vrg_categories_updated', handleSync);
      window.removeEventListener('vrg_combos_updated', handleSync);
      window.removeEventListener('storage', handleProductSync);
    };
  }, []);

  const [productSaveError, setProductSaveError] = useState<string | null>(null);
  // Handle Save Product (Create or Edit) — Instant Zero-Latency Optimistic Save (<10ms)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductSaveError(null);
    setProductSaving(true);

    // Auto-generate SKU if not provided
    const targetId = editingProduct?.id;
    const isEdit = Boolean(targetId);
    const autoSku = prodForm.sku || editingProduct?.sku ||
      `VRG-${(prodForm.name || 'PLANT').replace(/\s+/g, '-').toUpperCase().slice(0, 12)}-${Date.now().toString(36).toUpperCase()}`;

    // Compute discount % if not set
    const mrp = Number(prodForm.mrp) || Number(prodForm.sellingPrice) || 0;
    const sellingPrice = Number(prodForm.sellingPrice) || 0;
    const autoDiscount = mrp > 0 ? Math.max(0, Math.round(((mrp - sellingPrice) / mrp) * 100)) : 0;
    const discountVal = (prodForm.discount !== undefined && prodForm.discount !== null && !isNaN(Number(prodForm.discount)))
      ? Number(prodForm.discount)
      : autoDiscount;

    // Build complete payload with defaults for every optional field
    const payload = {
      sku: autoSku,
      name: (prodForm.name || '').trim(),
      englishName: (prodForm.englishName || prodForm.name || '').trim(),
      tamilName: (prodForm.tamilName || '').trim(),
      scientificName: (prodForm.scientificName || '').trim(),
      categoryId: prodForm.categoryId || 'cat-rose',
      categoryName: prodForm.categoryName || 'Roses',
      description: prodForm.description || prodForm.name || '',
      mrp,
      sellingPrice,
      discount: discountVal,
      stock: Number(prodForm.stock) >= 0 ? Number(prodForm.stock) : 25,
      plantHeight: prodForm.plantHeight || '1–2 Feet',
      potSize: prodForm.potSize || '8 Inch Bag',
      sunlight: prodForm.sunlight || 'Full Sun',
      waterRequirement: prodForm.waterRequirement || 'Daily',
      floweringSeason: prodForm.floweringSeason || 'All Year',
      careInstructions: prodForm.careInstructions || {
        watering: 'Water daily in the morning.',
        sunlight: 'Requires 5 hours direct sunlight.',
        fertilizer: 'Apply vermicompost every 15 days.',
        soil: 'Red soil mixed with coco peat.'
      },
      images: (() => {
        let imgs = (prodForm.images || []).filter(Boolean);
        if (prodUrlInput.trim() && !imgs.includes(prodUrlInput.trim())) {
          const isDefaultOnly = imgs.length === 1 && imgs[0].includes('unsplash.com');
          imgs = isDefaultOnly ? [prodUrlInput.trim()] : [...imgs, prodUrlInput.trim()];
        }
        return imgs.length > 0
          ? imgs
          : ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'];
      })(),
      featured: Boolean(prodForm.featured),
      bestSeller: Boolean(prodForm.bestSeller),
      trending: Boolean(prodForm.trending),
      tags: prodForm.tags?.length ? prodForm.tags : [prodForm.categoryName || 'Plant'],
      status: (prodForm.status || 'ACTIVE') as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
    };

    const tempId = targetId || ('prod-' + Date.now());
    const optimisticProd: Product = {
      ...payload,
      id: tempId,
      rating: editingProduct?.rating || 5.0,
      reviewCount: editingProduct?.reviewCount || 0,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Product;

    // 1. INSTANT ZERO-LATENCY UI UPDATE (0ms)
    let updatedProductsList: Product[] = [];
    setProducts(prev => {
      const next = isEdit
        ? prev.map(p => (p.id === targetId || (p.sku && p.sku === payload.sku)) ? { ...p, ...optimisticProd } : p)
        : [{ ...optimisticProd }, ...prev.filter(p => p.id !== tempId && p.sku !== payload.sku)];
      updatedProductsList = next;
      persistAdminCache(c => ({ ...c, products: next }));
      try {
        localStorage.setItem('vrg_products', JSON.stringify(next));
        const deletedSet = new Set(JSON.parse(localStorage.getItem('vrg_deleted_products') || '[]'));
        deletedSet.delete(tempId);
        if (payload.sku) deletedSet.delete(payload.sku);
        localStorage.setItem('vrg_deleted_products', JSON.stringify(Array.from(deletedSet)));
      } catch {}
      return next;
    });

    savePendingProductToSession(optimisticProd);
    pendingProductsRef.current.set(tempId, { product: optimisticProd, savedAt: Date.now() });
    if (payload.sku) {
      pendingProductsRef.current.set(payload.sku, { product: optimisticProd, savedAt: Date.now() });
    }

    // Instantly close modal and show toast
    setShowProductModal(false);
    setEditingProduct(null);
    setProductSaving(false);
    toast.success(`Plant "${payload.name}" saved!`, 'Product Saved');

    try {
      window.dispatchEvent(new CustomEvent('vrg_products_updated', { detail: updatedProductsList }));
    } catch {}

    // 2. NON-BLOCKING BACKGROUND DATABASE PERSISTENCE
    const url = isEdit ? `/api/products/${encodeURIComponent(targetId)}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';

    authFetch(url, {
      method,
      body: JSON.stringify(payload)
    })
      .then(async r => {
        const data = await r.json().catch(() => null);
        if (data?.success && data?.product) {
          const serverProd: Product = data.product;
          if (tempId !== serverProd.id) {
            clearPendingProductFromSession(tempId);
            pendingProductsRef.current.delete(tempId);
          }
          savePendingProductToSession(serverProd);
          pendingProductsRef.current.set(serverProd.id, { product: serverProd, savedAt: Date.now() });
          if (serverProd.sku) {
            pendingProductsRef.current.set(serverProd.sku, { product: serverProd, savedAt: Date.now() });
          }
          let nextList: Product[] = [];
          setProducts(prev => {
            const next = prev.map(p => (p.id === targetId || p.id === tempId || p.id === serverProd.id || (serverProd.sku && p.sku === serverProd.sku)) ? { ...p, ...serverProd } : p);
            nextList = next;
            persistAdminCache(c => ({ ...c, products: next }));
            try {
              localStorage.setItem('vrg_products', JSON.stringify(next));
            } catch {}
            return next;
          });
          try {
            window.dispatchEvent(new CustomEvent('vrg_products_updated', { detail: nextList }));
          } catch {}
        } else if (data && !data.success) {
          console.warn('[Admin Save Notice]', data.message);
          toast.error(data.message || 'Failed to update product', 'Update Error');
        }
      })
      .catch(err => {
        console.warn('[Admin Save Network Notice]', err);
      });
  };

  // Handle Delete Single Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"?`)) return;
    
    // 1. Immediately record in persistent deleted products set
    try {
      const deletedSet = new Set(JSON.parse(localStorage.getItem('vrg_deleted_products') || '[]'));
      deletedSet.add(id);
      localStorage.setItem('vrg_deleted_products', JSON.stringify(Array.from(deletedSet)));
    } catch {}

    // 2. Optimistically remove from state & persistent caches
    let nextList: Product[] = [];
    setProducts(prev => {
      nextList = prev.filter(p => p.id !== id && p.sku !== id);
      persistAdminCache(c => ({ ...c, products: nextList }));
      try {
        localStorage.setItem('vrg_products', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    toast.success(`Product "${name}" deleted.`, 'Product Deleted');

    // 3. Instantly notify app listeners (0ms)
    try {
      window.dispatchEvent(new CustomEvent('vrg_products_updated', { detail: nextList }));
    } catch {}

    // 4. Background deletion on server
    authFetch(`/api/products/${id}`, { method: 'DELETE' }).catch(err => {
      console.warn('Delete product background notice:', err);
    });
  };

  // Handle Delete All Products
  const handleDeleteAllProducts = async () => {
    if (!confirm('⚠️ WARNING: Are you sure you want to delete ALL products from the catalog? This action cannot be undone.')) return;
    try {
      const allIds = products.map(p => p.id);
      localStorage.setItem('vrg_deleted_products', JSON.stringify(allIds));
    } catch {}
    setProducts([]);
    persistAdminCache(c => ({ ...c, products: [] }));
    try { localStorage.setItem('vrg_products', JSON.stringify([])); } catch {}
    toast.success('All products removed.', 'Catalog Cleared');
    try {
      await authFetch('/api/products/all?confirm=CONFIRM_DELETE_ALL', { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
    try {
      window.dispatchEvent(new CustomEvent('vrg_products_updated', { detail: [] }));
    } catch {}
  };

  // Handle Save Category
  // Handle Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = Boolean(editingCategory?.id);
    const catId = editingCategory?.id || 'cat-' + Date.now();
    const savedName = catForm.name.trim();

    const categoryItem: Category = {
      id: catId,
      name: savedName,
      tamilName: catForm.tamilName.trim() || savedName,
      slug: catForm.slug.trim() || savedName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: catForm.description.trim(),
      image: catForm.image || '/products/double-delight.jpeg',
      iconName: catForm.iconName || 'Flower2',
      order: Number(catForm.order || categories.length + 1),
      isActive: catForm.isActive !== false,
      isFeatured: catForm.isFeatured === true,
      productCount: editingCategory?.productCount || 0,
      metaTitle: catForm.metaTitle || undefined,
      metaDescription: catForm.metaDescription || undefined,
      ogImage: catForm.ogImage || undefined,
      canonicalUrl: catForm.canonicalUrl || undefined
    };

    if (isEdit) {
      setCategories(prev => {
        const next = prev.map(c => c.id === catId ? { ...c, ...categoryItem } : c);
        persistAdminCache(c => ({ ...c, categories: next }));
        try { localStorage.setItem('vrg_categories', JSON.stringify(next)); } catch {}
        return next;
      });
    } else {
      setCategories(prev => {
        const next = [categoryItem, ...prev];
        persistAdminCache(c => ({ ...c, categories: next }));
        try { localStorage.setItem('vrg_categories', JSON.stringify(next)); } catch {}
        return next;
      });
    }

    toast.success(`Category "${savedName}" saved successfully!`, 'Category Saved');
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCatForm({
      name: '',
      tamilName: '',
      slug: '',
      description: '',
      image: '/products/double-delight.jpeg',
      iconName: 'Flower2',
      order: categories.length + 1,
      isActive: true,
      isFeatured: false,
      metaTitle: '',
      metaDescription: '',
      ogImage: '',
      canonicalUrl: ''
    });

    // Await server sync
    try {
      const url = isEdit ? `/api/admin/categories/${catId}` : '/api/admin/categories';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(categoryItem)
      });
      const data = await res.json().catch(() => null);
      if (data && data.category) {
        setCategories(prev => {
          const next = prev.map(c => (c.id === data.category.id || c.id === catId) ? { ...c, ...data.category } : c);
          persistAdminCache(c => ({ ...c, categories: next }));
          return next;
        });
      }
    } catch (err: any) {
      console.warn('Background category save notice:', err);
    }

    try {
      window.dispatchEvent(new CustomEvent('vrg_categories_updated'));
    } catch {}
  };

  // Handle Delete Single Category with Product Reassignment Check
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    setCategories(prev => {
      const next = prev.filter(c => c.id !== id);
      persistAdminCache(c => ({ ...c, categories: next }));
      return next;
    });
    toast.success(`Category "${name}" deleted.`, 'Category Deleted');
    window.dispatchEvent(new CustomEvent('vrg_categories_updated'));

    try {
      const res = await authFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (data.code === 'HAS_PRODUCTS') {
        const cat = categories.find((c) => c.id === id);
        if (cat) {
          setDeleteCatTarget({ category: cat, productCount: data.productCount || 0 });
          const otherCats = categories.filter((c) => c.id !== id);
          if (otherCats.length > 0) {
            setReassignCategoryId(otherCats[0].id);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };


  // Confirm Reassign Products & Delete Category
  const handleConfirmReassignDelete = async () => {
    if (!deleteCatTarget || !reassignCategoryId) return;
    const targetCatId = deleteCatTarget.category.id;
    setCategories(prev => prev.filter(c => c.id !== targetCatId));
    toast.success('Category deleted and products reassigned successfully!', 'Category Reassigned');
    setDeleteCatTarget(null);
    window.dispatchEvent(new CustomEvent('vrg_categories_updated'));

    try {
      await authFetch(
        `/api/admin/categories/${targetCatId}?targetCategoryId=${reassignCategoryId}`,
        { method: 'DELETE' }
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete All Categories
  const handleDeleteAllCategories = async () => {
    if (!confirm('⚠️ WARNING: Are you sure you want to delete ALL categories? This action cannot be undone.')) return;
    setCategories([]);
    persistAdminCache(c => ({ ...c, categories: [] }));
    toast.success('All categories removed.', 'Categories Cleared');
    window.dispatchEvent(new CustomEvent('vrg_categories_updated'));

    try {
      await authFetch('/api/admin/categories/all?confirm=CONFIRM_DELETE_ALL', { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(`⚠️ Are you sure you want to permanently delete Order #${orderId}? This action cannot be undone.`)) return;

    // 1. Remove order from UI state & all local storage lists
    setOrders(prev => {
      const filtered = prev.filter(o => o.id !== orderId && o.merchantTransactionId !== orderId && o.orderNumber !== orderId);
      const keysToSave = ['veerika_admin_orders', 'vrg_user_orders', 'veerika_customer_orders', 'vrg_orders', 'vrg_my_orders'];
      keysToSave.forEach(key => {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              localStorage.setItem(key, JSON.stringify(list.filter((o: any) => o.id !== orderId && o.merchantTransactionId !== orderId && o.orderNumber !== orderId)));
            }
          }
        } catch {}
      });
      return filtered;
    });

    // 2. Track in vrg_deleted_orders set
    try {
      const deletedSet = new Set(JSON.parse(localStorage.getItem('vrg_deleted_orders') || '[]'));
      deletedSet.add(orderId);
      localStorage.setItem('vrg_deleted_orders', JSON.stringify(Array.from(deletedSet)));

      // 3. Purge from admin caches
      persistAdminCache(c => ({
        ...c,
        orders: Array.isArray(c?.orders) ? c.orders.filter((o: any) => o.id !== orderId && o.merchantTransactionId !== orderId && o.orderNumber !== orderId) : []
      }));
      const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
      if (Array.isArray(cached.orders)) {
        cached.orders = cached.orders.filter((o: any) => o.id !== orderId && o.merchantTransactionId !== orderId && o.orderNumber !== orderId);
        localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
      }
    } catch {}

    // 4. Dispatch global event for instant 0ms cross-tab & component synchronization
    window.dispatchEvent(new CustomEvent('vrg_order_deleted', { detail: { id: orderId } }));
    window.dispatchEvent(new CustomEvent('vrg_orders_sync', { detail: { deletedId: orderId } }));

    toast.success(`Order #${orderId} deleted successfully.`, 'Order Deleted');

    // 5. Trigger backend deletion endpoints
    try {
      await authFetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' }).catch(() => null);
      await authFetch('/api/admin/orders/delete', { method: 'POST', body: JSON.stringify({ id: orderId }) }).catch(() => null);
    } catch (err) {
      console.error('Delete order error:', err);
    }
  };


  // Handle Dispatch Order
  const handleDispatchOrder = async (customTracking?: string, customCourier?: string) => {
    if (!dispatchOrder) return;
    const finalCourier = customCourier || courierName || 'Self Delivery (Nursery Farm Team)';
    const finalTracking = customTracking || trackingNumber.trim() || 'VRG-SELF-DELIVERY';
    const targetOrderId = dispatchOrder.id;

    pendingOrderStatusRef.current.set(targetOrderId, {
      status: 'DISPATCHED',
      courierName: finalCourier,
      trackingNumber: finalTracking,
      time: Date.now()
    });

    // 1. Instant 0ms UI update
    setOrders(prev => {
      const updatedList = prev.map(o => o.id === targetOrderId ? {
        ...o,
        orderStatus: 'DISPATCHED' as any,
        courierName: finalCourier,
        trackingNumber: finalTracking,
        updatedAt: new Date().toISOString()
      } : o);

      const keysToSave = ['veerika_admin_orders', 'vrg_user_orders', 'veerika_customer_orders', 'vrg_orders', 'vrg_my_orders'];
      keysToSave.forEach(key => {
        try {
          localStorage.setItem(key, JSON.stringify(updatedList));
        } catch {}
      });
      persistAdminCache(c => ({ ...c, orders: updatedList }));
      try {
        const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
        cached.orders = updatedList;
        localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
      } catch {}
      return updatedList;
    });

    setDispatchOrder(null);
    setTrackingNumber('');
    toast.success(`Order #${targetOrderId} dispatched via ${finalCourier}!`, 'Order Dispatched');

    // 2. Await backend sync
    try {
      const res = await authFetch(`/api/admin/orders/${targetOrderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          orderStatus: 'DISPATCHED',
          courierName: finalCourier,
          trackingNumber: finalTracking
        })
      });
      const data = await res.json().catch(() => null);
      if (data && data.order) {
        setOrders(prev => {
          const synced = prev.map(o => (o.id === data.order.id || o.merchantTransactionId === data.order.merchantTransactionId) ? { ...o, ...data.order } : o);
          persistAdminCache(c => ({ ...c, orders: synced }));
          return synced;
        });
      }
    } catch (err) {
      console.error('Error dispatching order:', err);
    }

    try {
      window.dispatchEvent(new CustomEvent('orderStatusUpdated', { detail: { orderId: targetOrderId, status: 'DISPATCHED' } }));
    } catch {}
  };

  // Handle Quick Order Status Updates (Instant 0ms UI response)
  const handleUpdateOrderStatus = async (orderId: string, status: string, paymentStatus?: string) => {
    pendingOrderStatusRef.current.set(orderId, {
      status,
      paymentStatus,
      time: Date.now()
    });

    const updateSingleOrder = (o: Order): Order => {
      if (o.id === orderId || o.merchantTransactionId === orderId) {
        return {
          ...o,
          orderStatus: status as any,
          paymentStatus: paymentStatus ? (paymentStatus as any) : o.paymentStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    };

    setOrders(prev => {
      const updatedOrdersList = prev.map(updateSingleOrder);
      const keysToSave = ['veerika_admin_orders', 'vrg_user_orders', 'veerika_customer_orders', 'vrg_orders', 'vrg_my_orders'];
      keysToSave.forEach(key => {
        try {
          localStorage.setItem(key, JSON.stringify(updatedOrdersList));
        } catch {}
      });
      persistAdminCache(c => ({ ...c, orders: updatedOrdersList }));
      try {
        const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
        cached.orders = updatedOrdersList;
        localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
      } catch {}
      return updatedOrdersList;
    });

    toast.success(`Order #${orderId} moved to ${status}!`, 'Stage Updated');

    try {
      const res = await authFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ orderStatus: status, paymentStatus })
      });
      const data = await res.json().catch(() => null);
      if (data && data.order) {
        setOrders(prev => {
          const synced = prev.map(o => (o.id === data.order.id || o.merchantTransactionId === data.order.merchantTransactionId) ? { ...o, ...data.order } : o);
          persistAdminCache(c => ({ ...c, orders: synced }));
          return synced;
        });
      }
    } catch (err) {
      console.warn('Backend updateOrderStatus error:', err);
    }

    try {
      window.dispatchEvent(new CustomEvent('orderStatusUpdated', { detail: { orderId, status, paymentStatus } }));
    } catch {}
  };

  // Handle Manual Order Holding (Hold Back Order / Delay Shipment)
  const handleToggleHolding = (orderId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const isCurrentlyHolding = holdingOrderIds.includes(orderId);
    const nextHolding = !isCurrentlyHolding;
    const nextList = nextHolding
      ? Array.from(new Set([...holdingOrderIds, orderId]))
      : holdingOrderIds.filter(id => id !== orderId);

    setHoldingOrderIds(nextList);
    try {
      localStorage.setItem('vrg_holding_order_ids', JSON.stringify(nextList));
    } catch {}

    setOrders(prev => {
      const updated = prev.map(o => (o.id === orderId || o.merchantTransactionId === orderId) ? { ...o, isHolding: nextHolding } : o);
      const keysToSave = ['veerika_admin_orders', 'vrg_user_orders', 'veerika_customer_orders', 'vrg_orders', 'vrg_my_orders'];
      keysToSave.forEach(key => {
        try {
          localStorage.setItem(key, JSON.stringify(updated));
        } catch {}
      });
      persistAdminCache(c => ({ ...c, orders: updated }));
      return updated;
    });

    if (nextHolding) {
      toast.warning(`Order #${orderId} marked as ON HOLD (Delayed shipment for this week)`, 'Order On Hold');
    } else {
      toast.success(`Order #${orderId} released from Hold & resumed flow!`, 'Order Resumed');
    }

    try {
      window.dispatchEvent(new CustomEvent('vrg_orders_sync', { detail: { orderId, isHolding: nextHolding } }));
    } catch {}
  };

  // Handle Order Label Printed Status Toggle
  const handleToggleOrderPrinted = async (orderId: string, isPrinted?: boolean) => {
    let nextState = isPrinted;
    setOrders(prev => {
      const target = prev.find(o => o.id === orderId || o.merchantTransactionId === orderId);
      const computedNext = nextState !== undefined ? nextState : !(target?.isLabelPrinted);
      nextState = computedNext;
      const updatedOrdersList = prev.map(o => {
        if (o.id === orderId || o.merchantTransactionId === orderId) {
          return {
            ...o,
            isLabelPrinted: computedNext,
            labelPrintedAt: computedNext ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString()
          };
        }
        return o;
      });

      const keysToSave = ['veerika_admin_orders', 'vrg_user_orders', 'veerika_customer_orders', 'vrg_orders', 'vrg_my_orders'];
      keysToSave.forEach(key => {
        try { localStorage.setItem(key, JSON.stringify(updatedOrdersList)); } catch {}
      });
      try {
        const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
        cached.orders = updatedOrdersList;
        localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
      } catch {}

      try {
        const currentPrinted = JSON.parse(localStorage.getItem('vrg_printed_label_order_ids') || '[]');
        let nextPrinted = Array.isArray(currentPrinted) ? [...currentPrinted] : [];
        if (computedNext) {
          if (!nextPrinted.includes(orderId)) nextPrinted.push(orderId);
        } else {
          nextPrinted = nextPrinted.filter((id: string) => id !== orderId);
        }
        localStorage.setItem('vrg_printed_label_order_ids', JSON.stringify(nextPrinted));
      } catch {}

      return updatedOrdersList;
    });

    try {
      await authFetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({
          isLabelPrinted: nextState,
          labelPrintedAt: nextState ? new Date().toISOString() : null
        })
      });
    } catch {}
  };

  // Send WhatsApp Customer Alert (Strict notification template)
  const handleSendWhatsAppUpdate = (o: Order) => {
    const rawPhone = o.customerPhone || (typeof o.shippingAddress === 'object' ? o.shippingAddress?.phone : '') || '';
    const phoneClean = rawPhone.replace(/[^0-9]/g, '');
    const targetPhone = phoneClean.length === 10 ? '91' + phoneClean : (phoneClean.startsWith('91') ? phoneClean : `91${phoneClean}`);
    const stage = getOrderStage(o.orderStatus);
    const msg = generateOrderWhatsAppMessage(o, stage);
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Handle Quick Stock Update — optimistic with pending tracker to prevent poll revert
  const handleQuickStockUpdate = async (productId: string, newStock: number) => {
    const validStock = Math.max(0, newStock);
    let updatedProduct: Product | undefined;
    let nextList: Product[] = [];
    setProducts(prev => {
      nextList = prev.map(p => {
        if (p.id === productId || p.sku === productId) {
          updatedProduct = { ...p, stock: validStock };
          return updatedProduct;
        }
        return p;
      });
      if (updatedProduct) {
        pendingStockRef.current.set(productId, Date.now());
        if (updatedProduct.sku) pendingStockRef.current.set(updatedProduct.sku, Date.now());
        pendingProductsRef.current.set(productId, { product: updatedProduct, savedAt: Date.now() });
        if (updatedProduct.sku) pendingProductsRef.current.set(updatedProduct.sku, { product: updatedProduct, savedAt: Date.now() });
      }
      persistAdminCache(c => ({ ...c, products: nextList }));
      try {
        localStorage.setItem('vrg_products', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    try {
      await authFetch(`/api/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ stock: validStock })
      });
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
  };

  // Handle Settings Update
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMsg(null);
    try {
      const res = await authFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success && data.settings) {
        toast.success('Store & payment settings saved successfully!', 'Settings Saved');
        setSettingsMsg('✅ Settings saved successfully!');
        setSettings(data.settings);
      } else {
        toast.error(data.message || 'Failed to save settings', 'Settings Error');
        setSettingsMsg(`❌ ${data.message || 'Failed to save settings'}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Network error saving settings', 'Error');
      setSettingsMsg(`❌ Network error: ${err.message}`);
    } finally {
      setSettingsSaving(false);
      setTimeout(() => setSettingsMsg(null), 4000);
    }
  };

  // Handle Admin Manual Receipt Upload for Orders Missing Proof
  const handleAdminUploadProof = (orderId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await authFetch(`/api/admin/orders/${orderId}/status`, {
          method: 'PUT',
          body: JSON.stringify({
            paymentProofUrl: base64
          })
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`Payment proof attached to Order #${orderId}!`, 'Proof Uploaded');
          fetchData();
        }
      } catch (err) {
        console.error('Failed to attach proof photo:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Refund Trigger
  const handleTriggerRefund = async (merchantTransactionId: string, amount: number) => {
    if (!confirm(`Are you sure you want to trigger PhonePe refund of ₹${amount}?`)) return;
    try {
      const res = await authFetch('/api/phonepe/refund', {
        method: 'POST',
        body: JSON.stringify({ merchantTransactionId, amount })
      });
      const data = await res.json();
      toast.success(data.message || `Refund of ₹${amount} initiated!`, 'Refund Status');
      alert(data.message);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Open WhatsApp / AI Order Modal for Creating a New Order
  const handleOpenAddWhatsAppOrder = (mode: 'manual' | 'ai_image' = 'manual') => {
    setEditingOrder(null);
    setAddOrderMode(mode);
    setUploadedOrderImagePreview(null);
    setShowPlantsTextToggle(false);
    setWhatsAppOrderForm({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      fullAddress: '',
      houseNo: '',
      street: '',
      villageTown: '',
      district: '',
      state: 'Tamil Nadu',
      pincode: '',
      plantsText: '',
      items: [],
      deliveryFee: 0,
      discount: 0,
      grandTotal: 140,
      paymentMethod: 'WHATSAPP',
      paymentStatus: 'SUCCESS',
      orderStatus: 'CONFIRMED',
      notes: mode === 'ai_image' ? 'Order from scanned image' : 'WhatsApp Order',
      trackingNumber: '',
      courierName: 'Professional Courier – Reduced Soil'
    });
    setShowWhatsAppOrderModal(true);
  };

  const handleAddItemRow = () => {
    const newItem = {
      productId: `custom-wa-${Date.now()}-${whatsAppOrderForm.items.length}`,
      sku: `PLANT-${whatsAppOrderForm.items.length + 1}`,
      name: '',
      tamilName: '',
      price: 0,
      mrp: 0,
      quantity: 1,
      image: '/products/double-delight.jpeg'
    };
    const updatedItems = [...whatsAppOrderForm.items, newItem];
    const newPlantsText = updatedItems
      .filter(it => it.name && it.name.trim())
      .map(it => `${it.quantity > 1 ? `${it.quantity}x ` : ''}${it.name}${it.price > 0 ? ` (₹${it.price})` : ''}`)
      .join('\n');
    setWhatsAppOrderForm(prev => ({
      ...prev,
      items: updatedItems,
      plantsText: newPlantsText || prev.plantsText
    }));
  };

  const handleUpdateItemRow = (index: number, field: string, value: any) => {
    const updatedItems = whatsAppOrderForm.items.map((item, idx) => {
      if (idx !== index) return item;
      return { ...item, [field]: value };
    });
    const newPlantsText = updatedItems
      .filter(it => it.name && it.name.trim())
      .map(it => `${it.quantity > 1 ? `${it.quantity}x ` : ''}${it.name}${it.price > 0 ? ` (₹${it.price})` : ''}`)
      .join('\n');
    setWhatsAppOrderForm(prev => ({
      ...prev,
      items: updatedItems,
      plantsText: newPlantsText || prev.plantsText
    }));
  };

  const handleRemoveItemRow = (index: number) => {
    const updatedItems = whatsAppOrderForm.items.filter((_, idx) => idx !== index);
    const newPlantsText = updatedItems
      .filter(it => it.name && it.name.trim())
      .map(it => `${it.quantity > 1 ? `${it.quantity}x ` : ''}${it.name}${it.price > 0 ? ` (₹${it.price})` : ''}`)
      .join('\n');
    setWhatsAppOrderForm(prev => ({
      ...prev,
      items: updatedItems,
      plantsText: newPlantsText
    }));
  };

  const handleRecalculateTotalFromItems = () => {
    const sum = (whatsAppOrderForm.items || []).reduce((acc, it) => acc + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
    if (sum > 0) {
      setWhatsAppOrderForm(prev => ({ ...prev, grandTotal: sum }));
      toast.success(`Grand total updated to ₹${sum}`, 'Total Updated');
    }
  };

  const handleAIExtractionSuccess = (data: ExtractedOrderData, imagePreviewUrl?: string) => {
    if (imagePreviewUrl) {
      setUploadedOrderImagePreview(imagePreviewUrl);
    }
    const mappedItems = (data.items && data.items.length > 0)
      ? data.items.map((it, idx) => ({
          productId: `custom-ai-${Date.now()}-${idx}`,
          sku: `PLANT-${idx + 1}`,
          name: it.name || `Plant ${idx + 1}`,
          tamilName: it.tamilName || it.name || `நர்சரி செடி ${idx + 1}`,
          price: Number(it.price) || 0,
          mrp: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1,
          image: '/products/double-delight.jpeg'
        }))
      : [];

    const computedPlantsText = mappedItems.length > 0
      ? mappedItems.map(it => `${it.quantity > 1 ? `${it.quantity}x ` : ''}${it.name}${it.price > 0 ? ` (₹${it.price})` : ''}`).join('\n')
      : (data.plantsText || '');

    const itemsSum = mappedItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    const computedTotal = Number(data.grandTotal) > 0
      ? Number(data.grandTotal)
      : (itemsSum > 0 ? itemsSum : 140);

    setWhatsAppOrderForm(prev => ({
      ...prev,
      customerName: data.customerName || prev.customerName,
      customerPhone: (data.customerPhone || prev.customerPhone).replace(/\D/g, '').slice(-10),
      customerEmail: data.customerEmail || prev.customerEmail,
      fullAddress: data.fullAddress || prev.fullAddress,
      houseNo: data.houseNo || prev.houseNo,
      street: data.street || data.fullAddress || prev.street,
      villageTown: data.villageTown || prev.villageTown,
      district: data.district || prev.district,
      state: data.state || prev.state || 'Tamil Nadu',
      pincode: data.pincode || prev.pincode,
      plantsText: computedPlantsText,
      items: mappedItems,
      grandTotal: computedTotal,
      courierName: data.courierName || prev.courierName || 'Professional Courier – Reduced Soil',
      paymentMethod: (data.paymentMethod as any) || prev.paymentMethod || 'WHATSAPP',
      paymentStatus: (data.paymentStatus as any) || 'SUCCESS',
      orderStatus: (data.orderStatus as any) || 'CONFIRMED',
      notes: data.notes || (imagePreviewUrl ? 'Scanned from image via Gemini AI' : prev.notes)
    }));

    toast.success('Order preview ready! Review and edit all fields before adding.', 'AI Extraction Complete');
  };

  // Open WhatsApp Order Modal for Editing an Existing Order
  const handleOpenEditOrder = (o: Order) => {
    setEditingOrder(o);
    const addr: any = typeof o.shippingAddress === 'object' && o.shippingAddress !== null
      ? o.shippingAddress
      : {};

    const plantsText = (o.items && o.items.length > 0)
      ? o.items.map(it => `${(it.quantity && it.quantity > 1) ? it.quantity + 'x ' : ''}${it.name || (it as any).productName || 'Plant'}`).join('\n')
      : '';

    const reconstructedAddress = addr.fullAddress || (
      typeof o.shippingAddress === 'string'
        ? o.shippingAddress
        : [addr.houseNo, addr.street, addr.villageTown, addr.district, addr.state, addr.pincode].filter(Boolean).join(', ')
    );

    setWhatsAppOrderForm({
      customerName: o.customerName || addr.fullName || '',
      customerPhone: o.customerPhone || addr.phone || '',
      customerEmail: o.customerEmail || '',
      fullAddress: reconstructedAddress,
      houseNo: addr.houseNo || '',
      street: addr.street || '',
      villageTown: addr.villageTown || '',
      district: addr.district || '',
      state: addr.state || 'Tamil Nadu',
      pincode: addr.pincode || '',
      plantsText: plantsText,
      items: o.items || [],
      deliveryFee: o.shippingCharge || 0,
      discount: o.discount || 0,
      grandTotal: o.grandTotal || 0,
      paymentMethod: (o.paymentMethod as any) || 'WHATSAPP',
      paymentStatus: o.paymentStatus || 'SUCCESS',
      orderStatus: o.orderStatus || 'CONFIRMED',
      notes: o.notes || '',
      trackingNumber: (o as any).trackingNumber || '',
      courierName: (o as any).courierName || 'Professional Courier – Reduced Soil'
    });
    setShowWhatsAppOrderModal(true);
  };

  // Handle Save WhatsApp / Offline Order (Create & Update)
  const handleSaveWhatsAppOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsAppOrderForm.customerName.trim() || !whatsAppOrderForm.customerPhone.trim()) {
      toast.error('Customer name and phone number are required', 'Validation Error');
      return;
    }

    // Parse the pasteable plants text (Strict newline splitting ONLY)
    const rawPlantsText = (whatsAppOrderForm.plantsText || '').trim();
    let parsedItems: any[] = [];

    const originalPlantsText = (editingOrder?.items && editingOrder.items.length > 0)
      ? editingOrder.items.map(it => `${(it.quantity && it.quantity > 1) ? it.quantity + 'x ' : ''}${it.name || (it as any).productName || 'Plant'}`).join('\n').trim()
      : '';

    // If editing existing order and plantsText was unchanged, keep authentic existing items snapshot!
    if (editingOrder && editingOrder.items && editingOrder.items.length > 0 && rawPlantsText === originalPlantsText) {
      parsedItems = editingOrder.items;
    } else if (whatsAppOrderForm.items && whatsAppOrderForm.items.length > 0) {
      parsedItems = whatsAppOrderForm.items.map((it, idx) => ({
        productId: it.productId || `custom-wa-${Date.now()}-${idx}`,
        sku: it.sku || `WA-${idx + 1}`,
        name: it.name || `Ordered Plant ${idx + 1}`,
        tamilName: it.tamilName || it.name || `நர்சரி செடி ${idx + 1}`,
        price: Number(it.price) || (Number(whatsAppOrderForm.grandTotal || 0) / (whatsAppOrderForm.items.length || 1)),
        mrp: Number(it.mrp || it.price) || (Number(whatsAppOrderForm.grandTotal || 0) / (whatsAppOrderForm.items.length || 1)),
        quantity: Number(it.quantity) || 1,
        image: it.image || '/products/double-delight.jpeg'
      }));
    } else if (rawPlantsText) {
      // Split STRICTLY on newlines (\n) - NEVER split on commas or semicolons!
      const lines = rawPlantsText.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
      parsedItems = lines.map((line, idx) => {
        let cleanName = line.replace(/^\d+[\.\)\-]\s*/, '').trim();
        let qty = 1;
        const match = cleanName.match(/^(\d+)\s*[xX*]\s*(.+)$/);
        if (match) {
          qty = parseInt(match[1], 10) || 1;
          cleanName = match[2].trim();
        }
        return {
          productId: `custom-wa-${Date.now()}-${idx}`,
          sku: `WA-${idx + 1}`,
          name: cleanName || `Ordered Plant ${idx + 1}`,
          tamilName: cleanName || `நர்சரி செடி ${idx + 1}`,
          price: Number(whatsAppOrderForm.grandTotal || 0) / (lines.length || 1),
          mrp: Number(whatsAppOrderForm.grandTotal || 0) / (lines.length || 1),
          quantity: qty,
          image: '/products/double-delight.jpeg'
        };
      });
    } else {
      parsedItems = [{
        productId: `custom-wa-${Date.now()}-0`,
        sku: 'WA-1',
        name: 'Ordered Plants (WhatsApp / Offline)',
        tamilName: 'நர்சரி செடிகள்',
        price: Number(whatsAppOrderForm.grandTotal || 0),
        mrp: Number(whatsAppOrderForm.grandTotal || 0),
        quantity: 1,
        image: '/products/double-delight.jpeg'
      }];
    }

    const finalTotal = Number(whatsAppOrderForm.grandTotal || 0);
    const rawAddress = (whatsAppOrderForm.fullAddress || '').trim();
    const pinMatch = rawAddress.match(/\b\d{6}\b/);
    const extractedPincode = pinMatch ? pinMatch[0] : (whatsAppOrderForm.pincode || '');

    const isFromImage = Boolean(uploadedOrderImagePreview || addOrderMode === 'ai_image');
    const payload = {
      customerName: whatsAppOrderForm.customerName.trim(),
      customerPhone: whatsAppOrderForm.customerPhone.trim(),
      customerEmail: whatsAppOrderForm.customerEmail.trim(),
      source: 'WHATSAPP',
      isWhatsApp: true,
      channel: 'WHATSAPP',
      uploadedByImage: isFromImage,
      entryMode: isFromImage ? 'image' : 'manual',
      paymentProofUrl: uploadedOrderImagePreview || undefined,
      orderImageUrl: uploadedOrderImagePreview || undefined,
      shippingAddress: {
        fullName: whatsAppOrderForm.customerName.trim(),
        phone: whatsAppOrderForm.customerPhone.trim(),
        fullAddress: rawAddress,
        houseNo: whatsAppOrderForm.houseNo || '',
        street: rawAddress,
        villageTown: whatsAppOrderForm.villageTown || '',
        district: whatsAppOrderForm.district || '',
        state: whatsAppOrderForm.state.trim() || 'Tamil Nadu',
        pincode: extractedPincode,
        addressType: 'Home' as const
      },
      items: parsedItems,
      subtotal: finalTotal,
      shippingCharge: 0,
      discount: 0,
      grandTotal: finalTotal,
      paymentMethod: whatsAppOrderForm.paymentMethod || 'WHATSAPP',
      paymentStatus: whatsAppOrderForm.paymentStatus || 'SUCCESS',
      orderStatus: whatsAppOrderForm.orderStatus || 'CONFIRMED',
      notes: whatsAppOrderForm.notes || (isFromImage ? 'Uploaded by Image (AI Extracted)' : ''),
      trackingNumber: whatsAppOrderForm.trackingNumber || '',
      courierName: whatsAppOrderForm.courierName || 'Professional Courier – Reduced Soil'
    };

    if (editingOrder) {
      const orderToEdit = editingOrder;
      const updatedOrder: Order = {
        ...orderToEdit,
        ...payload,
        updatedAt: new Date().toISOString()
      };

      pendingOrderUpdatesRef.current.set(orderToEdit.id, { order: updatedOrder, time: Date.now() });
      if (orderToEdit.merchantTransactionId) {
        pendingOrderUpdatesRef.current.set(orderToEdit.merchantTransactionId, { order: updatedOrder, time: Date.now() });
      }

      // 1. INSTANT 0ms Optimistic UI Update & Instant Modal Close
      setOrders(prev => {
        const updated = prev.map(o => o.id === orderToEdit.id ? updatedOrder : o);
        const keysToSave = ['veerika_admin_orders', 'vrg_user_orders', 'veerika_customer_orders', 'vrg_orders', 'vrg_my_orders'];
        keysToSave.forEach(key => {
          try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
        });
        persistAdminCache(c => ({ ...c, orders: updated }));
        try {
          const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
          cached.orders = updated;
          localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
        } catch {}
        return updated;
      });
      setShowWhatsAppOrderModal(false);
      setEditingOrder(null);
      toast.success(`Order #${orderToEdit.id} updated successfully!`, 'Order Saved');

      try {
        window.dispatchEvent(new CustomEvent('orderStatusUpdated', { detail: { orderId: orderToEdit.id } }));
      } catch {}

      // 2. Non-blocking Background API Sync
      (async () => {
        try {
          let res = await authFetch(`/api/admin/orders/${encodeURIComponent(orderToEdit.id)}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          }).catch(() => null);

          if (!res || !res.ok) {
            res = await authFetch('/api/admin/orders/update', {
              method: 'POST',
              body: JSON.stringify({ id: orderToEdit.id, ...payload })
            }).catch(() => null);
          }

          if (res && res.ok) {
            const data = await res.json().catch(() => ({}));
            if (data.order) {
              setOrders(prev => {
                const synced = prev.map(o => o.id === orderToEdit.id ? { ...o, ...data.order } : o);
                persistAdminCache(c => ({ ...c, orders: synced }));
                return synced;
              });
            }
          }
        } catch (syncErr) {
          console.warn('[Background Order Sync Error]:', syncErr);
        }
      })();
      return;
    }

    // Creating a brand new WhatsApp order
    setWhatsAppOrderSaving(true);
    try {
      const res = await authFetch('/api/admin/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrders(prev => {
          const updated = [data.order, ...prev];
          const keysToSave = ['veerika_admin_orders', 'vrg_user_orders', 'veerika_customer_orders', 'vrg_orders', 'vrg_my_orders'];
          keysToSave.forEach(key => {
            try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
          });
          persistAdminCache(c => ({ ...c, orders: updated }));
          try {
            const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
            cached.orders = updated;
            localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
          } catch {}
          return updated;
        });
        toast.success(`Order #${data.order.id} added as new order!`, 'Order Created');
        setShowWhatsAppOrderModal(false);
        setEditingOrder(null);
        setUploadedOrderImagePreview(null);
        try {
          window.dispatchEvent(new CustomEvent('orderStatusUpdated', { detail: { orderId: data.order.id } }));
        } catch {}
      } else {
        throw new Error(data.message || 'Failed to create WhatsApp order');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save order', 'Save Error');
    } finally {
      setWhatsAppOrderSaving(false);
    }
  };

  // Financial Log Action Handlers
  const handleOpenAddFinance = () => {
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
    setShowFinanceModal(true);
  };

  const handleOpenEditFinance = (f: FinancialEntry) => {
    setEditingFinance(f);
    setFinanceForm({
      type: (f.type as any) === 'SALE' ? 'SALE' : 'EXPENSE',
      title: f.title || '',
      category: f.category || 'Other',
      costAmount: f.costAmount || 0,
      sellAmount: f.sellAmount || 0,
      quantity: f.quantity || 1,
      notes: f.notes || '',
      date: f.date || new Date().toISOString().split('T')[0]
    });
    setShowFinanceModal(true);
  };

  const handleDeleteFinance = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this financial entry?')) return;
    setFinances(prev => prev.filter(f => f.id !== id));
    try {
      await authFetch(`/api/admin/finances/${id}`, { method: 'DELETE' });
      toast.success('Financial entry deleted', 'Entry Deleted');
    } catch (err) {
      console.error('Delete finance entry error:', err);
    }
  };

  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!financeForm.title.trim()) {
      toast.error('Title is required', 'Validation Error');
      return;
    }
    const isEdit = Boolean(editingFinance);
    const finId = editingFinance ? editingFinance.id : 'fin-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const fullEntry: FinancialEntry = {
      id: finId,
      type: financeForm.type,
      title: financeForm.title.trim(),
      category: financeForm.category,
      costAmount: Number(financeForm.costAmount) || 0,
      sellAmount: financeForm.type === 'SALE' ? (Number(financeForm.sellAmount) || 0) : 0,
      quantity: Number(financeForm.quantity) || 1,
      notes: financeForm.notes.trim(),
      date: financeForm.date || new Date().toISOString().split('T')[0],
      createdAt: editingFinance?.createdAt || new Date().toISOString()
    };

    if (isEdit) {
      setFinances(prev => prev.map(f => f.id === finId ? fullEntry : f));
    } else {
      setFinances(prev => [fullEntry, ...prev]);
    }

    setShowFinanceModal(false);
    setEditingFinance(null);
    toast.success(isEdit ? 'Financial entry updated' : 'Financial entry added', 'Finances Saved');

    try {
      const url = isEdit ? `/api/admin/finances/${finId}` : '/api/admin/finances';
      const method = isEdit ? 'PUT' : 'POST';
      await authFetch(url, { method, body: JSON.stringify(fullEntry) });
    } catch (err) {
      console.error('Save finance entry error:', err);
    }
  };

  const renderWhatsAppOrderModal = () => {
    if (!showWhatsAppOrderModal) return null;
    return (
      <>
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-800 to-teal-900 text-white">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-white/10 rounded-2xl text-xl backdrop-blur-md">
                  {editingOrder ? '✏️' : addOrderMode === 'ai_image' ? '📸' : '💬'}
                </span>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                    <span>
                      {editingOrder
                        ? `Edit Order #${editingOrder.id}`
                        : addOrderMode === 'ai_image'
                        ? 'Add New Order via Image (Gemini AI)'
                        : 'Add New Order (Manual Entry)'}
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-100/90 font-medium">
                    {editingOrder
                      ? 'Update order details, plant list & courier partner'
                      : addOrderMode === 'ai_image'
                      ? 'Upload local bill or chat photo → Gemini extracts details → Edit preview → Add as New Order'
                      : 'Enter customer contact, address & ordered plants manually'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowWhatsAppOrderModal(false);
                  setEditingOrder(null);
                  setUploadedOrderImagePreview(null);
                }}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs (Only for Creating New Orders) */}
            {!editingOrder && (
              <div className="px-4 sm:px-6 pt-3 pb-2 bg-slate-100/70 border-b border-slate-200/80">
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/80 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setAddOrderMode('manual')}
                    className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      addOrderMode === 'manual'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>✍️ Option 1: Manual Entry</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddOrderMode('ai_image')}
                    className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      addOrderMode === 'ai_image'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>📸 Option 2: Upload Image (Gemini AI)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Option 2 Initial State: AI Image Upload Uploader if no image uploaded yet */}
            {addOrderMode === 'ai_image' && !uploadedOrderImagePreview && !editingOrder ? (
              <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1 text-xs">
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-2xl shrink-0">📸</span>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-emerald-950 text-sm">
                      Upload Order Photo / Bill / WhatsApp Chat Screenshot
                    </h4>
                    <p className="text-xs text-emerald-800/90 leading-relaxed">
                      Select an image from your local computer or phone. Google Gemini AI will read and extract the customer name, phone number, doorstep address, pincode, ordered plants with quantities, and total amount.
                    </p>
                    <p className="text-[11px] text-emerald-700 font-bold">
                      💡 You will see a full Order Preview with complete edit options before adding as a new order!
                    </p>
                  </div>
                </div>

                <AIOrderImageUpload
                  onExtractionSuccess={handleAIExtractionSuccess}
                />
              </div>
            ) : (
              /* Order Form & Preview (Both Manual & AI Preview) */
              <form onSubmit={handleSaveWhatsAppOrder} className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1 text-xs">
                {/* AI Extracted Order Preview Card with Zoom */}
                {uploadedOrderImagePreview && (
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-300/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                          <Sparkles className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <span>Gemini AI Order Preview</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Extracted
                            </span>
                          </h4>
                          <p className="text-[11px] text-emerald-900 font-medium">
                            Review and edit all fields below. When satisfied, click <strong>"Add as New Order"</strong>.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedOrderImagePreview(null)}
                        className="text-xs font-bold text-slate-600 hover:text-emerald-700 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Upload Different Image</span>
                      </button>
                    </div>

                    {/* Image Thumbnail & Zoom Preview */}
                    <div className="flex items-center gap-3 bg-white/95 p-3 rounded-xl border border-emerald-200/80">
                      <div
                        onClick={() => setShowImageZoomModal(true)}
                        className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-300 cursor-pointer shrink-0 bg-slate-100 flex items-center justify-center shadow-2xs"
                        title="Click to zoom image in full screen"
                      >
                        <img
                          src={uploadedOrderImagePreview}
                          alt="Uploaded Order Document"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <ZoomIn className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs font-extrabold text-slate-900">
                          Uploaded Order Image / Bill
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Click the image thumbnail to inspect handwriting or chat screenshot at full resolution.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowImageZoomModal(true)}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>🔍 View Full Resolution Image</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1. Customer Name, Phone & Email */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Customer Contact Details *</span>
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500">Editable</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Nantha Kumar"
                        value={whatsAppOrderForm.customerName}
                        onChange={e => setWhatsAppOrderForm({ ...whatsAppOrderForm, customerName: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Phone No (10 digits) *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 font-bold text-slate-400">+91</span>
                        <input
                          type="tel"
                          required
                          placeholder="9344392517"
                          value={whatsAppOrderForm.customerPhone}
                          onChange={e => setWhatsAppOrderForm({ ...whatsAppOrderForm, customerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          className="w-full pl-11 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Email (Optional)</label>
                      <input
                        type="email"
                        placeholder="customer@gmail.com"
                        value={whatsAppOrderForm.customerEmail}
                        onChange={e => setWhatsAppOrderForm({ ...whatsAppOrderForm, customerEmail: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Full Delivery Address (Single Box) */}
                <div className="space-y-2.5 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      <span>Doorstep Delivery Address (for Shipping Label & Courier) *</span>
                    </h4>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      Editable Full Address
                    </span>
                  </div>
                  <textarea
                    required
                    rows={3}
                    placeholder={"Doorstep address:\ne.g. 4/12B, Perumal Kovil Street, Pennagaram Post, Dharmapuri - 636810, Tamil Nadu"}
                    value={whatsAppOrderForm.fullAddress}
                    onChange={e => {
                      const text = e.target.value;
                      const pinMatch = text.match(/\b\d{6}\b/);
                      setWhatsAppOrderForm({
                        ...whatsAppOrderForm,
                        fullAddress: text,
                        pincode: pinMatch ? pinMatch[0] : whatsAppOrderForm.pincode
                      });
                    }}
                    className="w-full p-3 bg-white border border-amber-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed text-xs"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-amber-950 block">Pincode</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="636810"
                        value={whatsAppOrderForm.pincode}
                        onChange={e => setWhatsAppOrderForm({ ...whatsAppOrderForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-bold text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-amber-950 block">District</label>
                      <input
                        type="text"
                        placeholder="Dharmapuri"
                        value={whatsAppOrderForm.district}
                        onChange={e => setWhatsAppOrderForm({ ...whatsAppOrderForm, district: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-bold text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-amber-950 block">State</label>
                      <input
                        type="text"
                        placeholder="Tamil Nadu"
                        value={whatsAppOrderForm.state}
                        onChange={e => setWhatsAppOrderForm({ ...whatsAppOrderForm, state: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-bold text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Ordered Plants & Items (Full Interactive Item Controls & Raw Text) */}
                <div className="space-y-3 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-300">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-black text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        Ordered Plants & Items
                        {whatsAppOrderForm.items && whatsAppOrderForm.items.length > 0
                          ? ` (${whatsAppOrderForm.items.length} items)`
                          : ''} *
                      </span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddItemRow}
                        className="text-[11px] font-extrabold text-emerald-800 bg-emerald-200/90 hover:bg-emerald-300 px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Plant Row</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Plant Rows */}
                  {whatsAppOrderForm.items && whatsAppOrderForm.items.length > 0 ? (
                    <div className="space-y-2">
                      {whatsAppOrderForm.items.map((item, idx) => (
                        <div
                          key={item.productId || idx}
                          className="bg-white p-3 rounded-xl border border-emerald-200/90 shadow-2xs flex flex-wrap sm:flex-nowrap items-center gap-2"
                        >
                          <span className="w-5 text-center font-bold text-slate-400 text-xs shrink-0">
                            {idx + 1}.
                          </span>

                          {/* Plant Name input */}
                          <div className="flex-1 min-w-[150px]">
                            <input
                              type="text"
                              required
                              placeholder="Plant name (e.g. Kashmiri Red Rose)"
                              value={item.name}
                              onChange={e => handleUpdateItemRow(idx, 'name', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Quantity with +/- */}
                          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 shrink-0">
                            <span className="text-[10px] font-bold text-slate-500">Qty:</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemRow(idx, 'quantity', Math.max(1, (Number(item.quantity) || 1) - 1))}
                              className="w-5 h-5 bg-white rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 cursor-pointer text-xs"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-black text-xs text-slate-900">
                              {item.quantity || 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemRow(idx, 'quantity', (Number(item.quantity) || 1) + 1)}
                              className="w-5 h-5 bg-white rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 cursor-pointer text-xs"
                            >
                              +
                            </button>
                          </div>

                          {/* Unit Price */}
                          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 shrink-0">
                            <span className="text-[10px] font-bold text-slate-500">₹</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="Price"
                              value={item.price || 0}
                              onChange={e => handleUpdateItemRow(idx, 'price', Number(e.target.value) || 0)}
                              className="w-16 px-1 py-0.5 bg-transparent font-bold text-xs text-slate-900 focus:outline-none text-right"
                            />
                          </div>

                          {/* Line Subtotal */}
                          <div className="w-20 text-right shrink-0">
                            <span className="text-[11px] font-black text-emerald-800">
                              ₹{(Number(item.price) || 0) * (Number(item.quantity) || 1)}
                            </span>
                          </div>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                            title="Remove plant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Helper Row: Recalculate Total and Toggle Raw Text */}
                      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleRecalculateTotalFromItems}
                          className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>
                            ⚡ Set Grand Total to sum of items (₹
                            {whatsAppOrderForm.items.reduce(
                              (s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1),
                              0
                            )}
                            )
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPlantsTextToggle(!showPlantsTextToggle)}
                          className="text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          {showPlantsTextToggle ? '▲ Hide Raw Text' : '▼ View / Edit Raw WhatsApp Text'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Fallback Textarea if no structured items added yet */
                    <div className="space-y-2">
                      <textarea
                        required
                        rows={4}
                        placeholder={"Paste or type plant names here (separated by new line):\ne.g.\n1. 7 Days Yellow Rose - 2 Nos\n2. Special Yellow Button Rose\n3. Kashmiri Scented Red Rose"}
                        value={whatsAppOrderForm.plantsText}
                        onChange={e => setWhatsAppOrderForm({ ...whatsAppOrderForm, plantsText: e.target.value })}
                        className="w-full p-3 bg-white border border-emerald-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed text-xs"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-[10.5px] text-emerald-900 font-medium">
                          💡 Type or paste plant names directly.
                        </p>
                        <button
                          type="button"
                          onClick={handleAddItemRow}
                          className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Switch to Structured Plant Items</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Optional Raw Textarea Sync */}
                  {showPlantsTextToggle && whatsAppOrderForm.items && whatsAppOrderForm.items.length > 0 && (
                    <div className="pt-2">
                      <label className="text-[10.5px] font-bold text-emerald-950 block mb-1">
                        Raw Plants Text (WhatsApp Format)
                      </label>
                      <textarea
                        rows={3}
                        value={whatsAppOrderForm.plantsText}
                        onChange={e => setWhatsAppOrderForm({ ...whatsAppOrderForm, plantsText: e.target.value })}
                        className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-mono text-xs text-slate-800 focus:outline-none"
                        placeholder="Raw plants text"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Price & Courier Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="bg-emerald-100/70 p-3 rounded-xl border border-emerald-300">
                    <label className="font-black text-emerald-950 block mb-1 text-xs flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Price / Amount Received (₹) *</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 font-black text-emerald-900 text-sm">₹</span>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="140"
                        value={whatsAppOrderForm.grandTotal}
                        onChange={e => setWhatsAppOrderForm({ ...whatsAppOrderForm, grandTotal: Number(e.target.value) || 0 })}
                        className="w-full pl-8 pr-3 py-2 bg-white border-2 border-emerald-500 rounded-xl font-black text-base text-emerald-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200">
                    <label className="font-black text-blue-950 block mb-1 text-xs flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-blue-700" />
                      <span>Courier Partner *</span>
                    </label>
                    <select
                      value={whatsAppOrderForm.courierName}
                      onChange={e => setWhatsAppOrderForm({ ...whatsAppOrderForm, courierName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl font-bold text-slate-900 focus:outline-none text-xs"
                    >
                      <option value="Professional Courier – Reduced Soil">
                        🚚 Professional Courier – Reduced Soil (Doorstep Delivery)
                      </option>
                      <option value="Professional Courier – Full Soil">
                        🌱 Professional Courier – Full Soil (Tamil Nadu Only)
                      </option>
                      <option value="Mettur Parcel Service (MSS)">
                        📦 Mettur Parcel Service / MSS (Branch Pickup Depot)
                      </option>
                    </select>
                  </div>
                </div>

                {/* 5. Payment Method & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                    <select
                      value={whatsAppOrderForm.paymentMethod}
                      onChange={e => setWhatsAppOrderForm({ ...whatsAppOrderForm, paymentMethod: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none text-xs"
                    >
                      <option value="WHATSAPP">💬 WhatsApp Direct</option>
                      <option value="UPI">📱 UPI</option>
                      <option value="GPAY">Google Pay</option>
                      <option value="PHONEPE">PhonePe</option>
                      <option value="COD">💵 Cash On Delivery</option>
                      <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Payment Status</label>
                    <select
                      value={whatsAppOrderForm.paymentStatus}
                      onChange={e => setWhatsAppOrderForm({ ...whatsAppOrderForm, paymentStatus: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none text-xs"
                    >
                      <option value="SUCCESS">✅ Paid (Success)</option>
                      <option value="PENDING">⏳ Payment Pending</option>
                      <option value="FAILED">❌ Failed</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Order Status</label>
                    <select
                      value={whatsAppOrderForm.orderStatus}
                      onChange={e => setWhatsAppOrderForm({ ...whatsAppOrderForm, orderStatus: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none text-xs"
                    >
                      <option value="CONFIRMED">📦 Confirmed (Ready to Pack)</option>
                      <option value="PACKED">📦 Packed</option>
                      <option value="SHIPPED">🚚 Shipped</option>
                      <option value="DELIVERED">🎉 Delivered</option>
                    </select>
                  </div>
                </div>

                {/* 6. Admin Order Notes */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Internal Notes / Special Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Scanned bill #42, extra moist packing requested"
                    value={whatsAppOrderForm.notes}
                    onChange={e => setWhatsAppOrderForm({ ...whatsAppOrderForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Modal Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWhatsAppOrderModal(false);
                      setEditingOrder(null);
                      setUploadedOrderImagePreview(null);
                    }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={whatsAppOrderSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all hover:scale-102 active:scale-98 disabled:opacity-50 flex items-center gap-2"
                  >
                    {whatsAppOrderSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Order...</span>
                      </>
                    ) : editingOrder ? (
                      <>
                        <span>💾 Update Order</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>➕ Add as New Order</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Full Image Zoom Modal */}
        {showImageZoomModal && uploadedOrderImagePreview && (
          <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="max-w-4xl w-full max-h-[90vh] flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
              <div className="p-3 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
                <span className="font-bold text-xs flex items-center gap-2">
                  <ZoomIn className="w-4 h-4 text-emerald-400" />
                  <span>Original Uploaded Order Image (Full Resolution)</span>
                </span>
                <button
                  onClick={() => setShowImageZoomModal(false)}
                  className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
                <img
                  src={uploadedOrderImagePreview}
                  alt="Full resolution uploaded order"
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  };


  if (adminLayoutMode === 'mobile_workflow') {
    return (
      <div className="relative min-h-screen bg-slate-50">
        {/* Switcher bar on top for desktop view testing */}
        <div className="hidden lg:flex items-center justify-between bg-slate-900 text-white px-6 py-2.5 text-xs shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">📱 VRG Nursery Mobile Redesign Mode (12-Step Order Workflow)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAdminLayoutMode('desktop_full')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Monitor className="w-4 h-4 text-slate-400" />
              <span>Switch to Desktop View</span>
            </button>
            <button
              onClick={onBackToStore}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
            >
              Exit to Store
            </button>
          </div>
        </div>

        <MobileAdminWorkflow
          orders={orders}
          products={products}
          categories={categories}
          reviews={reviews}
          combos={combos}
          coupons={coupons}
          banners={banners}
          settings={settings}
          finances={finances}
          adminUser={adminUser}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onToggleOrderPrinted={handleToggleOrderPrinted}
          onOpenAddWhatsAppOrder={handleOpenAddWhatsAppOrder}
          onOpenEditOrder={handleOpenEditOrder}
          onDeleteOrder={handleDeleteOrder}
          onSaveTracking={async (orderId, data) => {
            pendingOrderStatusRef.current.set(orderId, {
              status: 'DISPATCHED',
              courierName: data.courierName,
              trackingNumber: data.trackingNumber,
              time: Date.now()
            });

            setOrders(prev => {
              const updated = prev.map(o => o.id === orderId ? {
                ...o,
                orderStatus: 'DISPATCHED' as const,
                courierName: data.courierName,
                trackingNumber: data.trackingNumber,
                deliveryNotes: data.trackingLink,
                updatedAt: new Date().toISOString()
              } : o);
              const keysToSave = ['veerika_admin_orders', 'vrg_user_orders', 'veerika_customer_orders', 'vrg_orders', 'vrg_my_orders'];
              keysToSave.forEach(key => {
                try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
              });
              persistAdminCache(c => ({ ...c, orders: updated }));
              try {
                const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                cached.orders = updated;
                localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
              } catch {}
              return updated;
            });

            try {
              window.dispatchEvent(new CustomEvent('orderStatusUpdated', { detail: { orderId, status: 'DISPATCHED' } }));
            } catch {}

            try {
              authFetch(`/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({
                  orderStatus: 'DISPATCHED',
                  courierName: data.courierName,
                  trackingNumber: data.trackingNumber,
                  deliveryNotes: data.trackingLink
                })
              }).catch(() => null);
            } catch {}
          }}
          onSaveProduct={async (prod) => {
            const targetId = prod.id;
            const isEdit = Boolean(targetId);
            const autoSku = prod.sku ||
              `VRG-${(prod.name || 'PLANT').replace(/\s+/g, '-').toUpperCase().slice(0, 12)}-${Date.now().toString(36).toUpperCase()}`;
            const mrp = Number(prod.mrp) || Number(prod.sellingPrice) || 0;
            const sellingPrice = Number(prod.sellingPrice) || 0;
            const autoDiscount = mrp > 0 ? Math.max(0, Math.round(((mrp - sellingPrice) / mrp) * 100)) : 0;
            const discountVal = (prod.discount !== undefined && prod.discount !== null && !isNaN(Number(prod.discount)))
              ? Number(prod.discount)
              : autoDiscount;
            const validImages = Array.isArray(prod.images) && prod.images.filter(Boolean).length
              ? prod.images.filter(Boolean)
              : (prod.imageUrl ? [prod.imageUrl] : ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80']);

            const payload: any = {
              sku: autoSku,
              name: prod.name?.trim() || '',
              englishName: prod.englishName?.trim() || prod.name?.trim() || '',
              tamilName: prod.tamilName?.trim() || prod.name?.trim() || '',
              scientificName: prod.scientificName?.trim() || '',
              categoryId: prod.categoryId || categories[0]?.id || 'cat-rose',
              categoryName: prod.categoryName || categories.find(c => c.id === prod.categoryId)?.name || 'Roses',
              description: prod.description?.trim() || prod.name?.trim() || '',
              mrp: mrp > 0 ? mrp : sellingPrice,
              sellingPrice,
              discount: discountVal,
              stock: Number(prod.stock) >= 0 ? Number(prod.stock) : 25,
              plantHeight: prod.plantHeight || '1–2 Feet',
              potSize: prod.potSize || '8 Inch Bag',
              sunlight: prod.sunlight || 'Full Sun',
              waterRequirement: prod.waterRequirement || 'Daily',
              floweringSeason: prod.floweringSeason || 'All Year',
              careInstructions: prod.careInstructions || {
                watering: 'Water daily in the morning.',
                sunlight: 'Requires 5 hours direct sunlight.',
                fertilizer: 'Apply vermicompost every 15 days.',
                soil: 'Red soil mixed with coco peat.'
              },
              images: validImages,
              featured: prod.featured ?? false,
              bestSeller: prod.bestSeller ?? false,
              trending: prod.trending ?? false,
              tags: prod.tags?.length ? prod.tags : [prod.categoryName || 'Plant'],
              status: prod.status || 'ACTIVE'
            };

            const tempId = targetId || ('prod-' + Date.now());
            const optimisticProd: Product = {
              ...payload,
              id: tempId,
              rating: prod.rating || 5.0,
              reviewCount: prod.reviewCount || 0,
              createdAt: prod.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            } as Product;

            // 1. Instant UI & Session Update (0ms)
            let updatedList: Product[] = [];
            setProducts(prev => {
              const next = isEdit
                ? prev.map(p => (p.id === targetId || (p.sku && p.sku === payload.sku)) ? { ...p, ...optimisticProd } : p)
                : [{ ...optimisticProd }, ...prev.filter(p => p.id !== tempId && p.sku !== payload.sku)];
              updatedList = next;
              persistAdminCache(c => ({ ...c, products: next }));
              try {
                localStorage.setItem('vrg_products', JSON.stringify(next));
                const deletedSet = new Set(JSON.parse(localStorage.getItem('vrg_deleted_products') || '[]'));
                deletedSet.delete(tempId);
                if (payload.sku) deletedSet.delete(payload.sku);
                localStorage.setItem('vrg_deleted_products', JSON.stringify(Array.from(deletedSet)));
              } catch {}
              return next;
            });

            savePendingProductToSession(optimisticProd);
            pendingProductsRef.current.set(tempId, { product: optimisticProd, savedAt: Date.now() });
            if (payload.sku) {
              pendingProductsRef.current.set(payload.sku, { product: optimisticProd, savedAt: Date.now() });
            }

            try {
              window.dispatchEvent(new CustomEvent('vrg_products_updated', { detail: updatedList }));
            } catch {}

            // 2. Non-blocking Background Persistence
            const url = isEdit ? `/api/products/${encodeURIComponent(targetId)}` : '/api/products';
            const method = isEdit ? 'PUT' : 'POST';

            authFetch(url, {
              method,
              body: JSON.stringify(payload)
            })
              .then(async r => {
                const data = await r.json().catch(() => null);
                if (data?.success && data?.product) {
                  const serverProd = data.product;
                  if (tempId !== serverProd.id) {
                    clearPendingProductFromSession(tempId);
                    pendingProductsRef.current.delete(tempId);
                  }
                  savePendingProductToSession(serverProd);
                  pendingProductsRef.current.set(serverProd.id, { product: serverProd, savedAt: Date.now() });
                  if (serverProd.sku) {
                    pendingProductsRef.current.set(serverProd.sku, { product: serverProd, savedAt: Date.now() });
                  }
                  let nextList: Product[] = [];
                  setProducts(prev => {
                    const next = prev.map(p => (p.id === targetId || p.id === tempId || p.id === serverProd.id || (serverProd.sku && p.sku === serverProd.sku)) ? { ...p, ...serverProd } : p);
                    nextList = next;
                    persistAdminCache(c => ({ ...c, products: next }));
                    try {
                      localStorage.setItem('vrg_products', JSON.stringify(next));
                    } catch {}
                    return next;
                  });
                  try {
                    window.dispatchEvent(new CustomEvent('vrg_products_updated', { detail: nextList }));
                  } catch {}
                }
              })
              .catch(e => {
                console.warn('Background product save notice:', e);
              });
          }}
          onDeleteProduct={handleDeleteProduct}
          onSaveCategory={async (cat) => {
            const isEdit = Boolean(cat.id);
            const catId = cat.id || 'cat-' + Date.now();
            const catItem: Category = {
              id: catId,
              name: cat.name,
              tamilName: cat.tamilName || cat.name,
              slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              image: cat.image || '',
              description: cat.description || '',
              order: cat.order || categories.length + 1,
              isActive: cat.isActive !== false,
              isFeatured: Boolean(cat.isFeatured),
              productCount: 0
            };

            if (isEdit) {
              setCategories(prev => {
                const next = prev.map(c => c.id === catId ? { ...c, ...catItem } : c);
                try {
                  const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                  cached.categories = next;
                  localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                } catch {}
                return next;
              });
            } else {
              setCategories(prev => {
                const next = [catItem, ...prev];
                try {
                  const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                  cached.categories = next;
                  localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                } catch {}
                return next;
              });
            }

            try {
              const url = isEdit ? `/api/admin/categories/${catId}` : '/api/admin/categories';
              const method = isEdit ? 'PUT' : 'POST';
              const res = await authFetch(url, { method, body: JSON.stringify(catItem) });
              const data = await res.json().catch(() => null);
              if (data && data.category) {
                setCategories(prev => {
                  const next = prev.map(c => (c.id === data.category.id || c.id === catId) ? { ...c, ...data.category } : c);
                  try {
                    const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                    cached.categories = next;
                    localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                  } catch {}
                  return next;
                });
              }
              window.dispatchEvent(new CustomEvent('vrg_categories_updated'));
            } catch (e) {
              console.warn('Background category save notice:', e);
            }
          }}
          onDeleteCategory={handleDeleteCategory}
          onSaveReview={saveReviewsState ? (rev) => {
            const updated = [rev, ...reviews.filter(r => r.id !== rev.id)];
            saveReviewsState(updated);
          } : undefined}
          onDeleteReview={handleDeleteReview}
          onSaveCoupon={async (cp) => {
            const isEdit = Boolean(cp.id);
            const cpId = cp.id || cp.code || 'cp-' + Date.now();
            const cpItem: Coupon = {
              id: cpId,
              code: cp.code.toUpperCase(),
              type: cp.type || (cp as any).discountType === 'FLAT' ? 'FIXED' : 'PERCENT',
              value: Number(cp.value || (cp as any).discountValue || 10),
              minOrder: Number(cp.minOrder || (cp as any).minOrderAmount || 0),
              maxDiscount: (cp as any).maxDiscount ? Number((cp as any).maxDiscount) : undefined,
              expiryDate: cp.expiryDate || '2027-12-31',
              active: cp.active !== false,
              usageCount: 0
            };

            if (isEdit) {
              setCoupons(prev => {
                const next = prev.map(c => (c.id === cpId || c.code === cpItem.code) ? { ...c, ...cpItem } : c);
                try {
                  const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                  cached.coupons = next;
                  localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                } catch {}
                return next;
              });
            } else {
              setCoupons(prev => {
                const next = [cpItem, ...prev];
                try {
                  const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                  cached.coupons = next;
                  localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                } catch {}
                return next;
              });
            }

            const url = isEdit ? `/api/admin/coupons/${cpId}` : '/api/coupons';
            const method = isEdit ? 'PUT' : 'POST';
            authFetch(url, { method, body: JSON.stringify(cpItem) })
              .then(async res => {
                const data = await res.json().catch(() => null);
                if (data && data.coupon) {
                  setCoupons(prev => prev.map(c => (c.id === data.coupon.id || c.code === cpItem.code) ? { ...c, ...data.coupon } : c));
                }
              })
              .catch(e => console.warn('Background coupon save notice:', e));
          }}
          onDeleteCoupon={async (id) => {
            if (!confirm('Are you sure you want to delete this coupon?')) return;
            const targetId = String(id);
            setCoupons(prev => {
              const next = prev.filter(c => c.id !== targetId && c.code !== targetId);
              try {
                const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                cached.coupons = next;
                localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
              } catch {}
              return next;
            });
            const delSet = new Set(JSON.parse(localStorage.getItem('vrg_deleted_coupons') || '[]'));
            delSet.add(targetId);
            delSet.add(targetId.toUpperCase());
            localStorage.setItem('vrg_deleted_coupons', JSON.stringify([...delSet]));

            try {
              await authFetch(`/api/coupons/${encodeURIComponent(targetId)}`, { method: 'DELETE' }).catch(() => null);
              await authFetch('/api/coupons/delete', { method: 'POST', body: JSON.stringify({ id: targetId }) }).catch(() => null);
            } catch (e) {
              console.error('Delete coupon error:', e);
            }
          }}
          onSaveCombo={async (comboData) => {
            const isEdit = Boolean(comboData.id);
            const url = isEdit ? `/api/admin/combos/${comboData.id}` : '/api/admin/combos';
            const method = isEdit ? 'PUT' : 'POST';

            // Remove from deleted set if creating/updating
            try {
              const deleted = JSON.parse(localStorage.getItem('vrg_deleted_combos') || '[]');
              const filtered = deleted.filter((delId: string) => delId !== comboData.id);
              localStorage.setItem('vrg_deleted_combos', JSON.stringify(filtered));
            } catch {}

            // Map products list for instant display
            const prodMap = new Map(products.map(p => [p.id, p]));
            const matchedProds = (comboData.productIds || []).map((pid: string) => prodMap.get(pid)).filter(Boolean) as Product[];
            const tempId = comboData.id || 'combo-' + Date.now();
            const fullComboItem = {
              ...comboData,
              products: matchedProds,
              id: tempId
            };

            if (isEdit) {
              setCombos(prev => {
                const next = prev.map(c => c.id === comboData.id ? { ...c, ...fullComboItem } : c);
                persistAdminCache(c => ({ ...c, combos: next }));
                try {
                  const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                  cached.combos = next;
                  localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                  localStorage.setItem('vrg_combos_cache', JSON.stringify(next));
                } catch {}
                return next;
              });
            } else {
              setCombos(prev => {
                const next = [fullComboItem, ...prev];
                persistAdminCache(c => ({ ...c, combos: next }));
                try {
                  const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                  cached.combos = next;
                  localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                  localStorage.setItem('vrg_combos_cache', JSON.stringify(next));
                } catch {}
                return next;
              });
            }

            try {
              const res = await authFetch(url, { method, body: JSON.stringify(comboData) });
              const data = await res.json().catch(() => null);
              if (data && data.success && data.combo) {
                // Clear from deleted set just in case
                try {
                  const deleted = JSON.parse(localStorage.getItem('vrg_deleted_combos') || '[]');
                  const filtered = deleted.filter((delId: string) => delId !== data.combo.id && delId !== tempId);
                  localStorage.setItem('vrg_deleted_combos', JSON.stringify(filtered));
                } catch {}

                setCombos(prev => {
                  const next = prev.map(c => (c.id === tempId || c.id === data.combo.id || c.id === comboData.id) ? { ...c, ...data.combo } : c);
                  persistAdminCache(c => ({ ...c, combos: next }));
                  try {
                    const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                    cached.combos = next;
                    localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                    localStorage.setItem('vrg_combos_cache', JSON.stringify(next));
                  } catch {}
                  return next;
                });
              }
              window.dispatchEvent(new CustomEvent('vrg_combos_updated'));
            } catch (e: any) {
              console.error('Error in onSaveCombo:', e);
              throw e;
            }
          }}
          onDeleteCombo={async (id) => {
            if (!confirm('Are you sure you want to delete this combo offer?')) return;

            // 1. Record in local deleted set immediately
            try {
              const deleted = JSON.parse(localStorage.getItem('vrg_deleted_combos') || '[]');
              if (!deleted.includes(id)) {
                deleted.push(id);
                localStorage.setItem('vrg_deleted_combos', JSON.stringify(deleted));
              }
            } catch {}

            // 2. Instant 0ms optimistic UI & cache removal
            setCombos(prev => {
              const next = prev.filter(c => c.id !== id);
              persistAdminCache(c => ({ ...c, combos: next }));
              try {
                const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                cached.combos = next;
                localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                localStorage.setItem('vrg_combos_cache', JSON.stringify(next));
              } catch {}
              return next;
            });

            // 3. Instant 0ms event dispatch across tabs & components
            window.dispatchEvent(new CustomEvent('vrg_combos_updated'));

            // 4. Non-blocking async backend deletion
            authFetch(`/api/admin/combos/${id}`, { method: 'DELETE' }).catch(e => {
              console.error('Background combo delete error:', e);
            });
          }}
          onSaveFinance={async (fnData) => {
            const isEdit = Boolean(fnData.id);
            const fnId = fnData.id || 'fn-' + Date.now();
            const fullItem: FinancialEntry = {
              id: fnId,
              ...fnData,
              createdAt: fnData.createdAt || new Date().toISOString()
            };

            if (isEdit) {
              setFinances(prev => {
                const next = prev.map(f => f.id === fnId ? fullItem : f);
                try {
                  const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                  cached.finances = next;
                  localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                } catch {}
                return next;
              });
            } else {
              setFinances(prev => {
                const next = [fullItem, ...prev];
                try {
                  const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                  cached.finances = next;
                  localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                } catch {}
                return next;
              });
            }

            const url = isEdit ? `/api/admin/finances/${fnId}` : '/api/admin/finances';
            const method = isEdit ? 'PUT' : 'POST';
            authFetch(url, { method, body: JSON.stringify(fullItem) })
              .then(async res => {
                const data = await res.json().catch(() => null);
                if (data && data.entry) {
                  setFinances(prev => prev.map(f => f.id === data.entry.id ? data.entry : f));
                }
              })
              .catch(e => console.warn('Background finance save notice:', e));
          }}
          onDeleteFinance={handleDeleteFinance}
          onSaveBanner={async (bData) => {
            const isEdit = Boolean(bData.id);
            const bId = bData.id || 'banner-' + Date.now();
            const fullItem: Banner = {
              id: bId,
              title: bData.title,
              subtitle: bData.subtitle || '',
              imageUrl: bData.imageUrl,
              targetCategory: bData.targetCategory || '',
              active: bData.active !== false,
              order: Number(bData.order || 1)
            };

            if (isEdit) {
              setBanners(prev => {
                const next = prev.map(b => b.id === bId ? fullItem : b);
                try {
                  const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                  cached.banners = next;
                  localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                } catch {}
                return next;
              });
            } else {
              setBanners(prev => {
                const next = [fullItem, ...prev];
                try {
                  const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                  cached.banners = next;
                  localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                } catch {}
                return next;
              });
            }

            try {
              const url = isEdit ? `/api/admin/banners/${bId}` : '/api/admin/banners';
              const method = isEdit ? 'PUT' : 'POST';
              const res = await authFetch(url, { method, body: JSON.stringify(fullItem) });
              const data = await res.json().catch(() => null);
              if (data && data.banner) {
                setBanners(prev => {
                  const next = prev.map(b => b.id === data.banner.id ? data.banner : b);
                  try {
                    const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                    cached.banners = next;
                    localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                  } catch {}
                  return next;
                });
              }
            } catch (e) {
              console.warn('Background banner save notice:', e);
            }
          }}
          onDeleteBanner={async (id) => {
            if (!confirm('Are you sure you want to delete this banner?')) return;
            const targetId = String(id);
            setBanners(prev => {
              const next = prev.filter(b => b.id !== targetId);
              try {
                const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                cached.banners = next;
                localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
              } catch {}
              return next;
            });
            try {
              await authFetch(`/api/admin/banners/${targetId}`, { method: 'DELETE' });
            } catch (e) {
              console.error(e);
            }
          }}
          onSaveSettings={async (st) => {
            setSettings(st);
            try {
              const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
              cached.settings = st;
              localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
            } catch {}

            authFetch('/api/admin/settings', { method: 'POST', body: JSON.stringify(st) })
              .then(async res => {
                const data = await res.json().catch(() => null);
                if (data && data.settings) {
                  setSettings(data.settings);
                }
              })
              .catch(e => console.warn('Background settings save notice:', e));
          }}
          onBackToStore={onBackToStore}
          onOpenDesktopTab={(tabKey) => {
            setActiveTab(tabKey as any);
            setAdminLayoutMode('desktop_full');
          }}
          onLogout={() => {
            sessionStorage.removeItem('vrg_admin_session_cache');
            localStorage.removeItem('vrg_user');
            localStorage.removeItem('vrg_admin_email');
            localStorage.removeItem('vrg_admin_role');
            onBackToStore();
          }}
        />
        {renderWhatsAppOrderModal()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-12">
      {/* Clean Minimal Top Admin Header */}
      <header className="bg-white border-b border-slate-200/90 px-4 py-3 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
            <Sprout className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-wider text-emerald-900 uppercase">
                VRG NURSERY
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-full">
                {activeTab}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAddWhatsAppOrder('manual')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            title="Create new order manually"
          >
            <span>✍️</span>
            <span>+ Add Order</span>
          </button>
          <button
            onClick={() => handleOpenAddWhatsAppOrder('ai_image')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 border border-emerald-400/40"
            title="Upload bill or WhatsApp screenshot to auto-extract with Gemini AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>📸 AI Scan Order</span>
          </button>

          <button
            onClick={() => setAdminLayoutMode('mobile_workflow')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer"
            title="Switch to Mobile 12-Step Order Workflow"
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>Order Pipeline</span>
          </button>

          <button
            onClick={() => setShowAdminMenuDrawer(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            aria-label="Open menu"
            title="Open Admin Menu"
          >
            <Menu className="w-5 h-5 text-slate-800" />
          </button>
        </div>
      </header>

      {/* Slide-over Drawer Menu for Full Store Modules */}
      {showAdminMenuDrawer && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setShowAdminMenuDrawer(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Content */}
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
                onClick={() => setShowAdminMenuDrawer(false)}
                className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Admin User Info */}
            <div className="p-4 bg-emerald-950 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center font-black text-sm">
                {adminUser?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{adminUser?.name || 'Admin'}</p>
                <p className="text-[10px] text-emerald-300 truncate">{adminUser?.email || 'admin@vrgnursery.com'}</p>
              </div>
            </div>

            {/* Menu Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-bold">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
                Order Workflow
              </div>
              <button
                onClick={() => {
                  setAdminLayoutMode('mobile_workflow');
                  setShowAdminMenuDrawer(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-900 font-extrabold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <Sprout className="w-4 h-4 text-emerald-700" />
                <span>📱 12-Step Order Pipeline</span>
              </button>

              <div className="px-3 pt-3 pb-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
                Nursery Catalog & Management
              </div>

              {[
                { key: 'products', label: `Products (${products.length})`, icon: <Package className="w-4 h-4" /> },
                { key: 'categories', label: `Categories (${categories.length})`, icon: <FolderTree className="w-4 h-4" /> },
                { key: 'orders', label: `All Orders (${orders.length})`, icon: <ShoppingBag className="w-4 h-4" /> },
                { key: 'payment_logs', label: `Payment Gateway Logs (${paymentLogs.length})`, icon: <CreditCard className="w-4 h-4 text-indigo-600" /> },
                { key: 'inventory', label: 'Inventory & Stock Alerts', icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
                { key: 'coupons', label: 'Discount Coupons', icon: <Tag className="w-4 h-4" /> },
                { key: 'banners', label: 'Homepage Banners', icon: <Image className="w-4 h-4" /> },
                { key: 'reviews', label: `Customer Reviews (${reviews.length})`, icon: <Star className="w-4 h-4 text-amber-500" /> },
                { key: 'finances', label: 'Profit & Loss Finances', icon: <DollarSign className="w-4 h-4 text-emerald-600" /> },
                { key: 'settings', label: 'Store & Payment Settings', icon: <SettingsIcon className="w-4 h-4" /> },
                { key: 'audit', label: 'Security & Audit Logs', icon: <ShieldCheck className="w-4 h-4" /> },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key as any);
                    setShowAdminMenuDrawer(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                    activeTab === item.key
                      ? 'bg-[#14532d] text-white font-extrabold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-1.5">
              <button
                onClick={onBackToStore}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Return to Public Store</span>
              </button>

              <button
                onClick={() => {
                  sessionStorage.removeItem('vrg_admin_session_cache');
                  localStorage.removeItem('vrg_user');
                  localStorage.removeItem('vrg_admin_email');
                  localStorage.removeItem('vrg_admin_role');
                  onBackToStore();
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

      <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Navigation Sidebar (Desktop) */}
        <div className="hidden lg:flex bg-white p-3 rounded-3xl border border-slate-200/80 shadow-2xs text-xs font-bold lg:col-span-1 h-fit flex-col gap-1">
          {[
            { key: 'dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
            { key: 'products', icon: <Package className="w-4 h-4" />, label: `Products (${products.length})` },
            { key: 'orders', icon: <ShoppingBag className="w-4 h-4" />, label: `Orders (${orders.length})` },
            { key: 'payment_logs', icon: <CreditCard className="w-4 h-4 text-indigo-600" />, label: `Payment Logs (${paymentLogs.length})` },
            { key: 'categories', icon: <FolderTree className="w-4 h-4" />, label: 'Categories' },
            { key: 'inventory', icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, label: 'Inventory' },
            { key: 'coupons', icon: <Tag className="w-4 h-4" />, label: 'Coupons' },
            { key: 'reviews', icon: <Star className="w-4 h-4 text-amber-500 fill-amber-500" />, label: `Reviews (${reviews.length})` },
            { key: 'finances', icon: <DollarSign className="w-4 h-4 text-emerald-500" />, label: 'Expenses & Profit' },
            { key: 'settings', icon: <SettingsIcon className="w-4 h-4" />, label: 'Settings' },
            { key: 'audit', icon: <ShieldCheck className="w-4 h-4 text-purple-600" />, label: 'Audit Logs' },

          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`shrink-0 p-2.5 rounded-xl text-left flex items-center gap-2 transition-colors whitespace-nowrap lg:w-full ${
                activeTab === key ? 'bg-emerald-800 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {icon}
              <span className="inline-block">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Views Content */}
        <div className="lg:col-span-4 space-y-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (() => {
            const paidOrders = orders.filter(o => {
              const pStatus = (o.paymentStatus || '').toString().toUpperCase();
              const oStatus = (o.orderStatus || '').toString().toUpperCase();
              return pStatus === 'SUCCESS' || pStatus === 'PAID' || pStatus === 'APPROVED' || oStatus === 'DELIVERED' || oStatus === 'COMPLETED';
            });
            const calculatedTotalRev = paidOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
            const realTotalRevenue = stats?.totalRevenue && stats.totalRevenue > 0
              ? stats.totalRevenue
              : calculatedTotalRev;

            const calculatedTodaySales = paidOrders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((sum, o) => sum + (o.grandTotal || 0), 0);
            const realTodaySales = stats?.todaySales && stats.todaySales > 0
              ? stats.todaySales
              : calculatedTodaySales;

            const realPendingOrders = stats?.pendingOrders !== undefined && stats?.pendingOrders !== null
              ? stats.pendingOrders
              : orders.filter(o => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED').length;

            const lowStockList = products.filter(p => p.stock <= 15);
            const recentOrdersList = orders.length > 0 ? orders : (stats?.recentOrders || []);

            // Loading skeleton for dashboard
            if (loading) {
              return (
                <div className="space-y-6 animate-pulse">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="h-3 bg-slate-200 rounded w-2/3" />
                        <div className="h-8 bg-slate-200 rounded w-1/2" />
                        <div className="h-2 bg-slate-100 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 bg-slate-100 rounded-xl" />
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {/* Stats cards — live calculated from real API data */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Revenue', value: `₹${realTotalRevenue.toLocaleString('en-IN')}`, sub: 'Verified via Cash & PhonePe PG', color: 'text-emerald-800', icon: '💰' },
                    { label: 'Today Sales', value: `₹${realTodaySales.toLocaleString('en-IN')}`, sub: "Today's farm orders", color: 'text-slate-900', icon: '📅' },
                    { label: 'Total Orders', value: orders.length, sub: `${realPendingOrders} pending dispatch`, color: 'text-slate-900', icon: '📦' },
                    { label: 'Products', value: products.length, sub: `${lowStockList.length} low stock alert${lowStockList.length !== 1 ? 's' : ''}`, color: 'text-blue-800', icon: '🌿' },
                  ].map(c => (
                    <div key={c.label} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{c.icon}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase">{c.label}</span>
                      </div>
                      <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
                      <p className="text-[10px] text-slate-500">{c.sub}</p>
                    </div>
                  ))}
                </div>


                {/* 4-Stage Order Category Pipeline Widget */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span>🌿 Nursery Order Processing (4 Categorized Stages)</span>
                    </h3>
                    <button onClick={() => { setOrderFilterStage('all'); setActiveTab('orders'); }} className="text-xs font-bold text-emerald-700 hover:underline">
                      Manage All Orders ({orders.length}) →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <button
                      onClick={() => { setOrderFilterStage('confirmed'); setActiveTab('orders'); }}
                      className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl text-left space-y-1 transition-all cursor-pointer"
                    >
                      <span className="text-lg">🌸</span>
                      <p className="font-black text-xl text-amber-900">{orders.filter(o => getOrderStage(o.orderStatus) === 'confirmed').length}</p>
                      <p className="font-bold text-amber-800 text-[11px]">1. Order Confirmed</p>
                    </button>

                    <button
                      onClick={() => { setOrderFilterStage('packing'); setActiveTab('orders'); }}
                      className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl text-left space-y-1 transition-all cursor-pointer"
                    >
                      <span className="text-lg">🌿</span>
                      <p className="font-black text-xl text-purple-900">{orders.filter(o => getOrderStage(o.orderStatus) === 'packing').length}</p>
                      <p className="font-bold text-purple-800 text-[11px]">2. Nursery Packed</p>
                    </button>

                    <button
                      onClick={() => { setOrderFilterStage('dispatched'); setActiveTab('orders'); }}
                      className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl text-left space-y-1 transition-all cursor-pointer"
                    >
                      <span className="text-lg">🚚</span>
                      <p className="font-black text-xl text-blue-900">{orders.filter(o => getOrderStage(o.orderStatus) === 'dispatched').length}</p>
                      <p className="font-bold text-blue-800 text-[11px]">3. Dispatched</p>
                    </button>

                    <button
                      onClick={() => { setOrderFilterStage('delivered'); setActiveTab('orders'); }}
                      className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-left space-y-1 transition-all cursor-pointer"
                    >
                      <span className="text-lg">✅</span>
                      <p className="font-black text-xl text-emerald-900">{orders.filter(o => getOrderStage(o.orderStatus) === 'delivered').length}</p>
                      <p className="font-bold text-emerald-800 text-[11px]">4. Delivered</p>
                    </button>
                  </div>
                </div>


                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Products', value: products.length, icon: '🌿', bg: 'bg-emerald-50', text: 'text-emerald-800' },
                    { label: 'Categories', value: categories.length, icon: '📁', bg: 'bg-blue-50', text: 'text-blue-800' },
                    { label: 'Active Coupons', value: coupons.filter(c => (c.active ?? (c as any).isActive) !== false).length, icon: '🏷️', bg: 'bg-amber-50', text: 'text-amber-800' },
                    { label: 'Catalog Value', value: `₹${products.reduce((s, p) => s + p.sellingPrice, 0)}`, icon: '💰', bg: 'bg-purple-50', text: 'text-purple-800' },
                  ].map(c => (
                    <div key={c.label} className={`${c.bg} p-4 rounded-2xl border border-slate-200 flex items-center gap-3`}>
                      <span className="text-2xl">{c.icon}</span>
                      <div>
                        <p className={`font-black text-xl ${c.text}`}>{c.value}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{c.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Orders List */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-base text-slate-900">Recent Customer Orders ({recentOrdersList.length})</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAddWhatsAppOrder('manual')}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span>✍️</span>
                        <span>+ Add Order</span>
                      </button>
                      <button
                        onClick={() => handleOpenAddWhatsAppOrder('ai_image')}
                        className="text-xs font-bold text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-xl border border-teal-200 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>📸 AI Scan</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                      >
                        View All Orders →
                      </button>
                    </div>
                  </div>

                  {recentOrdersList.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <p className="text-4xl">📦</p>
                      <p className="text-slate-500 font-semibold text-sm">No orders yet</p>
                      <p className="text-slate-400 text-xs">Orders placed by customers will appear here</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                            <th className="py-2.5 px-3">Order ID</th>
                            <th className="py-2.5 px-3">Customer</th>
                            <th className="py-2.5 px-3">Ordered Products</th>
                            <th className="py-2.5 px-3">Grand Total</th>
                            <th className="py-2.5 px-3">Payment</th>
                            <th className="py-2.5 px-3">Delivery Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {recentOrdersList.slice(0, 10).map((o: Order) => {
                            const isWA = isWhatsAppOrder(o);
                            const isFromImg = isUploadedByImage(o);
                            return (
                              <tr key={o.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {isWA ? (
                                      <span title="Added via WhatsApp" className="inline-flex items-center gap-1 bg-[#25D366] text-white px-2 py-0.5 rounded-md font-black text-[10px] shadow-2xs">
                                        <WhatsAppIcon className="w-3 h-3 fill-white" /> WhatsApp
                                      </span>
                                    ) : (
                                      <span title="Placed on Website" className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 rounded-md font-black text-[10px] shadow-2xs">
                                        <Globe className="w-3 h-3 text-white" /> Website
                                      </span>
                                    )}
                                    {isFromImg && (
                                      <span title="Created via Image Upload (Bill / WhatsApp screenshot)" className="inline-flex items-center gap-1 bg-purple-600 text-white px-2 py-0.5 rounded-md font-black text-[10px] shadow-2xs">
                                        <Camera className="w-3 h-3 text-white" /> Uploaded by Image
                                      </span>
                                    )}
                                    <span>{o.id}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-bold text-slate-800">
                                  <div className="flex items-center gap-1.5">
                                    {isWA && <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366] shrink-0" />}
                                    <span>{o.customerName} ({typeof o.shippingAddress === 'string' ? o.shippingAddress : o.shippingAddress?.villageTown || 'Nursery'})</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="max-w-[220px]">
                                    <p className="font-bold text-slate-900 truncate">
                                      {o.items?.map(i => i.name).join(', ') || 'Plant item'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-semibold">
                                      {o.items?.length || 0} item{(o.items?.length || 0) > 1 ? 's' : ''}
                                    </p>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-bold text-emerald-800">₹{o.grandTotal}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 w-fit ${
                                    isWA
                                      ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                      : o.paymentMethod === 'COD'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : 'bg-blue-100 text-blue-900'
                                  }`}>
                                    {isWA && <WhatsAppIcon className="w-3 h-3 fill-[#25D366]" />}
                                    <span>{isWA ? 'WhatsApp' : o.paymentMethod} ({o.paymentStatus})</span>
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${o.orderStatus === 'DELIVERED' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-800'}`}>
                                    {o.orderStatus}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Low Stock Alert */}
                {lowStockList.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sm text-amber-900">⚠️ Low Stock Inventory Alert ({lowStockList.length} Plants)</h3>
                      <button
                        onClick={() => setActiveTab('inventory')}
                        className="text-xs font-bold text-amber-800 hover:underline"
                      >
                        Manage Stock Inventory →
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {lowStockList.map(p => (
                        <div key={p.id} className="bg-white border border-amber-200 rounded-2xl p-3 flex items-center gap-3 text-xs shadow-2xs">
                          <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'} className="w-10 h-10 rounded-xl object-cover" alt={p.name} />
                          <div>
                            <p className="font-bold text-slate-900 truncate max-w-[100px]">{p.name}</p>
                            <p className={`font-bold text-[11px] ${p.stock === 0 ? 'text-rose-600' : 'text-amber-700'}`}>{p.stock === 0 ? 'Out of Stock' : `Stock: ${p.stock} units`}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 2: PRODUCT MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-base text-slate-900">Nursery Catalog ({products.length})</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProdForm({
                        name: '',
                        englishName: '',
                        tamilName: '',
                        scientificName: '',
                        categoryId: categories[0]?.id || 'cat-rose',
                        categoryName: categories[0]?.name || 'Roses',
                        description: '',
                        mrp: 299,
                        sellingPrice: 199,
                        discount: 33,
                        stock: 25,
                        plantHeight: '1.5 Feet',
                        potSize: '8 Inch Bag',
                        sunlight: 'Full Sun',
                        waterRequirement: 'Daily',
                        floweringSeason: 'All Year',
                        images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'],
                        careInstructions: {
                          watering: 'Water daily in the morning.',
                          sunlight: 'Requires 5 hours direct sunlight.',
                          fertilizer: 'Apply vermicompost every 15 days.',
                          soil: 'Red soil mixed with coco peat.'
                        },
                        featured: true,
                        bestSeller: false,
                        trending: false,
                        tags: ['Rose', 'Plant']
                      });
                      setShowProductModal(true);
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Plant</span>
                  </button>

                  <button
                    onClick={handleDeleteAllProducts}
                    className="px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove All Products</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-[10px]">
                        <th className="py-3 px-3">Plant Image & Name</th>
                        <th className="py-3 px-3">Tamil Name</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3">Price</th>
                        <th className="py-3 px-3">Stock</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                            No products in the catalog. Click "Add New Plant" to add one!
                          </td>
                        </tr>
                      ) : (
                        products.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 flex items-center gap-3">
                              <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'} alt={p.name} className="w-10 h-10 object-cover rounded-lg border shrink-0" />
                              <div>
                                <p className="font-bold text-slate-900">{p.name}</p>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-semibold text-emerald-800">{p.tamilName}</td>
                            <td className="py-3 px-3">{p.categoryName}</td>
                            <td className="py-3 px-3 font-bold text-slate-900">₹{p.sellingPrice} <s className="text-[10px] text-slate-400">₹{p.mrp}</s></td>
                            <td className="py-3 px-3 font-bold">{p.stock} left</td>
                            <td className="py-3 px-3 text-right space-x-1">
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  const initialImgs = Array.isArray(p.images) && p.images.length > 0
                                    ? p.images.filter(Boolean)
                                    : (p as any).image ? [(p as any).image] : ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'];
                                  setProdForm({
                                    ...p,
                                    images: initialImgs
                                  });
                                  setProdUrlInput('');
                                  setShowProductModal(true);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                                title="Edit Product"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORY MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Plant Categories ({categories.length})</h3>
                  <p className="text-xs text-slate-500">Manage store categories, display orders, featured status, and SEO meta tags.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCatForm({
                        name: '',
                        tamilName: '',
                        slug: '',
                        description: '',
                        image: '/products/double-delight.jpeg',
                        iconName: 'Flower2',
                        order: categories.length + 1,
                        isActive: true,
                        isFeatured: false,
                        metaTitle: '',
                        metaDescription: '',
                        ogImage: '',
                        canonicalUrl: ''
                      });
                      setShowSeoFields(false);
                      setShowCategoryModal(true);
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Category</span>
                  </button>

                  <button
                    onClick={handleDeleteAllCategories}
                    className="px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove All</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-[10px]">
                        <th className="py-3 px-3">Order</th>
                        <th className="py-3 px-3">Category Image & Name</th>
                        <th className="py-3 px-3">Tamil Name (தமிழ்)</th>
                        <th className="py-3 px-3">Slug</th>
                        <th className="py-3 px-3 text-center">Products</th>
                        <th className="py-3 px-3 text-center">Featured</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categories.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                            No categories created yet. Click "Create Category" to build your plant catalog structure!
                          </td>
                        </tr>
                      ) : (
                        categories.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-bold text-slate-600">#{c.order ?? 1}</td>
                            <td className="py-3 px-3 flex items-center gap-3">
                              <img
                                src={c.image || '/products/double-delight.jpeg'}
                                alt={c.name}
                                className="w-10 h-10 object-cover rounded-lg border shrink-0 bg-slate-100"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/products/double-delight.jpeg';
                                }}
                              />
                              <div>
                                <p className="font-bold text-slate-900">{c.name}</p>
                                <p className="text-[10px] text-slate-500 line-clamp-1">{c.description || 'Nursery category'}</p>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-bold text-emerald-800">{c.tamilName}</td>
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-500">/category/{c.slug}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[11px]">
                                {c.productCount ?? 0} plants
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {c.isFeatured ? (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-full text-[10px]">
                                  ★ Featured
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {c.isActive !== false ? (
                                <span className="px-2 py-0.5 bg-emerald-500 text-white font-bold rounded-full text-[10px]">
                                  ACTIVE
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 font-bold rounded-full text-[10px]">
                                  HIDDEN
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right space-x-1">
                              <button
                                onClick={() => {
                                  setEditingCategory(c);
                                  setCatForm({
                                    name: c.name,
                                    tamilName: c.tamilName,
                                    slug: c.slug,
                                    description: c.description || '',
                                    image: c.image || '/products/double-delight.jpeg',
                                    iconName: c.iconName || 'Flower2',
                                    order: c.order ?? 1,
                                    isActive: c.isActive !== false,
                                    isFeatured: c.isFeatured || false,
                                    metaTitle: c.metaTitle || '',
                                    metaDescription: c.metaDescription || '',
                                    ogImage: c.ogImage || '',
                                    canonicalUrl: c.canonicalUrl || ''
                                  });
                                  setShowSeoFields(!!(c.metaTitle || c.metaDescription));
                                  setShowCategoryModal(true);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                                title="Edit Category"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(c.id, c.name)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200"
                                title="Delete Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS MANAGEMENT - 4 CATEGORIZED SECTIONS + WEEK-BASED VIEW */}
          {activeTab === 'orders' && (() => {
            const getOrderTime = (o: Order): number => {
              if (o.createdAt) {
                const t = new Date(o.createdAt).getTime();
                if (!isNaN(t) && t > 0) return t;
              }
              if (o.updatedAt) {
                const t = new Date(o.updatedAt).getTime();
                if (!isNaN(t) && t > 0) return t;
              }
              const num = parseInt((o.id || '').replace(/\D/g, ''), 10);
              return isNaN(num) ? 0 : num;
            };

            const sortOrdersList = (list: Order[]): Order[] => {
              return [...list].sort((a, b) => {
                if (orderSortBy === 'date_desc') {
                  const diff = getOrderTime(b) - getOrderTime(a);
                  if (diff !== 0) return diff;
                  return (b.id || '').localeCompare(a.id || '');
                }
                if (orderSortBy === 'date_asc') {
                  const diff = getOrderTime(a) - getOrderTime(b);
                  if (diff !== 0) return diff;
                  return (a.id || '').localeCompare(b.id || '');
                }
                if (orderSortBy === 'price_desc') {
                  const priceA = Number(a.grandTotal || (a as any).total || 0);
                  const priceB = Number(b.grandTotal || (b as any).total || 0);
                  if (priceB !== priceA) return priceB - priceA;
                  return getOrderTime(b) - getOrderTime(a);
                }
                if (orderSortBy === 'price_asc') {
                  const priceA = Number(a.grandTotal || (a as any).total || 0);
                  const priceB = Number(b.grandTotal || (b as any).total || 0);
                  if (priceA !== priceB) return priceA - priceB;
                  return getOrderTime(b) - getOrderTime(a);
                }
                return 0;
              });
            };

            const filteredBySource = orders.filter(o => {
              if (!isValidAdminOrder(o)) return false;
              if (orderSourceFilter === 'whatsapp') return isWhatsAppOrder(o);
              if (orderSourceFilter === 'website') return !isWhatsAppOrder(o);
              if (orderSourceFilter === 'image') return isUploadedByImage(o);
              return true;
            });

            const pendingList = sortOrdersList(filteredBySource.filter(o => getOrderStage(o.orderStatus) === 'confirmed'));
            const packingList = sortOrdersList(filteredBySource.filter(o => getOrderStage(o.orderStatus) === 'packing'));
            const dispatchedList = sortOrdersList(filteredBySource.filter(o => getOrderStage(o.orderStatus) === 'dispatched'));
            const deliveredList = sortOrdersList(filteredBySource.filter(o => getOrderStage(o.orderStatus) === 'delivered'));
            const holdingList = sortOrdersList(filteredBySource.filter(o => holdingOrderIds.includes(o.id) || (o as any).isHolding === true));

            // ── Week-Based Grouping (Sunday to Saturday/Monday) ───────────────────
            interface WeekGroup {
              key: string;
              startDate: Date;
              endDate: Date;
              label: string;
              shortLabel: string;
              orders: Order[];
              confirmedOrders: Order[];
              packingOrders: Order[];
              dispatchedOrders: Order[];
              deliveredOrders: Order[];
              holdingOrders: Order[];
              isCurrentWeek: boolean;
              isPastWeek: boolean;
            }

            const getSundayToSaturdayBounds = (date: Date) => {
              const d = new Date(date);
              if (isNaN(d.getTime())) return null;
              const day = d.getDay(); // 0 is Sunday
              const start = new Date(d);
              start.setDate(d.getDate() - day);
              start.setHours(0, 0, 0, 0);

              const end = new Date(start);
              end.setDate(start.getDate() + 6);
              end.setHours(23, 59, 59, 999);

              return { start, end };
            };

            const nowBounds = getSundayToSaturdayBounds(new Date());
            const weekGroupsMap = new Map<string, WeekGroup>();

            filteredBySource.forEach(o => {
              const t = o.createdAt ? new Date(o.createdAt) : o.updatedAt ? new Date(o.updatedAt) : new Date();
              const bounds = getSundayToSaturdayBounds(t) || { start: new Date(), end: new Date() };
              const key = bounds.start.toISOString().split('T')[0];

              if (!weekGroupsMap.has(key)) {
                const startStr = bounds.start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                const endStr = bounds.end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                const isCurrentWeek = Boolean(nowBounds && bounds.start.getTime() === nowBounds.start.getTime());
                const isPastWeek = Boolean(nowBounds && bounds.end.getTime() < nowBounds.start.getTime());

                weekGroupsMap.set(key, {
                  key,
                  startDate: bounds.start,
                  endDate: bounds.end,
                  label: `Sunday, ${startStr} – Saturday, ${endStr}`,
                  shortLabel: `${startStr} – ${endStr}`,
                  orders: [],
                  confirmedOrders: [],
                  packingOrders: [],
                  dispatchedOrders: [],
                  deliveredOrders: [],
                  holdingOrders: [],
                  isCurrentWeek,
                  isPastWeek
                });
              }

              const group = weekGroupsMap.get(key)!;
              group.orders.push(o);

              const isOnHold = holdingOrderIds.includes(o.id) || (o as any).isHolding === true;
              if (isOnHold) {
                group.holdingOrders.push(o);
              }

              const stage = getOrderStage(o.orderStatus);
              if (stage === 'confirmed') group.confirmedOrders.push(o);
              else if (stage === 'packing') group.packingOrders.push(o);
              else if (stage === 'dispatched') group.dispatchedOrders.push(o);
              else if (stage === 'delivered') group.deliveredOrders.push(o);
            });

            const weekGroups: WeekGroup[] = Array.from(weekGroupsMap.values())
              .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
              .map(g => ({
                ...g,
                orders: sortOrdersList(g.orders)
              }));

            const toggleWeekExpansion = (key: string) => {
              setExpandedWeeks(prev => ({
                ...prev,
                [key]: !Boolean(prev[key])
              }));
            };

            const isWeekExpanded = (key: string, index?: number) => {
              // Closed by default for all weeks
              return Boolean(expandedWeeks[key]);
            };

            const handleExpandAllWeeks = () => {
              const allOpen: Record<string, boolean> = {};
              weekGroups.forEach(g => { allOpen[g.key] = true; });
              setExpandedWeeks(allOpen);
            };

            const handleCollapseAllWeeks = () => {
              const allClosed: Record<string, boolean> = {};
              weekGroups.forEach(g => { allClosed[g.key] = false; });
              setExpandedWeeks(allClosed);
            };

            const whatsAppOrdersCount = orders.filter(isWhatsAppOrder).length;
            const imageOrdersCount = orders.filter(isUploadedByImage).length;
            const websiteOrdersCount = orders.length - whatsAppOrdersCount;

            const renderOrderCard = (o: Order) => {
              const currentStage = getOrderStage(o.orderStatus);
              const isCod = o.paymentMethod === 'COD';
              const isWA = isWhatsAppOrder(o);
              const isFromImg = isUploadedByImage(o);
              const isOnHold = holdingOrderIds.includes(o.id) || (o as any).isHolding === true;
              const s = (o.orderStatus || '').toUpperCase();
              const isDelivered = currentStage === 'delivered';
              const isDispatched = currentStage === 'dispatched';
              const isPacking = currentStage === 'packing';

              return (
                <div key={o.id} className={`bg-white p-5 rounded-2xl border ${isOnHold ? 'border-amber-400 ring-2 ring-amber-300/60 bg-amber-50/20' : isWA ? 'border-emerald-300 ring-1 ring-emerald-200/50' : 'border-slate-200'} space-y-4 text-xs shadow-xs hover:border-slate-300 transition-all`}>
                  {/* ON HOLD BANNER */}
                  {isOnHold && (
                    <div className="bg-amber-100 border-2 border-amber-400 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-amber-950 font-bold shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⏸️</span>
                        <div>
                          <span className="font-extrabold uppercase text-xs tracking-wider block text-amber-900">ORDER CURRENTLY ON HOLD</span>
                          <span className="text-[11px] font-medium text-amber-800">
                            Shipment delayed / held for this week by nursery team.
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleToggleHolding(o.id, e)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-black text-xs cursor-pointer shadow-xs transition-colors shrink-0"
                      >
                        ▶️ Release from Hold
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-slate-900 text-sm">Order #{o.id}</span>
                        {isWA ? (
                          <span className="inline-flex items-center gap-1.5 bg-[#25D366] text-white font-extrabold px-2.5 py-0.5 rounded-full text-[11px] shadow-xs tracking-wide">
                            <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                            <span>WhatsApp Order</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white font-extrabold px-2.5 py-0.5 rounded-full text-[11px] shadow-xs tracking-wide">
                            <Globe className="w-3.5 h-3.5 text-white" />
                            <span>Website Order</span>
                          </span>
                        )}
                        {isFromImg && (
                          <span className="inline-flex items-center gap-1.5 bg-purple-600 text-white font-extrabold px-2.5 py-0.5 rounded-full text-[11px] shadow-xs tracking-wide" title="Details auto-extracted from uploaded photo/bill">
                            <Camera className="w-3.5 h-3.5 text-white" />
                            <span>Uploaded by Image</span>
                          </span>
                        )}
                        {isOnHold && (
                          <span className="inline-flex items-center gap-1 bg-amber-500 text-white font-extrabold px-2.5 py-0.5 rounded-full text-[11px] shadow-xs">
                            ⏸️ ON HOLD
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1 ${
                          isWA
                            ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                            : (o.paymentStatus === 'FAILED' || (o.orderStatus || '').toUpperCase() === 'CANCELLED')
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : isCod 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : o.paymentMethod === 'RAZORPAY'
                            ? (o.paymentStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300')
                            : (o.paymentMethod === 'QR_PAYMENT' || o.paymentMethod === 'UPI_DIRECT' || o.paymentProofUrl)
                            ? 'bg-indigo-100 text-indigo-950 border border-indigo-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}>
                          {isWA && <WhatsAppIcon className="w-3 h-3 fill-[#25D366]" />}
                          <span>
                            {isWA
                              ? 'WhatsApp / Offline'
                              : (o.paymentStatus === 'FAILED' || (o.orderStatus || '').toUpperCase() === 'CANCELLED')
                              ? (o.paymentMethod === 'RAZORPAY' ? '❌ Razorpay (Cancelled / Failed)' : '❌ Order Cancelled')
                              : isCod 
                              ? '💵 Cash on Delivery (COD)' 
                              : o.paymentMethod === 'RAZORPAY'
                              ? (o.paymentStatus === 'SUCCESS' ? '⚡ Razorpay (Auto-Verified)' : '⏳ Razorpay (Incomplete / Pending)')
                              : (o.paymentMethod === 'QR_PAYMENT' || o.paymentMethod === 'UPI_DIRECT' || o.paymentProofUrl)
                              ? '📸 Scan QR Code Payment'
                              : '📱 PhonePe (Auto-Verified)'}
                          </span>
                        </span>
                        {(o.paymentMethod === 'QR_PAYMENT' || o.paymentMethod === 'UPI_DIRECT' || Boolean(o.paymentProofUrl) || isFromImg) && (o.paymentProofUrl || (o as any).orderImageUrl) && (
                          <button
                            onClick={() => setSelectedProofOrder(o)}
                            className="px-2.5 py-0.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <Camera className="w-3 h-3" />
                            <span>{isFromImg ? 'View Uploaded Image' : 'View Paid Receipt'}</span>
                          </button>
                        )}
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">Txn ID: {o.merchantTransactionId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold px-3 py-1 rounded-full text-xs ${o.paymentStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : o.paymentStatus === 'FAILED' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-900'}`}>
                        Payment: {o.paymentStatus === 'SUCCESS' ? '✅ SUCCESS' : o.paymentStatus === 'FAILED' ? '❌ FAILED' : '⏳ PENDING'}
                      </span>
                      <span className={`font-bold px-3 py-1 rounded-full text-xs ${isDelivered ? 'bg-emerald-700 text-white' : isDispatched ? 'bg-blue-600 text-white' : isPacking ? 'bg-purple-700 text-white' : 'bg-amber-600 text-white'}`}>
                        Status: {o.orderStatus}
                      </span>
                    </div>
                  </div>

                  {/* 4-Stage Live Delivery Progress Visualizer */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-700">🚚 Live Nursery Delivery Progress:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                      <div className={`p-2 rounded-xl border font-bold ${!isPacking && !isDispatched && !isDelivered ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-white border-slate-200 text-slate-400'}`}>
                        1. Order Confirmed
                      </div>
                      <div className={`p-2 rounded-xl border font-bold ${isPacking ? 'bg-purple-100 border-purple-400 text-purple-900' : 'bg-white border-slate-200 text-slate-400'}`}>
                        2. Nursery Packing
                      </div>
                      <div className={`p-2 rounded-xl border font-bold ${isDispatched ? 'bg-blue-100 border-blue-400 text-blue-900' : 'bg-white border-slate-200 text-slate-400'}`}>
                        3. Dispatched
                      </div>
                      <div className={`p-2 rounded-xl border font-bold ${isDelivered ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                        4. Delivered
                      </div>
                    </div>
                  </div>

                  {/* Highlighted Customer Details Section */}
                  <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-amber-200/80 pb-2">
                      <span className="bg-amber-600 text-white px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                        <User className="w-3.5 h-3.5" /> 👤 CUSTOMER DETAILS
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-amber-950 text-[11px]">
                          <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Customer Name & Phone:</span>
                        </div>
                        <p className="font-extrabold text-slate-900 text-sm">
                          {o.customerName}
                        </p>
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>+91 {o.customerPhone}</span>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-amber-950 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Delivery Address:</span>
                        </div>
                        <p className="font-bold text-slate-800 text-xs leading-relaxed">
                          {typeof o.shippingAddress === 'string'
                            ? o.shippingAddress
                            : `${o.shippingAddress?.houseNo || ''}, ${o.shippingAddress?.street || ''}, ${o.shippingAddress?.villageTown || ''}, ${o.shippingAddress?.district || ''}, ${o.shippingAddress?.pincode || ''}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Highlighted Courier & Delivery Service Selected by Customer */}
                  <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                      <span className="bg-emerald-800 text-white px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                        <Truck className="w-3.5 h-3.5" /> 🚚 COURIER & DELIVERY DETAILS
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                        (o.courierName || '').toLowerCase().includes('mettur')
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                      }`}>
                        {(o.courierName || '').toLowerCase().includes('mettur') ? '📦 Mettur Branch Depot Pickup' : '🚚 Doorstep Courier Delivery'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* Courier Partner Card */}
                      <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-1">
                        <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Courier Partner</span>
                        <p className="font-extrabold text-slate-900 text-sm">
                          {o.courierName || 'Professional Courier'}
                        </p>
                        <p className="text-[11px] text-emerald-800 font-bold">
                          Shipping Fee: {o.shippingCharge === 0 ? 'FREE' : `₹${o.shippingCharge}`}
                        </p>
                      </div>

                      {/* Soil / Packaging Specs */}
                      <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-1">
                        <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Soil & Packaging Option</span>
                        <p className="font-bold text-slate-800 text-xs flex items-center gap-1">
                          {o.potOption === 'FULL_SOIL' || (o.courierName || '').toLowerCase().includes('full soil')
                            ? '🪴 Full Soil Root Pot'
                            : '🌱 Reduced Soil (Transit Safe)'}
                        </p>
                        <p className="text-[11px] text-slate-600 font-medium">
                          Packaging: {o.packingOption === 'EXTRA_SECURE' ? '📦 Extra Secure (+₹10)' : o.packingOption === 'MAX_PROTECTION' ? '🛡️ Max Protection (+₹15)' : 'Standard Safe Box'}
                        </p>
                      </div>

                      {/* Branch Hub / Tracking AWB */}
                      <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-1">
                        {o.courierBranch || o.courierDistrict ? (
                          <>
                            <span className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider block">📍 Pickup Branch Depot</span>
                            <p className="font-extrabold text-slate-900 text-xs">
                              {o.courierBranch || 'Customer selected depot'}
                            </p>
                            {o.courierDistrict && (
                              <p className="text-[11px] text-slate-500 font-medium">{o.courierDistrict} District</p>
                            )}
                          </>
                        ) : o.trackingNumber ? (
                          <>
                            <span className="text-[10px] font-extrabold uppercase text-blue-900 tracking-wider block">AWB / Tracking Number</span>
                            <p className="font-mono font-bold text-slate-900 text-xs truncate">
                              {o.trackingNumber}
                            </p>
                            <a
                              href={o.deliveryNotes || `https://www.google.com/search?q=${encodeURIComponent((o.courierName || 'Courier') + ' ' + o.trackingNumber)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-blue-700 font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <span>Track Online</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Tracking Status</span>
                            <p className="text-slate-500 text-xs italic">Awaiting dispatch</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Ordered Products & QR Payment Check-Up Dropdown */}
                  <details className="bg-slate-50/90 rounded-2xl border border-slate-200 group transition-all">
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-100/80 transition-colors select-none">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ChevronDown className="w-4 h-4 text-slate-600 transition-transform duration-200 group-open:rotate-180 shrink-0" />
                        <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          📦 Ordered Products ({o.items?.length || 0}) & QR Check-up
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {!isCod && (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                            o.paymentStatus === 'SUCCESS' 
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                              : o.paymentStatus === 'FAILED' 
                              ? 'bg-rose-100 text-rose-800 border-rose-300' 
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}>
                            {o.paymentStatus === 'SUCCESS' ? '✅ QR Verified' : o.paymentStatus === 'FAILED' ? '❌ QR Rejected' : '⏳ QR Pending Check-up'}
                          </span>
                        )}
                        <span className="text-[11px] text-emerald-800 font-bold truncate max-w-[180px] sm:max-w-[260px] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          {o.items?.map(i => i.name).join(', ') || 'Nursery Products'}
                        </span>
                      </div>
                    </summary>

                    <div className="p-4 pt-0 space-y-4 border-t border-slate-200/80">
                      {/* Items Snapshot List */}
                      <div className="pt-2 space-y-2">
                        <p className="font-bold text-slate-800 text-xs flex items-center gap-1">
                          <span>📦 Ordered Item Details:</span>
                        </p>
                        {o.items && o.items.length > 0 ? (
                          o.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.image || '/products/eq.jpeg'}
                                  alt={item.name}
                                  className="w-11 h-11 object-cover rounded-lg border border-slate-200 shrink-0"
                                />
                                <div>
                                  <p className="font-bold text-slate-900 text-xs">{item.name}</p>
                                  {item.tamilName && (
                                    <p className="text-emerald-800 font-semibold text-[11px]">{item.tamilName}</p>
                                  )}
                                  {item.sku && (
                                    <span className="font-mono text-[10px] text-slate-400">SKU: {item.sku}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-bold text-slate-900 text-xs">Qty: {item.quantity}</span>
                                <span className="text-emerald-800 font-bold block text-xs">₹{item.price * item.quantity}</span>
                                {item.quantity > 1 && (
                                  <span className="text-[10px] text-slate-400 block">(₹{item.price} each)</span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 italic text-[11px]">No product items recorded</p>
                        )}
                      </div>

                      {/* Payment Verification Box: Automated Gateway vs QR Screenshot Proof */}
                      {!isCod && (
                        (o.paymentMethod === 'RAZORPAY' || o.paymentMethod === 'PHONEPE') && !o.paymentProofUrl ? (
                          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0">
                                ⚡
                              </div>
                              <div>
                                <p className="font-extrabold text-emerald-950 text-xs">
                                  {o.paymentMethod === 'RAZORPAY' ? '⚡ Razorpay Payment Gateway' : '📱 PhonePe Online Gateway'} • Auto-Verified
                                </p>
                                <p className="text-[11px] text-emerald-800 font-medium">
                                  Gateway Transaction: <span className="font-mono font-bold">{o.merchantTransactionId || o.id}</span> • Verified Amount: <strong className="font-mono">₹{o.grandTotal}</strong>
                                </p>
                              </div>
                            </div>
                            <span className="px-3 py-1 bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-2xs shrink-0">
                              ✅ 100% PAID
                            </span>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-br from-indigo-50/90 to-blue-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3 shadow-xs">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-indigo-200/80 pb-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                                  📸
                                </div>
                                <div>
                                  <p className="font-extrabold text-indigo-950 text-xs">
                                    Direct UPI / QR Code Payment Proof
                                  </p>
                                  <p className="text-[10.5px] text-indigo-800 font-medium">
                                    Customer submitted verification screenshot
                                  </p>
                                </div>
                              </div>
                              {o.paymentProofUploadedAt && (
                                <span className="text-[10px] text-indigo-900 font-bold bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                                  Uploaded: {new Date(o.paymentProofUploadedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 items-center">
                              {/* Payment Screenshot Preview */}
                              {o.paymentProofUrl ? (
                                <div className="w-full md:w-44 shrink-0 flex flex-col items-center gap-1.5">
                                  <div
                                    onClick={() => setSelectedProofOrder(o)}
                                    className="relative group cursor-pointer w-full h-32 rounded-xl overflow-hidden border-2 border-indigo-400 bg-slate-900 flex items-center justify-center shadow-sm"
                                    title="Click to zoom receipt photo"
                                  >
                                    <img
                                      src={o.paymentProofUrl}
                                      alt="Customer Payment Receipt Proof"
                                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/10 flex items-center justify-center transition-opacity opacity-90">
                                      <span className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                                        <Camera className="w-3.5 h-3.5" /> 🔍 Zoom Receipt
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-indigo-900 font-bold text-center">📸 Customer Receipt Attached</span>
                                </div>
                              ) : (
                                <div className="p-3 bg-amber-100/90 text-amber-900 rounded-xl text-center text-xs font-bold w-full md:w-44 shrink-0 border border-amber-300 space-y-0.5">
                                  <p className="text-xs">⚠️ No Screenshot Photo</p>
                                  <p className="text-[10px] text-amber-800 font-normal">Check nursery bank / UTR ref</p>
                                </div>
                              )}

                              {/* Manual Admin Verification Controls */}
                              <div className="flex-1 w-full space-y-2 bg-white p-3 rounded-xl border border-indigo-100">
                                <p className="text-xs text-slate-900 font-black flex items-center justify-between">
                                  <span>⚙️ Manual Admin Payment Verification:</span>
                                  <span className="text-[11px] text-slate-500 font-normal">Verify amount ₹{o.grandTotal} in nursery UPI app</span>
                                </p>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <button
                                  onClick={() => handleUpdateOrderStatus(o.id, o.orderStatus === 'PENDING' ? 'PROCESSING' : o.orderStatus, 'SUCCESS')}
                                  className={`py-2.5 px-3 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                    o.paymentStatus === 'SUCCESS'
                                      ? 'bg-emerald-700 text-white ring-2 ring-emerald-500 shadow-md'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  }`}
                                >
                                  <Check className="w-4 h-4" />
                                  <span>✅ Mark Verified & Paid</span>
                                </button>

                                <button
                                  onClick={() => handleUpdateOrderStatus(o.id, o.orderStatus, 'PENDING')}
                                  className={`py-2.5 px-3 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                    o.paymentStatus === 'PENDING'
                                      ? 'bg-amber-600 text-white ring-2 ring-amber-400 shadow-md'
                                      : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                                  }`}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  <span>⏳ Keep Unverified / Pending</span>
                                </button>

                                <button
                                  onClick={() => handleUpdateOrderStatus(o.id, 'CANCELLED', 'FAILED')}
                                  className={`py-2.5 px-3 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                    o.paymentStatus === 'FAILED'
                                      ? 'bg-rose-700 text-white ring-2 ring-rose-500 shadow-md'
                                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                                  }`}
                                >
                                  <X className="w-4 h-4" />
                                  <span>❌ Reject & Cancel Order</span>
                                </button>
                              </div>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </details>

                  {/* Cash Collection Banner */}
                  {isCod && (
                    <div className={`p-3 rounded-xl font-bold flex flex-col sm:flex-row justify-between items-center gap-2 border ${o.paymentStatus === 'SUCCESS' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-amber-50 text-amber-900 border-amber-300'}`}>
                      <span>💵 Cash on Delivery Amount: ₹{o.grandTotal}</span>
                      <span>{o.paymentStatus === 'SUCCESS' ? '✅ Cash Collected at Doorstep' : '⏳ Cash Pending (Collect ₹' + o.grandTotal + ' upon arrival)'}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    <span className="font-bold text-slate-900 text-sm">Grand Total: ₹{o.grandTotal}</span>

                    {/* Interactive Stage Controls & Customer Alerts */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* MANUAL HOLDING BUTTON */}
                      <button
                        onClick={(e) => handleToggleHolding(o.id, e)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all shadow-xs ${
                          isOnHold
                            ? 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-400 shadow-md'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300'
                        }`}
                        title={isOnHold ? "Click to release from holding and resume shipment" : "Hold back this order manually (not delivered this week)"}
                      >
                        <span>{isOnHold ? '▶️ Resume Flow' : '⏸️ Put on Hold'}</span>
                      </button>

                      <button
                        onClick={() => handleSendWhatsAppUpdate(o)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        📲 WhatsApp Alert
                      </button>

                      <button
                        onClick={() => handleOpenEditOrder(o)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Edit Customer, Address, or Plant Items"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Order</span>
                      </button>

                      <button
                        onClick={() => handleUpdateOrderStatus(o.id, 'CONFIRMED')}
                        className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer transition-all ${
                          currentStage === 'confirmed' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        1. Confirmed
                      </button>

                      <button
                        onClick={() => handleUpdateOrderStatus(o.id, 'PACKING')}
                        className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer transition-all ${
                          currentStage === 'packing' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                        }`}
                      >
                        2. Packing
                      </button>

                      <button
                        onClick={() => {
                          setCourierName(o.courierName || 'Professional Courier');
                          setTrackingNumber(o.trackingNumber || '');
                          setDispatchOrder(o);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer transition-all ${
                          currentStage === 'dispatched' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
                        }`}
                      >
                        3. Courier
                      </button>

                      <button
                        onClick={() => handleUpdateOrderStatus(o.id, 'DELIVERED', 'SUCCESS')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer transition-all ${
                          currentStage === 'delivered' ? 'bg-purple-700 text-white shadow-xs' : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
                        }`}
                      >
                        4. Delivered
                      </button>

                      <button
                        onClick={() => handleDeleteOrder(o.id)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-[11px] flex items-center gap-1 border border-rose-200 cursor-pointer transition-colors"
                        title="Permanently Delete Order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            };

            return (
              <div className="space-y-6">
                {/* Header & Sub-Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div>
                    <h3 className="font-black text-lg text-slate-900">Categorized Orders Management ({orders.length})</h3>
                    <p className="text-xs text-slate-500 font-medium">Organized by Weekly Pipeline & 4 Nursery Fulfillment Stages</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleOpenAddWhatsAppOrder('manual')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102 active:scale-98"
                    >
                      <span>✍️</span>
                      <span>+ Manual Order</span>
                    </button>
                    <button
                      onClick={() => handleOpenAddWhatsAppOrder('ai_image')}
                      className="px-3.5 py-2 bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102 active:scale-98"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>📸 AI Image Scan Order</span>
                    </button>
                    <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-3 py-1.5 rounded-xl">
                      🚚 Neon PostgreSQL Synced
                    </span>
                  </div>
                </div>

                {/* Source Filter Tabs: All vs WhatsApp vs Website */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Order Channel:</span>
                    <button
                      type="button"
                      onClick={() => setOrderSourceFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border ${
                        orderSourceFilter === 'all'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <span>📦 All Orders</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">{orders.length}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderSourceFilter('whatsapp')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border ${
                        orderSourceFilter === 'whatsapp'
                          ? 'bg-[#25D366] text-white border-[#1eb757] shadow-xs'
                          : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border-emerald-200'
                      }`}
                    >
                      <WhatsAppIcon className={`w-3.5 h-3.5 ${orderSourceFilter === 'whatsapp' ? 'fill-white' : 'fill-[#25D366]'}`} />
                      <span>WhatsApp Orders</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-white/30 text-[10px] font-mono">{whatsAppOrdersCount}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderSourceFilter('website')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border ${
                        orderSourceFilter === 'website'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                          : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border-blue-200'
                      }`}
                    >
                      <span>🌐 Website Orders</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-white/30 text-[10px] font-mono">{websiteOrdersCount}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderSourceFilter('image')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border ${
                        orderSourceFilter === 'image'
                          ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                          : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border-purple-200'
                      }`}
                    >
                      <Camera className={`w-3.5 h-3.5 ${orderSourceFilter === 'image' ? 'text-white' : 'text-purple-600'}`} />
                      <span>Uploaded by Image</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-white/30 text-[10px] font-mono">{imageOrdersCount}</span>
                    </button>
                  </div>

                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                    Showing {filteredBySource.length} {orderSourceFilter === 'whatsapp' ? 'WhatsApp' : orderSourceFilter === 'website' ? 'Website' : orderSourceFilter === 'image' ? 'Uploaded by Image' : ''} Orders
                  </span>
                </div>

                {/* Interactive Stage & Week Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => setOrderFilterStage('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${orderFilterStage === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    All ({filteredBySource.length})
                  </button>

                  <button
                    onClick={() => setOrderFilterStage('week_based')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                      orderFilterStage === 'week_based'
                        ? 'bg-indigo-700 text-white shadow-md'
                        : 'bg-indigo-50 text-indigo-950 hover:bg-indigo-100 border border-indigo-200'
                    }`}
                  >
                    <span>📅 Week Based</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">{weekGroups.length} Weeks</span>
                  </button>

                  <button
                    onClick={() => setOrderFilterStage('confirmed')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${orderFilterStage === 'confirmed' ? 'bg-amber-500 text-white shadow-xs' : 'bg-amber-50 text-amber-900 hover:bg-amber-100'}`}
                  >
                    <span>🌸 1. Confirmed</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">{pendingList.length}</span>
                  </button>

                  <button
                    onClick={() => setOrderFilterStage('packing')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${orderFilterStage === 'packing' ? 'bg-purple-600 text-white shadow-xs' : 'bg-purple-50 text-purple-900 hover:bg-purple-100'}`}
                  >
                    <span>🌿 2. Packing</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">{packingList.length}</span>
                  </button>

                  <button
                    onClick={() => setOrderFilterStage('dispatched')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${orderFilterStage === 'dispatched' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-900 hover:bg-blue-100'}`}
                  >
                    <span>🚚 3. Courier</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">{dispatchedList.length}</span>
                  </button>

                  <button
                    onClick={() => setOrderFilterStage('delivered')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${orderFilterStage === 'delivered' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'}`}
                  >
                    <span>✅ 4. Delivered</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">{deliveredList.length}</span>
                  </button>

                  {holdingList.length > 0 && (
                    <button
                      onClick={() => setOrderFilterStage('holding')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                        orderFilterStage === 'holding'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-amber-100 text-amber-950 hover:bg-amber-200 border border-amber-300'
                      }`}
                    >
                      <span>⏸️ On Hold</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-white/30 text-[10px] font-mono">{holdingList.length}</span>
                    </button>
                  )}
                </div>

                {/* Desktop Sort Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Sort Orders:</span>
                    <button
                      type="button"
                      onClick={() => setOrderSortBy(prev => prev === 'date_desc' ? 'date_asc' : 'date_desc')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border ${
                        orderSortBy.startsWith('date')
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <span>📅</span>
                      <span>{orderSortBy === 'date_asc' ? 'Date: Oldest First ↑' : 'Date: Newest First ↓'}</span>
                    </button>
                  </div>

                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                    Showing {filteredBySource.length} total orders ({holdingList.length} on hold)
                  </span>
                </div>

                {/* ── SECTION: WEEK BASED GROUPING (DROPDOWN ACCORDIONS) ───────────── */}
                {orderFilterStage === 'week_based' && (
                  <div className="space-y-4">
                    {/* Week-Based Header Toolbar */}
                    <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="font-black text-base flex items-center gap-2">
                          <span>📅</span> WEEK-BASED BATCH DISPATCH PIPELINE ({weekGroups.length} Weeks)
                        </h4>
                        <p className="text-xs text-indigo-200 font-medium">
                          Organized by Sunday to Saturday weekly cycles with live fulfillment status & Manual Holding control.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleExpandAllWeeks}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-white/20"
                        >
                          Expand All
                        </button>
                        <button
                          onClick={handleCollapseAllWeeks}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-white/20"
                        >
                          Collapse All
                        </button>
                      </div>
                    </div>

                    {weekGroups.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
                        No orders recorded for any week.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {weekGroups.map((group, groupIdx) => {
                          const expanded = isWeekExpanded(group.key, groupIdx);
                          const undeliveredCount = group.confirmedOrders.length + group.packingOrders.length + group.dispatchedOrders.length;
                          const hasDelayedOrders = group.isPastWeek && undeliveredCount > 0;

                          return (
                            <div
                              key={group.key}
                              className={`bg-white rounded-2xl border-2 transition-all shadow-xs overflow-hidden ${
                                group.isCurrentWeek
                                  ? 'border-indigo-400 ring-2 ring-indigo-200/50'
                                  : hasDelayedOrders
                                  ? 'border-amber-400'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {/* WEEK ACCORDION HEADER (CLICK TO TOGGLE) */}
                              <div
                                onClick={() => toggleWeekExpansion(group.key)}
                                className="p-4 cursor-pointer hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 select-none"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform duration-200 ${expanded ? 'rotate-180 text-indigo-700' : ''}`} />
                                    <span className="font-black text-sm text-slate-900">
                                      📅 {group.label}
                                    </span>
                                    {group.isCurrentWeek && (
                                      <span className="bg-indigo-700 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                                        ⚡ CURRENT WEEK
                                      </span>
                                    )}
                                    {hasDelayedOrders && (
                                      <span className="bg-amber-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                                        ⚠️ {undeliveredCount} PENDING
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 font-medium pl-7">
                                    Weekly Cycle: Sunday to Saturday • Total: <strong className="text-slate-800">{group.orders.length} Orders</strong>
                                  </p>
                                </div>

                                {/* WEEK STAGE BREAKDOWN PILLS */}
                                <div className="flex items-center gap-1.5 flex-wrap pl-7 lg:pl-0">
                                  <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                    🌸 {group.confirmedOrders.length} Confirmed
                                  </span>
                                  <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-50 text-purple-900 border border-purple-200">
                                    🌿 {group.packingOrders.length} Packing
                                  </span>
                                  <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                                    🚚 {group.dispatchedOrders.length} Courier
                                  </span>
                                  <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                                    ✅ {group.deliveredOrders.length} Delivered
                                  </span>
                                  {group.holdingOrders.length > 0 && (
                                    <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-amber-500 text-white shadow-2xs">
                                      ⏸️ {group.holdingOrders.length} On Hold
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* EXPANDED WEEK ORDERS LIST */}
                              {expanded && (
                                <div className="p-4 pt-0 border-t border-slate-100 space-y-4 bg-slate-50/50">
                                  {/* Past Week Undelivered Warning Banner */}
                                  {hasDelayedOrders && (
                                    <div className="mt-3 bg-amber-50 border-2 border-amber-300 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-amber-950 text-xs">
                                      <div className="flex items-center gap-2">
                                        <span className="text-base">⚠️</span>
                                        <span>
                                          <strong>Notice:</strong> {undeliveredCount} order(s) from this past week are not yet delivered. If shipment is delayed, click <strong>"⏸️ Put on Hold"</strong> on that order card.
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  <div className="pt-2 space-y-4">
                                    {group.orders.map(renderOrderCard)}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── SECTION: HOLDING ORDERS ONLY VIEW ────────────────────────────── */}
                {orderFilterStage === 'holding' && (
                  <div className="space-y-4">
                    <div className="bg-amber-500 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                      <div>
                        <h4 className="font-black text-base flex items-center gap-2">
                          <span>⏸️</span> ORDERS ON HOLD / DELAYED SHIPMENTS ({holdingList.length})
                        </h4>
                        <p className="text-xs text-amber-100 font-medium">
                          These orders have been held back from the current weekly shipment batch. Click "Resume Flow" when ready to dispatch.
                        </p>
                      </div>
                    </div>

                    {holdingList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
                        No orders are currently on hold.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {holdingList.map(renderOrderCard)}
                      </div>
                    )}
                  </div>
                )}

                {/* ── 4 CATEGORIZED SECTIONS DISPLAY (ALL / STAGE VIEWS) ──────────── */}
                {orderFilterStage !== 'week_based' && orderFilterStage !== 'holding' && (
                  <div className="space-y-8">
                    {/* SECTION 1: ORDER CONFIRMED */}
                    {(orderFilterStage === 'all' || orderFilterStage === 'confirmed') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
                          <h4 className="font-black text-sm text-amber-950 flex items-center gap-2">
                            <span className="text-base">🌸</span> SECTION 1: ORDER CONFIRMED ({pendingList.length})
                          </h4>
                          <span className="text-[11px] font-bold text-amber-800 bg-white/80 px-2.5 py-0.5 rounded-lg border border-amber-200">
                            Ready for Nursery Moisture Packing
                          </span>
                        </div>
                        {pendingList.length === 0 ? (
                          <p className="text-xs text-slate-400 italic p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center">No confirmed orders waiting for packing.</p>
                        ) : (
                          <div className="space-y-4">
                            {pendingList.map(renderOrderCard)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION 2: NURSERY PACKED */}
                    {(orderFilterStage === 'all' || orderFilterStage === 'packing') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-purple-50 p-3.5 rounded-2xl border border-purple-200">
                          <h4 className="font-black text-sm text-purple-950 flex items-center gap-2">
                            <span className="text-base">🌿</span> SECTION 2: NURSERY PACKED ({packingList.length})
                          </h4>
                          <span className="text-[11px] font-bold text-purple-800 bg-white/80 px-2.5 py-0.5 rounded-lg border border-purple-200">
                            Root Moisture Sealed & Packed
                          </span>
                        </div>
                        {packingList.length === 0 ? (
                          <p className="text-xs text-slate-400 italic p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center">No orders currently in Nursery Packed stage.</p>
                        ) : (
                          <div className="space-y-4">
                            {packingList.map(renderOrderCard)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION 3: DISPATCHED */}
                    {(orderFilterStage === 'all' || orderFilterStage === 'dispatched') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-blue-50 p-3.5 rounded-2xl border border-blue-200">
                          <h4 className="font-black text-sm text-blue-950 flex items-center gap-2">
                            <span className="text-base">🚚</span> SECTION 3: DISPATCHED & IN TRANSIT ({dispatchedList.length})
                          </h4>
                          <span className="text-[11px] font-bold text-blue-800 bg-white/80 px-2.5 py-0.5 rounded-lg border border-blue-200">
                            Handed to Courier Partner / Farm Driver
                          </span>
                        </div>
                        {dispatchedList.length === 0 ? (
                          <p className="text-xs text-slate-400 italic p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center">No dispatched orders currently in transit.</p>
                        ) : (
                          <div className="space-y-4">
                            {dispatchedList.map(renderOrderCard)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION 4: DELIVERED */}
                    {(orderFilterStage === 'all' || orderFilterStage === 'delivered') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                          <h4 className="font-black text-sm text-emerald-950 flex items-center gap-2">
                            <span className="text-base">✅</span> SECTION 4: DELIVERED & COMPLETED ({deliveredList.length})
                          </h4>
                          <span className="text-[11px] font-bold text-emerald-800 bg-white/80 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                            Customer Delivered & Payment Collected
                          </span>
                        </div>
                        {deliveredList.length === 0 ? (
                          <p className="text-xs text-slate-400 italic p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center">No delivered orders yet.</p>
                        ) : (
                          <div className="space-y-4">
                            {deliveredList.map(renderOrderCard)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}


          {/* TAB: COUPONS */}
          {activeTab === 'coupons' && (
            <div className="space-y-5 text-xs">
              {/* Create Coupon Form */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
                <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-600" /> Create New Coupon
                </h3>
                <CouponForm
                  categories={categories}
                  onSave={async (formData) => {
                    const newCoupon: Coupon = {
                      id: 'local-' + Date.now(),
                      code: formData.code.toUpperCase().trim(),
                      type: formData.discountType === 'FLAT' ? 'FIXED' : 'PERCENT',
                      value: Number(formData.discountValue),
                      minOrder: Number(formData.minOrderAmount || 0),
                      maxUsageCount: Number(formData.maxUsageCount || 100),
                      expiryDate: formData.expiryDate || '2027-12-31',
                      active: formData.isActive !== false,
                      description: formData.description,
                      usageCount: 0
                    };

                    setCoupons(prev => {
                      const next = [newCoupon, ...prev];
                      try {
                        const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                        cached.coupons = next;
                        localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                      } catch {}
                      return next;
                    });

                    toast.success(`Coupon "${formData.code}" created successfully!`, 'Coupon Saved');

                    try {
                      const payload = {
                        ...formData,
                        type: formData.discountType === 'FLAT' ? 'FIXED' : 'PERCENT',
                        value: Number(formData.discountValue),
                        minOrder: Number(formData.minOrderAmount || 0),
                        expiryDate: formData.expiryDate || '2027-12-31'
                      };
                      const res = await authFetch('/api/coupons', { method: 'POST', body: JSON.stringify(payload) });
                      const data = await res.json().catch(() => null);
                      if (data && data.coupon) {
                        setCoupons(prev => prev.map(c => c.code === formData.code ? { ...c, ...data.coupon } : c));
                      }
                    } catch (err: any) {
                      console.warn('Background coupon save notice:', err);
                    }
                  }}
                />
              </div>

              {/* Existing Coupons List */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Existing Coupons ({coupons.length})</h3>
                </div>
                {coupons.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-3xl mb-2">🏷️</p>
                    <p className="text-slate-500 font-semibold">No coupons created yet</p>
                    <p className="text-slate-400 text-[11px]">Create your first discount coupon above</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {coupons.map((c) => (
                      <div key={c.id} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900 text-sm font-mono">{c.code}</p>
                          <p className="text-slate-500 text-[10px]">
                            {(c.type || (c as any).discountType) === 'PERCENT' || (c as any).discountType === 'PERCENTAGE' ? `${c.value ?? (c as any).discountValue}% off` : `₹${c.value ?? (c as any).discountValue} off`}
                            {(c.minOrder ?? (c as any).minOrderAmount) ? ` · Min ₹${c.minOrder ?? (c as any).minOrderAmount}` : ''}
                            {c.expiryDate ? ` · Expires ${new Date(c.expiryDate).toLocaleDateString('en-IN')}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${(c.active ?? (c as any).isActive) !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            {(c.active ?? (c as any).isActive) !== false ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                          <button
                            onClick={async () => {
                              if (!confirm(`Delete coupon "${c.code}"?`)) return;
                              const targetId = c.id || c.code;
                              const delSet = new Set(JSON.parse(localStorage.getItem('vrg_deleted_coupons') || '[]'));
                              if (c.id) delSet.add(c.id);
                              if (c.code) delSet.add(c.code);
                              if (c.code) delSet.add(c.code.toUpperCase());
                              localStorage.setItem('vrg_deleted_coupons', JSON.stringify([...delSet]));

                              setCoupons(prev => prev.filter(item => item.id !== c.id && item.code !== c.code));
                              try {
                                await authFetch('/api/coupons/delete', {
                                  method: 'POST',
                                  body: JSON.stringify({ id: targetId, code: c.code })
                                }).catch(() => null);
                                await authFetch(`/api/coupons/${encodeURIComponent(targetId)}`, { method: 'DELETE' }).catch(() => null);
                              } catch (e) {
                                console.error('Delete coupon error:', e);
                              }
                            }}

                            className="p-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-200 hover:bg-rose-100"
                            title="Delete Coupon"
                          ><Trash2 className="w-3.5 h-3.5" /></button>



                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Plant Combo Packages & Offers Management Section */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <span>🎁 Special Plant Combo Packages & Offers ({combos.length})</span>
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">Group multiple plants together, set special combo pricing, and showcase bundles above categories on the store homepage.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCombo(null);
                      setComboForm({
                        title: '',
                        subtitle: '',
                        badge: '3-IN-1 COMBO',
                        productIds: products.length >= 2 ? [products[0].id, products[1].id] : [],
                        originalPrice: products.length >= 2 ? (products[0].mrp + products[1].mrp) : 500,
                        comboPrice: products.length >= 2 ? (products[0].sellingPrice + products[1].sellingPrice - 50) : 350,
                        imageUrl: '',
                        active: true,
                        freeDelivery: false
                      });
                      setShowComboModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-amber-700 hover:from-emerald-800 hover:to-amber-800 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Create Plant Combo
                  </button>
                </div>

                {combos.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-3xl mb-2">🎁</p>
                    <p className="text-slate-700 font-bold">No Combo Packages Created</p>
                    <p className="text-slate-500 text-xs">Create your first plant bundle combo above to showcase special offers on the homepage!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {combos.map(combo => {
                      const discount = combo.discountPercent || (combo.originalPrice > 0 ? Math.round(((combo.originalPrice - combo.comboPrice) / combo.originalPrice) * 100) : 0);
                      const comboProducts = (combo.products || []).length > 0
                        ? combo.products
                        : products.filter(p => (combo.productIds || []).includes(p.id));

                      return (
                        <div key={combo.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 relative group hover:border-amber-400 transition-all">
                          <div className="flex items-start gap-3">
                            <img
                              src={combo.imageUrl || comboProducts?.[0]?.images?.[0] || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'}
                              alt={combo.title}
                              className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="bg-amber-100 text-amber-900 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                                  {combo.badge || 'COMBO OFFER'}
                                </span>
                                {combo.freeDelivery && (
                                  <span className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                                    🚚 FREE DELIVERY
                                  </span>
                                )}
                                {discount > 0 && (
                                  <span className="bg-emerald-700 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                                    {discount}% OFF
                                  </span>
                                )}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${combo.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                  {combo.active !== false ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">{combo.title}</h4>
                              <p className="text-slate-500 text-xs truncate">{combo.subtitle || `${comboProducts?.length || 0} plants bundle`}</p>
                            </div>
                          </div>

                          {/* Included Products Badges */}
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1">
                            <p className="font-bold text-slate-500 text-[10px] uppercase">Included Plants ({comboProducts?.length || 0}):</p>
                            <div className="flex flex-wrap gap-1">
                              {comboProducts?.map(p => (
                                <span key={p?.id} className="bg-emerald-50 text-emerald-900 font-semibold px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">
                                  🌿 {p?.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Pricing & Actions */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                            <div>
                              <span className="text-slate-400 line-through font-bold mr-1.5">₹{combo.originalPrice}</span>
                              <span className="font-black text-slate-900 text-base">₹{combo.comboPrice}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingCombo(combo);
                                  setComboForm({
                                    title: combo.title,
                                    subtitle: combo.subtitle || '',
                                    badge: combo.badge || 'COMBO OFFER',
                                    productIds: combo.productIds || [],
                                    originalPrice: combo.originalPrice,
                                    comboPrice: combo.comboPrice,
                                    imageUrl: combo.imageUrl || '',
                                    active: combo.active !== false,
                                    freeDelivery: combo.freeDelivery === true
                                  });
                                  setShowComboModal(true);
                                }}
                                className="p-1.5 bg-white text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 font-bold text-xs"
                                title="Edit Combo"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={async () => {
                                  const newStatus = combo.active === false;
                                  setCombos(prev => prev.map(c => c.id === combo.id ? { ...c, active: newStatus } : c));
                                  await authFetch(`/api/admin/combos/${combo.id}`, {
                                    method: 'PUT',
                                    body: JSON.stringify({ active: newStatus })
                                  });
                                }}
                                className={`px-2 py-1 rounded-lg border font-bold text-[10px] ${combo.active !== false ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'}`}
                              >
                                {combo.active !== false ? 'Deactivate' : 'Activate'}
                              </button>

                              <button
                                onClick={async () => {
                                  if (!confirm(`Delete combo package "${combo.title}"?`)) return;
                                  const id = combo.id;

                                  // 1. Record in local deleted set immediately
                                  try {
                                    const deleted = JSON.parse(localStorage.getItem('vrg_deleted_combos') || '[]');
                                    if (!deleted.includes(id)) {
                                      deleted.push(id);
                                      localStorage.setItem('vrg_deleted_combos', JSON.stringify(deleted));
                                    }
                                  } catch {}

                                  // 2. Instant 0ms optimistic UI & cache removal
                                  setCombos(prev => {
                                    const next = prev.filter(c => c.id !== id);
                                    try {
                                      const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                                      cached.combos = next;
                                      localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                                      localStorage.setItem('vrg_combos_cache', JSON.stringify(next));
                                    } catch {}
                                    return next;
                                  });

                                  // 3. Instant 0ms event dispatch
                                  window.dispatchEvent(new CustomEvent('vrg_combos_updated'));

                                  // 4. Non-blocking async backend deletion
                                  authFetch(`/api/admin/combos/${id}`, { method: 'DELETE' }).catch(e => {
                                    console.error('Background combo delete error:', e);
                                  });
                                }}
                                className="p-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-200 hover:bg-rose-100 cursor-pointer"
                                title="Delete Combo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: STOCK INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="space-y-5 text-xs">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" /> Plant Sapling Stock Inventory ({products.length} Items)
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">Manage live stock counts, set low-stock thresholds, and update plant inventory in real-time.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (confirm('Set stock count for ALL products to 100 units?')) {
                        products.forEach(p => handleQuickStockUpdate(p.id, 100));
                      }
                    }}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs"
                  >
                    ⚡ Set Bulk Stock (100 Units All)
                  </button>
                </div>
              </div>

              {/* Filter stats header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-800 uppercase">In Stock Plants</p>
                    <p className="text-2xl font-black text-emerald-900">{products.filter(p => p.stock > 10).length}</p>
                  </div>
                  <span className="text-3xl">🌿</span>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-800 uppercase">Low Stock Alert (&le;10)</p>
                    <p className="text-2xl font-black text-amber-900">{products.filter(p => p.stock <= 10 && p.stock > 0).length}</p>
                  </div>
                  <span className="text-3xl">⚠️</span>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-rose-800 uppercase">Out of Stock (0 Units)</p>
                    <p className="text-2xl font-black text-rose-900">{products.filter(p => p.stock === 0).length}</p>
                  </div>
                  <span className="text-3xl">❌</span>
                </div>
              </div>

              {/* Products Inventory List */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h4 className="font-bold text-sm text-slate-900">Live Inventory Management</h4>
                  <span className="text-slate-500 font-medium text-xs">Click - / + to adjust stock or type direct numbers</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const isLow = p.stock <= 10 && p.stock > 0;
                    const isZero = p.stock === 0;

                    return (
                      <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'}
                            alt={p.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                              <span className="text-emerald-800 font-semibold text-xs">({p.tamilName})</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-slate-500 font-medium text-[11px]">
                              <span>SKU: {p.sku}</span>
                              <span>• Price: ₹{p.sellingPrice}</span>
                              <span>• Category: {p.categoryName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                            isZero ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            isLow ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {isZero ? '❌ Out of Stock' : isLow ? `⚠️ Low Stock (${p.stock})` : `✅ In Stock (${p.stock})`}
                          </span>

                          {/* Stock Controls */}
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              onClick={() => handleQuickStockUpdate(p.id, p.stock - 1)}
                              className="w-8 h-8 bg-white hover:bg-slate-200 text-slate-900 font-extrabold rounded-lg flex items-center justify-center text-sm shadow-2xs"
                            >
                              -
                            </button>

                            <input
                              type="number"
                              value={p.stock}
                              onChange={(e) => handleQuickStockUpdate(p.id, parseInt(e.target.value) || 0)}
                              className="w-14 text-center font-bold bg-transparent text-slate-900 text-xs focus:outline-none"
                            />

                            <button
                              onClick={() => handleQuickStockUpdate(p.id, p.stock + 1)}
                              className="w-8 h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-lg flex items-center justify-center text-sm shadow-2xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PHONEPE & SITE SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 text-xs">
              <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-700" /> PhonePe Payment Gateway Credentials
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">PhonePe Merchant ID:</label>
                  <input
                    type="text"
                    placeholder="Enter PhonePe Merchant ID"
                    value={settings?.phonepeMerchantId ?? ''}
                    onChange={(e) => setSettings({ ...settings, phonepeMerchantId: e.target.value } as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">PhonePe Salt Key (Secret):</label>
                  <input
                    type="password"
                    placeholder="Enter Salt Key"
                    value={settings?.phonepeSaltKey ?? ''}
                    onChange={(e) => setSettings({ ...settings, phonepeSaltKey: e.target.value } as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Salt Index:</label>
                  <input
                    type="text"
                    placeholder="1"
                    value={settings?.phonepeSaltIndex ?? '1'}
                    onChange={(e) => setSettings({ ...settings, phonepeSaltIndex: e.target.value } as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Environment Mode:</label>
                  <select
                    value={settings?.phonepeEnv ?? 'SANDBOX'}
                    onChange={(e: any) => setSettings({ ...settings, phonepeEnv: e.target.value } as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="SANDBOX">SANDBOX (Testing)</option>
                    <option value="PRODUCTION">PRODUCTION (Live PG)</option>
                  </select>
                </div>
              </div>

              <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2 pt-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" /> Razorpay Payment Gateway Credentials
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Razorpay Key ID:</label>
                  <input
                    type="text"
                    placeholder="e.g. rzp_live_xxxxxxxx, rzp_test_xxxxxxxx"
                    value={settings?.razorpayKeyId ?? ''}
                    onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value } as any)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Public key used for frontend Razorpay checkout popup.</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Razorpay Key Secret:</label>
                  <input
                    type="password"
                    placeholder="Enter Key Secret"
                    value={settings?.razorpayKeySecret ?? ''}
                    onChange={(e) => setSettings({ ...settings, razorpayKeySecret: e.target.value } as any)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Private key secret for verifying HMAC signatures.</span>
                </div>
              </div>

              <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2 pt-4">
                Nursery Business Info
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business Name:</label>
                  <input
                    type="text"
                    placeholder="Veerika Rose Garden"
                    value={settings?.businessName ?? ''}
                    onChange={(e) => setSettings({ ...settings, businessName: e.target.value } as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Order Support Phone:</label>
                  <input
                    type="text"
                    placeholder="+91 72008 26129"
                    value={settings?.phone ?? ''}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value } as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Support Email:</label>
                  <input
                    type="email"
                    placeholder="support@veerikarosegarden.com"
                    value={settings?.email ?? ''}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value } as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Free Shipping Above (₹):</label>
                  <input
                    type="number"
                    placeholder="499"
                    value={settings?.freeShippingThreshold ?? 499}
                    onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) } as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* PAYMENT METHODS MANAGEMENT TOGGLES */}
              <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2 pt-4 flex items-center justify-between">
                <span>💳 Payment Methods Enable / Disable Controls</span>
                <span className="text-xs bg-indigo-100 text-indigo-900 px-3 py-1 rounded-full font-bold">
                  Active Store Options
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {/* Razorpay Toggle */}
                {(() => {
                  const isRazorpayOn = settings?.enableRazorpay !== false;
                  return (
                    <div
                      onClick={() => setSettings({ ...settings, enableRazorpay: !isRazorpayOn } as any)}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${
                        isRazorpayOn
                          ? 'bg-blue-50/70 border-blue-500 text-blue-950 shadow-xs'
                          : 'bg-rose-50/70 border-rose-300 text-rose-950 opacity-90'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs">Razorpay Gateway</span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            isRazorpayOn ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            {isRazorpayOn ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">GPay / PhonePe / Paytm / Cards</span>
                      </div>

                      <div className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                        isRazorpayOn ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}>
                        <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
                      </div>
                    </div>
                  );
                })()}

                {/* PhonePe Toggle */}
                {(() => {
                  const isPhonePeOn = settings?.enablePhonePe !== false;
                  return (
                    <div
                      onClick={() => setSettings({ ...settings, enablePhonePe: !isPhonePeOn } as any)}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${
                        isPhonePeOn
                          ? 'bg-purple-50/70 border-purple-500 text-purple-950 shadow-xs'
                          : 'bg-rose-50/70 border-rose-300 text-rose-950 opacity-90'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs">PhonePe Gateway</span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            isPhonePeOn ? 'bg-purple-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            {isPhonePeOn ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Online PG Payments</span>
                      </div>

                      <div className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                        isPhonePeOn ? 'bg-purple-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}>
                        <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
                      </div>
                    </div>
                  );
                })()}

                {/* Razorpay Toggle */}
                {(() => {
                  const isRazorpayOn = settings?.enableRazorpay !== false;
                  return (
                    <div
                      onClick={() => setSettings({ ...settings, enableRazorpay: !isRazorpayOn } as any)}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${
                        isRazorpayOn
                          ? 'bg-blue-50/70 border-blue-500 text-blue-950 shadow-xs'
                          : 'bg-rose-50/70 border-rose-300 text-rose-950 opacity-90'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs">Razorpay Gateway</span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            isRazorpayOn ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            {isRazorpayOn ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Cards, UPI, Netbanking</span>
                      </div>

                      <div className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                        isRazorpayOn ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}>
                        <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
                      </div>
                    </div>
                  );
                })()}

                {/* COD Toggle */}
                {(() => {
                  const isCodOn = settings?.enableCod !== false;
                  return (
                    <div
                      onClick={() => setSettings({ ...settings, enableCod: !isCodOn } as any)}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${
                        isCodOn
                          ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950 shadow-xs'
                          : 'bg-rose-50/70 border-rose-300 text-rose-950 opacity-90'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs">Cash on Delivery (COD)</span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            isCodOn ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            {isCodOn ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Pay on Delivery</span>
                      </div>

                      <div className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                        isCodOn ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}>
                        <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
                      </div>
                    </div>
                  );
                })()}

                {/* Scan QR Code Toggle */}
                {(() => {
                  const isQrOn = settings?.enableQrPayment !== false;
                  return (
                    <div
                      onClick={() => setSettings({ ...settings, enableQrPayment: !isQrOn } as any)}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${
                        isQrOn
                          ? 'bg-indigo-50/70 border-indigo-500 text-indigo-950 shadow-xs'
                          : 'bg-rose-50/70 border-rose-300 text-rose-950 opacity-90'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs">Scan QR & Proof</span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            isQrOn ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            {isQrOn ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Manual UPI Payment</span>
                      </div>

                      <div className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                        isQrOn ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}>
                        <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* RAZORPAY CONFIGURATION */}
              <h3 className="font-bold text-sm text-blue-900 border-b border-blue-100 pb-2 pt-2">
                Razorpay Payment Gateway Configuration
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Razorpay Key ID:</label>
                  <input
                    type="text"
                    placeholder="rzp_test_... or rzp_live_..."
                    value={settings?.razorpayKeyId ?? ''}
                    onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value } as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Razorpay Key Secret:</label>
                  <input
                    type="password"
                    placeholder="Enter new secret (leave blank to keep unchanged)"
                    value={settings?.razorpayKeySecret ?? ''}
                    onChange={(e) => setSettings({ ...settings, razorpayKeySecret: e.target.value } as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* SCAN QR CONFIGURATION */}
              <h3 className="font-bold text-sm text-indigo-900 border-b border-indigo-100 pb-2 pt-2">
                Scan QR Code & Manual UPI Configuration
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nursery UPI ID:</label>
                  <input
                    type="text"
                    placeholder="e.g. merchant@upi"
                    value={settings?.upiId ?? ''}
                    onChange={(e) => setSettings({ ...settings, upiId: e.target.value } as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">UPI Holder / Merchant Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Nursery Merchant Name"
                    value={settings?.upiName ?? ''}
                    onChange={(e) => setSettings({ ...settings, upiName: e.target.value } as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Live QR Preview — shows exactly what customer sees */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-5">
                <div className="text-center shrink-0">
                  <img
                    key={`${settings?.upiId}-${settings?.upiName}`}
                    src={`https://quickchart.io/qr?size=300&text=${encodeURIComponent(`upi://pay?pa=${settings?.upiId || '7200826129@ybl'}&pn=${settings?.upiName || 'Veerika Rose Garden Nursery'}&cu=INR`)}`}
                    alt="Live QR Preview"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.retried) {
                        target.dataset.retried = 'true';
                        target.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(`upi://pay?pa=${settings?.upiId || '7200826129@ybl'}&pn=${settings?.upiName || 'Veerika Rose Garden Nursery'}&cu=INR`)}`;
                      }
                    }}
                    className="w-32 h-32 rounded-xl border-2 border-indigo-300 bg-white shadow-sm mx-auto object-contain p-1"
                  />
                  <p className="text-[10px] font-bold text-indigo-900 mt-1.5">📱 Live QR Preview</p>
                  <p className="text-[10px] text-slate-500">What customer sees at checkout</p>
                </div>
                <div className="flex-1 space-y-1 text-xs">
                  <p className="font-bold text-indigo-900 text-sm">✅ Auto-Generated UPI QR Code</p>
                  <p className="text-slate-600">The QR code is auto-generated from your UPI ID and merchant name above — no manual URL needed.</p>
                  <div className="mt-2 p-2 bg-white rounded-xl border border-indigo-200 font-mono text-[11px] space-y-0.5">
                    <p><span className="text-slate-400">UPI ID:</span> <span className="font-bold text-indigo-900">{settings?.upiId || 'Not set'}</span></p>
                    <p><span className="text-slate-400">Name:</span> <span className="font-bold text-indigo-900">{settings?.upiName || 'Not set'}</span></p>
                    <p><span className="text-slate-400">QR Data:</span> <span className="text-indigo-700 break-all">upi://pay?pa={settings?.upiId || ''}&pn={settings?.upiName || ''}&cu=INR</span></p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">💡 Change UPI ID or Name above and the QR updates automatically after Save.</p>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">QR Payment Instructions for Customer:</label>
                <textarea
                  rows={3}
                  placeholder="1. Scan QR code using GPay, PhonePe..."
                  value={settings?.qrInstructions ?? ''}
                  onChange={(e) => setSettings({ ...settings, qrInstructions: e.target.value } as any)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  {settingsSaving ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                  ) : (
                    <><Check className="w-3.5 h-3.5" /> Save All Credentials & Business Settings</>
                  )}
                </button>
                {settingsMsg && (
                  <p className={`text-xs font-bold ${settingsMsg.startsWith('✅') ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {settingsMsg}
                  </p>
                )}
              </div>
            </form>
          )}

          {/* TAB 6: PAYMENT AUDIT LOGS */}

          {activeTab === 'audit' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 text-xs">
              <h3 className="font-bold text-base text-slate-900">PhonePe Payment Checksum Audit Logs</h3>
              <div className="space-y-3 font-mono">
                {paymentLogs.length === 0 ? (
                  <p className="text-slate-400 italic">No payment logs recorded yet.</p>
                ) : (
                  paymentLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-900 text-slate-200 rounded-2xl text-[11px] space-y-1">
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>Txn: {log.merchantTransactionId}</span>
                        <span>Amount: ₹{log.amount} ({log.status})</span>
                      </div>
                      <p className="text-slate-400">Checksum: {log.checksum}</p>
                      <p className="text-slate-500 text-[10px]">Logged at: {log.createdAt}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}




          {/* TAB 7: EXPENSES & PROFIT CALCULATOR */}

          {activeTab === 'finances' && (() => {
            // Aggregate totals
            const totalSpending = finances.reduce((sum, f) => sum + (f.costAmount || 0), 0);
            const totalSales = finances.reduce((sum, f) => sum + (f.type === 'SALE' ? (f.sellAmount || 0) : 0), 0) + orders.reduce((sum, o) => sum + o.grandTotal, 0);
            const netProfit = totalSales - totalSpending;
            const isProfit = netProfit >= 0;
            const margin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0';

            return (
              <div className="space-y-6 text-xs">
                {/* Header & Action Button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
                  <div>
                    <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                      <span>💰 Farm Expenses, Sales & Profit Calculator</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Track extra operational spending, fertilizer costs, wholesale sales, and live profit/loss</p>
                  </div>
                  <button
                    onClick={() => setShowFinanceModal(true)}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Spending / Sale Log</span>
                  </button>
                </div>

                {/* 4 P&L Analytics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase">Total Sales Revenue</span>
                    <p className="text-2xl font-black text-emerald-800">₹{totalSales}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Includes {orders.length} store orders + custom sales</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase">Total Farm Spending</span>
                    <p className="text-2xl font-black text-rose-700">₹{totalSpending}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Fertilizer, bags, soil, labor & freight</p>
                  </div>

                  <div className={`p-5 rounded-3xl border shadow-2xs space-y-1 ${isProfit ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'}`}>
                    <span className={`text-xs font-bold uppercase ${isProfit ? 'text-emerald-900' : 'text-rose-900'}`}>
                      {isProfit ? '📈 Net Profit' : '📉 Net Loss'}
                    </span>
                    <p className={`text-2xl font-black ${isProfit ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {isProfit ? `+₹${netProfit}` : `-₹${Math.abs(netProfit)}`}
                    </p>
                    <p className={`text-[10px] font-bold ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isProfit ? '✅ Profitable Farm Operation' : '⚠️ Expenses Exceed Revenue'}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase">Profit Margin</span>
                    <p className={`text-2xl font-black ${Number(margin) >= 0 ? 'text-emerald-800' : 'text-rose-600'}`}>{margin}%</p>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                      <div className={`h-full ${Number(margin) >= 0 ? 'bg-emerald-600' : 'bg-rose-600'}`} style={{ width: `${Math.min(100, Math.max(0, Number(margin)))}%` }} />
                    </div>
                  </div>
                </div>

                {/* Table of Entries */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-sm text-slate-900">Nursery Financial Logs & Entry History ({finances.length})</h4>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                      Live Calculated Profit/Loss per Line Item
                    </span>
                  </div>

                  {finances.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <p className="text-4xl">💰</p>
                      <p className="text-slate-500 font-semibold text-sm">No expenses or sales logged yet</p>
                      <p className="text-slate-400 text-xs">Click "+ Add Spending / Sale Log" to record farm spending or custom sales</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                            <th className="py-3 px-3">Date</th>
                            <th className="py-3 px-3">Type</th>
                            <th className="py-3 px-3">Title & Category</th>
                            <th className="py-3 px-3 text-center">Qty</th>
                            <th className="py-3 px-3">Spending (Cost)</th>
                            <th className="py-3 px-3">Selling Price</th>
                            <th className="py-3 px-3">Profit / Loss</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {finances.map((f) => {
                            const itemCost = f.costAmount || 0;
                            const itemSell = f.type === 'SALE' ? (f.sellAmount || 0) : 0;
                            const itemDiff = f.type === 'SALE' ? (itemSell - itemCost) : -itemCost;
                            const isItemProfit = itemDiff >= 0;

                            return (
                              <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">{f.date}</td>
                                <td className="py-3 px-3">
                                  <span className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${f.type === 'SALE' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'}`}>
                                    {f.type === 'SALE' ? '🛍️ Sale' : '💸 Spending'}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <p className="font-bold text-slate-900 text-sm">{f.title}</p>
                                  <p className="text-[11px] text-slate-500 font-medium">{f.category} {f.notes ? `• ${f.notes}` : ''}</p>
                                </td>
                                <td className="py-3 px-3 text-center font-bold font-mono">{f.quantity}</td>
                                <td className="py-3 px-3 font-bold text-rose-700 font-mono">₹{itemCost}</td>
                                <td className="py-3 px-3 font-bold text-emerald-800 font-mono">{f.type === 'SALE' ? `₹${itemSell}` : '—'}</td>
                                <td className="py-3 px-3">
                                  {f.type === 'SALE' ? (
                                    <span className={`font-black px-2.5 py-1 rounded-xl text-[11px] ${isItemProfit ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'}`}>
                                      {isItemProfit ? `+₹${itemDiff} Profit` : `-₹${Math.abs(itemDiff)} Loss`}
                                    </span>
                                  ) : (
                                    <span className="font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                                      -₹{itemCost} Expense
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleOpenEditFinance(f)}
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                                      title="Edit Entry"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFinance(f.id)}
                                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200 cursor-pointer"
                                      title="Delete Entry"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB: REVIEWS SECTION */}
          {activeTab === 'reviews' && (() => {
            const filteredReviews = reviews.filter(r => {
              const matchesSearch = !reviewSearch.trim() || 
                r.userName.toLowerCase().includes(reviewSearch.toLowerCase()) || 
                (r.productName || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
                r.comment.toLowerCase().includes(reviewSearch.toLowerCase());
              
              if (!matchesSearch) return false;
              if (reviewFilter === 'approved') return r.status === 'APPROVED';
              if (reviewFilter === 'pending') return r.status === 'PENDING';
              if (reviewFilter === 'photos') return Boolean(r.imageUrl);
              return true;
            });

            const photoCount = reviews.filter(r => r.imageUrl).length;
            const approvedCount = reviews.filter(r => r.status === 'APPROVED').length;
            const pendingCount = reviews.filter(r => r.status === 'PENDING').length;

            return (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-700 p-6 rounded-3xl text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase">
                        ★ Live Review Management
                      </span>
                    </div>
                    <h2 className="text-2xl font-black font-display">Customer Reviews & Photo Section</h2>
                    <p className="text-xs text-amber-100 mt-1 max-w-xl">
                      Upload live customer plant photos from your local computer. Approved reviews render directly on the homepage below <strong>Our Collection All Plants</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingReview(null);
                      setReviewForm({
                        userName: '',
                        location: 'Pennagaram, TN',
                        rating: 5,
                        title: '',
                        comment: '',
                        productId: '',
                        productName: 'Dutch Hybrid Red Rose',
                        imageUrl: '',
                        status: 'APPROVED',
                        featured: true
                      });
                      setShowReviewModal(true);
                    }}
                    className="px-5 py-3 bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs rounded-2xl shadow-md flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 text-amber-600" />
                    <span>Upload Photo & Add Review</span>
                  </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <p className="text-slate-400 uppercase text-[10px]">Total Reviews</p>
                    <p className="text-2xl font-black text-slate-900">{reviews.length}</p>
                    <p className="text-[10px] text-slate-500">Submitted Feedback</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
                    <p className="text-emerald-700 uppercase text-[10px]">Approved & Live</p>
                    <p className="text-2xl font-black text-emerald-800">{approvedCount}</p>
                    <p className="text-[10px] text-emerald-600">Visible on Store Front</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
                    <p className="text-amber-700 uppercase text-[10px]">With Plant Photos 📸</p>
                    <p className="text-2xl font-black text-amber-800">{photoCount}</p>
                    <p className="text-[10px] text-amber-600">Local & Buyer Uploads</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs space-y-1">
                    <p className="text-purple-700 uppercase text-[10px]">Pending Approval ⏳</p>
                    <p className="text-2xl font-black text-purple-800">{pendingCount}</p>
                    <p className="text-[10px] text-purple-600">Awaiting Admin Action</p>
                  </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
                    {[
                      { key: 'all', label: `All (${reviews.length})` },
                      { key: 'approved', label: `Approved ✅ (${approvedCount})` },
                      { key: 'pending', label: `Pending ⏳ (${pendingCount})` },
                      { key: 'photos', label: `With Photos 📸 (${photoCount})` },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setReviewFilter(f.key as any)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                          reviewFilter === f.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search reviews..."
                      value={reviewSearch}
                      onChange={e => setReviewSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Review Cards List */}
                {filteredReviews.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-slate-300 space-y-3">
                    <Star className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="font-extrabold text-slate-700 text-base">No reviews match your filter</h3>
                    <p className="text-slate-400 text-xs">Click "Upload Photo & Add Review" to create your first customer review!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredReviews.map(r => (
                      <div
                        key={r.id}
                        className={`bg-white rounded-3xl p-5 border transition-all space-y-3 relative ${
                          r.status === 'APPROVED' ? 'border-emerald-200 shadow-2xs' : 'border-amber-300 bg-amber-50/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {r.imageUrl ? (
                              <img
                                src={r.imageUrl}
                                alt={r.userName}
                                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-amber-600 text-white font-black text-lg flex items-center justify-center shadow-xs shrink-0">
                                {r.userName[0]}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-slate-900 text-sm">{r.userName}</h4>
                                {r.isVerified && (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[9px] border border-emerald-300">
                                    ✓ Verified Buyer
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-medium">{r.location || 'Tamil Nadu'} • {r.createdAt}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < r.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Plant Tag */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold">
                          <span>🌱 Plant:</span>
                          <span className="text-emerald-800">{r.productName || 'Nursery Plant'}</span>
                        </div>

                        <div>
                          {r.title && <h5 className="font-bold text-slate-900 text-xs mb-1">"{r.title}"</h5>}
                          <p className="text-slate-600 text-xs leading-relaxed font-normal">{r.comment}</p>
                        </div>

                        {/* Admin Reply */}
                        {r.reply && (
                          <div className="bg-emerald-50 border-l-4 border-emerald-600 p-3 rounded-r-2xl space-y-1 text-xs">
                            <span className="font-bold text-emerald-950 block">🌿 Veerika Rose Garden Team Reply:</span>
                            <p className="text-emerald-800">{r.reply}</p>
                          </div>
                        )}

                        {/* Reply Form toggle */}
                        {replyingReviewId === r.id && (
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                            <textarea
                              rows={2}
                              placeholder="Write nursery response to customer review..."
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setReplyingReviewId(null)}
                                className="px-3 py-1 bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveReviewReply(r.id)}
                                className="px-3 py-1 bg-emerald-700 text-white font-bold rounded-lg text-xs"
                              >
                                Save Reply
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleReviewStatus(r.id)}
                              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                r.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                              }`}
                            >
                              {r.status === 'APPROVED' ? <Check className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                              <span>{r.status === 'APPROVED' ? 'Approved (Live)' : 'Approve Review'}</span>
                            </button>

                            <button
                              onClick={() => handleToggleReviewFeatured(r.id)}
                              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                r.featured
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <Star className="w-3.5 h-3.5" />
                              <span>{r.featured ? 'Featured ★' : 'Feature'}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setReplyingReviewId(r.id); setReplyText(r.reply || ''); }}
                              className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 cursor-pointer"
                              title="Reply to Customer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditReview(r)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 cursor-pointer"
                              title="Edit Review"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteReview(r.id)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 cursor-pointer"
                              title="Delete Review"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: PAYMENT LOGS */}
          {activeTab === 'payment_logs' && (() => {
            const successLogs = paymentLogs.filter(l => l.status === 'SUCCESS');
            const failedLogs = paymentLogs.filter(l => l.status === 'FAILED');
            const pendingLogs = paymentLogs.filter(l => l.status === 'PENDING');
            const totalVol = successLogs.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

            return (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                        <span>⚡ Payment Gateway Transaction Logs</span>
                        <span className="text-xs px-2.5 py-0.5 bg-indigo-100 text-indigo-900 rounded-full font-bold">
                          {paymentLogs.length} Records
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">Live payment verification logs for Razorpay, PhonePe & QR UPI</p>
                    </div>

                    <button
                      onClick={() => fetchData()}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh Logs</span>
                    </button>
                  </div>

                  {/* Quick Summary Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-bold">
                    <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
                      <p className="text-[10px] uppercase text-emerald-700 font-extrabold">Successful Volume</p>
                      <p className="text-xl font-black text-emerald-950">₹{totalVol.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-emerald-700">{successLogs.length} Completed</p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-2xl">
                      <p className="text-[10px] uppercase text-indigo-700 font-extrabold">Total Attempts</p>
                      <p className="text-xl font-black text-indigo-950">{paymentLogs.length}</p>
                      <p className="text-[10px] text-indigo-700">All Gateways</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
                      <p className="text-[10px] uppercase text-amber-700 font-extrabold">Pending Verification</p>
                      <p className="text-xl font-black text-amber-950">{pendingLogs.length}</p>
                      <p className="text-[10px] text-amber-700">QR / In-Transit</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">
                      <p className="text-[10px] uppercase text-rose-700 font-extrabold">Failed / Cancelled</p>
                      <p className="text-xl font-black text-rose-950">{failedLogs.length}</p>
                      <p className="text-[10px] text-rose-700">Aborted / Declined</p>
                    </div>
                  </div>

                  {/* Logs Table */}
                  {paymentLogs.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-700 text-sm">No Payment Logs Yet</p>
                      <p className="text-xs text-slate-400">Payment attempts and gateway webhooks will be logged here in real-time.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                            <th className="py-3 px-3">Time & Date</th>
                            <th className="py-3 px-3">Order ID / Txn ID</th>
                            <th className="py-3 px-3">Amount</th>
                            <th className="py-3 px-3">Gateway / Status</th>
                            <th className="py-3 px-3">Log Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {paymentLogs.map((log) => {
                            const isSucc = log.status === 'SUCCESS';
                            const isFail = log.status === 'FAILED';
                            return (
                              <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                  {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN') : 'Just now'}
                                </td>
                                <td className="py-3 px-3">
                                  <p className="font-mono font-bold text-slate-900">{log.orderId || 'N/A'}</p>
                                  <p className="font-mono text-[10px] text-slate-400 truncate max-w-[180px]">Txn: {log.merchantTransactionId}</p>
                                </td>
                                <td className="py-3 px-3 font-mono font-black text-emerald-800 text-sm whitespace-nowrap">
                                  ₹{log.amount}
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <span className={`font-bold px-2.5 py-1 rounded-xl text-[10px] border ${
                                    isSucc
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                      : isFail
                                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                                      : 'bg-amber-100 text-amber-900 border-amber-300'
                                  }`}>
                                    {isSucc ? '✓ SUCCESS' : isFail ? '✗ FAILED / CANCELLED' : '⏳ PENDING'}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-mono text-[10px] bg-slate-100 p-2 rounded-xl text-slate-700 max-w-xs break-all">
                                    {log.payload ? log.payload : (log.checksum || 'Gateway Transaction')}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-6 my-auto border border-slate-200 shadow-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 shrink-0">
              <h3 className="font-bold text-base text-slate-900">
                {editingProduct ? 'Edit Nursery Plant' : 'Add New Nursery Plant'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plant English Name *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value, englishName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tamil Name (தமிழ்) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. சிவப்பு ரோஜா"
                    value={prodForm.tamilName}
                    onChange={(e) => setProdForm({ ...prodForm, tamilName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category *</label>
                <select
                  value={prodForm.categoryId}
                  onChange={(e) => {
                    const catObj = categories.find((c) => c.id === e.target.value);
                    setProdForm({ ...prodForm, categoryId: e.target.value, categoryName: catObj?.name || 'Roses' });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.tamilName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px] sm:text-xs">Selling Price (₹) *</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    value={prodForm.sellingPrice ?? ''}
                    onChange={(e) => setProdForm({ ...prodForm, sellingPrice: Number(e.target.value) })}
                    className="w-full px-2.5 sm:px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px] sm:text-xs">MRP Price (₹)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    value={prodForm.mrp ?? ''}
                    onChange={(e) => setProdForm({ ...prodForm, mrp: Number(e.target.value) })}
                    className="w-full px-2.5 sm:px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px] sm:text-xs">Stock Count *</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    value={prodForm.stock ?? ''}
                    onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                    className="w-full px-2.5 sm:px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs"
                  />
                </div>
              </div>

              {/* Dynamic Discount Preview */}
              {(prodForm.mrp || 0) > (prodForm.sellingPrice || 0) && (prodForm.sellingPrice || 0) > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-extrabold text-emerald-800">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Save ₹{(prodForm.mrp || 0) - (prodForm.sellingPrice || 0)} ({Math.round((((prodForm.mrp || 0) - (prodForm.sellingPrice || 0)) / (prodForm.mrp || 1)) * 100)}% Discount)
                  </span>
                </div>
              )}

              <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-700" />
                    <span>Product Images ({prodForm.images?.length || 0}) *</span>
                  </label>
                  <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setProdImgTab('upload')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${prodImgTab === 'upload' ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      📁 Upload Local File
                    </button>
                    <button
                      type="button"
                      onClick={() => setProdImgTab('url')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${prodImgTab === 'url' ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      🔗 Paste Image URL
                    </button>
                  </div>
                </div>

                {prodImgTab === 'upload' ? (
                  <div className="relative">
                    <label
                      htmlFor="admin-product-file-input"
                      className="cursor-pointer border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 rounded-xl p-3.5 flex flex-col items-center justify-center text-center transition-all group"
                    >
                      <Upload className="w-6 h-6 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-slate-800 text-xs">
                        {isUploadingImage ? 'Compressing & Loading Images...' : 'Click or Tap to Upload from Local Storage / Device'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        Select one or multiple photo files (JPG, PNG, WEBP)
                      </span>
                      <input
                        id="admin-product-file-input"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleProdLocalFileUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... or /products/rose.jpg"
                      value={prodUrlInput}
                      onChange={(e) => setProdUrlInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProdUrlImage(); } }}
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddProdUrlImage}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add URL
                    </button>
                  </div>
                )}

                {/* Preview Thumbnails / Gallery with touch controls */}
                {prodForm.images && prodForm.images.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Product Gallery ({prodForm.images.length})</span>
                      <span className="text-emerald-800 font-extrabold">First image is Main Cover</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {prodForm.images.map((imgUrl, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-slate-200 bg-white shadow-xs">
                          <img src={imgUrl} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                          
                          {idx === 0 ? (
                            <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs">
                              Main
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryProdImage(idx)}
                              className="absolute top-1 left-1 bg-slate-900/80 hover:bg-slate-900 active:bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                              title="Set as Main Cover"
                            >
                              Set Main
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveProdImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-600 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                            title="Remove image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-rose-600 font-semibold text-[11px]">
                    ⚠️ No image selected yet. Please upload an image from local storage or paste an image URL.
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Plant Description</label>
                <textarea
                  rows={2}
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              {productSaveError && (
                <div className="px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                  {productSaveError}
                </div>
              )}

              <button
                type="submit"
                disabled={productSaving}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                {productSaving ? 'Saving...' : editingProduct ? 'Save Product Changes' : 'Create Nursery Plant'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-xs">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              Dispatch Order #{dispatchOrder.id}
            </h3>

            {/* Customer Selected Courier Notice */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider">Customer Preference:</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-950">
                  {(dispatchOrder.courierName || '').toLowerCase().includes('mettur') ? '📦 Branch Pickup' : '🚚 Doorstep Delivery'}
                </span>
              </div>
              <p className="font-black text-xs text-amber-950 flex items-center gap-1.5 mt-0.5">
                <Truck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>{dispatchOrder.courierName || 'Professional Courier'}</span>
              </p>
              {(dispatchOrder.courierBranch || dispatchOrder.courierDistrict) && (
                <p className="text-[11px] text-amber-900 font-bold pl-5">
                  📍 Pickup Branch: {dispatchOrder.courierBranch} {dispatchOrder.courierDistrict ? `(${dispatchOrder.courierDistrict} District)` : ''}
                </p>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Delivery Method:</label>
              <select
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs"
              >
                <option value="Professional Courier – Reduced Soil">🚚 Professional Courier – Reduced Soil (Doorstep Delivery)</option>
                <option value="Professional Courier – Full Soil">🌱 Professional Courier – Full Soil (Tamil Nadu Only)</option>
                <option value="Mettur Parcel Service (MSS)">📦 Mettur Parcel Service / MSS (Branch Pickup Depot)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Enter AWB / Tracking Number {courierName.includes('Self Delivery') ? '(Optional for Self Delivery)' : '*'}
              </label>
              <input
                type="text"
                placeholder={courierName.includes('Self Delivery') ? 'VRG-SELF-DELIVERY (Auto-assigned)' : 'e.g. STC-987621023'}
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-emerald-800 space-y-1">
              <p className="font-bold">🌿 Delivering directly by yourself?</p>
              <p className="text-[11px] text-emerald-700">Click below to dispatch instantly without entering a courier tracking code.</p>
              <button
                onClick={() => handleDispatchOrder('VRG-SELF-DELIVERY', 'Self Delivery (Nursery Farm Team)')}
                className="mt-1.5 w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-center shadow-xs"
              >
                🛵 One-Click Self-Delivery Dispatch (No AWB)
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDispatchOrder(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDispatchOrder()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Lightbox Modal */}
      {selectedProofOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-xs max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Camera className={`w-5 h-5 ${isUploadedByImage(selectedProofOrder) ? 'text-purple-600' : 'text-indigo-600'}`} />
                  <span>{isUploadedByImage(selectedProofOrder) ? 'Uploaded Order Image / Bill (AI Scanned)' : 'Customer Payment Receipt Proof'}</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Order #{selectedProofOrder.id} • Txn: {selectedProofOrder.merchantTransactionId}
                </p>
              </div>
              <button 
                onClick={() => setSelectedProofOrder(null)} 
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-slate-800 text-xs">
                  Customer: <span className="text-slate-950 font-black">{selectedProofOrder.customerName}</span> (+91 {selectedProofOrder.customerPhone})
                </p>
                <p className="font-black text-emerald-800 text-sm">
                  Amount Paid: ₹{selectedProofOrder.grandTotal}
                </p>
              </div>
              {selectedProofOrder.transactionId && (
                <p className="font-mono text-indigo-900 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 text-xs inline-block">
                  UTR / Ref: {selectedProofOrder.transactionId}
                </p>
              )}
              {selectedProofOrder.paymentProofUploadedAt && (
                <p className="text-[10px] text-slate-400 font-medium">
                  Uploaded at: {new Date(selectedProofOrder.paymentProofUploadedAt).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 rounded-2xl p-3 flex items-center justify-center min-h-[280px]">
              {selectedProofOrder.paymentProofUrl ? (
                <img
                  src={selectedProofOrder.paymentProofUrl}
                  alt="Customer Payment Receipt Proof"
                  className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-lg mx-auto"
                />
              ) : (
                <div className="p-8 text-center bg-slate-900 rounded-2xl text-slate-400 font-semibold space-y-1">
                  <p className="text-sm">⚠️ No screenshot photo attached to this order.</p>
                  <p className="text-[11px] text-slate-500 font-normal">This payment was placed via direct gateway or manual UTR reference.</p>
                </div>
              )}
            </div>

            {/* Verification Actions & Download */}
            <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-200 shrink-0">
              {selectedProofOrder.paymentProofUrl && (
                <a
                  href={selectedProofOrder.paymentProofUrl}
                  download={`payment-receipt-${selectedProofOrder.id}.jpg`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Download / View Full</span>
                </a>
              )}

              <button
                onClick={async () => {
                  await handleUpdateOrderStatus(selectedProofOrder.id, selectedProofOrder.orderStatus === 'PENDING' ? 'PROCESSING' : selectedProofOrder.orderStatus, 'SUCCESS');
                  setSelectedProofOrder(null);
                }}
                className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Approve & Mark Paid</span>
              </button>

              <button
                onClick={async () => {
                  await handleUpdateOrderStatus(selectedProofOrder.id, selectedProofOrder.orderStatus, 'FAILED');
                  setSelectedProofOrder(null);
                }}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Reject Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProofOrder(null)}
                className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Reassignment Guard Modal */}
      {deleteCatTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-rose-200 shadow-2xl text-xs">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Category Contains Products</h3>
                <p className="text-[11px] text-slate-500">Accidental deletion protection active</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-slate-700 space-y-1">
              <p className="font-bold">
                Category "{deleteCatTarget.category.name}" currently has <span className="text-rose-700 font-extrabold">{deleteCatTarget.productCount}</span> linked products.
              </p>
              <p className="text-[11px] text-slate-600">
                You must move these products to another category before this category can be safely deleted.
              </p>
            </div>

            {categories.filter((c) => c.id !== deleteCatTarget.category.id).length > 0 ? (
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Move all {deleteCatTarget.productCount} products to:</label>
                <select
                  value={reassignCategoryId}
                  onChange={(e) => setReassignCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                >
                  {categories
                    .filter((c) => c.id !== deleteCatTarget.category.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.tamilName})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <p className="text-rose-600 font-medium italic">
                No alternative categories exist. Please create another category first, or reassign products manually.
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteCatTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              {categories.filter((c) => c.id !== deleteCatTarget.category.id).length > 0 && (
                <button
                  onClick={handleConfirmReassignDelete}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Move & Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 my-8 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Plant Category'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category English Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Roses"
                    value={catForm.name}
                    onChange={(e) => {
                      const nameVal = e.target.value;
                      const autoSlug = nameVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setCatForm({
                        ...catForm,
                        name: nameVal,
                        slug: editingCategory ? catForm.slug : autoSlug
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tamil Name (தமிழ்) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ரோஜா செடிகள்"
                    value={catForm.tamilName}
                    onChange={(e) => setCatForm({ ...catForm, tamilName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">URL Slug *</label>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
                    <span className="text-slate-400 font-mono text-[10px]">/category/</span>
                    <input
                      type="text"
                      required
                      placeholder="roses"
                      value={catForm.slug}
                      onChange={(e) => setCatForm({ ...catForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="w-full bg-transparent font-mono font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Display Order #</label>
                  <input
                    type="number"
                    min={1}
                    value={catForm.order}
                    onChange={(e) => setCatForm({ ...catForm, order: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Plant Photo *</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    required
                    placeholder="/products/double-delight.jpeg or https://..."
                    value={catForm.image}
                    onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px]"
                  />
                  <img
                    src={catForm.image || '/products/double-delight.jpeg'}
                    alt="Preview"
                    className="w-10 h-10 rounded-xl object-cover border shrink-0 bg-slate-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/products/double-delight.jpeg';
                    }}
                  />
                </div>

                {/* Upload Local File or Pick from Nursery Photos */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[10px] cursor-pointer inline-flex items-center gap-1 transition-colors">
                    <span>📁 Upload Local Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (re) => {
                          const result = re.target?.result as string;
                          if (result) setCatForm(prev => ({ ...prev, image: result }));
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>

                  <span className="text-[10px] text-slate-400">or quick select:</span>
                  {[
                    { label: '🌹 Rose', url: '/products/double-delight.jpeg' },
                    { label: '🌿 Herbal', url: '/products/ww.jpeg' },
                    { label: '🌸 Jasmine', url: '/products/sgssg.jpeg' },
                    { label: '🧗 Creeper', url: '/products/white-creeper.jpeg' },
                    { label: '🌱 Miniature', url: '/products/button-rose.jpeg' },
                    { label: '✨ Rare', url: '/products/rejtrjtj.jpeg' },
                    { label: '🍎 Fruit', url: '/products/red-water-apple.jpeg' },
                    { label: '🌺 Hibiscus', url: '/products/new_plant_13.jpg' },
                    { label: '🌼 Flower', url: '/products/new_plant_05.jpg' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCatForm(prev => ({ ...prev, image: p.url }))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium border border-slate-200 cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="High-yield grafted varieties cultivated in Hosur & Kadiyam nurseries..."
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catForm.isActive}
                      onChange={(e) => setCatForm({ ...catForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-slate-800">Active (Visible on Store)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catForm.isFeatured}
                      onChange={(e) => setCatForm({ ...catForm, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-bold text-amber-900">★ Featured Category</span>
                  </label>
                </div>
              </div>

              {/* Collapsible SEO Meta Fields */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSeoFields(!showSeoFields)}
                  className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 font-bold text-slate-800 flex justify-between items-center transition-colors"
                >
                  <span>🔍 SEO Meta Data & Schema (Optional)</span>
                  <span>{showSeoFields ? '▲ Hide' : '▼ Expand'}</span>
                </button>

                {showSeoFields && (
                  <div className="p-4 space-y-3 bg-white">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">SEO Title Tag</label>
                      <input
                        type="text"
                        placeholder="Roses (ரோஜா செடிகள்) - Farm Direct Hybrid Rose Plants"
                        value={catForm.metaTitle}
                        onChange={(e) => setCatForm({ ...catForm, metaTitle: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Meta Description</label>
                      <textarea
                        rows={2}
                        placeholder="Buy high-yield hybrid rose plants directly from nursery in Tamil Nadu..."
                        value={catForm.metaDescription}
                        onChange={(e) => setCatForm({ ...catForm, metaDescription: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">OG Image URL</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={catForm.ogImage}
                          onChange={(e) => setCatForm({ ...catForm, ogImage: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[10px]"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Canonical URL</label>
                        <input
                          type="text"
                          placeholder="https://veerikarosegarden.com/#/category/roses"
                          value={catForm.canonicalUrl}
                          onChange={(e) => setCatForm({ ...catForm, canonicalUrl: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[10px]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {editingCategory ? 'Save Category Changes' : 'Create Store Category'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Add Finance / Spending Entry Modal */}
      {showFinanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 my-8 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <span>{editingFinance ? '✏️ Edit Farm Expense or Sale Entry' : '💰 Add Farm Expense or Sale Entry'}</span>
              </h3>
              <button onClick={() => { setShowFinanceModal(false); setEditingFinance(null); }} className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>

            </div>

            <form onSubmit={handleSaveFinance} className="space-y-4 text-xs">
              {/* Type Selector */}
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFinanceForm({ ...financeForm, type: 'EXPENSE' })}
                  className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${financeForm.type === 'EXPENSE' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'}`}
                >
                  💸 Farm Spending / Cost
                </button>
                <button
                  type="button"
                  onClick={() => setFinanceForm({ ...financeForm, type: 'SALE' })}
                  className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${financeForm.type === 'SALE' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'}`}
                >
                  🛍️ Farm / Wholesale Sale
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder={financeForm.type === 'EXPENSE' ? "e.g. Vermicompost 50kg, HDPE Bags, Worker wages" : "e.g. Wholesale Rose Batch to Hosur Reseller"}
                  value={financeForm.title}
                  onChange={(e) => setFinanceForm({ ...financeForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={financeForm.category}
                    onChange={(e) => setFinanceForm({ ...financeForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Fertilizer">Fertilizer & Manure</option>
                    <option value="Pots & Bags">Pots & HDPE Bags</option>
                    <option value="Soil & Manure">Soil & Coco Peat</option>
                    <option value="Labor & Workers">Labor & Worker Wages</option>
                    <option value="Transport & Freight">Transport & Freight</option>
                    <option value="Plant Wholesale">Plant Wholesale</option>
                    <option value="Direct Nursery Sale">Direct Nursery Sale</option>
                    <option value="Other">Other Operational Cost</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={financeForm.quantity}
                    onChange={(e) => setFinanceForm({ ...financeForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Spending / Cost Incurred (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={financeForm.costAmount}
                    onChange={(e) => setFinanceForm({ ...financeForm, costAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-rose-700"
                  />
                </div>

                {financeForm.type === 'SALE' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Selling Price / Revenue (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={financeForm.sellAmount}
                      onChange={(e) => setFinanceForm({ ...financeForm, sellAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-emerald-800"
                    />
                  </div>
                )}
              </div>

              {/* Live Profit Preview Box */}
              {financeForm.type === 'SALE' && (
                <div className={`p-3 rounded-2xl border font-bold flex justify-between items-center ${
                  (financeForm.sellAmount - financeForm.costAmount) >= 0 ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-rose-50 text-rose-900 border-rose-300'
                }`}>
                  <span>Calculated Net Profit/Loss:</span>
                  <span className="font-mono text-sm">
                    {(financeForm.sellAmount - financeForm.costAmount) >= 0
                      ? `+₹${financeForm.sellAmount - financeForm.costAmount} PROFIT`
                      : `-₹${Math.abs(financeForm.sellAmount - financeForm.costAmount)} LOSS`}
                  </span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Date & Notes (Optional)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={financeForm.date}
                    onChange={(e) => setFinanceForm({ ...financeForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Notes (e.g. Bill reference)"
                    value={financeForm.notes}
                    onChange={(e) => setFinanceForm({ ...financeForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Save Financial Log Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Combo Offer Modal */}
      {showComboModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Sticky Top Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>🎁 {editingCombo ? 'Edit Plant Combo Package' : 'Create New Plant Combo Package'}</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Select grouped plants, adjust quantities, set offer badge & combo discount price.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowComboModal(false)}
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (comboForm.productIds.length === 0) {
                  alert('Please select at least 1 plant for the combo package.');
                  return;
                }

                const orig = Number(comboForm.originalPrice || 0);
                const comboP = Number(comboForm.comboPrice || 0);
                const discPct = orig > comboP ? Math.round(((orig - comboP) / orig) * 100) : 0;
                const payload = {
                  ...comboForm,
                  originalPrice: orig,
                  comboPrice: comboP,
                  discountPercent: discPct
                };

                const prodMap = new Map(products.map(p => [p.id, p]));
                const matchedProds = (comboForm.productIds || []).map(pid => prodMap.get(pid)).filter(Boolean) as Product[];
                const tempId = editingCombo?.id || 'combo-' + Date.now();
                const fullComboItem = {
                  ...payload,
                  products: matchedProds,
                  id: tempId
                };

                // Clear from deleted set
                try {
                  const deleted = JSON.parse(localStorage.getItem('vrg_deleted_combos') || '[]');
                  const filtered = deleted.filter((delId: string) => delId !== tempId && (editingCombo ? delId !== editingCombo.id : true));
                  localStorage.setItem('vrg_deleted_combos', JSON.stringify(filtered));
                } catch {}

                if (editingCombo) {
                  setCombos(prev => {
                    const next = prev.map(c => c.id === editingCombo.id ? { ...c, ...fullComboItem } : c);
                    try {
                      const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                      cached.combos = next;
                      localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                    } catch {}
                    return next;
                  });
                } else {
                  setCombos(prev => {
                    const next = [fullComboItem, ...prev];
                    try {
                      const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                      cached.combos = next;
                      localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                      localStorage.setItem('vrg_combos_cache', JSON.stringify(next));
                    } catch {}
                    return next;
                  });
                }

                setShowComboModal(false);

                try {
                  if (editingCombo) {
                    const res = await authFetch(`/api/admin/combos/${editingCombo.id}`, {
                      method: 'PUT',
                      body: JSON.stringify(payload)
                    });
                    const data = await res.json().catch(() => null);
                    if (data && data.success && data.combo) {
                      setCombos(prev => {
                        const next = prev.map(c => (c.id === data.combo.id || c.id === editingCombo.id) ? { ...c, ...data.combo } : c);
                        try {
                          const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                          cached.combos = next;
                          localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                          localStorage.setItem('vrg_combos_cache', JSON.stringify(next));
                        } catch {}
                        return next;
                      });
                    }
                  } else {
                    const res = await authFetch('/api/admin/combos', {
                      method: 'POST',
                      body: JSON.stringify(payload)
                    });
                    const data = await res.json().catch(() => null);
                    if (data && data.success && data.combo) {
                      setCombos(prev => {
                        const next = prev.map(c => (c.id === tempId || c.id === data.combo.id) ? { ...c, ...data.combo } : c);
                        try {
                          const cached = JSON.parse(localStorage.getItem('vrg_admin_bootstrap_cache') || '{}');
                          cached.combos = next;
                          localStorage.setItem('vrg_admin_bootstrap_cache', JSON.stringify(cached));
                          localStorage.setItem('vrg_combos_cache', JSON.stringify(next));
                        } catch {}
                        return next;
                      });
                    }
                  }
                  window.dispatchEvent(new CustomEvent('vrg_combos_updated'));
                } catch (err) {
                  console.error('Error saving combo:', err);
                }
              }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Combo Package Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Exotic Fruit Garden Trio"
                    value={comboForm.title}
                    onChange={(e) => setComboForm({ ...comboForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subtitle / Plant Summary</label>
                  <input
                    type="text"
                    placeholder="e.g. 1x Black Guava + 1x Pink Guava + 1x Mango Sapling"
                    value={comboForm.subtitle}
                    onChange={(e) => setComboForm({ ...comboForm, subtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Offer Badge Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. 3-IN-1 COMBO"
                      value={comboForm.badge}
                      onChange={(e) => setComboForm({ ...comboForm, badge: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Combo Cover Image URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="/products/black-guava-plant.jpeg"
                      value={comboForm.imageUrl}
                      onChange={(e) => setComboForm({ ...comboForm, imageUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    />
                  </div>
                </div>

                {/* Grouped Product Selector with Search & +/- Quantity Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700">
                      Select Grouped Plants ({comboForm.productIds.length} Total Saplings Selected) *
                    </label>
                    {comboForm.productIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setComboForm(prev => ({ ...prev, productIds: [], originalPrice: 0, comboPrice: 0 }))}
                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Clear All Selected
                      </button>
                    )}
                  </div>

                  {/* Plant Search Filter Box */}
                  <div className="relative mb-2">
                    <input
                      type="text"
                      placeholder="🔍 Search plant by name, Tamil name, or category..."
                      value={comboSearchQuery}
                      onChange={(e) => setComboSearchQuery(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {comboSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setComboSearchQuery('')}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Scrollable Plant List */}
                  <div className="max-h-56 overflow-y-auto border border-slate-300 rounded-2xl p-2 space-y-1.5 bg-slate-50">
                    {(() => {
                      const filteredProds = products.filter(p =>
                        !comboSearchQuery.trim() ||
                        p.name.toLowerCase().includes(comboSearchQuery.toLowerCase()) ||
                        (p.tamilName || '').toLowerCase().includes(comboSearchQuery.toLowerCase()) ||
                        (p.categoryId || '').toLowerCase().includes(comboSearchQuery.toLowerCase())
                      );

                      if (filteredProds.length === 0) {
                        return (
                          <div className="p-4 text-center text-slate-500 italic">
                            No plants found matching "{comboSearchQuery}"
                          </div>
                        );
                      }

                      return filteredProds.map(p => {
                        const count = comboForm.productIds.filter(id => id === p.id).length;

                        const updateFormForIds = (nextIds: string[]) => {
                          const selectedProds = nextIds.map(id => products.find(item => item.id === id)).filter(Boolean) as Product[];
                          const autoMrpSum = selectedProds.reduce((sum, item) => sum + (item.mrp || item.sellingPrice || 0), 0);
                          const autoSellingSum = selectedProds.reduce((sum, item) => sum + (item.sellingPrice || 0), 0);

                          setComboForm(prev => ({
                            ...prev,
                            productIds: nextIds,
                            originalPrice: autoMrpSum > 0 ? autoMrpSum : prev.originalPrice,
                            comboPrice: autoSellingSum > 0 ? Math.round(autoSellingSum * 0.8) : prev.comboPrice
                          }));
                        };

                        const handleAddOne = () => {
                          updateFormForIds([...comboForm.productIds, p.id]);
                        };

                        const handleRemoveOne = () => {
                          const idx = comboForm.productIds.lastIndexOf(p.id);
                          if (idx !== -1) {
                            const nextIds = [...comboForm.productIds];
                            nextIds.splice(idx, 1);
                            updateFormForIds(nextIds);
                          }
                        };

                        return (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${
                              count > 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                              <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'} className="w-9 h-9 rounded-lg object-cover border shrink-0" alt={p.name} />
                              <div className="min-w-0">
                                <p className={`truncate text-xs ${count > 0 ? 'font-bold text-emerald-950' : 'font-semibold text-slate-800'}`}>
                                  {p.name}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium truncate">
                                  {p.tamilName ? `${p.tamilName} • ` : ''}₹{p.sellingPrice} (MRP ₹{p.mrp})
                                </p>
                              </div>
                            </div>

                            {/* Quantity Controls (+ / -) */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {count > 0 ? (
                                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-emerald-300 shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={handleRemoveOne}
                                    className="w-6 h-6 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
                                    title="Decrease plant quantity"
                                  >
                                    -
                                  </button>
                                  <span className="w-6 text-center font-black text-emerald-900 text-xs font-mono">
                                    {count}x
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleAddOne}
                                    className="w-6 h-6 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
                                    title="Increase plant quantity"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleAddOne}
                                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <span>+ Add</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="grid grid-cols-2 gap-3 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200">
                  <div>
                    <label className="font-bold text-amber-900 block mb-1">Original Total MRP (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={comboForm.originalPrice}
                      onChange={(e) => setComboForm({ ...comboForm, originalPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-black font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-emerald-900 block mb-1">Combo Special Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={comboForm.comboPrice}
                      onChange={(e) => setComboForm({ ...comboForm, comboPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-black font-mono text-emerald-900 text-sm"
                    />
                  </div>
                </div>

                {/* Discount Tag Preview */}
                {comboForm.originalPrice > comboForm.comboPrice && (
                  <div className="bg-emerald-100 text-emerald-900 p-2.5 rounded-xl font-extrabold text-center text-xs border border-emerald-300">
                    🎉 Customer Saves ₹{comboForm.originalPrice - comboForm.comboPrice} ({Math.round(((comboForm.originalPrice - comboForm.comboPrice) / comboForm.originalPrice) * 100)}% OFF)
                  </div>
                )}

                {/* Free Delivery Toggle Button */}
                <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🚚</span>
                    <div>
                      <label htmlFor="comboFreeDelivery" className="font-extrabold text-emerald-950 text-xs cursor-pointer block">
                        Free Delivery for this Combo Package
                      </label>
                      <p className="text-[11px] text-emerald-800 font-medium">
                        Offer 100% FREE Shipping for customers buying this combo bundle!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="comboFreeDelivery"
                    onClick={() => setComboForm(prev => ({ ...prev, freeDelivery: !prev.freeDelivery }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      comboForm.freeDelivery ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        comboForm.freeDelivery ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="comboActive"
                    checked={comboForm.active}
                    onChange={(e) => setComboForm({ ...comboForm, active: e.target.checked })}
                    className="w-4 h-4 text-emerald-700 rounded"
                  />
                  <label htmlFor="comboActive" className="font-bold text-slate-800 cursor-pointer">
                    Show this Combo Package live on the homepage
                  </label>
                </div>
              </div>

              {/* Sticky Bottom Footer with Cancel and Save Buttons */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowComboModal(false)}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-700 to-amber-700 hover:from-emerald-800 hover:to-amber-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCombo ? 'Save Combo Package Changes' : 'Publish Combo Package'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Photo & Create/Edit Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span>{editingReview ? 'Edit Customer Review & Photo' : 'Upload Local Photo & Add Customer Review'}</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Upload a photo directly from your local computer and set review details.</p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4 text-xs">
              {/* Local File Uploader */}
              <div className="p-4 bg-emerald-50/70 border-2 border-dashed border-emerald-300 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-950 font-bold">
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span>Upload Plant Photo from Local System</span>
                </div>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReviewPhotoUpload}
                  className="w-full text-xs text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer"
                />

                {reviewForm.imageUrl ? (
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md">
                    <img src={reviewForm.imageUrl} alt="Review upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setReviewForm(prev => ({ ...prev, imageUrl: '' }))}
                      className="absolute top-2 right-2 bg-rose-600 text-white rounded-full p-1.5 shadow-md hover:bg-rose-700 cursor-pointer"
                      title="Remove uploaded image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No image selected yet. Selecting a photo will store it as a base64 Data URL.</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kavitha R."
                    value={reviewForm.userName}
                    onChange={e => setReviewForm({ ...reviewForm, userName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Pennagaram, Tamil Nadu"
                    value={reviewForm.location}
                    onChange={e => setReviewForm({ ...reviewForm, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Star Rating (1 to 5) *</label>
                  <div className="flex items-center gap-1.5 bg-amber-50/60 p-2 rounded-xl border border-amber-200">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="p-1 hover:scale-125 transition-transform cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= reviewForm.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                      </button>
                    ))}
                    <span className="font-black text-amber-900 ml-2 text-sm">{reviewForm.rating} / 5</span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Plant / Product</label>
                  <select
                    value={reviewForm.productName}
                    onChange={e => {
                      const selProd = products.find(p => p.name === e.target.value);
                      setReviewForm({
                        ...reviewForm,
                        productName: e.target.value,
                        productId: selProd?.id || 'custom'
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  >
                    <option value="Dutch Hybrid Red Rose">Dutch Hybrid Red Rose</option>
                    {products.map(p => (
                      <option key={p.id} value={p.name}>{p.name} ({p.tamilName})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Review Headline / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Beautiful blooming roses delivered safe!"
                  value={reviewForm.title}
                  onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Detailed Customer Review / Comment *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Write the review content..."
                  value={reviewForm.comment}
                  onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviewForm.status === 'APPROVED'}
                    onChange={e => setReviewForm({ ...reviewForm, status: e.target.checked ? 'APPROVED' : 'PENDING' })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-bold text-slate-900">Approve & Make Live on Homepage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviewForm.featured}
                    onChange={e => setReviewForm({ ...reviewForm, featured: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span className="font-bold text-amber-900">★ Feature on Homepage</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-700 to-amber-600 hover:from-emerald-800 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                {editingReview ? 'Save Review Changes' : 'Publish Review & Photo to Store'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp / Offline Order Creation & Editing Modal */}
      {renderWhatsAppOrderModal()}

      {/* Desktop A4 Label Sheet Preview Modal */}
      {desktopLabelOrders && (
        <A4LabelSheetPrint
          orders={desktopLabelOrders}
          onClose={() => setDesktopLabelOrders(null)}
        />
      )}

      {/* Mobile Bottom Navigation Bar for All Admin Modules */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-6 py-2 flex items-center justify-between shadow-lg max-w-md mx-auto">
        <button
          onClick={() => setAdminLayoutMode('mobile_workflow')}
          className="flex flex-col items-center gap-1 transition-colors cursor-pointer text-slate-500 font-medium hover:text-[#14532d]"
        >
          <Sprout className="w-5 h-5 text-emerald-700" />
          <span className="text-[10px]">Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'products' ? 'text-[#14532d] font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px]">Products</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'orders' ? 'text-[#14532d] font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px]">Orders</span>
        </button>

        <button
          onClick={() => setShowAdminMenuDrawer(true)}
          className="flex flex-col items-center gap-1 transition-colors cursor-pointer text-slate-500 font-medium hover:text-[#14532d]"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">All Modules</span>
        </button>
      </nav>
    </div>
  );
};

