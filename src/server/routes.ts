import express from 'express';
import { db } from './db.js';
import { PhonePeService } from './phonepe.js';
import { authRouter } from './routes/authRoutes.js';
import {
  parseAuthUser,
  requireAuth,
  requireAdmin,
  AuthenticatedRequest
} from './middleware/auth.js';
import { validateBody, validateQuery } from './middleware/validate.js';
import { checkoutLimiter } from './middleware/security.js';
import {
  createOrderSchema,
  productSchema,
  reviewSchema,
  couponSchema,
  updateOrderStatusSchema
} from './schemas.js';
import { isPrismaConnected } from './prisma.js';

export const apiRouter = express.Router();

apiRouter.use(express.json());
apiRouter.use(parseAuthUser);

// Mount Production Auth Router
apiRouter.use('/auth', authRouter);

// ================= HEALTH CHECK =================
apiRouter.get('/health', async (req, res) => {
  const prismaConnected = await isPrismaConnected();
  res.json({
    status: 'ok',
    service: 'Veerika Rose Garden E-Commerce API',
    databaseConnected: prismaConnected,
    databaseEngine: prismaConnected ? 'Neon PostgreSQL (Prisma ORM)' : 'Database Unavailable',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ================= PRODUCT ROUTES =================
apiRouter.get('/products', async (req, res) => {
  try {
    const { search, categoryId, featured, bestSeller, minPrice, maxPrice, sort } = req.query;
    const products = await db.getProducts({
      search: search as string,
      categoryId: categoryId as string,
      featured: featured === 'true',
      bestSeller: bestSeller === 'true',
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort: sort as string
    });
    res.json({ success: true, count: products.length, products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/products/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/products', requireAdmin, validateBody(productSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const product = await db.addProduct(req.body);
    res.status(201).json({ success: true, product, message: 'Product added successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.put('/products/:id', requireAdmin, validateBody(productSchema.partial()), async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await db.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product: updated, message: 'Product updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.delete('/products/all', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    await db.deleteAllProducts();
    res.json({ success: true, message: 'All products removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.delete('/products/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    await db.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================= CATEGORY ROUTES =================
apiRouter.get('/categories', async (req, res) => {
  try {
    const onlyFeatured = req.query.featured === 'true';
    const showAll = req.query.all === 'true';
    const categories = await db.getCategories({
      onlyActive: !showAll,
      onlyFeatured
    });
    res.json({ success: true, count: categories.length, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/categories/:slug', async (req, res) => {
  try {
    const category = await db.getCategoryBySlug(req.params.slug);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const products = await db.getProducts({ categoryId: category.id });

    // Generate JSON-LD Schema.org Structured Data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": category.name,
      "alternateName": category.tamilName,
      "description": category.description || `${category.name} plants at Veerika Rose Garden`,
      "url": category.canonicalUrl || `https://veerikarosegarden.com/#/category/${category.slug}`,
      "image": category.image,
      "numberOfItems": products.length,
      "itemListElement": products.map((p, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "Product",
          "name": p.name,
          "image": p.images[0] || '',
          "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": p.sellingPrice,
            "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          }
        }
      }))
    };

    res.json({
      success: true,
      category,
      productCount: products.length,
      products,
      seo: {
        title: category.metaTitle || `${category.name} (${category.tamilName}) - Buy Plants Online | Veerika Rose Garden`,
        description: category.metaDescription || category.description || `Buy high-yield ${category.name} (${category.tamilName}) grafted plants direct from Hosur & Madurai nurseries.`,
        ogImage: category.ogImage || category.image,
        canonicalUrl: category.canonicalUrl || `https://veerikarosegarden.com/#/category/${category.slug}`,
        structuredData
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/admin/categories', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const categories = await db.getCategories({ onlyActive: false });
    res.json({ success: true, count: categories.length, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/categories', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const category = await db.addCategory(req.body);
    res.status(201).json({ success: true, category, message: 'Category created successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.post('/admin/categories', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const category = await db.addCategory(req.body);
    res.status(201).json({ success: true, category, message: 'Category created successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.put('/admin/categories/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const category = await db.updateCategory(req.params.id, req.body);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, category, message: 'Category updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.delete('/admin/categories/all', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    await db.deleteAllCategories();
    res.json({ success: true, message: 'All categories removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.delete('/admin/categories/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const force = req.query.force === 'true';
    const targetCategoryId = req.query.targetCategoryId as string | undefined;
    const result = await db.deleteCategory(req.params.id, { force, targetCategoryId });

    if (!result.success && result.hasProducts) {
      return res.status(400).json({
        success: false,
        code: 'HAS_PRODUCTS',
        productCount: result.productCount,
        message: result.message
      });
    }

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================= BANNERS & COUPONS =================
const DEFAULT_BANNERS = [
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

apiRouter.get('/banners', async (req, res) => {
  try {
    let banners = await db.getBanners();
    // Auto-seed default banners if table is empty
    if (!banners || banners.length === 0) {
      banners = DEFAULT_BANNERS;
    }
    res.json({ success: true, banners });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/banners', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const banner = await db.addBanner(req.body);
    res.status(201).json({ success: true, banner });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Admin: Seed default banners and sample coupons into DB
apiRouter.post('/admin/seed', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const prisma = (db as any).prisma || (await import('./prisma.js')).getPrismaClient();
    if (!prisma) return res.status(503).json({ success: false, message: 'Database not connected' });

    // Seed banners
    let bannersSeeded = 0;
    for (const b of DEFAULT_BANNERS) {
      try {
        await prisma.banner.upsert({
          where: { id: b.id },
          update: {},
          create: b
        });
        bannersSeeded++;
      } catch {}
    }

    // Seed coupons
    const defaultCoupons = [
      { id: 'coup-welcome10', code: 'WELCOME10', discountType: 'PERCENTAGE', discountValue: 10, minOrderValue: 0, maxDiscount: 100, isActive: true },
      { id: 'coup-rose20', code: 'ROSE20', discountType: 'PERCENTAGE', discountValue: 20, minOrderValue: 200, maxDiscount: 200, isActive: true },
      { id: 'coup-flat50', code: 'FLAT50', discountType: 'FIXED', discountValue: 50, minOrderValue: 300, isActive: true },
      { id: 'coup-veerika15', code: 'VEERIKA15', discountType: 'PERCENTAGE', discountValue: 15, minOrderValue: 150, maxDiscount: 150, isActive: true }
    ];

    let couponsSeeded = 0;
    for (const c of defaultCoupons) {
      try {
        await prisma.coupon.upsert({
          where: { code: c.code },
          update: {},
          create: c
        });
        couponsSeeded++;
      } catch {}
    }

    res.json({ success: true, message: `Seeded ${bannersSeeded} banners and ${couponsSeeded} coupons` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/coupons/apply', async (req, res) => {
  try {
    const { code, cartAmount } = req.body;
    if (!code || typeof cartAmount !== 'number') {
      return res.status(400).json({ success: false, message: 'Coupon code and cart amount required' });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const coupon = await db.getCouponByCode(cleanCode);

    if (!coupon || !coupon.active) {
      return res.status(400).json({ success: false, message: `Invalid or expired coupon code '${cleanCode}'` });
    }

    if (cartAmount < coupon.minOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minOrder} required for coupon ${coupon.code}`
      });
    }

    let discountAmount = 0;
    if (coupon.type === 'PERCENT') {
      discountAmount = (cartAmount * coupon.value) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.value;
    }

    res.json({
      success: true,
      code: coupon.code,
      discountAmount: Math.round(discountAmount),
      message: `Coupon '${coupon.code}' applied successfully! 🎉`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});


apiRouter.get('/coupons', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const coupons = await db.getCoupons();
    res.json({ success: true, coupons });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/coupons', requireAdmin, validateBody(couponSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const rawType = req.body.type || (req.body.discountType === 'FLAT' ? 'FIXED' : 'PERCENT');
    const rawValue = req.body.value ?? req.body.discountValue ?? 10;
    const rawMinOrder = req.body.minOrder ?? req.body.minOrderAmount ?? 0;
    const rawExpiry = req.body.expiryDate || '2027-12-31';

    const coupon = await db.addCoupon({
      code: req.body.code.toUpperCase(),
      type: rawType === 'FLAT' || rawType === 'FIXED' ? 'FIXED' : 'PERCENT',
      value: Number(rawValue),
      minOrder: Number(rawMinOrder),
      maxDiscount: req.body.maxDiscount ? Number(req.body.maxDiscount) : undefined,
      expiryDate: rawExpiry,
      active: req.body.isActive !== false
    });
    res.status(201).json({ success: true, coupon });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

const handleDeleteCoupon = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const id = req.body?.id || req.body?.code || req.query?.id || req.query?.code || req.params?.id || req.params[0];
    if (!id) {
      return res.status(400).json({ success: false, message: 'Coupon ID or code is required for deletion' });
    }
    await db.deleteCoupon(String(id));
    res.json({ success: true, message: `Coupon '${id}' deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

apiRouter.post('/coupons/delete', requireAdmin, handleDeleteCoupon);
apiRouter.delete('/coupons', requireAdmin, handleDeleteCoupon);
apiRouter.delete('/coupons/:id', requireAdmin, handleDeleteCoupon);
apiRouter.post('/coupons/:id/delete', requireAdmin, handleDeleteCoupon);
apiRouter.delete('/admin/coupons/:id', requireAdmin, handleDeleteCoupon);




// ================= REVIEWS =================
apiRouter.get('/reviews', async (req, res) => {
  try {
    const { productId } = req.query;
    const reviews = await db.getReviews(productId as string | undefined);
    res.json({ success: true, reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/reviews', validateBody(reviewSchema), async (req, res) => {
  try {
    const review = await db.addReview({
      productId: req.body.productId,
      productName: req.body.productName,
      userName: req.body.userName,
      rating: Number(req.body.rating),
      title: req.body.title,
      comment: req.body.comment
    });
    res.status(201).json({ success: true, review, message: 'Review submitted successfully!' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ================= ORDERS & PHONEPE PAYMENTS =================
apiRouter.post('/orders', checkoutLimiter, validateBody(createOrderSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { customerName, customerPhone, customerEmail, shippingAddress, items, couponCode, paymentMethod, paymentProofUrl, transactionId } = req.body;

    // Check if the selected payment method is enabled in Site Settings
    const settings = await db.getSettings();
    if (paymentMethod === 'PHONEPE' && settings.enablePhonePe === false) {
      return res.status(400).json({ success: false, message: 'PhonePe payment method is currently disabled by admin.' });
    }
    if (paymentMethod === 'COD' && settings.enableCod === false) {
      return res.status(400).json({ success: false, message: 'Cash on Delivery (COD) is currently disabled by admin.' });
    }
    if ((paymentMethod === 'QR_PAYMENT' || paymentMethod === 'UPI_DIRECT') && settings.enableQrPayment === false) {
      return res.status(400).json({ success: false, message: 'Scan QR Code payment method is currently disabled by admin.' });
    }

    // Enforce mandatory payment screenshot proof for QR_PAYMENT / UPI_DIRECT
    if (paymentMethod === 'QR_PAYMENT' || paymentMethod === 'UPI_DIRECT') {
      if (!paymentProofUrl || typeof paymentProofUrl !== 'string' || !paymentProofUrl.trim()) {
        return res.status(400).json({ success: false, message: 'Payment screenshot/proof is mandatory for QR Code payment.' });
      }
    }

    let calculatedSubtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      let dbProduct = await db.getProductById(item.productId);
      if (!dbProduct) {
        dbProduct = {
          id: item.productId,
          sku: item.sku || `VRG-${item.productId.slice(0, 6).toUpperCase()}`,
          name: item.name || 'Nursery Plant Sapling',
          englishName: item.name || 'Nursery Plant Sapling',
          tamilName: item.tamilName || item.name || 'ரோஜா செடி',
          scientificName: 'Rosa Hybrid',
          categoryId: 'cat-rose',
          categoryName: 'Rose Varieties',
          description: item.name || 'Live Nursery Plant Sapling',
          mrp: item.price ? Math.round(item.price * 1.2) : 199,
          sellingPrice: item.price || 149,
          discount: 10,
          stock: 100,
          plantHeight: '1.5 Feet',
          potSize: '6 inch Grow Bag',
          sunlight: 'Full Sun',
          waterRequirement: 'Daily',
          floweringSeason: 'Continuous',
          careInstructions: {
            watering: 'Daily',
            sunlight: 'Full Sun',
            fertilizer: 'Organic Manure',
            soil: 'Red Soil'
          },
          images: [item.image || '/products/double-delight.jpeg'],
          rating: 4.8,
          reviewCount: 12,
          featured: false,
          bestSeller: false,
          trending: false,
          tags: ['rose'],
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      const itemTotal = dbProduct.sellingPrice * item.quantity;
      calculatedSubtotal += itemTotal;

      verifiedItems.push({
        productId: dbProduct.id,
        sku: dbProduct.sku,
        name: dbProduct.name,
        tamilName: dbProduct.tamilName,
        price: dbProduct.sellingPrice,
        mrp: dbProduct.mrp,
        quantity: item.quantity,
        image: dbProduct.images[0] || ''
      });
    }

    // Coupon verification
    let discount = 0;
    if (couponCode) {
      const coupon = await db.getCouponByCode(couponCode);
      if (coupon && coupon.active && calculatedSubtotal >= coupon.minOrder) {
        if (coupon.type === 'PERCENT') {
          discount = (calculatedSubtotal * coupon.value) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
        } else {
          discount = coupon.value;
        }
      }
    }

    const totalPlants = verifiedItems.reduce((sum, item) => sum + item.quantity, 0);
    const shippingCharge = totalPlants === 0 ? 0 : 50 + (totalPlants - 1) * 10;
    const calculatedGrandTotal = Math.max(1, Math.round(calculatedSubtotal + shippingCharge - discount));

    const merchantTransactionId = 'MT' + Date.now() + Math.floor(10 + Math.random() * 89);

    const userId = req.user?.id || req.body.userId || undefined;
    const finalName = customerName || req.user?.name || 'Valued Customer';
    const finalPhone = customerPhone || req.user?.phone || '';
    const finalEmail = req.user?.email || req.body.userEmail || customerEmail || '';

    const newOrder = await db.createOrder({
      userId,
      merchantTransactionId,
      customerName: finalName,
      customerPhone: finalPhone,
      customerEmail: finalEmail,
      shippingAddress,
      items: verifiedItems,
      subtotal: calculatedSubtotal,
      shippingCharge,
      discount: Math.round(discount),
      couponCode: couponCode || undefined,
      grandTotal: calculatedGrandTotal,
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      paymentMethod,
      paymentProofUrl: paymentProofUrl || undefined,
      transactionId: transactionId || undefined,
      paymentProofUploadedAt: paymentProofUrl ? new Date().toISOString() : undefined
    });

    if (paymentMethod === 'PHONEPE') {
      const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
      const redirectUrl = `${origin}/#/order-status/${newOrder.id}`;

      const phonepeRes = await PhonePeService.initiatePayment({
        merchantTransactionId,
        merchantUserId: finalPhone || 'CUST_' + Date.now(),
        amountInRupees: calculatedGrandTotal,
        redirectUrl,
        callbackUrl: `${origin}/api/phonepe/webhook`,
        mobileNumber: finalPhone,
        orderId: newOrder.id
      });

      return res.json({
        success: true,
        order: newOrder,
        orderId: newOrder.id,
        phonepe: phonepeRes,
        phonepePayUrl: phonepeRes?.payUrl,
        message: 'Order created. Proceed to PhonePe payment.'
      });
    }

    res.json({
      success: true,
      order: newOrder,
      orderId: newOrder.id,
      message: paymentMethod === 'QR_PAYMENT' 
        ? 'Order placed! Your payment screenshot proof was submitted and is pending admin verification.' 
        : 'Order placed successfully!'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/orders', async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    let orders = await db.getOrders();

    if (user) {
      const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      if (!isAdmin) {
        orders = orders.filter(o => 
          (o.userId && o.userId === user.id) ||
          (o.customerEmail && o.customerEmail.toLowerCase() === user.email?.toLowerCase()) ||
          (o.customerPhone && o.customerPhone === user.phone)
        );
      }
    }

    res.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/admin/orders', async (req: AuthenticatedRequest, res) => {
  try {
    const orders = await db.getOrders();
    res.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/admin/dashboard', async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/orders/user/:identifier', async (req: AuthenticatedRequest, res) => {
  try {
    const { identifier } = req.params;
    const authUser = req.user;
    const cleanId = (identifier || '').toLowerCase().trim();
    const allOrders = await db.getOrders();

    if (!cleanId || cleanId === 'all' || cleanId === 'guest') {
      return res.json({ success: true, count: 0, orders: [] });
    }

    const emailUser = cleanId.includes('@') ? cleanId.split('@')[0] : cleanId;
    const tokens = emailUser.split(/[^a-z0-9]+/).filter(t => t.length >= 3);
    const numOnly = cleanId.replace(/[^0-9]/g, '');

    const matchedOrders = allOrders.filter(o => {
      // 1. Session User Match
      if (authUser) {
        if (o.userId && o.userId === authUser.id) return true;
        if (o.customerEmail && authUser.email && o.customerEmail.toLowerCase() === authUser.email.toLowerCase()) return true;
        if (o.customerPhone && authUser.phone && o.customerPhone.replace(/\D/g, '') === authUser.phone.replace(/\D/g, '')) return true;
      }

      // 2. Direct identifier field match
      const p = (o.customerPhone || '').replace(/\D/g, '');
      const e = (o.customerEmail || '').toLowerCase();
      const u = (o.userId || '').toLowerCase();
      const n = (o.customerName || '').toLowerCase();

      if (numOnly && numOnly.length >= 7 && p && (p.includes(numOnly) || numOnly.includes(p))) return true;
      if (e && e.length > 3 && (cleanId.includes(e) || e.includes(cleanId))) return true;
      if (u && u.length > 3 && (cleanId.includes(u) || u.includes(cleanId))) return true;

      // 3. User Name & Email Token Matching (e.g. kupendran, naveen, email username)
      for (const t of tokens) {
        if (n.includes(t) || e.includes(t) || u.includes(t)) return true;
      }

      return false;
    });

    res.json({
      success: true,
      count: matchedOrders.length,
      orders: matchedOrders
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/orders/:id', async (req, res) => {
  try {
    let order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Auto-verify with PhonePe if still PENDING and payment method is PHONEPE
    if (order.paymentMethod === 'PHONEPE' && order.paymentStatus === 'PENDING' && order.merchantTransactionId) {
      await PhonePeService.checkStatus(order.merchantTransactionId);
      order = (await db.getOrderById(req.params.id)) || order;
    }

    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin GET all orders - no user filtering, always returns every order from every customer
apiRouter.get('/admin/orders', async (req: AuthenticatedRequest, res) => {
  try {
    const orders = await db.getOrders();
    res.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin update order status
apiRouter.put('/admin/orders/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { orderStatus, trackingNumber, courierName, paymentStatus } = req.body;
    const order = await db.updateOrderStatus(req.params.id, orderStatus, trackingNumber, courierName, paymentStatus);
    res.json({ success: true, order, message: 'Order status updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin delete order
const handleDeleteOrderRoute = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const id = req.params?.id || req.body?.id || req.body?.orderId;
    if (!id) return res.status(400).json({ success: false, message: 'Order ID is required' });
    await db.deleteOrder(String(id));
    res.json({ success: true, message: `Order #${id} deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

apiRouter.delete('/admin/orders/:id', requireAdmin, handleDeleteOrderRoute);
apiRouter.post('/admin/orders/delete', requireAdmin, handleDeleteOrderRoute);
apiRouter.post('/admin/orders/:id/delete', requireAdmin, handleDeleteOrderRoute);


// PHONEPE VERIFIED CHECK STATUS API
apiRouter.get('/phonepe/status/:merchantTransactionId', async (req, res) => {
  const statusRes = await PhonePeService.checkStatus(req.params.merchantTransactionId);
  res.json(statusRes);
});

// PHONEPE SERVER WEBHOOK HANDLER
apiRouter.post('/phonepe/webhook', async (req, res) => {
  try {
    const xVerify = req.headers['x-verify'] as string;
    const { response } = req.body;

    if (!response || !xVerify) {
      return res.status(400).json({ success: false, message: 'Missing response payload or X-VERIFY header' });
    }

    // Verify the checksum signature from PhonePe
    const isValid = await PhonePeService.verifyChecksum(response, xVerify);
    if (!isValid) {
      console.warn('[PhonePe Webhook] Invalid checksum from PhonePe:', xVerify);
      return res.status(401).json({ success: false, message: 'Invalid PhonePe webhook checksum signature' });
    }

    // Decode the base64 payload
    let decodedObj: any = {};
    try {
      const decodedJsonStr = Buffer.from(response, 'base64').toString('utf-8');
      decodedObj = JSON.parse(decodedJsonStr);
    } catch {
      return res.status(400).json({ success: false, message: 'Could not decode PhonePe response payload' });
    }

    // merchantTransactionId can be at data.merchantTransactionId
    const merchantTransactionId = decodedObj?.data?.merchantTransactionId || decodedObj?.merchantTransactionId;

    if (merchantTransactionId) {
      console.log('[PhonePe Webhook] Processing transaction:', merchantTransactionId, 'code:', decodedObj.code);
      await PhonePeService.checkStatus(merchantTransactionId);
    } else {
      console.warn('[PhonePe Webhook] No merchantTransactionId in payload:', decodedObj);
    }

    // Always respond 200 to PhonePe
    res.json({ success: true, message: 'Webhook received and processed' });
  } catch (error: any) {
    console.error('[PhonePe Webhook] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PhonePe Sandbox Test Callback Endpoint (no auth required - sandbox only)
apiRouter.post('/phonepe/simulate-callback', async (req: AuthenticatedRequest, res) => {
  // Block in production - sandbox simulation only
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Simulated callbacks are disabled in production. Use real PhonePe gateway.' });
  }

  const { merchantTransactionId, status } = req.body;
  if (!merchantTransactionId || !status) {
    return res.status(400).json({ success: false, message: 'merchantTransactionId and status are required' });
  }
  if (!['SUCCESS', 'FAILED', 'PENDING'].includes(status)) {
    return res.status(400).json({ success: false, message: 'status must be SUCCESS, FAILED or PENDING' });
  }

  const providerRef = 'T2607' + Date.now().toString().slice(-8);
  const updatedOrder = await db.updateOrderPayment(merchantTransactionId, status, providerRef);

  if (!updatedOrder) {
    return res.status(404).json({ success: false, message: 'Order not found for transaction ID: ' + merchantTransactionId });
  }

  await db.addPaymentLog({
    merchantTransactionId,
    orderId: updatedOrder.id,
    amount: updatedOrder.grandTotal,
    status: status,
    checksum: 'SANDBOX_SIMULATED',
    payload: JSON.stringify({ simulated: true, status, providerRef })
  }).catch(() => {});

  res.json({
    success: true,
    message: `Sandbox: payment status set to ${status}`,
    orderId: updatedOrder.id,
    merchantTransactionId,
    providerRef,
    order: updatedOrder
  });
});

// Admin PhonePe Refund
apiRouter.post('/phonepe/refund', requireAdmin, async (req: AuthenticatedRequest, res) => {
  const { merchantTransactionId, amount } = req.body;
  const refundResult = await PhonePeService.initiateRefund(merchantTransactionId, Number(amount));
  res.json(refundResult);
});

// ================= ADMIN DASHBOARD & LOGS =================
apiRouter.get('/admin/dashboard', async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/admin/payment-logs', async (req: AuthenticatedRequest, res) => {
  try {
    const logs = await db.getPaymentLogs();
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Financial Expense & Profit Logs
apiRouter.get('/admin/finances', async (req: AuthenticatedRequest, res) => {
  try {
    const entries = await db.getFinancialEntries();
    res.json({ success: true, entries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/admin/finances', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const entry = await db.addFinancialEntry(req.body);
    res.status(201).json({ success: true, entry, message: 'Financial entry recorded successfully!' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.delete('/admin/finances/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const deleted = await db.deleteFinancialEntry(req.params.id);
    res.json({ success: true, deleted, message: 'Financial entry removed successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

const handleUpdateFinance = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const id = req.params?.id || req.body?.id;
    if (!id) return res.status(400).json({ success: false, message: 'ID required for finance entry update' });
    const updated = await db.updateFinancialEntry(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Financial entry not found' });
    }
    res.json({ success: true, entry: updated, message: 'Financial entry updated successfully!' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

apiRouter.put('/admin/finances/:id', requireAdmin, handleUpdateFinance);
apiRouter.post('/admin/finances/update', requireAdmin, handleUpdateFinance);
apiRouter.post('/admin/finances/:id/update', requireAdmin, handleUpdateFinance);


apiRouter.post('/admin/finances/delete', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const deleted = await db.deleteFinancialEntry(req.body.id);
    res.json({ success: true, deleted, message: 'Financial entry removed successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});



// ================= SITE SETTINGS =================
apiRouter.get('/settings', async (req, res) => {
  try {
    const settings = await db.getSettings();
    if (!settings) {
      return res.json({ success: true, settings: {} });
    }

    // Strip sensitive merchant salt keys and internal credentials from public view
    const { phonepeSaltKey, phonepeMerchantId, ...publicSettings } = settings as any;
    res.json({ success: true, settings: publicSettings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/admin/settings', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const settings = await db.getSettings();
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.put('/settings', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await db.updateSettings(req.body);
    res.json({ success: true, settings: updated, message: 'Settings updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================= EXPERT ADVICE CALLBACK & AI DOCTOR =================
apiRouter.post('/expert-callback', (req, res) => {
  const { name, phone, query } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  const callbackRequest = {
    id: 'cb-' + Date.now(),
    name: name || 'Valued Customer',
    phone,
    query: query || 'General Gardening / Rose Care Advice',
    status: 'PENDING',
    requestedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'Expert callback request registered successfully. Our nursery specialist (+91 72008 26129) will contact you shortly.',
    callback: callbackRequest
  });
});

apiRouter.post('/gemini/plant-doctor', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ success: false, message: 'Question is required' });
  }

  try {
    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are the chief botanical expert at Veerika Rose Garden nursery in Tamil Nadu, India.
Provide concise, practical, expert gardening and plant care advice in 2-3 short bullet points for this customer's question: "${question}".
Recommend organic Tamil Nadu nursery techniques (cow dung manure, neem cake powder, rose mix fertilizer, 6 hours direct sunlight, proper pot drainage).
Also mention our phone hotline +91 72008 26129 at the end.`
      });
      return res.json({ success: true, answer: response.text });
    }
  } catch (e: any) {
    console.warn('Gemini plant doctor fallback:', e.message);
  }

  return res.json({
    success: true,
    answer: `🌿 Veerika Rose Garden Care Advice:
• Sunlight & Soil: Ensure 5-6 hours of full direct morning sunlight. Use equal parts soil, dried cow dung manure, and coco peat for best root aeration.
• Organic Nutrition: Apply 2 tablespoons of organic Rose Mix Fertilizer or Neem Cake powder every 15 days around the root drip line.
• Pruning: Prune dead stems 45-degrees above an outward facing bud node to trigger new flower shoots.

Need personalized diagnosis? Call our nursery expert directly at +91 72008 26129!`
  });
});
