export interface DeliveryItem {
  quantity: number;
  freeDelivery?: boolean;
  isCombo?: boolean;
  product?: {
    id?: string;
    name?: string;
    englishName?: string;
    tamilName?: string;
    tags?: string[];
    category?: string;
    freeDelivery?: boolean;
  };
  name?: string;
  englishName?: string;
  tamilName?: string;
  tags?: string[];
  category?: string;
}

/**
 * Check if a cart item is a Grape plant product
 */
export function isGrapeItem(item: DeliveryItem): boolean {
  const prod = item.product || item;
  const name = (prod.name || '').toLowerCase();
  const englishName = ('englishName' in prod && typeof prod.englishName === 'string' ? prod.englishName : '').toLowerCase();
  const tamilName = ('tamilName' in prod && typeof prod.tamilName === 'string' ? prod.tamilName : '').toLowerCase();
  const tags = ('tags' in prod && Array.isArray(prod.tags) ? prod.tags.join(' ') : '').toLowerCase();
  const category = ('category' in prod && typeof prod.category === 'string' ? prod.category : '').toLowerCase();

  return (
    name.includes('grape') ||
    englishName.includes('grape') ||
    tamilName.includes('திராட்சை') ||
    tags.includes('grape') ||
    tags.includes('திராட்சை') ||
    category.includes('grape')
  );
}

/**
 * Check if a state is Tamil Nadu
 */
export function isTamilNadu(stateName: string): boolean {
  if (!stateName) return true; // Default to Tamil Nadu rate
  const clean = stateName.toLowerCase().replace(/[^a-z]/g, '');
  return clean.includes('tamilnadu') || clean === 'tn';
}

/**
 * Legacy compatibility alias: Check if a state qualifies for Tamil Nadu rate
 */
export function isSouthState(stateName: string): boolean {
  return isTamilNadu(stateName);
}

/**
 * Calculate state & product-based delivery fee:
 * - Free Delivery items (e.g. Free Delivery Combos) have ₹0 shipping fee
 * - Tamil Nadu: 1st chargeable plant ₹60, each additional plant +₹20
 * - Karnataka, Kerala, Andhra Pradesh, Puducherry: 1st chargeable plant ₹100, each additional plant +₹20
 */
export function calculateDeliveryFee(
  items: DeliveryItem[],
  stateName: string = 'Tamil Nadu'
): number {
  if (!items || items.length === 0) return 0;

  // Filter out items that have freeDelivery enabled (e.g. Combos with free delivery)
  const chargeableItems = items.filter(item => {
    if (item.freeDelivery === true) return false;
    if (item.product && (item.product as any).freeDelivery === true) return false;
    return true;
  });

  const totalChargeableCount = chargeableItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  if (totalChargeableCount <= 0) return 0;

  const baseFee = isTamilNadu(stateName) ? 60 : 100;
  const additionalFee = (totalChargeableCount - 1) * 20;

  return baseFee + additionalFee;
}

export const INDIAN_STATES = [
  'Tamil Nadu',
  'Karnataka',
  'Kerala',
  'Andhra Pradesh',
  'Puducherry'
];

export type DeliveryOptionType = 'REDUCED_SOIL' | 'FULL_SOIL' | 'METTUR_PARCEL';

/**
 * Calculates delivery charge based on soil/courier option, plant count, and destination state:
 * 1. REDUCED_SOIL:
 *    - Tamil Nadu: ₹60 for 1st plant, +₹20 for 2nd plant, +₹20 for 3rd plant, etc. (60 + (N - 1) * 20)
 *    - Other States (Karnataka, Kerala, AP, Puducherry): ₹100 for 1st plant, +₹20 for each additional plant (100 + (N - 1) * 20)
 * 2. FULL_SOIL:
 *    - Available ONLY in Tamil Nadu: ₹100 per plant (N * 100) (Max 5 plants)
 *    - Other states: Disabled / fallback to Reduced Soil
 * 3. METTUR_PARCEL:
 *    - Minimum 3 plants required
 *    - 1 to 6 plants (or 3 to 6): ₹60
 *    - 7 to 12 plants: ₹120 (+₹60 continuous for every 6 plants: ceil(N / 6) * 60)
 */
export function getDeliveryChargeForOption(
  opt: DeliveryOptionType,
  count: number,
  stateName: string = 'Tamil Nadu'
): number {
  if (count <= 0) return 0;
  const inTN = isTamilNadu(stateName);

  if (opt === 'REDUCED_SOIL') {
    const base = inTN ? 60 : 100;
    return base + (count - 1) * 20;
  }

  if (opt === 'FULL_SOIL') {
    if (!inTN) {
      return 100 + (count - 1) * 20;
    }
    return count * 100;
  }

  if (opt === 'METTUR_PARCEL') {
    return Math.ceil(Math.max(1, count) / 6) * 60;
  }

  return (inTN ? 60 : 100) + (count - 1) * 20;
}
