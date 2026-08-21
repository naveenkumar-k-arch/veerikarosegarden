import * as jspdfPkg from 'jspdf';
import { Order } from '../../types.js';

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

      if (!cleanAddress) {
        cleanAddress = 'Address details on order';
      }

      return {
        name: name.trim(),
        cleanAddress: cleanAddress.startsWith('No') || cleanAddress.startsWith('Door') || cleanAddress.startsWith('Address')
          ? cleanAddress
          : `Address ${cleanAddress}`,
        pincode: pincode.trim(),
        phone: phone.trim()
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

    return {
      name: name.trim(),
      cleanAddress: cleanStr.startsWith('No') || cleanStr.startsWith('Door') || cleanStr.startsWith('Address')
        ? cleanStr
        : `Address ${cleanStr || 'Address details on order'}`,
      pincode: pincode.trim(),
      phone: phone.trim()
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

      // Plants List
      let itemY = itemBoxY + 5.2;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);

      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          if (itemY <= itemBoxY + itemBoxH - 4) {
            const itemText = `${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`;
            const splitItem = pdf.splitTextToSize(itemText, itemBoxW - 4);
            const linesToPrint = splitItem.slice(0, 2);
            pdf.text(linesToPrint, itemBoxX + 2.5, itemY);
            itemY += (linesToPrint.length * 4.4) + 1.5;
          }
        });
      } else {
        pdf.text('Nursery Plant Sapling', itemBoxX + 2.5, itemY);
      }
    });
  });

  const arrayBuffer = pdf.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
