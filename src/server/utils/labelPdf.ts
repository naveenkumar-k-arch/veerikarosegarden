import * as jspdfPkg from 'jspdf';
import { Order } from '../../types.js';

const jsPDFClass: any = (jspdfPkg as any).jsPDF || (jspdfPkg as any).default || jspdfPkg;

export function generateDispatchLabelsPdf(
  orders: Order[],
  batchNumber = '#005',
  sheetNumber = '#11106'
): Buffer {
  const pdf = new jsPDFClass({
    orientation: 'portrait',
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

  pages.forEach((pageOrders, pageIndex) => {
    if (pageIndex > 0) {
      pdf.addPage('a4', 'portrait');
    }

    // ================= HEADER =================
    // Sprout badge box
    pdf.setFillColor(209, 250, 229);
    pdf.roundedRect(10, 8, 10, 10, 2, 2, 'F');
    pdf.setTextColor(20, 83, 45);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('VRG', 15, 14.5, { align: 'center' });

    // VRG Nursery Title & Subtitle
    pdf.setTextColor(20, 83, 45);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('VRG NURSERY', 23, 13);

    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.text('Dharmapuri - 636813 | Phone: 7904020206', 23, 17.5);

    // Right Meta
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.text(`Label Sheet: ${sheetNumber}`, 200, 11, { align: 'right' });

    pdf.setFont('helvetica', 'normal');
    pdf.text(`Batch No : ${batchNumber}`, 200, 15, { align: 'right' });

    pdf.setTextColor(20, 83, 45);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Selected Orders : ${pageOrders.length}`, 200, 19, { align: 'right' });

    // Header Divider Line
    pdf.setDrawColor(20, 83, 45);
    pdf.setLineWidth(0.6);
    pdf.line(10, 22, 200, 22);

    // ================= 2x2 LABELS GRID =================
    const positions = [
      { x: 10, y: 26 },   // Top Left (1)
      { x: 108, y: 26 },  // Top Right (2)
      { x: 10, y: 154 },  // Bottom Left (3)
      { x: 108, y: 154 }  // Bottom Right (4)
    ];

    const cardWidth = 92;
    const cardHeight = 124;

    pageOrders.forEach((order, orderIdx) => {
      const pos = positions[orderIdx] || positions[0];
      const labelNumber = pageIndex * chunkSize + orderIdx + 1;
      const customerName = order.customerName || (order.shippingAddress as any)?.fullName || 'Valued Customer';
      const customerPhone = order.customerPhone || (order.shippingAddress as any)?.phone || '';
      const fullAddress = formatAddress(order.shippingAddress);

      // Outer Card Border
      pdf.setDrawColor(148, 163, 184); // slate-400
      pdf.setLineWidth(0.35);
      pdf.roundedRect(pos.x, pos.y, cardWidth, cardHeight, 3.5, 3.5, 'S');

      // ---------------- COLUMN 1: FROM (x to x+26) ----------------
      // Green Badge Number
      pdf.setFillColor(20, 83, 45); // #14532d
      pdf.roundedRect(pos.x + 2.5, pos.y + 3, 7.5, 7.5, 1.5, 1.5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(String(labelNumber), pos.x + 6.25, pos.y + 8.2, { align: 'center' });

      // "From :"
      pdf.setTextColor(71, 85, 105);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.text('From :', pos.x + 2.5, pos.y + 16);

      // "VRG NURSERY"
      pdf.setTextColor(20, 83, 45);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text('VRG NURSERY', pos.x + 2.5, pos.y + 21);

      // Address
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.8);
      pdf.text('Dharmapuri – 636813', pos.x + 2.5, pos.y + 26);

      // Phone
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.text('7904020206', pos.x + 2.5, pos.y + 32);

      // Vertical Divider 1
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.25);
      pdf.line(pos.x + 26.5, pos.y + 2, pos.x + 26.5, pos.y + cardHeight - 2);

      // ---------------- COLUMN 2: TO (x+27 to x+59) ----------------
      // "To,"
      pdf.setTextColor(20, 83, 45);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text('To,', pos.x + 28.5, pos.y + 7.5);

      // Customer Name
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      const nameLines = pdf.splitTextToSize(customerName, 29);
      pdf.text(nameLines, pos.x + 28.5, pos.y + 12.5);

      // Address lines
      const addrStartY = pos.y + 12.5 + (nameLines.length * 3.5) + 1;
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      const addrLines = pdf.splitTextToSize('Address ' + fullAddress, 29);
      const maxAddrLines = addrLines.slice(0, 12);
      pdf.text(maxAddrLines, pos.x + 28.5, addrStartY);

      // Customer Phone (Bottom)
      if (customerPhone) {
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text(customerPhone, pos.x + 28.5, pos.y + cardHeight - 4.5);
      }

      // Vertical Divider 2
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.25);
      pdf.line(pos.x + 59.5, pos.y + 2, pos.x + 59.5, pos.y + cardHeight - 2);

      // ---------------- COLUMN 3: ORDERED PLANTS (x+60 to x+91) ----------------
      // "Ordered Plants"
      pdf.setTextColor(20, 83, 45);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('Ordered Plants', pos.x + 61.5, pos.y + 7.5);

      // Numbered Items List
      let itemY = pos.y + 12.5;
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, idx) => {
          if (itemY < pos.y + cardHeight - 6) {
            const itemText = `${idx + 1}. ${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`;
            const splitItem = pdf.splitTextToSize(itemText, 29);
            pdf.setTextColor(30, 41, 59);
            pdf.setFontSize(6.8);
            pdf.setFont('helvetica', 'normal');
            pdf.text(splitItem, pos.x + 61.5, itemY);
            itemY += (splitItem.length * 3.3) + 1.2;
          }
        });
      } else {
        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(6.8);
        pdf.text('1. Nursery Plant Sapling', pos.x + 61.5, itemY);
      }
    });

    // ================= FOOTER =================
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(10, 285, 200, 285);

    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(6.8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Page ${pageIndex + 1} of ${pages.length}`, 10, 289);
    pdf.text('VRG Nursery Order Dispatch Label Sheet', 105, 289, { align: 'center' });
    pdf.text('veerikarosegarden.com', 200, 289, { align: 'right' });
  });

  const arrayBuffer = pdf.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
