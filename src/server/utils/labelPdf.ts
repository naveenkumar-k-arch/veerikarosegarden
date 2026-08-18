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

  const arrayBuffer = pdf.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
