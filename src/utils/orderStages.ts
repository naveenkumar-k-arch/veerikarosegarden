import { parseFullAddress } from './addressUtils';

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
    deliveryOption?: string | null;
    potOption?: string | null;
    serviceType?: string | null;
  },
  stageInput?: OrderStage,
  extra?: {
    origin?: string;
    courierName?: string;
    trackingNumber?: string;
  }
): string {
  const stage = stageInput || getOrderStage(order.orderStatus);
  const parsedAddr = parseFullAddress(order.shippingAddress, order.customerName, order.customerPhone);
  const customerName = parsedAddr.fullName || order.customerName || 'Valued Customer';
  const origin = extra?.origin || (typeof window !== 'undefined' ? window.location.origin : 'https://www.vrgnursery.in');
  const trackingUrl = `${origin}/#/order-status/${order.id}`;

  if (stage === 'confirmed') {
    const addressStr = parsedAddr.fullAddressString || 'N/A';
    const pincodeStr = parsedAddr.pincode || 'N/A';
    const phoneStr = parsedAddr.phone || order.customerPhone || 'N/A';
    const altPhone = parsedAddr.alternatePhone;
    const fullPhoneDisplay = altPhone && altPhone !== phoneStr ? `${phoneStr} (Alt: ${altPhone})` : phoneStr;

    const itemsSummary = order.items && order.items.length > 0
      ? order.items.map((it: any) => `${it.name || it.title || 'Plant'} (Qty: ${it.quantity || 1})`).join(', ')
      : 'Live Plants & Saplings';

    const rawOpt = (order.serviceType || order.deliveryOption || order.potOption || (typeof order.shippingAddress === 'object' ? order.shippingAddress?.deliveryOption : '') || '').toString().toUpperCase();
    let serviceTypeStr = 'Full Soil / Ready Soil / Matured Parcel Service';
    if (rawOpt.includes('6INCH')) serviceTypeStr = 'Full Soil (6 Inch Pot)';
    else if (rawOpt.includes('8INCH')) serviceTypeStr = 'Full Soil (8 Inch Pot)';
    else if (rawOpt.includes('FULL_SOIL')) serviceTypeStr = 'Full Soil Delivery';
    else if (rawOpt.includes('REDUCED')) serviceTypeStr = 'Reduced Soil Delivery';
    else if (rawOpt.includes('METTUR')) serviceTypeStr = 'Mettur Parcel Service';

    return [
      `🌸 VEERIKA ROSE GARDEN 🌸`,
      ``,
      `ORDER CONFIRMATION`,
      ``,
      `Customer Name: ${customerName}`,
      ``,
      `Address: ${addressStr}`,
      ``,
      `Phone Number: ${fullPhoneDisplay}`,
      ``,
      `Pincode: ${pincodeStr}`,
      ``,
      `Plan: ${itemsSummary}`,
      ``,
      `Service Type: ${serviceTypeStr}`,
      ``,
      `Please confirm your Address, Plan & Service Type:`,
      ``,
      `👉 YES – Address, Plan & Service Type are correct`,
      `👉 NO – Please update the Address, Plan & Service Type and reply back to us.`,
      ``,
      `✅ Your order has been confirmed!`,
      ``,
      `📦 Your order will be dispatched within 5–7 days from the date of order confirmation.`,
      ``,
      `🚚 After dispatch: Your order will be delivered within 2 days.`,
      ``,
      `📍 Tracking ID: We will share your Tracking ID once your order has been dispatched.`,
      ``,
      `Thank you for your order! ❤️`,
      ``,
      `🌸 VEERIKA ROSE GARDEN 🌸`
    ].join('\n');
  }

  if (stage === 'packing') {
    return [
      `🌹 VEERIKA ROSE GARDEN 🌹`,
      ``,
      `📦 PACKING UPDATE`,
      ``,
      `Your order packing has been processed successfully. ✅`,
      ``,
      `Once the packing process is completed, your order will be dispatched. 🚚`,
      ``,
      `📍 Dispatch Update: We will share the dispatch confirmation and Tracking ID once your order has been dispatched.`,
      ``,
      `Thank you for your order! ❤️`,
      ``,
      `🌹 VEERIKA ROSE GARDEN 🌹`
    ].join('\n');
  }

  if (stage === 'dispatched') {
    const awb = extra?.trackingNumber || order.trackingNumber || 'Shared upon courier scan';
    const courierPartner = extra?.courierName || order.courierName || 'Professional Courier';
    return [
      `🌹 VEERIKA ROSE GARDEN 🌹`,
      ``,
      `📦 ORDER DISPATCHED / ஆர்டர் அனுப்பப்பட்டது`,
      ``,
      `🚚 Courier Partner / கூரியர்: ${courierPartner}`,
      `🔎 Tracking ID / டிராக்கிங் ஐடி: ${awb}`,
      ``,
      `🔗 Track Your Order / ஆர்டரை Track செய்ய:`,
      `${trackingUrl}`,
      ``,
      `✅ Your order has been dispatched today! 🚚`,
      `உங்களுடைய ஆர்டர் இன்று Dispatch செய்யப்பட்டுள்ளது.`,
      ``,
      `You can track your parcel using the above Tracking ID through the tracking link.`,
      `மேலே கொடுக்கப்பட்டுள்ள Tracking ID மற்றும் Tracking Link மூலம் உங்கள் Parcel-ஐ Track செய்யலாம்.`,
      ``,
      `📦 ${courierPartner} – General Reminder / பொதுவான நினைவூட்டல்:`,
      ``,
      `⚠️ If you don't receive the parcel within 2 working days, please contact your nearby ${courierPartner} office or check the tracking website.`,
      ``,
      `⚠️ உங்களுடைய Parcel 2 வேலை நாட்களுக்குள் கிடைக்கவில்லை என்றால், அருகில் உள்ள ${courierPartner} Office-ஐ அணுகவும் அல்லது Tracking Website-ல் Check செய்யவும்.`,
      ``,
      `📹 UNBOXING VIDEO MUST`,
      `📹 Parcel-ஐ Open செய்யும்போது Unboxing Video கட்டாயம் எடுக்கவும்.`,
      ``,
      `🌿 FOR REDUCED SOIL PLANTS / மண்ணை குறைத்து வாங்கிய செடிகளுக்கு மட்டும்:`,
      ``,
      `1️⃣ English:`,
      `After receiving the plant from Professional Courier, place the cover in a bucket of water and make small holes in the cover. Keep it for 4–5 hours.`,
      ``,
      `தமிழ்:`,
      `Professional Courier-ல் செடியை Receive செய்ததும், Cover-ஐ ஒரு Bucket தண்ணீரில் வைத்து, Cover-ல் சிறிய Holes போட்டு 4–5 மணி நேரம் வைக்கவும்.`,
      ``,
      `2️⃣ English:`,
      `After 4–5 hours, remove the cover and plant it in Red Soil.`,
      ``,
      `தமிழ்:`,
      `4–5 மணி நேரம் கழித்து Cover-ஐ Remove செய்து, செடியை Red Soil-ல் நடலாம்.`,
      ``,
      `3️⃣ English:`,
      `If you are keeping the plant in a pot, place it in a half-shade area for around 10 days. It should receive some sunlight. Avoid full shade.`,
      ``,
      `தமிழ்:`,
      `Pot-ல் செடியை வைத்தால், சுமார் 10 நாட்களுக்கு Half-Shade பகுதியில் வைக்கவும். ஓரளவு Sunlight பட வேண்டும். Full Shade-ல் வைக்க வேண்டாம்.`,
      ``,
      `4️⃣ English:`,
      `Do not use any fertilizer, including DAP or farmyard manure, for the first 20–30 days.`,
      ``,
      `தமிழ்:`,
      `முதல் 20–30 நாட்களுக்கு எந்த Fertilizer-ம், DAP அல்லது தொழு உரமும் பயன்படுத்த வேண்டாம்.`,
      ``,
      `5️⃣ English:`,
      `Water the plant regularly. Do not allow the soil to become completely dry, and do not let water stagnate.`,
      ``,
      `தமிழ்:`,
      `Regular-ஆ Water செய்யவும். Soil முழுமையாக காய்ந்து போகாமல் பார்த்துக்கொள்ளவும். அதே நேரத்தில் தண்ணீர் தேங்கி நிற்காமல் பார்த்துக்கொள்ளவும்.`,
      ``,
      `6️⃣ English:`,
      `Keep the soil moist in the morning and evening, but avoid overwatering.`,
      ``,
      `தமிழ்:`,
      `காலை மற்றும் மாலை தேவையான அளவு ஈரப்பதம் இருக்குமாறு பார்த்துக்கொள்ளவும். அதிகமாக தண்ணீர் தேங்க விட வேண்டாம்.`,
      ``,
      `🚫 IMPORTANT / முக்கியம்:`,
      ``,
      `English:`,
      `Do not plant the plant using Coco Peat. If you cut the plant, do not apply turmeric powder. Red Soil is recommended. If your garden soil is similar to Red Soil, you can use it.`,
      ``,
      `தமிழ்:`,
      `Coco Peat வைத்து செடியை நடவு செய்ய வேண்டாம். செடியை Cut செய்தால் மஞ்சள் தூள் வைக்க வேண்டாம். Red Soil பயன்படுத்துவது சிறந்தது. உங்கள் Garden Soil Red Soil போல இருந்தால் அதையும் பயன்படுத்தலாம்.`,
      ``,
      `⚠️ IMPORTANT NOTICE / முக்கிய அறிவிப்பு:`,
      ``,
      `English:`,
      `If these instructions are not followed and the plant dies back, we will not be responsible.`,
      ``,
      `தமிழ்:`,
      `இந்த Instructions-ஐ Follow செய்யாமல் செடி பாதிக்கப்பட்டாலோ அல்லது Die Back ஆனால் அதற்கு நாங்கள் பொறுப்பல்ல.`,
      ``,
      `🌟 CUSTOMER REVIEW PROCEDURE / CUSTOMER REVIEW-ல் பகிரப்பட்ட முறை:`,
      ``,
      `English:`,
      `If you have purchased a Reduced Soil Plant, you may try the following method shared by our customer:`,
      ``,
      `தமிழ்:`,
      `Reduced Soil Plant வாங்கியிருந்தால், எங்களுடைய Customer ஒருவர் Share செய்துள்ள கீழே உள்ள Method-ஐ விருப்பப்பட்டால் Try செய்யலாம்:`,
      ``,
      `• 6 hours: Keep the plant in a bucket with the cover and small holes.`,
      `• 6 மணி நேரம்: Cover-ல் சிறிய Holes போட்டு, செடியை Bucket-ல் வைக்கவும்.`,
      ``,
      `• Mix 1 gm Epsom Salt in 1 litre water, dip the plant properly, then wash the soil and take out the bare roots.`,
      ``,
      `• 1 gm Epsom Salt + 1 litre Water கலந்து, செடியை நன்றாக Dip செய்து, பிறகு Soil-ஐ Wash செய்து Bare Root-ஆக எடுக்கலாம்.`,
      ``,
      `• Mix 1 gm Saaf in 1 litre water and dip the plant in the solution.`,
      ``,
      `• 1 gm Saaf + 1 litre Water கலந்து, செடியை அந்த Solution-ல் Dip செய்து எடுக்கலாம்.`,
      ``,
      `• Plant it in Red Soil with a small amount of farmyard manure, if available, and keep it where it receives some sunlight.`,
      ``,
      `• சிறிதளவு தொழு உரம் இருந்தால் Red Soil-ல் கலந்து, செடியை நட்டு ஓரளவு Sunlight கிடைக்கும் இடத்தில் வைக்கலாம்.`,
      ``,
      `💚 This is a method shared by a customer based on their experience. You may try it if you are comfortable with the procedure.`,
      ``,
      `💚 இது ஒரு Customer தங்களுடைய Experience-ல் Share செய்த Method. உங்களுக்கு வசதியாகவும் விருப்பமாகவும் இருந்தால் இந்த Method-ஐ Try செய்யலாம்.`,
      ``,
      `❤️ Thank you for your order! / உங்கள் ஆர்டருக்கு நன்றி!`,
      ``,
      `🌹 VEERIKA ROSE GARDEN 🌹`
    ].join('\n');
  }

  // Stage 4: Delivered (kept old format as requested)
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
  const source = (o.source || o.orderSource || o.channel || '').toString().toUpperCase();

  return (
    pm === 'WHATSAPP' ||
    pm === 'OFFLINE' ||
    pm === 'MANUAL' ||
    source === 'WHATSAPP' ||
    source === 'OFFLINE' ||
    source === 'MANUAL' ||
    o.isWhatsApp === true ||
    o.isOffline === true ||
    id.startsWith('VRG-WA') ||
    id.startsWith('WA-') ||
    txnId.startsWith('WA_') ||
    txnId.startsWith('VRG-WA') ||
    notes.includes('whatsapp') ||
    notes.includes('offline order') ||
    notes.includes('whatsapp chat')
  );
}

