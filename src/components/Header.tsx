import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Heart, User as UserIcon, Phone, MessageSquare, Menu, X, LayoutDashboard, Sparkles } from 'lucide-react';
import { Category, User } from '../types';

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
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
  user?: User | null;
  onOpenExpertAdvice?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount, wishlistCount = 0, onOpenCart, onNavigate,
  categories = [], activeCategory, onSelectCategory = (_catId?: string) => {},
  searchQuery, onSearchChange, isAdmin = false, onToggleAdmin = () => {},
  user, onOpenExpertAdvice
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); onNavigate('shop'); };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 40,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '2px solid #dcfce7',
      boxShadow: scrolled ? '0 4px 24px rgba(22,163,74,0.12)' : '0 2px 12px rgba(22,163,74,0.06)',
      transition: 'box-shadow 0.3s ease',
    }}>
      {/* Announcement bar */}
      <div style={{ background: 'linear-gradient(90deg, #15803d, #16a34a, #15803d)', padding: '7px 0' }}>
        <div className="section-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, letterSpacing: '0.08em' }}>
              🌿 FARM DIRECT · ALL INDIA DELIVERY
            </span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, display: 'none' }} className="md-show">
              7-Day Root Moisture Protection · Free Care Guide with Every Order
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="button"
              onClick={onOpenExpertAdvice || (() => { window.location.href = 'tel:+917200826129'; })}
              style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#bbf7d0', fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Phone style={{ width: 12, height: 12 }} /> +91 72008 26129
            </button>
            <a
              href="https://wa.me/917200826129?text=Hello%20Veerika%20Rose%20Garden"
              target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'white', fontSize: 11, fontWeight: 600, textDecoration: 'none', background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 999 }}
            >
              <MessageSquare style={{ width: 11, height: 11 }} /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="section-container" style={{ padding: '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* Logo */}
          <div onClick={() => onNavigate('home')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
              border: '2px solid #16a34a',
              boxShadow: '0 0 0 2px #dcfce7',
              flexShrink: 0,
            }}>
              <img src="/logo.png" alt="Veerika Rose Garden" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
                color: 'var(--text-dark)', margin: 0, lineHeight: 1.15, whiteSpace: 'nowrap'
              }}>
                Veerika <em style={{ color: 'var(--color-rose)', fontStyle: 'italic' }}>Rose Garden</em>
              </h1>
              <p style={{ fontFamily: 'var(--font-tamil)', fontSize: 9, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap' }} className="sm-show">
                வீரிகா ரோஜா கார்டன்
              </p>
            </div>
          </div>

          {/* Search — desktop */}
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, maxWidth: 460, position: 'relative', display: 'none' }} className="lg-show-flex">
            <Search style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-light)' }} />
            <input
              type="text"
              placeholder="Search plants in English, தமிழ், or Scientific name..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="input-bright"
              style={{ paddingLeft: 38, paddingRight: 90 }}
            />
            <button type="submit" style={{
              position: 'absolute', right: 4, top: 4, bottom: 4, padding: '0 14px',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: 'white', border: 'none', borderRadius: 9,
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>
              SEARCH
            </button>
          </form>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>

            {onOpenExpertAdvice && (
              <button onClick={onOpenExpertAdvice} className="sm-show-flex" style={{
                display: 'none', alignItems: 'center', gap: 6, padding: '6px 12px',
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                border: '1.5px solid #fcd34d', borderRadius: 999,
                color: '#d97706', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s ease', flexShrink: 0,
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,158,11,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <Sparkles style={{ width: 13, height: 13 }} />
                <span>Expert AI</span>
              </button>
            )}

            {/* Admin button — desktop */}
            {user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'MANAGER') ? (
              <button onClick={onToggleAdmin} title="Admin Panel" className="sm-show-flex" style={{
                display: 'none', alignItems: 'center', gap: 6, padding: '6px 10px',
                background: isAdmin ? '#fef3c7' : 'white',
                border: '1.5px solid #fcd34d', borderRadius: 10,
                color: '#d97706', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(245,158,11,0.15)', flexShrink: 0,
              }}>
                <LayoutDashboard style={{ width: 13, height: 13 }} />
                <span>{isAdmin ? 'Exit Admin' : 'Admin'}</span>
              </button>
            ) : (
              <button onClick={() => onNavigate('admin')} title="Staff Login" className="sm-show-flex" style={{
                display: 'none', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32,
                background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 10,
                color: '#9ca3af', cursor: 'pointer', flexShrink: 0,
                fontSize: 14,
              }}>⚙</button>
            )}

            <button onClick={() => onNavigate('account')} title={user ? user.name : "Login / Sign Up"} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px',
              background: user ? '#ecfdf5' : '#f0fdf4',
              border: `1.5px solid ${user ? '#a7f3d0' : '#86efac'}`,
              borderRadius: 10,
              color: '#15803d', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#16a34a'; (e.currentTarget as HTMLElement).style.color = '#15803d'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = user ? '#a7f3d0' : '#86efac'; (e.currentTarget as HTMLElement).style.color = '#15803d'; }}
            >
              <UserIcon style={{ width: 14, height: 14, flexShrink: 0 }} />
              {user ? (
                <span style={{ maxWidth: 55, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                  {user.name.split(' ')[0]}
                </span>
              ) : (
                <>
                  <span className="mobile-show-inline sm-hidden" style={{ display: 'none' }}>Login</span>
                  <span className="sm-show-inline" style={{ display: 'none' }}>Login / Sign Up</span>
                </>
              )}
            </button>

            <button onClick={() => onNavigate('account', { tab: 'wishlist' })} title="Wishlist" style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: wishlistCount > 0 ? '#ffe4e6' : 'var(--bg-soft)',
              border: `1.5px solid ${wishlistCount > 0 ? '#fecdd3' : '#d1fae5'}`,
              borderRadius: 10, color: wishlistCount > 0 ? '#e11d48' : 'var(--text-muted)',
              cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease', flexShrink: 0,
            }}>
              <Heart style={{ width: 14, height: 14, fill: wishlistCount > 0 ? '#e11d48' : 'none' }} />
              {wishlistCount > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, background: '#f43f5e', color: 'white', fontSize: 9, fontWeight: 700, width: 15, height: 15, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {wishlistCount}
                </span>
              )}
            </button>

            <button onClick={onOpenCart} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              border: 'none', borderRadius: 10, color: 'white',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(22,163,74,0.3)', flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 22px rgba(22,163,74,0.45)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(22,163,74,0.3)'; }}
            >
              <ShoppingBag style={{ width: 14, height: 14 }} />
              <span>{cartCount}</span>
              <span className="sm-show" style={{ display: 'none' }}>Cart</span>
            </button>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mobile-show" style={{
              width: 32, height: 32, display: 'none', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-soft)', border: '1.5px solid #d1fae5', borderRadius: 10,
              color: 'var(--text-dark)', cursor: 'pointer', flexShrink: 0,
            }}>
              {mobileMenuOpen ? <X style={{ width: 16, height: 16 }} /> : <Menu style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>

        {/* Mobile Quick Account Bar */}
        <div className="mobile-show" style={{ display: 'none', marginTop: 8, padding: '6px 12px', background: user ? '#f0fdf4' : 'linear-gradient(90deg, #ecfdf5, #f0fdf4)', border: '1px solid #bbf7d0', borderRadius: 10, alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
          {user ? (
            <>
              <span style={{ color: '#166534' }}>👤 Hello, <strong>{user.name}</strong></span>
              <button onClick={() => onNavigate('account')} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                My Orders
              </button>
            </>
          ) : (
            <>
              <span style={{ color: '#166534' }}>🔑 Please Login to Order</span>
              <button onClick={() => onNavigate('account')} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                Login / Sign Up
              </button>
            </>
          )}
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearchSubmit} style={{ marginTop: 8, position: 'relative', display: 'none' }} className="mobile-show">
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-light)' }} />
          <input type="text" placeholder="Search plants..." value={searchQuery} onChange={e => onSearchChange(e.target.value)} className="input-bright" style={{ paddingLeft: 34, paddingRight: 72 }} />
          <button type="submit" style={{ position: 'absolute', right: 4, top: 4, bottom: 4, padding: '0 12px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>GO</button>
        </form>
      </div>

      {/* Category strip */}
      {categories.length > 0 && (
        <div style={{ borderTop: '1px solid #f0fdf4', overflowX: 'auto', background: '#f8faf6' }} className="no-scrollbar">
          <div className="section-container" style={{ padding: '8px 24px' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { onSelectCategory(undefined); onNavigate('shop'); }} className={`cat-pill${activeCategory === undefined ? ' active' : ''}`} style={{ fontSize: 11 }}>All Plants</button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => { onSelectCategory(cat.id); onNavigate('shop'); }} className={`cat-pill${activeCategory === cat.id ? ' active' : ''}`} style={{ fontSize: 11 }}>
                  {cat.name} <span style={{ opacity: 0.7, fontSize: 10 }}>({cat.tamilName})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div style={{ background: 'white', borderTop: '2px solid #dcfce7', padding: '16px 20px' }}>
          {/* Mobile Login / User Banner */}
          <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f0fdf4', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', padding: '10px 14px', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#166534' }}>👤 {user.name}</p>
                  <p style={{ margin: 0, fontSize: 10, color: '#15803d' }}>{user.email || user.phone || 'Customer'}</p>
                </div>
                <button onClick={() => { onNavigate('account'); setMobileMenuOpen(false); }} style={{ padding: '6px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  My Account
                </button>
              </div>
            ) : (
              <button
                onClick={() => { onNavigate('account'); setMobileMenuOpen(false); }}
                style={{
                  width: '100%', padding: '12px', background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 12px rgba(22,163,74,0.25)', cursor: 'pointer'
                }}
              >
                <UserIcon style={{ width: 16, height: 16 }} />
                <span>🔑 Login / Sign Up to Order</span>
              </button>
            )}

            {/* Expert AI button in mobile drawer */}
            {onOpenExpertAdvice && (
              <button onClick={() => { onOpenExpertAdvice(); setMobileMenuOpen(false); }} style={{
                width: '100%', padding: '10px', background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                border: '1.5px solid #fcd34d', borderRadius: 12, color: '#d97706', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'
              }}>
                <Sparkles style={{ width: 15, height: 15 }} />
                <span>✨ Ask Plant Expert AI</span>
              </button>
            )}

            {/* Admin button in mobile drawer */}
            {user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'MANAGER') && (
              <button onClick={() => { onToggleAdmin(); setMobileMenuOpen(false); }} style={{
                width: '100%', padding: '10px', background: isAdmin ? '#fef3c7' : '#f8faf6',
                border: '1.5px solid #fcd34d', borderRadius: 12, color: '#d97706', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'
              }}>
                <LayoutDashboard style={{ width: 15, height: 15 }} />
                <span>{isAdmin ? 'Exit Admin Dashboard' : 'Open Admin Panel'}</span>
              </button>
            )}
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 10 }}>Categories</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button onClick={() => { onSelectCategory(undefined); onNavigate('shop'); setMobileMenuOpen(false); }} style={{ padding: '8px 12px', textAlign: 'left', borderRadius: 10, fontSize: 12, fontWeight: 600, background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', cursor: 'pointer' }}>All Plants</button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => { onSelectCategory(cat.id); onNavigate('shop'); setMobileMenuOpen(false); }} style={{ padding: '8px 12px', textAlign: 'left', borderRadius: 10, fontSize: 12, background: 'var(--bg-soft)', border: '1px solid #e5f0e0', color: 'var(--text-body)', cursor: 'pointer' }}>{cat.name}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0fdf4' }}>
            <button onClick={() => { onNavigate('policies'); setMobileMenuOpen(false); }} style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12, background: 'var(--bg-soft)', border: '1px solid #e5f0e0', color: 'var(--text-muted)', cursor: 'pointer' }}>Policies</button>
            <button onClick={() => { onNavigate('account'); setMobileMenuOpen(false); }} style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12, background: 'var(--bg-soft)', border: '1px solid #e5f0e0', color: 'var(--text-muted)', cursor: 'pointer' }}>My Account</button>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) { .md-show { display: inline !important; } }
        @media (min-width: 640px) { .sm-show { display: inline !important; } .sm-show-inline { display: inline !important; } .sm-show-flex { display: flex !important; } .sm-hidden { display: none !important; } }
        @media (max-width: 639px) { .mobile-show-inline { display: inline !important; } }
        @media (min-width: 1024px) { .lg-show-flex { display: flex !important; } }
        @media (max-width: 1023px) { .mobile-show { display: flex !important; } }
      `}</style>
    </header>
  );
};
