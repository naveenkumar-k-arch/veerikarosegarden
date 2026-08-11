import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { Heart, ShoppingBag, Star, Leaf, Plus, Check, ChevronRight, ChevronLeft } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onOpenCareGuide: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export interface CompactProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export const CompactProductCard: React.FC<CompactProductCardProps> = ({
  product, onAddToCart, onViewDetails, isWishlisted = false, onToggleWishlist
}) => {
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);

  const defaultImg = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80';
  const displayImg = imgError || !product.images[0] ? defaultImg : product.images[0];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    setAdded(true);
    onAddToCart(product);
    setTimeout(() => setAdded(false), 900);
  };

  return (
    <div
      className="compact-product-card"
      onClick={() => onViewDetails(product)}
      style={{
        width: 118,
        minWidth: 118,
        maxWidth: 118,
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        position: 'relative',
        scrollSnapAlign: 'start',
        flexShrink: 0,
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.15s ease',
      }}
    >
      {/* Top Left Category Tag Pill */}
      <div style={{ position: 'absolute', top: 4, left: 4, zIndex: 10, display: 'flex', gap: 3 }}>
        <span style={{
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          color: 'white',
          fontSize: 8,
          fontWeight: 700,
          padding: '1px 5px',
          borderRadius: 999,
          boxShadow: '0 1px 4px rgba(22,163,74,0.3)',
          whiteSpace: 'nowrap',
          maxWidth: 80,
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {product.categoryName || 'Plant'}
        </span>
      </div>

      {/* Wishlist Button top-right if enabled */}
      {onToggleWishlist && (
        <button
          onClick={e => { e.stopPropagation(); onToggleWishlist(product); }}
          style={{
            position: 'absolute', top: 4, right: 4, zIndex: 10,
            width: 20, height: 20, borderRadius: '50%',
            background: isWishlisted ? '#ffe4e6' : 'rgba(255,255,255,0.85)',
            border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Heart style={{ width: 10, height: 10, color: '#e11d48', fill: isWishlisted ? '#e11d48' : 'none' }} />
        </button>
      )}

      {/* Image Container */}
      <div style={{ position: 'relative', height: 90, overflow: 'hidden', background: '#f8fafc', flexShrink: 0 }}>
        <img
          src={displayImg}
          alt={product.name}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
        {product.stock === 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 9, fontWeight: 800, background: 'rgba(0,0,0,0.6)', padding: '1px 6px', borderRadius: 999 }}>Sold Out</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '6px 7px 8px', display: 'flex', flexDirection: 'column', flex: 1, gap: 2, justifyContent: 'space-between' }}>
        <div>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
            color: '#1e293b', margin: 0, lineHeight: 1.2, height: 26, overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
          }}>
            {product.name}
          </h3>
          {product.tamilName ? (
            <p style={{ fontFamily: 'var(--font-tamil)', fontSize: 8.5, color: '#94a3b8', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.tamilName}
            </p>
          ) : (
            <p style={{ fontSize: 8.5, color: '#94a3b8', margin: '1px 0 0' }}>Live Plant</p>
          )}
        </div>

        {/* Price & Green Plus Button */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 2 }}>
          <div>
            <span style={{ fontSize: 8, color: '#94a3b8', display: 'block', fontWeight: 500, lineHeight: 1 }}>From</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 1 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, color: '#15803d', lineHeight: 1 }}>
                ₹{product.sellingPrice}
              </span>
              {product.mrp > product.sellingPrice && (
                <span style={{ fontSize: 8, color: '#94a3b8', textDecoration: 'line-through' }}>
                  ₹{product.mrp}
                </span>
              )}
            </div>
          </div>

          {/* Plus Add Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: product.stock <= 0
                ? '#e2e8f0'
                : added
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : 'linear-gradient(135deg, #10b981, #059669)',
              color: product.stock <= 0 ? '#94a3b8' : 'white',
              border: 'none', cursor: product.stock <= 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: product.stock > 0 ? '0 2px 6px rgba(16,185,129,0.35)' : 'none',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            title="Add to Cart"
          >
            {added ? <Check style={{ width: 12, height: 12, strokeWidth: 3 }} /> : <Plus style={{ width: 14, height: 14, strokeWidth: 3 }} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export const HorizontalScrollRow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
  }, [children]);

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Left Scroll Arrow */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          style={{
            position: 'absolute', left: 2, top: '50%', transform: 'translateY(-50%)', zIndex: 20,
            width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.95)',
            border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}
          aria-label="Scroll Left"
        >
          <ChevronLeft style={{ width: 16, height: 16, color: '#1e293b' }} />
        </button>
      )}

      {/* Horizontal Scroll Row */}
      <div
        ref={containerRef}
        onScroll={checkScroll}
        className="mobile-horizontal-scroll"
      >
        {children}
      </div>

      {/* Right Scroll Arrow */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          style={{
            position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)', zIndex: 20,
            width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none', boxShadow: '0 2px 10px rgba(16,185,129,0.4)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}
          aria-label="Scroll Right"
        >
          <ChevronRight style={{ width: 16, height: 16, strokeWidth: 3 }} />
        </button>
      )}
    </div>
  );
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product, onAddToCart, onViewDetails, onOpenCareGuide,
  isWishlisted = false, onToggleWishlist
}) => {
  const [imgError, setImgError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const defaultImg = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80';
  const displayImg = imgError || !product.images[0] ? defaultImg : product.images[0];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    setIsAddingToCart(true);
    onAddToCart(product);
    setTimeout(() => setIsAddingToCart(false), 800);
  };

  return (
    <div
      className="product-card"
      onClick={() => onViewDetails(product)}
      style={{
        background: 'white',
        border: '1.5px solid #e5f0e0',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(22,163,74,0.06)',
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        position: 'relative',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(22,163,74,0.18)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(22,163,74,0.06)';
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
    >
      {/* Badges */}
      <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {product.discount > 0 && (
          <span style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)', color: 'white', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999, boxShadow: '0 2px 8px rgba(244,63,94,0.35)' }}>
            {product.discount}% OFF
          </span>
        )}
        {product.bestSeller && (
          <span style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999 }}>
            ★ Best
          </span>
        )}
      </div>

      {/* Wishlist */}
      {onToggleWishlist && (
        <button
          onClick={e => { e.stopPropagation(); onToggleWishlist(product); }}
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 10,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isWishlisted ? '#ffe4e6' : 'rgba(255,255,255,0.9)',
            border: `1.5px solid ${isWishlisted ? '#fecdd3' : '#e5f0e0'}`,
            borderRadius: '50%', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Heart style={{ width: 14, height: 14, color: '#e11d48', fill: isWishlisted ? '#e11d48' : 'none' }} />
        </button>
      )}

      {/* Image */}
      <div className="pc-img" style={{ position: 'relative', height: 160, overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={displayImg}
          alt={product.name}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to top, rgba(0,0,0,0.18), transparent)' }} />
        {/* Stock badge */}
        {product.stock === 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 800, background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: 999 }}>Sold Out</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="pc-body" style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Category + Rating */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-green)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {product.categoryName}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Star style={{ width: 11, height: 11, color: '#f59e0b', fill: '#f59e0b' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dark)' }}>{product.rating}</span>
          </div>
        </div>

        {/* Name */}
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
          color: 'var(--text-dark)', lineHeight: 1.25, margin: 0,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
        }}>
          {product.name}
        </h3>

        {product.tamilName && (
          <p style={{ fontFamily: 'var(--font-tamil)', fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
            {product.tamilName}
          </p>
        )}

        {/* Price Row */}
        <div style={{ marginTop: 'auto', paddingTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--color-green-dark)', lineHeight: 1 }}>
              ₹{product.sellingPrice}
            </span>
            {product.mrp > product.sellingPrice && (
              <span style={{ fontSize: 11, color: 'var(--text-light)', textDecoration: 'line-through' }}>₹{product.mrp}</span>
            )}
            {product.stock > 0 && product.stock <= 5 && (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '1px 5px', borderRadius: 4, marginLeft: 'auto' }}>
                {product.stock} left
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 8px',
              background: product.stock <= 0
                ? '#f3f4f6'
                : isAddingToCart
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : 'linear-gradient(135deg, #16a34a, #15803d)',
              border: 'none', borderRadius: 10,
              color: product.stock <= 0 ? '#9ca3af' : 'white',
              fontSize: 12, fontWeight: 700,
              cursor: product.stock <= 0 ? 'not-allowed' : 'pointer',
              boxShadow: product.stock > 0 ? '0 4px 14px rgba(22,163,74,0.3)' : 'none',
              transition: 'all 0.2s ease',
              minHeight: 40,
            }}
          >
            {isAddingToCart ? (
              <><span>✓</span> Added!</>
            ) : product.stock > 0 ? (
              <><ShoppingBag style={{ width: 14, height: 14 }} /> Add to Cart</>
            ) : (
              'Sold Out'
            )}
          </button>

          {/* Care Guide mini link */}
          <button
            onClick={e => { e.stopPropagation(); onOpenCareGuide(product); }}
            style={{
              width: '100%', marginTop: 5, padding: '5px',
              background: 'none', border: 'none',
              color: 'var(--color-green)', fontSize: 10, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            <Leaf style={{ width: 10, height: 10 }} /> Care Guide
          </button>
        </div>
      </div>

      {/* Mobile hover scale on image */}
      <style>{`
        .product-card:active { transform: scale(0.97) !important; transition: transform 0.1s ease !important; }
        .product-card:hover .pc-img img { transform: scale(1.06); }
        @media (max-width: 640px) {
          .pc-img { height: 140px !important; }
          .pc-body { padding: 8px 10px 10px !important; }
        }
      `}</style>
    </div>
  );
};

