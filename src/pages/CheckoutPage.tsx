import React, { useState } from 'react';
import { CartItem, ShippingAddress, PaymentMethod, User } from '../types';
import { ShieldCheck, Truck, ArrowLeft, Check, Lock, Smartphone, Home, MapPin, Building2, CreditCard } from 'lucide-react';

interface CheckoutPageProps {
  items: CartItem[];
  user?: User | null;
  onBackToCart: () => void;
  appliedCoupon: { code: string; discountAmount: number } | null;
  onPlaceOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    shippingAddress: ShippingAddress;
    paymentMethod: PaymentMethod;
  }) => Promise<{ success: boolean; orderId?: string; phonepePayUrl?: string; merchantTransactionId?: string; message?: string }>;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  user,
  onBackToCart,
  appliedCoupon,
  onPlaceOrder
}) => {
  const [step, setStep] = useState<1 | 2>(1); // 1: Address, 2: Payment
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Clean Address State
  const [address, setAddress] = useState<ShippingAddress>(() => ({
    fullName: user?.name || '',
    phone: user?.phone || '',
    alternatePhone: '',
    houseNo: '',
    street: '',
    villageTown: '',
    district: '',
    state: 'Tamil Nadu',
    pincode: '',
    landmark: '',
    addressType: 'Home'
  }));

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PHONEPE');

  const subtotal = items.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0);
  const totalPlantCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const shippingCharge = totalPlantCount === 0 ? 0 : 50 + (totalPlantCount - 1) * 10;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, subtotal + shippingCharge - discountAmount);

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPincode = address.pincode.trim();
    if (!address.fullName.trim() || !address.phone.trim() || !address.houseNo.trim() || !address.street.trim() || !address.villageTown.trim() || !address.district.trim() || !cleanPincode) {
      setErrorMsg('Please fill in all required address fields (Name, Phone, House No, Street, Village/Town, District, Pincode).');
      return;
    }
    if (!/^\d{6}$/.test(cleanPincode)) {
      setErrorMsg('Pincode must be exactly 6 digits (numbers only).');
      return;
    }
    setAddress(prev => ({ ...prev, pincode: cleanPincode }));
    setErrorMsg(null);
    setStep(2);
  };

  const handleFinalPlaceOrder = async () => {
    if (!user) {
      setErrorMsg('🔒 Login or Sign Up is required to complete your purchase.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      const rawPhone = (address.phone || user?.phone || '').replace(/\D/g, '');
      const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
      const cleanEmail = (user?.email && user.email.includes('@')) 
        ? user.email 
        : `cust${cleanPhone || Date.now()}@veerikanursery.com`;

      const res = await onPlaceOrder({
        customerName: address.fullName || user?.name || 'Valued Customer',
        customerPhone: cleanPhone || address.phone,
        customerEmail: cleanEmail,
        shippingAddress: {
          ...address,
          phone: cleanPhone || address.phone
        },
        paymentMethod
      });

      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.message || 'Failed to place order.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Checkout error occurred.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          onClick={onBackToCart}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Cart</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>PhonePe Secure Checkout</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 text-xs font-bold">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-800' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-emerald-700 text-white' : 'bg-slate-200'}`}>
            1
          </span>
          <span>Delivery Address</span>
        </div>

        <span className="text-slate-300">———</span>

        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-800' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-emerald-700 text-white' : 'bg-slate-200'}`}>
            2
          </span>
          <span>Payment Method (PhonePe)</span>
        </div>
      </div>

      {!user && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 shadow-sm">
          <div>
            <h4 className="font-extrabold text-sm flex items-center gap-1.5 text-amber-950">
              🔒 Account Login Required
            </h4>
            <p className="text-xs font-medium text-amber-800">
              Please sign in or create an account to place your plant order and track your delivery.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToCart}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs whitespace-nowrap transition-colors"
          >
            🔑 Go to Login / Sign Up
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Main Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step Form Column */}
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <form onSubmit={handleAddressSubmit} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-700" /> Village / City Shipping Address
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">House / Door No *</label>
                  <input
                    type="text"
                    required
                    value={address.houseNo}
                    onChange={(e) => setAddress({ ...address, houseNo: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Street / Gramam Name *</label>
                  <input
                    type="text"
                    required
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Village / Town *</label>
                  <input
                    type="text"
                    required
                    value={address.villageTown}
                    onChange={(e) => setAddress({ ...address, villageTown: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={address.district}
                    onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nearby Landmark (For Courier Driver)</label>
                <input
                  type="text"
                  placeholder="e.g. Near Pillaiyar Kovil / Bus Stand / Post Office"
                  value={address.landmark}
                  onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-2xl shadow-md transition-all pt-3"
              >
                PROCEED TO PAYMENT METHOD
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Select Payment Method</span>
                <button onClick={() => setStep(1)} className="text-emerald-700 hover:underline font-semibold text-xs">
                  Edit Address
                </button>
              </h3>

              {/* Payment Methods */}
              <div className="space-y-3">
                {/* PhonePe Option */}
                <div
                  onClick={() => setPaymentMethod('PHONEPE')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === 'PHONEPE'
                      ? 'border-[#5f259f] bg-purple-50/60 ring-2 ring-purple-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-8 h-8 bg-[#5f259f] text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    पे
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">PhonePe Payment Gateway (Recommended)</h4>
                      <span className="bg-purple-200 text-purple-900 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        100% Secure
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1">
                      Pay via PhonePe UPI, GPay, Paytm, QR Code Scan, RuPay Cards & All Indian NetBanking.
                    </p>
                  </div>
                </div>

                {/* Cash on Delivery Option */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === 'COD'
                      ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-8 h-8 bg-emerald-800 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    💵
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">Cash on Delivery (COD)</h4>
                      <span className="bg-emerald-100 text-emerald-900 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        Pay on Transit
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1">
                      Pay cash to courier driver upon plant arrival at your village/city address.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleFinalPlaceOrder}
                disabled={loading}
                className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>CONFIRM & PLACE ORDER (₹{grandTotal})</span>
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 text-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
              Order Items ({items.length})
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-2.5 items-center justify-between">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-10 h-10 object-cover rounded-lg border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate text-[11px]">{item.product.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Qty: {item.quantity} × ₹{item.product.sellingPrice}
                    </p>
                  </div>
                  <span className="font-bold text-slate-900">₹{item.product.sellingPrice * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge:</span>
                <span>{shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon ({appliedCoupon.code}):</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-300">
                <span>Grand Total:</span>
                <span className="text-emerald-800 text-base">₹{grandTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
