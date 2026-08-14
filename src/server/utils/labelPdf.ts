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

    // ================= 4 HORIZONTAL LABELS PER A4 PAGE =================
    const cardPositionsY = [26, 90, 154, 218];
    const cardWidth = 190;
    const cardHeight = 58;

    pageOrders.forEach((order, orderIdx) => {
      const cardY = cardPositionsY[orderIdx] || 26;
      const labelNumber = pageIndex * chunkSize + orderIdx + 1;
      const customerName = order.customerName || (order.shippingAddress as any)?.fullName || 'Valued Customer';
      const customerPhone = order.customerPhone || (order.shippingAddress as any)?.phone || '';
      const fullAddress = formatAddress(order.shippingAddress);

      // Outer Card Border
      pdf.setDrawColor(180, 190, 205);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(10, cardY, cardWidth, cardHeight, 3.5, 3.5, 'S');

      // ---------------- COLUMN 1: FROM (10mm to 56mm, width 46mm) ----------------
      // Green Badge Number
      pdf.setFillColor(20, 83, 45); // #14532d
      pdf.roundedRect(14, cardY + 4, 8, 8, 1.8, 1.8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.text(String(labelNumber), 18, cardY + 9.8, { align: 'center' });

      // "From :"
      pdf.setTextColor(71, 85, 105);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('From :', 14, cardY + 18);

      // "VRG NURSERY"
      pdf.setTextColor(20, 83, 45);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.text('VRG NURSERY', 14, cardY + 24);

      // Address
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.text('Dharmapuri – 636813', 14, cardY + 30);

      // Store Phone
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text('7904020206', 14, cardY + 36);

      // Vertical Divider 1
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(56, cardY + 2, 56, cardY + cardHeight - 2);

      // ---------------- COLUMN 2: TO (58mm to 136mm, width 78mm) ----------------
      // "To,"
      pdf.setTextColor(20, 83, 45);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.text('To,', 61, cardY + 8.5);

      // Customer Name
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(customerName, 61, cardY + 14.5);

      // Address
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      const addrLines = pdf.splitTextToSize('Address ' + fullAddress, 70);
      const displayAddrLines = addrLines.slice(0, 4);
      pdf.text(displayAddrLines, 61, cardY + 19.5);

      // Customer Mobile (Right below address)
      let phoneY = cardY + 19.5 + (displayAddrLines.length * 3.8) + 4.5;
      if (phoneY > cardY + 53) phoneY = cardY + 53;
      if (customerPhone) {
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        pdf.text(customerPhone, 61, phoneY);
      }

      // Vertical Divider 2
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(136, cardY + 2, 136, cardY + cardHeight - 2);

      // ---------------- COLUMN 3: ORDERED PLANTS (138mm to 200mm, width 62mm) ----------------
      // "Ordered Plants"
      pdf.setTextColor(20, 83, 45);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.text('Ordered Plants', 141, cardY + 8.5);

      // Numbered Plants List
      let itemY = cardY + 14.5;
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, idx) => {
          if (itemY <= cardY + 52) {
            const itemText = `${idx + 1}. ${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`;
            const splitItem = pdf.splitTextToSize(itemText, 54);
            const displayItemLines = splitItem.slice(0, 2);
            pdf.setTextColor(30, 41, 59);
            pdf.setFontSize(7.5);
            pdf.setFont('helvetica', 'normal');
            pdf.text(displayItemLines, 141, itemY);
            itemY += (displayItemLines.length * 3.6) + 1.2;
          }
        });
      } else {
        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text('1. Nursery Plant Sapling', 141, itemY);
      }
    });

    // ================= FOOTER =================
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(10, 285, 200, 285);

    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Page ${pageIndex + 1} of ${pages.length}`, 10, 289);
    pdf.text('VRG Nursery Order Dispatch Label Sheet', 105, 289, { align: 'center' });
    pdf.text('veerikarosegarden.com', 200, 289, { align: 'right' });
  });

  const arrayBuffer = pdf.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
