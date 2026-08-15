import fs from 'fs';
import path from 'path';
import { Product, Category, Order, Coupon, Banner, Review, SiteSettings, PaymentLog, OrderItemSnapshot, PaymentMethod, FinancialEntry, Combo } from '../types.js';

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

const REVIEWS_STORE_FILE = path.resolve(process.cwd(), 'src/data/reviews_store.json');

const DEFAULT_REVIEWS_SEED: Review[] = [];

function loadDiskReviews(): Review[] {
  try {
    if (fs.existsSync(REVIEWS_STORE_FILE)) {
      const data = fs.readFileSync(REVIEWS_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading reviews_store.json:', err);
  }
  return DEFAULT_REVIEWS_SEED;
}

function saveDiskReviews(reviews: Review[]) {
  try {
    const dir = path.dirname(REVIEWS_STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(REVIEWS_STORE_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing reviews_store.json:', err);
  }
}

const ORDERS_STORE_FILE = path.resolve(process.cwd(), 'src/data/orders_store.json');

function loadDiskOrders(): Order[] {
  try {
    if (fs.existsSync(ORDERS_STORE_FILE)) {
      const data = fs.readFileSync(ORDERS_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading orders_store.json:', err);
  }
  return [];
}

function saveDiskOrders(orders: Order[]) {
  try {
    const dir = path.dirname(ORDERS_STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ORDERS_STORE_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing orders_store.json:', err);
  }
}

const FINANCES_STORE_FILE = path.resolve(process.cwd(), 'src/data/finances_store.json');

function loadDiskFinances(): FinancialEntry[] {
  try {
    if (fs.existsSync(FINANCES_STORE_FILE)) {
      const data = fs.readFileSync(FINANCES_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading finances_store.json:', err);
  }
  return [...DEFAULT_FINANCES];
}

function saveDiskFinances(finances: FinancialEntry[]) {
  try {
    const dir = path.dirname(FINANCES_STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FINANCES_STORE_FILE, JSON.stringify(finances, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing finances_store.json:', err);
  }
}

const COMBOS_STORE_FILE = path.resolve(process.cwd(), 'src/data/combos_store.json');

const DEFAULT_COMBOS_SEED: Combo[] = [
  {
    id: 'combo-rose-trio',
    title: 'Top 3 Fragrant Rose Saplings Combo',
    subtitle: 'Damask Paneer Rose + Button Rose + Kashmiri Red Rose',
    badge: '3-IN-1 SPECIAL',
    productIds: ['prod-damask-rose', 'prod-button-rose', 'prod-kashmiri-rose'],
    originalPrice: 450,
    comboPrice: 299,
    discountPercent: 34,
    imageUrl: '/products/double-delight.jpeg',
    active: true,
    freeDelivery: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DELETED_COMBOS_STORE_FILE = path.resolve(process.cwd(), 'src/data/deleted_combos.json');

function loadDiskDeletedCombos(): Set<string> {
  try {
    if (fs.existsSync(DELETED_COMBOS_STORE_FILE)) {
      const data = fs.readFileSync(DELETED_COMBOS_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (err) {
    console.error('Error reading deleted_combos.json:', err);
  }
  return new Set();
}

function saveDiskDeletedCombos(ids: Set<string>) {
  try {
    const dir = path.dirname(DELETED_COMBOS_STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DELETED_COMBOS_STORE_FILE, JSON.stringify(Array.from(ids), null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing deleted_combos.json:', err);
  }
}

function loadDiskCombos(): Combo[] {
  try {
    if (fs.existsSync(COMBOS_STORE_FILE)) {
      const data = fs.readFileSync(COMBOS_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading combos_store.json:', err);
  }
  return DEFAULT_COMBOS_SEED;
}

function saveDiskCombos(combos: Combo[]) {
  try {
    const dir = path.dirname(COMBOS_STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(COMBOS_STORE_FILE, JSON.stringify(combos, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing combos_store.json:', err);
  }
}

// Default Fallback Data matching WhatsApp Catalogue
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-rose',
    name: 'Rose Varieties',
    tamilName: 'ரோஜா வகைகள்',
    slug: 'rose-varieties',
    image: '/categories/rose-varieties.jpg',
    description: 'Premium live hybrid rose plants, double delight & button rose varieties.',
    order: 1,
    isActive: true,
    isFeatured: true,
    productCount: 52
  },
  {
    id: 'cat-herbals',
    name: 'Herbal Plants',
    tamilName: 'மூலிகை (Herbals)',
    slug: 'herbals',
    image: '/categories/herbal-plants.jpg',
    description: 'Medicinal plants including Tulsi, Aloe Vera, Mint, Lemongrass, Brahmi & Rosemary.',
    order: 2,
    isActive: true,
    isFeatured: true,
    productCount: 24
  },
  {
    id: 'cat-jasmine',
    name: 'Jasmine Varieties',
    tamilName: 'மல்லி பூ வகைகள் (Jasmine Vts)',
    slug: 'jasmine-varieties',
    image: '/categories/jasmine-varieties.jpg',
    description: 'Fragrant Ramar Malli, Jadhi Malli, Spanish Jasmine and Color Kakattan plants.',
    order: 3,
    isActive: true,
    isFeatured: true,
    productCount: 12
  },
  {
    id: 'cat-creeper',
    name: 'Creeper Roses',
    tamilName: 'கொடி ரோஸ் வகைகள் (Creeper)',
    slug: 'creeper-roses',
    image: '/categories/creeper-roses.jpg',
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
    image: '/categories/miniature-roses.jpg',
    description: 'Compact miniature rose plants for balcony pots, table garden and containers.',
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
    image: '/categories/exotics-rare-roses.jpg',
    description: 'Exclusive rare varieties like Black Magic, Juliet, Senorita, Blue Moon, Green Rose, Abracadabra, Matador, Pullman Orient Express, Amnesia & Barista.',
    order: 6,
    isActive: true,
    isFeatured: true,
    productCount: 10
  },
  {
    id: 'cat-fruits',
    name: 'Fruit Plants',
    tamilName: 'பழ மரங்கள் (Fruit Plants)',
    slug: 'fruit-plants',
    image: '/categories/fruit-plants.jpg',
    description: 'High-yielding live fruit saplings including Black Guava, Pink Guava, Hybrid Mango, Red Water Apple, and Black Grape Vine.',
    order: 7,
    isActive: true,
    isFeatured: true,
    productCount: 22
  },
  {
    id: 'cat-flowering',
    name: 'Flowering Plants',
    tamilName: 'பூச்செடிகள் (Flowering Plants)',
    slug: 'flowering-plants',
    image: '/categories/flowering-plants.jpg',
    description: 'Beautiful fragrant flowering garden plants including Parijadham, Panneer Pushpam & Magilam.',
    order: 8,
    isActive: true,
    isFeatured: true,
    productCount: 15
  },
  {
    id: 'cat-hibiscus',
    name: 'Hibiscus Varieties',
    tamilName: 'செம்பருத்தி (Hibiscus Vts)',
    slug: 'hibiscus-varieties',
    image: '/categories/hibiscus-varieties.jpg',
    description: 'Vibrant hybrid & traditional hibiscus varieties including Violet, Cup of Gold & Multi-color Hibiscus.',
    order: 9,
    isActive: true,
    isFeatured: true,
    productCount: 10
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
  },
  // --- FRUIT PLANTS ---
  {
    id: 'prod-black-guava',
    sku: 'VRG-FRUIT-01',
    name: 'Black Guava Plant (Purple Guava)',
    englishName: 'Black Guava Plant (Purple Guava)',
    tamilName: 'கருப்பு கொய்யா மரம் (Black Guava)',
    scientificName: 'Psidium guajava - Purpurea',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'Exotic purple-black guava plant with dark maroon foliage and rich sweet purple fruit high in antioxidants.',
    mrp: 350,
    sellingPrice: 249,
    discount: 28,
    stock: 20,
    plantHeight: '1.5 - 2 Feet',
    potSize: '8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Twice a week',
    floweringSeason: 'All Year',
    careInstructions: {
      watering: 'Water twice a week; keep soil moist.',
      sunlight: 'Requires 6+ hours direct sunlight.',
      fertilizer: 'Apply vermicompost & organic manure monthly.',
      soil: 'Well-draining red sandy soil mixed with coco peat.'
    },
    images: ['/products/black-guava-plant.jpeg', '/products/black-guava-sapling.jpeg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['black guava', 'purple guava', 'fruit plant', 'exotic guava', 'கொய்யா'],
    rating: 4.9,
    reviewCount: 18,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-pink-guava',
    sku: 'VRG-FRUIT-02',
    name: 'Thai Pink Guava Plant',
    englishName: 'Thai Pink Guava Plant',
    tamilName: 'பிங்க் கொய்யா மரம் (Thai Pink Guava)',
    scientificName: 'Psidium guajava - Thai Pink',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'Delicious sweet guava variety with aromatic pink flesh. Fast growing grafted plant that fruits early.',
    mrp: 280,
    sellingPrice: 199,
    discount: 29,
    stock: 25,
    plantHeight: '1.5 - 2 Feet',
    potSize: '8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Twice a week',
    floweringSeason: 'All Year',
    careInstructions: {
      watering: 'Water alternate days.',
      sunlight: 'Full direct sunlight.',
      fertilizer: 'Organic compost every 20 days.',
      soil: 'Rich loamy red soil.'
    },
    images: ['/products/pink-guava-plant.jpeg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['pink guava', 'thai guava', 'sweet guava', 'fruit plant', 'கொய்யா'],
    rating: 4.8,
    reviewCount: 22,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-mango-sapling',
    sku: 'VRG-FRUIT-03',
    name: 'Hybrid All-Season Mango Sapling',
    englishName: 'Hybrid All-Season Mango Sapling',
    tamilName: 'மாம்பழ மரம் (All Season Mango)',
    scientificName: 'Mangifera indica - Grafted',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'Grafted multi-season high-yielding mango sapling suitable for home gardens and terrace pots.',
    mrp: 399,
    sellingPrice: 299,
    discount: 25,
    stock: 18,
    plantHeight: '2 - 2.5 Feet',
    potSize: '10 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Multi-Season',
    careInstructions: {
      watering: 'Water daily in morning.',
      sunlight: 'Full direct sun.',
      fertilizer: 'Apply bone meal & cow manure monthly.',
      soil: 'Deep red soil mixed with compost.'
    },
    images: ['/products/mango-sapling-plant.jpeg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['mango', 'all season mango', 'fruit plant', 'mango tree', 'மாம்பழம்'],
    rating: 4.9,
    reviewCount: 31,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-water-apple',
    sku: 'VRG-FRUIT-04',
    name: 'Red Water Apple Plant (Rose Apple)',
    englishName: 'Red Water Apple Plant (Rose Apple)',
    tamilName: 'வாட்டர் ஆப்பிள் மரம் (Red Water Apple)',
    scientificName: 'Syzygium samarangense',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'Juicy bell-shaped red water apple sapling. High yielding grafted plant perfect for container gardening.',
    mrp: 320,
    sellingPrice: 229,
    discount: 28,
    stock: 15,
    plantHeight: '1.5 - 2 Feet',
    potSize: '8 inch Pot',
    sunlight: 'Partial Shade',
    waterRequirement: 'Daily',
    floweringSeason: 'Spring & Summer',
    careInstructions: {
      watering: 'Water daily; prefers moist soil.',
      sunlight: 'Full sun to partial shade.',
      fertilizer: 'Apply vermicompost bi-weekly.',
      soil: 'Rich organic soil mix.'
    },
    images: ['/products/red-water-apple.jpeg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['water apple', 'rose apple', 'red water apple', 'fruit plant', 'வாட்டர் ஆப்பிள்'],
    rating: 4.7,
    reviewCount: 14,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-black-grape',
    sku: 'VRG-FRUIT-05',
    name: 'Hybrid Black Grape Vine Plant (Paneer Drakshai)',
    englishName: 'Hybrid Black Grape Vine Plant (Paneer Drakshai)',
    tamilName: 'பன்னீர் திராட்சை கொடி (Black Grape Vine)',
    scientificName: 'Vitis vinifera - Black Muscat',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'High yielding hybrid sweet black grape vine sapling with rich juicy clusters. Fast climber suitable for terrace arbors and garden pergolas.',
    mrp: 250,
    sellingPrice: 179,
    discount: 28,
    stock: 30,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Spring & Summer',
    careInstructions: {
      watering: 'Water daily; ensure full sunlight for sweet fruit development.',
      sunlight: 'Full sun required (6+ hours daily).',
      fertilizer: 'Apply potash & organic compost every 15 days.',
      soil: 'Rich well-draining loamy red soil.'
    },
    images: ['/products/black-grape-plant.jpeg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['black grape', 'grapes', 'drakshai', 'paneer drakshai', 'fruit plant', 'திராட்சை'],
    rating: 4.9,
    reviewCount: 26,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-01',
    sku: 'VRG-NEW-01',
    name: 'Aavaram Poo Plant',
    englishName: 'Aavaram Poo Plant',
    tamilName: 'ஆவாரம்பூ மரம்',
    scientificName: 'Rosa / Plant spp. VRG-01',
    categoryId: 'cat-herbals',
    categoryName: 'Herbals',
    description: 'Medicinal Tanner\'s Cassia (Senna auriculata) plant with bright yellow flowers, highly valued in traditional Tamil herbal medicine.',
    mrp: 70,
    sellingPrice: 50,
    discount: 29,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_01.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['herbals', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-02',
    sku: 'VRG-NEW-02',
    name: 'Color Kakattan Jasmine',
    englishName: 'Color Kakattan Jasmine',
    tamilName: 'கலர் காகட்டன்',
    scientificName: 'Rosa / Plant spp. VRG-02',
    categoryId: 'cat-jasmine',
    categoryName: 'Jasmine Varieties',
    description: 'Beautiful multi-color fragrant Star Jasmine plant producing abundant colorful blossoms.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_02.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['jasmine varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-03',
    sku: 'VRG-NEW-03',
    name: 'Orchid Rose (6 Inch Pot)',
    englishName: 'Orchid Rose (6 Inch Pot)',
    tamilName: 'ஆர்ச்சிட் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-03',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Exotic orchid-shaped pink rose variety grown in a sturdy 6-inch pot.',
    mrp: 160,
    sellingPrice: 150,
    discount: 6,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_03.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-04',
    sku: 'VRG-NEW-04',
    name: 'Naatu Rose Pink',
    englishName: 'Naatu Rose Pink',
    tamilName: 'நாத்து பன்னீர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-04',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Traditional aromatic native Tamil Nadu pink rose with rich natural fragrance.',
    mrp: 100,
    sellingPrice: 80,
    discount: 20,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_04.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-05',
    sku: 'VRG-NEW-05',
    name: 'Orchid Rose Premium (6 Inch Pot)',
    englishName: 'Orchid Rose Premium (6 Inch Pot)',
    tamilName: 'ஆர்ச்சிட் ரோஸ் பிரீமியம்',
    scientificName: 'Rosa / Plant spp. VRG-05',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'High-yielding Orchid Rose potted plant with lush dark green foliage.',
    mrp: 160,
    sellingPrice: 150,
    discount: 6,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_05.jpg'],
    featured: false,
    bestSeller: true,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-06',
    sku: 'VRG-NEW-06',
    name: 'Rosemary Herbal Plant',
    englishName: 'Rosemary Herbal Plant',
    tamilName: 'ரோஸ்மேரி மூலிகை',
    scientificName: 'Rosa / Plant spp. VRG-06',
    categoryId: 'cat-herbals',
    categoryName: 'Herbals',
    description: 'Aromatic culinary and medicinal Rosemary herb plant with evergreen needle-like leaves.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_06.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['herbals', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-07',
    sku: 'VRG-NEW-07',
    name: 'Green Rose Plant',
    englishName: 'Green Rose Plant',
    tamilName: 'பச்சை ரோஜா',
    scientificName: 'Rosa / Plant spp. VRG-07',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Rare exotic green-petaled rose variety (Rosa chinensis viridiflora) for collectors.',
    mrp: 120,
    sellingPrice: 100,
    discount: 17,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_07.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-08',
    sku: 'VRG-NEW-08',
    name: 'Ranakalli Medicinal Plant',
    englishName: 'Ranakalli Medicinal Plant',
    tamilName: 'ரணகள்ளி',
    scientificName: 'Rosa / Plant spp. VRG-08',
    categoryId: 'cat-herbals',
    categoryName: 'Herbals',
    description: 'Bryophyllum Pinnatum (Miracle Leaf) miracle medicinal plant used in traditional healing.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_08.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['herbals', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-09',
    sku: 'VRG-NEW-09',
    name: 'Jadhi Malli Plant',
    englishName: 'Jadhi Malli Plant',
    tamilName: 'ஜாதிமல்லி',
    scientificName: 'Rosa / Plant spp. VRG-09',
    categoryId: 'cat-jasmine',
    categoryName: 'Jasmine Varieties',
    description: 'Highly fragrant Spanish Jasmine (Jasminum grandiflorum) with star-shaped white blossoms.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_09.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['jasmine varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-10',
    sku: 'VRG-NEW-10',
    name: 'Any Pink Hybrid Rose',
    englishName: 'Any Pink Hybrid Rose',
    tamilName: 'பிங்க் ஹைப்ரிட் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-10',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Vibrant pink hybrid rose sapling blooming continuously throughout the year.',
    mrp: 109,
    sellingPrice: 89,
    discount: 18,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_10.jpg'],
    featured: false,
    bestSeller: true,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-11',
    sku: 'VRG-NEW-11',
    name: 'Betel Vine Sapling',
    englishName: 'Betel Vine Sapling',
    tamilName: 'வெற்றிலைக்கொடி',
    scientificName: 'Rosa / Plant spp. VRG-11',
    categoryId: 'cat-herbals',
    categoryName: 'Herbals',
    description: 'Fresh Piper Betle climbing vine sapling producing glossy green betel leaves.',
    mrp: 70,
    sellingPrice: 50,
    discount: 29,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_11.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['herbals', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-12',
    sku: 'VRG-NEW-12',
    name: 'Bramma Kamalam Sacred Plant',
    englishName: 'Bramma Kamalam Sacred Plant',
    tamilName: 'பிரம்ம கமல மலர்',
    scientificName: 'Rosa / Plant spp. VRG-12',
    categoryId: 'cat-herbals',
    categoryName: 'Herbal Plants',
    description: 'Epiphyllum oxypetalum (Night Blooming Ceres) sacred bloom plant associated with good fortune.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_12.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['herbal plants', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-13',
    sku: 'VRG-NEW-13',
    name: 'Button Pink Rose',
    englishName: 'Button Pink Rose',
    tamilName: 'பட்டன் பிங்க் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-13',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Compact miniature pink button rose producing dense clusters of small sweet flowers.',
    mrp: 109,
    sellingPrice: 89,
    discount: 18,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_13.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-14',
    sku: 'VRG-NEW-14',
    name: 'Melastoma Flowering Plant',
    englishName: 'Melastoma Flowering Plant',
    tamilName: 'மெலாஸ்டோமா',
    scientificName: 'Rosa / Plant spp. VRG-14',
    categoryId: 'cat-herbals',
    categoryName: 'Herbal Plants',
    description: 'Stunning purple Indian Rhododendron (Melastoma malabathricum) flowering shrub.',
    mrp: 100,
    sellingPrice: 90,
    discount: 10,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_14.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['herbal plants', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-15',
    sku: 'VRG-NEW-15',
    name: 'Black Magic Rose',
    englishName: 'Black Magic Rose',
    tamilName: 'கருப்பு ரோஜா (Black Magic)',
    scientificName: 'Rosa / Plant spp. VRG-15',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Deep velvety dark maroon-black hybrid rose with high petal count and long vase life.',
    mrp: 139,
    sellingPrice: 119,
    discount: 14,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_15.jpg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-16',
    sku: 'VRG-NEW-16',
    name: 'Color Changing Rose',
    englishName: 'Color Changing Rose',
    tamilName: 'நிறம் மாறும் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-16',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Fascinating rose variety whose petals transition from yellow to deep coral pink with sunlight exposure.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_16.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-17',
    sku: 'VRG-NEW-17',
    name: 'Classic Red Rose',
    englishName: 'Classic Red Rose',
    tamilName: 'சிவப்பு ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-17',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Timeless vivid red rose plant with rich green foliage and sturdy stems.',
    mrp: 100,
    sellingPrice: 90,
    discount: 10,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_17.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-18',
    sku: 'VRG-NEW-18',
    name: 'Arabic Panneer Rose',
    englishName: 'Arabic Panneer Rose',
    tamilName: 'அராபிக் பன்னீர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-18',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Fragrant Arabic Rose (Damask variation) producing sweet scented light pink blossoms.',
    mrp: 70,
    sellingPrice: 50,
    discount: 29,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_18.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-19',
    sku: 'VRG-NEW-19',
    name: 'Button Panneer Rose',
    englishName: 'Button Panneer Rose',
    tamilName: 'பட்டன் பன்னீர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-19',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Miniature scented panner rose with dense pink button-like clusters.',
    mrp: 100,
    sellingPrice: 90,
    discount: 10,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_19.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-20',
    sku: 'VRG-NEW-20',
    name: 'Yellow Miniature Rose',
    englishName: 'Yellow Miniature Rose',
    tamilName: 'மஞ்சள் மினியேச்சர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-20',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Bright golden yellow miniature rose shrub perfect for balcony pots and home borders.',
    mrp: 100,
    sellingPrice: 80,
    discount: 20,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_20.jpg'],
    featured: false,
    bestSeller: true,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-21',
    sku: 'VRG-NEW-21',
    name: 'Panneer Button Rose Special',
    englishName: 'Panneer Button Rose Special',
    tamilName: 'பன்னீர் பட்டன் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-21',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'High fragrance miniature pink panneer rose variety ideal for garland flowers.',
    mrp: 100,
    sellingPrice: 90,
    discount: 10,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_21.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-22',
    sku: 'VRG-NEW-22',
    name: 'Pacha Mullai Plant',
    englishName: 'Pacha Mullai Plant',
    tamilName: 'பச்சை முல்லை',
    scientificName: 'Rosa / Plant spp. VRG-22',
    categoryId: 'cat-jasmine',
    categoryName: 'Jasmine Varieties',
    description: 'Lush green Jasminum auriculatum climbing vine with intoxicating fragrance.',
    mrp: 60,
    sellingPrice: 50,
    discount: 17,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_22.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['jasmine varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-23',
    sku: 'VRG-NEW-23',
    name: 'Naatu Rose Pink Native',
    englishName: 'Naatu Rose Pink Native',
    tamilName: 'நாட்டு பன்னீர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-23',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Organically grown native Tamil Nadu fragrance rose sapling.',
    mrp: 100,
    sellingPrice: 80,
    discount: 20,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_23.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-24',
    sku: 'VRG-NEW-24',
    name: 'Panner Leaf Plant',
    englishName: 'Panner Leaf Plant',
    tamilName: 'பன்னீர் இலை மரம்',
    scientificName: 'Rosa / Plant spp. VRG-24',
    categoryId: 'cat-herbals',
    categoryName: 'Herbals',
    description: 'Fragrant Panner leaf medicinal plant used for floral water and traditional remedies.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_24.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['herbals', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-25',
    sku: 'VRG-NEW-25',
    name: 'Blue Sangu Poo Plant',
    englishName: 'Blue Sangu Poo Plant',
    tamilName: 'நீல சங்குப்பூ (Butterfly Pea)',
    scientificName: 'Rosa / Plant spp. VRG-25',
    categoryId: 'cat-herbals',
    categoryName: 'Herbal Plants',
    description: 'Clitoria ternatea (Blue Butterfly Pea) vine producing deep cobalt blue edible tea flowers.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_25.jpg'],
    featured: false,
    bestSeller: true,
    trending: true,
    tags: ['herbal plants', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-26',
    sku: 'VRG-NEW-26',
    name: 'Button Panner Rose Garden',
    englishName: 'Button Panner Rose Garden',
    tamilName: 'பட்டன் பன்னீர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-26',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Prolific blooming button rose with sweet rose-water perfume.',
    mrp: 100,
    sellingPrice: 90,
    discount: 10,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_26.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-27',
    sku: 'VRG-NEW-27',
    name: 'White Sangu Poo Plant',
    englishName: 'White Sangu Poo Plant',
    tamilName: 'வெள்ளை சங்குப்பூ',
    scientificName: 'Rosa / Plant spp. VRG-27',
    categoryId: 'cat-herbals',
    categoryName: 'Herbal Plants',
    description: 'Rare white-flowered Butterfly Pea (Clitoria ternatea alba) sacred climber vine.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_27.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['herbal plants', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-28',
    sku: 'VRG-NEW-28',
    name: 'Ramar Malli Jasmine',
    englishName: 'Ramar Malli Jasmine',
    tamilName: 'ராமர் மல்லி',
    scientificName: 'Rosa / Plant spp. VRG-28',
    categoryId: 'cat-jasmine',
    categoryName: 'Jasmine Varieties',
    description: 'Traditional Ramar Malli jasmine with thick fragrant double petals.',
    mrp: 60,
    sellingPrice: 50,
    discount: 17,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_28.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['jasmine varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-29',
    sku: 'VRG-NEW-29',
    name: 'Mint Thulasi Medicinal Plant',
    englishName: 'Mint Thulasi Medicinal Plant',
    tamilName: 'புதினா துளசி',
    scientificName: 'Rosa / Plant spp. VRG-29',
    categoryId: 'cat-herbals',
    categoryName: 'Herbals',
    description: 'Hybrid Mint-scented Tulsi (Holy Basil) plant rich in immunity-boosting essential oils.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_29.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['herbals', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-30',
    sku: 'VRG-NEW-30',
    name: 'Suloli Hanging Rose',
    englishName: 'Suloli Hanging Rose',
    tamilName: 'சுலோலி தொங்கும் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-30',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Cascading trailing pink rose variety ideal for hanging baskets and porch planters.',
    mrp: 100,
    sellingPrice: 90,
    discount: 10,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_30.jpg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-31',
    sku: 'VRG-NEW-31',
    name: 'Panneer Button Rose Extra',
    englishName: 'Panneer Button Rose Extra',
    tamilName: 'பன்னீர் பட்டன் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-31',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Ever-blooming fragrant pink button rose with dense bushy habit.',
    mrp: 100,
    sellingPrice: 90,
    discount: 10,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_31.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-32',
    sku: 'VRG-NEW-32',
    name: 'Exotic Melastoma Shrub',
    englishName: 'Exotic Melastoma Shrub',
    tamilName: 'மெலாஸ்டோமா சிறப்பு',
    scientificName: 'Rosa / Plant spp. VRG-32',
    categoryId: 'cat-herbals',
    categoryName: 'Herbal Plants',
    description: 'Vibrant purple flowering ornamental bush easy to grow in full sun.',
    mrp: 100,
    sellingPrice: 90,
    discount: 10,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_32.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['herbal plants', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-33',
    sku: 'VRG-NEW-33',
    name: 'Color Shift Changing Rose',
    englishName: 'Color Shift Changing Rose',
    tamilName: 'நிறம் மாறும் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-33',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Multi-hued rose bush that changes color as the bloom matures.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_33.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-34',
    sku: 'VRG-NEW-34',
    name: 'Marikolunthu Herb',
    englishName: 'Marikolunthu Herb',
    tamilName: 'மரிகொழுந்து',
    scientificName: 'Rosa / Plant spp. VRG-34',
    categoryId: 'cat-herbals',
    categoryName: 'Herbals',
    description: 'Artemisia pallens (Davana / Marikolunthu) highly aromatic herb essential for temple garlands.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_34.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['herbals', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-35',
    sku: 'VRG-NEW-35',
    name: 'Mint Thulasi Organic',
    englishName: 'Mint Thulasi Organic',
    tamilName: 'புதினா துளசி',
    scientificName: 'Rosa / Plant spp. VRG-35',
    categoryId: 'cat-herbals',
    categoryName: 'Herbals',
    description: 'Aromatic spearmint-flavored Holy Basil herbal sapling.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_35.jpg'],
    featured: false,
    bestSeller: true,
    trending: true,
    tags: ['herbals', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-36',
    sku: 'VRG-NEW-36',
    name: 'Aavaram Poo Herbal Bush',
    englishName: 'Aavaram Poo Herbal Bush',
    tamilName: 'ஆவாரம்பூ செடி',
    scientificName: 'Rosa / Plant spp. VRG-36',
    categoryId: 'cat-herbals',
    categoryName: 'Herbals',
    description: 'Golden Cassia flower shrub valued for skin care and herbal teas.',
    mrp: 70,
    sellingPrice: 50,
    discount: 29,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_36.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['herbals', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-37',
    sku: 'VRG-NEW-37',
    name: 'White Sangu Poo Sacred Vine',
    englishName: 'White Sangu Poo Sacred Vine',
    tamilName: 'வெள்ளை சங்குப்பூ',
    scientificName: 'Rosa / Plant spp. VRG-37',
    categoryId: 'cat-herbals',
    categoryName: 'Herbal Plants',
    description: 'Purity white conch-flower vine plant for home worship.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_37.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['herbal plants', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-38',
    sku: 'VRG-NEW-38',
    name: 'Blue Sangu Poo Herbal Vine',
    englishName: 'Blue Sangu Poo Herbal Vine',
    tamilName: 'நீல சங்குப்பூ',
    scientificName: 'Rosa / Plant spp. VRG-38',
    categoryId: 'cat-herbals',
    categoryName: 'Herbal Plants',
    description: 'Herbal blue tea flower climber plant with medicinal benefits.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_38.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['herbal plants', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-39',
    sku: 'VRG-NEW-39',
    name: 'Pacha Mullai Jasmine',
    englishName: 'Pacha Mullai Jasmine',
    tamilName: 'பச்சை முல்லை செடி',
    scientificName: 'Rosa / Plant spp. VRG-39',
    categoryId: 'cat-jasmine',
    categoryName: 'Jasmine Varieties',
    description: 'High fragrance Mullai jasmine climber with rich green foliage.',
    mrp: 60,
    sellingPrice: 50,
    discount: 17,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_39.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['jasmine varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-40',
    sku: 'VRG-NEW-40',
    name: 'Bramma Kamalam Lucky Plant',
    englishName: 'Bramma Kamalam Lucky Plant',
    tamilName: 'பிரம்ம கமலம்',
    scientificName: 'Rosa / Plant spp. VRG-40',
    categoryId: 'cat-herbals',
    categoryName: 'Herbal Plants',
    description: 'Auspicious nocturnal blooming lotus cactus plant.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_40.jpg'],
    featured: false,
    bestSeller: true,
    trending: true,
    tags: ['herbal plants', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-41',
    sku: 'VRG-NEW-41',
    name: 'Green Rose Exotic collector',
    englishName: 'Green Rose Exotic collector',
    tamilName: 'பச்சை ரோஜா செடி',
    scientificName: 'Rosa / Plant spp. VRG-41',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Unique green petaled rose variety for rare plant enthusiasts.',
    mrp: 120,
    sellingPrice: 100,
    discount: 17,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_41.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-42',
    sku: 'VRG-NEW-42',
    name: 'Red Rose Garden Classic',
    englishName: 'Red Rose Garden Classic',
    tamilName: 'சிவப்பு ரோஸ் செடி',
    scientificName: 'Rosa / Plant spp. VRG-42',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'High-yield red rose plant with large glossy blooms.',
    mrp: 100,
    sellingPrice: 90,
    discount: 10,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_42.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-43',
    sku: 'VRG-NEW-43',
    name: 'Betel Vine Vetrilai Plant',
    englishName: 'Betel Vine Vetrilai Plant',
    tamilName: 'வெற்றிலை கொடி',
    scientificName: 'Rosa / Plant spp. VRG-43',
    categoryId: 'cat-herbals',
    categoryName: 'Herbals',
    description: 'Traditional Tamil Vetrilai betel leaf creeper plant.',
    mrp: 70,
    sellingPrice: 50,
    discount: 29,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_43.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['herbals', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-44',
    sku: 'VRG-NEW-44',
    name: 'Thanjavur Panneer Rose',
    englishName: 'Thanjavur Panneer Rose',
    tamilName: 'தஞ்சாவூர் பன்னீர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-44',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Famous Thanjavur heritage pink rose with intense sweet perfume.',
    mrp: 100,
    sellingPrice: 90,
    discount: 10,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_44.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-45',
    sku: 'VRG-NEW-45',
    name: 'Taj Mahal Red Rose',
    englishName: 'Taj Mahal Red Rose',
    tamilName: 'தாஜ்மஹால் ரெட் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-45',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Long-stemmed velvet crimson red cut-flower rose variety.',
    mrp: 100,
    sellingPrice: 90,
    discount: 10,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_45.jpg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-46',
    sku: 'VRG-NEW-46',
    name: 'Strawberry Fruit Plant Sapling',
    englishName: 'Strawberry Fruit Plant Sapling',
    tamilName: 'ஸ்ட்ராபெரி செடி',
    scientificName: 'Rosa / Plant spp. VRG-46',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'Grafted sweet strawberry plant suitable for container pots and home gardens.',
    mrp: 150,
    sellingPrice: 100,
    discount: 33,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_46.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['fruit plants', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-47',
    sku: 'VRG-NEW-47',
    name: 'Nanthiyavattam Jasmine Shrub',
    englishName: 'Nanthiyavattam Jasmine Shrub',
    tamilName: 'நந்தியாவட்டம்',
    scientificName: 'Rosa / Plant spp. VRG-47',
    categoryId: 'cat-jasmine',
    categoryName: 'Jasmine Varieties',
    description: 'Tabernaemontana divaricarita (Pinwheel Flower / Nanthiyavattam) pristine white flower shrub.',
    mrp: 70,
    sellingPrice: 50,
    discount: 29,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_47.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['jasmine varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-48',
    sku: 'VRG-NEW-48',
    name: 'Money Plant Indoor Vine',
    englishName: 'Money Plant Indoor Vine',
    tamilName: 'மணி பிளான்ட்',
    scientificName: 'Rosa / Plant spp. VRG-48',
    categoryId: 'cat-herbals',
    categoryName: 'Herbal Plants',
    description: 'Golden Pothos (Epipremnum aureum) air-purifying indoor climber plant.',
    mrp: 60,
    sellingPrice: 50,
    discount: 17,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_48.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['herbal plants', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-49',
    sku: 'VRG-NEW-49',
    name: 'Mon Coeur French Rose',
    englishName: 'Mon Coeur French Rose',
    tamilName: 'மன்கூர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-49',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Exquisite French cupped pink rose variety with gentle perfume.',
    mrp: 180,
    sellingPrice: 150,
    discount: 17,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_49.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-50',
    sku: 'VRG-NEW-50',
    name: 'White Panneer Rose Premium',
    englishName: 'White Panneer Rose Premium',
    tamilName: 'வெள்ளை பன்னீர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-50',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Rare snow-white fragrant Panneer Rose plant producing large double blooms.',
    mrp: 200,
    sellingPrice: 180,
    discount: 10,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_50.jpg'],
    featured: false,
    bestSeller: true,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-51',
    sku: 'VRG-NEW-51',
    name: 'Anny Duperey Yellow Rose',
    englishName: 'Anny Duperey Yellow Rose',
    tamilName: 'ஆனி டுபெரி மஞ்சள் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-51',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Bright golden-yellow romantic shrub rose with citrus fragrance.',
    mrp: 150,
    sellingPrice: 120,
    discount: 20,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_51.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-52',
    sku: 'VRG-NEW-52',
    name: 'Summer Snow White Rose',
    englishName: 'Summer Snow White Rose',
    tamilName: 'சம்மர் ஸ்னோ வெள்ளை ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-52',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Prolific cluster-blooming white floribunda rose variety.',
    mrp: 100,
    sellingPrice: 80,
    discount: 20,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_52.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-53',
    sku: 'VRG-NEW-53',
    name: 'Calcutta Rose Hybrid',
    englishName: 'Calcutta Rose Hybrid',
    tamilName: 'கொல்கத்தா ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-53',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'High resistance Kolkata pink hybrid rose for home gardens.',
    mrp: 100,
    sellingPrice: 80,
    discount: 20,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_53.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-54',
    sku: 'VRG-NEW-54',
    name: 'Paradise Lavender Rose',
    englishName: 'Paradise Lavender Rose',
    tamilName: 'பாரடைஸ் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-54',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Stunning lavender-mauve shaded hybrid tea rose with ruby red edge.',
    mrp: 120,
    sellingPrice: 100,
    discount: 17,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_54.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-55',
    sku: 'VRG-NEW-55',
    name: 'Blue Moon Lagerfeld Rose',
    englishName: 'Blue Moon Lagerfeld Rose',
    tamilName: 'ப்ளூ மூன் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-55',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Famous silvery-lilac Blue Moon rose with strong sweet perfume.',
    mrp: 250,
    sellingPrice: 150,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_55.jpg'],
    featured: false,
    bestSeller: true,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-56',
    sku: 'VRG-NEW-56',
    name: 'Orchid Rose Potted',
    englishName: 'Orchid Rose Potted',
    tamilName: 'ஆர்ச்சிட் ரோஸ் செடி',
    scientificName: 'Rosa / Plant spp. VRG-56',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Lush potted orchid rose with heavy buds.',
    mrp: 160,
    sellingPrice: 150,
    discount: 6,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_56.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-57',
    sku: 'VRG-NEW-57',
    name: 'Suloli Hanging Pink Rose',
    englishName: 'Suloli Hanging Pink Rose',
    tamilName: 'சுலோலி தொங்கும் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-57',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Graceful trailing pink rose variety for porch planters.',
    mrp: 100,
    sellingPrice: 90,
    discount: 10,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_57.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-58',
    sku: 'VRG-NEW-58',
    name: 'Arabic Panneer Heritage Rose',
    englishName: 'Arabic Panneer Heritage Rose',
    tamilName: 'அராபிக் பன்னீர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-58',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Fragrant heritage Damask rose variation.',
    mrp: 70,
    sellingPrice: 50,
    discount: 29,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_58.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-59',
    sku: 'VRG-NEW-59',
    name: 'Arabic Panneer Native Rose',
    englishName: 'Arabic Panneer Native Rose',
    tamilName: 'நாட்டு பன்னீர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-59',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'High fragrance pink rose for daily floral offering.',
    mrp: 70,
    sellingPrice: 50,
    discount: 29,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_59.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-60',
    sku: 'VRG-NEW-60',
    name: 'Button Panneer Rose Bush',
    englishName: 'Button Panneer Rose Bush',
    tamilName: 'பட்டன் பன்னீர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-60',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Abundant small scented pink blooms.',
    mrp: 100,
    sellingPrice: 90,
    discount: 10,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_60.jpg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-61',
    sku: 'VRG-NEW-61',
    name: 'Panneer Leaf Herbal Plant',
    englishName: 'Panneer Leaf Herbal Plant',
    tamilName: 'பன்னீர் இலை செடி',
    scientificName: 'Rosa / Plant spp. VRG-61',
    categoryId: 'cat-herbals',
    categoryName: 'Herbals',
    description: 'Herbal Panner leaf plant for garden collection.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_61.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['herbals', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-62',
    sku: 'VRG-NEW-62',
    name: 'Ranakalli Miracle Leaf',
    englishName: 'Ranakalli Miracle Leaf',
    tamilName: 'ரணகள்ளி மூலிகை',
    scientificName: 'Rosa / Plant spp. VRG-62',
    categoryId: 'cat-herbals',
    categoryName: 'Herbals',
    description: 'Kidney stone healing herbal plant Ranakalli.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_62.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['herbals', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-63',
    sku: 'VRG-NEW-63',
    name: 'Rosemary Culinary Herb',
    englishName: 'Rosemary Culinary Herb',
    tamilName: 'ரோஸ்மேரி செடி',
    scientificName: 'Rosa / Plant spp. VRG-63',
    categoryId: 'cat-herbals',
    categoryName: 'Herbals',
    description: 'Fresh Rosemary aromatic plant for home cooking.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_63.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['herbals', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-64',
    sku: 'VRG-NEW-64',
    name: 'Jadhi Malli Spanish Jasmine',
    englishName: 'Jadhi Malli Spanish Jasmine',
    tamilName: 'ஜாதிமல்லி செடி',
    scientificName: 'Rosa / Plant spp. VRG-64',
    categoryId: 'cat-jasmine',
    categoryName: 'Jasmine Varieties',
    description: 'Fragrant white star jasmine vine.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_64.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['jasmine varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-65',
    sku: 'VRG-NEW-65',
    name: 'Color Kakattan Jasmine Bush',
    englishName: 'Color Kakattan Jasmine Bush',
    tamilName: 'கலர் காகட்டன் செடி',
    scientificName: 'Rosa / Plant spp. VRG-65',
    categoryId: 'cat-jasmine',
    categoryName: 'Jasmine Varieties',
    description: 'Multi-colored star flowering jasmine plant.',
    mrp: 50,
    sellingPrice: 30,
    discount: 40,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_65.jpg'],
    featured: false,
    bestSeller: true,
    trending: true,
    tags: ['jasmine varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-66',
    sku: 'VRG-NEW-66',
    name: 'Ramar Malli Double Jasmine',
    englishName: 'Ramar Malli Double Jasmine',
    tamilName: 'ராமர் மல்லி செடி',
    scientificName: 'Rosa / Plant spp. VRG-66',
    categoryId: 'cat-jasmine',
    categoryName: 'Jasmine Varieties',
    description: 'Heavy scented double petal Ramar Malli.',
    mrp: 60,
    sellingPrice: 50,
    discount: 17,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_66.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['jasmine varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-67',
    sku: 'VRG-NEW-67',
    name: 'Naatu Rose Pink Tamil',
    englishName: 'Naatu Rose Pink Tamil',
    tamilName: 'நாட்டு பன்னீர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-67',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Sweet scented native Tamil Nadu pink rose.',
    mrp: 100,
    sellingPrice: 80,
    discount: 20,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_67.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-68',
    sku: 'VRG-NEW-68',
    name: 'Pearl Orange Rose',
    englishName: 'Pearl Orange Rose',
    tamilName: 'பர்ல் ஆரஞ்ச் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-68',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Vibrant glowing pearl orange hybrid rose variety.',
    mrp: 100,
    sellingPrice: 80,
    discount: 20,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_68.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-69',
    sku: 'VRG-NEW-69',
    name: 'Yellow Miniature Rose Bush',
    englishName: 'Yellow Miniature Rose Bush',
    tamilName: 'மஞ்சள் மினியேச்சர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-69',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Lush bright yellow miniature rose in grow bag.',
    mrp: 100,
    sellingPrice: 80,
    discount: 20,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_69.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-70',
    sku: 'VRG-NEW-70',
    name: '7 Days Rose (Seven Day Rose)',
    englishName: '7 Days Rose (Seven Day Rose)',
    tamilName: 'ஏழு நாள் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-70',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Long-lasting rose variety whose blooms stay fresh for up to 7 days on plant.',
    mrp: 120,
    sellingPrice: 100,
    discount: 17,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_70.jpg'],
    featured: false,
    bestSeller: true,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-71',
    sku: 'VRG-NEW-71',
    name: 'Damascus Panneer Rose',
    englishName: 'Damascus Panneer Rose',
    tamilName: 'டமாஸ்க் பன்னீர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-71',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Authentic Damask rose used for pure rose water extraction.',
    mrp: 100,
    sellingPrice: 80,
    discount: 20,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_71.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-72',
    sku: 'VRG-NEW-72',
    name: 'British Queen Rose',
    englishName: 'British Queen Rose',
    tamilName: 'பிரிட்டிஷ் குயின் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-72',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Royal pink English rose with intense antique perfume.',
    mrp: 150,
    sellingPrice: 120,
    discount: 20,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_72.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-73',
    sku: 'VRG-NEW-73',
    name: 'Mango Yellow Rose',
    englishName: 'Mango Yellow Rose',
    tamilName: 'மேங்கோ எல்லோ ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-73',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Warm mango-yellow shaded hybrid rose variety.',
    mrp: 100,
    sellingPrice: 80,
    discount: 20,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_73.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-74',
    sku: 'VRG-NEW-74',
    name: 'Priyatama Pink Rose',
    englishName: 'Priyatama Pink Rose',
    tamilName: 'பிரியதமா ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-74',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Exquisite high petal count romantic pink rose plant.',
    mrp: 180,
    sellingPrice: 150,
    discount: 17,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_74.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-75',
    sku: 'VRG-NEW-75',
    name: 'Dr. Panneer Rose (8 Inch Pot)',
    englishName: 'Dr. Panneer Rose (8 Inch Pot)',
    tamilName: 'டாக்டர் பன்னீர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-75',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Large specimen Dr. Panneer Rose in large 8-inch container pot.',
    mrp: 200,
    sellingPrice: 180,
    discount: 10,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_75.jpg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-76',
    sku: 'VRG-NEW-76',
    name: 'Black Magic Rose Dark Velvet',
    englishName: 'Black Magic Rose Dark Velvet',
    tamilName: 'கருப்பு ரோஜா (Black Magic)',
    scientificName: 'Rosa / Plant spp. VRG-76',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Deep velvety black-red rose for garden luxury.',
    mrp: 139,
    sellingPrice: 119,
    discount: 14,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_76.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-77',
    sku: 'VRG-NEW-77',
    name: 'Midnight Blue Rose',
    englishName: 'Midnight Blue Rose',
    tamilName: 'மிட்நைட் ப்ளூ ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-77',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Rare purple-violet Midnight Blue rose variety with clove fragrance.',
    mrp: 119,
    sellingPrice: 99,
    discount: 17,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_77.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-78',
    sku: 'VRG-NEW-78',
    name: 'Andhra Panneer Rose',
    englishName: 'Andhra Panneer Rose',
    tamilName: 'ஆந்திரா பன்னீர் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-78',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Popular regional Andhra pink panneer rose variety.',
    mrp: 109,
    sellingPrice: 89,
    discount: 18,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_78.jpg'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-79',
    sku: 'VRG-NEW-79',
    name: 'Any Pink Rose Bush',
    englishName: 'Any Pink Rose Bush',
    tamilName: 'பிங்க் ரோஜா செடி',
    scientificName: 'Rosa / Plant spp. VRG-79',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Lush evergreen pink rose bush.',
    mrp: 109,
    sellingPrice: 89,
    discount: 18,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_79.jpg'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-new-plant-80',
    sku: 'VRG-NEW-80',
    name: 'Button Pink Rose Cluster',
    englishName: 'Button Pink Rose Cluster',
    tamilName: 'பட்டன் பிங்க் ரோஸ்',
    scientificName: 'Rosa / Plant spp. VRG-80',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Cluster-blooming miniature pink button rose.',
    mrp: 109,
    sellingPrice: 89,
    discount: 18,
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '6-8 inch Grow Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Continuous',
    careInstructions: {
      watering: 'Water Daily in Morning',
      sunlight: 'Full Sun',
      fertilizer: 'Vermicompost & bone meal monthly',
      soil: 'Well-draining red soil mixed with organic compost'
    },
    images: ['/products/new_plant_80.jpg'],
    featured: false,
    bestSeller: true,
    trending: true,
    tags: ['rose varieties', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // --- NEW NURSERY PRODUCTS (32 NEW VARIETIES) ---
  {
    id: 'prod-water-apple-red',
    sku: 'VRG-FRUIT-10',
    name: 'Water Apple Red (Budding)',
    englishName: 'Water Apple Red (Budding)',
    tamilName: 'சிவப்பு வாட்டர் ஆப்பிள் (பட்டிங்)',
    scientificName: 'Syzygium samarangense - Red',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'High-yielding live budding red water apple sapling. Sweet juicy fruits.',
    mrp: 120,
    sellingPrice: 90,
    discount: 25,
    stock: 30,
    plantHeight: '1.5 - 2 Feet',
    potSize: 'Bag / Nursery Pot',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Summer',
    careInstructions: {
      watering: 'Water daily; ensure full sunlight for sweet fruit development.',
      sunlight: 'Full sun required (6+ hours daily).',
      fertilizer: 'Apply potash & organic compost every 15 days.',
      soil: 'Rich well-draining loamy red soil.'
    },
    images: ['/products/red-water-apple.jpeg', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['water apple', 'red water apple', 'fruit plant', 'வாட்டர் ஆப்பிள்'],
    rating: 4.9,
    reviewCount: 18,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-mysuru-malli',
    sku: 'VRG-JASMINE-10',
    name: 'Mysuru Malli',
    englishName: 'Mysuru Malli',
    tamilName: 'மைசூர் மல்லி',
    scientificName: 'Jasminum grandiflorum',
    categoryId: 'cat-jasmine',
    categoryName: 'Jasmine Varieties',
    description: 'Highly fragrant Mysuru Malli jasmine plant. Includes full soil & free shipping.',
    mrp: 150,
    sellingPrice: 120,
    discount: 20,
    stock: 25,
    plantHeight: '1.5 Feet',
    potSize: 'Full Soil Package',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily in morning; keep soil moist.',
      sunlight: 'Full sun for rich fragrant blooms.',
      fertilizer: 'Organic manure and groundnut cake solution fortnightly.',
      soil: 'Fertile red loam soil.'
    },
    images: ['https://images.unsplash.com/photo-1592729645009-b96d1e63d14b?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['mysuru malli', 'jasmine', 'மல்லி', 'fragrant plant'],
    rating: 4.8,
    reviewCount: 22,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-white-water-apple',
    sku: 'VRG-FRUIT-11',
    name: 'White Water Apple (Budding)',
    englishName: 'White Water Apple (Budding)',
    tamilName: 'வெள்ளை வாட்டர் ஆப்பிள் (பட்டிங்)',
    scientificName: 'Syzygium samarangense - White',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'Crisp and sweet white water apple live budding sapling.',
    mrp: 120,
    sellingPrice: 90,
    discount: 25,
    stock: 20,
    plantHeight: '1.5 - 2 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Summer',
    careInstructions: {
      watering: 'Keep soil moist; water daily.',
      sunlight: 'Full direct sunlight.',
      fertilizer: 'Organic compost monthly.',
      soil: 'Well-drained soil.'
    },
    images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=800&auto=format&fit=crop'],
    featured: false,
    bestSeller: false,
    trending: true,
    tags: ['white water apple', 'fruit plant'],
    rating: 4.7,
    reviewCount: 12,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-krishnakamalam-red',
    sku: 'VRG-CREEPER-10',
    name: 'Krishnakamalam Red',
    englishName: 'Krishnakamalam Red (Passion Flower)',
    tamilName: 'கிருஷ்ணகமலம் சிவப்பு',
    scientificName: 'Passiflora coccinea',
    categoryId: 'cat-creeper',
    categoryName: 'Creeper Roses',
    description: 'Exotic crimson red Passion Flower vine (Krishnakamalam). Rapid climber with striking blooms.',
    mrp: 70,
    sellingPrice: 50,
    discount: 28,
    stock: 35,
    plantHeight: '2 Feet Vine',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily; provide trellis for vine climbing.',
      sunlight: 'Full sun to partial shade.',
      fertilizer: 'Balanced NPK / vermicompost monthly.',
      soil: 'Porous well-draining garden soil.'
    },
    images: ['https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['krishnakamalam', 'passion flower', 'creeper', 'கிருஷ்ணகமலம்'],
    rating: 4.8,
    reviewCount: 15,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-krishnakamalam-violet',
    sku: 'VRG-CREEPER-11',
    name: 'Krishnakamalam Violet',
    englishName: 'Krishnakamalam Violet (Purple Passion Flower)',
    tamilName: 'கிருஷ்ணகமலம் ஊதா',
    scientificName: 'Passiflora incarnata',
    categoryId: 'cat-creeper',
    categoryName: 'Creeper Roses',
    description: 'Vibrant violet purple Passion Flower vine (Krishnakamalam). Divine fragrance and medicinal value.',
    mrp: 70,
    sellingPrice: 50,
    discount: 28,
    stock: 30,
    plantHeight: '2 Feet Vine',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water regularly.',
      sunlight: 'Full sun required.',
      fertilizer: 'Organic compost monthly.',
      soil: 'Rich loamy soil.'
    },
    images: ['https://images.unsplash.com/photo-1508610048659-a06b669e3321?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['krishnakamalam violet', 'passion flower'],
    rating: 4.7,
    reviewCount: 14,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-water-apple-green',
    sku: 'VRG-FRUIT-12',
    name: 'Water Apple Green (Budding)',
    englishName: 'Water Apple Green (Budding)',
    tamilName: 'பச்சை வாட்டர் ஆப்பிள் (பட்டிங்)',
    scientificName: 'Syzygium samarangense - Green',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'Juicy green water apple variety. Budded live plant.',
    mrp: 120,
    sellingPrice: 90,
    discount: 25,
    stock: 20,
    plantHeight: '1.5 - 2 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Summer',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Organic compost monthly.',
      soil: 'Red loamy soil.'
    },
    images: ['https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?q=80&w=800&auto=format&fit=crop'],
    featured: false,
    bestSeller: false,
    trending: false,
    tags: ['water apple green', 'fruit plant'],
    rating: 4.6,
    reviewCount: 9,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-sangu-poo-blue-ash',
    sku: 'VRG-HERBAL-10',
    name: 'Sangu Poo Blue Ash',
    englishName: 'Sangu Poo Blue Ash (Butterfly Pea)',
    tamilName: 'சங்கு பூ நீல ஆஷ்',
    scientificName: 'Clitoria ternatea',
    categoryId: 'cat-herbals',
    categoryName: 'Herbal Plants',
    description: 'Traditional medicinal Blue Butterfly Pea vine. Used for herbal tea and Ayurvedic wellness.',
    mrp: 80,
    sellingPrice: 60,
    discount: 25,
    stock: 40,
    plantHeight: '1.5 Feet Vine',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily in morning.',
      sunlight: 'Full sunlight.',
      fertilizer: 'Vermicompost monthly.',
      soil: 'Well-draining garden soil.'
    },
    images: ['https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['sangu poo', 'butterfly pea', 'herbal', 'சங்கு பூ'],
    rating: 4.9,
    reviewCount: 31,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-panneer-pushpam',
    sku: 'VRG-FLOWER-10',
    name: 'Panneer Pushpam',
    englishName: 'Panneer Pushpam',
    tamilName: 'பன்னீர் புஷ்பம்',
    scientificName: 'Guettarda speciosa',
    categoryId: 'cat-flowering',
    categoryName: 'Flowering Plants',
    description: 'Highly fragrant Panneer flowers with soothing rose scent.',
    mrp: 150,
    sellingPrice: 120,
    discount: 20,
    stock: 25,
    plantHeight: '1.5 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sunlight.',
      fertilizer: 'Organic compost monthly.',
      soil: 'Rich loamy soil.'
    },
    images: ['https://images.unsplash.com/photo-1562690868-60bbe7293e94?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['panneer pushpam', 'flowering plant', 'fragrant'],
    rating: 4.8,
    reviewCount: 19,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-pkm-murungai',
    sku: 'VRG-HERBAL-11',
    name: 'PKM Murungai (Chedi Murungai)',
    englishName: 'PKM Bush Moringa (Chedi Murungai)',
    tamilName: 'பி.கே.எம் முருங்கை (செடி முருங்கை)',
    scientificName: 'Moringa oleifera - PKM',
    categoryId: 'cat-herbals',
    categoryName: 'Herbal Plants',
    description: 'High yielding bush moringa variety. Early harvesting and nutrient rich leaves & drumsticks.',
    mrp: 70,
    sellingPrice: 50,
    discount: 28,
    stock: 50,
    plantHeight: '1.5 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Twice a week',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Moderate watering when topsoil dry.',
      sunlight: 'Full direct sun.',
      fertilizer: 'Cow dung manure / compost.',
      soil: 'Sandy loam or well-drained soil.'
    },
    images: ['https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['murungai', 'moringa', 'pkm murungai', 'முருங்கை'],
    rating: 4.9,
    reviewCount: 42,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-bubbly-mass',
    sku: 'VRG-FRUIT-13',
    name: 'Bubbly Mass (Grafted)',
    englishName: 'Bubbly Mass / Pomelo Grapefruit (Grafted)',
    tamilName: 'பப்ளி மாஸ் (கிராஃப்டட்)',
    scientificName: 'Citrus grandis',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'Grafted Bubbly Mass (Pomelo Citrus) live plant. Large juicy citrus fruits.',
    mrp: 180,
    sellingPrice: 140,
    discount: 22,
    stock: 18,
    plantHeight: '2 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Spring / Summer',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Citrus fertilizer / organic compost.',
      soil: 'Deep loamy red soil.'
    },
    images: ['https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['bubbly mass', 'pomelo', 'citrus', 'பப்ளி மாஸ்'],
    rating: 4.7,
    reviewCount: 11,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-rosemalli',
    sku: 'VRG-JASMINE-11',
    name: 'Rosemalli',
    englishName: 'Rosemalli',
    tamilName: 'ரோஸ் மல்லி',
    scientificName: 'Jasminum sambac var.',
    categoryId: 'cat-jasmine',
    categoryName: 'Jasmine Varieties',
    description: 'Rose-petaled jasmine variety with heavy blooms and rich perfume.',
    mrp: 70,
    sellingPrice: 50,
    discount: 28,
    stock: 30,
    plantHeight: '1 Foot',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Organic manure fortnightly.',
      soil: 'Porous garden soil.'
    },
    images: ['https://images.unsplash.com/photo-1587593810167-a84920ea0781?q=80&w=800&auto=format&fit=crop'],
    featured: false,
    bestSeller: false,
    trending: false,
    tags: ['rosemalli', 'jasmine', 'ரோஸ் மல்லி'],
    rating: 4.6,
    reviewCount: 16,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-bridal-bouquet',
    sku: 'VRG-CREEPER-12',
    name: 'Bridal Bouquet (Night Queen Kodi)',
    englishName: 'Bridal Bouquet (Night Queen Kodi Vine)',
    tamilName: 'பிரைடல் பொக்கே (நைட் குயின் கொடி)',
    scientificName: 'Porana paniculata',
    categoryId: 'cat-creeper',
    categoryName: 'Creeper Roses',
    description: 'Stunning white bridal lace creeper vine. Night blooming fragrance.',
    mrp: 100,
    sellingPrice: 70,
    discount: 30,
    stock: 25,
    plantHeight: '2 Feet Vine',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Winter / Spring',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Organic compost monthly.',
      soil: 'Rich loamy garden soil.'
    },
    images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['bridal bouquet', 'night queen', 'creeper'],
    rating: 4.8,
    reviewCount: 24,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-yellow-parijadham',
    sku: 'VRG-FLOWER-11',
    name: 'Yellow Parijadham',
    englishName: 'Yellow Parijadham (Night Jasmine)',
    tamilName: 'மஞ்சள் பாரிஜாதம்',
    scientificName: 'Nyctanthes arbor-tristis - Yellow',
    categoryId: 'cat-flowering',
    categoryName: 'Flowering Plants',
    description: 'Rare yellow-hued Parijat divine flower plant.',
    mrp: 140,
    sellingPrice: 100,
    discount: 28,
    stock: 20,
    plantHeight: '1.5 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Autumn / Winter',
    careInstructions: {
      watering: 'Water daily in morning.',
      sunlight: 'Full sun.',
      fertilizer: 'Bone meal and compost monthly.',
      soil: 'Well-drained soil.'
    },
    images: ['https://images.unsplash.com/photo-1591886960571-74d43a9d4166?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['yellow parijadham', 'parijat', 'மஞ்சள் பாரிஜாதம்'],
    rating: 4.8,
    reviewCount: 13,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-kamala-orange',
    sku: 'VRG-FRUIT-14',
    name: 'Kamala Orange (Grafted)',
    englishName: 'Kamala Orange (Grafted Mandarin)',
    tamilName: 'கமலா ஆரஞ்சு (கிராஃப்டட்)',
    scientificName: 'Citrus reticulata',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'Grafted sweet Kamala mandarin orange sapling. Early fruiting in home garden.',
    mrp: 140,
    sellingPrice: 100,
    discount: 28,
    stock: 25,
    plantHeight: '2 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Spring',
    careInstructions: {
      watering: 'Water regularly.',
      sunlight: 'Full direct sun.',
      fertilizer: 'Citrus fertilizer monthly.',
      soil: 'Rich fertile soil.'
    },
    images: ['https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['kamala orange', 'orange', 'fruit plant', 'ஆரஞ்சு'],
    rating: 4.9,
    reviewCount: 27,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-pkm-lemon',
    sku: 'VRG-FRUIT-15',
    name: 'PKM Lemon (Grafted)',
    englishName: 'PKM Seedless Lemon (Grafted)',
    tamilName: 'பி.கே.எம் எலுமிச்சை (கிராஃப்டட்)',
    scientificName: 'Citrus limon - PKM',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'Grafted commercial high-yield lemon tree. Fruits continuously throughout the year.',
    mrp: 120,
    sellingPrice: 90,
    discount: 25,
    stock: 35,
    plantHeight: '1.5 - 2 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full direct sunlight.',
      fertilizer: 'Organic compost & micronutrients.',
      soil: 'Red loamy soil.'
    },
    images: ['https://images.unsplash.com/photo-1534531141161-e41d133a8ad7?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['pkm lemon', 'lemon', 'எலுமிச்சை'],
    rating: 4.9,
    reviewCount: 38,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-mul-seetha',
    sku: 'VRG-FRUIT-16',
    name: 'Mul Seetha (Seed Plant)',
    englishName: 'Mul Seetha / Soursop (Graviola)',
    tamilName: 'முள் சீதா (விதை செடி)',
    scientificName: 'Annona muricata',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'Soursop (Mul Seetha) seed-grown plant. Known for powerful anti-cancer properties and delicious fruit.',
    mrp: 75,
    sellingPrice: 50,
    discount: 33,
    stock: 40,
    plantHeight: '1.5 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Summer',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Organic compost monthly.',
      soil: 'Loamy soil.'
    },
    images: ['https://images.unsplash.com/photo-1550258987-190a2d41a8ba?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['mul seetha', 'soursop', 'முள் சீதா'],
    rating: 4.9,
    reviewCount: 45,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-miracle-fruit',
    sku: 'VRG-RARE-10',
    name: 'Miracle Fruit',
    englishName: 'Miracle Berry Plant',
    tamilName: 'மிராகிள் ஃப்ரூட்',
    scientificName: 'Synsepalum dulcificum',
    categoryId: 'cat-rare',
    categoryName: 'Rare & Exotic Roses',
    description: 'Exotic Miracle Berry plant. Eating berries makes sour foods taste sweet!',
    mrp: 250,
    sellingPrice: 200,
    discount: 20,
    stock: 15,
    plantHeight: '1 - 1.5 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Partial Shade',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Keep soil moist; use acidic peaty soil.',
      sunlight: 'Filtered sunlight / partial shade.',
      fertilizer: 'Acidic plant fertilizer.',
      soil: 'Acidic potting mix.'
    },
    images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['miracle fruit', 'exotic plant', 'மிராகிள் ஃப்ரூட்'],
    rating: 5.0,
    reviewCount: 16,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-seetha-nmk',
    sku: 'VRG-FRUIT-17',
    name: 'Seetha NMK (Grafted)',
    englishName: 'Seetha NMK-1 Custard Apple (Grafted)',
    tamilName: 'சீதா NMK (கிராஃப்டட்)',
    scientificName: 'Annona squamosa - NMK-1 Golden',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'High quality NMK-1 grafted Custard Apple (Sitaphal). Big fruits with fewer seeds.',
    mrp: 160,
    sellingPrice: 120,
    discount: 25,
    stock: 25,
    plantHeight: '2 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Monsoon',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Compost & potash.',
      soil: 'Well-drained red soil.'
    },
    images: ['https://images.unsplash.com/photo-1528825871115-3581a5387919?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['seetha nmk', 'custard apple', 'சீதா'],
    rating: 4.8,
    reviewCount: 21,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-turgy-brown',
    sku: 'VRG-FRUIT-18',
    name: 'Turgy Brown Fig (Budding)',
    englishName: 'Turkey Brown Fig (Budding)',
    tamilName: 'டர்கி பிரவுன் அத்தி (பட்டிங்)',
    scientificName: 'Ficus carica - Turkey Brown',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'Budded Turkey Brown Fig sapling. Sweet brown figs suitable for pot culture.',
    mrp: 140,
    sellingPrice: 100,
    discount: 28,
    stock: 20,
    plantHeight: '1.5 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Summer',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Organic fertilizer monthly.',
      soil: 'Well-drained soil.'
    },
    images: ['https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['turgy brown', 'fig', 'அத்தி'],
    rating: 4.7,
    reviewCount: 15,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-magilam',
    sku: 'VRG-FLOWER-12',
    name: 'Magilam',
    englishName: 'Magilam (Spanish Cherry / Bakul)',
    tamilName: 'மகிழம்பூ செடி',
    scientificName: 'Mimusops elengi',
    categoryId: 'cat-flowering',
    categoryName: 'Flowering Plants',
    description: 'Traditional Magizham tree sapling with heavenly scented star flowers.',
    mrp: 120,
    sellingPrice: 90,
    discount: 25,
    stock: 30,
    plantHeight: '2 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Summer / Spring',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Organic compost monthly.',
      soil: 'Deep fertile soil.'
    },
    images: ['https://images.unsplash.com/photo-1509223197845-458d87318791?q=80&w=800&auto=format&fit=crop'],
    featured: false,
    bestSeller: true,
    trending: true,
    tags: ['magilam', 'bakul', 'மகிழம்பூ'],
    rating: 4.9,
    reviewCount: 33,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-sweet-kolunchi',
    sku: 'VRG-FRUIT-19',
    name: 'Sweet Kolunchi (Grafted)',
    englishName: 'Sweet Kolunchi / Sweet Lime (Grafted)',
    tamilName: 'ஸ்வீட் கொளுஞ்சி (கிராஃப்டட்)',
    scientificName: 'Citrus limetta - Sweet',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'Grafted Sweet Lime (Kolunchi) citrus plant. Juicy and refreshing fruits.',
    mrp: 140,
    sellingPrice: 100,
    discount: 28,
    stock: 20,
    plantHeight: '2 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Spring',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Citrus manure monthly.',
      soil: 'Loamy soil.'
    },
    images: ['https://images.unsplash.com/photo-1557800636-894a64c1696f?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['sweet kolunchi', 'sweet lime', 'கொளுஞ்சி'],
    rating: 4.8,
    reviewCount: 17,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-peanut-butter-fruit',
    sku: 'VRG-RARE-11',
    name: 'Pea Nut Butter Fruit (Budding with Flowering)',
    englishName: 'Peanut Butter Fruit (Budding with Flowering)',
    tamilName: 'பீநட் பட்டர் ஃப்ரூட் (பூக்களுடன் பட்டிங்)',
    scientificName: 'Bunchosia armeniaca',
    categoryId: 'cat-rare',
    categoryName: 'Rare & Exotic Roses',
    description: 'Exotic Peanut Butter Fruit plant, comes budding with flowers! Tastes like sweet peanut butter.',
    mrp: 140,
    sellingPrice: 100,
    discount: 28,
    stock: 15,
    plantHeight: '1.5 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Organic compost monthly.',
      soil: 'Rich loamy soil.'
    },
    images: ['https://images.unsplash.com/photo-1595855759920-86582396756a?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['peanut butter fruit', 'rare plant'],
    rating: 5.0,
    reviewCount: 23,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-naatu-rose-fullsoil',
    sku: 'VRG-ROSE-10',
    name: 'Naatu Rose (Full Soil)',
    englishName: 'Naatu Rose (Full Soil Free Shipping)',
    tamilName: 'நாட்டு ரோஸ் (முழு மண் இலவச ஷிப்பிங்)',
    scientificName: 'Rosa damascena - Country Rose',
    categoryId: 'cat-rose',
    categoryName: 'Rose Varieties',
    description: 'Authentic pink Country Naatu Rose. Shipped in full soil package with free delivery.',
    mrp: 140,
    sellingPrice: 110,
    discount: 21,
    stock: 50,
    plantHeight: '1.5 Feet',
    potSize: 'Full Soil Package',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Vermicompost every 15 days.',
      soil: 'Red soil.'
    },
    images: ['/products/naatu-pink.jpeg'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['naatu rose', 'country rose', 'நாட்டு ரோஸ்'],
    rating: 5.0,
    reviewCount: 65,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-rangoon-creeper',
    sku: 'VRG-CREEPER-13',
    name: 'Rangoon Creeper',
    englishName: 'Rangoon Creeper (Madhumalti)',
    tamilName: 'ரங்கூன் கிரீப்பர் (மதுமாலதி)',
    scientificName: 'Combretum indicum',
    categoryId: 'cat-creeper',
    categoryName: 'Creeper Roses',
    description: 'Clusters of fragrant tri-color flowers (white, pink, red). Fast growing outdoor climber.',
    mrp: 70,
    sellingPrice: 50,
    discount: 28,
    stock: 40,
    plantHeight: '2 Feet Vine',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Summer / Monsoon',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Organic manure monthly.',
      soil: 'Rich loamy soil.'
    },
    images: ['https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['rangoon creeper', 'madhumalti', 'ரங்கூன் கிரீப்பர்'],
    rating: 4.9,
    reviewCount: 29,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-manoranjitham',
    sku: 'VRG-CREEPER-14',
    name: 'Manoranjitham',
    englishName: 'Manoranjitham (Ylang Ylang Vine / Hari Champa)',
    tamilName: 'மனோரஞ்சிதம் (முழு மண் இலவச ஷிப்பிங்)',
    scientificName: 'Artabotrys hexapetalus',
    categoryId: 'cat-creeper',
    categoryName: 'Creeper Roses',
    description: 'Fragrant Manoranjitham green flowers that change color to yellow with intense perfume. Shipped with full soil.',
    mrp: 150,
    sellingPrice: 120,
    discount: 20,
    stock: 20,
    plantHeight: '2 Feet Vine',
    potSize: 'Full Soil Package',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Compost monthly.',
      soil: 'Rich garden soil.'
    },
    images: ['https://images.unsplash.com/photo-1508610048659-a06b669e3321?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['manoranjitham', 'hari champa', 'மனோரஞ்சிதம்'],
    rating: 4.9,
    reviewCount: 37,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-violet-hibiscus',
    sku: 'VRG-HIBISCUS-10',
    name: 'Violet Hibiscus',
    englishName: 'Violet Purple Hibiscus',
    tamilName: 'ஊதா செம்பருத்தி',
    scientificName: 'Hibiscus rosa-sinensis - Violet',
    categoryId: 'cat-hibiscus',
    categoryName: 'Hibiscus Varieties',
    description: 'Rare violet-purple tropical hibiscus flower plant with vibrant blooms.',
    mrp: 130,
    sellingPrice: 100,
    discount: 23,
    stock: 25,
    plantHeight: '1.5 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Potash and organic manure monthly.',
      soil: 'Porous soil.'
    },
    images: ['https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['violet hibiscus', 'hibiscus', 'செம்பருத்தி'],
    rating: 4.8,
    reviewCount: 18,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-jaboticaba',
    sku: 'VRG-RARE-12',
    name: 'Jabotica (Full Soil Free Shipping)',
    englishName: 'Jaboticaba / Brazilian Grape Tree',
    tamilName: 'ஜாபோடிகாபா (பிரேசிலிய திராட்சை)',
    scientificName: 'Plinia cauliflora',
    categoryId: 'cat-rare',
    categoryName: 'Rare & Exotic Roses',
    description: 'Exotic Jaboticaba tree whose delicious dark purple grape-like fruits grow directly on trunk! Shipped with full soil and free delivery.',
    mrp: 450,
    sellingPrice: 350,
    discount: 22,
    stock: 12,
    plantHeight: '2 Feet',
    potSize: 'Full Soil Package',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Spring / Summer',
    careInstructions: {
      watering: 'Water daily; keep moist.',
      sunlight: 'Full sun.',
      fertilizer: 'Acidic organic compost monthly.',
      soil: 'Rich moist loamy soil.'
    },
    images: ['https://images.unsplash.com/photo-1560155016-bd4879ae8f21?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['jabotica', 'jaboticaba', 'rare fruit tree', 'ஜாபோடிகாபா'],
    rating: 5.0,
    reviewCount: 40,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-egg-fruit',
    sku: 'VRG-FRUIT-20',
    name: 'Egg Fruit (Budding)',
    englishName: 'Egg Fruit / Canistel (Budding)',
    tamilName: 'எக் ஃப்ரூட் (பட்டிங்)',
    scientificName: 'Pouteria campechiana',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'Budded live Egg Fruit (Canistel) plant. Bright yellow sweet fruits with custard texture.',
    mrp: 230,
    sellingPrice: 180,
    discount: 21,
    stock: 15,
    plantHeight: '2 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Summer',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Organic compost monthly.',
      soil: 'Well-draining loamy soil.'
    },
    images: ['https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: false,
    trending: true,
    tags: ['egg fruit', 'canistel', 'எக் ஃப்ரூட்'],
    rating: 4.7,
    reviewCount: 14,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-ramar-seetha',
    sku: 'VRG-FRUIT-21',
    name: 'Ramar Seetha (Seed Plant)',
    englishName: 'Ramar Seetha / Bullock Heart Custard Apple',
    tamilName: 'ராமர் சீதா (விதை செடி)',
    scientificName: 'Annona reticulata',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'Traditional Ramar Seetha (Bullock Heart) seed-grown tree. Red sweet pulp fruit.',
    mrp: 75,
    sellingPrice: 50,
    discount: 33,
    stock: 35,
    plantHeight: '1.5 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Monsoon',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Compost monthly.',
      soil: 'Red soil.'
    },
    images: ['https://images.unsplash.com/photo-1528825871115-3581a5387919?q=80&w=800&auto=format&fit=crop'],
    featured: false,
    bestSeller: true,
    trending: true,
    tags: ['ramar seetha', 'custard apple', 'ராமர் சீதா'],
    rating: 4.8,
    reviewCount: 22,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-panneer-milagu-kodi',
    sku: 'VRG-HERBAL-12',
    name: 'Panner Milagu (Kodi)',
    englishName: 'Panneer Milagu Kodi (Vine)',
    tamilName: 'பன்னீர் மிளகு கொடி',
    scientificName: 'Piper nigrum var. Panneer',
    categoryId: 'cat-herbals',
    categoryName: 'Herbal Plants',
    description: 'Aromatic Panneer pepper vine (Milagu Kodi). High value spice and medicinal climber.',
    mrp: 75,
    sellingPrice: 50,
    discount: 33,
    stock: 30,
    plantHeight: '1.5 Feet Vine',
    potSize: 'Nursery Bag',
    sunlight: 'Partial Shade',
    waterRequirement: 'Daily',
    floweringSeason: 'Monsoon',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Partial shade.',
      fertilizer: 'Organic compost monthly.',
      soil: 'Moist well-draining garden soil.'
    },
    images: ['https://images.unsplash.com/photo-1509223197845-458d87318791?q=80&w=800&auto=format&fit=crop'],
    featured: false,
    bestSeller: false,
    trending: false,
    tags: ['panneer milagu', 'pepper vine', 'மிளகு கொடி'],
    rating: 4.7,
    reviewCount: 11,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-marudhani-red',
    sku: 'VRG-HERBAL-13',
    name: 'Marudhani Red',
    englishName: 'Marudhani Red (Red Henna)',
    tamilName: 'சிவப்பு மருதாணி',
    scientificName: 'Lawsonia inermis - Red',
    categoryId: 'cat-herbals',
    categoryName: 'Herbal Plants',
    description: 'Traditional Red Marudhani (Henna) plant. Deep natural red dye leaves.',
    mrp: 110,
    sellingPrice: 80,
    discount: 27,
    stock: 45,
    plantHeight: '1.5 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'Summer',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Compost monthly.',
      soil: 'Red garden soil.'
    },
    images: ['https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['marudhani', 'henna', 'மருதாணி'],
    rating: 4.9,
    reviewCount: 48,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-kalipatti-sapota',
    sku: 'VRG-FRUIT-22',
    name: 'Kalipatti Sapota (Grafted)',
    englishName: 'Kalipatti Sapota / Chiku (Grafted)',
    tamilName: 'காளிபட்டி சப்போட்டா (கிராஃப்டட்)',
    scientificName: 'Manilkara zapota - Kalipatti',
    categoryId: 'cat-fruits',
    categoryName: 'Fruit Plants',
    description: 'Grafted Kalipatti variety Sapota (Chiku). High sweetness and heavy yields.',
    mrp: 120,
    sellingPrice: 90,
    discount: 25,
    stock: 30,
    plantHeight: '2 Feet',
    potSize: 'Nursery Bag',
    sunlight: 'Full Sun',
    waterRequirement: 'Daily',
    floweringSeason: 'All Season',
    careInstructions: {
      watering: 'Water daily.',
      sunlight: 'Full sun.',
      fertilizer: 'Compost & bone meal monthly.',
      soil: 'Deep fertile soil.'
    },
    images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=800&auto=format&fit=crop'],
    featured: true,
    bestSeller: true,
    trending: true,
    tags: ['kalipatti sapota', 'sapota', 'chiku', 'சப்போட்டா'],
    rating: 4.9,
    reviewCount: 36,
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
  email: process.env.BUSINESS_EMAIL || 'nv01110612@gmail.com',
  whatsapp: process.env.BUSINESS_WHATSAPP || '+917200826129',
  address: process.env.BUSINESS_ADDRESS || 'Pennagaram, Tamil Nadu — 636810',
  googleMapsUrl: 'https://maps.google.com/?q=Pennagaram,Tamil+Nadu',
  workingHours: 'Open 7 AM – 7 PM · All Days',
  taxRate: 0,
  shippingFee: 50,
  freeShippingThreshold: 999,
  enableRazorpay: true,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_live_TQ5xDdZB7QWIn2',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'FfkwntR4ygvIapq4ex50ajp0',
  enableCod: true,
  enablePhonePe: true,
  enableQrPayment: true,
  qrCodeImageUrl: '/nursery-qr.svg',
  upiId: process.env.UPI_ID || '7200826129@ybl',
  upiName: process.env.UPI_NAME || 'Veerika Rose Garden Nursery',
  qrInstructions: '1. Scan the QR code using GPay, PhonePe, Paytm or any UPI app.\n2. Enter the exact order total amount and pay.\n3. Take a screenshot of the successful payment receipt.\n4. Upload the screenshot below to place your order.',
  phonepeMerchantId: process.env.PHONEPE_MERCHANT_ID || '',
  phonepeSaltKey: process.env.PHONEPE_SALT_KEY || '',
  phonepeSaltIndex: String(process.env.PHONEPE_SALT_INDEX || '1'),
  phonepeEnv: (process.env.PHONEPE_ENV as 'SANDBOX' | 'PRODUCTION') || 'PRODUCTION'
};

const DEFAULT_ORDERS: Order[] = loadDiskOrders();

const DEFAULT_FINANCES: FinancialEntry[] = [];

// Persistent deletion tracking across serverless requests
const deletedProductIds = (globalThis as any)._deletedProductIds || ((globalThis as any)._deletedProductIds = new Set<string>());
const deletedCategoryIds = (globalThis as any)._deletedCategoryIds || ((globalThis as any)._deletedCategoryIds = new Set<string>());
const deletedCouponIds = (globalThis as any)._deletedCouponIds || ((globalThis as any)._deletedCouponIds = new Set<string>());
const deletedFinanceIds = (globalThis as any)._deletedFinanceIds || ((globalThis as any)._deletedFinanceIds = new Set<string>());
const deletedOrderIds = (globalThis as any)._deletedOrderIds || ((globalThis as any)._deletedOrderIds = new Set<string>());
const deletedComboIds = (globalThis as any)._deletedComboIds || ((globalThis as any)._deletedComboIds = loadDiskDeletedCombos());

export const DEFAULT_COMBOS: Combo[] = loadDiskCombos();

const memoryCombosStore: Combo[] = (globalThis as any)._memoryCombosStore || ((globalThis as any)._memoryCombosStore = loadDiskCombos());
const globalMemorySettings: SiteSettings = (globalThis as any)._globalMemorySettings || ((globalThis as any)._globalMemorySettings = { ...DEFAULT_SETTINGS });

const META_DELIMITER = '|||JSON_META|||';

interface CustomMetaSettings {
  enableRazorpay?: boolean;
  enablePhonePe?: boolean;
  enableCod?: boolean;
  enableQrPayment?: boolean;
  upiId?: string;
  upiName?: string;
  qrCodeImageUrl?: string;
  qrInstructions?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
}

function extractMetaFromWorkingHours(rawWorkingHours?: string): { workingHours: string; meta: CustomMetaSettings } {
  if (!rawWorkingHours) return { workingHours: DEFAULT_SETTINGS.workingHours, meta: {} };
  const parts = rawWorkingHours.split(META_DELIMITER);
  const workingHours = parts[0] || DEFAULT_SETTINGS.workingHours;
  let meta: CustomMetaSettings = {};
  const lastPart = parts.length > 1 ? parts[parts.length - 1] : null;
  if (lastPart) {
    try {
      meta = JSON.parse(lastPart);
    } catch (e) {
      meta = {};
    }
  }
  return { workingHours, meta };
}

function packMetaIntoWorkingHours(cleanWorkingHours: string, meta: CustomMetaSettings): string {
  const pureHours = (cleanWorkingHours || DEFAULT_SETTINGS.workingHours).split(META_DELIMITER)[0];
  return `${pureHours}${META_DELIMITER}${JSON.stringify(meta)}`;
}

class Store {
  private memoryOrders: Order[] = [];
  private get memoryFinances(): FinancialEntry[] {
    if (!(globalThis as any)._memoryFinances) {
      (globalThis as any)._memoryFinances = loadDiskFinances();
    }
    return (globalThis as any)._memoryFinances;
  }
  private set memoryFinances(val: FinancialEntry[]) {
    (globalThis as any)._memoryFinances = val;
  }

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
    const updated = [entry, ...this.memoryFinances];
    this.memoryFinances = updated;
    saveDiskFinances(updated);
    return entry;
  }

  async deleteFinancialEntry(id: string): Promise<boolean> {
    if (!id) return false;
    deletedFinanceIds.add(id);
    const updated = this.memoryFinances.filter(f => f.id !== id);
    this.memoryFinances = updated;
    saveDiskFinances(updated);
    return true;
  }

  async updateFinancialEntry(id: string, data: Partial<FinancialEntry>): Promise<FinancialEntry | null> {
    const list = [...this.memoryFinances];
    const idx = list.findIndex(f => f.id === id);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        ...(data.type ? { type: data.type } : {}),
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.costAmount !== undefined ? { costAmount: Number(data.costAmount) } : {}),
        ...(data.sellAmount !== undefined ? { sellAmount: Number(data.sellAmount) } : {}),
        ...(data.quantity !== undefined ? { quantity: Number(data.quantity) } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.date ? { date: data.date } : {})
      };
      this.memoryFinances = list;
      saveDiskFinances(list);
      return list[idx];
    }
    return null;
  }





  // PRODUCTS
  private productsCache: { data: Product[]; expiresAt: number } = {
    data: DEFAULT_PRODUCTS.filter(p => !deletedProductIds.has(p.id)),
    expiresAt: 0
  };
  private isRefreshingProducts = false;

  invalidateProductsCache() {
    this.productsCache.expiresAt = 0;
  }

  private async refreshProductsCache(): Promise<Product[]> {
    if (this.isRefreshingProducts) return this.productsCache.data;
    this.isRefreshingProducts = true;
    try {
      const prisma = getPrismaClient();
      if (!prisma) {
        this.productsCache = {
          data: DEFAULT_PRODUCTS.filter(p => !deletedProductIds.has(p.id)),
          expiresAt: Date.now() + 300000
        };
        return this.productsCache.data;
      }

      const items = await prisma.product.findMany({
        where: { inStock: true },
        include: { categoryRel: true, inventory: true },
        orderBy: { createdAt: 'desc' }
      });

      let results: Product[] = items.map(p => ({
        id: p.id,
        sku: p.sku || `VRG-${p.id.slice(0, 6).toUpperCase()}`,
        name: p.name,
        englishName: p.name,
        tamilName: p.nameTamil || p.name,
        scientificName: p.scientificName || '',
        categoryId: p.categoryId || (p.category ? `cat-${p.category.toLowerCase().replace(/\s+/g, '-')}` : 'cat-roses'),
        categoryName: p.category,
        description: p.description || '',
        mrp: p.originalPrice || p.price,
        sellingPrice: p.price,
        discount: p.originalPrice > 0 ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0,
        images: p.images && p.images.length > 0 ? p.images : [p.image],
        rating: p.rating || 5.0,
        reviewCount: p.reviewsCount || 0,
        stock: p.inventory?.quantity ?? 50,
        plantHeight: '1.5 - 2 Feet',
        potSize: p.potSize || '8 Inch Bag',
        sunlight: (p.careSunlight as any) || 'Full Sun',
        waterRequirement: (p.careWatering as any) || 'Daily',
        floweringSeason: 'All Year',
        careInstructions: {
          watering: p.careWatering || 'Daily',
          sunlight: p.careSunlight || 'Full Sun',
          fertilizer: p.careFertilizer || 'Organic compost',
          soil: p.careSoil || 'Red soil'
        },
        featured: Boolean(p.isFeatured),
        bestSeller: Boolean(p.isBestSeller),
        trending: true,
        tags: [p.category.toLowerCase()],
        status: 'ACTIVE' as const,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      }));

      // Merge results with DEFAULT_PRODUCTS so missing default products are included
      const existingDbIds = new Set(results.map(p => p.id));
      for (const defProd of DEFAULT_PRODUCTS) {
        if (!existingDbIds.has(defProd.id)) {
          results.push(defProd);
          existingDbIds.add(defProd.id);
        }
      }

      const finalProducts = results.filter(p => !deletedProductIds.has(p.id));
      this.productsCache = { data: finalProducts, expiresAt: Date.now() + 300000 };
      return finalProducts;
    } catch (err) {
      console.warn('Background refreshProductsCache notice:', err);
      return this.productsCache.data;
    } finally {
      this.isRefreshingProducts = false;
    }
  }

  async getProducts(query?: {
    search?: string;
    categoryId?: string;
    featured?: boolean;
    bestSeller?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }): Promise<Product[]> {
    const isFullQuery = !query || Object.keys(query).length === 0;

    const applyFilters = (list: Product[]) => {
      let results = [...list];
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
      return results.filter(p => !deletedProductIds.has(p.id));
    };

    // Trigger background cache refresh if expired or uninitialized
    if (Date.now() >= this.productsCache.expiresAt) {
      this.refreshProductsCache().catch(() => {});
    }

    const currentList = this.productsCache.data;
    return isFullQuery ? currentList : applyFilters(currentList);
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

    // Verify categoryId exists in Prisma to avoid FK constraint failure
    let validCategoryId: string | null = null;
    if (prisma && product.categoryId) {
      try {
        const cat = await prisma.category.findUnique({ where: { id: product.categoryId } });
        if (cat) validCategoryId = product.categoryId;
      } catch {
        validCategoryId = null;
      }
    }

    const cleanImages = Array.isArray(product.images) && product.images.filter(Boolean).length > 0
      ? product.images.filter(Boolean)
      : (product as any).imageUrl ? [String((product as any).imageUrl).trim()]
      : (product as any).image ? [String((product as any).image).trim()]
      : ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'];

    const newProd: Product = {
      ...product,
      id,
      sku,
      mrp: Number(product.mrp) || Number(product.sellingPrice) || 0,
      sellingPrice: Number(product.sellingPrice) || 0,
      discount: Number(product.discount) || 0,
      stock: Number(product.stock) >= 0 ? Number(product.stock) : 25,
      images: cleanImages,
      rating: 5.0,
      reviewCount: 0,
      status: (product.status as any) || 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Product;

    if (prisma) {
      try {
        const created = await prisma.product.create({
          data: {
            id,
            sku,
            name: product.name,
            nameTamil: product.tamilName || product.name,
            scientificName: product.scientificName || '',
            category: product.categoryName || 'Roses',
            categoryId: validCategoryId,
            description: product.description || '',
            price: Number(product.sellingPrice) || 0,
            originalPrice: Number(product.mrp) || Number(product.sellingPrice) || 0,
            image: cleanImages[0],
            images: cleanImages,
            isFeatured: Boolean(product.featured),
            isBestSeller: Boolean(product.bestSeller),
            potSize: product.potSize || '8 Inch Bag',
            inStock: (product.stock ?? 25) > 0,
            careWatering: typeof product.careInstructions === 'object' ? product.careInstructions?.watering || 'Daily' : 'Daily',
            careSunlight: typeof product.careInstructions === 'object' ? product.careInstructions?.sunlight || 'Full Sun' : 'Full Sun',
            careFertilizer: typeof product.careInstructions === 'object' ? product.careInstructions?.fertilizer || 'Organic compost' : 'Organic compost',
            careSoil: typeof product.careInstructions === 'object' ? product.careInstructions?.soil || 'Red soil' : 'Red soil'
          }
        });

        await prisma.inventory.create({
          data: {
            productId: id,
            quantity: Number(product.stock) >= 0 ? Number(product.stock) : 50
          }
        }).catch(() => {});

        newProd.createdAt = created.createdAt.toISOString();
        newProd.updatedAt = created.updatedAt.toISOString();
      } catch (err) {
        console.warn('Prisma addProduct notice:', err);
      }
    }

    // Always maintain in DEFAULT_PRODUCTS memory array
    DEFAULT_PRODUCTS.unshift(newProd);
    if (this.productsCache && Array.isArray(this.productsCache.data)) {
      this.productsCache.data.unshift(newProd);
    }
    this.invalidateProductsCache();
    return newProd;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const cleanImages = Array.isArray(updates.images) && updates.images.filter(Boolean).length > 0
      ? updates.images.filter(Boolean)
      : (updates as any).imageUrl ? [String((updates as any).imageUrl).trim()]
      : (updates as any).image ? [String((updates as any).image).trim()]
      : undefined;

    const normalizedUpdates: Partial<Product> = {
      ...updates,
      ...(updates.sellingPrice !== undefined ? { sellingPrice: Number(updates.sellingPrice) } : {}),
      ...(updates.mrp !== undefined ? { mrp: Number(updates.mrp) } : {}),
      ...(updates.stock !== undefined ? { stock: Number(updates.stock) } : {}),
      ...(updates.discount !== undefined ? { discount: Number(updates.discount) } : {}),
      ...(cleanImages ? { images: cleanImages } : {})
    };

    const prisma = getPrismaClient();
    let prismaUpdated: Product | null = null;

    let validCategoryId: string | null | undefined = undefined;
    if (updates.categoryId !== undefined) {
      if (prisma && updates.categoryId) {
        try {
          const cat = await prisma.category.findUnique({ where: { id: updates.categoryId } });
          validCategoryId = cat ? updates.categoryId : null;
        } catch {
          validCategoryId = null;
        }
      } else {
        validCategoryId = null;
      }
    }

    if (prisma) {
      try {
        await prisma.product.upsert({
          where: { id },
          update: {
            ...(updates.name ? { name: updates.name } : {}),
            ...(updates.tamilName !== undefined ? { nameTamil: updates.tamilName } : {}),
            ...(updates.scientificName !== undefined ? { scientificName: updates.scientificName } : {}),
            ...(updates.sellingPrice !== undefined ? { price: Number(updates.sellingPrice) } : {}),
            ...(updates.mrp !== undefined ? { originalPrice: Number(updates.mrp) } : {}),
            ...(updates.description !== undefined ? { description: updates.description } : {}),
            ...(cleanImages ? { images: cleanImages, image: cleanImages[0] } : {}),
            ...(updates.featured !== undefined ? { isFeatured: Boolean(updates.featured) } : {}),
            ...(updates.bestSeller !== undefined ? { isBestSeller: Boolean(updates.bestSeller) } : {}),
            ...(validCategoryId !== undefined ? { categoryId: validCategoryId } : {}),
            ...(updates.categoryName ? { category: updates.categoryName } : {}),
            ...(updates.potSize ? { potSize: updates.potSize } : {}),
            ...(updates.stock !== undefined ? { inStock: Number(updates.stock) > 0 } : {}),
            ...(updates.careInstructions?.watering ? { careWatering: updates.careInstructions.watering } : {}),
            ...(updates.careInstructions?.sunlight ? { careSunlight: updates.careInstructions.sunlight } : {}),
            ...(updates.careInstructions?.fertilizer ? { careFertilizer: updates.careInstructions.fertilizer } : {}),
            ...(updates.careInstructions?.soil ? { careSoil: updates.careInstructions.soil } : {})
          },
          create: {
            id,
            sku: updates.sku || `VRG-${id.slice(-6).toUpperCase()}`,
            name: updates.name || 'Rose Plant',
            nameTamil: updates.tamilName || updates.name || 'ரோஜா செடி',
            scientificName: updates.scientificName || '',
            category: updates.categoryName || 'Roses',
            categoryId: validCategoryId || null,
            description: updates.description || '',
            price: Number(updates.sellingPrice) || 199,
            originalPrice: Number(updates.mrp) || 249,
            image: cleanImages?.[0] || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
            images: cleanImages || [],
            isFeatured: Boolean(updates.featured),
            isBestSeller: Boolean(updates.bestSeller),
            potSize: updates.potSize || '8 Inch Bag',
            inStock: updates.stock !== undefined ? Number(updates.stock) > 0 : true,
            careWatering: updates.careInstructions?.watering || 'Water daily in the morning.',
            careSunlight: updates.careInstructions?.sunlight || 'Requires 5 hours direct sunlight.',
            careFertilizer: updates.careInstructions?.fertilizer || 'Apply vermicompost every 15 days.',
            careSoil: updates.careInstructions?.soil || 'Red soil mixed with coco peat.'
          }
        });

        if (updates.stock !== undefined) {
          await prisma.inventory.upsert({
            where: { productId: id },
            update: { quantity: Number(updates.stock) },
            create: { productId: id, quantity: Number(updates.stock) }
          }).catch(() => {});
        }

        prismaUpdated = (await this.getProductById(id)) || null;
      } catch (err) {
        console.warn('Prisma updateProduct fallback notice:', err);
      }
    }

    // Always update or add in DEFAULT_PRODUCTS
    let finalUpdatedProduct: Product;
    const defIndex = DEFAULT_PRODUCTS.findIndex(p => p.id === id);
    if (defIndex !== -1) {
      DEFAULT_PRODUCTS[defIndex] = {
        ...DEFAULT_PRODUCTS[defIndex],
        ...normalizedUpdates,
        updatedAt: new Date().toISOString()
      };
      finalUpdatedProduct = DEFAULT_PRODUCTS[defIndex];
    } else {
      const updatedItem: Product = {
        id,
        sku: updates.sku || `VRG-${id.slice(-6).toUpperCase()}`,
        name: updates.name || 'Plant',
        englishName: updates.englishName || updates.name || 'Plant',
        tamilName: updates.tamilName || updates.name || '',
        scientificName: updates.scientificName || '',
        categoryName: updates.categoryName || 'Roses',
        categoryId: updates.categoryId || 'cat-roses',
        description: updates.description || '',
        mrp: Number(updates.mrp) || Number(updates.sellingPrice) || 199,
        sellingPrice: Number(updates.sellingPrice) || 199,
        discount: Number(updates.discount) || 0,
        stock: Number(updates.stock) >= 0 ? Number(updates.stock) : 25,
        rating: 5,
        reviewCount: 0,
        images: cleanImages || updates.images || [],
        featured: Boolean(updates.featured),
        bestSeller: Boolean(updates.bestSeller),
        trending: Boolean(updates.trending),
        tags: updates.tags || [],
        status: updates.status || 'ACTIVE',
        careInstructions: updates.careInstructions || {
          watering: 'Water daily in the morning.',
          sunlight: 'Requires 5 hours direct sunlight.',
          fertilizer: 'Apply vermicompost every 15 days.',
          soil: 'Red soil mixed with coco peat.'
        },
        plantHeight: updates.plantHeight || '1-2 Feet',
        potSize: updates.potSize || '8 Inch Bag',
        sunlight: updates.sunlight || 'Full Sun',
        waterRequirement: updates.waterRequirement || 'Daily',
        floweringSeason: updates.floweringSeason || 'All Year',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...normalizedUpdates
      };
      DEFAULT_PRODUCTS.unshift(updatedItem);
      finalUpdatedProduct = updatedItem;
    }

    // Sync in-memory productsCache so immediate reads return updated image without stale read
    if (this.productsCache && Array.isArray(this.productsCache.data)) {
      const cIdx = this.productsCache.data.findIndex(p => p.id === id);
      if (cIdx !== -1) {
        this.productsCache.data[cIdx] = {
          ...this.productsCache.data[cIdx],
          ...finalUpdatedProduct
        };
      } else {
        this.productsCache.data.unshift(finalUpdatedProduct);
      }
    }
    this.invalidateProductsCache();
    return prismaUpdated || finalUpdatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    deletedProductIds.add(id);
    if (this.productsCache && Array.isArray(this.productsCache.data)) {
      this.productsCache.data = this.productsCache.data.filter(p => p.id !== id);
    }
    this.invalidateProductsCache();
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


  private categoriesCache: { data: Category[]; expiresAt: number } = {
    data: DEFAULT_CATEGORIES.filter(c => !deletedCategoryIds.has(c.id)),
    expiresAt: 0
  };
  private isRefreshingCategories = false;

  invalidateCategoriesCache() {
    this.categoriesCache.expiresAt = 0;
  }

  private async refreshCategoriesCache(): Promise<Category[]> {
    if (this.isRefreshingCategories) return this.categoriesCache.data;
    this.isRefreshingCategories = true;
    try {
      const prisma = getPrismaClient();
      if (!prisma) {
        this.categoriesCache = {
          data: DEFAULT_CATEGORIES.filter(c => !deletedCategoryIds.has(c.id)),
          expiresAt: Date.now() + 300000
        };
        return this.categoriesCache.data;
      }

      const items = await prisma.category.findMany({
        where: { isActive: true },
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

      const finalCategories = results.filter(c => !deletedCategoryIds.has(c.id));
      this.categoriesCache = { data: finalCategories, expiresAt: Date.now() + 300000 };
      return finalCategories;
    } catch (err) {
      console.warn('Background refreshCategoriesCache notice:', err);
      return this.categoriesCache.data;
    } finally {
      this.isRefreshingCategories = false;
    }
  }

  async getCategories(options?: { onlyActive?: boolean; onlyFeatured?: boolean }): Promise<Category[]> {
    if (Date.now() >= this.categoriesCache.expiresAt) {
      this.refreshCategoriesCache().catch(() => {});
    }

    let results = this.categoriesCache.data;
    if (options?.onlyActive) results = results.filter(c => c.isActive !== false);
    if (options?.onlyFeatured) results = results.filter(c => c.isFeatured);
    return results.filter(c => !deletedCategoryIds.has(c.id));
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

      this.invalidateCategoriesCache();
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
      if (updates.image !== undefined || (updates as any).imageUrl !== undefined) {
        dataToUpdate.image = updates.image || (updates as any).imageUrl;
      }
      if (updates.iconName !== undefined) dataToUpdate.icon = updates.iconName;
      if (updates.order !== undefined) dataToUpdate.order = updates.order;
      if (updates.isActive !== undefined) dataToUpdate.isActive = updates.isActive;
      if (updates.isFeatured !== undefined) dataToUpdate.isFeatured = updates.isFeatured;
      if (updates.metaTitle !== undefined) dataToUpdate.metaTitle = updates.metaTitle;
      if (updates.metaDescription !== undefined) dataToUpdate.metaDescription = updates.metaDescription;
      if (updates.ogImage !== undefined) dataToUpdate.ogImage = updates.ogImage;
      if (updates.canonicalUrl !== undefined) dataToUpdate.canonicalUrl = updates.canonicalUrl;

      const existingInDb = await prisma.category.findUnique({ where: { id } }).catch(() => null);
      let c: any;
      if (existingInDb) {
        c = await prisma.category.update({
          where: { id },
          data: dataToUpdate,
          include: {
            _count: {
              select: { products: true }
            }
          }
        });
      } else {
        const defMatch = DEFAULT_CATEGORIES.find(d => d.id === id || d.slug === id);
        c = await prisma.category.create({
          data: {
            id,
            name: dataToUpdate.name || defMatch?.name || 'Category',
            nameTamil: dataToUpdate.nameTamil || defMatch?.tamilName || '',
            slug: dataToUpdate.slug || defMatch?.slug || id.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
            description: dataToUpdate.description || defMatch?.description || '',
            image: dataToUpdate.image || defMatch?.image || '/products/double-delight.jpeg',
            icon: dataToUpdate.icon || 'Flower2',
            order: dataToUpdate.order ?? defMatch?.order ?? 1,
            isActive: dataToUpdate.isActive ?? defMatch?.isActive ?? true,
            isFeatured: dataToUpdate.isFeatured ?? defMatch?.isFeatured ?? false,
            metaTitle: dataToUpdate.metaTitle,
            metaDescription: dataToUpdate.metaDescription,
            ogImage: dataToUpdate.ogImage,
            canonicalUrl: dataToUpdate.canonicalUrl
          },
          include: {
            _count: {
              select: { products: true }
            }
          }
        });
      }

      const updatedCategoryResult: Category = {
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

      const defIdx = DEFAULT_CATEGORIES.findIndex(cat => cat.id === id || cat.slug === id);
      if (defIdx !== -1) {
        DEFAULT_CATEGORIES[defIdx] = {
          ...DEFAULT_CATEGORIES[defIdx],
          ...updates,
          image: dataToUpdate.image || DEFAULT_CATEGORIES[defIdx].image,
          updatedAt: new Date().toISOString()
        };
      }
      if (this.categoriesCache && Array.isArray(this.categoriesCache.data)) {
        const catIdx = this.categoriesCache.data.findIndex(cat => cat.id === id || cat.slug === id);
        if (catIdx !== -1) {
          this.categoriesCache.data[catIdx] = {
            ...this.categoriesCache.data[catIdx],
            ...updatedCategoryResult
          };
        }
      }
      this.invalidateCategoriesCache();
      return updatedCategoryResult;
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
      this.invalidateCategoriesCache();
      return { success: true, message: 'Category deleted successfully' };
    } catch (err: any) {
      deletedCategoryIds.add(id);
      this.invalidateCategoriesCache();
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
    this.invalidateCategoriesCache();
    return true;
  }


  // BANNERS
  private static readonly DEFAULT_BANNERS: Banner[] = [
    {
      id: 'banner-1',
      title: '🌸 Premium Rose Plants – Direct from Our Farm',
      subtitle: 'Hybrid & Rare Varieties. Free Shipping above ₹499.',
      imageUrl: 'https://images.unsplash.com/photo-1502977249166-824b3a8a4d6d?auto=format&fit=crop&w=1200&q=80',
      targetCategory: 'Rose Varieties',
      active: true,
      order: 1
    },
    {
      id: 'banner-2',
      title: '🌿 Fresh Jasmine & Herbal Plants',
      subtitle: 'Jadhi Malli, Ramar Malli & More – Grown with Love',
      imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80',
      targetCategory: 'Jasmine Varieties',
      active: true,
      order: 2
    },
    {
      id: 'banner-3',
      title: '🌹 Rare & Exotic Roses Collection',
      subtitle: 'Black Magic, Moncou & Tiger Rose – Limited Stock!',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      targetCategory: 'Rare & Exotic Roses',
      active: true,
      order: 3
    }
  ];

  private memoryBanners: Banner[] = [...Store.DEFAULT_BANNERS];
  private deletedBannerIds = new Set<string>();

  private bannersCache: { data: Banner[]; expiresAt: number } = {
    data: Store.DEFAULT_BANNERS,
    expiresAt: 0
  };

  invalidateBannersCache() {
    this.bannersCache.expiresAt = 0;
  }

  async addBanner(data: { title: string; subtitle?: string; imageUrl: string; targetCategory?: string; active?: boolean; order?: number }): Promise<Banner> {
    const id = 'banner-' + Date.now();
    const newBanner: Banner = {
      id,
      title: data.title,
      subtitle: data.subtitle || '',
      imageUrl: data.imageUrl,
      targetCategory: data.targetCategory || '',
      active: data.active !== false,
      order: data.order || (this.memoryBanners.length + 1)
    };

    this.memoryBanners.push(newBanner);
    this.deletedBannerIds.delete(id);
    this.bannersCache = {
      data: this.memoryBanners.filter(b => !this.deletedBannerIds.has(b.id) && b.active !== false),
      expiresAt: Date.now() + 300000
    };

    const prisma = getPrismaClient();
    if (prisma) {
      prisma.banner.create({
        data: {
          id,
          title: data.title,
          subtitle: data.subtitle || '',
          imageUrl: data.imageUrl,
          targetCategory: data.targetCategory || '',
          active: data.active !== false,
          order: data.order || 1
        }
      }).catch(err => console.error('Prisma addBanner background error:', err));
    }
    return newBanner;
  }

  async updateBanner(id: string, updates: Partial<Banner>): Promise<Banner | null> {
    const cleanImg = updates.imageUrl || (updates as any).image;
    if (cleanImg) updates.imageUrl = cleanImg;

    const idx = this.memoryBanners.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.memoryBanners[idx] = { ...this.memoryBanners[idx], ...updates };
    }
    this.bannersCache = {
      data: this.memoryBanners.filter(b => !this.deletedBannerIds.has(b.id) && b.active !== false),
      expiresAt: Date.now() + 300000
    };
    this.invalidateBannersCache();

    const prisma = getPrismaClient();
    if (prisma) {
      prisma.banner.upsert({
        where: { id },
        update: {
          ...(updates.title ? { title: updates.title } : {}),
          ...(updates.subtitle !== undefined ? { subtitle: updates.subtitle } : {}),
          ...(updates.imageUrl ? { imageUrl: updates.imageUrl } : {}),
          ...(updates.targetCategory !== undefined ? { targetCategory: updates.targetCategory } : {}),
          ...(updates.active !== undefined ? { active: updates.active } : {}),
          ...(updates.order !== undefined ? { order: updates.order } : {})
        },
        create: {
          id,
          title: updates.title || 'Special Banner',
          subtitle: updates.subtitle || '',
          imageUrl: updates.imageUrl || 'https://images.unsplash.com/photo-1502977249166-824b3a8a4d6d',
          targetCategory: updates.targetCategory || '',
          active: updates.active !== false,
          order: updates.order || 1
        }
      }).catch(err => console.error('Prisma updateBanner background error:', err));
    }
    return this.memoryBanners.find(b => b.id === id) || null;
  }

  async deleteBanner(id: string): Promise<boolean> {
    this.deletedBannerIds.add(id);
    this.memoryBanners = this.memoryBanners.filter(b => b.id !== id);
    this.bannersCache = {
      data: this.memoryBanners.filter(b => !this.deletedBannerIds.has(b.id) && b.active !== false),
      expiresAt: Date.now() + 300000
    };

    const prisma = getPrismaClient();
    if (prisma) {
      prisma.banner.deleteMany({ where: { id } }).catch(err => {
        console.error('Prisma deleteBanner background error:', err);
      });
    }
    return true;
  }

  async getBanners(): Promise<Banner[]> {
    if (Date.now() >= this.bannersCache.expiresAt) {
      (async () => {
        try {
          const prisma = getPrismaClient();
          if (prisma) {
            const items = await prisma.banner.findMany({
              where: { active: true },
              orderBy: { order: 'asc' }
            });
            if (items && items.length > 0) {
              this.bannersCache = {
                data: items.map(b => ({
                  id: b.id,
                  title: b.title,
                  subtitle: b.subtitle || '',
                  imageUrl: b.imageUrl,
                  targetCategory: b.targetCategory || '',
                  active: b.active,
                  order: b.order
                })).filter(b => !this.deletedBannerIds.has(b.id)),
                expiresAt: Date.now() + 300000
              };
            }
          }
        } catch (err) {
          console.warn('Background getBanners notice:', err);
        }
      })();
    }
    return this.bannersCache.data.filter(b => !this.deletedBannerIds.has(b.id));
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
            discountType: (coupon.type === 'FIXED' || (coupon as any).discountType === 'FIXED') ? 'FIXED' : 'PERCENTAGE',
            discountValue: Number(coupon.value ?? (coupon as any).discountValue ?? 10),
            minOrderValue: Number(coupon.minOrder ?? (coupon as any).minOrderValue ?? 0),
            maxDiscount: (coupon.maxDiscount || (coupon as any).maxDiscount) ? Number(coupon.maxDiscount || (coupon as any).maxDiscount) : null,
            isActive: (coupon.active ?? (coupon as any).isActive) !== false
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

  // COMBOS & OFFERS
  async getCombos(): Promise<Combo[]> {
    const rawCombos = memoryCombosStore.filter(c => !deletedComboIds.has(c.id) && !deletedComboIds.has(c.id.toLowerCase()));

    // Fast robust product lookup
    const allProducts = (this.productsCache?.data && this.productsCache.data.length > 0)
      ? this.productsCache.data
      : await this.getProducts().catch(() => DEFAULT_PRODUCTS);

    const prodMap = new Map<string, Product>();
    allProducts.forEach(p => {
      if (p.id) {
        prodMap.set(p.id, p);
        prodMap.set(p.id.toLowerCase(), p);
      }
      if (p.sku) {
        prodMap.set(p.sku, p);
        prodMap.set(p.sku.toLowerCase(), p);
      }
    });

    return rawCombos.map(c => {
      const pIds: string[] = Array.isArray(c.productIds) ? c.productIds : [];
      const matchedProds = pIds.map(pid => {
        if (!pid) return null;
        const p = prodMap.get(pid) || prodMap.get(pid.toLowerCase());
        if (p) return p;
        return allProducts.find(item => item.id === pid || item.id.toLowerCase() === pid.toLowerCase() || item.sku === pid) || null;
      }).filter(Boolean) as Product[];

      return {
        id: c.id,
        title: c.title,
        subtitle: c.subtitle || undefined,
        badge: c.badge || 'COMBO OFFER',
        productIds: pIds,
        products: matchedProds,
        originalPrice: Number(c.originalPrice || 0),
        comboPrice: Number(c.comboPrice || 0),
        discountPercent: c.discountPercent || (c.originalPrice > c.comboPrice ? Math.round(((c.originalPrice - c.comboPrice) / c.originalPrice) * 100) : 0),
        imageUrl: c.imageUrl || (matchedProds[0]?.images?.[0] || undefined),
        active: c.active !== false,
        order: c.order || 1,
        freeDelivery: c.freeDelivery === true,
        createdAt: c.createdAt ? (typeof c.createdAt === 'string' ? c.createdAt : (c.createdAt as any).toISOString?.() || String(c.createdAt)) : new Date().toISOString(),
        updatedAt: c.updatedAt ? (typeof c.updatedAt === 'string' ? c.updatedAt : (c.updatedAt as any).toISOString?.() || String(c.updatedAt)) : new Date().toISOString()
      };
    });
  }

  async getComboById(id: string): Promise<Combo | null> {
    const cleanId = (id || '').trim();
    if (!cleanId || deletedComboIds.has(cleanId) || deletedComboIds.has(cleanId.toLowerCase())) return null;
    const combos = await this.getCombos();
    return combos.find(c => c.id === cleanId || c.id.toLowerCase() === cleanId.toLowerCase()) || null;
  }

  async addCombo(data: Partial<Combo>): Promise<Combo> {
    const id = data.id || 'combo-' + Date.now();
    const title = (data.title || 'Special Plant Combo').trim();
    const subtitle = (data.subtitle || '').trim();
    const badge = (data.badge || 'COMBO OFFER').trim();
    const productIds = Array.isArray(data.productIds) ? data.productIds : [];
    const originalPrice = Number(data.originalPrice || 0);
    const comboPrice = Number(data.comboPrice || 0);
    const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - comboPrice) / originalPrice) * 100) : 0;
    const imageUrl = data.imageUrl || undefined;
    const active = data.active !== false;
    const freeDelivery = data.freeDelivery === true;

    const allProducts = (this.productsCache?.data && this.productsCache.data.length > 0)
      ? this.productsCache.data
      : await this.getProducts().catch(() => DEFAULT_PRODUCTS);

    const prodMap = new Map<string, Product>();
    allProducts.forEach(p => {
      if (p.id) {
        prodMap.set(p.id, p);
        prodMap.set(p.id.toLowerCase(), p);
      }
      if (p.sku) {
        prodMap.set(p.sku, p);
      }
    });

    const matchedProds = productIds.map(pid => {
      if (!pid) return null;
      return prodMap.get(pid) || prodMap.get(pid.toLowerCase()) || allProducts.find(p => p.id === pid || p.sku === pid) || null;
    }).filter(Boolean) as Product[];

    const newCombo: Combo = {
      id,
      title,
      subtitle,
      badge,
      productIds,
      products: matchedProds,
      originalPrice,
      comboPrice,
      discountPercent,
      imageUrl: imageUrl || matchedProds[0]?.images?.[0] || '/products/double-delight.jpeg',
      active,
      freeDelivery,
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Instant 0ms in-memory & disk save
    memoryCombosStore.unshift(newCombo);
    saveDiskCombos(memoryCombosStore);
    deletedComboIds.delete(id);
    deletedComboIds.delete(id.toLowerCase());
    saveDiskDeletedCombos(deletedComboIds);

    // 2. Safe async sync with Prisma
    const prisma = getPrismaClient();
    if (prisma) {
      prisma.combo.upsert({
        where: { id },
        update: {
          title,
          subtitle,
          badge,
          productIds,
          originalPrice,
          comboPrice,
          discountPercent,
          imageUrl: newCombo.imageUrl,
          active,
          freeDelivery
        },
        create: {
          id,
          title,
          subtitle,
          badge,
          productIds,
          originalPrice,
          comboPrice,
          discountPercent,
          imageUrl: newCombo.imageUrl,
          active,
          freeDelivery
        }
      }).catch(err => console.error('Prisma addCombo background error:', err));
    }

    return newCombo;
  }

  async updateCombo(id: string, updates: Partial<Combo>): Promise<Combo | null> {
    const cleanId = (id || '').trim();
    if (!cleanId) return null;

    const cleanImg = updates.imageUrl !== undefined ? updates.imageUrl : (updates as any).image;
    if (cleanImg !== undefined) updates.imageUrl = cleanImg;

    const allProducts = (this.productsCache?.data && this.productsCache.data.length > 0)
      ? this.productsCache.data
      : await this.getProducts().catch(() => DEFAULT_PRODUCTS);

    const prodMap = new Map<string, Product>();
    allProducts.forEach(p => {
      if (p.id) {
        prodMap.set(p.id, p);
        prodMap.set(p.id.toLowerCase(), p);
      }
      if (p.sku) prodMap.set(p.sku, p);
    });

    let existingIdx = memoryCombosStore.findIndex(c => c.id === cleanId || c.id.toLowerCase() === cleanId.toLowerCase());
    let current = existingIdx !== -1 ? memoryCombosStore[existingIdx] : null;

    const origPrice = updates.originalPrice !== undefined ? Number(updates.originalPrice) : (current?.originalPrice || 0);
    const cmbPrice = updates.comboPrice !== undefined ? Number(updates.comboPrice) : (current?.comboPrice || 0);
    const disPercent = origPrice > 0 ? Math.round(((origPrice - cmbPrice) / origPrice) * 100) : 0;
    const pIds = updates.productIds !== undefined ? updates.productIds : (current?.productIds || []);
    const matchedProds = pIds.map(pid => {
      if (!pid) return null;
      return prodMap.get(pid) || prodMap.get(pid.toLowerCase()) || allProducts.find(p => p.id === pid || p.sku === pid) || null;
    }).filter(Boolean) as Product[];

    const updatedCombo: Combo = {
      ...(current || {
        id: cleanId,
        title: 'Plant Combo',
        badge: 'COMBO OFFER',
        productIds: [],
        originalPrice: origPrice,
        comboPrice: cmbPrice,
        discountPercent: disPercent,
        active: true,
        freeDelivery: false,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }),
      ...updates,
      id: cleanId,
      originalPrice: origPrice,
      comboPrice: cmbPrice,
      discountPercent: disPercent,
      productIds: pIds,
      products: matchedProds,
      updatedAt: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      memoryCombosStore[existingIdx] = updatedCombo;
    } else {
      memoryCombosStore.unshift(updatedCombo);
    }
    saveDiskCombos(memoryCombosStore);
    deletedComboIds.delete(cleanId);
    deletedComboIds.delete(cleanId.toLowerCase());

    // Safe async sync with Prisma
    const prisma = getPrismaClient();
    if (prisma) {
      prisma.combo.upsert({
        where: { id: cleanId },
        create: {
          id: cleanId,
          title: updatedCombo.title,
          subtitle: updatedCombo.subtitle,
          badge: updatedCombo.badge || 'COMBO OFFER',
          productIds: updatedCombo.productIds,
          originalPrice: updatedCombo.originalPrice,
          comboPrice: updatedCombo.comboPrice,
          discountPercent: updatedCombo.discountPercent,
          imageUrl: updatedCombo.imageUrl,
          active: updatedCombo.active,
          freeDelivery: updatedCombo.freeDelivery
        },
        update: {
          ...(updates.title ? { title: updates.title } : {}),
          ...(updates.subtitle !== undefined ? { subtitle: updates.subtitle } : {}),
          ...(updates.badge ? { badge: updates.badge } : {}),
          ...(updates.productIds ? { productIds: updates.productIds } : {}),
          ...(updates.originalPrice !== undefined ? { originalPrice: origPrice } : {}),
          ...(updates.comboPrice !== undefined ? { comboPrice: cmbPrice, discountPercent: disPercent } : {}),
          ...(updates.imageUrl !== undefined ? { imageUrl: updates.imageUrl } : {}),
          ...(updates.active !== undefined ? { active: updates.active } : {}),
          ...(updates.freeDelivery !== undefined ? { freeDelivery: updates.freeDelivery } : {})
        }
      }).catch(err => console.error('Prisma updateCombo background error:', err));
    }

    return updatedCombo;
  }

  async deleteCombo(id: string): Promise<boolean> {
    const cleanId = (id || '').trim();
    if (!cleanId) return false;

    deletedComboIds.add(cleanId);
    deletedComboIds.add(cleanId.toLowerCase());
    saveDiskDeletedCombos(deletedComboIds);

    // 1. Instant 0ms remove from in-memory store
    for (let i = memoryCombosStore.length - 1; i >= 0; i--) {
      if (memoryCombosStore[i].id === cleanId || memoryCombosStore[i].id.toLowerCase() === cleanId.toLowerCase()) {
        memoryCombosStore.splice(i, 1);
      }
    }

    // 2. Instant save to disk
    saveDiskCombos(memoryCombosStore);

    // 3. Remove from default seed combos
    for (let i = DEFAULT_COMBOS.length - 1; i >= 0; i--) {
      if (DEFAULT_COMBOS[i].id === cleanId || DEFAULT_COMBOS[i].id.toLowerCase() === cleanId.toLowerCase()) {
        DEFAULT_COMBOS.splice(i, 1);
      }
    }

    // 4. Safe async delete from Prisma
    const prisma = getPrismaClient();
    if (prisma) {
      prisma.combo.deleteMany({
        where: {
          OR: [
            { id: cleanId },
            { id: cleanId.toLowerCase() }
          ]
        }
      }).catch(err => {
        console.error('Prisma deleteCombo background error:', err);
      });
    }
    return true;
  }

  async deleteAllCombos(): Promise<boolean> {
    DEFAULT_COMBOS.forEach(c => {
      deletedComboIds.add(c.id);
      deletedComboIds.add(c.id.toLowerCase());
    });
    memoryCombosStore.forEach(c => {
      deletedComboIds.add(c.id);
      deletedComboIds.add(c.id.toLowerCase());
    });
    saveDiskDeletedCombos(deletedComboIds);
    memoryCombosStore.length = 0;
    DEFAULT_COMBOS.length = 0;
    saveDiskCombos(memoryCombosStore);
    const prisma = getPrismaClient();
    if (prisma) {
      prisma.combo.deleteMany().catch(() => {});
    }
    return true;
  }

  // REVIEWS
  private memoryReviews: Review[] = loadDiskReviews();

  async getReviews(productId?: string): Promise<Review[]> {
    if (productId) {
      return this.memoryReviews.filter(r => r && r.productId === productId);
    }
    return this.memoryReviews;
  }

  async addReview(reviewData: Partial<Review>): Promise<Review> {
    const id = reviewData.id || 'rev-' + Date.now();
    const newReview: Review = {
      id,
      productId: reviewData.productId || 'custom',
      productName: reviewData.productName || 'Nursery Plant',
      userName: reviewData.userName || 'Verified Customer',
      location: reviewData.location || 'Tamil Nadu',
      rating: reviewData.rating || 5,
      title: reviewData.title || `${reviewData.rating || 5} Star Review`,
      comment: reviewData.comment || '',
      imageUrl: reviewData.imageUrl,
      status: reviewData.status || 'APPROVED',
      reply: reviewData.reply,
      isVerified: reviewData.isVerified ?? true,
      featured: reviewData.featured ?? true,
      createdAt: reviewData.createdAt || new Date().toISOString().split('T')[0]
    };

    this.memoryReviews = [newReview, ...this.memoryReviews.filter(r => r.id !== id)];
    saveDiskReviews(this.memoryReviews);
    return newReview;
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review | null> {
    const idx = this.memoryReviews.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.memoryReviews[idx] = { ...this.memoryReviews[idx], ...updates };
      saveDiskReviews(this.memoryReviews);
    }
    return this.memoryReviews.find(r => r.id === id) || null;
  }

  async deleteReview(id: string): Promise<boolean> {
    this.memoryReviews = this.memoryReviews.filter(r => r && r.id !== id);
    const defIdx = DEFAULT_REVIEWS_SEED.findIndex(r => r.id === id);
    if (defIdx !== -1) DEFAULT_REVIEWS_SEED.splice(defIdx, 1);
    saveDiskReviews(this.memoryReviews);
    return true;
  }

  // SITE SETTINGS
  private settingsCache: { data: SiteSettings; expiresAt: number } | null = null;

  invalidateSettingsCache() {
    this.settingsCache = null;
  }

  async getSettings(): Promise<SiteSettings> {
    if (this.settingsCache && Date.now() < this.settingsCache.expiresAt) {
      return this.settingsCache.data;
    }

    const prisma = getPrismaClient();
    const memory = (globalThis as any)._globalMemorySettings || {};
    if (!prisma) {
      const res = { ...DEFAULT_SETTINGS, ...memory };
      this.settingsCache = { data: res, expiresAt: Date.now() + 60000 };
      return res;
    }

    try {
      const s = await prisma.siteSetting.findUnique({
        where: { id: 'default' }
      });

      if (!s) {
        const res = { ...DEFAULT_SETTINGS, ...memory };
        this.settingsCache = { data: res, expiresAt: Date.now() + 60000 };
        return res;
      }

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
        enableRazorpay: meta.enableRazorpay !== undefined ? meta.enableRazorpay : ((s as any).enableRazorpay ?? true),
        enablePhonePe: meta.enablePhonePe !== undefined ? meta.enablePhonePe : true,
        enableCod: meta.enableCod !== undefined ? meta.enableCod : true,
        enableQrPayment: meta.enableQrPayment !== undefined ? meta.enableQrPayment : true,
        upiId: meta.upiId ?? '7200826129@ybl',
        upiName: meta.upiName ?? 'Veerika Rose Garden Nursery',
        qrCodeImageUrl: meta.qrCodeImageUrl ?? '/nursery-qr.svg',
        razorpayKeyId: (meta.razorpayKeyId && meta.razorpayKeyId.trim()) ? meta.razorpayKeyId.trim() : ((s as any).razorpayKeyId || process.env.RAZORPAY_KEY_ID || DEFAULT_SETTINGS.razorpayKeyId || ''),
        razorpayKeySecret: (meta.razorpayKeySecret && meta.razorpayKeySecret.trim()) ? meta.razorpayKeySecret.trim() : ((s as any).razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || DEFAULT_SETTINGS.razorpayKeySecret || '')
      };

      (globalThis as any)._globalMemorySettings = merged;
      this.settingsCache = { data: merged, expiresAt: Date.now() + 60000 };
      return merged;
    } catch (err) {
      console.error('Prisma getSettings error:', err);
      const res = { ...DEFAULT_SETTINGS, ...memory };
      this.settingsCache = { data: res, expiresAt: Date.now() + 60000 };
      return res;
    }
  }

  async updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
    this.invalidateSettingsCache();
    if (updates.razorpayKeyId) updates.razorpayKeyId = updates.razorpayKeyId.trim();
    if (updates.razorpayKeySecret) updates.razorpayKeySecret = updates.razorpayKeySecret.trim();
    const current = await this.getSettings();
    const merged: SiteSettings = {
      ...current,
      ...updates
    };

    (globalThis as any)._globalMemorySettings = merged;
    this.settingsCache = { data: merged, expiresAt: Date.now() + 60000 };

    const prisma = getPrismaClient();

    if (prisma) {
      try {
        const metaToStore: CustomMetaSettings = {
          enableRazorpay: merged.enableRazorpay,
          enablePhonePe: merged.enablePhonePe,
          enableCod: merged.enableCod,
          enableQrPayment: merged.enableQrPayment,
          upiId: merged.upiId,
          upiName: merged.upiName,
          qrCodeImageUrl: merged.qrCodeImageUrl,
          qrInstructions: merged.qrInstructions,
          razorpayKeyId: merged.razorpayKeyId,
          razorpayKeySecret: merged.razorpayKeySecret
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
    // Determine next sequential Order ID starting from 0 (ORD-0, ORD-1, ORD-2...)
    const existingOrders = await this.getOrders();
    let maxNum = -1;
    for (const o of existingOrders) {
      if (o && o.id) {
        // extract numeric part of order ID
        const match = o.id.match(/^ORD-(\d+)$/i) || o.id.match(/^(\d+)$/i) || o.id.match(/(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num < 1000000 && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }

    const nextIndex = maxNum + 1; // Starts at 0 if no previous ORD-N orders exist
    const id = `ORD-${nextIndex}`;
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

          // Pack paymentProofUrl and options into notes column for persistence
          const notesPayload = JSON.stringify({
            proof: order.paymentProofUrl || null,
            txnId: order.transactionId || null,
            packingOption: order.packingOption || 'STANDARD',
            packingCharge: order.packingCharge || 0,
            potOption: order.potOption || null,
            potCharge: order.potCharge || 0,
            courierName: order.courierName || null,
            courierDistrict: order.courierDistrict || null,
            courierBranch: order.courierBranch || null
          });

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
    this.invalidateOrdersCache();
    return order;
  }

  private ordersCache: { data: Order[]; expiresAt: number } | null = null;

  invalidateOrdersCache() {
    this.ordersCache = null;
  }

  async getOrders(userId?: string): Promise<Order[]> {
    if (!userId && this.ordersCache && Date.now() < this.ordersCache.expiresAt) {
      return this.ordersCache.data;
    }

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

          // Unpack paymentProofUrl, transactionId, packing and courier options from notes
          const notesStr = (o as any).notes || '';
          let unpackedProofUrl: string | undefined = undefined;
          let unpackedTxnId: string | undefined = undefined;
          let unpackedPackingOption: string | undefined = undefined;
          let unpackedPackingCharge: number | undefined = undefined;
          let unpackedPotOption: string | undefined = undefined;
          let unpackedPotCharge: number | undefined = undefined;
          let unpackedCourierDistrict: string | undefined = undefined;
          let unpackedCourierBranch: string | undefined = undefined;
          let parsedCourierFromNotes: string | undefined = undefined;

          if (notesStr.startsWith('{') && notesStr.endsWith('}')) {
            try {
              const pNotes = JSON.parse(notesStr);
              if (pNotes.proof) unpackedProofUrl = pNotes.proof;
              if (pNotes.txnId) unpackedTxnId = pNotes.txnId;
              if (pNotes.packingOption) unpackedPackingOption = pNotes.packingOption;
              if (pNotes.packingCharge !== undefined) unpackedPackingCharge = pNotes.packingCharge;
              if (pNotes.potOption) unpackedPotOption = pNotes.potOption;
              if (pNotes.potCharge !== undefined) unpackedPotCharge = pNotes.potCharge;
              if (pNotes.courierName) parsedCourierFromNotes = pNotes.courierName;
              if (pNotes.courierDistrict) unpackedCourierDistrict = pNotes.courierDistrict;
              if (pNotes.courierBranch) unpackedCourierBranch = pNotes.courierBranch;
            } catch {}
          } else if (notesStr.includes('|||PROOF|||')) {
            const proofMatch = notesStr.split('|||PROOF|||')[1]?.split('|||TXNID|||')[0];
            const txnMatch = notesStr.split('|||TXNID|||')[1];
            if (proofMatch) unpackedProofUrl = proofMatch.trim();
            if (txnMatch) unpackedTxnId = txnMatch.trim();
          } else if (notesStr.includes('|||TXNID|||')) {
            const txnMatch = notesStr.split('|||TXNID|||')[1];
            if (txnMatch) unpackedTxnId = txnMatch.trim();
          }

          const rawTracking = (o as any).trackingNumber || '';
          let parsedCourier: string | undefined = parsedCourierFromNotes;
          let parsedTracking: string | undefined = rawTracking || undefined;
          if (rawTracking.includes(' | ')) {
            const parts = rawTracking.split(' | ');
            parsedCourier = parts[0]?.trim();
            parsedTracking = parts[1]?.trim();
          }

          const hasProof = Boolean(unpackedProofUrl);
          const stStr = String(o.status || '').toUpperCase();
          const dbOrderStatus: Order['orderStatus'] = (stStr === 'DELIVERED' || stStr === 'COMPLETED'
            ? 'DELIVERED' 
            : stStr === 'DISPATCHED' || stStr === 'OUT_FOR_DELIVERY' || stStr === 'SHIPPED'
            ? 'DISPATCHED' 
            : stStr === 'PACKING' || stStr === 'PACKED' || stStr === 'PROCESSING'
            ? 'PROCESSING' 
            : stStr === 'PAID' || stStr === 'CONFIRMED'
            ? 'CONFIRMED' 
            : stStr === 'CANCELLED' 
            ? 'CANCELLED' 
            : 'PENDING');

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
            orderStatus: dbOrderStatus,
            paymentStatus: o.paymentStatus === 'SUCCESS' ? 'SUCCESS' : o.paymentStatus === 'FAILED' ? 'FAILED' : 'PENDING',
            paymentMethod: ((o as any).paymentMethod === 'COD' 
              ? 'COD' 
              : ((o as any).paymentMethod === 'UPI' || (o as any).paymentMethod === 'QR_PAYMENT' || hasProof)
              ? 'QR_PAYMENT'
              : 'PHONEPE') as PaymentMethod,
            paymentProofUrl: unpackedProofUrl,
            transactionId: unpackedTxnId || o.merchantTransactionId || '',
            merchantTransactionId: o.merchantTransactionId || '',
            trackingNumber: parsedTracking,
            courierName: parsedCourier,
            potOption: unpackedPotOption,
            potCharge: unpackedPotCharge,
            packingOption: unpackedPackingOption,
            packingCharge: unpackedPackingCharge,
            courierDistrict: unpackedCourierDistrict,
            courierBranch: unpackedCourierBranch,
            createdAt: o.createdAt.toISOString(),
            updatedAt: o.updatedAt.toISOString()
          };
        });
      } catch (err) {
        console.error('Prisma getOrders error:', err);
      }
    }

    const gBuffer = ((globalThis as any).globalMemoryOrdersBuffer || []) as Order[];
    const diskOrders = loadDiskOrders();
    const defOrders = (typeof DEFAULT_ORDERS !== 'undefined' ? DEFAULT_ORDERS : []) as Order[];

    // Fast-path: Only block on Firestore if both Database and memory buffers are completely empty
    let fsOrders: Order[] = [];
    if (dbOrders.length === 0 && this.memoryOrders.length === 0 && gBuffer.length === 0 && diskOrders.length === 0) {
      fsOrders = await firestoreGetAllOrders().catch(() => []) as Order[];
    } else {
      // Non-blocking background Firestore sync to prevent blocking the admin bootstrap API
      firestoreGetAllOrders().then((fOrders) => {
        if (Array.isArray(fOrders) && fOrders.length > 0) {
          fOrders.forEach(fo => {
            if (fo && fo.id && !this.memoryOrders.some(m => m.id === fo.id)) {
              this.memoryOrders.push(fo);
            }
          });
        }
      }).catch(() => {});
    }

    // Priority order: in-memory updated orders first, then global buffer, db, firestore, disk, defaults
    const allCombined = [...this.memoryOrders, ...gBuffer, ...dbOrders, ...fsOrders, ...diskOrders, ...defOrders];
    const uniqueMap = new Map<string, Order>();
    allCombined.forEach(o => {
      if (o && o.id && !deletedOrderIds.has(o.id) && !deletedOrderIds.has(o.merchantTransactionId)) {
        const existing = uniqueMap.get(o.id);
        if (!existing) {
          uniqueMap.set(o.id, o);
        } else {
          // Compare updatedAt timestamps to pick the fresher status
          const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
          const incomingTime = o.updatedAt ? new Date(o.updatedAt).getTime() : 0;
          const fresher = incomingTime >= existingTime ? o : existing;
          const older = incomingTime >= existingTime ? existing : o;

          uniqueMap.set(o.id, {
            ...older,
            ...fresher,
            orderStatus: fresher.orderStatus || older.orderStatus,
            paymentStatus: fresher.paymentStatus || older.paymentStatus,
            trackingNumber: fresher.trackingNumber || older.trackingNumber,
            courierName: fresher.courierName || older.courierName,
            paymentProofUrl: fresher.paymentProofUrl || older.paymentProofUrl,
            deliveryNotes: fresher.deliveryNotes || (older as any).deliveryNotes
          });
        }
      }
    });
    const result = Array.from(uniqueMap.values());
    if (!userId) {
      this.ordersCache = { data: result, expiresAt: Date.now() + 60000 };
    }
    return result;
  }

  async deleteOrder(id: string): Promise<boolean> {
    this.invalidateOrdersCache();
    const clean = (id || '').trim();
    if (clean) {
      deletedOrderIds.add(clean);
    }
    this.memoryOrders = this.memoryOrders.filter(o => o.id !== clean && o.merchantTransactionId !== clean);
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await prisma.orderItem.deleteMany({
          where: {
            order: {
              OR: [
                { id: clean },
                { orderNumber: clean },
                { merchantTransactionId: clean }
              ]
            }
          }
        }).catch(() => {});

        await prisma.payment.deleteMany({
          where: {
            order: {
              OR: [
                { id: clean },
                { orderNumber: clean },
                { merchantTransactionId: clean }
              ]
            }
          }
        }).catch(() => {});

        await prisma.order.deleteMany({
          where: {
            OR: [
              { id: clean },
              { orderNumber: clean },
              { merchantTransactionId: clean }
            ]
          }
        }).catch(() => {});
      } catch (err) {
        console.error('Prisma deleteOrder error:', err);
      }
    }
    return true;
  }


  async getOrderById(id: string): Promise<Order | null> {
    const clean = (id || '').trim().toLowerCase();
    const memMatch = this.memoryOrders.find(o => 
      (o.id && o.id.toLowerCase() === clean) ||
      (o.merchantTransactionId && o.merchantTransactionId.toLowerCase() === clean) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase() === clean)
    );

    const prisma = getPrismaClient();
    if (!prisma) {
      return memMatch || null;
    }

    try {
      const o = await prisma.order.findFirst({
        where: {
          OR: [
            { id: { equals: id, mode: 'insensitive' } },
            { orderNumber: { equals: id, mode: 'insensitive' } },
            { merchantTransactionId: { equals: id, mode: 'insensitive' } },
            { trackingNumber: { contains: id, mode: 'insensitive' } }
          ]
        },
        include: { items: { include: { product: true } } }
      });

      if (!o) return memMatch || null;

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

      // Unpack notes
      const notesStr = (o as any).notes || '';
      let unpackedProofUrl: string | undefined = undefined;
      let unpackedTxnId: string | undefined = undefined;
      let unpackedPackingOption: string | undefined = undefined;
      let unpackedPackingCharge: number | undefined = undefined;
      let unpackedPotOption: string | undefined = undefined;
      let unpackedPotCharge: number | undefined = undefined;
      let unpackedCourierDistrict: string | undefined = undefined;
      let unpackedCourierBranch: string | undefined = undefined;
      let parsedCourierFromNotes: string | undefined = undefined;

      if (notesStr.startsWith('{') && notesStr.endsWith('}')) {
        try {
          const pNotes = JSON.parse(notesStr);
          if (pNotes.proof) unpackedProofUrl = pNotes.proof;
          if (pNotes.txnId) unpackedTxnId = pNotes.txnId;
          if (pNotes.packingOption) unpackedPackingOption = pNotes.packingOption;
          if (pNotes.packingCharge !== undefined) unpackedPackingCharge = pNotes.packingCharge;
          if (pNotes.potOption) unpackedPotOption = pNotes.potOption;
          if (pNotes.potCharge !== undefined) unpackedPotCharge = pNotes.potCharge;
          if (pNotes.courierName) parsedCourierFromNotes = pNotes.courierName;
          if (pNotes.courierDistrict) unpackedCourierDistrict = pNotes.courierDistrict;
          if (pNotes.courierBranch) unpackedCourierBranch = pNotes.courierBranch;
        } catch {}
      } else if (notesStr.includes('|||PROOF|||')) {
        const proofMatch = notesStr.split('|||PROOF|||')[1]?.split('|||TXNID|||')[0];
        const txnMatch = notesStr.split('|||TXNID|||')[1];
        if (proofMatch) unpackedProofUrl = proofMatch.trim();
        if (txnMatch) unpackedTxnId = txnMatch.trim();
      } else if (notesStr.includes('|||TXNID|||')) {
        const txnMatch = notesStr.split('|||TXNID|||')[1];
        if (txnMatch) unpackedTxnId = txnMatch.trim();
      }

      const rawTracking = (o as any).trackingNumber || '';
      let parsedCourier: string | undefined = parsedCourierFromNotes;
      let parsedTracking: string | undefined = rawTracking || undefined;
      if (rawTracking.includes(' | ')) {
        const parts = rawTracking.split(' | ');
        parsedCourier = parts[0]?.trim();
        parsedTracking = parts[1]?.trim();
      }

      const hasProof = Boolean(unpackedProofUrl);
      const stStr = String(o.status || '').toUpperCase();
      const dbStatus: Order['orderStatus'] = (stStr === 'DELIVERED' || stStr === 'COMPLETED'
        ? 'DELIVERED' 
        : stStr === 'DISPATCHED' || stStr === 'OUT_FOR_DELIVERY' || stStr === 'SHIPPED'
        ? 'DISPATCHED' 
        : stStr === 'PACKING' || stStr === 'PACKED' || stStr === 'PROCESSING'
        ? 'PROCESSING' 
        : stStr === 'PAID' || stStr === 'CONFIRMED'
        ? 'CONFIRMED' 
        : stStr === 'CANCELLED' 
        ? 'CANCELLED' 
        : 'PENDING');

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
        orderStatus: dbStatus,
        paymentStatus: o.paymentStatus === 'SUCCESS' ? 'SUCCESS' : o.paymentStatus === 'FAILED' ? 'FAILED' : 'PENDING',
        paymentMethod: ((o as any).paymentMethod === 'COD' 
          ? 'COD' 
          : ((o as any).paymentMethod === 'UPI' || (o as any).paymentMethod === 'QR_PAYMENT' || hasProof)
          ? 'QR_PAYMENT'
          : 'PHONEPE') as PaymentMethod,
        paymentProofUrl: unpackedProofUrl || memMatch?.paymentProofUrl,
        transactionId: unpackedTxnId || o.merchantTransactionId || '',
        merchantTransactionId: o.merchantTransactionId || '',
        trackingNumber: parsedTracking || (memMatch as any)?.trackingNumber,
        courierName: parsedCourier || (memMatch as any)?.courierName,
        potOption: unpackedPotOption || memMatch?.potOption,
        potCharge: unpackedPotCharge !== undefined ? unpackedPotCharge : memMatch?.potCharge,
        packingOption: unpackedPackingOption || memMatch?.packingOption,
        packingCharge: unpackedPackingCharge !== undefined ? unpackedPackingCharge : memMatch?.packingCharge,
        courierDistrict: unpackedCourierDistrict || memMatch?.courierDistrict,
        courierBranch: unpackedCourierBranch || memMatch?.courierBranch,
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
    const cleanId = (orderId || '').trim().toLowerCase();
    let memOrder = this.memoryOrders.find(o => 
      (o.id && o.id.toLowerCase() === cleanId) || 
      (o.merchantTransactionId && o.merchantTransactionId.toLowerCase() === cleanId)
    );

    if (!memOrder) {
      memOrder = {
        id: orderId,
        merchantTransactionId: 'MT' + Date.now(),
        customerName: 'Customer',
        customerPhone: '',
        customerEmail: '',
        shippingAddress: { fullName: 'Customer', phone: '', houseNo: '', street: '', villageTown: '', district: '', state: 'Tamil Nadu', pincode: '', addressType: 'Home' },
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
      this.memoryOrders.unshift(memOrder);
    } else {
      if (status) memOrder.orderStatus = status;
      if (paymentStatus) memOrder.paymentStatus = paymentStatus as any;
      if (trackingNumber !== undefined) (memOrder as any).trackingNumber = trackingNumber;
      if (courierName !== undefined) (memOrder as any).courierName = courierName;
      if (paymentProofUrl) {
        memOrder.paymentProofUrl = paymentProofUrl;
        memOrder.paymentMethod = 'QR_PAYMENT';
      }
      memOrder.updatedAt = new Date().toISOString();
    }

    // Update in global buffer and cache
    if (!(globalThis as any).globalMemoryOrdersBuffer) (globalThis as any).globalMemoryOrdersBuffer = [];
    const gBuffer = (globalThis as any).globalMemoryOrdersBuffer as Order[];
    const gIndex = gBuffer.findIndex(o => (o.id && o.id.toLowerCase() === cleanId) || (o.merchantTransactionId && o.merchantTransactionId.toLowerCase() === cleanId));
    if (gIndex !== -1) {
      gBuffer[gIndex] = { ...gBuffer[gIndex], ...memOrder };
    } else {
      gBuffer.unshift(memOrder);
    }

    if (typeof DEFAULT_ORDERS !== 'undefined') {
      const defIdx = DEFAULT_ORDERS.findIndex(o => (o.id && o.id.toLowerCase() === cleanId) || (o.merchantTransactionId && o.merchantTransactionId.toLowerCase() === cleanId));
      if (defIdx !== -1) {
        DEFAULT_ORDERS[defIdx] = { ...DEFAULT_ORDERS[defIdx], ...memOrder };
      }
    }

    if (this.ordersCache && this.ordersCache.data) {
      this.ordersCache.data = this.ordersCache.data.map(o => 
        ((o.id && o.id.toLowerCase() === cleanId) || (o.merchantTransactionId && o.merchantTransactionId.toLowerCase() === cleanId)) 
          ? { ...o, ...memOrder } 
          : o
      );
    }
    this.invalidateOrdersCache();

    const prisma = getPrismaClient();
    if (prisma) {
      const dbStatus = status === 'DELIVERED' 
        ? 'DELIVERED' 
        : (status === 'PACKED' || status === 'PROCESSING') 
        ? 'PACKING' 
        : status === 'CANCELLED' 
        ? 'CANCELLED' 
        : status === 'DISPATCHED' 
        ? 'DISPATCHED' 
        : (status === 'CONFIRMED' ? 'PAID' : 'PENDING');

      const dbPayment = paymentStatus === 'SUCCESS' ? 'SUCCESS' : paymentStatus === 'FAILED' ? 'FAILED' : undefined;
      const finalTracking = trackingNumber ? `${courierName ? courierName + ' | ' : ''}${trackingNumber}` : undefined;

      prisma.order.updateMany({
        where: {
          OR: [
            { id: { equals: orderId, mode: 'insensitive' } },
            { orderNumber: { equals: orderId, mode: 'insensitive' } },
            { merchantTransactionId: { equals: orderId, mode: 'insensitive' } }
          ]
        },
        data: {
          status: dbStatus as any,
          updatedAt: new Date(),
          ...(dbPayment ? { paymentStatus: dbPayment as any } : {}),
          ...(finalTracking ? { trackingNumber: finalTracking } : {})
        }
      }).catch(err => console.warn('Prisma background updateOrderStatus notice:', err?.message));
    }

    // Non-blocking Firestore sync in background
    firestoreUpdateOrder(orderId, {
      orderStatus: status,
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(trackingNumber ? { trackingNumber } : {}),
      ...(courierName ? { courierName } : {})
    }).catch(() => {});

    return memOrder;
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
  private dashboardStatsCache: { data: any; expiresAt: number } | null = null;

  invalidateDashboardStatsCache() {
    this.dashboardStatsCache = null;
  }

  async getDashboardStats(existingOrders?: Order[], existingProducts?: Product[]) {
    const isRevenueOrder = (o: any) => {
      const pStatus = (o.paymentStatus || '').toString().toUpperCase();
      const oStatus = (o.orderStatus || o.status || '').toString().toUpperCase();
      return pStatus === 'SUCCESS' || pStatus === 'PAID' || pStatus === 'APPROVED' || oStatus === 'DELIVERED' || oStatus === 'COMPLETED';
    };

    // Fast-path: When existingOrders is passed (like in /api/admin/bootstrap), compute stats in 0.001ms directly in RAM!
    if (existingOrders) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const paidOrders = existingOrders.filter(isRevenueOrder);
      const lowStockProducts = (existingProducts || []).filter(p => (p.stock !== undefined ? p.stock <= 10 : false)).map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock
      }));

      const res = {
        totalOrders: existingOrders.length,
        totalRevenue: paidOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0),
        todaySales: paidOrders.filter(o => new Date(o.createdAt) >= todayStart).reduce((sum, o) => sum + (o.grandTotal || 0), 0),
        pendingOrders: existingOrders.filter(o => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED').length,
        completedOrders: existingOrders.filter(o => o.orderStatus === 'DELIVERED').length,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        recentOrders: existingOrders.slice(0, 10)
      };
      return res;
    }

    if (this.dashboardStatsCache && Date.now() < this.dashboardStatsCache.expiresAt) {
      return this.dashboardStatsCache.data;
    }

    const prisma = getPrismaClient();
    if (!prisma) {
      const allOrders = this.memoryOrders;
      const paidOrders = allOrders.filter(isRevenueOrder);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const res = {
        totalOrders: allOrders.length,
        totalRevenue: paidOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0),
        todaySales: paidOrders.filter(o => new Date(o.createdAt) >= todayStart).reduce((sum, o) => sum + (o.grandTotal || 0), 0),
        pendingOrders: allOrders.filter(o => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED').length,
        completedOrders: allOrders.filter(o => o.orderStatus === 'DELIVERED').length,
        lowStockCount: 0,
        lowStockProducts: [],
        recentOrders: allOrders.slice(0, 10)
      };
      this.dashboardStatsCache = { data: res, expiresAt: Date.now() + 60000 };
      return res;
    }

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const recentOrdersList = await this.getOrders();

      // Execute all 6 DB queries concurrently in parallel
      const [
        totalOrders,
        revenueAgg,
        todayAgg,
        pendingOrders,
        completedOrders,
        lowStockInventories
      ] = await Promise.all([
        prisma.order.count(),
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: {
            OR: [
              { paymentStatus: 'SUCCESS' },
              { status: 'DELIVERED' }
            ]
          }
        }),
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: {
            OR: [
              { paymentStatus: 'SUCCESS' },
              { status: 'DELIVERED' }
            ],
            createdAt: { gte: todayStart }
          }
        }),
        prisma.order.count({
          where: { status: { in: ['PENDING', 'PACKING', 'DISPATCHED'] } }
        }),
        prisma.order.count({
          where: { status: 'DELIVERED' }
        }),
        prisma.inventory.findMany({
          where: { quantity: { lte: 10 } },
          include: { product: true }
        })
      ]);

      let totalRevenue = revenueAgg._sum.totalAmount || 0;
      let todaySales = todayAgg._sum.totalAmount || 0;

      if (recentOrdersList.length > 0) {
        const calculatedRev = recentOrdersList.filter(isRevenueOrder).reduce((sum, o) => sum + (o.grandTotal || 0), 0);
        if (calculatedRev > totalRevenue) {
          totalRevenue = calculatedRev;
        }
        const calculatedToday = recentOrdersList.filter(o => isRevenueOrder(o) && new Date(o.createdAt) >= todayStart).reduce((sum, o) => sum + (o.grandTotal || 0), 0);
        if (calculatedToday > todaySales) {
          todaySales = calculatedToday;
        }
      }

      const lowStockProducts = lowStockInventories.map(i => ({
        id: i.product.id,
        name: i.product.name,
        stock: i.quantity
      }));

      const res = {
        totalOrders,
        totalRevenue,
        todaySales,
        pendingOrders,
        completedOrders,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        recentOrders: recentOrdersList.slice(0, 5)
      };

      this.dashboardStatsCache = { data: res, expiresAt: Date.now() + 60000 };
      return res;
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

export async function prewarmAllCaches(): Promise<void> {
  try {
    const p1 = db.getSettings().catch(() => null);
    const p2 = db.getProducts().catch(() => []);
    const p3 = db.getCategories().catch(() => []);
    const p4 = db.getOrders().catch(() => []);
    const p5 = db.getCoupons().catch(() => []);
    const p6 = db.getBanners().catch(() => []);
    const p7 = db.getCombos().catch(() => []);
    const p8 = db.getReviews().catch(() => []);
    await Promise.all([p1, p2, p3, p4, p5, p6, p7, p8]);
    await db.getDashboardStats().catch(() => null);
    console.log('⚡ All nursery database & catalog caches pre-warmed into fast RAM.');
  } catch (err) {
    console.warn('Cache pre-warm notice:', err);
  }
}
