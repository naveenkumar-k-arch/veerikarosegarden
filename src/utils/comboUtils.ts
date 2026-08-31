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
    isCombo: true,
    comboProducts: comboProducts
  } as any;
};

export const getCachedActiveCombos = (): Combo[] => {
  try {
    const cached = localStorage.getItem('vrg_combos_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let deletedList: string[] = [];
        try {
          const rawDel = localStorage.getItem('vrg_deleted_combos');
          if (rawDel) {
            const pDel = JSON.parse(rawDel);
            if (Array.isArray(pDel)) deletedList = pDel;
          }
        } catch {}
        const deletedSet = new Set(deletedList);
        return parsed.filter((c: Combo) => c && c.id && c.active !== false && !deletedSet.has(c.id));
      }
    }
  } catch {}
  return [];
};
