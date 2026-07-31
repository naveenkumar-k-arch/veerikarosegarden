import React, { useState } from 'react';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Filter, SlidersHorizontal, Search, X, Check } from 'lucide-react';

interface ShopPageProps {
  products: Product[];
  categories: Category[];
  selectedCategory?: string;
  onSelectCategory: (catId: string | undefined) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onOpenCareGuide: (product: Product) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onAddToCart,
  onViewDetails,
  onOpenCareGuide
}) => {
  const [maxPrice, setMaxPrice] = useState<number>(500);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  // Filter products
  let filtered = products.filter((p) => {
    if (p.status !== 'ACTIVE') return false;
    if (selectedCategory) {
      const matchCat = categories.find(c => c.id === selectedCategory || c.slug === selectedCategory || c.id.toLowerCase() === selectedCategory.toLowerCase());
      const matchId = (matchCat ? matchCat.id : selectedCategory).toLowerCase();
      const matchName = (matchCat ? matchCat.name : selectedCategory).toLowerCase();
      const pCatId = (p.categoryId || '').toLowerCase();
      const pCatName = (p.categoryName || '').toLowerCase();
      if (pCatId !== matchId && pCatName !== matchName && !pCatName.includes(matchName) && !matchName.includes(pCatName)) return false;
    }
    if (p.sellingPrice > maxPrice) return false;
    if (inStockOnly && p.stock <= 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchEnglish = p.englishName.toLowerCase().includes(q);
      const matchTamil = p.tamilName.toLowerCase().includes(q);
      const matchScientific = p.scientificName.toLowerCase().includes(q);
      const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
      return matchName || matchEnglish || matchTamil || matchScientific || matchTags;
    }

    return true;
  });

  // Sort products
  if (sortBy === 'price-low') {
    filtered.sort((a, b) => a.sellingPrice - b.sellingPrice);
  } else if (sortBy === 'price-high') {
    filtered.sort((a, b) => b.sellingPrice - a.sellingPrice);
  } else if (sortBy === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Title */}
      <div className="bg-emerald-900 text-white p-6 sm:p-8 rounded-3xl space-y-2 relative overflow-hidden shadow-md">
        <h1 className="text-2xl sm:text-3xl font-black">
          {currentCategoryObj ? `${currentCategoryObj.name} (${currentCategoryObj.tamilName})` : 'All Plants & Nursery Items'}
        </h1>
        <p className="text-xs sm:text-sm text-emerald-200">
          {currentCategoryObj
            ? currentCategoryObj.description
            : 'Browse healthy rose varieties, flowering saplings, fruit trees, and organic soil fertilizers direct from our Hosur nursery.'}
        </p>
      </div>

      {/* Main Grid + Filter Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block space-y-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs h-fit">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-700" /> Filter Plants
            </h3>
            {(selectedCategory || searchQuery || maxPrice < 500 || inStockOnly) && (
              <button
                onClick={() => {
                  onSelectCategory(undefined);
                  onSearchChange('');
                  setMaxPrice(500);
                  setInStockOnly(false);
                }}
                className="text-[11px] text-rose-600 hover:underline font-bold"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Categories Filter */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Categories</h4>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => onSelectCategory(undefined)}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors font-medium flex items-center justify-between ${
                  selectedCategory === undefined
                    ? 'bg-emerald-100 text-emerald-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>All Categories</span>
                <span>({products.length})</span>
              </button>

              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-colors font-medium flex items-center justify-between ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-100 text-emerald-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate pr-2">
                      {cat.name} <span className="text-[10px] text-slate-500">({cat.tamilName})</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider">Max Price:</h4>
              <span className="font-black text-emerald-800">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>₹50</span>
              <span>₹250</span>
              <span>₹500</span>
            </div>
          </div>

          {/* Availability Checkbox */}
          <div className="pt-4 border-t border-slate-200">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
              />
              <span>In Stock Plants Only</span>
            </label>
          </div>
        </div>

        {/* Catalog Main Listing */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Bar Sort & Search Info */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="text-slate-600 font-medium">
              Showing <span className="font-bold text-slate-900">{filtered.length}</span> plants
              {searchQuery && (
                <span>
                  {' '}
                  matching "<strong className="text-emerald-800">{searchQuery}</strong>"
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center gap-1.5"
              >
                <Filter className="w-4 h-4 text-emerald-700" />
                <span>Filters</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold hidden sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="popular">Popularity</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Cards Grid */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <p className="text-slate-500 text-sm">No plants matched your current filters or search terms.</p>
              <button
                onClick={() => {
                  onSelectCategory(undefined);
                  onSearchChange('');
                  setMaxPrice(500);
                  setInStockOnly(false);
                }}
                className="px-5 py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-800"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onViewDetails={onViewDetails}
                  onOpenCareGuide={onOpenCareGuide}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xs h-full p-5 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Filter Plants</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 text-slate-400 hover:text-slate-800">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Category Select */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase">Category</h4>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    onSelectCategory(undefined);
                    setMobileFilterOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg ${selectedCategory === undefined ? 'bg-emerald-100 font-bold' : ''}`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCategory(c.id);
                      setMobileFilterOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg ${selectedCategory === c.id ? 'bg-emerald-100 font-bold' : ''}`}
                  >
                    {c.name} ({c.tamilName})
                  </button>
                ))}
              </div>
            </div>

            {/* Max Price */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Max Price:</span>
                <span>₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-emerald-700"
              />
            </div>

            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full py-3 bg-emerald-700 text-white font-bold rounded-xl text-xs"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
