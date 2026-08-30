import fs from 'fs';
import path from 'path';
import { Product, Category, Order, Coupon, Banner, Review, SiteSettings, PaymentLog, OrderItemSnapshot, PaymentMethod, FinancialEntry, Combo } from '../types.js';

import { getPrismaClient, executeInTransaction } from './prisma.js';
import { firestoreSaveOrder, firestoreGetAllOrders, firestoreUpdateOrder, firestoreDeleteOrder } from './firestore.js';
import { ImmutableOrderVaultService } from './immutableVault.js';

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

import bundledReviewsSeed from '../data/reviews_store.json' with { type: 'json' };

const REVIEWS_STORE_FILE = path.resolve(process.cwd(), 'src/data/reviews_store.json');

const DEFAULT_REVIEWS_SEED: Review[] = Array.isArray(bundledReviewsSeed) ? (bundledReviewsSeed as Review[]) : [];

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

function safeWriteDiskJson(filePath: string, data: any) {
  // In serverless environments (Vercel Lambda), filesystem is read-only except /tmp
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    return;
  }
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err: any) {
    if (err?.code !== 'EROFS') {
      console.error(`Error writing ${path.basename(filePath)}:`, err);
    }
  }
}

function saveDiskReviews(reviews: Review[]) {
  safeWriteDiskJson(REVIEWS_STORE_FILE, reviews);
}

import bundledOrdersSeed from '../data/orders_store.json' with { type: 'json' };

const ORDERS_STORE_FILE = path.resolve(process.cwd(), 'src/data/orders_store.json');

function loadDiskOrders(): Order[] {
  const deletedSet = loadDiskDeletedOrders();
  let orders: Order[] = [];
  try {
    if (fs.existsSync(ORDERS_STORE_FILE)) {
      const data = fs.readFileSync(ORDERS_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) orders = parsed;
    }
  } catch (err) {
    console.error('Error reading orders_store.json:', err);
  }
  if (orders.length === 0 && Array.isArray(bundledOrdersSeed) && bundledOrdersSeed.length > 0) {
    orders = (bundledOrdersSeed as unknown as Order[]);
  }
  return orders.filter(o => o && o.id && !deletedSet.has(o.id) && !deletedSet.has(o.merchantTransactionId || ''));
}

function saveDiskOrders(orders: Order[]) {
  safeWriteDiskJson(ORDERS_STORE_FILE, orders);
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
  safeWriteDiskJson(DELETED_ORDERS_STORE_FILE, Array.from(ids));
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
  safeWriteDiskJson(FINANCES_STORE_FILE, finances);
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
  safeWriteDiskJson(DELETED_COMBOS_STORE_FILE, Array.from(ids));
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
  safeWriteDiskJson(DELETED_PRODUCTS_STORE_FILE, Array.from(ids));
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
  safeWriteDiskJson(PRODUCTS_STORE_FILE, products);
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
  safeWriteDiskJson(COMBOS_STORE_FILE, combos);
}

import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../data/catalogData.js';

// Default Fallback Data matching WhatsApp Catalogue (Synced directly from catalogData)
const DEFAULT_CATEGORIES: Category[] = INITIAL_CATEGORIES;
const DEFAULT_PRODUCTS: Product[] = INITIAL_PRODUCTS;



// Default Fallback Site Settings when DB record hasn't been created yet
const DEFAULT_SETTINGS: SiteSettings = {
  businessName: process.env.BUSINESS_NAME || 'Veerika Rose Garden',
  tagline: process.env.BUSINESS_TAGLINE || 'Premier Plant Nursery & Farm Direct Gardens',
  phone: process.env.BUSINESS_PHONE || '+91 63812 03534',
  email: process.env.BUSINESS_EMAIL || 'nv01110612@gmail.com',
  whatsapp: process.env.BUSINESS_WHATSAPP || '+916381203534',
  address: process.env.BUSINESS_ADDRESS || 'Pennagaram, Tamil Nadu — 636810',
  googleMapsUrl: 'https://maps.google.com/?q=Pennagaram,Tamil+Nadu',
  workingHours: 'Open 7 AM – 7 PM · All Days',
  taxRate: 0,
  shippingFee: 50,
  freeShippingThreshold: 999,
  enableRazorpay: true,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_live_TQ5xDdZB7QWIn2',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'FfkwntR4ygvIapq4ex50ajp0',
  enableCod: false,
  enablePhonePe: false,
  enableQrPayment: false,
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

function toPrismaOrderStatus(orderStatus?: string | null): 'DELIVERED' | 'DISPATCHED' | 'PACKING' | 'PAID' | 'CANCELLED' | 'PAYMENT_PENDING' {
  const s = String(orderStatus || '').toUpperCase().trim();
  if (s === 'DELIVERED' || s === 'COMPLETED') return 'DELIVERED';
  if (s === 'DISPATCHED' || s === 'OUT_FOR_DELIVERY' || s === 'SHIPPED' || s === 'COURIER' || s === 'IN_TRANSIT') return 'DISPATCHED';
  if (s === 'PACKING' || s === 'PACKED' || s === 'PROCESSING') return 'PACKING';
  if (s === 'CONFIRMED' || s === 'PAID') return 'PAID';
  if (s === 'CANCELLED') return 'CANCELLED';
  return 'PAYMENT_PENDING';
}

function fromPrismaOrderStatus(prismaStatus?: string | null): Order['orderStatus'] {
  const s = String(prismaStatus || '').toUpperCase().trim();
  if (s === 'DELIVERED' || s === 'COMPLETED') return 'DELIVERED';
  if (s === 'DISPATCHED' || s === 'OUT_FOR_DELIVERY' || s === 'SHIPPED' || s === 'COURIER' || s === 'IN_TRANSIT') return 'DISPATCHED';
  if (s === 'PACKING' || s === 'PACKED' || s === 'PROCESSING') return 'PACKING';
  if (s === 'CONFIRMED' || s === 'PAID') return 'CONFIRMED';
  if (s === 'CANCELLED') return 'CANCELLED';
  return 'CONFIRMED';
}

class Store {
  private get memoryOrders(): Order[] {
    if (!(globalThis as any)._memoryOrders) {
      (globalThis as any)._memoryOrders = loadDiskOrders();
    }
    return (globalThis as any)._memoryOrders;
  }
  private set memoryOrders(val: Order[]) {
    (globalThis as any)._memoryOrders = val;
  }
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
      const diskList = loadDiskProducts();
      const defMap = new Map(DEFAULT_PRODUCTS.map(p => [p.id, p]));
      const diskMap = new Map(diskList.map(p => [p.id, p]));

      const items = await prisma.product.findMany({
        include: { categoryRel: true, inventory: true },
        orderBy: { createdAt: 'desc' }
      });

      let results: Product[] = items.map(p => {
        const primaryImage = p.image || (p.images && p.images.length > 0 ? p.images[0] : `/products/vrg/${p.id.replace('vrg-', '')}.png`);
        const allImages = p.images && p.images.length > 0 ? p.images : [primaryImage];
        const diskItem = diskMap.get(p.id) || (p.sku ? diskMap.get(p.sku) : undefined);
        const defItem = defMap.get(p.id) || (p.sku ? defMap.get(p.sku) : undefined);
        const resolvedStock = (p.inventory?.quantity !== undefined && p.inventory?.quantity !== null)
          ? p.inventory.quantity
          : (diskItem?.stock !== undefined ? diskItem.stock : (defItem?.stock !== undefined ? defItem.stock : 25));

        return {
          id: p.id,
          sku: p.sku || diskItem?.sku || defItem?.sku || `VRG-${p.id.slice(0, 6).toUpperCase()}`,
          name: p.name,
          englishName: diskItem?.englishName || p.name,
          tamilName: p.nameTamil || diskItem?.tamilName || p.name,
          scientificName: p.scientificName || diskItem?.scientificName || '',
          categoryId: p.categoryId || diskItem?.categoryId || (p.category ? (p.category.toLowerCase().includes('rose') && !p.category.toLowerCase().includes('creeper') && !p.category.toLowerCase().includes('miniature') && !p.category.toLowerCase().includes('rare') ? 'cat-rose' : `cat-${p.category.toLowerCase().replace(/\s+/g, '-')}`) : 'cat-rose'),
          categoryName: p.category || diskItem?.categoryName || 'Roses',
          description: p.description || diskItem?.description || '',
          mrp: p.originalPrice || p.price,
          sellingPrice: p.price,
          discount: p.originalPrice > 0 ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : (diskItem?.discount || 0),
          image: primaryImage,
          imageUrl: primaryImage,
          images: allImages,
          rating: p.rating || diskItem?.rating || 5.0,
          reviewCount: p.reviewsCount || diskItem?.reviewCount || 0,
          stock: resolvedStock,
          plantHeight: diskItem?.plantHeight || defItem?.plantHeight || '1.5 - 2 Feet',
          potSize: p.potSize || diskItem?.potSize || defItem?.potSize || '8 Inch Bag',
          sunlight: (p.careSunlight as any) || diskItem?.sunlight || defItem?.sunlight || 'Full Sun',
          waterRequirement: (p.careWatering as any) || diskItem?.waterRequirement || defItem?.waterRequirement || 'Daily',
          floweringSeason: diskItem?.floweringSeason || defItem?.floweringSeason || 'All Year',
          careInstructions: {
            watering: p.careWatering || diskItem?.careInstructions?.watering || 'Daily',
            sunlight: p.careSunlight || diskItem?.careInstructions?.sunlight || 'Full Sun',
            fertilizer: p.careFertilizer || diskItem?.careInstructions?.fertilizer || 'Organic compost',
            soil: p.careSoil || diskItem?.careInstructions?.soil || 'Red soil'
          },
          featured: Boolean(p.isFeatured),
          bestSeller: Boolean(p.isBestSeller),
          trending: diskItem?.trending !== undefined ? diskItem.trending : true,
          tags: diskItem?.tags?.length ? diskItem.tags : [p.category.toLowerCase()],
          status: diskItem?.status || ('ACTIVE' as const),
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

    const rawSellingPrice = updates.sellingPrice !== undefined ? updates.sellingPrice : (updates as any).price;
    const rawMrp = updates.mrp !== undefined ? updates.mrp : (updates as any).originalPrice;

    const effectiveSellingPrice = (rawSellingPrice !== undefined && rawSellingPrice !== null && !isNaN(Number(rawSellingPrice)))
      ? Number(rawSellingPrice)
      : undefined;
    const effectiveMrp = (rawMrp !== undefined && rawMrp !== null && !isNaN(Number(rawMrp)))
      ? Number(rawMrp)
      : undefined;

    const calculatedDiscount = (effectiveMrp !== undefined && effectiveSellingPrice !== undefined && effectiveMrp > 0)
      ? Math.max(0, Math.round(((effectiveMrp - effectiveSellingPrice) / effectiveMrp) * 100))
      : (updates.discount !== undefined ? Number(updates.discount) : undefined);

    const normalizedUpdates: Partial<Product> = {
      ...updates,
      ...(effectiveSellingPrice !== undefined ? { sellingPrice: effectiveSellingPrice } : {}),
      ...(effectiveMrp !== undefined ? { mrp: effectiveMrp } : {}),
      ...(calculatedDiscount !== undefined ? { discount: calculatedDiscount } : {}),
      ...(updates.stock !== undefined ? { stock: Number(updates.stock) } : {}),
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
            ...(effectiveSellingPrice !== undefined ? { price: effectiveSellingPrice } : {}),
            ...(effectiveMrp !== undefined ? { originalPrice: effectiveMrp } : {}),
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
            price: effectiveSellingPrice || 199,
            originalPrice: effectiveMrp || effectiveSellingPrice || 249,
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
        DEFAULT_PRODUCTS[defIndex] = { ...DEFAULT_PRODUCTS[defIndex], ...finalUpdatedProduct };
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
          mrp: effectiveMrp || effectiveSellingPrice || 199,
          sellingPrice: effectiveSellingPrice || 199,
          discount: calculatedDiscount || 0,
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

    // Sync in-memory productsCache so immediate reads return updated product instantly with no stale lag
    if (this.productsCache && Array.isArray(this.productsCache.data)) {
      const cIdx = this.productsCache.data.findIndex(p => p.id === cleanId || p.sku === cleanId || p.id === targetDbId || (p.sku && p.sku === finalUpdatedProduct.sku));
      if (cIdx !== -1) {
        this.productsCache.data[cIdx] = {
          ...this.productsCache.data[cIdx],
          ...finalUpdatedProduct
        };
      } else {
        this.productsCache.data.unshift(finalUpdatedProduct);
      }
      this.productsCache.expiresAt = Date.now() + 300000;
    } else {
      this.productsCache = {
        data: [finalUpdatedProduct, ...DEFAULT_PRODUCTS.filter(p => p.id !== finalUpdatedProduct.id)],
        expiresAt: Date.now() + 300000
      };
    }
    saveDiskProducts(this.productsCache.data);
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
        await prisma.combo.deleteMany({ where: { OR: [{ id: cleanId }, { id: cleanId.toLowerCase() }] } }).catch(() => {});
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

    const id = 'cat-' + Date.now();
    const newCatResult: Category = {
      id,
      name: cleanName,
      tamilName: nameTamil,
      slug,
      description: cat.description || '',
      image: cat.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      iconName: cat.iconName || 'Flower2',
      order: cat.order ?? 1,
      isActive: cat.isActive !== undefined ? cat.isActive : true,
      isFeatured: cat.isFeatured !== undefined ? cat.isFeatured : false,
      productCount: 0,
      metaTitle: cat.metaTitle || undefined,
      metaDescription: cat.metaDescription || undefined,
      ogImage: cat.ogImage || undefined,
      canonicalUrl: cat.canonicalUrl || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (prisma) {
      try {
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

        newCatResult.createdAt = c.createdAt.toISOString();
        newCatResult.updatedAt = c.updatedAt.toISOString();
      } catch (err: any) {
        if (err.message && err.message.includes('already exists')) throw err;
        console.warn('Prisma addCategory background notice:', err?.message || err);
      }
    }

    DEFAULT_CATEGORIES.push(newCatResult);
    if (this.categoriesCache && Array.isArray(this.categoriesCache.data)) {
      this.categoriesCache.data = [...this.categoriesCache.data.filter(cat => cat.id !== newCatResult.id), newCatResult];
      this.categoriesCache.expiresAt = Date.now() + 300000;
    }
    this.invalidateCategoriesCache();
    return newCatResult;
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

  async getBanners(onlyActive = false): Promise<Banner[]> {
    if (Date.now() >= this.bannersCache.expiresAt) {
      (async () => {
        try {
          const prisma = getPrismaClient();
          if (prisma) {
            const items = await prisma.banner.findMany({
              where: onlyActive ? { active: true } : undefined,
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
        } catch (err: any) {
          const code = err?.code || '';
          if (code !== 'P2024' && code !== 'P1001') {
            console.warn('Background getBanners notice:', err?.message || err);
          }
        }
      })();
    }
    const list = this.bannersCache.data.filter(b => !this.deletedBannerIds.has(b.id));
    return onlyActive ? list.filter(b => b.active !== false) : list;
  }

  // COUPONS
  async getCoupons(onlyActive = false): Promise<Coupon[]> {
    const prisma = getPrismaClient();

    if (prisma) {
      try {
        const items = await prisma.coupon.findMany({
          where: onlyActive ? { isActive: true } : undefined,
          orderBy: { createdAt: 'desc' }
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

    // 4. Delete from Prisma safely (never cascade delete historical customer order items)
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await prisma.combo.deleteMany({
          where: {
            OR: [
              { id: cleanId },
              { id: cleanId.toLowerCase() }
            ]
          }
        });

        const orderItemCount = await prisma.orderItem.count({
          where: {
            OR: [
              { productId: cleanId },
              { productId: cleanId.toLowerCase() }
            ]
          }
        }).catch(() => 0);

        if (orderItemCount === 0) {
          await prisma.product.deleteMany({
            where: {
              OR: [
                { id: cleanId },
                { id: cleanId.toLowerCase() }
              ]
            }
          });
        } else {
          // Keep product record so past orders preserve foreign key & historical snapshot, but mark unavailable for new orders
          await prisma.product.updateMany({
            where: {
              OR: [
                { id: cleanId },
                { id: cleanId.toLowerCase() }
              ]
            },
            data: { inStock: false }
          }).catch(() => {});
        }
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

  // In-flight concurrency lock to merge identical parallel clicks from the same phone
  private activeCreationLocks: Map<string, Promise<Order>> = new Map();

  // ORDERS
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const cleanPhone = (orderData.customerPhone || '').replace(/\D/g, '');
    const cleanPhone10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
    const lockKey = `${cleanPhone10}_${orderData.grandTotal || 0}`;

    // If an order creation is already actively executing for this customer, wait and reuse its result
    if (lockKey && this.activeCreationLocks.has(lockKey)) {
      try {
        const inFlight = await this.activeCreationLocks.get(lockKey)!;
        return inFlight;
      } catch {}
    }

    const creationPromise = this._createOrderInternal(orderData, cleanPhone10);
    if (lockKey) {
      this.activeCreationLocks.set(lockKey, creationPromise);
      creationPromise.finally(() => {
        setTimeout(() => {
          this.activeCreationLocks.delete(lockKey);
        }, 5000);
      });
    }

    return creationPromise;
  }

  private async _createOrderInternal(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>, cleanPhone10: string): Promise<Order> {
    const prisma = getPrismaClient();

    // DEDUPLICATION GUARD: Check if the same customer recently submitted an identical pending order (within 15 mins)
    if (cleanPhone10) {
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      // 1. Check in-memory orders first
      const memPending = this.memoryOrders.find(o => 
        (o.customerPhone || '').replace(/\D/g, '').endsWith(cleanPhone10) &&
        Math.abs((o.grandTotal || 0) - (orderData.grandTotal || 0)) < 1 &&
        o.paymentStatus === 'PENDING' &&
        new Date(o.createdAt).getTime() >= fifteenMinsAgo.getTime()
      );

      if (memPending) {
        // Reuse and update the existing pending order
        const updatedPending: Order = {
          ...memPending,
          ...orderData,
          id: memPending.id,
          merchantTransactionId: orderData.merchantTransactionId || memPending.merchantTransactionId,
          updatedAt: new Date().toISOString()
        };

        const idx = this.memoryOrders.findIndex(o => o.id === memPending.id);
        if (idx !== -1) this.memoryOrders[idx] = updatedPending;

        if (prisma) {
          prisma.order.updateMany({
            where: { id: memPending.id },
            data: {
              merchantTransactionId: updatedPending.merchantTransactionId,
              updatedAt: new Date()
            }
          }).catch(() => {});
        }
        this.invalidateOrdersCache();
        return updatedPending;
      }

      // 2. Check Prisma PostgreSQL DB
      if (prisma) {
        try {
          const dbPending = await prisma.order.findFirst({
            where: {
              customerPhone: { contains: cleanPhone10 },
              totalAmount: orderData.grandTotal,
              paymentStatus: 'PENDING',
              status: { in: ['PENDING', 'PAYMENT_PENDING', 'PAYMENT_INITIATED'] as any },
              createdAt: { gte: fifteenMinsAgo }
            },
            orderBy: { createdAt: 'desc' }
          });

          if (dbPending) {
            const reusedOrder: Order = {
              ...orderData,
              id: dbPending.id,
              orderNumber: dbPending.orderNumber || dbPending.id,
              merchantTransactionId: orderData.merchantTransactionId || dbPending.merchantTransactionId || `MT${Date.now()}`,
              createdAt: dbPending.createdAt.toISOString(),
              updatedAt: new Date().toISOString()
            };

            await prisma.order.update({
              where: { id: dbPending.id },
              data: {
                merchantTransactionId: reusedOrder.merchantTransactionId,
                updatedAt: new Date()
              }
            }).catch(() => {});

            this.memoryOrders.unshift(reusedOrder);
            this.invalidateOrdersCache();
            return reusedOrder;
          }
        } catch (err) {
          console.warn('Prisma order deduplication check notice:', err);
        }
      }
    }

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
          courierBranch: order.courierBranch || null,
          itemsSnapshot: order.items
        });

        // 1 single batch query to check existing products
        const pIds = order.items.map(i => i.productId);
        const existingProds = await prisma.product.findMany({
          where: { id: { in: pIds } },
          select: { id: true }
        }).catch(() => []);
        const existingSet = new Set(existingProds.map(p => p.id));
        const defaultProd = await prisma.product.findFirst({ select: { id: true } }).catch(() => null);
        const fallbackId = defaultProd?.id || existingProds[0]?.id || 'prod-rose-01';

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
                productId: existingSet.has(item.productId) ? item.productId : (fallbackId || item.productId),
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

          // Unpack paymentProofUrl, transactionId, packing and courier options, and itemsSnapshot from notes
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
          let unpackedItemsSnapshot: OrderItemSnapshot[] | undefined = undefined;
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
              if (pNotes.itemsSnapshot && Array.isArray(pNotes.itemsSnapshot) && pNotes.itemsSnapshot.length > 0) {
                unpackedItemsSnapshot = pNotes.itemsSnapshot;
              }
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

          const itemsSnapshot: OrderItemSnapshot[] = (unpackedItemsSnapshot && unpackedItemsSnapshot.length > 0)
            ? unpackedItemsSnapshot
            : o.items.map(i => {
                const rawId = (i.productId || 'PLANT').trim();
                const isComboItem = rawId.toLowerCase().startsWith('combo-') || rawId.toLowerCase().startsWith('vrg-combo-');
                const cleanSku = isComboItem
                  ? `CMB-${rawId.replace(/^combo-|^vrg-combo-/i, '').slice(0, 8).toUpperCase()}`
                  : `VRG-${rawId.replace(/^vrg-|^prod-/i, '').slice(0, 8).toUpperCase()}`;

                return {
                  productId: i.productId,
                  sku: cleanSku,
                  name: i.productName || 'Nursery Plant',
                  tamilName: i.productName || 'நார்சரி செடி',
                  price: i.price,
                  mrp: i.price,
                  quantity: i.quantity,
                  image: '/products/double-delight.jpeg'
                };
              });

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
          const dbOrderStatus = fromPrismaOrderStatus(o.status);

          const calculatedSubtotal = itemsSnapshot.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
          const finalSubtotal = Number(o.subtotal) > 0 ? Number(o.subtotal) : (calculatedSubtotal > 0 ? calculatedSubtotal : Number(o.totalAmount || 0));
          const packingAndPotCharges = Number(unpackedPackingCharge || 0) + Number(unpackedPotCharge || 0);
          const finalGrandTotal = Number(o.totalAmount) > 0 ? Number(o.totalAmount) : (finalSubtotal + Number(o.deliveryFee || 0) + packingAndPotCharges - Number(o.discount || 0));

          return {
            id: o.id,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            customerEmail: o.customerEmail || '',
            shippingAddress: parsedAddress,
            items: itemsSnapshot,
            subtotal: finalSubtotal,
            discount: o.discount,
            shippingCharge: o.deliveryFee,
            grandTotal: finalGrandTotal,
            orderStatus: dbOrderStatus,
            paymentStatus: o.paymentStatus === 'SUCCESS' ? 'SUCCESS' : o.paymentStatus === 'FAILED' ? 'FAILED' : 'PENDING',
            paymentMethod: (((o as any).paymentMethod === 'RAZORPAY' || (o as any).paymentMethod === 'CARD' || String(o.merchantTransactionId || '').startsWith('order_') || String(o.merchantTransactionId || '').startsWith('pay_') || String(unpackedTxnId || '').startsWith('pay_'))
              ? 'RAZORPAY'
              : (o as any).paymentMethod === 'COD'
              ? 'COD'
              : (o as any).paymentMethod === 'PHONEPE'
              ? 'PHONEPE'
              : 'QR_PAYMENT') as PaymentMethod,
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

    // Strict priority & immutability:
    // Live dbOrders from Neon PostgreSQL are authoritative and must NEVER have items mutated by disk/seed
    const deletedOrderIds = loadDiskDeletedOrders();
    const uniqueMap = new Map<string, Order>();

    // 1. Insert authoritative dbOrders first
    dbOrders.forEach(o => {
      if (o && o.id && !deletedOrderIds.has(o.id) && !deletedOrderIds.has(o.merchantTransactionId || '')) {
        uniqueMap.set(o.id, o);
      }
    });

    // 2. Insert fresh in-memory orders (only update dynamic status/tracking if already in DB, or add if new)
    [...this.memoryOrders, ...gBuffer].forEach(o => {
      if (o && o.id && !deletedOrderIds.has(o.id) && !deletedOrderIds.has(o.merchantTransactionId || '')) {
        const existing = uniqueMap.get(o.id);
        if (!existing) {
          uniqueMap.set(o.id, o);
        } else {
          // If in DB, preserve DB items and total, only update live dynamic status if memory is fresher
          const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
          const incomingTime = o.updatedAt ? new Date(o.updatedAt).getTime() : 0;
          if (incomingTime >= existingTime) {
            uniqueMap.set(o.id, {
              ...existing,
              orderStatus: o.orderStatus || existing.orderStatus,
              paymentStatus: (o.paymentStatus === 'SUCCESS' || existing.paymentStatus === 'SUCCESS') ? 'SUCCESS' : (o.paymentStatus || existing.paymentStatus),
              trackingNumber: o.trackingNumber || existing.trackingNumber,
              courierName: o.courierName || existing.courierName,
              paymentProofUrl: o.paymentProofUrl || existing.paymentProofUrl,
              deliveryNotes: o.deliveryNotes || (existing as any).deliveryNotes,
              updatedAt: o.updatedAt || existing.updatedAt
            });
          }
        }
      }
    });

    // 3. Fallback diskOrders & fsOrders ONLY when DB has 0 orders, or for unique non-colliding legacy orders
    if (dbOrders.length === 0) {
      [...diskOrders, ...fsOrders, ...defOrders].forEach(o => {
        if (o && o.id && !deletedOrderIds.has(o.id) && !deletedOrderIds.has(o.merchantTransactionId || '')) {
          if (!uniqueMap.has(o.id)) {
            uniqueMap.set(o.id, o);
          }
        }
      });
    }

    const result = Array.from(uniqueMap.values()).filter(o => {
      if (!o || !o.id || deletedOrderIds.has(o.id) || deletedOrderIds.has(o.merchantTransactionId || '') || deletedOrderIds.has(o.orderNumber || '')) {
        return false;
      }
      // If order was explicitly cancelled or failed, do not show in active admin/operational orders
      if ((o.orderStatus || '').toUpperCase() === 'CANCELLED' || o.paymentStatus === 'FAILED') {
        return false;
      }
      // For automated online gateways (Razorpay, PhonePe):
      // Only include orders if payment succeeded!
      const isOnlineGateway = o.paymentMethod === 'RAZORPAY' || o.paymentMethod === 'PHONEPE' || (o.paymentMethod as string) === 'CARD';
      if (isOnlineGateway && o.paymentStatus !== 'SUCCESS') {
        return false;
      }
      return true;
    });
    if (!userId) {
      this.ordersCache = { data: result, expiresAt: Date.now() + 60000 };
    }
    return result;
  }

  async syncAllVerifiedOrdersToDatabase(): Promise<Order[]> {
    const prisma = getPrismaClient();
    const diskOrders = loadDiskOrders();
    if (!prisma) return diskOrders;

    for (const order of diskOrders) {
      try {
        const orderId = order.id;
        const subtotal = Number(order.subtotal || order.grandTotal || 0);
        const grandTotal = Number(order.grandTotal || subtotal);
        const shippingFee = Number(order.shippingCharge || 0);
        const discount = Number(order.discount || 0);

        const dbStatus = toPrismaOrderStatus(order.orderStatus);
        const dbPayStatus = (order.paymentStatus === 'SUCCESS' ? 'SUCCESS' : 'PENDING') as any;
        const updatedAtDate = order.updatedAt ? new Date(order.updatedAt) : new Date();

        const addressJson = JSON.stringify(order.shippingAddress || {});
        const notesObj = {
          courierName: order.courierName || 'Professional Courier (Reduced Soil)',
          potOption: order.potOption || 'REDUCED_SOIL',
          potCharge: order.potCharge || 0,
          packingOption: order.packingOption || 'STANDARD',
          packingCharge: order.packingCharge || 0,
          courierDistrict: order.courierDistrict,
          courierBranch: order.courierBranch,
          txnId: order.transactionId || order.merchantTransactionId || '',
          proof: order.paymentProofUrl,
          itemsSnapshot: order.items
        };

        const existingInDb = await prisma.order.findUnique({
          where: { id: orderId }
        }).catch(() => null);

        if (existingInDb) {
          // Do NOT overwrite existing database order status with stale disk status!
          continue;
        }

        const defaultProd = await prisma.product.findFirst({ select: { id: true } }).catch(() => null);
        const fallbackProdId = defaultProd?.id || 'prod-rose-01';

        const validItems = (order.items || []).map((it: any) => ({
          productId: it.productId || fallbackProdId,
          productName: it.name || it.productName || 'Nursery Plant',
          price: Number(it.price || 0),
          quantity: Number(it.quantity || 1),
          totalPrice: Number(it.price || 0) * Number(it.quantity || 1)
        }));

        await prisma.order.create({
          data: {
            id: orderId,
            orderNumber: orderId,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerEmail: order.customerEmail || '',
            shippingAddress: addressJson,
            subtotal,
            deliveryFee: shippingFee,
            discount,
            totalAmount: grandTotal,
            status: dbStatus as any,
            paymentStatus: dbPayStatus,
            paymentMethod: 'RAZORPAY',
            merchantTransactionId: order.merchantTransactionId || `MT_${orderId}`,
            trackingNumber: order.trackingNumber || '',
            notes: JSON.stringify(notesObj),
            createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
            updatedAt: updatedAtDate,
            items: validItems.length > 0 ? { create: validItems } : undefined
          }
        });
      } catch (err) {
        console.warn(`[Sync Order DB] Could not upsert order ${order.id}:`, err);
      }
    }
    this.invalidateOrdersCache();
    return this.getOrders();
  }

  async deleteOrder(id: string): Promise<boolean> {
    this.invalidateOrdersCache();
    this.invalidateDashboardStatsCache();
    const clean = (id || '').trim();
    if (clean) {
      const deletedIds = loadDiskDeletedOrders();
      deletedIds.add(clean);
      const target = this.memoryOrders.find(o => o.id === clean || o.merchantTransactionId === clean || (o as any).orderNumber === clean);
      if (target) {
        if (target.id) deletedIds.add(target.id);
        if (target.orderNumber) deletedIds.add(target.orderNumber);
        if (target.merchantTransactionId) deletedIds.add(target.merchantTransactionId);
      }
      saveDiskDeletedOrders(deletedIds);
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
    let memMatch = this.memoryOrders.find(o => 
      (o.id && o.id.toLowerCase() === clean) ||
      (o.merchantTransactionId && o.merchantTransactionId.toLowerCase() === clean) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase() === clean)
    );

    if (!memMatch) {
      const allDisk = loadDiskOrders();
      memMatch = allDisk.find(o => 
        (o.id && o.id.toLowerCase() === clean) ||
        (o.merchantTransactionId && o.merchantTransactionId.toLowerCase() === clean) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase() === clean)
      );
    }

    if (memMatch) {
      return memMatch;
    }

    const prisma = getPrismaClient();
    if (!prisma) {
      return null;
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
      let unpackedItemsSnapshot: OrderItemSnapshot[] | undefined = undefined;

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
          if (pNotes.itemsSnapshot && Array.isArray(pNotes.itemsSnapshot) && pNotes.itemsSnapshot.length > 0) {
            unpackedItemsSnapshot = pNotes.itemsSnapshot;
          }
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

      const itemsSnapshot: OrderItemSnapshot[] = (unpackedItemsSnapshot && unpackedItemsSnapshot.length > 0)
        ? unpackedItemsSnapshot
        : o.items.map(i => {
            const rawId = (i.productId || 'PLANT').trim();
            const isComboItem = rawId.toLowerCase().startsWith('combo-') || rawId.toLowerCase().startsWith('vrg-combo-');
            const cleanSku = (isComboItem
              ? `CMB-${rawId.replace(/^combo-|^vrg-combo-/i, '').slice(0, 8).toUpperCase()}`
              : `VRG-${rawId.replace(/^vrg-|^prod-/i, '').slice(0, 8).toUpperCase()}`);

            return {
              productId: i.productId,
              sku: cleanSku,
              name: i.productName || 'Nursery Plant',
              tamilName: i.productName || 'நார்சரி செடி',
              price: i.price,
              mrp: i.price,
              quantity: i.quantity,
              image: '/products/double-delight.jpeg'
            };
          });

      const rawTracking = (o as any).trackingNumber || '';
      let parsedCourier: string | undefined = parsedCourierFromNotes;
      let parsedTracking: string | undefined = rawTracking || undefined;
      if (rawTracking.includes(' | ')) {
        const parts = rawTracking.split(' | ');
        parsedCourier = parts[0]?.trim();
        parsedTracking = parts[1]?.trim();
      }

      const hasProof = Boolean(unpackedProofUrl);
      const dbStatus = fromPrismaOrderStatus(o.status);

      const calculatedSubtotal = itemsSnapshot.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
      const finalSubtotal = Number(o.subtotal) > 0 ? Number(o.subtotal) : (calculatedSubtotal > 0 ? calculatedSubtotal : Number(o.totalAmount || 0));
      const packingAndPotCharges = Number(unpackedPackingCharge || 0) + Number(unpackedPotCharge || 0);
      const finalGrandTotal = Number(o.totalAmount) > 0 ? Number(o.totalAmount) : (finalSubtotal + Number(o.deliveryFee || 0) + packingAndPotCharges - Number(o.discount || 0));

      return {
        id: o.id,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerEmail: o.customerEmail || '',
        shippingAddress: parsedAddress,
        items: itemsSnapshot,
        subtotal: finalSubtotal,
        discount: o.discount,
        shippingCharge: o.deliveryFee,
        grandTotal: finalGrandTotal,
        orderStatus: dbStatus,
        paymentStatus: (o.paymentStatus === 'SUCCESS' || (o as any).status === 'PAID') ? 'SUCCESS' : o.paymentStatus === 'FAILED' ? 'FAILED' : 'PENDING',
        paymentMethod: (((o as any).paymentMethod === 'RAZORPAY' || (o as any).paymentMethod === 'CARD' || String(o.merchantTransactionId || '').startsWith('order_') || String(o.merchantTransactionId || '').startsWith('pay_') || String(unpackedTxnId || '').startsWith('pay_'))
          ? 'RAZORPAY'
          : (o as any).paymentMethod === 'COD' 
          ? 'COD' 
          : (o as any).paymentMethod === 'PHONEPE'
          ? 'PHONEPE'
          : 'QR_PAYMENT') as PaymentMethod,
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

  async updateOrderStatus(
    orderId: string, 
    status?: Order['orderStatus'], 
    trackingNumber?: string, 
    courierName?: string, 
    paymentStatus?: string, 
    paymentProofUrl?: string,
    deliveryNotes?: string
  ): Promise<Order | null> {
    const cleanId = (orderId || '').trim().toLowerCase();
    let memOrder = this.memoryOrders.find(o => 
      (o.id && o.id.toLowerCase() === cleanId) || 
      (o.merchantTransactionId && o.merchantTransactionId.toLowerCase() === cleanId)
    );

    if (!memOrder) {
      const diskOrders = loadDiskOrders();
      const diskMatch = diskOrders.find(o => 
        (o.id && o.id.toLowerCase() === cleanId) || 
        (o.merchantTransactionId && o.merchantTransactionId.toLowerCase() === cleanId)
      );
      if (diskMatch) {
        memOrder = { ...diskMatch };
        this.memoryOrders.unshift(memOrder);
      }
    }

    if (!memOrder) {
      const dbOrder = await this.getOrderById(orderId);
      if (dbOrder) {
        memOrder = { ...dbOrder };
        this.memoryOrders.unshift(memOrder);
      }
    }

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
        orderStatus: status || 'CONFIRMED',
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
      if (deliveryNotes !== undefined) (memOrder as any).deliveryNotes = deliveryNotes;
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

    const prisma = getPrismaClient();
    if (prisma) {
      const dbStatus = toPrismaOrderStatus(memOrder.orderStatus);
      const dbPayment = memOrder.paymentStatus === 'SUCCESS' ? 'SUCCESS' : memOrder.paymentStatus === 'FAILED' ? 'FAILED' : undefined;
      const finalTracking = memOrder.trackingNumber ? `${memOrder.courierName ? memOrder.courierName + ' | ' : ''}${memOrder.trackingNumber}` : undefined;

      await prisma.order.updateMany({
        where: {
          OR: [
            { id: { equals: orderId, mode: 'insensitive' } },
            { orderNumber: { equals: orderId, mode: 'insensitive' } },
            { merchantTransactionId: { equals: orderId, mode: 'insensitive' } }
          ]
        },
        data: {
          status: dbStatus as any,
          updatedAt: new Date(memOrder.updatedAt),
          ...(dbPayment ? { paymentStatus: dbPayment as any } : {}),
          ...(finalTracking ? { trackingNumber: finalTracking } : {})
        }
      }).catch(err => console.warn('Prisma background updateOrderStatus notice:', err?.message));
    }

    // Non-blocking Firestore sync in background
    firestoreUpdateOrder(orderId, {
      orderStatus: memOrder.orderStatus,
      updatedAt: memOrder.updatedAt,
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(trackingNumber ? { trackingNumber } : {}),
      ...(courierName ? { courierName } : {}),
      ...(deliveryNotes ? { deliveryNotes } : {})
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
            status: toPrismaOrderStatus(order.orderStatus) as any,
            paymentStatus: order.paymentStatus === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
            paymentMethod: (order.paymentMethod === 'COD' ? 'COD' : order.paymentMethod === 'PHONEPE' ? 'PHONEPE' : 'UPI') as any,
            notes: JSON.stringify({
              note: order.notes || '',
              itemsSnapshot: items
            }),
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

    // Non-blocking Firestore sync in background
    firestoreSaveOrder(order).catch(() => {});

    // 🔒 Non-blocking append-only immutable vault archive
    ImmutableOrderVaultService.archiveOrder(order).catch(err => console.warn('ImmutableOrderVault notice:', err?.message));

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
      // Execute database persistence asynchronously in background so client response is instant
      (async () => {
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
            courierBranch: updatedOrder.courierBranch || null,
            itemsSnapshot: updatedItems
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
              status: toPrismaOrderStatus(updatedOrder.orderStatus) as any,
              paymentStatus: updatedOrder.paymentStatus === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
              paymentMethod: (updatedOrder.paymentMethod === 'COD' ? 'COD' : updatedOrder.paymentMethod === 'PHONEPE' ? 'PHONEPE' : 'UPI') as any,
              notes: notesPayload,
              trackingNumber: updatedOrder.trackingNumber || null
            }
          });

          // Bulk-persist updated items to Prisma OrderItem table without N+1 sequential loops
          if (updatedItems && updatedItems.length > 0) {
            const dbOrder = await prisma.order.findFirst({
              where: orderMatch,
              select: { id: true }
            }).catch(() => null);

            if (dbOrder) {
              const defaultProd = await prisma.product.findFirst({ select: { id: true } }).catch(() => null);
              const fallbackProdId = defaultProd?.id || 'prod-rose-01';

              const pIds = updatedItems.map(i => i.productId).filter(Boolean);
              const existingProds = await prisma.product.findMany({
                where: { id: { in: pIds } },
                select: { id: true }
              }).catch(() => []);
              const existingSet = new Set(existingProds.map(p => p.id));

              await prisma.orderItem.deleteMany({
                where: { orderId: dbOrder.id }
              }).catch(() => {});

              await prisma.orderItem.createMany({
                data: updatedItems.map(it => ({
                  orderId: dbOrder.id,
                  productId: existingSet.has(it.productId) ? it.productId : fallbackProdId,
                  productName: it.name || it.productName || 'Nursery Plant',
                  price: Number(it.price || 0),
                  quantity: Number(it.quantity || 1),
                  totalPrice: Number(it.price || 0) * Number(it.quantity || 1)
                }))
              }).catch((e: any) => console.warn('[updateOrderFull] could not insert orderItems:', e?.message || e));
            }
          }
        } catch (err: any) {
          console.error('Prisma updateOrderFull background error:', err?.message || err);
        }
      })().catch(() => {});
    }

    // Non-blocking Firestore sync in background
    firestoreUpdateOrder(updatedOrder.id, {
      orderStatus: updatedOrder.orderStatus,
      paymentStatus: updatedOrder.paymentStatus,
      trackingNumber: updatedOrder.trackingNumber,
      courierName: updatedOrder.courierName,
      deliveryNotes: (updatedOrder as any).deliveryNotes,
      updatedAt: updatedOrder.updatedAt
    }).catch(() => {});

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
