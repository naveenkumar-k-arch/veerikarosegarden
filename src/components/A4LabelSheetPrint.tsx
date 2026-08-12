import React from 'react';
import { Order } from '../types';
import { Sprout, Printer, ArrowLeft, Download } from 'lucide-react';

interface A4LabelSheetPrintProps {
  orders: Order[];
  onClose: () => void;
  batchNumber?: string;
  sheetNumber?: string;
}

export const A4LabelSheetPrint: React.FC<A4LabelSheetPrintProps> = ({
  orders,
  onClose,
  batchNumber = '#005',
  sheetNumber = '#11106'
}) => {
  // Split orders into chunks of 4 for A4 pages
  const chunkSize = 4;
  const pages: Order[][] = [];
  for (let i = 0; i < orders.length; i += chunkSize) {
    pages.push(orders.slice(i, i + chunkSize));
  }

  const handlePrint = () => {
    window.print();
  };

  const formatAddress = (address: any) => {
    if (!address) return 'Address not available';
    if (typeof address === 'string') return address;
    const parts = [
      address.houseNo,
      address.street,
      address.villageTown,
      address.district,
      address.state,
      address.pincode
    ].filter(Boolean);
    return parts.join(', ');
  };

  const getPlantsCount = (order: Order) => {
    if (!order.items || order.items.length === 0) return 1;
    return order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-4 print:p-0 print:bg-white print:static">
      {/* Non-printed Top Action Toolbar */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-3.5 mb-4 flex items-center justify-between gap-3 print:hidden sticky top-2 z-10 border border-slate-200">
        <button
          onClick={onClose}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="text-center hidden sm:block">
          <h3 className="font-extrabold text-sm text-slate-900">A4 Label Sheet Preview</h3>
          <p className="text-[11px] text-slate-500">{orders.length} Orders • {pages.length} Page(s)</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Pages */}
      <div className="w-full max-w-4xl space-y-6 print:space-y-0 print:w-full">
        {pages.map((pageOrders, pageIndex) => (
          <div
            key={pageIndex}
            className="bg-white rounded-2xl print:rounded-none shadow-md print:shadow-none p-5 sm:p-6 border border-slate-200 print:border-none print:p-4 mx-auto w-full max-w-[210mm] min-h-[297mm] flex flex-col justify-between print:min-h-[297mm] print:h-[297mm] page-break-after"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Sheet Header */}
            <div className="border-b-2 border-emerald-800 pb-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                  <Sprout className="w-6 h-6 text-emerald-800" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-wide text-emerald-900 leading-none">
                    VRG NURSERY
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-600 mt-1">
                    Dharmapuri - 636813 | 📞 7904020006
                  </p>
                </div>
              </div>

              <div className="text-right text-[11px] font-medium text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-800">Label Sheet: {sheetNumber}</p>
                <p>Batch No : {batchNumber}</p>
                <p className="font-bold text-emerald-800">Total Orders : {pageOrders.length}</p>
              </div>
            </div>

            {/* 2x2 Grid Labels (4 per A4 page) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 flex-1">
              {pageOrders.map((order, orderIdx) => {
                const labelNumber = pageIndex * chunkSize + orderIdx + 1;
                const totalPlants = getPlantsCount(order);

                return (
                  <div
                    key={order.id || orderIdx}
                    className="border-2 border-slate-300 rounded-xl p-4 flex flex-col justify-between bg-slate-50/40 relative min-h-[110mm] print:min-h-[115mm]"
                  >
                    {/* Top Order Meta */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-[#14532d] text-white font-black text-xs flex items-center justify-center shrink-0">
                            {labelNumber}
                          </span>
                          <div>
                            <span className="font-mono font-black text-slate-900 text-sm block leading-none">
                              {order.id}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        <span className="font-extrabold text-emerald-900 text-xs bg-emerald-100 px-2 py-0.5 rounded-md">
                          ₹{order.grandTotal}
                        </span>
                      </div>

                      {/* Recipient Details */}
                      <div className="space-y-1 pt-1">
                        <p className="font-black text-slate-900 text-sm tracking-tight">
                          {order.customerName || order.shippingAddress?.fullName}
                        </p>
                        <p className="font-bold text-slate-800 text-xs">
                          +91 {order.customerPhone || order.shippingAddress?.phone}
                        </p>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1 line-clamp-4">
                          {formatAddress(order.shippingAddress)}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Plants Count and Details */}
                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        Plants: {totalPlants} Items
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {order.paymentMethod === 'COD' ? 'COD ORDER' : 'PREPAID UPI'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Pad remaining empty slots on last page if fewer than 4 */}
              {Array.from({ length: Math.max(0, 4 - pageOrders.length) }).map((_, emptyIdx) => (
                <div
                  key={`empty-${emptyIdx}`}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center text-slate-300 font-bold text-xs min-h-[110mm] print:min-h-[115mm]"
                >
                  Empty Slot
                </div>
              ))}
            </div>

            {/* Sheet Footer */}
            <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400 font-medium flex justify-between items-center">
              <span>Page {pageIndex + 1} of {pages.length}</span>
              <span>VRG Nursery Order Dispatch Label Sheet</span>
              <span>veerikarosegarden.com</span>
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Bottom Action Buttons for Mobile View matching 9.jpeg */}
      <div className="w-full max-w-md mt-4 p-3 bg-white rounded-2xl shadow-lg border border-slate-200 flex items-center gap-3 print:hidden sm:hidden sticky bottom-2">
        <button
          onClick={handlePrint}
          className="flex-1 py-3 bg-[#14532d] hover:bg-[#0f3d21] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center justify-center gap-1.5"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Print</span>
        </button>
      </div>
    </div>
  );
};
