import React, { useState, useEffect } from 'react';
import { Product, Category, Order, Coupon, Banner, Review, SiteSettings, PaymentLog } from '../types';
import { LayoutDashboard, Package, ShoppingBag, FolderTree, Tag, Image, Star, Settings as SettingsIcon, ShieldCheck, Plus, Edit, Trash2, Check, X, RefreshCw, Printer, AlertTriangle, Search, Lock, ExternalLink, DollarSign } from 'lucide-react';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/catalogData';

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
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBackToStore, adminUser }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'orders' | 'inventory' | 'coupons' | 'banners' | 'reviews' | 'settings' | 'audit'>('dashboard');

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

    if (uniqueMap.size > 0) {
      return Array.from(uniqueMap.values());
    }

    return [
      {
        id: 'ORD-VRG-2286',
        merchantTransactionId: 'MT1785419991201',
        customerName: 'Naveen Kumar',
        customerPhone: '09360931606',
        customerEmail: 'nv01110612@gmail.com',
        shippingAddress: {
          fullName: 'Naveen Kumar',
          phone: '09360931606',
          houseNo: '212121',
          street: 'Main Road',
          villageTown: 'Chennai',
          district: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
          addressType: 'Home'
        },
        items: [
          {
            productId: 'prod-panner-leaf',
            sku: 'VRG-HERB-01',
            name: 'Panner Leaf Plant',
            tamilName: 'பன்னீர் இலை மூலிகை',
            price: 30,
            mrp: 50,
            quantity: 1,
            image: '/products/eq.jpeg'
          }
        ],
        subtotal: 30,
        shippingCharge: 50,
        discount: 0,
        grandTotal: 80,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        paymentMethod: 'COD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ORD-VRG-6412',
        merchantTransactionId: 'MT1785419991202',
        customerName: 'Naveen Kumar',
        customerPhone: '09360931606',
        customerEmail: 'nv01110612@gmail.com',
        shippingAddress: {
          fullName: 'Naveen Kumar',
          phone: '09360931606',
          houseNo: '12',
          street: 'Nursery Road',
          villageTown: 'Pennagaram',
          district: 'Dharmapuri',
          state: 'Tamil Nadu',
          pincode: '636810',
          addressType: 'Home'
        },
        items: [
          {
            productId: 'prod-dd-8inch',
            sku: 'VRG-ROSE-01',
            name: 'Double Delight (8 inch pot)',
            tamilName: 'டபுள் டிலைட் ரோஜா (8 இன்ச் பாட்)',
            price: 199,
            mrp: 230,
            quantity: 1,
            image: '/products/double-delight.jpeg'
          }
        ],
        subtotal: 199,
        shippingCharge: 50,
        discount: 0,
        grandTotal: 249,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        paymentMethod: 'COD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ORD-VRG-4615',
        merchantTransactionId: 'MT1785419991203',
        customerName: 'Naveen Kumar',
        customerPhone: '09360931606',
        customerEmail: 'nv01110612@gmail.com',
        shippingAddress: {
          fullName: 'Naveen Kumar',
          phone: '09360931606',
          houseNo: '11',
          street: 'Main Street',
          villageTown: 'Chennai',
          district: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
          addressType: 'Home'
        },
        items: [
          {
            productId: 'prod-dd-8inch',
            sku: 'VRG-ROSE-01',
            name: 'Double Delight (8 inch pot)',
            tamilName: 'டபுள் டிலைட் ரோஜா (8 இன்ச் பாட்)',
            price: 199,
            mrp: 230,
            quantity: 1,
            image: '/products/double-delight.jpeg'
          }
        ],
        subtotal: 199,
        shippingCharge: 50,
        discount: 0,
        grandTotal: 249,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        paymentMethod: 'COD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ORD-VRG-1205',
        merchantTransactionId: 'MT178541929139089',
        customerName: 'Naveen Kumar',
        customerPhone: '09360931606',
        customerEmail: 'nv01110612@gmail.com',
        shippingAddress: {
          fullName: 'Naveen Kumar',
          phone: '09360931606',
          houseNo: '444',
          street: 'TRS Mens-Hostel, S.R.M Nagar Kattankulathur',
          villageTown: 'Chennai',
          district: 'Chengalpattu',
          state: 'Tamil Nadu',
          pincode: '603203',
          addressType: 'Home'
        },
        items: [
          {
            productId: 'prod-panner-leaf',
            sku: 'VRG-HERB-01',
            name: 'Panner Leaf Plant',
            tamilName: 'பன்னீர் இலை மூலிகை',
            price: 30,
            mrp: 50,
            quantity: 1,
            image: '/products/eq.jpeg'
          }
        ],
        subtotal: 30,
        shippingCharge: 50,
        discount: 0,
        grandTotal: 80,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        paymentMethod: 'COD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ORD-VRG-6118',
        merchantTransactionId: 'MT1785418345316',
        customerName: 'Naveen Kumar',
        customerPhone: '09360931606',
        customerEmail: 'nv01110612@gmail.com',
        shippingAddress: {
          fullName: 'Naveen Kumar',
          phone: '09360931606',
          houseNo: '11',
          street: 'Main Road',
          villageTown: 'Chennai',
          district: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
          addressType: 'Home'
        },
        items: [
          {
            productId: 'prod-dd-8inch',
            sku: 'VRG-ROSE-01',
            name: 'Double Delight (8 inch pot)',
            tamilName: 'டபுள் டிலைட் ரோஜா (8 இன்ச் பாட்)',
            price: 99,
            mrp: 150,
            quantity: 1,
            image: '/products/double-delight.jpeg'
          }
        ],
        subtotal: 99,
        shippingCharge: 50,
        discount: 0,
        grandTotal: 149,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        paymentMethod: 'COD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  };

  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [orders, setOrders] = useState<Order[]>(getInitialAdminOrders);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>({} as SiteSettings);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);

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

  const authFetch = (url: string, options: RequestInit = {}) => {
    // Include admin identity in header as fallback (for local-auth admins without session cookie)
    const adminEmail = adminUser?.email || localStorage.getItem('vrg_admin_email') || 'admin@veerikarosegarden.com';
    const adminRole = adminUser?.role || 'SUPER_ADMIN';
    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Email': adminEmail,
        'X-Admin-Role': adminRole,
        ...(options.headers || {})
      }
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, pRes, cRes, oRes, cpRes, bRes, rRes, stRes, plRes] = await Promise.all([
        authFetch('/api/admin/dashboard').then((r) => r.json()).catch(() => null),
        authFetch('/api/products').then((r) => r.json()).catch(() => null),
        authFetch('/api/admin/categories').then((r) => r.json()).catch(() => null),
        authFetch('/api/admin/orders').then((r) => r.json()).catch(() => null),
        authFetch('/api/coupons').then((r) => r.json()).catch(() => null),
        authFetch('/api/banners').then((r) => r.json()).catch(() => null),
        authFetch('/api/reviews').then((r) => r.json()).catch(() => null),
        authFetch('/api/admin/settings').then((r) => r.json()).catch(() => null),
        authFetch('/api/admin/payment-logs').then((r) => r.json()).catch(() => null)
      ]);

      if (sRes?.success) setStats(sRes.stats);
      if (pRes?.success && Array.isArray(pRes.products) && pRes.products.length > 0) {
        const now = Date.now();
        setProducts(prev => {
          // Merge: keep local stock for any product edited within last 10s
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
      if (cRes?.success && Array.isArray(cRes.categories) && cRes.categories.length > 0) setCategories(cRes.categories);

      if (oRes?.success && Array.isArray(oRes.orders)) {
        setOrders(oRes.orders);
      } else {
        let localOrders: any[] = [];
        const keysToRead = ['veerika_admin_orders', 'vrg_user_orders', 'veerika_customer_orders', 'vrg_orders'];

        keysToRead.forEach(key => {
          try {
            const saved = localStorage.getItem(key);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                localOrders = [...localOrders, ...parsed];
              }
            }
          } catch {}
        });

        if (localOrders.length > 0) {
          setOrders(localOrders as any);
        } else {
          setOrders(getInitialAdminOrders());
        }
      }

      if (cpRes?.success) setCoupons(cpRes.coupons);
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
    fetchData();
    // Poll every 30 seconds (was 3s — caused stock to revert on every poll)
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

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(prodForm)
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
    try {
      const res = await authFetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete All Products
  const handleDeleteAllProducts = async () => {
    if (!confirm('⚠️ WARNING: Are you sure you want to delete ALL products from the catalog? This action cannot be undone.')) return;
    try {
      const res = await authFetch('/api/products/all', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('All products removed successfully.');
        fetchData();
      } else {
        alert(data.message || 'Failed to delete all products');
      }
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
    try {
      const res = await authFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else if (data.code === 'HAS_PRODUCTS') {
        const cat = categories.find((c) => c.id === id);
        if (cat) {
          setDeleteCatTarget({ category: cat, productCount: data.productCount || 0 });
          const otherCats = categories.filter((c) => c.id !== id);
          if (otherCats.length > 0) {
            setReassignCategoryId(otherCats[0].id);
          }
        }
      } else {
        alert(data.message || 'Failed to delete category');
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
      const res = await authFetch('/api/admin/categories/all', { method: 'DELETE' });
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
      if (data.success) {
        setSettingsMsg('✅ Settings saved successfully!');
        fetchData();
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

        <button
          onClick={onBackToStore}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          Exit Admin to Store
        </button>
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
              <span className="hidden sm:inline lg:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Views Content */}
        <div className="lg:col-span-4 space-y-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (() => {
            const realTotalRevenue = orders.reduce((sum, o) => sum + o.grandTotal, 0);
            const realTodaySales = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((sum, o) => sum + o.grandTotal, 0);
            const realPendingOrders = orders.filter(o => o.orderStatus !== 'DELIVERED').length;
            const lowStockList = products.filter(p => p.stock <= 15);
            const recentOrdersList = orders.length > 0 ? orders : (stats?.recentOrders || []);

            return (
              <div className="space-y-6">
                {/* Stats cards — live calculated */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Revenue', value: `₹${realTotalRevenue}`, sub: 'Verified via Cash & PhonePe PG', color: 'text-emerald-800' },
                    { label: 'Today Sales', value: `₹${realTodaySales}`, sub: "Today's farm orders", color: 'text-slate-900' },
                    { label: 'Total Orders', value: orders.length, sub: `${realPendingOrders} pending dispatch`, color: 'text-slate-900' },
                    { label: 'Low Stock Alert', value: lowStockList.length, sub: 'Plants under 15 stock', color: 'text-amber-600' },
                  ].map(c => (
                    <div key={c.label} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-xs font-bold text-slate-400 uppercase">{c.label}</span>
                      <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
                      <p className="text-[10px] text-slate-500">{c.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Products', value: products.length, icon: '🌿', bg: 'bg-emerald-50', text: 'text-emerald-800' },
                    { label: 'Categories', value: categories.length, icon: '📁', bg: 'bg-blue-50', text: 'text-blue-800' },
                    { label: 'Active Coupons', value: coupons.filter(c => c.isActive !== false).length, icon: '🏷️', bg: 'bg-amber-50', text: 'text-amber-800' },
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

          {/* TAB 3: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">All Customer Orders ({orders.length})</h3>
                <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-3 py-1 rounded-xl">
                  🚚 Manage 4-Stage Live Nursery Delivery & COD Collections
                </span>
              </div>

              <div className="space-y-4">
                {orders.map((o) => {
                  const isCod = o.paymentMethod === 'COD';
                  const isDelivered = o.orderStatus === 'DELIVERED';
                  const isDispatched = o.orderStatus === 'DISPATCHED';
                  const isPacking = o.orderStatus === 'PROCESSING' || (o.orderStatus as any) === 'PACKING';

                  return (
                    <div key={o.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-xs shadow-xs">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-slate-900 text-sm">Order #{o.id}</span>
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${isCod ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900'}`}>
                              {isCod ? '💵 Cash on Delivery (COD)' : '📱 PhonePe UPI'}
                            </span>
                          </div>
                          <span className="text-slate-500 font-mono text-[11px]">Txn ID: {o.merchantTransactionId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold px-3 py-1 rounded-full text-xs ${o.paymentStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900'}`}>
                            Payment: {o.paymentStatus === 'SUCCESS' ? '✅ SUCCESS' : '⏳ PENDING'}
                          </span>
                          <span className={`font-bold px-3 py-1 rounded-full text-xs ${isDelivered ? 'bg-emerald-700 text-white' : isDispatched ? 'bg-blue-600 text-white' : 'bg-purple-100 text-purple-900'}`}>
                            Status: {o.orderStatus}
                          </span>
                        </div>
                      </div>

                      {/* 4-Stage Live Delivery Progress Visualizer */}
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2">
                        <p className="font-bold text-slate-700">🚚 Live Nursery Delivery Progress:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                          <div className={`p-2 rounded-xl border font-bold ${!isPacking && !isDispatched && !isDelivered ? 'bg-emerald-100 border-emerald-400 text-emerald-900' : 'bg-white border-slate-200 text-slate-500'}`}>
                            1. Order Confirmed
                          </div>
                          <div className={`p-2 rounded-xl border font-bold ${isPacking ? 'bg-emerald-100 border-emerald-400 text-emerald-900' : 'bg-white border-slate-200 text-slate-500'}`}>
                            2. Nursery Packing
                          </div>
                          <div className={`p-2 rounded-xl border font-bold ${isDispatched ? 'bg-emerald-100 border-emerald-400 text-emerald-900' : 'bg-white border-slate-200 text-slate-500'}`}>
                            3. Dispatched
                          </div>
                          <div className={`p-2 rounded-xl border font-bold ${isDelivered ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
                            4. Delivered
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 bg-slate-50/50 p-3 rounded-xl">
                        <p><strong>Customer Name & Phone:</strong> {o.customerName} (+91 {o.customerPhone})</p>
                        <p><strong>Delivery Address:</strong> {typeof o.shippingAddress === 'string' ? o.shippingAddress : `${o.shippingAddress?.houseNo || ''}, ${o.shippingAddress?.street || ''}, ${o.shippingAddress?.villageTown || ''}, ${o.shippingAddress?.district || ''}, ${o.shippingAddress?.pincode || ''}`}</p>
                      </div>

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
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 shadow-xs"
                          >
                            📲 Send WhatsApp Alert
                          </button>

                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'PENDING')}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-[11px]"
                          >
                            1. Confirmed
                          </button>

                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'PROCESSING')}
                            className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold rounded-xl text-[11px]"
                          >
                            2. Nursery Packing
                          </button>

                          <button
                            onClick={() => setDispatchOrder(o)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[11px]"
                          >
                            3. Dispatch Courier / Self
                          </button>

                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'DELIVERED', 'SUCCESS')}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-[11px]"
                          >
                            4. Delivered & COD Collected
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                            {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                            {c.minOrderAmount ? ` · Min ₹${c.minOrderAmount}` : ''}
                            {c.expiryDate ? ` · Expires ${new Date(c.expiryDate).toLocaleDateString('en-IN')}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${c.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            {c.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                          <button
                            onClick={async () => {
                              if (!confirm(`Delete coupon "${c.code}"?`)) return;
                              const res = await authFetch(`/api/coupons/${c.id}`, { method: 'DELETE' });
                              const data = await res.json();
                              if (data.success) fetchData();
                            }}
                            className="p-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-200 hover:bg-rose-100"
                          ><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
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
    </div>
  );
};
