import React, { useState } from 'react';
import { Order } from '../types';
import { Sprout, Printer, ArrowLeft, Download, Loader2 } from 'lucide-react';
import * as jspdfPkg from 'jspdf';

const jsPDFClass: any = (jspdfPkg as any).jsPDF || (jspdfPkg as any).default || jspdfPkg;

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
      const pdf = new jsPDFClass({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      pages.forEach((pageOrders, pageIndex) => {
        if (pageIndex > 0) {
          pdf.addPage('a4', 'portrait');
        }

        // ================= HEADER =================
        // Sprout badge box
        pdf.setFillColor(209, 250, 229);
        pdf.roundedRect(10, 8, 10, 10, 2, 2, 'F');
        pdf.setTextColor(20, 83, 45);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('VRG', 15, 14.5, { align: 'center' });

        // VRG Nursery Title & Subtitle
        pdf.setTextColor(20, 83, 45);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.text('VRG NURSERY', 23, 13);

        pdf.setTextColor(71, 85, 105);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.text('Dharmapuri - 636813 | Phone: 7904020206', 23, 17.5);

        // Right Meta
        pdf.setTextColor(30, 41, 59);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.text(`Label Sheet: ${sheetNumber}`, 200, 11, { align: 'right' });

        pdf.setFont('helvetica', 'normal');
        pdf.text(`Batch No : ${batchNumber}`, 200, 15, { align: 'right' });

        pdf.setTextColor(20, 83, 45);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Selected Orders : ${pageOrders.length}`, 200, 19, { align: 'right' });

        // Header Divider Line
        pdf.setDrawColor(20, 83, 45);
        pdf.setLineWidth(0.6);
        pdf.line(10, 22, 200, 22);

        // ================= 4 HORIZONTAL LABELS PER A4 PAGE =================
        const cardPositionsY = [26, 90, 154, 218];
        const cardWidth = 190;
        const cardHeight = 58;

        pageOrders.forEach((order, orderIdx) => {
          const cardY = cardPositionsY[orderIdx] || 26;
          const labelNumber = pageIndex * chunkSize + orderIdx + 1;
          const customerName = order.customerName || (order.shippingAddress as any)?.fullName || 'Valued Customer';
          const customerPhone = order.customerPhone || (order.shippingAddress as any)?.phone || '';
          const fullAddress = formatAddress(order.shippingAddress);

          // Outer Card Border
          pdf.setDrawColor(180, 190, 205);
          pdf.setLineWidth(0.4);
          pdf.roundedRect(10, cardY, cardWidth, cardHeight, 3.5, 3.5, 'S');

          // ---------------- COLUMN 1: FROM (10mm to 56mm, width 46mm) ----------------
          // Green Badge Number
          pdf.setFillColor(20, 83, 45); // #14532d
          pdf.roundedRect(14, cardY + 4, 8, 8, 1.8, 1.8, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10.5);
          pdf.text(String(labelNumber), 18, cardY + 9.8, { align: 'center' });

          // "From :"
          pdf.setTextColor(71, 85, 105);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.text('From :', 14, cardY + 18);

          // "VRG NURSERY"
          pdf.setTextColor(20, 83, 45);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9.5);
          pdf.text('VRG NURSERY', 14, cardY + 24);

          // Address
          pdf.setTextColor(51, 65, 85);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          pdf.text('Dharmapuri – 636813', 14, cardY + 30);

          // Store Phone
          pdf.setTextColor(30, 41, 59);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.text('7904020206', 14, cardY + 36);

          // Vertical Divider 1
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.3);
          pdf.line(56, cardY + 2, 56, cardY + cardHeight - 2);

          // ---------------- COLUMN 2: TO (58mm to 136mm, width 78mm) ----------------
          // "To,"
          pdf.setTextColor(20, 83, 45);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9.5);
          pdf.text('To,', 61, cardY + 8.5);

          // Customer Name
          pdf.setTextColor(15, 23, 42);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.text(customerName, 61, cardY + 14.5);

          // Address
          pdf.setTextColor(51, 65, 85);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          const addrLines = pdf.splitTextToSize('Address ' + fullAddress, 70);
          const displayAddrLines = addrLines.slice(0, 4);
          pdf.text(displayAddrLines, 61, cardY + 19.5);

          // Customer Mobile (Right below address)
          let phoneY = cardY + 19.5 + (displayAddrLines.length * 3.8) + 4.5;
          if (phoneY > cardY + 53) phoneY = cardY + 53;
          if (customerPhone) {
            pdf.setTextColor(15, 23, 42);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9.5);
            pdf.text(customerPhone, 61, phoneY);
          }

          // Vertical Divider 2
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.3);
          pdf.line(136, cardY + 2, 136, cardY + cardHeight - 2);

          // ---------------- COLUMN 3: ORDERED PLANTS (138mm to 200mm, width 62mm) ----------------
          // "Ordered Plants"
          pdf.setTextColor(20, 83, 45);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9.5);
          pdf.text('Ordered Plants', 141, cardY + 8.5);

          // Numbered Plants List
          let itemY = cardY + 14.5;
          if (order.items && order.items.length > 0) {
            order.items.forEach((item, idx) => {
              if (itemY <= cardY + 52) {
                const itemText = `${idx + 1}. ${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`;
                const splitItem = pdf.splitTextToSize(itemText, 54);
                const displayItemLines = splitItem.slice(0, 2);
                pdf.setTextColor(30, 41, 59);
                pdf.setFontSize(7.5);
                pdf.setFont('helvetica', 'normal');
                pdf.text(displayItemLines, 141, itemY);
                itemY += (displayItemLines.length * 3.6) + 1.2;
              }
            });
          } else {
            pdf.setTextColor(100, 116, 139);
            pdf.setFontSize(7.5);
            pdf.setFont('helvetica', 'normal');
            pdf.text('1. Nursery Plant Sapling', 141, itemY);
          }
        });

        // ================= FOOTER =================
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(10, 285, 200, 285);

        pdf.setTextColor(148, 163, 184);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${pageIndex + 1} of ${pages.length}`, 10, 289);
        pdf.text('VRG Nursery Order Dispatch Label Sheet', 105, 289, { align: 'center' });
        pdf.text('veerikarosegarden.com', 200, 289, { align: 'right' });
      });

      const cleanBatch = batchNumber.replace(/[^a-zA-Z0-9]/g, '') || '001';
      pdf.save(`VRG_Dispatch_Labels_${cleanBatch}_${Date.now()}.pdf`);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF download: ' + (err?.message || 'Unknown error'));
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

            {/* 4 Wide Horizontal Label Cards per A4 Sheet matching reference image */}
            <div className="flex flex-col gap-3.5 flex-1 justify-between">
              {pageOrders.map((order, orderIdx) => {
                const labelNumber = pageIndex * chunkSize + orderIdx + 1;
                const customerName = order.customerName || order.shippingAddress?.fullName || 'Valued Customer';
                const customerPhone = order.customerPhone || order.shippingAddress?.phone || '';
                const fullAddress = formatAddress(order.shippingAddress);

                return (
                  <div
                    key={order.id || orderIdx}
                    className="border border-slate-300 rounded-2xl p-3 sm:p-4 bg-white shadow-2xs relative print:border-slate-400 print:rounded-2xl"
                  >
                    <div className="grid grid-cols-12 gap-3 items-start">
                      
                      {/* Column 1: From */}
                      <div className="col-span-3 pr-2.5 border-r border-slate-200 space-y-1">
                        <div className="w-7 h-7 rounded-lg bg-[#14532d] text-white font-black text-sm flex items-center justify-center mb-1 shadow-2xs">
                          {labelNumber}
                        </div>
                        <div className="space-y-0.5 text-xs text-slate-800">
                          <p className="font-semibold text-slate-600 text-[11px]">From :</p>
                          <h4 className="font-black text-[#14532d] text-xs sm:text-sm tracking-tight leading-tight">
                            VRG NURSERY
                          </h4>
                          <p className="text-[11px] text-slate-700 font-medium leading-tight">
                            Dharmapuri – 636813
                          </p>
                          <p className="text-xs font-bold text-slate-800 pt-0.5">
                            7904020206
                          </p>
                        </div>
                      </div>

                      {/* Column 2: To */}
                      <div className="col-span-5 px-2.5 border-r border-slate-200 space-y-1">
                        <p className="font-bold text-[#14532d] text-xs sm:text-sm leading-none">To,</p>
                        <p className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight">
                          {customerName}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-700 font-medium leading-snug line-clamp-3">
                          Address {fullAddress}
                        </p>
                        {customerPhone && (
                          <p className="font-black text-slate-900 text-xs sm:text-sm pt-1">
                            {customerPhone}
                          </p>
                        )}
                      </div>

                      {/* Column 3: Ordered Plants */}
                      <div className="col-span-4 pl-2 space-y-1">
                        <p className="font-bold text-[#14532d] text-xs sm:text-sm leading-none">Ordered Plants</p>
                        <div className="space-y-0.5 text-[11px] sm:text-xs text-slate-800 font-medium">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item, idx) => (
                              <p key={idx} className="leading-snug line-clamp-2">
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
                );
              })}

              {/* Pad remaining empty slots on last page if fewer than 4 */}
              {Array.from({ length: Math.max(0, 4 - pageOrders.length) }).map((_, emptyIdx) => (
                <div
                  key={`empty-${emptyIdx}`}
                  className="border border-dashed border-slate-200 rounded-2xl p-4 flex items-center justify-center text-slate-300 font-bold text-xs min-h-[50mm]"
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
