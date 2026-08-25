export type OrderStage = 'confirmed' | 'packing' | 'dispatched' | 'delivered';

/**
 * Standardize any legacy, DB, or mixed-case status string into one of the 4 strict order stages:
 * 1. 'confirmed'  (Order Confirmed / New Orders)
 * 2. 'packing'    (Nursery Packing & Protective Soil Wrap)
 * 3. 'dispatched' (Courier / In Transit)
 * 4. 'delivered'  (Delivered with Care)
 */
export function getOrderStage(status?: string | null): OrderStage {
  if (!status) return 'confirmed';
  const s = String(status).toUpperCase().trim();

  // Stage 4: Delivered
  if (s === 'DELIVERED' || s === 'COMPLETED') {
    return 'delivered';
  }

  // Stage 3: Courier / Dispatched
  if (
    s === 'DISPATCHED' ||
    s === 'OUT_FOR_DELIVERY' ||
    s === 'SHIPPED' ||
    s === 'COURIER' ||
    s === 'IN_TRANSIT'
  ) {
    return 'dispatched';
  }

  // Stage 2: Nursery Packing
  if (
    s === 'PACKING' ||
    s === 'PACKED' ||
    s === 'PROCESSING'
  ) {
    return 'packing';
  }

  // Stage 1: Confirmed (Default for CONFIRMED, PAID, PENDING, PLACED, etc.)
  return 'confirmed';
}

/**
 * Stage display metadata
 */
export const STAGE_CONFIG: Record<OrderStage, {
  step: number;
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  border: string;
  activeBg: string;
  iconName: string;
  description: string;
  dbStatus: string;
}> = {
  confirmed: {
    step: 1,
    label: '1. Confirmed',
    shortLabel: 'Confirmed',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    border: 'border-emerald-300',
    activeBg: 'bg-emerald-700 text-white shadow-xs',
    iconName: 'CheckCircle2',
    description: 'Order confirmed & payment verified. Waiting for packing.',
    dbStatus: 'CONFIRMED'
  },
  packing: {
    step: 2,
    label: '2. Packing',
    shortLabel: 'Packing',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    border: 'border-amber-300',
    activeBg: 'bg-amber-600 text-white shadow-xs',
    iconName: 'Box',
    description: 'Nursery roots wrapping with cocopeat and cardboard boxing.',
    dbStatus: 'PACKING'
  },
  dispatched: {
    step: 3,
    label: '3. Courier',
    shortLabel: 'Dispatched',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900',
    border: 'border-blue-300',
    activeBg: 'bg-blue-600 text-white shadow-xs',
    iconName: 'Truck',
    description: 'Dispatched with courier partner. Tracking number assigned.',
    dbStatus: 'DISPATCHED'
  },
  delivered: {
    step: 4,
    label: '4. Delivered',
    shortLabel: 'Delivered',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    border: 'border-purple-300',
    activeBg: 'bg-purple-700 text-white shadow-xs',
    iconName: 'CheckCheck',
    description: 'Delivered safely to customer doorstep.',
    dbStatus: 'DELIVERED'
  }
};

/**
 * Generate standard 7-line WhatsApp notification message for the 4 order stages:
 * 1. confirmed (7 lines)
 * 2. packing (7 lines)
 * 3. dispatched (7 lines)
 * 4. delivered (7 lines)
 */
export function generateOrderWhatsAppMessage(
  order: {
    id: string;
    grandTotal?: number;
    customerName?: string;
    customerPhone?: string;
    shippingAddress?: any;
    items?: any[];
    orderStatus?: string | null;
    paymentStatus?: string | null;
    paymentMethod?: string | null;
    courierName?: string | null;
    trackingNumber?: string | null;
  },
  stageInput?: OrderStage,
  extra?: {
    origin?: string;
    courierName?: string;
    trackingNumber?: string;
  }
): string {
  const stage = stageInput || getOrderStage(order.orderStatus);
  const customerName = order.customerName || order.shippingAddress?.fullName || 'Valued Customer';
  const origin = extra?.origin || (typeof window !== 'undefined' ? window.location.origin : 'https://veerikarosegarden.com');
  const trackingUrl = `${origin}/#/order-status/${order.id}`;

  if (stage === 'confirmed') {
    const isPaid = order.paymentStatus === 'SUCCESS';
    const payText = isPaid ? 'PAID ✅' : `${order.paymentMethod || 'COD'} (₹${order.grandTotal ?? 0})`;
    const itemCount = order.items?.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0) || order.items?.length || 1;
    const itemsSummary = order.items && order.items.length > 0
      ? (order.items.length === 1 ? `${order.items[0].name} (${order.items[0].quantity || 1} No)` : `${order.items[0].name} + ${order.items.length - 1} more (${itemCount} plants)`)
      : 'Live Plants & Saplings';

    return [
      `🌿 *Veerika Rose Garden - Order Confirmed!*`,
      `👤 Dear ${customerName}, thank you for ordering with us.`,
      `📋 *Order ID:* #${order.id}`,
      `💰 *Total Amount:* ₹${order.grandTotal ?? 0} (${payText})`,
      `🌱 *Items:* ${itemsSummary}`,
      `📦 *Next Step:* Our farm team will prepare your live saplings.`,
      `📞 Contact: +91 72008 26129 | Happy Gardening! 🌸`
    ].join('\n');
  }

  if (stage === 'packing') {
    return [
      `🌿 *Veerika Rose Garden - Packing in Progress!*`,
      `👤 Dear ${customerName}, your plants are being packed.`,
      `📋 *Order ID:* #${order.id}`,
      `🪴 *Status:* Live saplings root-moisturized & box packed.`,
      `🚚 Your parcel will be handed over to courier shortly.`,
      `📦 Tracking details will be shared once dispatched.`,
      `📞 Helpline: +91 72008 26129 | Happy Gardening! 🌸`
    ].join('\n');
  }

  if (stage === 'dispatched') {
    const courier = extra?.courierName || order.courierName || 'Professional Courier';
    const awb = extra?.trackingNumber || order.trackingNumber || 'In Transit';
    return [
      `🚚 *Veerika Rose Garden - Order Dispatched!*`,
      `👤 Dear ${customerName}, your parcel is on the way.`,
      `📋 *Order ID:* #${order.id}`,
      `📦 *Courier:* ${courier} | *AWB:* ${awb}`,
      `📹 *Note:* Please take a continuous unboxing video upon arrival.`,
      `🔗 *Live Tracking:* ${trackingUrl}`,
      `📞 Helpline: +91 72008 26129 | Veerika Rose Garden 🌸`
    ].join('\n');
  }

  // Stage 4: Delivered
  return [
    `🌸 *Veerika Rose Garden - Order Delivered!*`,
    `👤 Dear ${customerName}, your plants have been delivered.`,
    `📋 *Order ID:* #${order.id}`,
    `🌿 *Care Tip:* Keep in mild shade for 7 days & water gently.`,
    `🚫 Avoid chemical fertilizers/DAP for the first 30 days.`,
    `🌟 Thank you for supporting our organic rose nursery.`,
    `📞 Helpline: +91 72008 26129 | Happy Gardening! 🪴`
  ].join('\n');
}

/**
 * Checks if an order was created or added via WhatsApp / Offline entry.
 */
export function isWhatsAppOrder(o: any): boolean {
  if (!o) return false;
  const pm = (o.paymentMethod || '').toString().toUpperCase();
  const id = (o.id || o.orderNumber || '').toString().toUpperCase();
  const txnId = (o.merchantTransactionId || '').toString().toUpperCase();
  const notes = (o.notes || '').toString().toLowerCase();

  return (
    pm === 'WHATSAPP' ||
    pm === 'OFFLINE' ||
    pm === 'MANUAL' ||
    id.startsWith('VRG-WA') ||
    id.startsWith('WA-') ||
    txnId.startsWith('WA_') ||
    txnId.startsWith('VRG-WA') ||
    notes.includes('whatsapp') ||
    notes.includes('offline order') ||
    notes.includes('whatsapp chat')
  );
}

