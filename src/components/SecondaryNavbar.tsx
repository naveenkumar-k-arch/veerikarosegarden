import React, { useState } from 'react';
import { Home, Store, ShoppingCart, User as UserIcon, ArrowLeft, Search, Sparkles } from 'lucide-react';
import { User } from '../types';

interface SecondaryNavbarProps {
  currentPage: string;
  cartCount: number;
  onNavigate: (page: string, params?: any) => void;
  user?: User | null;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const SecondaryNavbar: React.FC<SecondaryNavbarProps> = ({
  currentPage,
  cartCount,
  onNavigate,
  user,
  searchQuery = '',
  onSearchChange
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  if (currentPage === 'home') return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) onSearchChange(localSearch);
    onNavigate('shop');
  };

  const getPageTitle = (page: string) => {
    switch (page) {
      case 'shop': return 'Shop Plants';
      case 'product-detail': return 'Plant Details';
      case 'cart': return 'Shopping Cart';
      case 'checkout': return 'Secure Checkout';
      case 'order-status': return 'Order Status';
      case 'account': return 'My Account';
      case 'policies': return 'Store Policies';
      case 'admin': return 'Admin Panel';
      default: return 'Veerika Rose Garden';
    }
  };

  return (
    <>
      {/* ================= DESKTOP NAVBAR (md:flex) ================= */}
      <header className="hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          
          {/* Left Brand & Back */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="p-1.5 hover:bg-emerald-50 text-emerald-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Return to Home Page"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Home</span>
            </button>

            <div className="h-5 w-px bg-slate-200" />

            <div
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <span className="text-xl">🌸</span>
              <div>
                <h1 className="font-extrabold text-sm text-emerald-950 group-hover:text-emerald-700 transition-colors leading-tight">
                  Veerika Rose Garden
                </h1>
                <p className="text-[10px] text-emerald-700 font-semibold leading-none">
                  {getPageTitle(currentPage)}
                </p>
              </div>
            </div>
          </div>

          {/* Center Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search plants in English or தமிழ்..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                if (onSearchChange) onSearchChange(e.target.value);
              }}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-full text-xs font-medium text-slate-900 transition-all outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </form>

          {/* Right Navigation Links */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                currentPage === 'home' ? 'bg-emerald-100 text-emerald-900' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => onNavigate('shop')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                currentPage === 'shop' ? 'bg-emerald-100 text-emerald-900' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Shop All</span>
            </button>

            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-700" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('account')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                currentPage === 'account' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{user ? user.name.split(' ')[0] : 'Account'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MOBILE TOP HEADER (md:hidden) ================= */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('home')}
            className="p-1.5 bg-slate-100 active:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div onClick={() => onNavigate('home')} className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-lg">🌸</span>
            <div>
              <span className="font-extrabold text-xs text-emerald-950 block leading-tight">
                Veerika Nursery
              </span>
              <span className="text-[9px] text-emerald-700 font-bold block leading-none">
                {getPageTitle(currentPage)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('cart')}
            className="relative p-2 bg-emerald-50 active:bg-emerald-100 text-emerald-900 rounded-xl transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4.5 h-4.5 text-emerald-700" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ================= MOBILE BOTTOM FLOATING TAB BAR (md:hidden) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors cursor-pointer ${
            currentPage === 'home' ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Home className="w-4.5 h-4.5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => onNavigate('shop')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors cursor-pointer ${
            currentPage === 'shop' ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Store className="w-4.5 h-4.5" />
          <span className="text-[10px]">Shop</span>
        </button>

        <button
          onClick={() => onNavigate('cart')}
          className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors cursor-pointer ${
            currentPage === 'cart' ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-4.5 h-4.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white font-extrabold text-[8px] px-1 rounded-full min-w-[14px] text-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Cart</span>
        </button>

        <button
          onClick={() => onNavigate('account')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors cursor-pointer ${
            currentPage === 'account' ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <UserIcon className="w-4.5 h-4.5" />
          <span className="text-[10px]">{user ? user.name.split(' ')[0] : 'Account'}</span>
        </button>
      </nav>
    </>
  );
};
