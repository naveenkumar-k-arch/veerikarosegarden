import React, { useState } from 'react';
import { Order } from '../types';
import { Sprout, Printer, ArrowLeft, Download, Loader2, CheckCircle2 } from 'lucide-react';
import * as jspdfPkg from 'jspdf';
import { sanitizePdfText, cleanPlantLabelName } from '../utils/textSanitizer';
import { parseFullAddress } from '../utils/addressUtils';
import { isWhatsAppOrder } from '../utils/orderStages';

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

          // ================= 2. SUBHEADER ROW: "From :", "To,", "Ordered Plants:" =================
          const subheaderY = ly + 18.5;
          const boxTopY = ly + 21;
          const boxHeight = 64;

          const col1X = labelX;
          const col1W = 54;

          const toBoxX = col1X + col1W + 4;
          const toBoxW = 57;
          const toBoxY = boxTopY;
          const toBoxH = boxHeight;

          const itemBoxX = toBoxX + toBoxW + 4;
          const itemBoxW = 65;
          const itemBoxY = boxTopY;
          const itemBoxH = boxHeight;

          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10.5);
          pdf.text('From :', col1X, subheaderY);
          pdf.text('To,', toBoxX, subheaderY);
          pdf.text('Ordered Plants:', itemBoxX, subheaderY);

          // ================= 3. COLUMN 1: "From :" DETAILS (Yellow Highlights) =================
          const fromContentY = boxTopY;

          // Line 1: VEERIKA ROSE GARDEN
          pdf.setFillColor(255, 255, 0); // Bright Yellow
          pdf.rect(col1X, fromContentY, 52, 7.5, 'F');
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11.5);
          pdf.text('VEERIKA ROSE GARDEN', col1X + 1, fromContentY + 5.5);

          // Line 2: Dharmapuri
          const line2Y = fromContentY + 9.5;
          pdf.setFillColor(255, 255, 0); // Bright Yellow
          pdf.rect(col1X, line2Y, 32, 6.2, 'F');
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.text('Dharmapuri', col1X + 1, line2Y + 4.6);

          // Line 3: +91 63812 03534
          const line3Y = line2Y + 8;
          pdf.setFillColor(255, 255, 0); // Bright Yellow
          pdf.rect(col1X, line3Y, 44, 6.5, 'F');
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11.5);
          pdf.text('+91 63812 03534', col1X + 1, line3Y + 4.8);

          // Line 4: SERVICE & COURIER LOGISTICS DETAILS (Strict 50mm clamp)
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
          const serviceLines = pdf.splitTextToSize(`Service: ${cleanCourier}`, 50);
          pdf.text(serviceLines.slice(0, 2), col1X + 1, serviceStartY);

          const nextServiceY = serviceStartY + (serviceLines.length * 4.2) + 0.5;
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          const typeLines = pdf.splitTextToSize(`Type: ${cleanPotOption}`, 50);
          pdf.text(typeLines[0], col1X + 1, nextServiceY);

          let logisticsNextY = nextServiceY + 4.2;
          if (order.packingOption === 'MAX_PROTECTION' || order.packingOption === 'EXTRA_SECURE') {
            const packText = order.packingOption === 'MAX_PROTECTION' ? 'Pack: Max Heavy Guard' : 'Pack: Extra Secure Bubble';
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8.5);
            pdf.text(packText, col1X + 1, logisticsNextY);
            logisticsNextY += 4.0;
          }

          if (order.courierBranch || order.courierDistrict) {
            const branchText = sanitizePdfText(order.courierBranch || order.courierDistrict || '', '');
            if (branchText) {
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(8);
              pdf.text(`Depot: ${branchText.slice(0, 24)}`, col1X + 1, logisticsNextY);
              logisticsNextY += 4.0;
            }
          }

          // Line 5: Serial Number, Order ID & Order Source (Website Order / WhatsApp Order)
          const isWA = isWhatsAppOrder(order);
          const sourceLabel = isWA ? 'WhatsApp Order' : 'Website Order';
          const orderSerial = (pageIndex * chunkSize) + orderIdx + 1;
          const orderIdStr = order.id || (order as any).orderNumber || '';

          const metaStartY = Math.max(logisticsNextY + 1.5, boxTopY + boxHeight - 10.5);
          
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9.5);
          pdf.text(`S.No: #${orderSerial} • ${orderIdStr}`, col1X + 1, metaStartY);

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9.5);
          pdf.text(sourceLabel, col1X + 1, metaStartY + 4.5);

          // ================= 4. COLUMN 2: "To," CUSTOMER BOX =================
          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(0.3);
          pdf.rect(toBoxX, toBoxY, toBoxW, toBoxH, 'S');

          // 1) Customer Name (BOLD)
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12.5);
          const nameLines = pdf.splitTextToSize(info.name, toBoxW - 4);
          pdf.text(nameLines, toBoxX + 2.5, toBoxY + 5.2);

          let currentY = toBoxY + 5.2 + (nameLines.length * 4.8) + 0.8;

          // 2) Customer Address (Regular font)
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10.5);
          const addrLines = pdf.splitTextToSize(info.cleanAddress, toBoxW - 4);
          const displayAddrLines = addrLines.slice(0, 4);
          pdf.text(displayAddrLines, toBoxX + 2.5, currentY);

          currentY += (displayAddrLines.length * 4.4) + 1.8;

          // 3) PINCODE (BOLD - placed right below address)
          if (info.pincode) {
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(12.5);
            pdf.text(`PINCODE: ${info.pincode}`, toBoxX + 2.5, currentY);
            currentY += 5.2;
          }

          // 4) Customer Phone Number (BOLD - placed right below pincode)
          if (info.phone) {
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(12.5);
            const phoneFormatted = info.phone.toLowerCase().startsWith('ph') || info.phone.toLowerCase().startsWith('mob')
              ? info.phone
              : `Mob: ${info.phone}`;
            pdf.text(phoneFormatted, toBoxX + 2.5, currentY);
          }

          // ================= 5. COLUMN 3: ORDERED PLANTS BOX =================
          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(0.3);
          pdf.rect(itemBoxX, itemBoxY, itemBoxW, itemBoxH, 'S');

          const items = order.items || [];
          const itemCount = items.length;
          const isTwoCol = itemCount > 8;

          if (items.length > 0) {
            if (isTwoCol) {
              const colW = (itemBoxW - 6) / 2;
              const leftItems = items.slice(0, Math.ceil(itemCount / 2));
              const rightItems = items.slice(Math.ceil(itemCount / 2));
              const itemFontSize = itemCount > 18 ? 7.8 : 8.8;
              const itemLineHeight = itemCount > 18 ? 3.2 : 3.8;

              pdf.setTextColor(0, 0, 0);
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(itemFontSize);

              // Render left column
              let lY = itemBoxY + 4.5;
              for (const it of leftItems) {
                if (lY <= itemBoxY + itemBoxH - 2.5) {
                  const cleanName = cleanPlantLabelName(it.name, 'Rose Plant');
                  const itemText = `• ${cleanName}${it.quantity > 1 ? ` (${it.quantity})` : ''}`;
                  const split = pdf.splitTextToSize(itemText, colW);
                  pdf.text(split[0] || itemText, itemBoxX + 2.0, lY);
                  lY += itemLineHeight;
                }
              }

              // Render right column
              let rY = itemBoxY + 4.5;
              for (const it of rightItems) {
                if (rY <= itemBoxY + itemBoxH - 2.5) {
                  const cleanName = cleanPlantLabelName(it.name, 'Rose Plant');
                  const itemText = `• ${cleanName}${it.quantity > 1 ? ` (${it.quantity})` : ''}`;
                  const split = pdf.splitTextToSize(itemText, colW);
                  pdf.text(split[0] || itemText, itemBoxX + (itemBoxW / 2) + 2.0, rY);
                  rY += itemLineHeight;
                }
              }
            } else {
              // 1 to 8 plants: large bold font nicely distributed
              const itemFontSize = itemCount <= 4 ? 11.5 : 10.5;
              const itemLineHeight = itemCount <= 4 ? 6.5 : 5.2;

              pdf.setTextColor(0, 0, 0);
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(itemFontSize);

              let itemY = itemBoxY + 5.5;
              for (const it of items) {
                if (itemY <= itemBoxY + itemBoxH - 2.5) {
                  const cleanName = cleanPlantLabelName(it.name, 'Rose Plant');
                  const itemText = `• ${cleanName}${it.quantity > 1 ? ` (${it.quantity})` : ''}`;
                  const split = pdf.splitTextToSize(itemText, itemBoxW - 4);
                  pdf.text(split[0] || itemText, itemBoxX + 2.5, itemY);
                  itemY += itemLineHeight;
                }
              }
            }
          } else {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(11);
            pdf.text('• Rose Plant Sapling', itemBoxX + 2.5, itemBoxY + 6.0);
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
                  <div className="grid grid-cols-12 gap-3 text-xs font-normal text-black pt-1">
                    <div className="col-span-4">
                      <span>From :</span>
                    </div>
                    <div className="col-span-4">
                      <span>To,</span>
                    </div>
                    <div className="col-span-4">
                      <span className="font-bold text-[11px] text-slate-700">Ordered Plants:</span>
                    </div>
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

                      {/* Order ID, Serial Number & Order Source (Website / WhatsApp) */}
                      <div className="pt-2 border-t border-slate-300 space-y-0.5 text-black">
                        <p className="font-bold text-[11px] sm:text-xs text-black leading-tight">
                          S.No: #{ (pageIndex * chunkSize) + orderIdx + 1 } • {order.id || (order as any).orderNumber}
                        </p>
                        <p className="font-bold text-[11px] sm:text-xs text-black leading-tight">
                          {isWhatsAppOrder(order) ? 'WhatsApp Order' : 'Website Order'}
                        </p>
                      </div>
                    </div>

                    {/* Middle Column: To Customer Box */}
                    <div className="col-span-4 border border-black p-2 rounded-xs min-h-[155px] flex flex-col justify-start gap-1 text-black">
                      <div className="space-y-0.5">
                        {/* 1) Customer Name (BOLD) */}
                        <p className="font-black text-sm sm:text-base text-black leading-tight">
                          {info.name}
                        </p>
                        {/* 2) Customer Address (Regular font) */}
                        <p className="font-normal text-xs sm:text-sm text-black leading-tight">
                          {info.cleanAddress}
                        </p>
                      </div>
                      <div className="pt-1 space-y-0.5 mt-auto">
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

                    {/* Right Column: Ordered Plants Box (Extended full height & width) */}
                    <div className="col-span-4 border border-black p-2 rounded-xs min-h-[155px] flex flex-col justify-start text-black overflow-hidden bg-white">
                      {(() => {
                        const items = order.items || [];
                        const count = items.length;
                        const isTwoCol = count > 8;
                        const fontSizeClass = count > 18 ? 'text-[7.5px] leading-[1.15]' : count > 12 ? 'text-[8.5px] leading-[1.18]' : count > 6 ? 'text-[9.5px] leading-[1.22]' : 'text-xs leading-tight';

                        return (
                          <div className={`font-bold text-black ${fontSizeClass} ${isTwoCol ? 'grid grid-cols-2 gap-x-1.5 gap-y-0.5' : 'space-y-0.5'}`}>
                            {items.length > 0 ? (
                              items.map((item, idx) => (
                                <p key={idx} className="truncate" title={cleanPlantLabelName(item.name, 'Rose Plant')}>
                                  • {cleanPlantLabelName(item.name, 'Rose Plant')}{item.quantity > 1 ? ` (${item.quantity})` : ''}
                                </p>
                              ))
                            ) : (
                              <p>• Rose Plant Sapling</p>
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
