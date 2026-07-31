import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(100),
  phone: z.string().min(10, 'Valid 10-digit phone number is required').max(15),
  houseNo: z.string().min(1, 'House/Door number is required').max(100),
  street: z.string().min(1, 'Street address is required').max(200),
  villageTown: z.string().min(1, 'Village/Town is required').max(100),
  district: z.string().min(1, 'District is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  pincode: z.string().length(6, 'Pincode must be 6 digits').regex(/^\d{6}$/, 'Pincode must contain numbers only'),
  landmark: z.string().optional(),
  addressType: z.enum(['Home', 'Work', 'Farm', 'Other']).default('Home')
});

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  sku: z.string().optional(),
  name: z.string().optional(),
  price: z.number().positive().optional()
});

export const createOrderSchema = z.object({
  customerName: z.string().min(2, 'Name is required').max(100),
  customerPhone: z.string().min(10, 'Valid 10-digit phone number required').max(15),
  customerEmail: z.string().email('Valid email address required'),
  shippingAddress: addressSchema,
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one product item'),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['PHONEPE', 'COD'])
});

export const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(2).max(200),
  englishName: z.string().min(2).max(200),
  tamilName: z.string().min(1).max(200),
  scientificName: z.string().min(1).max(200),
  categoryId: z.string().min(1),
  categoryName: z.string().min(1),
  description: z.string().min(5),
  mrp: z.number().positive(),
  sellingPrice: z.number().positive(),
  discount: z.number().min(0).max(100),
  stock: z.number().int().min(0),
  plantHeight: z.string().min(1),
  potSize: z.string().min(1),
  sunlight: z.string().min(1),
  waterRequirement: z.string().min(1),
  floweringSeason: z.string().min(1),
  careInstructions: z.object({
    watering: z.string(),
    sunlight: z.string(),
    fertilizer: z.string(),
    soil: z.string()
  }),
  // Accept both full URLs (https://...) and local paths (/products/image.jpg)
  images: z.array(z.string().min(1)).min(1),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  trending: z.boolean().default(false),
  tags: z.array(z.string()),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE')
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  userName: z.string().min(2).max(100),
  rating: z.number().min(1).max(5),
  title: z.string().min(2).max(150),
  comment: z.string().min(5).max(1000)
});

export const couponSchema = z.object({
  code: z.string().min(3).max(20).transform(val => val.toUpperCase()),
  type: z.enum(['PERCENT', 'FIXED']),
  value: z.number().positive(),
  minOrder: z.number().min(0).default(0),
  maxDiscount: z.number().positive().optional(),
  expiryDate: z.string().min(1)
});

export const updateOrderStatusSchema = z.object({
  orderStatus: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'PACKED',
    'DISPATCHED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED'
  ]).optional(),
  courierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  deliveryNotes: z.string().optional()
});
