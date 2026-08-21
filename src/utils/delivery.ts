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
 * - Free Delivery items (e.g. Free Delivery Combos) have ₹0 shipping fee ONLY in Tamil Nadu
 * - For other states (Karnataka, Kerala, Andhra Pradesh, Puducherry), combos and items are charged regular state shipping rates:
 *   1st chargeable plant ₹100, each additional plant +₹20
 * - Tamil Nadu: 1st chargeable plant ₹60, each additional plant +₹20
 */
export function calculateDeliveryFee(
  items: DeliveryItem[],
  stateName: string = 'Tamil Nadu'
): number {
  if (!items || items.length === 0) return 0;

  const inTN = isTamilNadu(stateName);

  // Filter out items that have freeDelivery enabled (Active ONLY for Tamil Nadu)
  const chargeableItems = items.filter(item => {
    const isFree = item.freeDelivery === true || (item.product && (item.product as any).freeDelivery === true);
    if (isFree && inTN) return false;
    return true;
  });

  const totalChargeableCount = chargeableItems.reduce((sum, item) => {
    const isCombo = item.isCombo || item.product?.id?.startsWith('combo-') || (item.product as any)?.isCombo;
    const bundleCount = (item.comboProducts && item.comboProducts.length > 0)
      ? item.comboProducts.length
      : ((item.product as any)?.comboProducts?.length || 1);
    return sum + (isCombo ? bundleCount * (item.quantity || 1) : (item.quantity || 1));
  }, 0);

  if (totalChargeableCount <= 0) return 0;

  const baseFee = inTN ? 60 : 100;
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

export type DeliveryOptionType =
  | 'REDUCED_SOIL'
  | 'FULL_SOIL_6INCH'
  | 'FULL_SOIL_8INCH'
  | 'FULL_SOIL'
  | 'METTUR_PARCEL';

/**
 * Helper to check if delivery option is any Full Soil variant
 */
export function isFullSoilDeliveryOption(opt?: string): boolean {
  if (!opt) return false;
  const clean = opt.toUpperCase();
  return clean === 'FULL_SOIL_6INCH' || clean === 'FULL_SOIL_8INCH' || clean === 'FULL_SOIL' || clean.includes('FULL SOIL') || clean.includes('FULL_SOIL');
}

/**
 * Calculates delivery charge based on soil/courier option, plant count, and destination state:
 * 1. REDUCED_SOIL:
 *    - Tamil Nadu: ₹60 for 1st plant, +₹20 for each additional plant (60 + (N - 1) * 20)
 *    - Other States (Karnataka, Kerala, AP, Puducherry): ₹100 for 1st plant, +₹20 for each additional plant (100 + (N - 1) * 20)
 * 2. FULL_SOIL_6INCH (or legacy FULL_SOIL):
 *    - Available ONLY in Tamil Nadu (Max 5 plants): ₹140 per plant continuous (140 * N)
 *    - (1 plant: ₹140, 2 plants: ₹280, 3 plants: ₹420, 4 plants: ₹560, 5 plants: ₹700)
 *    - Other states: Disabled / fallback to Reduced Soil
 * 3. FULL_SOIL_8INCH:
 *    - Available ONLY in Tamil Nadu (Max 5 plants): ₹190 per plant continuous (190 * N)
 *    - (1 plant: ₹190, 2 plants: ₹380, 3 plants: ₹570, 4 plants: ₹760, 5 plants: ₹950)
 *    - Other states: Disabled / fallback to Reduced Soil
 * 4. METTUR_PARCEL:
 *    - Minimum 3 plants required
 *    - 1 to 6 plants (or 3 to 6): ₹60
 *    - 7 to 12 plants: ₹120 (+₹60 continuous for every 6 plants: ceil(N / 6) * 60)
 */
export function getDeliveryChargeForOption(
  opt: DeliveryOptionType | string = 'REDUCED_SOIL',
  count: number = 1,
  stateName: string = 'Tamil Nadu'
): number {
  if (count <= 0) return 0;
  const inTN = isTamilNadu(stateName);

  if (opt === 'REDUCED_SOIL') {
    const base = inTN ? 60 : 100;
    return base + (count - 1) * 20;
  }

  if (opt === 'FULL_SOIL_6INCH' || opt === 'FULL_SOIL') {
    if (!inTN) {
      return 100 + (count - 1) * 20;
    }
    return count * 140;
  }

  if (opt === 'FULL_SOIL_8INCH') {
    if (!inTN) {
      return 100 + (count - 1) * 20;
    }
    return count * 190;
  }

  if (opt === 'METTUR_PARCEL') {
    return Math.ceil(Math.max(1, count) / 6) * 60;
  }

  return (inTN ? 60 : 100) + (count - 1) * 20;
}
