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
      // A4 Landscape: 297mm width × 210mm height
      const pdf = new jsPDFClass({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const currentDateStr = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(new Date());

      const drawLeafBadge = (pdf: any, x: number, y: number, r = 5.5) => {
        pdf.saveGraphicsState();
        pdf.setFillColor(20, 83, 45); // #14532d
        pdf.circle(x, y, r, 'F');
        pdf.setDrawColor(34, 197, 94); // #22c55e
        pdf.setLineWidth(0.3);
        pdf.circle(x, y, r - 0.6, 'S');

        pdf.setFillColor(74, 222, 128); // #4ade80
        pdf.ellipse(x - (r * 0.22), y - (r * 0.1), r * 0.42, r * 0.22, 'F');
        pdf.ellipse(x + (r * 0.22), y - (r * 0.22), r * 0.42, r * 0.22, 'F');
        pdf.setDrawColor(240, 253, 244);
        pdf.setLineWidth(0.3);
        pdf.line(x, y + (r * 0.45), x, y - (r * 0.45));
        pdf.restoreGraphicsState();
      };

      const drawLocationPin = (pdf: any, x: number, y: number, size = 0.85) => {
        pdf.saveGraphicsState();
        pdf.setFillColor(220, 38, 38); // #dc2626
        pdf.setDrawColor(185, 28, 28);
        pdf.circle(x, y - 1 * size, 1.5 * size, 'F');
        pdf.triangle(x - 1.3 * size, y - 0.4 * size, x + 1.3 * size, y - 0.4 * size, x, y + 2 * size, 'FD');
        pdf.setFillColor(255, 255, 255);
        pdf.circle(x, y - 1 * size, 0.55 * size, 'F');
        pdf.restoreGraphicsState();
      };

      const drawPhoneIcon = (pdf: any, x: number, y: number, size = 0.85) => {
        pdf.saveGraphicsState();
        pdf.setFillColor(20, 83, 45); // #14532d
        pdf.circle(x, y, 1.8 * size, 'F');
        pdf.setDrawColor(255, 255, 255);
        pdf.setLineWidth(0.4 * size);
        pdf.ellipse(x, y, 0.9 * size, 0.5 * size, 'S');
        pdf.restoreGraphicsState();
      };

      const drawScissors = (pdf: any, x: number, y: number, size = 0.8) => {
        pdf.saveGraphicsState();
        pdf.setDrawColor(100, 116, 139);
        pdf.setLineWidth(0.35 * size);
        pdf.circle(x - 2 * size, y - 1.2 * size, 1 * size, 'S');
        pdf.circle(x - 2 * size, y + 1.2 * size, 1 * size, 'S');
        pdf.line(x - 1.1 * size, y - 0.9 * size, x + 3 * size, y + 1.4 * size);
        pdf.line(x - 1.1 * size, y + 0.9 * size, x + 3 * size, y - 1.4 * size);
        pdf.setFillColor(71, 85, 105);
        pdf.circle(x + 0.3 * size, y, 0.4 * size, 'F');
        pdf.restoreGraphicsState();
      };

      pages.forEach((pageOrders, pageIndex) => {
        if (pageIndex > 0) {
          pdf.addPage('a4', 'landscape');
        }

        // ================= TOP HEADER =================
        pdf.setDrawColor(180, 190, 205);
        pdf.setLineWidth(0.4);
        pdf.roundedRect(8, 6, 281, 24, 3, 3, 'S');

        // Header left & right leaf badges
        drawLeafBadge(pdf, 18, 18, 5.5);
        drawLeafBadge(pdf, 274, 18, 5.5);

        // Title: VRG NURSERY
        pdf.setTextColor(20, 83, 45); // #14532d
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.text('VRG NURSERY', 125, 15, { align: 'center' });

        // Subtitle: Location & Phone with Vector Icons
        drawLocationPin(pdf, 82, 21.8, 0.9);
        pdf.setTextColor(20, 83, 45);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.text('Dharmapuri - 636813', 86, 22.5);

        pdf.text('|', 133, 22.5);

        drawPhoneIcon(pdf, 140, 21.8, 0.9);
        pdf.text('7904020206', 144, 22.5);

        // Right Metadata Box
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.text('Order Sheet Date', 214, 12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`: ${currentDateStr}`, 240, 12);

        pdf.setFont('helvetica', 'bold');
        pdf.text('Total Orders', 214, 17);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`: ${pageOrders.length}`, 240, 17);

        pdf.setFont('helvetica', 'bold');
        pdf.text('Prepared By', 214, 22);
        pdf.setFont('helvetica', 'normal');
        pdf.text(': Admin', 240, 22);

        // ================= 2x2 GRID OF 4 LABELS =================
        const cardPositions = [
          { x: 8, y: 34 },
          { x: 151, y: 34 },
          { x: 8, y: 114 },
          { x: 151, y: 114 }
        ];

        const cardWidth = 138;
        const cardHeight = 72;

        pageOrders.forEach((order, orderIdx) => {
          const pos = cardPositions[orderIdx] || cardPositions[0];
          const labelNumber = pageIndex * chunkSize + orderIdx + 1;
          const customerName = order.customerName || (order.shippingAddress as any)?.fullName || 'Valued Customer';
          const customerPhone = order.customerPhone || (order.shippingAddress as any)?.phone || '';
          const fullAddress = formatAddress(order.shippingAddress);

          // Outer Card Box
          pdf.setDrawColor(180, 190, 205);
          pdf.setLineWidth(0.35);
          pdf.roundedRect(pos.x, pos.y, cardWidth, cardHeight, 3, 3, 'S');

          // ---------------- COLUMN 1: FROM (pos.x to pos.x + 36) ----------------
          // Green Number Badge
          pdf.setFillColor(20, 83, 45); // #14532d
          pdf.roundedRect(pos.x + 2.5, pos.y + 2.5, 7.5, 7.5, 1.5, 1.5, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9.5);
          pdf.text(String(labelNumber), pos.x + 6.25, pos.y + 7.8, { align: 'center' });

          // "From :"
          pdf.setTextColor(71, 85, 105);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          pdf.text('From :', pos.x + 2.5, pos.y + 15);

          // "VRG NURSERY"
          pdf.setTextColor(20, 83, 45);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.text('VRG NURSERY', pos.x + 2.5, pos.y + 21);

          // "Dharmapuri - 636813"
          pdf.setTextColor(51, 65, 85);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.2);
          pdf.text('Dharmapuri - 636813', pos.x + 2.5, pos.y + 27);

          // Nursery Phone "7904020206"
          pdf.setTextColor(30, 41, 59);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.8);
          pdf.text('7904020206', pos.x + 2.5, pos.y + 33);

          // Courier Partner Tag
          const courierPartnerTag = order.courierName || 'Professional Courier';
          pdf.setFillColor(240, 253, 244);
          pdf.roundedRect(pos.x + 2, pos.y + 38, 32, 10, 1, 1, 'F');
          pdf.setDrawColor(187, 247, 208);
          pdf.setLineWidth(0.2);
          pdf.roundedRect(pos.x + 2, pos.y + 38, 32, 10, 1, 1, 'S');
          pdf.setTextColor(20, 83, 45);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(5.8);
          const cLines = pdf.splitTextToSize(courierPartnerTag + (order.courierBranch ? ` (${order.courierBranch})` : ''), 30);
          pdf.text(cLines.slice(0, 3), pos.x + 3, pos.y + 41.5);

          // Vertical Divider 1
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.25);
          pdf.line(pos.x + 36, pos.y + 2, pos.x + 36, pos.y + cardHeight - 2);

          // ---------------- COLUMN 2: TO (pos.x + 38 to pos.x + 94) ----------------
          // "To,"
          pdf.setTextColor(20, 83, 45);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.text('To,', pos.x + 39, pos.y + 7);

          // Customer Name
          pdf.setTextColor(15, 23, 42);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          const nameLines = pdf.splitTextToSize(customerName, 52);
          pdf.text(nameLines, pos.x + 39, pos.y + 12.5);

          // Customer Address
          const addrStartY = pos.y + 12.5 + (nameLines.length * 3.5) + 1;
          pdf.setTextColor(51, 65, 85);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(6.8);
          const addrLines = pdf.splitTextToSize(fullAddress.startsWith('Address') || fullAddress.startsWith('No') ? fullAddress : `Address ${fullAddress}`, 52);
          const displayAddrLines = addrLines.slice(0, 7);
          pdf.text(displayAddrLines, pos.x + 39, addrStartY);

          // Customer Phone Number (Positioned above, immediately below address)
          if (customerPhone) {
            const phoneY = addrStartY + (displayAddrLines.length * 3.4) + 2.5;
            pdf.setTextColor(15, 23, 42);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8.5);
            pdf.text(customerPhone, pos.x + 39, Math.min(phoneY, pos.y + cardHeight - 5));
          }

          // Vertical Divider 2
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.25);
          pdf.line(pos.x + 94, pos.y + 2, pos.x + 94, pos.y + cardHeight - 2);

          // ---------------- COLUMN 3: ORDERED PLANTS (pos.x + 96 to pos.x + 136) ----------------
          // "Ordered Plants"
          pdf.setTextColor(20, 83, 45);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.text('Ordered Plants', pos.x + 97, pos.y + 7);

          // Plant Items List
          let itemY = pos.y + 12.5;
          if (order.items && order.items.length > 0) {
            order.items.forEach((item, idx) => {
              if (itemY <= pos.y + cardHeight - 6) {
                const itemText = `${idx + 1}. ${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`;
                const splitItem = pdf.splitTextToSize(itemText, 38);
                const displayItemLines = splitItem.slice(0, 2);
                pdf.setTextColor(30, 41, 59);
                pdf.setFontSize(6.8);
                pdf.setFont('helvetica', 'normal');
                pdf.text(displayItemLines, pos.x + 97, itemY);
                itemY += (displayItemLines.length * 3.2) + 1.2;
              }
            });
          } else {
            pdf.setTextColor(100, 116, 139);
            pdf.setFontSize(6.8);
            pdf.setFont('helvetica', 'normal');
            pdf.text('1. Nursery Plant Sapling', pos.x + 97, itemY);
          }
        });

        // ================= MIDDLE HORIZONTAL DASHED CUT LINE =================
        pdf.setDrawColor(180, 190, 205);
        pdf.setLineWidth(0.2);
        pdf.setLineDashPattern([2, 2], 0);
        pdf.line(8, 109.5, 289, 109.5);
        pdf.setLineDashPattern([], 0);

        // Draw 3 vector scissors along the cut line
        drawScissors(pdf, 18, 109.5, 0.9);
        drawScissors(pdf, 148, 109.5, 0.9);
        drawScissors(pdf, 278, 109.5, 0.9);

        // ================= BOTTOM FOOTER =================
        pdf.setDrawColor(180, 190, 205);
        pdf.setLineWidth(0.35);
        pdf.roundedRect(8, 191, 281, 12, 2.5, 2.5, 'S');

        // Footer leaf badges
        drawLeafBadge(pdf, 20, 197, 3.5);
        drawLeafBadge(pdf, 277, 197, 3.5);

        pdf.setTextColor(20, 83, 45);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.text(
          'Thank you for your order!   |   We will pack your plants with care and deliver safe & fresh.',
          148.5,
          198.5,
          { align: 'center' }
        );
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

  const currentDateStr = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-4 print:p-0 print:bg-white print:static">
      
      {/* Scoped Print CSS: Ensures ONLY the label sheets are printed in landscape */}
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
            height: 210mm !important;
            min-height: 210mm !important;
            width: 297mm !important;
            max-width: 297mm !important;
          }
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
        }
      `}</style>

      {/* Non-printed Top Action Toolbar */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg p-3.5 mb-4 flex items-center justify-between gap-3 print:hidden sticky top-2 z-10 border border-slate-200">
        <button
          onClick={onClose}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="text-center hidden sm:block">
          <h3 className="font-extrabold text-sm text-slate-900">A4 Landscape Dispatch Label Sheet (2×2 Grid)</h3>
          <p className="text-[11px] text-slate-500">{orders.length} Selected Orders • {pages.length} Sheet(s)</p>
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
      <div id="printable-label-sheets-container" className="w-full max-w-5xl space-y-6 print:space-y-0 print:w-full">
        {pages.map((pageOrders, pageIndex) => (
          <div
            key={pageIndex}
            className="a4-sheet-page bg-white rounded-2xl print:rounded-none shadow-md print:shadow-none p-4 sm:p-5 border border-slate-300 print:border-none mx-auto w-full max-w-[297mm] min-h-[210mm] flex flex-col justify-between page-break-after"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Top Sheet Header */}
            <div className="border border-slate-300 rounded-xl p-3 mb-3 flex items-center justify-between bg-white shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌿</span>
              </div>

              <div className="text-center flex-1">
                <h1 className="text-2xl font-black tracking-wide text-[#14532d] leading-none">
                  VRG NURSERY
                </h1>
                <p className="text-xs font-bold text-[#14532d] mt-1.5 flex items-center justify-center gap-4">
                  <span>📍 Dharmapuri – 636813</span>
                  <span>📞 7904020206</span>
                </p>
              </div>

              <div className="text-right text-[11px] font-medium text-slate-800 space-y-0.5 border-l border-slate-200 pl-3">
                <p><span className="font-bold text-slate-900">Order Sheet Date</span> : {currentDateStr}</p>
                <p><span className="font-bold text-slate-900">Total Orders</span> : {pageOrders.length}</p>
                <p><span className="font-bold text-slate-900">Prepared By</span> : Admin</p>
              </div>

              <div className="flex items-center gap-2 pl-2">
                <span className="text-2xl">🌿</span>
              </div>
            </div>

            {/* 2x2 Grid of 4 Cards */}
            <div className="grid grid-cols-2 gap-3.5 flex-1 items-stretch">
              {pageOrders.map((order, orderIdx) => {
                const labelNumber = pageIndex * chunkSize + orderIdx + 1;
                const customerName = order.customerName || order.shippingAddress?.fullName || 'Valued Customer';
                const customerPhone = order.customerPhone || order.shippingAddress?.phone || '';
                const fullAddress = formatAddress(order.shippingAddress);

                return (
                  <div
                    key={order.id || orderIdx}
                    className="border border-slate-300 rounded-xl p-3 bg-white shadow-2xs relative print:border-slate-400 print:rounded-xl flex flex-col justify-between"
                  >
                    <div className="grid grid-cols-12 gap-2.5 h-full items-start">
                      
                      {/* Column 1: From */}
                      <div className="col-span-3 pr-2 border-r border-slate-200 flex flex-col justify-between h-full space-y-1">
                        <div>
                          <div className="w-6 h-6 rounded-md bg-[#14532d] text-white font-black text-xs flex items-center justify-center mb-1.5 shadow-2xs">
                            {labelNumber}
                          </div>
                          <div className="space-y-0.5 text-xs text-slate-800">
                            <p className="text-slate-600 text-[11px]">From :</p>
                            <h4 className="font-black text-[#14532d] text-xs leading-tight">
                              VRG NURSERY
                            </h4>
                            <p className="text-[11px] text-slate-700 leading-tight">
                              Dharmapuri – 636813
                            </p>
                            <p className="text-[11px] text-slate-800 pt-0.5">
                              7904020206
                            </p>
                            <div className="mt-2 p-1 bg-emerald-50 rounded border border-emerald-200 text-[9px] text-emerald-900 font-bold leading-tight">
                              🚚 {order.courierName || 'Professional Courier'}
                              {order.courierBranch ? ` (${order.courierBranch})` : ''}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Column 2: To */}
                      <div className="col-span-5 px-2 border-r border-slate-200 flex flex-col justify-start h-full space-y-1">
                        <div>
                          <p className="font-bold text-[#14532d] text-xs leading-none">To,</p>
                          <p className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight mt-0.5">
                            {customerName}
                          </p>
                          <p className="text-[11px] text-slate-700 font-medium leading-snug line-clamp-4 mt-1">
                            {fullAddress.startsWith('Address') || fullAddress.startsWith('No') ? fullAddress : `Address ${fullAddress}`}
                          </p>
                          {customerPhone && (
                            <p className="font-black text-slate-900 text-xs sm:text-sm pt-1.5">
                              {customerPhone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Column 3: Ordered Plants */}
                      <div className="col-span-4 pl-1.5 flex flex-col justify-between h-full space-y-1">
                        <div>
                          <p className="font-bold text-[#14532d] text-xs leading-none">Ordered Plants</p>
                          <div className="space-y-0.5 text-[11px] text-slate-800 font-medium mt-1">
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
                  </div>
                );
              })}

              {/* Pad remaining empty slots on last page if fewer than 4 */}
              {Array.from({ length: Math.max(0, 4 - pageOrders.length) }).map((_, emptyIdx) => (
                <div
                  key={`empty-${emptyIdx}`}
                  className="border border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center text-slate-300 font-bold text-xs min-h-[50mm]"
                >
                  Empty Slot
                </div>
              ))}
            </div>

            {/* Middle Scissor Cut Line */}
            <div className="relative my-2 text-center">
              <div className="border-t border-dashed border-slate-300 w-full" />
              <span className="absolute top-1/2 left-4 -translate-y-1/2 bg-white px-1 text-slate-400 text-xs">✂</span>
              <span className="absolute top-1/2 right-4 -translate-y-1/2 bg-white px-1 text-slate-400 text-xs">✂</span>
            </div>

            {/* Bottom Footer */}
            <div className="border border-slate-300 rounded-xl p-2 text-center text-xs font-bold text-[#14532d] flex justify-center items-center gap-2 bg-white shadow-2xs">
              <span>🌿</span>
              <span>Thank you for your order!</span>
              <span>|</span>
              <span>We will pack your plants with care and deliver safe & fresh.</span>
              <span>🌿</span>
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
