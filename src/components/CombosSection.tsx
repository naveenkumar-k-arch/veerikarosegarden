import React, { useState, useEffect } from 'react';
import { Combo, Product } from '../types';
import { ShoppingBag, Sparkles, CheckCircle2, Tag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getCachedActiveCombos, VINAYAGAR_10_FRUIT_PLANTS, resolveComboImage } from '../utils/comboUtils';

interface CombosSectionProps {
  onAddToCart: (product: Product, quantity?: number, meta?: any) => void;
  onSelectProduct?: (product: Product) => void;
  onViewAllCombos?: () => void;
}

const getAggregatedProducts = (productsList?: Product[]) => {
  if (!productsList || productsList.length === 0) return [];
  const map = new Map<string, { product: Product; count: number }>();
  productsList.forEach(p => {
    if (!p || !p.id) return;
    const existing = map.get(p.id);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(p.id, { product: p, count: 1 });
    }
  });
  return Array.from(map.values());
};

export const CombosSection: React.FC<CombosSectionProps> = ({ onAddToCart, onSelectProduct, onViewAllCombos }) => {
  const { language, t } = useLanguage();
  const isTa = language === 'ta';
  const [combos, setCombos] = useState<Combo[]>(getCachedActiveCombos);
  const [loading, setLoading] = useState(() => combos.length === 0);
  const [addedComboId, setAddedComboId] = useState<string | null>(null);
  const [modalCombo, setModalCombo] = useState<Combo | null>(null);

  useEffect(() => {
    fetchCombos();

    const handleCombosUpdated = () => fetchCombos();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchCombos();
    };

    window.addEventListener('vrg_combos_updated', handleCombosUpdated);
    window.addEventListener('storage', handleCombosUpdated);
    window.addEventListener('focus', handleCombosUpdated);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('vrg_combos_updated', handleCombosUpdated);
      window.removeEventListener('storage', handleCombosUpdated);
      window.removeEventListener('focus', handleCombosUpdated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchCombos = async () => {
    try {
      const cRes = await fetch(`/api/combos?_t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).catch(() => null);

      if (cRes && cRes.success && Array.isArray(cRes.combos)) {
        const deletedSet = new Set(JSON.parse(localStorage.getItem('vrg_deleted_combos') || '[]'));
        const dummyIds = new Set([
          'combo-1787635336437',
          'combo-1787321846424',
          'combo-1787577752349',
          'combo-1786876625168',
          'combo-1786878791522',
          'combo-1786873534914',
          'combo-1786968264680',
          'combo-1787127554276'
        ]);
        const activeCombos = cRes.combos
          .filter((c: Combo) => {
            if (!c || !c.id || c.active === false || deletedSet.has(c.id)) return false;
            if (dummyIds.has(c.id)) return false;
            if (!c.title || c.title.trim() === '') return false;
            return true;
          })
          .map((c: Combo) => {
            const resolvedImg = resolveComboImage(c);
            const isVinayagar = c.id === 'combo-vinayagar-chaturthi-10-fruit-plants' ||
              (c.id && c.id.toLowerCase().includes('vinayagar')) ||
              (c.title && (c.title.includes('à®µà®¿à®¨à®¾à®¯à®•à®°à¯') || c.title.toLowerCase().includes('10 fruit')));
            if (isVinayagar) {
              const currentProds = (c.products && c.products.length >= 10) ? c.products : VINAYAGAR_10_FRUIT_PLANTS;
              return {
                ...c,
                imageUrl: resolvedImg,
                order: c.order !== undefined ? Number(c.order) : 4,
                active: true,
                badge: '10 FRUITS COMBO',
                freeDelivery: true,
                freePacking: true,
                onlyMetturService: true,
                productIds: currentProds.map(p => p.id),
                products: currentProds
              };
            }
            return {
              ...c,
              imageUrl: resolvedImg
            };
          })
          .sort((a: Combo, b: Combo) => {
            const ordA = Number(a.order ?? 99);
            const ordB = Number(b.order ?? 99);
            if (ordA !== ordB) return ordA - ordB;
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
        setCombos(activeCombos);
        try {
          localStorage.setItem('vrg_combos_cache_v2', JSON.stringify(activeCombos));
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load combos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComboToCart = (combo: Combo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const comboProducts = combo.products || [];
    const firstImg = combo.imageUrl || comboProducts[0]?.images?.[0] || comboProducts[0]?.image || comboProducts[0]?.imageUrl || '/products/vrg/combo-mini-beetroot-guva.jpg';

    // Create a virtual Product representation for the Combo bundle
    const comboCartProduct: Product = {
      id: combo.id,
      sku: 'CMB-' + (combo.id.startsWith('combo-') ? combo.id.replace('combo-', '') : combo.id).slice(-6),
      name: combo.title,
      englishName: combo.title,
      tamilName: combo.subtitle || 'à®šà®¿à®±à®ªà¯à®ªà¯ à®šà¯‡à®°à¯à®•à¯à®•à¯ˆ à®¤à¯Šà®•à¯à®ªà¯à®ªà¯',
      scientificName: '',
      categoryId: 'combos',
      categoryName: 'Combos & Offers',
      description: combo.subtitle || `Special Combo Pack with ${comboProducts.length || combo.productIds?.length || 0} plants`,
      mrp: Number(combo.originalPrice || combo.comboPrice),
      sellingPrice: Number(combo.comboPrice),
      discount: combo.discountPercent || (combo.originalPrice > combo.comboPrice ? Math.round(((combo.originalPrice - combo.comboPrice) / combo.originalPrice) * 100) : 0),
      stock: 99,
      plantHeight: 'Combo Bundle',
      potSize: `${comboProducts.length || combo.productIds?.length || 3} Plants`,
      sunlight: 'Full Sun',
      waterRequirement: 'Daily',
      floweringSeason: 'All Year',
      careInstructions: {
        watering: 'Water daily in the morning.',
        sunlight: 'Direct sunlight.',
        fertilizer: 'Organic compost every 15 days.',
        soil: 'Red soil with vermicompost.'
      },
      images: [firstImg],
      featured: true,
      bestSeller: true,
      trending: true,
      tags: ['combo', 'offer', 'bundle', ...(combo.freeDelivery ? ['free-delivery'] : [])],
      rating: 4.9,
      reviewCount: 28,
      createdAt: combo.createdAt || new Date().toISOString(),
      updatedAt: combo.updatedAt || new Date().toISOString(),
      status: 'ACTIVE'
    };

    onAddToCart(comboCartProduct, 1, {
      isCombo: true,
      comboId: combo.id,
      comboTitle: combo.title,
      comboBadge: combo.badge || 'COMBO OFFER',
      freeDelivery: combo.freeDelivery === true,
      freePacking: (combo as any).freePacking === true,
      onlyMetturService: (combo as any).onlyMetturService === true,
      comboProducts
    });

    setAddedComboId(combo.id);
    setTimeout(() => setAddedComboId(null), 2500);
  };

  if (combos.length === 0) {
    return null;
  }

  return (
    <section className="py-10 bg-gradient-to-b from-amber-50/60 via-emerald-50/40 to-slate-50 border-y border-amber-200/50 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-300/50 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>{isTa ? 'à®•à®¾à®®à¯à®ªà¯‹ à®šà®²à¯à®•à¯ˆà®•à®³à¯' : 'Combos & Offers'}</span>
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                {isTa ? 'à®•à¯‚à®Ÿà¯à®¤à®²à¯ à®šà¯‡à®®à®¿à®ªà¯à®ªà¯' : 'EXTRA SAVINGS'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isTa ? 'ðŸ”¥ à®šà®¿à®±à®ªà¯à®ªà¯ à®šà¯†à®Ÿà®¿ à®•à®¾à®®à¯à®ªà¯‹ à®šà®²à¯à®•à¯ˆà®•à®³à¯' : 'ðŸ”¥ Special Plant Combo Offers'}
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl font-medium">
              {isTa
                ? 'à®µà¯€à®°à®¿à®•à®¾ à®°à¯‹à®œà®¾ à®•à®¾à®°à¯à®Ÿà®©à¯ à®ªà®£à¯à®£à¯ˆà®¯à®¿à®²à®¿à®°à¯à®¨à¯à®¤à¯ à®¨à¯‡à®°à®Ÿà®¿à®¯à®¾à®• à®ªà®¿à®°à®¤à¯à®¯à¯‡à®• à®•à®¾à®®à¯à®ªà¯‹ à®¤à®³à¯à®³à¯à®ªà®Ÿà®¿ & à®ªà®£à¯à®£à¯ˆ à®Ÿà¯†à®²à®¿à®µà®°à®¿à®¯à¯à®Ÿà®©à¯ à®•à¯‚à®Ÿà®¿à®¯ à®šà¯†à®Ÿà®¿à®•à®³à¯ à®¤à¯Šà®•à¯à®ªà¯à®ªà¯.'
                : 'Hand-picked plant bundles directly from Veerika Rose Garden with exclusive combo discounts & free doorstep farm delivery.'}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap self-start md:self-auto">
            <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold text-slate-600 bg-white/80 backdrop-blur-md px-3 sm:px-4 py-2 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="flex items-center gap-1 text-emerald-700">
                <ShieldCheck className="w-4 h-4" /> {isTa ? 'à®†à®°à¯‹à®•à¯à®•à®¿à®¯à®®à®¾à®© à®’à®Ÿà¯à®Ÿà¯à®šà¯à®šà¯†à®Ÿà®¿à®•à®³à¯' : 'Healthy Grafted Saplings'}
              </span>
              <span className="text-slate-300">â€¢</span>
              <span className="flex items-center gap-1 text-amber-700">
                <Truck className="w-4 h-4" /> {isTa ? 'à®ˆà®°à®ªà¯à®ªà®¤à®®à¯ à®•à¯à®±à¯ˆà®¯à®¾à®¤ à®ªà¯‡à®•à¯à®•à®¿à®™à¯' : 'Express Moisture Packed'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onViewAllCombos) onViewAllCombos();
                else window.location.hash = '#/shop';
              }}
              className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-black text-xs rounded-2xl flex items-center gap-1.5 shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <span>{isTa ? 'à®…à®©à¯ˆà®¤à¯à®¤à¯ à®•à®¾à®®à¯à®ªà¯‹à®•à¯à®•à®³à¯ˆà®¯à¯à®®à¯ à®ªà®¾à®°à¯à®•à¯à®•' : 'View All Combos'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Combos Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-4 shadow-sm">
                <div className="h-48 bg-slate-100 rounded-2xl" />
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-10 bg-slate-200 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {combos.map((rawCombo) => {
              const isVinayagar = rawCombo.id === 'combo-vinayagar-chaturthi-10-fruit-plants' ||
                (rawCombo.id && rawCombo.id.toLowerCase().includes('vinayagar')) ||
                (rawCombo.title && (rawCombo.title.includes('à®µà®¿à®¨à®¾à®¯à®•à®°à¯') || rawCombo.title.toLowerCase().includes('10 fruit')));
              const currentProds = isVinayagar
                ? ((rawCombo.products && rawCombo.products.length >= 10) ? rawCombo.products : VINAYAGAR_10_FRUIT_PLANTS)
                : rawCombo.products;
              const combo = isVinayagar
                ? {
                    ...rawCombo,
                    badge: '10 FRUITS COMBO',
                    productIds: currentProds.map(p => p.id),
                    products: currentProds
                  }
                : rawCombo;

              const discount = combo.discountPercent || (combo.originalPrice > 0 ? Math.round(((combo.originalPrice - combo.comboPrice) / combo.originalPrice) * 100) : 0);
              const savings = combo.originalPrice > combo.comboPrice ? combo.originalPrice - combo.comboPrice : 0;
              const isJustAdded = addedComboId === combo.id;
              const aggregated = getAggregatedProducts(combo.products);

              const badgeText = isTa
                ? (combo.badge?.includes('1-IN-1') ? '1-à®²à¯-1 à®šà®¿à®±à®ªà¯à®ªà¯ à®šà®²à¯à®•à¯ˆ'
                  : combo.badge?.includes('2-IN-1') ? '2-à®²à¯-1 à®šà®¿à®±à®ªà¯à®ªà¯ à®šà®²à¯à®•à¯ˆ'
                  : combo.badge?.includes('3-IN-1') ? '3-à®²à¯-1 à®šà®¿à®±à®ªà¯à®ªà¯ à®šà®²à¯à®•à¯ˆ'
                  : 'à®šà®¿à®±à®ªà¯à®ªà¯ à®•à®¾à®®à¯à®ªà¯‹')
                : (combo.badge || 'COMBO OFFER');

              return (
                <div
                  key={combo.id}
                  onClick={() => setModalCombo(combo)}
                  className="group bg-white/95 backdrop-blur-md border border-amber-200/80 hover:border-amber-400 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative transform hover:-translate-y-1 cursor-pointer"
                >
                  {/* Top Discount & Delivery Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between gap-1.5 pointer-events-none">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md uppercase tracking-wide flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {badgeText}
                      </span>
                      {combo.freeDelivery && (
                        <span className="bg-emerald-600 text-white font-black text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md flex items-center gap-1">
                          <Truck className="w-3 h-3" /> {isTa ? 'à®‡à®²à®µà®š à®Ÿà¯†à®²à®¿à®µà®°à®¿' : 'FREE SHIPPING'}
                        </span>
                      )}
                    </div>
                    {discount > 0 && (
                      <span className="bg-emerald-800 text-white font-black text-[10px] sm:text-[11px] px-2 py-0.5 sm:py-1 rounded-full shadow-md shrink-0">
                        {discount}% {isTa ? 'à®¤à®³à¯à®³à¯à®ªà®Ÿà®¿' : 'OFF'}
                      </span>
                    )}
                  </div>

                  <div>
                    {/* Header Image Collage */}
                    <div className="relative aspect-[16/10] sm:h-56 bg-slate-900 overflow-hidden">
                      <img
                        src={(() => {
                          const raw = resolveComboImage(combo);
                          // Prefer .webp for faster load; all combo images have a .webp version
                          if (raw && (raw.startsWith('/products/') || raw.startsWith('/categories/'))) {
                            return raw.replace(/\.(png|jpg|jpeg)$/i, '.webp');
                          }
                          return raw;
                        })()}
                        alt={combo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.currentTarget;
                          // Use data-errored to track fallback steps and prevent infinite loops
                          const step = parseInt(target.getAttribute('data-errored') || '0', 10);
                          target.setAttribute('data-errored', String(step + 1));
                          if (step === 0) {
                            // Step 1: webp failed → try original format (.jpg or .png)
                            const resolvedRaw = resolveComboImage(combo);
                            // Try .jpg if original is .webp, otherwise try .png
                            if (resolvedRaw && resolvedRaw.endsWith('.webp')) {
                              target.src = resolvedRaw.replace(/\.webp$/, '.jpg');
                            } else {
                              target.src = resolvedRaw || '/products/vrg/combo-mini-beetroot-guva.webp';
                            }
                          } else if (step === 1) {
                            // Step 2: original format failed → try first product image
                            const prodImg = combo.products?.[0]?.images?.[0] || (combo.products?.[0] as any)?.image || (combo.products?.[0] as any)?.imageUrl;
                            target.src = prodImg || '/products/vrg/combo-mini-beetroot-guva.webp';
                          } else {
                            // Step 3: give up — show reliable known-good fallback
                            target.onerror = null;
                            target.src = '/products/vrg/combo-mini-beetroot-guva.webp';
                          }
                        }}
                      />
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-4">
                      {/* Title & Subtitle */}
                      <div className="space-y-1">
                        <h3 className="font-black text-base sm:text-lg text-slate-900 leading-snug line-clamp-2 group-hover:text-emerald-800 transition-colors">
                          {isTa ? t(combo.title) : combo.title}
                        </h3>
                        {combo.subtitle && (
                          <p className="text-[11px] sm:text-xs font-semibold text-amber-900/80 line-clamp-2">
                            {isTa ? t(combo.subtitle) : combo.subtitle}
                          </p>
                        )}
                      </div>
                        {aggregated.length > 0 && (
                          <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 space-y-1.5 sm:space-y-2">
                            <p className="text-[10px] sm:text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center justify-between gap-1.5">
                              <span>ðŸŒ¿ {isTa ? `à®šà¯‡à®°à¯à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿ à®ªà®£à¯à®£à¯ˆ à®šà¯†à®Ÿà®¿à®•à®³à¯ (${isVinayagar ? 10 : (combo.products?.length || combo.productIds?.length || 0)}):` : `Includes ${isVinayagar ? 10 : (combo.products?.length || combo.productIds?.length || 0)} Farm Plants:`}</span>
                            </p>
                            <div className="space-y-1">
                              {aggregated.map(({ product: p, count }) => (
                                <div
                                  key={p.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onSelectProduct) onSelectProduct(p);
                                  }}
                                  className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-slate-800 hover:text-emerald-800 cursor-pointer group/item py-0.5"
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    {count > 1 ? (
                                      <span className="bg-gradient-to-r from-emerald-700 to-amber-700 text-white font-black text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded shadow-2xs shrink-0 font-mono">
                                        {count}Ã—
                                      </span>
                                    ) : (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 group-hover/item:scale-125 transition-transform shrink-0" />
                                    )}
                                    <span className="truncate">{isTa ? (p.tamilName && p.tamilName !== p.name ? p.tamilName : t(p.name)) : p.name}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Pricing Block */}
                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl sm:text-3xl font-black text-slate-900">
                              â‚¹{combo.comboPrice}
                            </span>
                            {combo.originalPrice > combo.comboPrice && (
                              <span className="text-xs sm:text-sm font-bold text-slate-400 line-through">
                                â‚¹{combo.originalPrice}
                              </span>
                            )}
                          </div>
                          {savings > 0 && (
                            <p className="text-[11px] sm:text-xs font-extrabold text-emerald-700 mt-0.5">
                              ðŸŽ‰ {isTa ? `à®°à¯‚. ${savings} à®šà¯‡à®®à®¿à®ªà¯à®ªà¯ (${discount}% à®¤à®³à¯à®³à¯à®ªà®Ÿà®¿)` : `Save â‚¹${savings} (${discount}% OFF)`}
                            </p>
                          )}
                        </div>
                        {(combo as any).onlyMetturService ? (
                          <div className="flex flex-col gap-1 items-end">
                            <span className="bg-amber-100 text-amber-950 font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md border border-amber-300">
                              ðŸ“¦ {isTa ? 'à®®à¯‡à®Ÿà¯à®Ÿà¯‚à®°à¯ à®ªà®¾à®°à¯à®šà®²à¯ à®®à®Ÿà¯à®Ÿà¯à®®à¯‡' : 'Only Mettur Parcel'}
                            </span>
                            <span className="bg-emerald-100 text-emerald-900 font-extrabold text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md border border-emerald-300">
                              ðŸšš {isTa ? 'à®‡à®²à®µà®š à®Ÿà¯†à®²à®¿à®µà®°à®¿ & à®ªà¯‡à®•à¯à®•à®¿à®™à¯' : 'Free Delivery & Packing'}
                            </span>
                          </div>
                        ) : combo.freeDelivery ? (
                          <span className="bg-emerald-100 text-emerald-900 font-extrabold text-[10px] sm:text-[11px] px-2 py-0.5 rounded-lg border border-emerald-300">
                            ðŸšš {isTa ? 'à®‡à®²à®µà®š à®Ÿà¯†à®²à®¿à®µà®°à®¿ (TN)' : 'Free Delivery (TN)'}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Add Bundle to Cart CTA Button */}
                  <div className="p-3.5 sm:p-5 pt-0">
                    <button
                      onClick={(e) => handleAddComboToCart(combo, e)}
                      disabled={isJustAdded}
                      className={`w-full py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-md active:scale-95 ${
                        isJustAdded
                          ? 'bg-emerald-700 text-white'
                          : 'bg-gradient-to-r from-emerald-700 via-emerald-800 to-amber-700 hover:from-emerald-800 hover:to-amber-800 text-white shadow-emerald-950/10 hover:shadow-lg'
                      }`}
                    >
                      {isJustAdded ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce" />
                          <span>{isTa ? 'à®•à¯‚à®Ÿà¯ˆà®¯à®¿à®²à¯ à®šà¯‡à®°à¯à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯!' : 'Added to Cart!'}</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span className="sm:hidden">{isTa ? `à®•à¯‚à®Ÿà¯ˆà®¯à®¿à®²à¯ à®šà¯‡à®°à¯à®•à¯à®• â€¢ â‚¹${combo.comboPrice}` : `Add Bundle â€¢ â‚¹${combo.comboPrice}`}</span>
                          <span className="hidden sm:inline">{isTa ? `à®•à®¾à®®à¯à®ªà¯‹ à®¤à¯Šà®•à¯à®ªà¯à®ªà¯ˆ à®•à¯‚à®Ÿà¯ˆà®¯à®¿à®²à¯ à®šà¯‡à®°à¯à®•à¯à®•à®µà¯à®®à¯ (â‚¹${combo.comboPrice})` : `Add Combo Package to Cart (â‚¹${combo.comboPrice})`}</span>
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== COMBO PACKAGE DETAILS MODAL ===== */}
      {modalCombo && (() => {
        const isVinayagar = modalCombo.id === 'combo-vinayagar-chaturthi-10-fruit-plants' ||
          (modalCombo.id && modalCombo.id.toLowerCase().includes('vinayagar')) ||
          (modalCombo.title && (modalCombo.title.includes('à®µà®¿à®¨à®¾à®¯à®•à®°à¯') || modalCombo.title.toLowerCase().includes('10 fruit')));
        const currentProds = isVinayagar
          ? ((modalCombo.products && modalCombo.products.length >= 10) ? modalCombo.products : VINAYAGAR_10_FRUIT_PLANTS)
          : modalCombo.products;
        const activeModalCombo = isVinayagar
          ? {
              ...modalCombo,
              badge: '10 FRUITS COMBO',
              productIds: currentProds.map(p => p.id),
              products: currentProds
            }
          : modalCombo;

        const discount = activeModalCombo.discountPercent || (activeModalCombo.originalPrice > 0 ? Math.round(((activeModalCombo.originalPrice - activeModalCombo.comboPrice) / activeModalCombo.originalPrice) * 100) : 0);
        const savings = activeModalCombo.originalPrice > activeModalCombo.comboPrice ? activeModalCombo.originalPrice - activeModalCombo.comboPrice : 0;
        const isJustAdded = addedComboId === activeModalCombo.id;
        const modalBadgeText = isTa
          ? (activeModalCombo.badge?.includes('1-IN-1') ? '1-à®²à¯-1 à®šà®¿à®±à®ªà¯à®ªà¯ à®šà®²à¯à®•à¯ˆ'
            : activeModalCombo.badge?.includes('2-IN-1') ? '2-à®²à¯-1 à®šà®¿à®±à®ªà¯à®ªà¯ à®šà®²à¯à®•à¯ˆ'
            : activeModalCombo.badge?.includes('3-IN-1') ? '3-à®²à¯-1 à®šà®¿à®±à®ªà¯à®ªà¯ à®šà®²à¯à®•à¯ˆ'
            : 'à®šà®¿à®±à®ªà¯à®ªà¯ à®•à®¾à®®à¯à®ªà¯‹')
          : (activeModalCombo.badge || 'COMBO OFFER');

        return (
          <div
            onClick={() => setModalCombo(null)}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <div
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden border-2 border-emerald-300 shadow-2xl space-y-0 my-8 relative max-h-[90vh] flex flex-col"
            >
              {/* Cover Image & Close */}
              <div className="relative aspect-[16/10] sm:h-72 bg-slate-900 shrink-0 overflow-hidden">
                <img
                  src={(() => {
                    const raw = resolveComboImage(modalCombo);
                    if (raw && (raw.startsWith('/products/') || raw.startsWith('/categories/'))) {
                      return raw.replace(/\.(png|jpg|jpeg)$/i, '.webp');
                    }
                    return raw;
                  })()}
                  alt={modalCombo.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const step = parseInt(target.getAttribute('data-errored') || '0', 10);
                    target.setAttribute('data-errored', String(step + 1));
                    if (step === 0) {
                      // Step 1: webp failed → try original format (.jpg or .png)
                      const resolvedRaw = resolveComboImage(modalCombo);
                      if (resolvedRaw && resolvedRaw.endsWith('.webp')) {
                        target.src = resolvedRaw.replace(/\.webp$/, '.jpg');
                      } else {
                        target.src = resolvedRaw || '/products/vrg/combo-mini-beetroot-guva.webp';
                      }
                    } else if (step === 1) {
                      const prodImg = modalCombo.products?.[0]?.images?.[0] || (modalCombo.products?.[0] as any)?.image || (modalCombo.products?.[0] as any)?.imageUrl;
                      target.src = prodImg || '/products/vrg/combo-mini-beetroot-guva.webp';
                    } else {
                      target.onerror = null;
                      target.src = '/products/vrg/combo-mini-beetroot-guva.webp';
                    }
                  }}
                />

                <button
                  onClick={() => setModalCombo(null)}
                  className="absolute top-3 right-3 bg-slate-950/70 hover:bg-slate-950 text-white rounded-full p-2 backdrop-blur-md cursor-pointer transition-transform hover:scale-110 z-20 shadow-lg"
                >
                  <span className="font-bold text-base leading-none">âœ•</span>
                </button>
              </div>

              {/* Modal Header */}
              <div className="p-5 sm:p-6 pb-2 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="bg-amber-500 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                    {modalBadgeText}
                  </span>
                  {modalCombo.freeDelivery && (
                    <span className="bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-full">
                      ðŸšš {isTa ? 'à®‡à®²à®µà®š à®Ÿà¯†à®²à®¿à®µà®°à®¿ (à®¤à®®à®¿à®´à¯à®¨à®¾à®Ÿà¯ à®®à®Ÿà¯à®Ÿà¯à®®à¯)' : 'FREE DELIVERY (TN ONLY)'}
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full">
                      {discount}% {isTa ? 'à®¤à®³à¯à®³à¯à®ªà®Ÿà®¿' : 'OFF'}
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-black font-display text-slate-900 leading-tight">
                  {isTa ? t(modalCombo.title) : modalCombo.title}
                </h3>
                {modalCombo.subtitle && (
                  <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
                    {isTa ? t(modalCombo.subtitle) : modalCombo.subtitle}
                  </p>
                )}
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
                {/* Savings Callout */}
                {savings > 0 && (
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white p-4 rounded-2xl shadow-md flex items-center justify-between font-bold">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">ðŸŽ‰</span>
                      <div>
                        <p className="text-sm font-black">{isTa ? 'à®¨à®°à¯à®šà®°à®¿ à®¨à¯‡à®°à®Ÿà®¿ à®šà®¿à®±à®ªà¯à®ªà¯ à®¤à®³à¯à®³à¯à®ªà®Ÿà®¿!' : 'Nursery Direct Special Discount!'}</p>
                        <p className="text-xs text-emerald-100 font-medium">
                          {isTa ? `à®¤à®©à®¿à®¤à¯à®¤à®©à®¿à®¯à®¾à®• à®µà®¾à®™à¯à®•à¯à®µà®¤à¯ˆ à®µà®¿à®Ÿ à®°à¯‚.${savings} à®®à®¿à®šà¯à®šà®ªà¯à®ªà®Ÿà¯à®¤à¯à®¤à¯à®•à®¿à®±à¯€à®°à¯à®•à®³à¯` : `You save â‚¹${savings} compared to buying saplings individually`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xl font-black bg-white/20 px-3 py-1.5 rounded-xl border border-white/30 shrink-0">
                      {discount}% {isTa ? 'à®¤à®³à¯à®³à¯à®ªà®Ÿà®¿' : 'OFF'}
                    </span>
                  </div>
                )}

                {/* Included Plants Section */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <span>ðŸŒ¿ {isTa ? `à®‡à®¨à¯à®¤ à®¤à¯Šà®•à¯à®ªà¯à®ªà®¿à®²à¯ à®‰à®³à¯à®³ à®šà¯†à®Ÿà®¿à®•à®³à¯ (${isVinayagar ? 10 : (activeModalCombo.products?.length || 0)})` : `Included Saplings in this Package (${isVinayagar ? 10 : (activeModalCombo.products?.length || 0)})`}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getAggregatedProducts(activeModalCombo.products).map(({ product: p, count }) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (onSelectProduct) onSelectProduct(p);
                          setModalCombo(null);
                        }}
                        className="bg-slate-50 hover:bg-emerald-50/60 p-3 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all flex items-center gap-3 cursor-pointer group relative"
                      >
                        {count > 1 && (
                          <span className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-emerald-700 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-xs font-mono z-10">
                            {count}Ã— {isTa ? 'à®šà¯†à®Ÿà®¿à®•à®³à¯' : 'Saplings Bundle'}
                          </span>
                        )}
                        <img
                          src={p.images?.[0] || (p as any).image || (p as any).imageUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&q=80'}
                          alt={p.name}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src.endsWith('.webp')) target.src = target.src.replace(/\.webp$/, '.jpg');
                            else if (target.src.endsWith('.jpg')) target.src = target.src.replace(/\.jpg$/, '.webp');
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-slate-900 text-xs truncate group-hover:text-emerald-800">
                            {isTa ? (p.tamilName && p.tamilName !== p.name ? p.tamilName : t(p.name)) : p.name}
                          </h5>
                          <p className="text-[10px] text-slate-400 font-medium truncate">
                            {isTa ? 'ðŸŒ± à®¨à¯‡à®°à®Ÿà®¿ à®ªà®£à¯à®£à¯ˆ à®šà¯†à®Ÿà®¿' : (p.tamilName || '')}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                              {isTa ? 'à®‰à®¯à®¿à®°à¯à®³à¯à®³ à®ªà®£à¯à®£à¯ˆ à®šà¯†à®Ÿà®¿' : (p.potSize || 'Bag Plant')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Benefits List */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] font-bold text-slate-700">
                  <div className="flex items-center gap-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{isTa ? '7-à®¨à®¾à®³à¯ à®µà¯‡à®°à¯ à®ˆà®°à®ªà¯à®ªà®¤à®®à¯ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯' : '7-Day Root Moisture Moisturelock'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    <Truck className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{isTa ? 'à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà®¾à®© à®µà®¿à®°à¯ˆà®µà¯ à®Ÿà¯†à®²à®¿à®µà®°à®¿' : 'Safe All-India Express Delivery'}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer CTA */}
              <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center justify-between sm:block">
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold block">
                    {isTa ? 'à®•à®¾à®®à¯à®ªà¯‹ à®µà®¿à®²à¯ˆ' : 'Combo Package Price'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-black text-slate-900">â‚¹{modalCombo.comboPrice}</span>
                    {modalCombo.originalPrice > modalCombo.comboPrice && (
                      <span className="text-xs text-slate-400 font-bold line-through">â‚¹{modalCombo.originalPrice}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    handleAddComboToCart(activeModalCombo, e);
                    setModalCombo(null);
                  }}
                  disabled={isJustAdded}
                  className="w-full sm:w-auto py-3 px-5 sm:px-6 bg-gradient-to-r from-emerald-700 via-emerald-800 to-amber-700 hover:from-emerald-800 hover:to-amber-800 text-white font-extrabold text-xs rounded-xl sm:rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isTa ? `à®…à®©à¯ˆà®¤à¯à®¤à¯ ${isVinayagar ? 10 : (activeModalCombo.products?.length || 0)} à®šà¯†à®Ÿà®¿à®•à®³à¯ˆà®¯à¯à®®à¯ à®•à¯‚à®Ÿà¯ˆà®¯à®¿à®²à¯ à®šà¯‡à®°à¯à®•à¯à®•à®µà¯à®®à¯` : `Add All ${isVinayagar ? 10 : (activeModalCombo.products?.length || 0)} Saplings to Cart`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};

