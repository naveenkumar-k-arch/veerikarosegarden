import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Home, Store, User as UserIcon, ShoppingCart } from 'lucide-react';
import { Product, Category, CartItem, Order, User, Banner, Review, PaymentMethod } from './types';
import { auth, onAuthStateChanged, signOut } from './lib/firebase';
import { Header } from './components/Header';
import { SecondaryNavbar } from './components/SecondaryNavbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { SplashScreen } from './components/SplashScreen';
import { ToastContainer } from './components/ToastContainer';

import { HomePage } from './pages/HomePage';

const ShopPage = React.lazy(() => import('./pages/ShopPage').then(m => ({ default: m.ShopPage })));
const ProductDetailsPage = React.lazy(() => import('./pages/ProductDetailsPage').then(m => ({ default: m.ProductDetailsPage })));
const CartPage = React.lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderStatusPage = React.lazy(() => import('./pages/OrderStatusPage').then(m => ({ default: m.OrderStatusPage })));
const AccountPage = React.lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const PoliciesPage = React.lazy(() => import('./pages/PoliciesPage').then(m => ({ default: m.PoliciesPage })));
const AdminPage = React.lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const AdminLoginForm = React.lazy(() => import('./components/AdminLoginForm').then(m => ({ default: m.AdminLoginForm })));

const PlantCareModal = React.lazy(() => import('./components/PlantCareModal').then(m => ({ default: m.PlantCareModal })));
const PhonePeModal = React.lazy(() => import('./components/PhonePeModal').then(m => ({ default: m.PhonePeModal })));
const ExpertAdviceModal = React.lazy(() => import('./components/ExpertAdviceModal').then(m => ({ default: m.ExpertAdviceModal })));
const MobileCheckoutFlow = React.lazy(() => import('./components/MobileCheckoutFlow').then(m => ({ default: m.MobileCheckoutFlow })));

import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from './data/catalogData';

import { INITIAL_REVIEWS } from './data/reviewsData';
import { calculateDeliveryFee } from './utils/delivery';
import { toast } from './utils/toast';

export const App: React.FC = () => {
  // Splash Screen State — only shows once on very first visit in session if landing on Home page
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      if (sessionStorage.getItem('vrg_splash_shown') === 'true') return false;
    } catch {}
    const pathname = window.location.pathname.trim().replace(/\/+$/, '') || '/';
    return pathname === '/' || pathname === '';
  });
  const handleSplashComplete = useCallback(() => {
    try {
      sessionStorage.setItem('vrg_splash_shown', 'true');
    } catch {}
    setShowSplash(false);
  }, []);

  // Helper to parse URL path into page name & param ID for multi-page routing
  const getPageFromUrl = (pathname: string): { page: string; paramId?: string } => {
    const path = pathname.trim().replace(/\/+$/, '') || '/';
    if (path.startsWith('/product/')) {
      return { page: 'product-detail', paramId: decodeURIComponent(path.replace('/product/', '')) };
    }
    if (path.startsWith('/order-status/')) {
      return { page: 'order-status', paramId: decodeURIComponent(path.replace('/order-status/', '')) };
    }
    if (path === '/checkout') return { page: 'checkout' };
    if (path === '/cart') return { page: 'cart' };
    if (path === '/shop') return { page: 'shop' };
    if (path === '/account') return { page: 'account' };
    if (path === '/policies') return { page: 'policies' };
    if (path === '/admin') return { page: 'admin' };
    if (path === '/order-status') return { page: 'order-status' };
    if (path === '/' || path === '') return { page: 'home' };
    return { page: 'home' };
  };

  // Helper to construct canonical URL for a given page & parameters
  const getUrlForPage = (page: string, extra?: { product?: Product | null; orderId?: string | null }): string => {
    switch (page) {
      case 'home': return '/';
      case 'shop': return '/shop';
      case 'product-detail':
        return extra?.product ? `/product/${encodeURIComponent(extra.product.id)}` : '/shop';
      case 'checkout': return '/checkout';
      case 'cart': return '/cart';
      case 'order-status':
        return extra?.orderId ? `/order-status/${encodeURIComponent(extra.orderId)}` : '/order-status';
      case 'account': return '/account';
      case 'policies': return '/policies';
      case 'admin': return '/admin';
      default: return '/';
    }
  };

  // Initialize page & initial entity state from URL path or sessionStorage fallback
  const initialUrlState = getPageFromUrl(window.location.pathname);

  // Page Navigation State — multi-page URL routing enabled
  const [currentPage, setCurrentPage] = useState<string>(() => {
    if (initialUrlState.page) return initialUrlState.page;
    try {
      const saved = sessionStorage.getItem('vrg_current_page');
      if (saved && ['home', 'shop', 'product-detail', 'cart', 'checkout', 'order-status', 'account', 'policies', 'admin'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'home';
  });

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(() => {
    try {
      const saved = sessionStorage.getItem('vrg_selected_category');
      if (saved) return JSON.parse(saved) || undefined;
    } catch {}
    return undefined;
  });
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem('vrg_search_query');
      if (saved) return JSON.parse(saved) || '';
    } catch {}
    return '';
  });
  const [policyTab, setPolicyTab] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem('vrg_policy_tab');
      if (saved) return JSON.parse(saved) || 'shipping';
    } catch {}
    return 'shipping';
  });

  // Selected Entities for Views — synced with URL & restored from sessionStorage
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    if (initialUrlState.page === 'product-detail' && initialUrlState.paramId) {
      const matched = INITIAL_PRODUCTS.find(p => p.id === initialUrlState.paramId || p.sku === initialUrlState.paramId);
      if (matched) return matched;
    }
    try {
      const saved = sessionStorage.getItem('vrg_selected_product');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch {}
    return null;
  });

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(() => {
    if (initialUrlState.page === 'order-status' && initialUrlState.paramId) {
      return initialUrlState.paramId;
    }
    try {
      const saved = sessionStorage.getItem('vrg_selected_order_id');
      if (saved) return JSON.parse(saved) || null;
    } catch {}
    return null;
  });
  const [careGuideProduct, setCareGuideProduct] = useState<Product | null>(null);
  const [isExpertAdviceOpen, setIsExpertAdviceOpen] = useState<boolean>(false);

  // Data Collections State — Fast LocalStorage cache hydrate with background SWR sync
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('vrg_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('vrg_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CATEGORIES;
  });

  const [banners, setBanners] = useState<Banner[]>(() => {
    try {
      const saved = localStorage.getItem('vrg_banners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const getInitialReviews = (): Review[] => {
    let deletedIds: string[] = [];
    try {
      const dSaved = localStorage.getItem('vrg_deleted_reviews');
      if (dSaved) {
        const dParsed = JSON.parse(dSaved);
        if (Array.isArray(dParsed)) deletedIds = dParsed;
      }
    } catch {}

    const deletedSet = new Set(deletedIds);

    try {
      const saved = localStorage.getItem('vrg_reviews');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((r: Review) => r && r.id && !deletedSet.has(r.id));
      }
    } catch {}

    return INITIAL_REVIEWS.filter(r => !deletedSet.has(r.id));
  };

  const [reviews, setReviews] = useState<Review[]>(getInitialReviews);
  const getInitialUserOrders = (): Order[] => {
    let localOrders: Order[] = [];
    const keysToRead = ['vrg_user_orders', 'veerika_customer_orders'];

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
      if (o && o.id) {
        uniqueMap.set(o.id, o);
      }
    });

    return Array.from(uniqueMap.values());
  };

  const [userOrders, setUserOrders] = useState<Order[]>(getInitialUserOrders);

  // Cart & Wishlist State
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('vrg_cart');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          ...item,
          quantity: typeof item.quantity === 'number' && item.quantity > 0 && item.quantity <= 20 ? item.quantity : 1
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vrg_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('vrg_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vrg_wishlist', JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  const handleToggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        toast.info(`Removed "${product.name}" from wishlist`, 'Wishlist');
        return prev.filter(p => p.id !== product.id);
      } else {
        toast.success(`Added "${product.name}" to wishlist!`, 'Wishlist ❤️');
        return [...prev, product];
      }
    });
  };

  useEffect(() => {
    const handleCustomWishlist = (e: any) => {
      if (e.detail) handleToggleWishlist(e.detail);
    };
    window.addEventListener('toggleWishlist', handleCustomWishlist as EventListener);
    return () => window.removeEventListener('toggleWishlist', handleCustomWishlist as EventListener);
  }, []);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isMobileCheckoutOpen, setIsMobileCheckoutOpen] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // User Auth State - Default to null so every visitor starts as a new user / guest
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vrg_user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.id === 'usr-1' || parsed?.phone === '9876543210') {
        localStorage.removeItem('vrg_user');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  // PhonePe Simulation Gateway Modal State
  const [phonepeModal, setPhonepeModal] = useState<{
    open: boolean;
    orderId: string;
    amount: number;
    payUrl: string;
    merchantTxnId: string;
  } | null>(null);

  // Fetch Core Data on Mount with LocalStorage SWR Persistence
  const fetchCoreData = async () => {
    try {
      const [pRes, cRes, bRes, rRes] = await Promise.all([
        fetch('/api/products').then((r) => r.json()).catch(() => null),
        fetch('/api/categories').then((r) => r.json()).catch(() => null),
        fetch('/api/banners').then((r) => r.json()).catch(() => null),
        fetch('/api/reviews').then((r) => r.json()).catch(() => null)
      ]);

      if (pRes?.success && Array.isArray(pRes.products) && pRes.products.length > 0) {
        setProducts(pRes.products);
        try {
          localStorage.setItem('vrg_products', JSON.stringify(pRes.products));
        } catch {}
      }
      if (cRes?.success && Array.isArray(cRes.categories) && cRes.categories.length > 0) {
        setCategories(cRes.categories);
        try {
          localStorage.setItem('vrg_categories', JSON.stringify(cRes.categories));
        } catch {}
      }
      if (bRes?.success && Array.isArray(bRes.banners) && bRes.banners.length > 0) {
        setBanners(bRes.banners);
        try {
          localStorage.setItem('vrg_banners', JSON.stringify(bRes.banners));
        } catch {}
      }
      if (rRes?.success && Array.isArray(rRes.reviews)) {
        let deletedIds: string[] = [];
        try {
          const dSaved = localStorage.getItem('vrg_deleted_reviews');
          if (dSaved) {
            const dParsed = JSON.parse(dSaved);
            if (Array.isArray(dParsed)) deletedIds = dParsed;
          }
        } catch {}

        const deletedSet = new Set(deletedIds);
        const cleanReviews = rRes.reviews.filter((r: Review) => r && r.id && !deletedSet.has(r.id));

        setReviews(cleanReviews);
        try {
          localStorage.setItem('vrg_reviews', JSON.stringify(cleanReviews));
        } catch {}
      }
    } catch (err) {
      console.error('Error fetching core catalog:', err);
    }
  };

  const fetchUserOrders = async () => {
    let localOrders: Order[] = [];
    try {
      const saved = localStorage.getItem('vrg_my_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) localOrders = parsed;
      }
    } catch {}

    if (!user) {
      setUserOrders([]);
      return;
    }

    // Filter local storage orders to match current user's email, phone, or ID
    localOrders = localOrders.filter(o => {
      if (user.id && o.userId === user.id) return true;
      if (user.email && o.customerEmail?.toLowerCase() === user.email.toLowerCase()) return true;
      if (user.phone && o.customerPhone?.replace(/\D/g, '').slice(-10) === user.phone.replace(/\D/g, '').slice(-10)) return true;
      return false;
    });

    const identifier = user.email || user.phone || user.id;
    if (!identifier) {
      setUserOrders(localOrders);
      return;
    }

    try {
      const res = await fetch(`/api/orders/user/${encodeURIComponent(identifier)}`, {
        credentials: 'include'
      }).catch(() => null);
      const data = res ? await res.json().catch(() => null) : null;
      let apiOrders = data?.success && Array.isArray(data.orders) ? data.orders : [];

      const orderMap = new Map<string, Order>();
      apiOrders.forEach((o: Order) => { if (o && o.id) orderMap.set(o.id, o); });
      localOrders.forEach((o: Order) => { if (o && o.id && !orderMap.has(o.id)) orderMap.set(o.id, o); });

      setUserOrders(Array.from(orderMap.values()));
    } catch (err) {
      console.error('Error fetching user orders:', err);
      setUserOrders(localOrders);
    }
  };

  useEffect(() => {
    fetchCoreData();
    fetchUserOrders();

    const handleSync = () => fetchUserOrders();
    const handleProductSync = () => fetchCoreData();
    const handleSyncReviews = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setReviews(e.detail);
      }
    };

    window.addEventListener('orderStatusUpdated', handleSync);
    window.addEventListener('vrg_products_updated', handleProductSync);
    window.addEventListener('vrg_categories_updated', handleProductSync);
    window.addEventListener('vrg_combos_updated', handleProductSync);
    window.addEventListener('vrg_reviews_updated', handleSyncReviews);
    window.addEventListener('storage', handleSync);

    // Verify backend auth session — skip if user is already an admin (local-auth login)
    fetch('/api/auth/me', {
      credentials: 'include'
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          // Don't overwrite an already-authenticated admin with a customer session
          setUser((curr) => {
            const currRole = curr?.role;
            if (currRole === 'SUPER_ADMIN' || currRole === 'ADMIN' || currRole === 'MANAGER') {
              return curr; // Keep the admin session intact
            }
            return data.user;
          });
        }
      })
      .catch((err) => console.log('Session check:', err));

    // Firebase Auth State Listener — only update user if not already admin-authenticated
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Don't let a Firebase Google session overwrite a local-admin login
        setUser((curr) => {
          const currRole = curr?.role;
          if (currRole === 'SUPER_ADMIN' || currRole === 'ADMIN' || currRole === 'MANAGER') {
            return curr; // Preserve admin session — fire-and-forget the Google sync
          }
          return curr; // Will be updated async below
        });

        // Only sync Google auth if not already an admin
        const currentUser = JSON.parse(localStorage.getItem('vrg_user') || 'null');
        const currentRole = currentUser?.role;
        if (currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN' || currentRole === 'MANAGER') {
          return; // Admin session is active — don't override with Google customer account
        }

        try {
          const idToken = await fbUser.getIdToken();
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ idToken })
          });
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          }
        } catch (err) {
          console.error('Server auth verification failed:', err);
        }
      }
    });

    return () => {
      window.removeEventListener('orderStatusUpdated', handleSync);
      window.removeEventListener('storage', handleSync);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('vrg_cart', JSON.stringify(cart));
  }, [cart]);

  // Persist current page to sessionStorage so refresh keeps user on the same page (e.g. checkout)
  useEffect(() => {
    try {
      sessionStorage.setItem('vrg_current_page', currentPage);
    } catch {}
  }, [currentPage]);

  // Persist page-specific state to sessionStorage for all pages
  useEffect(() => {
    try {
      sessionStorage.setItem('vrg_selected_category', JSON.stringify(selectedCategory ?? null));
    } catch {}
  }, [selectedCategory]);

  useEffect(() => {
    try {
      sessionStorage.setItem('vrg_search_query', JSON.stringify(searchQuery));
    } catch {}
  }, [searchQuery]);

  useEffect(() => {
    try {
      sessionStorage.setItem('vrg_policy_tab', JSON.stringify(policyTab));
    } catch {}
  }, [policyTab]);

  useEffect(() => {
    try {
      if (selectedProduct) {
        sessionStorage.setItem('vrg_selected_product', JSON.stringify(selectedProduct));
      } else {
        sessionStorage.removeItem('vrg_selected_product');
      }
    } catch {}
  }, [selectedProduct]);

  useEffect(() => {
    try {
      if (selectedOrderId) {
        sessionStorage.setItem('vrg_selected_order_id', JSON.stringify(selectedOrderId));
      } else {
        sessionStorage.removeItem('vrg_selected_order_id');
      }
    } catch {}
  }, [selectedOrderId]);

  // Fallback: if restored page requires state that is missing, redirect to home
  useEffect(() => {
    if (currentPage === 'product-detail' && !selectedProduct) {
      setCurrentPage('home');
    }
    if (currentPage === 'order-status' && !selectedOrderId) {
      setCurrentPage('home');
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('vrg_user', JSON.stringify(user));
      fetchUserOrders();
    } else {
      localStorage.removeItem('vrg_user');
    }
  }, [user]);

  // Cart Operations
  const handleAddToCart = (product: Product, quantity = 1, meta?: {
    isCombo?: boolean;
    comboId?: string;
    comboTitle?: string;
    comboBadge?: string;
    freeDelivery?: boolean;
    comboProducts?: Product[];
  }) => {
    toast.success(`Added "${product.name}" to cart (${quantity > 1 ? quantity + ' items' : '1 item'})!`, 'Cart Updated');
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(20, item.quantity + quantity), ...(meta || {}) }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: Math.min(20, Math.max(1, quantity)),
          isCombo: meta?.isCombo || (product as any).isCombo || product.id.startsWith('combo-'),
          comboId: meta?.comboId || (product.id.startsWith('combo-') ? product.id : undefined),
          comboTitle: meta?.comboTitle || (product.id.startsWith('combo-') ? product.name : undefined),
          comboBadge: meta?.comboBadge,
          freeDelivery: meta?.freeDelivery ?? (product as any).freeDelivery ?? false,
          comboProducts: meta?.comboProducts || []
        }
      ];
    });
  };

  const handleUpdateCartQty = (productId: string, newQty: number) => {
    const clampedQty = Math.min(20, Math.max(0, newQty));
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, quantity: clampedQty } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => {
      const item = prev.find(i => i.product.id === productId);
      if (item) {
        toast.info(`Removed "${item.product.name}" from cart`, 'Cart Updated');
      }
      return prev.filter((i) => i.product.id !== productId);
    });
  };

  // Direct "Buy Now" flow
  const handleBuyNow = (product: Product, quantity = 1) => {
    setCart([{ product, quantity }]);
    navigateTo('checkout');
  };

  // Centralized Navigation Handler — updates state, URL path, and browser history
  const navigateTo = useCallback((page: string, params?: {
    product?: Product | null;
    orderId?: string | null;
    policy?: string;
    category?: string;
    query?: string;
    replace?: boolean;
  }) => {
    if (params?.product !== undefined) setSelectedProduct(params.product);
    if (params?.orderId !== undefined) setSelectedOrderId(params.orderId);
    if (params?.policy !== undefined) setPolicyTab(params.policy);
    if (params?.category !== undefined) setSelectedCategory(params.category);
    if (params?.query !== undefined) setSearchQuery(params.query);

    setCurrentPage(page);

    const activeProd = params?.product !== undefined ? params.product : selectedProduct;
    const activeOrder = params?.orderId !== undefined ? params.orderId : selectedOrderId;
    const targetUrl = getUrlForPage(page, { product: activeProd, orderId: activeOrder });

    if (window.location.pathname !== targetUrl) {
      if (params?.replace) {
        window.history.replaceState({ page }, '', targetUrl);
      } else {
        window.history.pushState({ page }, '', targetUrl);
      }
    }
  }, [selectedProduct, selectedOrderId]);

  // Handle Browser Back & Forward Buttons (popstate listener)
  useEffect(() => {
    const handlePopState = () => {
      const { page, paramId } = getPageFromUrl(window.location.pathname);
      setCurrentPage(prevPage => {
        if (prevPage !== page) {
          return page;
        }
        return prevPage;
      });
      if (page === 'product-detail' && paramId) {
        const match = products.find(p => p.id === paramId || p.sku === paramId);
        if (match) setSelectedProduct(match);
      } else if (page === 'order-status' && paramId) {
        setSelectedOrderId(paramId);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  // Sync initial URL path to history state on mount
  useEffect(() => {
    const initialUrl = getUrlForPage(currentPage, { product: selectedProduct, orderId: selectedOrderId });
    if (window.location.pathname !== initialUrl && window.location.pathname === '/') {
      window.history.replaceState({ page: currentPage }, '', initialUrl);
    }
  }, []);

  // When products list updates from API, resolve selectedProduct if URL points to a product page
  useEffect(() => {
    const { page, paramId } = getPageFromUrl(window.location.pathname);
    if (page === 'product-detail' && paramId) {
      const match = products.find(p => p.id === paramId || p.sku === paramId);
      if (match) setSelectedProduct(match);
    }
  }, [products]);

  // Apply Coupon
  const handleApplyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const subtotal = cart.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0);
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartAmount: subtotal })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon({ code: data.code, discountAmount: data.discountAmount });
        return { success: true, message: data.message || 'Coupon applied successfully!' };
      } else {
        return { success: false, message: data.message || 'Invalid coupon code.' };
      }
    } catch (err) {
      return { success: false, message: 'Failed to connect to coupon service.' };
    }
  };

  // Confirmed Order Handler — called when payment succeeds or for direct orders
  const handleOrderConfirmed = (confirmedOrder: any) => {
    try {
      const prev = JSON.parse(localStorage.getItem('vrg_my_orders') || '[]');
      localStorage.setItem('vrg_my_orders', JSON.stringify([confirmedOrder, ...prev.filter((o: any) => o.id !== confirmedOrder.id)]));
    } catch {}

    window.dispatchEvent(new Event('orderStatusUpdated'));
    fetchUserOrders();

    setCart([]);
    setAppliedCoupon(null);
  };

  // Place Order API Handler
  const handlePlaceOrder = async (orderData: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    shippingAddress: any;
    paymentMethod: PaymentMethod;
    paymentProofUrl?: string;
    transactionId?: string;
    potCharge?: number;
    potOption?: string;
    packingCharge?: number;
    packingOption?: string;
    courierName?: string;
    courierDistrict?: string;
    courierBranch?: string;
  }) => {
    const subtotal = cart.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0);
    const totalPlantCount = cart.reduce((sum, i) => sum + i.quantity, 0);
    const potOption = orderData.potOption || 'NONE';
    const potUnitFee = potOption === '6_INCH' ? 99 : potOption === '8_INCH' ? 199 : 0;
    const potCharge = orderData.potCharge ?? (potUnitFee * totalPlantCount);
    
    // Packing calculation
    const packingOption = orderData.packingOption || 'STANDARD';
    const packingCharge = orderData.packingCharge ?? (packingOption === 'EXTRA_SECURE' ? 10 : packingOption === 'MAX_PROTECTION' ? 15 : 0);

    const shippingCharge = potOption !== 'NONE' ? 0 : calculateDeliveryFee(cart, orderData.shippingAddress?.state);
    const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const grandTotal = Math.max(0, subtotal + potCharge + packingCharge + shippingCharge - discountAmount);

    const rawPhone = (orderData.customerPhone || user?.phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : (rawPhone || '9123456789');
    const cleanEmail = (user?.email && user.email.includes('@'))
      ? user.email
      : (orderData.customerEmail && orderData.customerEmail.includes('@') && !orderData.customerEmail.includes('+'))
        ? orderData.customerEmail
        : `cust${cleanPhone}@veerikanursery.com`;

    const payload = {
      userId: user?.id,
      userEmail: user?.email,
      customerName: orderData.customerName || user?.name || 'Valued Customer',
      customerPhone: cleanPhone,
      customerEmail: cleanEmail,
      shippingAddress: {
        ...orderData.shippingAddress,
        phone: cleanPhone
      },
      paymentMethod: orderData.paymentMethod,
      paymentProofUrl: orderData.paymentProofUrl,
      transactionId: orderData.transactionId,
      potCharge,
      potOption,
      packingCharge,
      packingOption,
      courierName: orderData.courierName,
      courierDistrict: orderData.courierDistrict,
      courierBranch: orderData.courierBranch,
      items: cart.map((i) => ({
        productId: i.product.id,
        sku: i.product.sku || 'VRG-ROSE',
        name: i.product.name,
        tamilName: i.product.tamilName,
        price: i.product.sellingPrice,
        quantity: i.quantity,
        image: i.product.images?.[0] || '/products/double-delight.jpeg'
      })),
      subtotal,
      shippingCharge,
      discount: discountAmount,
      grandTotal,
      couponCode: appliedCoupon?.code
    };

    let data: any = null;
    let resStatus = 0;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      resStatus = res.status;
      const rawText = await res.text();
      try {
        data = JSON.parse(rawText);
      } catch {
        console.warn('Non-JSON order response:', resStatus, rawText.slice(0, 200));
        if (resStatus === 413) {
          return { success: false, message: '📸 Uploaded payment screenshot is too large. Please select a smaller photo or take a new screenshot.' };
        }
        return { success: false, message: `Server returned error (${resStatus}). Please try placing your order again.` };
      }
    } catch (err: any) {
      console.error('Order request network error:', err);
      return { success: false, message: 'Network connection error. Please check your connection and try again.' };
    }

    if (data && data.success) {
      const orderId = data.orderId || data.order?.id;
      const orderObj = data.order || {
        id: orderId,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        customerEmail: payload.customerEmail,
        shippingAddress: payload.shippingAddress,
        items: cart.map((i) => ({ productId: i.product.id, name: i.product.name, price: i.product.sellingPrice, quantity: i.quantity, image: i.product.images?.[0] || '/products/double-delight.jpeg' })),
        grandTotal,
        paymentMethod: orderData.paymentMethod,
        paymentProofUrl: payload.paymentProofUrl,
        transactionId: payload.transactionId,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        createdAt: new Date().toISOString()
      };

      if (orderData.paymentMethod === 'RAZORPAY') {
        // DO NOT clear cart or add to placed orders yet!
        // Cart will only be cleared when Razorpay payment is verified successfully.
        return {
          success: true,
          orderId,
          razorpayOrderId: data.razorpayOrderId,
          razorpayKeyId: data.razorpayKeyId,
          amount: grandTotal,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          customerEmail: payload.customerEmail
        };
      }

      // For direct orders (COD, QR / UPI), confirm order and clear cart now
      handleOrderConfirmed(orderObj);

      const payUrl = data.phonepePayUrl || data.phonepe?.payUrl || '';
      const merchantTxnId = data.phonepe?.merchantTransactionId || data.order?.merchantTransactionId || '';

      if (orderData.paymentMethod === 'PHONEPE') {
        const isRealPayUrl = payUrl && payUrl.startsWith('http') && !payUrl.includes('/#/phonepe-gateway');
        if (isRealPayUrl) {
          // Production: redirect to real PhonePe payment page
          window.location.href = payUrl;
          return { success: true, orderId };
        } else {
          // Sandbox / Development: show the PhonePe simulation modal
          setCurrentPage('checkout'); // stay on checkout page so modal renders on top
          setPhonepeModal({
            open: true,
            orderId,
            amount: grandTotal,
            payUrl: payUrl || '',
            merchantTxnId: merchantTxnId
          });
          return { success: true, orderId };
        }
      } else {
        // COD / QR order — go straight to order status page
        navigateTo('order-status', { orderId });
      }

      fetchUserOrders();
      return { success: true, orderId };
    } else {
      const errMsg = data?.errors?.length
        ? data.errors.map((e: any) => `${e.field ? e.field + ': ' : ''}${e.message}`).join(', ')
        : data?.message || 'Server busy or order validation failed. Please try again.';
      return { success: false, message: errMsg };
    }
  };

  // Review Submit
  const handleSubmitReview = async (reviewData: { rating: number; title: string; comment: string; userName: string }) => {
    if (!selectedProduct) return;
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          ...reviewData
        })
      });
      fetchCoreData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-page)',
          color: 'var(--text-body)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--font-body)',
          opacity: showSplash ? 0 : 1,
          transition: 'opacity 0.5s ease',
          position: 'relative',
        }}
      >
        {/* 3D Global Body Background Layer */}
        <div className="body-3d-bg">
          <span className="particle-3d-1">🍃</span>
          <span className="particle-3d-2">🌸</span>
          <span className="particle-3d-3">🌿</span>
        </div>

      {/* Primary Header for Home page (hidden when mobile checkout is open) */}
      {currentPage === 'home' && !isMobileCheckoutOpen && (
        <Header
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          wishlistCount={wishlist.length}
          onOpenCart={() => {
            navigateTo('checkout');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigate={(page, params) => {
            navigateTo(page, params);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          categories={categories}
          activeCategory={selectedCategory}
          onSelectCategory={(catId) => {
            navigateTo('shop', { category: catId });
          }}
          isAdmin={false}
          onToggleAdmin={() => navigateTo('admin')}
          user={user}
          onOpenExpertAdvice={() => setIsExpertAdviceOpen(true)}
        />
      )}

      {/* Secondary Navbar for non-Home store pages or when Mobile Cart is open */}
      {(currentPage !== 'home' || isMobileCheckoutOpen) && currentPage !== 'admin' && (
        <SecondaryNavbar
          currentPage={isMobileCheckoutOpen ? 'cart' : currentPage}
          cartCount={cartCount}
          user={user}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          onNavigate={(page, params) => {
            if (isMobileCheckoutOpen && page !== 'cart') {
              setIsMobileCheckoutOpen(false);
            }
            // Cart icon → go directly to 9-step checkout (Step 1 = Cart Items)
            if (page === 'cart') {
              navigateTo('checkout');
              window.scrollTo({ top: 0, behavior: 'smooth' });
              return;
            }
            navigateTo(page, params);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Primary Page Router */}
      <main className="flex-1">
        <React.Suspense fallback={
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-extrabold text-emerald-800 tracking-wide">Loading page...</p>
          </div>
        }>
        {currentPage === 'home' && (
          <HomePage
            products={products}
            categories={categories}
            banners={banners}
            reviews={reviews}
            onAddToCart={handleAddToCart}
            onViewDetails={(product) => {
              navigateTo('product-detail', { product });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenCareGuide={(product) => setCareGuideProduct(product)}
            onOpenExpertAdvice={() => setIsExpertAdviceOpen(true)}
            onNavigate={(page) => {
              navigateTo(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectCategory={(catId) => {
              navigateTo('shop', { category: catId });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSearchTag={(tag) => {
              navigateTo('shop', { query: tag });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentPage === 'shop' && (
          <ShopPage
            products={products}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(catId) => setSelectedCategory(catId)}
            searchQuery={searchQuery}
            onSearchChange={(q) => setSearchQuery(q)}
            onAddToCart={handleAddToCart}
            onViewDetails={(product) => {
              navigateTo('product-detail', { product });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenCareGuide={(product) => setCareGuideProduct(product)}
          />
        )}

        {currentPage === 'product-detail' && selectedProduct && (
          <ProductDetailsPage
            product={selectedProduct}
            onBack={() => navigateTo('shop')}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onOpenCareGuide={(p) => setCareGuideProduct(p)}
            relatedProducts={products.filter((p) => p.categoryId === selectedProduct.categoryId && p.id !== selectedProduct.id)}
            onSelectProduct={(p) => {
              navigateTo('product-detail', { product: p });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            reviews={reviews.filter((r) => r.productId === selectedProduct.id)}
            onSubmitReview={handleSubmitReview}
            isWishlisted={wishlist.some((w) => w.id === selectedProduct.id)}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {currentPage === 'cart' && (
          <CartPage
            items={cart}
            user={user}
            onUpdateQuantity={handleUpdateCartQty}
            onRemoveItem={handleRemoveFromCart}
            onProceedToCheckout={() => {
              if (!user) {
                alert('🔑 Login or Sign Up Required:\nPlease login to your account before placing an order.');
                navigateTo('account');
                return;
              }
              navigateTo('checkout');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onContinueShopping={() => navigateTo('shop')}
            appliedCoupon={appliedCoupon}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={() => setAppliedCoupon(null)}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            items={cart}
            user={user}
            onBackToCart={() => navigateTo('cart')}
            appliedCoupon={appliedCoupon}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={() => setAppliedCoupon(null)}
            onPlaceOrder={handlePlaceOrder}
            onOrderConfirmed={handleOrderConfirmed}
            onUpdateQuantity={handleUpdateCartQty}
            onRemoveItem={handleRemoveFromCart}
            onNavigateToAccount={() => navigateTo('account')}
            onNavigateToHome={() => {
              navigateTo('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentPage === 'order-status' && selectedOrderId && (
          <OrderStatusPage
            orderId={selectedOrderId}
            onBackToHome={() => {
              navigateTo('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentPage === 'account' && (
          <AccountPage
            user={user}
            orders={userOrders}
            wishlist={wishlist}
            onLogin={(userData) => {
              setUser(userData);
              localStorage.setItem('vrg_user', JSON.stringify(userData));
            }}
            onLogout={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                await signOut(auth);
              } catch (e) {
                console.error(e);
              }
              localStorage.removeItem('vrg_user');
              localStorage.removeItem('vrg_my_orders');
              setUser(null);
              setUserOrders([]);
            }}
            onViewOrder={(orderId) => {
              navigateTo('order-status', { orderId });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAddToCart={handleAddToCart}
          />
        )}

        {currentPage === 'policies' && (
          <PoliciesPage initialTab={policyTab} />
        )}

        {currentPage === 'admin' && (
          user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'MANAGER') ? (
            <AdminPage
              onBackToStore={() => navigateTo('home')}
              adminUser={user}
              reviews={reviews}
              onUpdateReviews={(updated) => {
                setReviews(updated);
                try {
                  localStorage.setItem('vrg_reviews', JSON.stringify(updated));
                } catch {}
              }}
            />
          ) : (
            <AdminLoginForm
              onLoginSuccess={(adminUser) => {
                setUser(adminUser);
                localStorage.setItem('vrg_user', JSON.stringify(adminUser));
              }}
              onBackToStore={() => navigateTo('home')}
            />
          )
        )}
        </React.Suspense>
      </main>

      {/* Primary Footer - rendered only on Home page */}
      {currentPage === 'home' && (
        <Footer
          onNavigate={(page, params) => {
            navigateTo(page, params);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQty}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          if (!user) {
            alert('🔑 Login or Sign Up Required:\nPlease login to your account before placing an order.');
            navigateTo('account');
            return;
          }
          navigateTo('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={() => setAppliedCoupon(null)}
        appliedCoupon={appliedCoupon}
      />

      {/* Lazy Modals & Checkout Flow */}
      <React.Suspense fallback={null}>
        {/* Plant Care Advice Modal */}
        {careGuideProduct && (
          <PlantCareModal
            product={careGuideProduct}
            onClose={() => setCareGuideProduct(null)}
          />
        )}

        {/* Expert Advice & Call Helpline Modal */}
        {isExpertAdviceOpen && (
          <ExpertAdviceModal
            isOpen={isExpertAdviceOpen}
            onClose={() => setIsExpertAdviceOpen(false)}
          />
        )}

        {/* PhonePe PG Modal */}
        {phonepeModal && phonepeModal.open && (
          <PhonePeModal
            merchantTransactionId={phonepeModal.merchantTxnId}
            amount={phonepeModal.amount}
            orderId={phonepeModal.orderId}
            payUrl={phonepeModal.payUrl}
            onSuccess={(oid) => {
              setPhonepeModal(null);
              navigateTo('order-status', { orderId: oid || phonepeModal.orderId });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onFailure={(err) => {
              setPhonepeModal(null);
              alert(`Payment failed: ${err}`);
            }}
            onCancel={() => setPhonepeModal(null)}
          />
        )}

        {/* Mobile Multi-Step Checkout Flow — full-screen, mobile only */}
        {isMobileCheckoutOpen && (
          <MobileCheckoutFlow
            isOpen={isMobileCheckoutOpen}
            onClose={() => setIsMobileCheckoutOpen(false)}
            items={cart}
            user={user}
            appliedCoupon={appliedCoupon}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={() => setAppliedCoupon(null)}
            onPlaceOrder={handlePlaceOrder}
            onOrderConfirmed={handleOrderConfirmed}
            onUpdateQuantity={handleUpdateCartQty}
            onRemoveItem={handleRemoveFromCart}
            onNavigateToAccount={() => {
              setIsMobileCheckoutOpen(false);
              navigateTo('account');
            }}
          />
        )}
      </React.Suspense>

      {/* Floating Sticky Cart Button */}
      <button
        onClick={() => {
          navigateTo('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="fixed bottom-6 left-6 z-40 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white px-4 py-3 rounded-full shadow-2xl transition-all duration-200 items-center gap-2.5 border-2 border-emerald-500/40 cursor-pointer hidden sm:flex"
        title="Open Shopping Cart Page"
        aria-label="Open Shopping Cart Page"
      >
        <div className="relative flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-emerald-400" />
          {cartCount > 0 && (
            <span className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-xs font-bold tracking-wide">
          {cartCount > 0 ? `Cart (${cartCount})` : 'Cart'}
        </span>
      </button>

      {/* Floating WhatsApp Button — hidden on mobile (uses bottom nav space) */}
      <a
        href="https://wa.me/917200826129?text=Hello%20Veerika%20Rose%20Garden!%20I%20have%20an%20enquiry%20about%20plants."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 items-center justify-center group hidden sm:flex"
        title="Chat with us on WhatsApp (+91 72008 26129)"
        aria-label="Chat with us on WhatsApp"
      >
        <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />
        <svg className="w-7 h-7 fill-current relative z-10" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        <span className="hidden sm:inline-block max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-bold pl-0 group-hover:pl-2 rounded-l-full">
          WhatsApp Us
        </span>
      </a>

      {/* ===== MOBILE BOTTOM NAVIGATION BAR ===== */}
      {currentPage !== 'admin' && (
        <nav className={`mobile-bottom-nav ${isCartOpen || isMobileCheckoutOpen ? '!hidden' : ''}`} role="navigation" aria-label="Mobile bottom navigation">
          <button className={`nav-item ${currentPage === 'home' && !isMobileCheckoutOpen ? 'active' : ''}`} onClick={() => {
            if (isMobileCheckoutOpen) setIsMobileCheckoutOpen(false);
            navigateTo('home');
          }}>
            <Home />
            <span>Home</span>
          </button>
          <button className={`nav-item ${currentPage === 'shop' && !isMobileCheckoutOpen ? 'active' : ''}`} onClick={() => {
            if (isMobileCheckoutOpen) setIsMobileCheckoutOpen(false);
            navigateTo('shop');
          }}>
            <Store />
            <span>Shop</span>
          </button>
          <button className={`nav-item ${currentPage === 'cart' || currentPage === 'checkout' || isMobileCheckoutOpen ? 'active' : ''} cart-btn`} onClick={() => {
            navigateTo('checkout');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} aria-label="Open checkout">
            {cartCount > 0 && <span className="cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
            <ShoppingCart />
            <span>Cart</span>
          </button>
          <button className={`nav-item ${currentPage === 'account' && !isMobileCheckoutOpen ? 'active' : ''}`} onClick={() => {
            if (isMobileCheckoutOpen) setIsMobileCheckoutOpen(false);
            navigateTo('account');
          }}>
            <UserIcon />
            <span>{user ? user.name?.split(' ')[0] : 'Account'}</span>
          </button>
        </nav>
      )}

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
    </>
  );
};

export default App;
