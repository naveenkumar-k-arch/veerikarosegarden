import React, { useState, useEffect } from 'react';
import { Combo, Product } from '../types';
import { ShoppingBag, Sparkles, CheckCircle2, Tag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';

interface CombosSectionProps {
  onAddToCart: (product: Product, quantity?: number) => void;
  onSelectProduct?: (product: Product) => void;
}

export const CombosSection: React.FC<CombosSectionProps> = ({ onAddToCart, onSelectProduct }) => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedComboId, setAddedComboId] = useState<string | null>(null);

  useEffect(() => {
    fetchCombos();
  }, []);

  const fetchCombos = async () => {
    try {
      const res = await fetch('/api/combos');
      const data = await res.json();
      if (data.success && Array.isArray(data.combos)) {
        setCombos(data.combos.filter((c: Combo) => c.active !== false));
      }
    } catch (err) {
      console.error('Failed to load combos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComboToCart = (combo: Combo) => {
    if (!combo.products || combo.products.length === 0) return;

    combo.products.forEach(product => {
      onAddToCart(product, 1);
    });

    setAddedComboId(combo.id);
    setTimeout(() => setAddedComboId(null), 2500);
  };

  if (!loading && combos.length === 0) {
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
              <span>Combos & Offers</span>
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">EXTRA SAVINGS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              🔥 Special Plant Combo Offers
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl font-medium">
              Hand-picked plant bundles directly from Veerika Rose Garden with exclusive combo discounts & free doorstep farm delivery.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 shadow-2xs self-start md:self-auto">
            <span className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="w-4 h-4" /> Healthy Grafted Saplings
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-amber-700">
              <Truck className="w-4 h-4" /> Express Moisture Packed
            </span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {combos.map((combo) => {
              const discount = combo.discountPercent || (combo.originalPrice > 0 ? Math.round(((combo.originalPrice - combo.comboPrice) / combo.originalPrice) * 100) : 0);
              const savings = combo.originalPrice > combo.comboPrice ? combo.originalPrice - combo.comboPrice : 0;
              const isJustAdded = addedComboId === combo.id;

              return (
                <div
                  key={combo.id}
                  className="group bg-white/90 backdrop-blur-md border border-amber-200/70 hover:border-amber-400 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative transform hover:-translate-y-1"
                >
                  {/* Top Discount Badge */}
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 flex-wrap">
                    <span className="bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-[11px] px-3 py-1 rounded-full shadow-md uppercase tracking-wide flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {combo.badge || 'COMBO OFFER'}
                    </span>
                    {combo.freeDelivery && (
                      <span className="bg-emerald-600 text-white font-black text-[11px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Truck className="w-3 h-3" /> FREE DELIVERY
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="bg-emerald-700 text-white font-black text-[11px] px-2.5 py-1 rounded-full shadow-md">
                        {discount}% OFF
                      </span>
                    )}
                  </div>

                  <div>
                    {/* Header Image Collage */}
                    <div className="relative h-52 bg-slate-100 overflow-hidden">
                      {combo.imageUrl ? (
                        <img
                          src={combo.imageUrl}
                          alt={combo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : combo.products && combo.products.length > 0 ? (
                        <div className="grid grid-cols-2 h-full gap-0.5 bg-slate-200">
                          {combo.products.slice(0, 4).map((p, idx) => (
                            <img
                              key={p.id || idx}
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-900/10 text-4xl">
                          🌿
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
                      
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <h3 className="font-black text-lg sm:text-xl leading-snug drop-shadow-md">
                          {combo.title}
                        </h3>
                        {combo.subtitle && (
                          <p className="text-xs font-medium text-amber-200/90 truncate drop-shadow-xs">
                            {combo.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Included Plants Section */}
                    <div className="p-5 space-y-4">
                      {combo.products && combo.products.length > 0 && (
                        <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-3.5 space-y-2">
                          <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span>🌿 Included in this Bundle ({combo.products.length} Plants):</span>
                          </p>
                          <div className="space-y-1.5">
                            {combo.products.map((p) => (
                              <div
                                key={p.id}
                                onClick={() => onSelectProduct && onSelectProduct(p)}
                                className="flex items-center justify-between text-xs font-semibold text-slate-800 hover:text-emerald-800 cursor-pointer group/item"
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 group-hover/item:scale-125 transition-transform" />
                                  <span className="truncate">{p.name}</span>
                                </span>
                                <span className="text-[11px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 ml-2 shrink-0">
                                  ₹{p.sellingPrice}
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
                            <span className="text-2xl sm:text-3xl font-black text-slate-900">
                              ₹{combo.comboPrice}
                            </span>
                            {combo.originalPrice > combo.comboPrice && (
                              <span className="text-sm font-bold text-slate-400 line-through">
                                ₹{combo.originalPrice}
                              </span>
                            )}
                          </div>
                          {savings > 0 && (
                            <p className="text-xs font-extrabold text-emerald-700 mt-0.5">
                              🎉 Total Savings: ₹{savings} ({discount}% OFF)
                            </p>
                          )}
                          {combo.freeDelivery && (
                            <div className="mt-1">
                              <span className="bg-emerald-100 text-emerald-900 font-extrabold text-[11px] px-2.5 py-0.5 rounded-lg border border-emerald-300 inline-flex items-center gap-1">
                                🚚 Includes 100% Free Shipping!
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add Bundle to Cart CTA Button */}
                  <div className="p-5 pt-0">
                    <button
                      onClick={() => handleAddComboToCart(combo)}
                      disabled={isJustAdded}
                      className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                        isJustAdded
                          ? 'bg-emerald-700 text-white'
                          : 'bg-gradient-to-r from-emerald-700 via-emerald-800 to-amber-700 hover:from-emerald-800 hover:to-amber-800 text-white shadow-emerald-950/10 hover:shadow-lg'
                      }`}
                    >
                      {isJustAdded ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 animate-bounce" />
                          <span>Added All Plants to Cart!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>Add Combo Package to Cart (₹{combo.comboPrice})</span>
                          <ArrowRight className="w-4 h-4" />
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
    </section>
  );
};
