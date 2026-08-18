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

  // Split orders into chunks of 3 for A4 portrait pages
  const chunkSize = 3;
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
      // A4 Portrait: 210mm width × 297mm height
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

        // 3 Labels stacked vertically on A4 Portrait
        const labelYPositions = [12, 104, 196];
        const labelWidth = 184;
        const labelX = 13;

        pageOrders.forEach((order, orderIdx) => {
          const ly = labelYPositions[orderIdx];
          const customerName = order.customerName || (order.shippingAddress as any)?.fullName || 'Valued Customer';
          const customerPhone = order.customerPhone || (order.shippingAddress as any)?.phone || '';
          const fullAddress = formatAddress(order.shippingAddress);

          // ================= 1. HEADER BOX: "LIVE PLANTS INSIDE" =================
          const headerBoxW = labelWidth;
          const headerBoxH = 14;
          
          // Outer border of header box
          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(0.3);
          pdf.rect(labelX, ly, headerBoxW, headerBoxH, 'S');

          // Inner Neon Green Banner
          const greenW = 144;
          const greenH = 10.5;
          const greenX = labelX + (headerBoxW - greenW) / 2;
          const greenY = ly + (headerBoxH - greenH) / 2;

          pdf.setFillColor(0, 255, 0); // Bright Neon Green
          pdf.rect(greenX, greenY, greenW, greenH, 'F');

          // "LIVE  PLANTS  INSIDE" text
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('times', 'bold');
          pdf.setFontSize(22);
          pdf.text('LIVE   PLANTS   INSIDE', labelX + headerBoxW / 2, greenY + 7.5, { align: 'center' });

          // ================= 2. SUBHEADER ROW: "From :" & "To," =================
          const subheaderY = ly + 18.5;
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10.5);
          pdf.text('From :', labelX, subheaderY);
          pdf.text('To,', labelX + 58, subheaderY);

          // ================= 3. COLUMN 1: "From :" DETAILS (Yellow Highlights) =================
          const fromContentY = ly + 22.5;

          // Line 1: MSV GARDEN,
          pdf.setFillColor(255, 255, 0); // Bright Yellow
          pdf.rect(labelX, fromContentY, 53, 7.5, 'F');
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(14.5);
          pdf.text('MSV GARDEN,', labelX + 1, fromContentY + 5.8);

          // Line 2: Dharmapuri – 636813
          const line2Y = fromContentY + 10;
          pdf.setFillColor(255, 255, 0); // Bright Yellow
          pdf.rect(labelX, line2Y, 49, 6.2, 'F');
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.text('Dharmapuri – 636813', labelX + 1, line2Y + 4.6);

          // Line 3: 7904020206
          const line3Y = line2Y + 8.5;
          pdf.setFillColor(255, 255, 0); // Bright Yellow
          pdf.rect(labelX, line3Y, 28, 6.2, 'F');
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.text('7904020206', labelX + 1, line3Y + 4.6);

          // ================= 4. COLUMN 2: "To," CUSTOMER BOX =================
          const toBoxX = labelX + 58;
          const toBoxY = ly + 22;
          const toBoxW = 68;
          const toBoxH = 54;

          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(0.3);
          pdf.rect(toBoxX, toBoxY, toBoxW, toBoxH, 'S');

          // Customer Name
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9.5);
          const nameLines = pdf.splitTextToSize(customerName, toBoxW - 4);
          pdf.text(nameLines, toBoxX + 2.5, toBoxY + 5);

          // Customer Address
          const cleanAddr = fullAddress
            .replace(/^(full\s*)?address\s*[:\-]?\s*/i, '')
            .replace(/^name\s*:\s*[^,]+,\s*(address\s*:\s*)?/i, '')
            .trim();
          const addrDisplay = cleanAddr.startsWith('No') || cleanAddr.startsWith('Door') || cleanAddr.startsWith('Address')
            ? cleanAddr
            : `Address ${cleanAddr}`;

          const addrStartY = toBoxY + 5 + (nameLines.length * 4.2) + 1.5;
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          const addrLines = pdf.splitTextToSize(addrDisplay, toBoxW - 4);
          const displayAddrLines = addrLines.slice(0, 6);
          pdf.text(displayAddrLines, toBoxX + 2.5, addrStartY);

          // Customer Phone Number
          if (customerPhone) {
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            const phoneFormatted = customerPhone.toLowerCase().includes('whatsapp') || customerPhone.toLowerCase().includes('phone')
              ? customerPhone
              : customerPhone;
            pdf.text(phoneFormatted, toBoxX + 2.5, toBoxY + toBoxH - 3.5);
          }

          // ================= 5. COLUMN 3: ORDERED PLANTS BOX =================
          const itemBoxX = toBoxX + toBoxW + 6;
          const itemBoxY = ly + 22;
          const itemBoxW = 52;
          const itemBoxH = 54;

          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(0.3);
          pdf.rect(itemBoxX, itemBoxY, itemBoxW, itemBoxH, 'S');

          // Plants List
          let itemY = itemBoxY + 5;
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);

          if (order.items && order.items.length > 0) {
            order.items.forEach((item) => {
              if (itemY <= itemBoxY + itemBoxH - 4) {
                const itemText = `${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`;
                const splitItem = pdf.splitTextToSize(itemText, itemBoxW - 4);
                const linesToPrint = splitItem.slice(0, 2);
                pdf.text(linesToPrint, itemBoxX + 2.5, itemY);
                itemY += (linesToPrint.length * 3.8) + 1.5;
              }
            });
          } else {
            pdf.text('Nursery Plant Sapling', itemBoxX + 2.5, itemY);
          }
        });
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-4 print:p-0 print:bg-white print:static">
      
      {/* Scoped Print CSS: Ensures ONLY the label sheets are printed in portrait */}
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
            margin: 0 auto !important;
            page-break-after: always !important;
            break-after: page !important;
            height: 297mm !important;
            min-height: 297mm !important;
            width: 210mm !important;
            max-width: 210mm !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
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
          <h3 className="font-extrabold text-sm text-slate-900">A4 Portrait Dispatch Label Sheet (3 Labels / Page)</h3>
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
              <span>{markedPrintedSuccess ? '✓ Marked Printed!' : 'Mark as Printed'}</span>
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
      <div id="printable-label-sheets-container" className="w-full max-w-4xl space-y-6 print:space-y-0 print:w-full">
        {pages.map((pageOrders, pageIndex) => (
          <div
            key={pageIndex}
            className="a4-sheet-page bg-white rounded-2xl print:rounded-none shadow-md print:shadow-none p-6 sm:p-8 border border-slate-300 print:border-none mx-auto w-full max-w-[210mm] min-h-[297mm] flex flex-col justify-start space-y-8 page-break-after"
            style={{ boxSizing: 'border-box' }}
          >
            {pageOrders.map((order, orderIdx) => {
              const customerName = order.customerName || order.shippingAddress?.fullName || 'Valued Customer';
              const customerPhone = order.customerPhone || order.shippingAddress?.phone || '';
              const fullAddress = formatAddress(order.shippingAddress);
              const cleanAddr = fullAddress
                .replace(/^(full\s*)?address\s*[:\-]?\s*/i, '')
                .replace(/^name\s*:\s*[^,]+,\s*(address\s*:\s*)?/i, '')
                .trim();
              const addrDisplay = cleanAddr.startsWith('No') || cleanAddr.startsWith('Door') || cleanAddr.startsWith('Address')
                ? cleanAddr
                : `Address ${cleanAddr}`;

              return (
                <div
                  key={order.id || orderIdx}
                  className="w-full bg-white flex flex-col space-y-2 pb-4"
                >
                  {/* 1. Header Box: LIVE PLANTS INSIDE */}
                  <div className="w-full border border-black p-1 flex items-center justify-center">
                    <div className="w-[82%] bg-[#00FF00] py-1 text-center">
                      <span className="font-serif font-black text-black text-2xl sm:text-3xl tracking-widest uppercase">
                        LIVE PLANTS INSIDE
                      </span>
                    </div>
                  </div>

                  {/* 2. Subheader row: From : & To, */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-normal text-black pt-1">
                    <div className="col-span-4">
                      <span>From :</span>
                    </div>
                    <div className="col-span-5">
                      <span>To,</span>
                    </div>
                    <div className="col-span-3"></div>
                  </div>

                  {/* 3. Main Label Content */}
                  <div className="grid grid-cols-12 gap-3 items-start">
                    
                    {/* Left Column: From Details with Yellow Highlights */}
                    <div className="col-span-4 space-y-1.5 pr-1">
                      <div>
                        <span className="bg-[#FFFF00] font-black text-black text-lg sm:text-xl px-1 inline-block leading-tight">
                          MSV GARDEN,
                        </span>
                      </div>
                      <div>
                        <span className="bg-[#FFFF00] font-black text-black text-xs sm:text-sm px-1 inline-block leading-tight">
                          Dharmapuri – 636813
                        </span>
                      </div>
                      <div>
                        <span className="bg-[#FFFF00] font-black text-black text-xs sm:text-sm px-1 inline-block leading-tight">
                          7904020206
                        </span>
                      </div>
                    </div>

                    {/* Middle Column: To Customer Box */}
                    <div className="col-span-5 border border-black p-2 rounded-xs min-h-[140px] flex flex-col justify-between text-black">
                      <div className="space-y-1">
                        <p className="font-black text-xs sm:text-sm text-black leading-tight">
                          {customerName}
                        </p>
                        <p className="font-bold text-[11px] text-black leading-tight">
                          {addrDisplay}
                        </p>
                      </div>
                      {customerPhone && (
                        <p className="font-black text-xs sm:text-sm text-black pt-2 leading-tight">
                          {customerPhone}
                        </p>
                      )}
                    </div>

                    {/* Right Column: Ordered Plants Box */}
                    <div className="col-span-3 border border-black p-2 rounded-xs min-h-[140px] flex flex-col justify-start text-black">
                      <div className="space-y-1 font-bold text-xs text-black">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <p key={idx} className="leading-tight">
                              {item.name}{item.quantity > 1 ? ` (${item.quantity})` : ''}
                            </p>
                          ))
                        ) : (
                          <p className="leading-tight">Nursery Plant Sapling</p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
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
