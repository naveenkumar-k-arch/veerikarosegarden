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
