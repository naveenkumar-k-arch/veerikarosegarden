import React, { useState, useEffect } from 'react';
import { Order, Product, Category, Review, Coupon, Banner } from '../types';
import { MobileAdminWorkflow } from '../components/MobileAdminWorkflow';

interface AdminPageProps {
  onBackToStore: () => void;
  adminUser?: any;
  reviews?: Review[];
  onUpdateReviews?: (updated: Review[]) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onBackToStore,
  adminUser,
  reviews: propsReviews,
  onUpdateReviews
}) => {
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

    return Array.from(uniqueMap.values());
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>(getInitialAdminOrders);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [reviews, setReviews] = useState<Review[]>(propsReviews || []);
  const [settings, setSettings] = useState<any>(null);
  const [finances, setFinances] = useState<any[]>([]);

  // Auth fetch helper
  const authFetch = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
  };

  const fetchData = async () => {
    try {
      const [pRes, cRes, oRes, cpRes, bRes, rRes, stRes, fnRes] = await Promise.all([
        fetch('/api/products').then(r => r.json()).catch(() => null),
        fetch('/api/admin/categories').then(r => r.json()).catch(() => null),
        authFetch('/api/admin/orders').then(r => r.json()).catch(() => null),
        authFetch('/api/admin/coupons').then(r => r.json()).catch(() => null),
        fetch('/api/banners').then(r => r.json()).catch(() => null),
        fetch('/api/reviews').then(r => r.json()).catch(() => null),
        authFetch('/api/admin/settings').then(r => r.json()).catch(() => null),
        authFetch('/api/admin/finances').then(r => r.json()).catch(() => null)
      ]);

      if (pRes?.success && Array.isArray(pRes.products)) setProducts(pRes.products);
      if (cRes?.success && Array.isArray(cRes.categories)) setCategories(cRes.categories);
      if (oRes?.success && Array.isArray(oRes.orders)) setOrders(oRes.orders);
      if (cpRes?.success && Array.isArray(cpRes.coupons)) setCoupons(cpRes.coupons);
      if (bRes?.success && Array.isArray(bRes.banners)) setBanners(bRes.banners);
      if (rRes?.success && Array.isArray(rRes.reviews)) setReviews(rRes.reviews);
      if (stRes?.success) setSettings(stRes.settings);
      if (fnRes?.success && Array.isArray(fnRes.entries)) setFinances(fnRes.entries);
    } catch (err) {
      console.error('Fetch admin data error:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update order status
  const handleUpdateOrderStatus = async (orderId: string, status: string, paymentStatus?: string) => {
    try {
      await authFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ orderStatus: status, paymentStatus })
      }).catch(() => null);
    } catch {}

    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? {
        ...o,
        orderStatus: status as any,
        paymentStatus: paymentStatus ? (paymentStatus as any) : o.paymentStatus
      } : o);
      const keysToSave = ['veerika_admin_orders', 'vrg_user_orders', 'veerika_customer_orders', 'vrg_orders'];
      keysToSave.forEach(k => {
        try { localStorage.setItem(k, JSON.stringify(updated)); } catch {}
      });
      return updated;
    });
  };

  // Dispatch tracking handler
  const handleSaveTracking = async (orderId: string, data: { courierName: string; trackingNumber: string; trackingLink?: string }) => {
    try {
      await authFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          orderStatus: 'DISPATCHED',
          courierName: data.courierName,
          trackingNumber: data.trackingNumber,
          deliveryNotes: data.trackingLink
        })
      }).catch(() => null);
    } catch {}

    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? {
        ...o,
        orderStatus: 'DISPATCHED' as const,
        courierName: data.courierName,
        trackingNumber: data.trackingNumber,
        deliveryNotes: data.trackingLink
      } : o);
      const keysToSave = ['veerika_admin_orders', 'vrg_user_orders', 'veerika_customer_orders', 'vrg_orders'];
      keysToSave.forEach(k => {
        try { localStorage.setItem(k, JSON.stringify(updated)); } catch {}
      });
      return updated;
    });
  };

  const handleSaveProduct = async (prod: any) => {
    try {
      const url = prod.id ? `/api/products/${prod.id}` : '/api/products';
      const method = prod.id ? 'PUT' : 'POST';
      await authFetch(url, { method, body: JSON.stringify(prod) });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete plant "${name}"?`)) return;
    setProducts(prev => prev.filter(p => p.id !== id));
    try {
      await authFetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCategory = async (cat: any) => {
    try {
      const url = cat.id ? `/api/admin/categories/${cat.id}` : '/api/admin/categories';
      const method = cat.id ? 'PUT' : 'POST';
      await authFetch(url, { method, body: JSON.stringify(cat) });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    try {
      await authFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveReview = (rev: any) => {
    const updated = [rev, ...reviews.filter(r => r.id !== rev.id)];
    setReviews(updated);
    if (onUpdateReviews) onUpdateReviews(updated);
    try {
      localStorage.setItem('vrg_reviews', JSON.stringify(updated));
    } catch {}
  };

  const handleDeleteReview = (id: string) => {
    const updated = reviews.filter(r => r.id !== id);
    setReviews(updated);
    if (onUpdateReviews) onUpdateReviews(updated);
    try {
      localStorage.setItem('vrg_reviews', JSON.stringify(updated));
    } catch {}
  };

  const handleSaveSettings = async (st: any) => {
    try {
      await authFetch('/api/admin/settings', { method: 'POST', body: JSON.stringify(st) });
      setSettings(st);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vrg_user');
    localStorage.removeItem('vrg_admin_email');
    localStorage.removeItem('vrg_admin_role');
    onBackToStore();
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <MobileAdminWorkflow
        orders={orders}
        products={products}
        categories={categories}
        reviews={reviews}
        coupons={coupons}
        banners={banners}
        settings={settings}
        finances={finances}
        adminUser={adminUser}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onSaveTracking={handleSaveTracking}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
        onSaveReview={handleSaveReview}
        onDeleteReview={handleDeleteReview}
        onSaveSettings={handleSaveSettings}
        onBackToStore={onBackToStore}
        onLogout={handleLogout}
      />
    </div>
  );
};
