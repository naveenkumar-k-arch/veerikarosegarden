import * as jspdfPkg from 'jspdf';
import { Order } from '../../types.js';
import { sanitizePdfText, cleanPlantLabelName } from '../../utils/textSanitizer.js';

const jsPDFClass: any = (jspdfPkg as any).jsPDF || (jspdfPkg as any).default || jspdfPkg;

export function generateDispatchLabelsPdf(
  orders: Order[],
  batchNumber = '#005',
  sheetNumber = '#11106'
): Buffer {
  // A4 Portrait: 210mm width × 297mm height
  const pdf = new jsPDFClass({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  // 3 labels per A4 Portrait page
  const chunkSize = 3;
  const pages: Order[][] = [];
  for (let i = 0; i < orders.length; i += chunkSize) {
    pages.push(orders.slice(i, i + chunkSize));
  }

  if (pages.length === 0) {
    pages.push([]);
  }

  const parseLabelCustomerInfo = (order: Order) => {
    let rawAddr: any = order.shippingAddress;
    let name = order.customerName || (order.shippingAddress as any)?.fullName || 'Valued Customer';
    let phone = order.customerPhone || (order.shippingAddress as any)?.phone || '';
    let pincode = '';

    if (typeof rawAddr === 'string') {
      try {
        const parsed = JSON.parse(rawAddr);
        if (parsed && typeof parsed === 'object') {
          rawAddr = parsed;
        }
      } catch {
        // keep string
      }
    }

    if (rawAddr && typeof rawAddr === 'object') {
      name = rawAddr.fullName || order.customerName || name;
      phone = rawAddr.phone || order.customerPhone || phone;
      pincode = rawAddr.pincode ? String(rawAddr.pincode).trim() : '';

      const rawParts = [
        rawAddr.houseNo ? `${rawAddr.houseNo}` : '',
        rawAddr.street,
        rawAddr.villageTown,
        rawAddr.district,
        rawAddr.state
      ].filter(Boolean);

      const uniqueParts: string[] = [];
      for (const p of rawParts) {
        const trimmed = String(p).trim();
        if (trimmed && (!uniqueParts.length || uniqueParts[uniqueParts.length - 1].toLowerCase() !== trimmed.toLowerCase())) {
          // Remove any embedded pincode from address lines to avoid redundant repeat
          const cleanPart = pincode ? trimmed.replace(new RegExp(`[\\-\\s,]*${pincode}\\b`, 'ig'), '').trim() : trimmed;
          if (cleanPart && (!uniqueParts.length || uniqueParts[uniqueParts.length - 1].toLowerCase() !== cleanPart.toLowerCase())) {
            uniqueParts.push(cleanPart);
          }
        }
      }

      let cleanAddress = uniqueParts.join(', ');
      if (!pincode) {
        const pinMatch = cleanAddress.match(/\b([1-9][0-9]{5})\b/);
        if (pinMatch) {
          pincode = pinMatch[1];
          cleanAddress = cleanAddress.replace(new RegExp(`[\\-\\s,]*${pincode}\\b`, 'ig'), '').trim();
        }
      }

      cleanAddress = sanitizePdfText(cleanAddress, 'Address details on order');
      const sanitizedName = sanitizePdfText(name, 'Valued Customer');
      const sanitizedPhone = sanitizePdfText(phone);
      const sanitizedPincode = sanitizePdfText(pincode);

      return {
        name: sanitizedName,
        cleanAddress: cleanAddress.startsWith('No') || cleanAddress.startsWith('Door') || cleanAddress.startsWith('Address')
          ? cleanAddress
          : `Address ${cleanAddress}`,
        pincode: sanitizedPincode,
        phone: sanitizedPhone
      };
    }

    // If string address
    let strAddr = String(rawAddr || '').trim();
    const pinMatch = strAddr.match(/\b([1-9][0-9]{5})\b/);
    if (pinMatch) {
      pincode = pinMatch[1];
      strAddr = strAddr.replace(new RegExp(`[\\-\\s,]*${pincode}\\b`, 'ig'), ' ');
    }

    const cleanStr = strAddr
      .replace(/^(full\s*)?address\s*[:\-]?\s*/i, '')
      .replace(/^name\s*:\s*[^,]+,\s*(address\s*:\s*)?/i, '')
      .replace(/(phone|mobile|mob|contact)\s*[:\-]?\s*\+?[0-9\s\-]+/gi, '')
      .replace(/\s+,/g, ',')
      .replace(/,\s*,/g, ',')
      .trim()
      .replace(/^,+\s*|,+\s*$/g, '');

    const sanitizedAddress = sanitizePdfText(cleanStr, 'Address details on order');
    const sanitizedName = sanitizePdfText(name, 'Valued Customer');
    const sanitizedPhone = sanitizePdfText(phone);
    const sanitizedPincode = sanitizePdfText(pincode);

    return {
      name: sanitizedName,
      cleanAddress: sanitizedAddress.startsWith('No') || sanitizedAddress.startsWith('Door') || sanitizedAddress.startsWith('Address')
        ? sanitizedAddress
        : `Address ${sanitizedAddress}`,
      pincode: sanitizedPincode,
      phone: sanitizedPhone
    };
  };

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

      if (order.packingOption === 'MAX_PROTECTION' || order.packingOption === 'EXTRA_SECURE') {
        const packText = order.packingOption === 'MAX_PROTECTION' ? 'Pack: Max Heavy Guard' : 'Pack: Extra Secure Bubble';
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.text(packText, col1X + 1, nextServiceY + 4.2);
      }

      if (order.courierBranch || order.courierDistrict) {
        const branchText = sanitizePdfText(order.courierBranch || order.courierDistrict || '', '');
        if (branchText) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          const branchY = nextServiceY + (order.packingOption === 'MAX_PROTECTION' || order.packingOption === 'EXTRA_SECURE' ? 8.2 : 4.2);
          pdf.text(`Depot: ${branchText.slice(0, 24)}`, col1X + 1, branchY);
        }
      }

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

  const arrayBuffer = pdf.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
