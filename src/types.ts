export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 'PACKING' | 'DISPATCHED' | 'OUT_FOR_DELIVERY' | 'SHIPPED' | 'COURIER' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'RETURNED';
export type PaymentMethod = 'PHONEPE' | 'COD' | 'UPI_DIRECT' | 'QR_PAYMENT' | 'RAZORPAY' | 'WHATSAPP' | 'UPI' | 'MANUAL';

export interface Product {
  id: string;
  sku: string;
  name: string;
  englishName: string;
  tamilName: string;
  scientificName: string;
  categoryId: string;
  categoryName: string;
  description: string;
  mrp: number;
  sellingPrice: number;
  discount: number;
  stock: number;
  plantHeight: string;
  potSize: string;
  sunlight: 'Full Sun' | 'Partial Shade' | 'Indirect Sunlight' | 'Low Light' | string;
  waterRequirement: 'Daily' | 'Twice a week' | 'When dry' | 'Low Water' | 'Alternate Days' | 'Moderate' | string;
  floweringSeason: string;
  careInstructions: {
    watering: string;
    sunlight: string;
    fertilizer: string;
    soil: string;
  };
  images: string[];
  image?: string;
  imageUrl?: string;
  featured: boolean;
  bestSeller: boolean;
  trending: boolean;
  tags: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'DISABLED';
}

export interface Category {
  id: string;
  name: string;
  tamilName: string;
  slug: string;
  iconName?: string;
  image: string;
  description?: string;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  productCount?: number;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  isCombo?: boolean;
  comboId?: string;
  comboTitle?: string;
  comboBadge?: string;
  freeDelivery?: boolean;
  comboProducts?: Product[];
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  alternatePhone?: string;
  houseNo: string;
  street: string;
  villageTown: string;
  district: string;
  state: string;
  pincode: string;
  landmark?: string;
  addressType: 'Home' | 'Work' | 'Other';
}

export interface OrderItemSnapshot {
  productId: string;
  sku: string;
  name: string;
  tamilName: string;
  price: number;
  mrp: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  merchantTransactionId: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: ShippingAddress;
  items: OrderItemSnapshot[];
  subtotal: number;
  shippingCharge: number;
  discount: number;
  couponCode?: string;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentProofUrl?: string;
  transactionId?: string;
  paymentProofUploadedAt?: string;
  phonepeProviderReferenceId?: string;
  courierName?: string;
  trackingNumber?: string;
  deliveryNotes?: string;
  notes?: string;
  potCharge?: number;
  potOption?: string;
  packingCharge?: number;
  packingOption?: string;
  courierDistrict?: string;
  courierBranch?: string;
  isLabelPrinted?: boolean;
  labelPrintedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentLog {
  id: string;
  merchantTransactionId: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  responseCode?: string;
  responseMessage?: string;
  checksum: string;
  payload: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  expiryDate: string;
  active: boolean;
  usageCount: number;
  maxUsageCount?: number;
  description?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  targetCategory?: string;
  link?: string;
  ctaText?: string;
  active: boolean;
  order: number;
}

export interface Review {
  id: string;
  productId?: string;
  productName?: string;
  userId?: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  reply?: string;
  createdAt: string;
  imageUrl?: string;
  location?: string;
  isVerified?: boolean;
  featured?: boolean;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'CUSTOMER' | 'USER' | 'MANAGER';
  avatarUrl?: string;
  isVerified?: boolean;
  createdAt?: string;
}

export interface SiteSettings {
  businessName: string;
  tagline: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  googleMapsUrl: string;
  workingHours: string;
  taxRate: number; // percentage
  shippingFee: number;
  freeShippingThreshold: number;
  enableCod: boolean;
  enablePhonePe: boolean;
  enableQrPayment: boolean;
  enableRazorpay?: boolean;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  qrCodeImageUrl?: string;
  upiId?: string;
  upiName?: string;
  qrInstructions?: string;
  phonepeMerchantId: string;
  phonepeSaltKey: string;
  phonepeSaltIndex: string;
  phonepeEnv: 'SANDBOX' | 'PRODUCTION';
  phonepeHostUrl?: string;
}

export interface FinancialEntry {
  id: string;
  type: 'EXPENSE' | 'SALE' | 'REVENUE' | 'INCOME';
  title: string;
  category: 'Fertilizer' | 'Pots & Bags' | 'Soil & Manure' | 'Labor & Workers' | 'Transport & Freight' | 'Plant Wholesale' | 'Direct Nursery Sale' | 'Other' | string;
  costAmount: number;
  sellAmount: number;
  quantity: number;
  amount?: number;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface Combo {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  productIds: string[];
  products?: Product[];
  originalPrice: number;
  comboPrice: number;
  discountPercent: number;
  imageUrl?: string;
  active: boolean;
  order?: number;
  freeDelivery?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

