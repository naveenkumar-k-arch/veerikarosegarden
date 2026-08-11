import React, { useState, useEffect } from 'react';
import { Product, Category, Order, Coupon, Banner, Review, SiteSettings, PaymentLog, FinancialEntry, Combo } from '../types';
import { LayoutDashboard, Package, ShoppingBag, FolderTree, Tag, Image, Star, Settings as SettingsIcon, ShieldCheck, Plus, Edit, Trash2, Check, X, RefreshCw, Printer, AlertTriangle, Search, Lock, ExternalLink, DollarSign, TrendingUp, TrendingDown, Camera, CreditCard, ChevronDown, User, Phone, MapPin, Upload, MessageSquare, ThumbsUp, Eye, EyeOff, Sparkles } from 'lucide-react';

import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/catalogData';
import { INITIAL_REVIEWS } from '../data/reviewsData';

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
      setMsg('✅ Coupon created!');
      setForm({ code: '', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 0, maxUsageCount: 100, expiryDate: '', isActive: true, description: '' });
    } catch { setMsg('❌ Failed to create coupon'); }
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'orders' | 'inventory' | 'coupons' | 'banners' | 'reviews' | 'settings' | 'audit' | 'finances'>('dashboard');
  const [orderFilterStage, setOrderFilterStage] = useState<'all' | 'pending' | 'packing' | 'dispatched' | 'delivered'>('all');

  const getInitialAdminOrders = (): Order[] => {
    let localOrders: Order[] = [];
    const keysToRead = ['veerika_admin_orders', 'vrg_user_orders', 'veerika_customer_orders', 'vrg_orders'];

    keysToRead.forEach(key => {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localOrders = [...localOrders, ...parsed];
          }
        }
      } catch {}
    });

    const uniqueMap = new Map<string, Order>();
    localOrders.forEach(o => {
      if (o && o.id) uniqueMap.set(o.id, o);
    });

    // Return real local orders only — no hardcoded dummy data
    return Array.from(uniqueMap.values());
  };

  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [orders, setOrders] = useState<Order[]>(getInitialAdminOrders);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
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

  const [banners, setBanners] = useState<Banner[]>([]);
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

    try {
      await authFetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ reply: text })
      });
    } catch (err) {
      console.error('API save review reply error:', err);
    }
  };
  const [settings, setSettings] = useState<SiteSettings | null>({} as SiteSettings);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);


  // Financial P&L Entries state
  const [finances, setFinances] = useState<FinancialEntry[]>([]);
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


  // Track recently-edited stock so auto-poll doesn't overwrite user changes
  const pendingStockRef = React.useRef<Map<string, number>>(new Map());

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dispatchOrder, setDispatchOrder] = useState<Order | null>(null);
  const [courierName, setCourierName] = useState('ST Courier');
  const [trackingNumber, setTrackingNumber] = useState('');

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
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
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
    categoryId: 'cat-roses',
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
    setLoading(true);
    try {
      const [sRes, pRes, cRes, oRes, cpRes, bRes, rRes, stRes, plRes, fnRes, cbRes] = await Promise.all([
        authFetch('/api/admin/dashboard').then((r) => r.json()).catch(() => null),
        authFetch('/api/products').then((r) => r.json()).catch(() => null),
        authFetch('/api/admin/categories').then((r) => r.json()).catch(() => null),
        authFetch('/api/admin/orders').then((r) => r.json()).catch(() => null),
        authFetch('/api/coupons').then((r) => r.json()).catch(() => null),
        authFetch('/api/banners').then((r) => r.json()).catch(() => null),
        authFetch('/api/reviews').then((r) => r.json()).catch(() => null),
        authFetch('/api/admin/settings').then((r) => r.json()).catch(() => null),
        authFetch('/api/admin/payment-logs').then((r) => r.json()).catch(() => null),
        authFetch('/api/admin/finances').then((r) => r.json()).catch(() => null),
        authFetch('/api/combos').then((r) => r.json()).catch(() => null)
      ]);

      if (cbRes?.success && Array.isArray(cbRes.combos)) {
        setCombos(cbRes.combos);
      }

      if (fnRes?.success && Array.isArray(fnRes.entries)) {
        setFinances(fnRes.entries);
      }

      if (sRes?.success) setStats(sRes.stats);

      if (pRes?.success && Array.isArray(pRes.products) && pRes.products.length > 0) {
        const now = Date.now();
        setProducts(prev => {
          return pRes.products.map((apiProd: Product) => {
            const editedAt = pendingStockRef.current.get(apiProd.id);
            if (editedAt && now - editedAt < 10000) {
              const local = prev.find(p => p.id === apiProd.id);
              return local ? { ...apiProd, stock: local.stock } : apiProd;
            }
            return apiProd;
          });
        });
      }

      if (cRes?.success && Array.isArray(cRes.categories) && cRes.categories.length > 0) {
        setCategories(cRes.categories);
      }

      if (cpRes?.success && Array.isArray(cpRes.coupons)) {
        setCoupons(cpRes.coupons);
      }

      if (oRes?.success && Array.isArray(oRes.orders)) {
        setOrders(oRes.orders);
      }


      if (bRes?.success) setBanners(bRes.banners);
      if (rRes?.success) setReviews(rRes.reviews);
      if (stRes?.success) setSettings(stRes.settings);
      if (plRes?.success) setPaymentLogs(plRes.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Purge legacy local storage blacklists that cause multi-device desync
    localStorage.removeItem('vrg_deleted_orders');
    localStorage.removeItem('vrg_deleted_products');
    localStorage.removeItem('vrg_deleted_categories');
    localStorage.removeItem('vrg_deleted_coupons');
    localStorage.removeItem('vrg_deleted_finances');

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
          console.warn('[SECURITY] Unauthenticated or unauthorized access to Admin Dashboard. Redirecting.');
          localStorage.removeItem('vrg_user');
          onBackToStore();
        }
      } catch {
        // If backend auth check fails, fallback to standard error handling in authFetch
      }
    };
    verifySession();

    fetchData();
    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    const handleSync = () => fetchData();
    window.addEventListener('orderStatusUpdated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('orderStatusUpdated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const [productSaveError, setProductSaveError] = useState<string | null>(null);
  const [productSaving, setProductSaving] = useState(false);

  // Handle Save Product (Create or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductSaveError(null);
    setProductSaving(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      // Auto-generate SKU if not provided
      const autoSku = prodForm.sku ||
        `VRG-${(prodForm.name || 'PLANT').replace(/\s+/g, '-').toUpperCase().slice(0, 12)}-${Date.now().toString(36).toUpperCase()}`;

      // Compute discount % if not set
      const mrp = prodForm.mrp || 0;
      const sellingPrice = prodForm.sellingPrice || 0;
      const autoDiscount = mrp > 0 ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

      // Build complete payload with defaults for every optional field
      const payload = {
        sku: autoSku,
        name: prodForm.name || '',
        englishName: prodForm.englishName || prodForm.name || '',
        tamilName: prodForm.tamilName || '',
        scientificName: prodForm.scientificName || '',
        categoryId: prodForm.categoryId || 'cat-roses',
        categoryName: prodForm.categoryName || 'Roses',
        description: prodForm.description || prodForm.name || '',
        mrp,
        sellingPrice,
        discount: prodForm.discount ?? autoDiscount,
        stock: prodForm.stock ?? 25,
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
        images: prodForm.images?.filter(Boolean).length
          ? prodForm.images
          : ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'],
        featured: prodForm.featured ?? false,
        bestSeller: prodForm.bestSeller ?? false,
        trending: prodForm.trending ?? false,
        tags: prodForm.tags?.length ? prodForm.tags : [prodForm.categoryName || 'Plant'],
        status: 'ACTIVE'
      };

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setShowProductModal(false);
        setEditingProduct(null);
        setProductSaveError(null);
        fetchData();
      } else {
        const errDetail = data.errors?.map((e: any) => e.message).join(', ') || data.message || 'Save failed';
        setProductSaveError(`❌ ${errDetail}`);
      }
    } catch (err: any) {
      setProductSaveError(`❌ Network error: ${err.message}`);
    } finally {
      setProductSaving(false);
    }
  };



  // Handle Delete Single Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"?`)) return;
    setProducts(prev => prev.filter(p => p.id !== id));
    try {
      await authFetch(`/api/products/${id}`, { method: 'DELETE' }).catch(() => null);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete All Products
  const handleDeleteAllProducts = async () => {
    if (!confirm('⚠️ WARNING: Are you sure you want to delete ALL products from the catalog? This action cannot be undone.')) return;
    setProducts([]);
    try {
      await authFetch('/api/products/all?confirm=CONFIRM_DELETE_ALL', { method: 'DELETE' }).catch(() => null);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(catForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowCategoryModal(false);
        setEditingCategory(null);
        setCatForm({
          name: '',
          tamilName: '',
          slug: '',
          description: '',
          image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
          iconName: 'Flower2',
          order: categories.length + 1,
          isActive: true,
          isFeatured: false,
          metaTitle: '',
          metaDescription: '',
          ogImage: '',
          canonicalUrl: ''
        });
        fetchData();
      } else {
        alert(data.message || 'Failed to save category');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving category');
    }
  };

  // Handle Delete Single Category with Product Reassignment Check
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    try {
      const res = await authFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
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
    try {
      const res = await authFetch(
        `/api/admin/categories/${deleteCatTarget.category.id}?targetCategoryId=${reassignCategoryId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        setDeleteCatTarget(null);
        fetchData();
      } else {
        alert(data.message || 'Failed to reassign and delete category');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete All Categories
  const handleDeleteAllCategories = async () => {
    if (!confirm('⚠️ WARNING: Are you sure you want to delete ALL categories? This action cannot be undone.')) return;
    try {
      const res = await authFetch('/api/admin/categories/all?confirm=CONFIRM_DELETE_ALL', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('All categories removed successfully.');
        fetchData();
      } else {
        alert(data.message || 'Failed to delete all categories');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(`⚠️ Are you sure you want to permanently delete Order #${orderId}? This action cannot be undone.`)) return;

    // Remove order from UI state
    setOrders(prev => prev.filter(o => o.id !== orderId && o.merchantTransactionId !== orderId));

    // Trigger backend deletion endpoints
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

    try {
      const res = await authFetch(`/api/admin/orders/${dispatchOrder.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          orderStatus: 'DISPATCHED',
          courierName: finalCourier,
          trackingNumber: finalTracking
        })
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setDispatchOrder(null);
        setTrackingNumber('');
        fetchData();
      } else {
        // Fallback update local orders state
        setOrders(prev => prev.map(o => o.id === dispatchOrder.id ? { ...o, orderStatus: 'DISPATCHED', courierName: finalCourier, trackingNumber: finalTracking } : o));
        setDispatchOrder(null);
        setTrackingNumber('');
      }
    } catch (err) {
      console.error(err);
      setOrders(prev => prev.map(o => o.id === dispatchOrder.id ? { ...o, orderStatus: 'DISPATCHED', courierName: finalCourier, trackingNumber: finalTracking } : o));
      setDispatchOrder(null);
      setTrackingNumber('');
    }
  };

  // Handle Quick Order Status Updates
  const handleUpdateOrderStatus = async (orderId: string, status: string, paymentStatus?: string) => {
    try {
      await authFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ orderStatus: status, paymentStatus })
      }).catch(() => null);
    } catch {}

    const updateSingleOrder = (o: Order): Order => {
      if (o.id === orderId) {
        return {
          ...o,
          orderStatus: status as any,
          paymentStatus: paymentStatus ? (paymentStatus as any) : o.paymentStatus
        };
      }
      return o;
    };

    setOrders(prev => {
      const updatedOrdersList = prev.map(updateSingleOrder);

      const keysToSave = ['veerika_admin_orders', 'vrg_user_orders', 'veerika_customer_orders', 'vrg_orders'];
      keysToSave.forEach(key => {
        try {
          localStorage.setItem(key, JSON.stringify(updatedOrdersList));
        } catch {}
      });

      return updatedOrdersList;
    });

    try {
      window.dispatchEvent(new CustomEvent('orderStatusUpdated', { detail: { orderId, status, paymentStatus } }));
    } catch {}
  };

  // Send WhatsApp Customer Alert
  const handleSendWhatsAppUpdate = (o: Order) => {
    const phoneClean = (o.customerPhone || '').replace(/[^0-9]/g, '');
    const targetPhone = phoneClean.length === 10 ? '91' + phoneClean : phoneClean;
    const statusMsg = o.orderStatus === 'DELIVERED' 
      ? '✅ DELIVERED! Thank you for buying plants from Veerika Rose Garden.' 
      : o.orderStatus === 'DISPATCHED' 
      ? `🚚 DISPATCHED via ${(o as any).courierName || 'ST Courier'} (AWB/Tracking: ${(o as any).trackingNumber || 'VRG-SELF-DELIVERY'}).` 
      : o.orderStatus === 'PROCESSING' 
      ? '🌿 NURSERY PACKING! Our farm team is preparing your live saplings with 7-day root moisture protection.' 
      : '🌸 ORDER CONFIRMED! We have received your order.';

    const text = encodeURIComponent(
      `Hello ${o.customerName || 'Customer'}!\n\n` +
      `🌿 *Veerika Rose Garden Live Order Update*\n` +
      `📦 *Order Reference:* #${o.id}\n` +
      `📢 *Status:* ${statusMsg}\n` +
      `💵 *Payment:* ${o.paymentMethod} (${o.paymentStatus === 'SUCCESS' ? 'PAID ✅' : '₹' + o.grandTotal + ' Pending'})\n\n` +
      `Track your order live: ${window.location.origin}/#/order-status/${o.id}`
    );

    window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
  };

  // Handle Quick Stock Update — optimistic with pending tracker to prevent poll revert
  const handleQuickStockUpdate = async (productId: string, newStock: number) => {
    const validStock = Math.max(0, newStock);
    // Mark this product as recently edited (prevents fetchData from reverting it for 10s)
    pendingStockRef.current.set(productId, Date.now());
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: validStock } : p));

    try {
      await authFetch(`/api/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ stock: validStock })
      }).catch(() => null);
    } catch (err) {
      console.error(err);
    } finally {
      // After 12s, allow fetchData to refresh this product's stock from server
      setTimeout(() => pendingStockRef.current.delete(productId), 12000);
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
        setSettingsMsg('✅ Settings saved successfully!');
        setSettings(data.settings);
      } else {
        setSettingsMsg(`❌ ${data.message || 'Failed to save settings'}`);
      }
    } catch (err: any) {
      console.error(err);
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
      alert(data.message);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Save Financial Entry (Expense / Sale - Create & Update)
  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFinance) {
        let res = await authFetch(`/api/admin/finances/${editingFinance.id}`, {
          method: 'PUT',
          body: JSON.stringify(financeForm)
        }).catch(() => null);

        if (!res || !res.ok) {
          res = await authFetch('/api/admin/finances/update', {
            method: 'POST',
            body: JSON.stringify({ id: editingFinance.id, ...financeForm })
          }).catch(() => null);
        }

        let data: any = {};
        if (res) data = await res.json().catch(() => ({}));
        const updatedItem: FinancialEntry = data.entry || {
          ...editingFinance,
          ...financeForm
        };
        setFinances(prev => prev.map(f => f.id === editingFinance.id ? updatedItem : f));
      } else {

        const res = await authFetch('/api/admin/finances', {
          method: 'POST',
          body: JSON.stringify(financeForm)
        });
        const data = await res.json();
        if (data.success && data.entry) {
          setFinances(prev => [data.entry, ...prev]);
        } else {
          const newEntry: FinancialEntry = {
            id: 'fin-' + Date.now(),
            ...financeForm,
            createdAt: new Date().toISOString()
          };
          setFinances(prev => [newEntry, ...prev]);
        }
      }
      setShowFinanceModal(false);
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditFinance = (f: FinancialEntry) => {
    setEditingFinance(f);
    setFinanceForm({
      type: f.type,
      title: f.title,
      category: f.category,
      costAmount: f.costAmount,
      sellAmount: f.sellAmount,
      quantity: f.quantity,
      notes: f.notes || '',
      date: f.date || new Date().toISOString().split('T')[0]
    });
    setShowFinanceModal(true);
  };


  const handleDeleteFinance = async (id: string) => {
    if (!confirm('Are you sure you want to delete this financial log entry?')) return;
    const delSet = new Set(JSON.parse(localStorage.getItem('vrg_deleted_finances') || '[]'));
    delSet.add(id);
    localStorage.setItem('vrg_deleted_finances', JSON.stringify([...delSet]));

    setFinances(prev => prev.filter(f => f.id !== id));
    try {
      await authFetch(`/api/admin/finances/${id}`, { method: 'DELETE' }).catch(() => null);
      await authFetch('/api/admin/finances/delete', { method: 'POST', body: JSON.stringify({ id }) }).catch(() => null);
    } catch (err) {
      console.error(err);
    }
  };


  return (

    <div className="min-h-screen bg-slate-100 text-slate-800 pb-12">
      {/* Top Admin Bar */}
      <div className="bg-slate-900 text-white px-6 py-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center font-black text-slate-950 text-sm">
            VRG
          </div>
          <div>
            <h1 className="font-bold text-base">Veerika Rose Garden — Admin Panel</h1>
            <p className="text-[11px] text-slate-400">Manage Nursery Catalog, PhonePe Payments, Dispatch & Reports</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </button>

          <button
            onClick={onBackToStore}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Exit Admin to Store
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Navigation Sidebar / Mobile Tab Bar */}
        <div className="bg-white p-3 rounded-3xl border border-slate-200/80 shadow-2xs text-xs font-bold lg:col-span-1 h-fit
          flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
          {[
            { key: 'dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
            { key: 'products', icon: <Package className="w-4 h-4" />, label: `Products (${products.length})` },
            { key: 'orders', icon: <ShoppingBag className="w-4 h-4" />, label: `Orders (${orders.length})` },
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
            const paidOrders = orders.filter(o => (o.paymentStatus as string) === 'SUCCESS' || (o.paymentStatus as string) === 'PAID' || (o.paymentMethod === 'COD' && o.orderStatus === 'DELIVERED'));
            const realTotalRevenue = stats?.totalRevenue !== undefined && stats?.totalRevenue !== null
              ? stats.totalRevenue
              : paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);

            const realTodaySales = stats?.todaySales !== undefined && stats?.todaySales !== null
              ? stats.todaySales
              : paidOrders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((sum, o) => sum + o.grandTotal, 0);

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
                      onClick={() => { setOrderFilterStage('pending'); setActiveTab('orders'); }}
                      className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl text-left space-y-1 transition-all cursor-pointer"
                    >
                      <span className="text-lg">🌸</span>
                      <p className="font-black text-xl text-amber-900">{orders.filter(o => o.orderStatus === 'PENDING').length}</p>
                      <p className="font-bold text-amber-800 text-[11px]">1. Order Confirmed</p>
                    </button>

                    <button
                      onClick={() => { setOrderFilterStage('packing'); setActiveTab('orders'); }}
                      className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl text-left space-y-1 transition-all cursor-pointer"
                    >
                      <span className="text-lg">🌿</span>
                      <p className="font-black text-xl text-purple-900">{orders.filter(o => o.orderStatus === 'PROCESSING' || (o.orderStatus as any) === 'PACKING').length}</p>
                      <p className="font-bold text-purple-800 text-[11px]">2. Nursery Packed</p>
                    </button>

                    <button
                      onClick={() => { setOrderFilterStage('dispatched'); setActiveTab('orders'); }}
                      className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl text-left space-y-1 transition-all cursor-pointer"
                    >
                      <span className="text-lg">🚚</span>
                      <p className="font-black text-xl text-blue-900">{orders.filter(o => o.orderStatus === 'DISPATCHED').length}</p>
                      <p className="font-bold text-blue-800 text-[11px]">3. Dispatched</p>
                    </button>

                    <button
                      onClick={() => { setOrderFilterStage('delivered'); setActiveTab('orders'); }}
                      className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-left space-y-1 transition-all cursor-pointer"
                    >
                      <span className="text-lg">✅</span>
                      <p className="font-black text-xl text-emerald-900">{orders.filter(o => o.orderStatus === 'DELIVERED').length}</p>
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
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-base text-slate-900">Recent Customer Orders ({recentOrdersList.length})</h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-emerald-800 hover:underline"
                    >
                      View All Orders →
                    </button>
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
                          {recentOrdersList.slice(0, 10).map((o: Order) => (
                            <tr key={o.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono font-black text-slate-900">{o.id}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-800">{o.customerName} ({typeof o.shippingAddress === 'string' ? o.shippingAddress : o.shippingAddress?.villageTown || 'Nursery'})</td>
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
                                <span className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${o.paymentMethod === 'COD' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900'}`}>
                                  {o.paymentMethod} ({o.paymentStatus})
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${o.orderStatus === 'DELIVERED' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-800'}`}>
                                  {o.orderStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
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
                        categoryId: categories[0]?.id || 'cat-roses',
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
                                <p className="text-[10px] text-slate-400 font-mono">{p.scientificName}</p>
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
                                  setProdForm(p);
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
                        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
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
                                src={c.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'}
                                alt={c.name}
                                className="w-10 h-10 object-cover rounded-lg border shrink-0 bg-slate-100"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80';
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
                                    image: c.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
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

          {/* TAB 3: ORDERS MANAGEMENT - 4 CATEGORIZED SECTIONS */}
          {activeTab === 'orders' && (() => {
            const pendingList = orders.filter(o => o.orderStatus === 'PENDING');
            const packingList = orders.filter(o => o.orderStatus === 'PROCESSING' || (o.orderStatus as any) === 'PACKING');
            const dispatchedList = orders.filter(o => o.orderStatus === 'DISPATCHED');
            const deliveredList = orders.filter(o => o.orderStatus === 'DELIVERED');

            const renderOrderCard = (o: Order) => {
              const isCod = o.paymentMethod === 'COD';
              const isDelivered = o.orderStatus === 'DELIVERED';
              const isDispatched = o.orderStatus === 'DISPATCHED';
              const isPacking = o.orderStatus === 'PROCESSING' || (o.orderStatus as any) === 'PACKING';

              return (
                <div key={o.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-xs shadow-xs hover:border-slate-300 transition-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-slate-900 text-sm">Order #{o.id}</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          isCod 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : (o.paymentMethod === 'QR_PAYMENT' || o.paymentMethod === 'UPI_DIRECT' || o.paymentProofUrl)
                            ? 'bg-indigo-100 text-indigo-950 border border-indigo-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}>
                          {isCod 
                            ? '💵 Cash on Delivery (COD)' 
                            : (o.paymentMethod === 'QR_PAYMENT' || o.paymentMethod === 'UPI_DIRECT' || o.paymentProofUrl)
                            ? '📸 Scan QR Code Payment'
                            : '📱 PhonePe UPI'}
                        </span>
                        {(o.paymentProofUrl || o.paymentMethod === 'QR_PAYMENT') && (
                          <button
                            onClick={() => setSelectedProofOrder(o)}
                            className="px-2.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <Camera className="w-3 h-3" />
                            <span>View Paid Receipt</span>
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

                      {/* Manual Online & Scan QR Payment Verification Box */}
                      {!isCod && (
                        <div className="bg-indigo-50/90 border-2 border-indigo-200 rounded-2xl p-4 space-y-3 shadow-xs">
                          {/* Header bar with Amount & Payment Method */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200/80 pb-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 bg-indigo-100 px-3 py-1 rounded-xl border border-indigo-300">
                                <Camera className="w-4 h-4 text-indigo-700" />
                                <span>Payment Method: <strong>{(o.paymentMethod === 'QR_PAYMENT' || o.paymentMethod === 'UPI_DIRECT' || o.paymentProofUrl) ? 'Scan QR Code Payment' : 'PhonePe UPI'}</strong></span>
                              </span>

                              <span className="font-extrabold text-emerald-900 text-xs bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300">
                                💰 Amount to Verify: <strong>₹{o.grandTotal}</strong>
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-black px-3 py-1 rounded-xl border ${
                                o.paymentStatus === 'SUCCESS' 
                                  ? 'bg-emerald-700 text-white border-emerald-800' 
                                  : o.paymentStatus === 'FAILED' 
                                  ? 'bg-rose-600 text-white border-rose-700' 
                                  : 'bg-amber-500 text-white border-amber-600'
                              }`}>
                                {o.paymentStatus === 'SUCCESS' ? '✅ VERIFIED (PAID)' : o.paymentStatus === 'FAILED' ? '❌ REJECTED / UNVERIFIED' : '⏳ PENDING MANUAL VERIFICATION'}
                              </span>

                              {o.transactionId && (
                                <span className="font-mono text-[11px] text-indigo-950 font-black bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
                                  UTR / Ref: {o.transactionId}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Proof Image Box & Manual Verification Action Controls */}
                          <div className="flex flex-col md:flex-row items-center gap-4">
                            {/* Receipt Screenshot Image */}
                            {o.paymentProofUrl ? (
                              <div className="flex flex-col items-center gap-1.5 shrink-0 w-full md:w-48">
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
                      <button
                        onClick={() => handleSendWhatsAppUpdate(o)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        📲 Send WhatsApp Alert
                      </button>

                      <button
                        onClick={() => handleUpdateOrderStatus(o.id, 'PENDING')}
                        className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer ${!isPacking && !isDispatched && !isDelivered ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                        1. Confirmed
                      </button>

                      <button
                        onClick={() => handleUpdateOrderStatus(o.id, 'PROCESSING')}
                        className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer ${isPacking ? 'bg-purple-700 text-white' : 'bg-purple-100 hover:bg-purple-200 text-purple-900'}`}
                      >
                        2. Nursery Packing
                      </button>

                      <button
                        onClick={() => setDispatchOrder(o)}
                        className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer ${isDispatched ? 'bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                      >
                        3. Dispatch Courier / Self
                      </button>

                      <button
                        onClick={() => handleUpdateOrderStatus(o.id, 'DELIVERED', 'SUCCESS')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer ${isDelivered ? 'bg-emerald-800 text-white' : 'bg-emerald-700 hover:bg-emerald-800 text-white'}`}
                      >
                        4. Delivered & COD Collected
                      </button>

                      <button
                        onClick={() => handleDeleteOrder(o.id)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-[11px] flex items-center gap-1 border border-rose-200 cursor-pointer transition-colors"
                        title="Permanently Delete Order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Order</span>
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
                    <p className="text-xs text-slate-500 font-medium">Organized in 4 Nursery Pipeline Sections</p>
                  </div>
                  <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-3 py-1.5 rounded-xl">
                    🚚 Auto-Synced with PostgreSQL DB & Live Customer Tracking
                  </span>
                </div>

                {/* 4 Interactive Stage Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => setOrderFilterStage('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${orderFilterStage === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    All Sections ({orders.length})
                  </button>
                  <button
                    onClick={() => setOrderFilterStage('pending')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${orderFilterStage === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'bg-amber-50 text-amber-900 hover:bg-amber-100'}`}
                  >
                    <span>🌸 1. Confirmed</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">{pendingList.length}</span>
                  </button>
                  <button
                    onClick={() => setOrderFilterStage('packing')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${orderFilterStage === 'packing' ? 'bg-purple-600 text-white shadow-xs' : 'bg-purple-50 text-purple-900 hover:bg-purple-100'}`}
                  >
                    <span>🌿 2. Nursery Packed</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">{packingList.length}</span>
                  </button>
                  <button
                    onClick={() => setOrderFilterStage('dispatched')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${orderFilterStage === 'dispatched' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-900 hover:bg-blue-100'}`}
                  >
                    <span>🚚 3. Dispatched</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">{dispatchedList.length}</span>
                  </button>
                  <button
                    onClick={() => setOrderFilterStage('delivered')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${orderFilterStage === 'delivered' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'}`}
                  >
                    <span>✅ 4. Delivered</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">{deliveredList.length}</span>
                  </button>
                </div>

                {/* 4 CATEGORIZED SECTIONS DISPLAY */}
                <div className="space-y-8">
                  {/* SECTION 1: ORDER CONFIRMED */}
                  {(orderFilterStage === 'all' || orderFilterStage === 'pending') && (
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
                        <p className="text-xs text-slate-400 italic p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center">No new pending orders in this section.</p>
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
                    try {
                      const payload = {
                        ...formData,
                        type: formData.discountType === 'FLAT' ? 'FIXED' : 'PERCENT',
                        value: Number(formData.discountValue),
                        minOrder: Number(formData.minOrderAmount || 0),
                        expiryDate: formData.expiryDate || '2027-12-31'
                      };
                      const res = await authFetch('/api/coupons', { method: 'POST', body: JSON.stringify(payload) });
                      const data = await res.json();
                      if (data.success) {
                        const newCoupon: Coupon = {
                          id: data.coupon?.id || 'local-' + Date.now(),
                          code: formData.code,
                          discountType: formData.discountType,
                          discountValue: formData.discountValue,
                          minOrderAmount: formData.minOrderAmount,
                          maxUsageCount: formData.maxUsageCount,
                          expiryDate: formData.expiryDate,
                          isActive: formData.isActive,
                          description: formData.description,
                          usageCount: 0,
                          ...data.coupon
                        };
                        setCoupons(prev => [newCoupon, ...prev]);
                        setTimeout(() => fetchData(), 1500);
                      } else {
                        throw new Error(data.message || 'Failed to create coupon');
                      }
                    } catch (err: any) {
                      throw err;
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
                                  setCombos(prev => prev.filter(c => c.id !== combo.id));
                                  try {
                                    const res = await authFetch(`/api/admin/combos/${combo.id}`, { method: 'DELETE' });
                                    const data = await res.json().catch(() => ({}));
                                    if (!data.success) {
                                      await authFetch(`/api/admin/combos/${combo.id}/delete`, { method: 'POST' });
                                    }
                                  } catch {
                                    await authFetch(`/api/admin/combos/${combo.id}/delete`, { method: 'POST' }).catch(() => {});
                                  }
                                }}
                                className="p-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-200 hover:bg-rose-100"
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
                      if (confirm('Set stock count for ALL products to 50 units?')) {
                        products.forEach(p => handleQuickStockUpdate(p.id, 50));
                      }
                    }}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs"
                  >
                    ⚡ Set Bulk Stock (50 Units All)
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

        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 my-8 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingProduct ? 'Edit Nursery Plant' : 'Add New Nursery Plant'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="p-1 text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Scientific Name *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.scientificName}
                    onChange={(e) => setProdForm({ ...prodForm, scientificName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
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
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={prodForm.sellingPrice}
                    onChange={(e) => setProdForm({ ...prodForm, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={prodForm.mrp}
                    onChange={(e) => setProdForm({ ...prodForm, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Count</label>
                  <input
                    type="number"
                    required
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="text"
                  required
                  value={prodForm.images?.[0] || ''}
                  onChange={(e) => setProdForm({ ...prodForm, images: [e.target.value] })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
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

            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Delivery Method:</label>
              <select
                value={courierName}
                onChange={(e) => {
                  setCourierName(e.target.value);
                  if (e.target.value.includes('Self Delivery')) {
                    setTrackingNumber('VRG-SELF-DELIVERY');
                  }
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                <option value="Self Delivery (Nursery Farm Team)">🌿 Self Delivery / Farm Direct Team (No AWB Required)</option>
                <option value="ST Courier">ST Courier (Tamil Nadu Village Fast)</option>
                <option value="Local Auto / Transport">Local Auto / Transport Delivery</option>
                <option value="Professional Courier">Professional Courier</option>
                <option value="India Post Speed Post">India Post Speed Post</option>
                <option value="Delhivery">Delhivery</option>
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
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-600" />
                  <span>Uploaded Payment Receipt Proof</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">Order #{selectedProofOrder.id} • Txn: {selectedProofOrder.merchantTransactionId}</p>
              </div>
              <button onClick={() => setSelectedProofOrder(null)} className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
              <p className="font-bold text-slate-800">Customer: {selectedProofOrder.customerName} (+91 {selectedProofOrder.customerPhone})</p>
              <p className="font-bold text-emerald-800">Amount Paid: ₹{selectedProofOrder.grandTotal}</p>
              {selectedProofOrder.transactionId && (
                <p className="font-mono text-indigo-900 font-bold bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200">
                  UTR / Ref: {selectedProofOrder.transactionId}
                </p>
              )}
              {selectedProofOrder.paymentProofUploadedAt && (
                <p className="text-[10px] text-slate-400 font-medium">Uploaded at: {new Date(selectedProofOrder.paymentProofUploadedAt).toLocaleString()}</p>
              )}
            </div>

            {selectedProofOrder.paymentProofUrl ? (
              <div className="text-center bg-slate-900 p-2 rounded-2xl overflow-hidden border border-slate-700">
                <img
                  src={selectedProofOrder.paymentProofUrl}
                  alt="Uploaded Payment Receipt"
                  className="w-full max-h-[50vh] object-contain rounded-xl mx-auto"
                />
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-100 rounded-2xl text-slate-500 font-semibold">
                No image proof uploaded for this order.
              </div>
            )}

            {/* Verification Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-200">
              <button
                onClick={async () => {
                  await handleUpdateOrderStatus(selectedProofOrder.id, selectedProofOrder.orderStatus, 'SUCCESS');
                  setSelectedProofOrder(null);
                }}
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Approve & Mark Paid</span>
              </button>

              <button
                onClick={async () => {
                  await handleUpdateOrderStatus(selectedProofOrder.id, selectedProofOrder.orderStatus, 'FAILED');
                  setSelectedProofOrder(null);
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Reject Payment</span>
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
                <label className="font-bold text-slate-700 block mb-1">Category Image URL *</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    required
                    placeholder="https://..."
                    value={catForm.image}
                    onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px]"
                  />
                  <img
                    src={catForm.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'}
                    alt="Preview"
                    className="w-10 h-10 rounded-xl object-cover border shrink-0 bg-slate-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
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

                const payload = {
                  ...comboForm,
                  originalPrice: Number(comboForm.originalPrice || 0),
                  comboPrice: Number(comboForm.comboPrice || 0)
                };

                if (editingCombo) {
                  const res = await authFetch(`/api/admin/combos/${editingCombo.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                  });
                  const data = await res.json();
                  if (data.success) {
                    setCombos(prev => prev.map(c => c.id === editingCombo.id ? { ...c, ...payload } : c));
                  }
                } else {
                  const res = await authFetch('/api/admin/combos', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                  });
                  const data = await res.json();
                  if (data.success && data.combo) {
                    setCombos(prev => [data.combo, ...prev]);
                  }
                }

                setShowComboModal(false);
                setTimeout(() => fetchData(), 1000);
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
      {/* Zoom Receipt Screenshot Modal */}
      {selectedProofOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-2xl w-full rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-600" />
                  <span>Customer Payment Receipt Screenshot</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Order ID: <span className="font-mono font-bold text-slate-800">{selectedProofOrder.id}</span> • Customer: <span className="font-bold text-slate-800">{selectedProofOrder.customerName}</span> ({selectedProofOrder.customerPhone})
                </p>
              </div>
              <button
                onClick={() => setSelectedProofOrder(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 rounded-2xl p-4 flex items-center justify-center min-h-[300px]">
              {selectedProofOrder.paymentProofUrl ? (
                <img
                  src={selectedProofOrder.paymentProofUrl}
                  alt="Customer Payment Receipt Proof"
                  className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent && !parent.querySelector('.error-fallback')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'error-fallback text-center text-white p-6 space-y-2';
                      fallback.innerHTML = `<p class="font-bold text-rose-400">⚠️ Unable to render inline image preview</p><p class="text-xs text-slate-300">Click the Download / View Full Image button below to view the receipt photo.</p>`;
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <p className="text-slate-400 text-xs font-bold">No receipt photo attached to this order.</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-extrabold text-indigo-950">
                Amount Paid: ₹{selectedProofOrder.grandTotal} {selectedProofOrder.transactionId ? `(UTR: ${selectedProofOrder.transactionId})` : ''}
              </span>
              
              <div className="flex items-center gap-2">
                {selectedProofOrder.paymentProofUrl && (
                  <a
                    href={selectedProofOrder.paymentProofUrl}
                    download={`payment-receipt-${selectedProofOrder.id}.jpg`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Download / View Full Image</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedProofOrder(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

