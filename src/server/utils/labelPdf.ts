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

      // Customer Address (Bolder, matched size, crisp contrast)
      const cleanAddr = fullAddress.replace(/^(full\s*)?address\s*[:\-]?\s*/i, '').replace(/^name\s*:\s*[^,]+,\s*(address\s*:\s*)?/i, '').trim();
      const addrStartY = pos.y + 19 + (nameLines.length * 8.8) + 1;
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      const addrLines = pdf.splitTextToSize(cleanAddr.startsWith('No') || cleanAddr.startsWith('Door') || cleanAddr.startsWith('Address') ? cleanAddr : `Address: ${cleanAddr}`, 54);
      const displayAddrLines = addrLines.slice(0, 4);
      pdf.text(displayAddrLines, pos.x + 38, addrStartY);

      // Customer Phone Number (Bolded, matched size)
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

      // Plant Items List (Bolded, clear matched size)
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

  const arrayBuffer = pdf.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
