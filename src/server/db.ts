import fs from 'fs';
import path from 'path';
import { Product, Category, Order, Coupon, Banner, Review, SiteSettings, PaymentLog, OrderItemSnapshot, PaymentMethod, FinancialEntry, Combo } from '../types.js';

import { getPrismaClient, executeInTransaction } from './prisma.js';
import { firestoreSaveOrder, firestoreGetAllOrders, firestoreUpdateOrder, firestoreDeleteOrder } from './firestore.js';

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

const DELETED_ORDERS_STORE_FILE = path.resolve(process.cwd(), 'src/data/deleted_orders.json');

function loadDiskDeletedOrders(): Set<string> {
  try {
    if (fs.existsSync(DELETED_ORDERS_STORE_FILE)) {
      const data = fs.readFileSync(DELETED_ORDERS_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (err) {
    console.error('Error reading deleted_orders.json:', err);
  }
  return new Set();
}

function saveDiskDeletedOrders(ids: Set<string>) {
  try {
    const dir = path.dirname(DELETED_ORDERS_STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DELETED_ORDERS_STORE_FILE, JSON.stringify(Array.from(ids), null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing deleted_orders.json:', err);
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

const DEFAULT_COMBOS_SEED: Combo[] = [];

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

const DELETED_PRODUCTS_STORE_FILE = path.resolve(process.cwd(), 'src/data/deleted_products.json');

function loadDiskDeletedProducts(): Set<string> {
  try {
    if (fs.existsSync(DELETED_PRODUCTS_STORE_FILE)) {
      const data = fs.readFileSync(DELETED_PRODUCTS_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (err) {
    console.error('Error reading deleted_products.json:', err);
  }
  return new Set();
}

function saveDiskDeletedProducts(ids: Set<string>) {
  try {
    const dir = path.dirname(DELETED_PRODUCTS_STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DELETED_PRODUCTS_STORE_FILE, JSON.stringify(Array.from(ids), null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing deleted_products.json:', err);
  }
}

const PRODUCTS_STORE_FILE = path.resolve(process.cwd(), 'src/data/products_store.json');

function loadDiskProducts(): Product[] {
  try {
    if (fs.existsSync(PRODUCTS_STORE_FILE)) {
      const data = fs.readFileSync(PRODUCTS_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading products_store.json:', err);
  }
  return [];
}

function saveDiskProducts(products: Product[]) {
  try {
    const dir = path.dirname(PRODUCTS_STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PRODUCTS_STORE_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing products_store.json:', err);
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
    "id": "cat-combos",
    "name": "Combos & Offers",
    "tamilName": "சேர்க்கை & சலுகைகள் (Combos)",
    "slug": "combos",
    "image": "/products/double-delight.jpeg",
    "description": "Special discounted live plant combo bundles, multi-sapling packages, and seasonal offers.",
    "order": 1,
    "isActive": true,
    "isFeatured": true,
    "productCount": 8
  },
  {
    "id": "cat-rose",
    "name": "Rose Varieties",
    "tamilName": "ரோஜா வகைகள்",
    "slug": "rose-varieties",
    "image": "/categories/rose-varieties.jpg",
    "description": "Premium live hybrid rose plants, double delight & button rose varieties.",
    "order": 2,
    "isActive": true,
    "isFeatured": true,
    "productCount": 15
  },
  {
    "id": "cat-herbals",
    "name": "Herbal Plants",
    "tamilName": "மூலிகை (Herbals)",
    "slug": "herbals",
    "image": "/categories/herbal-plants.jpg",
    "description": "Medicinal plants including Neeli Avuri, Sangu Poo, Aavaram Poo, Vasambu, Vetrilai & Rosemary.",
    "order": 2,
    "isActive": true,
    "isFeatured": true,
    "productCount": 12
  },
  {
    "id": "cat-jasmine",
    "name": "Jasmine Varieties",
    "tamilName": "மல்லி பூ வகைகள் (Jasmine Vts)",
    "slug": "jasmine-varieties",
    "image": "/categories/jasmine-varieties.jpg",
    "description": "Fragrant Raja Malli (10 layer), Mysuru Malli, Pachai Mullai, Kakatan & Jadhi Malli.",
    "order": 3,
    "isActive": true,
    "isFeatured": true,
    "productCount": 8
  },
  {
    "id": "cat-creeper",
    "name": "Creeper Roses",
    "tamilName": "கொடி ரோஸ் வகைகள் (Creeper)",
    "slug": "creeper-roses",
    "image": "/categories/creeper-roses.jpg",
    "description": "Climbing and hanging rose varieties like Creeper Jackie, Red Cascade & Pink Creeper.",
    "order": 4,
    "isActive": true,
    "isFeatured": true,
    "productCount": 6
  },
  {
    "id": "cat-miniature",
    "name": "Miniature Roses",
    "tamilName": "மினியேச்சர் ரோஸ் வகைகள்",
    "slug": "miniature-roses",
    "image": "/categories/miniature-roses.jpg",
    "description": "Compact miniature rose plants for balcony pots, table garden and containers.",
    "order": 5,
    "isActive": true,
    "isFeatured": true,
    "productCount": 4
  },
  {
    "id": "cat-rare",
    "name": "Rare & Exotic Roses",
    "tamilName": "அரிய வகை ரோஜாக்கள் (Rare & Exotic)",
    "slug": "rare-exotic-roses",
    "image": "/categories/exotics-rare-roses.jpg",
    "description": "Exclusive rare varieties like Ink Spot, Teddy Bear, Black Jade, Blue For You, Fireworks Ruffle, Black Magic & Abracadabra.",
    "order": 6,
    "isActive": true,
    "isFeatured": true,
    "productCount": 20
  },
  {
    "id": "cat-fruits",
    "name": "Fruit Plants",
    "tamilName": "பழ மரங்கள் (Fruit Plants)",
    "slug": "fruit-plants",
    "image": "/categories/fruit-plants.jpg",
    "description": "High-yielding live fruit saplings including Black Grapes, Kalapadi Sapota, Miracle Fruit, Water Apple & PKM 1 Moringa.",
    "order": 7,
    "isActive": true,
    "isFeatured": true,
    "productCount": 17
  },
  {
    "id": "cat-flowering",
    "name": "Flowering Plants",
    "tamilName": "பூச்செடிகள் (Flowering Plants)",
    "slug": "flowering-plants",
    "image": "/categories/flowering-plants.jpg",
    "description": "Beautiful fragrant flowering garden plants including Manoranjitham, Parijadham, Krishnakamalam & Shenbagam.",
    "order": 8,
    "isActive": true,
    "isFeatured": true,
    "productCount": 20
  }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    "id": "vrg-creeper-jackie-rose",
    "sku": "VRG-CREE-001",
    "name": "Creeper Jackie Rose",
    "englishName": "Creeper Jackie Rose",
    "tamilName": "ஜாக்கி கொடி ரோஜா",
    "scientificName": "Rosa 'Jackie' Climber",
    "categoryId": "cat-creeper",
    "categoryName": "Creeper Roses",
    "description": "Fast-growing fragrant climbing rose with delicate soft-yellow to cream blooms, ideal for garden arches and pergolas.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 14,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/creeper-jackie-rose.png"
    ],
    "image": "/products/vrg/creeper-jackie-rose.png",
    "imageUrl": "/products/vrg/creeper-jackie-rose.png",
    "plantHeight": "4-6 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "creeper roses",
      "creeper jackie rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-birthday-party-creeper-rose",
    "sku": "VRG-CREE-003",
    "name": "Birthday Party Creeper Rose",
    "englishName": "Birthday Party Creeper Rose",
    "tamilName": "பர்த்டே பார்ட்டி கொடி ரோஜா",
    "scientificName": "Rosa 'Birthday Party'",
    "categoryId": "cat-creeper",
    "categoryName": "Creeper Roses",
    "description": "Vibrant cluster-flowering celebratory climbing rose with rich pastel tones that blooms profusely.",
    "mrp": 120,
    "sellingPrice": 80,
    "discount": 33,
    "stock": 15,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/birthday-party-creeper-rose.png"
    ],
    "image": "/products/vrg/birthday-party-creeper-rose.png",
    "imageUrl": "/products/vrg/birthday-party-creeper-rose.png",
    "plantHeight": "3-5 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "creeper roses",
      "birthday party creeper rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-baby-romantica-creeper-rose",
    "sku": "VRG-CREE-004",
    "name": "Baby Romantica Creeper Rose",
    "englishName": "Baby Romantica Creeper Rose",
    "tamilName": "பேபி ரொமாண்டிகா கொடி ரோஜா",
    "scientificName": "Rosa 'Baby Romantica'",
    "categoryId": "cat-creeper",
    "categoryName": "Creeper Roses",
    "description": "Double petal romantic ochre-yellow and pink blended creeper rose with compact climbing branches.",
    "mrp": 160,
    "sellingPrice": 120,
    "discount": 25,
    "stock": 8,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/baby-romantica-creeper-rose.png"
    ],
    "image": "/products/vrg/baby-romantica-creeper-rose.png",
    "imageUrl": "/products/vrg/baby-romantica-creeper-rose.png",
    "plantHeight": "3-5 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "creeper roses",
      "baby romantica creeper rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-red-cascade-climber-rose",
    "sku": "VRG-CREE-005",
    "name": "Red Cascade Climber Rose",
    "englishName": "Red Cascade Climber Rose",
    "tamilName": "சிவப்பு கொடி ரோஜா (ரெட் காஸ்கேட்)",
    "scientificName": "Rosa 'Red Cascade'",
    "categoryId": "cat-creeper",
    "categoryName": "Creeper Roses",
    "description": "Heavy blooming deep crimson cascading creeper rose producing large sprays of miniature velvety roses.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 6,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/red-cascade-climber-rose.png"
    ],
    "image": "/products/vrg/red-cascade-climber-rose.png",
    "imageUrl": "/products/vrg/red-cascade-climber-rose.png",
    "plantHeight": "5-8 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "creeper roses",
      "red cascade climber rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-suloli-hanging-rose-creeper",
    "sku": "VRG-CREE-006",
    "name": "Suloli Hanging Rose (Creeper)",
    "englishName": "Suloli Hanging Rose (Creeper)",
    "tamilName": "சுலோலி தொங்கும் கொடி ரோஜா",
    "scientificName": "Rosa 'Suloli'",
    "categoryId": "cat-creeper",
    "categoryName": "Creeper Roses",
    "description": "Special drooping branch rose plant ideal for hanging baskets, patio rails, and wall trellis.",
    "mrp": 120,
    "sellingPrice": 80,
    "discount": 33,
    "stock": 5,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/suloli-hanging-rose-creeper.png"
    ],
    "image": "/products/vrg/suloli-hanging-rose-creeper.png",
    "imageUrl": "/products/vrg/suloli-hanging-rose-creeper.png",
    "plantHeight": "2-3 Feet Trailing",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "creeper roses",
      "suloli hanging rose (creeper)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-pink-creeper-rose-bush",
    "sku": "VRG-CREE-007",
    "name": "Pink Creeper Rose",
    "englishName": "Pink Creeper Rose",
    "tamilName": "இளஞ்சிவப்பு கொடி ரோஜா",
    "scientificName": "Rosa 'Pink Climber'",
    "categoryId": "cat-creeper",
    "categoryName": "Creeper Roses",
    "description": "Classic pink cluster climbing rose with long blooming cycles and delightful sweet fragrance.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 25,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/pink-creeper-rose-bush.png"
    ],
    "image": "/products/vrg/pink-creeper-rose-bush.png",
    "imageUrl": "/products/vrg/pink-creeper-rose-bush.png",
    "plantHeight": "5-8 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "creeper roses",
      "pink creeper rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-purple-hibiscus",
    "sku": "VRG-FLOW-009",
    "name": "Purple Hibiscus",
    "englishName": "Purple Hibiscus",
    "tamilName": "நீல/ஊதா செம்பருத்தி",
    "scientificName": "Hibiscus rosa-sinensis 'Purple'",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Exotic deep purple hibiscus flowering plant for daily puja rituals and vibrant garden beauty.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 9,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/purple-hibiscus.png"
    ],
    "image": "/products/vrg/purple-hibiscus.png",
    "imageUrl": "/products/vrg/purple-hibiscus.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "flowering plants",
      "purple hibiscus"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-manoranjitham-plant",
    "sku": "VRG-FLOW-010",
    "name": "Manoranjitham (Climbing Ylang Ylang)",
    "englishName": "Manoranjitham (Climbing Ylang Ylang)",
    "tamilName": "மனோரஞ்சிதம் செடி (Free Shipping)",
    "scientificName": "Artabotrys hexapetalus",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Intensely fragrant climbing ylang-ylang vine producing green-to-yellow flowers with exotic banana-apple scent.",
    "mrp": 160,
    "sellingPrice": 120,
    "discount": 25,
    "stock": 49,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/manoranjitham-plant.png"
    ],
    "image": "/products/vrg/manoranjitham-plant.png",
    "imageUrl": "/products/vrg/manoranjitham-plant.png",
    "plantHeight": "3-5 Feet Vine",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "flowering plants",
      "manoranjitham (climbing ylang ylang)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-panneer-kodi-milagu",
    "sku": "VRG-FLOW-011",
    "name": "Panneer Kodi Milagu (Pepper Vine)",
    "englishName": "Panneer Kodi Milagu (Pepper Vine)",
    "tamilName": "பன்னீர் கொடி மிளகு",
    "scientificName": "Piper nigrum var.",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Traditional aromatic ornamental pepper climber vine with glossy foliage and attractive peppercorn clusters.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 15,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/panneer-kodi-milagu.png"
    ],
    "image": "/products/vrg/panneer-kodi-milagu.png",
    "imageUrl": "/products/vrg/panneer-kodi-milagu.png",
    "plantHeight": "3-6 Feet Vine",
    "potSize": "8 Inch Bag",
    "sunlight": "Partial Shade",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "flowering plants",
      "panneer kodi milagu (pepper vine)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-red-henna-sigappu-marudhani",
    "sku": "VRG-FLOW-012",
    "name": "Red Henna (Sigappu Marudhani)",
    "englishName": "Red Henna (Sigappu Marudhani)",
    "tamilName": "சிகப்பு மருதாணி செடி",
    "scientificName": "Lawsonia inermis 'Red'",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Authentic organic red stain henna plant with dense therapeutic aromatic leaves and fragrant flowers.",
    "mrp": 120,
    "sellingPrice": 80,
    "discount": 33,
    "stock": 26,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/red-henna-sigappu-marudhani.png"
    ],
    "image": "/products/vrg/red-henna-sigappu-marudhani.png",
    "imageUrl": "/products/vrg/red-henna-sigappu-marudhani.png",
    "plantHeight": "2-4 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Alternate Days",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "flowering plants",
      "red henna (sigappu marudhani)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-srilankan-malli-plant",
    "sku": "VRG-FLOW-013",
    "name": "Srilankan Malli",
    "englishName": "Srilankan Malli",
    "tamilName": "இலங்கை மல்லி செடி",
    "scientificName": "Jasminum sambac 'Sri Lankan'",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Special heavy-scented Sri Lankan jasmine variety with round bud formation and high flower yield.",
    "mrp": 120,
    "sellingPrice": 80,
    "discount": 33,
    "stock": 8,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/srilankan-malli-plant.png"
    ],
    "image": "/products/vrg/srilankan-malli-plant.png",
    "imageUrl": "/products/vrg/srilankan-malli-plant.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "flowering plants",
      "srilankan malli"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-kodi-sambangi-climbing-tuberose",
    "sku": "VRG-FLOW-014",
    "name": "Kodi Sambangi (Climbing Tuberose)",
    "englishName": "Kodi Sambangi (Climbing Tuberose)",
    "tamilName": "கொடி சம்பங்கி செடி",
    "scientificName": "Telosma cordata",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Sweetly scented climbing sambangi vine bearing bunches of greenish-yellow night-fragrant flowers.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 10,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/kodi-sambangi-climbing-tuberose.png"
    ],
    "image": "/products/vrg/kodi-sambangi-climbing-tuberose.png",
    "imageUrl": "/products/vrg/kodi-sambangi-climbing-tuberose.png",
    "plantHeight": "4-6 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "flowering plants",
      "kodi sambangi (climbing tuberose)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-rangoon-creeper-single-petal",
    "sku": "VRG-FLOW-015",
    "name": "Rangoon Creeper (Single Petal)",
    "englishName": "Rangoon Creeper (Single Petal)",
    "tamilName": "ரங்கூன் மல்லி (ஒற்றை இதழ்)",
    "scientificName": "Combretum indicum",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Color-changing fragrant creeper that transitions from white in morning to pink at noon and deep crimson by dusk.",
    "mrp": 90,
    "sellingPrice": 50,
    "discount": 44,
    "stock": 24,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/rangoon-creeper-single-petal.png"
    ],
    "image": "/products/vrg/rangoon-creeper-single-petal.png",
    "imageUrl": "/products/vrg/rangoon-creeper-single-petal.png",
    "plantHeight": "5-10 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "flowering plants",
      "rangoon creeper (single petal)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-barleria-cristata-december-poo",
    "sku": "VRG-FLOW-016",
    "name": "Barleria Cristata (December Poo)",
    "englishName": "Barleria Cristata (December Poo)",
    "tamilName": "டிசம்பர் பூ செடி (வயலட்/பிங்க்)",
    "scientificName": "Barleria cristata",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Classic South Indian winter-blooming December flower plant in vivid tones, cherished for garlands and hair adornment.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 5,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/barleria-cristata-december-poo.png"
    ],
    "image": "/products/vrg/barleria-cristata-december-poo.png",
    "imageUrl": "/products/vrg/barleria-cristata-december-poo.png",
    "plantHeight": "1.5-2.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Winter",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "flowering plants",
      "barleria cristata (december poo)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-magilam-poo-maram",
    "sku": "VRG-FLOW-017",
    "name": "Magilam Poo Maram (Bullet Wood)",
    "englishName": "Magilam Poo Maram (Bullet Wood)",
    "tamilName": "மகிழம் பூ மரம்",
    "scientificName": "Mimusops elengi",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Sacred celestial temple tree with star-shaped flowers that retain their heavenly aroma even after drying.",
    "mrp": 120,
    "sellingPrice": 80,
    "discount": 33,
    "stock": 15,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/magilam-poo-maram.png"
    ],
    "image": "/products/vrg/magilam-poo-maram.png",
    "imageUrl": "/products/vrg/magilam-poo-maram.png",
    "plantHeight": "3-5 Feet Sapling",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "flowering plants",
      "magilam poo maram (bullet wood)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-yellow-parijadham",
    "sku": "VRG-FLOW-018",
    "name": "Yellow Parijadham",
    "englishName": "Yellow Parijadham",
    "tamilName": "மஞ்சள் பாரிஜாதம்",
    "scientificName": "Nyctanthes arbor-tristis 'Aurea'",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Rare auspicious yellow-tinted parijatham flowering tree with sweet divine night scent for morning puja.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 13,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/yellow-parijadham.png"
    ],
    "image": "/products/vrg/yellow-parijadham.png",
    "imageUrl": "/products/vrg/yellow-parijadham.png",
    "plantHeight": "2.5-4 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "flowering plants",
      "yellow parijadham"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-bridal-bouquet-porana",
    "sku": "VRG-FLOW-019",
    "name": "Bridal Bouquet (Night Queen Kodi)",
    "englishName": "Bridal Bouquet (Night Queen Kodi)",
    "tamilName": "பிரைடல் பொக்கே / நைட்குயின் கொடி",
    "scientificName": "Porana paniculata",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Spectacular cascading white veil of tiny fragrant bridal star flowers creating an ethereal garden spectacle.",
    "mrp": 110,
    "sellingPrice": 70,
    "discount": 36,
    "stock": 23,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/bridal-bouquet-porana.png"
    ],
    "image": "/products/vrg/bridal-bouquet-porana.png",
    "imageUrl": "/products/vrg/bridal-bouquet-porana.png",
    "plantHeight": "4-8 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Winter & Spring",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "flowering plants",
      "bridal bouquet (night queen kodi)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-panneer-pushpam-plant",
    "sku": "VRG-FLOW-020",
    "name": "Panneer Pushpam Plant",
    "englishName": "Panneer Pushpam Plant",
    "tamilName": "பன்னீர் புஷ்பம் செடி",
    "scientificName": "Guettarda speciosa",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Rose-scented sacred panneer pushpam with soothing natural aroma and serene white flowers.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 19,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/panneer-pushpam-plant.png"
    ],
    "image": "/products/vrg/panneer-pushpam-plant.png",
    "imageUrl": "/products/vrg/panneer-pushpam-plant.png",
    "plantHeight": "2-3.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "flowering plants",
      "panneer pushpam plant"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-petrea-volubilis-violet",
    "sku": "VRG-FLOW-021",
    "name": "Petrea Volubilis Violet (Sandpaper Vine)",
    "englishName": "Petrea Volubilis Violet (Sandpaper Vine)",
    "tamilName": "பெட்ரியா வயலட் கொடி",
    "scientificName": "Petrea volubilis",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Queen's wreath sandpaper vine bearing cascading violet-blue star clusters resembling wisteria.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 7,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/petrea-volubilis-violet.png"
    ],
    "image": "/products/vrg/petrea-volubilis-violet.png",
    "imageUrl": "/products/vrg/petrea-volubilis-violet.png",
    "plantHeight": "4-7 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Spring & Summer",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "flowering plants",
      "petrea volubilis violet (sandpaper vine)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-petrea-volubilis-white",
    "sku": "VRG-FLOW-022",
    "name": "Petrea Volubilis White (Sandpaper Vine)",
    "englishName": "Petrea Volubilis White (Sandpaper Vine)",
    "tamilName": "பெட்ரியா வெள்ளை கொடி",
    "scientificName": "Petrea volubilis 'Alba'",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Rare pure white weeping flower spikes on strong woody vine for grand entrance gates and fences.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 6,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/petrea-volubilis-white.png"
    ],
    "image": "/products/vrg/petrea-volubilis-white.png",
    "imageUrl": "/products/vrg/petrea-volubilis-white.png",
    "plantHeight": "4-7 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Spring & Summer",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "flowering plants",
      "petrea volubilis white (sandpaper vine)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-krishnakamalam-violet",
    "sku": "VRG-FLOW-023",
    "name": "Krishnakamalam Violet (Passion Flower)",
    "englishName": "Krishnakamalam Violet (Passion Flower)",
    "tamilName": "கிருஷ்ணகமலம் வயலட் கொடி",
    "scientificName": "Passiflora incarnata",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Divine intricate crown-shaped passion flower vine in mystical violet, symbol of serenity and devotion.",
    "mrp": 90,
    "sellingPrice": 50,
    "discount": 44,
    "stock": 35,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/krishnakamalam-violet.png"
    ],
    "image": "/products/vrg/krishnakamalam-violet.png",
    "imageUrl": "/products/vrg/krishnakamalam-violet.png",
    "plantHeight": "4-8 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "flowering plants",
      "krishnakamalam violet (passion flower)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-krishnakamalam-red",
    "sku": "VRG-FLOW-024",
    "name": "Krishnakamalam Red (Passion Flower)",
    "englishName": "Krishnakamalam Red (Passion Flower)",
    "tamilName": "கிருஷ்ணகமலம் சிகப்பு கொடி",
    "scientificName": "Passiflora coccinea",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Scarlet red exotic passion flower vine with ornamental blooms that attract butterflies and hummingbirds.",
    "mrp": 90,
    "sellingPrice": 50,
    "discount": 44,
    "stock": 33,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/krishnakamalam-red.png"
    ],
    "image": "/products/vrg/krishnakamalam-red.png",
    "imageUrl": "/products/vrg/krishnakamalam-red.png",
    "plantHeight": "4-8 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "flowering plants",
      "krishnakamalam red (passion flower)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-night-queen-jasmine",
    "sku": "VRG-FLOW-025",
    "name": "Night Queen (Night Blooming Jasmine)",
    "englishName": "Night Queen (Night Blooming Jasmine)",
    "tamilName": "நைட் குயின் / அந்தி மல்லி",
    "scientificName": "Cestrum nocturnum",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Legendary night blooming jasmine shrub that fills entire neighborhood with enchanting aroma after sunset.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 5,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/night-queen-jasmine.png"
    ],
    "image": "/products/vrg/night-queen-jasmine.png",
    "imageUrl": "/products/vrg/night-queen-jasmine.png",
    "plantHeight": "2.5-4 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "flowering plants",
      "night queen (night blooming jasmine)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-changing-rose-confederate",
    "sku": "VRG-FLOW-026",
    "name": "Changing Rose (Confederate Rose)",
    "englishName": "Changing Rose (Confederate Rose)",
    "tamilName": "நிறம் மாறும் ரோஜா (ஹைபிஸ்கஸ்)",
    "scientificName": "Hibiscus mutabilis",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Magic tri-color flowers that open pure white at dawn, blush pink by noon, and deepen to ruby red by evening.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 18,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/changing-rose-confederate.png"
    ],
    "image": "/products/vrg/changing-rose-confederate.png",
    "imageUrl": "/products/vrg/changing-rose-confederate.png",
    "plantHeight": "3-5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "flowering plants",
      "changing rose (confederate rose)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-white-shenbagam-plant",
    "sku": "VRG-FLOW-027",
    "name": "White Shenbagam Plant",
    "englishName": "White Shenbagam Plant",
    "tamilName": "வெள்ளை செண்பகம் செடி (Free Delivery)",
    "scientificName": "Magnolia champaca var. alba",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Pure white heavenly scented champaca tree sapling prized in temple worship and luxury perfumery.",
    "mrp": 450,
    "sellingPrice": 350,
    "discount": 22,
    "stock": 3,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/white-shenbagam-plant.png"
    ],
    "image": "/products/vrg/white-shenbagam-plant.png",
    "imageUrl": "/products/vrg/white-shenbagam-plant.png",
    "plantHeight": "3-5 Feet Sapling",
    "potSize": "10 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "flowering plants",
      "white shenbagam plant"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-orange-shenbagam-plant",
    "sku": "VRG-FLOW-028",
    "name": "Orange Shenbagam Flower Plant",
    "englishName": "Orange Shenbagam Flower Plant",
    "tamilName": "ஆரஞ்சு செண்பகம் செடி (Free Delivery)",
    "scientificName": "Magnolia champaca 'Orange'",
    "categoryId": "cat-flowering",
    "categoryName": "Flowering Plants",
    "description": "Golden orange deeply aromatic champak flowering tree sapling for garden prosperity and divine fragrance.",
    "mrp": 450,
    "sellingPrice": 350,
    "discount": 22,
    "stock": 2,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/orange-shenbagam-plant.png"
    ],
    "image": "/products/vrg/orange-shenbagam-plant.png",
    "imageUrl": "/products/vrg/orange-shenbagam-plant.png",
    "plantHeight": "3-5 Feet Sapling",
    "potSize": "10 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "flowering plants",
      "orange shenbagam flower plant"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-black-grapes-vine",
    "sku": "VRG-FRUI-029",
    "name": "Black Grape Vine (Live Plant)",
    "englishName": "Black Grape Vine (Live Plant)",
    "tamilName": "கருப்பு திராட்சை கொடி",
    "scientificName": "Vitis vinifera 'Bangalore Blue'",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "Sweet, high-yielding seeded black grape vine that thrives on terrace pandals and garden trellises.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 27,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/black-grapes-vine.png"
    ],
    "image": "/products/vrg/black-grapes-vine.png",
    "imageUrl": "/products/vrg/black-grapes-vine.png",
    "plantHeight": "2-3 Feet Vine",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Summer Harvest",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "fruit plants",
      "black grape vine (live plant)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-kalapadi-sapota-plant",
    "sku": "VRG-FRUI-030",
    "name": "Kalapadi Sapota (Sweet Chiku)",
    "englishName": "Kalapadi Sapota (Sweet Chiku)",
    "tamilName": "காலாபாடி சப்போட்டா செடி",
    "scientificName": "Manilkara zapota 'Kalapadi'",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "Premium slow-growing dwarf sapota variety yielding honey-sweet oval fruits, ideal for large container gardening.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 9,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/kalapadi-sapota-plant.png"
    ],
    "image": "/products/vrg/kalapadi-sapota-plant.png",
    "imageUrl": "/products/vrg/kalapadi-sapota-plant.png",
    "plantHeight": "2-3 Feet Grafted",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Alternate Days",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "fruit plants",
      "kalapadi sapota (sweet chiku)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-egg-fruit-canistel-plant",
    "sku": "VRG-FRUI-031",
    "name": "Egg Fruit Plant (Canistel)",
    "englishName": "Egg Fruit Plant (Canistel)",
    "tamilName": "முட்டை பழம் செடி (Canistel)",
    "scientificName": "Pouteria campechiana",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "Rich custard-like yellow fruit tree sapling known as yellow sapote or egg fruit, loaded with vitamins.",
    "mrp": 210,
    "sellingPrice": 150,
    "discount": 29,
    "stock": 3,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/egg-fruit-canistel-plant.png"
    ],
    "image": "/products/vrg/egg-fruit-canistel-plant.png",
    "imageUrl": "/products/vrg/egg-fruit-canistel-plant.png",
    "plantHeight": "2-3 Feet Sapling",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Autumn Harvest",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "fruit plants",
      "egg fruit plant (canistel)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-peanut-butter-fruit-plant",
    "sku": "VRG-FRUI-032",
    "name": "Peanut Butter Fruit Plant",
    "englishName": "Peanut Butter Fruit Plant",
    "tamilName": "பீநட் பட்டர் பழச் செடி",
    "scientificName": "Bunchosia armeniaca",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "Exotic orange-red berries that taste remarkably like sweet creamy peanut butter.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 19,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/peanut-butter-fruit-plant.png"
    ],
    "image": "/products/vrg/peanut-butter-fruit-plant.png",
    "imageUrl": "/products/vrg/peanut-butter-fruit-plant.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Summer",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "fruit plants",
      "peanut butter fruit plant"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-miracle-fruit-seedling",
    "sku": "VRG-FRUI-033",
    "name": "Miracle Fruit Plant (Seedling)",
    "englishName": "Miracle Fruit Plant (Seedling)",
    "tamilName": "மிராக்கிள் ஃப்ரூட் செடி (அதிசய பழம்)",
    "scientificName": "Synsepalum dulcificum",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "Famous miraculous berry plant containing miraculin that makes sour and bitter foods taste ultra-sweet.",
    "mrp": 210,
    "sellingPrice": 150,
    "discount": 29,
    "stock": 10,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/miracle-fruit-seedling.png"
    ],
    "image": "/products/vrg/miracle-fruit-seedling.png",
    "imageUrl": "/products/vrg/miracle-fruit-seedling.png",
    "plantHeight": "1-2 Feet",
    "potSize": "6 Inch Bag",
    "sunlight": "Partial Shade",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "fruit plants",
      "miracle fruit plant (seedling)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-pune-red-athi-fig",
    "sku": "VRG-FRUI-034",
    "name": "Pune Red Athi (Fig Plant)",
    "englishName": "Pune Red Athi (Fig Plant)",
    "tamilName": "பூனே சிகப்பு அத்தி மரம்",
    "scientificName": "Ficus carica 'Pune Red'",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "Heavy-fruiting sweet red fig variety rich in dietary fiber and iron, highly productive in pots.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 8,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/pune-red-athi-fig.png"
    ],
    "image": "/products/vrg/pune-red-athi-fig.png",
    "imageUrl": "/products/vrg/pune-red-athi-fig.png",
    "plantHeight": "2-3 Feet Layered",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Alternate Days",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "fruit plants",
      "pune red athi (fig plant)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-nmk-golden-sapota",
    "sku": "VRG-FRUI-035",
    "name": "NMK Golden Sapota",
    "englishName": "NMK Golden Sapota",
    "tamilName": "NMK கோல்டன் சப்போட்டா செடி",
    "scientificName": "Manilkara zapota 'NMK Golden'",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "High-yield commercial hybrid golden sapota with thin skin and extra juicy sugar-sweet flesh.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 20,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/nmk-golden-sapota.png"
    ],
    "image": "/products/vrg/nmk-golden-sapota.png",
    "imageUrl": "/products/vrg/nmk-golden-sapota.png",
    "plantHeight": "2-3 Feet Grafted",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "fruit plants",
      "nmk golden sapota"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-ramar-seetha-custard-apple",
    "sku": "VRG-FRUI-036",
    "name": "Ramar Seetha (Red Custard Apple)",
    "englishName": "Ramar Seetha (Red Custard Apple)",
    "tamilName": "ராமர் சீதா பழச் செடி",
    "scientificName": "Annona reticulata",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "Sweet red-tinted Ramar Seethapazham tree sapling with thick creamy aromatic pulp.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 10,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/ramar-seetha-custard-apple.png"
    ],
    "image": "/products/vrg/ramar-seetha-custard-apple.png",
    "imageUrl": "/products/vrg/ramar-seetha-custard-apple.png",
    "plantHeight": "2-3 Feet Sapling",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Moderate",
    "floweringSeason": "Monsoon & Winter",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "fruit plants",
      "ramar seetha (red custard apple)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-mul-seetha-soursop-graviola",
    "sku": "VRG-FRUI-037",
    "name": "Mul Seetha (Soursop / Graviola)",
    "englishName": "Mul Seetha (Soursop / Graviola)",
    "tamilName": "முள் சீதா மரம் (Graviola / Soursop)",
    "scientificName": "Annona muricata",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "Renowned medicinal graviola soursop plant with prickled green fruit known for antioxidant benefits.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 29,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/mul-seetha-soursop-graviola.png"
    ],
    "image": "/products/vrg/mul-seetha-soursop-graviola.png",
    "imageUrl": "/products/vrg/mul-seetha-soursop-graviola.png",
    "plantHeight": "2-3 Feet Sapling",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "fruit plants",
      "mul seetha (soursop / graviola)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-pkm-1-market-lemon",
    "sku": "VRG-FRUI-038",
    "name": "PKM 1 Market Lemon",
    "englishName": "PKM 1 Market Lemon",
    "tamilName": "PKM 1 எலுமிச்சை செடி",
    "scientificName": "Citrus limon 'PKM-1'",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "Commercial high-juice seedless hybrid market lemon sapling bearing fruit all 365 days.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 17,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/pkm-1-market-lemon.png"
    ],
    "image": "/products/vrg/pkm-1-market-lemon.png",
    "imageUrl": "/products/vrg/pkm-1-market-lemon.png",
    "plantHeight": "2-3 Feet Layered",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "fruit plants",
      "pkm 1 market lemon"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-kamala-orange-mandarin",
    "sku": "VRG-FRUI-039",
    "name": "Kamala Orange (Mandarin Orange)",
    "englishName": "Kamala Orange (Mandarin Orange)",
    "tamilName": "கமலா ஆரஞ்சு செடி",
    "scientificName": "Citrus reticulata 'Kamala'",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "Juicy easy-peel sweet mandarin orange sapling adapted for home garden pots and ground cultivation.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 18,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/kamala-orange-mandarin.png"
    ],
    "image": "/products/vrg/kamala-orange-mandarin.png",
    "imageUrl": "/products/vrg/kamala-orange-mandarin.png",
    "plantHeight": "2-3 Feet Grafted",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Winter Harvest",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "fruit plants",
      "kamala orange (mandarin orange)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-pomelo-bubly-mass",
    "sku": "VRG-FRUI-040",
    "name": "Pomelo (Bubly Mass / Pamblimas)",
    "englishName": "Pomelo (Bubly Mass / Pamblimas)",
    "tamilName": "பப்ளிமாஸ் மரம் (Pomelo)",
    "scientificName": "Citrus maxima",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "Giant sweet-tangy pink pulp pomelo citrus tree with large fragrant blossoms.",
    "mrp": 210,
    "sellingPrice": 150,
    "discount": 29,
    "stock": 20,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/pomelo-bubly-mass.png"
    ],
    "image": "/products/vrg/pomelo-bubly-mass.png",
    "imageUrl": "/products/vrg/pomelo-bubly-mass.png",
    "plantHeight": "2.5-3.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Winter Harvest",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "fruit plants",
      "pomelo (bubly mass / pamblimas)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-chamba-red-fruit",
    "sku": "VRG-FRUI-041",
    "name": "Chamba Red (Wax Apple)",
    "englishName": "Chamba Red (Wax Apple)",
    "tamilName": "ஜாம்போ சிகப்பு பழ மரம்",
    "scientificName": "Syzygium samarangense 'Red'",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "Crisp bell-shaped ruby wax apple sapling yielding clusters of juicy crunchy refreshing fruit.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 48,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/chamba-red-fruit.png"
    ],
    "image": "/products/vrg/chamba-red-fruit.png",
    "imageUrl": "/products/vrg/chamba-red-fruit.png",
    "plantHeight": "2-3.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Summer",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "fruit plants",
      "chamba red (wax apple)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-red-water-apple-plant",
    "sku": "VRG-FRUI-042",
    "name": "Red Water Apple Plant",
    "englishName": "Red Water Apple Plant",
    "tamilName": "சிகப்பு வாட்டர் ஆப்பிள் செடி",
    "scientificName": "Syzygium aqueum 'Red'",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "Sweet bell-shaped red water apple sapling that produces abundant hydrating fruits for home gardens.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 19,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/red-water-apple-plant.png"
    ],
    "image": "/products/vrg/red-water-apple-plant.png",
    "imageUrl": "/products/vrg/red-water-apple-plant.png",
    "plantHeight": "2-3 Feet Layered",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Summer",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "fruit plants",
      "red water apple plant"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-green-water-apple-plant",
    "sku": "VRG-FRUI-043",
    "name": "Green Water Apple Plant",
    "englishName": "Green Water Apple Plant",
    "tamilName": "பச்சை வாட்டர் ஆப்பிள் செடி",
    "scientificName": "Syzygium aqueum 'Green'",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "Extra crisp crunchy green water apple variety with refreshing mild sweet flavor.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 19,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/green-water-apple-plant.png"
    ],
    "image": "/products/vrg/green-water-apple-plant.png",
    "imageUrl": "/products/vrg/green-water-apple-plant.png",
    "plantHeight": "2-3 Feet Layered",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Summer",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "fruit plants",
      "green water apple plant"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-white-water-apple-plant",
    "sku": "VRG-FRUI-044",
    "name": "White Water Apple Plant",
    "englishName": "White Water Apple Plant",
    "tamilName": "வெள்ளை வாட்டர் ஆப்பிள் செடி",
    "scientificName": "Syzygium aqueum 'White'",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "Translucent ivory wax apple variety that is sweet, juicy, and low-maintenance.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 20,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/white-water-apple-plant.png"
    ],
    "image": "/products/vrg/white-water-apple-plant.png",
    "imageUrl": "/products/vrg/white-water-apple-plant.png",
    "plantHeight": "2-3 Feet Layered",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Summer",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "fruit plants",
      "white water apple plant"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-pkm-1-moringa-plant",
    "sku": "VRG-FRUI-045",
    "name": "PKM 1 Moringa (Drumstick Tree)",
    "englishName": "PKM 1 Moringa (Drumstick Tree)",
    "tamilName": "PKM 1 செடி முருங்கை மரம்",
    "scientificName": "Moringa oleifera 'PKM-1'",
    "categoryId": "cat-fruits",
    "categoryName": "Fruit Plants",
    "description": "Fast-growing high-yield annual drumstick sapling producing tender fleshy pods within 6 months.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 27,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/pkm-1-moringa-plant.png"
    ],
    "image": "/products/vrg/pkm-1-moringa-plant.png",
    "imageUrl": "/products/vrg/pkm-1-moringa-plant.png",
    "plantHeight": "2.5-4 Feet Sapling",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Alternate Days",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "fruit plants",
      "pkm 1 moringa (drumstick tree)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-neeli-avuri-chedi",
    "sku": "VRG-HERB-046",
    "name": "Neeli Avuri Chedi (True Indigo)",
    "englishName": "Neeli Avuri Chedi (True Indigo)",
    "tamilName": "நீலி அவுரி செடி (2.5 Feet)",
    "scientificName": "Indigofera tinctoria",
    "categoryId": "cat-herbals",
    "categoryName": "Herbal Plants",
    "description": "Natural herbal hair dye and therapeutic indigo plant known for promoting dark shiny healthy hair.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 20,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/neeli-avuri-chedi.png"
    ],
    "image": "/products/vrg/neeli-avuri-chedi.png",
    "imageUrl": "/products/vrg/neeli-avuri-chedi.png",
    "plantHeight": "2.5 Feet Mature",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "herbal plants",
      "neeli avuri chedi (true indigo)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-blue-sangu-poo-aparajita",
    "sku": "VRG-HERB-047",
    "name": "Blue Sangu Poo (Aparajita / Butterfly Pea)",
    "englishName": "Blue Sangu Poo (Aparajita / Butterfly Pea)",
    "tamilName": "நீல சங்கு பூ கொடி",
    "scientificName": "Clitoria ternatea 'Blue'",
    "categoryId": "cat-herbals",
    "categoryName": "Herbal Plants",
    "description": "Sacred blue tea flower vine with intense cobalt blossoms packed with memory-boosting antioxidants.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 12,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/blue-sangu-poo-aparajita.png"
    ],
    "image": "/products/vrg/blue-sangu-poo-aparajita.png",
    "imageUrl": "/products/vrg/blue-sangu-poo-aparajita.png",
    "plantHeight": "3-6 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "herbal plants",
      "blue sangu poo (aparajita / butterfly pea)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-white-sangu-poo-aparajita",
    "sku": "VRG-HERB-048",
    "name": "White Sangu Poo (White Butterfly Pea)",
    "englishName": "White Sangu Poo (White Butterfly Pea)",
    "tamilName": "வெள்ளை சங்கு பூ கொடி",
    "scientificName": "Clitoria ternatea 'Alba'",
    "categoryId": "cat-herbals",
    "categoryName": "Herbal Plants",
    "description": "Auspicious pure white shankhupushpi climber revered for holy puja and medicinal herbal remedies.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 12,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/white-sangu-poo-aparajita.png"
    ],
    "image": "/products/vrg/white-sangu-poo-aparajita.png",
    "imageUrl": "/products/vrg/white-sangu-poo-aparajita.png",
    "plantHeight": "3-6 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "herbal plants",
      "white sangu poo (white butterfly pea)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-aavaram-poo-tanners-cassia",
    "sku": "VRG-HERB-049",
    "name": "Aavaram Poo (Tanner's Cassia)",
    "englishName": "Aavaram Poo (Tanner's Cassia)",
    "tamilName": "ஆவாரம் பூ செடி",
    "scientificName": "Senna auriculata",
    "categoryId": "cat-herbals",
    "categoryName": "Herbal Plants",
    "description": "Traditional golden herbal flower shrub famous for blood sugar wellness, herbal tea, and natural skin glow.",
    "mrp": 90,
    "sellingPrice": 50,
    "discount": 44,
    "stock": 20,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/aavaram-poo-tanners-cassia.png"
    ],
    "image": "/products/vrg/aavaram-poo-tanners-cassia.png",
    "imageUrl": "/products/vrg/aavaram-poo-tanners-cassia.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Alternate Days",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "herbal plants",
      "aavaram poo (tanner's cassia)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-vasambu-sweet-flag",
    "sku": "VRG-HERB-050",
    "name": "Vasambu (Sweet Flag / Baje)",
    "englishName": "Vasambu (Sweet Flag / Baje)",
    "tamilName": "வசம்பு செடி (பிள்ளை வளர்ப்பான்)",
    "scientificName": "Acorus calamus",
    "categoryId": "cat-herbals",
    "categoryName": "Herbal Plants",
    "description": "Sacred infant-care herbal root plant known as 'Pillai Valarppan' for digestion and protection.",
    "mrp": 120,
    "sellingPrice": 80,
    "discount": 33,
    "stock": 11,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/vasambu-sweet-flag.png"
    ],
    "image": "/products/vrg/vasambu-sweet-flag.png",
    "imageUrl": "/products/vrg/vasambu-sweet-flag.png",
    "plantHeight": "1-2 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Partial Shade",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "herbal plants",
      "vasambu (sweet flag / baje)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-vetrilai-betel-leaf-vine",
    "sku": "VRG-HERB-051",
    "name": "Vetrilai (Betel Leaf Vine)",
    "englishName": "Vetrilai (Betel Leaf Vine)",
    "tamilName": "வெற்றிலை கொடி",
    "scientificName": "Piper betle",
    "categoryId": "cat-herbals",
    "categoryName": "Herbal Plants",
    "description": "Lush evergreen traditional betel vine with glossy aromatic heart leaves for daily home use.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 8,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/vetrilai-betel-leaf-vine.png"
    ],
    "image": "/products/vrg/vetrilai-betel-leaf-vine.png",
    "imageUrl": "/products/vrg/vetrilai-betel-leaf-vine.png",
    "plantHeight": "2-4 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Partial Shade",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "herbal plants",
      "vetrilai (betel leaf vine)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-ranakalli-miracle-leaf",
    "sku": "VRG-HERB-052",
    "name": "Ranakalli (Miracle Leaf / Katakataka)",
    "englishName": "Ranakalli (Miracle Leaf / Katakataka)",
    "tamilName": "ரணகள்ளி செடி (கிட்னி ஸ்டோன் மூலிகை)",
    "scientificName": "Kalanchoe pinnata",
    "categoryId": "cat-herbals",
    "categoryName": "Herbal Plants",
    "description": "Famous succulent herbal leaf plant renowned in Siddha medicine for kidney stone relief and wound healing.",
    "mrp": 90,
    "sellingPrice": 50,
    "discount": 44,
    "stock": 4,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/ranakalli-miracle-leaf.png"
    ],
    "image": "/products/vrg/ranakalli-miracle-leaf.png",
    "imageUrl": "/products/vrg/ranakalli-miracle-leaf.png",
    "plantHeight": "1-2 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Alternate Days",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "herbal plants",
      "ranakalli (miracle leaf / katakataka)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-panneer-leaf-omavalli",
    "sku": "VRG-HERB-053",
    "name": "Panneer Leaf (Omavalli / Mexican Mint)",
    "englishName": "Panneer Leaf (Omavalli / Mexican Mint)",
    "tamilName": "பன்னீர் இலை / ஓமவள்ளி செடி",
    "scientificName": "Plectranthus amboinicus",
    "categoryId": "cat-herbals",
    "categoryName": "Herbal Plants",
    "description": "Thick fragrant therapeutic succulent leaves used for traditional cold, cough relief, and herbal rasam.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 10,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/panneer-leaf-omavalli.png"
    ],
    "image": "/products/vrg/panneer-leaf-omavalli.png",
    "imageUrl": "/products/vrg/panneer-leaf-omavalli.png",
    "plantHeight": "1-2 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Partial Shade",
    "waterRequirement": "Alternate Days",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "herbal plants",
      "panneer leaf (omavalli / mexican mint)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-nagathali-snake-plant",
    "sku": "VRG-HERB-054",
    "name": "Nagathali (Snake Repellent Plant)",
    "englishName": "Nagathali (Snake Repellent Plant)",
    "tamilName": "நாகதாளி செடி",
    "scientificName": "Rhinacanthus nasutus",
    "categoryId": "cat-herbals",
    "categoryName": "Herbal Plants",
    "description": "Traditional garden protective shrub with bird-shaped white blossoms, valued as a natural snake deterrent.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 17,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/nagathali-snake-plant.png"
    ],
    "image": "/products/vrg/nagathali-snake-plant.png",
    "imageUrl": "/products/vrg/nagathali-snake-plant.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "herbal plants",
      "nagathali (snake repellent plant)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-rosemary-culinary-herb",
    "sku": "VRG-HERB-055",
    "name": "Rosemary (Live Herb Plant)",
    "englishName": "Rosemary (Live Herb Plant)",
    "tamilName": "ரோஸ்மேரி மூலிகை செடி",
    "scientificName": "Salvia rosmarinus",
    "categoryId": "cat-herbals",
    "categoryName": "Herbal Plants",
    "description": "Pungent needle-leaf aromatic herb widely used in gourmet cooking, hair oil preparations, and stress relief.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 1,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/rosemary-culinary-herb.png"
    ],
    "image": "/products/vrg/rosemary-culinary-herb.png",
    "imageUrl": "/products/vrg/rosemary-culinary-herb.png",
    "plantHeight": "1-1.5 Feet",
    "potSize": "6 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Moderate",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "herbal plants",
      "rosemary (live herb plant)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-mint-thulasi-basil",
    "sku": "VRG-HERB-056",
    "name": "Mint Thulasi (Mint Scented Basil)",
    "englishName": "Mint Thulasi (Mint Scented Basil)",
    "tamilName": "புதினா துளசி செடி",
    "scientificName": "Ocimum basilicum var.",
    "categoryId": "cat-herbals",
    "categoryName": "Herbal Plants",
    "description": "Unique hybrid sacred thulasi with a cooling refreshing mint aroma, great for herbal teas and wellness.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 20,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/mint-thulasi-basil.png"
    ],
    "image": "/products/vrg/mint-thulasi-basil.png",
    "imageUrl": "/products/vrg/mint-thulasi-basil.png",
    "plantHeight": "1.5-2.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "herbal plants",
      "mint thulasi (mint scented basil)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-marikolunthu-davana",
    "sku": "VRG-HERB-057",
    "name": "Marikolunthu (Davana / Artemisia)",
    "englishName": "Marikolunthu (Davana / Artemisia)",
    "tamilName": "மரிக்கொழுந்து செடி",
    "scientificName": "Artemisia pallens",
    "categoryId": "cat-herbals",
    "categoryName": "Herbal Plants",
    "description": "Revered sweet-scented silver foliage herb used in traditional temple garlands and luxury south Indian perfumery.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 16,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/marikolunthu-davana.png"
    ],
    "image": "/products/vrg/marikolunthu-davana.png",
    "imageUrl": "/products/vrg/marikolunthu-davana.png",
    "plantHeight": "1-2 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "herbal plants",
      "marikolunthu (davana / artemisia)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-raja-malli-10-layer-jasmine",
    "sku": "VRG-JASM-058",
    "name": "Raja Malli (10 Layer Jasmine)",
    "englishName": "Raja Malli (10 Layer Jasmine)",
    "tamilName": "ராஜ மல்லி (10 அடுக்கு மல்லி)",
    "scientificName": "Jasminum sambac 'Grand Duke of Tuscany'",
    "categoryId": "cat-jasmine",
    "categoryName": "Jasmine Varieties",
    "description": "Magnificent multi-layered royal grand duke jasmine with rose-like thick buds and intense lingering fragrance.",
    "mrp": 90,
    "sellingPrice": 50,
    "discount": 44,
    "stock": 44,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/raja-malli-10-layer-jasmine.png"
    ],
    "image": "/products/vrg/raja-malli-10-layer-jasmine.png",
    "imageUrl": "/products/vrg/raja-malli-10-layer-jasmine.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "jasmine varieties",
      "raja malli (10 layer jasmine)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-mysuru-malli-madras-malli",
    "sku": "VRG-JASM-059",
    "name": "Mysuru Malli (Madras Malli)",
    "englishName": "Mysuru Malli (Madras Malli)",
    "tamilName": "மைசூர் மல்லி / மெட்ராஸ் மல்லி (Free Delivery)",
    "scientificName": "Jasminum sambac",
    "categoryId": "cat-jasmine",
    "categoryName": "Jasmine Varieties",
    "description": "Authentic round-bud Madurai/Mysuru jasmine with world-famous intoxicating perfume for daily pooja and hair adornment.",
    "mrp": 160,
    "sellingPrice": 120,
    "discount": 25,
    "stock": 48,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/mysuru-malli-madras-malli.png"
    ],
    "image": "/products/vrg/mysuru-malli-madras-malli.png",
    "imageUrl": "/products/vrg/mysuru-malli-madras-malli.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Summer & Monsoon",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "jasmine varieties",
      "mysuru malli (madras malli)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-pachai-mullai-jasmine",
    "sku": "VRG-JASM-060",
    "name": "Pachai Mullai (Green Jasmine)",
    "englishName": "Pachai Mullai (Green Jasmine)",
    "tamilName": "பச்சை முல்லை செடி",
    "scientificName": "Jasminum auriculatum",
    "categoryId": "cat-jasmine",
    "categoryName": "Jasmine Varieties",
    "description": "Prolific star jasmine variety with needle-like pointed buds and delicate sweet scent.",
    "mrp": 90,
    "sellingPrice": 50,
    "discount": 44,
    "stock": 14,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/pachai-mullai-jasmine.png"
    ],
    "image": "/products/vrg/pachai-mullai-jasmine.png",
    "imageUrl": "/products/vrg/pachai-mullai-jasmine.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Summer",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "jasmine varieties",
      "pachai mullai (green jasmine)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-white-kakatan-star-jasmine",
    "sku": "VRG-JASM-061",
    "name": "White Kakatan (Star Jasmine)",
    "englishName": "White Kakatan (Star Jasmine)",
    "tamilName": "வெள்ளை காகட்டான் செடி",
    "scientificName": "Jasminum multiflorum",
    "categoryId": "cat-jasmine",
    "categoryName": "Jasmine Varieties",
    "description": "Winter-hardy star shaped white jasmine bearing hundreds of snowy blossoms at every branch node.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 39,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/white-kakatan-star-jasmine.png"
    ],
    "image": "/products/vrg/white-kakatan-star-jasmine.png",
    "imageUrl": "/products/vrg/white-kakatan-star-jasmine.png",
    "plantHeight": "2.5-4 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Winter & Spring",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "jasmine varieties",
      "white kakatan (star jasmine)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-colour-kakatan-pink-star",
    "sku": "VRG-JASM-062",
    "name": "Colour Kakatan (Pink Star Jasmine)",
    "englishName": "Colour Kakatan (Pink Star Jasmine)",
    "tamilName": "கலர் காகட்டான் செடி",
    "scientificName": "Jasminum nitidum 'Pink'",
    "categoryId": "cat-jasmine",
    "categoryName": "Jasmine Varieties",
    "description": "Rare pink-tinged star jasmine buds opening into dazzling white-purple petals with sweet perfume.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 35,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/colour-kakatan-pink-star.png"
    ],
    "image": "/products/vrg/colour-kakatan-pink-star.png",
    "imageUrl": "/products/vrg/colour-kakatan-pink-star.png",
    "plantHeight": "2.5-4 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "jasmine varieties",
      "colour kakatan (pink star jasmine)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-ramar-malli-jasmine",
    "sku": "VRG-JASM-063",
    "name": "Ramar Malli (Divine Jasmine)",
    "englishName": "Ramar Malli (Divine Jasmine)",
    "tamilName": "ராமர் மல்லி செடி",
    "scientificName": "Jasminum sambac 'Ramar'",
    "categoryId": "cat-jasmine",
    "categoryName": "Jasmine Varieties",
    "description": "Sacred long-petal jasmine revered in temples for deep spiritual aroma and continuous flowering.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 30,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/ramar-malli-jasmine.png"
    ],
    "image": "/products/vrg/ramar-malli-jasmine.png",
    "imageUrl": "/products/vrg/ramar-malli-jasmine.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "jasmine varieties",
      "ramar malli (divine jasmine)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-pavazha-malli-coral-jasmine",
    "sku": "VRG-JASM-064",
    "name": "Pavazha Malli (Coral Jasmine / Parijat)",
    "englishName": "Pavazha Malli (Coral Jasmine / Parijat)",
    "tamilName": "பவழ மல்லி செடி (பாரிஜாதம்)",
    "scientificName": "Nyctanthes arbor-tristis",
    "categoryId": "cat-jasmine",
    "categoryName": "Jasmine Varieties",
    "description": "Divine night-flowering coral jasmine with bright orange stems and pure white petals that carpet the ground at dawn.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 3,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/pavazha-malli-coral-jasmine.png"
    ],
    "image": "/products/vrg/pavazha-malli-coral-jasmine.png",
    "imageUrl": "/products/vrg/pavazha-malli-coral-jasmine.png",
    "plantHeight": "3-5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "Autumn & Winter",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "jasmine varieties",
      "pavazha malli (coral jasmine / parijat)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-jadhi-malli-spanish-jasmine",
    "sku": "VRG-JASM-065",
    "name": "Jadhi Malli (Spanish / Royal Jasmine)",
    "englishName": "Jadhi Malli (Spanish / Royal Jasmine)",
    "tamilName": "ஜாதி மல்லி செடி (பிச்சி பூ)",
    "scientificName": "Jasminum grandiflorum",
    "categoryId": "cat-jasmine",
    "categoryName": "Jasmine Varieties",
    "description": "Prized pitchi poo climber producing elegant pointed pink-backed white flowers of royal fragrance.",
    "mrp": 180,
    "sellingPrice": 140,
    "discount": 22,
    "stock": 12,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/jadhi-malli-spanish-jasmine.png"
    ],
    "image": "/products/vrg/jadhi-malli-spanish-jasmine.png",
    "imageUrl": "/products/vrg/jadhi-malli-spanish-jasmine.png",
    "plantHeight": "3-6 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "jasmine varieties",
      "jadhi malli (spanish / royal jasmine)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-double-colour-miniature-rose",
    "sku": "VRG-MINI-066",
    "name": "Double Colour Miniature Rose",
    "englishName": "Double Colour Miniature Rose",
    "tamilName": "இரு நிற மினியேச்சர் ரோஜா",
    "scientificName": "Rosa chinensis minima 'Bi-Color'",
    "categoryId": "cat-miniature",
    "categoryName": "Miniature Roses",
    "description": "Dual-tone miniature rose packed with tiny multi-colored petals, perfect for balcony table pots and containers.",
    "mrp": 120,
    "sellingPrice": 80,
    "discount": 33,
    "stock": 10,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/double-colour-miniature-rose.png"
    ],
    "image": "/products/vrg/double-colour-miniature-rose.png",
    "imageUrl": "/products/vrg/double-colour-miniature-rose.png",
    "plantHeight": "1-1.5 Feet Miniature",
    "potSize": "6 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "miniature roses",
      "double colour miniature rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-pearl-orange-miniature-rose",
    "sku": "VRG-MINI-067",
    "name": "Pearl Orange Miniature Rose",
    "englishName": "Pearl Orange Miniature Rose",
    "tamilName": "முத்து ஆரஞ்சு மினியேச்சர் ரோஜா",
    "scientificName": "Rosa chinensis minima 'Pearl Orange'",
    "categoryId": "cat-miniature",
    "categoryName": "Miniature Roses",
    "description": "Warm glowing apricot-orange mini roses blooming in tight clusters throughout the season.",
    "mrp": 120,
    "sellingPrice": 80,
    "discount": 33,
    "stock": 4,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/pearl-orange-miniature-rose.png"
    ],
    "image": "/products/vrg/pearl-orange-miniature-rose.png",
    "imageUrl": "/products/vrg/pearl-orange-miniature-rose.png",
    "plantHeight": "1-1.5 Feet Miniature",
    "potSize": "6 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "miniature roses",
      "pearl orange miniature rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-pink-colour-miniature-rose",
    "sku": "VRG-MINI-068",
    "name": "Pink Colour Miniature Rose",
    "englishName": "Pink Colour Miniature Rose",
    "tamilName": "பிங்க் மினியேச்சர் ரோஜா",
    "scientificName": "Rosa chinensis minima 'Pink'",
    "categoryId": "cat-miniature",
    "categoryName": "Miniature Roses",
    "description": "Charming rose-pink miniature bushy plant creating a lush floral carpet in small garden spaces.",
    "mrp": 120,
    "sellingPrice": 80,
    "discount": 33,
    "stock": 5,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/pink-colour-miniature-rose.png"
    ],
    "image": "/products/vrg/pink-colour-miniature-rose.png",
    "imageUrl": "/products/vrg/pink-colour-miniature-rose.png",
    "plantHeight": "1-1.5 Feet Miniature",
    "potSize": "6 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "miniature roses",
      "pink colour miniature rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-yellow-miniature-rose",
    "sku": "VRG-MINI-069",
    "name": "Yellow Miniature Rose",
    "englishName": "Yellow Miniature Rose",
    "tamilName": "மஞ்சள் மினியேச்சர் ரோஜா",
    "scientificName": "Rosa chinensis minima 'Yellow'",
    "categoryId": "cat-miniature",
    "categoryName": "Miniature Roses",
    "description": "Cheerful golden lemon miniature rose with button blooms that brighten up window sills and borders.",
    "mrp": 120,
    "sellingPrice": 80,
    "discount": 33,
    "stock": 8,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/yellow-miniature-rose.png"
    ],
    "image": "/products/vrg/yellow-miniature-rose.png",
    "imageUrl": "/products/vrg/yellow-miniature-rose.png",
    "plantHeight": "1-1.5 Feet Miniature",
    "potSize": "6 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "miniature roses",
      "yellow miniature rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-cho-cho-centennial-miniature",
    "sku": "VRG-RARE-070",
    "name": "Cho Cho Centennial Miniature Rose",
    "englishName": "Cho Cho Centennial Miniature Rose",
    "tamilName": "சோ சோ சென்டென்னியல் ரோஜா",
    "scientificName": "Rosa 'Cho Cho Centennial'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Rare collector's miniature rose with intricate ruffled petals and exquisite pastel gradient.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 10,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/cho-cho-centennial-miniature.png"
    ],
    "image": "/products/vrg/cho-cho-centennial-miniature.png",
    "imageUrl": "/products/vrg/cho-cho-centennial-miniature.png",
    "plantHeight": "1.5-2 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "cho cho centennial miniature rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-ink-spot-rose",
    "sku": "VRG-RARE-071",
    "name": "Ink Spot Rose (Velvet Black-Red)",
    "englishName": "Ink Spot Rose (Velvet Black-Red)",
    "tamilName": "இங்க் ஸ்பாட் அரிய ரோஜா",
    "scientificName": "Rosa 'Ink Spot'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Ultra dark velvety blackish-crimson rose with deep cupped form and intense luxury feel.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 1,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/ink-spot-rose.png"
    ],
    "image": "/products/vrg/ink-spot-rose.png",
    "imageUrl": "/products/vrg/ink-spot-rose.png",
    "plantHeight": "2.5-3.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "ink spot rose (velvet black-red)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-pink-fairy-polyantha-rose",
    "sku": "VRG-RARE-072",
    "name": "Pink Fairy Rose (Polyantha)",
    "englishName": "Pink Fairy Rose (Polyantha)",
    "tamilName": "பிங்க் ஃபேரி ரோஜா",
    "scientificName": "Rosa 'The Fairy'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Renowned polyantha rose producing endless dense trusses of small rosette baby pink blossoms.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 6,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/pink-fairy-polyantha-rose.png"
    ],
    "image": "/products/vrg/pink-fairy-polyantha-rose.png",
    "imageUrl": "/products/vrg/pink-fairy-polyantha-rose.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "pink fairy rose (polyantha)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-teddy-bear-terracotta-rose",
    "sku": "VRG-RARE-073",
    "name": "Teddy Bear Rose (Terracotta Brown)",
    "englishName": "Teddy Bear Rose (Terracotta Brown)",
    "tamilName": "டெடி பியர் டெரகோட்டா ரோஜா",
    "scientificName": "Rosa 'Teddy Bear'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Extremely rare brownish copper-orange rose with unique vintage antique shading.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 1,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/teddy-bear-terracotta-rose.png"
    ],
    "image": "/products/vrg/teddy-bear-terracotta-rose.png",
    "imageUrl": "/products/vrg/teddy-bear-terracotta-rose.png",
    "plantHeight": "1.5-2.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "teddy bear rose (terracotta brown)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-black-jade-micro-mini-rose",
    "sku": "VRG-RARE-074",
    "name": "Black Jade Rose (Micro Mini)",
    "englishName": "Black Jade Rose (Micro Mini)",
    "tamilName": "பிளாக் ஜேட் ரோஜா",
    "scientificName": "Rosa 'Black Jade'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Darkest mini rose with almost black pointed buds opening into saturated deep garnet petals.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 3,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/black-jade-micro-mini-rose.png"
    ],
    "image": "/products/vrg/black-jade-micro-mini-rose.png",
    "imageUrl": "/products/vrg/black-jade-micro-mini-rose.png",
    "plantHeight": "1-1.5 Feet",
    "potSize": "6 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "black jade rose (micro mini)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-mini-eden-climbing-rose",
    "sku": "VRG-RARE-075",
    "name": "Mini Eden Rose (Romantic Climber)",
    "englishName": "Mini Eden Rose (Romantic Climber)",
    "tamilName": "மினி ஈடன் ரோஜா",
    "scientificName": "Rosa 'Mini Eden'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "French cabbage rose style miniature climber with bi-colored pink center and cream outer petals.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 3,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/mini-eden-climbing-rose.png"
    ],
    "image": "/products/vrg/mini-eden-climbing-rose.png",
    "imageUrl": "/products/vrg/mini-eden-climbing-rose.png",
    "plantHeight": "3-5 Feet Climber",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "mini eden rose (romantic climber)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-margo-koster-red-rose",
    "sku": "VRG-RARE-076",
    "name": "Margo Koster Red Rose",
    "englishName": "Margo Koster Red Rose",
    "tamilName": "மார்கோ கோஸ்டர் சிகப்பு ரோஜா",
    "scientificName": "Rosa 'Margo Koster Red'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Famous globe/cup-shaped Dutch polyantha rose forming tight round glowing red pompons.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 7,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/margo-koster-red-rose.png"
    ],
    "image": "/products/vrg/margo-koster-red-rose.png",
    "imageUrl": "/products/vrg/margo-koster-red-rose.png",
    "plantHeight": "1.5-2.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "margo koster red rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-blue-for-you-rose",
    "sku": "VRG-RARE-077",
    "name": "Blue For You Rose (Slate Blue)",
    "englishName": "Blue For You Rose (Slate Blue)",
    "tamilName": "ப்ளூ ஃபார் யூ அரிய ரோஜா",
    "scientificName": "Rosa 'Blue for You'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Stunning slate lilac-blue floribunda with rich spicy fragrance and pale center eye.",
    "mrp": 170,
    "sellingPrice": 120,
    "discount": 29,
    "stock": 25,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/blue-for-you-rose.png"
    ],
    "image": "/products/vrg/blue-for-you-rose.png",
    "imageUrl": "/products/vrg/blue-for-you-rose.png",
    "plantHeight": "2.5-3.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "blue for you rose (slate blue)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-stars-n-stripes-rose",
    "sku": "VRG-RARE-078",
    "name": "Stars 'n' Stripes Rose",
    "englishName": "Stars 'n' Stripes Rose",
    "tamilName": "ஸ்டார்ஸ் அண்ட் ஸ்ட்ரைப்ஸ் ரோஜா",
    "scientificName": "Rosa 'Stars 'n' Stripes'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Fascinating striped miniature rose with peppermint candy red and white radiating stripes.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 5,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/stars-n-stripes-rose.png"
    ],
    "image": "/products/vrg/stars-n-stripes-rose.png",
    "imageUrl": "/products/vrg/stars-n-stripes-rose.png",
    "plantHeight": "1.5-2.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "stars 'n' stripes rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-fire-works-ruffle-rose",
    "sku": "VRG-RARE-079",
    "name": "Fireworks Ruffle Rose",
    "englishName": "Fireworks Ruffle Rose",
    "tamilName": "ஃபயர் ஒர்க்ஸ் ரஃபிள் ரோஜா",
    "scientificName": "Rosa 'Fireworks Ruffle'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Sensational ruffled serrated petals resembling firework explosions in warm red and gold.",
    "mrp": 170,
    "sellingPrice": 120,
    "discount": 29,
    "stock": 7,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/fire-works-ruffle-rose.png"
    ],
    "image": "/products/vrg/fire-works-ruffle-rose.png",
    "imageUrl": "/products/vrg/fire-works-ruffle-rose.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "fireworks ruffle rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-kordes-jubilee-rose",
    "sku": "VRG-RARE-080",
    "name": "Kordes' Jubilee Rose",
    "englishName": "Kordes' Jubilee Rose",
    "tamilName": "கார்டீஸ் ஜூபிலி ரோஜா",
    "scientificName": "Rosa 'Kordes Jubilee'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Massive high-centered yellow blooms broadly edged with vibrant fuchsia pink and sweet fruit fragrance.",
    "mrp": 170,
    "sellingPrice": 120,
    "discount": 29,
    "stock": 14,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/kordes-jubilee-rose.png"
    ],
    "image": "/products/vrg/kordes-jubilee-rose.png",
    "imageUrl": "/products/vrg/kordes-jubilee-rose.png",
    "plantHeight": "3-4 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "kordes' jubilee rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-lavender-simplicity-rose",
    "sku": "VRG-RARE-081",
    "name": "Lavender Simplicity Rose",
    "englishName": "Lavender Simplicity Rose",
    "tamilName": "லாவெண்டர் சிம்ப்ளிசிட்டி ரோஜா",
    "scientificName": "Rosa 'Lavender Simplicity'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Clear pastel lavender hedge rose with clean citrus aroma and excellent disease resistance.",
    "mrp": 170,
    "sellingPrice": 120,
    "discount": 29,
    "stock": 4,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/lavender-simplicity-rose.png"
    ],
    "image": "/products/vrg/lavender-simplicity-rose.png",
    "imageUrl": "/products/vrg/lavender-simplicity-rose.png",
    "plantHeight": "2.5-3.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "lavender simplicity rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-paper-moon-exotic-rose",
    "sku": "VRG-RARE-082",
    "name": "Paper Moon Rose",
    "englishName": "Paper Moon Rose",
    "tamilName": "பேப்பர் மூன் ரோஜா",
    "scientificName": "Rosa 'Paper Moon'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Ethereal translucent silvery white rose with delicate lavender undertones.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 2,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/paper-moon-exotic-rose.png"
    ],
    "image": "/products/vrg/paper-moon-exotic-rose.png",
    "imageUrl": "/products/vrg/paper-moon-exotic-rose.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "paper moon rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-margo-koster-pink-rose",
    "sku": "VRG-RARE-083",
    "name": "Margo Koster Pink Rose",
    "englishName": "Margo Koster Pink Rose",
    "tamilName": "மார்கோ கோஸ்டர் பிங்க் ரோஜா",
    "scientificName": "Rosa 'Margo Koster Pink'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Charming soft salmon-pink cup-shaped globe rose blooming in tight cheerful sprays.",
    "mrp": 170,
    "sellingPrice": 120,
    "discount": 29,
    "stock": 4,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/margo-koster-pink-rose.png"
    ],
    "image": "/products/vrg/margo-koster-pink-rose.png",
    "imageUrl": "/products/vrg/margo-koster-pink-rose.png",
    "plantHeight": "1.5-2.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "margo koster pink rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-honey-dijon-mustard-rose",
    "sku": "VRG-RARE-084",
    "name": "Honey Dijon Rose",
    "englishName": "Honey Dijon Rose",
    "tamilName": "ஹனி டிஜோன் அரிய ரோஜா",
    "scientificName": "Rosa 'Honey Dijon'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Unique warm caramel, honey-mustard colored grandiflora rose with intoxicating fruity scent.",
    "mrp": 170,
    "sellingPrice": 120,
    "discount": 29,
    "stock": 25,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/honey-dijon-mustard-rose.png"
    ],
    "image": "/products/vrg/honey-dijon-mustard-rose.png",
    "imageUrl": "/products/vrg/honey-dijon-mustard-rose.png",
    "plantHeight": "3-4 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "honey dijon rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-chocolate-rose-terracotta",
    "sku": "VRG-RARE-085",
    "name": "Chocolate Rose",
    "englishName": "Chocolate Rose",
    "tamilName": "சாக்லேட் பிரவுன் ரோஜா",
    "scientificName": "Rosa 'Hot Cocoa'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Deep velvety cinnamon-chocolate petals with smoked purple reverse, highly prized by florists.",
    "mrp": 170,
    "sellingPrice": 120,
    "discount": 29,
    "stock": 5,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/chocolate-rose-terracotta.png"
    ],
    "image": "/products/vrg/chocolate-rose-terracotta.png",
    "imageUrl": "/products/vrg/chocolate-rose-terracotta.png",
    "plantHeight": "2.5-3.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "chocolate rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-black-magic-exotic-rose",
    "sku": "VRG-RARE-086",
    "name": "Black Magic Rose",
    "englishName": "Black Magic Rose",
    "tamilName": "பிளாக் மேஜிக் ரோஜா",
    "scientificName": "Rosa 'Black Magic'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "World-famous deep dark blackish-red velvet rose with long vase life and commanding presence.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 25,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/black-magic-exotic-rose.png"
    ],
    "image": "/products/vrg/black-magic-exotic-rose.png",
    "imageUrl": "/products/vrg/black-magic-exotic-rose.png",
    "plantHeight": "3-4 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "black magic rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-abracadabra-tiger-rose",
    "sku": "VRG-RARE-087",
    "name": "Abracadabra (Tiger Rose)",
    "englishName": "Abracadabra (Tiger Rose)",
    "tamilName": "அப்ரகதாப்ரா (டைகர் ஸ்ட்ரைப் ரோஜா)",
    "scientificName": "Rosa 'Abracadabra'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Exotic striped rose with dramatic splashes of lemon yellow and rich black-burgundy on every petal.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 25,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/abracadabra-tiger-rose.png"
    ],
    "image": "/products/vrg/abracadabra-tiger-rose.png",
    "imageUrl": "/products/vrg/abracadabra-tiger-rose.png",
    "plantHeight": "2.5-3.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "abracadabra (tiger rose)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-fireworks-ruffle-crimson",
    "sku": "VRG-RARE-088",
    "name": "Fireworks Ruffle Crimson Rose",
    "englishName": "Fireworks Ruffle Crimson Rose",
    "tamilName": "ஃபயர் ஒர்க்ஸ் ரஃபிள் சிகப்பு ரோஜா",
    "scientificName": "Rosa 'Fireworks Ruffle Crimson'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "Dramatic fringed crimson red exotic floribunda rose with ruffled wavy petal edges.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 25,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/fireworks-ruffle-crimson.png"
    ],
    "image": "/products/vrg/fireworks-ruffle-crimson.png",
    "imageUrl": "/products/vrg/fireworks-ruffle-crimson.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "fireworks ruffle crimson rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-alfred-sisley-striped-rose",
    "sku": "VRG-RARE-089",
    "name": "Alfred Sisley Rose",
    "englishName": "Alfred Sisley Rose",
    "tamilName": "ஆல்ஃபிரட் சிஸ்லே பிரெஞ்ச் ரோஜா",
    "scientificName": "Rosa 'Alfred Sisley'",
    "categoryId": "cat-rare",
    "categoryName": "Rare & Exotic Roses",
    "description": "French painter rose boasting brushstrokes of orange, pink, and yellow with light apple fragrance.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 5,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/alfred-sisley-striped-rose.png"
    ],
    "image": "/products/vrg/alfred-sisley-striped-rose.png",
    "imageUrl": "/products/vrg/alfred-sisley-striped-rose.png",
    "plantHeight": "2.5-3.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rare & exotic roses",
      "alfred sisley rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-anny-duperey-golden-rose",
    "sku": "VRG-ROSE-090",
    "name": "Anny Duperey Rose (Golden Yellow)",
    "englishName": "Anny Duperey Rose (Golden Yellow)",
    "tamilName": "அன்னி டுபெரே மஞ்சள் ரோஜா",
    "scientificName": "Rosa 'Anny Duperey'",
    "categoryId": "cat-rose",
    "categoryName": "Rose Varieties",
    "description": "French Romantica yellow rose bearing deeply cupped golden blooms with delicious citrus fragrance.",
    "mrp": 170,
    "sellingPrice": 120,
    "discount": 29,
    "stock": 23,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/anny-duperey-golden-rose.png"
    ],
    "image": "/products/vrg/anny-duperey-golden-rose.png",
    "imageUrl": "/products/vrg/anny-duperey-golden-rose.png",
    "plantHeight": "2.5-3.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rose varieties",
      "anny duperey rose (golden yellow)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-button-pink-rose",
    "sku": "VRG-ROSE-091",
    "name": "Button Pink Rose",
    "englishName": "Button Pink Rose",
    "tamilName": "பட்டன் பிங்க் ரோஜா",
    "scientificName": "Rosa 'Button Pink'",
    "categoryId": "cat-rose",
    "categoryName": "Rose Varieties",
    "description": "Heavy blooming button rosette pink roses that flower in tight clusters all year round.",
    "mrp": 120,
    "sellingPrice": 80,
    "discount": 33,
    "stock": 7,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/button-pink-rose.png"
    ],
    "image": "/products/vrg/button-pink-rose.png",
    "imageUrl": "/products/vrg/button-pink-rose.png",
    "plantHeight": "1.5-2.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rose varieties",
      "button pink rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-sentimental-balloon-rose",
    "sku": "VRG-ROSE-092",
    "name": "Sentimental Rose (Balloon Rose)",
    "englishName": "Sentimental Rose (Balloon Rose)",
    "tamilName": "சென்டிமென்டல் பலூன் ரோஜா",
    "scientificName": "Rosa 'Scentimental'",
    "categoryId": "cat-rose",
    "categoryName": "Rose Varieties",
    "description": "Striking burgundy and white swirl-striped balloon rose with strong damask perfume.",
    "mrp": 120,
    "sellingPrice": 80,
    "discount": 33,
    "stock": 4,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/sentimental-balloon-rose.png"
    ],
    "image": "/products/vrg/sentimental-balloon-rose.png",
    "imageUrl": "/products/vrg/sentimental-balloon-rose.png",
    "plantHeight": "2.5-3.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "rose varieties",
      "sentimental rose (balloon rose)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-orange-jadiga-rose",
    "sku": "VRG-ROSE-093",
    "name": "Orange Jadiga Rose",
    "englishName": "Orange Jadiga Rose",
    "tamilName": "ஆரஞ்சு ஜாடிகா ரோஜா",
    "scientificName": "Rosa 'Orange Jadiga'",
    "categoryId": "cat-rose",
    "categoryName": "Rose Varieties",
    "description": "Intense tangerine-orange traditional scented rose with layered ruffled petals.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 3,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/orange-jadiga-rose.png"
    ],
    "image": "/products/vrg/orange-jadiga-rose.png",
    "imageUrl": "/products/vrg/orange-jadiga-rose.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "rose varieties",
      "orange jadiga rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-apple-red-rose",
    "sku": "VRG-ROSE-094",
    "name": "Apple Red Rose",
    "englishName": "Apple Red Rose",
    "tamilName": "ஆப்பிள் சிகப்பு ரோஜா",
    "scientificName": "Rosa 'Apple Red'",
    "categoryId": "cat-rose",
    "categoryName": "Rose Varieties",
    "description": "Crisp bright apple-red rose with high petal count and outstanding disease resistance.",
    "mrp": 120,
    "sellingPrice": 80,
    "discount": 33,
    "stock": 10,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/apple-red-rose.png"
    ],
    "image": "/products/vrg/apple-red-rose.png",
    "imageUrl": "/products/vrg/apple-red-rose.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rose varieties",
      "apple red rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-summer-snow-pink-rose",
    "sku": "VRG-ROSE-095",
    "name": "Summer Snow Pink Rose",
    "englishName": "Summer Snow Pink Rose",
    "tamilName": "சம்மர் ஸ்நோ பிங்க் ரோஜா",
    "scientificName": "Rosa 'Summer Snow Pink'",
    "categoryId": "cat-rose",
    "categoryName": "Rose Varieties",
    "description": "Cluster flowering floribunda with ruffled baby pink petals creating a snow-like coverage of flowers.",
    "mrp": 120,
    "sellingPrice": 80,
    "discount": 33,
    "stock": 2,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/summer-snow-pink-rose.png"
    ],
    "image": "/products/vrg/summer-snow-pink-rose.png",
    "imageUrl": "/products/vrg/summer-snow-pink-rose.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "rose varieties",
      "summer snow pink rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-apricot-tea-rose",
    "sku": "VRG-ROSE-096",
    "name": "Apricot Rose",
    "englishName": "Apricot Rose",
    "tamilName": "ஆப்ரிகாட் ரோஜா",
    "scientificName": "Rosa 'Apricot'",
    "categoryId": "cat-rose",
    "categoryName": "Rose Varieties",
    "description": "Soft pastel peach-apricot hybrid tea rose with elegant spiral center and delicate tea scent.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 5,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/apricot-tea-rose.png"
    ],
    "image": "/products/vrg/apricot-tea-rose.png",
    "imageUrl": "/products/vrg/apricot-tea-rose.png",
    "plantHeight": "2.5-3.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "rose varieties",
      "apricot rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-skintone-blush-rose",
    "sku": "VRG-ROSE-097",
    "name": "Skintone Rose (Blush Nude)",
    "englishName": "Skintone Rose (Blush Nude)",
    "tamilName": "ஸ்கின்டோன் ரோஜா",
    "scientificName": "Rosa 'Skintone'",
    "categoryId": "cat-rose",
    "categoryName": "Rose Varieties",
    "description": "Chic nude cream-blush modern floribunda rose favored for premium wedding decor.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 6,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/skintone-blush-rose.png"
    ],
    "image": "/products/vrg/skintone-blush-rose.png",
    "imageUrl": "/products/vrg/skintone-blush-rose.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "rose varieties",
      "skintone rose (blush nude)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-7-days-yellow-rose",
    "sku": "VRG-ROSE-098",
    "name": "7 Days Yellow Rose",
    "englishName": "7 Days Yellow Rose",
    "tamilName": "7 டேஸ் மஞ்சள் ரோஜா",
    "scientificName": "Rosa 'Seven Days Yellow'",
    "categoryId": "cat-rose",
    "categoryName": "Rose Varieties",
    "description": "Continuous blooming everblooming sunny yellow rose that produces new flush of flowers every week.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 4,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/7-days-yellow-rose.png"
    ],
    "image": "/products/vrg/7-days-yellow-rose.png",
    "imageUrl": "/products/vrg/7-days-yellow-rose.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rose varieties",
      "7 days yellow rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-white-panneer-rose",
    "sku": "VRG-ROSE-100",
    "name": "White Panneer Rose",
    "englishName": "White Panneer Rose",
    "tamilName": "வெள்ளை பன்னீர் ரோஜா",
    "scientificName": "Rosa damascena 'Alba'",
    "categoryId": "cat-rose",
    "categoryName": "Rose Varieties",
    "description": "Traditional pure white panneer rose with authentic holy rosewater scent for puja and garlands.",
    "mrp": 160,
    "sellingPrice": 120,
    "discount": 25,
    "stock": 3,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/white-panneer-rose.png"
    ],
    "image": "/products/vrg/white-panneer-rose.png",
    "imageUrl": "/products/vrg/white-panneer-rose.png",
    "plantHeight": "2.5-3.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rose varieties",
      "white panneer rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-kashmiri-scented-rose",
    "sku": "VRG-ROSE-101",
    "name": "Kashmiri Rose",
    "englishName": "Kashmiri Rose",
    "tamilName": "காஷ்மீரி ரோஜா",
    "scientificName": "Rosa 'Kashmir'",
    "categoryId": "cat-rose",
    "categoryName": "Rose Varieties",
    "description": "Intensely scented deep crimson Kashmir rose with velvety petals and rich therapeutic aroma.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 2,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/kashmiri-scented-rose.png"
    ],
    "image": "/products/vrg/kashmiri-scented-rose.png",
    "imageUrl": "/products/vrg/kashmiri-scented-rose.png",
    "plantHeight": "2.5-3.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rose varieties",
      "kashmiri rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-naatu-paneer-rose",
    "sku": "VRG-ROSE-102",
    "name": "Naatu Rose (Country Paneer Rose)",
    "englishName": "Naatu Rose (Country Paneer Rose)",
    "tamilName": "நாட்டு பன்னீர் ரோஜா",
    "scientificName": "Rosa damascena 'Country'",
    "categoryId": "cat-rose",
    "categoryName": "Rose Varieties",
    "description": "Evergreen heirloom country paneer rose producing thousands of fragrant pink petals for gulkand and pooja.",
    "mrp": 110,
    "sellingPrice": 70,
    "discount": 36,
    "stock": 17,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/naatu-paneer-rose.png"
    ],
    "image": "/products/vrg/naatu-paneer-rose.png",
    "imageUrl": "/products/vrg/naatu-paneer-rose.png",
    "plantHeight": "2.5-4 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rose varieties",
      "naatu rose (country paneer rose)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-calcutta-rose-heavy-bloomer",
    "sku": "VRG-ROSE-103",
    "name": "Calcutta Rose",
    "englishName": "Calcutta Rose",
    "tamilName": "கல்கத்தா ரோஜா",
    "scientificName": "Rosa 'Calcutta'",
    "categoryId": "cat-rose",
    "categoryName": "Rose Varieties",
    "description": "Prolific heavy-blooming dark pink commercial garland rose with great heat tolerance.",
    "mrp": 120,
    "sellingPrice": 80,
    "discount": 33,
    "stock": 6,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/calcutta-rose-heavy-bloomer.png"
    ],
    "image": "/products/vrg/calcutta-rose-heavy-bloomer.png",
    "imageUrl": "/products/vrg/calcutta-rose-heavy-bloomer.png",
    "plantHeight": "2.5-3.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rose varieties",
      "calcutta rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-7-days-red-rose",
    "sku": "VRG-ROSE-104",
    "name": "7 Days Rose (Everblooming Red)",
    "englishName": "7 Days Rose (Everblooming Red)",
    "tamilName": "7 டேஸ் சிகப்பு ரோஜா",
    "scientificName": "Rosa 'Seven Days Red'",
    "categoryId": "cat-rose",
    "categoryName": "Rose Varieties",
    "description": "Our #1 best-selling everblooming garden rose that yields rich red blooms non-stop every single week.",
    "mrp": 190,
    "sellingPrice": 140,
    "discount": 26,
    "stock": 41,
    "rating": 5.0,
    "reviewCount": 18,
    "images": [
      "/products/vrg/7-days-red-rose.png"
    ],
    "image": "/products/vrg/7-days-red-rose.png",
    "imageUrl": "/products/vrg/7-days-red-rose.png",
    "plantHeight": "2-3 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": true,
    "bestSeller": true,
    "trending": true,
    "tags": [
      "rose varieties",
      "7 days rose (everblooming red)"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  },
  {
    "id": "vrg-british-queen-rose",
    "sku": "VRG-ROSE-105",
    "name": "British Queen Rose",
    "englishName": "British Queen Rose",
    "tamilName": "பிரிட்டிஷ் குயின் ரோஜா",
    "scientificName": "Rosa 'British Queen'",
    "categoryId": "cat-rose",
    "categoryName": "Rose Varieties",
    "description": "Vintage English style white-pink cupped rose with heavy petal layers and royal fragrance.",
    "mrp": 150,
    "sellingPrice": 100,
    "discount": 33,
    "stock": 3,
    "rating": 4.8,
    "reviewCount": 6,
    "images": [
      "/products/vrg/british-queen-rose.png"
    ],
    "image": "/products/vrg/british-queen-rose.png",
    "imageUrl": "/products/vrg/british-queen-rose.png",
    "plantHeight": "2.5-3.5 Feet",
    "potSize": "8 Inch Bag",
    "sunlight": "Full Sun",
    "waterRequirement": "Daily",
    "floweringSeason": "All Year",
    "careInstructions": {
      "watering": "Water daily in the morning, avoid over-soaking soil.",
      "sunlight": "Requires 4-6 hours direct sunlight.",
      "fertilizer": "Apply organic vermicompost / neem cake every 15 days.",
      "soil": "Well-draining red soil mixed with 30% coco peat."
    },
    "featured": false,
    "bestSeller": false,
    "trending": true,
    "tags": [
      "rose varieties",
      "british queen rose"
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "updatedAt": "2026-08-16T12:00:00.000Z"
  }
] as unknown as Product[];



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
const deletedProductIds: Set<string> = (globalThis as any)._deletedProductIds || ((globalThis as any)._deletedProductIds = loadDiskDeletedProducts());
const deletedCategoryIds = (globalThis as any)._deletedCategoryIds || ((globalThis as any)._deletedCategoryIds = new Set<string>());
const deletedCouponIds = (globalThis as any)._deletedCouponIds || ((globalThis as any)._deletedCouponIds = new Set<string>());
const deletedFinanceIds = (globalThis as any)._deletedFinanceIds || ((globalThis as any)._deletedFinanceIds = new Set<string>());
const deletedOrderIds: Set<string> = (globalThis as any)._deletedOrderIds || ((globalThis as any)._deletedOrderIds = loadDiskDeletedOrders());
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
    const cost = Number(data.costAmount) || (data.type === 'EXPENSE' ? Number((data as any).amount) : 0) || 0;
    const sell = Number(data.sellAmount) || (data.type === 'REVENUE' || (data.type as any) === 'INCOME' ? Number((data as any).amount) : 0) || 0;
    const amountVal = (data as any).amount !== undefined ? Number((data as any).amount) : (data.type === 'EXPENSE' ? cost : sell);

    const entry: FinancialEntry = {
      id: 'fin-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      type: data.type || 'EXPENSE',
      title: (data.title || (data as any).description || 'Nursery Expense').trim(),
      category: data.category || 'Other',
      costAmount: cost,
      sellAmount: sell,
      amount: amountVal,
      quantity: Math.max(1, Number(data.quantity) || 1),
      notes: (data.notes || (data as any).description || '').trim(),
      date: data.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    } as any;
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
      const cost = data.costAmount !== undefined ? Number(data.costAmount) : ((data as any).amount !== undefined && (data.type === 'EXPENSE' || list[idx].type === 'EXPENSE') ? Number((data as any).amount) : list[idx].costAmount);
      const sell = data.sellAmount !== undefined ? Number(data.sellAmount) : ((data as any).amount !== undefined && (data.type === 'REVENUE' || (data.type as any) === 'INCOME' || list[idx].type === 'REVENUE') ? Number((data as any).amount) : list[idx].sellAmount);
      const amountVal = (data as any).amount !== undefined ? Number((data as any).amount) : (data.costAmount !== undefined ? cost : (data.sellAmount !== undefined ? sell : (list[idx] as any).amount));

      list[idx] = {
        ...list[idx],
        ...(data.type ? { type: data.type } : {}),
        ...(data.title ? { title: data.title.trim() } : ((data as any).description ? { title: (data as any).description.trim() } : {})),
        ...(data.category ? { category: data.category } : {}),
        costAmount: cost,
        sellAmount: sell,
        amount: amountVal,
        ...(data.quantity !== undefined ? { quantity: Number(data.quantity) } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : ((data as any).description ? { notes: (data as any).description } : {})),
        ...(data.date ? { date: data.date } : {})
      } as any;
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
        const diskList = loadDiskProducts();
        const fallbackList = diskList.length > 0 ? diskList : DEFAULT_PRODUCTS;
        this.productsCache = {
          data: fallbackList.filter(p => !deletedProductIds.has(p.id) && (!p.sku || !deletedProductIds.has(p.sku))),
          expiresAt: Date.now() + 300000
        };
        return this.productsCache.data;
      }

      const items = await prisma.product.findMany({
        include: { categoryRel: true, inventory: true },
        orderBy: { createdAt: 'desc' }
      });

      let results: Product[] = items.map(p => {
        const primaryImage = p.image || (p.images && p.images.length > 0 ? p.images[0] : `/products/vrg/${p.id.replace('vrg-', '')}.png`);
        const allImages = p.images && p.images.length > 0 ? p.images : [primaryImage];
        return {
          id: p.id,
          sku: p.sku || `VRG-${p.id.slice(0, 6).toUpperCase()}`,
          name: p.name,
          englishName: p.name,
          tamilName: p.nameTamil || p.name,
          scientificName: p.scientificName || '',
          categoryId: p.categoryId || (p.category ? (p.category.toLowerCase().includes('rose') && !p.category.toLowerCase().includes('creeper') && !p.category.toLowerCase().includes('miniature') && !p.category.toLowerCase().includes('rare') ? 'cat-rose' : `cat-${p.category.toLowerCase().replace(/\s+/g, '-')}`) : 'cat-rose'),
          categoryName: p.category,
          description: p.description || '',
          mrp: p.originalPrice || p.price,
          sellingPrice: p.price,
          discount: p.originalPrice > 0 ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0,
          image: primaryImage,
          imageUrl: primaryImage,
          images: allImages,
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
        };
      });

      // Filter out explicitly deleted products
      let finalProducts = results.filter(p => !deletedProductIds.has(p.id) && (!p.sku || !deletedProductIds.has(p.sku)));

      // If database returned 0 products (cold start / DB empty), fallback to DEFAULT_PRODUCTS / disk
      if (finalProducts.length === 0) {
        const diskList = loadDiskProducts();
        const baseList = diskList.length > 0 ? diskList : DEFAULT_PRODUCTS;
        finalProducts = baseList.filter(p => !deletedProductIds.has(p.id) && (!p.sku || !deletedProductIds.has(p.sku)));
      } else {
        // Also merge any products that exist in disk store or DEFAULT_PRODUCTS but not in Prisma
        const dbIdSet = new Set(finalProducts.map(p => p.id));
        const dbSkuSet = new Set(finalProducts.map(p => p.sku).filter(Boolean));
        const diskList = loadDiskProducts();
        const fallbackList = diskList.length > 0 ? diskList : DEFAULT_PRODUCTS;
        for (const extra of fallbackList) {
          if (!deletedProductIds.has(extra.id) && (!extra.sku || !deletedProductIds.has(extra.sku))) {
            if (!dbIdSet.has(extra.id) && (!extra.sku || !dbSkuSet.has(extra.sku))) {
              finalProducts.push(extra);
              dbIdSet.add(extra.id);
              if (extra.sku) dbSkuSet.add(extra.sku);
            }
          }
        }
      }

      saveDiskProducts(finalProducts);
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

    // Always await the DB refresh when cache is stale — never return stale data from expired cache.
    // This eliminates the 'ghost period' where a newly-added product is missing because
    // the old fire-and-forget pattern returned the stale cache while the DB query ran in background.
    if (this.productsCache.expiresAt === 0 || Date.now() >= this.productsCache.expiresAt) {
      await this.refreshProductsCache();
    }

    const currentList = this.productsCache.data;
    return isFullQuery ? currentList : applyFilters(currentList);
  }


  async getProductById(id: string): Promise<Product | undefined> {
    if (deletedProductIds.has(id)) return undefined;
    if (this.productsCache.data && this.productsCache.data.length > 0) {
      const match = this.productsCache.data.find(p => (p.id === id || p.sku === id) && !deletedProductIds.has(p.id));
      if (match) return match;
    }

    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const p = await prisma.product.findFirst({
          where: { OR: [{ id }, { sku: id }] },
          include: { categoryRel: true, inventory: true }
        });
        if (p && !deletedProductIds.has(p.id)) {
          const primaryImage = p.image || (p.images && p.images.length > 0 ? p.images[0] : `/products/vrg/${p.id.replace('vrg-', '')}.png`);
          const allImages = p.images && p.images.length > 0 ? p.images : [primaryImage];
          return {
            id: p.id,
            sku: p.sku || `VRG-${p.id.slice(0, 6).toUpperCase()}`,
            name: p.name,
            englishName: p.name,
            tamilName: p.nameTamil || p.name,
            scientificName: p.scientificName || '',
            categoryId: p.categoryId || '',
            categoryName: p.category,
            description: p.description || '',
            mrp: p.originalPrice || p.price,
            sellingPrice: p.price,
            discount: p.originalPrice > 0 ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0,
            image: primaryImage,
            imageUrl: primaryImage,
            images: allImages,
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
    return DEFAULT_PRODUCTS.find(p => (p.id === id || p.sku === id) && !deletedProductIds.has(p.id));
  }

  async updateStock(id: string, newStock: number): Promise<boolean> {
    const updated = await this.updateProduct(id, { stock: Number(newStock) });
    return Boolean(updated);
  }

  async addProduct(product: Partial<Product> & { name: string }): Promise<Product> {
    const prisma = getPrismaClient();
    const id = 'prod-' + Date.now();
    const sku = product.sku || `VRG-${id.slice(-6).toUpperCase()}`;
    deletedProductIds.delete(id);
    deletedProductIds.delete(sku);
    saveDiskDeletedProducts(deletedProductIds);

    // Fast verify categoryId from in-memory categories cache to avoid 400ms Neon network query
    let validCategoryId: string | null = null;
    const normCat = product.categoryId === 'cat-roses' ? 'cat-rose' : (product.categoryId || 'cat-rose');
    if (this.categoriesCache?.data?.some(c => c.id === normCat)) {
      validCategoryId = normCat;
    } else if (prisma) {
      try {
        const cat = await prisma.category.findFirst({
          where: { OR: [{ id: normCat }, { slug: normCat }, { name: { equals: product.categoryName || '', mode: 'insensitive' } }] }
        });
        if (cat) validCategoryId = cat.id;
      } catch {
        validCategoryId = 'cat-rose';
      }
    }
    if (!validCategoryId) validCategoryId = 'cat-rose';

    const cleanImages = Array.isArray(product.images) && product.images.filter(Boolean).length > 0
      ? product.images.filter(Boolean)
      : (product as any).imageUrl ? [String((product as any).imageUrl).trim()]
      : (product as any).image ? [String((product as any).image).trim()]
      : ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'];

    const newProd: Product = {
      ...product,
      id,
      sku,
      categoryId: validCategoryId,
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
            careSoil: typeof product.careInstructions === 'object' ? product.careInstructions?.soil || 'Red soil' : 'Red soil',
            inventory: {
              create: {
                quantity: Number(product.stock) >= 0 ? Number(product.stock) : 50
              }
            }
          }
        });

        newProd.createdAt = created.createdAt.toISOString();
        newProd.updatedAt = created.updatedAt.toISOString();
      } catch (err: any) {
        console.error('Prisma addProduct error:', err);
        // If duplicate SKU collision, retry with guaranteed unique timestamp SKU
        if (err?.code === 'P2002' || (err?.message && err.message.includes('sku'))) {
          try {
            const fallbackSku = `VRG-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
            newProd.sku = fallbackSku;
            const retryCreated = await prisma.product.create({
              data: {
                id,
                sku: fallbackSku,
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
                careSoil: typeof product.careInstructions === 'object' ? product.careInstructions?.soil || 'Red soil' : 'Red soil',
                inventory: {
                  create: {
                    quantity: Number(product.stock) >= 0 ? Number(product.stock) : 50
                  }
                }
              }
            });
            newProd.createdAt = retryCreated.createdAt.toISOString();
            newProd.updatedAt = retryCreated.updatedAt.toISOString();
          } catch (retryErr) {
            console.error('Prisma addProduct retry failed:', retryErr);
          }
        }
      }
    }

    // Always maintain in DEFAULT_PRODUCTS memory array and update productsCache
    DEFAULT_PRODUCTS.unshift(newProd);
    if (this.productsCache && Array.isArray(this.productsCache.data)) {
      this.productsCache.data = [newProd, ...this.productsCache.data.filter(p => p.id !== newProd.id && p.sku !== newProd.sku)];
      this.productsCache.expiresAt = Date.now() + 300000;
    }
    saveDiskProducts(this.productsCache?.data || DEFAULT_PRODUCTS);
    return newProd;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const cleanId = (id || '').trim();
    if (!cleanId) return null;

    deletedProductIds.delete(cleanId);
    deletedProductIds.delete(cleanId.toLowerCase());
    if (updates.sku) {
      deletedProductIds.delete(updates.sku);
      deletedProductIds.delete(updates.sku.toLowerCase());
    }
    saveDiskDeletedProducts(deletedProductIds);

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
    let targetDbId = cleanId;

    if (prisma) {
      try {
        const existingDbProd = await prisma.product.findFirst({
          where: { OR: [{ id: cleanId }, { sku: cleanId }, ...(updates.sku ? [{ sku: updates.sku }] : [])] },
          include: { categoryRel: true, inventory: true }
        });
        if (existingDbProd) {
          targetDbId = existingDbProd.id;
        }

        let validCategoryId: string | null = null;
        const requestedCatId = updates.categoryId || existingDbProd?.categoryId;
        const requestedCatName = updates.categoryName || existingDbProd?.category;
        if (requestedCatId) {
          const normCatId = requestedCatId === 'cat-roses' ? 'cat-rose' : requestedCatId;
          if (this.categoriesCache?.data?.some(c => c.id === normCatId)) {
            validCategoryId = normCatId;
          } else {
            const cat = await prisma.category.findFirst({
              where: { OR: [{ id: normCatId }, { slug: normCatId }, { name: { equals: requestedCatName || '', mode: 'insensitive' } }] }
            });
            if (cat) validCategoryId = cat.id;
          }
        }
        if (!validCategoryId && requestedCatName) {
          const cat = await prisma.category.findFirst({
            where: { name: { equals: requestedCatName, mode: 'insensitive' } }
          });
          if (cat) validCategoryId = cat.id;
        }
        if (!validCategoryId) {
          validCategoryId = existingDbProd?.categoryId || 'cat-rose';
        }

        const p = await prisma.product.upsert({
          where: { id: targetDbId },
          update: {
            ...(updates.name ? { name: updates.name } : {}),
            ...(updates.tamilName !== undefined ? { nameTamil: updates.tamilName } : (updates.name ? { nameTamil: updates.name } : {})),
            ...(updates.scientificName !== undefined ? { scientificName: updates.scientificName } : {}),
            ...(updates.sellingPrice !== undefined ? { price: Number(updates.sellingPrice) } : {}),
            ...(updates.mrp !== undefined ? { originalPrice: Number(updates.mrp) } : {}),
            ...(updates.description !== undefined ? { description: updates.description } : {}),
            ...(cleanImages ? { images: cleanImages, image: cleanImages[0] } : {}),
            ...(updates.featured !== undefined ? { isFeatured: Boolean(updates.featured) } : {}),
            ...(updates.bestSeller !== undefined ? { isBestSeller: Boolean(updates.bestSeller) } : {}),
            ...(validCategoryId ? { categoryId: validCategoryId } : {}),
            ...(updates.categoryName ? { category: updates.categoryName } : {}),
            ...(updates.potSize ? { potSize: updates.potSize } : {}),
            ...(updates.stock !== undefined ? { inStock: Number(updates.stock) > 0 } : {}),
            ...(updates.careInstructions?.watering ? { careWatering: updates.careInstructions.watering } : {}),
            ...(updates.careInstructions?.sunlight ? { careSunlight: updates.careInstructions.sunlight } : {}),
            ...(updates.careInstructions?.fertilizer ? { careFertilizer: updates.careInstructions.fertilizer } : {}),
            ...(updates.careInstructions?.soil ? { careSoil: updates.careInstructions.soil } : {})
          },
          create: {
            id: targetDbId,
            sku: updates.sku || existingDbProd?.sku || `VRG-${targetDbId.slice(-6).toUpperCase()}`,
            name: updates.name || 'Rose Plant',
            nameTamil: updates.tamilName || updates.name || 'ரோஜா செடி',
            scientificName: updates.scientificName || '',
            category: updates.categoryName || 'Rose Varieties',
            categoryId: validCategoryId || 'cat-rose',
            description: updates.description || '',
            price: Number(updates.sellingPrice) || 199,
            originalPrice: Number(updates.mrp) || Number(updates.sellingPrice) || 249,
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
          },
          include: { categoryRel: true, inventory: true }
        });

        if (updates.stock !== undefined) {
          await prisma.inventory.upsert({
            where: { productId: targetDbId },
            update: { quantity: Number(updates.stock) },
            create: { productId: targetDbId, quantity: Number(updates.stock) }
          }).catch(() => {});
        }

        prismaUpdated = {
          id: p.id,
          sku: p.sku || `VRG-${p.id.slice(0, 6).toUpperCase()}`,
          name: p.name,
          englishName: p.name,
          tamilName: p.nameTamil || p.name,
          scientificName: p.scientificName || '',
          categoryId: p.categoryId || 'cat-rose',
          categoryName: p.category,
          description: p.description || '',
          mrp: p.originalPrice || p.price,
          sellingPrice: p.price,
          discount: p.originalPrice > 0 ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0,
          images: p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
          rating: p.rating || 5.0,
          reviewCount: p.reviewsCount || 0,
          stock: updates.stock !== undefined ? Number(updates.stock) : (p.inventory?.quantity ?? 50),
          plantHeight: updates.plantHeight || '1.5 - 2 Feet',
          potSize: p.potSize || updates.potSize || '8 Inch Bag',
          sunlight: (p.careSunlight as any) || updates.sunlight || 'Full Sun',
          waterRequirement: (p.careWatering as any) || updates.waterRequirement || 'Daily',
          floweringSeason: updates.floweringSeason || 'All Year',
          careInstructions: {
            watering: p.careWatering || updates.careInstructions?.watering || 'Water daily in the morning.',
            sunlight: p.careSunlight || updates.careInstructions?.sunlight || 'Requires 5 hours direct sunlight.',
            fertilizer: p.careFertilizer || updates.careInstructions?.fertilizer || 'Organic compost',
            soil: p.careSoil || updates.careInstructions?.soil || 'Red soil'
          },
          featured: Boolean(p.isFeatured),
          bestSeller: Boolean(p.isBestSeller),
          trending: true,
          tags: [p.category.toLowerCase()],
          status: 'ACTIVE' as const,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString()
        };
      } catch (err) {
        console.warn('Prisma updateProduct fallback notice:', err);
      }
    }

    let finalUpdatedProduct: Product;
    if (prismaUpdated) {
      finalUpdatedProduct = prismaUpdated;
      const defIndex = DEFAULT_PRODUCTS.findIndex(p => p.id === cleanId || p.sku === cleanId || p.id === targetDbId);
      if (defIndex !== -1) {
        DEFAULT_PRODUCTS[defIndex] = finalUpdatedProduct;
      } else {
        DEFAULT_PRODUCTS.unshift(finalUpdatedProduct);
      }
    } else {
      const defIndex = DEFAULT_PRODUCTS.findIndex(p => p.id === cleanId || p.sku === cleanId || p.id === targetDbId);
      if (defIndex !== -1) {
        DEFAULT_PRODUCTS[defIndex] = {
          ...DEFAULT_PRODUCTS[defIndex],
          ...normalizedUpdates,
          updatedAt: new Date().toISOString()
        };
        finalUpdatedProduct = DEFAULT_PRODUCTS[defIndex];
      } else {
        const updatedItem: Product = {
          id: cleanId,
          sku: updates.sku || `VRG-${cleanId.slice(-6).toUpperCase()}`,
          name: updates.name || 'Plant',
          englishName: updates.englishName || updates.name || 'Plant',
          tamilName: updates.tamilName || updates.name || '',
          scientificName: updates.scientificName || '',
          categoryName: updates.categoryName || 'Roses',
          categoryId: updates.categoryId === 'cat-roses' ? 'cat-rose' : (updates.categoryId || 'cat-rose'),
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
    }

    // Sync in-memory productsCache so immediate reads return updated product
    if (this.productsCache && Array.isArray(this.productsCache.data)) {
      const cIdx = this.productsCache.data.findIndex(p => p.id === cleanId || p.sku === cleanId || p.id === targetDbId);
      if (cIdx !== -1) {
        this.productsCache.data[cIdx] = {
          ...this.productsCache.data[cIdx],
          ...finalUpdatedProduct
        };
      } else {
        this.productsCache.data.unshift(finalUpdatedProduct);
      }
    }
    saveDiskProducts(this.productsCache?.data || DEFAULT_PRODUCTS);
    this.invalidateProductsCache();
    return finalUpdatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const cleanId = (id || '').trim();
    if (!cleanId) return false;

    deletedProductIds.add(cleanId);
    deletedProductIds.add(cleanId.toLowerCase());
    saveDiskDeletedProducts(deletedProductIds);

    // Also remove from in-memory DEFAULT_PRODUCTS
    const defIdx = DEFAULT_PRODUCTS.findIndex(p => 
      p.id === cleanId || 
      p.sku === cleanId || 
      p.id.toLowerCase() === cleanId.toLowerCase() ||
      (p.sku && p.sku.toLowerCase() === cleanId.toLowerCase())
    );
    if (defIdx !== -1) {
      const match = DEFAULT_PRODUCTS[defIdx];
      if (match.id) {
        deletedProductIds.add(match.id);
        deletedProductIds.add(match.id.toLowerCase());
      }
      if (match.sku) {
        deletedProductIds.add(match.sku);
        deletedProductIds.add(match.sku.toLowerCase());
      }
      DEFAULT_PRODUCTS.splice(defIdx, 1);
    }

    if (this.productsCache && Array.isArray(this.productsCache.data)) {
      this.productsCache.data = this.productsCache.data.filter(p => 
        p.id !== cleanId && 
        p.sku !== cleanId &&
        p.id.toLowerCase() !== cleanId.toLowerCase() &&
        (p.sku ? p.sku.toLowerCase() !== cleanId.toLowerCase() : true)
      );
    }
    saveDiskProducts(this.productsCache?.data || DEFAULT_PRODUCTS);
    this.invalidateProductsCache();
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await Promise.all([
          prisma.orderItem.deleteMany({ where: { productId: cleanId } }).catch(() => {}),
          prisma.combo.deleteMany({ where: { OR: [{ id: cleanId }, { id: cleanId.toLowerCase() }] } }).catch(() => {})
        ]);
        await prisma.product.deleteMany({
          where: {
            OR: [
              { id: cleanId },
              { sku: cleanId },
              { id: { equals: cleanId, mode: 'insensitive' } },
              { sku: { equals: cleanId, mode: 'insensitive' } }
            ]
          }
        }).catch(() => {});
      } catch (err) {
        console.error('Prisma deleteProduct error:', err);
      }
    }
    return true;
  }

  async deleteAllProducts(): Promise<boolean> {
    DEFAULT_PRODUCTS.forEach(p => {
      deletedProductIds.add(p.id);
      if (p.sku) deletedProductIds.add(p.sku);
    });
    saveDiskDeletedProducts(deletedProductIds);
    this.productsCache.data = [];
    this.invalidateProductsCache();
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await prisma.orderItem.deleteMany().catch(() => {});
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

      // Only fallback to DEFAULT_CATEGORIES if DB returned 0 categories on cold start
      let finalCategories: Category[] = results;
      if (finalCategories.length === 0 && deletedCategoryIds.size === 0) {
        finalCategories = DEFAULT_CATEGORIES.filter(c => !deletedCategoryIds.has(c.id));
      } else {
        finalCategories = finalCategories.filter(c => !deletedCategoryIds.has(c.id));
      }

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
    if (this.categoriesCache.expiresAt === 0 || Date.now() >= this.categoriesCache.expiresAt) {
      await this.refreshCategoriesCache();
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

      const newCatResult: Category = {
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

      DEFAULT_CATEGORIES.push(newCatResult);
      if (this.categoriesCache && Array.isArray(this.categoriesCache.data)) {
        this.categoriesCache.data = [...this.categoriesCache.data.filter(cat => cat.id !== newCatResult.id), newCatResult];
        this.categoriesCache.expiresAt = Date.now() + 300000;
      }
      this.invalidateCategoriesCache();
      return newCatResult;
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
    const id = 'banner-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
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
      prisma.banner.upsert({
        where: { id },
        update: {
          title: data.title,
          subtitle: data.subtitle || '',
          imageUrl: data.imageUrl,
          targetCategory: data.targetCategory || '',
          active: data.active !== false,
          order: data.order || 1
        },
        create: {
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

  async updateCoupon(idOrCode: string, updates: Partial<Coupon>): Promise<Coupon | null> {
    const prisma = getPrismaClient();
    const clean = (idOrCode || '').trim();
    const upper = clean.toUpperCase();

    if (prisma) {
      try {
        const existing = await prisma.coupon.findFirst({
          where: { OR: [{ id: clean }, { code: clean }, { code: upper }] }
        });
        if (!existing) return null;

        const updated = await prisma.coupon.update({
          where: { id: existing.id },
          data: {
            code: updates.code ? updates.code.toUpperCase() : existing.code,
            discountType: updates.type === 'FIXED' ? 'FIXED' : updates.type === 'PERCENT' ? 'PERCENTAGE' : existing.discountType,
            discountValue: updates.value !== undefined ? Number(updates.value) : existing.discountValue,
            minOrderValue: updates.minOrder !== undefined ? Number(updates.minOrder) : existing.minOrderValue,
            maxDiscount: updates.maxDiscount !== undefined ? Number(updates.maxDiscount) : existing.maxDiscount,
            isActive: updates.active !== undefined ? updates.active : existing.isActive
          }
        });

        return {
          id: updated.id,
          code: updated.code,
          type: updated.discountType === 'FIXED' ? 'FIXED' : 'PERCENT',
          value: updated.discountValue,
          minOrder: updated.minOrderValue,
          maxDiscount: updated.maxDiscount || undefined,
          expiryDate: updated.expiresAt ? updated.expiresAt.toISOString() : '2027-12-31T23:59:59.000Z',
          active: updated.isActive,
          usageCount: updated.timesUsed
        };
      } catch (err) {
        console.error('Prisma updateCoupon error:', err);
        return null;
      }
    }
    return null;
  }

  // COMBOS & OFFERS
  async getCombos(): Promise<Combo[]> {
    let dbCombos: any[] = [];
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        dbCombos = await prisma.combo.findMany({
          orderBy: { createdAt: 'desc' }
        });
      } catch (err) {
        console.warn('Prisma getCombos notice:', err);
      }
    }

    // Return strictly active database combos without stale memory seeds
    const rawCombos = dbCombos.filter(c => !deletedComboIds.has(c.id) && !deletedComboIds.has(c.id.toLowerCase()));

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

    // 1. Instant in-memory & disk save
    memoryCombosStore.unshift(newCombo);
    saveDiskCombos(memoryCombosStore);
    deletedComboIds.delete(id);
    deletedComboIds.delete(id.toLowerCase());
    saveDiskDeletedCombos(deletedComboIds);

    // 2. Persist synchronously to Prisma Neon PostgreSQL
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await prisma.combo.upsert({
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
        });
      } catch (err) {
        console.error('Prisma addCombo error:', err);
      }
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

    // Safe sync with Prisma
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await prisma.combo.upsert({
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
        });
      } catch (err) {
        console.error('Prisma updateCombo error:', err);
      }
    }

    return updatedCombo;
  }

  async deleteCombo(id: string): Promise<boolean> {
    const cleanId = (id || '').trim();
    if (!cleanId) return false;

    deletedComboIds.add(cleanId);
    deletedComboIds.add(cleanId.toLowerCase());
    saveDiskDeletedCombos(deletedComboIds);

    // 1. Remove from in-memory store
    for (let i = memoryCombosStore.length - 1; i >= 0; i--) {
      if (memoryCombosStore[i].id === cleanId || memoryCombosStore[i].id.toLowerCase() === cleanId.toLowerCase()) {
        memoryCombosStore.splice(i, 1);
      }
    }

    // 2. Save to disk
    saveDiskCombos(memoryCombosStore);

    // 3. Remove from default seed combos
    for (let i = DEFAULT_COMBOS.length - 1; i >= 0; i--) {
      if (DEFAULT_COMBOS[i].id === cleanId || DEFAULT_COMBOS[i].id.toLowerCase() === cleanId.toLowerCase()) {
        DEFAULT_COMBOS.splice(i, 1);
      }
    }

    // 4. Delete from Prisma
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await Promise.all([
          prisma.combo.deleteMany({
            where: {
              OR: [
                { id: cleanId },
                { id: cleanId.toLowerCase() }
              ]
            }
          }),
          prisma.product.deleteMany({
            where: {
              OR: [
                { id: cleanId },
                { id: cleanId.toLowerCase() }
              ]
            }
          })
        ]);
      } catch (err) {
        console.error('Prisma deleteCombo error:', err);
      }
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
    const prisma = getPrismaClient();
    let nextIndex = 1001;

    if (prisma) {
      try {
        const latest = await prisma.order.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { id: true, orderNumber: true }
        });
        if (latest) {
          const match = (latest.orderNumber || latest.id || '').match(/(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > 0 && num < 10000000) {
              nextIndex = num + 1;
            }
          }
        }
      } catch {
        nextIndex = 1000 + Math.floor(Math.random() * 9000);
      }
    } else {
      nextIndex = (this.memoryOrders.length > 0 ? this.memoryOrders.length + 1000 : Date.now() % 100000);
    }

    const id = `ORD-${nextIndex}`;
    const order: Order = {
      ...orderData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (prisma) {
      try {
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

        // 1 single batch query to check existing products
        const pIds = order.items.map(i => i.productId);
        const existingProds = await prisma.product.findMany({
          where: { id: { in: pIds } },
          select: { id: true }
        }).catch(() => []);
        const existingSet = new Set(existingProds.map(p => p.id));

        // Create any missing product in parallel if needed
        const missingItems = order.items.filter(i => !existingSet.has(i.productId));
        if (missingItems.length > 0) {
          await Promise.all(missingItems.map(item => {
            const defProd = DEFAULT_PRODUCTS.find(p => p.id === item.productId);
            const uniqueSku = item.sku || `VRG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
            return prisma.product.create({
              data: {
                id: item.productId,
                sku: uniqueSku,
                name: item.name || 'Nursery Plant',
                nameTamil: item.tamilName || item.name || 'நார்சரி செடி',
                price: item.price || 199,
                originalPrice: item.mrp || item.price || 230,
                category: defProd?.categoryName || 'Roses',
                categoryId: null,
                image: item.image || '/products/double-delight.jpeg',
                description: defProd?.description || item.name || 'Live Plant Sapling',
                inventory: {
                  create: {
                    quantity: 100
                  }
                }
              }
            }).catch(() => null);
          }));
        }

        // Direct atomic single order create with order items
        await prisma.order.create({
          data: {
            id: order.id,
            orderNumber: order.id,
            merchantTransactionId: order.merchantTransactionId,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerEmail: order.customerEmail || null,
            userId: order.userId || null,
            shippingAddress: typeof order.shippingAddress === 'string' ? order.shippingAddress : JSON.stringify(order.shippingAddress),
            subtotal: order.subtotal,
            discount: order.discount,
            deliveryFee: order.shippingCharge,
            totalAmount: order.grandTotal,
            status: 'PENDING',
            paymentStatus: order.paymentStatus === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
            paymentMethod: (order.paymentMethod === 'RAZORPAY'
              ? 'RAZORPAY'
              : order.paymentMethod === 'COD'
              ? 'COD'
              : (order.paymentMethod === 'QR_PAYMENT' || order.paymentMethod === 'UPI_DIRECT' || Boolean(order.paymentProofUrl))
              ? 'UPI'
              : 'PHONEPE') as any,
            notes: notesPayload,
            items: {
              create: order.items.map(item => ({
                productId: item.productId,
                productName: item.name,
                price: item.price,
                quantity: item.quantity,
                totalPrice: item.price * item.quantity
              }))
            }
          }
        });

        // Decrement inventory in parallel (non-blocking)
        Promise.all(order.items.map(item =>
          prisma.inventory.updateMany({
            where: { productId: item.productId },
            data: { quantity: { decrement: item.quantity } }
          }).catch(() => null)
        )).catch(() => null);

      } catch (err: any) {
        console.error('Prisma createOrder error:', err?.message || err);
      }
    }

    this.memoryOrders.unshift(order);
    if (!(globalThis as any).globalMemoryOrdersBuffer) (globalThis as any).globalMemoryOrdersBuffer = [];
    (globalThis as any).globalMemoryOrdersBuffer.unshift(order);

    // Sync to persistent disk store
    try {
      const diskOrders = loadDiskOrders();
      const existingIdx = diskOrders.findIndex(o => o.id === order.id || (order.merchantTransactionId && o.merchantTransactionId === order.merchantTransactionId));
      if (existingIdx >= 0) {
        diskOrders[existingIdx] = order;
      } else {
        diskOrders.unshift(order);
      }
      saveDiskOrders(diskOrders);
    } catch (e) {
      console.warn('saveDiskOrders warning on createOrder:', e);
    }

    // Non-blocking Firestore sync in background
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

          if (!parsedCourier) {
            if (unpackedCourierBranch || unpackedCourierDistrict) {
              parsedCourier = 'Mettur Parcel Service';
            } else if (unpackedPotOption === 'FULL_SOIL_8INCH') {
              parsedCourier = 'Professional Courier (8" Full Soil)';
            } else if (unpackedPotOption === 'FULL_SOIL_6INCH' || unpackedPotOption === 'FULL_SOIL') {
              parsedCourier = 'Professional Courier (6" Full Soil)';
            } else {
              parsedCourier = 'Professional Courier (Reduced Soil)';
            }
          }
          if (!unpackedPotOption || unpackedPotOption === 'NONE') {
            const cLower = parsedCourier.toLowerCase();
            if (cLower.includes('8" full soil') || cLower.includes('8 inch')) {
              unpackedPotOption = 'FULL_SOIL_8INCH';
            } else if (cLower.includes('6" full soil') || cLower.includes('6 inch') || cLower.includes('full soil')) {
              unpackedPotOption = 'FULL_SOIL_6INCH';
            } else {
              unpackedPotOption = 'REDUCED_SOIL';
            }
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
            paymentMethod: ((o as any).paymentMethod === 'RAZORPAY' || (o as any).paymentMethod === 'CARD'
              ? 'RAZORPAY'
              : (o as any).paymentMethod === 'COD' 
              ? 'COD' 
              : ((o as any).paymentMethod === 'UPI' || (o as any).paymentMethod === 'QR_PAYMENT' || hasProof)
              ? 'QR_PAYMENT'
              : (o as any).paymentMethod === 'PHONEPE'
              ? 'PHONEPE'
              : 'RAZORPAY') as PaymentMethod,
            paymentProofUrl: unpackedProofUrl,
            transactionId: unpackedTxnId || o.merchantTransactionId || '',
            merchantTransactionId: o.merchantTransactionId || '',
            trackingNumber: parsedTracking,
            courierName: parsedCourier,
            potOption: unpackedPotOption,
            potCharge: unpackedPotCharge,
            packingOption: unpackedPackingOption || 'STANDARD',
            packingCharge: unpackedPackingCharge || 0,
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
    const result = Array.from(uniqueMap.values()).filter(o => {
      if (!o || !o.id || deletedOrderIds.has(o.id) || deletedOrderIds.has(o.merchantTransactionId)) {
        return false;
      }
      // For automated online gateways (Razorpay, PhonePe):
      // Only include orders if payment succeeded!
      // If customer cancelled or did not complete payment, discard from active orders
      const isOnlineGateway = o.paymentMethod === 'RAZORPAY' || o.paymentMethod === 'PHONEPE' || (o.paymentMethod as string) === 'CARD';
      if (isOnlineGateway && o.paymentStatus !== 'SUCCESS') {
        return false;
      }
      // If order was explicitly cancelled and unpaid, do not show
      if (o.orderStatus === 'CANCELLED' && o.paymentStatus !== 'SUCCESS') {
        return false;
      }
      return true;
    });
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
      saveDiskDeletedOrders(deletedOrderIds);
    }
    this.memoryOrders = this.memoryOrders.filter(o => o.id !== clean && o.merchantTransactionId !== clean && (o as any).orderNumber !== clean);
    
    // Clear from global buffer if present
    if (Array.isArray((globalThis as any).globalMemoryOrdersBuffer)) {
      (globalThis as any).globalMemoryOrdersBuffer = (globalThis as any).globalMemoryOrdersBuffer.filter((o: any) => 
        o.id !== clean && o.merchantTransactionId !== clean && o.orderNumber !== clean
      );
    }

    // Prune disk orders store if present
    try {
      const diskOrders = loadDiskOrders();
      if (diskOrders.length > 0) {
        const filtered = diskOrders.filter(o => o.id !== clean && o.merchantTransactionId !== clean && (o as any).orderNumber !== clean);
        saveDiskOrders(filtered);
      }
    } catch {}

    // Non-blocking firestore deletion
    firestoreDeleteOrder(clean).catch(() => {});

    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const orderMatch = {
          OR: [
            { id: clean },
            { orderNumber: clean },
            { merchantTransactionId: clean }
          ]
        };
        // Parallel deletion of dependent items and payment logs
        await Promise.all([
          prisma.orderItem.deleteMany({ where: { order: orderMatch } }).catch(() => {}),
          prisma.payment.deleteMany({ where: { order: orderMatch } }).catch(() => {})
        ]);
        await prisma.order.deleteMany({ where: orderMatch }).catch(() => {});
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
        paymentMethod: ((o as any).paymentMethod === 'RAZORPAY' || (o as any).paymentMethod === 'CARD'
          ? 'RAZORPAY'
          : (o as any).paymentMethod === 'COD' 
          ? 'COD' 
          : ((o as any).paymentMethod === 'UPI' || (o as any).paymentMethod === 'QR_PAYMENT' || hasProof)
          ? 'QR_PAYMENT'
          : (o as any).paymentMethod === 'PHONEPE'
          ? 'PHONEPE'
          : 'RAZORPAY') as PaymentMethod,
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

    // Sync to persistent disk store
    try {
      const diskOrders = loadDiskOrders();
      const existingIdx = diskOrders.findIndex(o => (o.id && o.id.toLowerCase() === cleanId) || (o.merchantTransactionId && o.merchantTransactionId.toLowerCase() === cleanId));
      if (existingIdx >= 0) {
        diskOrders[existingIdx] = { ...diskOrders[existingIdx], ...memOrder };
      } else {
        diskOrders.unshift(memOrder);
      }
      saveDiskOrders(diskOrders);
    } catch {}

    // Non-blocking Firestore sync in background
    firestoreUpdateOrder(orderId, {
      orderStatus: status,
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(trackingNumber ? { trackingNumber } : {}),
      ...(courierName ? { courierName } : {})
    }).catch(() => {});

    return memOrder;
  }

  async createAdminOrder(data: any): Promise<Order> {
    const prisma = getPrismaClient();
    let nextIndex = 8256;
    if (prisma) {
      try {
        const lastOrder = await prisma.order.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { orderNumber: true }
        });
        if (lastOrder && lastOrder.orderNumber) {
          const match = lastOrder.orderNumber.match(/\d+/);
          if (match) {
            nextIndex = parseInt(match[0], 10) + 1;
          }
        }
      } catch {
        nextIndex = 8000 + Math.floor(Math.random() * 1000);
      }
    }

    const id = data.id || `ORD-${nextIndex}`;
    const orderNumber = data.orderNumber || id;
    const merchantTransactionId = data.merchantTransactionId || `WA_${Date.now()}`;

    const addrObj = typeof data.shippingAddress === 'object' && data.shippingAddress !== null
      ? data.shippingAddress
      : (parseShippingAddress(data.shippingAddress) || {});
    const addrStr = typeof data.shippingAddress === 'string' ? data.shippingAddress : JSON.stringify(addrObj);

    const items: OrderItemSnapshot[] = (data.items || []).map((it: any) => ({
      productId: it.productId || `prod-wa-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      sku: it.sku || `WA-${(it.name || 'PLANT').slice(0, 4).toUpperCase()}`,
      name: it.name || it.productName || 'Nursery Plant',
      tamilName: it.tamilName || it.name || 'நார்சரி செடி',
      price: Number(it.price || 0),
      mrp: Number(it.mrp || it.price || 0),
      quantity: Number(it.quantity || 1),
      image: it.image || '/products/double-delight.jpeg'
    }));

    const subtotal = Number(data.subtotal ?? items.reduce((s, it) => s + (it.price * it.quantity), 0));
    const shippingCharge = Number(data.shippingCharge ?? data.deliveryFee ?? 0);
    const discount = Number(data.discount ?? 0);
    const grandTotal = Number(data.grandTotal ?? data.totalAmount ?? (subtotal + shippingCharge - discount));

    const order: Order = {
      id,
      orderNumber,
      merchantTransactionId,
      customerName: data.customerName || addrObj.fullName || 'WhatsApp Customer',
      customerPhone: data.customerPhone || addrObj.phone || '',
      customerEmail: data.customerEmail || '',
      shippingAddress: addrObj,
      items,
      subtotal,
      shippingCharge,
      discount,
      grandTotal,
      paymentStatus: data.paymentStatus || 'SUCCESS',
      orderStatus: data.orderStatus || 'PENDING',
      paymentMethod: data.paymentMethod || 'WHATSAPP',
      notes: data.notes || '',
      trackingNumber: data.trackingNumber || '',
      courierName: data.courierName || '',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (prisma) {
      try {
        const defaultProd = await prisma.product.findFirst({ select: { id: true } }).catch(() => null);
        const fallbackId = defaultProd?.id || 'prod-rose-01';

        const pIds = items.map(i => i.productId).filter(Boolean);
        const existingProds = await prisma.product.findMany({
          where: { id: { in: pIds } },
          select: { id: true }
        }).catch(() => []);
        const existingSet = new Set(existingProds.map(p => p.id));

        await prisma.order.create({
          data: {
            id: order.id,
            orderNumber: order.id,
            merchantTransactionId: order.merchantTransactionId,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerEmail: order.customerEmail || null,
            shippingAddress: addrStr,
            subtotal: order.subtotal,
            discount: order.discount,
            deliveryFee: order.shippingCharge,
            totalAmount: order.grandTotal,
            status: (order.orderStatus === 'DELIVERED' ? 'DELIVERED' : order.orderStatus === 'PROCESSING' ? 'PACKING' : order.orderStatus === 'DISPATCHED' ? 'DISPATCHED' : 'PENDING') as any,
            paymentStatus: order.paymentStatus === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
            paymentMethod: (order.paymentMethod === 'COD' ? 'COD' : order.paymentMethod === 'PHONEPE' ? 'PHONEPE' : 'UPI') as any,
            notes: order.notes || '',
            trackingNumber: order.trackingNumber || null,
            items: {
              create: items.map(it => ({
                productId: existingSet.has(it.productId) ? it.productId : fallbackId,
                productName: it.name,
                price: it.price,
                quantity: it.quantity,
                totalPrice: it.price * it.quantity
              }))
            }
          }
        });
      } catch (err: any) {
        console.error('Prisma createAdminOrder error:', err?.message || err);
      }
    }

    this.memoryOrders.unshift(order);
    if (!(globalThis as any).globalMemoryOrdersBuffer) (globalThis as any).globalMemoryOrdersBuffer = [];
    (globalThis as any).globalMemoryOrdersBuffer.unshift(order);

    const allDisk = loadDiskOrders();
    allDisk.unshift(order);
    saveDiskOrders(allDisk);

    this.invalidateOrdersCache();
    return order;
  }

  async updateOrderFull(id: string, updates: any): Promise<Order | null> {
    this.invalidateOrdersCache();
    const cleanId = (id || '').trim().toLowerCase();
    
    let existing = await this.getOrderById(id);
    if (!existing) return null;

    const addrObj = updates.shippingAddress 
      ? (typeof updates.shippingAddress === 'object' && updates.shippingAddress !== null ? updates.shippingAddress : parseShippingAddress(updates.shippingAddress)) 
      : existing.shippingAddress;
    const addrStr = typeof addrObj === 'string' ? addrObj : JSON.stringify(addrObj);

    const updatedItems = updates.items ? updates.items.map((it: any) => ({
      productId: it.productId || `prod-wa-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      sku: it.sku || `WA-${(it.name || 'PLANT').slice(0, 4).toUpperCase()}`,
      name: it.name || it.productName || 'Nursery Plant',
      tamilName: it.tamilName || it.name || 'நார்சரி செடி',
      price: Number(it.price || 0),
      mrp: Number(it.mrp || it.price || 0),
      quantity: Number(it.quantity || 1),
      image: it.image || '/products/double-delight.jpeg'
    })) : existing.items;

    const subtotal = Number(updates.subtotal ?? (updatedItems ? updatedItems.reduce((s: number, it: any) => s + (it.price * it.quantity), 0) : existing.subtotal));
    const shippingCharge = Number(updates.shippingCharge ?? updates.deliveryFee ?? existing.shippingCharge);
    const discount = Number(updates.discount ?? existing.discount);
    const grandTotal = Number(updates.grandTotal ?? updates.totalAmount ?? (subtotal + shippingCharge - discount));

    const updatedOrder: Order = {
      ...existing,
      ...updates,
      id: existing.id,
      orderNumber: existing.orderNumber || existing.id,
      customerName: updates.customerName || existing.customerName,
      customerPhone: updates.customerPhone || existing.customerPhone,
      customerEmail: updates.customerEmail !== undefined ? updates.customerEmail : existing.customerEmail,
      shippingAddress: addrObj,
      items: updatedItems,
      subtotal,
      shippingCharge,
      discount,
      grandTotal,
      paymentStatus: updates.paymentStatus || existing.paymentStatus,
      orderStatus: updates.orderStatus || existing.orderStatus,
      paymentMethod: updates.paymentMethod || existing.paymentMethod,
      notes: updates.notes !== undefined ? updates.notes : existing.notes,
      trackingNumber: updates.trackingNumber !== undefined ? updates.trackingNumber : existing.trackingNumber,
      courierName: updates.courierName !== undefined ? updates.courierName : existing.courierName,
      courierDistrict: updates.courierDistrict !== undefined ? updates.courierDistrict : existing.courierDistrict,
      courierBranch: updates.courierBranch !== undefined ? updates.courierBranch : existing.courierBranch,
      potOption: updates.potOption !== undefined ? updates.potOption : existing.potOption,
      potCharge: updates.potCharge !== undefined ? updates.potCharge : existing.potCharge,
      packingOption: updates.packingOption !== undefined ? updates.packingOption : existing.packingOption,
      packingCharge: updates.packingCharge !== undefined ? updates.packingCharge : existing.packingCharge,
      isLabelPrinted: updates.isLabelPrinted !== undefined ? Boolean(updates.isLabelPrinted) : existing.isLabelPrinted,
      labelPrintedAt: updates.labelPrintedAt !== undefined ? updates.labelPrintedAt : existing.labelPrintedAt,
      updatedAt: new Date().toISOString()
    };

    this.memoryOrders = this.memoryOrders.map(o => (o.id && o.id.toLowerCase() === cleanId) ? updatedOrder : o);
    if ((globalThis as any).globalMemoryOrdersBuffer) {
      (globalThis as any).globalMemoryOrdersBuffer = (globalThis as any).globalMemoryOrdersBuffer.map((o: Order) => (o.id && o.id.toLowerCase() === cleanId) ? updatedOrder : o);
    }

    const allDisk = loadDiskOrders();
    const diskIdx = allDisk.findIndex(o => o.id && o.id.toLowerCase() === cleanId);
    if (diskIdx !== -1) {
      allDisk[diskIdx] = updatedOrder;
    } else {
      allDisk.unshift(updatedOrder);
    }
    saveDiskOrders(allDisk);

    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const orderMatch = {
          OR: [
            { id: existing.id },
            { orderNumber: existing.id },
            { merchantTransactionId: existing.merchantTransactionId }
          ]
        };

        const notesPayload = JSON.stringify({
          proof: updatedOrder.paymentProofUrl || null,
          txnId: updatedOrder.transactionId || null,
          packingOption: updatedOrder.packingOption || 'STANDARD',
          packingCharge: updatedOrder.packingCharge || 0,
          potOption: updatedOrder.potOption || null,
          potCharge: updatedOrder.potCharge || 0,
          courierName: updatedOrder.courierName || null,
          courierDistrict: updatedOrder.courierDistrict || null,
          courierBranch: updatedOrder.courierBranch || null
        });

        await prisma.order.updateMany({
          where: orderMatch,
          data: {
            customerName: updatedOrder.customerName,
            customerPhone: updatedOrder.customerPhone,
            customerEmail: updatedOrder.customerEmail || null,
            shippingAddress: addrStr,
            subtotal: updatedOrder.subtotal,
            discount: updatedOrder.discount,
            deliveryFee: updatedOrder.shippingCharge,
            totalAmount: updatedOrder.grandTotal,
            status: (updatedOrder.orderStatus === 'DELIVERED' ? 'DELIVERED' : updatedOrder.orderStatus === 'PROCESSING' ? 'PACKING' : updatedOrder.orderStatus === 'DISPATCHED' ? 'DISPATCHED' : 'PENDING') as any,
            paymentStatus: updatedOrder.paymentStatus === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
            paymentMethod: (updatedOrder.paymentMethod === 'COD' ? 'COD' : updatedOrder.paymentMethod === 'PHONEPE' ? 'PHONEPE' : 'UPI') as any,
            notes: notesPayload,
            trackingNumber: updatedOrder.trackingNumber || null
          }
        });
      } catch (err: any) {
        console.error('Prisma updateOrderFull error:', err?.message || err);
      }
    }

    return updatedOrder;
  }

  // PAYMENT LOGS
  private inMemoryPaymentLogs: PaymentLog[] = [];

  async addPaymentLog(log: Omit<PaymentLog, 'id' | 'createdAt'>): Promise<PaymentLog> {
    const prisma = getPrismaClient();
    const id = 'paylog-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const newLog: PaymentLog = {
      ...log,
      id,
      createdAt: new Date().toISOString()
    };

    this.inMemoryPaymentLogs.unshift(newLog);
    if (this.inMemoryPaymentLogs.length > 200) this.inMemoryPaymentLogs.pop();

    if (prisma) {
      try {
        await prisma.paymentAttempt.create({
          data: {
            id,
            orderId: log.orderId || log.merchantTransactionId,
            merchantTransactionId: log.merchantTransactionId,
            amount: Number(log.amount) || 0,
            status: log.status,
            requestPayload: log.payload || null,
            responsePayload: null
          }
        });
      } catch (err) {
        console.error('Prisma addPaymentLog error:', err);
      }
    }

    return newLog;
  }

  async getPaymentLogs(orderId?: string): Promise<PaymentLog[]> {
    const prisma = getPrismaClient();
    if (!prisma) {
      if (orderId) {
        return this.inMemoryPaymentLogs.filter(p => p.orderId === orderId || p.merchantTransactionId === orderId);
      }
      return this.inMemoryPaymentLogs;
    }

    try {
      const items = await prisma.paymentAttempt.findMany({
        where: orderId ? {
          OR: [
            { orderId },
            { merchantTransactionId: orderId }
          ]
        } : undefined,
        orderBy: { createdAt: 'desc' },
        take: orderId ? 50 : 100
      });

      if (items.length > 0) {
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
      }
      if (orderId) {
        return this.inMemoryPaymentLogs.filter(p => p.orderId === orderId || p.merchantTransactionId === orderId);
      }
      return this.inMemoryPaymentLogs;
    } catch (err) {
      console.error('Prisma getPaymentLogs error:', err);
      if (orderId) {
        return this.inMemoryPaymentLogs.filter(p => p.orderId === orderId || p.merchantTransactionId === orderId);
      }
      return this.inMemoryPaymentLogs;
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
