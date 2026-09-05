import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Heart, User as UserIcon, Phone, MessageSquare, Menu, X, LayoutDashboard, Sparkles } from 'lucide-react';
import { Category, User, Product } from '../types';
import { SearchAutocompleteDropdown } from './SearchAutocompleteDropdown';

interface HeaderProps {
  cartCount: number;
  wishlistCount?: number;
  onOpenCart: () => void;
  onNavigate: (page: string, params?: any) => void;
  categories?: Category[];
  activeCategory?: string;
  onSelectCategory?: (catId?: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
  user?: User | null;
  onOpenExpertAdvice?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount, wishlistCount = 0, onOpenCart, onNavigate,
  categories = [], activeCategory, onSelectCategory = (_catId?: string) => {},
  searchQuery, onSearchChange, products = [], onSelectProduct,
  isAdmin = false, onToggleAdmin = () => {},
  user, onOpenExpertAdvice
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showDesktopDropdown, setShowDesktopDropdown] = useState(false);
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); onNavigate('shop'); };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 40,
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid #dcfce7',
      boxShadow: scrolled ? '0 4px 20px rgba(22,163,74,0.1)' : '0 2px 10px rgba(22,163,74,0.04)',
      transition: 'box-shadow 0.3s ease',
    }}>
      {/* Top Announcement Strip */}
      <div style={{ background: 'linear-gradient(90deg, #15803d, #16a34a, #15803d)', padding: '4px 0' }}>
        <div className="section-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', gap: 8, padding: '0 16px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            🌿 ALL INDIA DELIVERY
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <a href="tel:+917200826129" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#bbf7d0', fontSize: 10, fontWeight: 600, textDecoration: 'none' }}>
              <Phone style={{ width: 11, height: 11 }} /> <span className="sm-show" style={{ display: 'none' }}>+91 72008 26129</span>
            </a>
            <a
              href="https://wa.me/919361540714?text=Hello%20Veerika%20Rose%20Garden"
              target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'white', fontSize: 10, fontWeight: 600, textDecoration: 'none', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}
            >
              <MessageSquare style={{ width: 10, height: 10 }} /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="section-container" style={{ padding: '8px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>

          {/* Logo & Brand Name */}
          <div onClick={() => onNavigate('home')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
              border: '2px solid #16a34a',
              boxShadow: '0 0 0 2px #dcfce7',
              flexShrink: 0,
            }}>
              <img src="/logo.webp" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800,
                color: 'var(--text-dark)', margin: 0, lineHeight: 1.1, whiteSpace: 'nowrap'
              }}>
                Veerika <em style={{ color: 'var(--color-rose)', fontStyle: 'italic', fontWeight: 700 }}>Rose Garden</em>
              </h1>
              <p style={{ fontFamily: 'var(--font-tamil)', fontSize: 9, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap' }}>
                வீரிகா ரோஜா கார்டன்
              </p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div style={{ flex: 1, maxWidth: 420, position: 'relative', display: 'none' }} className="lg-show-flex">
            <form onSubmit={(e) => { handleSearchSubmit(e); setShowDesktopDropdown(false); }} style={{ width: '100%', position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-light)', zIndex: 2 }} />
              <input
                type="text"
                placeholder="Search plants in English, தமிழ், or Scientific name..."
                value={searchQuery}
                onFocus={() => { if (searchQuery.trim()) setShowDesktopDropdown(true); }}
                onChange={e => {
                  onSearchChange(e.target.value);
                  setShowDesktopDropdown(Boolean(e.target.value.trim()));
                }}
                className="input-bright"
                style={{ paddingLeft: 34, paddingRight: 80, fontSize: 12 }}
              />
              <button type="submit" style={{
                position: 'absolute', right: 3, top: 3, bottom: 3, padding: '0 12px',
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                color: 'white', border: 'none', borderRadius: 8,
                fontSize: 10, fontWeight: 700, cursor: 'pointer', zIndex: 2
              }}>
                SEARCH
              </button>
            </form>

            {/* Desktop Autocomplete Live Suggestions */}
            <SearchAutocompleteDropdown
              query={searchQuery}
              products={products}
              isOpen={showDesktopDropdown && Boolean(searchQuery.trim())}
              onClose={() => setShowDesktopDropdown(false)}
              onSelectProduct={(p) => {
                setShowDesktopDropdown(false);
                if (onSelectProduct) {
                  onSelectProduct(p);
                } else {
                  onNavigate('product-detail', { product: p });
                }
              }}
              onViewAll={(q) => {
                setShowDesktopDropdown(false);
                onNavigate('shop', { query: q });
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

            {/* Expert AI button — Desktop/Tablet */}
            {onOpenExpertAdvice && (
              <button onClick={onOpenExpertAdvice} className="sm-show-flex" style={{
                display: 'none', alignItems: 'center', gap: 5, padding: '5px 10px',
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                border: '1px solid #fcd34d', borderRadius: 999,
                color: '#d97706', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                flexShrink: 0,
              }}>
                <Sparkles style={{ width: 12, height: 12 }} />
                <span>Expert AI</span>
              </button>
            )}

            {/* Admin button */}
            {user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'MANAGER') && (
              <button onClick={onToggleAdmin} title="Admin Panel" style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px',
                background: isAdmin ? '#fef3c7' : 'white',
                border: '1.5px solid #fcd34d', borderRadius: 8,
                color: '#d97706', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                flexShrink: 0,
              }}>
                <LayoutDashboard style={{ width: 12, height: 12 }} />
                <span className="sm-show" style={{ display: 'none' }}>{isAdmin ? 'Exit Admin' : 'Admin'}</span>
              </button>
            )}

            {/* Account / User button */}
            <button onClick={() => onNavigate('account')} title={user ? `My Account (${user.name})` : "Sign In / My Account"} style={{
              height: 32, padding: user ? '0 10px' : '0 8px', display: 'flex', alignItems: 'center', gap: 5,
              background: user ? '#f0fdf4' : 'var(--bg-soft)',
              border: `1.5px solid ${user ? '#bbf7d0' : '#d1fae5'}`,
              borderRadius: 8, color: user ? '#15803d' : 'var(--text-muted)',
              cursor: 'pointer', flexShrink: 0, fontSize: 11, fontWeight: 700,
            }}>
              <UserIcon style={{ width: 14, height: 14, color: user ? '#16a34a' : 'var(--text-muted)' }} />
              <span className="sm-show" style={{ display: 'none', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user ? user.name?.split(' ')[0] : 'Account'}
              </span>
            </button>

            {/* Wishlist button */}
            <button onClick={() => onNavigate('account', { tab: 'wishlist' })} title="Wishlist" style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: wishlistCount > 0 ? '#ffe4e6' : 'var(--bg-soft)',
              border: `1.5px solid ${wishlistCount > 0 ? '#fecdd3' : '#d1fae5'}`,
              borderRadius: 8, color: wishlistCount > 0 ? '#e11d48' : 'var(--text-muted)',
              cursor: 'pointer', position: 'relative', flexShrink: 0,
            }}>
              <Heart style={{ width: 14, height: 14, fill: wishlistCount > 0 ? '#e11d48' : 'none' }} />
              {wishlistCount > 0 && (
                <span style={{ position: 'absolute', top: -3, right: -3, background: '#f43f5e', color: 'white', fontSize: 8, fontWeight: 800, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Header Cart Button */}
            <button onClick={onOpenCart} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              border: 'none', borderRadius: 8, color: 'white',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(22,163,74,0.25)', flexShrink: 0,
            }}>
              <ShoppingBag style={{ width: 13, height: 13 }} />
              <span>{cartCount}</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mobile-show" style={{
              width: 32, height: 32, display: 'none', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-soft)', border: '1.5px solid #d1fae5', borderRadius: 8,
              color: 'var(--text-dark)', cursor: 'pointer', flexShrink: 0,
            }}>
              {mobileMenuOpen ? <X style={{ width: 16, height: 16 }} /> : <Menu style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div style={{ marginTop: 6, position: 'relative', display: 'none' }} className="mobile-show">
          <form onSubmit={(e) => { handleSearchSubmit(e); setShowMobileDropdown(false); }} style={{ width: '100%', position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'var(--text-light)', zIndex: 2 }} />
            <input
              type="text"
              placeholder="Search plants..."
              value={searchQuery}
              onFocus={() => { if (searchQuery.trim()) setShowMobileDropdown(true); }}
              onChange={e => {
                onSearchChange(e.target.value);
                setShowMobileDropdown(Boolean(e.target.value.trim()));
              }}
              className="input-bright"
              style={{ paddingLeft: 30, paddingRight: 64, height: 34, fontSize: 13 }}
            />
            <button type="submit" style={{ position: 'absolute', right: 3, top: 3, bottom: 3, padding: '0 10px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', zIndex: 2 }}>
              GO
            </button>
          </form>

          {/* Mobile Autocomplete Live Suggestions */}
          <SearchAutocompleteDropdown
            query={searchQuery}
            products={products}
            isOpen={showMobileDropdown && Boolean(searchQuery.trim())}
            onClose={() => setShowMobileDropdown(false)}
            onSelectProduct={(p) => {
              setShowMobileDropdown(false);
              if (onSelectProduct) {
                onSelectProduct(p);
              } else {
                onNavigate('product-detail', { product: p });
              }
            }}
            onViewAll={(q) => {
              setShowMobileDropdown(false);
              onNavigate('shop', { query: q });
            }}
          />
        </div>
      </div>

      {/* Horizontal Category Strip */}
      {categories.length > 0 && (
        <div style={{ borderTop: '1px solid #f0fdf4', overflowX: 'auto', background: '#f8faf6' }} className="no-scrollbar">
          <div className="section-container" style={{ padding: '6px 16px' }}>
            <div style={{ display: 'flex', gap: 6, whiteSpace: 'nowrap' }}>
              <button
                onClick={() => { onSelectCategory(undefined); onNavigate('shop'); }}
                className={`cat-pill${activeCategory === undefined ? ' active' : ''}`}
                style={{ fontSize: 11, padding: '4px 10px' }}
              >
                All Plants
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { onSelectCategory(cat.id); onNavigate('shop'); }}
                  className={`cat-pill${activeCategory === cat.id ? ' active' : ''}`}
                  style={{ fontSize: 11, padding: '4px 10px' }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{ background: 'white', borderTop: '2px solid #dcfce7', padding: '14px 16px' }}>
          <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', padding: '8px 12px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#166534' }}>👤 {user.name}</p>
                  <p style={{ margin: 0, fontSize: 10, color: '#15803d' }}>{user.email || user.phone || 'Customer'}</p>
                </div>
                <button onClick={() => { onNavigate('account'); setMobileMenuOpen(false); }} style={{ padding: '5px 10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  My Account
                </button>
              </div>
            ) : (
              <button
                onClick={() => { onNavigate('account'); setMobileMenuOpen(false); }}
                style={{
                  width: '100%', padding: '10px', background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: 'white', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: '0 3px 10px rgba(22,163,74,0.2)', cursor: 'pointer'
                }}
              >
                <UserIcon style={{ width: 14, height: 14 }} />
                <span>Login / Sign Up</span>
              </button>
            )}

            {onOpenExpertAdvice && (
              <button onClick={() => { onOpenExpertAdvice(); setMobileMenuOpen(false); }} style={{
                width: '100%', padding: '8px', background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                border: '1px solid #fcd34d', borderRadius: 10, color: '#d97706', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer'
              }}>
                <Sparkles style={{ width: 14, height: 14 }} />
                <span>✨ Ask Plant Expert AI</span>
              </button>
            )}

            {user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'MANAGER') && (
              <button onClick={() => { onToggleAdmin(); setMobileMenuOpen(false); }} style={{
                width: '100%', padding: '8px', background: isAdmin ? '#fef3c7' : '#f8faf6',
                border: '1px solid #fcd34d', borderRadius: 10, color: '#d97706', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer'
              }}>
                <LayoutDashboard style={{ width: 14, height: 14 }} />
                <span>{isAdmin ? 'Exit Admin Dashboard' : 'Open Admin Panel'}</span>
              </button>
            )}
          </div>

          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 8 }}>Categories</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button onClick={() => { onSelectCategory(undefined); onNavigate('shop'); setMobileMenuOpen(false); }} style={{ padding: '7px 10px', textAlign: 'left', borderRadius: 8, fontSize: 11, fontWeight: 600, background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', cursor: 'pointer' }}>All Plants</button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => { onSelectCategory(cat.id); onNavigate('shop'); setMobileMenuOpen(false); }} style={{ padding: '7px 10px', textAlign: 'left', borderRadius: 8, fontSize: 11, background: 'var(--bg-soft)', border: '1px solid #e5f0e0', color: 'var(--text-body)', cursor: 'pointer' }}>{cat.name}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10, paddingTop: 8, borderTop: '1px solid #f0fdf4' }}>
            <button onClick={() => { onNavigate('policies'); setMobileMenuOpen(false); }} style={{ padding: '7px 10px', borderRadius: 8, fontSize: 11, background: 'var(--bg-soft)', border: '1px solid #e5f0e0', color: 'var(--text-muted)', cursor: 'pointer' }}>Policies</button>
            <button onClick={() => { onNavigate('account'); setMobileMenuOpen(false); }} style={{ padding: '7px 10px', borderRadius: 8, fontSize: 11, background: 'var(--bg-soft)', border: '1px solid #e5f0e0', color: 'var(--text-muted)', cursor: 'pointer' }}>My Account</button>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) { .md-show { display: inline !important; } }
        @media (min-width: 640px) { .sm-show { display: inline !important; } .sm-show-flex { display: flex !important; } }
        @media (min-width: 1024px) { .lg-show-flex { display: flex !important; } }
        @media (max-width: 1023px) { .mobile-show { display: flex !important; } }
      `}</style>
    </header>
  );
};
