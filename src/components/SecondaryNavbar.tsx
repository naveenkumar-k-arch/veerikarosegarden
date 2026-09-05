import React, { useState } from 'react';
import { ArrowLeft, Search, Home, Store, ShoppingCart, User as UserIcon, Globe } from 'lucide-react';
import { User, Product } from '../types';
import { SearchAutocompleteDropdown } from './SearchAutocompleteDropdown';
import { useLanguage } from '../context/LanguageContext';

interface SecondaryNavbarProps {
  onNavigate: (page: string, params?: any) => void;
  cartCount: number;
  currentPage: string;
  user?: User | null;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
}

export const SecondaryNavbar: React.FC<SecondaryNavbarProps> = ({
  onNavigate,
  cartCount,
  currentPage,
  user,
  searchQuery = '',
  onSearchChange,
  products = [],
  onSelectProduct,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    if (onSearchChange) onSearchChange(localSearch);
    onNavigate('shop', { query: localSearch });
  };

  const getPageTitle = (page: string) => {
    if (language === 'ta') {
      switch (page) {
        case 'shop': return 'செடிகள் & கடைகள்';
        case 'product-detail': return 'செடி விவரங்கள்';
        case 'cart': return 'ஷாப்பிங் கூடை';
        case 'checkout': return 'பாதுகாப்பான செக்அவுட்';
        case 'order-status': return 'ஆர்டர் நிலை';
        case 'account': return 'என் கணக்கு';
        case 'policies': return 'கொள்கைகள்';
        case 'admin': return 'நிர்வாகம்';
        default: return 'வீரிகா ரோஜா கார்டன்';
      }
    }
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
            title={language === 'ta' ? 'முகப்புக்குச் செல்லவும்' : 'Back to Home Page'}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('Home')}</span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group"
          >
            <span className="text-lg sm:text-xl">🌸</span>
            <div>
              <h1 className="font-extrabold text-xs sm:text-sm text-emerald-950 group-hover:text-emerald-700 transition-colors leading-tight">
                {language === 'ta' ? 'வீரிகா ரோஜா கார்டன்' : 'Veerika Rose Garden'}
              </h1>
              <span className="text-[9px] sm:text-[10px] bg-emerald-100 text-emerald-900 font-extrabold px-1.5 py-0.2 rounded-md inline-block leading-none mt-0.5">
                {getPageTitle(currentPage)}
              </span>
            </div>
          </div>
        </div>

        {/* Center Quick Search (Desktop / Tablet) */}
        <div className="hidden sm:block flex-1 max-w-sm relative">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <input
              type="text"
              placeholder={t('Search plants in English, தமிழ்...')}
              value={localSearch}
              onFocus={() => { if (localSearch.trim()) setShowDropdown(true); }}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setShowDropdown(Boolean(e.target.value.trim()));
                if (onSearchChange) onSearchChange(e.target.value);
              }}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-full text-xs font-semibold text-slate-900 transition-all outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </form>

          {/* Autocomplete Dropdown */}
          <SearchAutocompleteDropdown
            query={localSearch}
            products={products}
            isOpen={showDropdown && Boolean(localSearch.trim())}
            onClose={() => setShowDropdown(false)}
            onSelectProduct={(p) => {
              setShowDropdown(false);
              if (onSelectProduct) {
                onSelectProduct(p);
              } else {
                onNavigate('product-detail', { product: p });
              }
            }}
            onViewAll={(q) => {
              setShowDropdown(false);
              onNavigate('shop', { query: q });
            }}
          />
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            title={language === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாறவும்'}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-extrabold text-xs flex items-center gap-1 cursor-pointer transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-700" />
            <span>{language === 'ta' ? 'EN' : 'தமிழ்'}</span>
          </button>

          <button
            onClick={() => onNavigate('home')}
            className="hidden md:flex px-3 py-1.5 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer items-center gap-1"
          >
            <Home className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t('Home')}</span>
          </button>

          <button
            onClick={() => onNavigate('shop')}
            className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <Store className="w-3.5 h-3.5" />
            <span>{t('Shop')}</span>
          </button>

          <button
            onClick={() => onNavigate('cart')}
            className="relative p-2 sm:px-3 sm:py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-extrabold text-xs"
          >
            <ShoppingCart className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">{t('Cart')}</span>
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
            <span className="hidden sm:inline">{user ? user.name.split(' ')[0] : t('Account')}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
