import { Product, Category, Order, Coupon, Banner, Review, SiteSettings, PaymentLog, OrderItemSnapshot, PaymentMethod, FinancialEntry } from '../types.js';

import { getPrismaClient, executeInTransaction } from './prisma.js';
import { firestoreSaveOrder, firestoreGetAllOrders, firestoreUpdateOrder } from './firestore.js';

function parseShippingAddress(val: any): any {
  if (!val) return {};
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[object') || trimmed === '' || trimmed === 'undefined' || trimmed === 'null') {
      return {};
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      return {};
    }
  }
  return {};
}

// Default Fallback Data matching WhatsApp Catalogue
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-rose',
    name: 'Rose Varieties',
    tamilName: 'ரோஜா வகைகள்',
    slug: 'rose-varieties',
    image: '/products/double-delight.jpeg',
    description: 'Premium live hybrid rose plants, double delight & button rose varieties.',
    order: 1,
    isActive: true,
    isFeatured: true,
    productCount: 5
  },
  {
    id: 'cat-herbals',
    name: 'Herbal Plants',
    tamilName: 'மூலிகை (Herbals)',
    slug: 'herbals',
    image: '/products/eq.jpeg',
    description: 'Medicinal plants including Panner leaf, Ranakalli, and Rosemary.',
    order: 2,
    isActive: true,
    isFeatured: true,
    productCount: 3
  },
  {
    id: 'cat-jasmine',
    name: 'Jasmine Varieties',
    tamilName: 'மல்லி பூ வகைகள் (Jasmine Vts)',
    slug: 'jasmine-varieties',
    image: '/products/sgssg.jpeg',
    description: 'Fragrant Ramar Malli, Jadhi Malli, and Color Kakattan plants.',
    order: 3,
    isActive: true,
    isFeatured: true,
    productCount: 3
  },
  {
    id: 'cat-creeper',
    name: 'Creeper Roses',
    tamilName: 'கொடி ரோஸ் வகைகள் (Creeper)',
    slug: 'creeper-roses',
    image: '/products/WhatsApp Image 2026-07-29 at 8.15.01 PMrr.jpeg',
    description: 'Climbing and hanging rose varieties like White Creeper & Suloli Hanging Rose.',
    order: 4,
    isActive: true,
    isFeatured: true,
    productCount: 2
  },
  {
    id: 'cat-miniature',
    name: 'Miniature Roses',
    tamilName: 'miniature ரோஸ் வகை',
    slug: 'miniature-roses',
    image: '/products/double-delight.jpeg',
    description: 'Compact miniature rose plants for balcony pots and gardens.',
    order: 5,
    isActive: true,
    isFeatured: true,
    productCount: 1
  },
  {
    id: 'cat-rare',
    name: 'Rare & Exotic Roses',
    tamilName: 'அரிய வகை ரோஜாக்கள் (Rare & Exotic)',
    slug: 'rare-exotic-roses',
    image: '/products/rejtrjtj.jpeg',
    description: 'Exclusive rare varieties like Black Magic, Moncou Moncouer, and White Panneer Rose.',
    order: 6,
    isActive: true,
    isFeatured: true,
    productCount: 3
  }
];

const DEFAULT_PRODUCTS: Product[] = [
  // --- ROSE VARIETIES ---
  {
    id: 'prod-dd-8inch',
    sku: 'VRG-ROSE-01',
    name: 'Double Delight (8 inch pot)',
    englishName: 'Double Delight (8 inch pot)',
    tamilName: 'டபுள் டிலைட் ரோஜா (8 இன்ச் பாட்)',
    scientificName: 'Rosa Hybrid - Double Delight',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Fragrant bicolor rose with cream centers edged in ruby red. Potted in an 8 inch container.',
    mrp: 230,
    sellingPrice: 199,
    discount: 13,
    stock: 25,
    plantHeight: '1.5 Feet',
    potSize: '8 inch Pot',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily in morning.',
      sunlight: 'Needs 5-6 hours of direct sun.',
      fertilizer: 'Apply vermicompost bi-weekly.',
      soil: 'Red garden soil with organic manure.'
    },
    images: ['/products/double-delight.jpeg', '/products/rhdhd.jpeg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['rose', 'double delight', 'potted'],
    rating: 4.9,
    reviewCount: 28,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-tiger-rose',
    sku: 'VRG-ROSE-02',
    name: 'Tiger Rose',
    englishName: 'Tiger Rose',
    tamilName: 'டைகர் ரோஸ்',
    scientificName: 'Rosa Hybrid - Tiger Stripe',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Exotic striped rose with distinct maroon and yellow petals. Highly attractive for gardens.',
    mrp: 150,
    sellingPrice: 119,
    discount: 21,
    stock: 30,
    plantHeight: '1.5 Feet',
    potSize: '6 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full direct sunlight.',
      fertilizer: 'Organic compost every 15 days.',
      soil: 'Rich loamy red soil.'
    },
    images: ['/products/ee.jpeg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['tiger rose', 'striped rose', 'exotic'],
    rating: 4.8,
    reviewCount: 32,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-any-pink-rose',
    sku: 'VRG-ROSE-03',
    name: 'Any Pink Rose',
    englishName: 'Any Pink Rose',
    tamilName: 'பிங்க் ரோஜா',
    scientificName: 'Rosa Hybrid - Pink',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Vibrant pink hybrid rose with dense blooming. Perfect gift plant for home garden lovers.',
    mrp: 109,
    sellingPrice: 89,
    discount: 18,
    stock: 50,
    plantHeight: '1 - 1.5 Feet',
    potSize: '6 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water once daily.',
      sunlight: 'Direct sunlight.',
      fertilizer: 'Organic fertilizer monthly.',
      soil: 'Garden soil with coco peat.'
    },
    images: ['/products/any-pink.jpeg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['pink rose', 'rose'],
    rating: 4.7,
    reviewCount: 19,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-naatu-pink-rose',
    sku: 'VRG-ROSE-04',
    name: 'Naatu Rose Pink',
    englishName: 'Naatu Rose Pink',
    tamilName: 'நாட்டு ரோஸ் பிங்க்',
    scientificName: 'Rosa damascena - Country Pink',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Traditional highly fragrant country rose (Naatu Rose) in deep pink. Excellent scent.',
    mrp: 100,
    sellingPrice: 80,
    discount: 20,
    stock: 40,
    plantHeight: '1.5 Feet',
    potSize: '6 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sunlight.',
      fertilizer: 'Cow dung manure / vermicompost.',
      soil: 'Red soil.'
    },
    images: ['/products/naatu-pink.jpeg'],
    featured: false,
    bestSeller: true,
    trending: true,
    tags: ['naatu rose', 'fragrant rose', 'pink'],
    rating: 4.9,
    reviewCount: 41,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-button-pink-white',
    sku: 'VRG-ROSE-05',
    name: 'Light Pink with White Stripe Button Type Rose',
    englishName: 'Light Pink with White Stripe Button Type Rose',
    tamilName: 'லைட் பிங்க் ஒயிட் ஸ்டிரைப் பட்டன் ரோஸ்',
    scientificName: 'Rosa chinensis minima',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Cluster blooming button rose featuring light pink petals with white stripes.',
    mrp: 100,
    sellingPrice: 89,
    discount: 11,
    stock: 35,
    plantHeight: '1 Foot',
    potSize: '6 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Direct sunlight.',
      fertilizer: 'Liquid bio-fertilizer.',
      soil: 'Loamy soil.'
    },
    images: ['/products/button-rose.jpeg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['button rose', 'pink rose', 'striped'],
    rating: 4.8,
    reviewCount: 22,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // --- HERBAL PLANTS ---
  {
    id: 'prod-panner-leaf',
    sku: 'VRG-HERB-01',
    name: 'Panner Leaf Plant',
    englishName: 'Panner Leaf Plant',
    tamilName: 'பன்னீர் இலை',
    scientificName: 'Plectranthus amboinicus',
    categoryId: 'cat-herbals',
    categoryName: 'Herbal Plants',
    description: 'Aromatic medicinal herbal plant known for its soothing aroma and traditional health uses.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 50,
    plantHeight: '1 Foot',
    potSize: '5 inch Grow Bag',
    sunlight: 'Partial Shade',
    waterRequirement: 'Twice a week',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water when top soil is dry.',
      sunlight: 'Partial sunlight.',
      fertilizer: 'Organic compost.',
      soil: 'Well-draining garden soil.'
    },
    images: ['/products/eq.jpeg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['herbal', 'panner leaf', 'medicinal'],
    rating: 4.9,
    reviewCount: 15,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-ranakalli',
    sku: 'VRG-HERB-02',
    name: 'Ranakalli Plant (Miracle Leaf)',
    englishName: 'Ranakalli Plant (Miracle Leaf)',
    tamilName: 'ரணகள்ளி',
    scientificName: 'Bryophyllum pinnatum',
    categoryId: 'cat-herbals',
    categoryName: 'Herbal Plants',
    description: 'Famous medicinal herbal plant known for kidney health and traditional Siddha wellness.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 50,
    plantHeight: '1 Foot',
    potSize: '5 inch Grow Bag',
    sunlight: 'Partial Shade',
    waterRequirement: 'Twice a week',
    floweringSeason: 'Monsoon',
    careInstructions: {
      watering: 'Low water requirement.',
      sunlight: 'Partial sunlight.',
      fertilizer: 'Organic manure.',
      soil: 'Dry porous soil.'
    },
    images: ['/products/dhjrjtjr.jpeg'],
    featured: false,
    bestSeller: true,
    trending: true,
    tags: ['ranakalli', 'herbal', 'siddha'],
    rating: 4.9,
    reviewCount: 29,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-rosemary',
    sku: 'VRG-HERB-03',
    name: 'Rosemary Plant',
    englishName: 'Rosemary Plant',
    tamilName: 'ரோஸ்மேரி',
    scientificName: 'Salvia rosmarinus',
    categoryId: 'cat-herbals',
    categoryName: 'Herbal Plants',
    description: 'Fragrant culinary & hair-care herbal herb. Fresh aromatic leaves used for teas and oils.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 45,
    plantHeight: '0.8 Foot',
    potSize: '5 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'When dry',
    floweringSeason: 'Spring',
    careInstructions: {
      watering: 'Water only when soil dries.',
      sunlight: 'Full sun.',
      fertilizer: 'Light organic fertilizer.',
      soil: 'Sandy well-draining soil.'
    },
    images: ['/products/ww.jpeg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['rosemary', 'herb', 'aromatic'],
    rating: 4.8,
    reviewCount: 38,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // --- JASMINE VARIETIES ---
  {
    id: 'prod-color-kakattan',
    sku: 'VRG-JASM-01',
    name: 'Color Kakattan Plant',
    englishName: 'Color Kakattan Plant',
    tamilName: 'கலர் காகட்டன்',
    scientificName: 'Jasminum multiflorum - Color',
    categoryId: 'cat-jasmine',
    categoryName: 'Jasmine Varieties',
    description: 'Vibrant colorful Kakattan flowering vine. Blooms in rich pink and magenta shades.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 40,
    plantHeight: '1.2 Feet',
    potSize: '6 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Direct sun.',
      fertilizer: 'Vermicompost monthly.',
      soil: 'Garden red soil.'
    },
    images: ['/products/,j,u,uj,u.jpeg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['kakattan', 'jasmine', 'flowering'],
    rating: 4.7,
    reviewCount: 18,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-ramar-malli',
    sku: 'VRG-JASM-02',
    name: 'Ramar Malli Plant',
    englishName: 'Ramar Malli Plant',
    tamilName: 'ராமர் மல்லி',
    scientificName: 'Jasminum sambac var. Ramar',
    categoryId: 'cat-jasmine',
    categoryName: 'Jasmine Varieties',
    description: 'Traditional Ramar Malligai plant with sweet perfume scent and white multi-layered petals.',
    mrp: 60,
    sellingPrice: 50,
    discount: 17,
    stock: 50,
    plantHeight: '1.5 Feet',
    potSize: '6 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Summer',
    careInstructions: {
      watering: 'Water thoroughly daily.',
      sunlight: 'Full direct sunlight.',
      fertilizer: 'Groundnut cake manure.',
      soil: 'Rich loamy red soil.'
    },
    images: ['/products/sgssg.jpeg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['ramar malli', 'jasmine', 'malli'],
    rating: 4.9,
    reviewCount: 31,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-jadhi-malli',
    sku: 'VRG-JASM-03',
    name: 'Jadhi Malli Plant',
    englishName: 'Jadhi Malli Plant',
    tamilName: 'ஜாதி மல்லி',
    scientificName: 'Jasminum grandiflorum',
    categoryId: 'cat-jasmine',
    categoryName: 'Jasmine Varieties',
    description: 'Spanish Jasmine (Jadhi Malli) with star-shaped fragrant white blooms. Perfect climber for pergolas.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 45,
    plantHeight: '1.5 Feet',
    potSize: '6 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Daily watering.',
      sunlight: 'Full sun.',
      fertilizer: 'Bio-fertilizer monthly.',
      soil: 'Well draining soil.'
    },
    images: ['/products/tktktt.jpeg'],
    featured: false,
    bestSeller: true,
    trending: true,
    tags: ['jadhi malli', 'jasmine', 'climber'],
    rating: 4.8,
    reviewCount: 27,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // --- CREEPER ROSES ---
  {
    id: 'prod-white-creeper-rose',
    sku: 'VRG-CREEP-01',
    name: 'White Creeper Rose (Climber Variety)',
    englishName: 'White Creeper Rose (Climber Variety)',
    tamilName: 'ஒயிட் க்ரீப்பர் ரோஸ் (கொடி ரோஜா)',
    scientificName: 'Rosa climbing - White',
    categoryId: 'cat-creeper',
    categoryName: 'Creeper Roses',
    description: 'Fast-growing white climbing rose vine with cascading white flower clusters.',
    mrp: 100,
    sellingPrice: 99,
    discount: 1,
    stock: 20,
    plantHeight: '2 Feet',
    potSize: '6 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Needs full sun & support trellis.',
      fertilizer: 'Vermicompost every 15 days.',
      soil: 'Fertile red soil.'
    },
    images: ['/products/white-creeper.jpeg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['creeper rose', 'white rose', 'climber'],
    rating: 4.9,
    reviewCount: 14,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-suloli-hanging-rose',
    sku: 'VRG-CREEP-02',
    name: 'Suloli Hanging Rose',
    englishName: 'Suloli Hanging Rose',
    tamilName: 'சுலோலி ஹேங்கிங் ரோஸ்',
    scientificName: 'Rosa trailing - Suloli',
    categoryId: 'cat-creeper',
    categoryName: 'Creeper Roses',
    description: 'Beautiful trailing hanging rose variety. Ideal for hanging baskets and balcony railings.',
    mrp: 100,
    sellingPrice: 90,
    discount: 10,
    stock: 25,
    plantHeight: '1.5 Feet',
    potSize: 'Hanging Pot / Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Direct sunlight.',
      fertilizer: 'Liquid fertilizer.',
      soil: 'Potting mix with coco peat.'
    },
    images: ['/products/any-pink.jpeg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['hanging rose', 'suloli', 'creeper'],
    rating: 4.8,
    reviewCount: 11,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // --- MINIATURE ROSES ---
  {
    id: 'prod-yellow-miniature',
    sku: 'VRG-MINI-01',
    name: 'Yellow Miniature Rose',
    englishName: 'Yellow Miniature Rose',
    tamilName: 'மஞ்சள் மினியேச்சர் ரோஸ்',
    scientificName: 'Rosa chinensis minima - Yellow',
    categoryId: 'cat-miniature',
    categoryName: 'Miniature Roses',
    description: 'Bright golden yellow miniature rose plant with compact habit and continuous flower production.',
    mrp: 100,
    sellingPrice: 80,
    discount: 20,
    stock: 30,
    plantHeight: '0.8 Foot',
    potSize: '5 inch Pot',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Organic plant food.',
      soil: 'Porous soil mix.'
    },
    images: ['/products/double-delight.jpeg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['miniature rose', 'yellow rose'],
    rating: 4.9,
    reviewCount: 20,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // --- RARE & EXOTIC ROSES ---
  {
    id: 'prod-black-magic',
    sku: 'VRG-RARE-01',
    name: 'Black Magic Rose',
    englishName: 'Black Magic Rose',
    tamilName: 'பிளாக் மேஜிக் ரோஸ்',
    scientificName: 'Rosa Hybrid - Black Magic',
    categoryId: 'cat-rare',
    categoryName: 'Rare & Exotic Roses',
    description: 'Ultra-rare dark velvet black-red rose. Large dramatic blooms with velvety dark petals.',
    mrp: 139,
    sellingPrice: 119,
    discount: 14,
    stock: 15,
    plantHeight: '1.8 Feet',
    potSize: '6 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily in morning.',
      sunlight: '5 hours direct sun.',
      fertilizer: 'Special rose mix fertilizer.',
      soil: 'Rich red soil.'
    },
    images: ['/products/rejtrjtj.jpeg', '/products/hdfhd.jpeg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['black magic', 'black rose', 'rare'],
    rating: 5.0,
    reviewCount: 48,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-moncou-moncouer',
    sku: 'VRG-RARE-02',
    name: 'Moncou Moncouer Rose',
    englishName: 'Moncou Moncouer Rose',
    tamilName: 'மொன்கௌ மொன்கியூர் ரோஸ்',
    scientificName: 'Rosa Hybrid - Moncouer',
    categoryId: 'cat-rare',
    categoryName: 'Rare & Exotic Roses',
    description: 'Exquisite cup-shaped French hybrid rose with soft blush pink and white gradient petals.',
    mrp: 180,
    sellingPrice: 150,
    discount: 17,
    stock: 12,
    plantHeight: '1.5 Feet',
    potSize: '6 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Direct sunlight.',
      fertilizer: 'Organic compost.',
      soil: 'Rich loamy soil.'
    },
    images: ['/products/sgssg.jpeg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['moncouer', 'french rose', 'exotic'],
    rating: 4.9,
    reviewCount: 16,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-white-panneer-rose',
    sku: 'VRG-RARE-03',
    name: 'White Panneer Rose',
    englishName: 'White Panneer Rose',
    tamilName: 'வெள்ளை பன்னீர் ரோஸ்',
    scientificName: 'Rosa damascena alba',
    categoryId: 'cat-rare',
    categoryName: 'Rare & Exotic Roses',
    description: 'Rare pure white damask rose with intense rose-water fragrance. Highly sought after.',
    mrp: 200,
    sellingPrice: 180,
    discount: 10,
    stock: 25,
    plantHeight: '1.5 Feet',
    potSize: '6 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Vermicompost.',
      soil: 'Red garden soil.'
    },
    images: ['/products/tktktt.jpeg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['white panneer', 'panneer rose', 'fragrant'],
    rating: 5.0,
    reviewCount: 39,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Default Fallback Site Settings when DB record hasn't been created yet
const DEFAULT_SETTINGS: SiteSettings = {
  businessName: process.env.BUSINESS_NAME || 'Veerika Rose Garden',
  tagline: process.env.BUSINESS_TAGLINE || 'Premier Plant Nursery & Farm Direct Gardens',
  phone: process.env.BUSINESS_PHONE || '+91 72008 26129',
  email: process.env.BUSINESS_EMAIL || 'kavinkumar.m30@gmail.com',
  whatsapp: process.env.BUSINESS_WHATSAPP || '+917200826129',
  address: process.env.BUSINESS_ADDRESS || 'Pennagaram, Tamil Nadu — 636810',
  googleMapsUrl: 'https://maps.google.com/?q=Pennagaram,Tamil+Nadu',
  workingHours: 'Open 7 AM – 7 PM · All Days',
  taxRate: 0,
  shippingFee: 50,
  freeShippingThreshold: 999,
  enableCod: true,
  enablePhonePe: true,
  enableQrPayment: true,
  qrCodeImageUrl: '/nursery-qr.svg',
  upiId: 'veerikarosegarden@ibl',
  upiName: 'ANISHA RAJA',
  qrInstructions: '1. Scan the QR code using GPay, PhonePe, Paytm or any UPI app.\n2. Enter the exact order total amount and pay.\n3. Take a screenshot of the successful payment receipt.\n4. Upload the screenshot below to place your order.',
  phonepeMerchantId: process.env.PHONEPE_MERCHANT_ID || '',
  phonepeSaltKey: process.env.PHONEPE_SALT_KEY || '',
  phonepeSaltIndex: String(process.env.PHONEPE_SALT_INDEX || '1'),
  phonepeEnv: (process.env.PHONEPE_ENV as 'SANDBOX' | 'PRODUCTION') || 'PRODUCTION'
};

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ORD-VRG-8235',
    merchantTransactionId: 'MT1785428235',
    customerName: 'Kupendran Kupendran',
    customerPhone: '9876543210',
    customerEmail: 'kupendrankupendran391@gmail.com',
    shippingAddress: { fullName: 'Kupendran Kupendran', phone: '9876543210', houseNo: '12', street: 'Main Road', villageTown: 'Pennagaram', district: 'Dharmapuri', state: 'Tamil Nadu', pincode: '636810', addressType: 'Home' },
    items: [{ productId: 'prod-dd-8inch', sku: 'VRG-ROSE-01', name: 'Double Delight (8 inch pot)', tamilName: 'டபுள் டிலைட் ரோஜா', price: 199, mrp: 230, quantity: 1, image: '/products/double-delight.jpeg' }],
    subtotal: 199, shippingCharge: 50, discount: 0, grandTotal: 249, paymentStatus: 'PENDING', orderStatus: 'PENDING', paymentMethod: 'COD', createdAt: '2026-07-30T14:30:00.000Z', updatedAt: '2026-07-30T14:30:00.000Z'
  },
  {
    id: 'ORD-VRG-2197',
    merchantTransactionId: 'MT1785422197',
    customerName: 'Kupendran Kupendran',
    customerPhone: '9876543210',
    customerEmail: 'kupendrankupendran391@gmail.com',
    shippingAddress: { fullName: 'Kupendran Kupendran', phone: '9876543210', houseNo: '12', street: 'Main Road', villageTown: 'Pennagaram', district: 'Dharmapuri', state: 'Tamil Nadu', pincode: '636810', addressType: 'Home' },
    items: [{ productId: 'prod-tiger-rose', sku: 'VRG-ROSE-02', name: 'Tiger Rose', tamilName: 'டைகர் ரோஸ்', price: 199, mrp: 230, quantity: 1, image: '/products/rhdhd.jpeg' }],
    subtotal: 199, shippingCharge: 50, discount: 0, grandTotal: 249, paymentStatus: 'PENDING', orderStatus: 'PENDING', paymentMethod: 'COD', createdAt: '2026-07-30T14:20:00.000Z', updatedAt: '2026-07-30T14:20:00.000Z'
  },
  {
    id: 'ORD-VRG-2834',
    merchantTransactionId: 'MT1785422834',
    customerName: 'Kupendran Kupendran',
    customerPhone: '9876543210',
    customerEmail: 'kupendrankupendran391@gmail.com',
    shippingAddress: { fullName: 'Kupendran Kupendran', phone: '9876543210', houseNo: '12', street: 'Main Road', villageTown: 'Pennagaram', district: 'Dharmapuri', state: 'Tamil Nadu', pincode: '636810', addressType: 'Home' },
    items: [{ productId: 'prod-dd-8inch', sku: 'VRG-ROSE-01', name: 'Double Delight', tamilName: 'டபுள் டிலைட்', price: 199, mrp: 230, quantity: 1, image: '/products/double-delight.jpeg' }],
    subtotal: 199, shippingCharge: 50, discount: 0, grandTotal: 249, paymentStatus: 'PENDING', orderStatus: 'PENDING', paymentMethod: 'COD', createdAt: '2026-07-30T14:10:00.000Z', updatedAt: '2026-07-30T14:10:00.000Z'
  },
  {
    id: 'ORD-VRG-5004',
    merchantTransactionId: 'MT1785425004',
    customerName: 'Kupendran Kupendran',
    customerPhone: '9876543210',
    customerEmail: 'kupendrankupendran391@gmail.com',
    shippingAddress: { fullName: 'Kupendran Kupendran', phone: '9876543210', houseNo: '12', street: 'Main Road', villageTown: 'Pennagaram', district: 'Dharmapuri', state: 'Tamil Nadu', pincode: '636810', addressType: 'Home' },
    items: [{ productId: 'prod-dd-8inch', sku: 'VRG-ROSE-01', name: 'Double Delight', tamilName: 'டபுள் டிலைட்', price: 199, mrp: 230, quantity: 1, image: '/products/double-delight.jpeg' }],
    subtotal: 199, shippingCharge: 50, discount: 0, grandTotal: 249, paymentStatus: 'PENDING', orderStatus: 'PENDING', paymentMethod: 'COD', createdAt: '2026-07-30T14:00:00.000Z', updatedAt: '2026-07-30T14:00:00.000Z'
  },
  {
    id: 'ORD-VRG-6769',
    merchantTransactionId: 'MT178542702721868',
    customerName: 'New Account User',
    customerPhone: '9123456789',
    customerEmail: 'newaccount@test.com',
    shippingAddress: { fullName: 'New Account User', phone: '9123456789', houseNo: '88', street: 'Rose Street', villageTown: 'Pennagaram', district: 'Dharmapuri', state: 'Tamil Nadu', pincode: '636810', addressType: 'Home' },
    items: [{ productId: 'prod-panner-leaf', sku: 'VRG-HERB-01', name: 'Panner Leaf Plant', tamilName: 'பன்னீர் இலை', price: 30, mrp: 50, quantity: 1, image: '/products/eq.jpeg' }],
    subtotal: 30, shippingCharge: 50, discount: 0, grandTotal: 80, paymentStatus: 'SUCCESS', orderStatus: 'DELIVERED', paymentMethod: 'COD', createdAt: '2026-07-30T15:57:07.000Z', updatedAt: '2026-07-30T15:57:07.000Z'
  },
  {
    id: 'ORD-VRG-5881',
    merchantTransactionId: 'MT178542465001456',
    customerName: 'Admin List Test User',
    customerPhone: '9998887776',
    customerEmail: 'adminlist@test.com',
    shippingAddress: { fullName: 'Admin List Test User', phone: '9998887776', houseNo: '15', street: 'Flower Lane', villageTown: 'Salem', district: 'Salem', state: 'Tamil Nadu', pincode: '636002', addressType: 'Home' },
    items: [{ productId: 'prod-dd-8inch', sku: 'VRG-ROSE-01', name: 'Double Delight Rose', tamilName: 'டபுள் டிலைட்', price: 199, mrp: 230, quantity: 1, image: '/products/double-delight.jpeg' }],
    subtotal: 199, shippingCharge: 50, discount: 0, grandTotal: 249, paymentStatus: 'SUCCESS', orderStatus: 'DELIVERED', paymentMethod: 'COD', createdAt: '2026-07-30T15:17:30.000Z', updatedAt: '2026-07-30T15:17:30.000Z'
  },
  {
    id: 'ORD-VRG-3014',
    merchantTransactionId: 'MT178542350729786',
    customerName: 'Final Live Test User',
    customerPhone: '9876543210',
    customerEmail: 'finallive@test.com',
    shippingAddress: { fullName: 'Final Live Test User', phone: '9876543210', houseNo: '12', street: 'Garden Lane', villageTown: 'Pennagaram', district: 'Dharmapuri', state: 'Tamil Nadu', pincode: '636810', addressType: 'Home' },
    items: [{ productId: 'prod-panner-leaf', sku: 'VRG-HERB-01', name: 'Panner Leaf Plant', tamilName: 'பன்னீர் இலை', price: 30, mrp: 50, quantity: 1, image: '/products/eq.jpeg' }],
    subtotal: 30, shippingCharge: 50, discount: 0, grandTotal: 80, paymentStatus: 'SUCCESS', orderStatus: 'DELIVERED', paymentMethod: 'COD', createdAt: '2026-07-30T14:58:27.000Z', updatedAt: '2026-07-30T14:58:27.000Z'
  },
  {
    id: 'ORD-VRG-4020',
    merchantTransactionId: 'MT1785424020',
    customerName: 'Naveen Kumar',
    customerPhone: '09360931606',
    customerEmail: 'nv01110612@gmail.com',
    shippingAddress: { fullName: 'Naveen Kumar', phone: '09360931606', houseNo: '21', street: 'Main Road', villageTown: 'Pennagaram', district: 'Dharmapuri', state: 'Tamil Nadu', pincode: '636810', addressType: 'Home' },
    items: [{ productId: 'prod-dd-8inch', sku: 'VRG-ROSE-01', name: 'Double Delight', tamilName: 'டபுள் டிலைட்', price: 199, mrp: 230, quantity: 1, image: '/products/double-delight.jpeg' }],
    subtotal: 199, shippingCharge: 50, discount: 0, grandTotal: 249, paymentStatus: 'SUCCESS', orderStatus: 'DELIVERED', paymentMethod: 'COD', createdAt: '2026-07-30T13:45:00.000Z', updatedAt: '2026-07-30T13:45:00.000Z'
  },
  {
    id: 'ORD-VRG-8219',
    merchantTransactionId: 'MT1785428219',
    customerName: 'Naveen Kumar',
    customerPhone: '09360931606',
    customerEmail: 'nv01110612@gmail.com',
    shippingAddress: { fullName: 'Naveen Kumar', phone: '09360931606', houseNo: '21', street: 'Main Road', villageTown: 'Pennagaram', district: 'Dharmapuri', state: 'Tamil Nadu', pincode: '636810', addressType: 'Home' },
    items: [{ productId: 'prod-dd-8inch', sku: 'VRG-ROSE-01', name: 'Double Delight', tamilName: 'டபுள் டிலைட்', price: 199, mrp: 230, quantity: 1, image: '/products/double-delight.jpeg' }],
    subtotal: 199, shippingCharge: 50, discount: 0, grandTotal: 249, paymentStatus: 'SUCCESS', orderStatus: 'DELIVERED', paymentMethod: 'COD', createdAt: '2026-07-30T13:30:00.000Z', updatedAt: '2026-07-30T13:30:00.000Z'
  },
  {
    id: 'ORD-VRG-6642',
    merchantTransactionId: 'MT1785426642',
    customerName: 'Naveen Kumar',
    customerPhone: '09360931606',
    customerEmail: 'nv01110612@gmail.com',
    shippingAddress: { fullName: 'Naveen Kumar', phone: '09360931606', houseNo: '21', street: 'Main Road', villageTown: 'Pennagaram', district: 'Dharmapuri', state: 'Tamil Nadu', pincode: '636810', addressType: 'Home' },
    items: [{ productId: 'prod-dd-8inch', sku: 'VRG-ROSE-01', name: 'Double Delight', tamilName: 'டபுள் டிலைட்', price: 199, mrp: 230, quantity: 1, image: '/products/double-delight.jpeg' }],
    subtotal: 199, shippingCharge: 50, discount: 0, grandTotal: 249, paymentStatus: 'PENDING', orderStatus: 'PENDING', paymentMethod: 'COD', createdAt: '2026-07-30T13:15:00.000Z', updatedAt: '2026-07-30T13:15:00.000Z'
  },
  {
    id: 'ORD-VRG-9682',
    merchantTransactionId: 'MT1785429682',
    customerName: 'Naveen Kumar',
    customerPhone: '09360931606',
    customerEmail: 'nv01110612@gmail.com',
    shippingAddress: { fullName: 'Naveen Kumar', phone: '09360931606', houseNo: '21', street: 'Main Road', villageTown: 'Pennagaram', district: 'Dharmapuri', state: 'Tamil Nadu', pincode: '636810', addressType: 'Home' },
    items: [{ productId: 'prod-dd-8inch', sku: 'VRG-ROSE-01', name: 'Double Delight', tamilName: 'டபுள் டிலைட்', price: 199, mrp: 230, quantity: 1, image: '/products/double-delight.jpeg' }],
    subtotal: 199, shippingCharge: 50, discount: 0, grandTotal: 249, paymentStatus: 'PENDING', orderStatus: 'PENDING', paymentMethod: 'COD', createdAt: '2026-07-30T13:00:00.000Z', updatedAt: '2026-07-30T13:00:00.000Z'
  },
  {
    id: 'ORD-VRG-4082',
    merchantTransactionId: 'MT1785424082',
    customerName: 'Naveen Kumar',
    customerPhone: '09360931606',
    customerEmail: 'nv01110612@gmail.com',
    shippingAddress: { fullName: 'Naveen Kumar', phone: '09360931606', houseNo: '21', street: 'Main Road', villageTown: 'Pennagaram', district: 'Dharmapuri', state: 'Tamil Nadu', pincode: '636810', addressType: 'Home' },
    items: [{ productId: 'prod-dd-8inch', sku: 'VRG-ROSE-01', name: 'Double Delight', tamilName: 'டபுள் டிலைட்', price: 199, mrp: 230, quantity: 1, image: '/products/double-delight.jpeg' }],
    subtotal: 199, shippingCharge: 50, discount: 0, grandTotal: 249, paymentStatus: 'PENDING', orderStatus: 'PENDING', paymentMethod: 'COD', createdAt: '2026-07-30T12:45:00.000Z', updatedAt: '2026-07-30T12:45:00.000Z'
  },
  {
    id: 'ORD-VRG-2156',
    merchantTransactionId: 'MT1785422156',
    customerName: 'Naveen Kumar',
    customerPhone: '09360931606',
    customerEmail: 'nv01110612@gmail.com',
    shippingAddress: { fullName: 'Naveen Kumar', phone: '09360931606', houseNo: '21', street: 'Main Road', villageTown: 'Pennagaram', district: 'Dharmapuri', state: 'Tamil Nadu', pincode: '636810', addressType: 'Home' },
    items: [{ productId: 'prod-dd-8inch', sku: 'VRG-ROSE-01', name: 'Double Delight', tamilName: 'டபுள் டிலைட்', price: 199, mrp: 230, quantity: 1, image: '/products/double-delight.jpeg' }],
    subtotal: 199, shippingCharge: 50, discount: 0, grandTotal: 249, paymentStatus: 'PENDING', orderStatus: 'PENDING', paymentMethod: 'COD', createdAt: '2026-07-30T12:30:00.000Z', updatedAt: '2026-07-30T12:30:00.000Z'
  },
  {
    id: 'ORD-VRG-1416',
    merchantTransactionId: 'MT1785421416',
    customerName: 'Naveen Kumar',
    customerPhone: '09360931606',
    customerEmail: 'nv01110612@gmail.com',
    shippingAddress: { fullName: 'Naveen Kumar', phone: '09360931606', houseNo: '21', street: 'Main Road', villageTown: 'Pennagaram', district: 'Dharmapuri', state: 'Tamil Nadu', pincode: '636810', addressType: 'Home' },
    items: [{ productId: 'prod-dd-8inch', sku: 'VRG-ROSE-01', name: 'Double Delight', tamilName: 'டபுள் டிலைட்', price: 199, mrp: 230, quantity: 1, image: '/products/double-delight.jpeg' }],
    subtotal: 199, shippingCharge: 50, discount: 0, grandTotal: 249, paymentStatus: 'PENDING', orderStatus: 'PENDING', paymentMethod: 'COD', createdAt: '2026-07-30T12:15:00.000Z', updatedAt: '2026-07-30T12:15:00.000Z'
  },
  {
    id: 'ORD-VRG-2286',
    merchantTransactionId: 'MT1785422286',
    customerName: 'Naveen Kumar',
    customerPhone: '09360931606',
    customerEmail: 'nv01110612@gmail.com',
    shippingAddress: { fullName: 'Naveen Kumar', phone: '09360931606', houseNo: '21', street: 'Main Road', villageTown: 'Pennagaram', district: 'Dharmapuri', state: 'Tamil Nadu', pincode: '636810', addressType: 'Home' },
    items: [{ productId: 'prod-panner-leaf', sku: 'VRG-HERB-01', name: 'Panner Leaf Plant', tamilName: 'பன்னீர் இலை', price: 30, mrp: 50, quantity: 1, image: '/products/eq.jpeg' }],
    subtotal: 30, shippingCharge: 50, discount: 0, grandTotal: 80, paymentStatus: 'PENDING', orderStatus: 'PENDING', paymentMethod: 'COD', createdAt: '2026-07-30T12:00:00.000Z', updatedAt: '2026-07-30T12:00:00.000Z'
  },
  {
    id: 'ORD-VRG-6412',
    merchantTransactionId: 'MT1785426412',
    customerName: 'Naveen Kumar',
    customerPhone: '09360931606',
    customerEmail: 'nv01110612@gmail.com',
    shippingAddress: { fullName: 'Naveen Kumar', phone: '09360931606', houseNo: '21', street: 'Main Road', villageTown: 'Pennagaram', district: 'Dharmapuri', state: 'Tamil Nadu', pincode: '636810', addressType: 'Home' },
    items: [{ productId: 'prod-dd-8inch', sku: 'VRG-ROSE-01', name: 'Double Delight', tamilName: 'டபுள் டிலைட்', price: 199, mrp: 230, quantity: 1, image: '/products/double-delight.jpeg' }],
    subtotal: 199, shippingCharge: 50, discount: 0, grandTotal: 249, paymentStatus: 'PENDING', orderStatus: 'PENDING', paymentMethod: 'COD', createdAt: '2026-07-30T11:45:00.000Z', updatedAt: '2026-07-30T11:45:00.000Z'
  },
  {
    id: 'ORD-VRG-4615',
    merchantTransactionId: 'MT1785424615',
    customerName: 'Naveen Kumar',
    customerPhone: '09360931606',
    customerEmail: 'nv01110612@gmail.com',
    shippingAddress: { fullName: 'Naveen Kumar', phone: '09360931606', houseNo: '11', street: 'Beach Road', villageTown: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', pincode: '600001', addressType: 'Home' },
    items: [{ productId: 'prod-dd-8inch', sku: 'VRG-ROSE-01', name: 'Double Delight', tamilName: 'டபுள் டிலைட்', price: 199, mrp: 230, quantity: 1, image: '/products/double-delight.jpeg' }],
    subtotal: 199, shippingCharge: 50, discount: 0, grandTotal: 249, paymentStatus: 'PENDING', orderStatus: 'PENDING', paymentMethod: 'COD', createdAt: '2026-07-30T11:30:00.000Z', updatedAt: '2026-07-30T11:30:00.000Z'
  },
  {
    id: 'ORD-VRG-1205',
    merchantTransactionId: 'MT1785421205',
    customerName: 'Naveen Kumar',
    customerPhone: '09360931606',
    customerEmail: 'nv01110612@gmail.com',
    shippingAddress: { fullName: 'Naveen Kumar', phone: '09360931606', houseNo: '444', street: 'Beach Road', villageTown: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', pincode: '600001', addressType: 'Home' },
    items: [{ productId: 'prod-panner-leaf', sku: 'VRG-HERB-01', name: 'Panner Leaf Plant', tamilName: 'பன்னீர் இலை', price: 30, mrp: 50, quantity: 1, image: '/products/eq.jpeg' }],
    subtotal: 30, shippingCharge: 50, discount: 0, grandTotal: 80, paymentStatus: 'PENDING', orderStatus: 'PENDING', paymentMethod: 'COD', createdAt: '2026-07-30T11:15:00.000Z', updatedAt: '2026-07-30T11:15:00.000Z'
  },
  {
    id: 'ORD-VRG-6118',
    merchantTransactionId: 'MT1785426118',
    customerName: 'Naveen Kumar',
    customerPhone: '09360931606',
    customerEmail: 'nv01110612@gmail.com',
    shippingAddress: { fullName: 'Naveen Kumar', phone: '09360931606', houseNo: '11', street: 'Beach Road', villageTown: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', pincode: '600001', addressType: 'Home' },
    items: [{ productId: 'prod-tiger-rose', sku: 'VRG-ROSE-02', name: 'Tiger Rose', tamilName: 'டைகர் ரோஸ்', price: 99, mrp: 150, quantity: 1, image: '/products/rhdhd.jpeg' }],
    subtotal: 99, shippingCharge: 50, discount: 0, grandTotal: 149, paymentStatus: 'PENDING', orderStatus: 'PENDING', paymentMethod: 'COD', createdAt: '2026-07-30T11:00:00.000Z', updatedAt: '2026-07-30T11:00:00.000Z'
  },
  {
    id: 'ORD-VRG-9131',
    merchantTransactionId: 'MT1785429131',
    customerName: 'Different Account Customer',
    customerPhone: '9991112223',
    customerEmail: 'diffaccount@test.com',
    shippingAddress: { fullName: 'Different Account Customer', phone: '9991112223', houseNo: '101', street: 'Garden Road', villageTown: 'Salem', district: 'Salem', state: 'Tamil Nadu', pincode: '636001', addressType: 'Home' },
    items: [{ productId: 'prod-button-rose', sku: 'VRG-ROSE-02', name: 'Button Rose Plant', tamilName: 'பட்டன் ரோஸ்', price: 120, mrp: 150, quantity: 2, image: '/products/button.jpeg' }],
    subtotal: 240, shippingCharge: 60, discount: 0, grandTotal: 300, paymentStatus: 'PENDING', orderStatus: 'PENDING', paymentMethod: 'COD', createdAt: '2026-07-30T16:04:00.000Z', updatedAt: '2026-07-30T16:04:00.000Z'
  }
];

const DEFAULT_FINANCES: FinancialEntry[] = [
  {
    id: 'fin-001',
    type: 'EXPENSE',
    title: 'Organic Vermicompost 50kg Bags',
    category: 'Soil & Manure',
    costAmount: 1850,
    sellAmount: 0,
    quantity: 5,
    notes: 'Bought for potting soil mixture at farm',
    date: '2026-07-28',
    createdAt: new Date().toISOString()
  },
  {
    id: 'fin-002',
    type: 'SALE',
    title: 'Wholesale Double Delight Roses (50 Plants Batch)',
    category: 'Plant Wholesale',
    costAmount: 4500,
    sellAmount: 8500,
    quantity: 50,
    notes: 'Direct farm wholesale sale to Hosur reseller',
    date: '2026-07-29',
    createdAt: new Date().toISOString()
  },
  {
    id: 'fin-003',
    type: 'EXPENSE',
    title: '6-inch Black HDPE Plastic Potting Bags (1000 Pcs)',
    category: 'Pots & Bags',
    costAmount: 1200,
    sellAmount: 0,
    quantity: 1000,
    notes: 'Sapling nursery bag restock',
    date: '2026-07-30',
    createdAt: new Date().toISOString()
  }
];

// Persistent deletion tracking across serverless requests
const deletedProductIds = (globalThis as any)._deletedProductIds || ((globalThis as any)._deletedProductIds = new Set<string>());
const deletedCategoryIds = (globalThis as any)._deletedCategoryIds || ((globalThis as any)._deletedCategoryIds = new Set<string>());
const deletedCouponIds = (globalThis as any)._deletedCouponIds || ((globalThis as any)._deletedCouponIds = new Set<string>());
const deletedFinanceIds = (globalThis as any)._deletedFinanceIds || ((globalThis as any)._deletedFinanceIds = new Set<string>());
const deletedOrderIds = (globalThis as any)._deletedOrderIds || ((globalThis as any)._deletedOrderIds = new Set<string>());
const globalMemorySettings: SiteSettings = (globalThis as any)._globalMemorySettings || ((globalThis as any)._globalMemorySettings = { ...DEFAULT_SETTINGS });

const META_DELIMITER = '|||JSON_META|||';

interface CustomMetaSettings {
  enablePhonePe?: boolean;
  enableCod?: boolean;
  enableQrPayment?: boolean;
  upiId?: string;
  upiName?: string;
  qrCodeImageUrl?: string;
  qrInstructions?: string;
}

function extractMetaFromWorkingHours(rawWorkingHours?: string): { workingHours: string; meta: CustomMetaSettings } {
  if (!rawWorkingHours) return { workingHours: DEFAULT_SETTINGS.workingHours, meta: {} };
  const parts = rawWorkingHours.split(META_DELIMITER);
  const workingHours = parts[0] || DEFAULT_SETTINGS.workingHours;
  let meta: CustomMetaSettings = {};
  if (parts[1]) {
    try {
      meta = JSON.parse(parts[1]);
    } catch (e) {
      meta = {};
    }
  }
  return { workingHours, meta };
}

function packMetaIntoWorkingHours(cleanWorkingHours: string, meta: CustomMetaSettings): string {
  return `${cleanWorkingHours || DEFAULT_SETTINGS.workingHours}${META_DELIMITER}${JSON.stringify(meta)}`;
}

class Store {
  private memoryOrders: Order[] = [];
  private memoryFinances: FinancialEntry[] = [...DEFAULT_FINANCES];

  // FINANCIAL EXPENSE & PROFIT MANAGEMENT
  async getFinancialEntries(): Promise<FinancialEntry[]> {
    return this.memoryFinances.filter(f => !deletedFinanceIds.has(f.id));
  }

  async addFinancialEntry(data: Partial<FinancialEntry>): Promise<FinancialEntry> {

    const entry: FinancialEntry = {
      id: 'fin-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      type: data.type || 'EXPENSE',
      title: (data.title || 'Nursery Expense').trim(),
      category: data.category || 'Other',
      costAmount: Number(data.costAmount) || 0,
      sellAmount: Number(data.sellAmount) || 0,
      quantity: Math.max(1, Number(data.quantity) || 1),
      notes: (data.notes || '').trim(),
      date: data.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    this.memoryFinances.unshift(entry);
    return entry;
  }

  async deleteFinancialEntry(id: string): Promise<boolean> {
    deletedFinanceIds.add(id);
    this.memoryFinances = this.memoryFinances.filter(f => f.id !== id);
    return true;
  }

  async updateFinancialEntry(id: string, data: Partial<FinancialEntry>): Promise<FinancialEntry | null> {
    const idx = this.memoryFinances.findIndex(f => f.id === id);
    if (idx !== -1) {
      this.memoryFinances[idx] = {
        ...this.memoryFinances[idx],
        ...(data.type ? { type: data.type } : {}),
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.costAmount !== undefined ? { costAmount: Number(data.costAmount) } : {}),
        ...(data.sellAmount !== undefined ? { sellAmount: Number(data.sellAmount) } : {}),
        ...(data.quantity !== undefined ? { quantity: Number(data.quantity) } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.date ? { date: data.date } : {})
      };
      return this.memoryFinances[idx];
    }
    return null;
  }





  // PRODUCTS
  async getProducts(query?: {
    search?: string;
    categoryId?: string;
    featured?: boolean;
    bestSeller?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }): Promise<Product[]> {
    const prisma = getPrismaClient();
    if (!prisma) {
      let results = [...DEFAULT_PRODUCTS];
      if (query?.categoryId) {
        const catQ = query.categoryId.toLowerCase();
        results = results.filter(p => 
          p.categoryId.toLowerCase() === catQ || 
          p.categoryName.toLowerCase().includes(catQ) || 
          catQ.includes(p.categoryId.toLowerCase())
        );
      }
      if (query?.featured) results = results.filter(p => p.featured);
      if (query?.bestSeller) results = results.filter(p => p.bestSeller);
      if (query?.search) {
        const q = query.search.toLowerCase();
        results = results.filter(p => p.name.toLowerCase().includes(q) || p.tamilName.includes(q) || p.description.toLowerCase().includes(q));
      }
      if (query?.minPrice !== undefined) results = results.filter(p => p.sellingPrice >= query.minPrice!);
      if (query?.maxPrice !== undefined) results = results.filter(p => p.sellingPrice <= query.maxPrice!);
      if (query?.sort === 'price-low') results.sort((a, b) => a.sellingPrice - b.sellingPrice);
      else if (query?.sort === 'price-high') results.sort((a, b) => b.sellingPrice - a.sellingPrice);
      else if (query?.sort === 'rating') results.sort((a, b) => b.rating - a.rating);
      return results;
    }


    try {
      const whereClause: any = { inStock: true };
      if (query?.categoryId) whereClause.categoryId = query.categoryId;
      if (query?.featured) whereClause.isFeatured = true;
      if (query?.bestSeller) whereClause.isBestSeller = true;

      if (query?.search) {
        whereClause.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { nameTamil: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      let orderBy: any = { createdAt: 'desc' };
      if (query?.sort === 'price-low') orderBy = { price: 'asc' };
      else if (query?.sort === 'price-high') orderBy = { price: 'desc' };
      else if (query?.sort === 'rating') orderBy = { rating: 'desc' };

      const items = await prisma.product.findMany({
        where: whereClause,
        include: { categoryRel: true, inventory: true },
        orderBy
      });

      let results: Product[] = items.map(p => ({
        id: p.id,
        sku: p.sku || `VRG-${p.id.slice(0, 6).toUpperCase()}`,
        name: p.name,
        englishName: p.name,
        tamilName: p.nameTamil,
        scientificName: p.scientificName || '',
        categoryId: p.categoryId || '',
        categoryName: p.category,
        description: p.description,
        mrp: p.originalPrice,
        sellingPrice: p.price,
        discount: p.originalPrice > 0 ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0,
        images: p.images.length > 0 ? p.images : [p.image],
        rating: p.rating,
        reviewCount: p.reviewsCount,
        stock: p.inventory?.quantity ?? 50,
        plantHeight: '1.5 - 2 Feet',
        potSize: p.potSize || '6 inch Grow Bag',
        sunlight: 'Full Sun' as const,
        waterRequirement: 'Daily' as const,
        floweringSeason: 'Continuous',
        careInstructions: {
          watering: p.careWatering || 'Daily',
          sunlight: p.careSunlight || 'Full Sun',
          fertilizer: p.careFertilizer || 'Organic compost',
          soil: p.careSoil || 'Red soil'
        },
        featured: p.isFeatured,
        bestSeller: p.isBestSeller,
        trending: true,
        tags: [p.category.toLowerCase()],
        status: 'ACTIVE' as const,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      }));

      // Auto-seed DEFAULT_PRODUCTS to DB if database has fewer products than default
      if (items.length < DEFAULT_PRODUCTS.length) {
        (async () => {
          try {
            for (const cat of DEFAULT_CATEGORIES) {
              await prisma.category.upsert({
                where: { id: cat.id },
                update: {},
                create: {
                  id: cat.id,
                  name: cat.name,
                  nameTamil: cat.tamilName,
                  slug: cat.slug,
                  image: cat.image,
                  description: cat.description,
                  order: cat.order,
                  isActive: cat.isActive,
                  isFeatured: cat.isFeatured
                }
              }).catch(() => {});
            }
            for (const prod of DEFAULT_PRODUCTS) {
              await prisma.product.upsert({
                where: { id: prod.id },
                update: {},
                create: {
                  id: prod.id,
                  sku: prod.sku,
                  name: prod.name,
                  nameTamil: prod.tamilName || prod.name,
                  scientificName: prod.scientificName || null,
                  category: prod.categoryName,
                  categoryId: prod.categoryId,
                  price: prod.sellingPrice,
                  originalPrice: prod.mrp,
                  rating: prod.rating || 4.8,
                  reviewsCount: prod.reviewCount || 10,
                  image: prod.images[0] || '',
                  images: prod.images,
                  inStock: prod.status === 'ACTIVE',
                  potSize: prod.potSize || null,
                  description: prod.description,
                  isBestSeller: prod.bestSeller || false,
                  isFeatured: prod.featured || false,
                  careSunlight: prod.careInstructions?.sunlight || null,
                  careWatering: prod.careInstructions?.watering || null,
                  careSoil: prod.careInstructions?.soil || null,
                  careFertilizer: prod.careInstructions?.fertilizer || null,
                  inventory: {
                    create: {
                      quantity: prod.stock || 50
                    }
                  }
                }
              }).catch(() => {});
            }
          } catch (seedErr) {
            console.warn('Auto-seed products error:', seedErr);
          }
        })();
      }

      // Merge results with DEFAULT_PRODUCTS so missing default products are included
      const existingIds = new Set(results.map(p => p.id));
      for (const defProd of DEFAULT_PRODUCTS) {
        if (!existingIds.has(defProd.id)) {
          let matches = true;
          if (query?.categoryId) {
            const catQ = query.categoryId.toLowerCase();
            if (defProd.categoryId.toLowerCase() !== catQ && !defProd.categoryName.toLowerCase().includes(catQ)) {
              matches = false;
            }
          }
          if (query?.featured && !defProd.featured) matches = false;
          if (query?.bestSeller && !defProd.bestSeller) matches = false;
          if (query?.search) {
            const q = query.search.toLowerCase();
            if (!defProd.name.toLowerCase().includes(q) && !defProd.tamilName.includes(q) && !defProd.description.toLowerCase().includes(q)) {
              matches = false;
            }
          }
          if (matches) {
            results.push(defProd);
            existingIds.add(defProd.id);
          }
        }
      }

      if (query?.minPrice !== undefined) {
        results = results.filter(p => p.sellingPrice >= query.minPrice!);
      }
      if (query?.maxPrice !== undefined) {
        results = results.filter(p => p.sellingPrice <= query.maxPrice!);
      }

      return results.filter(p => !deletedProductIds.has(p.id));
    } catch (err) {
      console.error('Prisma getProducts error:', err);
      return DEFAULT_PRODUCTS.filter(p => !deletedProductIds.has(p.id));
    }
  }


  async getProductById(id: string): Promise<Product | undefined> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const p = await prisma.product.findUnique({
          where: { id },
          include: { categoryRel: true, inventory: true }
        });
        if (p) {
          return {
            id: p.id,
            sku: p.sku || `VRG-${p.id.slice(0, 6).toUpperCase()}`,
            name: p.name,
            englishName: p.name,
            tamilName: p.nameTamil,
            scientificName: p.scientificName || '',
            categoryId: p.categoryId || '',
            categoryName: p.category,
            description: p.description,
            mrp: p.originalPrice,
            sellingPrice: p.price,
            discount: p.originalPrice > 0 ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0,
            images: p.images.length > 0 ? p.images : [p.image],
            rating: p.rating,
            reviewCount: p.reviewsCount,
            stock: p.inventory?.quantity ?? 50,
            plantHeight: '1.5 - 2 Feet',
            potSize: p.potSize || '6 inch Grow Bag',
            sunlight: 'Full Sun' as const,
            waterRequirement: 'Daily' as const,
            floweringSeason: 'Continuous',
            careInstructions: {
              watering: p.careWatering || 'Daily',
              sunlight: p.careSunlight || 'Full Sun',
              fertilizer: p.careFertilizer || 'Organic compost',
              soil: p.careSoil || 'Red soil'
            },
            featured: p.isFeatured,
            bestSeller: p.isBestSeller,
            trending: true,
            tags: [p.category.toLowerCase()],
            status: 'ACTIVE',
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString()
          };
        }
      } catch (err) {
        console.error('Prisma getProductById error:', err);
      }
    }
    return DEFAULT_PRODUCTS.find(p => p.id === id);
  }

  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount'>): Promise<Product> {
    const prisma = getPrismaClient();
    const id = 'prod-' + Date.now();
    const sku = product.sku || `VRG-${id.slice(-6).toUpperCase()}`;

    if (prisma) {
      try {
        const created = await prisma.product.create({
          data: {
            id,
            sku,
            name: product.name,
            nameTamil: product.tamilName || product.name,
            scientificName: product.scientificName,
            category: product.categoryName || 'Roses',
            categoryId: product.categoryId,
            description: product.description || '',
            price: product.sellingPrice,
            originalPrice: product.mrp,
            image: product.images?.[0] || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
            images: product.images || [],
            isFeatured: product.featured || false,
            isBestSeller: product.bestSeller || false,
            potSize: product.potSize,
            careWatering: product.careInstructions?.watering,
            careSunlight: product.careInstructions?.sunlight,
            careFertilizer: product.careInstructions?.fertilizer,
            careSoil: product.careInstructions?.soil
          }
        });

        await prisma.inventory.create({
          data: {
            productId: id,
            quantity: product.stock ?? 50
          }
        });

        return {
          ...product,
          id,
          sku,
          rating: 5.0,
          reviewCount: 0,
          status: 'ACTIVE',
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString()
        } as Product;
      } catch (err) {
        console.error('Prisma addProduct error:', err);
      }
    }

    return {
      ...product,
      id,
      sku,
      rating: 5.0,
      reviewCount: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    try {
      await prisma.product.update({
        where: { id },
        data: {
          ...(updates.name ? { name: updates.name } : {}),
          ...(updates.tamilName ? { nameTamil: updates.tamilName } : {}),
          ...(updates.scientificName !== undefined ? { scientificName: updates.scientificName } : {}),
          ...(updates.sellingPrice !== undefined ? { price: updates.sellingPrice } : {}),
          ...(updates.mrp !== undefined ? { originalPrice: updates.mrp } : {}),
          ...(updates.description !== undefined ? { description: updates.description } : {}),
          ...(updates.images ? { images: updates.images, image: updates.images[0] } : {}),
          ...(updates.featured !== undefined ? { isFeatured: updates.featured } : {}),
          ...(updates.bestSeller !== undefined ? { isBestSeller: updates.bestSeller } : {}),
          ...(updates.categoryId ? { categoryId: updates.categoryId } : {}),
          ...(updates.categoryName ? { category: updates.categoryName } : {})
        }
      });

      if (updates.stock !== undefined) {
        await prisma.inventory.upsert({
          where: { productId: id },
          update: { quantity: updates.stock },
          create: { productId: id, quantity: updates.stock }
        });
      }

      return (await this.getProductById(id)) || null;
    } catch (err) {
      console.error('Prisma updateProduct error:', err);
      return null;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    deletedProductIds.add(id);
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await prisma.inventory.deleteMany({ where: { productId: id } }).catch(() => {});
        await prisma.product.delete({ where: { id } }).catch(() => {});
      } catch (err) {
        console.error('Prisma deleteProduct error:', err);
      }
    }
    return true;
  }

  async deleteAllProducts(): Promise<boolean> {
    DEFAULT_PRODUCTS.forEach(p => deletedProductIds.add(p.id));
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await prisma.inventory.deleteMany().catch(() => {});
        await prisma.product.deleteMany().catch(() => {});
      } catch (err) {
        console.error('Prisma deleteAllProducts error:', err);
      }
    }
    return true;
  }


  // CATEGORIES
  async getCategories(options?: { onlyActive?: boolean; onlyFeatured?: boolean }): Promise<Category[]> {
    const prisma = getPrismaClient();
    if (!prisma) {
      let results = [...DEFAULT_CATEGORIES];
      if (options?.onlyActive) results = results.filter(c => c.isActive);
      if (options?.onlyFeatured) results = results.filter(c => c.isFeatured);
      return results;
    }

    try {
      const whereClause: any = {};
      if (options?.onlyActive) whereClause.isActive = true;
      if (options?.onlyFeatured) whereClause.isFeatured = true;

      const items = await prisma.category.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { products: true }
          }
        },
        orderBy: [
          { order: 'asc' },
          { name: 'asc' }
        ]
      });

      const results = items.map(c => ({
        id: c.id,
        name: c.name,
        tamilName: c.nameTamil,
        slug: c.slug,
        description: c.description || '',
        image: c.image || '/products/double-delight.jpeg',
        iconName: c.icon || 'Flower2',
        order: c.order,
        isActive: c.isActive,
        isFeatured: c.isFeatured,
        productCount: c._count.products,
        metaTitle: c.metaTitle || undefined,
        metaDescription: c.metaDescription || undefined,
        ogImage: c.ogImage || undefined,
        canonicalUrl: c.canonicalUrl || undefined,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
      }));
      const existingCatIds = new Set(results.map(c => c.id));
      for (const defCat of DEFAULT_CATEGORIES) {
        if (!existingCatIds.has(defCat.id)) {
          let matches = true;
          if (options?.onlyActive && !defCat.isActive) matches = false;
          if (options?.onlyFeatured && !defCat.isFeatured) matches = false;
          if (matches) {
            results.push({
              id: defCat.id,
              name: defCat.name,
              tamilName: defCat.tamilName,
              slug: defCat.slug,
              description: defCat.description || '',
              image: defCat.image || '/products/double-delight.jpeg',
              iconName: 'Flower2',
              order: defCat.order,
              isActive: defCat.isActive,
              isFeatured: defCat.isFeatured,
              productCount: defCat.productCount || 0,
              metaTitle: undefined,
              metaDescription: undefined,
              ogImage: undefined,
              canonicalUrl: undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            existingCatIds.add(defCat.id);
          }
        }
      }

      return results.filter(c => !deletedCategoryIds.has(c.id));
    } catch (err) {
      console.error('Prisma getCategories error:', err);
      return DEFAULT_CATEGORIES.filter(c => !deletedCategoryIds.has(c.id));
    }
  }


  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    try {
      const c = await prisma.category.findFirst({
        where: {
          OR: [
            { slug: slug },
            { id: slug }
          ]
        },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      if (!c) return null;

      return {
        id: c.id,
        name: c.name,
        tamilName: c.nameTamil,
        slug: c.slug,
        description: c.description || '',
        image: c.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        iconName: c.icon || 'Flower2',
        order: c.order,
        isActive: c.isActive,
        isFeatured: c.isFeatured,
        productCount: c._count.products,
        metaTitle: c.metaTitle || undefined,
        metaDescription: c.metaDescription || undefined,
        ogImage: c.ogImage || undefined,
        canonicalUrl: c.canonicalUrl || undefined,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
      };
    } catch (err) {
      console.error('Prisma getCategoryBySlug error:', err);
      return null;
    }
  }

  async addCategory(cat: {
    name: string;
    tamilName?: string;
    nameTamil?: string;
    slug?: string;
    description?: string;
    image?: string;
    iconName?: string;
    order?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
  }): Promise<Category> {
    const prisma = getPrismaClient();

    const cleanName = String(cat.name || '').trim();
    if (!cleanName) {
      throw new Error('Category name is required.');
    }

    const nameTamil = String(cat.tamilName || cat.nameTamil || cleanName).trim();
    let slug = String(cat.slug || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!slug) {
      slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    if (prisma) {
      // Check duplicate name or slug
      const existing = await prisma.category.findFirst({
        where: {
          OR: [
            { name: { equals: cleanName, mode: 'insensitive' } },
            { slug: slug }
          ]
        }
      });

      if (existing) {
        if (existing.name.toLowerCase() === cleanName.toLowerCase()) {
          throw new Error(`Category name "${cleanName}" already exists.`);
        }
        if (existing.slug === slug) {
          throw new Error(`Category slug "${slug}" already exists.`);
        }
      }

      const id = 'cat-' + Date.now();
      const c = await prisma.category.create({
        data: {
          id,
          name: cleanName,
          nameTamil,
          slug,
          description: cat.description || '',
          image: cat.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
          icon: cat.iconName || 'Flower2',
          order: cat.order ?? 1,
          isActive: cat.isActive !== undefined ? cat.isActive : true,
          isFeatured: cat.isFeatured !== undefined ? cat.isFeatured : false,
          metaTitle: cat.metaTitle || null,
          metaDescription: cat.metaDescription || null,
          ogImage: cat.ogImage || null,
          canonicalUrl: cat.canonicalUrl || null
        }
      });

      return {
        id: c.id,
        name: c.name,
        tamilName: c.nameTamil,
        slug: c.slug,
        description: c.description || '',
        image: c.image || '',
        iconName: c.icon || 'Flower2',
        order: c.order,
        isActive: c.isActive,
        isFeatured: c.isFeatured,
        productCount: 0,
        metaTitle: c.metaTitle || undefined,
        metaDescription: c.metaDescription || undefined,
        ogImage: c.ogImage || undefined,
        canonicalUrl: c.canonicalUrl || undefined,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
      };
    }

    throw new Error('Database connection unavailable.');
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    try {
      const dataToUpdate: any = {};
      if (updates.name) {
        const cleanName = String(updates.name).trim();
        // Check duplicate name
        const dupName = await prisma.category.findFirst({
          where: {
            id: { not: id },
            name: { equals: cleanName, mode: 'insensitive' }
          }
        });
        if (dupName) throw new Error(`Category name "${cleanName}" is already taken.`);
        dataToUpdate.name = cleanName;
      }

      if (updates.tamilName) {
        dataToUpdate.nameTamil = String(updates.tamilName).trim();
      }

      if (updates.slug) {
        const cleanSlug = String(updates.slug).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const dupSlug = await prisma.category.findFirst({
          where: {
            id: { not: id },
            slug: cleanSlug
          }
        });
        if (dupSlug) throw new Error(`Category slug "${cleanSlug}" is already taken.`);
        dataToUpdate.slug = cleanSlug;
      }

      if (updates.description !== undefined) dataToUpdate.description = updates.description;
      if (updates.image !== undefined) dataToUpdate.image = updates.image;
      if (updates.iconName !== undefined) dataToUpdate.icon = updates.iconName;
      if (updates.order !== undefined) dataToUpdate.order = updates.order;
      if (updates.isActive !== undefined) dataToUpdate.isActive = updates.isActive;
      if (updates.isFeatured !== undefined) dataToUpdate.isFeatured = updates.isFeatured;
      if (updates.metaTitle !== undefined) dataToUpdate.metaTitle = updates.metaTitle;
      if (updates.metaDescription !== undefined) dataToUpdate.metaDescription = updates.metaDescription;
      if (updates.ogImage !== undefined) dataToUpdate.ogImage = updates.ogImage;
      if (updates.canonicalUrl !== undefined) dataToUpdate.canonicalUrl = updates.canonicalUrl;

      const c = await prisma.category.update({
        where: { id },
        data: dataToUpdate,
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      return {
        id: c.id,
        name: c.name,
        tamilName: c.nameTamil,
        slug: c.slug,
        description: c.description || '',
        image: c.image || '',
        iconName: c.icon || 'Flower2',
        order: c.order,
        isActive: c.isActive,
        isFeatured: c.isFeatured,
        productCount: c._count.products,
        metaTitle: c.metaTitle || undefined,
        metaDescription: c.metaDescription || undefined,
        ogImage: c.ogImage || undefined,
        canonicalUrl: c.canonicalUrl || undefined,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
      };
    } catch (err: any) {
      console.error('Prisma updateCategory error:', err);
      throw err;
    }
  }

  async deleteCategory(id: string, options?: { force?: boolean; targetCategoryId?: string }): Promise<{ success: boolean; hasProducts?: boolean; productCount?: number; message?: string }> {
    const prisma = getPrismaClient();
    if (!prisma) return { success: false, message: 'Database client not connected.' };

    try {
      const productCount = await prisma.product.count({
        where: { categoryId: id }
      });

      if (productCount > 0 && !options?.force) {
        if (options?.targetCategoryId) {
          // Reassign products to target category first
          await prisma.product.updateMany({
            where: { categoryId: id },
            data: { categoryId: options.targetCategoryId }
          });
        } else {
          return {
            success: false,
            hasProducts: true,
            productCount,
            message: `This category contains ${productCount} products. Move the products to another category before deleting.`
          };
        }
      }

      deletedCategoryIds.add(id);
      await prisma.category.delete({ where: { id } }).catch(() => {});
      return { success: true, message: 'Category deleted successfully' };
    } catch (err: any) {
      deletedCategoryIds.add(id);
      return { success: true, message: 'Category deleted successfully' };
    }
  }

  async deleteAllCategories(): Promise<boolean> {
    DEFAULT_CATEGORIES.forEach(c => deletedCategoryIds.add(c.id));
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await prisma.category.deleteMany().catch(() => {});
      } catch (err) {
        console.error('Prisma deleteAllCategories error:', err);
      }
    }
    return true;
  }


  // BANNERS
  async addBanner(data: { title: string; subtitle?: string; imageUrl: string; targetCategory?: string; active?: boolean; order?: number }): Promise<Banner> {
    const prisma = getPrismaClient();
    const id = 'banner-' + Date.now();
    if (prisma) {
      try {
        const b = await prisma.banner.create({
          data: {
            id,
            title: data.title,
            subtitle: data.subtitle || '',
            imageUrl: data.imageUrl,
            targetCategory: data.targetCategory || '',
            active: data.active !== false,
            order: data.order || 1
          }
        });
        return { id: b.id, title: b.title, subtitle: b.subtitle || '', imageUrl: b.imageUrl, targetCategory: b.targetCategory || '', active: b.active, order: b.order };
      } catch (err) {
        console.error('Prisma addBanner error:', err);
      }
    }
    return { id, ...data, subtitle: data.subtitle || '', targetCategory: data.targetCategory || '', active: data.active !== false, order: data.order || 1 };
  }

  async getBanners(): Promise<Banner[]> {
    const prisma = getPrismaClient();
    if (!prisma) return [];

    try {
      const items = await prisma.banner.findMany({
        where: { active: true },
        orderBy: { order: 'asc' }
      });
      return items.map(b => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle || '',
        imageUrl: b.imageUrl,
        targetCategory: b.targetCategory || '',
        active: b.active,
        order: b.order
      }));
    } catch (err) {
      console.error('Prisma getBanners error:', err);
      return [];
    }
  }

  // COUPONS
  async getCoupons(): Promise<Coupon[]> {
    const prisma = getPrismaClient();

    if (prisma) {
      try {
        const items = await prisma.coupon.findMany({
          where: { isActive: true }
        });
        return items.map(c => ({
          id: c.id,
          code: c.code,
          type: (c.discountType === 'FIXED' ? 'FIXED' : 'PERCENT') as 'FIXED' | 'PERCENT',

          value: c.discountValue,
          minOrder: c.minOrderValue,
          maxDiscount: c.maxDiscount || undefined,
          expiryDate: c.expiresAt ? c.expiresAt.toISOString() : '2028-12-31T23:59:59.000Z',
          active: c.isActive,
          usageCount: c.timesUsed
        })).filter(c => !deletedCouponIds.has(c.id) && !deletedCouponIds.has(c.code.toUpperCase()));
      } catch (err) {
        console.error('Prisma getCoupons error:', err);
      }
    }

    return [];
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode || deletedCouponIds.has(cleanCode)) return undefined;

    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const c = await prisma.coupon.findFirst({
          where: { code: { equals: cleanCode, mode: 'insensitive' }, isActive: true }
        });
        if (c && !deletedCouponIds.has(c.id) && !deletedCouponIds.has(c.code.toUpperCase())) {
          return {
            id: c.id,
            code: c.code,
            type: c.discountType === 'FIXED' ? 'FIXED' : 'PERCENT',
            value: c.discountValue,
            minOrder: c.minOrderValue,
            maxDiscount: c.maxDiscount || undefined,
            expiryDate: c.expiresAt ? c.expiresAt.toISOString() : '2028-12-31T23:59:59.000Z',
            active: c.isActive,
            usageCount: c.timesUsed
          };
        }
      } catch (err) {
        console.error('Prisma getCouponByCode error:', err);
      }
    }

    const coupons = await this.getCoupons();
    return coupons.find(c => c.code.toUpperCase() === cleanCode && c.active);
  }



  async addCoupon(coupon: Omit<Coupon, 'id' | 'usageCount'>): Promise<Coupon> {
    const prisma = getPrismaClient();
    const id = 'coup-' + Date.now();

    if (prisma) {
      try {
        const c = await prisma.coupon.create({
          data: {
            id,
            code: coupon.code.toUpperCase(),
            discountType: coupon.type === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
            discountValue: coupon.value,
            minOrderValue: coupon.minOrder || 0,
            maxDiscount: coupon.maxDiscount || null,
            isActive: coupon.active !== false
          }
        });

        return {
          id: c.id,
          code: c.code,
          type: c.discountType === 'FIXED' ? 'FIXED' : 'PERCENT',
          value: c.discountValue,
          minOrder: c.minOrderValue,
          maxDiscount: c.maxDiscount || undefined,
          expiryDate: c.expiresAt ? c.expiresAt.toISOString() : '2026-12-31T23:59:59.000Z',
          active: c.isActive,
          usageCount: c.timesUsed
        };
      } catch (err) {
        console.error('Prisma addCoupon error:', err);
      }
    }

    return {
      ...coupon,
      id,
      usageCount: 0
    };
  }

  async deleteCoupon(idOrCode: string): Promise<boolean> {
    const clean = (idOrCode || '').trim();
    if (clean) {
      deletedCouponIds.add(clean);
      deletedCouponIds.add(clean.toUpperCase());
    }
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const upper = clean.toUpperCase();
        await prisma.coupon.deleteMany({
          where: {
            OR: [
              { id: clean },
              { code: clean },
              { code: upper }
            ]
          }
        }).catch(() => {});
      } catch (err) {
        console.error('Prisma deleteCoupon error:', err);
      }
    }
    return true;
  }




  // REVIEWS
  async getReviews(productId?: string): Promise<Review[]> {
    const prisma = getPrismaClient();
    if (!prisma) return [];

    try {
      const items = await prisma.review.findMany({
        where: productId ? { productId } : {},
        include: { product: true },
        orderBy: { createdAt: 'desc' }
      });

      return items.map(r => ({
        id: r.id,
        productId: r.productId,
        productName: r.product?.name || 'Plant',
        userName: r.userName,
        rating: r.rating,
        title: `${r.rating} Star Review`,
        comment: r.comment,
        status: 'APPROVED',
        createdAt: r.createdAt.toISOString()
      }));
    } catch (err) {
      console.error('Prisma getReviews error:', err);
      return [];
    }
  }

  async addReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'status'>): Promise<Review> {
    const prisma = getPrismaClient();
    const id = 'rev-' + Date.now();

    if (prisma) {
      try {
        const r = await prisma.review.create({
          data: {
            id,
            productId: reviewData.productId,
            userName: reviewData.userName,
            rating: reviewData.rating,
            comment: reviewData.comment,
            isVerified: true
          }
        });

        return {
          id: r.id,
          productId: r.productId,
          productName: reviewData.productName || 'Plant',
          userName: r.userName,
          rating: r.rating,
          title: reviewData.title || `${r.rating} Star Review`,
          comment: r.comment,
          status: 'APPROVED',
          createdAt: r.createdAt.toISOString()
        };
      } catch (err) {
        console.error('Prisma addReview error:', err);
      }
    }

    return {
      ...reviewData,
      id,
      status: 'APPROVED',
      createdAt: new Date().toISOString()
    };
  }

  // SITE SETTINGS
  async getSettings(): Promise<SiteSettings> {
    const prisma = getPrismaClient();
    const memory = (globalThis as any)._globalMemorySettings || {};
    if (!prisma) return { ...DEFAULT_SETTINGS, ...memory };

    try {
      const s = await prisma.siteSetting.findUnique({
        where: { id: 'default' }
      });

      if (!s) return { ...DEFAULT_SETTINGS, ...memory };

      const { workingHours, meta } = extractMetaFromWorkingHours(s.workingHours);

      // Prisma DB + meta always wins; memory is only fallback for fields not in DB
      const merged: SiteSettings = {
        ...DEFAULT_SETTINGS,
        ...memory,
        // Explicit Prisma column fields
        businessName: s.businessName,
        tagline: s.tagline,
        phone: s.phone,
        email: s.email,
        whatsapp: s.whatsapp,
        address: s.address,
        googleMapsUrl: s.googleMapsUrl,
        workingHours: workingHours,
        taxRate: s.taxRate,
        shippingFee: s.shippingFee,
        freeShippingThreshold: s.freeShippingThreshold,
        phonepeMerchantId: s.phonepeMerchantId,
        phonepeSaltKey: s.phonepeSaltKey,
        phonepeSaltIndex: s.phonepeSaltIndex,
        phonepeEnv: s.phonepeEnv as 'SANDBOX' | 'PRODUCTION',
        // Meta fields packed inside workingHours JSON — always override memory/defaults
        ...(meta.enablePhonePe !== undefined && { enablePhonePe: meta.enablePhonePe }),
        ...(meta.enableCod !== undefined && { enableCod: meta.enableCod }),
        ...(meta.enableQrPayment !== undefined && { enableQrPayment: meta.enableQrPayment }),
        ...(meta.upiId && { upiId: meta.upiId }),
        ...(meta.upiName && { upiName: meta.upiName }),
        ...(meta.qrCodeImageUrl && { qrCodeImageUrl: meta.qrCodeImageUrl }),
        ...(meta.qrInstructions && { qrInstructions: meta.qrInstructions }),
      };

      (globalThis as any)._globalMemorySettings = merged;
      return merged;
    } catch (err) {
      console.error('Prisma getSettings error:', err);
      return { ...DEFAULT_SETTINGS, ...memory };
    }
  }

  async updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
    const current = await this.getSettings();
    const merged: SiteSettings = {
      ...current,
      ...updates
    };

    (globalThis as any)._globalMemorySettings = merged;

    const prisma = getPrismaClient();

    if (prisma) {
      try {
        const metaToStore: CustomMetaSettings = {
          enablePhonePe: merged.enablePhonePe,
          enableCod: merged.enableCod,
          enableQrPayment: merged.enableQrPayment,
          upiId: merged.upiId,
          upiName: merged.upiName,
          qrCodeImageUrl: merged.qrCodeImageUrl,
          qrInstructions: merged.qrInstructions
        };

        const packedWorkingHours = packMetaIntoWorkingHours(merged.workingHours, metaToStore);

        const s = await prisma.siteSetting.upsert({
          where: { id: 'default' },
          update: {
            businessName: merged.businessName,
            tagline: merged.tagline,
            phone: merged.phone,
            email: merged.email,
            whatsapp: merged.whatsapp,
            address: merged.address,
            googleMapsUrl: merged.googleMapsUrl,
            workingHours: packedWorkingHours,
            taxRate: merged.taxRate,
            shippingFee: merged.shippingFee,
            freeShippingThreshold: merged.freeShippingThreshold,
            phonepeMerchantId: merged.phonepeMerchantId,
            phonepeSaltKey: merged.phonepeSaltKey,
            phonepeSaltIndex: merged.phonepeSaltIndex,
            phonepeEnv: merged.phonepeEnv
          },
          create: {
            id: 'default',
            businessName: merged.businessName,
            tagline: merged.tagline,
            phone: merged.phone,
            email: merged.email,
            whatsapp: merged.whatsapp,
            address: merged.address,
            googleMapsUrl: merged.googleMapsUrl,
            workingHours: packedWorkingHours,
            taxRate: merged.taxRate,
            shippingFee: merged.shippingFee,
            freeShippingThreshold: merged.freeShippingThreshold,
            phonepeMerchantId: merged.phonepeMerchantId,
            phonepeSaltKey: merged.phonepeSaltKey,
            phonepeSaltIndex: merged.phonepeSaltIndex,
            phonepeEnv: merged.phonepeEnv
          }
        });

        return merged;
      } catch (err) {
        console.error('Prisma updateSettings error:', err);
      }
    }

    return merged;
  }

  // ORDERS
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const id = 'ORD-VRG-' + Math.floor(1000 + Math.random() * 9000);
    const order: Order = {
      ...orderData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const prisma = getPrismaClient();
    if (prisma) {
      try {
        // Step 1: Ensure missing products exist in PostgreSQL BEFORE starting order transaction
        for (const item of order.items) {
          try {
            const existingProd = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!existingProd) {
              const defProd = DEFAULT_PRODUCTS.find(p => p.id === item.productId);
              const uniqueSku = item.sku || `VRG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
              await prisma.product.create({
                data: {
                  id: item.productId,
                  sku: uniqueSku,
                  name: item.name,
                  nameTamil: item.tamilName || item.name,
                  price: item.price,
                  originalPrice: item.mrp || item.price,
                  category: defProd?.categoryName || 'Roses',
                  categoryId: null, // set null so FK constraint to Category table is not triggered if Category record absent
                  image: item.image || '',
                  description: defProd?.description || item.name || 'Live Plant Sapling',
                  inventory: {
                    create: {
                      quantity: 100
                    }
                  }
                }
              }).catch((e) => console.warn('Product pre-creation soft error:', e?.message));
            }
          } catch (pErr) {
            console.warn('Product pre-creation check notice:', pErr);
          }
        }

        // Step 2: Create Order & OrderItems in transaction
        await executeInTransaction(async (tx) => {
          let validUserId: string | null = null;
          if (order.userId) {
            try {
              const userExists = await tx.user.findUnique({ where: { id: order.userId } });
              if (userExists) validUserId = order.userId;
            } catch {}
          }

          // Pre-resolve all product IDs to ensure valid FK references in OrderItem table
          const resolvedItems = [];
          for (const item of order.items) {
            let targetProdId = item.productId;
            const existing = await tx.product.findUnique({ where: { id: item.productId } }).catch(() => null);
            if (!existing) {
              const matched = await tx.product.findFirst({
                where: { OR: [{ sku: item.sku }, { name: item.name }] }
              }).catch(() => null);

              if (matched) {
                targetProdId = matched.id;
              } else {
                const freshSku = `VRG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
                const created = await tx.product.create({
                  data: {
                    id: item.productId,
                    sku: freshSku,
                    name: item.name || 'Nursery Plant Sapling',
                    nameTamil: item.tamilName || item.name || 'ரோஜா செடி',
                    price: item.price || 199,
                    originalPrice: item.mrp || 230,
                    category: 'Roses',
                    categoryId: null,
                    image: item.image || '/products/double-delight.jpeg',
                    description: item.name || 'Live Nursery Plant'
                  }
                }).catch(() => null);

                if (created) {
                  targetProdId = created.id;
                } else {
                  const firstAny = await tx.product.findFirst().catch(() => null);
                  if (firstAny) targetProdId = firstAny.id;
                }
              }
            }
            resolvedItems.push({
              ...item,
              resolvedProductId: targetProdId
            });
          }

          // Pack paymentProofUrl (base64 image) into notes column for persistence
          const notesPayload = order.paymentProofUrl
            ? `|||PROOF|||${order.paymentProofUrl}|||TXNID|||${order.transactionId || ''}`
            : (order.transactionId ? `|||TXNID|||${order.transactionId}` : null);

          await tx.order.create({
            data: {
              id: order.id,
              orderNumber: order.id,
              merchantTransactionId: order.merchantTransactionId,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
              customerEmail: order.customerEmail || null,
              userId: validUserId,
              shippingAddress: typeof order.shippingAddress === 'string' ? order.shippingAddress : JSON.stringify(order.shippingAddress),
              subtotal: order.subtotal,
              discount: order.discount,
              deliveryFee: order.shippingCharge,
              totalAmount: order.grandTotal,
              status: 'PENDING',
              paymentStatus: order.paymentStatus === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
              paymentMethod: (order.paymentMethod === 'COD' ? 'COD' : (order.paymentMethod === 'QR_PAYMENT' || order.paymentMethod === 'UPI_DIRECT' || Boolean(order.paymentProofUrl)) ? 'UPI' : 'PHONEPE') as any,
              notes: notesPayload,
              items: {
                create: resolvedItems.map(item => ({
                  productId: item.resolvedProductId,
                  productName: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  totalPrice: item.price * item.quantity
                }))
              }
            }
          });

          // Reduce stock in inventory
          for (const item of orderData.items) {
            await tx.inventory.updateMany({
              where: { productId: item.productId },
              data: {
                quantity: { decrement: item.quantity }
              }
            }).catch(() => {});
          }
        });
      } catch (err: any) {
        console.error('Prisma createOrder transaction error:', err?.message || err);
      }
    }

    this.memoryOrders.unshift(order);
    if (!(globalThis as any).globalMemoryOrdersBuffer) (globalThis as any).globalMemoryOrdersBuffer = [];
    (globalThis as any).globalMemoryOrdersBuffer.unshift(order);
    // Persist to Firestore for cross-device/cross-request access
    firestoreSaveOrder(order).catch(() => {});
    return order;
  }

  async getOrders(userId?: string): Promise<Order[]> {
    const prisma = getPrismaClient();
    let dbOrders: Order[] = [];

    if (prisma) {
      try {
        const items = await prisma.order.findMany({
          where: userId ? { userId } : {},
          include: { items: true },
          orderBy: { createdAt: 'desc' }
        });

        dbOrders = items.map(o => {
          const parsedAddress = {
            fullName: o.customerName,
            phone: o.customerPhone,
            houseNo: '',
            street: '',
            villageTown: '',
            district: '',
            state: 'Tamil Nadu',
            pincode: '',
            ...parseShippingAddress(o.shippingAddress)
          };

          const itemsSnapshot: OrderItemSnapshot[] = o.items.map(i => ({
            productId: i.productId,
            sku: `VRG-${(i.productId || 'PROD').slice(0, 6).toUpperCase()}`,
            name: i.productName || 'Nursery Plant',
            tamilName: i.productName || 'நார்சரி செடி',
            price: i.price,
            mrp: i.price,
            quantity: i.quantity,
            image: '/products/double-delight.jpeg'
          }));

          // Unpack paymentProofUrl and transactionId from notes column
          const notesStr = (o as any).notes || '';
          let unpackedProofUrl: string | undefined = undefined;
          let unpackedTxnId: string | undefined = undefined;
          if (notesStr.includes('|||PROOF|||')) {
            const proofMatch = notesStr.split('|||PROOF|||')[1]?.split('|||TXNID|||')[0];
            const txnMatch = notesStr.split('|||TXNID|||')[1];
            if (proofMatch) unpackedProofUrl = proofMatch.trim();
            if (txnMatch) unpackedTxnId = txnMatch.trim();
          } else if (notesStr.includes('|||TXNID|||')) {
            const txnMatch = notesStr.split('|||TXNID|||')[1];
            if (txnMatch) unpackedTxnId = txnMatch.trim();
          }

          const hasProof = Boolean(unpackedProofUrl);
          return {
            id: o.id,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            customerEmail: o.customerEmail || '',
            shippingAddress: parsedAddress,
            items: itemsSnapshot,
            subtotal: o.subtotal,
            discount: o.discount,
            shippingCharge: o.deliveryFee,
            grandTotal: o.totalAmount,
            orderStatus: o.status === 'DELIVERED' ? 'DELIVERED' : o.status === 'DISPATCHED' ? 'DISPATCHED' : o.status === 'PAID' || o.status === 'PACKING' ? 'PROCESSING' : o.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING',
            paymentStatus: o.paymentStatus === 'SUCCESS' ? 'SUCCESS' : o.paymentStatus === 'FAILED' ? 'FAILED' : 'PENDING',
            paymentMethod: ((o as any).paymentMethod === 'COD' 
              ? 'COD' 
              : ((o as any).paymentMethod === 'UPI' || (o as any).paymentMethod === 'QR_PAYMENT' || hasProof)
              ? 'QR_PAYMENT'
              : 'PHONEPE') as PaymentMethod,
            paymentProofUrl: unpackedProofUrl,
            transactionId: unpackedTxnId || o.merchantTransactionId || '',
            merchantTransactionId: o.merchantTransactionId || '',
            createdAt: o.createdAt.toISOString(),
            updatedAt: o.updatedAt.toISOString()
          };
        });
      } catch (err) {
        console.error('Prisma getOrders error:', err);
      }
    }

    const gBuffer = ((globalThis as any).globalMemoryOrdersBuffer || []) as Order[];
    // Fetch from Firestore for true cross-device persistence
    const fsOrders = await firestoreGetAllOrders().catch(() => []) as Order[];
    const defOrders = (typeof DEFAULT_ORDERS !== 'undefined' ? DEFAULT_ORDERS : []) as Order[];
    const allCombined = [...dbOrders, ...this.memoryOrders, ...gBuffer, ...fsOrders, ...defOrders];
    const uniqueMap = new Map<string, Order>();
    allCombined.forEach(o => {
      if (o && o.id && !deletedOrderIds.has(o.id) && !deletedOrderIds.has(o.merchantTransactionId)) {
        const existing = uniqueMap.get(o.id);
        if (!existing) {
          uniqueMap.set(o.id, o);
        } else if (!existing.paymentProofUrl && o.paymentProofUrl) {
          uniqueMap.set(o.id, { ...existing, paymentProofUrl: o.paymentProofUrl, paymentMethod: 'QR_PAYMENT' });
        }
      }
    });
    return Array.from(uniqueMap.values());
  }

  async deleteOrder(id: string): Promise<boolean> {
    const clean = (id || '').trim();
    if (clean) {
      deletedOrderIds.add(clean);
    }
    this.memoryOrders = this.memoryOrders.filter(o => o.id !== clean && o.merchantTransactionId !== clean);
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await prisma.orderItem.deleteMany({ where: { order: { OR: [{ id: clean }, { merchantTransactionId: clean }] } } }).catch(() => {});
        await prisma.order.deleteMany({ where: { OR: [{ id: clean }, { merchantTransactionId: clean }] } }).catch(() => {});
      } catch (err) {
        console.error('Prisma deleteOrder error:', err);
      }
    }
    return true;
  }


  async getOrderById(id: string): Promise<Order | undefined> {
    const memMatch = this.memoryOrders.find(o => o.id === id || o.merchantTransactionId === id);

    const prisma = getPrismaClient();
    if (!prisma) return memMatch;

    try {
      const o = await prisma.order.findFirst({
        where: {
          OR: [
            { id },
            { orderNumber: id },
            { merchantTransactionId: id }
          ]
        },
        include: { items: { include: { product: true } } }
      });

      if (!o) return memMatch;

      const parsedAddress = {
        fullName: o.customerName,
        phone: o.customerPhone,
        houseNo: '',
        street: '',
        villageTown: '',
        district: '',
        state: 'Tamil Nadu',
        pincode: '',
        ...parseShippingAddress(o.shippingAddress)
      };

      const itemsSnapshot: OrderItemSnapshot[] = o.items.map(i => ({
        productId: i.productId,
        sku: i.product?.sku || `VRG-${i.productId.slice(0, 6).toUpperCase()}`,
        name: i.productName,
        tamilName: i.product?.nameTamil || i.productName,
        price: i.price,
        mrp: i.product?.originalPrice || i.price,
        quantity: i.quantity,
        image: i.product?.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'
      }));

      return {
        id: o.id,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerEmail: o.customerEmail || '',
        shippingAddress: parsedAddress,
        items: itemsSnapshot,
        subtotal: o.subtotal,
        discount: o.discount,
        shippingCharge: o.deliveryFee,
        grandTotal: o.totalAmount,
        orderStatus: o.status === 'DELIVERED' ? 'DELIVERED' : o.status === 'DISPATCHED' ? 'DISPATCHED' : o.status === 'PAID' || o.status === 'PACKING' ? 'PROCESSING' : o.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING',

        paymentStatus: o.paymentStatus === 'SUCCESS' ? 'SUCCESS' : o.paymentStatus === 'FAILED' ? 'FAILED' : 'PENDING',
        paymentMethod: ((o as any).paymentMethod === 'COD' ? 'COD' : 'PHONEPE') as PaymentMethod,
        merchantTransactionId: o.merchantTransactionId || '',
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString()
      };
    } catch (err) {
      console.error('Prisma getOrderById error:', err);
      return memMatch;
    }
  }

  async updateOrderPayment(merchantTransactionId: string, status: Order['paymentStatus'], phonepeRef?: string): Promise<Order | null> {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    try {
      await prisma.order.updateMany({
        where: { merchantTransactionId },
        data: {
          paymentStatus: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
          status: status === 'SUCCESS' ? 'PAID' : 'CANCELLED'
        }
      });

      return (await this.getOrderById(merchantTransactionId)) || null;
    } catch (err) {
      console.error('Prisma updateOrderPayment error:', err);
      return null;
    }
  }

  async updateOrderStatus(orderId: string, status?: Order['orderStatus'], trackingNumber?: string, courierName?: string, paymentStatus?: string, paymentProofUrl?: string): Promise<Order | null> {
    let memOrder = this.memoryOrders.find(o => o.id === orderId);
    if (!memOrder) {
      memOrder = {
        id: orderId,
        merchantTransactionId: 'MT' + Date.now(),
        customerName: 'Naveen Kumar',
        customerPhone: '09360931606',
        customerEmail: 'nv01110612@gmail.com',
        shippingAddress: { fullName: 'Naveen Kumar', phone: '09360931606', houseNo: '12', street: 'Main Road', villageTown: 'Pennagaram', district: 'Dharmapuri', state: 'Tamil Nadu', pincode: '636810', addressType: 'Home' },
        items: [],
        subtotal: 199,
        shippingCharge: 50,
        discount: 0,
        grandTotal: 249,
        paymentStatus: (paymentStatus as any) || 'PENDING',
        orderStatus: status || 'PENDING',
        paymentMethod: paymentProofUrl ? 'QR_PAYMENT' : 'COD',
        paymentProofUrl: paymentProofUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.memoryOrders.push(memOrder);
    } else {
      if (status) memOrder.orderStatus = status;
      if (paymentStatus) memOrder.paymentStatus = paymentStatus as any;
      if (trackingNumber) (memOrder as any).trackingNumber = trackingNumber;
      if (courierName) (memOrder as any).courierName = courierName;
      if (paymentProofUrl) {
        memOrder.paymentProofUrl = paymentProofUrl;
        memOrder.paymentMethod = 'QR_PAYMENT';
      }
    }

    const prisma = getPrismaClient();
    if (!prisma) return memOrder;

    try {
      const dbStatus = status === 'DELIVERED' ? 'DELIVERED' : status === 'PROCESSING' ? 'PACKING' : status === 'CANCELLED' ? 'CANCELLED' : status === 'DISPATCHED' ? 'DISPATCHED' : 'PENDING';
      const dbPayment = paymentStatus === 'SUCCESS' ? 'SUCCESS' : paymentStatus === 'FAILED' ? 'FAILED' : undefined;
      const finalTracking = trackingNumber ? `${courierName ? courierName + ' | ' : ''}${trackingNumber}` : undefined;

      await prisma.order.updateMany({
        where: {
          OR: [
            { id: orderId },
            { orderNumber: orderId },
            { merchantTransactionId: orderId }
          ]
        },
        data: {
          status: dbStatus as any,
          ...(dbPayment ? { paymentStatus: dbPayment as any } : {}),
          ...(finalTracking ? { trackingNumber: finalTracking } : {})
        }
      });


      const updated = await this.getOrderById(orderId);
      if (updated) {
        updated.orderStatus = status;
        if (trackingNumber) (updated as any).trackingNumber = trackingNumber;
        if (courierName) (updated as any).courierName = courierName;
        if (paymentStatus) (updated as any).paymentStatus = paymentStatus as any;
        return updated;
      }
      return memOrder || null;

    } finally {
      // Always sync to Firestore regardless of DB result
      if (memOrder) {
        firestoreUpdateOrder(orderId, {
          orderStatus: status,
          ...(paymentStatus ? { paymentStatus } : {}),
          ...(trackingNumber ? { trackingNumber } : {}),
          ...(courierName ? { courierName } : {})
        }).catch(() => {});
      }
    }
  }

  // PAYMENT LOGS
  async addPaymentLog(log: Omit<PaymentLog, 'id' | 'createdAt'>): Promise<PaymentLog> {
    const prisma = getPrismaClient();
    const id = 'paylog-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    if (prisma) {
      try {
        await prisma.paymentAttempt.create({
          data: {
            id,
            orderId: log.orderId || log.merchantTransactionId,
            merchantTransactionId: log.merchantTransactionId,
            amount: log.amount,
            status: log.status,
            requestPayload: log.payload || null,
            responsePayload: null
          }
        });
      } catch (err) {
        console.error('Prisma addPaymentLog error:', err);
      }
    }

    return {
      ...log,
      id,
      createdAt: new Date().toISOString()
    };
  }

  async getPaymentLogs(): Promise<PaymentLog[]> {
    const prisma = getPrismaClient();
    if (!prisma) return [];

    try {
      const items = await prisma.paymentAttempt.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return items.map(p => ({
        id: p.id,
        merchantTransactionId: p.merchantTransactionId,
        orderId: p.orderId,
        amount: p.amount,
        status: p.status as PaymentLog['status'],
        checksum: 'VERIFIED_DB_LOG',
        payload: p.requestPayload || '',
        createdAt: p.createdAt.toISOString()
      }));
    } catch (err) {
      console.error('Prisma getPaymentLogs error:', err);
      return [];
    }
  }

  // DASHBOARD STATS
  async getDashboardStats() {
    const prisma = getPrismaClient();
    if (!prisma) {
      const allOrders = this.memoryOrders;
      return {
        totalOrders: allOrders.length,
        totalRevenue: allOrders.filter(o => o.paymentStatus === 'SUCCESS').reduce((sum, o) => sum + o.grandTotal, 0),
        todaySales: allOrders.filter(o => o.paymentStatus === 'SUCCESS').reduce((sum, o) => sum + o.grandTotal, 0),
        pendingOrders: allOrders.filter(o => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED').length,
        completedOrders: allOrders.filter(o => o.orderStatus === 'DELIVERED').length,
        lowStockCount: 0,
        lowStockProducts: [],
        recentOrders: allOrders.slice(0, 10)
      };
    }

    try {
      const totalOrders = await prisma.order.count();

      const revenueAgg = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'SUCCESS' }
      });
      const totalRevenue = revenueAgg._sum.totalAmount || 0;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayAgg = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'SUCCESS', createdAt: { gte: todayStart } }
      });
      const todaySales = todayAgg._sum.totalAmount || 0;

      const pendingOrders = await prisma.order.count({
        where: { status: { in: ['PENDING', 'PACKING', 'DISPATCHED'] } }
      });

      const completedOrders = await prisma.order.count({
        where: { status: 'DELIVERED' }
      });

      const lowStockInventories = await prisma.inventory.findMany({
        where: { quantity: { lte: 10 } },
        include: { product: true }
      });

      const lowStockProducts = lowStockInventories.map(i => ({
        id: i.product.id,
        name: i.product.name,
        stock: i.quantity
      }));

      const recentOrdersList = await this.getOrders();

      return {
        totalOrders,
        totalRevenue,
        todaySales,
        pendingOrders,
        completedOrders,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        recentOrders: recentOrdersList.slice(0, 5)
      };
    } catch (err) {
      console.error('Prisma getDashboardStats error:', err);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        todaySales: 0,
        pendingOrders: 0,
        completedOrders: 0,
        lowStockCount: 0,
        lowStockProducts: [],
        recentOrders: []
      };
    }
  }
}

export const db = new Store();
