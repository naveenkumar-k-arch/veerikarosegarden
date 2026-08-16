import { Combo, Product } from '../types';

export const comboToProduct = (combo: Combo): Product => {
  const comboProducts = combo.products || [];
  const firstImg = combo.imageUrl || comboProducts[0]?.images?.[0] || '/products/double-delight.jpeg';

  return {
    id: combo.id,
    sku: 'CMB-' + (combo.id.startsWith('combo-') ? combo.id.replace('combo-', '') : combo.id).slice(-6),
    name: combo.title,
    englishName: combo.title,
    tamilName: combo.subtitle || 'சிறப்பு சேர்க்கை தொகுப்பு',
    scientificName: '',
    categoryId: 'cat-combos',
    categoryName: 'Combos & Offers',
    description: combo.subtitle || `Special Combo Pack with ${comboProducts.length || combo.productIds?.length || 0} plants`,
    mrp: Number(combo.originalPrice || combo.comboPrice),
    sellingPrice: Number(combo.comboPrice),
    discount: combo.discountPercent || (combo.originalPrice > combo.comboPrice ? Math.round(((combo.originalPrice - combo.comboPrice) / combo.originalPrice) * 100) : 0),
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
    status: 'ACTIVE'
  };
};

export const getCachedActiveCombos = (): Combo[] => {
  try {
    const cached = localStorage.getItem('vrg_combos_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const deletedSet = new Set(JSON.parse(localStorage.getItem('vrg_deleted_combos') || '[]'));
        return parsed.filter((c: Combo) => c.active !== false && !deletedSet.has(c.id));
      }
    }
  } catch {}
  return [];
};
