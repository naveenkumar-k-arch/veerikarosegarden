import React from 'react';
import { Order } from '../types';
import { Flower2, Printer, ShieldCheck, Download } from 'lucide-react';

interface InvoicePrintProps {
  order: Order;
  onClose?: () => void;
}

export const InvoicePrint: React.FC<InvoicePrintProps> = ({ order, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white p-6 sm:p-10 max-w-3xl mx-auto border border-slate-200 rounded-3xl shadow-xl my-6 text-slate-800 space-y-6">
      {/* Top Action Header (hidden in print view) */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">Official Nursery Invoice</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Invoice Document Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="Veerika Rose Garden Logo" className="w-10 h-10 object-contain shrink-0" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Veerika Rose Garden</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">வீரிகா ரோஜா கார்டன் • Registered Nursery</p>
          <p className="text-xs text-slate-600">
            Pennagaram, Dharmapuri District, Tamil Nadu - 636810
          </p>
          <p className="text-xs text-slate-600">Phone: +91 63812 03534 • Email: nv01110612@gmail.com</p>
        </div>

        <div className="text-left sm:text-right space-y-1">
          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
            TAX INVOICE
          </span>
          <p className="font-mono text-xs font-bold text-slate-900 pt-1">Invoice ID: {order.id}</p>
          <p className="text-xs text-slate-500">
            Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          <p className="text-xs font-mono text-slate-600">PhonePe Txn: {order.merchantTransactionId}</p>
        </div>
      </div>

      {/* Customer & Shipping Information Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Billed & Shipped To:</h4>
          <p className="font-bold text-slate-800 text-sm">{order.shippingAddress.fullName}</p>
          <p className="text-slate-600">{order.shippingAddress.houseNo}, {order.shippingAddress.street}</p>
          <p className="text-slate-600">{order.shippingAddress.villageTown}, {order.shippingAddress.district}</p>
          <p className="text-slate-600">{order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
          <p className="text-slate-700 font-semibold mt-1">Phone: +91 {order.shippingAddress.phone}</p>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Payment & Delivery Details:</h4>
          <p><span className="text-slate-500">Payment Gateway:</span> <strong className={order.paymentMethod === 'COD' ? 'text-emerald-800' : (order.paymentMethod === 'QR_PAYMENT' || order.paymentMethod === 'UPI_DIRECT') ? 'text-indigo-900' : 'text-purple-900'}>{order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : (order.paymentMethod === 'QR_PAYMENT' || order.paymentMethod === 'UPI_DIRECT') ? 'Scan QR Code Payment (Receipt Uploaded)' : `PhonePe PG (${order.paymentMethod})`}</strong></p>
          <p><span className="text-slate-500">Payment Status:</span> <strong className="text-emerald-700">{order.paymentStatus}</strong></p>
          {order.phonepeProviderReferenceId && (
            <p><span className="text-slate-500">PhonePe Ref ID:</span> <strong className="font-mono text-[11px]">{order.phonepeProviderReferenceId}</strong></p>
          )}
          <p><span className="text-slate-500">Order Status:</span> <strong className="text-slate-800">{order.orderStatus}</strong></p>
          {order.trackingNumber && (
            <p><span className="text-slate-500">Courier Tracking:</span> <strong>{order.courierName} ({order.trackingNumber})</strong></p>
          )}
        </div>
      </div>

      {/* Itemized Products Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100/80 text-slate-700 uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3">SKU</th>
              <th className="py-2.5 px-3">Plant / Product Description</th>
              <th className="py-2.5 px-3 text-center">Qty</th>
              <th className="py-2.5 px-3 text-right">Rate</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {order.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{item.sku}</td>
                <td className="py-3 px-3">
                  <span className="font-bold text-slate-900 block">{item.name}</span>
                  <span className="text-emerald-800 text-[11px] font-medium">{item.tamilName}</span>
                </td>
                <td className="py-3 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                <td className="py-3 px-3 text-right font-medium text-slate-700">₹{item.price}</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">₹{item.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Breakdown */}
      <div className="flex justify-end pt-2">
        <div className="w-full max-w-xs space-y-2 text-xs text-slate-700">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-900">₹{order.subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>Courier ({order.courierName || 'Standard'}{order.courierBranch ? ` - ${order.courierBranch}` : ''}):</span>
            <span>{order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge}`}</span>
          </div>
          {Boolean(order.packingCharge) && (
            <div className="flex justify-between text-emerald-800 font-semibold">
              <span>Protective Packing ({order.packingOption === 'EXTRA_SECURE' ? 'Extra Secure' : 'Max Protection'}):</span>
              <span>+₹{order.packingCharge}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Coupon Discount:</span>
              <span>-₹{order.discount}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t-2 border-slate-300">
            <span>Grand Total:</span>
            <span className="text-emerald-800 text-base">₹{order.grandTotal}</span>
          </div>
        </div>
      </div>

      {/* Footer Terms & Sign Off */}
      <div className="pt-6 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row justify-between items-end gap-4">
        <div>
          <p className="font-bold text-slate-700">Terms & Conditions:</p>
          <p>• Live plants are shipped in ventilated moisture-retaining root protection boxes.</p>
          <p>• In case of transit damage, notify us within 24 hours with opening video for replacement.</p>
        </div>
        <div className="text-center sm:text-right shrink-0">
          <div className="w-24 h-10 border-b border-slate-400 mb-1 mx-auto sm:ml-auto"></div>
          <p className="font-bold text-slate-800">For Veerika Rose Garden</p>
          <p className="text-[10px] text-slate-400">Authorized Signature</p>
        </div>
      </div>
    </div>
  );
};
