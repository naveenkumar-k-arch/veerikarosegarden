import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Sparkles, Check, Package, Leaf, AlertCircle } from 'lucide-react';
import { CartItem } from '../types';

export type PackingOptionType = 'STANDARD' | 'EXTRA_SECURE' | 'MAX_PROTECTION';

export interface PlantProtectivePackingSectionProps {
  items: CartItem[];
  selectedPacking: PackingOptionType;
  onChangePacking: (option: PackingOptionType) => void;
  className?: string;
}

export const PlantProtectivePackingSection: React.FC<PlantProtectivePackingSectionProps> = ({
  items,
  selectedPacking,
  onChangePacking,
  className = ''
}) => {
  const [showCartChangedNotice, setShowCartChangedNotice] = useState(false);
  const prevItemsSigRef = useRef<string>('');
  const isInitialMount = useRef(true);

  // Total plant count (including combos)
  const totalPlantCount = items.reduce((sum, i) => {
    const isCombo = i.isCombo || i.product.id.startsWith('combo-') || (i.product as any).isCombo;
    const bundleCount = (i.comboProducts && i.comboProducts.length > 0)
      ? i.comboProducts.length
      : ((i.product as any).comboProducts?.length || 1);
    return sum + (isCombo ? bundleCount * i.quantity : i.quantity);
  }, 0);

  // Check if order contains delicate or flowering plants
  const hasFloweringOrRare = items.some(i =>
    i.product.categoryId === 'cat-roses' ||
    i.product.categoryId === 'cat-rare' ||
    i.product.categoryId === 'cat-flowering' ||
    i.product.categoryId === 'cat-hibiscus' ||
    i.product.name.toLowerCase().includes('rose') ||
    i.product.name.toLowerCase().includes('flower')
  );

  const hasDelicateHerbs = items.some(i =>
    i.product.categoryId === 'cat-herbals' ||
    i.product.categoryId === 'cat-miniature' ||
    i.product.categoryId === 'cat-creeper' ||
    i.product.name.toLowerCase().includes('mini') ||
    i.product.name.toLowerCase().includes('herb')
  );

  // Dynamic recommendation based on cart composition
  const recommendedOption: PackingOptionType = totalPlantCount >= 4 || hasFloweringOrRare
    ? 'MAX_PROTECTION'
    : hasDelicateHerbs
    ? 'EXTRA_SECURE'
    : 'EXTRA_SECURE'; // Default recommended upgrade for live nursery plant transit

  // Detect cart changes to update recommendation banner
  useEffect(() => {
    const currentSig = items.map(i => `${i.product.id}:${i.quantity}`).join('|');
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevItemsSigRef.current = currentSig;
      return;
    }

    if (prevItemsSigRef.current && prevItemsSigRef.current !== currentSig) {
      setShowCartChangedNotice(true);
      const timer = setTimeout(() => {
        setShowCartChangedNotice(false);
      }, 7000);
      prevItemsSigRef.current = currentSig;
      return () => clearTimeout(timer);
    }
  }, [items]);

  return (
    <div className={`rounded-3xl border border-emerald-900/15 bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 p-4 sm:p-5 space-y-4 shadow-xs ${className}`}>
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              Pick Protective Packing for Your Plants’ Journey
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-600 font-medium">
              Choose a secure packing for your delicate plants, bulk purchases or longer journeys.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Cart Changed Notice */}
      {showCartChangedNotice && (
        <div className="p-3 bg-emerald-100/90 border border-emerald-300 rounded-2xl flex items-center gap-2 text-emerald-900 text-[11px] font-bold animate-in fade-in duration-300">
          <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 animate-spin" />
          <span>Your cart changed, so we updated the packing recommendations.</span>
        </div>
      )}

      {/* Packing Options Grid */}
      <div className="space-y-3">
        {/* Option 1: Standard Safe Packing (Included ₹0) */}
        <div
          onClick={() => onChangePacking('STANDARD')}
          className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedPacking === 'STANDARD'
              ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <input
                type="radio"
                name="protectivePacking"
                checked={selectedPacking === 'STANDARD'}
                onChange={() => onChangePacking('STANDARD')}
                className="mt-1 accent-emerald-700 cursor-pointer"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    Standard Safe Nursery Packing
                  </h4>
                  <span className="text-[9px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    Basic Included
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Basic cardboard carton with moisture-retaining coco peat root wrap. Suitable for local short-distance transit.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs sm:text-sm font-black text-slate-700 block">₹0</span>
              <span className="text-[9px] text-emerald-700 font-bold uppercase">Included</span>
            </div>
          </div>
        </div>

        {/* Option 2: Extra Secure Packing (₹10) */}
        <div
          onClick={() => onChangePacking('EXTRA_SECURE')}
          className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
            selectedPacking === 'EXTRA_SECURE'
              ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
              : 'border-slate-200 bg-white hover:border-emerald-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <input
                type="radio"
                name="protectivePacking"
                checked={selectedPacking === 'EXTRA_SECURE'}
                onChange={() => onChangePacking('EXTRA_SECURE')}
                className="mt-1 accent-emerald-700 cursor-pointer"
              />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1">
                    <span>Extra Secure Packing</span>
                  </h4>
                  <span className="text-[9px] font-black bg-teal-100 text-teal-900 px-2 py-0.5 rounded-md border border-teal-200 flex items-center gap-0.5">
                    Recommended for delicate plants 🌱
                  </span>
                </div>

                <ul className="text-[10px] sm:text-[11px] text-slate-700 space-y-1 font-medium">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Double-layer, full-plant protective wrapping</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Reinforced carton support and extra spacing to help reduce crushing</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Better airflow and less movement during transport</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Recommended for delicate plants and longer journeys</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs sm:text-sm font-black text-emerald-900 block">₹10</span>
              <span className="text-[9px] text-slate-500 font-medium">Per Order</span>
            </div>
          </div>
        </div>

        {/* Option 3: Maximum Protection Packing (₹15) */}
        <div
          onClick={() => onChangePacking('MAX_PROTECTION')}
          className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
            selectedPacking === 'MAX_PROTECTION'
              ? 'border-emerald-700 bg-emerald-50/80 ring-2 ring-emerald-600/30 shadow-md'
              : 'border-emerald-200/80 bg-gradient-to-r from-white to-emerald-50/30 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <input
                type="radio"
                name="protectivePacking"
                checked={selectedPacking === 'MAX_PROTECTION'}
                onChange={() => onChangePacking('MAX_PROTECTION')}
                className="mt-1 accent-emerald-700 cursor-pointer"
              />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1">
                    <span>Maximum Protection Packing</span>
                  </h4>
                  <span className="text-[9px] font-black bg-rose-100 text-rose-900 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-0.5">
                    Recommended for bulk plant orders
                  </span>
                  <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-0.5">
                    Recommended for Flowering plant 🌹
                  </span>
                </div>

                <ul className="text-[10px] sm:text-[11px] text-slate-700 space-y-1 font-medium">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-700 font-bold shrink-0" />
                    <span>Stronger reinforcement for larger orders</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-700 font-bold shrink-0" />
                    <span>Better separation with added support around roots, stems and leaves</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-700 font-bold shrink-0" />
                    <span>Extra protection against movement and compression</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-700 font-bold shrink-0" />
                    <span>Recommended for bulk purchases and long-distance transport</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-emerald-900 font-bold">
                    <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Designed to support a fresher, more stable arrival</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs sm:text-sm font-black text-emerald-900 block">₹15</span>
              <span className="text-[9px] text-emerald-800 font-bold">Best Value</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
