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
  tamilName: z.string().optional(),
  price: z.number().optional(),
  image: z.string().optional(),
  freeDelivery: z.boolean().optional(),
  isCombo: z.boolean().optional()
});

export const createOrderSchema = z.object({
  customerName: z.string().min(2, 'Name is required').max(100),
  customerPhone: z.string().min(10, 'Valid 10-digit phone number required').max(15),
  customerEmail: z.string().email('Valid email address required'),
  shippingAddress: addressSchema,
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one product item'),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['PHONEPE', 'COD', 'QR_PAYMENT', 'UPI_DIRECT', 'RAZORPAY']),
  // Payment proof URL validation — accepts data URIs (base64 image), HTTP URLs, or relative paths
  paymentProofUrl: z.string()
    .optional()
    .nullable()
    .transform(val => val || undefined)
    .refine(
      (val) => !val || val.startsWith('data:image/') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/') || val.length > 50,
      { message: 'Payment proof must be a valid image or URL' }
    ),
  transactionId: z.string().max(100).optional().nullable().transform(val => val || undefined),
  shippingCharge: z.number().min(0).optional(),
  subtotal: z.number().min(0).optional(),
  grandTotal: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  deliveryOption: z.string().optional(),
  potOption: z.string().optional(),
  potCharge: z.number().min(0).optional(),
  packingOption: z.string().optional(),
  packingCharge: z.number().min(0).optional(),
  courierName: z.string().optional(),
  courierDistrict: z.string().optional(),
  courierBranch: z.string().optional()
});

export const productSchema = z.object({
  // SKU is optional — auto-generated server-side if not provided
  sku: z.string().optional(),
  name: z.string().min(1, 'Product name is required').max(200),
  englishName: z.string().max(200).optional().default(''),
  tamilName: z.string().max(200).optional().default(''),
  scientificName: z.string().max(200).optional().default(''),
  categoryId: z.string().optional().default('cat-roses'),
  categoryName: z.string().optional().default('Roses'),
  // Description is optional — admin can leave blank, defaults to plant name
  description: z.string().optional().default(''),
  mrp: z.coerce.number().min(0).optional().default(0),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be >= 0'),
  discount: z.coerce.number().min(0).max(100).optional().default(0),
  stock: z.coerce.number().int().min(0).optional().default(25),
  plantHeight: z.string().optional().default('1–2 Feet'),
  potSize: z.string().optional().default('8 Inch Bag'),
  sunlight: z.string().optional().default('Full Sun'),
  waterRequirement: z.string().optional().default('Daily'),
  floweringSeason: z.string().optional().default('All Year'),
  careInstructions: z.union([
    z.object({
      watering: z.string().optional().default('Water daily in the morning.'),
      sunlight: z.string().optional().default('Requires 5 hours direct sunlight.'),
      fertilizer: z.string().optional().default('Apply vermicompost every 15 days.'),
      soil: z.string().optional().default('Red soil mixed with coco peat.')
    }),
    z.record(z.string(), z.any())
  ]).optional().default({
    watering: 'Water daily in the morning.',
    sunlight: 'Requires 5 hours direct sunlight.',
    fertilizer: 'Apply vermicompost every 15 days.',
    soil: 'Red soil mixed with coco peat.'
  }),
  // Accept both full URLs (https://...) and local paths (/products/image.jpg)
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  images: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
  bestSeller: z.boolean().optional().default(false),
  trending: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional().default('ACTIVE')
});

export const updateProductSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(1, 'Product name cannot be empty').max(200).optional(),
  englishName: z.string().max(200).optional(),
  tamilName: z.string().max(200).optional(),
  scientificName: z.string().max(200).optional(),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
  description: z.string().optional(),
  mrp: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be >= 0').optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  plantHeight: z.string().optional(),
  potSize: z.string().optional(),
  sunlight: z.string().optional(),
  waterRequirement: z.string().optional(),
  floweringSeason: z.string().optional(),
  careInstructions: z.union([
    z.object({
      watering: z.string().optional(),
      sunlight: z.string().optional(),
      fertilizer: z.string().optional(),
      soil: z.string().optional()
    }),
    z.record(z.string(), z.any())
  ]).optional(),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  bestSeller: z.boolean().optional(),
  trending: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional()
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
  type: z.enum(['PERCENT', 'FIXED', 'PERCENTAGE', 'FLAT']).optional(),
  value: z.number().optional(),
  discountType: z.string().optional(),
  discountValue: z.number().optional(),
  minOrder: z.number().optional(),
  minOrderAmount: z.number().optional(),
  maxDiscount: z.number().optional(),
  expiryDate: z.string().optional()
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
