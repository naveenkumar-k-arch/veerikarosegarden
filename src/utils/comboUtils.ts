import { Combo, Product } from '../types';

export const comboToProduct = (combo: Combo): Product => {
  if (!combo || typeof combo !== 'object') {
    return {
      id: 'fallback-combo',
      sku: 'CMB-FALLBACK',
      name: 'Special Combo Pack',
      englishName: 'Special Combo Pack',
      tamilName: 'சிறப்பு சேர்க்கை தொகுப்பு',
      scientificName: '',
      categoryId: 'cat-combos',
      categoryName: 'Combos & Offers',
      description: 'Special Combo Pack with premium nursery plants',
      mrp: 599,
      sellingPrice: 499,
      discount: 16,
      stock: 99,
      plantHeight: 'Combo Bundle',
      potSize: '3 Plants',
      sunlight: 'Full Sun',
      waterRequirement: 'Daily',
      floweringSeason: 'All Year',
      careInstructions: {
        watering: 'Water daily in the morning.',
        sunlight: 'Direct sunlight.',
        fertilizer: 'Organic compost every 15 days.',
        soil: 'Red soil with vermicompost.'
      },
      images: ['/products/double-delight.jpeg'],
      image: '/products/double-delight.jpeg',
      imageUrl: '/products/double-delight.jpeg',
      featured: true,
      bestSeller: true,
      trending: true,
      tags: ['combo', 'offer', 'bundle', 'combos'],
      rating: 4.9,
      reviewCount: 28,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ACTIVE'
    };
  }

  const comboProducts = Array.isArray(combo.products) ? combo.products.filter(Boolean) : [];
  const firstImg = combo.imageUrl || comboProducts[0]?.images?.[0] || '/products/double-delight.jpeg';
  const comboId = combo.id || 'combo-unknown';

  return {
    id: comboId,
    sku: 'CMB-' + (comboId.startsWith('combo-') ? comboId.replace('combo-', '') : comboId).slice(-6),
    name: combo.title || 'Special Combo Bundle',
    englishName: combo.title || 'Special Combo Bundle',
    tamilName: combo.subtitle || 'சிறப்பு சேர்க்கை தொகுப்பு',
    scientificName: '',
    categoryId: 'cat-combos',
    categoryName: 'Combos & Offers',
    description: combo.subtitle || `Special Combo Pack with ${comboProducts.length || combo.productIds?.length || 0} plants`,
    mrp: Number(combo.originalPrice || combo.comboPrice || 499),
    sellingPrice: Number(combo.comboPrice || 399),
    discount: combo.discountPercent || (combo.originalPrice && combo.comboPrice && combo.originalPrice > combo.comboPrice ? Math.round(((combo.originalPrice - combo.comboPrice) / combo.originalPrice) * 100) : 0),
    stock: 99,
    plantHeight: 'Combo Bundle',
    potSize: `${comboProducts.length || combo.productIds?.length || 3} Plants`,
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Year',
    careInstructions: {
      watering: 'Water daily in the morning.',
      sunlight: 'Direct sunlight.',
      fertilizer: 'Organic compost every 15 days.',
      soil: 'Red soil with vermicompost.'
    },
    images: [firstImg],
    image: firstImg,
    imageUrl: firstImg,
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['combo', 'offer', 'bundle', 'combos', ...(combo.freeDelivery ? ['free-delivery'] : [])],
    rating: 4.9,
    reviewCount: 28,
    createdAt: combo.createdAt || new Date().toISOString(),
    updatedAt: combo.updatedAt || new Date().toISOString(),
    status: 'ACTIVE',
    freeDelivery: combo.freeDelivery === true,
    freePacking: combo.freePacking === true,
    onlyMetturService: combo.onlyMetturService === true,
    isCombo: true,
    comboProducts: comboProducts
  } as any;
};

import diskCombosData from '../data/combos_store.json';
import { INITIAL_PRODUCTS } from '../data/catalogData';

export const getCachedActiveCombos = (): Combo[] => {
  let list: Combo[] = [];
  try {
    const cached = localStorage.getItem('vrg_combos_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch {}

  const diskList = (diskCombosData as any[]) || [];
  const map = new Map<string, any>();

  // 1. Seed with latest disk combos
  diskList.forEach(c => {
    if (c && c.id) map.set(c.id, { ...c });
  });

  // 2. Overlay cached combos while preserving disk overrides (order, freeDelivery, freePacking, onlyMetturService, imageUrl)
  list.forEach(c => {
    if (c && c.id) {
      const existing = map.get(c.id) || {};
      map.set(c.id, {
        ...existing,
        ...c,
        order: existing.order !== undefined ? existing.order : c.order,
        freeDelivery: existing.freeDelivery !== undefined ? existing.freeDelivery : c.freeDelivery,
        freePacking: existing.freePacking !== undefined ? existing.freePacking : c.freePacking,
        onlyMetturService: existing.onlyMetturService !== undefined ? existing.onlyMetturService : c.onlyMetturService,
        imageUrl: existing.imageUrl || c.imageUrl
      });
    }
  });

  // Explicitly ensure Vinayagar Chaturthi combo is active, order 0, and has the correct festive image
  if (map.has('combo-vinayagar-chaturthi-10-fruit-plants')) {
    const vc = map.get('combo-vinayagar-chaturthi-10-fruit-plants');
    vc.order = 0;
    vc.active = true;
    vc.imageUrl = '/products/vrg/combo-vinayagar-chaturthi-10-fruit-plants.jpg';
  }

  let deletedList: string[] = [];
  try {
    const rawDel = localStorage.getItem('vrg_deleted_combos');
    if (rawDel) {
      const pDel = JSON.parse(rawDel);
      if (Array.isArray(pDel)) deletedList = pDel;
    }
  } catch {}
  const deletedSet = new Set(deletedList);

  const prodMap = new Map<string, Product>();
  INITIAL_PRODUCTS.forEach(p => {
    if (p.id) {
      prodMap.set(p.id, p);
      prodMap.set(p.id.toLowerCase(), p);
    }
  });

  const dummyIds = new Set(['combo-1787635336437', 'combo-1787321846424', 'combo-1787577752349', 'combo-1787127554276']);

  return Array.from(map.values())
    .filter((c: any) => {
      if (!c || !c.id || c.active === false || deletedSet.has(c.id)) return false;
      if (dummyIds.has(c.id)) return false;
      if (!c.imageUrl && (!c.products || c.products.length === 0) && (!c.productIds || c.productIds.length === 0)) return false;
      return true;
    })
    .map((c: any) => {
      // If products array is empty, resolve from INITIAL_PRODUCTS by productIds
      if ((!c.products || c.products.length === 0) && Array.isArray(c.productIds) && c.productIds.length > 0) {
        const prods = c.productIds.map((pid: string) => prodMap.get(pid) || prodMap.get(pid.toLowerCase())).filter(Boolean);
        return { ...c, products: prods };
      }
      return c;
    })
    .sort((a: any, b: any) => (Number(a.order ?? 99) - Number(b.order ?? 99)));
};
