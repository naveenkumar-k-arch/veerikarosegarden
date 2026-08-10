import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Truck, ShieldCheck, MapPin } from 'lucide-react';
import { calculateDeliveryFee } from '../utils/delivery';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  appliedCoupon: { code: string; discountAmount: number } | null;
  onApplyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  onRemoveCoupon: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewState, setPreviewState] = useState<string>('Tamil Nadu');

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const totalPlantCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const shippingFee = calculateDeliveryFee(items, previewState);
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, subtotal + shippingFee - couponDiscount);

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponMsg(null);

    const res = await onApplyCoupon(couponCode.trim());
    setCouponLoading(false);

    if (res.success) {
      setCouponMsg({ type: 'success', text: res.message });
      setCouponCode('');
    } else {
      setCouponMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-emerald-900 text-white flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-base sm:text-lg">Your Nursery Cart</h3>
            <span className="bg-emerald-700 text-emerald-100 text-xs px-2 py-0.5 rounded-full font-bold">
              {totalPlantCount} {totalPlantCount === 1 ? 'plant' : 'plants'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-emerald-800 rounded-full text-emerald-200 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Shipping Fee Policy & State Preview Selector Banner */}
        <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-emerald-900">
          <div className="flex items-center gap-1.5 min-w-0">
            <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="text-[11px] leading-tight">
              <span>Delivery: </span>
              <select
                value={previewState}
                onChange={(e) => setPreviewState(e.target.value)}
                className="bg-white border border-emerald-300 text-emerald-900 rounded font-bold px-1 py-0.5 text-[11px] focus:outline-none cursor-pointer"
              >
                <option value="Tamil Nadu">Tamil Nadu (₹60 base)</option>
                <option value="Karnataka">KA / KL / AP / PY (₹100 base)</option>
              </select>
            </div>
          </div>
          <span className="bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-md text-[11px]">
            ₹{shippingFee} Shipping
          </span>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain scrollbar-thin max-h-[calc(100vh-260px)] sm:max-h-none">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-700 text-base">Your cart is empty</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Explore our healthy rose plants, jasmine, fruit saplings and organic compost!
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs hover:bg-emerald-800"
              >
                Browse Nursery Catalog
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 items-center justify-between"
              >
                <img
                  src={item.product.images[0] || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80'}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 truncate">{item.product.name}</h4>
                  <p className="text-[11px] text-emerald-800 font-medium truncate">{item.product.tamilName}</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">₹{item.product.sellingPrice}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 text-slate-600 hover:bg-slate-100 rounded-l-lg"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2.5 text-xs font-bold text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= 20}
                      className="p-1 text-slate-600 hover:bg-slate-100 rounded-r-lg disabled:opacity-30 disabled:cursor-not-allowed"
                      title={item.quantity >= 20 ? "Maximum 20 plants per item" : "Increase quantity"}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {items.length > 0 && (
          <div className="p-4 pb-28 sm:pb-4 bg-slate-50 border-t border-slate-200 space-y-3">
            {/* Coupon Code Section */}
            <div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-100 text-emerald-900 p-2.5 rounded-xl text-xs font-semibold border border-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-emerald-700" />
                    Coupon '{appliedCoupon.code}' (-₹{appliedCoupon.discountAmount})
                  </span>
                  <button onClick={onRemoveCoupon} className="text-rose-600 hover:underline font-bold text-xs">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCouponSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon Code (e.g. WELCOME10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium uppercase focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponMsg && (
                <p className={`text-[11px] mt-1 font-semibold ${couponMsg.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {couponMsg.text}
                </p>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-200/80">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-slate-800">₹{subtotal}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping Charge:</span>
                {shippingFee === 0 ? (
                  <span className="font-bold text-emerald-700">FREE</span>
                ) : (
                  <span className="font-semibold text-slate-800">₹{shippingFee}</span>
                )}
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount:</span>
                  <span>-₹{appliedCoupon.discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-300">
                <span>Grand Total:</span>
                <span className="text-emerald-800">₹{grandTotal}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>PhonePe Encrypted Checkout • Safe Farm Transit</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
