import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { Sun, Droplets, Heart, ShoppingBag, Eye, Star, Leaf } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onOpenCareGuide: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product, onAddToCart, onViewDetails, onOpenCareGuide,
  isWishlisted = false, onToggleWishlist
}) => {
  const [imgError, setImgError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const defaultImg = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80';
  const displayImg = imgError || !product.images[0] ? defaultImg : product.images[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10; // max -10deg to 10deg
    const rotateY = ((x - centerX) / centerX) * 10;   // max -10deg to 10deg
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    setIsAddingToCart(true);
    onAddToCart(product);
    setTimeout(() => setIsAddingToCart(false), 800);
  };

  return (
    <div style={{ perspective: '1000px' }}>
      <div
        ref={cardRef}
        className="group preserve-3d"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          background: 'white',
          border: '1.5px solid #e5f0e0',
          borderRadius: 20,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          boxShadow: rotate.x !== 0 || rotate.y !== 0
            ? '-8px 16px 36px rgba(22,163,74,0.18), 0 6px 16px rgba(0,0,0,0.06)'
            : '0 2px 12px rgba(22,163,74,0.06)',
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateZ(${rotate.x !== 0 ? 12 : 0}px)`,
          transition: rotate.x === 0 && rotate.y === 0 ? 'transform 0.5s ease, box-shadow 0.5s ease' : 'transform 0.1s ease-out',
        }}
        onClick={() => onViewDetails(product)}
      >
        {/* Badges (Pop out in 3D) */}
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: 5,
          transform: 'translateZ(25px)', transition: 'transform 0.3s ease'
        }}>
          {product.discount > 0 && <span className="badge-rose" style={{ fontWeight: 800, boxShadow: '0 4px 10px rgba(244,63,94,0.3)' }}>{product.discount}% OFF</span>}
          {product.bestSeller && <span className="badge-amber" style={{ boxShadow: '0 4px 10px rgba(245,158,11,0.25)' }}>★ Best Seller</span>}
          {product.featured && !product.bestSeller && <span className="badge-green" style={{ boxShadow: '0 4px 10px rgba(22,163,74,0.25)' }}>✦ Featured</span>}
        </div>

        {/* Wishlist */}
        {onToggleWishlist && (
          <button onClick={e => { e.stopPropagation(); onToggleWishlist(product); }} style={{
            position: 'absolute', top: 12, right: 12, zIndex: 10,
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isWishlisted ? '#ffe4e6' : 'rgba(255,255,255,0.92)',
            border: `1.5px solid ${isWishlisted ? '#fecdd3' : '#e5f0e0'}`,
            borderRadius: '50%', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transform: 'translateZ(30px)',
            transition: 'all 0.2s ease',
          }}>
            <Heart style={{ width: 16, height: 16, color: '#e11d48', fill: isWishlisted ? '#e11d48' : 'none' }} />
          </button>
        )}

        {/* Image with 3D Depth */}
        <div className="pc-image-wrap" style={{ position: 'relative', height: 200, overflow: 'hidden', flexShrink: 0, transformStyle: 'preserve-3d' }}>
          <img
            src={displayImg} alt={product.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
            className="group-hover-scale"
          />
          <div className="product-img-overlay" />
          {/* Scientific name */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, rgba(21,128,61,0.85), transparent)',
            padding: '18px 12px 8px', fontSize: 10, color: 'rgba(255,255,255,0.95)',
            fontStyle: 'italic', fontFamily: 'var(--font-display)', textAlign: 'center',
            transform: 'translateZ(15px)'
          }}>
            {product.scientificName}
          </div>
          {/* Quick actions */}
          <div className="product-quick-actions" style={{ transform: 'translateX(-50%) translateZ(35px)' }} onClick={e => e.stopPropagation()}>
            <button onClick={e => { e.stopPropagation(); onViewDetails(product); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: 999, color: '#15803d', fontSize: 11, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <Eye style={{ width: 12, height: 12 }} /> View
            </button>
            <button onClick={e => { e.stopPropagation(); onOpenCareGuide(product); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', background: 'linear-gradient(135deg, #22c55e, #15803d)', border: 'none', borderRadius: 999, color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
              <Leaf style={{ width: 12, height: 12 }} /> Care
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="pc-body" style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8, transform: 'translateZ(15px)' }}>
          {/* Category + Rating */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-green)', textTransform: 'uppercase' }}>{product.categoryName}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Star style={{ width: 13, height: 13, color: '#f59e0b', fill: '#f59e0b' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dark)' }}>{product.rating}</span>
              <span style={{ fontSize: 10, color: 'var(--text-light)' }}>({product.reviewCount})</span>
            </div>
          </div>

          {/* Name */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.3, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
              {product.name}
            </h3>
            {product.tamilName && <p style={{ fontFamily: 'var(--font-tamil)', fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>{product.tamilName}</p>}
          </div>

          {/* Care strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderTop: '1px solid #f0fdf4', borderBottom: '1px solid #f0fdf4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
              <Sun style={{ width: 12, height: 12, color: '#f59e0b', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>{product.sunlight}</span>
            </div>
            <span style={{ color: '#d1fae5' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
              <Droplets style={{ width: 12, height: 12, color: '#60a5fa', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>{product.waterRequirement}</span>
            </div>
          </div>

          {/* Price + CTA */}
          <div style={{ marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--color-green-dark)' }}>₹{product.sellingPrice}</span>
                {product.mrp > product.sellingPrice && <span style={{ fontSize: 12, color: 'var(--text-light)', textDecoration: 'line-through' }}>₹{product.mrp}</span>}
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                padding: '3px 8px', borderRadius: 999,
                background: product.stock > 10 ? '#dcfce7' : product.stock > 0 ? '#fef3c7' : '#ffe4e6',
                color: product.stock > 10 ? '#15803d' : product.stock > 0 ? '#d97706' : '#e11d48',
                border: `1px solid ${product.stock > 10 ? '#bbf7d0' : product.stock > 0 ? '#fde68a' : '#fecdd3'}`,
              }}>
                {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `${product.stock} left` : 'Sold Out'}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '12px',
                background: product.stock <= 0
                  ? '#f3f4f6'
                  : isAddingToCart
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                  : 'linear-gradient(135deg, #16a34a, #15803d)',
                border: 'none', borderRadius: 14,
                color: product.stock <= 0 ? '#9ca3af' : 'white',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
                cursor: product.stock <= 0 ? 'not-allowed' : 'pointer',
                boxShadow: product.stock > 0 ? '0 6px 20px rgba(22,163,74,0.35)' : 'none',
                transform: 'translateZ(20px)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={e => { if (product.stock > 0) { (e.currentTarget as HTMLElement).style.transform = 'translateZ(25px) scale(1.02)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 25px rgba(22,163,74,0.45)'; }}}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateZ(20px)'; (e.currentTarget as HTMLElement).style.boxShadow = product.stock > 0 ? '0 6px 20px rgba(22,163,74,0.35)' : 'none'; }}
            >
              <ShoppingBag style={{ width: 15, height: 15 }} />
              {isAddingToCart ? '✓ Added!' : product.stock > 0 ? 'Add to Cart' : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .group-hover-scale {}
        .group:hover .group-hover-scale { transform: scale(1.08) translateZ(10px); }
        @media (max-width: 640px) {
          .pc-image { height: 160px !important; }
          .pc-body { padding: 10px 12px 12px !important; }
          .pc-title { font-size: 12px !important; }
          .pc-price { font-size: 16px !important; }
          .pc-add-btn { padding: 9px !important; font-size: 11px !important; }
        }
      `}</style>
    </div>
  );
};
