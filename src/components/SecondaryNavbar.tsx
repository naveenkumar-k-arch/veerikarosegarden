import React, { useState } from 'react';
import { ArrowLeft, Search, Home, Store, ShoppingCart, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface SecondaryNavbarProps {
  onNavigate: (page: string, params?: any) => void;
  cartCount: number;
  currentPage: string;
  user?: User | null;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const SecondaryNavbar: React.FC<SecondaryNavbarProps> = ({
  onNavigate,
  cartCount,
  currentPage,
  user,
  searchQuery = '',
  onSearchChange,
}) => {
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) onSearchChange(localSearch);
    onNavigate('shop');
  };

  const getPageTitle = (page: string) => {
    switch (page) {
      case 'shop': return 'Shop All Plants';
      case 'product-detail': return 'Plant Details';
      case 'cart': return 'Shopping Cart';
      case 'checkout': return 'Secure Checkout';
      case 'order-status': return 'Order Status';
      case 'account': return 'My Account';
      case 'policies': return 'Store Policies';
      case 'admin': return 'Admin Management';
      default: return 'Veerika Rose Garden';
    }
  };

  return (
    <header
      id="secondary-navbar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 999,
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #dcfce7',
        boxShadow: '0 2px 12px rgba(22, 163, 74, 0.08)'
      }}
      className="w-full h-[54px] sm:h-[58px] flex items-center shrink-0"
    >
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left Brand & Back Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => onNavigate('home')}
            className="p-1.5 sm:px-3 sm:py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold border border-emerald-200"
            title="Back to Home Page"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group"
          >
            <span className="text-lg sm:text-xl">🌸</span>
            <div>
              <h1 className="font-extrabold text-xs sm:text-sm text-emerald-950 group-hover:text-emerald-700 transition-colors leading-tight">
                Veerika Rose Garden
              </h1>
              <span className="text-[9px] sm:text-[10px] bg-emerald-100 text-emerald-900 font-extrabold px-1.5 py-0.2 rounded-md inline-block leading-none mt-0.5">
                {getPageTitle(currentPage)}
              </span>
            </div>
          </div>
        </div>

        {/* Center Quick Search (Desktop / Tablet) */}
        <form onSubmit={handleSearchSubmit} className="hidden sm:flex flex-1 max-w-sm relative">
          <input
            type="text"
            placeholder="Search plants in English, தமிழ்..."
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              if (onSearchChange) onSearchChange(e.target.value);
            }}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-100 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-full text-xs font-semibold text-slate-900 transition-all outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </form>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => onNavigate('home')}
            className="hidden md:flex px-3 py-1.5 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer items-center gap-1"
          >
            <Home className="w-3.5 h-3.5 text-emerald-700" />
            <span>Home</span>
          </button>

          <button
            onClick={() => onNavigate('shop')}
            className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Shop</span>
          </button>

          <button
            onClick={() => onNavigate('cart')}
            className="relative p-2 sm:px-3 sm:py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-extrabold text-xs"
          >
            <ShoppingCart className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="bg-rose-600 text-white font-extrabold text-[10px] px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('account')}
            className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
          >
            <UserIcon className="w-3.5 h-3.5 text-slate-700" />
            <span className="hidden sm:inline">{user ? user.name.split(' ')[0] : 'Account'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
