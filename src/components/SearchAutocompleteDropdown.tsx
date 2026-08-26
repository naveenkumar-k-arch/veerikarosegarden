import React, { useEffect, useRef } from 'react';
import { Search, ArrowRight, Tag, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface SearchAutocompleteDropdownProps {
  query: string;
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onViewAll: (query: string) => void;
  className?: string;
}

export const SearchAutocompleteDropdown: React.FC<SearchAutocompleteDropdownProps> = ({
  query,
  products = [],
  isOpen,
  onClose,
  onSelectProduct,
  onViewAll,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const cleanQuery = (query || '').trim().toLowerCase();

  if (!isOpen || !cleanQuery) {
    return null;
  }

  // Filter matching products
  const matchingProducts = products.filter((p) => {
    if (p.status === 'DISABLED') return false;
    const matchName = (p.name || '').toLowerCase().includes(cleanQuery);
    const matchEnglish = (p.englishName || '').toLowerCase().includes(cleanQuery);
    const matchTamil = (p.tamilName || '').toLowerCase().includes(cleanQuery);
    const matchScientific = (p.scientificName || '').toLowerCase().includes(cleanQuery);
    const matchSku = (p.sku || '').toLowerCase().includes(cleanQuery);
    const matchCategory = (p.categoryName || '').toLowerCase().includes(cleanQuery) || (p.categoryId || '').toLowerCase().includes(cleanQuery);
    const matchDesc = (p.description || '').toLowerCase().includes(cleanQuery);
    const matchTags = Array.isArray(p.tags) && p.tags.some((t) => (t || '').toLowerCase().includes(cleanQuery));

    return matchName || matchEnglish || matchTamil || matchScientific || matchSku || matchCategory || matchDesc || matchTags;
  });

  const previewItems = matchingProducts.slice(0, 6);
  const totalCount = matchingProducts.length;

  return (
    <div
      ref={containerRef}
      className={`absolute left-0 right-0 top-full mt-1.5 bg-white/98 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-2xl overflow-hidden z-50 transition-all duration-200 animate-in fade-in slide-in-from-top-2 text-left ${className}`}
      style={{
        boxShadow: '0 12px 36px -6px rgba(22, 101, 52, 0.22), 0 4px 16px -2px rgba(0, 0, 0, 0.08)'
      }}
    >
      {/* Dropdown Header */}
      <div className="px-3.5 py-2 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between text-[11px] font-bold text-emerald-900">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>Live Suggestions for &ldquo;<strong className="text-emerald-950 font-extrabold">{query}</strong>&rdquo;</span>
        </span>
        <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-black">
          {totalCount} {totalCount === 1 ? 'Plant' : 'Plants'}
        </span>
      </div>

      {/* Product List */}
      <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100 divide-opacity-80 overscroll-contain">
        {previewItems.length > 0 ? (
          previewItems.map((p) => {
            const hasDiscount = p.mrp && p.mrp > p.sellingPrice;
            const discountPct = hasDiscount ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0;
            const isInStock = p.stock === undefined || p.stock > 0;
            const imageSrc = p.images?.[0] || p.image || p.imageUrl || '/products/double-delight.jpeg';

            return (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProduct(p);
                  onClose();
                }}
                className="p-2.5 sm:p-3 hover:bg-emerald-50/70 active:bg-emerald-100/70 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Plant Image */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0 group-hover:border-emerald-300 transition-colors relative">
                    <img
                      src={imageSrc}
                      alt={p.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/products/double-delight.jpeg';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {hasDiscount && discountPct > 0 && (
                      <span className="absolute top-0.5 left-0.5 bg-rose-600 text-white text-[8.5px] font-black px-1 rounded-sm leading-tight shadow-xs">
                        -{discountPct}%
                      </span>
                    )}
                  </div>

                  {/* Plant Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                        {p.name}
                      </h4>
                      {p.tamilName && (
                        <span className="text-[10px] sm:text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60 truncate">
                          {p.tamilName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-slate-500">
                      {p.categoryName && (
                        <span className="font-semibold text-slate-600 truncate max-w-[120px]">
                          {p.categoryName}
                        </span>
                      )}
                      {p.sku && (
                        <span className="text-slate-400 font-mono text-[9.5px]">
                          #{p.sku}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${isInStock ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {isInStock ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5" /> In Stock
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-2.5 h-2.5" /> Out of Stock
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="text-right shrink-0 flex flex-col items-end justify-center pl-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-800">
                      ₹{p.sellingPrice}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] text-slate-400 line-through">
                        ₹{p.mrp}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 mt-0.5">
                    View <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty / No Matches State */
          <div className="p-6 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">No matching plants found</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                We couldn&apos;t find any plants matching &ldquo;<strong>{query}</strong>&rdquo;.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onViewAll('');
                onClose();
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Browse All Nursery Plants →
            </button>
          </div>
        )}
      </div>

      {/* Footer View All Bar */}
      {previewItems.length > 0 && (
        <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-600 font-medium hidden sm:inline">
            Showing {previewItems.length} of {totalCount} matching results
          </span>
          <button
            type="button"
            onClick={() => {
              onViewAll(query);
              onClose();
            }}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ml-auto"
          >
            <span>View all {totalCount} results in Shop</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
