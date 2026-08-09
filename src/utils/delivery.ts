export interface DeliveryItem {
  quantity: number;
  product?: {
    id?: string;
    name?: string;
    englishName?: string;
    tamilName?: string;
    tags?: string[];
    category?: string;
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
 * Check if a state qualifies for South India local shipping rates (Tamil Nadu, Kerala, Karnataka)
 */
export function isSouthState(stateName: string): boolean {
  if (!stateName) return true; // Default to Tamil Nadu rate
  const clean = stateName.toLowerCase().replace(/[^a-z]/g, '');
  return (
    clean.includes('tamilnadu') ||
    clean.includes('tn') ||
    clean.includes('kerala') ||
    clean.includes('karnataka')
  );
}

/**
 * Calculate state & product-based delivery fee according to Veerika Rose Garden policy:
 * - Tamil Nadu, Kerala, Karnataka: 1st product ₹50, each add'l +₹10
 * - Other States: 1st product ₹100, each add'l +₹10
 * - Grapes delivery: 1st product ₹60, each add'l +₹25
 */
export function calculateDeliveryFee(
  items: DeliveryItem[],
  stateName: string = 'Tamil Nadu'
): number {
  if (!items || items.length === 0) return 0;

  let grapeCount = 0;
  let nonGrapeCount = 0;

  for (const item of items) {
    const qty = item.quantity || 1;
    if (isGrapeItem(item)) {
      grapeCount += qty;
    } else {
      nonGrapeCount += qty;
    }
  }

  // 1. Grapes delivery calculation (₹60 for 1st, ₹25 for each add'l)
  const grapeFee = grapeCount > 0 ? 60 + (grapeCount - 1) * 25 : 0;

  // 2. Standard products delivery calculation
  // TN / Kerala / Karnataka: ₹50 for 1st, ₹10 for each add'l
  // Other states: ₹100 for 1st, ₹10 for each add'l
  let standardFee = 0;
  if (nonGrapeCount > 0) {
    const basePrice = isSouthState(stateName) ? 50 : 100;
    standardFee = basePrice + (nonGrapeCount - 1) * 10;
  }

  return grapeFee + standardFee;
}

export const INDIAN_STATES = [
  'Tamil Nadu',
  'Kerala',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
  'Puducherry',
  'Goa',
  'Maharashtra',
  'Gujarat',
  'Delhi',
  'Punjab',
  'Haryana',
  'Rajasthan',
  'Uttar Pradesh',
  'West Bengal',
  'Bihar',
  'Madhya Pradesh',
  'Odisha',
  'Assam',
  'Other State / UT'
];
