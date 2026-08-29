import React, { useState } from 'react';
import { Order } from '../types';
import { Sprout, Printer, ArrowLeft, Download, Loader2, CheckCircle2 } from 'lucide-react';
import * as jspdfPkg from 'jspdf';
import { sanitizePdfText, cleanPlantLabelName } from '../utils/textSanitizer';
import { parseFullAddress } from '../utils/addressUtils';

const jsPDFClass: any = (jspdfPkg as any).jsPDF || (jspdfPkg as any).default || jspdfPkg;

const parseLabelCustomerInfo = (order: Order) => {
  const parsed = parseFullAddress(order.shippingAddress, order.customerName, order.customerPhone);
  const name = sanitizePdfText(parsed.fullName || order.customerName || 'Valued Customer', 'Valued Customer');
  const phone = sanitizePdfText(parsed.phone || order.customerPhone || '');
  const pincode = sanitizePdfText(parsed.pincode || '');
  const cleanAddress = sanitizePdfText(parsed.fullAddressString || 'Address details on order', 'Address details on order');

  return {
    name,
    cleanAddress,
    pincode,
    phone
  };
};

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
          const info = parseLabelCustomerInfo(order);

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

          // Line 1: VEERIKA ROSE GARDEN
          pdf.setFillColor(255, 255, 0); // Bright Yellow
          pdf.rect(labelX, fromContentY, 53, 7.5, 'F');
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11.5);
          pdf.text('VEERIKA ROSE GARDEN', labelX + 1, fromContentY + 5.5);

          // Line 2: Dharmapuri
          const line2Y = fromContentY + 9.5;
          pdf.setFillColor(255, 255, 0); // Bright Yellow
          pdf.rect(labelX, line2Y, 32, 6.2, 'F');
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.text('Dharmapuri', labelX + 1, line2Y + 4.6);

          // Line 3: +91 63812 03534
          const line3Y = line2Y + 8;
          pdf.setFillColor(255, 255, 0); // Bright Yellow
          pdf.rect(labelX, line3Y, 44, 6.5, 'F');
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11.5);
          pdf.text('+91 63812 03534', labelX + 1, line3Y + 4.8);

          // Line 4: SERVICE & COURIER LOGISTICS DETAILS
          const serviceStartY = line3Y + 9.5;
          const cleanCourier = sanitizePdfText(order.courierName || 'Professional Courier', 'Professional Courier');
          
          let cleanPotOption = 'Reduced Soil';
          if (order.potOption === 'FULL_SOIL_8INCH') {
            cleanPotOption = '8" Full Soil Root Pot';
          } else if (order.potOption === 'FULL_SOIL_6INCH') {
            cleanPotOption = '6" Full Soil Root Pot';
          } else if (order.potOption === 'FULL_SOIL' || cleanCourier.toLowerCase().includes('full soil')) {
            cleanPotOption = 'Full Soil Root Pot';
          } else {
            cleanPotOption = 'Reduced Soil (Transit Safe)';
          }

          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9.5);
          pdf.text(`Service: ${cleanCourier}`, labelX + 1, serviceStartY);

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.text(`Type: ${cleanPotOption}`, labelX + 1, serviceStartY + 4.6);

          if (order.packingOption === 'MAX_PROTECTION' || order.packingOption === 'EXTRA_SECURE') {
            const packText = order.packingOption === 'MAX_PROTECTION' ? 'Pack: Max Heavy Guard' : 'Pack: Extra Secure Bubble';
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8.5);
            pdf.text(packText, labelX + 1, serviceStartY + 9.0);
          }

          if (order.courierBranch || order.courierDistrict) {
            const branchText = sanitizePdfText(order.courierBranch || order.courierDistrict || '', '');
            if (branchText) {
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(8);
              const branchY = serviceStartY + (order.packingOption === 'MAX_PROTECTION' || order.packingOption === 'EXTRA_SECURE' ? 13.0 : 9.0);
              pdf.text(`Depot: ${branchText.slice(0, 24)}`, labelX + 1, branchY);
            }
          }

          // ================= 4. COLUMN 2: "To," CUSTOMER BOX =================
          const toBoxX = labelX + 58;
          const toBoxY = ly + 22;
          const toBoxW = 68;
          const toBoxH = 54;

          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(0.3);
          pdf.rect(toBoxX, toBoxY, toBoxW, toBoxH, 'S');

          // 1) Customer Name (BOLD)
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(13);
          const nameLines = pdf.splitTextToSize(info.name, toBoxW - 4);
          pdf.text(nameLines, toBoxX + 2.5, toBoxY + 5.2);

          let currentY = toBoxY + 5.2 + (nameLines.length * 4.8) + 0.8;

          // 2) Customer Address (Regular font)
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(11);
          const addrLines = pdf.splitTextToSize(info.cleanAddress, toBoxW - 4);
          const displayAddrLines = addrLines.slice(0, 4);
          pdf.text(displayAddrLines, toBoxX + 2.5, currentY);

          currentY += (displayAddrLines.length * 4.4) + 1.8;

          // 3) PINCODE (BOLD - placed right below address)
          if (info.pincode) {
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(13);
            pdf.text(`PINCODE: ${info.pincode}`, toBoxX + 2.5, currentY);
            currentY += 5.2;
          }

          // 4) Customer Phone Number (BOLD - placed right below pincode)
          if (info.phone) {
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(13);
            const phoneFormatted = info.phone.toLowerCase().startsWith('ph') || info.phone.toLowerCase().startsWith('mob')
              ? info.phone
              : `Mob: ${info.phone}`;
            pdf.text(phoneFormatted, toBoxX + 2.5, currentY);
          }

          // ================= 5. COLUMN 3: ORDERED PLANTS BOX =================
          const itemBoxX = toBoxX + toBoxW + 6;
          const itemBoxY = ly + 22;
          const itemBoxW = 52;
          const itemBoxH = 54;

          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(0.3);
          pdf.rect(itemBoxX, itemBoxY, itemBoxW, itemBoxH, 'S');

          // Plants List with Dynamic Adaptive Sizing for 10+ Items
          const totalPlantCount = order.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0;
          const itemCount = order.items?.length || 0;

          let itemFontSize = 11;
          let itemLineHeight = 4.2;
          let itemSpacing = 1.2;

          if (itemCount > 12) {
            itemFontSize = 7.2;
            itemLineHeight = 2.8;
            itemSpacing = 0.6;
          } else if (itemCount > 8) {
            itemFontSize = 8.2;
            itemLineHeight = 3.2;
            itemSpacing = 0.8;
          } else if (itemCount > 5) {
            itemFontSize = 9.5;
            itemLineHeight = 3.6;
            itemSpacing = 1.0;
          }

          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(itemFontSize);

          let itemY = itemBoxY + (itemFontSize > 9 ? 5.0 : 4.2);

          if (order.items && order.items.length > 0) {
            for (let i = 0; i < order.items.length; i++) {
              const item = order.items[i];
              const isLast = i === order.items.length - 1;
              const remainingAfterThis = order.items.length - (i + 1);

              // Check if there is enough space for another item or if we should print the overflow summary
              if (!isLast && itemY + (itemLineHeight * 2) + itemSpacing > itemBoxY + itemBoxH - 3.5) {
                // Print current item (1 line)
                const cleanItemName = cleanPlantLabelName(item.name, 'Rose Plant Sapling');
                const itemText = `${cleanItemName}${item.quantity > 1 ? ` (${item.quantity})` : ''}`;
                const splitItem = pdf.splitTextToSize(itemText, itemBoxW - 4);
                pdf.text(splitItem[0] || itemText, itemBoxX + 2.5, itemY);
                itemY += itemLineHeight + itemSpacing;

                // Print summary tag for remaining items
                if (remainingAfterThis > 0 && itemY <= itemBoxY + itemBoxH - 2.5) {
                  pdf.setFont('helvetica', 'bold');
                  pdf.setFontSize(Math.max(itemFontSize - 0.5, 7.0));
                  pdf.text(`+ ${remainingAfterThis} more (${totalPlantCount} Total Plants)`, itemBoxX + 2.5, itemY);
                }
                break;
              }

              if (itemY <= itemBoxY + itemBoxH - 3) {
                const cleanItemName = cleanPlantLabelName(item.name, 'Rose Plant Sapling');
                const itemText = `${cleanItemName}${item.quantity > 1 ? ` (${item.quantity})` : ''}`;
                const splitItem = pdf.splitTextToSize(itemText, itemBoxW - 4);
                const maxLines = itemCount > 8 ? 1 : 2;
                const linesToPrint = splitItem.slice(0, maxLines);
                pdf.text(linesToPrint, itemBoxX + 2.5, itemY);
                itemY += (linesToPrint.length * itemLineHeight) + itemSpacing;
              }
            }
          } else {
            pdf.text('Rose Plant Sapling', itemBoxX + 2.5, itemY);
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
              const info = parseLabelCustomerInfo(order);

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
                        <span className="bg-[#FFFF00] font-black text-black text-sm sm:text-base px-1 inline-block leading-tight uppercase tracking-tight">
                          VEERIKA ROSE GARDEN
                        </span>
                      </div>
                      <div>
                        <span className="bg-[#FFFF00] font-black text-black text-xs sm:text-sm px-1 inline-block leading-tight">
                          Dharmapuri
                        </span>
                      </div>
                      <div>
                        <span className="bg-[#FFFF00] font-black text-black text-xs sm:text-sm px-1 inline-block leading-tight">
                          +91 63812 03534
                        </span>
                      </div>

                      {/* Type of Service & Courier Details */}
                      <div className="pt-2 text-black text-[11px] sm:text-xs leading-tight font-bold space-y-0.5 border-t border-slate-300">
                        <p className="font-extrabold text-black truncate">
                          🚚 {order.courierName || 'Professional Courier'}
                        </p>
                        <p className="text-[10px] sm:text-[11px] font-semibold text-slate-800">
                          {order.potOption === 'FULL_SOIL_8INCH' ? '🪴 8" Full Soil Root Pot' :
                           order.potOption === 'FULL_SOIL_6INCH' ? '🪴 6" Full Soil Root Pot' :
                           order.potOption === 'FULL_SOIL' || (order.courierName || '').toLowerCase().includes('full soil') ? '🪴 Full Soil Root Pot' :
                           '🌱 Reduced Soil (Transit Safe)'}
                        </p>
                        {(order.packingOption === 'MAX_PROTECTION' || order.packingOption === 'EXTRA_SECURE') && (
                          <p className="text-[10px] font-medium text-slate-600">
                            {order.packingOption === 'MAX_PROTECTION' ? '📦 Max Heavy Guard' : '📦 Extra Secure Bubble'}
                          </p>
                        )}
                        {(order.courierBranch || order.courierDistrict) && (
                          <p className="text-[10px] text-slate-600 truncate">
                            📍 {order.courierBranch || order.courierDistrict}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Middle Column: To Customer Box */}
                    <div className="col-span-5 border border-black p-2.5 rounded-xs min-h-[140px] flex flex-col justify-start gap-1 text-black">
                      <div className="space-y-1">
                        {/* 1) Customer Name (BOLD) */}
                        <p className="font-black text-sm sm:text-base text-black leading-tight">
                          {info.name}
                        </p>
                        {/* 2) Customer Address (Regular font) */}
                        <p className="font-normal text-xs sm:text-sm text-black leading-tight">
                          {info.cleanAddress}
                        </p>
                      </div>
                      <div className="pt-1 space-y-0.5">
                        {/* 3) PINCODE (BOLD - placed right below address) */}
                        {info.pincode && (
                          <p className="font-black text-sm sm:text-base text-black leading-tight">
                            PINCODE: {info.pincode}
                          </p>
                        )}
                        {/* 4) Customer Phone Number (BOLD - placed right below pincode) */}
                        {info.phone && (
                          <p className="font-black text-sm sm:text-base text-black leading-tight">
                            {info.phone.toLowerCase().startsWith('ph') || info.phone.toLowerCase().startsWith('mob')
                              ? info.phone
                              : `Mob: ${info.phone}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Ordered Plants Box */}
                    <div className="col-span-3 border border-black p-2.5 rounded-xs min-h-[140px] flex flex-col justify-start text-black overflow-hidden">
                      {(() => {
                        const items = order.items || [];
                        const totalQty = items.reduce((s, i) => s + (i.quantity || 1), 0);
                        const count = items.length;
                        const fontSizeClass = count > 12 ? 'text-[9px] leading-[1.2]' : count > 8 ? 'text-[10px] leading-[1.25]' : count > 5 ? 'text-[11px] leading-tight' : 'text-xs sm:text-sm leading-tight';
                        const maxDisplay = count > 12 ? 10 : count > 8 ? 8 : 6;
                        const displayItems = items.slice(0, maxDisplay);
                        const remaining = count - maxDisplay;

                        return (
                          <div className={`space-y-0.5 font-bold text-black ${fontSizeClass}`}>
                            {items.length > 0 ? (
                              <>
                                {displayItems.map((item, idx) => (
                                  <p key={idx} className="truncate">
                                    • {cleanPlantLabelName(item.name, 'Rose Plant')}{item.quantity > 1 ? ` (${item.quantity})` : ''}
                                  </p>
                                ))}
                                {remaining > 0 && (
                                  <p className="font-black text-emerald-950 pt-0.5 border-t border-black/20">
                                    + {remaining} more ({totalQty} Total Plants)
                                  </p>
                                )}
                              </>
                            ) : (
                              <p>Rose Plant Sapling</p>
                            )}
                          </div>
                        );
                      })()}
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
