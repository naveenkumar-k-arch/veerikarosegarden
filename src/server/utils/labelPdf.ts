import * as jspdfPkg from 'jspdf';
import { Order } from '../../types.js';

const jsPDFClass: any = (jspdfPkg as any).jsPDF || (jspdfPkg as any).default || jspdfPkg;

export function generateDispatchLabelsPdf(
  orders: Order[],
  batchNumber = '#005',
  sheetNumber = '#11106'
): Buffer {
  // A4 Landscape: 297mm width × 210mm height
  const pdf = new jsPDFClass({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const chunkSize = 4;
  const pages: Order[][] = [];
  for (let i = 0; i < orders.length; i += chunkSize) {
    pages.push(orders.slice(i, i + chunkSize));
  }

  if (pages.length === 0) {
    pages.push([]);
  }

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

  function drawLeafBadge(pdf: any, x: number, y: number, r = 5.5) {
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
  }

  function drawLocationPin(pdf: any, x: number, y: number, size = 0.85) {
    pdf.saveGraphicsState();
    pdf.setFillColor(220, 38, 38); // #dc2626
    pdf.setDrawColor(185, 28, 28);
    pdf.circle(x, y - 1 * size, 1.5 * size, 'F');
    pdf.triangle(x - 1.3 * size, y - 0.4 * size, x + 1.3 * size, y - 0.4 * size, x, y + 2 * size, 'FD');
    pdf.setFillColor(255, 255, 255);
    pdf.circle(x, y - 1 * size, 0.55 * size, 'F');
    pdf.restoreGraphicsState();
  }

  function drawPhoneIcon(pdf: any, x: number, y: number, size = 0.85) {
    pdf.saveGraphicsState();
    pdf.setFillColor(20, 83, 45); // #14532d
    pdf.circle(x, y, 1.8 * size, 'F');
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.4 * size);
    pdf.ellipse(x, y, 0.9 * size, 0.5 * size, 'S');
    pdf.restoreGraphicsState();
  }

  function drawScissors(pdf: any, x: number, y: number, size = 0.8) {
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
  }

  pages.forEach((pageOrders, pageIndex) => {
    if (pageIndex > 0) {
      pdf.addPage('a4', 'landscape');
    }

    // ================= TOP HEADER (A4 Landscape: 297mm × 210mm) =================
    // Header rounded container box
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
    pdf.text('7200826129', 144, 22.5);

    // Right Metadata Box
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.text('Order Sheet Date', 214, 12);
    pdf.text(`: ${currentDateStr}`, 240, 12);

    pdf.text('Total Orders', 214, 17);
    pdf.text(`: ${pageOrders.length}`, 240, 17);

    pdf.text('Prepared By', 214, 22);
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

      // ---------------- COLUMN 1: FROM (pos.x to pos.x + 36, width = 36mm) ----------------
      // Green Number Badge
      pdf.setFillColor(20, 83, 45); // #14532d
      pdf.roundedRect(pos.x + 2.5, pos.y + 2.5, 7.5, 7.5, 1.5, 1.5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.text(String(labelNumber), pos.x + 6.25, pos.y + 7.8, { align: 'center' });

      // "From :"
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('From :', pos.x + 2.5, pos.y + 15);

      // "VRG NURSERY"
      pdf.setTextColor(20, 83, 45);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.text('VRG NURSERY', pos.x + 2.5, pos.y + 21);

      // "Dharmapuri - 636813"
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('Dharmapuri - 636813', pos.x + 2.5, pos.y + 27);

      // Nursery Phone "7200826129"
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text('7200826129', pos.x + 2.5, pos.y + 33);

      // Courier Partner Tag
      const courierPartnerTag = order.courierName || 'Professional Courier';
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(pos.x + 2, pos.y + 38, 32, 10, 1, 1, 'F');
      pdf.setDrawColor(187, 247, 208);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(pos.x + 2, pos.y + 38, 32, 10, 1, 1, 'S');
      pdf.setTextColor(20, 83, 45);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      const cLines = pdf.splitTextToSize(courierPartnerTag + (order.courierBranch ? ` (${order.courierBranch})` : ''), 30);
      pdf.text(cLines.slice(0, 3), pos.x + 3, pos.y + 42);

      // Vertical Divider 1
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.25);
      pdf.line(pos.x + 36, pos.y + 2, pos.x + 36, pos.y + cardHeight - 2);

      // ---------------- COLUMN 2: TO (pos.x + 38 to pos.x + 94, width = 56mm) ----------------
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

      // Customer Address (Bolder, matched size, crisp contrast)
      const cleanAddr = fullAddress.replace(/^(full\s*)?address\s*[:\-]?\s*/i, '').replace(/^name\s*:\s*[^,]+,\s*(address\s*:\s*)?/i, '').trim();
      const addrStartY = pos.y + 12.5 + (nameLines.length * 3.6) + 1;
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.2);
      const addrLines = pdf.splitTextToSize(cleanAddr.startsWith('No') || cleanAddr.startsWith('Door') || cleanAddr.startsWith('Address') ? cleanAddr : `Address: ${cleanAddr}`, 52);
      const displayAddrLines = addrLines.slice(0, 6);
      pdf.text(displayAddrLines, pos.x + 39, addrStartY);

      // Customer Phone Number (Bolded, matched size)
      if (customerPhone) {
        const phoneY = addrStartY + (displayAddrLines.length * 3.6) + 2.5;
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        const formattedPhone = customerPhone.toLowerCase().startsWith('ph') ? customerPhone : `Ph: ${customerPhone}`;
        pdf.text(formattedPhone, pos.x + 39, Math.min(phoneY, pos.y + cardHeight - 4));
      }

      // Vertical Divider 2
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.25);
      pdf.line(pos.x + 94, pos.y + 2, pos.x + 94, pos.y + cardHeight - 2);

      // ---------------- COLUMN 3: ORDERED PLANTS (pos.x + 96 to pos.x + 136, width = 40mm) ----------------
      // "Ordered Plants"
      pdf.setTextColor(20, 83, 45);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text('Ordered Plants', pos.x + 97, pos.y + 7);

      // Plant Items List (Bolded, clear matched size)
      let itemY = pos.y + 12.5;
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, idx) => {
          if (itemY <= pos.y + cardHeight - 5) {
            const itemText = `${idx + 1}. ${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`;
            const splitItem = pdf.splitTextToSize(itemText, 38);
            const displayItemLines = splitItem.slice(0, 2);
            pdf.setTextColor(15, 23, 42);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.text(displayItemLines, pos.x + 97, itemY);
            itemY += (displayItemLines.length * 3.5) + 1.2;
          }
        });
      } else {
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text('1. Nursery Plant Sapling', pos.x + 97, itemY);
      }
    });

    // ================= MIDDLE HORIZONTAL DASHED CUT LINE =================
    pdf.setDrawColor(180, 190, 205);
    pdf.setLineWidth(0.2);
    // Draw dashed line
    pdf.setLineDashPattern([2, 2], 0);
    pdf.line(8, 109.5, 289, 109.5);
    pdf.setLineDashPattern([], 0); // reset to solid

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

  const arrayBuffer = pdf.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
