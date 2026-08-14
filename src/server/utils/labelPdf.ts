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

  pages.forEach((pageOrders, pageIndex) => {
    if (pageIndex > 0) {
      pdf.addPage('a4', 'landscape');
    }

    // ================= TOP HEADER (A4 Landscape: 297mm × 210mm) =================
    // Header rounded container box
    pdf.setDrawColor(180, 190, 205);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(8, 6, 281, 24, 3, 3, 'S');

    // Title: VRG NURSERY
    pdf.setTextColor(20, 83, 45); // #14532d
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.text('VRG NURSERY', 125, 16, { align: 'center' });

    // Subtitle: Location & Phone
    pdf.setTextColor(20, 83, 45);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.text('📍 Dharmapuri – 636813       📞 7904020206', 125, 23, { align: 'center' });

    // Left Plant Emoji / Label
    pdf.setFontSize(14);
    pdf.text('🌿', 16, 18);

    // Right Metadata Box
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.text('Order Sheet Date', 216, 12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`: ${currentDateStr}`, 242, 12);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Total Orders', 216, 17);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`: ${pageOrders.length}`, 242, 17);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Prepared By', 216, 22);
    pdf.setFont('helvetica', 'normal');
    pdf.text(': Admin', 242, 22);

    // Right Plant Emoji
    pdf.setFontSize(14);
    pdf.text('🌿', 276, 18);

    // ================= 2x2 GRID OF 4 LABELS =================
    // Card 1: Top-Left (x=8, y=34)
    // Card 2: Top-Right (x=151, y=34)
    // Card 3: Bottom-Left (x=8, y=114)
    // Card 4: Bottom-Right (x=151, y=114)
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
      pdf.setTextColor(71, 85, 105);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.text('From :', pos.x + 2.5, pos.y + 15);

      // "VRG NURSERY"
      pdf.setTextColor(20, 83, 45);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('VRG NURSERY', pos.x + 2.5, pos.y + 21);

      // "Dharmapuri – 636813"
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.2);
      pdf.text('Dharmapuri – 636813', pos.x + 2.5, pos.y + 27);

      // Nursery Phone "7904020206"
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.8);
      pdf.text('7904020206', pos.x + 2.5, pos.y + 33);

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

      // Customer Address
      const addrStartY = pos.y + 12.5 + (nameLines.length * 3.5) + 1;
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.8);
      const addrLines = pdf.splitTextToSize(fullAddress.startsWith('Address') || fullAddress.startsWith('No') ? fullAddress : `Address ${fullAddress}`, 52);
      const displayAddrLines = addrLines.slice(0, 7);
      pdf.text(displayAddrLines, pos.x + 39, addrStartY);

      // Customer Phone Number (Bold at bottom)
      if (customerPhone) {
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.text(customerPhone, pos.x + 39, pos.y + cardHeight - 4.5);
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
    // Draw dashed line
    pdf.setLineDashPattern([2, 2], 0);
    pdf.line(8, 109.5, 289, 109.5);
    pdf.setLineDashPattern([], 0); // reset to solid

    // Scissor icon/text in the middle
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(8);
    pdf.text('✂', 10, 110.5);
    pdf.text('✂', 148, 110.5);

    // ================= BOTTOM FOOTER =================
    pdf.setDrawColor(180, 190, 205);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(8, 191, 281, 12, 2.5, 2.5, 'S');

    pdf.setTextColor(20, 83, 45);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.text(
      '🌿   Thank you for your order!    |    We will pack your plants with care and deliver safe & fresh.   🌿',
      148.5,
      198.5,
      { align: 'center' }
    );
  });

  const arrayBuffer = pdf.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
