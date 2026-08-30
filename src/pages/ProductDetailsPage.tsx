import React, { useState } from 'react';
import { Product, Review } from '../types';
import { Sun, Droplets, Flower2, Sprout, ShoppingBag, ShieldCheck, Star, Share2, Heart, ArrowLeft, Check, Truck, ThumbsUp } from 'lucide-react';

interface ProductDetailsPageProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
  onOpenCareGuide: (product: Product) => void;
  relatedProducts: Product[];
  onSelectProduct: (p: Product) => void;
  reviews: Review[];
  onSubmitReview: (review: { rating: number; title: string; comment: string; userName: string }) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  product,
  onBack,
  onAddToCart,
  onBuyNow,
  onOpenCareGuide,
  relatedProducts,
  onSelectProduct,
  reviews,
  onSubmitReview,
  isWishlisted = false,
  onToggleWishlist
}) => {
  const [selectedImg, setSelectedImg] = useState<string>(product.images[0] || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80');
  const [qty, setQty] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  // New review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const handleAddToCartClick = () => {
    onAddToCart(product, qty);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} (${product.tamilName}) at Veerika Rose Garden Nursery!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newComment || !userName) return;

    onSubmitReview({
      rating: newRating,
      title: newTitle,
      comment: newComment,
      userName
    });

    setReviewSuccess(true);
    setNewTitle('');
    setNewComment('');
    setTimeout(() => {
      setReviewSuccess(false);
      setShowReviewForm(false);
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Nursery Catalog</span>
      </button>

      {/* Main Product Layout */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gallery Column */}
        <div className="space-y-4">
          <div className="aspect-[16/9] sm:aspect-[16/10] max-h-72 sm:max-h-80 w-full rounded-2xl overflow-hidden bg-slate-100 relative border border-slate-200 shadow-xs flex items-center justify-center">
            <img src={selectedImg} alt={product.name} className="w-full h-full object-cover object-center" decoding="async" />
            <span className="absolute top-3 left-3 bg-emerald-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
              {product.categoryName}
            </span>

            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={() => {
                  if (onToggleWishlist) onToggleWishlist(product);
                  else window.dispatchEvent(new CustomEvent('toggleWishlist', { detail: product }));
                }}
                className={`p-2 rounded-full shadow-xs transition-all cursor-pointer ${isWishlisted ? 'bg-rose-100 text-rose-600' : 'bg-white/90 hover:bg-white text-slate-700'}`}
                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : 'text-slate-700'}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-2 bg-white/90 hover:bg-white text-slate-700 rounded-full shadow-xs transition-colors cursor-pointer"
                title="Share Product"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
            {copied && (
              <span className="absolute top-14 right-3 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">
                Link Copied!
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(img)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImg === img ? 'border-emerald-700 ring-2 ring-emerald-600/30' : 'border-slate-200 opacity-70'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}

          {/* Plant Care Summary Box */}
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 space-y-3 text-xs text-emerald-950">
            <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
              <Sprout className="w-4 h-4 text-emerald-700" /> Plant Specifications
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-medium">
              <div><span className="text-slate-500 block">Height:</span> <strong>{product.plantHeight}</strong></div>
              <div><span className="text-slate-500 block">Pot Size:</span> <strong>{product.potSize}</strong></div>
              <div><span className="text-slate-500 block">Sunlight:</span> <strong>{product.sunlight}</strong></div>
              <div><span className="text-slate-500 block">Water:</span> <strong>{product.waterRequirement}</strong></div>
              <div><span className="text-slate-500 block">Flowering:</span> <strong>{product.floweringSeason}</strong></div>
              <div><span className="text-slate-500 block">SKU:</span> <strong className="font-mono text-[11px]">{product.sku}</strong></div>
            </div>
          </div>
        </div>

        {/* Details Column */}
        <div className="space-y-6">
          <div className="space-y-2 border-b border-slate-100 pb-4">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {product.name}
            </h1>
            <p className="text-base font-bold text-emerald-800">
              {product.tamilName}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-lg border border-amber-200 text-xs font-bold">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{product.rating}</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">({product.reviewCount} customer reviews)</span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">₹{product.sellingPrice}</span>
              {product.mrp > product.sellingPrice && (
                <span className="text-base text-slate-400 line-through">₹{product.mrp}</span>
              )}
              {((product.discount > 0) || (product.mrp > product.sellingPrice)) && (
                <span className="bg-rose-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-full">
                  Save {product.discount > 0 ? product.discount : Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            {product.description}
          </p>

          {/* Quantity & CTAs */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-1.5 text-slate-700 hover:bg-slate-200 rounded-l-xl font-bold"
                >
                  -
                </button>
                <span className="px-4 text-xs font-bold text-slate-900">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="px-3 py-1.5 text-slate-700 hover:bg-slate-200 rounded-r-xl font-bold"
                >
                  +
                </button>
              </div>

              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${product.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={handleAddToCartClick}
                disabled={product.stock <= 0}
                className={`py-3.5 px-3 ${addedSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'} disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer`}
              >
                {addedSuccess ? <Check className="w-4 h-4 text-white" /> : <ShoppingBag className="w-4 h-4" />}
                <span>{addedSuccess ? '✓ ADDED!' : 'ADD TO CART'}</span>
              </button>

              <button
                onClick={() => onBuyNow(product, qty)}
                disabled={product.stock <= 0}
                className="py-3.5 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md cursor-pointer"
              >
                <span>BUY NOW (PHONEPE)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onToggleWishlist) onToggleWishlist(product);
                  else window.dispatchEvent(new CustomEvent('toggleWishlist', { detail: product }));
                }}
                className={`py-3.5 px-3 border rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                  isWishlisted 
                    ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100' 
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : 'text-rose-600'}`} />
                <span>{isWishlisted ? 'WISHLISTED ❤️' : 'ADD TO WISHLIST'}</span>
              </button>
            </div>
          </div>

          {/* Delivery & Care Badges */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Ships safely in 24-48 hours via fast courier to all villages & towns.</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>PhonePe Encrypted Payments • 100% Organic Live Saplings.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews & Submit Form Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Customer Reviews & Ratings</h3>
            <p className="text-xs text-slate-500">Real feedback from gardeners across South India</p>
          </div>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            {showReviewForm ? 'Cancel' : 'Write a Review'}
          </button>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
            <h4 className="font-bold text-sm text-slate-800">Share Your Gardening Experience</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Your Name & City:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh K. (Madurai)"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rating (1 to 5 Stars):</label>
                <select
                  value={newRating}
                  onChange={(e) => setNewRating(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value={5}>5 Stars ★★★★★</option>
                  <option value={4}>4 Stars ★★★★☆</option>
                  <option value={3}>3 Stars ★★★☆☆</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Review Title:</label>
              <input
                type="text"
                required
                placeholder="e.g. Beautiful flowers bloomed within 10 days!"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Detailed Review Comment:</label>
              <textarea
                rows={3}
                required
                placeholder="Describe how the plant packaging arrived, root condition, and flowering status..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-800"
            >
              Submit Review
            </button>

            {reviewSuccess && (
              <p className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                <Check className="w-4 h-4" /> Review submitted successfully!
              </p>
            )}
          </form>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No reviews submitted yet. Be the first to review this plant!</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{rev.userName}</span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    {'★'.repeat(rev.rating)}
                  </div>
                </div>
                <h5 className="font-bold text-slate-800">{rev.title}</h5>
                <p className="text-slate-600 leading-relaxed">{rev.comment}</p>
                {rev.reply && (
                  <div className="p-3 bg-emerald-100/60 rounded-xl text-emerald-950 font-medium text-[11px] border border-emerald-200">
                    <strong>Nursery Reply:</strong> {rev.reply}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
