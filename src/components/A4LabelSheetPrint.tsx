import React, { useState } from 'react';
import { Order } from '../types';
import { Sprout, Printer, ArrowLeft, Download, Loader2, CheckCircle2 } from 'lucide-react';
import * as jspdfPkg from 'jspdf';

const jsPDFClass: any = (jspdfPkg as any).jsPDF || (jspdfPkg as any).default || jspdfPkg;

interface A4LabelSheetPrintProps {
  orders: Order[];
  onClose: () => void;
  onMarkAsPrinted?: (orderIds: string[]) => void;
  batchNumber?: string;
  sheetNumber?: string;
}

export const A4LabelSheetPrint: React.FC<A4LabelSheetPrintProps> = ({
  orders,
  onClose,
  onMarkAsPrinted,
  batchNumber = '#005',
  sheetNumber = '#11106'
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [markedPrintedSuccess, setMarkedPrintedSuccess] = useState(false);

  // Split orders into chunks of 4 for A4 pages
  const chunkSize = 4;
  const pages: Order[][] = [];
  for (let i = 0; i < orders.length; i += chunkSize) {
    pages.push(orders.slice(i, i + chunkSize));
  }

  const handleMarkAllPrinted = () => {
    if (onMarkAsPrinted && orders.length > 0) {
      onMarkAsPrinted(orders.map(o => o.id));
      setMarkedPrintedSuccess(true);
      setTimeout(() => setMarkedPrintedSuccess(false), 3000);
    }
  };

  const handlePrint = () => {
    if (onMarkAsPrinted && orders.length > 0) {
      onMarkAsPrinted(orders.map(o => o.id));
    }
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    if (onMarkAsPrinted && orders.length > 0) {
      onMarkAsPrinted(orders.map(o => o.id));
    }
    setIsGeneratingPdf(true);

    try {
      // A4 Landscape: 297mm width × 210mm height
      const pdf = new jsPDFClass({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });



      pages.forEach((pageOrders, pageIndex) => {
        if (pageIndex > 0) {
          pdf.addPage('a4', 'landscape');
        }

        // ================= 2x2 GRID OF 4 LABELS (EXPANDED TO FULL SHEET) =================
        const cardPositions = [
          { x: 6, y: 6 },
          { x: 153, y: 6 },
          { x: 6, y: 108 },
          { x: 153, y: 108 }
        ];

        const cardWidth = 138;
        const cardHeight = 96;

        pageOrders.forEach((order, orderIdx) => {
          const pos = cardPositions[orderIdx] || cardPositions[0];
          const labelNumber = pageIndex * chunkSize + orderIdx + 1;
          const customerName = order.customerName || (order.shippingAddress as any)?.fullName || 'Valued Customer';
          const customerPhone = order.customerPhone || (order.shippingAddress as any)?.phone || '';
          const fullAddress = formatAddress(order.shippingAddress);

          // Outer Card Box
          pdf.setDrawColor(180, 190, 205);
          pdf.setLineWidth(0.4);
          pdf.roundedRect(pos.x, pos.y, cardWidth, cardHeight, 3, 3, 'S');

          // ---------------- COLUMN 1: FROM (pos.x to pos.x + 36, width = 36mm) ----------------
          // Green Number Badge
          pdf.setFillColor(20, 83, 45); // #14532d
          pdf.roundedRect(pos.x + 2.5, pos.y + 2.5, 9, 9, 2, 2, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(22); // between 20-25
          pdf.text(String(labelNumber), pos.x + 7, pos.y + 9.5, { align: 'center' });

          // "From :"
          pdf.setTextColor(15, 23, 42);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(20);
          pdf.text('From :', pos.x + 2.5, pos.y + 18.5);

          // "VRG NURSERY"
          pdf.setTextColor(20, 83, 45);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(24);
          const vrgLines = pdf.splitTextToSize('VRG NURSERY', 32);
          pdf.text(vrgLines, pos.x + 2.5, pos.y + 26.5);

          // "Dharmapuri - 636813"
          const locStartY = pos.y + 26.5 + (vrgLines.length * 8.5);
          pdf.setTextColor(15, 23, 42);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(20);
          const locLines = pdf.splitTextToSize('Dharmapuri - 636813', 32);
          pdf.text(locLines, pos.x + 2.5, locStartY);

          // Nursery Phone "7200826129"
          const nurseryPhoneY = locStartY + (locLines.length * 7.5);
          pdf.setTextColor(15, 23, 42);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(22);
          pdf.text('7200826129', pos.x + 2.5, nurseryPhoneY);

          // Courier Partner Tag
          const courierPartnerTag = order.courierName || 'Professional Courier';
          const courierY = nurseryPhoneY + 5;
          pdf.setFillColor(240, 253, 244);
          pdf.roundedRect(pos.x + 2, courierY, 32, 14, 1.5, 1.5, 'F');
          pdf.setDrawColor(187, 247, 208);
          pdf.setLineWidth(0.2);
          pdf.roundedRect(pos.x + 2, courierY, 32, 14, 1.5, 1.5, 'S');
          pdf.setTextColor(20, 83, 45);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(20);
          const cLines = pdf.splitTextToSize(courierPartnerTag + (order.courierBranch ? ` (${order.courierBranch})` : ''), 30);
          pdf.text(cLines.slice(0, 2), pos.x + 3, courierY + 6.5);

          // Vertical Divider 1
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.3);
          pdf.line(pos.x + 36, pos.y + 2, pos.x + 36, pos.y + cardHeight - 2);

          // ---------------- COLUMN 2: TO (pos.x + 38 to pos.x + 94, width = 56mm) ----------------
          // "To,"
          pdf.setTextColor(20, 83, 45);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(25); // Max 25
          pdf.text('To,', pos.x + 38, pos.y + 9.5);

          // Customer Name
          pdf.setTextColor(15, 23, 42);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(25); // Max 25
          const nameLines = pdf.splitTextToSize(customerName, 54);
          pdf.text(nameLines, pos.x + 38, pos.y + 19);

          // Customer Address
          const cleanAddr = fullAddress.replace(/^(full\s*)?address\s*[:\-]?\s*/i, '').replace(/^name\s*:\s*[^,]+,\s*(address\s*:\s*)?/i, '').trim();
          const addrStartY = pos.y + 19 + (nameLines.length * 8.8) + 1;
          pdf.setTextColor(15, 23, 42);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(20);
          const addrLines = pdf.splitTextToSize(cleanAddr.startsWith('No') || cleanAddr.startsWith('Door') || cleanAddr.startsWith('Address') ? cleanAddr : `Address: ${cleanAddr}`, 54);
          const displayAddrLines = addrLines.slice(0, 4);
          pdf.text(displayAddrLines, pos.x + 38, addrStartY);

          // Customer Phone Number
          if (customerPhone) {
            const phoneY = addrStartY + (displayAddrLines.length * 7.2) + 3;
            pdf.setTextColor(15, 23, 42);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(25); // Max 25
            const formattedPhone = customerPhone.toLowerCase().startsWith('ph') ? customerPhone : `Ph: ${customerPhone}`;
            pdf.text(formattedPhone, pos.x + 38, Math.min(phoneY, pos.y + cardHeight - 4));
          }

          // Vertical Divider 2
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.3);
          pdf.line(pos.x + 95, pos.y + 2, pos.x + 95, pos.y + cardHeight - 2);

          // ---------------- COLUMN 3: ORDERED PLANTS (pos.x + 97 to pos.x + 136, width = 39mm) ----------------
          // "Ordered Plants"
          pdf.setTextColor(20, 83, 45);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(24);
          const plantsHead = pdf.splitTextToSize('Ordered Plants', 38);
          pdf.text(plantsHead, pos.x + 97, pos.y + 9.5);

          // Plant Items List
          let itemY = pos.y + 9.5 + (plantsHead.length * 8.5) + 1;
          if (order.items && order.items.length > 0) {
            order.items.forEach((item, idx) => {
              if (itemY <= pos.y + cardHeight - 6) {
                const itemText = `${idx + 1}. ${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`;
                const splitItem = pdf.splitTextToSize(itemText, 38);
                const displayItemLines = splitItem.slice(0, 2);
                pdf.setTextColor(15, 23, 42);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(20);
                pdf.text(displayItemLines, pos.x + 97, itemY);
                itemY += (displayItemLines.length * 7) + 1.5;
              }
            });
          } else {
            pdf.setTextColor(15, 23, 42);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(20);
            pdf.text('1. Nursery Plant Sapling', pos.x + 97, itemY);
          }
        });

        // ================= MIDDLE CUT LINES =================
        pdf.setDrawColor(180, 190, 205);
        pdf.setLineWidth(0.2);
        pdf.setLineDashPattern([2, 2], 0);
        pdf.line(4, 105, 293, 105);
        pdf.line(148.5, 4, 148.5, 206);
        pdf.setLineDashPattern([], 0);
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
    if (typeof address === 'string') {
      try {
        const parsed = JSON.parse(address);
        if (parsed && typeof parsed === 'object') {
          address = parsed;
        } else {
          return address.trim();
        }
      } catch {
        return address.trim();
      }
    }
    const rawParts = [
      address.houseNo ? `${address.houseNo}` : '',
      address.street,
      address.villageTown,
      address.district,
      address.state,
      address.pincode
    ].filter(Boolean);

    const uniqueParts: string[] = [];
    for (const p of rawParts) {
      const trimmed = String(p).trim();
      if (trimmed && (!uniqueParts.length || uniqueParts[uniqueParts.length - 1].toLowerCase() !== trimmed.toLowerCase())) {
        uniqueParts.push(trimmed);
      }
    }
    return uniqueParts.join(', ');
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

        {/* Action Buttons: Mark Printed, Print & Download PDF */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
          {onMarkAsPrinted && (
            <button
              onClick={handleMarkAllPrinted}
              className={`px-3.5 py-2 text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                markedPrintedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
              title="Mark all selected orders as Printed and move them down in list"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{markedPrintedSuccess ? '✓ Marked Printed & Moved Down!' : 'Mark as Printed'}</span>
            </button>
          )}

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
            className="a4-sheet-page bg-white rounded-2xl print:rounded-none shadow-md print:shadow-none p-3 sm:p-4 border border-slate-300 print:border-none mx-auto w-full max-w-[297mm] min-h-[210mm] flex flex-col justify-between page-break-after"
            style={{ boxSizing: 'border-box' }}
          >
            {/* 2x2 Grid of 4 Cards (Expanded to Full Sheet) */}
            <div className="grid grid-cols-2 gap-3.5 flex-1 items-stretch h-full">
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
                      <div className="col-span-3 pr-2 border-r border-slate-200 flex flex-col justify-between h-full space-y-2">
                        <div>
                          <div className="w-8 h-8 rounded-md bg-[#14532d] text-white font-black text-[22px] flex items-center justify-center mb-2 shadow-2xs">
                            {labelNumber}
                          </div>
                          <div className="space-y-1 text-slate-900 font-bold">
                            <p className="text-slate-900 text-[20px] font-black leading-tight">From :</p>
                            <h4 className="font-black text-[#14532d] text-[24px] leading-tight">
                              VRG NURSERY
                            </h4>
                            <p className="text-[20px] text-slate-900 font-bold leading-tight">
                              Dharmapuri – 636813
                            </p>
                            <p className="text-[22px] text-slate-900 font-black pt-1 leading-tight">
                              7200826129
                            </p>
                            <div className="mt-2.5 p-1.5 bg-emerald-50 rounded border border-emerald-200 text-[20px] text-emerald-950 font-bold leading-tight">
                              🚚 {order.courierName || 'Professional Courier'}
                              {order.courierBranch ? ` (${order.courierBranch})` : ''}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Column 2: To */}
                      <div className="col-span-5 px-2 border-r border-slate-200 flex flex-col justify-start h-full space-y-1.5">
                        <div>
                          <p className="font-black text-[#14532d] text-[25px] leading-none">To,</p>
                          <p className="font-black text-slate-900 text-[25px] leading-tight mt-1.5">
                            {customerName}
                          </p>
                          {(() => {
                            const cleanAddr = fullAddress.replace(/^(full\s*)?address\s*[:\-]?\s*/i, '').replace(/^name\s*:\s*[^,]+,\s*(address\s*:\s*)?/i, '').trim();
                            const addrDisplay = cleanAddr.startsWith('No') || cleanAddr.startsWith('Door') || cleanAddr.startsWith('Address') ? cleanAddr : `Address: ${cleanAddr}`;
                            return (
                              <p className="text-[20px] text-slate-900 font-bold leading-snug line-clamp-4 mt-1.5">
                                {addrDisplay}
                              </p>
                            );
                          })()}
                          {customerPhone && (
                            <p className="font-black text-slate-900 text-[25px] pt-2 leading-tight">
                              {customerPhone.toLowerCase().startsWith('ph') ? customerPhone : `Ph: ${customerPhone}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Column 3: Ordered Plants */}
                      <div className="col-span-4 pl-1.5 flex flex-col justify-between h-full space-y-1.5">
                        <div>
                          <p className="font-black text-[#14532d] text-[24px] leading-none">Ordered Plants</p>
                          <div className="space-y-1.5 text-[20px] text-slate-900 font-bold mt-2">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item, idx) => (
                                <p key={idx} className="leading-snug line-clamp-2 font-bold text-slate-900">
                                  {idx + 1}. {item.name} {item.quantity > 1 ? `(${item.quantity})` : ''}
                                </p>
                              ))
                            ) : (
                              <p className="leading-snug font-bold text-slate-900">1. Nursery Plant Sapling</p>
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
                  className="border border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center text-slate-300 font-bold text-sm min-h-[50mm]"
                >
                  Empty Slot
                </div>
              ))}
            </div>

            {/* Middle Cut Line */}
            <div className="relative my-2 text-center">
              <div className="border-t border-dashed border-slate-300 w-full" />
              <span className="absolute top-1/2 left-4 -translate-y-1/2 bg-white px-1 text-slate-400 text-xs">✂</span>
              <span className="absolute top-1/2 right-4 -translate-y-1/2 bg-white px-1 text-slate-400 text-xs">✂</span>
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
