import React from 'react';
import { Product, Category, Banner } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ArrowRight, ChevronRight, Leaf } from 'lucide-react';

interface HomePageProps {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onOpenCareGuide: (product: Product) => void;
  onNavigate: (page: string, params?: any) => void;
  onSelectCategory: (catId: string) => void;
  onSearchTag: (tag: string) => void;
  onOpenExpertAdvice?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products, categories,
  onAddToCart, onViewDetails, onOpenCareGuide,
  onNavigate, onSelectCategory,
}) => {
  const activeCategories = categories
    .filter(c => c.isActive !== false)
    .sort((a, b) => (a.order ?? 1) - (b.order ?? 1));

  const displayCategories = (
    activeCategories.filter(c => c.isFeatured).length > 0
      ? activeCategories.filter(c => c.isFeatured)
      : activeCategories
  ).slice(0, 12);

  return (
    <div style={{ background: 'var(--bg-page)', paddingBottom: 60 }}>

      {/* ===== CATEGORIES ===== */}
      <section className="section-container" style={{ padding: '28px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div>
            <span className="section-label">Browse by Type</span>
            <div className="divider-green" />
            <h2 className="section-title" style={{ fontSize: 'clamp(20px, 3vw, 30px)', marginTop: 4 }}>
              Plant <em>Categories</em>
            </h2>
          </div>
          <button className="btn-outline-green" style={{ fontSize: 12, padding: '8px 16px' }} onClick={() => onNavigate('shop')}>
            View All <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {displayCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', background: 'white', border: '2px dashed #bbf7d0', borderRadius: 20 }}>
            <Leaf style={{ width: 36, height: 36, color: 'var(--color-green)', margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No categories yet. Add them in Admin Panel.</p>
          </div>
        ) : (
          <div className="hp-cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {displayCategories.map(cat => {
              const cName = (cat.name || '').toLowerCase();
              const cSlug = (cat.slug || '').toLowerCase();
              const cId = (cat.id || '').toLowerCase();

              const catProducts = products.filter(p => {
                const pCatId = (p.categoryId || '').toLowerCase();
                const pCatName = (p.categoryName || '').toLowerCase();
                return (
                  (pCatId && (pCatId === cId || pCatId === cSlug)) ||
                  (pCatName && (pCatName === cName || cName.includes(pCatName) || pCatName.includes(cName)))
                );
              });

              const plantCount = cat.productCount ?? (catProducts.length > 0 ? catProducts.length : 3);

              const discounts = catProducts
                .map(p => {
                  if (p.discount && p.discount > 0) return p.discount;
                  if (p.mrp && p.sellingPrice && p.mrp > p.sellingPrice) return Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100);
                  return 0;
                })
                .filter(d => d > 0);

              let maxDis = 20;
              if (discounts.length > 0) {
                maxDis = Math.max(...discounts);
              } else if (cSlug.includes('jasmine') || cName.includes('jasmine')) {
                maxDis = 40;
              } else if (cSlug.includes('rose') || cName.includes('rose')) {
                maxDis = 20;
              }

              return (
                <div key={cat.id} className="card-white group" style={{ overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => { onSelectCategory(cat.id); onNavigate('shop'); }}>
                  <div style={{ height: 110, overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={cat.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'}
                      alt={cat.name} loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                      className="group-hover-scale"
                      onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'; }}
                    />
                    <span style={{
                      position: 'absolute', top: 6, right: 6, zIndex: 10, fontSize: 9, fontWeight: 800,
                      background: 'linear-gradient(135deg, #e11d48, #be123c)', color: 'white',
                      padding: '2px 7px', borderRadius: 999,
                    }}>
                      {maxDis}% OFF
                    </span>
                  </div>
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>{cat.name}</h3>
                      <span style={{ fontSize: 9, color: 'var(--color-green)', fontWeight: 700 }}>{plantCount} plants</span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-tamil)', fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px' }}>{cat.tamilName}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-green-dark)', fontSize: 11, fontWeight: 700 }}>
                      Shop now <ArrowRight style={{ width: 10, height: 10 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== ALL PRODUCTS ===== */}
      <section className="section-container" style={{ padding: '36px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div>
            <span className="section-label">Our Collection</span>
            <div className="divider-green" />
            <h2 className="section-title" style={{ fontSize: 'clamp(20px, 3vw, 30px)', marginTop: 4 }}>
              All <em>Plants</em>
            </h2>
          </div>
          <button className="btn-outline-green" style={{ fontSize: 12, padding: '8px 16px' }} onClick={() => onNavigate('shop')}>
            Full Catalog <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div className="hp-product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {products.slice(0, 24).map(p => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onViewDetails={onViewDetails} onOpenCareGuide={onOpenCareGuide} />
          ))}
        </div>

        {products.length > 24 && (
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button className="btn-green" onClick={() => onNavigate('shop')}>
              View All {products.length} Plants <ArrowRight style={{ width: 15, height: 15 }} />
            </button>
          </div>
        )}
      </section>

      {/* Mobile responsive grid styles */}
      <style>{`
        @media (max-width: 640px) {
          .hp-cat-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .hp-product-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .hp-cat-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .hp-product-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </div>
  );
};
