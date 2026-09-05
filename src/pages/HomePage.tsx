import React, { useState, useEffect } from 'react';
import { Product, Category, Banner, Review, Combo } from '../types';
import { ProductCard, CompactProductCard, HorizontalScrollRow } from '../components/ProductCard';
import { CombosSection } from '../components/CombosSection';
import { Card3D } from '../components/Card3D';
import { INITIAL_REVIEWS } from '../data/reviewsData';
import { comboToProduct, getCachedActiveCombos } from '../utils/comboUtils';
import {
  ShieldCheck, Truck, Sprout, HeartHandshake, Star, ArrowRight,
  MapPin, MessageSquare, Phone, Leaf, Sparkles, Package, ChevronRight, X, ZoomIn, Camera
} from 'lucide-react';

interface HomePageProps {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  reviews?: Review[];
  onAddToCart: (product: Product, quantity?: number, meta?: any) => void;
  onViewDetails: (product: Product) => void;
  onOpenCareGuide: (product: Product) => void;
  onNavigate: (page: string, params?: any) => void;
  onSelectCategory: (catId: string) => void;
  onSearchTag: (tag: string) => void;
  onOpenExpertAdvice?: () => void;
}

const TRUST_ITEMS = [
  { icon: Truck, label: '7-Day Root Protection', sub: 'Live arrival guaranteed', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { icon: ShieldCheck, label: 'PhonePe Safe Payment', sub: '100% encrypted checkout', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { icon: Sprout, label: 'Organic Nursery', sub: 'Chemical-free cultivation', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { icon: HeartHandshake, label: 'Free Expert Support', sub: 'Call + WhatsApp helpline', color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
];


const TESTIMONIALS = [
  { name: 'Priya M.', location: 'Chennai', rating: 5, text: 'Received the most beautiful hybrid roses. The packaging was incredible — plants arrived perfectly healthy!' },
  { name: 'Rajesh K.', location: 'Coimbatore', rating: 5, text: 'Ordered 3 grafted mango saplings. Excellent quality and fast shipping. Will definitely order again.' },
  { name: 'Kavitha S.', location: 'Madurai', rating: 5, text: 'The care guide that came with my plants helped me a lot. My jasmine is blooming beautifully now!' },
];

export const HomePage: React.FC<HomePageProps> = ({
  products, categories, banners, reviews,
  onAddToCart, onViewDetails, onOpenCareGuide,
  onNavigate, onSelectCategory, onSearchTag, onOpenExpertAdvice,
}) => {
  const [selectedReviewPhoto, setSelectedReviewPhoto] = useState<Review | null>(null);
  const [reviewsList, setReviewsList] = useState<Review[]>(reviews || []);
  const [combosList, setCombosList] = useState<Combo[]>(getCachedActiveCombos);

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const res = await fetch('/api/combos').then(r => r.json()).catch(() => null);
        if (res?.success && Array.isArray(res.combos)) {
          const deletedSet = new Set(JSON.parse(localStorage.getItem('vrg_deleted_combos') || '[]'));
          const activeCombos = res.combos.filter((c: Combo) => c.active !== false && !deletedSet.has(c.id));
          setCombosList(activeCombos);
          try {
            localStorage.setItem('vrg_combos_cache', JSON.stringify(activeCombos));
          } catch {}
        }
      } catch {}
    };

    fetchCombos();
    const handleCombosSync = () => fetchCombos();
    window.addEventListener('vrg_combos_updated', handleCombosSync);
    window.addEventListener('storage', handleCombosSync);
    return () => {
      window.removeEventListener('vrg_combos_updated', handleCombosSync);
      window.removeEventListener('storage', handleCombosSync);
    };
  }, []);

  useEffect(() => {
    const handleReviewsUpdated = (e: CustomEvent) => {
      if (e.detail && Array.isArray(e.detail)) {
        setReviewsList(e.detail);
      }
    };
    window.addEventListener('vrg_reviews_updated' as any, handleReviewsUpdated);
    return () => window.removeEventListener('vrg_reviews_updated' as any, handleReviewsUpdated);
  }, []);

  const getLiveReviews = (): Review[] => {
    if (Array.isArray(reviewsList) && reviewsList.length > 0) return reviewsList.filter(Boolean);
    if (Array.isArray(reviews) && reviews.length > 0) return reviews.filter(Boolean);
    try {
      const saved = localStorage.getItem('vrg_reviews');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      }
    } catch {}
    return (INITIAL_REVIEWS || []).filter(Boolean);
  };

  const approvedReviews = getLiveReviews().filter(r => r && (r.status === 'APPROVED' || !r.status));

  // Helper: exclude combo/offer products from regular grids — they belong only in CombosSection / Combos category
  const isComboProduct = (p: Product) => {
    if (!p) return false;
    const catId = (p.categoryId || '').toLowerCase();
    const catName = (p.categoryName || '').toLowerCase();
    const id = (p.id || '').toLowerCase();
    return (
      catId === 'cat-combos' ||
      catId === 'combos' ||
      catId === 'offers' ||
      catName.includes('combo') ||
      catName.includes('offer') ||
      id.startsWith('combo-') ||
      (Array.isArray(p.tags) && p.tags.some(t => t === 'combo' || t === 'offer' || t === 'bundle' || t === 'combos'))
    );
  };

  const safeProducts = Array.isArray(products) ? products.filter(Boolean) : [];
  const safeCategories = Array.isArray(categories) ? categories.filter(Boolean) : [];

  const regularProducts = safeProducts.filter(p => !isComboProduct(p));
  const featuredProducts = regularProducts.filter(p => p && p.featured).slice(0, 8);
  const bestSellers = regularProducts.filter(p => p && p.bestSeller).slice(0, 8);
  const activeCategories = safeCategories.filter(c => c && c.isActive !== false).sort((a, b) => ((a?.order ?? 1) - (b?.order ?? 1)));
  const displayCategories = (activeCategories.filter(c => c && c.isFeatured).length > 0 ? activeCategories.filter(c => c && c.isFeatured) : activeCategories).slice(0, 8);

  const getCategoryProducts = (cat: Category) => {
    const cName = (cat.name || '').toLowerCase();
    const cSlug = (cat.slug || '').toLowerCase();
    const cId = (cat.id || '').toLowerCase();
    const isComboCat = cId === 'cat-combos' || cId === 'combos' || cSlug === 'combos' || cName.includes('combo') || cName.includes('offer');

    if (isComboCat) {
      if (combosList.length > 0) {
        return combosList.map(comboToProduct);
      }
      return products.filter(isComboProduct);
    }

    return products.filter(p => {
      if (p.status === 'DISABLED' || isComboProduct(p)) return false;
      const pCatId = (p.categoryId || '').toLowerCase();
      const pCatName = (p.categoryName || '').toLowerCase();
      return (
        (pCatId && (pCatId === cId || pCatId === cSlug)) ||
        (pCatName && (pCatName === cName || cName.includes(pCatName) || pCatName.includes(cName)))
      );
    });
  };

  const handleProductAddToCart = (product: Product) => {
    const matchedCombo = combosList.find(c => c.id === product.id);
    if (matchedCombo) {
      onAddToCart(product, 1, {
        isCombo: true,
        comboId: matchedCombo.id,
        comboTitle: matchedCombo.title,
        comboBadge: matchedCombo.badge || 'COMBO OFFER',
        freeDelivery: matchedCombo.freeDelivery === true,
        comboProducts: matchedCombo.products || []
      });
    } else {
      onAddToCart(product);
    }
  };

  return (
    <div style={{ background: 'var(--bg-page)' }}>

      {/* ===== COMBOS & OFFERS (ABOVE CATEGORIES) ===== */}
      <CombosSection onAddToCart={onAddToCart} onSelectProduct={onViewDetails} />

      {/* ===== CATEGORIES (FIRST) ===== */}
      <section className="section-container" style={{ padding: '24px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div>
            <span className="section-label">Browse by Type</span>
            <div className="divider-green" />
            <h2 className="section-title" style={{ fontSize: 'clamp(20px, 3vw, 30px)', marginTop: 4 }}>
              Plant <em>Categories</em>
            </h2>
          </div>
          <button className="btn-outline-green" style={{ fontSize: 12, padding: '8px 16px' }} onClick={() => onNavigate('shop')}>
            View All <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
        {displayCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 24px', background: 'white', border: '2px dashed #bbf7d0', borderRadius: 20 }}>
            <Leaf style={{ width: 32, height: 32, color: 'var(--color-green)', margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No categories yet. Add them in Admin Panel.</p>
          </div>
        ) : (
          <div className="hp-cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {displayCategories.map(cat => {
              const catProducts = getCategoryProducts(cat);
              const plantCount = cat.productCount ?? (catProducts.length > 0 ? catProducts.length : 3);
              const discounts = catProducts.map(p => {
                if (p.discount && p.discount > 0) return p.discount;
                if (p.mrp && p.sellingPrice && p.mrp > p.sellingPrice) return Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100);
                return 0;
              }).filter(d => d > 0);
              let maxDis = 20;
              if (discounts.length > 0) maxDis = Math.max(...discounts);
              else if ((cat.slug || '').includes('jasmine') || (cat.name || '').includes('jasmine')) maxDis = 40;
              else if ((cat.slug || '').includes('rose') || (cat.name || '').includes('rose')) maxDis = 20;
              const catPhoto = (cat.image && !cat.image.includes('photo-1518709268805-4e9042af9f23')) 
                ? cat.image 
                : (catProducts.find(p => p.images?.[0] && !p.images[0].includes('photo-1518709268805-4e9042af9f23'))?.images?.[0] || cat.image || '/products/double-delight.jpeg');

              return (
                <div key={cat.id} className="card-white group" style={{ overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => { onSelectCategory(cat.id); onNavigate('shop'); }}>
                  <div style={{ height: 110, overflow: 'hidden', position: 'relative' }}>
                    <img src={catPhoto}
                      alt={cat.name} loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                      className="group-hover-scale"
                      onError={e => { (e.target as HTMLImageElement).src = '/products/double-delight.jpeg'; }} />
                    <span style={{ position: 'absolute', top: 6, right: 6, zIndex: 10, fontSize: 9, fontWeight: 800, background: 'linear-gradient(135deg,#e11d48,#be123c)', color: 'white', padding: '2px 7px', borderRadius: 999 }}>
                      {maxDis}% OFF
                    </span>
                  </div>
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>{cat.name}</h3>
                      <span style={{ fontSize: 9, color: 'var(--color-green)', fontWeight: 700 }}>{plantCount} plants</span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-tamil)', fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px' }}>{cat.tamilName}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-green-dark)', fontSize: 11, fontWeight: 700 }}>
                      Shop now <ArrowRight style={{ width: 10, height: 10 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== MOBILE ONLY: CATEGORY HORIZONTAL PRODUCT PULL SECTIONS ===== */}
      <div className="block sm:hidden" style={{ padding: '16px 0 0' }}>
        {/* Horizontal Category Filter Pills */}
        <div className="scroll-x-touch" style={{ display: 'flex', gap: 8, padding: '4px 16px 14px', background: 'white', borderBottom: '1px solid #e5f0e0', marginBottom: 16 }}>
          <button
            onClick={() => onNavigate('shop')}
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(22,163,74,0.3)' }}
          >
            All Products
          </button>
          {activeCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { onSelectCategory(cat.id); onNavigate('shop'); }}
              style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span>🌱</span> {cat.name}
            </button>
          ))}
        </div>

        {/* Best Sellers Horizontal Pull Section */}
        {bestSellers.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>🌱</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: '#1a2e1a', margin: 0 }}>
                  Best Sellers
                </h2>
              </div>
              <button
                onClick={() => onNavigate('shop')}
                style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
              >
                More <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
            <HorizontalScrollRow>
              {bestSellers.map(product => (
                <CompactProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onViewDetails={onViewDetails}
                />
              ))}
            </HorizontalScrollRow>
          </div>
        )}

        {/* Fresh Nursery Arrivals (All New Plants) Pull Section */}
        {regularProducts.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>🌿</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: '#1a2e1a', margin: 0 }}>
                  Fresh Arrivals & All Plants
                </h2>
              </div>
              <button
                onClick={() => onNavigate('shop')}
                style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
              >
                All ({regularProducts.length}) <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
            <HorizontalScrollRow>
              {regularProducts.slice(0, 15).map(product => (
                <CompactProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onViewDetails={onViewDetails}
                />
              ))}
            </HorizontalScrollRow>
          </div>
        )}

        {/* Category-by-Category Horizontal Pull Sections */}
        {activeCategories.map(cat => {
          const catProducts = getCategoryProducts(cat);

          if (catProducts.length === 0) return null;

          return (
            <div key={cat.id} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>🌱</span>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: '#1a2e1a', margin: 0 }}>
                    {cat.name}
                  </h2>
                </div>
                <button
                  onClick={() => { onSelectCategory(cat.id); onNavigate('shop'); }}
                  style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
                >
                  More <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </div>

              <HorizontalScrollRow>
                {catProducts.map(product => (
                  <CompactProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleProductAddToCart}
                    onViewDetails={onViewDetails}
                  />
                ))}
              </HorizontalScrollRow>
            </div>
          );
        })}
      </div>

      {/* ===== DESKTOP ONLY: ALL PRODUCTS GRID ===== */}
      <section className="section-container hidden sm:block" style={{ padding: '32px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div>
            <span className="section-label">Our Collection</span>
            <div className="divider-green" />
            <h2 className="section-title" style={{ fontSize: 'clamp(20px, 3vw, 30px)', marginTop: 4 }}>
              All <em>Plants</em>
            </h2>
          </div>
          <button className="btn-outline-green" style={{ fontSize: 12, padding: '8px 16px' }} onClick={() => onNavigate('shop')}>
            Full Catalog <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <div className="hp-product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {regularProducts.slice(0, 24).map(p => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onViewDetails={onViewDetails} onOpenCareGuide={onOpenCareGuide} />
          ))}
        </div>
        {regularProducts.length > 24 && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button className="btn-green" onClick={() => onNavigate('shop')}>
              View All {regularProducts.length} Plants <ArrowRight style={{ width: 15, height: 15 }} />
            </button>
          </div>
        )}
      </section>

      {/* ===== 3D CUSTOMER PHOTO REVIEWS SECTION (BELOW OUR COLLECTION / ALL PLANTS) ===== */}
      <section className="section-container" style={{ padding: '48px 24px 24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #fff7f7 100%)',
          borderRadius: 32,
          padding: 'clamp(24px, 4vw, 40px)',
          border: '2px solid #bbf7d0',
          boxShadow: '0 20px 50px -15px rgba(22, 163, 74, 0.15), 0 8px 20px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Ambient 3D Glow Blobs */}
          <div style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -50, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, border: '1px solid #fde68a', marginBottom: 8 }}>
                <Camera style={{ width: 13, height: 13 }} /> VERIFIED BUYER PLANT PHOTOS
              </div>
              <h2 className="section-title" style={{ fontSize: 'clamp(22px, 3.5vw, 36px)' }}>
                Customer Photo <em>Reviews</em>
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0', maxWidth: 500 }}>
                Real photos & feedback uploaded by plant lovers directly from their home & terrace gardens.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', padding: '8px 16px', borderRadius: 20, border: '1.5px solid #e5f0e0', boxShadow: '0 4px 12px rgba(22,163,74,0.08)' }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} style={{ width: 16, height: 16, color: '#f59e0b', fill: '#f59e0b' }} />
                ))}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-dark)' }}>4.9 / 5.0 Rating</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>500+ Verified Sapling Deliveries</div>
              </div>
            </div>
          </div>

          {/* 3D Review Cards Grid */}
          {approvedReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: 24, border: '2px dashed #bbf7d0' }}>
              <Camera style={{ width: 36, height: 36, color: 'var(--color-green)', margin: '0 auto 10px', opacity: 0.5 }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No customer photo reviews yet. Add photos in Admin Panel!</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: approvedReviews.length === 1 ? 'minmax(280px, 420px)' : 'repeat(auto-fit, minmax(280px, 380px))',
              justifyContent: 'center',
              gap: 24
            }}>
              {approvedReviews.map(review => (
                <Card3D key={review.id} maxDegree={8} scale={1.02}>
                  <div style={{
                    background: 'white',
                    borderRadius: 24,
                    overflow: 'hidden',
                    border: '1.5px solid #e5f0e0',
                    boxShadow: '0 10px 30px -10px rgba(22, 163, 74, 0.12), 0 4px 10px rgba(0,0,0,0.03)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Photo Header with Zoom Lightbox trigger */}
                    {review.imageUrl ? (
                      <div
                        style={{
                          background: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                        onClick={() => setSelectedReviewPhoto(review)}
                      >
                        <img
                          src={review.imageUrl}
                          alt={review.userName}
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: 460,
                            objectFit: 'contain',
                            display: 'block',
                            transition: 'transform 0.4s ease'
                          }}
                          className="group-hover-scale"
                          onError={e => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        {/* 3D Glass overlay tag */}
                        <div style={{
                          position: 'absolute', top: 12, left: 12,
                          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
                          padding: '5px 12px', borderRadius: 999,
                          display: 'flex', alignItems: 'center', gap: 5,
                          fontSize: 11, fontWeight: 800, color: 'var(--color-green-dark)',
                          border: '1px solid rgba(255,255,255,0.9)',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                        }}>
                          <Sparkles style={{ width: 12, height: 12, color: '#f59e0b' }} /> Customer Photo
                        </div>

                        <div style={{
                          position: 'absolute', bottom: 12, right: 12,
                          background: 'rgba(15,23,42,0.8)', color: 'white', backdropFilter: 'blur(6px)',
                          padding: '6px 12px', borderRadius: 999,
                          fontSize: 11, fontWeight: 700,
                          display: 'flex', alignItems: 'center', gap: 5
                        }}>
                          <ZoomIn style={{ width: 13, height: 13 }} /> Click to Zoom
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>
                          {review.userName[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-dark)' }}>{review.userName}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{review.location || 'Tamil Nadu'}</div>
                        </div>
                      </div>
                    )}

                    {/* Card Content Body */}
                    <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        {/* Rating Stars & Verified Pill */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                          <div style={{ display: 'flex', gap: 2 }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} style={{ width: 14, height: 14, color: i < review.rating ? '#f59e0b' : '#d1d5db', fill: i < review.rating ? '#f59e0b' : 'none' }} />
                            ))}
                          </div>
                          {review.isVerified && (
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: 999, border: '1px solid #bbf7d0' }}>
                              ✓ Verified Buyer
                            </span>
                          )}
                        </div>

                        {/* Plant Tag */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '3px 9px', borderRadius: 8, fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
                          <span>🌱</span> {review.productName || 'Nursery Sapling'}
                        </div>

                        {review.title && (
                          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 6px', lineHeight: 1.3 }}>
                            "{review.title}"
                          </h4>
                        )}

                        <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                          "{review.comment}"
                        </p>
                      </div>

                      {/* Footer Info */}
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{review.userName}</span>
                        <span>{review.location || 'Pennagaram'}</span>
                      </div>
                    </div>
                  </div>
                </Card3D>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== HERO ===== */}
      <section style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 35%, #fff7f7 65%, #fef9f0 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', right: '20%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="section-container hero-grid" style={{ padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', minHeight: '85vh', gap: 40 }}>

          {/* Left: Text */}
          <div className="hero-left" style={{ padding: '60px 0', display: 'flex', flexDirection: 'column' }}>
            <div className="animate-fade-up" style={{ marginBottom: 16 }}>
              <span className="section-label">Premier Plant Nursery · Pennagaram, Tamil Nadu</span>
            </div>
            <p className="animate-fade-up-1" style={{ fontFamily: 'var(--font-tamil)', fontSize: 15, color: 'var(--text-muted)', marginBottom: 14 }}>
              வீரிகா ரோஜா கார்டன்
            </p>
            <h1 className="animate-fade-up-2" style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5vw, 68px)',
              fontWeight: 800,
              color: 'var(--text-dark)',
              lineHeight: 1.1,
              marginBottom: 20,
            }}>
              Healthy Roses &<br />
              <em style={{ color: 'var(--color-rose)', fontStyle: 'italic' }}>Exotic Plants</em>
              <br />
              <span style={{ fontSize: '0.6em', color: 'var(--color-green-dark)', fontStyle: 'normal' }}>
                Delivered to Your Door 🌿
              </span>
            </h1>
            <p className="animate-fade-up-3" style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
              Premium hybrid roses, grafted fruit trees, jasmine &amp; organic fertilizers — packed with 7-day root moisture protection for safe delivery across India.
            </p>
            <div className="animate-fade-up-4" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
              <button className="btn-green" onClick={() => onNavigate('shop')}>
                Explore All Plants <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
              <a href="https://wa.me/919361540714?text=Hello%20Veerika%20Rose%20Garden" target="_blank" rel="noreferrer" className="btn-outline-green" style={{ textDecoration: 'none' }}>
                <MessageSquare style={{ width: 15, height: 15 }} /> WhatsApp Order
              </a>
            </div>
            {/* Stats */}
            <div className="animate-fade-up-4" style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {[{ val: '500+', lbl: 'Plant Varieties' }, { val: '4.9★', lbl: 'Customer Rating' }, { val: '10K+', lbl: 'Orders Delivered' }].map(s => (
                <div key={s.lbl}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--color-green-dark)' }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Floating 3D Flower Pot Showcase */}
          <div style={{ position: 'relative', height: 500, display: 'none', perspective: '1000px' }} className="hero-right-show">
            {/* 3D Circular Pedestal / Glow */}
            <div style={{
              position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%) rotateX(70deg)',
              width: 320, height: 320, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, rgba(244,63,94,0.15) 50%, transparent 70%)',
              boxShadow: '0 20px 50px rgba(22,163,74,0.25)',
              pointerEvents: 'none'
            }} />

            {/* 3D Flower Pot Image & Floating Container */}
            <div
              className="animate-float-3d"
              style={{
                position: 'absolute', top: 10, left: 30, right: 30, bottom: 30,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                transformStyle: 'preserve-3d',
              }}
            >
              <img
                src="/3d-flower-pot.png"
                alt="3D Rose Flower Pot"
                style={{
                  maxHeight: 380, width: 'auto', objectFit: 'contain',
                  filter: 'drop-shadow(0 25px 35px rgba(22,163,74,0.3)) drop-shadow(0 10px 15px rgba(0,0,0,0.1))',
                  transform: 'translateZ(30px)',
                  transition: 'transform 0.5s ease',
                }}
              />
              <div style={{
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
                border: '2px solid #bbf7d0', borderRadius: 999,
                padding: '8px 20px', marginTop: -15, zIndex: 10,
                boxShadow: '0 8px 25px rgba(22,163,74,0.2)',
                transform: 'translateZ(40px)'
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, color: 'var(--color-green-dark)' }}>
                  🌹 Dutch Hybrid Rose in Ceramic 3D Pot
                </span>
              </div>
            </div>

            {/* 3D Floating price badge */}
            <div className="animate-float" style={{
              position: 'absolute', top: 20, right: 0, zIndex: 12,
              background: 'white', borderRadius: 20, padding: '14px 20px',
              boxShadow: '0 12px 35px rgba(244,63,94,0.25)', border: '2.5px solid #fecdd3',
              textAlign: 'center', minWidth: 110,
              transform: 'perspective(800px) rotateY(-12deg) rotateX(8deg) translateZ(50px)',
            }}>
              <div style={{ fontSize: 10, color: 'var(--color-rose)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Starting at</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--text-dark)' }}>₹99</div>
            </div>

            {/* 3D Floating review badge */}
            <div className="animate-float" style={{
              position: 'absolute', bottom: 20, right: 0, zIndex: 12,
              animationDelay: '1.5s',
              background: 'white', borderRadius: 20, padding: '12px 18px',
              boxShadow: '0 12px 35px rgba(22,163,74,0.25)', border: '2.5px solid #bbf7d0',
              display: 'flex', alignItems: 'center', gap: 10,
              transform: 'perspective(800px) rotateY(10deg) rotateX(-5deg) translateZ(50px)',
            }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1,2,3,4,5].map(i => <Star key={i} style={{ width: 13, height: 13, color: '#f59e0b', fill: '#f59e0b' }} />)}
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-dark)' }}>10K+ Happy Customers</span>
            </div>
          </div>


          <style>{`@media (min-width: 900px) { .hero-right-show { display: block !important; } }`}</style>
        </div>

        {/* Hero bottom curved edge */}
        <div style={{ height: 40, background: 'var(--bg-page)', borderRadius: '50% 50% 0 0 / 100% 100% 0 0', marginTop: -20 }} />
      </section>

      {/* ===== TRUST STRIP ===== */}
      <section className="section-container" style={{ padding: '0 24px', marginTop: -20 }}>
        <div className="hp-trust-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14,
          background: 'white', borderRadius: 20, padding: '20px 24px',
          boxShadow: '0 4px 24px rgba(22,163,74,0.1)', border: '1.5px solid #e5f0e0',
        }}>
          {TRUST_ITEMS.map(({ icon: Icon, label, sub, color, bg, border }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, border: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 20, height: 20, color }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dark)' }}>{label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== BEST SELLERS (DESKTOP) ===== */}
      {bestSellers.length > 0 && (
        <section className="section-container hidden sm:block" style={{ padding: '64px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
            <div>
              <span className="section-label">★ Top Rated</span>
              <div className="divider-green" />
              <h2 className="section-title" style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', marginTop: 4 }}>
                Best <em>Sellers</em>
              </h2>
            </div>
            <button className="btn-outline-green" style={{ fontSize: 12, padding: '9px 18px' }} onClick={() => onNavigate('shop')}>
              Explore All <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <div className="hp-product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {bestSellers.map(p => <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onViewDetails={onViewDetails} onOpenCareGuide={onOpenCareGuide} />)}
          </div>
        </section>
      )}

      {/* ===== FEATURED PRODUCTS (DESKTOP) ===== */}
      <section className="section-container hidden sm:block" style={{ padding: '64px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <span className="section-label">Handpicked Selection</span>
            <div className="divider-green" />
            <h2 className="section-title" style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', marginTop: 4 }}>
              Featured <em>Varieties</em>
            </h2>
          </div>
          <button className="btn-outline-green" style={{ fontSize: 12, padding: '9px 18px' }} onClick={() => onNavigate('shop')}>
            Explore All <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div className="hp-product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {(featuredProducts.length > 0 ? featuredProducts : products).slice(0, 8).map(p => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onViewDetails={onViewDetails} onOpenCareGuide={onOpenCareGuide} />
          ))}
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      {activeCategories.length > 0 && (
        <section className="section-container" style={{ padding: '64px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
            <div>
              <span className="section-label">Browse by Type</span>
              <div className="divider-green" />
              <h2 className="section-title" style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', marginTop: 4 }}>
                Plant <em>Categories</em>
              </h2>
            </div>
            <button className="btn-outline-green" style={{ fontSize: 12, padding: '9px 18px' }} onClick={() => onNavigate('shop')}>
              View All <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
          {displayCategories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', border: '2px dashed #bbf7d0', borderRadius: 20 }}>
              <Leaf style={{ width: 40, height: 40, color: 'var(--color-green)', margin: '0 auto 14px', opacity: 0.5 }} />
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-dark)', marginBottom: 8 }}>No Categories Yet</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Add plant categories in the Admin Panel.</p>
              <button className="btn-green" style={{ fontSize: 11 }} onClick={() => onNavigate('admin')}>Open Admin Panel</button>
            </div>
          ) : (
            <div className="hp-cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {displayCategories.map(cat => {
                const catProducts = getCategoryProducts(cat);
                const plantCount = cat.productCount ?? (catProducts.length > 0 ? catProducts.length : 3);

                const discounts = catProducts
                  .map(p => {
                    if (p.discount && p.discount > 0) return p.discount;
                    if (p.mrp && p.sellingPrice && p.mrp > p.sellingPrice) return Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100);
                    return 0;
                  })
                  .filter(d => d > 0);

                const cSlug = (cat.slug || '').toLowerCase();
                const cName = (cat.name || '').toLowerCase();

                let maxDis = 20;
                if (discounts.length > 0) {
                  maxDis = Math.max(...discounts);
                } else if (cSlug.includes('jasmine') || cName.includes('jasmine')) {
                  maxDis = 40;
                } else if (cSlug.includes('herbal') || cName.includes('herbal')) {
                  maxDis = 40;
                } else if (cSlug.includes('rare') || cName.includes('rare')) {
                  maxDis = 30;
                } else if (cSlug.includes('creeper') || cName.includes('creeper')) {
                  maxDis = 10;
                } else if (cSlug.includes('miniature') || cName.includes('miniature')) {
                  maxDis = 15;
                } else if (cSlug.includes('rose') || cName.includes('rose')) {
                  maxDis = 20;
                }

                const catPhoto = (cat.image && !cat.image.includes('photo-1518709268805-4e9042af9f23')) 
                  ? cat.image 
                  : (catProducts.find(p => p.images?.[0] && !p.images[0].includes('photo-1518709268805-4e9042af9f23'))?.images?.[0] || cat.image || '/products/double-delight.jpeg');

                return (
                  <div key={cat.id} className="card-white group" style={{ overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => { onSelectCategory(cat.id); onNavigate('shop'); }}>
                    <div style={{ height: 130, overflow: 'hidden', position: 'relative' }}>
                      <img src={catPhoto} alt={cat.name} loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} className="group-hover-scale"
                        onError={e => { (e.target as HTMLImageElement).src = '/products/double-delight.jpeg'; }} />
                      
                      {cat.isFeatured && <span className="badge-amber" style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, zIndex: 10 }}>★ Featured</span>}
                      
                      <span style={{
                        position: 'absolute', top: 8, right: 8, zIndex: 10, fontSize: 9, fontWeight: 800,
                        background: 'linear-gradient(135deg, #e11d48, #be123c)', color: 'white',
                        padding: '3px 8px', borderRadius: 999, boxShadow: '0 2px 8px rgba(225,29,72,0.4)',
                        letterSpacing: '0.02em', textTransform: 'uppercase'
                      }}>
                        Up to {maxDis}% OFF
                      </span>
                    </div>
                    <div style={{ padding: '12px 14px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>{cat.name}</h3>
                        <span style={{ fontSize: 9, color: 'var(--color-green)', fontWeight: 700 }}>{plantCount} plants</span>
                      </div>
                      <p style={{ fontFamily: 'var(--font-tamil)', fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px' }}>{cat.tamilName}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-green-dark)', fontSize: 11, fontWeight: 700 }}>
                          Shop now <ArrowRight style={{ width: 11, height: 11 }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#e11d48', background: '#fff1f2', padding: '2px 6px', borderRadius: 6, border: '1px solid #fecdd3' }}>
                          {maxDis}% OFF
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ===== TESTIMONIALS ===== */}
      <section className="section-container" style={{ padding: '72px 24px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span className="section-label">Customer Love</span>
          <div className="divider-green" style={{ margin: '12px auto' }} />
          <h2 className="section-title" style={{ fontSize: 'clamp(22px, 3.5vw, 36px)' }}>What <em>Customers Say</em></h2>
        </div>
        <div className="hp-testimonial-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background: 'white', border: '1.5px solid #e5f0e0', borderRadius: 18, padding: 24, boxShadow: '0 2px 16px rgba(22,163,74,0.06)', transition: 'all 0.3s ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(22,163,74,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = '#86efac'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(22,163,74,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = '#e5f0e0'; }}
            >
              <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                {Array.from({ length: t.rating }).map((_, j) => <Star key={j} style={{ width: 15, height: 15, color: '#f59e0b', fill: '#f59e0b' }} />)}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.75, marginBottom: 18, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 15 }}>
                  {t.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== NURSERY CTA ===== */}
      <section className="section-container" style={{ padding: '72px 24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)', borderRadius: 24, overflow: 'hidden', position: 'relative' }}>
          {/* Decorative */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, left: 100, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: 'clamp(32px, 5vw, 56px)', gap: 32, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#bbf7d0', textTransform: 'uppercase' }}>Visit Our Farm</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3.5vw, 38px)', color: 'white', margin: '8px 0 12px' }}>
                Come Visit <em style={{ color: '#fde68a', fontStyle: 'italic' }}>Veerika Rose Garden</em>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {[
                  { Icon: MapPin, text: 'Pennagaram, Tamil Nadu' },
                  { Icon: Phone, text: '+91 72008 26129', href: 'tel:+917200826129' },
                  { Icon: MessageSquare, text: 'WhatsApp Us', href: 'https://wa.me/919361540714' },
                ].map(({ Icon, text, href }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon style={{ width: 15, height: 15, color: '#86efac', flexShrink: 0 }} />
                    {href ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>{text}</a>
                      : <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{text}</span>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn-white" style={{ fontSize: 12, padding: '10px 20px' }} onClick={() => onNavigate('shop')}>
                  <Package style={{ width: 14, height: 14 }} /> Shop Plants
                </button>
                {onOpenExpertAdvice && (
                  <button onClick={onOpenExpertAdvice} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                    <Sparkles style={{ width: 14, height: 14 }} /> Expert AI Chat
                  </button>
                )}
              </div>
            </div>
            <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: 12 }} className="cta-right-show">
              <img src="/logo.webp" alt="Veerika" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.3)', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }} className="animate-float" />
              <span style={{ color: '#bbf7d0', fontSize: 12, fontFamily: 'var(--font-tamil)', textAlign: 'center' }}>வீரிகா ரோஜா கார்டன்</span>
            </div>
          </div>
          <style>{`@media (min-width: 640px) { .cta-right-show { display: flex !important; } }`}</style>

          {/* ===== GLOBAL MOBILE RESPONSIVE STYLES FOR HOMEPAGE ===== */}
          <style>{`
            /* Mobile: ≤ 640px */
            @media (max-width: 640px) {
              .hp-trust-grid {
                grid-template-columns: 1fr 1fr !important;
                gap: 10px !important;
                padding: 14px !important;
              }
              .hp-cat-grid {
                grid-template-columns: 1fr 1fr !important;
                gap: 10px !important;
              }
              .hp-product-grid {
                grid-template-columns: 1fr 1fr !important;
                gap: 10px !important;
              }
              .hp-why-grid {
                grid-template-columns: 1fr 1fr !important;
                gap: 12px !important;
              }
              .hp-testimonial-grid {
                grid-template-columns: 1fr !important;
                gap: 14px !important;
              }
              .hero-grid {
                grid-template-columns: 1fr !important;
                min-height: auto !important;
                padding: 20px 0 !important;
              }
              .hero-left {
                padding: 40px 0 20px !important;
                align-items: center !important;
                text-align: center !important;
              }
            }
            /* Tablet: 641px – 900px */
            @media (min-width: 641px) and (max-width: 900px) {
              .hp-product-grid {
                grid-template-columns: repeat(3, 1fr) !important;
              }
              .hp-cat-grid {
                grid-template-columns: repeat(3, 1fr) !important;
              }
              .hp-why-grid {
                grid-template-columns: repeat(2, 1fr) !important;
              }
              .hp-testimonial-grid {
                grid-template-columns: repeat(2, 1fr) !important;
              }
            }
          `}</style>
        </div>
      </section>

      {/* 3D Lightbox Modal for Full Resolution Photo View */}
      {selectedReviewPhoto && (
        <div
          onClick={() => setSelectedReviewPhoto(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 28, maxWidth: 640, width: '100%',
              overflow: 'hidden', border: '2px solid #bbf7d0',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              maxHeight: '90vh', display: 'flex', flexDirection: 'column'
            }}
          >
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5f0e0', background: '#f8faf6' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: '#1a2e1a', margin: 0 }}>
                  📸 Customer Garden Photo
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                  Uploaded by {selectedReviewPhoto.userName} ({selectedReviewPhoto.location || 'Tamil Nadu'})
                </p>
              </div>
              <button
                onClick={() => setSelectedReviewPhoto(null)}
                style={{ background: '#e2e8f0', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X style={{ width: 16, height: 16, color: '#334155' }} />
              </button>
            </div>

            <div style={{
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              maxHeight: '65vh',
              overflow: 'hidden',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <img
                src={selectedReviewPhoto.imageUrl}
                alt={selectedReviewPhoto.userName}
                style={{
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  objectFit: 'contain',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                }}
              />
            </div>

            <div style={{ padding: 20, overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} style={{ width: 16, height: 16, color: i < selectedReviewPhoto.rating ? '#f59e0b' : '#d1d5db', fill: i < selectedReviewPhoto.rating ? '#f59e0b' : 'none' }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '3px 10px', borderRadius: 999, border: '1px solid #bbf7d0' }}>
                  ✓ Verified Buyer
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#15803d', marginBottom: 6 }}>
                🌱 Plant: {selectedReviewPhoto.productName || 'Nursery Plant'}
              </div>
              {selectedReviewPhoto.title && (
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: '#1a2e1a' }}>
                  "{selectedReviewPhoto.title}"
                </h4>
              )}
              <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>
                "{selectedReviewPhoto.comment}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
