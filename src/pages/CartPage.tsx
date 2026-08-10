import React, { useState } from 'react';
import { CartItem, Product, User } from '../types';
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, Tag, Truck, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { INDIAN_STATES, isTamilNadu } from '../utils/delivery';
import { computeOrderTotals } from '../utils/orderTotals';

interface CartPageProps {
  items: CartItem[];
  user?: User | null;
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
  appliedCoupon: { code: string; discountAmount: number } | null;
  onApplyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  onRemoveCoupon: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  items,
  user,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onContinueShopping,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedState, setSelectedState] = useState<string>('Tamil Nadu');
  const [selectedPot, setSelectedPot] = useState<'NONE' | '6_INCH' | '8_INCH'>('NONE');

  const {
    subtotal,
    totalPlantCount,
    potCharge,
    shippingFee,
    discountAmount,
    grandTotal
  } = computeOrderTotals({
    items,
    state: selectedState,
    selectedPot,
    appliedCoupon
  });

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

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Your Plant Cart is Empty</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mt-2 font-medium">
            Explore our vast nursery collection of fresh live rose plants, combos, and gardening essentials.
          </p>
        </div>
        <button
          onClick={onContinueShopping}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-emerald-700/20 transition-all cursor-pointer"
        >
          <span>Explore Rose Collection</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-28 sm:pb-12 space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          onClick={onContinueShopping}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Veerika Nursery Guarantee</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>Your Shopping Cart</span>
            <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-2.5 py-0.5 rounded-full">
              {totalPlantCount} {totalPlantCount === 1 ? 'plant' : 'plants'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Review your plant order items before proceeding to secure checkout.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {items.map((item) => (
              <div key={item.product.id} className="p-4 sm:p-5 flex gap-4 items-center">
                <img
                  src={item.product.images?.[0] || '/products/double-delight.jpeg'}
                  alt={item.product.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border border-slate-200/80 shrink-0 bg-slate-50"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    {item.product.name}
                  </h3>
                  {item.product.tamilName && (
                    <p className="text-xs font-medium text-emerald-700 font-sans">
                      {item.product.tamilName}
                    </p>
                  )}
                  <p className="text-xs font-extrabold text-slate-900">
                    ₹{item.product.sellingPrice}{' '}
                    {item.product.mrp > item.product.sellingPrice && (
                      <span className="line-through text-slate-400 font-normal text-[11px] ml-1">
                        ₹{item.product.mrp}
                      </span>
                    )}
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 font-extrabold text-xs text-slate-900 font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove plant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-right font-extrabold text-slate-900 text-sm sm:text-base shrink-0">
                  ₹{item.product.sellingPrice * item.quantity}
                </div>
              </div>
            ))}
          </div>

          {/* Plant Pot Requirement Selection */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <span>🪴</span> Select Pot Option:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div
                onClick={() => setSelectedPot('NONE')}
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPot === 'NONE'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <p className="font-bold text-[11px]">🌱 No pot required</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Reduced soil weight</p>
                <p className="text-emerald-700 font-extrabold text-xs mt-1">₹0</p>
              </div>

              <div
                onClick={() => setSelectedPot('6_INCH')}
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPot === '6_INCH'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <p className="font-bold text-[11px]">🪴 Below 6 inch pot</p>
                <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Includes free delivery</p>
                <p className="text-slate-900 font-extrabold text-xs mt-1">+₹{99 * totalPlantCount}</p>
              </div>

              <div
                onClick={() => setSelectedPot('8_INCH')}
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPot === '8_INCH'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <p className="font-bold text-[11px]">🪴 Above 6 inch pot</p>
                <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Includes free delivery</p>
                <p className="text-slate-900 font-extrabold text-xs mt-1">+₹{199 * totalPlantCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary & Coupon Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-xs space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-200 pb-3 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs text-slate-500 font-medium">({items.length} items)</span>
            </h3>

            {/* Delivery State Selector */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                🚚 Delivery State Rate Preview:
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st} {isTamilNadu(st) ? '(₹60 base shipping)' : '(₹100 base shipping)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Coupon Code Section */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-700" />
                <span>Apply Coupon / Discount Code</span>
              </label>

              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900">
                  <div>
                    <p className="font-extrabold text-xs">CODE: {appliedCoupon.code}</p>
                    <p className="text-[10px] text-emerald-700 font-medium">You saved ₹{appliedCoupon.discountAmount}!</p>
                  </div>
                  <button
                    onClick={onRemoveCoupon}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCouponSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </form>
              )}

              {couponMsg && (
                <p className={`text-[11px] font-bold ${couponMsg.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {couponMsg.text}
                </p>
              )}
            </div>

            {/* Calculations */}
            <div className="pt-3 border-t border-slate-200 space-y-2.5 text-slate-600">
              <div className="flex justify-between items-center">
                <span className="font-medium">Subtotal:</span>
                <span className="font-bold text-slate-900">₹{subtotal}</span>
              </div>

              {potCharge > 0 && (
                <div className="flex justify-between items-center text-emerald-800">
                  <span className="font-medium">🪴 Pot Charge ({totalPlantCount} pots):</span>
                  <span className="font-bold text-emerald-700">+₹{potCharge}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="font-medium">Delivery Fee:</span>
                <span className="font-bold text-slate-900">
                  {selectedPot !== 'NONE' ? (
                    <span className="text-emerald-700 font-extrabold">FREE (With Pot)</span>
                  ) : (
                    shippingFee === 0 ? 'FREE' : `₹${shippingFee}`
                  )}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-semibold items-center">
                  <span>Coupon Discount:</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-300 items-center">
                <span>Grand Total:</span>
                <span className="text-emerald-800 text-xl font-extrabold">₹{grandTotal}</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onProceedToCheckout}
              className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-emerald-700/25 transition-all flex items-center justify-center gap-2 cursor-pointer pt-3.5"
            >
              <span>PROCEED TO CHECKOUT (₹{grandTotal})</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
