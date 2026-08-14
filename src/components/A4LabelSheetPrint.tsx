import React, { useState } from 'react';
import { Order } from '../types';
import { Sprout, Printer, ArrowLeft, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Split orders into chunks of 4 for A4 pages
  const chunkSize = 4;
  const pages: Order[][] = [];
  for (let i = 0; i < orders.length; i += chunkSize) {
    pages.push(orders.slice(i, i + chunkSize));
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      const sheetContainer = document.getElementById('printable-label-sheets-container');
      if (!sheetContainer) {
        window.print();
        return;
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageElements = sheetContainer.querySelectorAll('.a4-sheet-page');

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i] as HTMLElement;
        const canvas = await html2canvas(pageEl, {
          scale: 2, // High resolution crisp text
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1024,
          scrollX: 0,
          scrollY: 0
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      const cleanBatch = batchNumber.replace(/[^a-zA-Z0-9]/g, '');
      pdf.save(`VRG_Dispatch_Labels_${cleanBatch}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Safe fallback to native print dialog
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return 'Address not available';
    if (typeof address === 'string') return address;
    const parts = [
      address.houseNo ? `${address.houseNo}` : '',
      address.street,
      address.villageTown,
      address.district,
      address.state,
      address.pincode
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-4 print:p-0 print:bg-white print:static">
      
      {/* Scoped Print CSS: Ensures ONLY the label sheets are printed, stripping any generative labs or ambient UI */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-label-sheets-container,
          #printable-label-sheets-container * {
            visibility: visible !important;
          }
          #printable-label-sheets-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .a4-sheet-page {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            height: 297mm !important;
            min-height: 297mm !important;
            width: 210mm !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

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
          <h3 className="font-extrabold text-sm text-slate-900">A4 Dispatch Label Sheet Preview</h3>
          <p className="text-[11px] text-slate-500">{orders.length} Selected Orders • {pages.length} Page(s)</p>
        </div>

        {/* 2 Distinct Action Buttons: Print & Download PDF */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2 bg-[#14532d] hover:bg-[#0f3d21] disabled:opacity-70 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Pages Container */}
      <div id="printable-label-sheets-container" className="w-full max-w-4xl space-y-6 print:space-y-0 print:w-full">
        {pages.map((pageOrders, pageIndex) => (
          <div
            key={pageIndex}
            className="a4-sheet-page bg-white rounded-2xl print:rounded-none shadow-md print:shadow-none p-5 sm:p-6 border border-slate-200 print:border-none print:p-4 mx-auto w-full max-w-[210mm] min-h-[297mm] flex flex-col justify-between print:min-h-[297mm] print:h-[297mm] page-break-after"
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
                    Dharmapuri - 636813 | 📞 7904020206
                  </p>
                </div>
              </div>

              <div className="text-right text-[11px] font-medium text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-800">Label Sheet: {sheetNumber}</p>
                <p>Batch No : {batchNumber}</p>
                <p className="font-bold text-emerald-800">Selected Orders : {pageOrders.length}</p>
              </div>
            </div>

            {/* Grid of Labels matching the 3-column format from reference image (4 per A4 page) */}
            <div className="grid grid-cols-2 gap-3.5 flex-1">
              {pageOrders.map((order, orderIdx) => {
                const labelNumber = pageIndex * chunkSize + orderIdx + 1;
                const customerName = order.customerName || order.shippingAddress?.fullName || 'Valued Customer';
                const customerPhone = order.customerPhone || order.shippingAddress?.phone || '';
                const fullAddress = formatAddress(order.shippingAddress);

                return (
                  <div
                    key={order.id || orderIdx}
                    className="border border-gray-400 rounded-2xl p-4 bg-white flex flex-col justify-between shadow-2xs relative print:border-gray-400 print:rounded-2xl"
                  >
                    <div className="grid grid-cols-12 gap-3 h-full items-start">
                      
                      {/* Column 1: From */}
                      <div className="col-span-3 pr-2.5 border-r border-gray-200 flex flex-col justify-between h-full">
                        <div>
                          <div className="w-8 h-8 rounded-lg bg-[#14532d] text-white font-black text-base flex items-center justify-center mb-2.5 shadow-2xs">
                            {labelNumber}
                          </div>
                          <div className="space-y-1 text-xs text-slate-800">
                            <p className="font-semibold text-slate-700">From :</p>
                            <h4 className="font-black text-[#14532d] text-xs sm:text-sm tracking-tight leading-tight">
                              VRG NURSERY
                            </h4>
                            <p className="text-[11px] text-slate-700 font-medium leading-tight">
                              Dharmapuri – 636813
                            </p>
                            <p className="text-xs font-bold text-slate-800 pt-1">
                              7904020206
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Column 2: To */}
                      <div className="col-span-5 px-2.5 border-r border-gray-200 flex flex-col justify-between h-full">
                        <div className="space-y-1">
                          <p className="font-bold text-[#14532d] text-sm">To,</p>
                          <p className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight">
                            {customerName}
                          </p>
                          <p className="text-[11px] sm:text-xs text-slate-700 font-medium leading-relaxed line-clamp-4">
                            Address {fullAddress}
                          </p>
                        </div>
                        {customerPhone && (
                          <p className="font-black text-slate-900 text-xs sm:text-sm pt-2">
                            {customerPhone}
                          </p>
                        )}
                      </div>

                      {/* Column 3: Ordered Plants */}
                      <div className="col-span-4 pl-2 flex flex-col justify-between h-full">
                        <div className="space-y-1.5">
                          <p className="font-bold text-[#14532d] text-xs sm:text-sm">Ordered Plants</p>
                          <div className="space-y-1 text-[11px] sm:text-xs text-slate-800 font-medium">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item, idx) => (
                                <p key={idx} className="leading-snug">
                                  {idx + 1}. {item.name} {item.quantity > 1 ? `(${item.quantity})` : ''}
                                </p>
                              ))
                            ) : (
                              <p className="leading-snug">1. Nursery Plant Sapling</p>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}

              {/* Pad remaining empty slots on last page if fewer than 4 */}
              {Array.from({ length: Math.max(0, 4 - pageOrders.length) }).map((_, emptyIdx) => (
                <div
                  key={`empty-${emptyIdx}`}
                  className="border border-dashed border-slate-200 rounded-2xl p-4 flex items-center justify-center text-slate-300 font-bold text-xs min-h-[100mm]"
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

      {/* Fixed Bottom Action Buttons for Mobile View */}
      <div className="w-full max-w-md mt-4 p-3 bg-white rounded-2xl shadow-lg border border-slate-200 flex items-center gap-3 print:hidden sm:hidden sticky bottom-2">
        <button
          onClick={handlePrint}
          className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Print</span>
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="flex-1 py-3 bg-[#14532d] hover:bg-[#0f3d21] disabled:opacity-70 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
        >
          {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
        </button>
      </div>
    </div>
  );
};
