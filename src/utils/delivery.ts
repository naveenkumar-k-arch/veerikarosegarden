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
